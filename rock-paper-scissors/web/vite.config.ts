import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' is mandatory — the UI is served via reverse proxy at
// /apps/{name}/, so assets must use relative paths or they 404.
// outDir writes the build straight into the Python-served ui/ dir.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../ui',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3850',
        ws: true,
      },
    },
  },
})
