# Planos de Implementacao

Este diretorio contem o plano publico da rodada `improve` de 2026-07-12, escrito contra `d831ea3`. Ele ocupa a posicao global 004 porque os planos 001-003, 005-006 pertencem ao repositorio privado `rafaelscosta/academia-lendaria-ads-studio`.

## Ordem e status

| Plano | Titulo | Prioridade | Esforco | Depende de | Status |
|---|---|---|---|---|---|
| 004 | Fechar o adapter Meta publico em read-only | P1 | M | - | DONE |

Status: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: <motivo>` ou `REJECTED: <motivo>`.

## Dependencias

- O plano 004 e independente e pode rodar em paralelo com os planos privados 001-003.
- A validacao final integrada deve executar o plano 004 antes do quality gate privado 006 ser considerado encerramento da rodada completa.

## Achados considerados e nao planejados aqui

- Drift entre `briefing.html` raiz e `aula-03/materiais/briefing.html`: valido, adiado por nao estar na selecao 1-6.
- README publico com paths e versao antigos: valido, adiado para a rodada de documentacao.
- Gate de release integral ainda residente no upstream privado: direcao recomendada, nao selecionada nesta rodada.
