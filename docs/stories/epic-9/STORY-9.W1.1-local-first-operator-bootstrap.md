---
status: Ready
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

- [ ] Implementar serviço one-shot no BFF.
- [ ] Expor status e criação sob o boundary local existente.
- [ ] Criar formulário de primeiro acesso e integração com login.
- [ ] Sanitizar erros e impedir vazamento de segredo.
- [ ] Cobrir backend e UI com testes.

## File List

- A preencher durante a implementação.
