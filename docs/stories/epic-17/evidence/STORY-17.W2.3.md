# Evidência — STORY-17.W2.3

## Escopo e baseline

- Baseline integrada: `7d3ec8296b1c3128d708dd15575b41bf9b8d15c6`.
- Dependências: `17.W1.1` e `17.W1.2` em `Done`.
- Cobertura por PR: `gh pr list --state open` retornou lista vazia para `marketingLendario/cohort-de-marketing` em 2026-07-15.
- Fronteira: arquivos públicos locais e minimizados; nenhuma conexão com Studio, checkout, caixa, Meta, API, credencial ou dados reais.

## TDD e commits

| Marco | Commit | Evidência |
|---|---|---|
| RED | `2c51cd3` | Três fixtures e dez grupos de testes; 0/10 passaram porque script e schema ainda não existiam. |
| GREEN | `755f236` | Schema, CLI e template implementaram reconciliação determinística e fail-closed. |
| Self-review | `a10c954` | Razão relativa exata, scan de identificadores sensíveis e probes adicionais de moeda/proveniência/duplicata. |
| QG1 | `eba476b` | `FAIL 78`: charsets genéricos não impediam PII em quatro superfícies textuais republicadas. |
| RED Round2 | `7a265cb` | 32 mutações de input; `reconciliationId:name` reproduziu o vazamento com exit 0. |
| GREEN Round2 | `82e6abf` | IDs opacos tipados, enums positivos e guard textual recursivo antes da saída. |
| QG2 | `7aa10e5` | `FAIL 84`: nonces numéricos de 11/14 dígitos ainda comportavam telefone, CPF ou CNPJ. |
| RED Round3 | `24fd5c3` | Telefone numérico em `reconciliationId` reproduziu a aceitação indevida com exit 0. |
| GREEN Round3 | `92fbcc2` | Nonce exige letra `a-f`; guard recursivo rejeita sequências isoladas de 11/14 dígitos. |

## Contrato observado

- `SourceObservationSet 1.0.0` aceita no máximo uma observação por fonte `platform`, `checkout` e `cash`.
- Valores monetários são strings decimais não negativas com até 30 dígitos inteiros e 12 casas; nenhuma passagem por `Number` ocorre no cálculo.
- Moeda precisa constar no enum ISO 4217 congelado no schema; janela permanece literal dentro de oito valores públicos conhecidos e período/observação exigem RFC3339 válido.
- Períodos em offsets diferentes são comparáveis somente quando `start` e `end` representam os mesmos instantes; os literais originais permanecem intactos na saída.
- Ordem da entrada não altera os bytes de saída: fontes saem como `platform`, `checkout`, `cash`; pares saem como plataforma-checkout, plataforma-caixa, checkout-caixa.
- Gap absoluto usa aritmética `BigInt` alinhada por escala. Gap relativo é simétrico (`abs(a-b)/max(abs(a),abs(b))`), oferece decimal half-up de seis casas e `relativeGapExact` como razão reduzida sem perda.
- Moeda, janela, período, confirmação humana ou confirmação explícita do caixa incompatíveis produzem códigos fechados e gaps nulos.
- Fonte omitida ou explicitamente ausente produz apenas `nao_fornecido` e campos nulos; `"0"` continua sendo valor fornecido.
- `cashConfirmed` é projetado literalmente. A CLI não lê eventos nem promove plataforma/checkout a confirmação de caixa.
- O resultado sempre exige revisão humana e não contém campo de verdade, vencedor, prioridade ou correção automática.
- `reconciliationId` segue `reconciliation:<metric-enum>:YYYY-MM:<nonce hex de 8-32>`; o nonce é opaco, exige ao menos uma letra `a-f` e não aceita texto livre nem valor exclusivamente numérico.
- Métrica usa enum fechado (`revenue`, `orders`, `refunds`, `fees`, `net_revenue`); janela usa oito literais conhecidos.
- Cada `provenanceRef` combina `kind` e ID tipado: `<platform|checkout|cash|operator>:YYYY-MM:<nonce hex de 8-32 com letra a-f>`; source-kind incompatível ou nonce exclusivamente numérico falha fechado.
- Schemas fechados, allowlists positivas, guard textual recursivo de input e output e erros por código impedem PII, credenciais e payload bruto sem ecoar conteúdo ou path.

## Validações executadas

```text
node --test scripts/reconcile-aula-04-sources.test.mjs
14 tests, 14 pass, 0 fail

node --check scripts/reconcile-aula-04-sources.mjs
exit 0

node --test --test-concurrency=1 --test-reporter=dot \
  scripts/*.test.mjs data/contracts/fixtures/project-brief/*.test.mjs
exit 0
```

Golden outputs, incluindo newline final:

```text
match:    16638aa9ab1ab402d88cea79cbdbd31f57856e86a3d3033dfc75aefd59f1d60a
mismatch: 2da030422d90a9595eabad189e94174af773934e69083e977cd8d90d04aec015
missing:  595702cc4cf6c6e5c33495bc05bd3c5303ad0ed0932dd65b934fbeb7cc478597
```

Probes adversariais cobriram moeda inexistente, versões desconhecidas, RFC3339 inválido, período não crescente, duplicata, proveniência incompatível com a fonte, PII, email, telefone formatado, token, documento, payload de comprador, zero, fonte parcial, ordem permutada e decimais acima de `Number.MAX_SAFE_INTEGER`.

Round2 executou 32 casos de input: nome sintético, endereço, documento,
telefone, token e buyer forms foram injetados em `reconciliationId`, `metric`,
`window` e `provenanceRef.id`; as demais oito superfícies textuais também foram
adulteradas. Todos retornaram somente `INVALID_SOURCE_OBSERVATION_SET`, sem eco.
O schema de saída rejeitou outras oito adulterações. A matriz positiva percorreu
cinco métricas por oito janelas (40 casos) e uma referência opaca do operador sem
falso positivo.

Round3 acrescentou seis mutações numéricas de input e seis equivalentes no
schema de saída: telefone e CPF de 11 dígitos e CNPJ de 14 dígitos foram
injetados em `reconciliationId` e `provenanceRef.id`. Todos falharam fechado e a
CLI não ecoou os nonces. O schema agora exige ao menos uma letra `a-f` no nonce,
enquanto o guard recursivo rejeita sequências isoladas de 11/14 dígitos. A
matriz positiva original de 40 combinações permaneceu verde; dois nonces
numeric-shaped de 11/14 caracteres com uma letra também passaram, sem falso
positivo. Os três golden hashes permaneceram inalterados.

## Estado para handoff

- Story: `InReview`.
- QG: Round1 `FAIL 78`, Round2 `FAIL 84`; remediação Round3 pronta para nova revisão independente.
- Deploy: `none`.
- Push, merge, PR, close e `epic-17-state.json`: não executados.
