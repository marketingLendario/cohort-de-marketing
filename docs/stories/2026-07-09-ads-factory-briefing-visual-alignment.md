# Story - Alinhamento visual da Tela 4 de Briefing

## Status

Done em 2026-07-09.

## Contexto

A Tela 4 já era funcional em modo demo, mas ainda usava cards e ações genéricas
que não correspondiam ao mock canônico do Ads Studio. Este corte aproxima a
implementação React da composição editorial definida em
`docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`, sem remover
persistência, geração de hooks ou navegação do wizard.

## Critérios de aceite

- [x] A Tela 4 usa a mesma estrutura de duas colunas e grupos editoriais do mock.
- [x] Títulos de grupo, campos, chips, hooks e ações usam os tokens e ícones do DS.
- [x] Os estados vazio, gerando, preenchido e aprovado seguem a linguagem visual
  do mock.
- [x] ICP e ângulos continuam editáveis; o tom de voz aparece como herança do
  brand-pack, conforme o mock.
- [x] Hooks continuam geráveis, editáveis, aprováveis, removíveis e adicionáveis.
- [x] O briefing é salvo automaticamente; voltar e avançar continuam funcionais.
- [x] A tela não apresenta overflow horizontal em desktop ou mobile.
- [x] Typecheck, testes, lint e build passam.
- [x] A comparação visual desktop/mobile está registrada em `design-qa.md`.

## Fora de escopo

- Implementar a Tela 5.
- Invocar uma skill real de geração de hooks.
- Alinhar visualmente as Telas 1, 2 e 3 neste mesmo corte.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/creative-brief-step.tsx`
- `apps/academia-lendaria-ads-studio/src/components/wizard/wizard-shell.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
- `apps/academia-lendaria-ads-studio/design-qa.md`
- `apps/academia-lendaria-ads-studio/design-qa-evidence/`
- `docs/stories/2026-07-09-ads-factory-briefing-visual-alignment.md`

## Evidência de validação

- `npm run typecheck` passou.
- `npm test -- --run` passou: 6 arquivos, 28 testes.
- `npm run lint` passou.
- `npm run build` passou.
- Comparação visual com `/Users/rafaelcosta/Downloads/Ads Studio.html` passou em
  desktop e mobile.
- Estados vazio, gerando, preenchido e aprovado verificados no navegador.
- Autosave verificado após reload.
- Console sem erros ou warnings.
