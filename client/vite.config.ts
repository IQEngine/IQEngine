/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';

// react-plotly.js pulls in plotly's prebuilt dist, so this one package is the
// whole ~4.7 MB of it.
const PLOTLY = /node_modules\/plotly\.js\//;

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const mdx = await import('@mdx-js/rollup');
  return {
    define: {
      'process.env': {},
    },
    envPrefix: 'IQENGINE_',
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
        },
      },
    },
    preview: {
      port: 3001,
      open: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        './runtimeConfig': './runtimeConfig.browser',
      },
    },
    build: {
      outDir: 'build',
      // if tou change the sourcemap to true you need to also increate the max heap size
      // export NODE_OPTIONS=--max-old-space-size=32768
      sourcemap: false,
      rollupOptions: {
        output: {
          // Plotly is ~4.7 MB, more than the rest of the app put together, and
          // only the Time/Frequency/IQ tabs and the browser's annotation pie
          // chart draw with it. Those import it lazily, but that alone does not
          // defer the download: rollup otherwise merges plotly into a chunk the
          // entry needs, so every page pulled all of it before drawing
          // anything.
          manualChunks(id) {
            // Plotly's dist is CommonJS, so the interop helpers end up in its
            // chunk -- and since every other CJS dependency shares those
            // helpers, the entry then has to import that chunk, all 4.7 MB of
            // it. Giving the helpers a chunk of their own breaks that tie.
            if (id.includes('commonjsHelpers')) return 'commonjs-helpers';
            if (PLOTLY.test(id)) return 'plotly';
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react/jsx-runtime'],
    },
    plugins: [react(), viteTsconfigPaths(), svgrPlugin(), envCompatible(), mdx.default({ remarkPlugins: [] })],
    test: {
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      environment: 'jsdom',
      deps: {
        inline: ['vitest-canvas-mock'],
      },
    },
  };
});
