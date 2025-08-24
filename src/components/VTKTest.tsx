import { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

function VTKTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    if (!containerRef.current) {
      setStatus('Container not found');
      return;
    }

    try {
      setStatus('Creating test volume...');
      
      // Create a simple test volume (8x8x8 cube)
      const size = 8;
      const volumeData = new Float32Array(size * size * size);
      
      // Fill with a simple pattern
      for (let i = 0; i < volumeData.length; i++) {
        const x = i % size;
        const y = Math.floor(i / size) % size;
        const z = Math.floor(i / (size * size));
        volumeData[i] = (x + y + z) / (size * 3);
      }

      setStatus('Setting up VTK renderer...');
      
      // Initialize VTK.js renderer
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: [0.1, 0.1, 0.1],
      });

      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      setStatus('Creating image data...');
      
      // Create image data
      const imageData = vtkImageData.newInstance();
      imageData.setDimensions([size, size, size]);
      imageData.setSpacing([1, 1, 1]);
      imageData.setOrigin([0, 0, 0]);

      const dataArray = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: volumeData,
      });
      
      imageData.getPointData().setScalars(dataArray);

      setStatus('Setting up volume mapper...');
      
      // Create volume mapper
      const mapper = vtkVolumeMapper.newInstance();
      mapper.setInputData(imageData);
      mapper.setSampleDistance(0.4);
      mapper.setImageSampleDistance(0.4);

      // Create volume
      const volume = vtkVolume.newInstance();
      volume.setMapper(mapper);

      setStatus('Setting up transfer functions...');
      
      // Set up transfer functions
      const colorFunction = vtkColorTransferFunction.newInstance();
      const opacityFunction = vtkPiecewiseFunction.newInstance();

      colorFunction.addRGBPoint(0, 0.0, 0.0, 0.0);
      colorFunction.addRGBPoint(0.5, 0.5, 0.5, 0.5);
      colorFunction.addRGBPoint(1, 1.0, 1.0, 1.0);

      opacityFunction.addPoint(0, 0.0);
      opacityFunction.addPoint(0.5, 0.3);
      opacityFunction.addPoint(1, 1.0);

      volume.getProperty().setRGBTransferFunction(0, colorFunction);
      volume.getProperty().setScalarOpacity(0, opacityFunction);
      volume.getProperty().setInterpolationTypeToLinear();

      setStatus('Adding volume to renderer...');
      
      // Add volume to renderer
      renderer.addVolume(volume);
      renderer.resetCamera();
      renderWindow.render();

      setStatus('✅ VTK.js test successful!');
      
      console.log('VTKTest: Successfully rendered test volume');

    } catch (error) {
      console.error('VTKTest: Error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        {status}
      </div>
    </div>
  );
}

export default VTKTest;
