# STORY-17.W1.2 - Ledger multi-semana com proveniência

## Status

Draft

## Dependências

- 17.W1.1

## Objetivo

Definir um ledger append-only que conecte semana, campanha, métricas, fontes, decisões e resultados observados.

## Critérios de aceite

- [ ] Cada registro referencia projectId, campaignId, weekStart e revisão.
- [ ] Métrica carrega selo, fonte, janela, premissa e confirmação humana.
- [ ] Revisão nova não sobrescreve evidência aprovada anterior.
- [ ] Duplicata idempotente é reconhecida por identidade e hash; conflito falha fechado.
- [ ] O ledger pode ser consultado sem carregar conteúdo bruto de artefatos.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/contracts/weekly-ledger.v1.schema.json`
- `data/contracts/weekly-panel.v1.schema.json`
- `scripts/build-weekly-ledger.mjs`
- `scripts/build-weekly-ledger.test.mjs`
- `aula-04/fixtures/**`
- `docs/stories/epic-17/**`

## Validação

- Duas ou mais semanas por campanha.
- Idempotência e conflito de revisão.
- Métrica sem fonte permanece inválida ou explicitamente ausente.

## Stop conditions

- Modelo exigir reescrever semanas históricas.
- Chave de deduplicação depender apenas de filename.

