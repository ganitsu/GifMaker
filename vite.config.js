import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // esto es CLAVE
    port: 5173,
     proxy: {
      '/process-image': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path,  // opcional si no quieres cambiar el path
      }
    }
  }
});

