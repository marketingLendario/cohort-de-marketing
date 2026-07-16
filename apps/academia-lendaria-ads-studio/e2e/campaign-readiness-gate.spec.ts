import { spawn, type ChildProcess } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from 'playwright/test';

/**
 * E2E do gate de campanhas (STORY-12.W2.1 — AC5).
 *
 * Sobe seu próprio servidor Vite em modo demo (mesmo padrão de
 * `traffic-squad.spec.ts`: sem BFF/Supabase real — `VITE_DEMO_AUTH=true` já
 * vem de `.env.local`) e assina o operador via os mesmos dados do fixture
 * demo (`src/lib/demo-mode.ts`/`src/stores/project-store.ts` — reproduzidos
 * aqui como literais para não importar código de app dentro do runtime do
 * Playwright, mesmo padrão de `TRAFFIC_PILOT` em `traffic-squad.spec.ts`).
 *
 * O fixture demo naturalmente produz um projeto MISTO — `campaign.create`
 * pronta, `campaign.tracking`/`campaign.brief` prontas com ressalvas,
 * `campaign.structure`/`campaign.measure`/`campaign.diagnose` bloqueadas por
 * artefatos de tráfego ausentes (nenhum run real de zelador/briefista/
 * estruturador no fixture) — então o painel de prontidão (AC3) mostra
 * lacunas REAIS sem precisar fabricar um projeto "quebrado" à parte, e o CTA
 * de criação (AC4) fica habilitado (só `campaign.create` bloqueia o draft
 * mínimo, por invariante do ADR-002).
 *
 * Cobertura de `aria-disabled`/CTA de correção do nav bloqueado (AC1) fica
 * pelos testes de componente (`campaign-readiness-panel.test.tsx`): o fixture
 * demo tem projeto+nome válidos, então `campaign.create` nunca bloqueia via
 * navegação real nesta suíte — o guard de rota
 * (`src/routes/projects/$projectId.tsx`) já intercepta projeto inexistente
 * antes do shell montar, e o fixture demo não permite simular nome vazio sem
 * mexer no store por fora do file_scope desta story.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');

const DEMO_EMAIL = 'demo@academialendaria.local'; // fonte: src/lib/demo-mode.ts (DEMO_EMAIL)
const DEMO_PASSWORD = 'adsfactory'; // fonte: src/lib/demo-mode.ts (DEMO_PASSWORD)
const DEMO_PROJECT_ID = 'demo-project-academia-lendaria'; // fonte: src/stores/project-store.ts (DEMO_PROJECT_ID)

type Service = ChildProcess & { captured?: string };

let vite: Service | undefined;
let baseURL = '';

function launch(command: string, args: string[], env: NodeJS.ProcessEnv): Service {
  const child = spawn(command, args, { cwd: appRoot, env, stdio: ['ignore', 'pipe', 'pipe'] }) as Service;
  child.captured = '';
  child.stdout?.on('data', (chunk) => { child.captured += chunk.toString(); });
  child.stderr?.on('data', (chunk) => { child.captured += chunk.toString(); });
  return child;
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'sem resposta';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Servidor Vite não iniciou em ${url}: ${lastError}${vite?.captured ? `\n${vite.captured.slice(-2000)}` : ''}`);
}

async function stop(child: Service | undefined): Promise<void> {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  await new Promise<void>((resolvePromise) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolvePromise(); }, 5_000);
    child.once('exit', () => { clearTimeout(timer); resolvePromise(); });
  });
}

// eslint-disable-next-line no-empty-pattern -- Playwright exige a assinatura `({ }, testInfo)`; o parser de fixtures do runner inspeciona a desestruturação literal.
test.beforeAll(async ({}, testInfo) => {
  const port = 5190 + testInfo.parallelIndex;
  baseURL = `http://127.0.0.1:${port}`;
  vite = launch('npm', ['run', 'dev', '--', '--port', String(port), '--host', '127.0.0.1', '--strictPort'], { ...process.env });
  await waitForServer(baseURL);
});

test.afterAll(async () => {
  await stop(vite);
});

async function signInDemo(page: Page): Promise<void> {
  await page.goto(`${baseURL}/projects`);
  const email = page.getByLabel('E-mail');
  const projectsHeading = page.getByRole('heading', { name: /Seus projetos/i });
  // A primeira navegação após o cold start do Vite pode demorar a transformar
  // módulos — espera por QUALQUER um dos dois estados possíveis (tela de
  // login ou já autenticado) antes de decidir o próximo passo, em vez de
  // assumir que `isVisible()` já reflete o DOM final logo após o `goto`.
  await Promise.race([
    email.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined),
    projectsHeading.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined),
  ]);
  if (await email.isVisible().catch(() => false)) {
    await email.fill(DEMO_EMAIL);
    await page.getByLabel('Senha').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  }
  await expect(projectsHeading).toBeVisible({ timeout: 20_000 });
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

test.describe('Campaign readiness gate (STORY-12.W2.1)', () => {
  test('AC3/AC4: painel lista as lacunas reais e o CTA de criação continua habilitado (campaign.create pronta)', async ({ page }) => {
    await signInDemo(page);
    await page.goto(`${baseURL}/projects/${DEMO_PROJECT_ID}/campaigns`);
    await expect(page.getByRole('heading', { name: /Campanhas do projeto/i })).toBeVisible({ timeout: 15_000 });

    const panel = page.getByTestId('campaign-readiness-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-panel-state', 'blocked');
    // campaign.create especificamente segue permitida — só ela impede o draft mínimo (ADR-002).
    await expect(panel).toHaveAttribute('data-capability-allowed', 'true');

    // AC3 — cada lacuna com fonte + ação inline/âncora.
    const structureGap = page.getByTestId('campaign-readiness-capability-campaign.structure');
    await expect(structureGap).toContainText('Bloqueada');
    await expect(structureGap.getByText('Artefato', { exact: true }).first()).toBeVisible();
    const fixLink = structureGap.getByRole('link', { name: /Corrigir/i }).first();
    await expect(fixLink).toBeVisible();

    // AC4 — CTA de criação continua habilitado (draft mínimo não depende de tracking/brief).
    const toggle = page.getByRole('button', { name: /Nova campanha/i });
    await expect(toggle).toBeEnabled();

    await assertNoHorizontalOverflow(page);
  });

  test('AC2: Visão geral e Campanhas expõem o mesmo snapshot de campaign.create para a mesma revisão', async ({ page }) => {
    await signInDemo(page);
    await page.goto(`${baseURL}/projects/${DEMO_PROJECT_ID}/campaigns`);
    const panel = page.getByTestId('campaign-readiness-panel');
    await expect(panel).toBeVisible();
    const panelFingerprint = await panel.getAttribute('data-fingerprint');
    const panelAllowed = await panel.getAttribute('data-capability-allowed');

    await page.goto(`${baseURL}/projects/${DEMO_PROJECT_ID}/overview`);
    const overviewCard = page.getByTestId('project-overview-campaign-readiness');
    await expect(overviewCard).toBeVisible();
    expect(await overviewCard.getAttribute('data-fingerprint')).toBe(panelFingerprint);
    expect(await overviewCard.getAttribute('data-capability-allowed')).toBe(panelAllowed);
  });

  test('AC5: link "Campanhas" é alcançável e ativável por teclado a partir da Visão geral', async ({ page }) => {
    await signInDemo(page);
    await page.goto(`${baseURL}/projects/${DEMO_PROJECT_ID}/overview`);
    await expect(page.getByRole('heading', { name: /Próximo passo do projeto/i })).toBeVisible({ timeout: 15_000 });

    const campaignsLink = page.getByRole('link', { name: 'Campanhas', exact: true }).first();
    await campaignsLink.focus();
    await expect(campaignsLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /Campanhas do projeto/i })).toBeVisible({ timeout: 15_000 });

    await assertNoHorizontalOverflow(page);
  });
});
