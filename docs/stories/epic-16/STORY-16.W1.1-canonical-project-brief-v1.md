# STORY-16.W1.1 - Contrato canônico ProjectBrief v1

## Status

Draft

## Dependências

- Gate 0

## Objetivo

Congelar um único contrato versionado para projeto, com envelope persistente e migração explícita do documento standalone 0.1.0.

## Critérios de aceite

- [ ] O schema v1 define identidade, revisão, status, dados e proveniência sem duplicar a semântica dos 120 campos.
- [ ] A migração 0.1.0 para v1 é determinística, idempotente e preserva `not_applicable`, `pending_confirmation` e origem de campo.
- [ ] Versão desconhecida, campo crítico inválido e downgrade implícito falham fechado.
- [ ] Fixtures válidas, inválidas e de migração cobrem o contrato.
- [ ] O contrato público não contém IDs, paths ou defaults específicos do Studio privado.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/project-brief.schema.json`
- `data/contracts/project-brief.v1.schema.json`
- `scripts/migrate-project-brief.mjs`
- `scripts/validate-project-brief-rules.mjs`
- `data/contracts/fixtures/project-brief/**`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Testes Node da migração e fixtures.
- Validação JSON Schema draft 2020-12.
- Comparação semântica antes/depois da migração.

## Stop conditions

- Perda de campo ou estado válido do contrato 0.1.0.
- Necessidade de acoplar o schema público a uma tabela privada.

