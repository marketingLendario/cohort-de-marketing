# Story - Alinhamento visual do shell do Ads Studio

## Status

Done em 2026-07-09.

## Contexto

O mock canônico `docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`
e o HTML anexado pelo usuário definem o Ads Studio como um app-shell completo:
topbar com marca, conta/spoke, navegação lateral do wizard e progresso mobile.

A implementação React estava renderizando as telas dentro de um `main` simples,
sem o header e sem o mapa visual de passos. Este corte aproxima o produto real
da estrutura do mock antes de continuar a Tela 5.

## Critérios de aceite

- [x] O wizard usa topbar com lockup `Lendár[IA]`, identificação do Ads Studio e conta/spoke.
- [x] O wizard usa stepper desktop de 8 passos com estados atual, concluído, próximo e bloqueado.
- [x] O wizard usa progresso horizontal mobile com os mesmos 8 passos.
- [x] O cabeçalho de cada passo segue a hierarquia do mock: eyebrow mono + título serif com acento dourado.
- [x] O conteúdo funcional das Telas 1-4 continua renderizando sem regressão.
- [x] A rota atual `/campaigns/:campaignId/4` não mostra mais o header simples antigo.
- [x] Typecheck, testes, lint e build passam.
- [x] Browser local confirma header/stepper e ausência de overflow desktop/mobile.

## Fora de escopo

- Recriar todos os layouts internos de cada tela pixel a pixel.
- Implementar a Tela 5 de Fábrica de Criativos.
- Importar o HTML standalone como iframe.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/wizard-shell.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`

## Evidência de validação

- `npm run typecheck` passou.
- `npm test` passou: 6 arquivos, 28 testes.
- `npm run lint` passou.
- `npm run build` passou.
- Browser local verificado em `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/4`.
- Desktop: topbar, `Ads Studio`, stepper de 8 passos, estado atual `Briefing`, próximo `Criativos` e header antigo removido.
- Mobile: progresso horizontal visível, stepper lateral oculto e zero overflow horizontal.
