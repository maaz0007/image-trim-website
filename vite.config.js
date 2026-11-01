import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf': ['jspdf', 'pdf-lib', 'pdfjs-dist'],
          'vendor-utils': ['jszip', 'file-saver', 'canvas-confetti', 'lucide-react']
        }
      }
    }
  }
});
