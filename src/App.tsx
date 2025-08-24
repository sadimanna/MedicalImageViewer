import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';
import VTKVolumeRenderer3D from './components/VTKVolumeRenderer3D';
import VTKTest from './components/VTKTest';

function App() {
  // Use local state instead of Zustand store to avoid hook issues
  const [viewMode, setViewMode] = useState<'2D' | 'MPR' | '3D'>('3D');
  const [imageFile, setImageFile] = useState<any>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Medical Image Viewer</h1>
        <p>A browser-based viewer for medical images and segmentation masks</p>
      </header>

      <main className="app-main">
        <div className="file-upload-section">
          <div className="upload-column">
            <h3>Image File</h3>
            <div style={{ 
              padding: '20px', 
              border: '2px dashed #ccc', 
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9'
            }}>
              <p>File upload functionality will be restored once VTK.js is working</p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Currently testing VTK.js volume rendering
              </p>
            </div>
          </div>
          <div className="upload-column">
            <h3>Mask File (Optional)</h3>
            <div style={{ 
              padding: '20px', 
              border: '2px dashed #ccc', 
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9'
            }}>
              <p>File upload functionality will be restored once VTK.js is working</p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Currently testing VTK.js volume rendering
              </p>
            </div>
          </div>
        </div>



        <div className="viewer-section">
          <div className="viewer-container">
            {viewMode === '2D' && <div style={{ padding: '20px', textAlign: 'center' }}>2D Viewer - Coming Soon</div>}
            {viewMode === 'MPR' && <div style={{ padding: '20px', textAlign: 'center' }}>MPR Viewer - Coming Soon</div>}
            {viewMode === '3D' && imageFile && <VTKVolumeRenderer3D volumeArray={imageFile.data.pixelData} dimensions={imageFile.data.dimensions} showControls={true} />}
            {viewMode === '3D' && !imageFile && <VTKTest />}
          </div>
          <div className="controls-sidebar">
            <div style={{ padding: '20px' }}>
              <h3>View Mode</h3>
              <button 
                onClick={() => setViewMode('2D')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === '2D' ? '#007acc' : '#f0f0f0',
                  color: viewMode === '2D' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                2D
              </button>
              <button 
                onClick={() => setViewMode('MPR')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === 'MPR' ? '#007acc' : '#f0f0f0',
                  color: viewMode === 'MPR' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                MPR
              </button>
              <button 
                onClick={() => setViewMode('3D')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === '3D' ? '#007acc' : '#f0f0f0',
                  color: viewMode === '3D' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                3D
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Supports: NIfTI (.nii, .nii.gz), DICOM (.dcm, .dicom), NumPy (.npy), and standard image formats (.png, .jpg)
        </p>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
