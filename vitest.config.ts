import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    // Test cô lập tenant dùng chung DB -> tránh chạy song song giữa các file.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
