import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dataEditorPlugin } from './tools/vite-data-editor-plugin';

// base: './' keeps every asset path relative, so the built site works from any
// folder or sub-path (Netlify, Vercel, GitHub Pages, cPanel, or opened locally via a static server).
export default defineConfig({
  base: './',
  plugins: [react(), dataEditorPlugin()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three') || id.includes('three-stdlib') || id.includes('camera-controls')) return 'r3f';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
