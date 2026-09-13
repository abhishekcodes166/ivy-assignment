import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Vite only exposes VITE_-prefixed variables, but the investigation scripts and
  // the Vercel project both use the unprefixed names. Accept either spelling so
  // one set of variables serves the whole repo.
  const env = { ...loadEnv(mode, path.resolve(__dirname, '..'), ''), ...loadEnv(mode, __dirname, ''), ...process.env };

  const apiKey = env.VITE_API_KEY ?? env.API_KEY ?? '';
  const baseUrl = env.VITE_API_BASE_URL ?? env.BASE_URL ?? 'https://solve.ivy.homes';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    define: {
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(baseUrl),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
