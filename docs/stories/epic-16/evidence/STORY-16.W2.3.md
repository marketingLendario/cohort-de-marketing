# Evidência da Story 16.W2.3

Data: 2026-07-15

## Escopo e preflight

- Baseline da wave: `wave/gate-0/public-baseline@4c8a605`.
- Dependências `16.W2.1` e `16.W2.2`: `Done` no `epic-16-state.json`.
- Live PR coverage no início: `gh pr list --state open --json ...` retornou
  lista vazia; não havia implementação concorrente para este escopo.
- Trabalho executado no worktree isolado
  `.claude/worktrees/story-16.W2.3`, branch
  `wave/16-w2/story-16.W2.3`.
- File List expandida antes da edição para incluir os dois mirrors HTML da Aula
  3 e o `epic-16-state.json`. A expansão preserva o contrato byte a byte
  estabelecido em `16.W2.2` e não introduz outro motor.

## Ciclo test-first

- Commit RED: `cd276ac`.
- Falha observada: `ERR_MODULE_NOT_FOUND` para
  `scripts/lib/skill-readiness.mjs`, confirmando que os fixtures foram
  congelados antes da implementação.
- Commit de implementação: `3eafe74`.
- QG1: `FAIL 48`, com bloqueios de versionamento/refs, sanitização, CSP/Blob e
  desempate fora do contrato.
- Commit RED da remediação: `8f419cd`.
- Commit de remediação: `e5e724b`.
- QG2: `FAIL 82/100`, com um P1: `comecar` e `status-funil` ainda
  documentavam a assinatura anterior sem `contractRefs`.
- Commit RED da remediação Round 3: `97f6189`.
- Commit de remediação Round 3: `6d1f671`.
- QG3: `PASS 98/100`, confiança alta e zero blocking findings no HEAD
  `afd654bc30612a3aa89847e30bd0c3350930035f`.

## Provas dos acceptance criteria

| AC | Prova |
|---|---|
| AC1 | Table tests cobrem os seis estados; estado desconhecido, prioridade ausente e política malformada lançam erro tipado e falham fechado. |
| AC2 | Arrays e objetos reordenados produzem decisão serializada idêntica; prioridade numérica decide a rota e o ID estável resolve sozinho o empate, inclusive entre estados diferentes. |
| AC3 | A decisão contém `nextSkill` ou `null`, requisitos atendidos/ausentes, evidência categórica e razão legível. Versões, comandos, paths e listas fora dos `contractRefs` falham fechado sem ecoar o valor adversarial. |
| AC4 | Golden matrix chama o mesmo motor para `comecar`, briefing, mapa e `status-funil`; Chromium sob CSP sem `blob:` confirma ESM same-origin, MIME correto, comando e razão idênticos nas distribuições raiz e Aula 3. Um probe adicional extrai e executa o call pattern documentado nos quatro `SKILL.md` canônico/mirror contra o ruleset real. |
| AC5 | Fixtures de oferta própria e afiliado mudam a rota; `not_applicable` não muta o ArtifactIndex; as skills declaram explicitamente que invocação direta segue autônoma. |
| AC6 | `cmp` confirma paridade byte a byte de `comecar` e `status-funil` entre `.claude/skills` e `.agents/skills`; as cópias HTML raiz/Aula 3 também são idênticas. |

## Comandos e resultados

### Dependências locais

```text
cd scripts && npm ci
9 packages instalados; audit: 0 vulnerabilidades.
```

### Matriz integrada

```text
node --test --test-concurrency=1 \
  scripts/lib/skill-readiness.test.mjs \
  scripts/skill-surface-data-driven.test.mjs \
  scripts/project-artifact-index.test.mjs \
  data/contracts/fixtures/project-brief/project-brief-contract.test.mjs

58 testes; 58 pass; 0 fail; 0 skipped.
```

Essa matriz inclui onze testes do recomendador, browser golden/CSP das quatro
distribuições, contratos AJV, migração, ArtifactIndex confinado, catálogo/rules
adversariais e surfaces data-driven.

### Round-trip do briefing no browser

```text
node --test --test-concurrency=1 scripts/project-brief-io.test.mjs

9 testes; 9 pass; 0 fail; 0 skipped.
```

Inclui round-trip JSON/Markdown, migração legada, datas RFC3339, rejeição de
credenciais, autosave por projeto e preservação de storage recusado.

### Validadores públicos

```text
node scripts/validate-skill-catalog.mjs
Skill catalog OK: 31 skills, 41 edges, canonical mirror verified.

node scripts/validate-project-brief-rules.mjs
Project brief rules OK: 120 campos, 31 skills, schemas AJV 2020 compilados.

node scripts/validate-mapa-wiring.mjs
sampleUrl: 69/69 válidos; wiring OK.

node scripts/validate-mapa-skills.mjs
sampleUrl: 69/69 válidos; wiring OK.
```

### Smoke visual

```text
MAP_PORT=8768 MAP_SCRATCH=/tmp/story-16.W2.3-preview \
  node scripts/validate-mapa-preview.mjs

canvas rendered=1
canvas size 810x1138
preview: 0 pageerror(s)
OK: preview
```

### Paridade, sintaxe e higiene

```text
cmp canônicos/mirrors: PASS
node --check motor e testes: PASS
jq empty data/skill-unlock-rules.json: PASS
git diff --check: PASS
npm audit --audit-level=high: 0 vulnerabilidades
```

## Decisões de implementação

- `priority` e `recommendationEligible` são dados obrigatórios e versionados em
  `skill-unlock-rules.json` para todas as 31 skills.
- `comecar` e `status-funil` participam da apresentação, mas não competem com
  as skills de trabalho pela próxima rota.
- Uma etapa anterior bloqueada continua sendo a próxima decisão explicável;
  o motor não salta para uma skill tardia apenas porque ela tem menos campos
  ausentes.
- O motor é puro, não usa tempo, DOM, ordem do filesystem nem valores
  transitórios. `contractRefs` são materializados exclusivamente pelo
  `skill-surface-contract.js`, e cada consumidor falha fechado se o contrato
  compartilhado divergir.
- O browser importa o mesmo `.mjs` diretamente por URL same-origin. Todos os
  harnesses HTTP servem `.mjs` como `application/javascript`; a regressão roda
  com `script-src 'self'` e sem `blob:` no diretivo CSP.
- Os procedimentos de `comecar` e `status-funil` agora contêm o mesmo bloco
  executável: derivam `contractRefs` por
  `SkillSurfaceContract.createReadinessContractRefs(...)`, avaliam pelo SOT e
  passam as refs para `decideNextSkill`. O teste executa o bloco, em vez de
  apenas procurar texto.
- Não houve push, PR, merge ou deploy. O QG independente foi satisfeito no
  Round 3; a story está `Done` e pronta para fan-in por `@devops`.
