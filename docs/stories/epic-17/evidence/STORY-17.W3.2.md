# Evidência — STORY-17.W3.2

Data: 2026-07-15

## Escopo e preflight

- Baseline autorizada: `wave/gate-0/public-baseline@d571775`.
- Branch/worktree isolada: `wave/17-w3/story-17.W3.2`.
- Dependência `17.W3.1`: `Done`, integrada e com QG `PASS 98/100`.
- PR coverage: nenhum PR aberto cobria `17.W3.2` ou o gate público da Aula 4.
- Fronteira: gate local, sintético e read-only sobre contratos/runtime; sem rede, credencial, publicação ou mutação externa.
- Contrato completo e allowlist inicial foram materializados em `1402b2f` antes do primeiro RED.

## TDD e decisões arquiteturais

| Marco | Commit/prova | Resultado |
|---|---|---|
| RED focal | após `1402b2f` | `node --test scripts/aula-04-release-gate.test.mjs` falhou com arquivo ausente, exit `1`. |
| GREEN inicial | worktree antes de `01059ba` | 3/4 grupos passaram; catálogo falhou somente por dois hashes obsoletos nos source-locks. |
| RED catálogo | validator real | `leitor-de-metricas` e `diagnosticador` tinham mirrors idênticos, mas hashes anteriores a W2.1/W2.2. |
| Rematerialização | `3dd123c` | Dois source-locks entraram na allowlist antes da edição; skills e validator permaneceram read-only. |
| GREEN | `01059ba` | Quatro grupos focais passaram; locks e skills/mirrors byte-idênticos; catálogo `OK`. |

Nenhum runtime foi corrigido pelo gate. A única calibração atualiza, nos dois
source-locks espelhados, os hashes das versões já integradas dos skills; nenhum
outro drift foi encontrado ou autorizado.

## Provas dos acceptance criteria

| AC | Prova |
|---|---|
| AC1 | Primeira semana W3.1 valida como WeeklyPanel e preserva receita, selo Real, sourceRef opaco, janela literal, confirmação e decisão pending no ledger. |
| AC2 | Cenários sintéticos provam `nao_fornecido` sem valor/janela/confirmação, janela incompatível sem comparação e fonte livre rejeitada sem ledger parcial. |
| AC3 | Walkthrough gera seis artefatos; request preserva decisão histórica approved e diagnóstico gera nova decisão pending, inconclusiva, sem alavanca ou mutação. |
| AC4 | Focal 4/4, Aula 4 84/84 e full Node 166/166; sete validators e três provas explícitas de mirror passaram. |
| AC5 | Materiais/outputs passam scan contextual; links são relativos, guia não usa asset remoto, exemplo permanece imutável e nenhum path privado é rastreado. |
| AC6 | Manifesto registra versões, compatibilidade, comandos, limitações e rollback sem declarar deploy. |
| AC7 | PO `READY`, QA `PASS técnico` e Architect independente `PASS 99/100` registrados; story em `Done`. |

## Resultados executáveis

```text
Focal release gate: 4 tests, 4 pass, 0 fail
Aula 4: 84 tests, 84 pass, 0 fail
Full Node: 166 tests, 166 pass, 0 fail
Validators: 7 pass, 0 fail
Mirrors explícitos: 3 pass, 0 fail
Skill catalog: 31 skills, 41 edges, canonical mirror verified
npm audit: 0 vulnerabilities
node --check: exit 0
git diff --check: exit 0
```

### Checkout limpo

Um worktree detached temporário criado do HEAD final recebeu somente
`npm --prefix scripts ci --ignore-scripts`, executou focal, full Node,
validators e mirrors e permaneceu com `git status --short` vazio. O worktree
temporário foi removido após a prova.

### Privacidade e distribuição

O teste de release escaneia README raiz, handoff da Aula 3, README/HTML,
templates, exemplo público, manifesto, evidência e os seis outputs. Padrões:
email, bearer, segredo materializado, chave privada, home absoluto Unix/Windows
e telefone/documento shaped. Resultado: zero achados. O scan usa conteúdo
sintético e não registra valores adversariais na evidência.

O catálogo passou após calibrar somente os hashes dos dois skills já integrados:

```text
leitor-de-metricas: e2bbc61fb0b288bd50f26174916005dbff316861c788f8635018048009365f7a
diagnosticador: c4a1c42434f2ecd27e55ad04203eb7685bc4a916f97c84634b79bd8c3a90127f
```

## File List real

- `scripts/aula-04-release-gate.test.mjs`
- `.claude/skills/_shared/squad-trafego/source-lock.json`
- `.agents/skills/_shared/squad-trafego/source-lock.json`
- `docs/releases/aula-04-data-loop-v1.md`
- `docs/stories/epic-17/STORY-17.W3.2-aula-04-public-release-gate.md`
- `docs/stories/epic-17/evidence/STORY-17.W3.2.md`
- `docs/stories/epic-17/EPIC-17-EVIDENCE.md`

Todos os paths pertencem à allowlist rematerializada. Validators, skills,
contratos, runtime, exemplos e `epic-17-state.json` não foram alterados.

## Handoff

- Story: `Done`.
- Implementação: `01059ba`.
- Veredito `@po`: `READY`.
- Veredito `@qa`: `PASS técnico`.
- Veredito `@architect`: `PASS 99/100`, confiança `0.99`, zero findings e blockers no HEAD `2a054a05638826cb931b2f8dc21bc35d15961baf`.
- Entity output: `Aula04PublicReleaseGateV1` aprovado para fan-in local.
- Fan-in, state, push, PR, publicação e deploy: não executados.
