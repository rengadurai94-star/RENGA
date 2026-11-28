import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { dataEditorPlugin } from './tools/vite-data-editor-plugin';

/** Hosted-page build (`npm run build:artifact`): Google Fonts link instead of bundled font files. */
function googleFontsLink(): Plugin {
  return {
    name: 'spr-google-fonts',
    transformIndexHtml: () => [
      { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }, injectTo: 'head' },
      {
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Manrope:wght@400..700&display=swap',
        },
        injectTo: 'head',
      },
    ],
  };
}

// base: './' keeps every asset path relative, so the built site works from any
// folder or sub-path (Netlify, Vercel, GitHub Pages, cPanel, or a static server).
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    base: './',
    plugins: [react(), dataEditorPlugin(), ...(artifact ? [googleFontsLink()] : [])],
    resolve: artifact ? { alias: [{ find: /^@fontsource.*$/, replacement: path.resolve(__dirname, 'src/styles/empty.css') }] } : undefined,
    build: {
      target: 'es2022',
      outDir: artifact ? 'dist-artifact' : 'dist',
      chunkSizeWarningLimit: 1400,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three/')) return 'three';
            if (id.includes('@react-three') || id.includes('three-stdlib') || id.includes('camera-controls')) return 'r3f';
            if (id.includes('node_modules/gsap')) return 'gsap';
          },
        },
      },
    },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
  };
});
