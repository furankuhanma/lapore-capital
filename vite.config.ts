import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Helps with debugging
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent chunk splitting issues
      },
    },
  },
  base: '/', // Important for correct asset paths
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});