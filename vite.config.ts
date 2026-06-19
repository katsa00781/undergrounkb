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
    // Fixed app port; HMR runs over the same port via WS upgrade (no separate
    // fixed HMR port, ami több párhuzamos dev szerver esetén ütközne).
    port: 5173,
    // strictPort: ha az 5173 foglalt (pl. már fut egy dev szerver), a második
    // indítás EADDRINUSE hibával álljon le, ne ugorjon csendben másik portra.
    strictPort: true,
    // HMR configuration
    hmr: {
      overlay: true,
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
