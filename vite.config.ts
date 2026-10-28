import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Find an installed package folder by walking up node_modules, so sites in an
// npm/pnpm workspace (where dependencies are hoisted) resolve it too.
function findPackageDir(name: string): string {
  let dir = __dirname;
  for (;;) {
    const candidate = resolve(dir, 'node_modules', name);
    if (existsSync(resolve(candidate, 'package.json'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return resolve(__dirname, 'node_modules', name);
    dir = parent;
  }
}

function readThemeFontSnippet(): string {
  const snippetPath = resolve(__dirname, 'src/lib/generated/papers-theme-fonts.html');
  if (!existsSync(snippetPath)) {
    return '';
  }
  return readFileSync(snippetPath, 'utf8').trim();
}

function readThemeColorModeAttributes(): string {
  const manifestPath = resolve(__dirname, 'src/lib/generated/papers-theme.json');
  if (!existsSync(manifestPath)) {
    return '';
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const mode = manifest.defaultColorMode === 'light' ? 'light' : 'dark';
  const toggle = manifest.features?.lightDarkToggle === false ? 'off' : 'on';
  return ` data-default-color-mode="${mode}" data-color-mode-toggle="${toggle}"`;
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'papers-theme-fonts',
      transformIndexHtml(html) {
        const fonts = readThemeFontSnippet();
        if (!fonts) {
          return html;
        }
        return html.replace('<head>', `<head>\n${fonts}`);
      },
    },
    {
      // theme-init.js reads these before React loads, so light themes do not flash dark.
      name: 'papers-theme-color-mode',
      transformIndexHtml(html) {
        return html.replace(/<html\b/, `<html${readThemeColorModeAttributes()}`);
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@app-shared/documentation-config.js': resolve(__dirname, './shared/documentation-config.js'),
      '@scalar/api-reference': resolve(findPackageDir('@scalar/api-reference'), 'esm.js'),
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
    // Never inline fonts: the shipped CSP font-src blocks data: URLs (KaTeX math fonts).
    assetsInlineLimit: (filePath: string) =>
      /\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
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
            if (/node_modules\/(react|react-dom|scheduler)(\/|$)/.test(id)) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@iconify')) {
              return 'vendor-iconify';
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
