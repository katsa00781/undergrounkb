import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Include .tsx files
      include: '**/*.{jsx,tsx}',
      // Better error overlay
      jsxRuntime: 'automatic',
    })
  ],
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
      // Force client reload on errors
      clientPort: 24678,
    },
    // Force reload on file changes
    watch: {
      usePolling: true,
      interval: 500,
      // Watch specific directories
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    // Cors configuration for better dev experience
    cors: true,
    // Force page reload for certain file changes
    middlewareMode: false,
    // Strict port for consistency
    strictPort: false,
    // Open browser automatically
    open: false,
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
