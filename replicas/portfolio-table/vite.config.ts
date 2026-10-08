import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5307, strictPort: true },
  preview: { port: 5307, strictPort: true },
});
