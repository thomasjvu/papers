import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-syntax-highlighter')) {
              return 'vendor-syntax';
            }
            if (id.includes('marked')) {
              return 'vendor-markdown';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@iconify')) {
              return 'vendor-iconify';
            }
            if (id.includes('dompurify')) {
              return 'vendor-sanitize';
            }
          }
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    pure: ['console.log', 'console.info', 'console.debug'],
  },
  server: {
    port: 3333,
    open: false,
  },
  preview: {
    port: 3333,
  },
});
