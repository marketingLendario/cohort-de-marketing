# Story - Tela 8 de Monitoramento

## Status

Concluída.

## Contexto

O passo 8 apresenta KPIs, decision log, fila de aprovação humana e scale
readiness. Este corte substitui o placeholder de roadmap por uma experiência
operacional persistida em modo demo.

## Critérios de aceite

- [x] KPIs e deltas reproduzem a referência.
- [x] O monitor pode ser pausado e retomado.
- [x] O decision log mostra decisões scale, kill e alert.
- [x] Aprovar/rejeitar uma ação remove a fila e registra decisão humana.
- [x] Scale readiness abre com os quatro critérios da referência.
- [x] Estado persiste por campanha no modo demo.
- [x] Voltar navega para Publicação.
- [x] Desktop/mobile e gates de qualidade passam.

## Fora de escopo

- Dados reais da Meta em tempo real.
- Execução automática de budget/kill.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/performance-monitor-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/performance-monitor.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-operation-steps.test.ts`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
