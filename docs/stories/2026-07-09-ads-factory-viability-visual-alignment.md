# Story - Alinhamento visual da Tela 1 de Viabilidade

## Status

Concluída.

## Contexto

A Tela 1 já calcula e persiste Unit Economics e executa o Gate #1, mas sua
composição ainda usa cards genéricos e não acompanha o mock completo do Ads
Studio. Este corte alinha a superfície visual sem substituir as fórmulas
canônicas já testadas em `src/lib/ads-economics.ts`.

## Critérios de aceite

- [x] A Tela 1 usa os grupos editoriais Produto, Margem & verba, Retenção & valor
  e Incrementos do mock.
- [x] Campos monetários e percentuais usam wrappers, labels e tipografia do DS.
- [x] O painel de resultado destaca saúde, LTV:CAC, métricas e o estado do gate.
- [x] Os estados saudável, atenção e inviável são visualmente distintos.
- [x] Adicionar, editar e remover upsells continua funcional.
- [x] Salvar rascunho e avançar para o Funil continuam funcionais.
- [x] O motor econômico e o enforcement de `LTV:CAC < 1` não são alterados.
- [x] A tela não apresenta overflow horizontal em desktop ou mobile.
- [x] Typecheck, testes, lint e build passam.
- [x] A comparação visual desktop/mobile está registrada em `design-qa.md`.

## Fora de escopo

- Alterar fórmulas de CAC, LTV, Max CPA, Payback ou ROAS.
- Implementar novo schema de campanha ou de Unit Economics.
- Alinhar visualmente as Telas 2 e 3 neste corte.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/unit-economics-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-name.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/unit-economics-db.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/unit-economics-db.ts`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/stores/unit-economics-store.ts`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `apps/academia-lendaria-ads-studio/design-qa.md`
- `apps/academia-lendaria-ads-studio/design-qa-evidence/`
- `docs/stories/2026-07-09-ads-factory-viability-visual-alignment.md`

## Evidência de validação

- `npm run typecheck`: passou.
- `npm test`: 8 arquivos e 32 testes passaram.
- `npm run lint`: passou.
- `npm run build`: passou.
- Desktop 1024 x 576: sem overflow; comparação completa e focada registrada.
- Mobile 390 x 844: sem overflow; comparação pós-correção aprovada.
- Fluxos testados: save/reload, link direto, upsell, Gate #1 bloqueado e avanço
  válido para a Tela 2.
