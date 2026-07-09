# Story - Tela 4 de Briefing Criativo em modo demo

## Status

Done em 2026-07-09.

## Contexto

Depois da Estrutura de Campanha, o PRD define a Tela 4 como Briefing Criativo:
ICP, dores, desejos, ângulos, hooks, provas sociais e tom de voz/brand. Também
existe a ação "Gerar hooks com IA", que futuramente deve chamar a skill
`creative-brief` via orquestração.

Neste corte, a tela é funcional em modo demo, com geração simulada e assíncrona
de hooks para manter o wizard testável localmente.

## Critérios de aceite

- [x] A Tela 4 renderiza em `/campaigns/:campaignId/4`.
- [x] A tela coleta ICP/público, dores, desejos, provas sociais e tom de voz.
- [x] A tela permite selecionar ângulos de mensagem.
- [x] A ação "Gerar hooks com IA" mostra progresso assíncrono.
- [x] Hooks gerados são editáveis.
- [x] Hooks podem ser aprovados, removidos e adicionados manualmente.
- [x] Em modo demo, o briefing é persistido por campanha em `localStorage`.
- [x] Ao avançar, a campanha demo recebe `step_current=5` e a UI navega para o
  passo 5.
- [x] Typecheck, build, testes e lint passam.

## Fora de escopo

- Invocar a skill real `creative-brief`.
- Persistir briefing/hooks no Supabase.
- Implementar a configuração da fábrica de criativos da Tela 5.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/lib/creative-brief.ts`
- `apps/academia-lendaria-ads-studio/src/lib/creative-brief.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/components/wizard/creative-brief-step.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`

## Evidência de validação

- `npm run typecheck` passou.
- `npm test` passou: 6 arquivos, 28 testes.
- `npm run lint` passou.
- `npm run build` passou.
- Browser local verificado em `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/4`.
- Checagem responsiva: desktop e mobile sem overflow horizontal.
