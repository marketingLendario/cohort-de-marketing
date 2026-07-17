# Merge Notes — Integração EPIC-16 + EPIC-17 + Gate 0 na main

**Branch:** `integration/epic-16-17-gate0`
**Base:** `main` (`21bd74c`, que já contém EPIC-18/19/20 + squad de tráfego Modo API + advisor/004)
**Origem integrada:** `wave/gate-0/public-baseline` (162 commits; contém todas as `wave/16-*` e `wave/17-*` como subconjuntos)

## O que entra

- **EPIC-16** — ProjectBrief canônico, readiness e superfícies catalog-driven.
- **EPIC-17** — Aula 4 (data foundation): validadores de contrato, ledger semanal, leitura de métricas históricas, reconciliação checkout/caixa, release gate.
- **Gate 0** — baseline integrado.

Total vs `main`: 125 arquivos, +18k/−805.

## O conflito e como foi resolvido

Quatro arquivos em conflito, todos a mesma natureza — **main hardcoded vs gate-0 catalog-driven**:

- `mapa-skills.html` e `mapa-skills-artifacts.js` (nas duas cópias: raiz e `aula-03/materiais/`).

A `main` mantinha os dados do mapa embutidos (`const SKILLS = [...]`, `FLOW_POS`, `FLOW_EDGES`, mermaid, contagens fixas). O `gate-0` converteu o viewer para **carregamento dinâmico** a partir de `/data/skill-catalog.json` (`let SKILLS = []` populado em runtime — o deliverable "catalog-driven surfaces" da Story 16.W2.2). Os dois lados são incompatíveis por construção (o `const` da main quebraria a reatribuição do gate-0).

**Resolução:** em cada conflito, adotado o lado do **gate-0** (dinâmico), **preservando as mudanças da main que estavam fora de conflito** — em especial `traffic:'iconoir-stats-up-square'` em `getIconForSkill()`, necessário para o mapa dinâmico renderizar as skills de tráfego. Não foi usado `--theirs` justamente para não descartar essas adições auto-mescladas da main.

**Por que é seguro (sem perda):** o catálogo mesclado (`data/skill-catalog.json`) inclui as 6 skills de tráfego que a main havia adicionado (zelador, briefista, estruturador, ads-creative-factory, leitor-de-metricas, diagnosticador). O viewer dinâmico do gate-0 lê o catálogo, então mostra todas elas — a estrutura vem do catálogo, os *samples* de artefato vêm do `mapa-skills-artifacts.js` (as 416 linhas novas da main foram preservadas). As cópias raiz e `aula-03/materiais/` ficaram idênticas.

## Validação (verde)

- `validate-mapa-wiring.mjs` → **OK** (69/69 sampleUrls válidos, snapshot didático presente).
- `validate-skill-catalog.mjs` → **OK** (31 skills, 41 edges, mirror `.claude`/`.agents` verificado).
- Sem marcadores de conflito reais; working tree limpo.

## Reconciliação de release (commit separado `5dd5a15`)

Isolada para revisão independente:

1. **`validate-skill-catalog.mjs`**: expectativa de release do ads-creative-factory `2.2.1 → 2.3.0`. Era um assert hardcoded, **desatualizado também na `main`** (o release 2.3.0 do EPIC-18 esqueceu de atualizá-lo) — bug pré-existente, não do merge.
2. **`source-lock.json`** (`.claude` + `.agents`): hashes dos 5 SKILL.md de tráfego regenerados para o conteúdo mesclado (Modo API da main + adições do gate-0 em `diagnosticador`/`leitor-de-metricas`). Os 5 arquivos auto-mesclaram limpos, com paridade `.claude`/`.agents` verificada.

> **⚠️ Atenção do revisor:** regenerar o `source-lock.json` **re-abençoa** o conteúdo mesclado dos SKILL.md como fonte canônica. Confirme os diffs desses 5 arquivos (ou re-promova do `sinkra-hub`) antes de considerar definitivo. O commit `5dd5a15` está isolado para permitir revisar/descartar essa parte separadamente do merge em si.

## Como revisar

```bash
git diff main...integration/epic-16-17-gate0        # delta completo
git show 8ecf6f4                                     # o merge + resolução do conflito
git show 5dd5a15                                     # a reconciliação de release
node scripts/validate-mapa-wiring.mjs                # revalida o mapa
node scripts/validate-skill-catalog.mjs              # revalida o catálogo
```

Para inspecionar o mapa renderizado, sirva o diretório e abra `mapa-skills.html`.
