---
status: Done
story_id: "9.W3.1"
title: "Evidência de usabilidade e métricas do piloto"
epic: 9
wave: "W3"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: high
involves_ui: false
executor: "@analyst"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W2.3"]
consumes_artifacts_of: ["9.W2.3"]
file_scope: exclusive
touched_paths:
  - "docs/qa/epic-9-field-usability.md"
  - "data/pilots/epic-9-field-observation.schema.json"
---

# STORY-9.W3.1 - Evidência de usabilidade e métricas do piloto

## Acceptance Criteria

1. Pelo menos um operador-alvo executa o roteiro sem assistência de desenvolvimento.
2. Registro contém tempos, hesitações, bloqueios, recuperações e resultado por etapa.
3. Nenhuma PII, senha, token ou conteúdo privado entra na evidência.
4. Achados são separados em blocker, correção pré-go-live e backlog.
5. Métricas não são convertidas em promessa antes do reality-check.

## Tasks

- [x] Preparar roteiro e consentimento de observação.
- [x] Observar execução proxy autorizada e registrar evidência estruturada.
- [x] Classificar achados e recomendar gate.

## File List

| Arquivo | Operação |
|---|---|
| `data/pilots/epic-9-field-observation.schema.json` | ADD |
| `data/pilots/epic-9-field-observation-proxy-2026-07-10-01.json` | ADD |
| `docs/qa/epic-9-field-usability.md` | ADD |
| `docs/stories/epic-9/STORY-9.W3.1-field-usability-evidence.md` | MODIFY |

## Analyst Record

### Infraestrutura preparada

- Protocolo de recrutamento, consentimento, não intervenção, medição por etapa,
  sanitização, classificação e reality-check documentado no relatório de campo.
- JSON Schema Draft 2020-12 fail-closed separa o estado `pending` de uma sessão
  `completed` e proíbe PII, segredos, conteúdo privado e gravação bruta.
- Formulário pendente contém as sete etapas da jornada e nenhum participante,
  sessão, tempo, evidência, achado ou conclusão humana inventada.

### Decisão do accountable

O AC1 originalmente exigia uma pessoa real do público-alvo operando sem
assistência. Essa sessão humana não foi realizada e não é apresentada como se
tivesse sido. Em 2026-07-10, o accountable autorizou explicitamente o Codex a
executar todo o roteiro como operador-proxy e a usar essa prova como gate
operacional. A observação do primeiro aluno real passa a ser monitoramento
pós-ship, sem bloquear o release local.

### Rodada proxy concluída

- Sessão `field-2026-07-10-01` executada pelo Codex como operador-proxy, com
  assistência explicitamente registrada e gate `conditional-go`.
- As sete etapas passaram em 263 segundos totais; Playwright direto fechou em
  `1 passed (4.4m)` com desktop/mobile equivalentes e zero erro de console, rede
  ou sobreposição.
- O Zelador recusou corretamente evidência insuficiente, e retry/cancelamento e
  recuperação foram comprovados antes da execução aceita.
- F-01 e F-02, ambos pre-go-live, foram corrigidos e retestados. F-03 corrigiu a
  estabilidade da captura visual.
- O schema foi ampliado fail-closed: uma sessão `codex-operator-proxy` nunca pode
  registrar `go` e exige `developmentAssistance: provided`.
- A matriz final adicionou onboarding limpo, ciclo real, operação semanal,
  segurança, pgTAP, launcher, regressão legada e QA visual desktop/mobile.
- O verdict consolidado está em `docs/qa/epic-9-go-live-gate.md`.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @analyst | Preparados schema, protocolo, formulário, política de privacidade, classificação e gate; story mantida InProgress aguardando observação real. |
| 2026-07-10 | @analyst | Executada rodada proxy completa, corrigidos três achados, validado registro sanitizado e mantido AC1 pendente para operador-alvo humano. |
| 2026-07-11 | @qa/@po | Accountable autorizou equivalência operacional do proxy; matriz final passou e observação humana foi convertida em monitoramento pós-ship. |
