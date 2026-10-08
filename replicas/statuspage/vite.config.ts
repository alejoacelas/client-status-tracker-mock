import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5301, strictPort: true },
  preview: { port: 5301, strictPort: true },
})
