---
status: Done
story_id: "9.W1.3"
title: "E2E de onboarding em instalação limpa"
epic: 9
wave: "W1"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 1d
hill_phase: downhill
confidence_level: high
involves_ui: true
executor: "@qa"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["9.W1.1", "9.W1.2"]
consumes_artifacts_of: ["9.W1.1", "9.W1.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/story-9-w1-onboarding.mjs"
  - "apps/academia-lendaria-ads-studio/package.json"
  - "docs/qa/epic-9-w1-onboarding.md"
  - "docs/stories/epic-9/STORY-9.W1.3-clean-install-onboarding-e2e.md"
  - "docs/stories/epic-9/epic-9-state.json"
  - ".aiox/waves/9-wave-1/qa-gate.yaml"
---

# STORY-9.W1.3 - E2E de onboarding em instalação limpa

## User Story

**Como** responsável pelo go-live
**Quero** provar a jornada vazia até um projeto reidratado
**Para** não entregar um launcher que abre uma tela sem acesso utilizável.

## Acceptance Criteria

1. E2E parte de banco sem usuário, workspace ou projeto.
2. Cria o primeiro operador somente pela interface e autentica normalmente.
3. Importa briefing versionado, abre o projeto e confirma os dados principais.
4. Reload e nova sessão mantêm projeto, revisão e proveniência.
5. Segunda tentativa de bootstrap é negada sem alterar o owner existente.
6. Desktop e mobile não têm erro de console, rede, overflow ou sobreposição.
7. Relatório registra evidências sanitizadas e todos os quality gates.

## Tasks

- [x] Criar fixture limpa e spec E2E.
- [x] Provar bloqueio do segundo bootstrap.
- [x] Provar round-trip do briefing importado.
- [x] Capturar e inspecionar desktop/mobile.
- [x] Rodar gates e fechar a W1.

## File List

| Arquivo | Operação |
|---|---|
| `apps/academia-lendaria-ads-studio/e2e/story-9-w1-onboarding.mjs` | ADD |
| `apps/academia-lendaria-ads-studio/package.json` | MODIFY |
| `docs/qa/epic-9-w1-onboarding.md` | ADD |
| `docs/stories/epic-9/STORY-9.W1.3-clean-install-onboarding-e2e.md` | MODIFY |
| `docs/stories/epic-9/epic-9-state.json` | MODIFY |
| `.aiox/waves/9-wave-1/qa-gate.yaml` | ADD |

## QA Gate

**Veredito:** SHIP em 2026-07-10. Nenhum finding aberto P0/P1/P2.

- Banco limpo é provado por contagem direta de usuários, workspaces, memberships
  e projetos, inclusive quando o gateway retorna `502` transitório.
- Primeiro operador e importação são executados pela UI; o projeto importado
  recebe UUID real e revisão ativa persistida.
- Reload e um novo `BrowserContext` preservam valores e proveniência; a
  exportação pela UI confirma a revisão ativa `1` e o mesmo `projectId`.
- O segundo bootstrap retorna `409`; o owner original continua autenticável.
- Desktop e mobile passaram sem console error, page error, request failure,
  resposta inesperada, overflow ou overlap.
- O runner recusa worktree com launcher ativo e só encerra o `runtimeId` que
  iniciou, preservando sessões preexistentes.
- O runner também recusa um Supabase já ativo; a rodada válida possui o ciclo
  completo do stack compartilhado e não reseta dados de outro worktree.
- Uma tentativa parcial de `supabase start` também é assumida pelo runner: se o
  banco iniciou, DB/Auth/REST/Kong são exigidos e o teardown encerra
  explicitamente o `project_id`, mesmo quando a CLI falha por healthcheck
  tardio de serviço auxiliar.

## Validação executada

- `npm run test:e2e:onboarding` - PASS.
- `npm test` - 37 arquivos / 291 testes PASS.
- `npm run lint` - PASS.
- `npm run typecheck` - PASS.
- `npm run build` e `npm run build:server` - PASS.
- `npm run lint:db` - sem erros.
- `npm run test:db` - 5 arquivos / 52 testes PASS após reset limpo.
- Catálogo - 30 skills / 40 relações / espelho canônico válido.
- `git diff --check` - PASS.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @qa | E2E limpo do onboarding, evidência visual, gates integrados e fechamento da Wave 1. Status Ready -> Done. |
