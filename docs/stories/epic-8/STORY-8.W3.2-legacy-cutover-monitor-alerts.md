---
status: Done
story_id: "8.W3.2"
title: "Cutover legado e alertas do monitor"
epic: 8
wave: "W3"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: high
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W2.1", "8.W2.2"]
consumes_artifacts_of: ["8.W2.1", "8.W2.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/components/monitor-alerts.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/wizard/campaign-publication-step.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/dashboard.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/dashboard.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx"
  - "apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/legacy-cutover.ts"
  - "apps/academia-lendaria-ads-studio/src/components/monitor-alerts.test.tsx"
  - "apps/academia-lendaria-ads-studio/e2e/story-8-w3-2.mjs"
  - "apps/academia-lendaria-ads-studio/package.json"
  - "docs/stories/epic-8/STORY-8.W3.2-legacy-cutover-monitor-alerts.md"
---

# STORY-8.W3.2 - Cutover legado e alertas do monitor

## User Story

**Como** operador retornando por uma URL antiga
**Quero** chegar ao projeto unificado e ver alertas reais
**Para** não cair em placeholders ou superfícies divergentes.

## Acceptance Criteria

1. `/dashboard` redireciona ou apresenta entrada inequívoca para `/projects` sem perder campanha.
2. Alertas derivam de weekly panel/diagnosis persistido, nunca de números fabricados.
3. Cada alerta mostra campanha, evidência, hipótese, severidade e CTA para revisão humana.
4. URLs legadas 1-8 permanecem recuperáveis durante o cutover.
5. Texto de stories/epics futuras desaparece da UI do usuário.
6. E2E cobre deep links, alertas vazios/reais e retorno ao fluxo unificado.

## Tasks

- [x] Definir projeção tipada de alertas.
- [x] Ligar monitor à operação semanal.
- [x] Implementar redirect/bridge legado.
- [x] Remover copy de placeholder técnico.
- [x] Cobrir deep links e estados de alerta.

## Desenho de implementação

### Fonte de verdade e projeção

`MonitorAlert` será uma projeção pura de `WeeklyPanel[]`, campanhas persistidas
e `ProjectArtifact[]`. Um alerta só existe quando o painel tem diagnóstico
persistido completo, decisão humana pendente, campanha resolvida pelo vínculo
`project_id` e pelo menos uma evidência literal do painel ou artefato verificado.
Não haverá cálculo, número, hipótese, campanha ou severidade default.

```text
ProjectRepository → ProjectHydrationBoundary → Zustand (cache)
                                      ├─ weeklyPanels
                                      ├─ artifacts
                                      └─ campanhas do workspace
                                                ↓
                              projectAlertProjection (função pura)
                                                ↓
                                     MonitorAlerts (review-only)
```

`critical` deriva exclusivamente de `diagnosis.circuitBreakerTriggered`; os
demais diagnósticos pendentes são `attention`. A evidência conserva métrica,
valor, selo e fonte fornecidos no painel, ou título/caminho de artefato
verificado. O CTA aponta para a operação semanal, sempre com o texto
`Revisar no painel semanal`; não existem ações de pausar, publicar ou escalar.

### Cutover e compatibilidade

`/dashboard` oferece uma ponte inequívoca para `/projects`, preservando o
contexto de campanha quando houver `project_id` resolvível e caindo em
`/projects` com `legacyCampaignId`/`legacyStep` quando não houver vínculo.
`/campaigns/:campaignId/1..8` continua renderizando o wizard existente, com
ponte visível para a campanha/projeto unificado. Passos fora de `1..8` e IDs
sem vínculo mostram estado de recuperação sem loop de navegação.

### Matriz de validação

- Unitário: projeção vazia, diagnóstico pendente real, circuit breaker,
  ausência de evidência/campanha e CTA review-only.
- Componente: estado vazio profissional sem referências a epic/story, card real,
  campos acessíveis e nenhum CTA mutável.
- Playwright: `/dashboard`, `/projects`, deep links `1..8`, URL inválida,
  reload, query/history/back, desktop/mobile, console/network e overlaps.

## File List

- `apps/academia-lendaria-ads-studio/src/components/monitor-alerts.tsx`
- `apps/academia-lendaria-ads-studio/src/components/wizard/campaign-publication-step.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.ts`
- `apps/academia-lendaria-ads-studio/src/components/dashboard.tsx`
- `apps/academia-lendaria-ads-studio/src/components/dashboard.test.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/legacy-cutover.ts`
- `apps/academia-lendaria-ads-studio/src/components/monitor-alerts.test.tsx`
- `apps/academia-lendaria-ads-studio/e2e/story-8-w3-2.mjs`
- `apps/academia-lendaria-ads-studio/package.json`
- `docs/stories/epic-8/STORY-8.W3.2-legacy-cutover-monitor-alerts.md`

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @dev | Implementada projeção tipada de alertas a partir de weekly panels, diagnósticos e artefatos verificados; dashboard com bridge contextual; cutover das rotas legadas 1–8 com fallback seguro; etapa legada 8 sem monitor sintético; testes unitários, componentes e E2E Playwright. Status Ready → InReview. |
| 2026-07-10 | @dev | Corrigidos W3.2-QA-001/002: campanha desconhecida preserva `legacyCampaignId` e diagnóstico incompleto não produz alerta; E2E adversarial incorporado à suíte. |
| 2026-07-10 | @dev | Removidos controles mutáveis de publicação da etapa legada 7; a rota agora preserva o consolidado em modo somente leitura e direciona à superfície unificada. |
| 2026-07-10 | @qa | Gate independente SHIP; W3.2-QA-001/002/003/004 resolvidos. Status InReview → Done. |

## Validação executada

- `npm test`: 30 arquivos / 247 testes — PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run build:server`: PASS.
- `npm run test:e2e`: PASS — vazio/real, deep links 1–8, URL inválida,
  reload, query/history/back, desktop/mobile, console/network e overlaps.
- Evidência visual local: `/tmp/story-8-w3-2-recovery-evidence/` (desktop e mobile).
