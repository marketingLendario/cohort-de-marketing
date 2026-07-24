# GUIA CODEX — usar o cohort inteiro pelo Codex (ChatGPT), sem gambiarra

> **Estou perdido em:** "eu uso Codex, não Claude — as skills funcionam? por que a atualização levou 31 minutos?"
> **O que você vai ter no final:** o Codex rodando as MESMAS skills do curso (pelo espelho pronto do repositório), atualização em 30 segundos e as 3 diferenças práticas que importam.
> **Fontes cruzadas:** `AGENTS.md` + espelho `.agents/skills/` (código real do repo — o Codex é cidadão de primeira classe aqui) · caso real do PS de 21/07 (31 min de "atualização" + risco de gravar na pasta errada) · dica de aluno validada (importação de skills por projeto nas configurações do app).
> Guia **LEVE**: o grosso (instalar, clonar, `.env`) é igual pra todo mundo — só as diferenças vivem aqui.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🔑 Conta | Assinatura ChatGPT com Codex habilitado | `chatgpt.com` — o Codex vem com os planos pagos |
| 🧰 Ferramenta | Projeto clonado + terminal na raiz | [guia-git-clonar-e-atualizar](guia-git-clonar-e-atualizar.md) |

## Como as skills chegam no Codex (zero adaptação)

O repositório mantém **`.agents/skills/` como espelho literal** das skills canônicas (`.claude/skills/`). Isso significa:
1. `git pull` → o espelho vem junto → **o Codex já enxerga as skills**. Nada pra converter, importar ou adaptar.
2. Invocação: **`@nome`** (ex.: `@offerbook`, `@comecar`) — o `/` é do Claude, o `@` é do Codex; pedir por extenso ("roda o comecar") também funciona.
3. Alguns apps do Codex têm **importação de skills nas configurações — POR PROJETO/pasta aberta** (dica validada em PS). Se o seu tiver, é um reforço; o caminho garantido continua sendo o espelho do item 1.

## As 3 diferenças práticas (só isso muda)

| Tema | No Claude | No Codex |
|---|---|---|
| Invocar skill | `/nome` | `@nome` |
| Páginas `.html` geradas | costumam abrir sozinhas | abra na mão: dois cliques, ou `start "" caminho\arquivo.html` (Windows) |
| Onde as skills vivem | `.claude/skills/` | `.agents/skills/` (espelho — NUNCA edite/mova na mão) |

## Atualizar o projeto (a lição dos 31 minutos)

**É sempre `git pull`. Uma linha.** O caso real: pedir "atualiza as skills" fez a IA baixar e "adaptar" skill por skill — 31 minutos, resultado incerto, risco de gravar em pasta errada. Regra: atualização nunca é tarefa da IA — é do git ([guia-atualizar-projeto](guia-atualizar-projeto.md), erro U3/U4).

## Teste de sucesso

No Codex, aberto na raiz do projeto: digite `@` (ou `/`, conforme o app) + "funil" → as skills do cohort aparecem na lista. Rode `@comecar` → ele confere o ambiente e devolve UM próximo passo. Os dois verdes = Codex pronto.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| J1 | Skills não aparecem no `@` | app aberto fora da raiz do projeto | feche → abra NA pasta `cohort-de-marketing` → tente de novo |
| J2 | Pediu atualização e está rodando há **30 minutos** | a IA está "adaptando" skill por skill (o caminho errado) | interrompa e rode `git pull` no terminal — pronto |
| J3 | Skills gravadas/duplicadas em pasta estranha | alguém pediu pra "converter `.claude` pra `.codex`" na mão | apague a cópia manual; o espelho `.agents/skills/` oficial volta ao normal com `git pull` |
| J4 | O `.html` da skill "não abriu" | no Codex ele não abre sozinho (normal) | dois cliques no arquivo, ou `start "" caminho\arquivo.html` |
| J5 | Import de skills do app não acha nada | a importação é POR PROJETO/pasta aberta | abra o projeto certo no app e refaça; ou simplesmente confie no espelho (item 1 — não precisa importar) |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `@comecar` — a rede de segurança funciona igual no Codex |
| 📖 Ler | o resto do curso é idêntico: siga o [roteador de guias](../README.md) trocando `/skill` por `@skill` |
| 🚑 Se travar | o catálogo J1–J5 acima (skills sumidas, 31 minutos, html que não abre...) |
