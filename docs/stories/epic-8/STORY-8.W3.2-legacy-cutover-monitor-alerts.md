---
status: Draft
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
  - "apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx"
  - "apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.ts"
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

- [ ] Definir projeção tipada de alertas.
- [ ] Ligar monitor à operação semanal.
- [ ] Implementar redirect/bridge legado.
- [ ] Remover copy de placeholder técnico.
- [ ] Cobrir deep links e estados de alerta.

## File List

- `apps/academia-lendaria-ads-studio/src/components/monitor-alerts.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/dashboard/index.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/monitor-alerts.ts`

