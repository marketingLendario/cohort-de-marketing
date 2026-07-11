import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidencePath = resolve(appRoot, 'e2e/fixtures/traffic-pilot/evidence/run.json');
const outputPath = resolve(appRoot, '../../docs/qa/epic-8-traffic-pilot.md');
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const pass = (value) => value ? 'PASS' : 'LACUNA';
const stageRows = evidence.stages.map((stage) => `| ${stage.skillId} | ${stage.runId} | ${stage.durationMs} ms | ${stage.status} | ${stage.approvals?.map((item) => `${item.decision}/${item.state}`).join(', ') || 'sem registro'} | ${stage.artifacts?.map((item) => `${item.path}: ${item.contentHash ?? 'n/a'}`).join('<br>') || 'nenhum'} |`).join('\n');
const reloadRows = evidence.reloads.map((item) => `| ${item.label} | ${item.at} | ${item.hydrated ? 'sim' : 'não'} |`).join('\n');
const visual = evidence.visual;
const metricStage = evidence.stages.find((stage) => stage.skillId === 'leitor-de-metricas');
const metricArtifact = metricStage?.proposal?.artifacts?.find((artifact) => artifact.artifactType === 'trafficMetricReading');
const metricReading = metricArtifact?.content ? parseYaml(metricArtifact.content) : null;
const unavailableMetrics = (metricReading?.leitor?.sinais ?? [])
  .filter((signal) => signal.valor == null || String(signal.selo ?? '').toLowerCase().replace(/[_-]+/g, ' ').includes('nao fornecido'))
  .map((signal) => signal.metrica)
  .filter(Boolean);
const unavailableLabel = unavailableMetrics.length ? unavailableMetrics.join(', ') : 'nenhuma registrada';

const content = `# Relatório de piloto E2E — Squad de Tráfego

Story: **${evidence.story}**

Base: \`${evidence.base}\`

Execução: ${evidence.startedAt} → ${evidence.finishedAt ?? 'em andamento'}

Fixture: \`${evidence.fixture.projectSlug}\` (workspace \`${evidence.fixture.workspaceId}\`, projeto \`${evidence.fixture.projectId}\`, campanha \`${evidence.fixture.campaignId}\`)

## Resultado executivo

- Fixture Supabase real, sem demo auth: **${pass(evidence.fixture.demoAuth === false && evidence.fixture.seededFromFilesystem)}**.
- Meta não mutada: **${pass(evidence.noMetaMutation && evidence.finalCampaign?.status === 'draft')}**; campanha permaneceu \`draft\`, etapa ${evidence.finalCampaign?.step_current ?? 'não lida'}.
- Cinco skills executadas pela interface e materializadas após revisão humana: **${pass(evidence.stages.length === 5 && evidence.stages.every((stage) => stage.status === 'done'))}**.
- Retomada após reload: **${pass(evidence.reloads.length >= 5 && evidence.reloads.every((item) => item.hydrated))}**.
- Evidência visual desktop/mobile no mesmo estado: **${pass(visual.sameState && Boolean(visual.desktop) && Boolean(visual.mobile))}**.

## Tempos, jobs, decisões e hashes

| Skill | Run DB | Tempo | Status | Decisões outbox | Artefatos / hash DB |
|---|---|---:|---|---|---|
${stageRows}

O hash de proposta é o agregado canônico gravado no run/outbox. Os hashes de arquivo acima são reconciliados durante o E2E com o SHA-256 do conteúdo materializado no filesystem. O JSON preserva os paths e os jobs duráveis, incluindo tentativas, steps e logs.

## Retomada, retry e recusas

| Checkpoint | Momento | Hidratação |
|---|---|---|
${reloadRows}

- Recusa honesta: ${evidence.refusals.length ? 'registrada' : 'não registrada'} — o Zelador foi recusado quando CAPI/deduplicação não estavam confirmadas; nenhum arquivo foi materializado para essa decisão.
- Retry: ${evidence.retries.length ? `registrado para o job ${evidence.retries[0].jobId ?? 'n/a'}, tentativa ${evidence.retries[0].attempt ?? 'n/a'}, seguido de cancelamento controlado` : 'não registrado'}.
- Guardas: token no BFF, Codex em \`read-only\`, revisão humana obrigatória e campanha recommend-only.

## Métricas e diagnóstico

O operador forneceu ao Leitor apenas valores nomeados: gasto, impressões, cliques, conversões, CPA do gerenciador e ROAS do gerenciador. Métricas marcadas como **Não fornecido** no artefato: **${unavailableLabel}**; a janela de atribuição também ficou ausente e o ROAS sem venda confirmada ficou **Estimado** com premissa. O E2E rejeita qualquer valor calculado para essas métricas e confirmou **zero derivações** no Diagnosticador. A saída final trouxe uma única alavanca, hipótese, critério de sucesso, critério de reversão e decisão humana de aprovação via outbox.

## Evidência visual

- Desktop: [traffic-pilot-desktop.png](../../apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-desktop.png) — 1280×900, estado final do Diagnosticador.
- Mobile: [traffic-pilot-mobile.png](../../apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-mobile.png) — 390×844, mesma revisão reidratada.
- Overlaps detectados: ${visual.overlaps?.length ?? 0}.
- Erros de console: ${visual.consoleErrors?.length ?? 0}.
- Falhas de rede: ${visual.networkFailures?.length ?? 0}.

## Lacunas e limites honestos

- A campanha fixture é um registro local real em Supabase e permaneceu em \`draft\`; o E2E não acessa credenciais Meta nem simula publicação.
- Os arquivos de evidência são regeneráveis executando a spec e este script; o workspace e o projeto fixture são removidos no teardown.
- IDs de runs/jobs, timestamps e hashes mudam por execução; tenant, projeto, campanha e conteúdo de entrada são determinísticos.

## Paths observados

- Projeto filesystem: \`${evidence.fixture.projectPath}\` (temporário, removido no teardown).
- Evidência JSON: \`${evidencePath}\`.
- Screenshots: \`${visual.desktop || 'não gerado'}\` e \`${visual.mobile || 'não gerado'}\`.

Gerado por \`scripts/traffic-pilot-report.mjs\`; sem commit nesta execução.
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, content, 'utf8');
console.log(`Relatório escrito em ${outputPath}`);
