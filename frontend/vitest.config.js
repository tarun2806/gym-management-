import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test-only Vite config. Production build uses vite.config.js.
// Keeping these separate ensures a test-only environment change (jsdom,
// globals, setup file) never leaks into the shipped bundle.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/vite-env.d.ts',
      ],
    },
  },
});
