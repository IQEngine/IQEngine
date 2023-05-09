import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {},
  },
  server: {
    port: 3000,
    open: true,
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
  },
  plugins: [react(), viteTsconfigPaths(), svgrPlugin(), envCompatible()],
});
