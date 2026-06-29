import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/runtime/**/__tests__/**/*.test.ts',
      'src/lib/**/__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'shared/types': path.resolve(__dirname, '../shared/src/types'),
      'shared/components': path.resolve(__dirname, '../shared/src/components'),
    },
  },
});
