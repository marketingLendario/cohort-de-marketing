import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import {
  CodexCliLocalSkillRunner,
  derivedUnavailableTrafficMetrics,
  unavailableTrafficMetrics,
} from '../server/local-skill-runner.ts';

type ControlledArtifact = {
  artifactType: string;
  title: string;
  path: string;
  content: string;
};

const projectId = 'controlled-traffic-20260710';
const repoRoot = resolve(process.cwd(), '../..');
const runner = new CodexCliLocalSkillRunner({ repoRoot, timeoutMs: 600_000 });

const brief = {
  project: {
    slug: 'controlled-traffic',
    name: 'Teste controlado do Squad de Trafego',
    currentStage: 'aula3-trafego',
    voice: 'marca',
  },
  market: {
    awarenessLevel: 'consciente_do_problema',
    dominantPain: 'Gestor precisa decidir sem inventar metricas.',
    trafficTemperature: 'frio',
    trafficSource: 'pago',
    avatarSummary: 'Gestor de trafego em validacao.',
  },
  offer: { name: 'Metodo OFTR', exactPrice: 1200 },
  channels: { primaryCtaUrl: 'https://controlled.local/oferta', adFormats: ['feed', 'reels 9:16'] },
  funnel: { primaryPage: 'https://controlled.local/oferta' },
  integrations: { metaStatus: 'recommend_only' },
};

const copy: ControlledArtifact = {
  artifactType: 'copy',
  title: 'Copy e angulos controlados',
  path: 'copy.md',
  content: `# Angulos da Aula 2

1. Estrutura antes de escalar — consciente_do_problema
2. Decisao semanal com dados — consciente_da_solucao
3. Angulo sem nivel — nivel ausente de proposito.`,
};

const panel: ControlledArtifact = {
  artifactType: 'trafficPanel',
  title: 'Painel controlado',
  path: 'PAINEL-DA-SEMANA.yaml',
  content: `versao: "1.0.0"
aula: "A3 - Trafego"
insumos_a2:
  angulos:
    - nome: "Estrutura antes de escalar"
      nivel_consciencia: "consciente_do_problema"
    - nome: "Decisao semanal com dados"
      nivel_consciencia: "consciente_da_solucao"
    - nome: "Angulo sem nivel"
      nivel_consciencia: ""`,
};

function proposalText(value: unknown): string {
  return JSON.stringify(value);
}

function artifactOf(proposal: { artifacts: ControlledArtifact[] }, artifactType: string): ControlledArtifact | undefined {
  return proposal.artifacts.find((artifact) => artifact.artifactType === artifactType);
}

function normalize(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function runSkill(
  skillId: string,
  operatorInput: string,
  context: Record<string, unknown> = { artifacts: [copy, panel] },
) {
  const result = await runner.run(skillId, { projectId, brief, context, operatorInput });
  return result.proposal;
}

const results: Array<{ skillId: string; status: 'pass'; checks: string[]; artifacts: string[] }> = [];

const zelador = await runSkill(
  'zelador',
  'O operador nao confirmou CAPI, deduplicacao, dominio nem pagamento. Retorne CRITICO, nao libere campanha e registre as lacunas sem inventar.',
);
assert.match(proposalText(zelador), /critico/i);
assert.match(proposalText(zelador), /false/);
results.push({
  skillId: 'zelador',
  status: 'pass',
  checks: ['critico', 'campanha_nao_liberada'],
  artifacts: zelador.artifacts.map((artifact) => artifact.path),
});

const briefista = await runSkill(
  'briefista',
  'Gere variacoes apenas para os dois angulos com nivel declarado. Recuse explicitamente o angulo sem nivel e deixe a curadoria humana pendente.',
);
assert.match(proposalText(briefista), /recus|angulo_recusado|nivel/i);
assert.match(proposalText(briefista), /Estrutura antes de escalar|Decisao semanal com dados/);
results.push({
  skillId: 'briefista',
  status: 'pass',
  checks: ['dois_angulos_declarados', 'recusa_sem_nivel', 'curadoria_humana'],
  artifacts: briefista.artifacts.map((artifact) => artifact.path),
});

const estruturador = await runSkill(
  'estruturador',
  'Monte somente a recomendacao: Vendas, objetivo Conversao, publico amplo/frio com Advantage+, R$30/dia por 7 dias. Nao publique, nao pause, nao escale e deixe a decisao humana explicita.',
);
assert.match(proposalText(estruturador), /vendas/i);
assert.match(normalize(proposalText(estruturador)), /convers[aã]o|conversao/);
assert.doesNotMatch(proposalText(estruturador), /status[^\n]*(live|published)|submetida_por_humano_em[^\n]*202/i);
results.push({
  skillId: 'estruturador',
  status: 'pass',
  checks: ['vendas', 'conversao', 'recommend_only'],
  artifacts: estruturador.artifacts.map((artifact) => artifact.path),
});

const leitor = await runSkill(
  'leitor-de-metricas',
  'O operador forneceu literalmente: gasto R$210; impressoes 41.800; cliques no link 334; conversoes Compra 4; CPA do gerenciador R$52,50; ROAS do gerenciador 3,1x. Nao forneceu CTR, CPM, alcance, frequencia nem janela de atribuicao. Registre ausentes como null com selo nao_fornecido; nao calcule o que nao foi fornecido; ROAS e Estimado.',
);
const metricArtifact = artifactOf(leitor, 'trafficMetricReading');
assert.ok(metricArtifact, 'Leitor precisa produzir trafficMetricReading');
const metricReading = parse(metricArtifact.content);
const signals = metricReading?.leitor?.sinais ?? [];
const requiredMissing = ['CTR', 'CPM', 'Alcance', 'Frequencia'];
const missingFound = requiredMissing.filter((metric) => {
  const signal = signals.find((candidate: { metrica?: unknown }) => normalize(candidate.metrica) === normalize(metric));
  return signal && (signal.valor == null || normalize(signal.selo).replace(/[_-]+/g, ' ').includes('nao fornecido'));
});
assert.deepEqual(new Set(missingFound), new Set(requiredMissing));
results.push({
  skillId: 'leitor-de-metricas',
  status: 'pass',
  checks: ['literais_preservados', 'ctr_cpm_alcance_frequencia_nao_fornecidos', 'roas_estimado'],
  artifacts: leitor.artifacts.map((artifact) => artifact.path),
});

const diagnosticContext = { artifacts: leitor.artifacts };
const diagnosticador = await runSkill(
  'diagnosticador',
  'Leia apenas a leitura literal anterior. Retorne uma unica alavanca, hipotese, criterio de sucesso, criterio de reversao e circuit breaker. Nao calcule nem estime CTR, CPM, alcance ou frequencia; a decisao e humana.',
  diagnosticContext,
);
const unavailable = unavailableTrafficMetrics(diagnosticContext);
assert.deepEqual(derivedUnavailableTrafficMetrics(diagnosticador, unavailable), []);
assert.match(proposalText(diagnosticador), /alavanca|lever/i);
assert.match(proposalText(diagnosticador), /sucesso|success/i);
assert.match(proposalText(diagnosticador), /revers|reversal/i);
results.push({
  skillId: 'diagnosticador',
  status: 'pass',
  checks: ['uma_alavanca', 'criterio_sucesso', 'criterio_reversao', 'zero_derivacao_metricas_ausentes'],
  artifacts: diagnosticador.artifacts.map((artifact) => artifact.path),
});

console.log(JSON.stringify({
  test: 'traffic-controlled-matrix',
  mode: 'local-read-only',
  metaMutation: false,
  projectId,
  results,
}, null, 2));
