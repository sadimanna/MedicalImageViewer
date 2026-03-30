import { Analytics } from '@vercel/analytics/react';
import { Suspense, lazy } from 'react';
import './App.css';
import { FileUpload } from './components/FileUpload';
import { useViewerStore } from './store/viewerStore';

const Renderer2D = lazy(() => import('./components/Renderer2D').then((module) => ({ default: module.Renderer2D })));
const MPRViewer = lazy(() => import('./components/MPRViewer').then((module) => ({ default: module.MPRViewer })));
const VTKVolumeRenderer3D = lazy(() => import('./components/VTKVolumeRenderer3D'));
const ViewerControls = lazy(() => import('./components/ViewerControls').then((module) => ({ default: module.ViewerControls })));

function App() {
  const { imageFile, isLoading, loadingMessage, loadingProgress, error, viewMode } = useViewerStore();

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
      return (
        <Suspense fallback={<div style={{ color: '#666' }}>Loading 2D viewer…</div>}>
          <Renderer2D />
        </Suspense>
      );
    }

    if (viewMode === 'MPR') {
      return (
        <Suspense fallback={<div style={{ color: '#666' }}>Loading MPR viewer…</div>}>
          <MPRViewer />
        </Suspense>
      );
    }

    return (
      <div style={{ width: '100%', height: '100%', minHeight: '512px' }}>
        <Suspense fallback={<div style={{ color: '#666' }}>Loading 3D viewer…</div>}>
          <VTKVolumeRenderer3D
            volumeArray={imageFile.data.pixelData}
            dimensions={imageFile.data.dimensions}
            spacing={imageFile.data.spacing}
            showControls
          />
        </Suspense>
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
            <Suspense fallback={<div style={{ color: '#666' }}>Loading controls…</div>}>
              <ViewerControls />
            </Suspense>
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
            <p>{loadingMessage || 'Loading medical image data…'}</p>
            {typeof loadingProgress === 'number' && (
              <p style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>{loadingProgress}%</p>
            )}
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
