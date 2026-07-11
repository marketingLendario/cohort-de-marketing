# Story - Tela 5 de Fábrica de Criativos

## Status

Concluída.

## Contexto

O mock completo define configuração de lote, geração assíncrona, galeria,
aprovação e encaixe de criativos nos ad slots. Este corte porta o fluxo para o
modo demo usando os bitmaps fornecidos pela própria referência visual.

## Critérios de aceite

- [x] Formatos, arquétipos, personas, variantes e fonte da copy são configuráveis.
- [x] O resumo do lote reflete a configuração e inicia a geração assíncrona.
- [x] A galeria usa os criativos reais do mock e expõe gate, formato e arquétipo.
- [x] Aprovar, regenerar, descartar e atribuir a slot funcionam.
- [x] Os seis ad slots mostram preenchimento e permitem remoção.
- [x] Estado e slots persistem por campanha no modo demo.
- [x] Avançar navega para Tracking.
- [x] Desktop/mobile e gates de qualidade passam.

## Fora de escopo

- Chamar um gerador de imagem externo.
- Upload definitivo para storage/Supabase.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/public/creative-samples/`
- `apps/academia-lendaria-ads-studio/src/components/wizard/creative-factory-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/creative-factory.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-operation-steps.test.ts`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
