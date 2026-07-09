# Story - Produto unificado do Cohort de Marketing

## Status

Done

## Objetivo

Implementar o masterplan em
`docs/design/cohort-marketing-unified-product-masterplan.md`, consolidando
Briefing, Jornada de Skills, Artefatos, Campanhas e Operacao Semanal no app
React existente.

## Acceptance Criteria

- [x] Um workspace possui projetos e um projeto possui briefing, artefatos,
  runs, campanhas e semanas.
- [x] Briefing, Jornada, Artefatos e Campanhas compartilham o mesmo shell e o
  mesmo projeto ativo.
- [x] O briefing e versionado, validado e distingue zero, falso, desconhecido e
  nao aplicavel.
- [x] A campanha herda dados do briefing com proveniencia e overrides
  explicitos.
- [x] O catalogo possui as 25 skills atuais e as 5 skills do Squad de Trafego,
  sem listas manuais divergentes.
- [x] A Jornada reflete prontidao, execucao, revisao, conclusao e invalidacao.
- [x] Artefatos reais e exemplos sao estados distintos.
- [x] As cinco skills de trafego podem ser operadas por formularios amigaveis.
- [x] Nenhuma acao do modo Cohort publica, pausa, escala ou altera a Meta.
- [x] Operacao semanal preserva historico e decisao humana.
- [x] Rotas legadas continuam recuperaveis durante a migracao.
- [x] Testes, lint, typecheck, build e validacao visual desktop/mobile passam.

## Tasks

### Onda 0 - Autoridade

- [x] Registrar ADR de dominio, autonomia e autoridade.
- [x] Promover as cinco skills de trafego para `.claude/skills`.
- [x] Gerar espelho literal em `.agents/skills`.
- [x] Reconciliar o contrato do Leitor com o PRD autoritativo.
- [x] Corrigir o export legado do briefing.

### Onda 1 - Contratos

- [x] Criar catalogo canonico de 30 skills.
- [x] Criar gerador e validador CLI-first.
- [x] Criar ProjectBrief v1 e migrador legado.
- [x] Criar CampaignPlan v1.
- [x] Criar WeeklyPanel v1.
- [x] Criar motor compartilhado de prontidao.

### Onda 2 - Produto

- [x] Introduzir Projeto no dominio e no modo demo.
- [x] Criar shell global e rotas de projeto.
- [x] Criar Visao Geral do projeto.
- [x] Manter compatibilidade com dashboard e wizard legados.

### Onda 3 - Briefing

- [x] Portar formulario para React.
- [x] Implementar autosave, validacao, proveniencia e revisoes.
- [x] Implementar importacao/exportacao e conciliacao legada.
- [x] Integrar proxima acao e lacunas.

### Onda 4 - Jornada e artefatos

- [x] Portar o mapa para React a partir do catalogo.
- [x] Implementar detalhe acionavel da skill.
- [x] Implementar registry e previews de artefatos.
- [x] Isolar fixtures do estado real.

### Onda 5 - Campanhas e Squad de Trafego

- [x] Implementar heranca e overrides do briefing.
- [x] Implementar lifecycle de runs e propostas.
- [x] Reordenar o fluxo Cohort de campanha.
- [x] Implementar Zelador, Briefista, Curadoria e Estruturador.
- [x] Registrar subida manual, sem mutacao Meta.

### Onda 6 - Operacao semanal

- [x] Implementar entrada e confirmacao de metricas.
- [x] Implementar Leitor e Diagnosticador.
- [x] Implementar decisoes humanas e historico append-only.
- [x] Implementar importacao/exportacao do Painel da Semana.

### Onda 7 - Validacao

- [x] Cobrir contratos e dominio com testes.
- [x] Cobrir jornadas principais com testes de componentes/E2E.
- [x] Rodar lint, typecheck e build.
- [x] Validar visualmente desktop e mobile.
- [x] Atualizar documentacao e concluir File List.

## Evidencias de validacao

- `npm test`: 17 arquivos e 63 testes aprovados.
- `npm run lint`, `npm run typecheck`, `npm run build` e
  `npm run build:server`: aprovados.
- `npm run test:visual`: seis rotas em desktop `1440x1000` e mobile
  `390x844`, sem overflow horizontal, erros de console ou falhas de navegacao.
- Runner real: `status-funil` executada pelo endpoint local via `codex exec`,
  com resposta estruturada e recusa honesta diante de contexto insuficiente.
- `supabase db lint --local --level warning`: sem erros de schema.
- `supabase test db`: quatro testes RLS aprovados (membro, nao membro, leitura
  isolada e escrita negada em outro workspace).

## Decisoes

- O app React existente e o shell unico.
- Workspace e tenancy; Projeto e a raiz do trabalho; Campanha pertence ao
  Projeto; Semana pertence a Campanha.
- O modo Cohort e recommend-only.
- O PRD-A3 e autoritativo para o contrato do Leitor.
- Skills continuam canonicas em `.claude/skills`; o produto orquestra.

## File List

- `docs/design/cohort-marketing-unified-product-masterplan.md`
- `docs/design/ads-studio-squad-trafego-integration-plan.md`
- `docs/stories/2026-07-09-cohort-marketing-unified-product.md`
- `docs/architecture/ADR-001-cohort-marketing-unified-domain.md`
- `.claude/skills/{zelador,briefista,estruturador,leitor-de-metricas,diagnosticador}/SKILL.md`
- `.claude/skills/_shared/squad-trafego/`
- `.agents/skills/{zelador,briefista,estruturador,leitor-de-metricas,diagnosticador}/`
- `data/skill-catalog.json`
- `data/skill-unlock-rules.json`
- `data/contracts/*.schema.json`
- `scripts/generate-skill-catalog.mjs`
- `scripts/validate-skill-catalog.mjs`
- `scripts/migrate-project-brief.mjs`
- `apps/academia-lendaria-ads-studio/src/components/project-*.tsx`
- `apps/academia-lendaria-ads-studio/src/components/traffic-campaign-workspace.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/{project-domain,readiness,campaign-plan,weekly-panel,skill-runtime}.ts`
- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts`
- `apps/academia-lendaria-ads-studio/src/routes/projects/`
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/scripts/visual-qa.mjs`
- `apps/academia-lendaria-ads-studio/src/components/project-overview.test.tsx`
- `apps/academia-lendaria-ads-studio/supabase/migrations/20260709220000_workspace_membership_foundation.sql`
- `apps/academia-lendaria-ads-studio/supabase/migrations/20260709225123_unified_marketing_project_domain.sql`
- `apps/academia-lendaria-ads-studio/supabase/tests/marketing_project_rls.sql`
