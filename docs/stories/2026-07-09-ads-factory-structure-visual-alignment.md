# Story - Alinhamento visual da Tela 3 de Estrutura

## Status

Concluída.

## Contexto

A Tela 3 já possui o builder funcional de campanha, persistência local e avanço
para o Briefing. Este corte alinha a apresentação ao mock completo do Ads Studio,
preservando o modelo de estrutura e as operações já entregues.

## Critérios de aceite

- [x] Objetivo, orçamento e distribuição reproduzem a barra de configuração da referência.
- [x] A árvore campanha -> adsets -> ads segue a hierarquia compacta do mock.
- [x] Os três adsets iniciais e quatro slots vazios aparecem com os detalhes da estrutura.
- [x] Objetivo, orçamento, CBO/ABO e público de cada adset continuam editáveis.
- [x] Recolher, adicionar, remover e reordenar adsets, além de adicionar ads, continuam funcionais.
- [x] Salvar, retomar e avançar para `/4` continuam funcionais.
- [x] O modelo e as regras de resumo da estrutura não são alterados.
- [x] A tela não apresenta overflow horizontal em desktop ou mobile.
- [x] Typecheck, testes, lint e build passam.
- [x] A comparação visual desktop/mobile está registrada em `design-qa.md`.

## Fora de escopo

- Implementar drag-and-drop real com `@dnd-kit`.
- Persistir a estrutura no Supabase.
- Alterar o motor de recomendação de funil ou a geração de criativos.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/campaign-structure-step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `apps/academia-lendaria-ads-studio/design-qa.md`
- `apps/academia-lendaria-ads-studio/design-qa-evidence/`
- `docs/stories/2026-07-09-ads-factory-structure-visual-alignment.md`

## Evidência de validação

- `npm run typecheck`: passou.
- `npm test -- --run`: 8 arquivos e 32 testes passaram.
- `npm run lint`: passou.
- `npm run build`: passou.
- Browser desktop 1012 px e mobile 300 px: `scrollWidth === clientWidth`.
- Objetivo, budgets, CBO/ABO, público, colapso, ad, adset, remoção e reordenação
  foram exercitados no navegador.
- Persistência após reload e avanço para `/4` foram verificados no navegador.
- Comparações finais: `design-qa-evidence/compare-screen3-after-desktop.png` e
  `design-qa-evidence/compare-screen3-after-mobile.png`.
