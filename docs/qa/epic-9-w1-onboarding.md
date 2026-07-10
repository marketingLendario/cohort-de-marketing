# Epic 9 - Onboarding local em instalação limpa

## Escopo validado

A Story 9.W1.3 prova a composição das entregas 9.W1.1 e 9.W1.2 no launcher
oficial. O cenário parte de Supabase local vazio e percorre a jornada que um
operador não técnico executará no primeiro uso.

## Jornada E2E

`apps/academia-lendaria-ads-studio/e2e/story-9-w1-onboarding.mjs` executou com
Node 22 em portas isoladas `5193/3313`:

1. encerrou somente uma sessão residual do launcher nessas portas;
2. resetou o Supabase e confirmou `auth.users`, `workspaces` e
   `workspace_members` e `marketing_projects` em zero;
3. criou o primeiro operador e workspace pela interface;
4. criou um projeto de entrada e importou um `project-brief 0.1.0` válido;
5. confirmou projeto UUID persistido, valores e proveniência;
6. recarregou a página, reabriu o mesmo projeto em novo `BrowserContext` e
   exportou pela UI a revisão ativa `1`;
7. recusou um segundo bootstrap com `409` e autenticou novamente o owner
   original;
8. inspecionou desktop `1280x900` e mobile `390x844`.

Resultado: **PASS**. Não houve erro de console, page error, falha de rede,
resposta HTTP inesperada, overflow horizontal ou sobreposição detectada.

## Segurança e isolamento

- O runner remove `OPENAI_API_KEY` e `CODEX_API_KEY` do ambiente dos processos.
- O launcher continua usando a sessão local autenticada do Codex CLI.
- As chamadas `/api` do runner atravessam o proxy Vite, que injeta o boundary
  token server-side sem expô-lo ao script ou às evidências.
- Senha, service role e boundary token não entram no JSON nem nas capturas.
- A fixture e as evidências brutas ficam em `/tmp`; somente este relatório
  sanitizado é versionado.
- O cenário usa o `status` com ownership de command line/repo root e aborta se o
  worktree já tiver um launcher ativo. O teardown compara o `runtimeId` e
  encerra somente a sessão que o próprio E2E iniciou.
- O reset usa `--yes` e não depende de confirmação interativa.
- Healthchecks exigem resposta HTTP `ok`; falhas parciais de startup nas portas
  reservadas também entram no teardown.
- Após o reset, o runner exige Auth saudável e recicla apenas o Kong do projeto
  caso o gateway preserve um upstream antigo.
- Como o `project_id` é compartilhado entre worktrees, o E2E aborta se o
  Supabase já estiver ativo. A rodada válida inicia e encerra o próprio stack.
- Uma falha tardia do `supabase start` ainda conta como ownership quando o
  container do banco foi criado. O runner exige DB, Auth, REST e Kong e o
  teardown encerra explicitamente o `project_id`, mesmo se um serviço auxiliar
  atrasar o healthcheck.

## Gates

| Gate | Resultado |
|---|---|
| E2E onboarding limpo | PASS |
| Vitest | 37 arquivos / 291 testes PASS |
| ESLint | PASS |
| TypeScript client/server | PASS |
| Build client/server | PASS |
| Catálogo de skills | 30 skills / 40 relações / espelho canônico válido |
| DB lint | sem erros |
| pgTAP | 5 arquivos / 52 testes PASS |
| Inspeção visual desktop/mobile | PASS |

O Vitest requer URL e anon key públicas do Supabase local no ambiente do
worktree. O pgTAP de bootstrap assume estado privado vazio, portanto foi rodado
após um reset explícito; o E2E havia deixado, corretamente, o onboarding
concluído.

## Evidência visual

- Desktop: `/tmp/story-9-w1-onboarding-evidence/briefing-desktop.png`
- Mobile: `/tmp/story-9-w1-onboarding-evidence/briefing-mobile.png`
- Projetos: `/tmp/story-9-w1-onboarding-evidence/projects-desktop.png`
- Manifesto sanitizado: `/tmp/story-9-w1-onboarding-evidence/run.json`

As capturas mostram o shell completo, navegação de projeto, briefing e campos
importados. A composição mobile reorganiza a navegação e o contexto sem
sobreposição ou conteúdo fora da largura útil.

## Risco residual

Os labels dos campos dinâmicos do briefing apontam hoje para o wrapper do
controle, não para o `input` interno. O E2E localiza esses campos pelo container
semântico da linha. A correção de associação label-controle fica registrada
para a Story 9.W3.1, dedicada à usabilidade em campo, e não bloqueia o gate W1.
