# Medical Image Viewer

A high-performance, client-side web application for viewing medical images and their corresponding segmentation masks. Built with React, TypeScript, and modern web technologies.

## Features

### Core Functionality
- **Dual File Loading**: Simultaneously load and display a primary image and its corresponding mask
- **Multi-Format Support**:
  - Volumetric: `.nii`, `.nii.gz` (NIfTI format)
  - Medical Imaging: `.dcm`, `.dicom` (DICOM format)
  - Array/Slice: `.npy` (NumPy arrays)
  - Standard 2D: `.png`, `.jpg`, `.jpeg`
- **Interactive Viewing**: 2D slice-by-slice viewing with zoom, pan, and window/level adjustments
- **Mask Overlay**: Visualize segmentation masks with semi-transparent red overlay
- **Separate Controls**: Independent window/level controls for image and mask

### Advanced Features
- **Window/Level Adjustment**: Interactive contrast and brightness controls
- **Zoom and Pan**: Smooth navigation with mouse controls
- **Slice Navigation**: Slider-based navigation through 3D volumes
- **Multi-Planar Reconstruction (MPR)**: Three orthogonal views (Axial, Sagittal, Coronal)
- **Real-time Rendering**: WebGL-accelerated rendering for smooth performance
- **Web Worker Processing**: Heavy file parsing runs in background threads

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand
- **3D Graphics**: Three.js
- **Medical Imaging**: Cornerstone.js
- **File Parsing**: Custom parsers for NIfTI and NumPy formats
- **UI Components**: Lucide React icons
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation and Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd medical-viewer-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

> **Note**: This application is designed for research and educational purposes. Always ensure compliance with local regulations regarding medical data handling and privacy.

## Installing as a Web App (PWA)

This application supports installation as a Progressive Web App (PWA) for an app-like experience on desktop and mobile devices.

### How to Install

- **Desktop Browsers (Chrome, Edge, Brave, etc.):**
  1. Open the deployed app in your browser at `http://localhost:5173`.
  2. Look for the install icon (usually in the address bar or browser menu).
  3. Click "Install" or "Add to desktop" to install the app.

- **Mobile Browsers (Safari, Chrome, Edge, etc.):**
  1. Open the app URL in your mobile browser.
  2. Tap the browser menu (three dots or share icon).
  3. Select "Add to Home Screen".
  4. The app will appear on your home screen and can be launched like a native app.

### Features of the Installed App

- Launches in standalone mode (no browser UI)
- App icon on desktop or mobile home screen
- Works offline after first load (basic functionality)
- Fast startup and app-like experience

> **Note:** Offline use is supported for previously loaded pages and assets. Some features (like loading new files from the network) may require an internet connection.


## Usage

### Loading Files

1. **Load an Image**: Drag and drop or click to browse for your primary medical image file
2. **Load a Mask (Optional)**: Load a corresponding segmentation mask file
3. **Supported Formats**:
   - NIfTI files (`.nii`, `.nii.gz`)
   - NumPy arrays (`.npy`)
   - Standard images (`.png`, `.jpg`, `.jpeg`)

### Navigation Controls

- **Slice Slider**: Navigate through 3D volume slices
- **Window/Level**: Adjust image contrast and brightness
- **Zoom Controls**: Use mouse wheel or zoom buttons
- **Pan**: Click and drag to move around the image
- **Reset View**: Return to default view settings

### Keyboard Shortcuts

- `Mouse Wheel`: Zoom in/out
- `Click + Drag`: Pan the image
- `R`: Reset view (planned)

## Architecture

### Core Components

- **FileLoader**: Handles file parsing and format detection
- **Renderer2D**: WebGL-based 2D rendering with window/level
- **ViewerControls**: UI controls for navigation and settings
- **FileUpload**: Drag-and-drop file upload interface

### State Management

The application uses Zustand for state management with the following key state:

```typescript
interface ViewerState {
  imageFile: LoadedFile | null;
  maskFile: LoadedFile | null;
  currentSlice: number;
  windowLevel: { center: number; width: number };
  zoom: number;
  pan: { x: number; y: number };
  // ... other state properties
}
```

### File Processing

- **Web Workers**: Heavy file parsing runs in background threads
- **Format Detection**: Automatic detection based on file extension and magic bytes
- **Memory Management**: Efficient handling of large medical images

## Development

### Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # File upload interface
│   ├── Renderer2D.tsx      # 2D rendering component
│   └── ViewerControls.tsx  # Navigation controls
├── services/
│   └── fileLoader.ts       # File parsing and loading
├── store/
│   └── viewerStore.ts      # Zustand state management
├── App.tsx                 # Main application component
└── App.css                # Application styles
```

### Adding New File Formats

To add support for a new file format:

1. Extend the `FileLoaderService` class
2. Add format detection logic
3. Implement the parsing method
4. Update the `LoadedFile` interface if needed

### Performance Optimization

- **Web Workers**: File parsing runs in background
- **Canvas Rendering**: Efficient 2D graphics
- **Debounced Updates**: Smooth UI interactions
- **Memory Management**: Proper cleanup of large objects

## Running as a Browser App

This application is designed to run entirely in your web browser. You can use it locally during development, or build it for production and deploy it to any static hosting service (such as Vercel, Netlify, GitHub Pages, or your own server).

### Production Build & Static Hosting

1. Build the app:
   ```bash
   npm run build
   ```
2. The production-ready files will be in the `dist/` directory.
3. You can now deploy the contents of `dist/` to any static file server or static hosting provider, for example:
   - **Vercel**: `vercel --prod`
   - **Netlify**: Drag and drop the `dist/` folder in the Netlify dashboard
   - **GitHub Pages**: Push the contents of `dist/` to your `gh-pages` branch
   - **Python HTTP server (for local testing):**
     ```bash
     cd dist
     python3 -m http.server 8080
     # Then open http://localhost:8080 in your browser
     ```

No backend or server-side code is required. All processing is done client-side in your browser.

### Environment Variables

No environment variables are required for basic functionality. The application runs entirely client-side.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 2: Advanced Features
- [x] Multi-planar reconstruction (MPR)
- [ ] 3D volume rendering
- [x] DICOM series support
- [ ] Measurement tools
- [ ] Annotation capabilities

### Phase 3: Collaboration Features
- [ ] Share view states
- [ ] Collaborative annotations
- [ ] Export capabilities
- [ ] Plugin system

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cornerstone.js](https://cornerstonejs.org/) for medical imaging foundations
- [Three.js](https://threejs.org/) for 3D graphics capabilities
- [Lucide](https://lucide.dev/) for beautiful icons
- [Zustand](https://github.com/pmndrs/zustand) for state management

## Support

For issues, questions, or contributions, please:

1. Check existing issues
2. Create a new issue with detailed information
3. Include file format and browser information for bug reports

---
