---
story_id: "16.W1.2"
epic_id: "16"
wave: "W1"
status: InReview
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
hill_phase: "reviewing"
confidence_level: "know-how"
task_mode: "CRIAR"
involves_ui: true
---

# STORY-16.W1.2 - Importação e exportação bidirecional do briefing

## Status

InReview

## Dependências

- 16.W1.1

## Objetivo

Permitir que o briefing público importe e exporte ProjectBrief v1 em JSON e Markdown sem exigir edição manual.

## Critérios de aceite

- [x] Importar JSON v1 válido restaura campos, metadados e etapa ativa.
- [x] Documento 0.1.0 é migrado por caminho explícito e informa o resultado ao operador.
- [x] Export JSON valida o contrato antes do download; export Markdown é um resumo derivado, não uma nova fonte de verdade.
- [x] Erros de versão ou schema preservam o rascunho existente e oferecem recuperação.
- [x] Autosave continua isolado por projeto e não armazena tokens.

## Tasks

- [x] Confirmar baseline e ausência de PR cobrindo o escopo.
- [x] Congelar contrato e testes antes da implementação.
- [x] Implementar somente dentro da File List aprovada.
- [x] Rodar validações incrementais e registrar evidências sanitizadas.
- [x] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `briefing.html`
- `aula-03/materiais/briefing.html`
- `scripts/migrate-project-brief.mjs`
- `data/contracts/project-brief.v1.schema.json`
- `scripts/validate-mapa-wiring.mjs`
- `scripts/project-brief-io.test.mjs`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

Ampliação aprovada no preflight de arquitetura: `scripts/project-brief-io.test.mjs`
entra na allow-list para congelar, antes da implementação, o round-trip real no
navegador das duas cópias distribuídas. O teste reutiliza o Playwright já
versionado em `scripts/package-lock.json` e não adiciona dependência de runtime.

## Validação

- Teste de round-trip JSON v1.
- Teste de migração 0.1.0.
- Smoke em navegador com reload e arquivo inválido.
- Comparação byte a byte das duas cópias distribuídas.

## Stop conditions

- Browser exigir acesso irrestrito ao filesystem.
- Export Markdown passar a ser editável como fonte concorrente.

## Dev Agent Record

### Implementação

- As duas cópias distribuídas permanecem byte a byte iguais e usam URLs
  públicas absolutas, permitindo o mesmo fluxo na raiz e em `aula-03`.
- O importador aceita ProjectBrief v1 direto ou envelope de migração, valida o
  documento integral antes de trocar o estado e restaura dados, `fieldSources`
  e a etapa visual derivada de `project.currentStage`.
- O caminho 0.1.0 é explícito, preserva as confirmações e proveniência do
  contrato congelado em 16.W1.1 e comunica a migração na própria interface.
- O export JSON falha fechado antes do download. O Markdown é gerado somente a
  partir do estado canônico e não inclui metadados ou outra fonte editável.
- O autosave usa `cohort.projectBrief.v1:{projectId}`, mantém artefatos e UI fora
  do contrato e nunca persiste credenciais; import inválido não altera o draft.
- A validação browser deriva o mesmo conjunto recursivo de dot-paths canônicos
  da 16.W1.1, incluindo proveniência de objetos aninhados como `offer.upsell.name`.
- A busca de PRs abertos no repositório público retornou lista vazia antes da
  implementação.

### Evidências de validação

- Testes congelados primeiro no commit `d9ddc8b`; no baseline, somente a
  paridade byte a byte passava e os seletores de import/export ainda não existiam.
- `node --test scripts/project-brief-io.test.mjs`: PASS, 5/5.
- `node --test data/contracts/fixtures/project-brief/project-brief-contract.test.mjs`:
  PASS, 19/19 (regressão integral da 16.W1.1).
- `node scripts/validate-project-brief-rules.mjs`: PASS, 120 campos, 31 skills e
  schemas AJV 2020 compilados.
- `MAP_SCRATCH=/tmp/story-16-w1-2-mapa MAP_PORT=8872 node scripts/validate-mapa-wiring.mjs`:
  PASS, 69/69 `sampleUrl`, HTTP e PDF válidos.
- `npm audit --prefix scripts --audit-level=moderate`: PASS, 0 vulnerabilidades.
- `cmp -s briefing.html aula-03/materiais/briefing.html`: PASS.
- `git diff --check`: PASS.

### Commits locais

- `d9ddc8b` - `test: freeze ProjectBrief browser round-trip [Story 16.W1.2]`
- `021cb01` - `feat: add ProjectBrief v1 import export [Story 16.W1.2]`
- `b3d9d27` - `fix: accept nested ProjectBrief provenance [Story 16.W1.2]`

## File List real

- `briefing.html`
- `aula-03/materiais/briefing.html`
- `scripts/project-brief-io.test.mjs`
- `docs/stories/epic-16/STORY-16.W1.2-project-brief-import-export.md`
- `docs/stories/epic-16/epic-16-state.json`

## QA prep

- Reexecutar os 5 testes Playwright nas duas URLs e inspecionar os downloads
  JSON/Markdown, incluindo metadados, `currentStage` e ausência de `fieldSources`
  no resumo derivado.
- Forçar schema desconhecido, propriedade adicional e referência de artefato
  insegura; o draft anterior deve permanecer intacto em todos os casos.
- Confirmar isolamento entre dois `projectId`, reload do projeto ativo e ausência
  de nomes usuais de tokens nas entradas do `localStorage`.
- O executor mantém a story em `InReview`; somente o PASS independente de `@qa`
  autoriza `Done` e o fan-in da wave.

## Change Log

- 2026-07-14: suíte browser congelada, import/export v1 e migração legado
  implementados, regressões aprovadas e story encaminhada para QA independente.
- 2026-07-14: validação browser alinhada aos dot-paths recursivos do contrato,
  com round-trip adicional para proveniência de objeto aninhado.
