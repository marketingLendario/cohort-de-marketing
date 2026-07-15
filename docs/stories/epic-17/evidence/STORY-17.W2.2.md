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
| RED QG3 rodada 1 | `3b43af2` | CPA, ROAS, spend e CTR falharam sem uma reconciliação W2.3 impossível; guards financeiros permaneceram fechados. |
| GREEN QG3 rodada 1 | `59019d3` | Reconciliação passou a ser obrigatória somente para métricas financeiras; tráfego usa exclusivamente W2.1 e publica `sourceReconciliation: null`. |

## Contrato observado

- Entrada: `DecisionOutcomeEvaluationRequest 1.0.0`, objeto fechado que inclui decisão anterior estruturada e `HistoricalMetricsReading 1.0.0`. `SourceReconciliation 1.0.0` é obrigatório somente para `revenue`, `orders`, `refunds`, `fees` e `net_revenue`; para `cpa`, `roas`, `spend` e `ctr`, a propriedade deve ser omitida.
- A decisão exige IDs tipados distintos para hipótese, alavanca, sucesso, janela, reversão, circuit breaker e aprovação humana; todos os textos obrigatórios ficam apenas na entrada e nunca são republicados.
- Critérios aceitam somente operador `gte`/`lte` e limiar decimal explícito. O par sucesso/reversão precisa ter a mesma métrica, sentidos opostos e intervalos não sobrepostos.
- A comparação decimal usa inteiros `BigInt` e escala, sem delta, média, tendência ou conversão de moeda. O lexer herdado do ledger rejeita números JSON inseguros antes de `JSON.parse`.
- Evidência histórica precisa ter ordem estrita, entradas e samples coerentes, hashes, digest, fonte, selo, janela e confirmação. Duas revisões da mesma semana não satisfazem `minDistinctWeeks`.
- Evidência estimada, ausente, não confirmada, com janela incompatível ou histórico insuficiente retorna `nao_mensuravel` e zero alavancas.
- Reconciliação precisa passar o schema fechado aprovado. Fonte ausente/incompatível retorna `nao_mensuravel`; gap ou divergência com a última observação retorna `inconclusivo`, sem eleger causa ou fonte verdadeira.
- Para métricas de tráfego, o veredito e o reason code derivam somente das observações W2.1; o output preserva essas referências e registra reconciliação como `null`, sem fabricar fonte, valor ou explicação causal. Reconciliação presente nesse ramo falha fechado.
- `sustentou` e `refutou` dependem somente dos critérios declarados. Apenas `refutou` referencia a única alavanca de reversão pré-autorizada; nada é executado.
- Saída: `DecisionOutcomeDiagnosis 1.0.0`, provenance-only, sem valores ou textos, sempre com decisão humana pendente, circuit breaker preservado, `mutationAllowed: false` e histórico imutável.
- Identificadores republicados usam formatos tipados/allowlisted e bloqueiam assinaturas de credencial, PII textual e sequências numéricas de 11/14 dígitos.

## Validações executadas

```text
node --test scripts/diagnose-aula-04-decision.test.mjs
10 tests, 10 pass, 0 fail

node --test --test-concurrency=1 \
  scripts/diagnose-aula-04-decision.test.mjs \
  scripts/read-aula-04-history.test.mjs \
  scripts/reconcile-aula-04-sources.test.mjs \
  scripts/build-weekly-ledger.test.mjs \
  scripts/validate-aula-04-contracts.test.mjs
70 tests, 70 pass, 0 fail

node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
152 tests, 152 pass, 0 fail

node --check scripts/diagnose-aula-04-decision.mjs
exit 0

cmp -s .claude/skills/diagnosticador/SKILL.md .agents/skills/diagnosticador/SKILL.md
exit 0

git diff --check
exit 0
```

Hash SHA-256 dos dois mirrors:

```text
c4a1c42434f2ecd27e55ad04203eb7685bc4a916f97c84634b79bd8c3a90127f
```

## Matriz adversarial

- quatro vereditos com bytes determinísticos e golden explícito;
- zero/uma alavanca, circuit breaker e decisão humana obrigatórios;
- ausência, estimativa, semana insuficiente e janela incompatível;
- gap reconciliado, fonte ausente, valor divergente e nenhuma escolha de fonte verdadeira;
- CPA, ROAS, spend e CTR mensuráveis e não mensuráveis sem reconciliação sintética;
- métrica financeira sem reconciliação, com null ou incompatível; métrica de tráfego com reconciliação indevida;
- schema condicional rejeita output financeiro com null e output de tráfego com objeto de reconciliação;
- decisão vazia, IDs repetidos, critérios sobrepostos, janela invertida, ordem/duplicata forjada e métrica divergente;
- inteiro/decimal JSON inseguro, arquivo ausente, JSON inválido e argumentos desconhecidos;
- email, token, telefone/CPF/CNPJ shaped ID e credencial em superfícies republicadas;
- schema de saída fechado, input byte a byte imutável e mirror parity.

## Estado para handoff

- Story: `Done`.
- QG3 independente rodada 1: `FAIL 84/100`, confiança `0.98`, preservado como histórico.
- Blocker remediado: `cpa`, `roas`, `spend` e `ctr` agora atravessam o contrato W2.1 sem exigir nem fabricar `SourceReconciliationV1`; métricas financeiras continuam exigindo o contrato W2.3 válido e compatível.
- RED de remediação: `3b43af2`; GREEN de remediação: `59019d3`.
- Focal `10/10`, adjacente `70/70`, full Node `152/152`, mirror e diff check verdes.
- QG3 independente rodada 2: `PASS 98/100`, confiança `0.99`, zero blockers;
  focal `10/10` reexecutado pelo revisor e matriz condicional inspecionada.
- Handoff: pronto para fan-in local por `@devops`.
- `epic-17-state.json`, merge, push e deploy: não executados; reservados ao fan-in `@devops` após QG PASS.
