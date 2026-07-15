# Evidência — Story 16.W2.2

## Resultado

As superfícies públicas de briefing e mapa agora consomem o mesmo contrato
composto por `skill-catalog.json`, `skill-unlock-rules.json`, ProjectBrief v1 e
ArtifactIndex v1. Nenhuma lista de skills, edge ou contagem permanece copiada no
HTML. Falhas de carga, referência órfã ou documento divergente bloqueiam a
renderização com um único erro acionável.

## Preflight

- Base da story: `f4ca009a646df7238adbb1d30228727bab92d72d`.
- Branch isolada: `wave/16-w2/story-16.W2.2`.
- Dependências `16.W1.1` e `16.W2.1`: `Done` no `epic-16-state.json`.
- `gh pr list --state open --limit 100 --json ...`: `[]`; nenhum PR aberto cobre o escopo.
- Escopo alterado: somente paths declarados na allow-list da story.

## Test-first

- Commit RED: `29c23ac`.
- Antes da implementação: 6 testes executados; 5 falharam pelos contratos
  ausentes/literais e 1 passou pela paridade preexistente.
- Depois da implementação: `node --test scripts/skill-surface-data-driven.test.mjs`
  — 6/6 testes passando.
- Fixtures cobertas: inserção e remoção de skill, edge órfã, skill sem regra,
  requisito de artefato órfão e ArtifactIndex malformado.

## Remediação do QG Round 1

- Os quatro blockers foram congelados em regressões antes da correção; a bateria
  de superfície cresceu de 6 para 9 testes.
- `skill-surface-contract.js` tornou-se a única implementação compartilhada por
  briefing, mapa e `scripts/project-artifact-index.mjs`; as cópias divergentes
  foram removidas dos HTMLs e do arquivo de amostras.
- O contrato exige as versões públicas exatas, os 120 paths do schema canônico,
  valida referências de campos/artefatos em `anyOf` e `notApplicableWhen` e
  valida o ProjectBrief v1 persistido antes de avaliar qualquer skill.
- O ArtifactIndex reusa a semântica completa da W2.1: policy/version, path
  portátil, hash, tamanho, origem, glob/proveniência, confirmação, resumo e
  unicidade global. Fixture forjada bloqueia o mapa nas duas distribuições e não
  produz estado `done`.
- Nenhuma contagem de skills permanece literal nas superfícies ou validator; as
  quantidades são derivadas do catálogo em runtime.
- Um registro local carregado não é reserializado no bootstrap. ProjectBrief ou
  índice rejeitado limpa os desbloqueios somente em memória, preservando o valor
  do `localStorage` byte a byte; credencial rejeitada possui regressão dedicada.

## Remediação do QG Round 2

- O Round 1 foi fechado pelo QG2; o único blocker novo foi verdade vacuosa em
  grupos `anyOf` sem restrição efetiva.
- Todo grupo agora exige `label` não vazio e ao menos uma restrição não vazia em
  `fields`, `artifacts` ou `matches`. Arrays e matches declarados vazios,
  referências órfãs, valores não escalares e chaves extras falham fechado.
- `notApplicableWhen` exige exatamente um predicado (`equals` XOR `in`); `in`
  deve ser array não vazio com valores válidos e `reason` deve ser não vazio.
- As regras oficiais passam e uma matriz de exatamente 32 fixtures adversariais
  falha antes da avaliação. Nas duas URLs do mapa, regra vacuosa resulta em
  `INVALID_UNLOCK_RULES`, sem publicar dados nem estados `available`,
  `recommended` ou `done`.

## Remediação do QG Round 3

- O QG3 fechou o Round 2 e identificou que a função usada por `matches` também
  permitia arrays em `equals` e arrays aninhados nos itens de `in`.
- A gramática agora separa `validScalar` de `validMatchValue`: `equals` aceita
  somente string, número finito ou boolean direto; `in` exige array não vazio
  cujos itens sejam exclusivamente esses escalares diretos.
- Foram adicionadas três regressões: `equals` com array, `in` aninhado e `in`
  misto. A matriz passou de 32 para 35 fixtures adversariais.
- Ambas as URLs do mapa receberam a fixture mista por HTTP e falharam com
  `INVALID_UNLOCK_RULES`, sem `__SKILL_SURFACE_DATA` e sem estados liberados.

## Validators

- `node scripts/validate-skill-catalog.mjs` — PASS; 31 skills, 41 edges e mirror canônico verificado.
- `node scripts/validate-mapa-wiring.mjs` — PASS; 69/69 `sampleUrl` válidas e HTTP PDF válido.
- `node scripts/validate-mapa-preview.mjs` — PASS; canvas 810x1138, screenshot gerada e zero `pageerror`.
- `node --test scripts/skill-surface-data-driven.test.mjs` — PASS; 10/10,
  incluindo regras oficiais + 35 fixtures adversariais e ambas as URLs do mapa.
- `node --test scripts/project-artifact-index.test.mjs` — PASS; 18/18.
- `node --test data/contracts/fixtures/project-brief/project-brief-contract.test.mjs` — PASS; 19/19 e 120 paths.
- `node --test scripts/project-brief-io.test.mjs` — PASS; 9/9.
- Auditoria de literais `31 skills`, `25 skills`, `25/25`, `>25<` e `length === 31` nas duas distribuições e validators — zero ocorrências.
- `git diff --check` — PASS.
- `cmp -s` entre raiz e `aula-03/materiais/` — PASS para briefing, mapa e artefatos JS.

## Browser smoke HTTP

Servidor local: `python3 -m http.server 8872 --bind 127.0.0.1`.

| URL | Skills | Edges | Console/Page errors |
|---|---:|---:|---:|
| `/mapa-skills.html` | 31 nós | 41 | 0 |
| `/aula-03/materiais/mapa-skills.html` | 31 nós | 41 | 0 |
| `/briefing.html` | 31 linhas | n/a | 0 |
| `/aula-03/materiais/briefing.html` | 31 linhas | n/a | 0 |

Os assets compartilhados e amostras usam URLs enraizadas no servidor para que a
distribuição de `aula-03/materiais/` não tente resolver fontes ou previews em uma
pasta inexistente.

## Segurança e proveniência

- O mapa lê apenas o ProjectBrief/ArtifactIndex persistido pelo briefing, sem
  renderizar conteúdo bruto dos artefatos.
- O ArtifactIndex só libera estado `done` para entradas confirmadas e com resumo
  coerente; índice de outro projeto, schema, policy, hash ou proveniência
  divergente falha fechado.
- Estado local recusado não é mutado silenciosamente durante o bootstrap; a UI
  bloqueia os artefatos e mantém o registro original para recuperação/auditoria.
- Nenhum segredo, caminho absoluto de máquina ou conteúdo privado foi registrado.

## Commits

- `29c23ac` — testes de contrato (RED).
- `dfa2819` — implementação catálogo-driven (GREEN).
- `5dbcb38` — remediação dos quatro blockers do QG Round 1.
- `3b38c58` — remediação do blocker de verdade vacuosa do QG Round 2.
- `26a0792` — remediação de predicados aninhados do QG Round 3.
