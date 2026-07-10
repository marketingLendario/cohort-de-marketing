---
status: Done
story_id: "9.W1.2"
title: "Importação durável do briefing"
epic: 9
wave: "W1"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 2d
hill_phase: figuring_out
confidence_level: high
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-briefing.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-briefing.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/project-domain.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-domain.test.ts"
  - "docs/stories/epic-9/STORY-9.W1.2-durable-project-brief-import.md"
---

# STORY-9.W1.2 - Importação durável do briefing

## User Story

**Como** operador autenticado
**Quero** importar um `project-brief.json` para o projeto real
**Para** reaproveitar o contexto anterior sem depender do cache do navegador.

## Acceptance Criteria

1. Modo real importa via controller/repository; `importLegacyBrief` local permanece apenas no demo.
2. O migrador valida `0.1.0 -> 1.0.0`, preservando zero, false, unknown e not_applicable.
3. Slug duplicado ou revisão concorrente produz conflito tratável sem sobrescrever dados.
4. Projeto e primeira revisão só entram no cache após persistência bem-sucedida.
5. O projeto importado reaparece após reload, logout/login e novo controller.
6. Erros de schema mostram campos inválidos sem descartar o arquivo original.
7. Testes cobrem sucesso, migração, conflito, falha parcial e round-trip.

## Tasks

- [x] Adicionar ação `importProjectBrief` ao controller e ao contexto.
- [x] Portar o handler real do formulário para a ação persistente.
- [x] Preservar o caminho demo explicitamente.
- [x] Implementar mensagens de conflito e validação.
- [x] Cobrir round-trip e regressões de tipos de valor.

## File List

- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-briefing.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-briefing.test.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.test.ts`
- `docs/stories/epic-9/STORY-9.W1.2-durable-project-brief-import.md`

## Change Log

- Controller real valida/migra o `0.1.0`, verifica slug duplicado, persiste projeto, revisão, ponteiro ativo e artefatos antes de espelhar no cache.
- O caminho demo segue explícito em `importLegacyBrief`; fora dele, Zustand continua sendo somente cache.
- Validação retorna todos os caminhos inválidos sem alterar o arquivo original;
  o seletor é liberado para permitir o reenvio do mesmo caminho após correção.
- O pointer da revisão ativa funciona como commit marker: falhas antes dele
  deixam a importação retomável, enquanto um projeto completo mantém o conflito
  de slug sem sobrescrita.
- A hidratação ignora transações interrompidas sem pointer ativo, evitando que
  um projeto parcial apareça na UI entre a falha e a retomada.
- Retomadas reutilizam o `id` de declarações de artefato já persistidas, e a
  validação percorre o schema canônico até os campos aninhados antes de gravar.
- Conflitos de slug/revisão são rejeitados sem sobrescrita; valores `0`, `false`, `unknown` e `not_applicable` permanecem intactos.

## Evidências

- Testes focados finais: 2 arquivos, 23 testes — PASS.
- Suíte completa: `npm test` — 33 arquivos, 276 testes — PASS.
- `npm run lint` — PASS.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=test-anon-key npm run typecheck` — PASS.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=test-anon-key npm run build` — PASS.
- `npm run build:server` — PASS.
- `git diff --check` — PASS.

## QA Gate

**Veredito:** PASS em 2026-07-10. Nenhum finding aberto P0/P1/P2.

- Sucesso, migração, conflito de slug, retomada após falha parcial sem atualização
  de cache, round-trip em novo controller e regressões de tipos foram cobertos.
- O typecheck detectou e foi corrigido o seam de compatibilidade dos consumidores existentes do contexto; lint e builds finais passaram.
- A primeira revisão Codex encontrou dois P2: duplicação de declaração na
  retomada e validação aninhada incompleta. Ambos foram fechados com reuso de ID,
  validação pelo schema canônico e testes de regressão.
- A segunda revisão encontrou `schemaVersion` ausente como P2; a validação agora
  aplica também os campos obrigatórios do schema raiz antes da migração.
- A terceira revisão encontrou commit com resposta perdida como P2; um briefing
  ativo semanticamente idêntico agora é reconciliado de forma idempotente, sem
  duplicar projeto, revisão, artefato ou cache.
- Não houve alteração fora dos `touched_paths`, nem uso de `OPENAI_API_KEY`/`CODEX_API_KEY`.
