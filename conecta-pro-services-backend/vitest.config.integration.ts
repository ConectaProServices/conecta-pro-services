import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Testes de integração com PostgreSQL real (banco exclusivo de testes, variáveis TEST_DB_*).
// Separados da suíte unitária (pnpm test) e do E2E (pnpm test:e2e).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.integration-spec.ts'],
    fileParallelism: false,
  },
});
