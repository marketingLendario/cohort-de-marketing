# Gate de go-live — Epic 9

Data: **2026-07-11**
Verdict: **SHIP**
Escopo: Marketing Studio local da Aula 3

## Decisão

O baseline final está apto para uso local. Não há blocker aberto de primeiro
acesso, persistência, segurança, retomada, operação semanal ou mutação externa.
O accountable autorizou a sessão Codex operator-proxy como evidência operacional
pré-ship. Essa decisão não converte o proxy em participante humano: a primeira
execução de aluno real será monitorada pós-ship.

## Gates finais

| Gate | Resultado | Evidência |
|---|---|---|
| Primeiro acesso one-shot | PASS | Story 9.W1.3, Playwright em instalação limpa |
| Briefing persistido e acessível | PASS | reload, logout/login e labels semânticos reais |
| Intake confinado e reconciliado | PASS | 5 artefatos, path relativo e SHA-256 |
| Squad completo | PASS | Zelador, Briefista, curadoria, Estruturador, Leitor e Diagnosticador |
| Operação semanal | PASS | leitura literal, diagnóstico, decisão `approved` e três eventos append-only |
| Retomada | PASS | reloads, novo BrowserContext e restart do launcher |
| Segurança | PASS | loopback, token local, journal backend-only, scanner de segredos e RLS |
| Recommend-only | PASS | campanha permaneceu `draft`; zero request/log de publicação Meta |
| Privacidade da evidência | PASS | sem caminho absoluto, input bruto, senha, PII ou segredo |
| Desktop/mobile | PASS | piloto 1280x900/390x844 e QA visual de 12 rotas/capturas |

## Matriz executada

- Vitest: **41 arquivos, 319 testes**.
- pgTAP: **6 arquivos, 61 testes**; `supabase db lint`: zero erro.
- Launcher unitário: **8 testes**.
- `typecheck`, `lint`, build web e build server: **PASS**.
- Onboarding limpo 9.W1.3: **PASS**.
- Ciclo real 9.W2.3 ampliado: **PASS**, 5 skills e operação semanal.
- Piloto do Squad 8.W3.1: **1 passed (4.4m)**.
- Launcher 8.W3.3 e cutover 8.W3.2: **PASS**.
- QA visual: **6 rotas desktop + 6 rotas mobile, zero erro**.

## Achados fechados

1. Artefatos canônicos duplicados: espelho Zustand agora não dispara segunda persistência; E2E exige unicidade por `path + artifact_type`.
2. Journal de jobs mutável pelo browser: `authenticated` ficou somente leitura; service role mantém DML.
3. Endpoints locais acessíveis fora de loopback: runner, approval e intake agora respondem 403.
4. Labels do briefing ligados ao wrapper: controles reais agora recebem `id`/`htmlFor` ou `aria-labelledby`.
5. Evidência com payload bruto: propostas, inputs, jobs e paths absolutos são resumidos ou hashados.
6. Diagnosticador semanal sem contexto canônico: a tela agora envia artifacts, `trafficPanel` e leitura semanal literal.
7. Recusa sem artefato presa em revisão: ausência de artefato primário agora falha com erro tratável e retry.
8. Bootstrap consultado no demo: `LocalFirstRun` não monta em modo demo.

## Handoff Aula 4

Contratos reaproveitáveis:

- `project_brief_revisions` como fonte de briefing versionado;
- `project_artifacts` com path, tipo, hash, proveniência e verificação;
- `PAINEL-DA-SEMANA.yaml` como memória compartilhada do Squad;
- `ads_weekly_panels` com revisão, eventos append-only, diagnóstico e decisão humana;
- `skill_runs`, `skill_run_jobs` e outbox de aprovação como trilha de execução;
- campaign em `draft` como boundary explícito antes de qualquer operação externa.

Dados ainda ausentes devem continuar `null`, `unknown` ou `nao_fornecido`, com
fonte e selo. A Aula 4 não recebe permissão implícita para publicar, pausar,
escalar ou encerrar campanhas Meta. Qualquer integração externa exige story,
consentimento e gate próprios.

## Kill switch

Reabrir o epic e suspender o uso se o primeiro aluno real revelar: perda de
estado, exposição de segredo/PII, artefato fora de `projetos/`, campanha saindo de
`draft` sem ação humana ou incapacidade de retomar após reload/restart.

## Evidências

- `data/pilots/epic-9-field-observation-proxy-2026-07-10-01.json`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/run.json`
- `/tmp/story-9-w1-onboarding-evidence`
- `/tmp/story-9-w2-real-project-evidence/run.json` — SHA-256 `671566b48d1632371a9bcd7142d0dd20cdee029b92c8ac4d19816061c6410c56`
- `/tmp/story-8-w3-3-evidence`
- `/tmp/story-8-w3-2-final`
- `/tmp/cohort-marketing-visual-qa`
