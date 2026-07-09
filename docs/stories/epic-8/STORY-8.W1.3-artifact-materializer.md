---
status: Ready
story_id: "8.W1.3"
title: "Materializador atômico de artefatos"
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
  - "apps/academia-lendaria-ads-studio/server/artifact-materializer.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts"
  - "data/contracts/artifact-write.v1.schema.json"
---

# STORY-8.W1.3 - Materializador atômico de artefatos

## User Story

**Como** operador que aprovou uma proposta de skill
**Quero** materializar o resultado em um arquivo canônico verificável
**Para** que o estado sobreviva ao chat e seja consumido pelas próximas skills.

## Acceptance Criteria

1. O contrato `artifact-write.v1` descreve path relativo, formato, conteúdo, hash esperado, run e projeto.
2. Paths só podem resolver dentro de `projetos/{slug}/`; traversal, absoluto, symlink escape e slug inválido são rejeitados.
3. A escrita usa arquivo temporário + rename atômico e nunca deixa arquivo parcial após falha.
4. O materializador calcula SHA-256, retorna before/after e produz evento de auditoria serializável.
5. Escrita idempotente com o mesmo hash é no-op; conteúdo divergente exige revisão explícita.
6. Testes cobrem markdown, JSON/YAML, idempotência, conflito, traversal, symlink e rollback.

## Tasks

- [ ] Definir e validar `artifact-write.v1`.
- [ ] Implementar resolução segura de path.
- [ ] Implementar escrita atômica, hash e idempotência.
- [ ] Implementar rollback e evento de auditoria.
- [ ] Cobrir ameaças e formatos com testes.

## File List

- `apps/academia-lendaria-ads-studio/server/artifact-materializer.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts`
- `data/contracts/artifact-write.v1.schema.json`

