---
status: InReview
story_id: "8.W1.2"
title: "Boundary seguro do runner Codex CLI local"
epic: 8
wave: "W1"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: high
involves_ui: false
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/local-skill-runner.ts"
  - "apps/academia-lendaria-ads-studio/server/local-runner-security.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/server/start.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts"
  - "apps/academia-lendaria-ads-studio/vite.config.ts"
---

# STORY-8.W1.2 - Boundary seguro do runner Codex CLI local

## User Story

**Como** aluno executando skills localmente
**Quero** que apenas a interface local autorizada acione meu Codex CLI
**Para** não expor execução agentic à rede ou a chamadas não autenticadas.

## Acceptance Criteria

1. BFF local escuta `127.0.0.1` por padrão; bind público exige configuração explícita.
2. `/api/local/skills/:skillId/run` exige token efêmero ou segredo local, comparado em tempo constante.
3. O proxy Vite injeta o token no lado servidor; o segredo nunca aparece no bundle nem em logs.
4. O processo `codex exec` remove `OPENAI_API_KEY` e `CODEX_API_KEY` do ambiente e reutiliza somente a autenticação local do CLI.
5. Há limite de concorrência e tamanho de payload, timeout com kill escalonado e cleanup de temporários.
6. Testes provam 401 sem token, 403 com token incorreto, sucesso autorizado, loopback default e ausência de segredos nos logs.

## Tasks

- [x] Criar boundary token e comparação segura.
- [x] Endurecer host, CORS, payload e concorrência.
- [x] Sanitizar o ambiente filho do Codex CLI.
- [x] Integrar token ao proxy Vite sem vazar ao cliente.
- [x] Cobrir ataques e happy path com testes.

## File List

| Arquivo | Operação |
|---------|----------|
| `apps/academia-lendaria-ads-studio/server/local-runner-security.ts` | ADD |
| `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/server/app.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/server/start.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/vite.config.ts` | MODIFY |

## Dev Agent Record

### Implementação (STORY-8.W1.2)

Novo módulo `local-runner-security.ts` concentra as primitivas do boundary; os
demais arquivos consomem-no sem duplicar lógica.

- **AC1 — bind loopback:** `resolveLocalBindHost()` retorna `127.0.0.1` por
  padrão; `start.ts` só escuta em interface pública quando `HOST` é definido
  explicitamente.
- **AC2 — boundary autenticado:** `/api/local/skills/:skillId/run` exige o header
  `x-local-runner-token`. `authorizeLocalRunnerRequest` responde 401 (ausente) /
  403 (inválido), comparando via `timingSafeEqualStrings` (digest SHA-256 +
  `crypto.timingSafeEqual`, tempo constante e sem vazar comprimento). Token
  resolvido de `LOCAL_SKILL_RUNNER_TOKEN` ou efêmero (fail-closed).
- **AC3 — proxy Vite:** `vite.config.ts` lê o token via `loadEnv(mode, cwd, '')`
  no contexto Node e o injeta no `proxyReq` server-side. Como não é `VITE_*`, o
  segredo nunca entra em `import.meta.env`/bundle; `redact` no logger Fastify
  protege o header em logs.
- **AC4 — env sanitizado:** `sanitizeCodexEnv` remove `OPENAI_API_KEY` e
  `CODEX_API_KEY` (cópia rasa, sem mutar `process.env`); o `codex exec` preserva
  a autenticação local do CLI (`--ephemeral --sandbox read-only` mantidos).
- **AC5 — limites:** `createConcurrencyLimiter` (default 2, 429 fail-fast),
  `bodyLimit` por rota (default 256KB, 413), timeout com kill escalonado
  (SIGTERM → SIGKILL após `killGraceMs`); cleanup de temporários preservado no
  `finally`. Todos configuráveis por env.
- **AC6 — testes:** 401 sem token, 403 token inválido, sucesso autorizado, 429
  concorrência, 413 payload, ausência de segredo em stdout/stderr, sanitização de
  env, loopback default e primitivas unitárias.

### Evidências

- `vitest run --project server`: **27/27 passed** (17 do boundary + 10 de
  orquestração/jobs preservados, sem regressão).
- `tsc -p tsconfig.server.json --noEmit`: No errors.
- `tsc -p tsconfig.node.json --noEmit` (cobre `vite.config.ts` + server + tests):
  No errors.
- `eslint` nos 6 arquivos do escopo: No issues found.

