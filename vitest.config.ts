import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    execArgv: ['--env-file=.env.test'],
    globals: true,
    globalSetup: ['./test/env.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
    },
  },
});
