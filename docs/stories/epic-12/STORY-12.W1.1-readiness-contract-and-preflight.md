---
status: Done
story_id: "12.W1.1"
title: "Contrato de readiness e preflight de campanha"
epic: 12
wave: "W1"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: done
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

- [x] AC1: O snapshot `campaign-readiness.v1` avalia `campaign.create`,
  `campaign.tracking`, `campaign.brief`, `campaign.structure`,
  `campaign.measure` e `campaign.diagnose` separadamente, usando as regras
  canônicas e o mapeamento declarativo sem ciclo.
- [x] AC2: O fingerprint cobre projeto, revisão do briefing, artifact index e
  versão/hash das unlock rules; `computedAt` não altera a identidade.
- [x] AC3: Campos e artefatos ausentes permanecem ausentes;
  `createInitialCampaignPlan` não fabrica awareness, dor, budget, finalists ou
  tracking e não materializa `CampaignPlanRevision` antes de as capabilities de
  tracking/brief liberarem a etapa correspondente. **Escopo residual explícito**
  (ver Dev Notes): a função em si nunca mais fabrica dado nenhum; o *call site*
  que decide QUANDO chamá-la (`project-campaigns.tsx` /
  `traffic-campaign-workspace.tsx`) pertence ao file_scope exclusivo de
  12.W2.1 (que já declara `depends_on: ["12.W1.1"]`) e não foi tocado aqui.
- [x] AC4: `useCreateCampaign` executa preflight de `campaign.create` antes do
  insert e retorna `READINESS_BLOCKED` sem mutação quando bloqueado; enforcement
  server-side fica explicitamente na W4.2/W4.
- [x] AC5: O contrato compartilhado é consumível por browser e server sem duplicar
  a matriz, com schema/fixtures e testes de projeto vazio, parcial, pronto,
  warning e fingerprint obsoleto.

## Tasks

- [x] T1: Mapear o shape atual de `readiness.ts`, regras e repositórios.
- [x] T2: Implementar o contrato por capability e mapeadores sem duplicar regras.
- [x] T3: Remover fallbacks sem proveniência do plano inicial.
- [x] T4: Adicionar preflight de cliente no hook/repository de criação e registrar
  explicitamente a autoridade server-side da W4.
- [x] T5: Rodar testes, lint, typecheck e builds e registrar evidência.

## File List

- `apps/academia-lendaria-ads-studio/src/lib/readiness.ts` — **NÃO modificado**
  (verificado suficiente: `evaluateProjectSkills`/`evaluateSkill` já expõem tudo
  que o contrato precisa; reusado como está, sem alterar sua API).
- `apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/readiness.test.ts` — **NÃO
  modificado** (nenhum comportamento de `readiness.ts` mudou).
- `apps/academia-lendaria-ads-studio/src/lib/campaign-plan.ts` (MODIFY —
  `createInitialCampaignPlan` não fabrica mais awareness/dor/budget).
- `apps/academia-lendaria-ads-studio/src/lib/campaign-plan.test.ts` (MODIFY —
  3 casos novos de não-fabricação).
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts` — **NÃO
  modificado** (os tipos existentes de `MarketingProject`/`ProjectBriefRevision`/
  `ProjectArtifact`/`SkillRun` já cobrem o que `shared/campaign-readiness.ts`
  precisa consumir).
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` — **NÃO
  modificado** (`getProject`/`getActiveBrief`/`listArtifacts`/`listSkillRuns`
  já existentes bastam para montar o contexto do preflight).
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts` —
  **NÃO modificado** (sem mudança de comportamento no repository).
- `data/contracts/campaign-plan.v1.schema.json` — **VERIFICADO sem alteração**
  (o sentinela `{daily:0, periodDays:1}` continua satisfazendo o schema atual;
  não havia motivo para relaxar `budget` a nullable — ver Dev Notes).
- `data/contracts/campaign-readiness.v1.schema.json` (ADD)
- `data/campaign-readiness-capabilities.json` (ADD)
- `apps/academia-lendaria-ads-studio/shared/campaign-readiness.ts` (ADD)
- `apps/academia-lendaria-ads-studio/shared/campaign-readiness.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/tsconfig.server.json` — **NÃO modificado**
  (ver Dev Notes §Decisões de escopo).
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts`
  — **NÃO modificado** (sem consumidor server-side nesta wave).
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.ts` (MODIFY —
  preflight de `campaign.create` antes do insert).
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` — **NÃO
  modificado** (ver Dev Notes §Decisões de escopo).
- `docs/stories/epic-12/STORY-12.W1.1-readiness-contract-and-preflight.md`
  (MODIFY lifecycle sections)

## Dev Notes

Reusar `evaluateProjectSkills`, `data/skill-unlock-rules.json` e os tipos de
artifact index. A story não deve criar uma segunda matriz de requisitos.
O draft mínimo é apenas `ads_campaigns`; o contrato obrigatório de
`CampaignPlanRevision` continua intacto e só nasce quando as etapas de
tracking/brief estiverem liberadas. Preflight deve ser idempotente e ocorrer
antes de qualquer insert; a atomicidade server-side pertence à W4.2/W4;
erros devem ser serializáveis para a UI sem paths absolutos ou secrets.

### Decisões de escopo registradas pelo Dev Agent

1. **`createInitialCampaignPlan` nunca mais fabrica dado, mas seus 2 call
   sites (`project-campaigns.tsx`, `traffic-campaign-workspace.tsx`) não foram
   tocados.** Ambos pertencem ao `file_scope: exclusive` de STORY-12.W2.1
   (`depends_on: ["12.W1.1"]`), que é quem vai decidir QUANDO chamar a função
   (gating de `campaign.tracking`/`campaign.brief` antes de materializar o
   plano). Alterar esses 2 arquivos aqui violaria o file_scope exclusivo de
   outra story já desenhada para isso.
2. **`budget` continua um objeto obrigatório (não nullable).**
   `traffic-campaign-workspace.tsx` (fora do file_scope) lê `plan.budget.daily`
   em 5 lugares sem checagem de nulidade; torná-lo `| null` quebraria
   `typecheck` num arquivo que esta story não pode tocar. A não-fabricação foi
   satisfeita trocando o default fabricado (`{daily:30, periodDays:7}`, um
   número plausível que passaria por dado real) por um sentinela inequívoco
   (`{daily:0, periodDays:1}`) que mantém `canStructureCampaign` corretamente
   bloqueado até um humano digitar a verba real.
3. **`tsconfig.server.json`, `server/local-skill-runner.ts` e seu teste não
   foram tocados.** O ADR-002 e o AC4 são explícitos: "W1 faz o preflight no
   cliente; W4 adiciona a mesma validação no servidor" — não há consumidor
   server-side do contrato nesta wave. AC5 ("consumível por browser e
   servidor") foi satisfeito arquiteturalmente: `shared/campaign-readiness.ts`
   não importa nada de `@/generated/*`, `@supabase/*`, DOM ou `node:*` — é puro
   e roda em qualquer runtime por construção, pronto para a W4 importar sem
   refatoração. Mudar `rootDir`/`outDir` de `tsconfig.server.json` sem um
   consumidor real seria invenção de escopo.
4. **`project-domain.ts`/`project-repository.ts`/`readiness.ts` e seus testes
   não foram tocados.** Cada um já expunha exatamente o que o contrato
   precisava (tipos de domínio, `getProject`/`getActiveBrief`/`listArtifacts`/
   `listSkillRuns`, `evaluateProjectSkills`) sem necessidade de alteração —
   verificado rodando a suíte completa antes e depois.
5. **`data/campaign-readiness-capabilities.json` não passa pelo gerador de
   `scripts/generate-skill-catalog.mjs`** (fora do file_scope desta story).
   Em vez disso, `shared/campaign-readiness.ts` embute uma cópia versionada
   (`CAMPAIGN_READINESS_CAPABILITIES`) e `shared/campaign-readiness.test.ts` lê
   o JSON canônico do disco e verifica deep-equality — drift vira teste
   vermelho, seguindo o mesmo princípio de "cópia versionada e validada" que o
   ADR-002 já descreve para o consumo do Studio.

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

## Dev Agent Record

**Agent model:** Claude Sonnet 5 (claude-sonnet-5), atuando como `@dev`.

### Completion Notes

- Implementado o contrato `campaign-readiness.v1` como módulo puro
  (`shared/campaign-readiness.ts`, zero dependências de ambiente) + wiring
  browser (`src/lib/campaign-readiness.ts`) que reusa `evaluateProjectSkills`
  sem duplicar a matriz de `data/skill-unlock-rules.json`.
- Mapeamento declarativo capability → skill em
  `data/campaign-readiness-capabilities.json`, com cópia versionada embutida e
  validada por deep-equality em `shared/campaign-readiness.test.ts` (drift
  vira teste vermelho). Ciclo verificado via `assertAcyclicSkillGraph`
  (testado com um fixture cíclico sintético + a cadeia real
  zelador→estruturador→leitor-de-métricas→diagnosticador).
- `createInitialCampaignPlan` parou de fabricar awareness/dor/budget; ver
  Dev Notes §Decisões de escopo para a análise completa do trade-off de
  `budget` (sentinela `{daily:0}` em vez de tipo nullable, para não quebrar
  `typecheck` de um arquivo fora do file_scope).
- `useCreateCampaign` roda o preflight de `campaign.create` antes do insert
  quando há `projectId` (jornada de projeto); retorna `null` + mensagem
  `READINESS_BLOCKED` sanitizada sem nenhuma mutação quando bloqueado. O
  atalho legado sem projeto permanece sem preflight (sem contexto de projeto
  para avaliar).
- 5 arquivos do File List original foram deliberadamente **não modificados**
  após verificação de que já eram suficientes (ver Dev Notes) — registrado
  explicitamente para não parecer omissão silenciosa.
- Ambiente: o worktree não trazia `node_modules` nem `.env.local` (não
  versionados); resolvido via symlink de `node_modules` do checkout principal
  (mesmo `package-lock.json`, hash conferido) e cópia do `.env.local` local —
  nenhuma mudança de código, apenas provisionamento local de dev.

### Evidência dos quality_gate_tools (rodados no worktree, 2026-07-16)

| Comando | Resultado |
|---|---|
| `npm --prefix apps/academia-lendaria-ads-studio test` | PASS — 43 arquivos, 335 testes |
| `npm --prefix apps/academia-lendaria-ads-studio run typecheck` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run lint` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run build` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run build:server` | PASS |
| `git diff --check` | PASS (sem whitespace errors) |

### File List

Ver seção `## File List` acima (ADD/MODIFY explícitos + não-modificações
justificadas).

## QA Results

### Quality Gate Report — @architect (independent review)

- **Verdict:** PASS
- **Quality Score:** 92/100
- **Data:** 2026-07-16

**quality_gate_tools reproduzidos independentemente (mesmo worktree, execução própria):**

| Gate | Reportado pelo dev | Reproduzido pelo @architect |
|---|---|---|
| `npm test` | PASS — 43 arquivos / 335 testes | PASS — 43 arquivos / 335 testes (idêntico) |
| `typecheck` | PASS | PASS (`tsc -b`, exit 0) |
| `lint` | PASS | PASS (`eslint .`, exit 0) |
| `build` | PASS | PASS |
| `build:server` | PASS | PASS |
| `git diff --check` | PASS | PASS (sem whitespace errors) |

**Integridade de escopo:** confirmado que as únicas modificações rastreadas
(M) são `campaign-plan.ts`, `campaign-plan.test.ts`, `use-create-campaign.ts`
— todas dentro de `touched_paths`. Nenhum arquivo fora do file_scope foi
alterado. Artefatos de framework não versionados (`.aiox-core`, `squads`,
`services/mux-adapter`, `.sinkra`, skills sinkra) são ruído pré-existente do
worktree, não desta story.

**AC1–AC5:** todos verificados como atendidos. `shared/campaign-readiness.ts`
confirmado genuinamente puro (zero imports de `@/generated`, `@supabase`, DOM
ou `node:*`), validando AC5 por construção. Não-fabricação (AC3) confirmada
em código e teste (`angles: []` sem pain+awareness genuínos; sentinela de
budget mantém `canStructureCampaign` bloqueado). Preflight (AC4) confirmado
zero-mutação quando bloqueado.

**As 5 decisões de escopo documentadas nos Dev Notes foram avaliadas como
legítimas** (não são fuga de trabalho): call sites de `createInitialCampaignPlan`
pertencem ao file_scope exclusivo de 12.W2.1 (que depende desta story);
budget não-nullable + sentinela é defensável dado o blast radius em arquivo
fora de escopo; ausência de wiring server-side bate com o ADR-002 literal
("W1 client, W4 server"); domain/repository/readiness não precisavam de
alteração; a cópia embutida + teste de deep-equality segue o princípio do
próprio ADR ("cópia versionada e validada").

**Observações não-bloqueantes (sem ação exigida nesta wave):**

- `fingerprintSeed` não inclui `runs` diretamente — coberto indiretamente via
  `artifactIndex`; considerar revisitar quando W2/W4 aprofundarem observação
  de execução assíncrona.
- `campaign-readiness.v1.schema.json` é um artefato estático sem validação
  runtime (ajv) contra snapshots emitidos — aceitável para o escopo desta AC5.
- `findSkillEvaluation` falha alto (throw) em drift de configuração — decisão
  fail-loud defensável dado que `evaluateProjectSkills` sempre cobre os 30
  skills do catálogo.
- Atalho legado sem projeto (dashboard) permanece sem preflight — justificado
  (sem contexto de projeto para avaliar); convergência é de wave posterior.

**Recomendação:** registrar PASS e prosseguir para @devops (merge-back fora do
escopo deste agente — push/PR são exclusivos de @devops).

## Change Log

- 2026-07-16 — @architect: contrato por capability, schema canônico, mapping
  declarativo e autoridade transacional delegada às stories W4.
- 2026-07-16 — @po: story reconhecida como Ready para dispatch da wave
  12-w1 (worktree `wave/12-w1/story-12.W1.1` provisionado a partir de
  `origin/main`, commit base `b8900a0`).
- 2026-07-16 — @dev: implementado o contrato `campaign-readiness.v1`
  (`shared/campaign-readiness.ts` + wiring browser em
  `src/lib/campaign-readiness.ts`), mapeamento declarativo em
  `data/campaign-readiness-capabilities.json`, schema
  `data/contracts/campaign-readiness.v1.schema.json`, remoção de fabricação em
  `createInitialCampaignPlan` (AC3) e preflight client-side em
  `useCreateCampaign` (AC4). Todos os `quality_gate_tools` verdes. 5 decisões
  de escopo documentadas em Dev Notes (arquivos deliberadamente não tocados,
  respeitando o file_scope exclusivo de stories irmãs).
- 2026-07-16 — @architect: Quality Gate PASS (92/100) — quality_gate_tools
  reproduzidos independentemente, integridade de escopo confirmada, AC1-AC5
  verificados, decisões de escopo avaliadas como legítimas. Sem findings
  bloqueantes.
