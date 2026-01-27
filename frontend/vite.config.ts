import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/node-proxy': {
        target: process.env.VITE_LINERA_TARGET_URL || 'https://testnet-conway.linera.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/node-proxy/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['@linera/client'],
  },
});
