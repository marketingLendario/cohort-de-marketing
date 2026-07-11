# Story - Alinhamento visual da Tela 2 de Funil

## Status

Concluída.

## Contexto

A Tela 2 já contém recomendação, seleção e persistência de funil, mas precisa
ser comparada e alinhada ao mock completo do Ads Studio. Este corte preserva o
motor de recomendação e as regras de avanço existentes, alterando somente a
composição visual e as interações necessárias para reproduzir a referência.

## Critérios de aceite

- [x] A recomendação principal, confiança e racional seguem a hierarquia do mock.
- [x] O contexto do produto usa os controles, labels e estados da referência.
- [x] Os quatro cards de funil reproduzem seleção, recomendação e métricas.
- [x] Selecionar o recomendado e trocar manualmente de funil continuam funcionais.
- [x] Salvar/retomar seleção e avançar para Estrutura continuam funcionais.
- [x] O motor de recomendação e o ticket herdado da Tela 1 não são alterados.
- [x] A tela não apresenta overflow horizontal em desktop ou mobile.
- [x] Typecheck, testes, lint e build passam.
- [x] A comparação visual desktop/mobile está registrada em `design-qa.md`.

## Fora de escopo

- Alterar os critérios do motor de recomendação.
- Implementar novos tipos de funil.
- Alinhar visualmente a Tela 3 neste corte.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/funnel-selection-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/funnel-selection.ts`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `apps/academia-lendaria-ads-studio/src/test/setup.ts`
- `apps/academia-lendaria-ads-studio/design-qa.md`
- `apps/academia-lendaria-ads-studio/design-qa-evidence/`
- `docs/stories/2026-07-09-ads-factory-funnel-visual-alignment.md`

## Evidência de validação

- `npm run typecheck`: passou.
- `npm test`: 8 arquivos e 32 testes passaram.
- `npm run lint`: passou.
- `npm run build`: passou.
- Browser desktop 1024 x 576 e mobile 390 x 844: sem overflow horizontal.
- Recomendação fria R$1 com 82% e morna Lead Magnet com 64% verificadas.
- Override manual, restauração do recomendado, persistência após reload e avanço
  para `/3` verificados no navegador.
- Comparações finais: `design-qa-evidence/compare-screen2-after-desktop.png` e
  `design-qa-evidence/compare-screen2-after-mobile.png`.
