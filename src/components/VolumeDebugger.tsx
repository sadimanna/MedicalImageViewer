import { useState } from 'react';
import VTKVolumeRenderer3D from './VTKVolumeRenderer3D';
import MedicalVolumeViewer from './MedicalVolumeViewer';

function VolumeDebugger() {
  const [testData, setTestData] = useState<{
    volumeArray: Float32Array;
    dimensions: [number, number, number];
  } | null>(null);

  const generateTestVolume = () => {
    // Create a simple test volume: 64x64x64 with a sphere in the center
    const size = 64;
    const dimensions: [number, number, number] = [size, size, size];
    const volumeArray = new Float32Array(size * size * size);
    
    const center = size / 2;
    const radius = size / 4;
    
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = z * size * size + y * size + x;
          const distance = Math.sqrt(
            Math.pow(x - center, 2) + 
            Math.pow(y - center, 2) + 
            Math.pow(z - center, 2)
          );
          
          if (distance < radius) {
            volumeArray[index] = 1.0 - (distance / radius);
          } else {
            volumeArray[index] = 0.0;
          }
        }
      }
    }
    
    setTestData({ volumeArray, dimensions });
    console.log('Generated test volume:', {
      dimensions,
      arrayLength: volumeArray.length,
      expectedLength: size * size * size,
      min: Math.min(...volumeArray),
      max: Math.max(...volumeArray)
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Volume Renderer Debugger</h2>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '5px', 
        marginBottom: '20px',
        color: '#856404'
      }}>
        <strong>Note:</strong> Cornerstone3D requires proper medical image formats (DICOM/NIFTI) and cannot render raw volume arrays. 
        This debugger now shows only VTK.js renderers, which are the recommended solution for raw volume data.
      </div>
      
      <button 
        onClick={generateTestVolume}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🧪 Generate Test Volume (64×64×64 Sphere)
      </button>
      
      {testData && (
        <div>
          <h3>Test Volume Info:</h3>
          <pre>
            {JSON.stringify({
              dimensions: testData.dimensions,
              arrayLength: testData.volumeArray.length,
              expectedLength: testData.dimensions[0] * testData.dimensions[1] * testData.dimensions[2],
              min: Math.min(...testData.volumeArray),
              max: Math.max(...testData.volumeArray),
              sampleValues: Array.from(testData.volumeArray.slice(0, 10))
            }, null, 2)}
          </pre>
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
              <h4>Medical Volume Viewer (VTK.js - Full Featured)</h4>
              <div style={{ height: '400px', border: '1px solid #ddd' }}>
                <MedicalVolumeViewer 
                  initialVolumeData={testData}
                  showAdvancedControls={true}
                  onVolumeLoad={(info) => console.log('Volume loaded:', info)}
                  onError={(error) => console.error('Volume error:', error)}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
              <h4>Basic VTK.js Renderer</h4>
              <div style={{ height: '400px', border: '1px solid #ddd' }}>
                <VTKVolumeRenderer3D 
                  volumeArray={testData.volumeArray} 
                  dimensions={testData.dimensions} 
                  showControls={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolumeDebugger;
