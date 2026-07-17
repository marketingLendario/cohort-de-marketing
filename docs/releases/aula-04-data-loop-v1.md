# Aula 4 Data Loop v1 — manifesto de prontidão local

Data do gate: 2026-07-15

Story: `17.W3.2`

Status: **gate técnico local aprovado; aguarda quality gate independente; não publicado**

## Versões congeladas

| Contrato/artefato | Versão |
|---|---|
| CampaignPlan | `1.0.0` |
| WeeklyPanel | `1.0.0` |
| WeeklyLedger | `1.1.0` |
| HistoricalMetricsReading | `1.0.0` |
| SourceObservationSet / SourceReconciliation | `1.0.0` |
| DecisionOutcomeEvaluationRequest / DecisionOutcomeDiagnosis | `1.0.0` |
| Walkthrough público | `WALKTHROUGH_COMPLETE` |
| Skill catalog | `1.0.0` |

As versões vêm dos contratos e artefatos integrados das stories W1, W2 e W3.1.
Este manifesto não redefine schema, validator, regra de negócio ou skill.

## Compatibilidade Aula 3 → Aula 4

| Entrada/estado | Resultado comprovado |
|---|---|
| Primeira semana pública W3.1 | `WeeklyPanel 1.0.0` válido; fonte opaca, janela, selo e confirmação preservados no ledger |
| Uma semana disponível | leitura `insufficient_history`, sem tendência ou número derivado |
| Métrica `nao_fornecido` | valor e janela nulos, confirmação falsa e estado `missing_or_unconfirmed` |
| Janela ausente | estado `incompatible_attribution_window`, decisão humana requerida |
| Fonte textual não rastreável | rejeição `INVALID_METRIC_PROVENANCE_REFERENCE`, sem ledger parcial |
| Três semanas públicas | seis artefatos determinísticos e diagnóstico inconclusivo |
| Decisão histórica | `approved` preservado no request; nova decisão `pending` no diagnóstico |

A compatibilidade começa no `WeeklyPanel` estruturado entregue pelo handoff da
Aula 3. O template YAML didático não é convertido implicitamente pelo gate.

## Verificação reproduzível

Execute na raiz de um checkout limpo:

```bash
npm --prefix scripts ci --ignore-scripts
node --test scripts/aula-04-release-gate.test.mjs
node --test --test-concurrency=1 \
  scripts/validate-aula-04-contracts.test.mjs \
  scripts/build-weekly-ledger.test.mjs \
  scripts/read-aula-04-history.test.mjs \
  scripts/reconcile-aula-04-sources.test.mjs \
  scripts/diagnose-aula-04-decision.test.mjs \
  scripts/run-aula-04-walkthrough.test.mjs \
  scripts/aula-04-release-gate.test.mjs
node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
node scripts/validate-project-brief-rules.mjs
node scripts/validate-skill-catalog.mjs
node scripts/validate-mapa-wiring.mjs
node scripts/validate-mapa-skills.mjs
```

Os três contratos positivos da Aula 4 também devem passar individualmente em
`scripts/validate-aula-04-contracts.mjs`. Os source-locks, `leitor-de-metricas`
e `diagnosticador` devem permanecer byte a byte equivalentes nos mirrors.

## Segurança e distribuição

- Inputs e outputs são sintéticos e públicos; nenhum arquivo de projeto real é consumido.
- O walkthrough não acessa rede, Studio, Meta, checkout, caixa ou credencial.
- Scans cobrem email, segredo, token materializado, chave privada, path absoluto de máquina e identificadores pessoais shaped nos materiais e outputs liberáveis.
- O catálogo verifica as 31 skills, 41 edges, mirrors canônicos/Codex e hashes dos source-locks.
- O diretório de exemplo permanece imutável e outputs vivem somente em diretório temporário ou explicitamente informado.

## Limitações

- O gate não converte automaticamente o template didático da Aula 3 para JSON.
- O gate não registra a próxima decisão humana: preserva a histórica aprovada e exige a próxima como `pending`.
- O gate não elege plataforma, checkout ou caixa como fonte verdadeira e não converte moeda ou janela.
- `deploy_type: none`: nenhum push, PR, tag, pacote, publicação ou deploy faz parte desta story.

## Rollback

Se o quality gate independente reprovar, não integrar a branch da story. Se a
mudança já tiver sido integrada localmente, reverter os commits da Story
`17.W3.2` como unidade e executar novamente focal, matriz Aula 4, full Node,
validators, mirrors e scans. Não reverter individualmente contratos ou runtime
W1/W2/W3.1 e não editar manualmente os skills.

## Sign-offs

| Papel | Estado | Evidência |
|---|---|---|
| Product Owner | `READY` | contrato/allowlist materializados antes do código |
| QA executor | `PASS técnico` | focal, regressões, validators, mirrors, checkout e scans |
| Architect quality gate | `PENDING` | execução independente após handoff `InReview` |

Veredito local: **PASS TÉCNICO — READY FOR ARCHITECT QG**. Este veredito não
declara fan-in, publicação, push, PR ou deploy.
