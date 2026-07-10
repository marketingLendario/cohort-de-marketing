---
epic_id: 8
title: "Persistência e Runtime Operacional do Marketing Studio"
state_file: "docs/stories/epic-8/epic-8-state.json"
status: InProgress
owner: cohort-marketing
accountable: "Rafael Costa"
created: 2026-07-09
---

# EPIC-8 - Persistência e Runtime Operacional

## Objetivo

Transformar o MVP local do Marketing Studio em uma ponte operacional confiável
para alunos não técnicos: estado durável no Supabase, artefatos canônicos no
filesystem, execução do Codex CLI protegida e retomável, revisão humana em duas
fases e um launcher de uso simples.

## Contexto

O corte anterior validou o shell unificado, os contratos, as 30 skills e a
execução local do Codex CLI. Este epic fecha os gaps de produção observados:

- o domínio unificado ainda usa `localStorage` como SOT;
- propostas aprovadas não materializam arquivos em `projetos/{slug}/`;
- o runner é síncrono e o JobStore é process-local;
- o endpoint local precisa de boundary de segurança explícito;
- o piloto real das cinco skills de tráfego ainda não foi executado;
- o dashboard legado ainda contém superfícies placeholder.

## Decisões

| ID | Decisão |
|---|---|
| D1 | Nome público: **Marketing Studio**; Ads Studio permanece como módulo de campanhas. |
| D2 | Artefatos: modelo híbrido. Filesystem é canônico; Supabase guarda metadados, hash, revisão e snapshot opcional. |
| D3 | Colaboração: optimistic concurrency por revisão; sem coedição em tempo real neste epic. |
| D4 | Economia: defaults pertencem ao projeto; campanha registra somente overrides explícitos e proveniência. |
| D5 | Codex CLI roda efêmero e `read-only`; escrita definitiva pertence a um materializador separado após aprovação humana. |
| D6 | Meta continua recommend-only: nenhuma publicação, pausa, kill ou escala automática. |

## Waves

### W1 - Fundações isoláveis

**Status:** Done em 2026-07-09. Fan-in local `4dfa684`, quality gate integrado
PASS (113 testes, lint, typecheck, builds e pgTAP 10/10).

- 8.W1.1 - Repository Supabase do domínio unificado
- 8.W1.2 - Boundary seguro do runner Codex CLI local
- 8.W1.3 - Materializador atômico de artefatos

As três stories têm ownership de arquivos disjunto e podem executar em paralelo.

### W2 - Integração operacional

**Status:** Done em 2026-07-10. Fan-in local `1ebb131`, quality gate final
**SHIP** (238 testes, lint, typecheck, builds, pgTAP 43/43, matriz SQL 21/21 e
probes filesystem source/compilado sem escrita externa, vazamento ou path
incorreto).

- 8.W2.1 - Hidratação e persistência da UI via repository
- 8.W2.2 - Runs duráveis, assíncronos e observáveis
- 8.W2.3 - Aprovação em duas fases: DB + filesystem

### W3 - Piloto e entrega

**Status:** InProgress em 2026-07-10. 8.W3.1 e 8.W3.2 concluídas com gate
independente `SHIP`; 8.W3.3 está Ready e é o último batch do epic.

- 8.W3.1 - E2E real do Squad de Tráfego
- 8.W3.2 - Cutover legado e alertas do monitor
- 8.W3.3 - Launcher e readiness para não devs

## Gates do epic

1. Nenhuma entidade operacional depende de `localStorage` fora do modo demo.
2. Um projeto reabre em outra sessão com a mesma revisão e os mesmos artefatos.
3. Uma proposta aprovada gera arquivo canônico e registro Supabase com o mesmo hash.
4. Runner local não aceita chamada sem boundary token e escuta somente loopback por padrão.
5. Execução longa oferece job id, progresso, cancelamento, retry e retomada.
6. As cinco skills de tráfego passam em sequência contra um projeto fixture real.
7. Um aluno inicia e diagnostica o ambiente com um único comando.
8. Testes unitários, integração, RLS, E2E e validação visual passam.

## Fora de escopo

- mutação automática na Meta;
- Google Ads;
- colaboração em tempo real;
- substituir skills canônicas por prompts no banco;
- deploy cloud do processo que executa o Codex CLI local.

## Execução

Orquestração por `/sinkra-wave-execute epic-8`, com preflight determinístico,
DAG por ownership, worktree por story, `/sinkra-full-cycle` por child e fan-in
exclusivo de `@devops`. W1, W2 e o primeiro batch de W3 estão concluídos;
resume point atual: `8.W3.3` (launcher e readiness para não devs).
