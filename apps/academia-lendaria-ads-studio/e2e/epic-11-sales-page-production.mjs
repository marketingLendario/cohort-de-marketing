import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { salesPageHtml } from '../../../scripts/lib/html-templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence/epic-11');
const label = process.env.SALES_PAGE_LABEL ?? 'sales-page-production';
const htmlPath = resolve(evidenceDir, `${label}.html`);
const sectionOrder = ['hero', 'vsl', 'primary-cta', 'mechanism', 'offer', 'pricing', 'proof', 'benefits', 'bonuses', 'guarantee', 'urgency', 'faq', 'checkout', 'final-cta', 'footer'];
const generatedHtml = salesPageHtml({
  headline: 'Como construir uma rotina sustentável em 90 dias sem viver de restrição',
  sub: 'Um plano acompanhado para mulheres 35+ que buscam consistência.',
  bullets: [
    'Organize sua semana com um ritual de 12 minutos',
    'Aprenda a adaptar a rotina aos dias mais corridos',
    'Acompanhe o progresso sem promessas de resultado garantido',
    'Tenha apoio para manter os hábitos depois do ciclo',
    'Acesse os materiais em qualquer dispositivo',
  ],
  priceOld: '2.935',
  priceNow: '497',
  faq: [
    { q: 'Quanto tempo preciso por dia?', a: 'A rotina começa com 12 minutos e pode ser adaptada.' },
    { q: 'Como funciona a garantia?', a: 'Os termos explicam o prazo e o processo de solicitação.' },
    { q: 'É acompanhamento médico?', a: 'Não. O programa é educacional e não substitui atendimento profissional.' },
  ],
});
const html = process.env.SALES_PAGE_SOURCE
  ? await readFile(resolve(process.env.SALES_PAGE_SOURCE), 'utf8')
  : generatedHtml;

await mkdir(evidenceDir, { recursive: true });
await writeFile(htmlPath, html, 'utf8');

const evidence = { schemaVersion: '1.0.0', generatedAt: new Date().toISOString(), scenarios: [] };
const browser = await chromium.launch({ headless: true });
try {
  for (const scenario of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const context = await browser.newContext({ viewport: scenario.viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`));
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    const layout = await page.evaluate((expected) => {
      const sections = [...document.querySelectorAll('[data-section]')];
      const names = sections.map((section) => section.getAttribute('data-section'));
      const vsl = document.querySelector('[data-section="vsl"]');
      const cta = document.querySelector('[data-section="primary-cta"]');
      const vslRect = vsl?.getBoundingClientRect();
      const ctaRect = cta?.getBoundingClientRect();
      const interactive = {
        formFields: [...document.querySelectorAll('form input')].map((input) => input.getAttribute('name')),
        brokenHashCtas: document.querySelectorAll('a[href="#"]').length,
        events: (window.dataLayer ?? []).map((entry) => typeof entry === 'string' ? entry : entry.event),
      };
      return {
        sectionOrder: names,
        correctOrder: JSON.stringify(names) === JSON.stringify(expected),
        ctaImmediatelyAfterVsl: vsl?.nextElementSibling === cta,
        ctaBelowVsl: Boolean(vslRect && ctaRect && ctaRect.top >= vslRect.bottom),
        vslBottom: vslRect?.bottom ?? null,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        interactive,
      };
    }, sectionOrder);
    if (!layout.correctOrder || !layout.ctaImmediatelyAfterVsl || !layout.ctaBelowVsl) throw new Error(`${scenario.name}: ordem da página inválida`);
    if (scenario.name === 'mobile' && (layout.vslBottom === null || layout.vslBottom > scenario.viewport.height)) throw new Error(`mobile: vídeo fora da primeira dobra (${layout.vslBottom})`);
    if (layout.horizontalOverflow) throw new Error(`${scenario.name}: overflow horizontal`);
    if (layout.interactive.brokenHashCtas !== 0) throw new Error(`${scenario.name}: CTA href="#"`);
    if (!['name', 'email', 'phone'].every((field) => layout.interactive.formFields.includes(field))) throw new Error(`${scenario.name}: formulário incompleto`);
    if (!['PageView', 'ViewContent'].every((event) => layout.interactive.events.includes(event))) throw new Error(`${scenario.name}: tracking inicial incompleto`);
    if (consoleErrors.length || pageErrors.length || requestFailures.length) throw new Error(`${scenario.name}: erros de runtime`);
    const screenshot = `${label}-${scenario.name}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    evidence.scenarios.push({ ...scenario, screenshot, layout, consoleErrors, pageErrors, requestFailures });
    await context.close();
  }
  await writeFile(resolve(evidenceDir, `${label}.json`), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
