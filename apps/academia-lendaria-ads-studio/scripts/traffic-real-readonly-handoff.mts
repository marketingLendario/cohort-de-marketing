import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import {
  CodexCliLocalSkillRunner,
  derivedUnavailableTrafficMetrics,
  unavailableTrafficMetrics,
} from '../server/local-skill-runner.ts';

const spoke = process.env.META_ADS_SPOKE ?? 'natalia-tanaka';
const repoRoot = resolve(process.cwd(), '../..');
const adapterPath = resolve(repoRoot, 'services/meta-ads/index.js');
const runner = new CodexCliLocalSkillRunner({ repoRoot, timeoutMs: 600_000 });

function normalize(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function readInsights(): Record<string, unknown> {
  const output = execFileSync(
    process.execPath,
    [
      adapterPath,
      `--spoke=${spoke}`,
      '--output',
      'json',
      'ads',
      'insights',
      'get',
      '--date-preset',
      'last_7d',
      '--fields',
      'spend,impressions,ctr,cpc,reach,clicks,frequency,cpm',
    ],
    { cwd: repoRoot, encoding: 'utf8', timeout: 30_000 },
  );
  const parsed = JSON.parse(output) as { data?: Array<Record<string, unknown>> };
  const row = parsed.data?.[0];
  assert.ok(row, 'A leitura real da Meta não retornou uma linha de insights.');
  return row;
}

function signalFor(signals: Array<Record<string, unknown>>, ...names: string[]) {
  const wanted = names.map(normalize);
  return signals.find((signal) => wanted.includes(normalize(signal.metrica)));
}

const insights = readInsights();
const brief = {
  project: { slug: 'traffic-real-readonly', name: 'Handoff real read-only', currentStage: 'aula3-trafego', voice: 'marca' },
  market: {
    awarenessLevel: 'consciente_do_problema',
    dominantPain: 'Decidir a próxima alavanca usando somente os sinais observados.',
    trafficTemperature: 'frio',
    trafficSource: 'pago',
    avatarSummary: 'Operador de tráfego em validação controlada.',
  },
  offer: { name: 'Oferta controlada', exactPrice: 1200 },
  channels: { primaryCtaUrl: 'https://controlled.local/oferta', adFormats: ['feed', 'reels 9:16'] },
  funnel: { primaryPage: 'https://controlled.local/oferta' },
  integrations: { metaStatus: 'recommend_only' },
};

const literalNames: Array<[string, string[]]> = [
  ['spend', ['gasto', 'spend']],
  ['impressions', ['impressoes', 'impressions']],
  ['ctr', ['ctr']],
  ['cpc', ['cpc']],
  ['reach', ['alcance', 'reach']],
  ['clicks', ['cliques', 'clicks']],
  ['frequency', ['frequencia', 'frequency']],
  ['cpm', ['cpm']],
];
const literalInput = literalNames
  .map(([key]) => `${key}=${String(insights[key])}`)
  .join('; ');
const operatorInput = [
  `Fonte: leitura read-only da Meta via adapter para o spoke ${spoke}.`,
  `Periodo literal: ${insights.date_start} ate ${insights.date_stop}.`,
  `Valores colados pelo adapter: ${literalInput}.`,
  'Conversoes, CPA, ROAS e janela de atribuicao nao foram fornecidos.',
  'Preserve cada valor literal, marque ausencias como nao_fornecido e nao calcule campos ausentes.',
].join(' ');

const readerResult = await runner.run('leitor-de-metricas', {
  projectId: 'traffic-real-readonly-20260710',
  brief,
  context: {},
  operatorInput,
});
const readerArtifact = readerResult.proposal.artifacts.find((artifact) => artifact.artifactType === 'trafficMetricReading');
assert.ok(readerArtifact, 'O Leitor não produziu o artefato trafficMetricReading.');
const readerContent = parse(readerArtifact.content) as { leitor?: { sinais?: Array<Record<string, unknown>> } };
const signals = readerContent.leitor?.sinais ?? [];
for (const [key, names] of literalNames) {
  const signal = signalFor(signals, ...names);
  assert.ok(signal, `O Leitor omitiu o campo literal ${key}.`);
  assert.notEqual(signal.valor, null, `O Leitor perdeu o valor literal ${key}.`);
  assert.doesNotMatch(normalize(signal.selo), /nao fornecido/);
}
for (const [key, names] of [
  ['conversions', ['conversoes', 'compras']],
  ['cpa', ['cpa']],
  ['roas', ['roas']],
] as const) {
  const signal = signalFor(signals, ...names);
  assert.ok(signal, `O Leitor omitiu a ausência declarada ${key}.`);
  assert.ok(signal.valor == null || /nao fornecido/.test(normalize(signal.selo)), `${key} foi inventado.`);
}

const diagnosticContext = { artifacts: readerResult.proposal.artifacts };
const diagnosticResult = await runner.run('diagnosticador', {
  projectId: 'traffic-real-readonly-20260710',
  brief,
  context: diagnosticContext,
  operatorInput: 'Retorne uma única alavanca com hipótese, sucesso, reversão e circuit breaker. Não execute mudança nem derive métricas ausentes; a decisão é humana.',
});
const unavailable = unavailableTrafficMetrics(diagnosticContext);
assert.deepEqual(derivedUnavailableTrafficMetrics(diagnosticResult.proposal, unavailable), []);
assert.match(JSON.stringify(diagnosticResult.proposal), /alavanca|lever/i);
assert.match(JSON.stringify(diagnosticResult.proposal), /sucesso|success/i);
assert.match(JSON.stringify(diagnosticResult.proposal), /revers|reversal/i);

console.log(JSON.stringify({
  test: 'traffic-real-readonly-handoff',
  spoke,
  source: 'Meta Ads insights via local adapter',
  period: { start: insights.date_start, end: insights.date_stop },
  mutation: false,
  reader: {
    suppliedMetrics: literalNames.map(([key]) => key),
    unavailableMetrics: unavailable,
    artifactType: readerArtifact.artifactType,
  },
  diagnostic: {
    artifactTypes: diagnosticResult.proposal.artifacts.map((artifact) => artifact.artifactType),
    derivedUnavailableMetrics: [],
  },
}, null, 2));
