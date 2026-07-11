import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import {
  DOCUMENT_PACK_FIXTURE,
  createDocumentPackFixture,
} from './fixtures/document-pack/fixture.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence', 'epic-11', 'document-pack-parity');
const contracts = JSON.parse(await readFile(resolve(appRoot, '..', '..', 'data', 'document-pack-contracts.json'), 'utf8'));
const skills = ['offerbook', 'copy-funil', 'pagina-vendas-funil'];

const OPERATOR_INPUT = Object.freeze({
  offerbook: [
    'Use os insumos confirmados da Academia Fit e consolide o Método Consistência 90.',
    'Preço: R$ 497. Garantia: 30 dias conforme os termos da oferta.',
    'Não trate a história de Maria nem resultados de peso como prova confirmada; marque provas reais como pendentes.',
    'Use linguagem de possibilidade para saúde, sem promessa clínica ou de resultado garantido.',
    'Os três bônus listados já existem no projeto e podem ser entregues.',
    'O responsável técnico não foi informado: mantenha-o pendente e bloqueie a publicação até regularização.',
  ].join(' '),
  'copy-funil': [
    'Produza a fundação de copy para público frio, consciente do problema, em mercado sofisticado.',
    'Aprovo o offerbook confirmado como base da copy.',
    'Decisão canônica Q2: 4 Cético. Decisão canônica Q5: 5 Landing Page.',
    'Big idea: parar de recomeçar toda segunda-feira. Mecanismo: Ciclo de 3 Fases.',
    'O funil recomendado é quiz seguido de página de vendas e checkout.',
    'Não invente depoimentos, métricas, especialistas, urgência ou alegações médicas.',
  ].join(' '),
  'pagina-vendas-funil': [
    'Produza a página completa e autocontida para o Método Consistência 90 seguindo o contrato sales-page-v1.',
    'CTA: Começar meu ciclo de 90 dias. Destino: https://fixture.local/academia-fit/checkout.',
    'Use o DESIGN.md confirmado. Deixe Pixel e GTM documentados sem IDs fictícios.',
    'Não invente provas, escassez, métricas nem promessas clínicas.',
    'Não exiba os termos internos “ancoragem” ou “escassez” na página.',
    'Todo CTA deve usar a URL real do checkout e o formulário deve declarar action="https://fixture.local/academia-fit/checkout".',
  ].join(' '),
});

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function continuationText(skillId, result) {
  const answers = result.proposal.questions.map((question) => answerQuestion(skillId, question));
  return [
    `CONTINUAÇÃO DE ELICITAÇÃO DA SKILL ${skillId}.`,
    `Resumo do checkpoint anterior: ${result.proposal.summary || 'sem resumo'}.`,
    'Use as respostas abaixo como decisões explícitas do operador. Não repita perguntas já respondidas.',
    ...result.proposal.questions.map((question, index) => `${index + 1}. ${question}\nResposta: ${answers[index]}`),
    'Se ainda faltar uma decisão indispensável, retorne somente as novas perguntas. Caso contrário, produza o pack final completo.',
  ].join('\n\n');
}

function answerQuestion(skillId, question) {
  const normalized = question.toLowerCase();
  if (/\bq2\b/.test(normalized) && /\bq5\b/.test(normalized)) return 'Q2: 4 Cético. Q5: 5 Landing Page.';
  if (/\bq2\b|sofisticação/.test(normalized)) return '4 Cético.';
  if (/\bq5\b|peça principal|landing page/.test(normalized)) return '5 Landing Page.';
  if (/fase 3|headlines.*bullets|bullets.*headlines/.test(normalized)) return 'aprovar Fase 3';
  if (/big idea|mecanismos|arquitetura de prova/.test(normalized) && /aprova|aprovação/.test(normalized)) return 'aprovar';
  if (/offerbook/.test(normalized) && /aprova|aprovação/.test(normalized)) return 'Aprovo o offerbook final como base da copy.';
  if (/aprova|aprovação|aprovar o briefing/.test(normalized)) {
    return skillId === 'offerbook'
      ? 'Sim, aprovo o briefing consolidado para virar offerbook, mantendo provas não verificadas como pendentes e sem alegações factuais de resultado.'
      : 'aprovar';
  }
  if (/bônus|checklist semanal|e-book anti-sanfona|workbook fase 1|capacidade.*entrega/.test(normalized)) {
    return 'Checklist semanal anti-sanfona: sim; E-book Anti-Sanfona: sim; Workbook Fase 1: sim. Os três entregáveis já existem no projeto.';
  }
  if (/responsável técnico|crm|conselho|registro profissional/.test(normalized)) {
    return 'Manter responsável técnico pendente e bloquear publicação.';
  }
  if (/preço-âncora|ancoragem/.test(normalized)) return 'Preço-âncora: R$ 2.935, conforme o offerbook-fonte confirmado.';
  if (/preço|valor|ticket|investimento/.test(normalized)) return 'R$ 497 à vista; não inventar parcelamento.';
  if (/garantia/.test(normalized)) return '30 dias, conforme os termos da oferta, sem adicionar condições não fornecidas.';
  if (/prova|depoimento|resultado|caso/.test(normalized)) return 'Não há prova verificável anexada. Marcar como pendente e não publicar alegação factual.';
  if (/escassez|urgência|prazo|vaga/.test(normalized)) return 'Não usar escassez ou prazo sem confirmação documental.';
  if (/url|link|checkout|cta|destino/.test(normalized)) return 'CTA: Começar meu ciclo de 90 dias. URL: https://fixture.local/academia-fit/checkout.';
  if (/público|avatar|audiência/.test(normalized)) return 'Mulheres 35+ com rotina cheia, histórico de efeito sanfona e desconfiança de promessas rápidas.';
  if (/mecanismo|método/.test(normalized)) return 'Ciclo de 3 Fases: Desinflamar, Reprogramar e Manter.';
  if (/tom|voz|linguagem/.test(normalized)) return 'Voz da marca, acolhedora e direta, com linguagem de possibilidade e sem alegação médica.';
  return `${OPERATOR_INPUT[skillId]} Se a informação pedida não estiver nos arquivos confirmados, marque-a como pendente em vez de inventar.`;
}

async function localRunnerToken() {
  const { stdout: pidOutput } = await execFileAsync('lsof', ['-tiTCP:3002', '-sTCP:LISTEN']);
  const pid = pidOutput.trim().split('\n')[0];
  if (!pid) throw new Error('BFF não está escutando na porta 3002.');
  const { stdout } = await execFileAsync('ps', ['eww', '-p', pid, '-o', 'command='], { maxBuffer: 2_000_000 });
  const token = stdout.match(/(?:^|\s)LOCAL_SKILL_RUNNER_TOKEN=([^\s]+)/)?.[1];
  if (!token) throw new Error('O processo do BFF não expõe LOCAL_SKILL_RUNNER_TOKEN.');
  return token;
}

async function contextArtifacts(fixture, surface) {
  const projectId = fixture.surfaces[surface].projectId;
  const { data, error } = await fixture.admin.from('project_artifacts')
    .select('artifact_type, title, path, format, content, verification')
    .eq('project_id', projectId)
    .eq('verification', 'confirmed')
    .order('path', { ascending: true });
  if (error) throw new Error(`Falha lendo contexto ${surface}: ${error.message}`);
  return (data ?? []).filter((artifact) => typeof artifact.content === 'string' && !['pdf', 'docx'].includes(artifact.format));
}

async function runCliCommand(args, env, allowNeedsInput = false) {
  try {
    await execFileAsync('npm', ['run', 'skill:cli', '--', ...args], {
      cwd: appRoot,
      env,
      maxBuffer: 20_000_000,
      timeout: 20 * 60_000,
    });
  } catch (error) {
    if (!(allowNeedsInput && error?.code === 3)) throw error;
  }
}

async function runCliProposalWithRetry(fixture, skillId, args, outputPath, env) {
  try {
    await runCliCommand(args, env, true);
    return outputPath;
  } catch (originalError) {
    const { data: run, error } = await fixture.admin.from('skill_runs')
      .select('id, status, input_snapshot')
      .eq('project_id', fixture.surfaces.cli.projectId)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const jobId = run?.input_snapshot?.jobId;
    if (error || run?.status !== 'failed' || typeof jobId !== 'string') throw originalError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const retryOutput = outputPath.replace(/\.json$/, `-retry-${attempt}.json`);
      try {
        await runCliCommand([
          '--retry-run', run.id,
          '--job', jobId,
          '--workspace', fixture.workspaceId,
          '--output', retryOutput,
        ], env, true);
        return retryOutput;
      } catch (retryError) {
        if (attempt === 2) throw retryError;
      }
    }
    throw originalError;
  }
}

async function runCliSkill(fixture, skillId, env) {
  const inputPath = resolve(evidenceDir, `cli-${skillId}-input.json`);
  let outputPath = resolve(evidenceDir, `cli-${skillId}-proposal-r1.json`);
  let payload = {
    workspaceId: fixture.workspaceId,
    projectId: fixture.surfaces.cli.projectId,
    brief: fixture.briefFor('cli'),
    context: { artifacts: await contextArtifacts(fixture, 'cli') },
    operatorInput: OPERATOR_INPUT[skillId],
  };
  await writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  outputPath = await runCliProposalWithRetry(
    fixture,
    skillId,
    ['--skill', skillId, '--input', inputPath, '--output', outputPath],
    outputPath,
    env,
  );
  let result = JSON.parse(await readFile(outputPath, 'utf8'));

  for (let round = 1; result.status === 'needs_input' && round <= 8; round += 1) {
    payload = {
      ...payload,
      context: { artifacts: await contextArtifacts(fixture, 'cli') },
      operatorInput: continuationText(skillId, result),
      elicitationParentRunId: result.skillRunId,
    };
    const continuationInput = resolve(evidenceDir, `cli-${skillId}-continuation-r${round}.json`);
    outputPath = resolve(evidenceDir, `cli-${skillId}-proposal-r${round + 1}.json`);
    await writeFile(continuationInput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    outputPath = await runCliProposalWithRetry(
      fixture,
      skillId,
      ['--skill', skillId, '--input', continuationInput, '--output', outputPath],
      outputPath,
      env,
    );
    result = JSON.parse(await readFile(outputPath, 'utf8'));
  }
  if (result.status !== 'needs_review') throw new Error(`${skillId}/CLI não chegou a needs_review: ${result.status}`);

  const approvalPath = resolve(evidenceDir, `cli-${skillId}-approval.json`);
  await runCliCommand(['--approve-run', result.skillRunId, '--proposal', outputPath, '--output', approvalPath], env);
  const approval = JSON.parse(await readFile(approvalPath, 'utf8'));
  if (approval.status !== 'done' || approval.approval?.state !== 'done' || !['written', 'unchanged'].includes(approval.approval?.outcome)) {
    throw new Error(`${skillId}/CLI não concluiu a aprovação.`);
  }
  return { result, approval, proposalPath: outputPath, approvalPath };
}

async function selectSkill(page, skillId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByRole('button', { name: new RegExp(`^${skillId}`, 'i') }).click();
    await page.getByRole('heading', { name: skillId, exact: true }).waitFor({ timeout: 1_500 }).catch(() => undefined);
    await page.waitForTimeout(1_200);
    const headingStable = await page.getByRole('heading', { name: skillId, exact: true }).isVisible().catch(() => false);
    const selectedNode = page.locator('.cms-skill-node.is-selected').filter({ hasText: skillId });
    if (headingStable && await selectedNode.isVisible().catch(() => false)) return;
  }
  throw new Error(`Seleção de ${skillId} não estabilizou.`);
}

async function panelStatus(page) {
  const status = page.locator('.cms-run-status strong');
  return await status.count() ? (await status.first().innerText()).trim() : '';
}

async function waitForPanelTerminal(page, skillId, timeoutMs = 20 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  let nextResumeCheck = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const status = await panelStatus(page);
    if (['Aguardando revisão', 'Falhou', 'Cancelada', 'Concluída'].includes(status)) return status;
    if (Date.now() >= nextResumeCheck) {
      nextResumeCheck = Date.now() + 60_000;
      await page.reload({ waitUntil: 'networkidle' });
      await selectSkill(page, skillId);
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Timeout do painel; último status: ${await panelStatus(page)}`);
}

async function waitForPanelCompletion(page, skillId, timeoutMs = 3 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastReselectAt = 0;
  await page.waitForTimeout(500);
  while (Date.now() < deadline) {
    const status = await panelStatus(page);
    if (status === 'Concluída') return status;
    if (['Falhou', 'Cancelada'].includes(status)) return status;
    if (!status && Date.now() - lastReselectAt > 2_000) {
      lastReselectAt = Date.now();
      await selectSkill(page, skillId);
    }
    const approvalError = page.locator('.cms-approval-error');
    if (await approvalError.isVisible().catch(() => false)) {
      const message = (await approvalError.innerText()).trim();
      if (message) throw new Error(`Aprovação do painel falhou: ${message}`);
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Timeout aguardando aprovação no painel; último status: ${await panelStatus(page)}`);
}

async function runPanelSkill(page, skillId) {
  await selectSkill(page, skillId);
  const state = (await page.locator('.cms-skill-detail__status').innerText()).trim();
  if (!/PRONTA/.test(state)) throw new Error(`${skillId}/painel não está pronta: ${state}`);
  await page.locator('label.cms-operator-input textarea').fill(OPERATOR_INPUT[skillId]);
  if (!(await page.getByRole('heading', { name: skillId, exact: true }).isVisible())) {
    throw new Error(`${skillId}/painel perdeu a seleção antes da execução.`);
  }
  await page.locator('.cms-skill-detail__actions').getByRole('button', { name: /Executar etapa guiada|Executar skill|Preparar proposta/i }).click();

  let retryCount = 0;
  for (let cycle = 0; cycle < 12; cycle += 1) {
    const status = await waitForPanelTerminal(page, skillId);
    if (status === 'Falhou') {
      if (retryCount >= 2) throw new Error(`${skillId}/painel falhou após duas repetições.`);
      retryCount += 1;
      await page.getByRole('button', { name: 'Repetir', exact: true }).click();
      await page.waitForTimeout(1_000);
      continue;
    }
    if (status !== 'Aguardando revisão') throw new Error(`${skillId}/painel terminou em ${status}.`);
    const elicitation = page.locator('section.cms-elicitation');
    if (await elicitation.isVisible().catch(() => false)) {
      const labels = elicitation.locator('label');
      const count = await labels.count();
      for (let index = 0; index < count; index += 1) {
        const label = labels.nth(index);
        const question = await label.locator('span').innerText();
        await label.locator('textarea').fill(answerQuestion(skillId, question));
      }
      await elicitation.getByRole('button', { name: 'Continuar com respostas', exact: true }).click();
      await page.waitForFunction(() => {
        const status = document.querySelector('.cms-run-status strong')?.textContent?.trim() ?? '';
        return status !== 'Aguardando revisão';
      }, undefined, { timeout: 30_000 });
      continue;
    }
    const review = page.getByTestId('artifact-approval-review');
    await review.waitFor({ state: 'visible' });
    const approve = review.getByRole('button', { name: 'Aprovar', exact: true });
    await approve.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === 'Aprovar');
      return button && !button.disabled;
    });
    await approve.click();
    const completed = await waitForPanelCompletion(page, skillId);
    if (completed !== 'Concluída') throw new Error(`${skillId}/painel não concluiu após aprovação: ${completed}`);
    const screenshot = `panel-${skillId}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    return { screenshot };
  }
  throw new Error(`${skillId}/painel excedeu o limite de elicitações.`);
}

async function verifyArtifacts(fixture, surface, skillId) {
  const contract = contracts.contracts.find((candidate) => candidate.skillId === skillId);
  const artifacts = await fixture.artifactsFor(surface, skillId);
  const requiredPaths = [...contract.requiredTextOutputs, ...contract.derivedOutputs].map((output) => output.path);
  const paths = artifacts.map((artifact) => artifact.path).sort();
  const missing = requiredPaths.filter((path) => !paths.includes(path));
  if (missing.length) throw new Error(`${skillId}/${surface} sem arquivos: ${missing.join(', ')}`);

  const files = [];
  for (const artifact of artifacts) {
    const absolutePath = resolve(fixture.projectRoot(surface), artifact.path);
    const body = await readFile(absolutePath);
    const fileHash = sha256(body);
    if (artifact.content_hash !== fileHash) throw new Error(`Hash divergente em ${surface}/${artifact.path}`);
    files.push({
      path: artifact.path,
      format: artifact.format,
      bytes: (await stat(absolutePath)).size,
      contentHash: fileHash,
      verified: artifact.verification === 'confirmed',
    });
  }
  return { requiredPaths, files };
}

async function inspectGeneratedPages(fixture) {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const surface of ['panel', 'cli']) {
      for (const scenario of [
        { name: 'desktop', viewport: { width: 1440, height: 1000 } },
        { name: 'mobile', viewport: { width: 390, height: 844 } },
      ]) {
        const page = await browser.newPage({ viewport: scenario.viewport });
        const consoleErrors = [];
        page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
        await page.goto(`file://${resolve(fixture.projectRoot(surface), 'pagina', 'index.html')}`, { waitUntil: 'load' });
        const check = await page.evaluate(() => ({
          contract: document.documentElement.getAttribute('data-page-contract') ?? document.body.getAttribute('data-page-contract'),
          sections: [...document.querySelectorAll('[data-section]')].map((node) => node.getAttribute('data-section')),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          formFields: ['name', 'email', 'phone'].every((name) => Boolean(document.querySelector(`[name="${name}"]`))),
        }));
        if (check.sections.length !== 15 || check.horizontalOverflow || !check.formFields || consoleErrors.length) {
          throw new Error(`Página ${surface}/${scenario.name} inválida: ${JSON.stringify({ check, consoleErrors })}`);
        }
        const screenshot = `sales-page-${surface}-${scenario.name}.png`;
        await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
        results.push({ surface, ...scenario, screenshot, ...check, consoleErrors });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

await mkdir(evidenceDir, { recursive: true });
const fixture = await createDocumentPackFixture();
const token = await localRunnerToken();
const cliEnv = {
  ...process.env,
  MARKETING_STUDIO_BFF_URL: fixture.bffUrl,
  LOCAL_SKILL_RUNNER_TOKEN: token,
  VITE_SUPABASE_URL: fixture.config.url,
  VITE_SUPABASE_ANON_KEY: fixture.config.anonKey,
  MARKETING_STUDIO_EMAIL: fixture.email,
  MARKETING_STUDIO_PASSWORD: fixture.password,
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const evidence = {
  schemaVersion: '1.0.0',
  epic: '11',
  story: '11.W1.2',
  generatedAt: new Date().toISOString(),
  fixture: {
    workspaceId: fixture.workspaceId,
    panelProjectId: fixture.surfaces.panel.projectId,
    cliProjectId: fixture.surfaces.cli.projectId,
    source: 'projetos/academia-fit',
  },
  skills: [],
  generatedPages: [],
};

try {
  await page.goto(fixture.webUrl, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await form.getByLabel('E-mail').fill(fixture.email);
  await form.getByLabel('Senha').fill(fixture.password);
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')));
  await page.goto(`${fixture.webUrl}/projects/${fixture.surfaces.panel.projectId}/journey`, { waitUntil: 'networkidle' });

  for (const skillId of skills) {
    const [panel, cli] = await Promise.all([
      runPanelSkill(page, skillId),
      runCliSkill(fixture, skillId, cliEnv),
    ]);
    const [panelArtifacts, cliArtifacts] = await Promise.all([
      verifyArtifacts(fixture, 'panel', skillId),
      verifyArtifacts(fixture, 'cli', skillId),
    ]);
    const panelContract = panelArtifacts.requiredPaths.slice().sort();
    const cliContract = cliArtifacts.requiredPaths.slice().sort();
    if (JSON.stringify(panelContract) !== JSON.stringify(cliContract)) throw new Error(`Contrato divergente em ${skillId}.`);
    evidence.skills.push({
      skillId,
      panel: { ...panel, artifacts: panelArtifacts.files },
      cli: {
        skillRunId: cli.result.skillRunId,
        jobId: cli.result.jobId,
        model: cli.result.model,
        approvalOutcome: cli.approval.approval.outcome,
        artifacts: cliArtifacts.files,
      },
      contractPaths: panelContract,
      parity: 'verified',
    });
  }
  evidence.generatedPages = await inspectGeneratedPages(fixture);
  await writeFile(resolve(evidenceDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    evidence: resolve(evidenceDir, 'evidence.json'),
    skills: evidence.skills.map((skill) => ({ skillId: skill.skillId, parity: skill.parity })),
    pageScenarios: evidence.generatedPages.length,
  }, null, 2)}\n`);
} finally {
  await browser.close();
}
