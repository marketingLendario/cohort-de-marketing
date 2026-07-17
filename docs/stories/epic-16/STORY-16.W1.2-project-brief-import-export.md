---
story_id: "16.W1.2"
epic_id: "16"
wave: "W1"
status: Done
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
hill_phase: "done"
confidence_level: "know-how"
task_mode: "CRIAR"
involves_ui: true
---

# STORY-16.W1.2 - Importação e exportação bidirecional do briefing

## Status

Done

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
- O formato `date-time` não usa mais `Date.parse`: ano bissexto, dias do mês,
  relógio e offset são validados de forma estrita antes de aceitar RFC3339.
- Uma única política recursiva de credenciais roda antes de import, autosave e
  export. Assignments sensíveis, headers de autenticação, chave privada e
  assinaturas específicas de provedores falham fechado sem ecoar o valor ou
  sanitizar semântica.
- Limite deliberado: a política não é um scanner de entropia ou DLP genérico.
  Ela exige assignment com valor ou prefixo forte conhecido, permitindo menções
  pedagógicas e placeholders redigidos; formatos novos exigem ampliar a matriz.
- Gramática de assignment: somente nomes sensíveis explícitos seguidos por `:`
  ou `=`; valor quoted termina na aspa correspondente e valor unquoted termina
  em quebra de linha, vírgula, ponto e vírgula ou delimitador estrutural. Toda
  pontuação interna é preservada antes da classificação.
- Allow-list normalizada e exata: `YOUR_TOKEN_HERE`, `SEU_TOKEN_AQUI`,
  `YOUR_API_KEY`, `example-token`, `<TOKEN>` e `[REDACTED]`; variações com
  prefixo/sufixo adicional falham fechado.
- A busca de PRs abertos no repositório público retornou lista vazia antes da
  implementação.

### Evidências de validação

- Testes congelados primeiro no commit `d9ddc8b`; no baseline, somente a
  paridade byte a byte passava e os seletores de import/export ainda não existiam.
- `node --test scripts/project-brief-io.test.mjs`: PASS, 8/8.
- `node --test data/contracts/fixtures/project-brief/project-brief-contract.test.mjs`:
  PASS, 19/19 (regressão integral da 16.W1.1).
- Execução combinada dos testes browser e contrato: PASS, 27/27.
- Matriz RFC3339 browser/AJV: 2 datas válidas e 4 datas impossíveis/fora do
  calendário com a mesma decisão nos dois validadores.
- Matriz de credenciais: 24 imports adversariais cobrindo assignments, headers,
  chave privada e formatos de provedores recusados sem alterar draft ou
  `localStorage`; edição sensível bloqueia autosave e export antes do download.
- Placeholders com sufixo após aspas, `>` ou `]` também falham; somente pontuação
  terminal isolada ou delimitador estrutural encerra um placeholder permitido.
- Regressões de superfície: os quatro valores com pontuação, aspas ou segmentos
  separados por `:` falham em import, autosave e export sem ecoar conteúdo.
- Controles benignos: 12 frases pedagógicas/placeholders explícitos aceitos;
  placeholder permitido também passa por autosave e export JSON. Reload após os
  bloqueios restaura o draft seguro e o storage byte a byte original.
- `node scripts/validate-project-brief-rules.mjs`: PASS, 120 campos, 31 skills e
  schemas AJV 2020 compilados.
- `MAP_SCRATCH=/tmp/story-16-w1-2-qg-r3-final MAP_PORT=8876 node scripts/validate-mapa-wiring.mjs`:
  PASS, 69/69 `sampleUrl`, HTTP e PDF válidos.
- `npm audit --prefix scripts --audit-level=moderate`: PASS, 0 vulnerabilidades.
- `cmp -s briefing.html aula-03/materiais/briefing.html`: PASS.
- `git diff --check`: PASS.

### Commits locais

- `d9ddc8b` - `test: freeze ProjectBrief browser round-trip [Story 16.W1.2]`
- `021cb01` - `feat: add ProjectBrief v1 import export [Story 16.W1.2]`
- `cf7d9ef` - `docs: hand off ProjectBrief IO for review [Story 16.W1.2]`
- `b3d9d27` - `fix: accept nested ProjectBrief provenance [Story 16.W1.2]`
- `2ce1d04` - `docs: record ProjectBrief IO hardening [Story 16.W1.2]`
- `553224e` - `test: reproduce ProjectBrief IO QG findings [Story 16.W1.2]`
- `5b5fb5c` - `fix: close ProjectBrief IO security gaps [Story 16.W1.2]`
- `c2dc188` - `docs: record ProjectBrief IO QG remediation [Story 16.W1.2]`
- `078d9ac` - `test: reproduce credential policy gaps [Story 16.W1.2]`
- `803eed5` - `fix: broaden credential policy safely [Story 16.W1.2]`
- `a7c471f` - `docs: record credential policy remediation [Story 16.W1.2]`
- `9837bb8` - `test: reproduce credential value parsing gaps [Story 16.W1.2]`
- `76c6b6a` - `fix: parse credential assignments deterministically [Story 16.W1.2]`
- `38cf5fc` - `docs: record deterministic credential parsing [Story 16.W1.2]`
- `409ea1c` - `test: reject placeholder lookalike suffixes [Story 16.W1.2]`
- `2cbc052` - `fix: require exact placeholder boundaries [Story 16.W1.2]`
- `d6d9b86` - `docs: record final ProjectBrief IO remediation [Story 16.W1.2]`

## File List real

- `briefing.html`
- `aula-03/materiais/briefing.html`
- `scripts/project-brief-io.test.mjs`
- `docs/stories/epic-16/STORY-16.W1.2-project-brief-import-export.md`
- `docs/stories/epic-16/epic-16-state.json`

## QA prep

- Reexecutar os 8 testes Playwright nas duas URLs e inspecionar os downloads
  JSON/Markdown, incluindo metadados, `currentStage` e ausência de `fieldSources`
  no resumo derivado.
- Forçar schema desconhecido, propriedade adicional e referência de artefato
  insegura; o draft anterior deve permanecer intacto em todos os casos.
- Confirmar isolamento entre dois `projectId`, reload do projeto ativo e ausência
  de nomes usuais de tokens nas entradas do `localStorage`.
- Revalidar no Round 4 os 24 padrões adversariais, os 12 controles benignos, a
  igualdade exata da allow-list e a preservação byte a byte do storage/draft em
  import, autosave, export e reload.
- O executor mantém a story em `InReview`; somente o PASS independente de `@qa`
  autoriza `Done` e o fan-in da wave.

## Change Log

- 2026-07-14: suíte browser congelada, import/export v1 e migração legado
  implementados, regressões aprovadas e story encaminhada para QA independente.
- 2026-07-14: validação browser alinhada aos dot-paths recursivos do contrato,
  com round-trip adicional para proveniência de objeto aninhado.
- 2026-07-15: QG Round 1 remediado com calendário RFC3339 estrito, matriz
  browser/AJV e política fail-closed de credenciais antes de toda persistência.
- 2026-07-15: QG Round 2 remediado ampliando assinaturas de credenciais sem
  bloquear conteúdo pedagógico benigno e cobrindo export/reload do draft seguro.
- 2026-07-15: QG Round 3 remediado separando extração completa de assignment da
  classificação e introduzindo allow-list exata de placeholders normalizados.
- 2026-07-15: hardening adicional rejeita placeholders permitidos quando há
  sufixo não delimitado, preservando somente pontuação terminal pedagógica.

## QA Results

### Round 1

- Quality Gate independente: FAIL.
- Score: 64/100.
- QG-001 HIGH: `Date.parse` aceitava datas impossíveis; remediado por validação
  explícita de calendário e matriz comparativa com AJV.
- QG-002 HIGH: ausência de política pré-persistência para credenciais em texto
  livre; remediado por rejeição recursiva fail-closed em import/autosave/export.
- QG-003 LOW: inventário de commits incompleto; corrigido nesta atualização.
- Estado após remediation: `InReview`.

### Round 2

- Quality Gate independente: FAIL.
- Score: 78/100.
- QG-001 e QG-003: fechados.
- QG-002 HIGH: detector ainda possuía falsos negativos para assignments genéricos,
  autenticação Basic, chave privada e formatos redistribuíveis comuns.
- Remediation: política centralizada ampliada, 16 negativos, 6 controles benignos
  e prova de import/autosave/export/reload sem alterar o storage persistido.
- Estado após remediation: `InReview`.

### Round 3

- Quality Gate independente: FAIL.
- Score: 82/100.
- QG-001 e QG-003: fechados.
- QG-002 HIGH: a classe de caracteres do detector truncava valores com
  pontuação e não distinguia placeholders explícitos de segredos semelhantes.
- Remediation: parser determinístico de assignments, classificação posterior,
  allow-list normalizada por igualdade exata e regressões nas três superfícies.
- Estado após remediation: `InReview`, aguardando QG Round 4 independente.

### Round 4

- Quality Gate independente: PASS.
- Score: 96/100.
- Findings bloqueantes: nenhum.
- QG-001, QG-002 e QG-003: fechados.
- Reprobes confirmaram recusa fail-closed nas três superfícies, placeholders
  exatos aceitos, lookalikes recusados, ausência de eco e preservação byte a
  byte de draft/storage.
- Todos os ACs e stop conditions: PASS; story encerrada como `Done`.
