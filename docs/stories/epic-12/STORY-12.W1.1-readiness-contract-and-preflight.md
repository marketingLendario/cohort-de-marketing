---
status: Ready
story_id: "12.W1.1"
title: "Contrato de readiness e preflight de campanha"
epic: 12
wave: "W1"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: executing
appetite: "3d"
confidence_level: needs-spike
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-readiness-contract
  status_expected: draft
entity_output:
  entity_type: campaign-readiness-contract
  status_expected: ready
involves_ui: false
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/lib/readiness.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/readiness.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-plan.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-plan.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-domain.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts"
  - "data/contracts/campaign-plan.v1.schema.json"
  - "data/contracts/campaign-readiness.v1.schema.json"
  - "data/campaign-readiness-capabilities.json"
  - "apps/academia-lendaria-ads-studio/shared/campaign-readiness.ts"
  - "apps/academia-lendaria-ads-studio/shared/campaign-readiness.test.ts"
  - "apps/academia-lendaria-ads-studio/tsconfig.server.json"
  - "apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.test.ts"
  - "apps/academia-lendaria-ads-studio/server/local-skill-runner.ts"
  - "docs/stories/epic-12/STORY-12.W1.1-readiness-contract-and-preflight.md"
---

> **Estimated effort:** 2h  
> **Depends on:** none

# STORY-12.W1.1 — Contrato de readiness e preflight de campanha

## User Story

**As an operator**, **I want** campaign creation to consult the same readiness
used by the journey, **so that** I never receive a broken draft or a plan filled
with invented data.

## Story

**As an operator**, **I want** campaign creation to consult the same readiness
used by the journey, **so that** I never receive a broken draft or a plan filled
with invented data.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [ ] AC1: O snapshot `campaign-readiness.v1` avalia `campaign.create`,
  `campaign.tracking`, `campaign.brief`, `campaign.structure`,
  `campaign.measure` e `campaign.diagnose` separadamente, usando as regras
  canônicas e o mapeamento declarativo sem ciclo.
- [ ] AC2: O fingerprint cobre projeto, revisão do briefing, artifact index e
  versão/hash das unlock rules; `computedAt` não altera a identidade.
- [ ] AC3: Campos e artefatos ausentes permanecem ausentes;
  `createInitialCampaignPlan` não fabrica awareness, dor, budget, finalists ou
  tracking e não materializa `CampaignPlanRevision` antes de as capabilities de
  tracking/brief liberarem a etapa correspondente.
- [ ] AC4: `useCreateCampaign` executa preflight de `campaign.create` antes do
  insert e retorna `READINESS_BLOCKED` sem mutação quando bloqueado; enforcement
  server-side fica explicitamente na W4.2/W4.
- [ ] AC5: O contrato compartilhado é consumível por browser e server sem duplicar
  a matriz, com schema/fixtures e testes de projeto vazio, parcial, pronto,
  warning e fingerprint obsoleto.

## Tasks

- [ ] T1: Mapear o shape atual de `readiness.ts`, regras e repositórios.
- [ ] T2: Implementar o contrato por capability e mapeadores sem duplicar regras.
- [ ] T3: Remover fallbacks sem proveniência do plano inicial.
- [ ] T4: Adicionar preflight de cliente no hook/repository de criação e registrar
  explicitamente a autoridade server-side da W4.
- [ ] T5: Rodar testes, lint, typecheck e builds e registrar evidência.

## File List

- `apps/academia-lendaria-ads-studio/src/lib/readiness.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/readiness.test.ts` (MODIFY/ADD)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-plan.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-plan.test.ts` (MODIFY/ADD)
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` (MODIFY only if the draft boundary requires it)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts` (MODIFY/ADD compatibility coverage)
- `data/contracts/campaign-plan.v1.schema.json` (VERIFY unchanged or update only with compatibility evidence)
- `data/contracts/campaign-readiness.v1.schema.json` (ADD)
- `data/campaign-readiness-capabilities.json` (ADD)
- `apps/academia-lendaria-ads-studio/shared/campaign-readiness.ts` (ADD)
- `apps/academia-lendaria-ads-studio/shared/campaign-readiness.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/tsconfig.server.json` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.test.ts` (MODIFY/ADD)
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` (MODIFY only for shared error contract)
- `docs/stories/epic-12/STORY-12.W1.1-readiness-contract-and-preflight.md` (MODIFY lifecycle sections)

## Dev Notes

Reusar `evaluateProjectSkills`, `data/skill-unlock-rules.json` e os tipos de
artifact index. A story não deve criar uma segunda matriz de requisitos.
O draft mínimo é apenas `ads_campaigns`; o contrato obrigatório de
`CampaignPlanRevision` continua intacto e só nasce quando as etapas de
tracking/brief estiverem liberadas. Preflight deve ser idempotente e ocorrer
antes de qualquer insert; a atomicidade server-side pertence à W4.2/W4;
erros devem ser serializáveis para a UI sem paths absolutos ou secrets.

## Artefatos produzidos e consumidos

- Produz: contrato `campaign-readiness.v1`, schema, fingerprint determinístico,
  fixtures e preflight client-side.
- Consome: readiness existente, artifact index, unlock rules, domínio de
  campanha e repositório atual. O schema `campaign-plan.v1` permanece compatível;
  qualquer alteração exige cobertura explícita dos consumidores existentes.

## Condição de validação

O identificador segmentado `12.W1.1` é o formato canônico `epic.Wwave.seq`.
O checklist legado precisa aceitar esse formato antes do dispatch; não renomear
a story para satisfazer um regex obsoleto.

## Change Log

- 2026-07-16 — @architect: contrato por capability, schema canônico, mapping
  declarativo e autoridade transacional delegada às stories W4.
