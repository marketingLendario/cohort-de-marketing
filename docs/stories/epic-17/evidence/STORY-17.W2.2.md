# Evidência — STORY-17.W2.2

## Escopo e baseline

- Baseline integrada: `1c4f84ab0644312877838797d8c4477a9914b3ae`.
- Dependências: 17.W1.2 e 17.W2.1 em `Done`; 17.W2.3 também integrado e disponível como contrato público de reconciliação.
- PR coverage: busca por `17.W2.2` em título/corpo de PRs abertos retornou `[]` em 2026-07-15.
- Fronteira: somente arquivos públicos locais. Nenhum acesso a Studio, projeto privado, API, plataforma, checkout, caixa, credencial ou dado real.

## TDD e commits

| Marco | Commit | Evidência |
|---|---|---|
| Rematerialização | `2d20738` | Status, baseline, dependências e allow-list real atualizados antes do código. |
| RED | `2f96359` | Sete grupos e quatro goldens falharam porque o CLI ainda não existia. |
| RED de superfícies | `864f862` | IDs de projeto, campanha, painel e fonte provaram risco de republicar PII/credencial. |
| GREEN | `a803b45` | CLI, schema fechado, template e modo longitudinal nos mirrors. |

## Contrato observado

- Entrada: `DecisionOutcomeEvaluationRequest 1.0.0`, objeto fechado que inclui decisão anterior estruturada, `HistoricalMetricsReading 1.0.0` e `SourceReconciliation 1.0.0`.
- A decisão exige IDs tipados distintos para hipótese, alavanca, sucesso, janela, reversão, circuit breaker e aprovação humana; todos os textos obrigatórios ficam apenas na entrada e nunca são republicados.
- Critérios aceitam somente operador `gte`/`lte` e limiar decimal explícito. O par sucesso/reversão precisa ter a mesma métrica, sentidos opostos e intervalos não sobrepostos.
- A comparação decimal usa inteiros `BigInt` e escala, sem delta, média, tendência ou conversão de moeda. O lexer herdado do ledger rejeita números JSON inseguros antes de `JSON.parse`.
- Evidência histórica precisa ter ordem estrita, entradas e samples coerentes, hashes, digest, fonte, selo, janela e confirmação. Duas revisões da mesma semana não satisfazem `minDistinctWeeks`.
- Evidência estimada, ausente, não confirmada, com janela incompatível ou histórico insuficiente retorna `nao_mensuravel` e zero alavancas.
- Reconciliação precisa passar o schema fechado aprovado. Fonte ausente/incompatível retorna `nao_mensuravel`; gap ou divergência com a última observação retorna `inconclusivo`, sem eleger causa ou fonte verdadeira.
- `sustentou` e `refutou` dependem somente dos critérios declarados. Apenas `refutou` referencia a única alavanca de reversão pré-autorizada; nada é executado.
- Saída: `DecisionOutcomeDiagnosis 1.0.0`, provenance-only, sem valores ou textos, sempre com decisão humana pendente, circuit breaker preservado, `mutationAllowed: false` e histórico imutável.
- Identificadores republicados usam formatos tipados/allowlisted e bloqueiam assinaturas de credencial, PII textual e sequências numéricas de 11/14 dígitos.

## Validações executadas

```text
node --test scripts/diagnose-aula-04-decision.test.mjs
7 tests, 7 pass, 0 fail

node --test --test-concurrency=1 \
  scripts/diagnose-aula-04-decision.test.mjs \
  scripts/read-aula-04-history.test.mjs \
  scripts/reconcile-aula-04-sources.test.mjs \
  scripts/build-weekly-ledger.test.mjs \
  scripts/validate-aula-04-contracts.test.mjs
67 tests, 67 pass, 0 fail

node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
149 tests, 149 pass, 0 fail

node --check scripts/diagnose-aula-04-decision.mjs
exit 0

cmp -s .claude/skills/diagnosticador/SKILL.md .agents/skills/diagnosticador/SKILL.md
exit 0

git diff --check
exit 0
```

Hash SHA-256 dos dois mirrors:

```text
98a9f64d789e2b8338dac6ee2869c37cb45f80716357def63ff3e39d9ef7a637
```

## Matriz adversarial

- quatro vereditos com bytes determinísticos e golden explícito;
- zero/uma alavanca, circuit breaker e decisão humana obrigatórios;
- ausência, estimativa, semana insuficiente e janela incompatível;
- gap reconciliado, fonte ausente, valor divergente e nenhuma escolha de fonte verdadeira;
- decisão vazia, IDs repetidos, critérios sobrepostos, janela invertida, ordem/duplicata forjada e métrica divergente;
- inteiro/decimal JSON inseguro, arquivo ausente, JSON inválido e argumentos desconhecidos;
- email, token, telefone/CPF/CNPJ shaped ID e credencial em superfícies republicadas;
- schema de saída fechado, input byte a byte imutável e mirror parity.

## Estado para handoff

- Story: `InReview`.
- QG independente: pendente.
- HEAD de implementação antes do handoff documental: `a803b45`.
- `epic-17-state.json`, merge, push e deploy: não executados; reservados ao fan-in `@devops` após QG PASS.
