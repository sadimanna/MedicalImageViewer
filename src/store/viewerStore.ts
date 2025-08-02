import { create } from 'zustand';
import { fileLoader, type LoadedFile } from '../services/fileLoader';

interface ViewerState {
  // Files
  imageFile: LoadedFile | null;
  maskFile: LoadedFile | null;
  
  // Slice navigation
  currentSlice: number;
  totalSlices: number;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Window/level controls (separate for image and mask)
  imageWindowLevel: { center: number; width: number };
  maskWindowLevel: { center: number; width: number };
  
  // Combined zoom control
  zoom: number;
  
  // Pan control
  pan: { x: number; y: number };
  
  // View mode
  viewMode: '2D' | 'MPR' | '3D';
  
  // Flip controls
  flipHorizontal2D: boolean;
  flipVertical2D: boolean;
  // Per-plane MPR flip
  flipHorizontalAxial: boolean;
  flipVerticalAxial: boolean;
  flipHorizontalSagittal: boolean;
  flipVerticalSagittal: boolean;
  flipHorizontalCoronal: boolean;
  flipVerticalCoronal: boolean;
}

interface ViewerActions {
  // File management
  setImageFile: (file: File | LoadedFile | null) => Promise<void>;
  setMaskFile: (file: LoadedFile | null) => void;
  
  // Slice navigation
  setCurrentSlice: (slice: number) => void;
  setTotalSlices: (total: number) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Window/level controls
  setImageWindowLevel: (windowLevel: { center: number; width: number }) => void;
  setMaskWindowLevel: (windowLevel: { center: number; width: number }) => void;
  
  // Combined zoom control
  setZoom: (zoom: number) => void;
  
  // Pan control
  setPan: (x: number, y: number) => void;
  
  // View mode
  setViewMode: (mode: '2D' | 'MPR' | '3D') => void;
  
  // Reset view
  resetView: () => void;
  
  // Flip controls
  setFlipHorizontal2D: (flip: boolean) => void;
  setFlipVertical2D: (flip: boolean) => void;
  // Per-plane MPR flip
  setFlipHorizontalAxial: (flip: boolean) => void;
  setFlipVerticalAxial: (flip: boolean) => void;
  setFlipHorizontalSagittal: (flip: boolean) => void;
  setFlipVerticalSagittal: (flip: boolean) => void;
  setFlipHorizontalCoronal: (flip: boolean) => void;
  setFlipVerticalCoronal: (flip: boolean) => void;
}

export const useViewerStore = create<ViewerState & ViewerActions>((set) => ({
  // Initial state
  imageFile: null,
  maskFile: null,
  currentSlice: 0,
  totalSlices: 0,
  isLoading: false,
  error: null,
  imageWindowLevel: { center: 128, width: 256 },
  maskWindowLevel: { center: 128, width: 256 },
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewMode: '2D',
  flipHorizontal2D: false,
  flipVertical2D: false,
  // Per-plane MPR flip
  flipHorizontalAxial: false,
  flipVerticalAxial: false,
  flipHorizontalSagittal: false,
  flipVerticalSagittal: false,
  flipHorizontalCoronal: false,
  flipVerticalCoronal: false,
  
  // Actions
  setImageFile: async (file) => {
    if (!file) {
      set({ imageFile: null, totalSlices: 0, currentSlice: 0, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      let loadedFile: LoadedFile;
      if ('data' in file && 'fileType' in file) {
        loadedFile = file as LoadedFile;
      } else {
        loadedFile = await fileLoader.loadFile(file as File);
      }
      set({
        imageFile: loadedFile,
        totalSlices: loadedFile.data.dimensions[2] || 1,
        currentSlice: 0,
        isLoading: false,
        pan: { x: 0, y: 0 },
        zoom: 1,
      });
      // Automatically switch to MPR for volumetric data
      if ((loadedFile.fileType === 'nifti' || loadedFile.data.dimensions[2] > 1) && loadedFile.data.dimensions.length === 3) {
        set({ viewMode: 'MPR' });
      } else {
        set({ viewMode: '2D' });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },
  
  setMaskFile: (file) => {
    set({
      maskFile: file,
      error: null
    });
  },
  
  setCurrentSlice: (slice) => {
    set({ currentSlice: slice });
  },
  
  setTotalSlices: (total) => {
    set({ totalSlices: total });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  setImageWindowLevel: (windowLevel) => {
    set({ imageWindowLevel: windowLevel });
  },
  
  setMaskWindowLevel: (windowLevel) => {
    set({ maskWindowLevel: windowLevel });
  },
  
  setZoom: (zoom) => {
    set({ zoom });
  },
  
  setPan: (x, y) => {
    set({ pan: { x, y } });
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
  
  resetView: () => {
    set({
      currentSlice: 0,
      imageWindowLevel: { center: 128, width: 256 },
      maskWindowLevel: { center: 128, width: 256 },
      zoom: 1,
      pan: { x: 0, y: 0 }
    });
  },
  
  setFlipHorizontal2D: (flip) => set({ flipHorizontal2D: flip }),
  setFlipVertical2D: (flip) => set({ flipVertical2D: flip }),
  // Per-plane MPR flip
  setFlipHorizontalAxial: (flip) => set({ flipHorizontalAxial: flip }),
  setFlipVerticalAxial: (flip) => set({ flipVerticalAxial: flip }),
  setFlipHorizontalSagittal: (flip) => set({ flipHorizontalSagittal: flip }),
  setFlipVerticalSagittal: (flip) => set({ flipVerticalSagittal: flip }),
  setFlipHorizontalCoronal: (flip) => set({ flipHorizontalCoronal: flip }),
  setFlipVerticalCoronal: (flip) => set({ flipVerticalCoronal: flip }),
})); 