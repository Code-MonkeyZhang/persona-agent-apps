import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Design demo of the current app UI. src/app is a verbatim copy of web/src
// (only useHealthData.ts differs: static snapshot instead of the WS server).
// The '@' alias points into the copied app so its internal imports resolve.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  base: './',
})
