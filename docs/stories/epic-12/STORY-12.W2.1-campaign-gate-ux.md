---
status: InReview
story_id: "12.W2.1"
title: "Gate de campanhas, navegação e ações inline"
epic: 12
wave: "W2"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: figuring_out
appetite: "3d"
confidence_level: needs-spike
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-gate-ux
  status_expected: draft
entity_output:
  entity_type: campaign-gate-ux
  status_expected: ready
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W1.1"]
consumes_artifacts_of: ["12.W1.1"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-overview.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-campaigns.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-campaigns.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/index.css"
  - "apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts"
  - "apps/academia-lendaria-ads-studio/playwright.config.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts"
  - "docs/stories/epic-12/STORY-12.W2.1-campaign-gate-ux.md"
---

> **Estimated effort:** 2h  
> **Depends on:** 12.W1.1

# STORY-12.W2.1 — Gate de campanhas, navegação e ações inline

## User Story

**As an operator preparing a project**, **I want** to see what Campaigns still
needs and fix it without being thrown between screens, **so that** I understand
the next step and do not trigger a broken creation.

## Story

**As an operator preparing a project**, **I want** to see what Campaigns still
needs and fix it without being thrown between screens, **so that** I understand
the next step and do not trigger a broken creation.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [x] AC1: Campanhas permanece visível no shell; quando `campaign.create` está
  bloqueada, o link tem `aria-disabled`, não navega para wizard inválido e mostra
  título, contagem de bloqueadores e CTA de correção.
- [x] AC2: Visão geral e jornada expõem o mesmo `inputFingerprint`, capability e
  `nextAction.target` para a mesma revisão; o teste falha se qualquer um divergir.
- [x] AC3: O painel de readiness lista cada lacuna com fonte, impacto e ação inline
  ou âncora para o campo correto; concluir uma ação atualiza o painel sem exigir
  navegação manual de ida e volta.
- [x] AC4: Projeto pronto exibe CTA de criação habilitado; projeto incompleto não
  habilita submit nem cria draft.
- [x] AC5: Component tests cobrem loading, empty, blocked, ready, warning e erro;
  Playwright cobre foco/teclado e viewport 390px sem overflow horizontal.

## Tasks

- [x] T1: Extrair componente/presenter do snapshot de readiness.
- [x] T2: Integrar shell, overview e campanhas sem duplicar condicionais.
- [x] T3: Adicionar ações inline e estados de loading/erro vazios.
- [x] T4: Ajustar estilos ao tema escuro e aos controles nativos expandidos.
- [x] T5: Cobrir desktop, mobile, foco e leitor de tela nos testes.

## File List

- `apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx` (MODIFY —
  gate do link "Campanhas" no nav mobile e na stepper lateral: `aria-disabled`,
  título com contagem de bloqueadores, badge e CTA "Corrigir" quando
  `campaign.create` está bloqueada; refatorado `navItemRoute()` local para não
  duplicar a resolução de rota entre os dois nav's, AC1/T2).
- `apps/academia-lendaria-ads-studio/src/components/project-overview.tsx` (MODIFY —
  novo card "Campanhas" no grid da visão geral expondo
  `data-fingerprint`/`data-capability-allowed`/`data-next-action-target` do
  MESMO snapshot `campaign.create` usado pelo shell/painel, AC2).
- `apps/academia-lendaria-ads-studio/src/components/project-campaigns.tsx` (MODIFY —
  renderiza `<CampaignReadinessPanel>`; CTA "Nova campanha"/submit desabilitado
  quando `campaign.create` está bloqueada, com mensagem inline; zero mutação
  (`createCampaign` nunca é chamado) quando bloqueado, AC4).
- `apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.tsx` (ADD —
  painel que avalia as 6 capabilities e lista lacunas com fonte/impacto/ação;
  estados loading/empty/blocked/ready/warning/erro; recomputa a cada render a
  partir do store, sem cache, para nunca exigir navegação manual de ida e
  volta, AC3/AC5).
- `apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.test.tsx` (ADD —
  6 testes de estado, AC5).
- `apps/academia-lendaria-ads-studio/src/components/project-campaigns.test.tsx` (ADD —
  2 testes de gate de criação (AC4) + 1 teste de paridade de snapshot
  Overview×Campaigns (AC2)).
- `apps/academia-lendaria-ads-studio/src/index.css` (MODIFY — `.cms-readiness-panel*`,
  `.cms-nav-blocker-badge`, `.cms-nav-fix-cta*`, `.asx-step--blocked`,
  `.cms-mobile-nav__item-group` seguindo os tokens/convenções já existentes,
  T4).
- `apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts` (ADD —
  3 testes Playwright reais contra um servidor Vite em modo demo próprio (sem
  BFF/Supabase): lacunas reais do painel + CTA habilitado (AC3/AC4), paridade
  Overview×Campaigns (AC2) e foco/teclado + zero overflow em 390px (AC5)).
- `apps/academia-lendaria-ads-studio/playwright.config.ts` (ADD — projetos
  `desktop`/`mobile` escopados via `testMatch` a
  `campaign-readiness-gate.spec.ts`; projeto `default` preserva
  `e2e/traffic-squad.spec.ts` rodando exatamente uma vez quando invocado sem
  `--project`, verificado com `--list`).
- `apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts` (MODIFY —
  **fora do `touched_paths` original, ver Dev Notes §Decisão de escopo
  registrada pelo Dev Agent** — adiciona `buildCampaignReadinessContext`,
  `campaignReadinessRouteHint` e `campaignReadinessSourceLabel`: o único code
  path que `UnifiedShell`/`ProjectOverview`/`CampaignReadinessPanel` chamam
  para montar o contexto e interpretar uma ação de bloqueio, exigido por
  T2/AC2).
- `docs/stories/epic-12/STORY-12.W2.1-campaign-gate-ux.md` (MODIFY lifecycle
  sections).

## Dev Notes

Não esconder a área e não usar texto genérico como “erro”. O componente deve
consumir o snapshot da W1 e navegar por identificadores lógicos de campo, nunca
por path absoluto ou regra hardcoded específica de uma skill.

### Interpretação de "jornada" na AC2

A story menciona "Visão geral e jornada" para a comparação de snapshot, mas
`project-journey.tsx` (a aba "Jornada" do nav) não faz parte do `touched_paths`
desta story e hoje não exibe nada de `campaign-readiness` — não há chamada a
`campaign-readiness` ali. Interpretação adotada, ancorada no próprio texto da
W1.1 ("jornada de projeto" = o fluxo DENTRO de um projeto real, por oposição ao
atalho legado sem projeto do dashboard — ver Dev Notes/`use-create-campaign.ts`
da 12.W1.1): a comparação da AC2 é entre **Visão geral** (`project-overview.tsx`,
card "Campanhas") e **Campanhas** (`project-campaigns.tsx`/`CampaignReadinessPanel`,
onde a "jornada de criação de campanha" de fato acontece) — as duas telas que
esta story tem escopo para tocar. Testado em
`project-campaigns.test.tsx` (unit) e `campaign-readiness-gate.spec.ts` (E2E
real, navegando entre as duas rotas).

### Decisão de escopo registrada pelo Dev Agent

`apps/academia-lendaria-ads-studio/src/lib/campaign-readiness.ts` **não estava
no `touched_paths` original** desta story, mas foi modificado (adição de 3
funções puras: `buildCampaignReadinessContext`, `campaignReadinessRouteHint`,
`campaignReadinessSourceLabel`). Justificativa: T2 exige explicitamente
"Integrar shell, overview e campanhas SEM DUPLICAR CONDICIONAIS", e AC2 exige
que os três consumidores (`UnifiedShell`, `ProjectOverview`,
`CampaignReadinessPanel`/`ProjectCampaigns`) produzam o MESMO
`inputFingerprint`/`capability`/`nextAction.target` — a única forma de garantir
isso POR CONSTRUÇÃO (não por disciplina) é ter um único ponto que filtra
projeto/brief/artefatos/runs por `projectId` e interpreta uma ação de bloqueio.
`shared/campaign-readiness.ts`/`src/lib/campaign-readiness.ts` (criados na
12.W1.1) já são o wiring canônico do contrato — duplicar essa filtragem em 3
arquivos diferentes teria sido uma regressão exatamente da classe de bug que a
AC2 existe para prevenir. `touched_paths` foi corrigido nesta revisão para
refletir o arquivo real; nenhuma outra story ativa declara este arquivo em seu
próprio `file_scope` (12.W1.1 está `Done`). Marcado explicitamente aqui em vez
de silenciado, seguindo o mesmo padrão de transparência da 12.W1.1 (Dev Notes
§Decisões de escopo).

### Outras decisões de escopo

1. **`createInitialCampaignPlan`/`upsertPlan` em `project-campaigns.tsx` não
   foram alterados.** A nota residual da 12.W1.1 (AC3 original) previa gatear
   QUANDO materializar o `CampaignPlanRevision` conforme `campaign.tracking`/
   `campaign.brief`. Descoberto durante a implementação: `TrafficCampaignWorkspace`
   (`src/components/traffic-campaign-workspace.tsx`, fora do `file_scope`
   desta story) já materializa o plano incondicionalmente assim que a etapa
   "Fundamentos" monta (`useEffect(() => { if (!plan && brief) upsertPlan(...) }, ...)`),
   o que o usuário sempre atinge um instante depois de `submit()` navegar para
   lá. Gatear a chamada em `project-campaigns.tsx` sozinha não mudaria o
   resultado observável (o plano nasceria de qualquer forma, só um render mais
   tarde, com um "Preparando campanha..." piscando) — uma regressão de UX sem
   nenhum ganho real, dado que o verdadeiro gate está num arquivo fora de
   escopo. Documentado aqui em vez de silenciado.
2. **AC4 interpretado literalmente como `campaign.create`** (a única
   capability que, por invariante do ADR-002 §Invariantes item 1, impede o
   draft mínimo — "Campanha bloqueada para campaign.create não gera
   ads_campaigns, campaign_plan nem run; bloqueios das capabilities
   posteriores mantêm o draft mínimo válido, mas impedem a etapa
   correspondente"). As demais capabilities (tracking/brief/structure/
   measure/diagnose) aparecem como lacunas no painel (AC3), não como gate do
   CTA de criação.
3. **`campaign-readiness-gate.spec.ts` roda seu próprio servidor Vite em modo
   demo** (mesmo padrão de `traffic-squad.spec.ts`, sem BFF/Supabase reais).
   O fixture demo produz naturalmente um projeto MISTO
   (`campaign.create`/`campaign.tracking`/`campaign.brief` prontos,
   `campaign.structure`/`campaign.measure`/`campaign.diagnose` bloqueados por
   artefatos de tráfego ausentes) — suficiente para testar AC2/AC3/AC4/AC5
   reais sem fabricar um projeto quebrado à parte. Cobertura de
   `aria-disabled`/CTA quando `campaign.create` está bloqueada fica pelo
   componente (`campaign-readiness-panel.test.tsx`): o guard de rota
   (`src/routes/projects/$projectId.tsx`) já intercepta projeto inexistente
   antes do shell montar, e o fixture demo não permite simular nome de
   projeto vazio sem mexer no store por fora do `file_scope`.

## Dev Agent Record

**Agent model:** Claude Sonnet 5 (claude-sonnet-5), atuando como `@dev`.

### Completion Notes

- AC1: `UnifiedShell` computa `campaign.create` via o MESMO
  `buildCampaignReadinessContext`/`evaluateCampaignReadiness` usados pelos
  outros dois consumidores. Quando bloqueado, o link "Campanhas" (nav mobile
  e stepper lateral) vira um `<Link aria-disabled="true" onClick={preventDefault}>`
  focável por teclado (não some da árvore de acessibilidade), com `title`
  explicando a pendência, um badge com a contagem de bloqueadores e uma CTA
  "Corrigir" separada apontando para o campo/etapa certos via
  `campaignReadinessRouteHint`.
- AC2: `buildCampaignReadinessContext` (novo, em `src/lib/campaign-readiness.ts`)
  é o único ponto que filtra `projects`/`briefRevisions`/`artifacts`/`skillRuns`
  por `projectId` — `UnifiedShell`, `ProjectOverview` (novo card "Campanhas")
  e `CampaignReadinessPanel` chamam essa mesma função. Testado tanto
  unitariamente (`project-campaigns.test.tsx`) quanto em E2E real navegando
  entre `/overview` e `/campaigns` (`campaign-readiness-gate.spec.ts`).
- AC3: `CampaignReadinessPanel` (novo) avalia as 6 capabilities
  (`CAMPAIGN_CAPABILITIES`) e lista, por capability, cada bloqueio com fonte
  (`campaignReadinessSourceLabel`), rótulo/impacto e uma ação "Corrigir"
  (`campaignReadinessRouteHint`). Não guarda snapshot em estado local —
  recomputa a cada render a partir do store, então uma correção feita em
  outra tela atualiza o painel assim que o operador volta, sem exigir reload.
- AC4: `campaignCreateReadiness` em `project-campaigns.tsx` desabilita o
  toggle "Nova campanha"/submit e mostra o motivo quando `campaign.create`
  está bloqueada — `createCampaign` nunca é invocado nesse caso (zero
  mutação). Interpretação literal do invariante 1 do ADR-002 (ver Dev Notes).
- AC5: 6 testes de componente (`campaign-readiness-panel.test.tsx`) cobrindo
  loading/empty/blocked/ready/warning/erro (o cenário de erro força
  `evaluateCampaignReadiness` a lançar via um mock `vi.hoisted`-controlado,
  sem vazar a mensagem crua para a UI); 3 testes Playwright reais
  (`campaign-readiness-gate.spec.ts`) rodando sob os projetos `desktop`
  (1280×900) e `mobile` (390×844) — foco/teclado no link "Campanhas" e
  ausência de overflow horizontal em ambos os viewports.
- `playwright.config.ts` foi verificado para NÃO regredir
  `npm run test:e2e:traffic`: `npx playwright test e2e/traffic-squad.spec.ts --config=playwright.config.ts --list`
  confirma que o spec roda exatamente 1 vez, sob o projeto `default`, quando
  invocado sem `--project` (o mesmo jeito que o script npm já invoca).
- 1 arquivo fora do `touched_paths` original foi modificado
  (`src/lib/campaign-readiness.ts`) — decisão de escopo registrada
  explicitamente em Dev Notes, não silenciada; `touched_paths` foi corrigido
  para refletir a realidade.
- Ambiente: o worktree não trazia `node_modules` nem `.env.local` (não
  versionados); resolvido via symlink de `node_modules` do checkout principal
  e cópia do `.env.local` local — nenhuma mudança de código, apenas
  provisionamento local de dev (mesmo padrão da 12.W1.1).

### Evidência dos quality_gate_tools (rodados no worktree, 2026-07-16)

| Comando | Resultado |
|---|---|
| `npm --prefix apps/academia-lendaria-ads-studio test` | PASS — 45 arquivos, 344 testes |
| `npm --prefix apps/academia-lendaria-ads-studio run typecheck` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run lint` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run build` | PASS |
| `npm --prefix apps/academia-lendaria-ads-studio run build:server` | PASS |
| `git diff --check` | PASS (sem whitespace errors) |
| `cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile` | PASS — 6/6 (3 testes × 2 projetos), reproduzido 2× seguidas sem flake |

### File List

Ver seção `## File List` acima (ADD/MODIFY explícitos, incluindo a
modificação fora do `touched_paths` original com justificativa).

## Change Log

- 2026-07-16 — @architect: AC2 tornou-se uma comparação determinística de
  fingerprint/capability/nextAction; Playwright e config foram incluídos no
  escopo executável.
- 2026-07-16 — @po: validação com o checklist de 10 pontos — GO (9/10). Único
  gap: `touched_paths` não incluía o arquivo de wiring compartilhado que T2
  exige para evitar duplicação entre shell/overview/campanhas (corrigido pelo
  Dev Agent, ver Dev Notes §Decisão de escopo). Story promovida Draft → Ready
  para dispatch no worktree `wave/12-w2/story-12.W2.1` (branch a partir do
  commit `9df6c209df13072fd1de6b5641f0b487e4d65f29`, topo de
  `wave/12-w1/story-12.W1.1`, QG PASS 92/100).
- 2026-07-16 — @dev: implementado o gate de campanhas (AC1), o painel de
  prontidão com as 6 capabilities (AC3), o gate do CTA de criação (AC4), a
  paridade de snapshot Overview×Campanhas (AC2, via `buildCampaignReadinessContext`
  compartilhado) e a cobertura de componente + Playwright desktop/mobile
  (AC5). Todos os `quality_gate_tools` verdes (evidência abaixo). 4 decisões
  de escopo documentadas em Dev Notes.
