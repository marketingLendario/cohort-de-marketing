# Story - Tela 3 de Estrutura de Campanha em modo demo

## Status

Done em 2026-07-09.

## Contexto

Depois da Seleção de Funil, o PRD define a Tela 3 como o builder de estrutura da
campanha: objetivo, orçamento, CBO/ABO, árvore campanha→adsets→ads, nomenclatura
automática e slots vazios para criativos.

Neste corte, a estrutura é editável e persistida em modo demo. A validação real
pela skill `campaign-structure` e o drag-and-drop com `@dnd-kit` ficam fora de
escopo para uma próxima fatia.

## Critérios de aceite

- [x] A Tela 3 renderiza em `/campaigns/:campaignId/3`.
- [x] A tela coleta `objective` e `budget_total`.
- [x] A tela permite escolher CBO vs ABO.
- [x] Cada adset permite configurar público LAL / Interesse / Broad.
- [x] A árvore mostra campanha→adsets→ads.
- [x] Cada ad exibe um slot vazio aguardando criativo.
- [x] A nomenclatura automática segue o padrão `[TIPO] Produto - Público - Data`.
- [x] O usuário pode adicionar/remover/reordenar adsets e adicionar ads.
- [x] Em modo demo, a estrutura é persistida por campanha em `localStorage`.
- [x] Ao avançar, a campanha demo recebe `step_current=4` e a UI navega para o
  passo 4.
- [x] Typecheck, build, testes e lint passam.

## Fora de escopo

- Drag-and-drop real com `@dnd-kit`.
- Invocar a skill real `campaign-structure`.
- Persistir `ads_structure`/`ads_ad_slots` no Supabase.
- Implementar a Tela 4 completa.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/lib/campaign-structure.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-structure.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/components/wizard/campaign-structure-step.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`

## Comandos de validação

```bash
npm --prefix apps/academia-lendaria-ads-studio run typecheck
npm --prefix apps/academia-lendaria-ads-studio test
npm --prefix apps/academia-lendaria-ads-studio run lint
npm --prefix apps/academia-lendaria-ads-studio run build
```

## Resultado

- Typecheck: PASS.
- Testes: PASS, 5 arquivos, 24 testes.
- Lint: PASS.
- Build: PASS.
- Browser local: `/campaigns/demo-campaign-1783610736025/3` renderizou
  "Estrutura da campanha", nó de campanha, adsets, slots vazios, resumo e botão
  "Avançar para Briefing"; sem overflow horizontal.
