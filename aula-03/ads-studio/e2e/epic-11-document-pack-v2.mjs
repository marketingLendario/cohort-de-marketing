import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import {
  appRoot,
  createDocumentPackV2Fixture,
  repoRoot,
} from './fixtures/document-pack-v2/fixture.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const controlledCodexPath = resolve(__dirname, 'fixtures/document-pack-v2/controlled-codex.mjs');
const contractsFile = JSON.parse(await readFile(resolve(repoRoot, 'data/document-pack-contracts.json'), 'utf8'));
const excludedV1Skills = new Set(['offerbook', 'copy-funil', 'pagina-vendas-funil']);
const realCodex = process.env.DOCUMENT_PACK_V2_REAL === 'true';
const requestedSkills = new Set((process.env.DOCUMENT_PACK_V2_SKILLS ?? '').split(',').map((value) => value.trim()).filter(Boolean));
const contracts = contractsFile.contracts.filter((contract) =>
  !excludedV1Skills.has(contract.skillId) && (requestedSkills.size === 0 || requestedSkills.has(contract.skillId))
);
const skills = contracts.map((contract) => contract.skillId);
const researchSkills = new Set(['avatar-funil', 'espiao-do-concorrente', 'trend-hunting']);
assert.equal(contractsFile.schemaVersion, '2.0.0');
if (!realCodex && requestedSkills.size === 0) assert.equal(contracts.length, 16, `Esperava 16 document-packs v2; recebeu ${contracts.length}.`);
assert.ok(contracts.length > 0, 'Nenhum document-pack v2 foi selecionado.');

const OPERATOR_INPUT = Object.freeze({
  'avatar-funil': 'Use somente o material literal congelado para produzir a pesquisa de avatar completa. Separe verbatims de inferencias, cubra as sete dimensoes e marque lacunas sem inventar.',
  'espiao-do-concorrente': 'Analise somente o concorrente Marca Referencia presente no material congelado. Produza o indice e um dossie completo em MD/HTML; nao atribua metricas, anuncios ou reputacao nao fornecidos.',
  'trend-hunting': 'Use somente o snapshot congelado para produzir o radar, variacoes de teste e briefing do media buyer. Rotule sinais fracos e nao invente metricas, timing ou fontes.',
  'metodo-funil': 'Aprovo quiz seguido de pagina de vendas e checkout como funil principal. Use o mecanismo Ciclo de Planejamento, Execucao e Revisao, publico frio e ticket de R$ 497. Produza o mapa completo para revisao; nao invente provas.',
  'vsl-funil': 'Aprovo uma VSL curta, direta e orientada ao checkout. Use a oferta, o mecanismo e os insumos confirmados. Produza documento, pagina e roteiro completos; marque provas ausentes como pendentes.',
  'advertorial-funil': 'Aprovo advertorial de historia de descoberta para publico frio, com transicao honesta para o Programa Fixture e CTA de checkout. Nao invente personagem, depoimento, pesquisa ou resultado factual.',
  'lancamento-funil': 'Aprovo lancamento semente com tres PLCs e abertura em 15/09/2026. Produza os roteiros completos e mantenha provas, urgencia e escassez sem confirmacao como pendentes.',
  'webinario-funil': 'Aprovo webinario ao vivo com os segredos Diagnostico, Plano e Rotina. Destino final checkout. Produza registro, obrigado, roteiro e pagina de oferta; nao invente provas.',
  'quiz-funil': 'Aprovo quiz de maturidade operacional com captura antes do resultado e recomendacao do Programa Fixture. Produza o app autocontido com resultado persistido localmente e CTA de checkout.',
  'email-funil': 'Aprovo uma trilha minima completa de convite, nutricao e venda. Use links confirmados da fixture, voz da marca e nenhuma prova ou urgencia inventada.',
  'whatsapp-funil': 'Aprovo sequencia minima de lembrete e venda por WhatsApp, em mensagens separadas e copiaveis. Use somente links e fatos confirmados.',
  'recuperacao-funil': 'Aprovo recuperacao manual de checkout iniciado sem compra, com uma sequencia minima e sem desconto ou escassez inventados.',
  'backend-funil': 'Aprovo upsell de acompanhamento de implementacao e downsell do plano essencial autoguiado. Produza a arquitetura e as paginas sem inventar preco adicional.',
  'cro-funil': 'Aprovo um plano de CRO pre-lancamento baseado em hipoteses, sem alegar metricas inexistentes. Priorize um teste por vez e inclua criterios de decisao.',
  'swipe-file': 'Aprovo catalogar o padrao confirmado de contraste antes e depois do processo como uma unica entrada inicial. Use apenas o dossie e os artefatos confirmados, sem fingir coleta externa.',
  'bonus-funil': 'Aprovo a pauta e a amostra do bonus Checklist de execucao, unico bonus confirmado. Gere o checklist completo como amostra nos formatos fonte e HTML; nao crie outros bonus.',
});

function answerQuestion(skillId, question) {
  const normalized = question.toLowerCase();
  if (/pauta|amostra|lote|b[oô]nus/.test(normalized)) return 'Aprovo somente o Checklist de execucao como pauta e amostra. Nao gerar outros bonus.';
  if (/prova|depoimento|resultado|case|evid[eê]ncia/.test(normalized)) return 'Nao ha prova verificavel. Marque como pendente e nao use alegacao factual.';
  if (/pre[cç]o|ticket|investimento/.test(normalized)) return 'R$ 497 a vista; nao inventar parcelamento nem preco de upsell.';
  if (/garantia/.test(normalized)) return '30 dias conforme os termos fornecidos, sem acrescentar condicoes.';
  if (/url|link|checkout|cta|destino/.test(normalized)) return 'CTA Conhecer o programa para https://fixture.invalid/checkout.';
  if (/tom|voz|linguagem/.test(normalized)) return 'Voz da marca, objetiva, acolhedora e sem promessas de resultado.';
  if (/aprova|aprova[cç][aã]o|confirm/.test(normalized)) return 'Aprovo a direcao descrita na entrada, mantendo fatos ausentes como pendentes.';
  return `${OPERATOR_INPUT[skillId]} Se a informacao nao estiver nos artefatos confirmados, registre a lacuna em vez de inventar.`;
}

function continuationText(skillId, result) {
  return [
    `CONTINUACAO DE ELICITACAO DA SKILL ${skillId}.`,
    `Resumo do checkpoint anterior: ${result.proposal.summary || 'sem resumo'}.`,
    'Use as respostas abaixo como decisoes explicitas do operador. Nao repita perguntas respondidas.',
    ...result.proposal.questions.map((question, index) => `${index + 1}. ${question}\nResposta: ${answerQuestion(skillId, question)}`),
    'Se faltar decisao indispensavel, retorne somente novas perguntas. Caso contrario, produza o pack final completo.',
  ].join('\n\n');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function contractPattern(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**', '__DOUBLE_STAR__')
    .replaceAll('*', '[^/]+')
    .replaceAll('__DOUBLE_STAR__', '.+');
  return new RegExp(`^${escaped}$`);
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

function startProcess(command, args, options) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  const logs = [];
  const collect = (prefix) => (chunk) => {
    const line = `${prefix}${chunk.toString()}`;
    logs.push(line);
    if (logs.length > 80) logs.shift();
  };
  child.stdout.on('data', collect('stdout: '));
  child.stderr.on('data', collect('stderr: '));
  return { child, logs };
}

async function stopProcess(processState) {
  if (!processState?.child || processState.child.exitCode !== null) return;
  processState.child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => processState.child.once('exit', resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000)),
  ]);
  if (processState.child.exitCode === null) processState.child.kill('SIGKILL');
}

async function waitForUrl(url, processState, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processState.child.exitCode !== null) {
      throw new Error(`Processo encerrou antes de ${url}.\n${processState.logs.join('')}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // O servidor ainda esta subindo.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timeout aguardando ${url}.\n${processState.logs.join('')}`);
}

async function runCli(args, env, allowNeedsInput = false) {
  try {
    return await execFileAsync('npx', ['tsx', 'server/skill-cli.ts', ...args], {
      cwd: appRoot,
      env,
      maxBuffer: 30_000_000,
      timeout: realCodex ? 20 * 60_000 : 5 * 60_000,
    });
  } catch (error) {
    if (allowNeedsInput && error?.code === 3) return error;
    throw error;
  }
}

async function runCliProposalWithRetry(fixture, skillId, args, outputPath, env) {
  try {
    await runCli(args, env, true);
    return;
  } catch (originalError) {
    const run = await fixture.latestRun('cli', skillId).catch(() => null);
    const jobId = run?.input_snapshot?.jobId;
    if (run?.status !== 'failed' || typeof jobId !== 'string') throw originalError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await runCli([
          '--retry-run', run.id,
          '--job', jobId,
          '--workspace', fixture.workspaceId,
          '--output', outputPath,
        ], env, true);
        return;
      } catch (retryError) {
        if (attempt === 2) throw retryError;
      }
    }
  }
}

async function runCliSkill(fixture, skillId, workDir, env) {
  const inputPath = resolve(workDir, `${skillId}-input.json`);
  const proposalPath = resolve(workDir, `${skillId}-proposal.json`);
  const approvalPath = resolve(workDir, `${skillId}-approval.json`);
  let payload = {
    workspaceId: fixture.workspaceId,
    projectId: fixture.surfaces.cli.projectId,
    brief: fixture.briefFor('cli'),
    context: {
      artifacts: await fixture.contextArtifacts('cli'),
      ...(researchSkills.has(skillId) ? {
        externalResearch: {
          mode: 'offline',
          query: `${skillId} fixture literal`,
          pastedMaterial: 'Marca Referencia: profissionais relatam falta de um processo consistente, pouco tempo e preferencia por orientacao objetiva. Fonte fornecida pelo operador, sem metricas publicas.',
          pastedSourceLabel: 'Material literal da fixture',
          sources: [],
          maxBillableCalls: 0,
        },
      } : {}),
    },
    operatorInput: realCodex ? OPERATOR_INPUT[skillId] : 'Executar a lane controlada do contrato v2 e submeter o pack para revisao humana.',
  };
  await writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await runCliProposalWithRetry(fixture, skillId, ['--skill', skillId, '--input', inputPath, '--output', proposalPath], proposalPath, env);
  let proposal = JSON.parse(await readFile(proposalPath, 'utf8'));
  for (let round = 1; proposal.status === 'needs_input' && round <= 8; round += 1) {
    payload = {
      ...payload,
      context: {
        ...payload.context,
        artifacts: await fixture.contextArtifacts('cli'),
      },
      operatorInput: continuationText(skillId, proposal),
      elicitationParentRunId: proposal.skillRunId,
    };
    const continuationInput = resolve(workDir, `${skillId}-continuation-${round}.json`);
    await writeFile(continuationInput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await runCliProposalWithRetry(fixture, skillId, ['--skill', skillId, '--input', continuationInput, '--output', proposalPath], proposalPath, env);
    proposal = JSON.parse(await readFile(proposalPath, 'utf8'));
  }
  assert.equal(proposal.status, 'needs_review', `${skillId}/CLI nao chegou a needs_review.`);
  await runCli(['--approve-run', proposal.skillRunId, '--proposal', proposalPath, '--output', approvalPath], env);
  const approval = JSON.parse(await readFile(approvalPath, 'utf8'));
  assert.equal(approval.status, 'done', `${skillId}/CLI nao concluiu.`);
  assert.equal(approval.approval?.state, 'done', `${skillId}/CLI sem saga concluida.`);
  return fixture.latestRun('cli', skillId);
}

async function selectSkill(page, skillId) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.getByRole('button', { name: new RegExp(`^${skillId}`, 'i') }).click();
    await page.waitForTimeout(450);
    const heading = await page.getByRole('heading', { name: skillId, exact: true }).isVisible().catch(() => false);
    const selected = await page.locator('.cms-skill-node.is-selected').filter({ hasText: skillId }).isVisible().catch(() => false);
    if (heading && selected) return;
  }
  throw new Error(`Selecao de ${skillId} nao estabilizou.`);
}

async function panelStatus(page) {
  const status = page.locator('.cms-run-status strong');
  if (!await status.count()) return '';
  return (await status.first().innerText({ timeout: 1_000 }).catch(() => '')).trim();
}

async function waitForPanelStatus(page, expected, timeoutMs = realCodex ? 20 * 60_000 : 5 * 60_000) {
  const terminal = new Set([expected, 'Falhou', 'Cancelada', 'Concluída']);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await panelStatus(page);
    if (terminal.has(status)) return status;
    await page.waitForTimeout(300);
  }
  throw new Error(`Timeout do painel; esperado ${expected}, atual ${await panelStatus(page)}.`);
}

async function runPanelSkill(fixture, page, skillId) {
  await selectSkill(page, skillId);
  const readiness = (await page.locator('.cms-skill-detail__status').innerText()).trim();
  assert.match(readiness, /PRONTA/, `${skillId}/painel nao esta pronta: ${readiness}`);
  if (researchSkills.has(skillId)) {
    const research = page.locator('section.cms-research-input');
    await research.getByRole('button', { name: 'Material colado', exact: true }).click();
    await research.getByLabel('Origem do material').fill('Material literal da fixture');
    await research.getByLabel('Material literal').fill('Marca Referencia: profissionais relatam falta de um processo consistente, pouco tempo e preferencia por orientacao objetiva. Fonte fornecida pelo operador, sem metricas publicas.');
  }
  await page.locator('label.cms-operator-input textarea').waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator('label.cms-operator-input textarea').fill(realCodex ? OPERATOR_INPUT[skillId] : 'Executar a lane controlada do contrato v2 e submeter o pack para revisao humana.');
  await page.locator('.cms-skill-detail__actions')
    .getByRole('button', { name: /Executar etapa guiada|Executar skill|Gerar proposta|Preparar proposta/i })
    .click();
  let retries = 0;
  for (let round = 0; round <= 12; round += 1) {
    const status = await waitForPanelStatus(page, 'Aguardando revisão');
    if (status === 'Falhou') {
      const diagnostic = (await page.locator('.cms-inline-error').last().innerText().catch(() => 'falha sem diagnostico')).trim();
      if (retries >= 2) throw new Error(`${skillId}/painel falhou apos duas repeticoes: ${diagnostic}`);
      retries += 1;
      await page.getByRole('button', { name: 'Repetir', exact: true }).click();
      await page.waitForTimeout(500);
      continue;
    }
    if (status !== 'Aguardando revisão') throw new Error(`${skillId}/painel terminou em ${status}.`);
    const elicitation = page.locator('section.cms-elicitation');
    if (!await elicitation.isVisible().catch(() => false)) break;
    const labels = elicitation.locator('label');
    for (let index = 0; index < await labels.count(); index += 1) {
      const label = labels.nth(index);
      const question = await label.locator('span').innerText();
      await label.locator('textarea').fill(answerQuestion(skillId, question));
    }
    await elicitation.getByRole('button', { name: 'Continuar com respostas', exact: true }).click();
    await page.waitForFunction(() => (document.querySelector('.cms-run-status strong')?.textContent?.trim() ?? '') !== 'Aguardando revisão', undefined, { timeout: 30_000 });
  }
  if (await page.locator('section.cms-elicitation').isVisible().catch(() => false)) {
    throw new Error(`${skillId}/painel excedeu o limite de checkpoints de elicitação.`);
  }
  const review = page.getByTestId('artifact-approval-review');
  await review.waitFor({ state: 'visible', timeout: 30_000 }).catch(async (error) => {
    const status = await panelStatus(page);
    const diagnostic = (await page.locator('.cms-inline-error').last().innerText().catch(() => '')).trim();
    throw new Error(`${skillId}/painel sem revisão após status ${status}: ${diagnostic || (error instanceof Error ? error.message : 'sem detalhe')}`);
  });
  const approve = review.getByRole('button', { name: 'Aprovar', exact: true });
  await approve.waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === 'Aprovar');
    return Boolean(button && !button.disabled);
  });
  await approve.click();
  await waitForPanelStatus(page, 'Concluída');
  return fixture.latestRun('panel', skillId);
}

function expectedCanonicalPaths(contract, sourcePaths) {
  const paths = new Set([
    ...contract.requiredTextOutputs.map((output) => output.path),
    ...(contract.optionalTextOutputs ?? []).map((output) => output.path),
    ...contract.derivedOutputs.map((output) => output.path),
    'book-do-funil.json',
    'index.html',
  ]);
  for (const group of contract.requiredAnyOf ?? []) {
    assert.ok(group.some((path) => sourcePaths.includes(path)), `${contract.skillId} nao satisfez requiredAnyOf.`);
  }
  for (const collection of contract.requiredCollections ?? []) {
    const matching = sourcePaths.filter((path) => contractPattern(collection.pathPattern).test(path));
    assert.ok(matching.length >= collection.minItems, `${contract.skillId} nao satisfez ${collection.pathPattern}.`);
    matching.forEach((path) => paths.add(path));
  }
  for (const collection of contract.derivedCollectionOutputs ?? []) {
    const pattern = contractPattern(collection.sourcePattern);
    sourcePaths.filter((path) => pattern.test(path)).forEach((path) => {
      paths.add(path.replace(extname(path), collection.outputExtension));
    });
  }
  return [...paths].sort();
}

async function verifyRun(fixture, surface, contract, run) {
  assert.equal(run.status, 'done', `${contract.skillId}/${surface} nao esta done.`);
  const [artifacts, approval] = await Promise.all([
    fixture.artifactsForRun(run.id),
    fixture.approvalForRun(run.id),
  ]);
  assert.equal(approval.decision, 'approve');
  assert.equal(approval.state, 'done');
  assert.ok(['written', 'unchanged'].includes(approval.outcome));
  const planByPath = new Map(approval.plan.map((entry) => [entry.path, entry]));
  const files = [];
  for (const artifact of artifacts) {
    assert.ok(artifact.path, `${contract.skillId}/${surface} produziu path nulo.`);
    const bytes = await readFile(resolve(fixture.projectRoot(surface), artifact.path));
    const fileHash = sha256(bytes);
    assert.equal(artifact.content_hash, fileHash, `DB/filesystem divergiram em ${surface}/${artifact.path}.`);
    const plan = planByPath.get(artifact.path);
    assert.ok(plan, `Plano de aprovacao nao contem ${artifact.path}.`);
    files.push({
      path: artifact.path,
      format: artifact.format,
      bytes: (await stat(resolve(fixture.projectRoot(surface), artifact.path))).size,
      sha256: fileHash,
      kind: plan.derivedFrom ? 'derived' : 'approved-source',
      binary: plan.contentEncoding === 'base64',
      dbFilesystemMatch: true,
    });
  }
  const sourcePaths = files.filter((file) => file.kind === 'approved-source').map((file) => file.path);
  const expected = expectedCanonicalPaths(contract, sourcePaths);
  const actual = files.map((file) => file.path);
  const missing = expected.filter((path) => !actual.includes(path));
  assert.deepEqual(missing, [], `${contract.skillId}/${surface} sem paths canonicos.`);
  return {
    approval: { decision: approval.decision, state: approval.state, outcome: approval.outcome },
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    expectedCanonicalPaths: expected,
  };
}

function sourceManifest(result) {
  return result.files
    .filter((file) => file.kind === 'approved-source' && !file.path.startsWith('research/'))
    .map(({ path, format, sha256: hash }) => ({ path, format, hash }));
}

function topologyManifest(result) {
  return result.files
    .filter((file) => !file.path.startsWith('research/'))
    .map(({ path, format, kind, binary }) => ({ path, format, kind, binary }));
}

function normalizedBook(book) {
  return {
    schemaVersion: book.schemaVersion,
    cards: [...book.cards]
      .map((card) => ({
        id: card.id,
        title: card.title,
        phase: card.phase,
        status: card.status,
        link: card.link,
        versions: [...card.versions].sort((a, b) => a.revision - b.revision),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    current: book.current,
  };
}

function safeSurfaceEvidence(result) {
  return {
    approval: result.approval,
    expectedCanonicalPaths: result.expectedCanonicalPaths,
    files: result.files.map(({ path, format, bytes, sha256: hash, kind, binary, dbFilesystemMatch }) => ({
      path,
      format,
      bytes,
      hash,
      kind,
      binary,
      dbFilesystemMatch,
    })),
  };
}

function assertPrivacySafe(evidence) {
  const serialized = JSON.stringify(evidence);
  const forbidden = [
    /\/Users\//,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    /OPENAI_API_KEY|CODEX_API_KEY|APIFY_API_TOKEN|SERVICE_ROLE_KEY|LOCAL_SKILL_RUNNER_TOKEN/i,
    /document-pack-v2-[a-z0-9]+@fixture\.local/i,
  ];
  for (const pattern of forbidden) assert.equal(pattern.test(serialized), false, `Evidencia reprovada por ${pattern}.`);
}

const bffPort = await freePort();
const webPort = await freePort();
const bffUrl = `http://127.0.0.1:${bffPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const runnerToken = `dpv2-${randomUUID()}`;
const workDir = await mkdtemp(resolve(tmpdir(), 'document-pack-v2-work-'));
const evidenceDir = process.env.DOCUMENT_PACK_V2_EVIDENCE_DIR
  ? resolve(process.env.DOCUMENT_PACK_V2_EVIDENCE_DIR)
  : await mkdtemp(resolve(tmpdir(), 'document-pack-v2-evidence-'));
await mkdir(evidenceDir, { recursive: true });
await chmod(controlledCodexPath, 0o755);

let fixture = null;
let browser = null;
let context = null;
let bffProcess = null;
let viteProcess = null;
let failure = null;
const evidence = {
  schemaVersion: '1.0.0',
  epic: '11',
  story: '11.W3.1',
  generatedAt: new Date().toISOString(),
  lane: {
    type: realCodex ? 'real-codex' : 'controlled-contract',
    runner: realCodex ? 'codex-cli-chatgpt-session' : 'deterministic-local-fixture',
    codexRealEquivalent: realCodex,
    validates: ['panel-runtime', 'cli-runtime', 'approval-saga', 'database-filesystem', 'derived-rendering', 'book-reconciliation'],
    limitation: realCodex ? 'Saidas generativas independentes podem ter hashes diferentes; contrato, topologia, decisoes e hashes por superficie sao comparados.' : 'A geracao textual e controlada e nao substitui a lane separada com Codex CLI real.',
  },
  contractCatalog: {
    schemaVersion: contractsFile.schemaVersion,
    contractCount: contracts.length,
    contractIds: skills,
    catalogHash: sha256(`${JSON.stringify(contracts)}\n`),
  },
  surfaces: {
    panel: 'Playwright no painel real sobre BFF isolado',
    cli: 'skill-cli real sobre o mesmo BFF isolado',
  },
  skills: [],
  cleanup: { attempted: false, verified: false },
  privacy: { checked: false, findings: null },
};

try {
  const configProbe = await createDocumentPackV2Fixture({ webUrl, bffUrl });
  fixture = configProbe;
  const sharedEnv = {
    ...process.env,
    OPENAI_API_KEY: '',
    CODEX_API_KEY: '',
    VITE_SUPABASE_URL: fixture.config.url,
    VITE_SUPABASE_ANON_KEY: fixture.config.anonKey,
    VITE_DEMO_AUTH: 'false',
  };
  bffProcess = startProcess('npx', ['tsx', 'server/start.ts'], {
    cwd: appRoot,
    env: {
      ...sharedEnv,
      PORT: String(bffPort),
      HOST: '127.0.0.1',
      CORS_ORIGIN: webUrl,
      LOCAL_SKILL_RUNNER_ENABLED: 'true',
      LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
      ...(realCodex ? {} : { CODEX_CLI_PATH: controlledCodexPath, CODEX_SKILL_MODEL: 'controlled-document-pack-v2' }),
      COHORT_REPO_ROOT: repoRoot,
      SUPABASE_URL: fixture.config.url,
      SUPABASE_SERVICE_ROLE_KEY: fixture.config.serviceRoleKey,
      LOG_LEVEL: 'warn',
    },
  });
  await waitForUrl(`${bffUrl}/healthz`, bffProcess);
  viteProcess = startProcess('npx', ['vite', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], {
    cwd: appRoot,
    env: {
      ...sharedEnv,
      LOCAL_BFF_URL: bffUrl,
      LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
    },
  });
  await waitForUrl(webUrl, viteProcess);

  const cliEnv = {
    ...sharedEnv,
    MARKETING_STUDIO_BFF_URL: bffUrl,
    LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
    MARKETING_STUDIO_EMAIL: fixture.email,
    MARKETING_STUDIO_PASSWORD: fixture.password,
  };
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) failedRequests.push(new URL(request.url()).pathname);
  });
  await page.goto(webUrl, { waitUntil: 'domcontentloaded' });
  const login = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await login.getByLabel('E-mail').fill(fixture.email);
  await login.getByLabel('Senha').fill(fixture.password);
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await Promise.race([
    page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))),
    page.locator('[role="alert"]').waitFor({ state: 'visible' }).then(async () => {
      throw new Error(`Login da fixture falhou: ${(await page.locator('[role="alert"]').innerText()).trim()}`);
    }),
  ]);
  await page.goto(`${webUrl}/projects/${fixture.surfaces.panel.projectId}/journey`, { waitUntil: 'networkidle' });

  for (const contract of contracts) {
    const panelRun = await runPanelSkill(fixture, page, contract.skillId);
    const cliRun = await runCliSkill(fixture, contract.skillId, workDir, cliEnv);
    const panelResult = await verifyRun(fixture, 'panel', contract, panelRun);
    const cliResult = await verifyRun(fixture, 'cli', contract, cliRun);
    assert.deepEqual(panelResult.expectedCanonicalPaths, cliResult.expectedCanonicalPaths);
    assert.deepEqual(topologyManifest(panelResult), topologyManifest(cliResult), `${contract.skillId}: topologia divergente.`);
    const panelSources = sourceManifest(panelResult);
    const cliSources = sourceManifest(cliResult);
    const sourceHashesEqual = JSON.stringify(panelSources) === JSON.stringify(cliSources);
    if (!realCodex) assert.deepEqual(panelSources, cliSources, `${contract.skillId}: fontes divergentes.`);
    const panelBook = normalizedBook(await fixture.readBook('panel'));
    const cliBook = normalizedBook(await fixture.readBook('cli'));
    assert.deepEqual(panelBook, cliBook, `${contract.skillId}: Book divergente.`);
    assert.ok(panelBook.cards.some((card) => card.id === contract.skillId), `${contract.skillId}: card ausente no Book.`);
    evidence.skills.push({
      skillId: contract.skillId,
      contractGroup: contract.contractGroup,
      contractHash: sha256(`${JSON.stringify(contract)}\n`),
      panel: safeSurfaceEvidence(panelResult),
      cli: safeSurfaceEvidence(cliResult),
      parity: {
        canonicalPathsEqual: true,
        artifactTopologyEqual: true,
        approvedSourceHashesEqual: sourceHashesEqual,
        approvedSourceHashesCompared: true,
        semanticContractEqual: true,
        databaseFilesystemHashesVerified: true,
        bookSemanticStateEqual: true,
        binaryHashesComparedAcrossSurfaces: false,
        binaryComparisonReason: 'PDFs derivados podem carregar metadados de renderizacao; cada hash foi validado entre DB e filesystem na propria superficie.',
      },
    });
  }

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(failedRequests, []);
  await page.screenshot({ path: resolve(evidenceDir, 'panel-final.png'), fullPage: true });
  evidence.browser = {
    screenshot: 'panel-final.png',
    consoleErrors: 0,
    failedRequests: 0,
  };
} catch (error) {
  failure = error;
} finally {
  await context?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  await stopProcess(viteProcess);
  await stopProcess(bffProcess);
  evidence.cleanup.attempted = Boolean(fixture);
  if (fixture) {
    try {
      await fixture.cleanup();
      evidence.cleanup.verified = true;
    } catch (cleanupError) {
      failure ??= cleanupError;
    }
  }
  await rm(workDir, { recursive: true, force: true });
}

if (failure) throw failure;
assert.equal(evidence.skills.length, contracts.length);
assert.ok(evidence.skills.every((skill) => skill.parity.databaseFilesystemHashesVerified));
evidence.privacy.checked = true;
evidence.privacy.findings = 0;
assertPrivacySafe(evidence);
await writeFile(resolve(evidenceDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  status: 'passed',
  lane: evidence.lane.type,
  codexRealEquivalent: realCodex,
  skills: evidence.skills.length,
  cleanupVerified: evidence.cleanup.verified,
  privacyFindings: evidence.privacy.findings,
  evidence: resolve(evidenceDir, 'evidence.json'),
}, null, 2)}\n`);
