---
status: Done
story_id: "9.W3.2"
title: "Onboarding e recuperação para alunos"
epic: 9
wave: "W3"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@ux-design-expert"
accountable: "Rafael Costa"
depends_on: ["9.W2.3"]
consumes_artifacts_of: ["9.W2.3"]
file_scope: shared
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/components/projects-home.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/system-readiness.tsx"
  - "apps/academia-lendaria-ads-studio/src/index.css"
  - "README.md"
  - "docs/qa/epic-9-student-onboarding.md"
---

# STORY-9.W3.2 - Onboarding e recuperação para alunos

## Acceptance Criteria

1. Primeiro acesso, primeiro projeto e próxima ação formam uma sequência contínua.
2. Cada bloqueio observado no piloto possui ação de recuperação na própria tela.
3. Textos usam linguagem de tarefa, sem comandos internos, YAML ou jargão técnico.
4. Desktop e mobile preservam navegação, foco, leitura e áreas de toque.
5. README e ajuda refletem exatamente o runtime entregue.

## Tasks

- [x] Corrigir bloqueios de UX do piloto.
- [x] Integrar recuperações ao readiness e à próxima ação.
- [x] Validar acessibilidade e responsividade.
- [x] Atualizar documentação do aluno.

## Dev Agent Record

### Progress

- [x] Leitura da story, evidências do piloto e padrões existentes.
- [x] Bloqueios mapeados: estado vazio sem condução, importação com linguagem técnica, falha de criação sem recuperação e diagnóstico expondo comandos internos.
- [x] Implementação e testes.
- [x] Validação visual desktop/mobile.
- [x] Revisão final e gates.

### File List

- `docs/stories/epic-9/STORY-9.W3.2-student-onboarding-recovery.md`
- `apps/academia-lendaria-ads-studio/src/components/local-first-run.tsx`
- `apps/academia-lendaria-ads-studio/src/components/local-first-run.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/login-form.tsx`
- `apps/academia-lendaria-ads-studio/src/components/login-form.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-overview.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-overview.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/projects-home.tsx`
- `apps/academia-lendaria-ads-studio/src/components/projects-home.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/system-readiness.tsx`
- `apps/academia-lendaria-ads-studio/src/components/system-readiness.test.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `README.md`
- `docs/qa/epic-9-student-onboarding.md`
