import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { getLabelColor } from './Renderer2D';

interface MPRViewerProps {}

export const MPRViewer: React.FC<MPRViewerProps> = () => {
  const axialCanvasRef = useRef<HTMLCanvasElement>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement>(null);
  const coronalCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    imageFile,
    maskFile,
    imageWindowLevel,
    maskWindowLevel,
  } = useViewerStore();

  // Independent slice indices for each plane
  const [axialSlice, setAxialSlice] = useState(0);
  const [sagittalSlice, setSagittalSlice] = useState(0);
  const [coronalSlice, setCoronalSlice] = useState(0);

  useEffect(() => {
    if (!imageFile) return;
    const [width, height, depth] = imageFile.data.dimensions;
    setAxialSlice(Math.floor(depth / 2));
    setSagittalSlice(Math.floor(width / 2));
    setCoronalSlice(Math.floor(height / 2));
  }, [imageFile]);

  const applyWindowLevel = useCallback((pixelValue: number, min: number, max: number, windowLevel: { center: number; width: number }): number => {
    if (max === min) return pixelValue > 0 ? 255 : 0;
    const { center, width } = windowLevel;
    const lower = center - width / 2;
    const upper = center + width / 2;
    let rescaled = (pixelValue - lower) / (upper - lower) * 255;
    rescaled = Math.max(0, Math.min(255, rescaled));
    return rescaled;
  }, []);

  const extractSlice = useCallback((
    data: Float32Array | Uint8Array | Uint16Array, 
    dims: [number, number, number], 
    sliceIndex: number, 
    orientation: 'axial' | 'sagittal' | 'coronal'
  ) => {
    const [width, height, depth] = dims;
    let sliceData: Float32Array;
    let sliceWidth: number, sliceHeight: number;
    switch (orientation) {
      case 'axial': {
        sliceWidth = width;
        sliceHeight = height;
        sliceData = new Float32Array(sliceWidth * sliceHeight);
        const z = Math.max(0, Math.min(depth - 1, sliceIndex));
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            sliceData[y * width + x] = data[z * width * height + y * width + x];
          }
        }
        break;
      }
      case 'sagittal': {
        sliceWidth = height;
        sliceHeight = depth;
        sliceData = new Float32Array(sliceWidth * sliceHeight);
        const x = Math.max(0, Math.min(width - 1, sliceIndex));
        for (let z = 0; z < depth; z++) {
          for (let y = 0; y < height; y++) {
            sliceData[z * height + y] = data[z * width * height + y * width + x];
          }
        }
        break;
      }
      case 'coronal': {
        sliceWidth = width;
        sliceHeight = depth;
        sliceData = new Float32Array(sliceWidth * sliceHeight);
        const y = Math.max(0, Math.min(height - 1, sliceIndex));
        for (let z = 0; z < depth; z++) {
          for (let x = 0; x < width; x++) {
            sliceData[z * width + x] = data[z * width * height + y * width + x];
          }
        }
        break;
      }
    }
    return { sliceData, sliceWidth, sliceHeight };
  }, []);

  const renderView = useCallback((
    canvas: HTMLCanvasElement, 
    orientation: 'axial' | 'sagittal' | 'coronal',
    sliceIndex: number
  ) => {
    if (!imageFile) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const { sliceData, sliceWidth, sliceHeight } = extractSlice(
      imageFile.data.pixelData, imageFile.data.dimensions, sliceIndex, orientation
    );
    let min = Infinity, max = -Infinity;
    for (const v of sliceData) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    console.log(`[${orientation}] Raw slice data - min: ${min}, max: ${max}`);
    console.log(`[${orientation}] Window/Level - center: ${imageWindowLevel.center}, width: ${imageWindowLevel.width}`);
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = sliceWidth;
    offscreenCanvas.height = sliceHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    const imageData = offscreenCtx.createImageData(sliceWidth, sliceHeight);
    for (let i = 0; i < sliceData.length; i++) {
      // Normalize to 0-255
      const norm = (max > min) ? Math.round(((sliceData[i] - min) / (max - min)) * 255) : 0;
      imageData.data[i * 4] = norm;
      imageData.data[i * 4 + 1] = norm;
      imageData.data[i * 4 + 2] = norm;
      imageData.data[i * 4 + 3] = 255;
    }
    offscreenCtx.putImageData(imageData, 0, 0);
    const scaleWidthBase = canvas.width / sliceWidth;
    const scaleHeightBase = canvas.height / sliceHeight;
    const scaledWidth = sliceWidth * scaleWidthBase;
    let scaledHeight;
    if (orientation === 'sagittal' || orientation === 'coronal') {
      if (sliceHeight < canvas.height) {
        scaledHeight = sliceHeight * Math.floor(scaleHeightBase);
      } else {
        scaledHeight = sliceHeight * scaleHeightBase;
      }
    } else {
      scaledHeight = sliceHeight * scaleHeightBase;
    }
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreenCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    if (maskFile) {
        const { sliceData: maskSliceData } = extractSlice(
            maskFile.data.pixelData, maskFile.data.dimensions, sliceIndex, orientation
        );
        const maskOffscreenCanvas = document.createElement('canvas');
        maskOffscreenCanvas.width = sliceWidth;
        maskOffscreenCanvas.height = sliceHeight;
        const maskCtx = maskOffscreenCanvas.getContext('2d');
        if (maskCtx) {
            const maskImageData = maskCtx.createImageData(sliceWidth, sliceHeight);
            let maskSliceDataUint8: Uint8Array;
            if (maskSliceData instanceof Uint8Array) {
              maskSliceDataUint8 = maskSliceData;
            } else {
              maskSliceDataUint8 = new Uint8Array(maskSliceData.length);
              for (let i = 0; i < maskSliceData.length; i++) {
                maskSliceDataUint8[i] = maskSliceData[i];
              }
            }
            for (let i = 0; i < maskSliceDataUint8.length; i++) {
              const label = maskSliceDataUint8[i];
              if (label > 0) {
                const [r, g, b] = getLabelColor(label);
                maskImageData.data[i * 4] = r;
                maskImageData.data[i * 4 + 1] = g;
                maskImageData.data[i * 4 + 2] = b;
                maskImageData.data[i * 4 + 3] = 102; // 40% opacity
              }
            }
            maskCtx.putImageData(maskImageData, 0, 0);
            ctx.drawImage(maskOffscreenCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
        }
    }
  }, [imageFile, maskFile, imageWindowLevel, maskWindowLevel, applyWindowLevel, extractSlice]);

  useEffect(() => {
    if (!imageFile) return;
    const [width, height, depth] = imageFile.data.dimensions;
    console.debug('Image dimensions:', { width, height, depth });
    if (axialCanvasRef.current) renderView(axialCanvasRef.current, 'axial', axialSlice);
    if (sagittalCanvasRef.current) renderView(sagittalCanvasRef.current, 'sagittal', sagittalSlice);
    if (coronalCanvasRef.current) renderView(coronalCanvasRef.current, 'coronal', coronalSlice);
  }, [imageFile, axialSlice, sagittalSlice, coronalSlice, renderView]);

  if (!imageFile) {
    return (
      <div style={{ width: '100%', height: '100%', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Load a NIfTI file to see MPR views
        </p>
      </div>
    );
  }

  const [width, height, depth] = imageFile.data.dimensions;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mpr-grid">
        <div className="mpr-view">
          <h4>Axial</h4>
          <canvas ref={axialCanvasRef} width={256} height={256} style={{ border: '1px solid #e0e0e0', borderRadius: '2px' }} />
          <input type="range" min={0} max={depth - 1} value={axialSlice} onChange={e => setAxialSlice(Number(e.target.value))} />
          <div style={{ fontSize: '0.7rem', textAlign: 'center' }}>Slice {axialSlice + 1} / {depth}</div>
        </div>
        <div className="mpr-view">
          <h4>Sagittal</h4>
          <canvas ref={sagittalCanvasRef} width={256} height={256} style={{ border: '1px solid #e0e0e0', borderRadius: '2px' }} />
          <input type="range" min={0} max={width - 1} value={sagittalSlice} onChange={e => setSagittalSlice(Number(e.target.value))} />
          <div style={{ fontSize: '0.7rem', textAlign: 'center' }}>Slice {sagittalSlice + 1} / {width}</div>
        </div>
        <div className="mpr-view">
          <h4>Coronal</h4>
          <canvas ref={coronalCanvasRef} width={256} height={256} style={{ border: '1px solid #e0e0e0', borderRadius: '2px' }} />
          <input type="range" min={0} max={height - 1} value={coronalSlice} onChange={e => setCoronalSlice(Number(e.target.value))} />
          <div style={{ fontSize: '0.7rem', textAlign: 'center' }}>Slice {coronalSlice + 1} / {height}</div>
        </div>
        <div className="mpr-view">
          <h4>3D</h4>
          <div style={{ width: '256px', height: '256px', border: '1px solid #e0e0e0', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
              3D View<br/>Coming Soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 