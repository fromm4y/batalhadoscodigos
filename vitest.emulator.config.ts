import { defineConfig } from 'vitest/config';

/** Testes que rodam dentro dos emuladores (regras do Firestore e rotas da API): `npm run test:emu`. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
