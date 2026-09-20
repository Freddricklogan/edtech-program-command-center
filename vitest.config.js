import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.js'],
      // The DOM layer is covered by the browser smoke test, not by unit tests.
      exclude: ['src/main.js', 'src/ui.js', 'src/exec-shell.js']
    }
  }
});
