import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@kitware/vtk.js')) {
            return 'vtk';
          }
          if (id.includes('node_modules/@cornerstonejs')) {
            return 'cornerstone';
          }
        }
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  }
})
