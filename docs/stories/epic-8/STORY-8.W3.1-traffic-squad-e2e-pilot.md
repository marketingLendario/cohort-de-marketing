---
status: Done
story_id: "8.W3.1"
title: "E2E real do Squad de Tráfego"
epic: 8
wave: "W3"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 2d
hill_phase: done
confidence_level: high
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W2.3"]
consumes_artifacts_of: ["8.W2.3"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/traffic-squad.spec.ts"
  - "apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/**"
  - "apps/academia-lendaria-ads-studio/scripts/traffic-pilot-report.mjs"
  - "apps/academia-lendaria-ads-studio/server/local-skill-runner.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-materializer.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts"
  - ".claude/skills/_shared/squad-trafego/README.md"
  - ".claude/skills/briefista/SKILL.md"
  - ".agents/skills/_shared/squad-trafego/README.md"
  - ".agents/skills/briefista/SKILL.md"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/20260710123000_allow_cancelled_skill_retry.sql"
  - ".aiox/waves/epic-8-wave-3/qa-w3.1.yaml"
  - "docs/qa/epic-8-traffic-pilot.md"
  - "docs/stories/epic-8/STORY-8.W3.1-traffic-squad-e2e-pilot.md"
---

# STORY-8.W3.1 - E2E real do Squad de Tráfego

## User Story

**Como** aluno da Aula 3
**Quero** operar o squad completo pela interface
**Para** sair do briefing até uma decisão semanal sem usar comandos técnicos.

## Acceptance Criteria

1. Fixture real cria projeto e campanha sem depender do estado demo embutido.
2. Zelador, Briefista e Estruturador executam, revisam e materializam artefatos.
3. Métricas com selos Real/Estimado/Não fornecido passam pelo Leitor sem cálculo inventado.
4. Diagnosticador retorna uma alavanca com critérios de sucesso e reversão; humano decide.
5. Reload entre etapas prova retomada DB/filesystem e hashes reconciliados.
6. Relatório registra tempos, lacunas, recusas, arquivos e evidência visual desktop/mobile.

## Tasks

- [x] Montar fixture e seed determinístico.
- [x] Automatizar sequência das cinco skills.
- [x] Testar reload, retry e recusas honestas.
- [x] Validar hashes DB/filesystem.
- [x] Publicar relatório de piloto e screenshots.

## File List

- `apps/academia-lendaria-ads-studio/e2e/traffic-squad.spec.ts`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/**`
- `apps/academia-lendaria-ads-studio/scripts/traffic-pilot-report.mjs`
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-materializer.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts`
- `.claude/skills/_shared/squad-trafego/README.md`
- `.claude/skills/briefista/SKILL.md`
- `.agents/skills/_shared/squad-trafego/README.md`
- `.agents/skills/briefista/SKILL.md`
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts`
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts`
- `apps/academia-lendaria-ads-studio/supabase/migrations/20260710123000_allow_cancelled_skill_retry.sql`
- `.aiox/waves/epic-8-wave-3/qa-w3.1.yaml`
- `docs/qa/epic-8-traffic-pilot.md`
- `docs/stories/epic-8/STORY-8.W3.1-traffic-squad-e2e-pilot.md`

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @qa | Gate independente SHIP; QA-W3.1-P2-001 resolvido, evidência e hashes revalidados. Status InReview → Done. |
| 2026-07-10 | @dev | Recuperação do QA-W3.1-P2-001: guarda determinística Leitor→Diagnosticador para métricas ausentes, incluindo campos canônicos omitidos e artefatos JSON/YAML; testes unitários e asserção E2E impedem derivação antes da revisão humana. |
| 2026-07-10 | @dev | Fixture real Supabase, cinco skills via Codex CLI, recusa/retry/cancelamento, reload, reconciliação DB/filesystem, evidência visual desktop/mobile e relatório regenerável. Corrigidos cancelamento persistido, reattach após retry, reconciliação terminal imediata e fallback técnico para path vazio. Status Ready → InReview. |
| 2026-07-10 | @dev/@qa | Piloto repetido após hardening do contrato de caminhos e consolidação de blocos do painel: 5 skills `done`, 5 aprovações, 1 recusa, retry/cancelamento, 12 reloads, hashes reconciliados, zero erros visuais/rede e campanha `draft`. Status Done confirmado. |

## Validação executada

- `npx playwright test e2e/traffic-squad.spec.ts --reporter=line`: PASS, 1 teste em 4,4 min.
- Cinco skills `done`, cinco aprovações `approve/done`, uma recusa honesta e retry HTTP 202 com tentativa 2 cancelada.
- 12 reloads, hashes de todos os arquivos reconciliados, campanha fixture preservada em `draft`/etapa 1.
- CTR, CPM, alcance e frequência ficaram `nao_fornecido`; o Diagnosticador não calculou, estimou ou derivou valor para nenhuma delas.
- Desktop 1280×900 e mobile 390×844 no Diagnosticador concluído; zero overlaps, erros de console ou falhas de rede não esperadas.
- `npm test`: 32 arquivos / 268 testes; lint, typecheck, build e catálogo (30 skills / 40 edges): PASS.
- `.aiox/waves/epic-8-wave-3/qa-w3.1.yaml`: `SHIP`, sem findings abertos.
