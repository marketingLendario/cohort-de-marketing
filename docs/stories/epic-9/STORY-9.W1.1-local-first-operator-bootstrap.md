---
status: Done
story_id: "9.W1.1"
title: "Bootstrap local do primeiro operador"
epic: 9
wave: "W1"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 2d
hill_phase: figuring_out
confidence_level: high
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/local-bootstrap.ts"
  - "apps/academia-lendaria-ads-studio/server/local-bootstrap.test.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/local-bootstrap.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/local-bootstrap.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/local-first-run.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/local-first-run.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/login-form.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/login-form.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/index.css"
  - "docs/stories/epic-9/STORY-9.W1.1-local-first-operator-bootstrap.md"
---

# STORY-9.W1.1 - Bootstrap local do primeiro operador

## User Story

**Como** aluno abrindo o Studio pela primeira vez
**Quero** criar meu acesso local pela interface
**Para** começar sem SQL, Supabase Studio ou credenciais pré-semeadas.

## Acceptance Criteria

1. A tela de login detecta um runtime local realmente vazio e oferece criação do primeiro acesso.
2. Status e criação exigem o boundary token do BFF e funcionam apenas em loopback.
3. E-mail, senha e nome do workspace são validados; senha e service role nunca aparecem em logs ou responses posteriores.
4. A criação gera usuário confirmado, workspace e membership owner; falha intermediária compensa o que já foi criado.
5. O bootstrap fecha quando existir qualquer usuário/workspace/membership e não pode criar um segundo owner.
6. Após criar, a UI autentica pelo fluxo normal do Supabase e abre `Seus projetos`.
7. Testes cobrem vazio, repetição, requisição sem token, validação e compensação.

## Tasks

- [x] Implementar serviço one-shot no BFF.
- [x] Expor status e criação sob o boundary local existente.
- [x] Criar formulário de primeiro acesso e integração com login.
- [x] Sanitizar erros e impedir vazamento de segredo.
- [x] Cobrir backend e UI com testes.

## File List

| Arquivo | Operação |
|---------|----------|
| `apps/academia-lendaria-ads-studio/server/local-bootstrap.ts` | ADD |
| `apps/academia-lendaria-ads-studio/server/local-bootstrap.test.ts` | ADD |
| `apps/academia-lendaria-ads-studio/server/app.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/src/lib/local-bootstrap.ts` | ADD |
| `apps/academia-lendaria-ads-studio/src/lib/local-bootstrap.test.ts` | ADD |
| `apps/academia-lendaria-ads-studio/src/components/local-first-run.tsx` | ADD |
| `apps/academia-lendaria-ads-studio/src/components/local-first-run.test.tsx` | ADD |
| `apps/academia-lendaria-ads-studio/src/components/login-form.tsx` | MODIFY |
| `apps/academia-lendaria-ads-studio/src/components/login-form.test.tsx` | ADD |
| `apps/academia-lendaria-ads-studio/src/index.css` | MODIFY |
| `docs/stories/epic-9/STORY-9.W1.1-local-first-operator-bootstrap.md` | MODIFY |

## Dev Agent Record

### Implementação

- Serviço BFF usa `auth.admin` e operações de workspace/membership somente no
  backend; cria usuário confirmado, workspace e owner, com compensação reversa.
- Status é `empty` somente quando usuários, workspaces e memberships estão
  todos vazios; lock por processo e rechecagem fecham o bootstrap one-shot.
- Rotas exigem loopback e `x-local-runner-token`; respostas de criação e erros
  são sanitizadas e não incluem senha, service role ou boundary token.
- UI oferece o primeiro acesso na tela de login e, após a criação, chama
  `signInWithPassword`, deixando o fluxo normal abrir `Seus projetos`.

### Evidências

- Backend: vazio, repetição, validação, ausência de token, loopback,
  compensação e ausência de segredos cobertos em `server/local-bootstrap.test.ts`.
- Cliente/UI: status sanitizado, submissão, login Supabase e fallback de login
  cobertos nos testes dedicados.

## QA Gate

**Veredito:** PASS em 2026-07-10. Nenhum finding P0/P1/P2.

- Boundary local permanece server-side; o serviço não usa `OPENAI_API_KEY` nem
  `CODEX_API_KEY`, e não expõe credenciais em response/log da nova superfície.
- Autenticação continua sendo a sessão local do Codex CLI no runner existente.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @dev | Implementação do bootstrap local one-shot, UI de primeiro acesso, testes focados e gates completos. Status Ready → Done. |

## Validação executada

- Testes focados: 4 arquivos / 8 testes — PASS.
- `npm test` com `VITE_SUPABASE_URL` e anon key local de teste: 36 arquivos / 276 testes — PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run build:server`: PASS.
- `git diff --check`: PASS; mudanças restritas aos `touched_paths` da story.
