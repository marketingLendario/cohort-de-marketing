# GUIA CENTRAL DE DADOS — rodar a Aula 4 no SEU projeto (com ou sem dados próprios)

> **Estou perdido em:** "vi o painel rodando na conta do professor… mas como eu rodo no MEU projeto? E se eu não tenho 30 dias de dados?"
> **O que você vai ter no final:** o `/analista-de-dados` rodado no seu projeto — no modo certo pra sua situação — com o `painel-trafego.html` aberto, o board de especialistas lido e a retroalimentação devolvendo aprendizado pro seu avatar e copy.
> **Fontes cruzadas:** `aula-04/docs/fluxo-da-aula-04.md` + `regras-de-dados.md` (repo) · SKILL.md do squad de dados: `/analista-de-dados`, `/coletor-de-dados`, `/board-de-especialistas`, `/painel-de-dados`, `/retroalimentacao`, `/gestor-de-campanhas` (código real) · limitação REAL registrada no PS (sem filtro por projeto — B3) · o critério dos 30 dias dito em aula.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | O que o painel coleta (e o que NÃO) | leia [guia-o-que-e-coletado.md](guia-o-que-e-coletado.md) (5 min) |
| 🔑 Chave | *(SÓ pro Modo API)* `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` no `.env` | [guia-meta-api](../03-conexoes-e-apis/guia-meta-api.md); **sem chaves o Modo Exemplo roda mesmo assim** |
| 🔑 Chave | *(Opcional)* Hotmart conectada — liga a seção de Vendas/caixa | [guia-hotmart](../03-conexoes-e-apis/guia-hotmart.md) |
| 📄 Artefato | *(Pra dados que valham DECISÃO)* campanha própria com histórico | ainda sem? leia "E se eu não tenho 30 dias?" abaixo — dá pra rodar HOJE mesmo assim |

## Passo 1 — Escolha o modo (a decisão honesta)

| Modo | Precisa | O que sai |
|---|---|---|
| **API** | chaves no `.env` | os números da SUA conta, com selo Real/Estimado |
| **Exemplo** | nada | dados FICTÍCIOS de demonstração — perfeito pra aprender a ferramenta, **inútil pra decidir** |

Regra de honestidade (a lição da própria aula): Modo Exemplo é treino ROTULADO — nunca trate número de exemplo como se fosse seu.

## Passo 2 — Rode o hub

```
/analista-de-dados
```
Ele confere modo/chaves (delegando ao `/zelador`) e orquestra as etapas em sequência — cada uma também roda sozinha:

| Etapa | Skill | O que faz |
|---|---|---|
| 1 | `/coletor-de-dados` | coleta Meta (+Hotmart se conectada) num bundle sem dado pessoal |
| 2 | `/board-de-especialistas` | 6 "clones" (verba, séries, criativo, conversão, audiência, comunidade) — cada um entrega 1 veredito + 1 alavanca + 1 evidência COM selo |
| 3 | `/painel-de-dados` | gera o `projetos/{slug}/painel-trafego.html` (abre offline, identidade do seu DESIGN.md, imprime em PDF) |
| 4 | `/retroalimentacao` | devolve o que os dados ensinaram pro `avatar.md` e pra copy — o loop fecha |
| 5 | `/gestor-de-campanhas` | compara o realizado (7/30 dias) com o que você planejou no PAINEL-DA-SEMANA |

O fecho é sempre o gate **VOCÊ REVISA**: o board recomenda, você decide.

## Passo 3 — Abra e leia o painel

Abra `projetos/{slug}/painel-trafego.html` (dois cliques; Windows: `start "" projetos\{slug}\painel-trafego.html`). Leia com as 3 regras de confiança do [guia-o-que-e-coletado](guia-o-que-e-coletado.md): selo em tudo; "não fornecido" ≠ zero; ROAS só vira Real no caixa.

## E se eu NÃO tenho 30 dias de dados? (a pergunta da turma inteira)

Os 3 caminhos honestos, do imediato ao completo:
1. **Hoje, sem nada:** rode em **Modo Exemplo** e aprenda a ferramenta (onde fica cada aba, o que o board entrega). Custo zero, expectativa rotulada.
2. **Com a primeira campanha do método:** 7 dias de R$30/dia JÁ geram sinal — o painel roda com o que houver. Só respeite o limiar: com <10 conversões, nenhuma conclusão de CPA vale ([guia-e-depois](../04-operacao/guia-e-depois.md)); use pra ver o CICLO funcionando, não pra veredito.
3. **O quadro completo:** 30 dias de histórico é o critério dito em aula pra análise robusta — chega sozinho se você mantiver o ciclo semanal rodando. A Central é mensal por natureza: rode de novo a cada ciclo.

## Teste de sucesso

`projetos/{slug}/painel-trafego.html` existe e abre no navegador com o SEU nome de projeto e as cores do seu DESIGN.md; e `node scripts/painel-trafego-data.mjs --account` responde com o modo que você ESCOLHEU (`"api"` ou `"exemplo"` — o susto é quando vem "exemplo" sem querer, erro CD1).

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| CD1 | Queria Modo API e veio **"modo": "exemplo"** | falta `META_AD_ACCOUNT_ID` (ou token) no `.env` | é o erro E13 do [guia-meta-api](../03-conexoes-e-apis/guia-meta-api.md): preencha os IDs (passo 8 de lá) e rode de novo |
| CD2 | O painel **mistura campanhas** que não são deste projeto (conta compartilhada/cliente) | ⚠️ limitação CONHECIDA desta versão: a coleta é da CONTA inteira, sem filtro por projeto (registrada no PS; correção é dos donos da Aula 4) | contorno: nomeie SUAS campanhas com marca+data (`[MARCA] ... 2026-07`) e leia o painel filtrando pelo nome no olho; não tire conclusão de agregados que misturam projetos |
| CD3 | Aba de engajamento/orgânico **"em breve"** | falta o token de página/IG (opcional) | quiser: [guia-organico-tokens](../03-conexoes-e-apis/guia-organico-tokens.md); sem ele o resto do painel funciona 100% |
| CD4 | Painel **sem seção de Vendas** | Hotmart não conectada | [guia-hotmart](../03-conexoes-e-apis/guia-hotmart.md); sem ela o ROAS fica todo Estimado (atribuição) |
| CD5 | Números do painel **≠ Gerenciador** | período diferente, atribuição da Meta, fuso — e atribuição ERRA mesmo | iguale o período antes de comparar; lembre: Gerenciador = atribuição (Estimado), caixa = Hotmart (G2 do [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md)) |
| CD6 | Mudou campanha/oferta **no meio do ciclo** e a análise ficou sem pé nem cabeça | mudança no meio quebra a comparabilidade (resposta honesta dada em aula) | feche ciclos de 7 dias sem mexer ([guia-e-depois](../04-operacao/guia-e-depois.md)); registre TODA mudança no PAINEL-DA-SEMANA — o histórico explica os saltos |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/analista-de-dados` AGORA no modo que a sua situação permite — Exemplo já ensina a ferramenta |
| 📖 Ler | [guia-como-ler-os-numeros.md](guia-como-ler-os-numeros.md) (a árvore de decisão das métricas) |
| 🚑 Se travar | o catálogo CD1–CD6 acima (modo exemplo sem querer, campanhas misturadas, abas vazias...) |
