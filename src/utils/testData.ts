// Utility functions for generating test data

export function createTestImageData(width: number, height: number, depth: number = 1): Uint8Array {
  const size = width * height * depth;
  const data = new Uint8Array(size);
  
  for (let i = 0; i < size; i++) {
    const x = i % width;
    const y = Math.floor((i % (width * height)) / width);
    
    // Create a more realistic medical image pattern
    // Center bright region with gradual falloff
    const centerX = width / 2;
    const centerY = height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
    
    // Create a smooth gradient from center to edges
    const normalizedDistance = distance / maxDistance;
    const intensity = Math.max(0, 255 * (1 - normalizedDistance * 0.8));
    
    // Add some noise for realism
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, intensity + noise));
  }
  
  return data;
}

export function createTestMaskData(width: number, height: number, depth: number = 1): Uint8Array {
  const size = width * height * depth;
  const data = new Uint8Array(size);
  
  for (let i = 0; i < size; i++) {
    const x = i % width;
    const y = Math.floor((i % (width * height)) / width);
    
    // Create a circular mask in the center
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    data[i] = distance < radius ? 255 : 0;
  }
  
  return data;
}

export function createMockNiftiFile(): ArrayBuffer {
  // Create a minimal NIfTI file structure for testing
  const buffer = new ArrayBuffer(352 + 256 * 256 * 10); // Header + 10 slices of 256x256
  const view = new DataView(buffer);
  
  // NIfTI header
  const header = new Uint8Array(buffer, 0, 352);
  
  // Magic number - NIfTI-1 format
  header[0] = 0x6E; // 'n'
  header[1] = 0x2B; // '+'
  header[2] = 0x31; // '1'
  header[3] = 0x00; // '\0'
  
  // Dimensions
  view.setUint16(40, 3, true); // Number of dimensions
  view.setUint16(42, 256, true); // Width
  view.setUint16(44, 256, true); // Height
  view.setUint16(46, 10, true);  // Depth
  
  // Data type (16-bit unsigned)
  view.setUint16(70, 4, true); // DT_UINT16
  view.setUint16(72, 16, true); // 16 bits per pixel
  
  // Fill with realistic test data
  const data = new Uint16Array(buffer, 352);
  for (let i = 0; i < data.length; i++) {
    const x = i % 256;
    const y = Math.floor((i % (256 * 256)) / 256);
    
    // Create a realistic medical image pattern
    const centerX = 128;
    const centerY = 128;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.sqrt(128 ** 2 + 128 ** 2);
    
    // Create a smooth gradient with some variation
    const normalizedDistance = distance / maxDistance;
    const intensity = Math.max(0, 65535 * (1 - normalizedDistance * 0.7));
    
    // Add some noise for realism
    const noise = (Math.random() - 0.5) * 5000;
    data[i] = Math.max(0, Math.min(65535, intensity + noise));
  }
  
  return buffer;
}

export function createMockNumpyFile(): ArrayBuffer {
  // Create a minimal NumPy .npy file for testing
  const shape = [256, 256, 10];
  const dtype = '<u2'; // 16-bit unsigned little-endian
  
  // Create header
  const header = `{'descr': '${dtype}', 'fortran_order': False, 'shape': (${shape.join(', ')}), }`;
  const headerLength = header.length + 1; // +1 for newline
  const padding = (16 - ((10 + headerLength) % 16)) % 16;
  const totalHeaderLength = 10 + headerLength + padding;
  
  const buffer = new ArrayBuffer(totalHeaderLength + shape.reduce((a, b) => a * b, 1) * 2);
  const view = new DataView(buffer);
  
  // Magic string - NumPy format
  const magic = new Uint8Array(buffer, 0, 6);
  magic[0] = 0x93; // '\x93'
  magic[1] = 0x4E; // 'N'
  magic[2] = 0x55; // 'U'
  magic[3] = 0x4D; // 'M'
  magic[4] = 0x50; // 'P'
  magic[5] = 0x59; // 'Y'
  
  // Version
  view.setUint8(6, 1);
  view.setUint8(7, 0);
  
  // Header length
  view.setUint16(8, headerLength, true);
  
  // Header
  const headerBytes = new TextEncoder().encode(header + '\n');
  const headerArray = new Uint8Array(buffer, 10, headerLength);
  headerArray.set(headerBytes);
  
  // Fill padding with spaces
  for (let i = 10 + headerLength; i < totalHeaderLength; i++) {
    view.setUint8(i, 0x20); // Space character
  }
  
  // Fill with realistic test data
  const data = new Uint16Array(buffer, totalHeaderLength);
  for (let i = 0; i < data.length; i++) {
    const x = i % 256;
    const y = Math.floor((i % (256 * 256)) / 256);
    
    // Create a realistic medical image pattern
    const centerX = 128;
    const centerY = 128;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.sqrt(128 ** 2 + 128 ** 2);
    
    // Create a smooth gradient with some variation
    const normalizedDistance = distance / maxDistance;
    const intensity = Math.max(0, 65535 * (1 - normalizedDistance * 0.7));
    
    // Add some noise for realism
    const noise = (Math.random() - 0.5) * 5000;
    data[i] = Math.max(0, Math.min(65535, intensity + noise));
  }
  
  return buffer;
} 