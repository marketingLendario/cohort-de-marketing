---
status: Done
story_id: "17.W3.2"
title: "Gate público da Aula 4"
epic: 17
wave: "W3"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 8h
deploy_type: none
appetite: 1d
hill_phase: downhill
confidence_level: know-how
involves_ui: false
task_mode: VALIDAR
cli: codex
model: opus
executor: "@qa"
quality_gate: "@architect"
repo_target: "marketingLendario/cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["17.W3.1"]
consumes_artifacts_of: ["17.W1.1", "17.W1.2", "17.W2.1", "17.W2.2", "17.W2.3", "17.W3.1"]
entity_input:
  entity_type: "Aula04StudentWalkthroughV1"
  description: "Contratos W1/W2 e módulo W3.1 integrados, com exemplo sintético de três semanas, decisão histórica aprovada e próximo sign-off pendente."
  status_expected: "implemented-and-locally-verified"
entity_output:
  entity_type: "Aula04PublicReleaseGateV1"
  description: "Gate local reproduzível que prova compatibilidade Aula 3, walkthrough, contratos, mirrors, distribuição e privacidade antes do fan-in."
  status_expected: "release-ready-for-independent-signoff"
artifact_contract:
  type: "release-gate-evidence"
  path: "docs/stories/epic-17/evidence/STORY-17.W3.2.md"
  release_manifest: "docs/releases/aula-04-data-loop-v1.md"
  required_signoffs: ["@po", "@qa", "@architect"]
touched_paths:
  - "scripts/aula-04-release-gate.test.mjs"
  - ".claude/skills/_shared/squad-trafego/source-lock.json"
  - ".agents/skills/_shared/squad-trafego/source-lock.json"
  - "docs/releases/aula-04-data-loop-v1.md"
  - "docs/stories/epic-17/STORY-17.W3.2-aula-04-public-release-gate.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.2.md"
  - "docs/stories/epic-17/EPIC-17-EVIDENCE.md"
affected_paths:
  - "scripts/aula-04-release-gate.test.mjs"
  - ".claude/skills/_shared/squad-trafego/source-lock.json"
  - ".agents/skills/_shared/squad-trafego/source-lock.json"
  - "docs/releases/aula-04-data-loop-v1.md"
  - "docs/stories/epic-17/STORY-17.W3.2-aula-04-public-release-gate.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.2.md"
  - "docs/stories/epic-17/EPIC-17-EVIDENCE.md"
fan_in_paths:
  - "docs/stories/epic-17/epic-17-state.json"
---

# STORY-17.W3.2 - Gate público da Aula 4

## Status

Done — QG independente `@architect` aprovado com `PASS 99/100`, confiança `0.99` e zero findings.

## Story

**Como** mantenedor da distribuição pública do Cohort de Marketing

**Quero** executar um gate local e reproduzível sobre a Aula 4 integrada

**Para que** contratos, exemplo, compatibilidade com a Aula 3, privacidade e decisão humana permaneçam comprováveis antes de qualquer fan-in ou publicação.

## Dependências e baseline

- Baseline autorizada: `wave/gate-0/public-baseline@d571775af4f8a9998af3d4c5d8c241e0033295be`.
- `17.W3.1`: `Done`, QG3 rodada 3 `PASS 98/100`, integrada localmente.
- Branch/worktree: `wave/17-w3/story-17.W3.2` em `.claude/worktrees/story-17.W3.2`.
- PR coverage em 2026-07-15: nenhum PR aberto cobre `17.W3.2` ou o gate público da Aula 4.

## Acceptance Criteria

- [x] AC1: A primeira linha do exemplo W3.1 é um `WeeklyPanel 1.0.0` válido e compatível com o handoff da Aula 3: fonte opaca rastreável, janela literal, selo, confirmação humana e decisão `pending` são preservados na entrada do ledger sem inferência.
- [x] AC2: Um cenário de uma semana com métrica `nao_fornecido` preserva `value: null`, janela nula e confirmação falsa no `WeeklyLedger 1.1.0`; fonte, janela ou confirmação inválida falha fechado nos gates W1/W2 existentes.
- [x] AC3: O walkthrough público executa as três semanas sintéticas e produz exatamente seis artefatos; a decisão histórica permanece `approved`, o novo diagnóstico permanece `pending`, inconclusivo e sem alavanca ou mutação.
- [x] AC4: Validators de Aula 4, catálogo, mirrors canônico/Codex e suites W1/W2/W3 passam sem alteração nos validators, contratos, skills ou exemplos integrados.
- [x] AC5: O gate de distribuição valida links relativos, ausência de integração externa e File List exata; o scan de privacidade não encontra segredo, credencial, email, telefone/CPF/CNPJ shaped, path absoluto de máquina, payload privado ou arquivo de projeto real nos materiais liberáveis e outputs.
- [x] AC6: `docs/releases/aula-04-data-loop-v1.md` registra contratos/versões, compatibilidade Aula 3, comandos, limitações e rollback local, sem declarar push, publicação ou deploy.
- [x] AC7: Evidência sanitizada registra checkout limpo, contagens, validators, mirrors, walkthrough, scans e os vereditos sequenciais `@po READY`, `@qa PASS técnico` e `@architect PASS 99/100`.

## Arquitetura do gate

### Estado atual

```text
Aula 3 handoff
  -> WeeklyPanel 1.0.0
  -> WeeklyLedger 1.1.0
  -> HistoricalMetricsReading 1.0.0
  -> SourceReconciliation 1.0.0
  -> DecisionOutcomeDiagnosis 1.0.0
  -> decisão histórica approved + próxima decisão pending
```

Os componentes acima já estão implementados e aprovados. Esta story adiciona prova de release e documentação; não cria outro validator, contrato, conversor ou motor. O primeiro GREEN revelou dois hashes obsoletos nos source-locks canônico/mirror após mudanças já integradas de W2.1/W2.2. A remediação autorizada calibra somente esses quatro valores de hash, sem alterar skills ou validator.

### Opções consideradas

| Opção | Descrição | Trade-off | Decisão |
|---|---|---|---|
| A | Novo teste de release compõe APIs/CLIs existentes, reutiliza o exemplo W3.1 e calibra metadata de lock somente quando drift integrado é provado | Uma prova adicional e metadata espelhada, sem mudar runtime | Escolhida |
| B | Alterar `validate-aula-04-contracts.mjs` e `validate-skill-catalog.mjs` | Acopla release a validators já aprovados e amplia risco | Rejeitada |
| C | Gate somente documental | Menor delta, mas não prova Aula 3 → Aula 4 nem privacidade executável | Rejeitada |

### Componentes e interfaces

| Componente | Entrada | Saída/observação | Mutabilidade |
|---|---|---|---|
| `aula-04-release-gate.test.mjs` | fixtures públicas, exemplo W3.1, CLIs existentes | assertions Node determinísticas | somente temporários fora do repo |
| validators existentes | contratos e catálogo versionados | exit code/JSON ou `OK` | read-only |
| source-lock canônico/mirror | hashes dos skills já integrados em W2.1/W2.2 | paridade e catálogo verificáveis | quatro hashes autorizados; skills imutáveis |
| walkthrough W3.1 | exemplo público + diretório temporário vazio | seis artefatos públicos | somente output temporário |
| release manifest/evidence | versões e resultados sanitizados | documentação revisável | paths allow-listed |

### Decisão humana

“Até decisão registrada” significa que o input preserva a decisão histórica estruturada com `humanDecision.status: approved`, enquanto o diagnóstico gera uma nova decisão `pending`. O gate não registra automaticamente a próxima decisão, não altera a histórica e não executa mutação externa.

### Configuração e acoplamento

- Não há configuração mutável nova: caminhos são derivados de `import.meta.url`, artefatos são públicos/versionados e outputs usam `os.tmpdir()`.
- Nenhuma rede, Studio, API, browser automatizado, credencial ou serviço privado participa do gate.
- Skills, validators, contratos e runtime W1/W2/W3 são dependências read-only. Somente os dois arquivos de metadata source-lock espelhados podem mudar nos hashes autorizados.

## Test Strategy

- RED focal: ausência de `scripts/aula-04-release-gate.test.mjs` deve falhar antes de qualquer correção de runtime.
- Compatibilidade: primeira semana W3.1 e fixture `weekly-panel.metric-not-provided.valid.json` atravessam validator/builder sem perder fonte, janela, selo, valor nulo ou confirmação.
- E2E: runner gera seis outputs e preserva `approved -> pending` sem mutação.
- Distribuição: catálogo/mirrors, links locais, ausência de rede e arquivos liberáveis somente.
- Privacidade: probes positivos existentes permanecem verdes; scan negativo cobre materiais/outputs com padrões explícitos e não registra valores sensíveis na evidência.
- Regressão: suites Aula 4 adjacentes e gate Node completo controlado.

## Tasks

- [x] Confirmar baseline exata, W3.1 `Done`, autorização, worktree isolado e PR coverage vazio.
- [x] Mapear arquitetura, opções, contratos consumidores, riscos, testes e File List antes do código; registrar `@po READY`.
- [x] Congelar RED focal do release gate antes do GREEN.
- [x] Reproduzir RED de catálogo: hashes de `leitor-de-metricas` e `diagnosticador` divergiam nos dois source-locks apesar de mirrors byte-idênticos.
- [x] Implementar o teste de gate e calibrar somente os quatro hashes autorizados nos locks canônico/mirror; validators/runtime/skills permanecem read-only.
- [x] Produzir release manifest e evidência sanitizada dentro da File List.
- [x] Executar focal, adjacente, full Node, checkout limpo, walkthrough, scans, `git diff --check` e auditoria da File List.
- [x] Registrar `@qa PASS técnico` e mover para `InReview`; `@architect` permanece independente.
- [x] Não editar `epic-17-state.json`; transição/fan-in é exclusiva de `@devops` após QG.

## File List

- `scripts/aula-04-release-gate.test.mjs`
- `.claude/skills/_shared/squad-trafego/source-lock.json`
- `.agents/skills/_shared/squad-trafego/source-lock.json`
- `docs/releases/aula-04-data-loop-v1.md`
- `docs/stories/epic-17/STORY-17.W3.2-aula-04-public-release-gate.md`
- `docs/stories/epic-17/evidence/STORY-17.W3.2.md`
- `docs/stories/epic-17/EPIC-17-EVIDENCE.md`

Esta é a allowlist exata do executor. Validators, schemas, conteúdo das skills, exemplos, materiais W3.1 e `epic-17-state.json` são read-only. Nos dois source-locks, somente os hashes de `leitor-de-metricas/SKILL.md` e `diagnosticador/SKILL.md` podem mudar e os arquivos devem permanecer byte-idênticos. O state é reservado ao fan-in `@devops`; qualquer outro path exige rematerialização anterior à mudança.

## Validation Matrix

| Gate | Comando/prova | Resultado exigido |
|---|---|---|
| Focal | `node --test scripts/aula-04-release-gate.test.mjs` | compatibilidade, E2E, distribuição e privacidade verdes |
| Aula 4 | suites validator/ledger/history/reconciliation/diagnosis/walkthrough/release | zero falhas |
| Validators | `validate-aula-04-contracts.mjs` e `validate-skill-catalog.mjs` | exit 0; arquivos imutáveis |
| Source lock | SHA-256 atual dos dois skills + `cmp` dos locks/mirrors | hashes exatos e byte-equivalência |
| Walkthrough | runner sobre exemplo em output temporário vazio | seis outputs; `approved -> pending` |
| Full Node | matriz pública controlada | zero regressão |
| Checkout | worktree temporário detached no HEAD | mesmas contagens; status limpo |
| Privacy | scan de materiais liberáveis e outputs | zero achados; sem eco |
| File List | diff NUL-safe contra `d571775` | todo path pertence à allowlist |

## Riscos e mitigações

| Risco | Severidade | Mitigação |
|---|---|---|
| Usar fixture W1.1 com fonte textual no E2E | Alta | Reutilizar primeira semana W3.1 com `ref:<kind>:<id>`; fixture antiga fica apenas no validator |
| Interpretar `pending` como decisão ausente | Alta | Provar decisão histórica `approved` no request e nova decisão `pending` no diagnóstico |
| Scan ingênuo gerar falso positivo em métricas/IDs opacos | Média | Testar outputs reais e padrões contextuais já aprovados; evidência não inclui valores dos probes |
| Gate corrigir runtime durante validação | Alta | Stop imediato; validators/runtime permanecem read-only e correção volta à story proprietária |
| Lock obsoleto mascarar skill integrada | Alta | Calibrar somente hashes provados de W2.1/W2.2 nos dois locks e parar diante de qualquer drift adicional |
| Checkout da integração conter worktrees operacionais | Média | Provar em worktree detached temporária criada do HEAD da story e removê-la ao final |

## Stop Conditions

- Qualquer teste exigir correção em validator, contrato, skill, exemplo ou runtime fora da File List, ou revelar drift além dos dois hashes autorizados.
- Alguma fonte não rastreável virar série histórica ou métrica ausente ganhar valor/janela/confirmação.
- Decisão histórica for reescrita, próxima decisão deixar de ser `pending` ou surgir alavanca/mutação automática.
- Evidência depender de segredo, PII, path absoluto, arquivo de projeto real, Studio, API, rede ou serviço privado.
- Validator, mirror, distribuição, walkthrough, privacy scan ou checkout limpo falhar.
- Sign-off `@architect` ser autoatribuído pelo executor.

## Vereditos

### Product Owner

- Reviewer: `@po`
- Veredito: `READY`
- Escopo: valor, interpretação da decisão humana, allowlist e critérios executáveis alinhados.
- Expansão controlada: dois source-locks adicionados após RED do catálogo e autorização explícita; conteúdo dos skills/validator permanece fora do escopo.
- Baseline: `d571775af4f8a9998af3d4c5d8c241e0033295be`.

### QA executor

- Reviewer: `@qa`
- Veredito: `PASS técnico`.
- Focal: `4/4`; Aula 4: `84/84`; full Node: `166/166`.
- Validators: `7/7`; mirrors explícitos: `3/3`; checkout e privacy scan: `PASS`.
- Implementação avaliada: `01059ba`.

### Architect quality gate

- Reviewer: `@architect`
- Veredito: `PASS 99/100`.
- Confiança: `0.99`.
- Findings/blockers: nenhum.
- HEAD avaliado: `2a054a05638826cb931b2f8dc21bc35d15961baf`.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Preflight confirmado, arquitetura/allowlist materializadas e story movida de `Ready` para `InProgress`. |
| 2026-07-15 | @qa | RED do catálogo encontrou somente dois hashes obsoletos; skills canônico/mirror permanecem byte-idênticos. |
| 2026-07-15 | @po | Expansão mínima autorizada e rematerializada para calibrar somente os dois source-locks espelhados. |
| 2026-07-15 | @qa | Gate técnico aprovado: focal 4/4, Aula 4 84/84, full Node 166/166, validators/mirrors/scans verdes; story movida para `InReview`. |
| 2026-07-15 | @architect | QG independente aprovado: PASS 99/100, confiança 0.99, zero findings; story movida para `Done`. |

## QA Results

```yaml
executor_gate:
  reviewer: "@qa"
  verdict: "PASS técnico"
  implementation_head: "01059ba"
  focal: "4/4"
  aula_04: "84/84"
  full_node: "166/166"
  validators: "7/7"
  mirrors: "3/3"
  clean_checkout: "PASS"
  privacy_distribution: "PASS"
quality_gate:
  reviewer: "@architect"
  verdict: "PASS"
  score: 99
  confidence: 0.99
  findings: []
  blockers: []
  reviewed_head: "2a054a05638826cb931b2f8dc21bc35d15961baf"
```

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes:
  - "Baseline d571775, W3.1 Done, autorização e PR coverage vazio confirmados."
  - "Contrato completo/PO READY materializados em 1402b2f antes do RED focal."
  - "RED inicial falhou por teste ausente; GREEN parcial revelou somente source-lock drift de W2.1/W2.2."
  - "Allowlist expandida em 3dd123c antes de calibrar os dois locks espelhados; skills e validator permaneceram imutáveis."
  - "GREEN 01059ba entregou quatro grupos executáveis e catálogo 31 skills/41 edges."
  - "Focal 4/4, Aula 4 84/84, full Node 166/166, sete validators, três mirrors, checkout e scans passaram."
  - "QG independente aprovou o HEAD 2a054a0 com PASS 99/100, confiança 0.99 e zero findings; story encerrada em Done."
file_list:
  - "scripts/aula-04-release-gate.test.mjs"
  - ".claude/skills/_shared/squad-trafego/source-lock.json"
  - ".agents/skills/_shared/squad-trafego/source-lock.json"
  - "docs/releases/aula-04-data-loop-v1.md"
  - "docs/stories/epic-17/STORY-17.W3.2-aula-04-public-release-gate.md"
  - "docs/stories/epic-17/evidence/STORY-17.W3.2.md"
  - "docs/stories/epic-17/EPIC-17-EVIDENCE.md"
```
