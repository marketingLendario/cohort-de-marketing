# Story - Tela 2 de Seleção de Funil em modo demo

## Status

Done em 2026-07-09.

## Contexto

Depois da ponte do Gate #1, o usuário chegou ao passo 2 do wizard. O PRD define
a Tela 2 como Seleção de Funil, com coleta dos inputs canônicos do
`funnel-selection`, recomendação com confiança/rationale, cards comparativos e
override manual.

Neste corte, a recomendação é determinística local para permitir desenvolvimento
e teste em modo demo. A conexão real com a skill `funnel-selection` via camada de
orquestração fica fora de escopo.

## Critérios de aceite

- [x] A Tela 2 renderiza em `/campaigns/:campaignId/2`.
- [x] A tela coleta `product_type`, ticket herdado do passo 1,
  `product_validated`, `backend_exists`, `sales_team` e
  `audience_temperature`.
- [x] A tela exibe recomendação de funil com confiança e rationale quando há
  base suficiente.
- [x] A tela mostra cards comparativos para Tráfego Direto, Funil R$1, Aula no
  Zoom e Lead Magnet.
- [x] O usuário pode escolher manualmente um funil diferente e o estado registra
  override.
- [x] Em modo demo, a escolha final é persistida por campanha em `localStorage`.
- [x] Ao avançar, a campanha demo recebe `step_current=3` e a UI navega para o
  passo 3.
- [x] Typecheck, build, testes e lint passam.

## Fora de escopo

- Invocar a skill real `funnel-selection`.
- Persistir `ads_funnel` no Supabase.
- Implementar a Tela 3 completa.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/lib/funnel-selection.ts`
- `apps/academia-lendaria-ads-studio/src/lib/funnel-selection.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/components/wizard/funnel-selection-step.tsx`
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
- Testes: PASS, 4 arquivos, 20 testes.
- Lint: PASS.
- Build: PASS.
- Browser local: `/campaigns/demo-campaign-1783610736025/2` renderizou
  "Seleção de funil", os quatro cards de funil, botão "Avançar para Estrutura"
  e sem overflow horizontal.
