import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// base: './' is mandatory — the UI is served via reverse proxy at
// /apps/{name}/, so assets must use relative paths or they 404.
// outDir writes the build straight into the Python-served ui/ dir.
// Two entries: index.html (desktop) + mobile.html (mobile). Vite preserves
// each HTML filename in the output, so the server serves / for desktop and
// /mobile for mobile.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../ui',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        mobile: fileURLToPath(new URL('./mobile.html', import.meta.url)),
      },
    },
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
