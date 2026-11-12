import { defineConfig } from 'vitest/config';

/** Testes das regras do Firestore. Rodam dentro do emulador: `npm run test:rules`. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
