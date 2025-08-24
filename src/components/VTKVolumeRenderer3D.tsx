import { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

interface VTKVolumeRenderer3DProps {
  volumeArray: Float32Array | Uint8Array | Uint16Array | Int16Array | Int32Array | Float64Array;
  dimensions: [number, number, number];
  spacing?: [number, number, number];
  origin?: [number, number, number];
  showControls?: boolean;
  backgroundColor?: [number, number, number];
}

function VTKVolumeRenderer3D({ 
  volumeArray, 
  dimensions, 
  spacing = [1, 1, 1], 
  origin = [0, 0, 0],
  showControls = false,
  backgroundColor = [0.1, 0.1, 0.1]
}: VTKVolumeRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volumeInfo, setVolumeInfo] = useState<{
    min: number;
    max: number;
    dimensions: [number, number, number];
    voxelCount: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !volumeArray || dimensions.length !== 3) {
      setError('Missing required props');
      setIsLoading(false);
      return;
    }

    // Validate dimensions
    const [width, height, depth] = dimensions;
    if (width <= 0 || height <= 0 || depth <= 0) {
      setError(`Invalid dimensions - all must be > 0: ${width}×${height}×${depth}`);
      setIsLoading(false);
      return;
    }

          // Validate array length matches dimensions
      const expectedLength = width * height * depth;
      if (volumeArray.length !== expectedLength) {
        setError(`Array length (${volumeArray.length}) doesn't match dimensions (${expectedLength})`);
        setIsLoading(false);
        return;
      }
      
      // Validate volume data format
      const isValidType = volumeArray instanceof Float32Array || 
                         volumeArray instanceof Uint8Array || 
                         volumeArray instanceof Uint16Array || 
                         volumeArray instanceof Int16Array || 
                         volumeArray instanceof Int32Array || 
                         volumeArray instanceof Float64Array;
      
      if (!isValidType) {
        setError(`Unsupported volume data type: ${(volumeArray as any).constructor.name}`);
        setIsLoading(false);
        return;
      }
      
      // Check for NaN or infinite values
      for (let i = 0; i < Math.min(volumeArray.length, 1000); i++) {
        if (isNaN(volumeArray[i]) || !isFinite(volumeArray[i])) {
          setError(`Invalid data value at index ${i}: ${volumeArray[i]}`);
          setIsLoading(false);
          return;
        }
      }

    const cleanup = () => {
      if (contextRef.current) {
        const { fullScreenRenderer, volume, mapper, imageData } = contextRef.current;
        if (volume) volume.delete();
        if (mapper) mapper.delete();
        if (imageData) imageData.delete();
        if (fullScreenRenderer) fullScreenRenderer.delete();
        contextRef.current = null;
      }
    };

    try {
      setIsLoading(true);
      setError(null);

      // Check if VTK.js is available
      if (typeof vtkFullScreenRenderWindow === 'undefined') {
        throw new Error('VTK.js is not loaded. Please check your imports.');
      }

      // Initialize VTK.js renderer
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: backgroundColor,
      });

      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      // Set up camera controls
      const interactor = renderWindow.getInteractor();
      const style = vtkInteractorStyleTrackballCamera.newInstance();
      interactor.setInteractorStyle(style);

      // Create image data from volume array
      const imageData = vtkImageData.newInstance();
      imageData.setDimensions(dimensions);
      imageData.setSpacing(spacing);
      imageData.setOrigin(origin);

      // Create data array
      const dataArray = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: volumeArray,
      });
      
      if (!dataArray || dataArray.getNumberOfValues() === 0) {
        throw new Error('Failed to create valid data array');
      }
      
      // Validate data array
      const numValues = dataArray.getNumberOfValues();
      if (numValues !== volumeArray.length) {
        throw new Error(`Data array mismatch: expected ${volumeArray.length}, got ${numValues}`);
      }
      
      imageData.getPointData().setScalars(dataArray);
      
      // Validate image data
      const imageDataDimensions = imageData.getDimensions();
      if (!imageDataDimensions || imageDataDimensions.length !== 3) {
        throw new Error('Invalid image data dimensions');
      }
      
      console.log('VTKVolumeRenderer3D: Image data created successfully:', {
        dimensions: imageDataDimensions,
        spacing: imageData.getSpacing(),
        origin: imageData.getOrigin(),
        scalarDataLength: dataArray.getNumberOfValues()
      });

      // Create volume mapper
      const mapper = vtkVolumeMapper.newInstance();
      mapper.setInputData(imageData);
      
      // Configure mapper for optimal performance
      mapper.setSampleDistance(0.4);
      mapper.setImageSampleDistance(0.4);
      
      // Validate mapper
      const mapperInput = mapper.getInputData();
      if (!mapperInput) {
        throw new Error('Failed to set input data on volume mapper');
      }
      
      console.log('VTKVolumeRenderer3D: Volume mapper created successfully');

      // Create volume
      const volume = vtkVolume.newInstance();
      volume.setMapper(mapper);

      // Calculate data range
      let min = volumeArray[0];
      let max = volumeArray[0];
      for (let i = 1; i < volumeArray.length; i++) {
        if (volumeArray[i] < min) min = volumeArray[i];
        if (volumeArray[i] > max) max = volumeArray[i];
      }

      // Set up transfer functions
      const colorFunction = vtkColorTransferFunction.newInstance();
      const opacityFunction = vtkPiecewiseFunction.newInstance();

      // Create a more sophisticated transfer function
      const range = max - min;
      const midPoint = min + range * 0.5;
      
      // Color transfer function (grayscale to color)
      colorFunction.addRGBPoint(min, 0.0, 0.0, 0.0);
      colorFunction.addRGBPoint(min + range * 0.25, 0.2, 0.2, 0.2);
      colorFunction.addRGBPoint(midPoint, 0.5, 0.5, 0.5);
      colorFunction.addRGBPoint(min + range * 0.75, 0.8, 0.8, 0.8);
      colorFunction.addRGBPoint(max, 1.0, 1.0, 1.0);

      // Opacity transfer function (window/level style)
      opacityFunction.addPoint(min, 0.0);
      opacityFunction.addPoint(min + range * 0.1, 0.1);
      opacityFunction.addPoint(midPoint, 0.3);
      opacityFunction.addPoint(min + range * 0.8, 0.6);
      opacityFunction.addPoint(max, 1.0);

      // Apply transfer functions to volume
      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacity(0, opacityFunction);
      volume.getProperty().setInterpolationTypeToLinear();
      volume.getProperty().setShade(true);
      volume.getProperty().setAmbient(0.4);
      volume.getProperty().setDiffuse(0.6);
      volume.getProperty().setSpecular(0.2);

      // Add volume to renderer
      renderer.addVolume(volume);
      renderer.resetCamera();
      renderWindow.render();

      // Store context for cleanup
      contextRef.current = {
        fullScreenRenderer,
        volume,
        mapper,
        imageData,
        dataArray,
        colorFunction,
        opacityFunction,
        renderer,
        renderWindow,
      };

      // Set volume info
      setVolumeInfo({
        min,
        max,
        dimensions,
        voxelCount: volumeArray.length
      });

      setIsLoading(false);
      console.log('VTKVolumeRenderer3D: Volume rendering completed successfully');

    } catch (error) {
      console.error('VTKVolumeRenderer3D: Error initializing volume renderer:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsLoading(false);
      cleanup();
    }

    return cleanup;
  }, [volumeArray, dimensions, spacing, origin, backgroundColor]);

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#d32f2f',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h3>❌ VTK.js Rendering Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#666'
      }}>
        <div>
          <h3>🔄 Loading Volume...</h3>
          <p>Initializing VTK.js renderer</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {showControls && volumeInfo && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Volume Info:</strong></div>
          <div>Dimensions: {volumeInfo.dimensions.join('×')}</div>
          <div>Voxels: {volumeInfo.voxelCount.toLocaleString()}</div>
          <div>Range: {volumeInfo.min.toFixed(2)} - {volumeInfo.max.toFixed(2)}</div>
          <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.8 }}>
            Mouse: Rotate | Scroll: Zoom | Right-click: Pan
          </div>
        </div>
      )}
    </div>
  );
}

export default VTKVolumeRenderer3D;
