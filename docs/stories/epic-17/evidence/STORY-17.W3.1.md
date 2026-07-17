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
| RED QG3 rodada 1 | `9b20224 + RED local` | Os dois grupos falharam: `11987654321` retornava sucesso e o destino igual ao exemplo retornava `OUTPUT_NOT_EMPTY` antes da guarda de contenção. |
| GREEN QG3 rodada 1 | `224b085` | Detector contextual e resolução por ancestral existente fecharam os dois blockers; focal `9/9`. |
| RED QG3 rodada 2 | `3a05a5a + RED local` | Um único teste executou os dois probes antes de afirmar: fixo com DDD em 10 dígitos e celular internacional em 13 dígitos retornaram `0` e geraram seis artefatos cada. |
| GREEN QG3 rodada 2 | `7beb539` | O padrão compacto passou a cobrir 10/11 e 13/14 dígitos com as mesmas bordas alfanuméricas e exceções contextuais; focal `10/10`. |

## Contrato observado

- Entrada pública: exatamente três linhas JSONL `WeeklyPanel 1.0.0`, três semanas distintas, mesmo projeto/campanha, mais `SourceObservationSet 1.0.0`, decisão humana estruturada e expectativa congelada.
- O runner valida cada WeeklyPanel antes de chamar `buildWeeklyLedger`; não reimplementa schema, hash ou digest.
- `WeeklyLedger 1.1.0` alimenta diretamente `readHistoricalMetrics`; nenhuma métrica, ausência, janela, delta ou tendência é derivada pelo módulo.
- As observações minimizadas alimentam `reconcileSourceObservations`. Os três valores divergem, portanto gaps permanecem explícitos e nenhuma fonte é eleita.
- O request fechado alimenta `diagnoseDecisionOutcome`. O resultado obrigatório é `inconclusivo` com `RECONCILIATION_CONFOUNDING_GAP`, zero alavancas, decisão humana `pending`, circuit breaker preservado e mutação proibida.
- O runner escreve somente no diretório de saída vazio informado e somente seis artefatos: ledger, leitura, reconciliação, request, diagnóstico e resumo. Destino igual, descendente ou resolvido por symlink para dentro do exemplo é rejeitado antes da validação de vazio, inclusive quando o leaf ainda não existe; diretório de saída que seja symlink também é rejeitado.
- Duas execuções em diretórios temporários independentes geram bytes idênticos e não alteram o diretório de exemplo.
- Texto sensível, telefone, CPF, CNPJ ou path absoluto em input/output falha fechado; erros publicam somente códigos allowlisted. Telefones compactos nacionais de 10/11 dígitos e internacionais de 13 dígitos são cobertos. O scan numérico ignora campos contratuais de medição e as bordas alfanuméricas preservam IDs opacos canônicos.

## Material didático

- `aula-04/README.md` contém uma sequência única: preparar, executar, revisar e registrar decisão humana.
- `aula-04/GUIA-DO-ALUNO.html` é autocontido, sem asset remoto. O runner não abre navegador; o guia documenta comandos manuais para macOS, Windows e Linux.
- Templates cobertos: `weekly-ledger.yaml`, `leitura-historica.yaml`, `reconciliacao-fontes.yaml` e `diagnostico-longitudinal.yaml`.
- README raiz e handoff da Aula 3 apontam para o módulo por links relativos válidos.

## Validações executadas

```text
node --test scripts/run-aula-04-walkthrough.test.mjs
10 tests, 10 pass, 0 fail

node --test --test-concurrency=1 \
  scripts/run-aula-04-walkthrough.test.mjs \
  scripts/read-aula-04-history.test.mjs \
  scripts/reconcile-aula-04-sources.test.mjs \
  scripts/diagnose-aula-04-decision.test.mjs
47 tests, 47 pass, 0 fail

node --test --test-concurrency=1 \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs \
  scripts/*.test.mjs \
  scripts/lib/skill-readiness.test.mjs \
  services/meta-ads/index.test.js
162 tests, 162 pass, 0 fail

node --check scripts/run-aula-04-walkthrough.mjs
exit 0

git diff --check aa1745d..HEAD
exit 0
```

## Matriz adversarial

- uso incorreto, exemplo ausente, destino inexistente e destino não vazio;
- WeeklyPanel com versão inválida e exatamente três semanas obrigatórias;
- decisão anterior com email e output sem PII, segredo ou path absoluto;
- telefone, CPF e CNPJ em formatos compactos e pontuados, aninhados nas quatro entradas, falham sem eco e sem output;
- telefone fixo compacto com DDD em 10 dígitos e celular internacional compacto em 13 dígitos falham juntos, sem short-circuit esconder o segundo probe;
- IDs opacos alfanuméricos de 10, 11, 13 e 14 caracteres continuam válidos, sem falso positivo numérico;
- expected alterado para sustentar a hipótese, sem poder mudar o invariante inconclusivo;
- destino igual, descendente existente, descendente inexistente, symlink dentro do exemplo e alias externo resolvido para dentro são rejeitados; nenhum symlink é seguido para escrita;
- links locais do README/HTML e ausência de URL/asset remoto;
- runner sem `child_process`, fetch, browser ou comando de mutação da Meta;
- imutabilidade do exemplo e determinismo byte a byte em dois diretórios limpos.

## Handoff

- Story: `Done`.
- Implementação da remediação rodada 2: `7beb539`.
- Focal: `10/10`; adjacente W2: `47/47`; full Node: `162/162`.
- QG3 independente rodada 1: `FAIL 76/100`, confiança `0.98`.
- QG3 independente rodada 2: `FAIL`; telefone fixo compacto com DDD e celular
  internacional compacto ainda atravessavam o guard no HEAD `3a05a5a`.
- Blocker da rodada 2 reproduzido e fechado: os dois probes agora falham sem eco
  e sem artefatos; métricas e IDs opacos alfanuméricos permanecem aceitos.
- QG3 independente rodada 3: `PASS 98/100`, confiança `0.99`, zero blockers e zero findings no HEAD `20249bda5dab9fb7a1b0d7a3cfc3570dcb0a5f2d`.
- Matriz independente `24/24`, focal `10/10`, adjacente `47/47`, full Node `162/162`, File List `14/14`, `node --check` e `git diff --check` passaram em worktree limpa.
- Story encerrada em `Done`; `17.W3.2` pode ser autorizada somente após o fan-in local e a atualização do state pelo integrador.
- `epic-17-state.json`, fan-in, push, PR e deploy: não executados.
