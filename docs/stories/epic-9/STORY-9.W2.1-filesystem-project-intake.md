---
status: Draft
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
---

# STORY-9.W2.1 - Intake seguro de artefatos do filesystem

## Acceptance Criteria

1. A UI lista somente diretórios confinados em `projetos/`.
2. Preview mostra manifesto, paths, tipos, hashes e conflitos antes de importar.
3. Symlink, path traversal, segredo conhecido e arquivo fora da allowlist são rejeitados.
4. Confirmação humana registra metadados no Supabase sem mover a fonte canônica.
5. Repetição é idempotente por projeto, path e hash.

## Tasks

- [ ] Definir manifesto e allowlist.
- [ ] Implementar scanner confinado e preview.
- [ ] Implementar confirmação e idempotência.
- [ ] Criar UI de intake e testes de segurança.
