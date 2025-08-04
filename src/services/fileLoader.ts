import * as nifti from 'nifti-reader-js';
import * as dicomParser from 'dicom-parser';
import * as pako from 'pako';

export interface ImageData {
  pixelData: Float32Array | Uint8Array | Uint16Array | Int16Array | Int32Array | Float64Array;
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
        // NumPy and DICOM handling removed from worker
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
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const arrayBuffer = event.target!.result as ArrayBuffer;
          const view = new DataView(arrayBuffer);
          const magic = new Uint8Array(arrayBuffer, 0, 6);
          const magicStr = String.fromCharCode(...magic);
          if (magicStr !== '\x93NUMPY') {
            reject(new Error('Invalid NumPy file format'));
            return;
          }
          // Version
          const major = view.getUint8(6);
          let headerLength, headerStart;
          if (major === 1) {
            headerLength = view.getUint16(8, true);
            headerStart = 10;
          } else if (major === 2) {
            headerLength = view.getUint32(8, true);
            headerStart = 12;
          } else {
            reject(new Error('Unsupported NumPy version'));
            return;
          }
          const header = new TextDecoder().decode(
            new Uint8Array(arrayBuffer, headerStart, headerLength)
          );
          // Robust header parsing
          let headerObj;
          try {
            let safeHeader = header
              .replace(/True/g, 'true')
              .replace(/False/g, 'false')
              .replace(/'/g, '"')
              .split('(').join('[')
              .split(')').join(']')
              .replace(/,\s*}/g, '}');
            headerObj = JSON.parse(safeHeader);
          } catch (e) {
            try {
              headerObj = Function('return ' + header
                .replace(/True/g, 'true')
                .replace(/False/g, 'false')
                .replace(/None/g, 'null')
                .replace(/'/g, '"')
                .split('(').join('[')
                .split(')').join(']')
                .replace(/,\s*}/g, '}')
              )();
            } catch (e2) {
              reject(new Error('Could not robustly parse NumPy header'));
              return;
            }
          }
          if (!headerObj || !headerObj.shape || !headerObj.descr) {
            reject(new Error('Could not parse NumPy header'));
            return;
          }
          const shape = Array.isArray(headerObj.shape) ? headerObj.shape : Array.from(headerObj.shape);
          const dtype = headerObj.descr;
          // Calculate data offset (align to 16 bytes)
          const dataOffset = headerStart + headerLength;
          const padding = (16 - (dataOffset % 16)) % 16;
          const actualDataOffset = dataOffset + padding;
          // Handle different data types
          let data;
          if (dtype === '<u2') {
            data = new Uint16Array(arrayBuffer, actualDataOffset);
          } else if (dtype === '<u1') {
            data = new Uint8Array(arrayBuffer, actualDataOffset);
          } else if (dtype === '<f4') {
            data = new Float32Array(arrayBuffer, actualDataOffset);
          } else if (dtype === '<i4') {
            data = new Int32Array(arrayBuffer, actualDataOffset);
          } else if (dtype === '<i2') {
            data = new Int16Array(arrayBuffer, actualDataOffset);
          } else if (dtype === '<f8') {
            data = new Float64Array(arrayBuffer, actualDataOffset);
          } else {
            data = new Uint8Array(arrayBuffer, actualDataOffset);
          }
          resolve({
            data: {
              pixelData: data,
              dimensions: shape.length === 2 ? [shape[0], shape[1], 1] : shape
            },
            filename: file.name,
            fileType: 'numpy'
          });
        } catch (err) {
          reject(new Error('Failed to parse NumPy: ' + (err as Error).message));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  private async loadDicomFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const arrayBuffer = event.target!.result as ArrayBuffer;
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          const rows = dataSet.uint16('x00280010');
          const columns = dataSet.uint16('x00280011');
          const samplesPerPixel = dataSet.uint16('x00280002') || 1;
          const bitsAllocated = dataSet.uint16('x00280100');
          const pixelDataElement = dataSet.elements.x7fe00010;
          if (!rows || !columns || !pixelDataElement) {
            reject(new Error('Missing DICOM image data or dimensions'));
            return;
          }
          let pixelData;
          if (bitsAllocated === 16) {
            pixelData = new Uint16Array(arrayBuffer, pixelDataElement.dataOffset, rows * columns * samplesPerPixel);
          } else {
            pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, rows * columns * samplesPerPixel);
          }
          resolve({
            data: {
              pixelData: pixelData,
              dimensions: [rows, columns, 1],
              metadata: {
                rows,
                columns,
                samplesPerPixel,
                bitsAllocated
              }
            },
            filename: file.name,
            fileType: 'dicom'
          });
        } catch (err) {
          reject(new Error('Failed to parse DICOM: ' + (err as Error).message));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  private async loadNiftiFile(file: File): Promise<LoadedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let arrayBuffer = reader.result as ArrayBuffer;
        // Decompress if .nii.gz
        if (file.name.toLowerCase().endsWith('.nii.gz')) {
          try {
            const compressed = new Uint8Array(arrayBuffer);
            arrayBuffer = pako.inflate(compressed).buffer;
          } catch (err) {
            reject(new Error('Failed to decompress .nii.gz file: ' + err));
            return;
          }
        }
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

  /**
   * Load and stack a set of 2D files (PNG, JPG, DICOM, NPY) into a 3D volume.
   * @param files Array of File objects
   * @returns LoadedFile with 3D volume
   */
  async loadImageStack(files: File[]): Promise<LoadedFile> {
    // Sort files by name (for DICOM, could use metadata if needed)
    const sortedFiles = files.slice().sort((a, b) => a.name.localeCompare(b.name));
    const slices: { data: Float32Array | Uint8Array | Uint16Array; width: number; height: number; fileType: string; }[] = [];
    for (const file of sortedFiles) {
      const ext = file.name.toLowerCase().split('.').pop();
      let loaded;
      if (ext === 'npy') {
        loaded = await this.loadNumPyFile(file);
      } else if (ext === 'dcm' || ext === 'dicom') {
        loaded = await this.loadDicomFile(file);
      } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        loaded = await this.loadImageFile(file);
      } else {
        throw new Error(`Unsupported file format in stack: ${file.name}`);
      }
      const dims = loaded.data.dimensions;
      slices.push({
        data: loaded.data.pixelData as Float32Array | Uint8Array | Uint16Array,
        width: dims[0],
        height: dims[1],
        fileType: loaded.fileType
      });
    }
    // Check all slices have the same width/height
    const width = slices[0].width;
    const height = slices[0].height;
    if (!slices.every(s => s.width === width && s.height === height)) {
      throw new Error('All slices must have the same width and height');
    }
    // Stack slices into a 3D volume (Uint8Array for images, Uint16Array for DICOM, fallback to Float32Array)
    let volume: Uint8Array | Uint16Array | Float32Array;
    let dtype = 'uint8';
    if (slices.some(s => s.data instanceof Uint16Array)) {
      volume = new Uint16Array(width * height * slices.length);
      dtype = 'uint16';
    } else if (slices.some(s => s.data instanceof Float32Array)) {
      volume = new Float32Array(width * height * slices.length);
      dtype = 'float32';
    } else {
      volume = new Uint8Array(width * height * slices.length);
    }
    for (let z = 0; z < slices.length; z++) {
      const slice = slices[z];
      for (let i = 0; i < width * height; i++) {
        (volume as any)[z * width * height + i] = slice.data[i];
      }
    }
    return {
      data: {
        pixelData: volume,
        dimensions: [width, height, slices.length],
        metadata: {
          stackedFrom: sortedFiles.map(f => f.name),
          dtype
        }
      },
      filename: `Stacked (${sortedFiles[0].name} ... ${sortedFiles[sortedFiles.length-1].name})`,
      fileType: 'image'
    };
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const fileLoader = new FileLoaderService(); 