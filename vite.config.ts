import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    // HMR configuration
    hmr: {
      overlay: true,
      port: 24678,
    },
    // Force reload on file changes
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Cors configuration for better dev experience
    cors: true,
    // Force page reload for certain file changes
    middlewareMode: false,
  },
  // Build optimizations
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  // Clear cache on restart
  clearScreen: false,
});
