import { useState, useCallback } from 'react';

export interface VolumeData {
  volumeArray: Float32Array | Uint8Array | Uint16Array | Int16Array | Int32Array | Float64Array;
  dimensions: [number, number, number];
  spacing?: [number, number, number];
  origin?: [number, number, number];
}

export interface VolumeRendererConfig {
  showControls?: boolean;
  backgroundColor?: [number, number, number];
  sampleDistance?: number;
  imageSampleDistance?: number;
}

export interface VolumeInfo {
  min: number;
  max: number;
  dimensions: [number, number, number];
  voxelCount: number;
  dataType: string;
}

export function useVolumeRenderer() {
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null);
  const [config, setConfig] = useState<VolumeRendererConfig>({
    showControls: true,
    backgroundColor: [0.1, 0.1, 0.1],
    sampleDistance: 0.4,
    imageSampleDistance: 0.4,
  });
  const [volumeInfo, setVolumeInfo] = useState<VolumeInfo | null>(null);
  const [isValid, setIsValid] = useState(false);

  const loadVolume = useCallback((data: VolumeData) => {
    // Validate the volume data
    const { volumeArray, dimensions } = data;
    
    if (!volumeArray || volumeArray.length === 0) {
      console.error('useVolumeRenderer: Volume array is empty or null');
      setIsValid(false);
      return false;
    }
    
    if (!dimensions || dimensions.length !== 3) {
      console.error('useVolumeRenderer: Invalid dimensions format:', dimensions);
      setIsValid(false);
      return false;
    }
    
    const [width, height, depth] = dimensions;
    if (width <= 0 || height <= 0 || depth <= 0) {
      console.error('useVolumeRenderer: Invalid dimensions - all must be > 0:', { width, height, depth });
      setIsValid(false);
      return false;
    }

    // Validate that array length matches dimensions
    const expectedLength = width * height * depth;
    if (volumeArray.length !== expectedLength) {
      console.error(`useVolumeRenderer: Array length (${volumeArray.length}) doesn't match dimensions (${expectedLength})`);
      setIsValid(false);
      return false;
    }

    // Calculate volume info
    let min = volumeArray[0];
    let max = volumeArray[0];
    for (let i = 1; i < volumeArray.length; i++) {
      if (volumeArray[i] < min) min = volumeArray[i];
      if (volumeArray[i] > max) max = volumeArray[i];
    }

    const info: VolumeInfo = {
      min,
      max,
      dimensions,
      voxelCount: volumeArray.length,
      dataType: volumeArray.constructor.name,
    };

    setVolumeData(data);
    setVolumeInfo(info);
    setIsValid(true);
    
    console.log('useVolumeRenderer: Volume loaded successfully:', info);
    return true;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<VolumeRendererConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const clearVolume = useCallback(() => {
    setVolumeData(null);
    setVolumeInfo(null);
    setIsValid(false);
  }, []);

  const getVolumeStats = useCallback(() => {
    if (!volumeInfo) return null;
    
    const { min, max, dimensions, voxelCount } = volumeInfo;
    const range = max - min;
    const [width, height, depth] = dimensions;
    
    return {
      ...volumeInfo,
      range,
      aspectRatio: [width / depth, height / depth, 1],
      memoryUsageMB: (voxelCount * 4) / (1024 * 1024), // Assuming 4 bytes per voxel
    };
  }, [volumeInfo]);

  return {
    // Data
    volumeData,
    volumeInfo,
    config,
    isValid,
    
    // Actions
    loadVolume,
    updateConfig,
    clearVolume,
    getVolumeStats,
  };
}
