import React, { useState, useCallback } from 'react';
import MedicalVolumeViewer from '../components/MedicalVolumeViewer';
import { useVolumeRenderer, type VolumeData } from '../hooks/useVolumeRenderer';

// Example: How to use VTK.js volume rendering in your medical viewer app

function VolumeRenderingExample() {
  const [currentVolume, setCurrentVolume] = useState<VolumeData | null>(null);
  const [volumeHistory, setVolumeHistory] = useState<VolumeData[]>([]);

  // Example: Generate different test volumes
  const generateTestVolume = useCallback((type: 'sphere' | 'cube' | 'cylinder') => {
    const size = 64;
    const dimensions: [number, number, number] = [size, size, size];
    const volumeArray = new Float32Array(size * size * size);
    
    const center = size / 2;
    
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = z * size * size + y * size + x;
          let value = 0;
          
          switch (type) {
            case 'sphere':
              const distance = Math.sqrt(
                Math.pow(x - center, 2) + 
                Math.pow(y - center, 2) + 
                Math.pow(z - center, 2)
              );
              const radius = size / 4;
              value = distance < radius ? 1.0 - (distance / radius) : 0.0;
              break;
              
            case 'cube':
              const halfSize = size / 4;
              value = (x >= center - halfSize && x <= center + halfSize &&
                      y >= center - halfSize && y <= center + halfSize &&
                      z >= center - halfSize && z <= center + halfSize) ? 1.0 : 0.0;
              break;
              
            case 'cylinder':
              const radius2D = size / 6;
              const height = size / 3;
              const distance2D = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
              value = (distance2D < radius2D && 
                      z >= center - height/2 && z <= center + height/2) ? 1.0 : 0.0;
              break;
          }
          
          volumeArray[index] = value;
        }
      }
    }
    
    const volumeData: VolumeData = {
      volumeArray,
      dimensions,
      spacing: [1, 1, 1],
      origin: [0, 0, 0]
    };
    
    setCurrentVolume(volumeData);
    setVolumeHistory(prev => [...prev, volumeData]);
    
    console.log(`Generated ${type} volume:`, {
      dimensions,
      voxelCount: volumeArray.length,
      min: Math.min(...volumeArray),
      max: Math.max(...volumeArray)
    });
  }, []);

  const handleVolumeLoad = useCallback((volumeInfo: any) => {
    console.log('Volume loaded successfully:', volumeInfo);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Volume rendering error:', error);
  }, []);

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Medical Volume Viewer - VTK.js Integration</h1>
        <p>This example demonstrates how to use VTK.js for raw volume data rendering in a medical viewer application.</p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => generateTestVolume('sphere')}
            style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Load Sphere Volume
          </button>
          <button 
            onClick={() => generateTestVolume('cube')}
            style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Load Cube Volume
          </button>
          <button 
            onClick={() => generateTestVolume('cylinder')}
            style={{ padding: '10px 15px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Load Cylinder Volume
          </button>
        </div>
        
        {volumeHistory.length > 0 && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Volume History:</strong> {volumeHistory.length} volumes loaded
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '5px' }}>
        <MedicalVolumeViewer
          initialVolumeData={currentVolume}
          showAdvancedControls={true}
          onVolumeLoad={handleVolumeLoad}
          onError={handleError}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li><strong>VTK.js Volume Rendering:</strong> High-performance 3D volume visualization</li>
          <li><strong>Interactive Controls:</strong> Mouse rotation, zoom, and pan</li>
          <li><strong>Transfer Functions:</strong> Automatic color and opacity mapping</li>
          <li><strong>Volume Statistics:</strong> Real-time data range and memory usage</li>
          <li><strong>Error Handling:</strong> Comprehensive validation and error reporting</li>
          <li><strong>Performance:</strong> Optimized for large medical volumes</li>
        </ul>
        
        <h3>Usage in Your App:</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '3px', fontSize: '12px' }}>
{`// Import the components
import MedicalVolumeViewer from './components/MedicalVolumeViewer';
import { useVolumeRenderer } from './hooks/useVolumeRenderer';

// Use in your component
function MyMedicalApp() {
  const volumeData = {
    volumeArray: yourVolumeArray,
    dimensions: [width, height, depth],
    spacing: [1, 1, 1],
    origin: [0, 0, 0]
  };

  return (
    <MedicalVolumeViewer
      initialVolumeData={volumeData}
      showAdvancedControls={true}
      onVolumeLoad={(info) => console.log('Volume loaded:', info)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}

export default VolumeRenderingExample;
