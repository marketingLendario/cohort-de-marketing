---
status: Done
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
  - "apps/academia-lendaria-ads-studio/data/contracts/artifact-write.v1.schema.json"
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

- [x] Definir e validar `artifact-write.v1`.
- [x] Implementar resolução segura de path.
- [x] Implementar escrita atômica, hash e idempotência.
- [x] Implementar rollback e evento de auditoria.
- [x] Cobrir ameaças e formatos com testes.

## File List

- `apps/academia-lendaria-ads-studio/server/artifact-materializer.ts` (ADD)
- `apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/data/contracts/artifact-write.v1.schema.json` (ADD)
- `docs/stories/epic-8/STORY-8.W1.3-artifact-materializer.md` (MODIFY)

## Dev Agent Record

### Acceptance Criteria — verificação

1. **Contrato `artifact-write.v1`** — `artifact-write.v1.schema.json` descreve `projectSlug`, `relativePath`, `format`, `content`, `expectedHash` (hash esperado), `runId` (run) e `onConflict`. `schemaVersion: "1.0.0"`. ✅
2. **Resolução só dentro de `projetos/{slug}/`** — `assertValidSlug` (regex `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`), `assertValidRelativePath` (rejeita absoluto, `..`, byte nulo) e `resolveSafeTarget` (containment sob `realpath` da raiz + recusa de symlink em ancestral e no alvo). Testes cobrem slug inválido, traversal, caminho absoluto e ambos os vetores de symlink escape. ✅
3. **Escrita atômica + sem parcial** — temp `.{basename}.{uuid}.tmp` no mesmo diretório com `flag: 'wx'` + `rename`; em falha faz `rm` do temp e o canônico permanece intacto. Teste de rollback (dir read-only) confirma canônico intacto e zero temporários remanescentes. ✅
4. **SHA-256 + before/after + auditoria serializável** — `sha256()`; resultado retorna `hashBefore`/`hashAfter` e `ArtifactAuditEvent` (`event`, `outcome`, hashes, `bytesWritten`, `timestamp`). Teste faz roundtrip `JSON.parse(JSON.stringify(audit))`. ✅
5. **Idempotência + conflito explícito** — mesmo hash → `outcome: 'unchanged'` (no-op); divergente com `onConflict: 'reject'` (default) → `outcome: 'conflict'` sem tocar o canônico; `onConflict: 'overwrite'` (revisão explícita) substitui atomicamente. ✅
6. **Cobertura de formatos e ameaças** — 20 testes: markdown, JSON/YAML (válido e inválido), idempotência, conflito, traversal, absoluto, symlink (ancestral e alvo), rollback, expectedHash (match/mismatch), slug inválido, schemaVersion. ✅

### Notas de decisão

- **Caminho do contrato (divergência resolvida):** a File List original apontava para o repo-root `data/contracts/`, onde vivem os contratos irmãos (`campaign-plan.v1`, `weekly-panel.v1`). O ownership exclusivo deste fan-out escopou a escrita para `apps/academia-lendaria-ads-studio/data/contracts/` (isolamento de paralelismo na wave). Honrei o boundary do fan-out e alinhei `touched_paths`/File List ao caminho app-local. O estilo do schema (draft 2020-12, `$id`, `additionalProperties: false`) segue a convenção dos contratos existentes.
- Módulo standalone (padrão de `local-skill-runner.ts`), sem wiring de servidor — as ACs cobrem apenas o comportamento do materializador. `now` é injetável para timestamp determinístico nos testes.

### Evidências (local)

- `vitest run` (arquivo): **20/20 passed**.
- `vitest run --project server` (regressão): **35/35 passed**, 15 suites.
- `tsc -p tsconfig.server.json --noEmit`: **No errors found**.
- `eslint` (módulo + teste): **No issues found**.
- Contrato: `JSON.parse` OK.

## QA Gate

**Veredito:** PASS em 2026-07-09. Nenhum finding P0/P1/P2.

- `npm test`: 19 arquivos / 113 testes; typecheck e lint verdes.
- Traversal, absoluto, slug, symlink ancestral/alvo, escrita atômica, rollback,
  idempotência e conflito foram verificados diretamente na implementação.
- O módulo permanece standalone por decisão da story; o wiring transacional com
  Supabase pertence à W2.3.

## Change Log

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-07-09 | @dev | Implementação completa (contrato + materializador + 20 testes). Status Ready → InReview. Contrato materializado em `apps/.../data/contracts/` conforme ownership do fan-out; File List/`touched_paths` alinhados. |
| 2026-07-09 | @qa | Quality gate integrado PASS; status InReview → Done. |
