---
epic_id: 12
title: "Campanhas confiáveis: readiness, preflight e recuperação"
state_file: "docs/stories/epic-12/epic-12-state.json"
status: Done
owner: cohort-marketing
accountable: "Pedro Valério"
created: 2026-07-16
---

# EPIC-12 - Campanhas confiáveis: readiness, preflight e recuperação

> **Nota de processo (materializado na STORY-12.W5.1):** este arquivo, o
> `epic-12-state.json` e o `STORY-12.W5.1-*.md` não existiam em nenhum commit
> desta linhagem antes da wave W5 — toda story W1-W4.2 referenciava este
> caminho como `parent_epic` sem que o arquivo jamais tivesse sido
> materializado. Reconstruído aqui, na última wave, a partir das ACs, Dev
> Notes e Dev Agent Records reais de cada story (W1.1 a W4.2, todas lidas
> integralmente) — sem inventar decisão além do que o código e os registros
> de cada story já provam. Um "ADR-002" é referenciado por todas as stories
> como a fonte do contrato `campaign-readiness.v1`, mas também nunca foi
> materializado em `docs/adrs/` (diretório que não existe neste repositório);
> autoria de ADR é mandato do `@architect`, fora do escopo de fechamento
> desta story de validação — registrado aqui como lacuna pré-existente, não
> introduzida por esta wave.

## Objetivo

Garantir que nenhuma superfície do Marketing Studio — jornada nova, dashboard
legado ou a chamada de criação em si — possa produzir uma campanha inválida,
órfã ou duplicada, e que qualquer bloqueio ou falha de execução sempre
apresente ao operador uma lacuna com fonte, uma ação de correção e um caminho
de recuperação — nunca um estado travado sem saída.

## Decisões

| ID | Decisão |
|---|---|
| D1 | Existe um único contrato de prontidão, `campaign-readiness.v1` (`shared/campaign-readiness.ts`), consumido de forma idêntica pelo browser e por qualquer enforcement server-side — nunca uma segunda implementação da matriz de requisitos. |
| D2 | A matriz de requisitos por capability (`campaign.create`/`tracking`/`brief`/`structure`/`measure`/`diagnose`) vem de `src/generated/skill-catalog.ts` (gerado, versionado) — a story não a duplica. |
| D3 | `campaign.create` é a única capability estrutural (não depende de skill/brief) — bloqueia somente por projeto ausente ou nome inválido. |
| D4 | Toda criação real de campanha passa pela RPC transacional/idempotente `campaign_create_readiness_rpc` (12.W4.2) — nenhum caminho (jornada nova, dashboard legado, ou um bypass direto do client) insere direto em `ads_campaigns`. |
| D5 | Execução de skill dentro de uma campanha é observável (fase, progresso determinado/indeterminado, estado terminal) e toda falha tem uma classificação humana com correlation id redigido e retry seguro quando aplicável (12.W3.1). |
| D6 | Um retry nunca reusa um snapshot de prontidão obsoleto nem duplica campanha/plano/artefato — comparado por fingerprint + `sourceRevision`, nunca por timestamp. |
| D7 | A rota legada (`campaigns/$campaignId/$step`) e o dashboard legado continuam funcionais durante o cutover, reusando o MESMO contrato — nunca uma segunda regra de bloqueio. |
| D8 | Nenhuma publicação, pausa, escala ou mutação automática é enviada à Meta em qualquer momento deste épico — inclusive nos pilotos E2E, que interceptam rede real para provar isso, não apenas alegar. |

## Waves

### W1 - Contrato de prontidão

- 12.W1.1 - Contrato de readiness e preflight de campanha

### W2 - UX do gate

- 12.W2.1 - Gate de campanhas, navegação e ações inline

### W3 - Execução observável e recovery

- 12.W3.1 - Execução observável, erros classificados e recovery

### W4 - Cutover legado e transação

- 12.W4.2 - Criação transacional e idempotente de campanha
- 12.W4.1 - Cutover legado e acessibilidade do gate de campanhas

### W5 - Validação integrada

- 12.W5.1 - E2E integrado e piloto Pedro do gate de campanhas

## Gates do epic

1. O contrato `campaign-readiness.v1` é avaliado de forma idêntica em toda
   superfície (jornada nova, visão geral, dashboard legado) para a mesma
   revisão de briefing.
2. Nenhum caminho de criação (UI nova, dashboard legado, ou chamada direta ao
   endpoint) insere uma campanha sem passar pela RPC transacional/idempotente.
3. Um bloqueio nunca deixa o operador sem uma ação de correção com fonte
   explícita (briefing, artefato, skill ou tracking).
4. Uma execução de skill dentro de uma campanha sobrevive a reload, restart
   do servidor e perda de stream sem duplicar efeito nem travar o operador.
5. Um retry nunca reusa um snapshot obsoleto nem duplica campanha, plano ou
   artefato.
6. O gate e seus estados são navegáveis por teclado, com foco visível e sem
   overflow horizontal em 390px.
7. Um piloto E2E integrado, rodando contra backend real (nunca demo mode),
   prova todos os gates acima com interceptação de rede provando zero
   mutação na Meta.
8. Testes, lint, typecheck, builds, pgTAP e Playwright passam.

## Fechamento

Todas as 6 stories do épico (12.W1.1, 12.W2.1, 12.W3.1, 12.W4.2, 12.W4.1,
12.W5.1) estão `Done`. Evidência consolidada do piloto integrado:
`docs/qa/epic-12-campaign-readiness.md` e
`docs/qa/evidence/epic-12-campaign-readiness.json`.

## Fora de escopo

- publicação, pausa, kill ou escala automática na Meta;
- Google Ads ou qualquer plataforma de anúncios além da Meta;
- autoria do ADR formal do contrato (`ADR-002`) — lacuna pré-existente, fora
  do mandato de uma story de validação;
- reconciliação de campanhas legadas sem `project_id` (fora do `file_scope`
  de 12.W4.1, documentado como escopo residual daquela story).

## Execução

Orquestrado por `/sinkra-wave-execute epic-12`. W1 → W2 → W3 → W4 (W4.2 antes
de W4.1, por dependência direta) → W5 é a ordem de build real; cada wave só
avança quando a anterior está `Done` com QG `PASS` e evidência registrada.
