import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', testTimeout: 30000, hookTimeout: 60000, include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
});
