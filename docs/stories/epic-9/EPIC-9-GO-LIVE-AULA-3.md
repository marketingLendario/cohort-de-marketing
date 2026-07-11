---
epic_id: 9
title: "Go-live local da Aula 3"
state_file: "docs/stories/epic-9/epic-9-state.json"
status: Done
owner: cohort-marketing
accountable: "Rafael Costa"
created: 2026-07-10
---

# EPIC-9 - Go-live local da Aula 3

## Objetivo

Levar o Marketing Studio do runtime tecnicamente validado ao primeiro uso real
por uma pessoa não técnica: partir de um banco vazio, criar o primeiro acesso,
importar um projeto durável, reconciliar seus artefatos do filesystem e concluir
um ciclo do Squad de Tráfego sem terminal e sem mutação na Meta.

## Evidência que abriu o epic

- O launcher oficial está `ready` com Node 22, Codex CLI, Supabase, BFF e Vite.
- O piloto técnico executou as cinco skills, recusa, retry e 12 reloads.
- Um banco limpo contém zero usuários, zero workspaces e zero projetos.
- O login real não oferece criação do primeiro operador.
- A importação legada do briefing ainda escreve diretamente no cache Zustand.
- `projetos/academia-fit` é uma amostra; não vale como adoção de campo.
- A fonte real da Academia Lendária continua externa e deve ser importada por
  manifesto, sem virar dependência de runtime do `sinkra-hub`.

## Decisões

| ID | Decisão |
|---|---|
| D1 | Bootstrap existe somente no runtime local em loopback e exige o boundary token injetado pelo proxy. |
| D2 | O primeiro operador escolhe e-mail e senha; nenhuma credencial fixa ou segredo entra no repositório/log. |
| D3 | Bootstrap é one-shot e fecha assim que existir usuário, workspace ou membership. |
| D4 | Importação real passa pelo repository; Zustand continua apenas cache fora do demo. |
| D5 | Filesystem é canônico para artefatos e a entrada no banco registra path, hash, tipo e proveniência. |
| D6 | A fonte externa é lida por manifesto versionado e nunca é alterada pelo Studio. |
| D7 | Meta permanece recommend-only; publicação e decisões continuam humanas. |
| D8 | Por decisão explícita do accountable, a rodada Codex operator-proxy vale como gate operacional; a primeira observação humana passa a monitoramento pós-ship, sem ser falsamente registrada como já realizada. |

## Waves

### W1 - Primeiro acesso e projeto durável

- 9.W1.1 - Bootstrap local do primeiro operador
- 9.W1.2 - Importação durável do briefing
- 9.W1.3 - E2E de onboarding em instalação limpa

### W2 - Projeto real e operação

- 9.W2.1 - Intake seguro de artefatos do filesystem
- 9.W2.2 - Pacote piloto da Academia Lendária
- 9.W2.3 - Ciclo operacional da Aula 3 em projeto real

### W3 - Aceite e go-live

- 9.W3.1 - Evidência de usabilidade e métricas do piloto
- 9.W3.2 - Onboarding e recuperação para alunos
- 9.W3.3 - Gate de go-live e handoff para Aula 4

## Gates do epic

1. Um clone com banco vazio permite criar o primeiro operador pela interface.
2. Bootstrap não reabre depois do primeiro owner e não expõe service role.
3. Briefing importado reaparece após reload e nova sessão.
4. Artefatos selecionados do filesystem entram por manifesto, path e hash.
5. Um projeto real conclui Zelador, Briefista, Curadoria, Estruturador, Leitor e
   Diagnosticador com aprovação humana.
6. O accountable aprova a prova operacional proxy e mantém a primeira execução de aluno real como monitoramento pós-ship.
7. O relatório registra tempo, bloqueios, recuperações e decisões sem PII.
8. Testes, lint, typecheck, builds, pgTAP e Playwright passam.

## Fechamento

Verdict **SHIP** emitido em 2026-07-11. Evidência e handoff:
`docs/qa/epic-9-go-live-gate.md`.

## Fora de escopo

- publicação, pausa, kill ou escala automática na Meta;
- conta compartilhada ou autenticação cloud;
- Google Ads;
- telemetria externa com dados pessoais;
- colaboração em tempo real;
- Aula 4 antes do aceite de campo da Aula 3.

## Execução

Orquestrar por `/sinkra-wave-execute epic-9 W1`. W1.1 e W1.2 podem executar em
paralelo por ownership disjunto; W1.3 consome ambas. W2 e W3 só avançam quando a
wave anterior estiver `Done` e suas evidências existirem no repositório.
