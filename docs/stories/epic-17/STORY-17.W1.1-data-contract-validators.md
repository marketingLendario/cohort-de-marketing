# STORY-17.W1.1 - Validadores dos contratos de campanha e semana

## Status

Draft

## Dependências

- PUB-16.W1.1

## Objetivo

Transformar os schemas existentes de CampaignPlan e WeeklyPanel em contratos executáveis com fixtures, versionamento e mensagens de erro úteis.

## Critérios de aceite

- [ ] Schemas rejeitam propriedades extras e estados/transições inválidos.
- [ ] Fixtures cobrem plano, painel, métricas ausentes e decisões pendentes.
- [ ] Validators CLI retornam JSON estável e exit codes documentados.
- [ ] Migração futura é prevista sem aceitar versão desconhecida silenciosamente.
- [ ] Nenhum valor de métrica é inferido durante validação.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/contracts/campaign-plan.v1.schema.json`
- `data/contracts/weekly-panel.v1.schema.json`
- `data/contracts/fixtures/aula-04/**`
- `scripts/validate-aula-04-contracts.mjs`
- `scripts/validate-aula-04-contracts.test.mjs`
- `docs/stories/epic-17/**`

## Validação

- JSON Schema draft 2020-12.
- Fixtures válidas e inválidas.
- Snapshots de erro e exit codes.

## Stop conditions

- Schema precisar duplicar ProjectBrief.
- Validação alterar ou completar dados do operador.

