# ProjectBrief v1 — manifesto de prontidão local

Data do gate: 2026-07-15

Story: `16.W3.1`

Status: **gate local aprovado; pronto para fan-in; não publicado**

## Versões congeladas

| Contrato | Versão |
|---|---|
| ProjectBrief revision | `1.0.0` |
| Dados canônicos internos do briefing | `0.1.0` |
| Skill catalog | `1.0.0` |
| Skill unlock rules | `0.1.0` |
| ArtifactIndex | `artifact-index-v1` |
| Readiness refs | `skill-readiness-contract-refs-v1` |
| Readiness decision | `skill-readiness-decision-v1` |

As versões acima vêm dos schemas e contratos versionados no repositório. Este
manifesto não altera nem substitui essas fontes.

## Compatibilidade

| Entrada/superfície | Resultado suportado |
|---|---|
| ProjectBrief `1.0.0` | validação estrita e round-trip JSON idempotente |
| ProjectBrief legado `0.1.0` | migração explícita para v1, com dados e proveniência semanticamente preservados |
| Versão desconhecida | rejeição fail-closed, sem downgrade implícito |
| Briefing e mapa raiz | decisão pública derivada dos mesmos contratos |
| Cópias da Aula 3 | byte a byte equivalentes às superfícies raiz |
| `comecar` e `status-funil` | mirrors canônico/Codex equivalentes e mesmo call pattern público |
| Desktop `1440x900` e mobile `390x844` | smoke HTTP/CSP/MIME sem pageerror ou erro de console |

## Verificação reproduzível

Executar a partir da raiz de um checkout limpo:

```bash
cd scripts && npm ci && cd ..
node --test --test-concurrency=1 data/contracts/fixtures/project-brief/project-brief-contract.test.mjs
node --test --test-concurrency=1 scripts/lib/skill-readiness.test.mjs
node --test --test-concurrency=1 scripts/project-artifact-index.test.mjs
node --test --test-concurrency=1 scripts/project-brief-io.test.mjs
node --test --test-concurrency=1 scripts/skill-surface-data-driven.test.mjs
node scripts/validate-project-brief-rules.mjs
node scripts/validate-skill-catalog.mjs
node scripts/validate-mapa-wiring.mjs
node scripts/validate-mapa-skills.mjs
```

Paridade obrigatória:

```bash
cmp .claude/skills/comecar/SKILL.md .agents/skills/comecar/SKILL.md
cmp .claude/skills/status-funil/SKILL.md .agents/skills/status-funil/SKILL.md
cmp briefing.html aula-03/materiais/briefing.html
cmp mapa-skills.html aula-03/materiais/mapa-skills.html
```

## Limitações conhecidas

- A exportação do ProjectBrief contém o briefing, não o ArtifactIndex. O índice
  continua sendo um contrato separado, confinado ao projeto e precisa ser
  reconstruído/revalidado quando artefatos locais forem relevantes.
- A igualdade da rota pós-round-trip é provada para um projeto novo sintético,
  sem artefatos confirmados: `state`, `nextSkill`, `command` e `reason` não mudam.
- Esta story executa somente gate local (`deploy_type: none`). Nenhum push, tag,
  pacote ou publicação externa faz parte deste manifesto.

## Rollback

Se o gate independente reprovar antes do fan-in, não integrar a branch da
story. Se a mudança já tiver sido integrada localmente, criar um `git revert`
dos commits da Story `16.W3.1`; não reverter individualmente os contratos W1/W2.
Reexecutar os cinco arquivos de teste e os quatro validators acima antes de
uma nova tentativa. Qualquer distribuição externa futura deve continuar
bloqueada até novo veredito PO/Architect/QA.

## Sign-offs

| Papel | Estado | Evidência |
|---|---|---|
| Product Owner | contrato validado | materialização SDC em `83b6b0a` |
| QA executor | PASS técnico | matriz, checkout limpo, smokes e scans em `STORY-16.W3.1.md` |
| Architect quality gate | PASS 98/100 | confiança alta, zero findings, HEAD `dfbdf10` |

Os registros de Product Owner e QA correspondem às fases sequenciais desta
execução SDC. O Architect executou o quality gate independente.

Veredito de release local: **PASS — READY FOR DEVOPS FAN-IN**. Este veredito
não declara publicação, push, merge ou deploy.
