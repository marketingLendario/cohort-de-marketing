---
story_id: "16.W1.2"
epic_id: "16"
wave: "W1"
status: Ready
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["node:test", "playwright"]
repo_target: "cohort-de-marketing"
depends_on:
  - "16.W1.1"
effort: "7h"
deploy_type: "none"
accountable: "rafaelcosta"
appetite: "1d"
hill_phase: "executing"
confidence_level: "know-how"
task_mode: "CRIAR"
involves_ui: true
---

# STORY-16.W1.2 - Importação e exportação bidirecional do briefing

## Status

Ready

## Dependências

- 16.W1.1

## Objetivo

Permitir que o briefing público importe e exporte ProjectBrief v1 em JSON e Markdown sem exigir edição manual.

## Critérios de aceite

- [ ] Importar JSON v1 válido restaura campos, metadados e etapa ativa.
- [ ] Documento 0.1.0 é migrado por caminho explícito e informa o resultado ao operador.
- [ ] Export JSON valida o contrato antes do download; export Markdown é um resumo derivado, não uma nova fonte de verdade.
- [ ] Erros de versão ou schema preservam o rascunho existente e oferecem recuperação.
- [ ] Autosave continua isolado por projeto e não armazena tokens.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `briefing.html`
- `aula-03/materiais/briefing.html`
- `scripts/migrate-project-brief.mjs`
- `data/contracts/project-brief.v1.schema.json`
- `scripts/validate-mapa-wiring.mjs`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Teste de round-trip JSON v1.
- Teste de migração 0.1.0.
- Smoke em navegador com reload e arquivo inválido.
- Comparação byte a byte das duas cópias distribuídas.

## Stop conditions

- Browser exigir acesso irrestrito ao filesystem.
- Export Markdown passar a ser editável como fonte concorrente.
