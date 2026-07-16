import { defineConfig } from 'playwright/test';

/**
 * STORY-12.W2.1 (AC5) — config compartilhada do Playwright do Studio.
 *
 * Os projetos `desktop`/`mobile` cobrem exclusivamente
 * `e2e/campaign-readiness-gate.spec.ts` (via `testMatch`) nos dois viewports
 * exigidos pela ADR-002 ("Playwright desktop/mobile"). O projeto `default`
 * roda todo o restante (`e2e/traffic-squad.spec.ts` incluso) sem viewport
 * fixo, para que `npm run test:e2e:traffic` (que já gerencia seu próprio
 * baseURL/servidores e viewport via `page.setViewportSize`) continue rodando
 * exatamente como antes, sem duplicar execução quando invocado sem
 * `--project`. `campaign-readiness-gate.spec.ts` sobe/derruba seu próprio
 * servidor Vite em modo demo dentro do próprio spec (mesmo padrão de
 * `traffic-squad.spec.ts`), então nenhum `webServer` global é necessário
 * aqui.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: 'line',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'default',
      testIgnore: /campaign-readiness-gate\.spec\.ts/,
    },
    {
      name: 'desktop',
      testMatch: /campaign-readiness-gate\.spec\.ts/,
      use: { viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: /campaign-readiness-gate\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
