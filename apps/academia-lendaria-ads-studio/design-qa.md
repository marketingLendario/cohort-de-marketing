# Design QA - Ads Studio

## Tela 1 - Viabilidade

### Alvos da comparação

- Fonte visual: `/Users/rafaelcosta/Downloads/Ads Studio.html`.
- Implementação: `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/1`.
- Estado: tema escuro, produto `Mentoria Tráfego Lendário`, saúde verde e
  LTV:CAC 3,38.
- Desktop: viewport CSS 1024 x 576.
- Mobile: viewport CSS 390 x 844.
- Fonte desktop: `design-qa-evidence/source-screen1-desktop.png`.
- Fonte mobile: `design-qa-evidence/source-screen1-mobile.png`.
- Implementação desktop: `design-qa-evidence/app-screen1-after-desktop.png`.
- Implementação mobile: `design-qa-evidence/app-screen1-after-mobile.png`.
- Comparação desktop: `design-qa-evidence/compare-screen1-after-desktop.png`.
- Comparação mobile: `design-qa-evidence/compare-screen1-after-mobile.png`.
- Comparação focada do resultado:
  `design-qa-evidence/compare-screen1-result-focused.png`.

### Findings

Não restam diferenças P0, P1 ou P2 no escopo da Tela 1.

### Superfícies de fidelidade

- Fontes e tipografia: Newsreader, Hanken Grotesk e JetBrains Mono preservam a
  hierarquia, os pesos, o tracking e as quebras do mock.
- Espaçamento e layout: sidebar, page padding, grid 1,25:1, gap de 26px, grupos,
  painel sticky e células métricas acompanham a fonte. A proporção inicial
  invertida das colunas foi corrigida de 294/378px para 377/301px.
- Cores e tokens: fundo, cards, hairlines, ouro e estados verde/amarelo/vermelho
  usam os tokens locais do design system Lendár[IA].
- Imagens e assets: a Tela 1 não contém imagens raster. Ícones usam a biblioteca
  Iconoir da fonte; não há SVG ou CSS art substituindo assets.
- Copy e conteúdo: títulos, labels, CTA, gate e nota do Monitor correspondem à
  fonte. `Recompras na vida útil` permanece propositalmente em vezes porque essa
  é a unidade do motor econômico canônico.
- Responsividade: desktop sem overflow; mobile 390 x 844 sem overflow horizontal,
  com campos, resultado e ações empilhados e utilizáveis.
- Acessibilidade: campos possuem labels/nomes acessíveis, ações de ícone têm
  nome e tooltip, gate bloqueado expõe botão desabilitado e o erro usa `role=alert`.

### Estados e interações

- Upsell adicionado e editado; foco permaneceu estável durante edição do nome.
- Nome do produto e upsell sobreviveram a save + reload.
- Link direto do wizard reconstruiu sessão e spoke ativo depois de reload.
- Gate vermelho testado com LTV:CAC 0,06: avanço desabilitado.
- Gate verde testado com LTV:CAC 3,38: avanço para `/2` concluído.
- Console verificado sem erros ou warnings depois da correção visual final.

### Histórico da comparação

#### Passo 1 - bloqueado

- P1: Tela 1 usava cards genéricos e não a composição editorial do mock.
- P2: painel de resultado, métricas, gate e nota do Monitor divergiam da fonte.
- P2: coluna de resultado ficou mais larga que o formulário.
- P2: fluxo direto por URL não reconstruía o spoke e não salvava.

#### Correções aplicadas

- Formulário refeito nos quatro grupos editoriais da fonte.
- Painel de resultado, três estados de saúde, métricas e gate implementados.
- Colunas alinhadas para 377/301px no viewport de referência.
- Persistência de nome/upsell adicionada; campanha demo ausente é retomada.
- Rota do wizard passou a reconstruir autenticação e spokes após reload.

#### Passo 2 - bloqueado

- Desktop aprovado na comparação completa e focada.
- Mobile sem overflow e com estrutura aprovada.
- Restou P2 no estado ativo do stepper mobile.

#### Passo 3 - aprovado

- Estado ativo do stepper corrigido para preenchimento dourado e caixa normal.
- Evidência pós-correção: `design-qa-evidence/compare-screen1-after-mobile.png`.
- Viewport CSS 390 x 844, sem overflow horizontal e sem erros no console.
- Nenhuma diferença acionável P0/P1/P2 permaneceu.

### Follow-up polish

- P3 aceito: o seletor Desktop/Mobile e a moldura de telefone pertencem ao
  ambiente de preview do mock, não à interface do produto.
- P3 aceito: Max CPA e Payback diferem na captura focada porque o mock estava com
  margem 75% e a captura automatizada do app permaneceu em 0%; o motor e a
  apresentação das células não foram alterados para falsificar essa métrica.

## Tela 2 - Seleção de funil

### Alvos da comparação

- Fonte visual: `/Users/rafaelcosta/Downloads/Ads Studio.html`.
- Implementação: `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/2`.
- Estado: tema escuro, ticket herdado de R$ 650,59, público frio, produto e
  backend validados, recomendação Funil R$1 com 82% de confiança.
- Desktop: viewport CSS 1024 x 576.
- Mobile: viewport CSS 390 x 844.
- Fonte desktop: `design-qa-evidence/source-screen2-desktop.png`.
- Fonte mobile: `design-qa-evidence/source-screen2-mobile.png`.
- Implementação desktop: `design-qa-evidence/app-screen2-after-desktop.png`.
- Implementação mobile: `design-qa-evidence/app-screen2-after-mobile.png`.
- Comparação desktop: `design-qa-evidence/compare-screen2-after-desktop.png`.
- Comparação mobile: `design-qa-evidence/compare-screen2-after-mobile.png`.

### Findings

Não restam diferenças P0, P1 ou P2 no escopo da Tela 2.

### Superfícies de fidelidade

- Hierarquia: recomendação, racional, confiança e CTA seguem a composição
  horizontal da fonte no desktop e o empilhamento original no mobile.
- Contexto: ticket bloqueado, temperaturas e respostas binárias usam os mesmos
  labels, estados e controles segmentados do mock.
- Cards: Tráfego Direto, Funil R$1, Aula no Zoom e Lead Magnet reproduzem ordem,
  métricas, copy, recomendação e seleção da referência.
- Espaçamento e layout: painel principal, coluna de contexto e grid 2 x 2 têm as
  mesmas proporções e alturas visuais da fonte; no mobile viram uma coluna.
- Cores e tokens: fundo, hairlines, ouro, azul de confiança e verde de etapa
  concluída usam o design system local e foram comparados lado a lado.
- Responsividade: desktop e mobile não apresentam overflow horizontal; os textos
  e controles preservam a legibilidade e não redimensionam o layout.
- Acessibilidade: cards e segmentos são botões semânticos com `aria-pressed`, o
  racional usa disclosure e as regiões possuem nomes acessíveis.

### Estados e interações

- O racional abre e fecha sem deslocamento incoerente da composição.
- O contexto morno recalculou a recomendação para Lead Magnet com 64%.
- O contexto frio restaurou Funil R$1 com 82%.
- A escolha manual de Tráfego Direto registrou e exibiu o override.
- `Usar recomendado` removeu o override e restaurou Funil R$1.
- A escolha manual sobreviveu ao avanço para `/3` e ao retorno para `/2`.
- A recomendação restaurada também sobreviveu ao avanço e ao reload.
- Console verificado sem erros durante a rodada visual final.

### Histórico da comparação

#### Passo 1 - bloqueado

- P1: cards genéricos e auto-fit não reproduziam a composição 2 x 2.
- P2: o contexto exibia tipo de produto ausente na fonte.
- P2: o ticket mostrava preço-base, não o AOV canônico da viabilidade.
- P2: recomendação, confiança e ações tinham hierarquia e dimensões divergentes.

#### Correções aplicadas

- Composição refeita com classes dedicadas, grid fixo e breakpoints do produto.
- Ticket passou a consumir o AOV canônico calculado pela Tela 1.
- Copy e métricas foram alinhadas ao documento-fonte.
- Estados recomendado, selecionado, override e disclosure foram materializados.
- Navegação mobile recebeu estados atual e concluído equivalentes à referência.

#### Passo 2 - aprovado

- Comparações desktop e mobile julgadas lado a lado no mesmo estado e viewport.
- Seleção, override, recomendação dinâmica, persistência e avanço aprovados.
- `typecheck`, 32 testes, lint e build passaram.
- Nenhuma diferença acionável P0/P1/P2 permaneceu.

### Follow-up polish

- P3 aceito: os controles Desktop/Mobile e a moldura de telefone pertencem ao
  ambiente de preview do mock, não à interface do produto.
- P3 aceito: a conta do mock não contém o sufixo `Demo`; a aplicação mantém o
  identificador explícito por fazer parte do modo local de autenticação.

## Tela 3 - Estrutura da campanha

### Alvos da comparação

- Fonte visual: `/Users/rafaelcosta/Downloads/Ads Studio.html`.
- Implementação: `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/3`.
- Estado: tema escuro, objetivo Teste, budget total R$ 20.000, budget diário
  R$ 670, CBO, três adsets e quatro slots vazios.
- Fonte desktop: `design-qa-evidence/source-screen3-final-desktop.png`.
- Fonte mobile: `design-qa-evidence/source-screen3-final-mobile.png`.
- Implementação desktop: `design-qa-evidence/app-screen3-after-desktop.png`.
- Implementação mobile: `design-qa-evidence/app-screen3-after-mobile.png`.
- Comparação desktop: `design-qa-evidence/compare-screen3-after-desktop.png`.
- Comparação mobile: `design-qa-evidence/compare-screen3-after-mobile.png`.

### Findings

Não restam diferenças P0, P1 ou P2 no escopo da Tela 3.

### Superfícies de fidelidade

- Configuração: objetivo, budgets e CBO/ABO seguem dimensões, rótulos e estados
  segmentados da fonte.
- Hierarquia: campanha, adsets, slots e ações usam a mesma composição compacta,
  ícones Iconoir, hairlines, tipografia mono e recuos da árvore original.
- Proporções: árvore e resumo dividem o desktop em colunas equivalentes, como no
  mock, e viram uma coluna em larguras menores.
- Dados: a apresentação compacta usa `Mentoria Tráfego`, derivado do nome real da
  campanha, sem alterar os nomes canônicos persistidos pelo modelo.
- Resumo: adsets, ads, slots vazios, budget e nota da Fábrica de criativos
  reproduzem a fonte.
- Responsividade: desktop com 1012 px e mobile com 300 px não apresentam overflow
  horizontal; números e labels permanecem legíveis.
- Acessibilidade: segmentos expõem `aria-pressed`, adsets usam disclosure
  semântico e a reordenação também funciona pelas setas do teclado.

### Estados e interações

- Objetivo, budgets, CBO/ABO e audiência foram alterados no navegador.
- Recolher/expandir, adicionar ad, adicionar/remover adset e reordenar funcionaram.
- Alteração salva sobreviveu ao reload; o estado-base foi restaurado e salvo.
- `Avançar para Briefing` persistiu a estrutura e navegou para `/4`.
- Typecheck, 32 testes, lint e build passaram.

### Histórico da comparação

#### Passo 1 - bloqueado

- P1: um card genérico com o título `Configuração da estrutura` deslocava a tela.
- P1: árvore e adsets usavam cards, inputs e botões de texto divergentes da fonte.
- P2: budgets eram cortados no mobile e os nomes canônicos longos dominavam os nós.
- P2: árvore e resumo tinham proporções diferentes das colunas do mock.

#### Correções aplicadas

- Componente refeito com configuração compacta, árvore hierárquica e resumo fiel.
- Detalhes editáveis passaram a se comportar visualmente como texto secundário.
- Steppers nativos foram removidos e os budgets passaram a caber no mobile.
- O nome real da campanha ganhou uma apresentação compacta sem mudar o modelo.
- A grade desktop passou a usar duas colunas equivalentes.

#### Passo 2 - aprovado

- Referência e implementação foram julgadas lado a lado no mesmo estado.
- Nenhuma diferença acionável P0/P1/P2 permaneceu.

### Follow-up polish

- P3 aceito: o seletor Desktop/Mobile e a moldura de telefone pertencem ao
  ambiente de preview do mock, não à interface do produto.
- P3 aceito: a conta da aplicação mantém o sufixo `Demo`, próprio do login local.

## Tela 4 - Briefing

- Fonte: `/Users/rafaelcosta/Downloads/Ads Studio.html`.
- Implementação: `http://127.0.0.1:5177/campaigns/design-qa-briefing/4`.
- Evidências: `design-qa-evidence/compare-desktop-final.png` e
  `design-qa-evidence/compare-mobile-final.png`.
- Não restam diferenças P0/P1/P2. Grupos, chips, hooks, skeletons, autosave,
  navegação e estados foram comparados e aprovados na rodada anterior.

## Tela 5 - Fábrica de criativos

- Fonte: `/Users/rafaelcosta/Downloads/Ads Studio.html`.
- Implementação: `http://127.0.0.1:5177/campaigns/design-qa-operations/5`.
- Evidências desktop: `design-qa-evidence/source-screen5-desktop-final.png`,
  `design-qa-evidence/app-screen5-desktop-final.png` e
  `design-qa-evidence/compare-screen5-desktop-final.png`.
- Evidências mobile: `design-qa-evidence/source-screen5-mobile-final.png`,
  `design-qa-evidence/app-screen5-mobile-final.png` e
  `design-qa-evidence/compare-screen5-mobile-final.png`.
- Configuração, resumo, geração assíncrona, galeria, aprovação, descarte,
  regeneração e encaixe nos seis slots foram exercitados no navegador.
- Os 15 bitmaps usados são os ativos reais embutidos na referência fornecida.
- Não restam diferenças P0, P1 ou P2.

## Tela 6 - Auditoria de tracking

- Implementação: `http://127.0.0.1:5177/campaigns/design-qa-operations/6`.
- Evidências: `design-qa-evidence/compare-screen6-desktop-final.png` e
  `design-qa-evidence/compare-screen6-mobile-final.png`.
- Os estados aguardando, executando, bloqueado e aprovado foram exercitados.
- O gate bloqueou Purchase quebrado e liberou a publicação com EMQ 7,8.
- Layout em duas colunas no desktop e fluxo empilhado no mobile reproduzem a
  referência sem overflow horizontal.
- Não restam diferenças P0, P1 ou P2.

## Tela 7 - Revisão e publicação

- Implementação funcional:
  `http://127.0.0.1:5177/campaigns/demo-campaign-1783610736025/7`.
- Evidências: `design-qa-evidence/compare-screen7-desktop-final.png` e
  `design-qa-evidence/compare-screen7-mobile-final.png`.
- Checklist, bloqueio por gates, publicação pausada, sucesso, falha parcial com
  retry e adapter indisponível foram exercitados ponta a ponta.
- O estado de comparação visual usa gates pendentes nos dois lados; os seeds de
  dados diferem por campanha sem alterar a composição.
- Não restam diferenças P0, P1 ou P2.

## Tela 8 - Monitoramento

- Implementação: `http://127.0.0.1:5177/campaigns/design-qa-monitor/8`.
- Evidências: `design-qa-evidence/compare-screen8-desktop-final.png` e
  `design-qa-evidence/compare-screen8-mobile-final.png`.
- KPIs, pausa/retomada, decision log, aprovação humana e scale readiness foram
  exercitados no navegador e persistiram por campanha.
- O CPA passou a quebrar em duas linhas como na referência, sem truncamento.
- Não restam diferenças P0, P1 ou P2.

## Fechamento das telas 5 a 8

- Comparações consolidadas:
  `design-qa-evidence/compare-screens5-8-desktop-final.png` e
  `design-qa-evidence/compare-screens5-8-mobile-final.png`.
- `typecheck`, 36 testes, lint e build passaram.
- P3 aceito: seletor Desktop/Mobile e moldura de telefone pertencem ao preview
  do mock; a aplicação mantém o browser real e o sufixo `Demo` da conta local.

final result: passed
