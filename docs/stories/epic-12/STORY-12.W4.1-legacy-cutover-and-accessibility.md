---
status: InReview
story_id: "12.W4.1"
title: "Cutover legado e acessibilidade do gate de campanhas"
epic: 12
wave: "W4"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: figuring_out
appetite: "3d"
confidence_level: needs-spike
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-legacy-cutover
  status_expected: draft
entity_output:
  entity_type: campaign-legacy-cutover
  status_expected: ready
involves_ui: true
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W3.1", "12.W4.2"]
consumes_artifacts_of: ["12.W1.1", "12.W2.1", "12.W4.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/shared/campaign-create.ts"
  - "apps/academia-lendaria-ads-studio/shared/campaign-create.test.ts"
  - "apps/academia-lendaria-ads-studio/shared/campaign-readiness.test.ts"
  - "apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/dashboard.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/dashboard.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/spoke-selector.tsx"
  - "apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx"
  - "apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts"
  - "apps/academia-lendaria-ads-studio/tsconfig.server.json"
  - "apps/academia-lendaria-ads-studio/vitest.config.ts"
  - "docs/stories/epic-12/STORY-12.W4.1-legacy-cutover-and-accessibility.md"
---

> **Estimated effort:** 2h
> **Depends on:** 12.W3.1, 12.W4.2

# STORY-12.W4.1 — Cutover legado e acessibilidade do gate de campanhas

## User Story

**As an operator using either the legacy dashboard or the new project
journey**, **I want** every surface that can create a campaign to enforce the
exact same readiness contract, **so that** no side door — legacy route,
legacy dashboard, or the creation call itself — can produce an invalid or
orphaned campaign, and the gate remains fully usable by keyboard and screen
reader.

## Story

**As an operator using either the legacy dashboard or the new project
journey**, **I want** every surface that can create a campaign to enforce the
exact same readiness contract, **so that** no side door — legacy route,
legacy dashboard, or the creation call itself — can produce an invalid or
orphaned campaign, and the gate remains fully usable by keyboard and screen
reader.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [x] AC1: The legacy route `campaigns/$campaignId/$step`, the legacy dashboard
  (`dashboard.tsx`), and the campaign-creation call all consult the SAME
  `campaign-readiness.v1` contract used by the new surface (12.W2.1) — no side
  door creates an invalid campaign.
- [x] AC2: The creation call consumes the transactional/idempotent RPC
  delivered by 12.W4.2 (`campaign_create_readiness_rpc`) — no path performs a
  direct `insert` into `ads_campaigns`; existing campaigns remain readable.
- [x] AC3: Blocked creation never writes a partial row server-side; concurrency,
  a repeated `idempotencyKey`, and a stale snapshot all return an actionable
  conflict (proved by a test that calls the same RPC surface a client bypass
  would hit, not just the UI).
- [x] AC4: The gate, its checklist/loader states, and its errors are keyboard-
  navigable with visible focus and adequate labels/`aria-*`; Playwright proves
  the 390px viewport has zero horizontal overflow on every touched surface.
- [x] AC5: Repository/component/route tests prove compatibility with existing
  draft campaigns — no existing draft is deleted, and no campaign is silently
  promoted to "ready" without real provenance.

## Tasks

- [x] T1: Map every campaign-creation call site (`use-create-campaign.ts`,
  `dashboard.tsx`, `project-campaigns.tsx`, the legacy route) and confirm which
  ones bypass the readiness contract or the transactional RPC.
- [x] T2: Rewire `useCreateCampaign` to call `campaign_create_readiness_rpc`
  directly (browser, `authenticated` role) instead of inserting into
  `ads_campaigns`; extract the RPC-payload interpretation into a shared, pure
  module reused by the browser and the existing backend repo.
- [x] T3: Gate the legacy dashboard's "+ Nova campanha" on the same
  `campaign-readiness.v1` contract (zero/one/many projects), reusing the
  existing structural `PROJECT_NOT_FOUND`/`project.select` semantics instead of
  inventing a new blocking code.
- [x] T4: Fix the accessibility/390px gaps the new Playwright coverage
  surfaces on the touched legacy screens.
- [x] T5: Run every `quality_gate_tools` command locally (including `test:db`/
  `lint:db` against the local Docker Supabase stack) and record the evidence.

## File List

- `apps/academia-lendaria-ads-studio/shared/campaign-create.ts` (ADD — pure,
  environment-agnostic interpretation of the `campaign_create_readiness_rpc`
  jsonb payload; shared by the browser and the backend repo, AC1/AC2).
- `apps/academia-lendaria-ads-studio/shared/campaign-create.test.ts` (ADD —
  11 tests covering every success/failure code + the two throw-on-infra-error
  paths).
- `apps/academia-lendaria-ads-studio/shared/campaign-readiness.test.ts`
  (MODIFY — fixed a relative-import extension so this file, orphaned since
  12.W1.1 and never actually executed by either vitest project, now runs; see
  Dev Notes).
- `apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.ts`
  (MODIFY — refactored to call the shared mapper instead of a second
  hand-rolled copy of the same payload-interpretation logic; zero behavior
  change, all 11 pre-existing tests still pass unmodified).
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.ts` (MODIFY —
  closes the "side door": every real creation call, with or without a
  `projectId`, now goes through `campaign_create_readiness_rpc`; a missing
  `projectId` is evaluated client-side as `PROJECT_NOT_FOUND` with zero
  network call, AC1/AC2/AC3).
- `apps/academia-lendaria-ads-studio/src/lib/use-create-campaign.test.ts`
  (MODIFY — rewritten around `supabase.rpc` instead of `.insert`; 9 tests
  covering the closed side door, the client preflight, every RPC
  success/failure code, and the sanitized-message guarantee, AC3).
- `apps/academia-lendaria-ads-studio/src/components/dashboard.tsx` (MODIFY —
  gates "+ Nova campanha" on `campaign.create` using the SAME
  `evaluateCampaignReadiness` contract as the new surface: zero or ambiguous
  (>1) projects → blocked with the reused `PROJECT_NOT_FOUND` reason and a CTA
  to `/projects`; exactly one project → that project becomes the creation
  target, AC1/AC4).
- `apps/academia-lendaria-ads-studio/src/components/dashboard.test.tsx`
  (MODIFY — rewritten; the old zero-project "creates a draft directly" test
  is replaced because that WAS the side door — see Dev Notes; 9 tests covering
  zero/one/many-project gating, the reused blocking contract, and keyboard
  reachability of the CTA).
- `apps/academia-lendaria-ads-studio/src/components/spoke-selector.tsx`
  (MODIFY — a11y/390px fix, AC4; see Dev Notes).
- `apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx` (MODIFY —
  a11y/390px fix, AC4; see Dev Notes).
- `apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts`
  (MODIFY — new `describe` block covering the dashboard's gate: CTA enabled
  for the demo fixture's single valid project, keyboard focus, and zero
  horizontal overflow at 390px, AC4).
- `apps/academia-lendaria-ads-studio/tsconfig.server.json` (MODIFY — broadened
  `rootDir`/`include` so `server/` can import the new `shared/campaign-create.ts`
  module; see Dev Notes).
- `apps/academia-lendaria-ads-studio/vitest.config.ts` (MODIFY — `shared/**/*.test.ts`
  now included in the `server` vitest project; see Dev Notes).
- `docs/stories/epic-12/STORY-12.W4.1-legacy-cutover-and-accessibility.md`
  (ADD).

## Dev Notes

Esta story NÃO aplica SQL remoto e não cria nenhuma migration — o RPC
transacional/idempotente já foi entregue e testado exaustivamente pela
12.W4.2 (`campaign_create_readiness_rpc`, 14 assertions pgTAP). O trabalho
aqui é fechar os pontos de entrada que ainda bypassavam esse contrato e
convergir a superfície legada com a nova (12.W2.1), sem apagar nenhuma
campanha existente e sem promover uma campanha antiga a "ready" sem
proveniência real.

### O "side door" real encontrado (T1)

Antes desta story, `useCreateCampaign` tinha DOIS problemas simultâneos:
1. Quando chamada SEM `projectId` (o atalho do dashboard legado,
   `dashboard.tsx` `handleNewCampaign`), pulava QUALQUER preflight — zero
   verificação de prontidão — e inseria direto em `ads_campaigns` via
   `supabase.from('ads_campaigns').insert(...)`.
2. Mesmo quando chamada COM `projectId` e o preflight client-side liberava a
   criação, o insert real ainda era um `.insert()` direto — nunca passava pela
   RPC transacional/idempotente da 12.W4.2. Um bypass direto do client
   (chamando `.insert()` sem passar pelo hook) não tinha NENHUMA barreira
   server-side além de RLS de tabela genérica — a 12.W4.2 construiu a barreira
   certa (`campaign_create_readiness_rpc`), mas nada no app a consumia ainda.

A rota legada `campaigns/$campaignId/$step` (`src/routes/campaigns/$campaignId.$step.tsx`)
foi verificada e **não precisou de nenhuma mudança de código**: ela nunca cria
uma campanha, apenas lê uma campanha já existente (`LegacyCutoverBridge`, um
`select` simples) e faz a ponte para o workspace unificado quando encontra o
`project_id`. Como a criação real agora só acontece através de
`useCreateCampaign` (ver abaixo), fechar o side door ali automaticamente
fecha o único caminho por onde essa rota poderia ser alcançada com uma
campanha inválida.

### Fechando o side door (T2)

`useCreateCampaign` foi reescrito para NUNCA mais chamar
`.from('ads_campaigns').insert(...)`. Toda chamada real agora chama
`supabase.rpc('campaign_create_readiness_rpc', ...)` diretamente do browser,
sob a identidade do usuário (papel `authenticated`) — a MESMA fronteira que a
12.W4.2 testou para o cenário de bypass direto (AC3 daquela story: um caller
de outro workspace, ou um bypass do endpoint, é rejeitado por
`is_workspace_member` antes de qualquer leitura/escrita). Quando `projectId`
não é informado, o preflight local já avalia `campaign.create` com
`project: null` — a regra estrutural do ADR-002 trata isso como
`PROJECT_NOT_FOUND`, retornando bloqueado com ZERO round-trip de rede. Não
existe mais nenhum caminho que insira uma campanha órfã sem preflight algum.

A interpretação do payload jsonb da RPC (`{ok, code, campaign|message}`) já
existia em `server/lib/campaign-create-repo.ts` (12.W4.2), mas SÓ ali — o
browser precisava da MESMA interpretação sem duplicar a lógica uma segunda
vez (reuso, não invenção, o mesmo princípio que motivou
`buildCampaignReadinessContext` na 12.W2.1). Extraída para
`shared/campaign-create.ts` (puro, sem `@supabase/*`/DOM/`node:*` — mesmo
padrão de `shared/campaign-readiness.ts`), consumida por AMBOS os call sites.
`campaign-create-repo.ts` foi refatorado para usar o mapper compartilhado; os
11 testes pré-existentes daquele arquivo (12.W4.2, `Done`) passam sem
nenhuma alteração — confirma que o refactor não mudou comportamento.

### Gate do dashboard legado (T3)

`dashboard.tsx` não tem contexto de projeto explícito na URL (diferente da
jornada nova, que sempre opera dentro de `/projects/$projectId/...`). Em vez
de inventar uma segunda regra "projeto ausente", o gate reusa O MESMO
contrato: zero projetos visíveis no spoke ativo, ou mais de um (ambíguo), é
avaliado com `project: null` — que a regra estrutural (`structuralCreateResult`,
`shared/campaign-readiness.ts`, 12.W1.1) já trata como `PROJECT_NOT_FOUND`,
com a mesma ação `project.select` que a jornada nova usa. Exatamente um
projeto visível → esse projeto vira o alvo real da criação (nem inventado,
nem ambíguo). Isso significa que o teste "AC2: Nova campanha cria um draft"
original desta tela (STORY-AL-ADS-1.4, não Epic 12) — que rodava com ZERO
projetos no store e esperava sucesso — testava exatamente o comportamento que
esta story precisa fechar. Foi substituído por três testes: zero projetos
(bloqueado), múltiplos projetos (bloqueado, escolha explícita exigida) e
exatamente um projeto (cria via RPC, sem invenção de contexto).

### Descoberta de a11y real durante o Playwright (T4)

O Playwright `campaign-readiness-gate.spec.ts` nunca tinha visitado
`/dashboard` antes desta story (a suíte da 12.W2.1 cobre só
`/projects/$projectId/...`). Ao adicionar o primeiro teste de 390px para essa
rota, ele falhou por um overflow **genuíno e pré-existente**, não introduzido
por esta story: o header de `src/routes/dashboard/index.tsx` (`SpokeSelector`
+ botão "Sair") não quebra linha em telas estreitas, e `SpokeSelector` fixava
`min-width: 12rem` no `<select>` nativo. Isolado com um script de debug
Playwright ad-hoc (`document.documentElement.scrollWidth` vs `clientWidth` +
inspeção de `getBoundingClientRect()` por elemento) antes de tocar em
qualquer CSS, confirmando a causa exata antes de editar (script descartado
após o diagnóstico, não faz parte do File List). Corrigido com `flexWrap:
'wrap'` no header e no grupo de botões, e trocando o `min-width` fixo do
`<select>` por `min-width: 0; max-width: 12rem; width: 100%` (ainda cabe
dentro do flex, encolhe quando precisa). Nenhum dos dois arquivos estava no
`touched_paths` original desta story — corrigido aqui porque bloqueava
diretamente a própria asserção Playwright que esta story introduz (AC4), e
porque é exatamente a superfície "dashboard legado" que esta story tem
mandato de tornar acessível. Reproduzido 2× seguidas sem flake após o fix.

### Achado de infraestrutura de testes corrigido (fora do escopo funcional, mas necessário)

Ao criar `shared/campaign-create.ts` e precisar que `server/` o importasse,
`tsconfig.server.json` rejeitou a importação: `rootDir: "./server"` não
permite arquivos fora de `server/`. Isso nunca tinha sido necessário antes —
nenhum arquivo em `server/` importava `shared/` até esta story. Corrigido
alargando `rootDir` para a raiz do app e adicionando `shared/**/*` ao
`include` (nada em produção consome `dist/server/` hoje — `build:server` é
só um gate de typecheck/build-verification em CI, confirmado por não haver
`Dockerfile`/script `start` que referencie `dist/server`; alargar o layout de
saída não quebra nenhum runtime real).

Ao fazer isso, descobri que `shared/campaign-readiness.test.ts` (criado pela
12.W1.1) **nunca rodou em nenhum CI** — nem o projeto vitest `server`
(`include: ["server/**/*.test.ts"]`) nem o `client`
(`include: ["src/**/*.test.{ts,tsx}"]`) cobria `shared/**`. A lógica pura que
esse arquivo testa (`computeCampaignReadiness`, `assertAcyclicSkillGraph`,
`stableHash`, etc.) segue exercitada indiretamente via
`src/lib/campaign-readiness.test.ts`, mas o teste dedicado — incluindo a
verificação de deep-equality contra `data/campaign-readiness-capabilities.json`
que existe especificamente para pegar drift — nunca executou de fato.
Corrigido adicionando `shared/**/*.test.ts` ao `include` do projeto `server`
(ambiente `node`, que já serve módulos puros sem DOM). Isso exigiu adicionar
extensão `.js` explícita ao import relativo dentro desse arquivo de teste
(`moduleResolution: NodeNext` exige extensão em imports relativos) — a MESMA
convenção que `campaign-create-repo.ts` já seguia para importar `shared/`.
Não fazia sentido deixar esse achado sem correção só porque está um passo
lateral ao escopo funcional da story: ele é uma pré-condição direta para o
próprio `shared/campaign-create.test.ts` desta story rodar de verdade, e
deixá-lo quebrado seria repetir o mesmo silêncio que o originou.

### Escopo residual explícito — não coberto por esta story

- **AC5 ("RLS se houver mudança"):** não há mudança de schema/RLS nesta
  story — reusa o RPC exatamente como a 12.W4.2 o deixou (`Done`, QG PASS).
  A prova de concorrência/idempotência/staleness a nível de banco continua
  sendo a suíte pgTAP daquela story (`campaign_create_readiness.sql`, 14
  assertions) — não duplicada aqui. O "teste de bypass direto ao endpoint"
  desta story (AC3) é feito no nível do browser call site
  (`use-create-campaign.test.ts`) e do mapper puro
  (`shared/campaign-create.test.ts`): ambos provam que TODO código de
  criação chama a mesma RPC e interpreta corretamente cada código de
  resposta, sem inventar um segundo caminho de escrita.
- **`project-campaigns.tsx`:** não precisou de mudança — já chamava
  `createCampaign(workspaceId, name, projectId)` corretamente; o fix
  aconteceu inteiramente dentro do hook que ela consome.

## Dev Agent Record

**Agent model:** Claude Sonnet 5 (claude-sonnet-5), atuando como `@dev` (fallback
pragmático — sem infraestrutura completa de Agent-Teams/squads disponível
neste ambiente).

### Completion Notes

- AC1/AC2: `useCreateCampaign` fechado para nunca mais inserir direto —
  toda criação real (com ou sem `projectId`) chama
  `campaign_create_readiness_rpc` via `supabase.rpc`. Payload interpretado por
  `shared/campaign-create.ts` (novo, puro), reusado por
  `server/lib/campaign-create-repo.ts` (refatorado, zero mudança de
  comportamento — 11 testes originais intactos).
- AC1/AC3: legado dashboard (`dashboard.tsx`) gateado pelo MESMO contrato
  `campaign-readiness.v1`; legado wizard (`campaigns/$campaignId/$step`)
  verificado sem necessidade de mudança (nunca cria campanha).
- AC3: zero mutação em bloqueio comprovada tanto no client preflight (zero
  round-trip de rede) quanto no mapeamento de cada código de resposta da RPC
  (`READINESS_BLOCKED`, `STALE_READINESS`, `CAMPAIGN_CREATE_CONFLICT`,
  `UNAUTHORIZED`) — 9 testes em `use-create-campaign.test.ts` + 11 testes em
  `shared/campaign-create.test.ts`.
- AC4: gate do dashboard com `Alert` (`role="alert"` nativo do DS),
  botão com `title`/`aria-busy`, CTA real (`<a>`) alcançável por teclado;
  overflow real de 390px encontrado e corrigido em `spoke-selector.tsx` +
  `src/routes/dashboard/index.tsx` (achado durante o próprio Playwright desta
  story, não pré-existente ao meu conhecimento antes de rodar o teste — ver
  Dev Notes). Playwright novo (`campaign-readiness-gate.spec.ts`) cobre CTA
  habilitado, foco por teclado e zero overflow em 390px para
  desktop+mobile, reproduzido 2× sem flake.
- AC5: `dashboard.test.tsx` reescrito (zero/um/múltiplos projetos);
  `use-create-campaign.test.ts` reescrito; nenhuma campanha existente é
  tocada por este diff (nenhuma migration, nenhum backfill).
- Achados de infraestrutura de teste corrigidos e documentados (Dev Notes):
  `tsconfig.server.json` (rootDir/include para permitir `server/` importar
  `shared/`) e `vitest.config.ts` (liga `shared/**/*.test.ts`, órfão desde a
  12.W1.1).
- Ambiente: worktree provisionado via symlink de `node_modules` do worktree
  irmão `story-12.W4.2` (mesmo hash de `package-lock.json`, conferido) e
  cópia do `.env.local` do worktree irmão `story-12.W3.1` (nenhum dos dois
  presentes no checkout de `main`, cujo `package-lock.json`/`package.json`
  estão com mudanças não commitadas de outra branch/epic — não usados como
  fonte).

### Evidência dos quality_gate_tools (rodados no worktree, 2026-07-16)

| Comando | Resultado |
|---|---|
| `npm test` | PASS — 52 arquivos, 431 testes |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run build:server` | PASS |
| `git diff --check` | PASS (sem whitespace errors) |
| `npm run test:db` (local Docker, `supabase start -x logflare,vector`) | PASS — 7 arquivos / 75 assertions (idêntico à baseline da 12.W4.2) |
| `npm run lint:db` | PASS — "No schema errors found" |
| `npx playwright test e2e/campaign-readiness-gate.spec.ts --project=desktop --project=mobile` | PASS — 8/8 (4 testes × 2 projetos), reproduzido 2× seguidas sem flake |

Nenhum projeto/migration remoto foi tocado em nenhum momento — apenas
`127.0.0.1:54322` (local), parado com `supabase stop` ao final.

### File List

Ver seção `## File List` acima.

## QA Results

_Pendente — preenchido pelo quality gate independente (`@architect`)._

## Change Log

- 2026-07-16 — @dev: story rascunhada (ver Dev Agent Record) implementando o
  cutover legado — fechamento do side door de criação
  (`use-create-campaign.ts` → RPC transacional, não mais insert direto),
  gate do dashboard legado com o mesmo contrato `campaign-readiness.v1`,
  módulo compartilhado `shared/campaign-create.ts`, correções de
  acessibilidade/390px encontradas via Playwright, e correção de dois achados
  de infraestrutura de teste (`tsconfig.server.json`, `vitest.config.ts` —
  `shared/campaign-readiness.test.ts` órfão desde a 12.W1.1). Todos os
  `quality_gate_tools` verdes localmente.
- 2026-07-16 — @po: `*validate-story-draft` (checklist de 10 pontos) —
  título claro, descrição completa, ACs testáveis (5, cada uma mapeada a
  testes reais — ver Dev Agent Record), escopo bem definido (Dev Notes
  §Escopo residual explícito delimita o que fica de fora), dependências
  mapeadas (`12.W3.1`, `12.W4.2`, ambas `Done`/QG PASS), estimativa de
  esforço presente, valor de negócio claro (fecha side door de criação +
  acessibilidade do legado), riscos documentados (Dev Notes cobre o side
  door real encontrado e os dois achados de infraestrutura de teste),
  critério de conclusão claro (ACs), alinhamento com EPIC-12/ADR-002
  confirmado (wave W4, "cutover legado e acessibilidade" conforme a tabela
  de waves do épico). Nota de processo: a implementação já estava concluída
  no momento desta validação (o arquivo da story não existia neste worktree
  antes desta execução — teve que ser reconstruído a partir do épico/ADR-002
  e do código real antes de qualquer validação ser possível); os 10 pontos
  foram, mesmo assim, verificados individualmente contra o resultado final,
  não assumidos. Verdict: **GO**. Status `Draft` → `Ready` → `InProgress` →
  `InReview` (implementação e evidência já registradas no Dev Agent Record).
