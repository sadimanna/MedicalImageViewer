import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useViewerStore } from '../store/viewerStore';

interface Renderer2DProps {
  width?: number;
  height?: number;
}

// Ensure getLabelColor is defined at the top level, before any usage
function getLabelColor(label: number): [number, number, number] {
  const palette: [number, number, number][] = [
    [230, 25, 75],    // Red
    [60, 180, 75],    // Green
    [255, 225, 25],   // Yellow
    [0, 130, 200],    // Blue
    [245, 130, 48],   // Orange
    [145, 30, 180],   // Purple
    [70, 240, 240],   // Cyan
    [240, 50, 230],   // Magenta
    [210, 245, 60],   // Lime
    [250, 190, 190],  // Pink
    [0, 128, 128],    // Teal
    [230, 190, 255],  // Lavender
    [170, 110, 40],   // Brown
    [255, 250, 200],  // Beige
    [128, 0, 0],      // Maroon
    [170, 255, 195],  // Mint
    [128, 128, 0],    // Olive
    [255, 215, 180],  // Apricot
    [0, 0, 128],      // Navy
    [255, 105, 180],  // Hot Pink
  ];
  if (label <= 0) return [0, 0, 0];
  return palette[(label - 1) % palette.length];
}

export const Renderer2D: React.FC<Renderer2DProps> = ({ width: propWidth, height: propHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  
  const {
    imageFile,
    maskFile,
    currentSlice,
    imageWindowLevel,
    maskWindowLevel,
    zoom,
    pan,
    flipHorizontal2D,
    flipVertical2D,
    setFlipHorizontal2D,
    setFlipVertical2D
  } = useViewerStore();

  // Update canvas size based on container and image dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && imageFile) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width - 20; // Account for padding
        const containerHeight = rect.height - 20;
        
        // Get image dimensions
        const imageWidth = imageFile.data.dimensions[0];
        const imageHeight = imageFile.data.dimensions[1];
        
        // Calculate optimal size based on image dimensions
        let optimalWidth = imageWidth;
        let optimalHeight = imageHeight;
        
        // If image is larger than container, scale it down
        if (optimalWidth > containerWidth || optimalHeight > containerHeight) {
          const scaleX = containerWidth / optimalWidth;
          const scaleY = containerHeight / optimalHeight;
          const scale = Math.min(scaleX, scaleY);
          optimalWidth = Math.floor(optimalWidth * scale);
          optimalHeight = Math.floor(optimalHeight * scale);
        }
        
        // Ensure minimum size of 512x512
        const finalWidth = Math.max(512, optimalWidth);
        const finalHeight = Math.max(512, optimalHeight);
        
        // If the calculated size exceeds container, scale down while maintaining minimum
        if (finalWidth > containerWidth || finalHeight > containerHeight) {
          const scaleX = containerWidth / finalWidth;
          const scaleY = containerHeight / finalHeight;
          const scale = Math.min(scaleX, scaleY);
          const scaledWidth = Math.floor(finalWidth * scale);
          const scaledHeight = Math.floor(finalHeight * scale);
          
          // Ensure we don't go below 512x512
          setCanvasSize({
            width: Math.max(512, scaledWidth),
            height: Math.max(512, scaledHeight)
          });
        } else {
          setCanvasSize({
            width: finalWidth,
            height: finalHeight
          });
        }
      } else if (containerRef.current) {
        // No image loaded, use default 512x512
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width - 20;
        const containerHeight = rect.height - 20;
        
        const targetSize = Math.min(512, containerWidth, containerHeight);
        setCanvasSize({ width: targetSize, height: targetSize });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [imageFile, propWidth, propHeight]);

  const applyWindowLevel = useCallback((pixelValue: number, _min: number, _max: number, windowLevel: { center: number; width: number }): number => {
    const { center, width: wl } = windowLevel;
    const windowMin = center - wl / 2;
    const windowMax = center + wl / 2;
    
    // Clamp the pixel value to the window range
    if (pixelValue <= windowMin) return 0;
    if (pixelValue >= windowMax) return 255;
    
    // Linear mapping from window range to 0-255
    return Math.round(((pixelValue - windowMin) / (windowMax - windowMin)) * 255);
  }, []);

  // Update extractSlice type signature to accept any TypedArray
  const extractSlice = useCallback((
    data: Float32Array | Uint8Array | Uint16Array | Int16Array | Int32Array | Float64Array,
    dimensions: [number, number, number],
    sliceIndex: number,
    windowLevel: { center: number; width: number }
  ): { sliceData: any; min: number; max: number } => {
    const [width, height] = dimensions;
    const sliceSize = width * height;
    const startIndex = sliceIndex * sliceSize;
    const sliceData = new Uint8Array(sliceSize);
    let min = Infinity;
    let max = -Infinity;
    // First pass: find min/max values
    for (let i = 0; i < sliceSize; i++) {
      const sourceIndex = startIndex + i;
      if (sourceIndex < data.length) {
        const value = data[sourceIndex];
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    // Second pass: normalize to 0-255
    for (let i = 0; i < sliceSize; i++) {
      const sourceIndex = startIndex + i;
      if (sourceIndex < data.length) {
        const value = data[sourceIndex];
        const norm = (max > min) ? Math.round(((value - min) / (max - min)) * 255) : 0;
        sliceData[i] = norm;
      }
    }
    return { sliceData, min, max };
  }, []);

  const renderSlice = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) {
      console.debug('renderSlice: No canvas or imageFile', { canvas, imageFile });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.debug('renderSlice: No 2d context');
      return;
    }

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const imageWidth = imageFile.data.dimensions[0];
    const imageHeight = imageFile.data.dimensions[1];
    console.debug('renderSlice: imageWidth, imageHeight', imageWidth, imageHeight);
    console.debug('renderSlice: pixelData length', imageFile.data.pixelData?.length);

    // Create an off-screen canvas for the image slice
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = imageWidth;
    imageCanvas.height = imageHeight;
    const imageCtx = imageCanvas.getContext('2d');
    if (!imageCtx) return;

    if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
      console.error('Invalid image dimensions for createImageData:', { imageWidth, imageHeight, dimensions: imageFile.data.dimensions });
      return;
    }
    const imageData = imageCtx.createImageData(imageWidth, imageHeight);

    const { sliceData } = extractSlice(
      imageFile.data.pixelData as any,
      imageFile.data.dimensions,
      currentSlice,
      imageWindowLevel
    );

    for (let i = 0; i < sliceData.length; i++) {
      const pixelIndex = i * 4;
      const value = sliceData[i];
      imageData.data[pixelIndex] = value;     // R
      imageData.data[pixelIndex + 1] = value; // G
      imageData.data[pixelIndex + 2] = value; // B
      imageData.data[pixelIndex + 3] = 255;   // A
    }
    imageCtx.putImageData(imageData, 0, 0);

    // Create an off-screen canvas for the mask slice
    let maskCanvas: HTMLCanvasElement | null = null;
    if (maskFile && maskFile.data.dimensions[2] > currentSlice) {
      maskCanvas = document.createElement('canvas');
      maskCanvas.width = imageWidth;
      maskCanvas.height = imageHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        const maskResult = extractSlice(
          maskFile.data.pixelData as any,
          maskFile.data.dimensions,
          currentSlice,
          maskWindowLevel
        );
        const maskImageData = maskCtx.createImageData(imageWidth, imageHeight);
        let maskSliceData: Uint8Array;
        if (maskResult.sliceData instanceof Uint8Array) {
          maskSliceData = maskResult.sliceData;
        } else if (Array.isArray(maskResult.sliceData) || (maskResult.sliceData && typeof maskResult.sliceData.length === 'number')) {
          maskSliceData = new Uint8Array(maskResult.sliceData.length);
          for (let i = 0; i < maskResult.sliceData.length; i++) {
            maskSliceData[i] = maskResult.sliceData[i];
          }
        } else {
          maskSliceData = new Uint8Array(0);
        }
        for (let i = 0; i < maskSliceData.length; i++) {
          const pixelIndex = i * 4;
          const label = maskSliceData[i];
          if (label > 0) {
            const [r, g, b] = getLabelColor(label);
            maskImageData.data[pixelIndex] = r;
            maskImageData.data[pixelIndex + 1] = g;
            maskImageData.data[pixelIndex + 2] = b;
            maskImageData.data[pixelIndex + 3] = 102;
          }
        }
        maskCtx.putImageData(maskImageData, 0, 0);
      }
    }

    // Now, apply transformations and draw to the visible canvas
    ctx.save();
    ctx.imageSmoothingEnabled = false; // Use nearest-neighbor for sharp pixels

    const scaleX = canvasSize.width / imageWidth;
    const scaleY = canvasSize.height / imageHeight;
    const scale = Math.min(scaleX, scaleY) * zoom;
    
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    const offsetX = (canvasSize.width - scaledWidth) / 2 + pan.x;
    const offsetY = (canvasSize.height - scaledHeight) / 2 + pan.y;

    // Flipping logic (corrected)
    let flipX = flipHorizontal2D ? -1 : 1;
    let flipY = flipVertical2D ? -1 : 1;
    ctx.translate(offsetX, offsetY);
    if (flipX === -1) ctx.translate(scaledWidth, 0);
    if (flipY === -1) ctx.translate(0, scaledHeight);
    ctx.scale(flipX * scale, flipY * scale);

    // Draw the image from its off-screen canvas
    ctx.drawImage(imageCanvas, 0, 0);
    if (maskCanvas) {
      ctx.drawImage(maskCanvas, 0, 0);
    }
    ctx.restore();
  }, [imageFile, maskFile, currentSlice, imageWindowLevel, maskWindowLevel, zoom, pan, canvasSize, extractSlice, flipHorizontal2D, flipVertical2D]);

  // Handle mouse interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let lastX = e.clientX;
    let lastY = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        useViewerStore.getState().setPan(
          useViewerStore.getState().pan.x + deltaX,
          useViewerStore.getState().pan.y + deltaY
        );
        
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging = true;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Render when dependencies change
  useEffect(() => {
    console.debug('Renderer2D: imageFile', imageFile);
    console.debug('Renderer2D: maskFile', maskFile);
    console.debug('Renderer2D: currentSlice', currentSlice);
    console.debug('Renderer2D: imageWindowLevel', imageWindowLevel);
    console.debug('Renderer2D: maskWindowLevel', maskWindowLevel);
    console.debug('Renderer2D: zoom', zoom);
    console.debug('Renderer2D: pan', pan);
    console.debug('Renderer2D: canvasSize', canvasSize);
    renderSlice();
  }, [renderSlice]);

  if (!imageFile) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}
      >
        <p style={{ color: '#666', fontSize: '16px' }}>
          Load an image file to start viewing
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexDirection: 'column' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ border: '1px solid #ccc', cursor: 'grab', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        onMouseDown={handleMouseDown}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <button onClick={() => setFlipVertical2D(!flipVertical2D)} title="Flip Vertically" style={{ margin: '0 4px' }}>↑</button>
        <button onClick={() => setFlipHorizontal2D(!flipHorizontal2D)} title="Flip Horizontally" style={{ margin: '0 4px' }}>←</button>
        <button onClick={() => setFlipHorizontal2D(!flipHorizontal2D)} title="Flip Horizontally" style={{ margin: '0 4px' }}>→</button>
        <button onClick={() => setFlipVertical2D(!flipVertical2D)} title="Flip Vertically" style={{ margin: '0 4px' }}>↓</button>
      </div>
    </div>
  );
}; 

export { getLabelColor }; 