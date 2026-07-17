# Evidência da Story 16.W3.1

Data: 2026-07-15

## Escopo e preflight

- Baseline autorizado: `wave/gate-0/public-baseline@779cca2`.
- Worktree isolado: `.claude/worktrees/story-16.W3.1`.
- Branch: `wave/16-w3/story-16.W3.1`.
- Dependências `16.W1.2`, `16.W2.2` e `16.W2.3`: `Done` no estado do Epic 16.
- Live PR coverage: `gh pr list --state open --limit 100 --json ...` retornou
  `[]`; nenhum PR aberto cobria este escopo.
- Contrato SDC materializado antes da execução no commit `83b6b0a`.

## Ciclo test-first

O baseline existente passou antes de qualquer correção: dependências instaladas
por `npm ci` (9 packages, 0 vulnerabilidades), matriz Node/Playwright com exit 0,
quatro validators e quatro pares de mirrors/distribuições aprovados.

O commit `39769eb` congelou as novas provas de gate. A primeira execução gerou
RED em dois casos:

1. o ProjectBrief reimportado não carregava o ArtifactIndex separado, portanto
   o bloco de evidência da decisão mudava de `artifact-index-v1` para `none`,
   embora `state`, `nextSkill`, `command` e `reason` permanecessem iguais;
2. a assertion de migração referenciava `offer.promise`, campo ausente da fixture
   legada pública.

O commit `6943694` alinhou as assertions ao contrato publicado: igualdade da
rota de readiness e preservação dos campos/proveniência realmente presentes na
fixture. Nenhuma correção de runtime foi necessária.

## Provas dos acceptance criteria

| AC | Prova |
|---|---|
| AC1 | Browser importa a fixture v1, exporta, reimporta e compara `state`, `nextSkill`, `command` e `reason`; PASS. |
| AC2 | Fixture `0.1.0` preserva `meta`, `project`, `market`, `sourceArtifactId` e confirmações; a rota permanece idêntica após reimportar v1; PASS. |
| AC3 | 69 testes, quatro validators e quatro pares byte-equivalentes; PASS. |
| AC4 | Quatro distribuições em desktop `1440x900` e mobile `390x844`, com CSP/MIME, pageerror e console monitorados; PASS. Preview PDF/canvas também PASS. |
| AC5 | Diff allow-listed e evidência sanitizada; scans de secrets, PII, paths de máquina e artefatos de cliente com zero achados. |
| AC6 | `docs/releases/project-brief-v1.md` registra sete versões/IDs de contrato, compatibilidade, comandos, limitações e rollback sem declarar deploy. |
| AC7 | Entidade e comandos estão registrados; fases PO/QA têm evidência e o Architect independente aprovou o HEAD `dfbdf10` com `PASS 98/100`, confiança alta e zero findings. |

## Resultados executáveis

### Matriz completa

```text
19 ProjectBrief contract tests: PASS
11 readiness tests: PASS
18 ArtifactIndex tests: PASS
11 browser import/export tests: PASS
10 surface contract tests: PASS
Total: 69 PASS; 0 FAIL
```

As novas provas incluem o round-trip com mesma rota, migração legada com mesma
rota e 4 distribuições × 2 viewports. Os browser tests verificam também CSP,
MIME do ESM, `pageerror` e erros de console.

### Checkout limpo

Um worktree temporário detached foi criado a partir do HEAD da story, recebeu
`npm ci`, executou os cinco arquivos de teste separadamente, os quatro
validators e os quatro pares de `cmp`. Resultado:

```text
CLEAN_CHECKOUT_PASS tests=69 validators=4 mirrors=4
git status --short --untracked-files=all: vazio
```

O primeiro probe usou incorretamente `npm ci --prefix` e falhou antes de rodar
testes. O comando foi corrigido para executar `npm ci` dentro de `scripts/`; o
segundo probe passou integralmente e o worktree temporário foi removido.

### Validators

```text
Project brief rules: 120 campos, 31 skills, AJV 2020 compilado — PASS
Skill catalog: 31 skills, 41 edges, canonical mirror — PASS
Mapa wiring: sampleUrl 69/69, HTTP/PDF — PASS
Mapa skills: sampleUrl 69/69, HTTP/PDF — PASS
```

### Mirrors e distribuições

```text
.claude/.agents comecar: PASS byte a byte
.claude/.agents status-funil: PASS byte a byte
briefing raiz/Aula 3: PASS byte a byte
mapa raiz/Aula 3: PASS byte a byte
```

### Preview visual

```text
canvas rendered=1
canvas size=810x1138
pageerrors=0
preview=OK
```

### Privacidade e confinamento

O scan final é aplicado somente ao diff da story contra `779cca2` e aos nomes
de arquivos alterados. Padrões verificados: chaves/tokens/senhas, e-mail,
telefone, paths de home Unix/Windows, diretórios privados de projeto e assets
gerados. Resultado: zero achados e todos os sete paths alterados pertencem à
allow-list da story.

## File List real

- `scripts/lib/skill-readiness.test.mjs`
- `scripts/project-brief-io.test.mjs`
- `docs/releases/project-brief-v1.md`
- `docs/stories/epic-16/STORY-16.W3.1-public-contract-release-gate.md`
- `docs/stories/epic-16/evidence/STORY-16.W3.1.md`
- `docs/stories/epic-16/EPIC-16-EVIDENCE.md`
- `docs/stories/epic-16/epic-16-state.json`

## Entity proof e veredito do executor

`PublicProjectContract` passou de `implemented-and-locally-verified` para
`PublicProjectContractReleaseGate` em
`release-ready-for-independent-signoff`: os contratos foram exercitados em
checkout limpo, a distribuição pública permaneceu coerente e a evidência não
depende de dados privados.

Veredito `@qa`: **PASS técnico**. Veredito independente `@architect`:
**PASS 98/100**, confiança alta, zero findings, no HEAD
`dfbdf1025c225f7b75de0fb51f55915925298551`. Os registros PO e QA são
evidências das fases sequenciais da mesma execução SDC; não representam
identidades humanas adicionais. O quality gate de arquitetura é o sign-off
independente que autorizou o fechamento.

Veredito final local: **PASS**. A story está `Done` e pronta para fan-in por
`@devops`. Não houve push, PR, merge, deploy ou publicação.
