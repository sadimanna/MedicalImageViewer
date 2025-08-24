import React, { useState, useCallback } from 'react';
import VTKVolumeRenderer3D from './VTKVolumeRenderer3D';
import { useVolumeRenderer, type VolumeData } from '../hooks/useVolumeRenderer';

interface MedicalVolumeViewerProps {
  initialVolumeData?: VolumeData;
  showAdvancedControls?: boolean;
  onVolumeLoad?: (volumeInfo: any) => void;
  onError?: (error: string) => void;
}

function MedicalVolumeViewer({ 
  initialVolumeData,
  showAdvancedControls = false,
  onVolumeLoad,
  onError 
}: MedicalVolumeViewerProps) {
  const {
    volumeData,
    volumeInfo,
    config,
    isValid,
    loadVolume,
    updateConfig,
    clearVolume,
    getVolumeStats
  } = useVolumeRenderer();

  const [isLoading, setIsLoading] = useState(false);

  // Load initial volume data if provided
  React.useEffect(() => {
    if (initialVolumeData) {
      loadVolume(initialVolumeData);
    }
  }, [initialVolumeData, loadVolume]);

  // Notify parent when volume loads
  React.useEffect(() => {
    if (volumeInfo && onVolumeLoad) {
      onVolumeLoad(volumeInfo);
    }
  }, [volumeInfo, onVolumeLoad]);

  const handleVolumeLoad = useCallback(async (data: VolumeData) => {
    setIsLoading(true);
    try {
      const success = loadVolume(data);
      if (!success && onError) {
        onError('Failed to load volume data');
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadVolume, onError]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    updateConfig({ backgroundColor: [r, g, b] });
  }, [updateConfig]);

  const volumeStats = getVolumeStats();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with controls */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0 }}>Medical Volume Viewer</h3>
          {volumeInfo && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {volumeInfo.dimensions.join('×')} | {volumeInfo.voxelCount.toLocaleString()} voxels | {volumeInfo.dataType}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {showAdvancedControls && (
            <>
              <label style={{ fontSize: '12px' }}>
                Background:
                <input
                  type="color"
                  value="#1a1a1a"
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  style={{ marginLeft: '5px' }}
                />
              </label>
              
              <label style={{ fontSize: '12px' }}>
                Show Info:
                <input
                  type="checkbox"
                  checked={config.showControls}
                  onChange={(e) => updateConfig({ showControls: e.target.checked })}
                  style={{ marginLeft: '5px' }}
                />
              </label>
            </>
          )}
          
          <button
            onClick={clearVolume}
            disabled={!isValid}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.5
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main viewer area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {!isValid ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9',
            color: '#666',
            textAlign: 'center'
          }}>
            <div>
              <h3>📊 No Volume Data Loaded</h3>
              <p>Load a volume to start viewing</p>
              {isLoading && <p>🔄 Loading...</p>}
            </div>
          </div>
        ) : (
          <VTKVolumeRenderer3D
            volumeArray={volumeData!.volumeArray}
            dimensions={volumeData!.dimensions}
            spacing={volumeData!.spacing}
            origin={volumeData!.origin}
            showControls={config.showControls}
            backgroundColor={config.backgroundColor}
          />
        )}
      </div>

      {/* Footer with volume statistics */}
      {showAdvancedControls && volumeStats && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>Volume Statistics:</strong>
              <div>Range: {volumeStats.min.toFixed(2)} - {volumeStats.max.toFixed(2)}</div>
              <div>Memory: {volumeStats.memoryUsageMB.toFixed(2)} MB</div>
            </div>
            <div>
              <div>Aspect Ratio: {volumeStats.aspectRatio.map(v => v.toFixed(2)).join(' : ')}</div>
              <div>Data Range: {volumeStats.range.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalVolumeViewer;
