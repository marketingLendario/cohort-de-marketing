# GUIA — Atualizar o projeto e as skills (Claude Code e Codex)

> **Estou perdido em:** "saiu atualização e não sei puxar" / "mandei atualizar e está rodando há 30 minutos" / "uso Codex e as skills somem ou vão pra pasta errada".
> **O que você vai ter no final:** projeto e skills atualizados em ~30 segundos (`git pull` + reabrir a IA) — com o teste que PROVA que funcionou.
> **Fontes cruzadas:** `AGENTS.md` + espelho `.agents/skills/` (código real do repo) · caso real do PS de 21/07 (31 min de "atualização" no Codex) · documentação oficial do git (`pull`/`stash`).

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | O projeto `cohort-de-marketing` já está clonado no seu computador | siga o [guia-git-clonar-e-atualizar.md](guia-git-clonar-e-atualizar.md) |
| 🧰 Ferramenta | Você sabe abrir o terminal NA pasta do projeto | leia o [guia-terminal-e-pastas.md](guia-terminal-e-pastas.md) (ou rode `/comecar`) |
| 📖 Conhecimento | Nenhum — os comandos estão prontos pra copiar | — |

## O jeito certo (30 segundos, não 30 minutos)

1. Feche a conversa atual (o progresso está nos arquivos, não no chat — não se perde nada).
2. No terminal, na pasta raiz do `cohort-de-marketing`:
   ```
   git pull
   ```
3. Reabra o `claude` (ou `codex`). Pronto — skills e materiais atualizados.

Dentro do chat também funciona, desde que você seja LITERAL: peça **"faça um git pull"**. 

## O jeito ERRADO (é isso que trava por 30 minutos)

Pedir "atualiza as skills do projeto" sem citar git. A IA pode decidir comparar skill por skill, baixar uma a uma e "adaptar" — meia hora depois, nada garantido. **Atualização é sempre `git pull`. Uma linha.**

## Codex: as skills sem gambiarra

O problema clássico: pedir pra IA "adaptar o que tiver `.claude` para `.codex`" — ela grava em pasta errada e depois não acha.

O jeito certo, sem adaptação manual:
1. Este repositório já mantém `.agents/skills/` como **espelho pronto para o Codex** — depois do `git pull`, o Codex já enxerga as skills. Não precisa converter nada.
2. Alguns apps do Codex têm importação de skills nas configurações (por projeto/pasta aberta) — se o seu tiver, funciona também. Mas o caminho **garantido** é o do item 1: o espelho `.agents/skills/` já vem pronto no `git pull`, sem importar nada.
3. Conferir que funcionou: digite `/` (ou `@`) + "funil" → as skills aparecem na lista.

## Teste de sucesso

1. O `git pull` termina com **`Already up to date.`** (já estava em dia) ou com a **lista de arquivos atualizados** — qualquer um dos dois é sucesso; mensagem de erro em vermelho não é (veja U2).
2. Reabra a IA e digite `/` + "funil" → as skills aparecem na lista. Apareceram = atualização completa.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| U1 | Skills não aparecem depois de atualizar | a IA foi aberta fora da raiz do projeto | feche → `cd` até a pasta `cohort-de-marketing` → reabra → `/` + "funil" pra conferir |
| U2 | `git pull` reclama **"changes would be overwritten"** | você editou um arquivo do material do curso | rode `git stash`, depois `git pull` (seu trabalho em `projetos/` está fora do git — nunca é tocado) |
| U3 | Pediu "atualiza as skills" e a IA está há 30 min baixando/adaptando (caso real de PS) | sem citar git, a IA inventa um caminho manual | interrompa (Esc) e seja literal: **"faça um git pull"** — atualização é sempre uma linha |
| U4 | No Codex, as skills "somem" ou vão pra pasta errada | alguém pediu pra "adaptar `.claude` para `.codex`" na mão | não adapte nada: o espelho `.agents/skills/` já vem pronto no `git pull`; confira com `/` (ou `@`) + "funil" |
| U5 | `git pull` diz `Already up to date.` mas você esperava novidade | você já está em dia — ou o terminal está em OUTRA pasta | confira que o caminho no prompt termina em `cohort-de-marketing`; estando certo, está tudo atualizado mesmo |

> Qualquer outra coisa → rode `/comecar`: ele reconfere o ambiente inteiro e devolve UM próximo passo. Se nem ele resolver: print + "estou preso atualizando o projeto, pesquise" na conversa.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | reabra o `claude` (ou `codex`) e rode `/status-funil` — ele mostra onde você parou e o próximo passo do SEU funil |
| 📖 Ler | continue de onde estava; não sabe onde estava? o [roteador de guias](../README.md) acha pelo seu problema |
| 🚑 Se travar | o catálogo U1–U5 acima (skills sumidas, conflito no pull, IA "adaptando" há 30 min...) |
