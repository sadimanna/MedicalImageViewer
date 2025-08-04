import { FileUpload } from './components/FileUpload';
import { Renderer2D } from './components/Renderer2D';
import { MPRViewer } from './components/MPRViewer';
import { ViewerControls } from './components/ViewerControls';
import { useViewerStore } from './store/viewerStore';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  const { isLoading, error, viewMode } = useViewerStore();

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

        {isLoading && (
          <div className="loading-overlay">
            <Loader2 size={32} className="spinner" />
            <p>Loading file...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="viewer-section">
          <div className="viewer-container">
            {viewMode === '2D' && <Renderer2D />}
            {viewMode === 'MPR' && <MPRViewer />}
            {viewMode === '3D' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  3D Volume Rendering - Coming Soon
                </p>
              </div>
            )}
          </div>
          <div className="controls-sidebar">
            <ViewerControls />
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
