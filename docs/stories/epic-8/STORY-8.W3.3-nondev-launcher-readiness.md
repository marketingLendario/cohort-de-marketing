---
status: Done
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
  - "apps/academia-lendaria-ads-studio/vite.config.ts"
  - "apps/academia-lendaria-ads-studio/e2e/story-8-w3-3.mjs"
  - "apps/academia-lendaria-ads-studio/package.json"
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

- [x] Criar launcher idempotente e shutdown controlado.
- [x] Implementar checks e recovery hints.
- [x] Criar superfície de readiness na UI.
- [x] Atualizar `.env.example` e documentação do aluno.
- [x] Testar instalação limpa e retomada.

## Desenho de implementação

O launcher usa o Codex CLI autenticado por `codex login`, com o ambiente do
preflight e do BFF sem `OPENAI_API_KEY`/`CODEX_API_KEY`. Ele instala dependências,
aplica migrations, inicia BFF e Vite em loopback e persiste somente PIDs,
ownership e diagnóstico sanitizado em um diretório privado do sistema.

O ownership do Supabase pertence somente à execução que chamou `supabase start`.
Shutdown e falhas parciais verificam o comando do PID antes de encerrar a árvore,
preservam `projetos/` e mantêm estado para retry se o banco não parar. `SIGINT` e
`SIGTERM` acionam a mesma limpeza transacional.

O BFF projeta uma allowlist do snapshot em `/api/local/readiness`; a UI mostra
pronto, degradado ou bloqueado no header, com recovery hints, atualização manual,
fechamento por Escape/outside click e foco restaurado.

## File List

- `scripts/marketing-studio.mjs`
- `scripts/marketing-studio.test.mjs`
- `apps/academia-lendaria-ads-studio/server/readiness.ts`
- `apps/academia-lendaria-ads-studio/server/readiness.test.ts`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/src/components/system-readiness.tsx`
- `apps/academia-lendaria-ads-studio/src/components/system-readiness.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/system-readiness.ts`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `apps/academia-lendaria-ads-studio/vite.config.ts`
- `apps/academia-lendaria-ads-studio/e2e/story-8-w3-3.mjs`
- `apps/academia-lendaria-ads-studio/package.json`
- `.aiox/waves/epic-8-wave-3/qa-w3.3.yaml`
- `docs/qa/epic-8-nondev-launcher.md`
- `docs/stories/epic-8/STORY-8.W3.3-nondev-launcher-readiness.md`
- `README.md`
- `.env.example`

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @dev | Launcher de um comando, preflight completo, BFF sanitizado, readiness no header, shutdown com ownership e E2E limpo/restart. Status Ready → InReview. |
| 2026-07-10 | @dev | Resolvidos achados do QA inicial: preflight sem API keys, ownership não herdado, startup transacional com sinais, opener tolerante, `.env` carregado, retry do Supabase, árvore Windows e foco acessível. |
| 2026-07-10 | @qa | Re-gate final do Codex CLI local: SHIP, sem findings abertos. Status InReview → Done. |

## Validação executada

- `npm test`: 32 arquivos / 263 testes — PASS com Supabase local injetado em memória.
- `npm run test:launcher`: 8/8 — PASS.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:server`: PASS.
- `npm run lint:db`: sem erros; `npm run test:db`: 43/43 — PASS.
- `E2E_CLEAN_INSTALL=true npm run test:e2e:launcher`: PASS — instalação limpa,
  Codex sem chaves, porta customizada, login real, desktop/mobile, ownership stale,
  idempotência, sentinel em `projetos/`, stop, restart e restauração do Supabase.
- Evidência visual: `/tmp/story-8-w3-3-evidence/readiness-desktop.png` e
  `/tmp/story-8-w3-3-evidence/readiness-mobile.png`.
- `.aiox/waves/epic-8-wave-3/qa-w3.3.yaml`: `SHIP`, sem findings abertos.
