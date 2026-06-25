import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest konfiguráció — a unit tesztek a node környezetben futnak (tiszta
// üzleti logika: generátor + taxonómia helperek), nincs szükség DOM-ra.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
});
