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

## Contrato observado

- `SourceObservationSet 1.0.0` aceita no máximo uma observação por fonte `platform`, `checkout` e `cash`.
- Valores monetários são strings decimais não negativas com até 30 dígitos inteiros e 12 casas; nenhuma passagem por `Number` ocorre no cálculo.
- Moeda precisa constar no vocabulário ISO 4217 do runtime; janela permanece literal e período/observação exigem RFC3339 válido.
- Períodos em offsets diferentes são comparáveis somente quando `start` e `end` representam os mesmos instantes; os literais originais permanecem intactos na saída.
- Ordem da entrada não altera os bytes de saída: fontes saem como `platform`, `checkout`, `cash`; pares saem como plataforma-checkout, plataforma-caixa, checkout-caixa.
- Gap absoluto usa aritmética `BigInt` alinhada por escala. Gap relativo é simétrico (`abs(a-b)/max(abs(a),abs(b))`), oferece decimal half-up de seis casas e `relativeGapExact` como razão reduzida sem perda.
- Moeda, janela, período, confirmação humana ou confirmação explícita do caixa incompatíveis produzem códigos fechados e gaps nulos.
- Fonte omitida ou explicitamente ausente produz apenas `nao_fornecido` e campos nulos; `"0"` continua sendo valor fornecido.
- `cashConfirmed` é projetado literalmente. A CLI não lê eventos nem promove plataforma/checkout a confirmação de caixa.
- O resultado sempre exige revisão humana e não contém campo de verdade, vencedor, prioridade ou correção automática.
- Schemas fechados, allow-list de proveniência, scan semântico e erros por código impedem PII, credenciais e payload bruto sem ecoar conteúdo ou path.

## Validações executadas

```text
node --test scripts/reconcile-aula-04-sources.test.mjs
10 tests, 10 pass, 0 fail

node --check scripts/reconcile-aula-04-sources.mjs
exit 0

node --test --test-concurrency=1 --test-reporter=dot \
  scripts/*.test.mjs data/contracts/fixtures/project-brief/*.test.mjs
exit 0
```

Golden outputs, incluindo newline final:

```text
match:    3ec33eadcb9c33dd82a3da3c336e21d00b7716c508979aadac8c873ff0ebccea
mismatch: 4aa249c9cc22ba4018c76078ea62d3e5820a630aba6e563211904b66188289a9
missing:  0ddf335fede12fbbde2bd6ad74fe0ce9abcf476dc83a1477c4f0faf7f1507715
```

Probes adversariais cobriram moeda inexistente, versões desconhecidas, RFC3339 inválido, período não crescente, duplicata, proveniência incompatível com a fonte, PII, email, telefone formatado, token, documento, payload de comprador, zero, fonte parcial, ordem permutada e decimais acima de `Number.MAX_SAFE_INTEGER`.

## Estado para handoff

- Story: `InReview`.
- QG: pendente do `@architect` independente.
- Deploy: `none`.
- Push, merge, PR, close e `epic-17-state.json`: não executados.
