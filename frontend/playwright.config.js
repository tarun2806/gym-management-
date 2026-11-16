import process from 'node:process';
import { defineConfig } from '@playwright/test';

// E2E_PORT lets the suite run on a dedicated Vite port (e.g. 5174) so the
// developer's own dev server on 5173 is untouched. The spawned dev server
// inherits VITE_API_BASE_URL, so pair it with the isolated test backend:
//   E2E_PORT=5174 VITE_API_BASE_URL=http://localhost:8091 \
//   E2E_API_BASE_URL=http://localhost:8091 npx playwright test
const PORT = process.env.E2E_PORT || '5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
