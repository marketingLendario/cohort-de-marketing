---
status: Done
story_id: "16.W3.1"
title: "Gate público de contrato e distribuição"
epic: 16
wave: "W3"
parent_epic: "docs/stories/epic-16/EPIC-16-CANONICAL-PROJECT.md"
effort: 8h
deploy_type: none
appetite: 1d
hill_phase: done
confidence_level: know-how
involves_ui: false
task_mode: VALIDAR
cli: codex
executor: "@qa"
quality_gate: "@architect"
model: "opus"
repo_target: "cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["16.W1.2", "16.W2.2", "16.W2.3"]
consumes_artifacts_of: ["16.W1.1", "16.W1.2", "16.W2.1", "16.W2.2", "16.W2.3"]
entity_input:
  entity_type: "PublicProjectContract"
  description: "ProjectBrief v1, ArtifactIndex, catálogo, regras e superfícies públicas concluídos nas waves W1 e W2."
  status_expected: "implemented-and-locally-verified"
entity_output:
  entity_type: "PublicProjectContractReleaseGate"
  description: "Contrato público validado em checkout limpo, com compatibilidade, distribuição, privacidade e rollback demonstrados."
  status_expected: "release-ready-for-independent-signoff"
artifact_contract:
  type: "release-gate-evidence"
  path: "docs/stories/epic-16/evidence/STORY-16.W3.1.md"
  release_manifest: "docs/releases/project-brief-v1.md"
  required_signoffs: ["@po", "@architect", "@qa"]
file_scope: public-release-gate
touched_paths:
  - "scripts/validate-project-brief-rules.mjs"
  - "scripts/validate-skill-catalog.mjs"
  - "scripts/validate-mapa-wiring.mjs"
  - "scripts/validate-mapa-skills.mjs"
  - "scripts/validate-mapa-preview.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "scripts/lib/skill-readiness.test.mjs"
  - "data/contracts/fixtures/project-brief/project-brief-contract.test.mjs"
  - "briefing.html"
  - "mapa-skills.html"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - ".claude/skills/comecar/SKILL.md"
  - ".claude/skills/status-funil/SKILL.md"
  - ".agents/skills/comecar/SKILL.md"
  - ".agents/skills/status-funil/SKILL.md"
  - "docs/releases/project-brief-v1.md"
  - "docs/stories/epic-16/STORY-16.W3.1-public-contract-release-gate.md"
  - "docs/stories/epic-16/evidence/STORY-16.W3.1.md"
  - "docs/stories/epic-16/EPIC-16-EVIDENCE.md"
  - "docs/stories/epic-16/epic-16-state.json"
affected_paths:
  - "scripts/validate-project-brief-rules.mjs"
  - "scripts/validate-skill-catalog.mjs"
  - "scripts/validate-mapa-wiring.mjs"
  - "scripts/validate-mapa-skills.mjs"
  - "scripts/validate-mapa-preview.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "scripts/lib/skill-readiness.test.mjs"
  - "data/contracts/fixtures/project-brief/project-brief-contract.test.mjs"
  - "briefing.html"
  - "mapa-skills.html"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - ".claude/skills/comecar/SKILL.md"
  - ".claude/skills/status-funil/SKILL.md"
  - ".agents/skills/comecar/SKILL.md"
  - ".agents/skills/status-funil/SKILL.md"
  - "docs/releases/project-brief-v1.md"
  - "docs/stories/epic-16/STORY-16.W3.1-public-contract-release-gate.md"
  - "docs/stories/epic-16/evidence/STORY-16.W3.1.md"
  - "docs/stories/epic-16/EPIC-16-EVIDENCE.md"
  - "docs/stories/epic-16/epic-16-state.json"
---

# STORY-16.W3.1 - Gate público de contrato e distribuição

> **Depends On:** `16.W1.2`, `16.W2.2`, `16.W2.3`
> **Estimated Effort:** 8h

## Story

**As a / Como** mantenedor da distribuição pública do Cohort de Marketing
**I want / Quero** executar um gate reproduzível do contrato de projeto em checkout limpo
**so that / Para** liberar a próxima etapa sem regressão semântica, divergência de mirror ou vazamento de dados privados.

## Acceptance Criteria

- [x] AC1: Em checkout limpo e servidor HTTP local, um projeto novo completa o briefing, exporta `ProjectBrief` v1, reimporta o arquivo e recebe exatamente a mesma `SkillReadinessDecision` (`nextSkill`, comando e razão) antes e depois do round-trip.
- [x] AC2: Uma fixture legada suportada migra para `ProjectBrief` v1 sem perder campos semanticamente equivalentes, sem apagar dados desconhecidos preserváveis e sem mudar a próxima skill calculada para o mesmo estado do projeto.
- [x] AC3: Os validators de ProjectBrief, catálogo e mapa passam; os `SKILL.md` canônicos/mirrors e as distribuições HTML raiz/Aula 3 permanecem byte a byte equivalentes nos pares declarados.
- [x] AC4: Smokes em viewport desktop e mobile carregam briefing e mapa por HTTP, sem `pageerror`, erro de console, falha CSP/MIME ou divergência na próxima skill apresentada.
- [x] AC5: Um scan reproduzível do diff e das evidências não encontra segredo, credencial, PII, path absoluto de máquina nem artefato de cliente; evidências registram somente fixtures sintéticas e resultados sanitizados.
- [x] AC6: `docs/releases/project-brief-v1.md` registra versões exatas dos contratos consumidos, matriz de compatibilidade, comandos de verificação, limitações e rollback local sem declarar push, publicação ou deploy.
- [x] AC7: A evidência liga `PublicProjectContract` a `PublicProjectContractReleaseGate`, inclui resultados de checkout limpo e todos os comandos; a story permanece `InReview` até vereditos independentes de PO, Architect e QA.

## Tasks

- [x] Confirmar dependências `Done`, baseline, worktree isolado e ausência de PR aberto cobrindo este escopo.
- [x] Congelar o contrato e registrar o primeiro gate executável antes de qualquer correção.
- [x] Executar round-trip de projeto novo e migração legada com igualdade da próxima skill.
- [x] Executar suites Node, validators, paridade de mirrors/distribuições e smokes HTTP desktop/mobile em checkout limpo.
- [x] Executar scans de secrets, PII, paths absolutos e artefatos privados sobre diff e evidências.
- [x] Registrar release manifest, evidência sanitizada, File List real e transição da entidade para revisão independente.

## File List

- `scripts/lib/skill-readiness.test.mjs`
- `scripts/project-brief-io.test.mjs`
- `docs/releases/project-brief-v1.md`
- `docs/stories/epic-16/STORY-16.W3.1-public-contract-release-gate.md`
- `docs/stories/epic-16/evidence/STORY-16.W3.1.md`
- `docs/stories/epic-16/EPIC-16-EVIDENCE.md`
- `docs/stories/epic-16/epic-16-state.json`

A File List acima registra os sete paths realmente alterados. `touched_paths` e
`affected_paths` preservam a allow-list congelada: os demais paths foram somente
lidos/executados para validação. Nenhum arquivo de runtime foi corrigido.

## Dev Notes

- O baseline autorizado é `wave/gate-0/public-baseline@779cca22a0365ed7e7dd8d7c2d1f20407f939134`; a worktree da story deve permanecer isolada da integração e do checkout canônico.
- `deploy_type: none`: esta story não publica release, não cria PR e não executa deploy. O documento de release é um manifesto de prontidão local.
- Todos os dados de teste devem vir das fixtures públicas e sintéticas versionadas. Não copiar outputs, perfis, tokens ou arquivos de projeto reais para a evidência.
- O mesmo motor público da W2.3 calcula a próxima skill. O gate não pode criar uma segunda implementação de readiness nem derivar estado pelo DOM.
- `involves_ui: false` porque o escopo esperado não altera UI; os smokes exercitam as superfícies existentes como validação de distribuição.
- O executor `@qa` produz o veredito técnico da execução. O gate final é independente, por `@architect`; os sign-offs de PO/Architect/QA não podem ser autoatribuídos por um único executor.

## Executor Assignment

```yaml
executor: "@qa"
quality_gate: "@architect"
model: "opus"
quality_gate_tools: ["node:test", "validators", "playwright", "mirror-parity", "secret-scan"]
repo_target: "cohort-de-marketing"
deploy_type: none
```

## Validation Matrix

| Gate | Comando/Prova | Resultado exigido |
|---|---|---|
| Contract | suites Node de ProjectBrief, ArtifactIndex, readiness e superfícies | 0 falhas; round-trip e legado cobertos |
| Validators | quatro validators públicos | saída `OK`; exit 0 |
| Mirrors | `cmp` dos pares canônico/mirror e raiz/Aula 3 | byte a byte idênticos |
| Distribution | servidor HTTP local + Playwright em desktop/mobile | sem pageerror/console error/CSP/MIME failure |
| Privacy | scan do diff e docs produzidos | zero secrets, PII, paths absolutos ou artefatos privados |
| Checkout | clone/worktree temporário a partir do HEAD da story | mesmos resultados do diretório de desenvolvimento |
| Release | `docs/releases/project-brief-v1.md` | versão, compatibilidade e rollback explícitos |

## Dev Agent Record

- Executor: `@qa`
- Branch: `wave/16-w3/story-16.W3.1`
- Baseline: `779cca22a0365ed7e7dd8d7c2d1f20407f939134`
- Contrato: `83b6b0a`
- RED do gate: `39769eb`
- Calibração das assertions públicas: `6943694`
- Live PR coverage: nenhum PR aberto cobria o escopo.
- Matriz: 69/69 testes declarados PASS; quatro validators e quatro pares de paridade PASS.
- Checkout limpo: PASS no HEAD da implementação do gate; worktree temporário removido.
- Entity proof: `PublicProjectContractReleaseGate` está `release-ready-for-independent-signoff`.
- Deploy: não aplicável (`deploy_type: none`).

## QA Results

### Executor gate

- Reviewer/executor: `@qa`
- Resultado: `PASS técnico`
- Testes: 69/69 declarados, 0 falhas.
- Checkout limpo: PASS.
- Smokes: quatro distribuições × desktop/mobile, CSP/MIME, pageerror/console; PASS.
- Privacidade: zero secrets, PII, paths de máquina ou artefatos de cliente no diff.
- Evidência: `docs/stories/epic-16/evidence/STORY-16.W3.1.md`.

### Quality gate independente

- Reviewer: `@architect`
- Resultado: `PASS 98/100`.
- Confiança: alta.
- Blocking findings: 0.
- HEAD avaliado: `dfbdf1025c225f7b75de0fb51f55915925298551`.
- Decisão: gate aprovado sem remediação adicional; story autorizada a fechar.

Os registros de `@po` e `@qa` acima são evidências das fases sequenciais desta
execução SDC, não identidades humanas adicionais. O veredito de `@architect` é
o quality gate independente recebido após o handoff `InReview`.

## Stop Conditions

- Qualquer capability loss ou mudança da próxima skill entre exportação e reimportação.
- Migração legada descartar informação semanticamente preservável.
- Validator, mirror, distribuição, smoke ou privacy scan falhar.
- Evidência depender de dado privado não redistribuível.
- Sign-off estrutural pendente ou autoaprovação dos três papéis.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato SDC materializado, allow-list congelada e story validada como `Ready` para execução por `@qa`. |
| 2026-07-15 | @qa | Novas provas congeladas em RED no commit `39769eb`; diferença do ArtifactIndex separado e assertion incompatível com a fixture foram identificadas. |
| 2026-07-15 | @qa | Assertions alinhadas ao contrato público no commit `6943694`; 69 testes, checkout limpo, validators, paridade, smokes e scans aprovados sem correção de runtime. |
| 2026-07-15 | @qa | Release manifest e evidência sanitizada registrados; story movida para `InReview` e entregue ao `@architect`. |
| 2026-07-15 | @architect | QG independente `PASS 98/100`, confiança alta e zero findings no HEAD `dfbdf10`. |
| 2026-07-15 | @qa | SDC fechado após o QG; `status: Done`, `hill_phase: done` e fan-in liberado exclusivamente para `@devops`. |
