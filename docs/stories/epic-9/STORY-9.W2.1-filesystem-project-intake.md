---
status: Done
story_id: "9.W2.1"
title: "Intake seguro de artefatos do filesystem"
epic: 9
wave: "W2"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["9.W1.2", "9.W1.3"]
consumes_artifacts_of: ["9.W1.2"]
file_scope: shared
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/project-intake.ts"
  - "apps/academia-lendaria-ads-studio/server/project-intake.test.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/src/components/projects-home.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/projects-home.test.tsx"
  - "docs/stories/epic-9/STORY-9.W2.1-filesystem-project-intake.md"
---

# STORY-9.W2.1 - Intake seguro de artefatos do filesystem

## Acceptance Criteria

1. A UI lista somente diretórios confinados em `projetos/`.
2. Preview mostra manifesto, paths, tipos, hashes e conflitos antes de importar.
3. Symlink, path traversal, segredo conhecido e arquivo fora da allowlist são rejeitados.
4. Confirmação humana registra metadados no Supabase sem mover a fonte canônica.
5. Repetição é idempotente por projeto, path e hash.

## Tasks

- [x] Definir manifesto e allowlist.
- [x] Implementar scanner confinado e preview.
- [x] Implementar confirmação e idempotência.
- [x] Criar UI de intake e testes de segurança.

## File List

| Arquivo | Operação |
|---------|----------|
| `apps/academia-lendaria-ads-studio/server/project-intake.ts` | ADD |
| `apps/academia-lendaria-ads-studio/server/project-intake.test.ts` | ADD |
| `apps/academia-lendaria-ads-studio/server/app.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/src/components/projects-home.tsx` | MODIFY |
| `apps/academia-lendaria-ads-studio/src/components/projects-home.test.tsx` | ADD |
| `docs/stories/epic-9/STORY-9.W2.1-filesystem-project-intake.md` | MODIFY |

## Dev Agent Record

### Implementação

- O scanner do intake ficou concentrado em `server/project-intake.ts`, sempre
  confinado a `projetos/`, com resolução canônica de paths, rejeição explícita
  de traversal, symlink, segredos conhecidos e qualquer arquivo fora da
  allowlist versionada.
- O preview gera um manifesto determinístico com `sourcePath`, `allowlist`,
  `hash` do snapshot, `artifactType`, `format`, `sizeBytes` e conflitos por
  `project/path/hash` contra os artefatos já persistidos no Supabase.
- A confirmação humana não move nem copia a fonte canônica: ela persiste apenas
  metadata em `project_artifacts` (`path`, `type`, `format`, `content_hash`,
  `source=filesystem`) e reaproveita o mesmo registro quando o hash já coincide.
- A superfície HTTP usa o mesmo boundary token local dos fluxos existentes em
  `app.ts`, com rotas separadas para `sources`, `preview` e `confirm`.
- A UI em `ProjectsHome` ganhou um painel de intake local para escolher o
  projeto real, listar somente diretórios válidos em `projetos/`, inspecionar o
  manifesto/hashes/conflitos e registrar a confirmação explicitamente.

### Evidências

- Backend: scanner confinado, preview com conflitos, rejeição de traversal,
  symlink, segredo e arquivo fora da allowlist, persistência idempotente e
  boundary token cobertos em `server/project-intake.test.ts`.
- UI: abertura do painel, listagem de diretórios, renderização do preview,
  POST de confirmação e surfacing de rejeições do backend cobertos em
  `src/components/projects-home.test.tsx`.

## QA Gate

**Veredito:** PASS em 2026-07-10. Nenhum finding aberto P0/P1/P2.

- O intake não altera a fonte em `projetos/`; só registra metadata reconciliada
  no Supabase, preservando o filesystem como superfície canônica.
- Replays do mesmo `project/path/hash` não duplicam artefato nem segunda
  escrita; o segundo confirm converge para `unchanged`.
- As rejeições obrigatórias do AC3 ficaram cobertas por teste: traversal,
  symlink, segredo e allowlist violation retornam erro tratável antes de qualquer
  persistência.
- O review Codex encontrou e fechou um P2 de classificação: arquivos CSV agora
  preservam `format: csv` no preview e no metadata persistido, em vez de serem
  tratados como markdown.
- A segunda revisão fechou um P2 de compatibilidade com árvores reais:
  diretórios ocultos e de build são ignorados pelo scanner, não importados nem
  tratados como erro; symlinks e arquivos proibidos continuam fail-closed.
- Um P1 posterior sobre ausência de `ProjectHydrationBoundary` foi rejeitado
  com evidência: `AuthenticatedRoute`, pai de `/projects/`, já envolve o
  `<Outlet>` nessa boundary, e o hook questionado já existia antes deste diff.
- Não houve alteração em `STORY-9.W2.2`; a story seguinte continua isolada para
  o pacote piloto real da Academia Lendária.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @dev | Implementação completa do intake seguro de artefatos do filesystem: serviço backend, endpoints locais, painel na home de projetos, testes focados e validação final. Status Ready → Done. |

## Validação executada

- `npm test -- project-intake.test.ts projects-home.test.tsx` — PASS (2 arquivos / 10 testes).
- `npm run lint -- server/project-intake.ts server/project-intake.test.ts src/components/projects-home.tsx src/components/projects-home.test.tsx` — PASS.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
