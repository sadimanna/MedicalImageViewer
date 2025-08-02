import React from 'react';
import { useViewerStore } from '../store/viewerStore';
import { Grid3X3, Box, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export const ViewerControls: React.FC = () => {
  const {
    imageFile,
    maskFile,
    currentSlice,
    totalSlices,
    imageWindowLevel,
    maskWindowLevel,
    zoom,
    viewMode,
    setCurrentSlice,
    setImageWindowLevel,
    setMaskWindowLevel,
    setZoom,
    setViewMode,
    resetView
  } = useViewerStore();

  const handleSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slice = parseInt(e.target.value);
    setCurrentSlice(slice);
  };

  const handleImageCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const center = parseInt(e.target.value);
    setImageWindowLevel({ ...imageWindowLevel, center });
  };

  const handleImageWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    setImageWindowLevel({ ...imageWindowLevel, width });
  };

  const handleMaskCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const center = parseInt(e.target.value);
    setMaskWindowLevel({ ...maskWindowLevel, center });
  };

  const handleMaskWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    setMaskWindowLevel({ ...maskWindowLevel, width });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(10, zoom * 1.2);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoom / 1.2);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    resetView();
  };

  if (!imageFile) {
    return (
      <div className="viewer-controls">
        <div className="control-section">
          <h4>View Mode</h4>
          <div className="view-mode-controls">
            <button
              className={`mode-button ${viewMode === '2D' ? 'active' : ''}`}
              onClick={() => setViewMode('2D')}
              title="2D View"
            >
              2D
            </button>
            <button
              className={`mode-button ${viewMode === 'MPR' ? 'active' : ''}`}
              onClick={() => setViewMode('MPR')}
              title="Multi-Planar Reconstruction"
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={`mode-button ${viewMode === '3D' ? 'active' : ''}`}
              onClick={() => setViewMode('3D')}
              title="3D Volume Rendering"
            >
              <Box size={14} />
            </button>
          </div>
        </div>
        <div className="control-section">
          <h4>Supported Formats</h4>
          <div style={{ fontSize: '0.7rem', color: '#666' }}>
            <p style={{ margin: '0.25rem 0' }}>• NIfTI (.nii, .nii.gz)</p>
            <p style={{ margin: '0.25rem 0' }}>• DICOM (.dcm, .dicom)</p>
            <p style={{ margin: '0.25rem 0' }}>• NumPy (.npy)</p>
            <p style={{ margin: '0.25rem 0' }}>• Images (.png, .jpg)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-controls">
      {/* View Mode Controls */}
      <div className="control-section">
        <h4>View Mode</h4>
        <div className="view-mode-controls">
          <button
            className={`mode-button ${viewMode === '2D' ? 'active' : ''}`}
            onClick={() => setViewMode('2D')}
            title="2D View"
          >
            2D
          </button>
          <button
            className={`mode-button ${viewMode === 'MPR' ? 'active' : ''}`}
            onClick={() => setViewMode('MPR')}
            title="Multi-Planar Reconstruction"
          >
            <Grid3X3 size={14} />
          </button>
          <button
            className={`mode-button ${viewMode === '3D' ? 'active' : ''}`}
            onClick={() => setViewMode('3D')}
            title="3D Volume Rendering"
          >
            <Box size={14} />
          </button>
        </div>
      </div>

      {/* Slice Controls */}
      <div className="control-section">
        <h4>Slice Navigation</h4>
        <div className="slice-controls">
          <input
            type="range"
            min="0"
            max={Math.max(0, totalSlices - 1)}
            value={currentSlice}
            onChange={handleSliceChange}
            className="slice-slider"
          />
          <div className="slice-info">
            Slice {currentSlice + 1} of {totalSlices}
          </div>
        </div>
      </div>

      {/* Image Window/Level Controls */}
      <div className="control-section">
        <h4>Image Window/Level</h4>
        <div className="window-level-controls">
          <div className="control-group">
            <label>Center:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={imageWindowLevel.center}
              onChange={handleImageCenterChange}
              className="control-slider"
            />
            <span>{imageWindowLevel.center}</span>
          </div>
          <div className="control-group">
            <label>Width:</label>
            <input
              type="range"
              min="1"
              max="255"
              value={imageWindowLevel.width}
              onChange={handleImageWidthChange}
              className="control-slider"
            />
            <span>{imageWindowLevel.width}</span>
          </div>
        </div>
      </div>

      {/* Mask Window/Level Controls */}
      {maskFile && (
        <div className="control-section">
          <h4>Mask Window/Level</h4>
          <div className="window-level-controls">
            <div className="control-group">
              <label>Center:</label>
              <input
                type="range"
                min="0"
                max="255"
                value={maskWindowLevel.center}
                onChange={handleMaskCenterChange}
                className="control-slider"
              />
              <span>{maskWindowLevel.center}</span>
            </div>
            <div className="control-group">
              <label>Width:</label>
              <input
                type="range"
                min="1"
                max="255"
                value={maskWindowLevel.width}
                onChange={handleMaskWidthChange}
                className="control-slider"
              />
              <span>{maskWindowLevel.width}</span>
            </div>
          </div>
        </div>
      )}

      {/* Combined Zoom Controls */}
      <div className="control-section">
        <h4>Zoom</h4>
        <div className="view-controls">
          <button onClick={handleZoomOut} className="control-button" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="control-button" title="Zoom In">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="control-section">
        <h4>View Controls</h4>
        <div className="view-controls">
          <button onClick={handleResetView} className="control-button" title="Reset View">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* File Information */}
      <div className="control-section">
        <h4>File Information</h4>
        <div className="file-info">
          <div>
            <strong>Image:</strong> {imageFile.data.dimensions.join(' x ')}
          </div>
          {maskFile && (
            <div>
              <strong>Mask:</strong> {maskFile.data.dimensions.join(' x ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 