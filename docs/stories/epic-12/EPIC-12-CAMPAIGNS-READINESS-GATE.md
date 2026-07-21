---
epic_id: 12
title: "Campanhas confiáveis: readiness, preflight e recuperação"
state_file: "docs/stories/epic-12/epic-12-state.json"
status: ReadyForExecution
owner: cohort-marketing
accountable: "Pedro Valério"
created: 2026-07-16
source_architecture: "docs/architecture/ADR-002-campaign-readiness-gate.md"
implementation_authorized: true
---

# EPIC-12 — Campanhas confiáveis

## Problema

Campanhas está liberada antes de o projeto ter os insumos mínimos. O operador
chega a um wizard que cria drafts incompletos, usa fallback sem proveniência ou
falha somente quando uma skill é executada.

## Objetivo

Impedir campanhas quebradas sem esconder a capacidade: Campanhas permanece
visível, explica o que falta, oferece correção no contexto e só cria/roda quando
o contrato de prontidão estiver satisfeito.

## Escopo

- Snapshot de readiness compartilhado com briefing, jornada e campanhas.
- Preflight client-side, enforcement no backend e criação transacional/idempotente.
- UX de bloqueio guiado, progresso real e erro recuperável.
- Convergência do wizard novo com a rota legada.
- E2E supervisionado pelo operador Pedro em desktop e mobile.

## Fora de escopo

- Publicação, pausa, escala ou qualquer mutação na Meta.
- Criar uma nova skill para cobrir campos ausentes.
- Remover ou apagar campanhas antigas automaticamente.
- Substituir as regras públicas canônicas por regras hardcoded no Studio.

## Waves

| Wave | Story | Entrega | Dependências |
|---|---|---|---|
| W1 | 12.W1.1 | Contrato de readiness e preflight de domínio | ADR-002 |
| W2 | 12.W2.1 | UX de gate, navegação e ações inline | 12.W1.1 |
| W3 | 12.W3.1 | Execução observável, erros e recovery | 12.W1.1, 12.W2.1 |
| W4 | 12.W4.2 + 12.W4.1 | RPC/migration transacional; cutover legado e acessibilidade | 12.W3.1; W4.1 depende de W4.2 |
| W5 | 12.W5.1 | E2E integrado, piloto Pedro e release gate | 12.W4.1, 12.W4.2 |

## Gate de conclusão

Um projeto incompleto não consegue criar campanha e recebe um caminho claro para
corrigir os dados; um projeto pronto cria um draft válido; falhas de execução
mostram estado e ação; reload/restart preservam o estado; rotas nova e legada
aplicam o mesmo gate; a criação server-side é atômica/idempotente; e a prova
desktop/mobile passa sem mutação na Meta.
