---
status: Ready
story_id: "8.W3.3"
title: "Launcher e readiness para não devs"
epic: 8
wave: "W3"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: local
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W3.1", "8.W3.2"]
consumes_artifacts_of: ["8.W3.1", "8.W3.2"]
file_scope: shared
touched_paths:
  - "scripts/marketing-studio.mjs"
  - "scripts/marketing-studio.test.mjs"
  - "apps/academia-lendaria-ads-studio/server/readiness.ts"
  - "apps/academia-lendaria-ads-studio/server/readiness.test.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/src/components/system-readiness.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/system-readiness.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/system-readiness.ts"
  - "apps/academia-lendaria-ads-studio/src/index.css"
  - "apps/academia-lendaria-ads-studio/package.json"
  - "apps/academia-lendaria-ads-studio/package-lock.json"
  - ".aiox/waves/epic-8-wave-3/qa-w3.3.yaml"
  - "docs/qa/epic-8-nondev-launcher.md"
  - "docs/stories/epic-8/STORY-8.W3.3-nondev-launcher-readiness.md"
  - "README.md"
  - ".env.example"
---

# STORY-8.W3.3 - Launcher e readiness para não devs

## User Story

**Como** aluno não técnico
**Quero** iniciar e diagnosticar o Marketing Studio com um comando
**Para** operar skills sem entender Node, portas, Docker ou variáveis internas.

## Acceptance Criteria

1. Um comando instala/verifica dependências e inicia frontend, BFF e serviços locais necessários.
2. Preflight verifica Node, Codex CLI autenticado, portas, filesystem, migrations e browser.
3. Falhas têm mensagem em PT-BR, ação de recuperação e nenhuma exposição de segredo.
4. UI de readiness distingue pronto, degradado e bloqueado por capacidade.
5. Shutdown encerra somente processos iniciados pelo launcher e preserva dados.
6. Teste em ambiente limpo e guia do aluno validam a jornada completa.

## Tasks

- [ ] Criar launcher idempotente e shutdown controlado.
- [ ] Implementar checks e recovery hints.
- [ ] Criar superfície de readiness na UI.
- [ ] Atualizar `.env.example` e documentação do aluno.
- [ ] Testar instalação limpa e retomada.

## File List

- `scripts/marketing-studio.mjs`
- `apps/academia-lendaria-ads-studio/src/components/system-readiness.tsx`
- `apps/academia-lendaria-ads-studio/package.json`
- `README.md`
- `.env.example`
