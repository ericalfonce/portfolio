import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    testTimeout: 15_000,
    setupFiles: ['./src/test-setup.js'],
    // .claude/worktrees/** holds leftovers from an abandoned branch checkout.
    // Scanning it runs tests against code that is not part of this app.
    include: ['src/**/*.test.js'],
  },
});
