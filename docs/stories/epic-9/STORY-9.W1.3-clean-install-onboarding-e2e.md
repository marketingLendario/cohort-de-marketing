---
status: Ready
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
  - ".aiox/waves/epic-9-wave-1/qa-gate.yaml"
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

- [ ] Criar fixture limpa e spec E2E.
- [ ] Provar bloqueio do segundo bootstrap.
- [ ] Provar round-trip do briefing importado.
- [ ] Capturar e inspecionar desktop/mobile.
- [ ] Rodar gates e fechar a W1.

## File List

- A preencher durante a implementação.
