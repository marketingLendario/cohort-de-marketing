# EPIC-12 — Piloto integrado do gate de campanhas (STORY-12.W5.1)

> **Accountable:** Pedro Valério · **Executor:** @qa · **Quality gate:** @po
> **Data:** 2026-07-16 · **Veredito:** PASS (prova, não afirmação)
> **Evidência bruta sanitizada:** `docs/qa/evidence/epic-12-campaign-readiness.json`

Prova E2E única que integra, contra um backend **REAL** (Supabase local +
BFF real + execução real do Codex CLI — nunca demo mode, nunca a Graph API da
Meta), o trabalho das waves W1–W4 do épico: o contrato `campaign-readiness.v1`
(W1), a UX do gate (W2), a execução observável com recovery (W3) e o cutover
legado/RPC transacional (W4).

## Ambiente

| Componente | Valor |
|---|---|
| Supabase | local `127.0.0.1:54321` (`service_role` só na fixture; app usa `anon` sob RLS) |
| BFF | local `127.0.0.1:3303`, `LOCAL_SKILL_RUNNER_ENABLED=true` |
| Vite | local `127.0.0.1:5179`, `VITE_DEMO_AUTH=false` |
| Codex CLI | real, `codex exec --sandbox read-only` (execução ao vivo do Briefista) |
| Runner | `npm run test:e2e:campaign-readiness-pilot` (Playwright, `--workers=1`) |

## Resultado da suíte — 8/8 verdes

| # | Teste | AC | Resultado |
|---|---|---|---|
| 1 | Projeto vazio bloqueia Campanhas, pendência com ação inline, zero campanha criada | AC1 | PASS |
| 2 | Projeto vazio permanece bloqueado em 390px, sem overflow | AC1/AC4 | PASS |
| 3 | Checklist "warning": painel real mostra `ready_with_warnings` sem bloqueio | AC1 | PASS |
| 4 | Rota legada com campanha existente → ponte real para o workspace unificado | AC3 | PASS |
| 5 | Projeto pronto: cria draft (RPC) + Briefista ao vivo + recovery completo | AC2/AC3/AC4 | PASS |
| 6 | Desktop e mobile 390px sem overflow no journey de criação, foco por teclado | AC4 | PASS |
| 7 | Nenhum erro de console/rede inesperado (ruído pré-existente documentado) | AC4 | PASS |
| 8 | Zero requisição mutativa a domínio da Meta em toda a suíte | AC5 | PASS |

## Evidência por AC

- **AC1 (bloqueio real):** o projeto "vazio" (nome em branco) tem o nav
  "Campanhas" com `aria-disabled=true`, badge de pendência `1`, `title`
  "Campanhas bloqueada… Projeto sem nome válido", o clique não navega
  (`preventDefault` real) e a ação inline "Corrigir" leva ao campo real do
  briefing. Zero campanha criada antes/depois (`campaignsCreated: 0`,
  `blockingCode: PROJECT_NAME_INVALID`). Mobile 390px idem, sem overflow.
- **AC2 (criação transacional + execução ao vivo):** o projeto "pronto" cria
  um draft via a RPC transacional (contagem de campanhas `+1`), e o painel
  `campaign-run-status` (12.W3.1) prova, sobre uma execução REAL do Briefista
  (`codex exec`), fase/progresso, cancelamento (card `RUN_CANCELLED`
  retentável) e estado terminal `succeeded` com entrega de proposta.
- **AC3 (recovery — todos recuperáveis):** cinco cenários provados sem deixar
  o operador travado:
  - `stale-snapshot-blocks-retry` — a auditoria do Zelador confirmada **sob o
    run cancelado** adiciona o artefato `trafficTrackingAudit`, mudando o
    `inputFingerprint` de prontidão; o retry in-place é então BLOQUEADO com
    `STALE_READINESS` (não reusa snapshot obsoleto);
  - `reload-mid-run` — o reload em pleno voo reata o MESMO job via localStorage;
  - `stream-loss-toggle` — alternância offline/online sem travar o job;
  - `bff-restart-after-terminal` — o BFF é derrubado e reiniciado; o estado
    durável (job/proposta/artefato) sobrevive e o servidor volta funcional;
  - `legacy-route` — `/campaigns/$id/$step` oferece ponte real para o workspace
    unificado quando a campanha já tem `project_id`.
- **AC4 (acessibilidade/robustez visual):** desktop e mobile (390px) sem
  overflow horizontal, foco por teclado alcançável no CTA "Nova campanha",
  tanto no cenário bloqueado quanto no journey de criação. Zero erro de
  console/rede inesperado (ver "Ruído conhecido").
- **AC5 (segurança — zero mutação na Meta):** toda a suíte intercepta a rede;
  qualquer requisição mutativa (POST/PUT/PATCH/DELETE) a um domínio
  `facebook|meta|instagram.com` falharia o teste imediatamente. Resultado real:
  `meta-mutation-requests: []`. A evidência sanitizada passa o privacy gate
  (`evidence:privacy`).

## Ruído conhecido (documentado, não mascarado)

A suíte registra TODO console error / toda resposta ≥400 na evidência bruta.
Os filtros de "zero inesperado" (AC4) excluem apenas ruído comprovadamente
pré-existente ou esperado por injeção de falha:

1. **Chave de lista duplicada** (`campaign-readiness-panel.tsx`, STORY-12.W2.1)
   — warning benigno em lista somente-leitura; débito técnico registrado.
2. **404 de `ads_unit_economics`** — tabela não materializada por nenhuma
   migration deste app; consumida pela rota legada desde antes do EPIC-12.
3. **502 de `/api/local/readiness`** — esperado enquanto o BFF está
   deliberadamente fora do ar no cenário de restart (AC3); o app degrada
   graciosamente. Whitelist PRECISO por URL — qualquer outro 4xx/5xx reprova.

Nesta execução: 36 mensagens de console, todas conhecidas
(`knownPreExistingNoiseCount: 36`); `unexpectedConsoleErrors: []` e
`unexpectedFailedResponses: []`.

## Nota de execução — causa-raiz e correção da re-entrada por checkpoint

Esta story foi retomada de checkpoint com a Phase 2 reprovada: o teste
"AC2/AC3/AC4" falhava porque o **gatilho de snapshot obsoleto não produzia
staleness real** e as **asserções liam sinais frágeis**. Correções (todas no
`file_scope` — apenas o spec e a fixture do piloto, nunca código de app):

1. **Gatilho de staleness real** — a versão anterior mudava só o campo
   `revision` de uma linha no banco, o que o app (que lê o store Zustand
   in-memory, não o banco, no preflight de retry) nunca observava. Substituído
   por um drift REAL do `artifactIndex`: confirmar a auditoria do Zelador **sob
   o run cancelado** adiciona o artefato `trafficTrackingAudit` ao store,
   mudando o `inputFingerprint` — exatamente o que `STALE_READINESS` existe
   para pegar. O `startedSnapshotsRef` é mantido vivo (navegar entre etapas é a
   mesma rota, não desmonta o workspace; e não há reload entre o início do run
   e o retry).
2. **Asserções em sinais determinísticos** — o cancelamento e o sucesso são
   entregues pelo BFF como frames `error`/`done` do bus (não `snapshot`), então
   `data-run-status`/`data-run-terminal` não se acertam sob observação contínua;
   as asserções passaram a usar o card `RUN_CANCELLED` (via `onError`) e a
   "Proposta da skill" (via `onDone`). O `STALE_READINESS` é lido na
   `<section data-testid="campaign-run-status">` (onde o branch de preflight
   coloca o `data-run-code`), não no alerta interno.
3. **Plano semeado (robustez)** — a edição in-app do plano (verba + checklist
   do Zelador) passa por um autosave debounced com multi-revisão (STORY-8.W2.1,
   fora do `file_scope`) cuja corrida intermitentemente perdia updates. O
   CONTRATO (verba R$50 + Zelador OK) passou a ser semeado direto no Postgres
   LOCAL — mesma convenção seed-contrato-real dos projetos empty/warning —,
   mantendo a criação da campanha REAL (RPC, AC2) e o Briefista AO VIVO.

Confirmado verde em execuções repetidas após a correção.
