# Evidência — STORY-17.W2.1

## Escopo e baseline

- Baseline integrada: `d0bc5ed1aff114d616402e98b7ec17e25b7c2309`.
- Dependência: `17.W1.2` em `Done`, fornecendo `WeeklyLedger v1` consultável.
- PR coverage: `gh pr list --repo marketingLendario/cohort-de-marketing --state open` retornou lista vazia em 2026-07-15.
- Fronteira: arquivos públicos locais; nenhum acesso a Studio, projeto privado, API, credencial ou artefato bruto.

## TDD e commits

| Marco | Commit | Evidência |
|---|---|---|
| Contrato da W2 | `9e9fa73` | W2.1/W2.3 `Ready`, W2.2 bloqueada, allow-lists e gates explícitos. |
| RED | `bcc67c9` | 8/8 testes falharam antes do reader existir. |
| GREEN | `d3b7842` | Reader fail-closed e modo histórico nos dois mirrors. |

## Contrato observado

- Entrada validada por `weekly-ledger.v1.schema.json` com AJV 2020-12 e formatos.
- Validação semântica exige contrato/versão/hash, entradas estritamente ordenadas, identidade única, métricas únicas por entrada e índice exatamente derivável.
- Seleção exige `projectId` e `campaignId` explícitos; `weekStart` é opcional e nunca escolhe projeto/campanha por heurística.
- Saída preserva valor/ausência, selo, fontes, premissas, janela, confirmações, revisão, painel e hash.
- Séries separam índices `Real`, `Estimado` e `nao_fornecido`; o reader não contém delta, média, taxa ou tendência.
- Erros públicos são apenas códigos fechados e não ecoam conteúdo, seleção, token ou valor do ledger.

## Validações executadas

```text
node --test scripts/read-aula-04-history.test.mjs
8 tests, 8 pass, 0 fail

node --test scripts/read-aula-04-history.test.mjs scripts/build-weekly-ledger.test.mjs scripts/validate-aula-04-contracts.test.mjs
37 tests, 37 pass, 0 fail

node --test scripts/*.test.mjs
76 tests, 76 pass, 0 fail

cmp -s .claude/skills/leitor-de-metricas/SKILL.md .agents/skills/leitor-de-metricas/SKILL.md
exit 0
```

Hash dos mirrors:

```text
ac7b038178c8e88c65b921a50b40fb65c738b6cbbb3218aa457b01931633fb71
```

Golden output compatível, serializado em uma linha, SHA-256:

```text
4fdafe2020ded618d10ec7f0ed52f00076454c539af310ad490b786c933d7746
```

O caso incompatível retornou `INCOMPATIBLE_ATTRIBUTION_WINDOW`,
`requiresHumanDecision: true` e nenhum delta/tendência. Os casos de ausência
mantiveram `null`/`nao_fornecido`; a seleção de uma semana retornou
`INSUFFICIENT_HISTORY` no mesmo contrato.

## Estado para handoff

- Story: `InReview`.
- QG independente: `NOT_RUN`.
- Deploy/push/merge: não executados.
- `epic-17-state.json`: contém somente a materialização da W2; a transição da story pertence ao fan-in depois do QG.
