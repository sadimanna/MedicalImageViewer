declare module '@cornerstonejs/nifti-image-loader' {
  export function init(): Promise<void>;
  export function createVolumeActor(options: {
    volumeId: string;
    dimensions: [number, number, number];
    spacing: [number, number, number];
    origin: [number, number, number];
    direction: [number, number, number, number, number, number, number, number, number];
    scalarData: Float32Array | Uint8Array | Uint16Array | Int16Array | Int32Array | Float64Array;
  }): Promise<any>;
} 