/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { vercelApiDev } from './scripts/vite-api-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiDev()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // RN anti-trapaça (8.3): build minificado e sem sourcemap público.
    minify: true,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
});
