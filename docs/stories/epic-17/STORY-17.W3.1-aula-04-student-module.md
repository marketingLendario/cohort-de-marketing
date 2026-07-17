---
status: Done
story_id: "17.W3.1"
title: "Módulo didático e fluxo local da Aula 4"
epic: 17
wave: "W3"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 8h
deploy_type: none
appetite: 1d
hill_phase: downhill
confidence_level: know-how
involves_ui: true
task_mode: CRIAR
cli: codex
model: sonnet
executor: "@dev"
quality_gate: "@architect"
repo_target: "marketingLendario/cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["17.W2.1", "17.W2.2", "17.W2.3"]
consumes_artifacts_of: ["17.W1.2", "17.W2.1", "17.W2.2", "17.W2.3"]
entity_input:
  entity_type: "Aula04W2ArtifactBundleV1"
  description: "Três WeeklyPanelV1 públicos e os contratos aprovados WeeklyLedgerV1, HistoricalMetricsReadingV1, SourceObservationSetV1 e decisão humana estruturada de W2."
  status_expected: "validated"
entity_output:
  entity_type: "Aula04StudentWalkthroughV1"
  description: "Módulo didático público e walkthrough local determinístico que produz ledger, leitura, reconciliação e diagnóstico inconclusivo com decisão humana pendente."
  status_expected: "reviewable"
touched_paths:
  - "aula-04/README.md"
  - "aula-04/GUIA-DO-ALUNO.html"
  - "aula-04/templates/weekly-ledger.yaml"
  - "aula-04/exemplos/projeto-tres-semanas/README.md"
  - "aula-04/exemplos/projeto-tres-semanas/weekly-panels.jsonl"
  - "aula-04/exemplos/projeto-tres-semanas/source-observations.json"
  - "aula-04/exemplos/projeto-tres-semanas/previous-decision.json"
  - "aula-04/exemplos/projeto-tres-semanas/expected-walkthrough.json"
  - "scripts/run-aula-04-walkthrough.mjs"
  - "scripts/run-aula-04-walkthrough.test.mjs"
  - "README.md"
  - "aula-03/docs/conexao-aula-04.md"
  - "docs/stories/epic-17/STORY-17.W3.1-aula-04-student-module.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.1.md"
affected_paths:
  - "aula-04/README.md"
  - "aula-04/GUIA-DO-ALUNO.html"
  - "aula-04/templates/weekly-ledger.yaml"
  - "aula-04/exemplos/projeto-tres-semanas/README.md"
  - "aula-04/exemplos/projeto-tres-semanas/weekly-panels.jsonl"
  - "aula-04/exemplos/projeto-tres-semanas/source-observations.json"
  - "aula-04/exemplos/projeto-tres-semanas/previous-decision.json"
  - "aula-04/exemplos/projeto-tres-semanas/expected-walkthrough.json"
  - "scripts/run-aula-04-walkthrough.mjs"
  - "scripts/run-aula-04-walkthrough.test.mjs"
  - "README.md"
  - "aula-03/docs/conexao-aula-04.md"
  - "docs/stories/epic-17/STORY-17.W3.1-aula-04-student-module.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.1.md"
---

# STORY-17.W3.1 - Módulo didático e fluxo local da Aula 4

## Status

Done — QG3 rodada 3 independente aprovado com `PASS 98/100`, confiança `0.99` e zero findings.

## Story

**Como** aluno que concluiu a operação semanal da Aula 3

**Quero** executar localmente uma sequência única sobre três semanas públicas

**Para que** eu obtenha histórico, reconciliação e diagnóstico revisável sem Studio, serviço privado, credencial ou número inventado.

## Dependências

- 17.W2.1 — `HistoricalMetricsReadingV1`, QG PASS 100.
- 17.W2.2 — `DecisionOutcomeDiagnosisV1`, QG rodada 2 PASS 98.
- 17.W2.3 — `SourceReconciliationV1`, QG rodada 4 PASS 98.

## Acceptance Criteria

- [x] AC1: `aula-04/README.md` e `aula-04/GUIA-DO-ALUNO.html` apresentam uma única sequência numerada, pré-requisitos locais, contratos gerados e critérios de parada; todo comando usa caminho relativo ao checkout.
- [x] AC2: As instruções HTML nunca prometem abertura automática e informam separadamente como abrir o caminho local no macOS, Windows e Linux, sem executar browser pelo walkthrough.
- [x] AC3: O exemplo público contém exatamente três `WeeklyPanelV1` válidos, de semanas distintas, sem PII, credencial, payload bruto ou dependência privada; o fluxo gera `WeeklyLedger 1.1.0` com três entradas e proveniência verificável.
- [x] AC4: O walkthrough gera `HistoricalMetricsReading 1.0.0`, `SourceReconciliation 1.0.0`, `DecisionOutcomeEvaluationRequest 1.0.0` e `DecisionOutcomeDiagnosis 1.0.0`; o diagnóstico final é `inconclusivo`, tem um único reason code canônico, zero alavancas e decisão humana `pending`.
- [x] AC5: Os quatro templates públicos ficam cobertos explicitamente: `weekly-ledger.yaml`, `leitura-historica.yaml`, `reconciliacao-fontes.yaml` e `diagnostico-longitudinal.yaml`; nenhum template ou guia instrui mutação na Meta.
- [x] AC6: O runner aceita somente diretório de exemplo e diretório de saída vazio, escreve apenas os seis artefatos públicos declarados, não abre navegador, não acessa rede/Studio/API e falha fechado com códigos sanitizados para input, contrato ou destino inválido.
- [x] AC7: Testes executam o walkthrough em diretório temporário como checkout limpo, validam links/caminhos locais, contratos, determinismo, imutabilidade dos inputs, ausência de PII/segredos/paths absolutos e a regra de não autoabrir HTML.

## Tasks

- [x] Confirmar baseline `aa1745d`, W2 concluída, autorização W3.1 e ausência de PR aberto cobrindo `17.W3.1`.
- [x] Ler integralmente epic, state, contratos/stories W2 e CLIs consumidores antes de definir a fronteira.
- [x] Rematerializar a story mínima em contrato completo e mover `Ready` para `InProgress` antes do código.
- [x] Congelar REDs de módulo, três semanas, diagnóstico inconclusivo, checkout limpo, links e sanitização.
- [x] Implementar somente dentro da File List aprovada.
- [x] Executar testes focais, adjacentes, walkthrough e validação de distribuição.
- [x] Registrar evidência sanitizada e mover para `InReview`; epic-state permanece reservado ao fan-in `@devops`.

## File List

- `aula-04/README.md`
- `aula-04/GUIA-DO-ALUNO.html`
- `aula-04/templates/weekly-ledger.yaml`
- `aula-04/exemplos/projeto-tres-semanas/README.md`
- `aula-04/exemplos/projeto-tres-semanas/weekly-panels.jsonl`
- `aula-04/exemplos/projeto-tres-semanas/source-observations.json`
- `aula-04/exemplos/projeto-tres-semanas/previous-decision.json`
- `aula-04/exemplos/projeto-tres-semanas/expected-walkthrough.json`
- `scripts/run-aula-04-walkthrough.mjs`
- `scripts/run-aula-04-walkthrough.test.mjs`
- `README.md`
- `aula-03/docs/conexao-aula-04.md`
- `docs/stories/epic-17/STORY-17.W3.1-aula-04-student-module.md`
- `docs/stories/epic-17/evidence/STORY-17.W3.1.md`

Esta lista é uma allowlist exata. Não há `**`, diretório implícito ou autorização para editar contratos/CLIs W2, mirrors, `epic-17-state.json`, app privado ou arquivo fora dela. Qualquer expansão exige rematerialização anterior à mudança.

## Dev Notes

- O runner compõe funções públicas já aprovadas: validação de WeeklyPanel, builder do ledger, reader histórico, reconciliador e diagnóstico. Ele não redefine seus contratos nem deriva métricas.
- O exemplo usa apenas IDs opacos e referências públicas sintéticas. Nenhum dado real, nome, contato, documento, token ou payload de comprador é permitido.
- A reconciliação divergente demonstra incerteza; nenhuma fonte é eleita como verdade. O diagnóstico inconclusivo preserva zero alavancas e nova decisão humana pendente.
- Saídas vivem no diretório fornecido pelo aluno. O runner não escreve no exemplo, não abre HTML/browser, não usa rede e não altera plataforma.
- `deploy_type: none`: toda prova é local, redistribuível e determinística.

## Gates

- RED deve falhar pela ausência do runner/módulo, nunca por fixture inválida ou dependência privada.
- GREEN exige três semanas distintas, outputs contratuais e resultado inconclusivo byte-equivalente em duas execuções limpas.
- Links relativos e instruções de abertura precisam passar validação automatizada nos três sistemas documentados.
- File List real deve permanecer subconjunto exato da allowlist.

## Stop Conditions

- Qualquer etapa exigir Studio, browser automatizado, API, rede, credencial ou serviço privado.
- Algum artefato precisar copiar texto bruto, PII ou segredo para provar o fluxo.
- O diagnóstico deixar de ser inconclusivo, sugerir alavanca ou executar decisão.
- O walkthrough escrever fora do diretório de saída explicitamente informado.
- A implementação exigir mudança em contrato W2 ou expansão não rematerializada da allowlist.

## Validação executada

- `node --test scripts/run-aula-04-walkthrough.test.mjs`
- `node --test --test-concurrency=1 scripts/run-aula-04-walkthrough.test.mjs scripts/read-aula-04-history.test.mjs scripts/reconcile-aula-04-sources.test.mjs scripts/diagnose-aula-04-decision.test.mjs`
- `node --test --test-concurrency=1 data/contracts/fixtures/project-brief/project-brief-contract.test.mjs scripts/*.test.mjs scripts/lib/skill-readiness.test.mjs services/meta-ads/index.test.js`
- RED/GREEN adversarial para PII recursiva e contenção lexical/canônica/simbólica do destino.
- Walkthrough em dois diretórios temporários vazios e comparação byte a byte.
- `git diff --check aa1745d..HEAD` e auditoria da File List.

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes:
  - "Baseline aa1745d, W2 concluída, W3.1 Ready/authorized e PR coverage vazio confirmados em 2026-07-15."
  - "Story rematerializada antes do código com allowlist exata, contratos W2 consumidores, gates e stop conditions."
  - "RED bc90b11 congelou sete grupos; 0/7 passaram antes do módulo, runner, exemplo e template existirem."
  - "GREEN beb163a compõe somente as funções públicas W2 e entrega README, guia HTML, template, exemplo e seis outputs determinísticos."
  - "RED 579e2cb fechou confiança no expected e texto sensível em decisão; GREEN 94617b3 exige invariantes inconclusivo/zero alavancas/pending e bloqueia republicação sensível."
  - "QG3 rodada 1 FAIL 76 foi reproduzido com REDs: PII compacta atravessava e destino igual/descendente não era fechado antes da escrita."
  - "GREEN 224b085 cobre telefone, CPF e CNPJ compactos/pontuados sem eco, preserva IDs opacos alfanuméricos e rejeita destino igual, descendente ou symlink-resolvido, inclusive com leaf ausente."
  - "QG3 rodada 2 FAIL reproduziu dois telefones compactos ainda publicáveis: fixo com DDD em 10 dígitos e celular internacional em 13 dígitos."
  - "GREEN 7beb539 amplia apenas o padrão numérico delimitado para 10/11 e 13/14 dígitos; campos de medição continuam isentos e IDs opacos alfanuméricos canônicos seguem aceitos."
  - "Focal 10/10, adjacente W2 47/47 e gate Node completo 162/162 passaram; erros não ecoam valores e inputs permanecem imutáveis."
  - "QG3 rodada 3 independente aprovou o HEAD 20249bd com PASS 98/100, confiança 0.99, matriz adversarial 24/24 e zero findings."
file_list:
  - "aula-04/README.md"
  - "aula-04/GUIA-DO-ALUNO.html"
  - "aula-04/templates/weekly-ledger.yaml"
  - "aula-04/exemplos/projeto-tres-semanas/README.md"
  - "aula-04/exemplos/projeto-tres-semanas/weekly-panels.jsonl"
  - "aula-04/exemplos/projeto-tres-semanas/source-observations.json"
  - "aula-04/exemplos/projeto-tres-semanas/previous-decision.json"
  - "aula-04/exemplos/projeto-tres-semanas/expected-walkthrough.json"
  - "scripts/run-aula-04-walkthrough.mjs"
  - "scripts/run-aula-04-walkthrough.test.mjs"
  - "README.md"
  - "aula-03/docs/conexao-aula-04.md"
  - "docs/stories/epic-17/STORY-17.W3.1-aula-04-student-module.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.1.md"
```

## QA Results

```yaml
quality_gate_report:
  round: 1
  verdict: "FAIL"
  score: 76
  confidence: 0.98
  blockers:
    - "Telefone, CPF e CNPJ não fazem parte do detector recursivo de conteúdo sensível; uma hipótese contendo 11987654321 atravessa o runner e é republicada no decision-outcome-request.json."
    - "A guarda do destino rejeita apenas igualdade lexical com o exemplo; um diretório vazio descendente do exemplo é aceito e recebe os seis artefatos, alterando a árvore-fonte."
  evidence:
    - "scripts/run-aula-04-walkthrough.mjs:27-34,109-125,140-142,156-162,187-200"
    - "scripts/run-aula-04-walkthrough.test.mjs:165-176,189-195,214-225"
  required_remediation:
    - "Congelar REDs para telefone/CPF/CNPJ em input e output, sem ecoar o valor nos erros."
    - "Rejeitar destino igual, descendente ou symlink-resolvido dentro do exemplo e provar imutabilidade da árvore-fonte."
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "8a922aef72afd43c652600812a9d30e81eb8cb29"
remediation_handoff_round_2:
  requested_round: 2
  implementation_head: "224b085"
  status: "InReview"
  evidence:
    - "RED focal 0/2 antes da implementação: PII compacta retornava sucesso; destino igual retornava OUTPUT_NOT_EMPTY."
    - "GREEN focal 9/9, adjacente W2 46/46 e full Node 161/161."
    - "Seis formatos PII falham sem eco; IDs opacos alfanuméricos de 11/14 caracteres passam."
    - "Destino igual, descendente, symlink lexical/real e leaf ausente falham sem escrita; snapshots da árvore permanecem idênticos."
quality_gate_report_round_2:
  round: 2
  verdict: "FAIL"
  blocker:
    - "Telefone fixo compacto com DDD (10 dígitos) e celular internacional compacto (13 dígitos) atravessavam o detector e eram republicados nos artefatos."
  required_remediation:
    - "Adicionar RED explícito para ambos os comprimentos, fechar sem eco e preservar métricas e IDs opacos alfanuméricos canônicos."
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "3a05a5a38fadf4ed4e79a45e6e3cb8e32a1e19f7"
remediation_handoff_round_3:
  requested_round: 3
  implementation_head: "7beb539"
  status: "InReview"
  evidence:
    - "RED focal 0/1: os dois probes retornavam sucesso e escreviam os seis artefatos."
    - "GREEN focal 10/10, adjacente W2 47/47 e full Node 162/162."
    - "Telefones compactos de 10 e 13 dígitos falham com código sanitizado, sem eco e sem output."
    - "IDs opacos alfanuméricos de 10/11/13/14 caracteres e campos contratuais de medição permanecem aceitos."
quality_gate_report_round_3:
  round: 3
  verdict: "PASS"
  score: 98
  confidence: 0.99
  blockers: []
  findings: []
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "20249bda5dab9fb7a1b0d7a3cfc3570dcb0a5f2d"
  evidence:
    - "Matriz adversarial independente 24/24, focal 10/10, adjacente 47/47 e full Node 162/162."
    - "File List exata 14/14, node --check e git diff --check passaram em worktree limpa."
```

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @dev | Preflight e leitura integral concluídos; story rematerializada de `Ready` para `InProgress` antes do código. |
| 2026-07-15 | @dev | RED/GREEN entregou módulo, exemplo de três semanas, walkthrough local e documentação multiplataforma. |
| 2026-07-15 | @dev | Trust boundaries endurecidas; 159/159 testes Node verdes e story movida para `InReview`. |
| 2026-07-15 | @architect | QG3 rodada 1 falhou: telefone republicável e destino descendente do exemplo atravessam os guards atuais. |
| 2026-07-15 | @dev | Rodada 1 remediada em `224b085`: PII shaped recursiva e contenção canônica/simbólica cobertas; 161/161 testes verdes e story devolvida a `InReview` para QG3 rodada 2. |
| 2026-07-15 | @architect | QG3 rodada 2 falhou: telefones compactos de 10 e 13 dígitos ainda eram republicáveis. |
| 2026-07-15 | @dev | Rodada 2 remediada em `7beb539`: RED conjunto cobre os dois formatos, 162/162 testes verdes e story devolvida a `InReview` para QG3 rodada 3. |
| 2026-07-15 | @architect | QG3 rodada 3 aprovado em `20249bd`: PASS 98/100, confiança 0.99, matriz independente 24/24 e zero findings; story movida para `Done`. |
