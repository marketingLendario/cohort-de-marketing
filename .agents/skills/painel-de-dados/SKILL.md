---
name: painel-de-dados
description: Etapa 3 do Squad de Dados (Aula 4) — renderiza a Central de Dados. Gera o painel-trafego.html self-contained (abre offline) na identidade da marca, com 7 telas interativas (Visão geral com filtro de mês, Séries no tempo, Campanhas ordenáveis com detalhe e associação de produtos, Vendas & atribuição com filtros, Audiência com pirâmide etária e mapa geográfico do Brasil, Engajamento com posts ordenáveis e "Quem é o meu cliente", Board de especialistas), mais o PDF e o registro no Book do Funil. Use quando o aluno pedir para gerar/regenerar/abrir o painel, aplicar edições de config (renomes, associações), ou exportar o PDF.
---

# Painel de Dados — Squad de Dados Lendár[IA] (etapa 3)

Você materializa a Central de Dados: `bundle.json` + `board.json` → painel navegável na identidade da marca. Pré-requisitos: bundle (do `/coletor-de-dados`) e board (do `/board-de-especialistas`); sem eles, rode as etapas anteriores (ou o hub `/analista-de-dados`).

## Render

```bash
node scripts/painel-trafego-render.mjs \
  --dados=projetos/{slug}/dados-trafego/bundle.json \
  --board=projetos/{slug}/dados-trafego/board.json \
  --tokens=projetos/{slug}/tokens.json \
  --projeto="<Nome da marca>" \
  --saida=projetos/{slug}/painel-trafego.html
```

Sem `tokens.json` (identidade da marca), rode `/design-md` antes — **nunca** um tema genérico.

## O que o painel entrega (para você apresentar certo)

- **Interatividade:** filtros com caixa de seleção + "Selecionar todos" (campanhas no funil, produtos e período nas vendas, etapas do funil, mês na visão geral), tabelas ordenáveis por qualquer coluna (campanhas com data de início; posts do engajamento), cards flutuantes em todos os gráficos (crosshair na série; KPIs mostram o absoluto do período anterior no hover).
- **Honestidades embutidas:** funil = eventos independentes do pixel (não aninhado — "carrinho" pode ser menor que "checkout"; % sobre o topo, ⚠ quando inverte); taxas de trimestre derivadas de somas Real = **Calculado**; heatmap com máscara de amostra (<500 impr) e "melhores janelas"; teto de ROAS ≠ ROAS da Meta; pirâmide etária avisa que "65+" é bucket aberto.
- **Edições do aluno:** ✎ Editar → renomear campanha, associar produtos (menu multi-seleção com todos marcados por proposta; comita ao recolher) → "Salvar config"/"Copiar p/ chat" → o `/coletor-de-dados` regrava o `painel-config.json` e você regenera.

## Entrega (regra `_shared/entrega-padrao.md`)

1. Abra o `.html` (detecte o SO: Linux `xdg-open`, macOS `open`, Windows `start ""` — **nunca assuma macOS**).
2. PDF: `bash .claude/skills/painel-de-dados/scripts/gerar_pdf.sh projetos/{slug}/painel-trafego.html`.
3. Registre o card **"Painel de Tráfego"** no Book do Funil (`_shared/book-do-funil.md`) com os botões "← Voltar"/"← Book do Funil".
4. Aponte **UM** próximo passo (em geral: `/retroalimentacao` ou `/gestor-de-campanhas`).

## Não fazer

- Não renderizar sem board (a aba de especialistas ficaria vazia) — rode o `/board-de-especialistas` antes.
- Não editar o bundle na mão para "melhorar" número — o painel é espelho do dado, com selos.
- Não usar tema genérico.

---

*Squad de Dados Lendár[IA] · Aula 4 · Academia Lendária. Render: `scripts/painel-trafego-render.mjs` (self-contained; mapa do Brasil embutido da malha IBGE).*
