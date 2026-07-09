---
status: Ready
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

- [ ] Criar boundary token e comparação segura.
- [ ] Endurecer host, CORS, payload e concorrência.
- [ ] Sanitizar o ambiente filho do Codex CLI.
- [ ] Integrar token ao proxy Vite sem vazar ao cliente.
- [ ] Cobrir ataques e happy path com testes.

## File List

- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/server/local-runner-security.ts`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/server/start.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts`
- `apps/academia-lendaria-ads-studio/vite.config.ts`

