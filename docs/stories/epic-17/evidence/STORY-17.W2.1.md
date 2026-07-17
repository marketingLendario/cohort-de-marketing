# Evidência — STORY-17.W2.1

## Escopo e baseline

- Baseline integrada: `d0bc5ed1aff114d616402e98b7ec17e25b7c2309`.
- Dependência: `17.W1.2` em `Done`, fornecendo o builder do `WeeklyLedger v1`.
- PR coverage: `gh pr list --repo marketingLendario/cohort-de-marketing --state open` retornou lista vazia em 2026-07-15.
- Fronteira: arquivos públicos locais; nenhum acesso a Studio, projeto privado, API, credencial ou artefato bruto.

## TDD e commits

| Marco | Commit | Evidência |
|---|---|---|
| Contrato da W2 | `9e9fa73` | W2.1/W2.3 `Ready`, W2.2 bloqueada, allow-lists e gates explícitos. |
| RED | `bcc67c9` | 8/8 testes falharam antes do reader existir. |
| GREEN | `d3b7842` | Reader fail-closed e modo histórico nos dois mirrors. |
| QG1 | `0bbb009` | `FAIL 58`: três blockers de integridade, cardinalidade temporal e número inseguro. |
| Allow-list Round2 | `647e66e` | Builder, schema, testes e fixture autorizados antes das mudanças. |
| RED Round2 | `0aaf771` | 14 falhas reproduziram os três blockers e a rejeição explícita do ledger legado. |
| GREEN Round2 | `ad63a79` | WeeklyLedger 1.1.0, digest da projeção, semanas distintas e lexer pré-parse. |
| QG2 | `d689f81` | `FAIL 88`: ordem de chaves dos objetos do index era falsamente semântica. |
| RED Round3 | `d26301b` | Builder e reader reproduzem a rejeição ao permutar somente chaves de objetos. |
| GREEN Round3 | `975571b` | Igualdade estrutural usa `canonicalSerialize` compartilhado; arrays permanecem ordenados. |
| QG3 | `b2389ae` | `PASS 100/100`, confiança `0.99`, zero blockers. |

## Contrato observado

- Entrada validada como WeeklyLedger `1.1.0` por `weekly-ledger.v1.schema.json` com AJV 2020-12 e formatos.
- `canonicalHash` preserva o SHA-256 do WeeklyPanel completo. O novo `projectionDigest` usa versão `1.0.0`, algoritmo SHA-256 e serialização compacta com chaves recursivamente ordenadas sobre toda a entrada persistida sem o próprio digest.
- Builder e reader recomputam o digest; adulterar `value`, `sourceRef` ou `canonicalHash` falha fechado. Ledger 1.0.0 sem digest é rejeitado, pois não há como atribuir integridade retroativa sem os WeeklyPanels originais.
- Validação semântica exige contrato/versão/hash/digest, entradas estritamente ordenadas, identidade única, métricas únicas por entrada e índice exatamente derivável.
- Seleção exige `projectId` e `campaignId` explícitos; `weekStart` é opcional e nunca escolhe projeto/campanha por heurística.
- Saída preserva valor/ausência, selo, fontes, premissas, janela, confirmações, revisão, painel e hash.
- Séries separam índices `Real`, `Estimado` e `nao_fornecido`; o reader não contém delta, média, taxa ou tendência.
- Comparabilidade requer pelo menos dois `weekStart` distintos; duas revisões da mesma semana retornam `INSUFFICIENT_HISTORY`.
- O lexer JSON ignora strings e rejeita antes de `JSON.parse` inteiros fora de `Number.MAX_SAFE_INTEGER`, decimais com precisão insegura, overflow e underflow para zero.
- Erros públicos são apenas códigos fechados e não ecoam conteúdo, seleção, token ou valor do ledger.
- A igualdade do index ordena recursivamente apenas chaves de objetos. A ordem de entradas do index, revisões e demais arrays continua semântica e os probes existentes de tamper, duplicidade e ordem permanecem verdes.

## Validações executadas

```text
node --test scripts/read-aula-04-history.test.mjs scripts/build-weekly-ledger.test.mjs
37 tests, 37 pass, 0 fail

node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
127 tests, 127 pass, 0 fail

cmp -s .claude/skills/leitor-de-metricas/SKILL.md .agents/skills/leitor-de-metricas/SKILL.md
exit 0
```

Uma execução agregada concorrente anterior apresentou uma única instabilidade
temporal no probe de `SIGKILL` do lock, sem falha focal ou mudança funcional. O
gate foi repetido com `--test-concurrency=1` para remover contenção entre suites:
127/127 passaram. Nenhuma remediação de código foi aplicada entre esse ruído e o
rerun controlado.

Hash dos mirrors:

```text
e2bbc61fb0b288bd50f26174916005dbff316861c788f8635018048009365f7a
```

Golden output compatível, serializado em uma linha, SHA-256:

```text
7ff02f13d5e743107572d2cbfda71133e8d1c4cd8dfb8c9c5ab838debf942dde
```

O caso incompatível retornou `INCOMPATIBLE_ATTRIBUTION_WINDOW`,
`requiresHumanDecision: true` e nenhum delta/tendência. Os casos de ausência
mantiveram `null`/`nao_fornecido`; a seleção de uma semana retornou
`INSUFFICIENT_HISTORY` no mesmo contrato.

Os probes Round2 também confirmaram:

- valor e `sourceRef` adulterados retornam `INVALID_LEDGER_SEMANTICS`;
- duas revisões de `2026-07-13` retornam `INSUFFICIENT_HISTORY`;
- `9007199254740993`, `0.12345678901234567` e `1e309` retornam
  `UNSAFE_JSON_NUMBER` antes do parse;
- o builder rejeita input numérico inseguro e ledger legado/adulterado sem tocar
  o destino.
- permutar somente as chaves de cada objeto do index mantém o mesmo output do
  reader e replay idempotente do builder; arrays adulterados continuam inválidos.

## Estado para handoff

- Story: `Done`.
- QG independente: Round1 `FAIL 58`, Round2 `FAIL 88`, Round3 `PASS 100/100` com confiança `0.99` e zero blockers.
- Deploy/push/merge: não executados.
- `epic-17-state.json`: contém somente a materialização da W2; a transição de W2.1 e o desbloqueio de W2.2 pertencem ao fan-in `@devops`.
