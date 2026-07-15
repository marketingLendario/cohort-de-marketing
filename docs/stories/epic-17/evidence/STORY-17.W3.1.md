# Evidência — STORY-17.W3.1

## Escopo e preflight

- Baseline integrada: `aa1745d6607b1ddd1122cfbecdff9d21a2697e38`.
- Branch/worktree: `wave/17-w3/story-17.W3.1` isolada da integração pública.
- Dependências: 17.W2.1, 17.W2.2 e 17.W2.3 em `Done`, com QGs aprovados.
- PR coverage: `gh pr list --repo marketingLendario/cohort-de-marketing --state open --search '17.W3.1'` retornou `[]` em 2026-07-15.
- Fronteira: execução local, sem Studio, rede, API, credencial, browser automatizado ou mutação de plataforma.
- Story rematerializada em contrato completo no commit `79f8ca7`, antes de teste ou implementação.

## TDD e implementação

| Marco | Commit | Evidência |
|---|---|---|
| RED inicial | `bc90b11` | Sete grupos congelados; `0/7` passaram porque módulo, runner, exemplo e template ainda não existiam. |
| GREEN inicial | `beb163a` | Runner compôs os contratos W2, materiais e exemplo; focal `7/7`. |
| RED de confiança | `579e2cb` | Decisão com email e expected forjado provaram que input controlado não pode autorizar republicação ou outro veredito. |
| GREEN de confiança | `94617b3` | Guard textual recursivo e invariantes de inconclusivo, reason code, zero alavancas, decisão pending e histórico imutável. |

## Contrato observado

- Entrada pública: exatamente três linhas JSONL `WeeklyPanel 1.0.0`, três semanas distintas, mesmo projeto/campanha, mais `SourceObservationSet 1.0.0`, decisão humana estruturada e expectativa congelada.
- O runner valida cada WeeklyPanel antes de chamar `buildWeeklyLedger`; não reimplementa schema, hash ou digest.
- `WeeklyLedger 1.1.0` alimenta diretamente `readHistoricalMetrics`; nenhuma métrica, ausência, janela, delta ou tendência é derivada pelo módulo.
- As observações minimizadas alimentam `reconcileSourceObservations`. Os três valores divergem, portanto gaps permanecem explícitos e nenhuma fonte é eleita.
- O request fechado alimenta `diagnoseDecisionOutcome`. O resultado obrigatório é `inconclusivo` com `RECONCILIATION_CONFOUNDING_GAP`, zero alavancas, decisão humana `pending`, circuit breaker preservado e mutação proibida.
- O runner escreve somente no diretório de saída vazio informado e somente seis artefatos: ledger, leitura, reconciliação, request, diagnóstico e resumo.
- Duas execuções em diretórios temporários independentes geram bytes idênticos e não alteram o diretório de exemplo.
- Texto sensível ou path absoluto em input/output falha fechado; erros publicam somente códigos allowlisted.

## Material didático

- `aula-04/README.md` contém uma sequência única: preparar, executar, revisar e registrar decisão humana.
- `aula-04/GUIA-DO-ALUNO.html` é autocontido, sem asset remoto. O runner não abre navegador; o guia documenta comandos manuais para macOS, Windows e Linux.
- Templates cobertos: `weekly-ledger.yaml`, `leitura-historica.yaml`, `reconciliacao-fontes.yaml` e `diagnostico-longitudinal.yaml`.
- README raiz e handoff da Aula 3 apontam para o módulo por links relativos válidos.

## Validações executadas

```text
node --test scripts/run-aula-04-walkthrough.test.mjs
7 tests, 7 pass, 0 fail

node --test --test-concurrency=1 \
  scripts/run-aula-04-walkthrough.test.mjs \
  scripts/read-aula-04-history.test.mjs \
  scripts/reconcile-aula-04-sources.test.mjs \
  scripts/diagnose-aula-04-decision.test.mjs
44 tests, 44 pass, 0 fail

node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
159 tests, 159 pass, 0 fail

node --check scripts/run-aula-04-walkthrough.mjs
exit 0

git diff --check aa1745d..HEAD
exit 0
```

## Matriz adversarial

- uso incorreto, exemplo ausente, destino inexistente e destino não vazio;
- WeeklyPanel com versão inválida e exatamente três semanas obrigatórias;
- decisão anterior com email e output sem PII, segredo ou path absoluto;
- expected alterado para sustentar a hipótese, sem poder mudar o invariante inconclusivo;
- links locais do README/HTML e ausência de URL/asset remoto;
- runner sem `child_process`, fetch, browser ou comando de mutação da Meta;
- imutabilidade do exemplo e determinismo byte a byte em dois diretórios limpos.

## Handoff

- Story: `InReview`.
- Implementação: `94617b3`.
- Focal: `7/7`; adjacente W2: `44/44`; full Node: `159/159`.
- QG3 independente rodada 1: `FAIL 76/100`, confiança `0.98`.
- Blockers reproduzidos em cópia temporária: telefone/CPF/CNPJ não são
  detectados pelo guard recursivo e podem ser republicados; destino vazio
  descendente do exemplo é aceito e recebe os outputs.
- Segundo ciclo RED -> GREEN deve ampliar o detector sem ecoar conteúdo e usar
  caminho real/canônico para bloquear destino igual, descendente ou symlinkado
  dentro da árvore do exemplo.
- `epic-17-state.json`, fan-in, push, PR e deploy: não executados.
