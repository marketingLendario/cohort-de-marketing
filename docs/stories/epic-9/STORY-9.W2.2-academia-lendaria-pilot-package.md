---
status: Done
story_id: "9.W2.2"
title: "Pacote piloto da Academia Lendária"
epic: 9
wave: "W2"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 1d
hill_phase: downhill
confidence_level: high
involves_ui: false
executor: "@dev"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W1.2", "9.W1.3"]
consumes_artifacts_of: ["9.W1.2"]
file_scope: exclusive
touched_paths:
  - "data/pilots/academia-lendaria-project.manifest.json"
  - "data/pilots/academia-lendaria-project-brief.json"
  - "scripts/validate-pilot-manifest.mjs"
  - "scripts/validate-pilot-manifest.test.mjs"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "docs/qa/epic-9-academia-lendaria-source-map.md"
  - "docs/stories/epic-9/STORY-9.W2.2-academia-lendaria-pilot-package.md"
  - "docs/stories/epic-9/epic-9-state.json"
---

# STORY-9.W2.2 - Pacote piloto da Academia Lendária

## Acceptance Criteria

1. Manifesto aponta somente para fontes existentes e registra hash e proveniência.
2. ProjectBrief usa fatos literais das fontes autoritativas e marca lacunas como unknown.
3. Nenhum arquivo do `sinkra-hub` é alterado ou exigido no runtime do aluno.
4. Validador detecta fonte ausente, hash divergente e campo inventado.
5. O pacote pode ser importado pela jornada entregue na W1.

## Tasks

- [x] Selecionar fontes autoritativas e congelar hashes.
- [x] Produzir ProjectBrief versionado com proveniência.
- [x] Criar manifesto mínimo de artefatos para a Aula 3.
- [x] Validar e documentar lacunas humanas.

## File List

- `data/pilots/academia-lendaria-project.manifest.json`
- `data/pilots/academia-lendaria-project-brief.json`
- `scripts/validate-pilot-manifest.mjs`
- `scripts/validate-pilot-manifest.test.mjs`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts`
- `docs/qa/epic-9-academia-lendaria-source-map.md`
- `docs/stories/epic-9/STORY-9.W2.2-academia-lendaria-pilot-package.md`
- `docs/stories/epic-9/epic-9-state.json`

## Change Log

- Pacote piloto versionado em `data/pilots/` com manifesto canônico, hashes SHA-256 e mapa de fatos por campo.
- `project-brief 0.1.0` limitado a fatos literais e lacunas `unknown`, sem dependência de runtime no `sinkra-hub`.
- Validador Node puro criado para detectar fonte ausente, hash divergente e campo inventado.
- Prova automatizada da jornada W1 adicionada ao teste de importação do workspace.
- Divergências de fonte e lacunas humanas registradas no source map de QA.

## Dev Agent Record

### Fontes autoritativas congeladas

- `INDEX.md` do pacote real da Academia Lendária
- `curriculum.yaml` reconciliado do `cohort_marketing_receita`
- `offerbook.yaml` reconciliado do `cohort_marketing_receita`
- `PRD-A3-trafego-v1.md`
- `squad-trafego/README.md`

### Decisões de implementação

- O manifesto é a autoridade de proveniência e congelamento de hash.
- O `project-brief` permanece no schema legado `0.1.0` para entrar pela jornada W1 sem adaptação de formato.
- Campos sem fato literal ficaram omitidos ou marcados como `unknown`; nenhum enum foi inferido por aproximação.
- A divergência entre `curriculum.yaml` e `offerbook.yaml` sobre o PRD da A3 foi registrada como conflito explícito, não resolvida por síntese.

### Revisão de diff

- Finding P2 corrigido durante a execução: o validador tratava `integrations` como lacuna exata e rejeitava os subcampos `integrations.*`; a checagem foi ajustada para aceitar lacunas por prefixo sem perder a proteção contra campo inventado.
- O review Codex encontrou um P2 no caminho do fixture: a prova de importação
  agora localiza `data/pilots/` subindo pelos ancestrais do diretório de
  execução, sem depender de o Vitest iniciar no app.

## Evidências

- `node scripts/validate-pilot-manifest.mjs` — PASS
- `node --test scripts/validate-pilot-manifest.test.mjs` — PASS
- `npm test -- use-project-workspace.test.ts` — PASS (17 testes; URL e anon key públicas do `.env.example`).
- `npm run typecheck` — PASS.
- `git diff --check` — PASS

## QA Gate

**Veredito:** PASS em 2026-07-10 para o escopo de pacote/versionamento.

- O manifesto referencia apenas fontes reais, com hash e proveniência congelados.
- O `project-brief` contém somente fatos com `fieldMeta` apontando para `fact:*` ou lacunas `gap:*`.
- O validador falha para as três classes pedidas: fonte ausente, hash divergente e campo inventado.
- A prova de W1 passou no teste do controller real: o briefing `0.1.0` foi importado sem seed oculto, preservando projeto, lacunas `unknown` e quatro declarações de artefato.
- Nenhum arquivo do `sinkra-hub` foi alterado e o pacote importável não exige esses paths no runtime do aluno.
