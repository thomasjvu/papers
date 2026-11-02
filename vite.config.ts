import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
    {
      name: 'papers-javascript-budgets',
      generateBundle(_options, bundle) {
        const records = [];
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue;
          const parser = chunk.moduleIds.some((id) => id.includes('/@mermaid-js/parser/'));
          const limit = parser ? 700_000 : 600_000;
          const bytes = Buffer.byteLength(chunk.code, 'utf8');
          records.push({
            file: chunk.fileName,
            bytes,
            limit,
            category: parser ? 'mermaid-parser' : 'application',
          });
          if (bytes > limit)
            this.error(
              `${chunk.fileName}: ${bytes} bytes exceeds the ${limit}-byte ${parser ? 'Mermaid parser' : 'application'} budget`
            );
        }
        this.emitFile({
          type: 'asset',
          fileName: 'bundle-budget.json',
          source: JSON.stringify({ version: 1, chunks: records }, null, 2) + '\n',
        });
      },
    },
    {
      // Zod quotes the pure-call marker in prose comments. Keep real optimization
      // annotations intact while preventing Rollup from interpreting that prose.
      name: 'zod-comment-annotations',
      enforce: 'pre',
      transform(code, id) {
        if (!/node_modules\/zod\/v4\/core\/(util|regexes)\.js$/.test(id)) return;
        const transformed = code.replace(/`@__PURE__`/g, '`pure-call`');
        return transformed === code ? undefined : { code: transformed, map: null };
      },
    },
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
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: true,
    minify: 'terser',
    terserOptions: { maxWorkers: 1, compress: { passes: 2 } },
    // The budget plugin enforces 600 kB except the generated Mermaid parser (700 kB).
    chunkSizeWarningLimit: 700,
    // Never inline fonts: the shipped CSP font-src blocks data: URLs (KaTeX math fonts).
    assetsInlineLimit: (filePath: string) =>
      /\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        // Preserve the optional viewer's stable chunk prefix for preloads and browser checks.
        chunkFileNames: (chunk) =>
          chunk.name === 'scalar-api-reference' ||
          chunk.facadeModuleId?.endsWith('/@scalar/api-reference/dist/index.js')
            ? 'assets/esm-[hash].js'
            : 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (/[?&]inline(?:&|$)/.test(id)) return;
            const dependency = id.split('/node_modules/').pop() || '';
            const highlight = dependency.split('/').pop() || '';
            if (
              dependency.startsWith('@scalar/code-highlight/dist/chunks/') &&
              ['markdown.js', 'shared-lowlight.js', 'languages.js', 'rehype-highlight.js'].includes(
                highlight
              )
            ) {
              return 'scalar-highlight-' + highlight.slice(0, -3);
            }
            if (dependency.startsWith('@scalar/'))
              return dependency.split('/').slice(0, 2).join('-').replace('@', '');
            if (/^(@ai-sdk\/|ai\/)/.test(dependency)) return 'vendor-ai';
            if (dependency.startsWith('zod/')) return 'vendor-zod';
            if (dependency.startsWith('tailwind-merge/')) return 'vendor-tailwind-merge';
            if (dependency.startsWith('@vueuse/')) return 'vendor-vueuse';

            if (/^(vue\/|@vue\/)/.test(dependency)) return 'vendor-vue';
            if (/^(@codemirror\/|codemirror\/)/.test(dependency)) return 'vendor-codemirror';
            if (/^@lezer\//.test(dependency)) return 'vendor-lezer';
            if (/^(lodash-es\/|lodash\/)/.test(dependency)) return 'vendor-lodash';
            if (/^(@dagrejs\/|dagre-d3-es\/|dagre\/|graphlib\/)/.test(dependency))
              return 'vendor-graph-layout';
            if (/^d3-[^/]+\//.test(dependency)) return 'vendor-d3';

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
