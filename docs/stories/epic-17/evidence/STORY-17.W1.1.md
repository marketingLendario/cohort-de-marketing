# Evidência — Story 17.W1.1

## Escopo e proveniência

- Baseline da integração pública: `4c8a605ac86f8e994e763a9b3eb34ea4f3e54eca`.
- Dependência `16.W1.1`: `Done`; `data/contracts/project-brief.v1.schema.json` presente no baseline.
- Cobertura remota: a consulta de PRs abertos por `17.W1.1`, `campaign-plan`, `weekly-panel` e `aula-04-contract` retornou lista vazia antes do desenvolvimento.
- Escopo privado: nenhum serviço, ID, path ou contrato do Studio é necessário para validar os documentos públicos.

## TDD

- RED: commit `b82b0d7b1f6553662030c9165e5b55520ef12d6e` congelou cinco fixtures e o contrato observável da CLI. Resultado inicial: 8 testes, 7 falhas esperadas e 1 passagem incidental de imutabilidade porque a CLI ainda não existia.
- GREEN: commit `2c8b4b67999cbf4b4466704a3d60ba8374c01cb8` implementou os schemas fechados e a CLI determinística.

## Matriz de fixtures

| Fixture | Contrato | Resultado | Exit code | Prova principal |
|---|---|---:|---:|---|
| `campaign-plan.valid.json` | CampaignPlan v1 | válido | 0 | Estrutura conhecida, versionada e fechada. |
| `campaign-plan.additional-property.invalid.json` | CampaignPlan v1 | inválido | 1 | `studioProjectId` rejeitado por `additionalProperties`. |
| `weekly-panel.valid.json` | WeeklyPanel v1 | válido | 0 | Transição explícita `draft -> reading_ready`. |
| `weekly-panel.invalid-transition.json` | WeeklyPanel v1 | inválido | 1 | Transição terminal `closed -> draft` rejeitada com erro estável. |
| `weekly-panel.metric-not-provided.valid.json` | WeeklyPanel v1 | válido | 0 | `nao_fornecido` conserva `value`, `premise` e `attributionWindow` como `null`. |

## Contratos observáveis

- Documentos declaram `contract` e `schemaVersion`; a CLI não infere o tipo pelo nome do arquivo nem pela presença de campos.
- Versão diferente de `1.0.0` falha com `keyword: version` e exige migração explícita.
- A tabela de transições é literal: `null -> draft -> reading_ready -> diagnosed -> decided -> closed`; `closed` não possui saída.
- O envelope de stdout mantém a ordem `contract`, `version`, `file`, `valid`, `errors` e termina com newline.
- Erros são normalizados e ordenados por `path`, `keyword` e `message` antes da serialização.
- Exit codes: `0` válido; `1` contrato/versão/transição inválidos; `2` uso, leitura ou parse de JSON inválidos.
- AJV roda com coerção, defaults e remoção de propriedades desativados.

## Verificação

Comando focal:

```text
node --test scripts/validate-aula-04-contracts.test.mjs
8 testes; 8 passaram; 0 falharam
```

Suíte Node adjacente:

```text
node --test scripts/project-artifact-index.test.mjs scripts/project-brief-io.test.mjs scripts/skill-surface-data-driven.test.mjs scripts/validate-aula-04-contracts.test.mjs scripts/lib/nucleo-from-coleta.test.mjs data/contracts/fixtures/project-brief/project-brief-contract.test.mjs
65 testes; 65 passaram; 0 falharam
```

Validação estrutural:

```text
git diff --check
jq -e . data/contracts/campaign-plan.v1.schema.json
jq -e . data/contracts/weekly-panel.v1.schema.json
jq -e . data/contracts/fixtures/aula-04/*.json
```

Todos passaram. O teste de imutabilidade copia e valida as cinco fixtures, compara os buffers antes/depois e confirma igualdade byte a byte inclusive nos casos inválidos.

## Quality Gate

- Revisor: `@architect`.
- HEAD revisado: `d9ef444ee41ab6e785f02a0e5aa4d951e768abb6`.
- Veredito: `PASS`.
- Score: `98/100`; confiança: `0,97`.
- Probes: `42/42` passaram.
- Findings: zero.
- Reserva: 2 pontos de excelência, sem falha funcional nem ação corretiva pendente.

## Estado da entidade

`Aula04ContractBaseline/project-brief-v1-frozen` foi transformado em `Aula04ExecutableContracts/validated`: os três casos positivos validam, os dois negativos falham fechado e nenhuma métrica é inferida, preenchida ou normalizada.
