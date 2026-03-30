import { Analytics } from '@vercel/analytics/react';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { Renderer2D } from './components/Renderer2D';
import { MPRViewer } from './components/MPRViewer';
import VTKVolumeRenderer3D from './components/VTKVolumeRenderer3D';
import { ViewerControls } from './components/ViewerControls';
import { useViewerStore } from './store/viewerStore';

function App() {
  const { imageFile, isLoading, error, viewMode } = useViewerStore();

  const renderViewer = () => {
    if (!imageFile) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#666',
            textAlign: 'center',
            padding: '1rem'
          }}
        >
          <div>
            <h3 style={{ marginTop: 0 }}>Load medical image data to begin</h3>
            <p style={{ marginBottom: 0 }}>Supports single volumes (NIfTI/NPY/DICOM) and 2D slice stacks.</p>
          </div>
        </div>
      );
    }

    if (viewMode === '2D') {
      return <Renderer2D />;
    }

    if (viewMode === 'MPR') {
      return <MPRViewer />;
    }

    return (
      <div style={{ width: '100%', height: '100%', minHeight: '512px' }}>
        <VTKVolumeRenderer3D
          volumeArray={imageFile.data.pixelData}
          dimensions={imageFile.data.dimensions}
          spacing={imageFile.data.spacing}
          showControls
        />
      </div>
    );
  };

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
            <FileUpload type="image" />
          </div>
          <div className="upload-column">
            <h3>Mask File (Optional)</h3>
            <FileUpload type="mask" />
          </div>
        </div>

        <div className="viewer-section">
          <div className="viewer-container">{renderViewer()}</div>
          <div className="controls-sidebar">
            <ViewerControls />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner">⏳</div>
            <p>Loading medical image data…</p>
          </div>
        )}
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
