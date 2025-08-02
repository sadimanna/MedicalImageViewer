import * as nifti from 'nifti-reader-js';

export interface ImageData {
  pixelData: Float32Array | Uint8Array | Uint16Array;
  dimensions: [number, number, number];
  spacing?: [number, number, number];
  metadata?: Record<string, any>;
}

export interface LoadedFile {
  data: ImageData;
  filename: string;
  fileType: 'nifti' | 'numpy' | 'image' | 'dicom';
}

class FileLoaderService {
  private worker: Worker | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // Create a Web Worker for heavy file processing
    const workerCode = `
      self.onmessage = function(e) {
        const { file, type } = e.data;
        
        if (type === 'numpy') {
          // Handle NumPy file parsing
          const reader = new FileReader();
          reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            // Parse NumPy file format
            const view = new DataView(arrayBuffer);
            const magic = new Uint8Array(arrayBuffer, 0, 6);
            const magicStr = String.fromCharCode(...magic);
            
            if (magicStr !== '\\x93NUMPY') {
              self.postMessage({ error: 'Invalid NumPy file format' });
              return;
            }
            
            // Parse header
            const headerLength = view.getUint16(8, true);
            const header = new TextDecoder().decode(
              new Uint8Array(arrayBuffer, 10, headerLength)
            );
            
            // Extract shape and data type from header
            const shapeMatch = header.match(/shape\\(([^)]+)\\)/);
            const dtypeMatch = header.match(/descr: '([^']+)'/);
            
            if (!shapeMatch || !dtypeMatch) {
              self.postMessage({ error: 'Could not parse NumPy header' });
              return;
            }
            
            const shape = shapeMatch[1].split(',').map(s => parseInt(s.trim()));
            const dtype = dtypeMatch[1];
            
            // Extract data
            const dataOffset = 10 + headerLength;
            const padding = (16 - ((10 + headerLength) % 16)) % 16;
            const actualDataOffset = dataOffset + padding;
            
            // Handle different data types
            let data;
            if (dtype === '<u2') { // 16-bit unsigned little-endian
              data = new Uint16Array(arrayBuffer, actualDataOffset);
            } else if (dtype === '<u1') { // 8-bit unsigned
              data = new Uint8Array(arrayBuffer, actualDataOffset);
            } else {
              data = new Uint8Array(arrayBuffer, actualDataOffset);
            }
            
            self.postMessage({
              success: true,
              data: {
                pixelData: data,
                dimensions: shape,
                dtype: dtype
              }
            });
          };
          reader.readAsArrayBuffer(file);
        } else if (type === 'dicom') {
          // Handle DICOM file parsing
          const reader = new FileReader();
          reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            const view = new DataView(arrayBuffer);
            
            // Check DICOM magic number
            const magic = new Uint8Array(arrayBuffer, 128, 4);
            const magicStr = String.fromCharCode(...magic);
            
            if (magicStr !== 'DICM') {
              self.postMessage({ error: 'Invalid DICOM file format' });
              return;
            }
            
            // Parse DICOM tags (simplified)
            const rows = view.getUint16(0x28, true);
            const columns = view.getUint16(0x26, true);
            const bitsAllocated = view.getUint16(0x150, true);
            const samplesPerPixel = view.getUint16(0x152, true);
            
            // Extract pixel data (simplified - assumes 16-bit data)
            const pixelDataOffset = 0x200; // Simplified offset
            const pixelData = new Uint16Array(arrayBuffer, pixelDataOffset);
            
            self.postMessage({
              success: true,
              data: {
                pixelData: pixelData,
                dimensions: [columns, rows, 1],
                metadata: {
                  rows,
                  columns,
                  bitsAllocated,
                  samplesPerPixel
                }
              }
            });
          };
          reader.readAsArrayBuffer(file);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  async loadFile(file: File): Promise<LoadedFile> {
    const filename = file.name.toLowerCase();
    
    try {
      if (filename.endsWith('.npy')) {
        return await this.loadNumPyFile(file);
      } else if (filename.endsWith('.nii') || filename.endsWith('.nii.gz')) {
        return await this.loadNiftiFile(file);
      } else if (filename.endsWith('.dcm') || filename.endsWith('.dicom')) {
        return await this.loadDicomFile(file);
      } else if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        return await this.loadImageFile(file);
      } else {
        throw new Error(`Unsupported file format: ${filename}`);
      }
    } catch (error) {
      throw new Error(`Failed to load file: ${error}`);
    }
  }

  private async loadNumPyFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.worker.onmessage = (e) => {
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve({
            data: e.data.data,
            filename: file.name,
            fileType: 'numpy'
          });
        }
      };

      this.worker.postMessage({ file, type: 'numpy' });
    });
  }

  private async loadDicomFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      this.worker.onmessage = (e) => {
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve({
            data: e.data.data,
            filename: file.name,
            fileType: 'dicom'
          });
        }
      };

      this.worker.postMessage({ file, type: 'dicom' });
    });
  }

  private async loadNiftiFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        if (nifti.isNIFTI(arrayBuffer)) {
          const niftiHeader = nifti.readHeader(arrayBuffer);
          let niftiImage = nifti.readImage(niftiHeader, arrayBuffer);
          let pixelData: Float32Array | Uint8Array | Uint16Array;

          if (niftiImage instanceof ArrayBuffer) {
            // Convert ArrayBuffer to correct typed array based on datatypeCode
            switch (niftiHeader.datatypeCode) {
              case nifti.NIFTI1.TYPE_UINT8:
                pixelData = new Uint8Array(niftiImage);
                break;
              case nifti.NIFTI1.TYPE_UINT16:
                pixelData = new Uint16Array(niftiImage);
                break;
              case nifti.NIFTI1.TYPE_INT16:
                pixelData = new Int16Array(niftiImage) as any;
                break;
              case nifti.NIFTI1.TYPE_FLOAT32:
                pixelData = new Float32Array(niftiImage);
                break;
              default:
                pixelData = new Float32Array(niftiImage);
            }
          } else {
            pixelData = niftiImage as any;
          }

          const dims = [
            niftiHeader.dims[1], 
            niftiHeader.dims[2], 
            niftiHeader.dims[3]
          ];
          
          resolve({
            data: {
              pixelData: pixelData,
              dimensions: dims as [number, number, number],
              metadata: {
                ...niftiHeader
              }
            },
            filename: file.name,
            fileType: 'nifti'
          });
        } else {
          reject(new Error('File is not in NIfTI format'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private async loadImageFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // Convert RGBA to grayscale
        const grayscaleData = new Uint8Array(img.width * img.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          // Convert to grayscale using luminance formula
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          grayscaleData[i / 4] = gray;
        }
        
        resolve({
          data: {
            pixelData: grayscaleData,
            dimensions: [img.width, img.height, 1],
            metadata: {
              width: img.width,
              height: img.height,
              originalFormat: 'RGBA'
            }
          },
          filename: file.name,
          fileType: 'image'
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const fileLoader = new FileLoaderService(); 