---
status: Done
story_id: "8.W2.3"
title: "Aprovação em duas fases: DB e filesystem"
epic: 8
wave: "W2"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W1.3", "8.W2.1", "8.W2.2"]
consumes_artifacts_of: ["8.W1.3", "8.W2.1", "8.W2.2"]
file_scope: shared
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-materializer.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/*artifact-approval*"
  - "apps/academia-lendaria-ads-studio/supabase/tests/artifact_approval.sql"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.ts"
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-artifacts.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.test.tsx"
---

# STORY-8.W2.3 - Aprovação em duas fases: DB e filesystem

## User Story

**Como** revisor humano
**Quero** comparar, editar, aprovar ou rejeitar uma proposta antes da escrita
**Para** manter o filesystem e o banco coerentes e auditáveis.

## Acceptance Criteria

1. UI mostra diff, arquivos afetados, warnings e invalidações antes de aprovar.
2. Aprovação chama endpoint idempotente com expected hash/revision.
3. Fluxo usa outbox/compensação: DB e filesystem não ficam silenciosamente divergentes.
4. Sucesso materializa arquivo, metadado, evento e status `done` com o mesmo hash.
5. Rejeição/cancelamento não escreve arquivos; edição gera nova proposta/revisão.
6. Testes injetam falha antes/depois do rename e provam retry/repair determinístico.
7. Aprovação e rejeição persistem a revisão humana do `skill_run`; após reload, `done` ou
   `cancelled` reaparece igual e nunca volta indevidamente para `needs_review`.

## Tasks

- [x] Criar contrato e endpoint de approval.
- [x] Implementar outbox/compensação e idempotência.
- [x] Construir UI de diff e impactos.
- [x] Integrar status, invalidation e audit event.
- [x] Persistir approve/reject no repository e provar reidratação em nova sessão.
- [x] Cobrir failure injection e repair.
- [x] Fechar W23-RG2-P1-01: rejeitar `projectsRoot/{slug}` symlink em plan/read e materialize/write, mantendo `projectsRoot` symlink permitido.
- [x] Fechar W23-RG2-P3-01: versionar regressão do adapter Supabase após `23505`, incluindo fallback semântico.
- [x] Fechar W23-RG3-P1-01: eliminar TOCTOU com helper isolado, `cwd` fixado por identidade, no-follow na folha e regressão concorrente de read/write.
- [x] Fechar W23-RG3-P1-02: restringir autoridade de `skill_runs` a BFF/RPC para campos terminais/sensíveis e provar transições permitidas/CAS no pgTAP.
- [x] Corrigir a sessão persistente do worker: reancoragem por operação, travessia read-only sem criação, identidade canônica exata e invalidação após erro.
- [x] Cobrir regressões de irmãos sequenciais, falha→sessão limpa, timer/reuso e troca concorrente de intermediários externos/internos.
- [x] Fechar W23-RG4-P1-01: amarrar `skill_runs(project_id, workspace_id)` ao projeto do mesmo tenant por FK composta e provar insert cross-tenant rejeitado com `23503`.

### Arquitetura planejada — recovery RG3

- **Filesystem:** um helper Node persistente por `(projectsRoot, slug, modo)` roda
  isolado, fixa o `cwd` no inode do projeto, valida `realpath('.')`, atravessa
  diretórios com validação pós-`chdir`, abre a folha com `O_NOFOLLOW` e faz
  leitura, temp-write e `rename` relativos ao `cwd`. O pai recebe o conteúdo ou
  o resultado da operação, nunca um pathname para uma leitura posterior.
- **DB:** `authenticated` mantém apenas as colunas de runtime necessárias; a FK
  composta `skill_runs_project_workspace_fkey` amarra o projeto à mesma
  workspace com `ON DELETE CASCADE`, e um scan explícito aborta a migration com
  `23503` se houver legado inconsistente. Um trigger bloqueia `done` e
  alterações diretas de hash/revisão, enquanto a RPC
  `private.review_skill_run_proposal` aplica membership, CAS de
  `proposal_revision`, incremento monotônico e a mesma relação explícita de
  projeto/workspace. O `service_role` permanece a autoridade da saga terminal.
- **Validação:** regressões concorrentes exercitam materialize e plan/read; o
  pgTAP prova negações diretas, transições permitidas, RPC stale/monotônica e
  atualização terminal pelo `service_role`.

### Correção de sessão persistente — inspeção independente (2026-07-10)

- Cada operação reancora no `projectsRoot` canônico e revalida o slug antes de
  atravessar os segmentos; cada diretório intermediário precisa resolver para o
  caminho canônico exato esperado, não apenas permanecer dentro da raiz.
- A travessia recebe `createMissing`: write pode criar pais, read retorna
  `null` sem criar diretórios. O cliente invalida, fecha e remove a sessão após
  qualquer erro de operação.
- O estado da sessão contabiliza operações ativas; o idle timer é cancelado ao
  reutilizar a sessão e só fecha o mesmo worker quando não há operações ativas.
- A cobertura inclui irmãos read/write na mesma sessão, parent ausente,
  falha→operação válida, timer/concurrency/reuse e troca de intermediário por
  symlink externo ou outro diretório interno.

## File List

- `apps/academia-lendaria-ads-studio/supabase/migrations/20260710120000_artifact-approval.sql` (ADD — colunas `proposal_hash`/`proposal_revision`, outbox BFF/service-role only, grants mínimos, FK composta `skill_runs_project_workspace_fkey` com cascade, scan de legado inconsistente, trigger de autoridade e RPC privada de revisão com membership/CAS/incremento monotônico)
- `apps/academia-lendaria-ads-studio/supabase/tests/artifact_approval.sql` (ADD — pgTAP: RLS, idempotência, check de estado, insert same-tenant, rejeição cross-tenant `23503`, negações diretas de `authenticated`, RPC CAS/monotonicidade e saga terminal `service_role`)
- `apps/academia-lendaria-ads-studio/server/artifact-approval.ts` (ADD — saga/outbox: plan, decide, repair; store Supabase + fake; run gateway Supabase; hash canônico da proposta)
- `apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts` (ADD — 32 testes: saga, endpoints, CAS real, paths canônicos, idempotência semântica e fallback Supabase após `23505`)
- `apps/academia-lendaria-ads-studio/server/artifact-materializer.ts` (MODIFY — canonicalização única e operações de read/write confinadas ao helper por identidade de diretório, preservando `projectsRoot` mount/symlink)
- `apps/academia-lendaria-ads-studio/server/artifact-fs-worker.ts` (ADD — worker isolado: reancoragem por operação em `projectsRoot` canônico + slug, identidade exata de cada segmento, read sem criação, `O_NOFOLLOW`, FileHandle e rename relativo)
- `apps/academia-lendaria-ads-studio/server/artifact-fs-worker-client.ts` (ADD — sessões persistentes com invalidação após qualquer erro, contagem de operações ativas e idle timer protegido contra fechar worker em uso)
- `apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts` (MODIFY — regressões de irmãos sequenciais, read sem criação, sessão limpa após erro, timer/reuse e troca concorrente de intermediários externos/internos; no-external-read/write preservado)
- `apps/academia-lendaria-ads-studio/server/app.ts` (MODIFY — endpoints `/api/local/artifact-approvals[/plan|/:id/repair]`, guard de token, repair no boot; token hoisted p/ o boundary local inteiro)
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts` (ADD — cliente fetch + helpers puros: resolveApprovalArtifacts, buildInvalidations, makeIdempotencyKey)
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts` (MODIFY — `proposalHash`/`proposalRevision` em `SkillRun`)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` (MODIFY — colunas/mapper/patch de `proposal_hash`/`proposal_revision`; revisão de proposta via RPC pública apoiada em core privado com CAS)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts` (MODIFY — cobertura dos novos campos, `skillRunUpdate` e chamada RPC de revisão)
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts` (MODIFY — `toCacheRunPatch` mapeia hash/revisão da proposta)
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts` (MODIFY — round-trip da decisão terminal `done`/`cancelled` após reload — residual W2.2)
- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts` (MODIFY — action `upsertArtifact`)
- `apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts` (MODIFY — teste de `upsertArtifact`)
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx` (MODIFY — plan/decide/edit em duas fases; reflexo no cache; modo real vs demo)
- `apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.tsx` (ADD — revisão compacta: diff, arquivos afetados, avisos, invalidações, aprovar/rejeitar/editar)
- `apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.test.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/index.css` (MODIFY — estilos compactos da revisão, reusando `cms-proposal-review`)
- `docs/stories/epic-8/STORY-8.W2.3-two-phase-artifact-approval.md` (MODIFY)

> **Divergência da File List original (justificada):** `src/components/project-artifacts.tsx` **não foi modificado** — os artefatos materializados aparecem na tela de artefatos existente pelo próprio cache (`upsertArtifact`/`addArtifact`), com caminho, hash, origem `skill_run` e conteúdo, sem alteração. Adicionados fora da lista original por necessidade da costura: `src/lib/project-domain.ts` (campos de proposta em `SkillRun`) e `src/index.css` (estilos compactos).

## Dev Agent Record

### Agent

@dev (Dex) — Sinkra Wave Execute child, Story 8.W2.3.

### Decisões-chave

- **BFF é a única autoridade transacional.** A materialização é filesystem-only
  (materializador W1.3), então a decisão inteira (materializar + persistir
  artefato + transição do `skill_run` + evento) vive no BFF. Uma escrita
  browser-side não conseguiria coordenar filesystem e banco — daí o outbox no
  backend, não no cliente.
- **Duas fases separadas por superfície de verdade.** Fase 1 (`/plan`,
  read-only) computa o **diff acurado** lendo o arquivo atual (só o backend pode)
  + avisos de escrita. As **invalidações a jusante** (grafo do catálogo) são
  computadas no cliente (`buildInvalidations`), que é quem tem o grafo. A UI
  funde as duas. O BFF computa o **hash da proposta** na Fase 1, então o browser
  nunca hasheia conteúdo — não há hash cross-runtime para divergir.
- **Outbox/compensação com estados determinísticos.** `pending → materializing →
  materialized → recording → done` (approve) / `pending → rejected` (reject).
  Cada efeito é idempotente (materialize = no-op em hash igual; artefato faz
  upsert por id; `skill_run` é um CAS guardado), então `repair` retoma do estado
  persistido e converge. Falha transitória (crash/DB) **mantém o checkpoint**
  (linha continua reparável) e relança; só `superseded` é terminal `failed`.
- **Injeção de falha em torno do rename atômico.** Hooks `beforeRename`/
  `afterRename` (só testes) cercam a chamada ao materializador W1.3 sem tocá-lo:
  falha antes do rename deixa `materializing` (sem arquivo → repair re-materializa);
  falha depois deixa `materialized` (arquivo escrito, DB não gravado → repair
  retoma o registro). Ambos convergem para o mesmo hash em FS/DB/evento.
- **Mesmo hash em três superfícies.** O `proposalHash` canônico é gravado no
  outbox, no evento de auditoria e em `skill_runs.proposal_hash`; o hash de
  conteúdo por-arquivo (SHA-256) coincide no filesystem (materializador), no
  `content_hash` do artefato e no evento.
- **Staleness por revisão + hash.** A edição gera nova proposta bumpando
  `proposal_revision` (e `proposal_hash`); uma aprovação obsoleta que ainda
  carrega a revisão/hash antigos é rejeitada (409 `stale`) antes de qualquer
  escrita. O CAS final de `skill_runs` (`WHERE proposal_revision = esperado AND
  status = needs_review`) é a guarda autoritativa.
- **Idempotência.** `unique (workspace_id, idempotency_key)` no outbox; um replay
  com a mesma chave retorna a MESMA linha (sem segundo efeito). Reuso do mesmo
  token do boundary local (injetado pelo proxy Vite) para autenticar — o browser
  nunca vê o segredo.
- **Idempotência semântica.** Além da chave lexical, o outbox tem unicidade em
  `(workspace_id, skill_run_id, proposal_revision)`; antes de retornar ou resumir,
  o BFF compara tenant, projeto, run, decisão, hash, revisão e plano canônico.
  Reuso semântico divergente responde `409 idempotency-conflict`, e chaves
  alternativas não criam uma segunda decisão.
- **Residual W2.2 fechado.** A decisão terminal (`done`/`cancelled`) é persistida
  em `skill_runs` pela saga; após reload a hidratação (`ProjectRepository`) lê o
  estado terminal e **nunca volta para `needs_review`**. Provado em round-trip de
  nova sessão (`use-project-workspace.test.ts`).
- **Modo demo coerente.** Fora da boundary (sem `workspaceActions`) a revisão é
  local: sem backend, `plan` nulo (visão create-only), aprovar materializa no
  cache, rejeitar cancela, editar bumpa a revisão local — mesma UX.

### Acceptance Criteria — verificação

1. **UI mostra diff, arquivos afetados, warnings e invalidações antes de aprovar.**
   `ArtifactApprovalReview` renderiza o diff acurado do `/plan` (before/after por
   arquivo), a lista de arquivos afetados com `create/modify/unchanged`, avisos
   (plan + proposta) e invalidações a jusante. ✅
2. **Aprovação chama endpoint idempotente com expected hash/revision.**
   `POST /api/local/artifact-approvals` com `expectedProposalHash` +
   `expectedProposalRevision` + `idempotencyKey`; replay retorna a mesma linha.
   Autenticado pelo token do boundary local. ✅
3. **Outbox/compensação: DB e filesystem não divergem silenciosamente.** Saga com
   estados determinísticos + `repair`; testes de falha antes/depois do rename
   provam convergência. ✅
4. **Sucesso materializa arquivo, metadado, evento e status `done` com o mesmo
   hash.** Materializa via W1.3, faz upsert em `project_artifacts` (`content_hash`),
   CAS `skill_runs → done` (`proposal_hash`), grava evento de auditoria — mesmo
   `proposalHash` em outbox/evento/DB. ✅
5. **Rejeição/cancelamento não escreve arquivos; edição gera nova proposta/revisão.**
   `decide('reject')` só transiciona `skill_runs → cancelled` (nenhum arquivo);
   editar bumpa `proposal_revision`/`proposal_hash`, invalidando o hash obsoleto. ✅
6. **Testes injetam falha antes/depois do rename e provam retry/repair
   determinístico.** `beforeRename`/`afterRename` + `repair`/`repairAll`; converge
   ao mesmo conteúdo/hash sem escrita duplicada. ✅
7. **Approve/reject persistem a revisão humana; após reload `done`/`cancelled`
   reaparece e nunca volta a `needs_review`.** Round-trip de nova sessão. ✅

### Gates históricos antes do re-gate independente

- `npm test` — 212 passed (28 files)
- `npm run lint` — No issues found
- `npm run typecheck` — OK
- `npm run build` — OK
- `npm run build:server` — OK
- `npm run lint:db` — No schema errors found
- `npm run test:db` — PASS (4 files / 21 testes; `artifact_approval` 6/6)
- `git diff --check` — limpo

### Nota de ambiente

`.env` (gitignored) recriado localmente a partir de `.env.example` para os testes
que importam `@/lib/supabase` (fora do ownership) carregarem — igual à nota da
W2.2, não é regressão. A migração nova foi aplicada ao DB local
(`supabase migration up`) para o `supabase test db` enxergar o outbox.

### Riscos residuais

- **Edição concorrente durante uma aprovação em voo (mesma run, mesmo workspace).**
  Janela estreita entre a leitura de staleness e o CAS final: se uma edição bumpa
  a revisão APÓS o `materialize` e ANTES do CAS, o CAS falha (`superseded`, 409).
  **[QA batch-1 / P2-01, fechado]** O gateway real (`createSupabaseApprovalRunGateway.
  finalizeApproval`) agora roda o CAS guardado em `skill_runs` ANTES de qualquer
  upsert em `project_artifacts` (mesma ordem do fake de teste) — uma decisão
  supersedida não escreve NENHUMA linha de artefato/evento. O arquivo já
  materializado (da revisão agora supersedida) fica transitoriamente em disco,
  mas sem nenhuma linha DB reivindicando-o; a revisão vencedora subsequente
  sobrescreve o arquivo e cria a única linha `confirmed` para aquele path. Fora
  das ACs (single-user/single-tab não dispara), mas a divergência DB/FS
  silenciosa e permanente que existia antes está eliminada. A linha do outbox
  fica `failed` (auditável); repair/replay é idempotente e não reabre uma
  decisão terminal — exige nova revisão. Regressão coberta em
  `server/artifact-approval.test.ts` (cenário de corrida via fault `afterRename`
  + testes diretos de ordenação contra `createSupabaseApprovalRunGateway.
  finalizeApproval` com um mock do cliente Supabase).
  - **Constraint de unicidade `(project_id, path)` — avaliada e descartada.** A
    correção acima já fecha a divergência silenciosa da corrida (nenhuma linha
    órfã é escrita). Uma constraint dura de unicidade adicional NÃO foi
    adicionada porque o design atual gera um `artifactId` novo (`randomUUID()`)
    a cada decisão — inclusive no fluxo LEGÍTIMO de reexecutar a mesma skill
    (novo skill_run, mesmo path canônico do artefato). Uma constraint
    `unique(project_id, path)` quebraria esse fluxo normal (23505 no upsert),
    a menos que o conflito do upsert fosse retargetado para `(project_id, path)`
    — o que descartaria/atualizaria a linha antiga por um caminho diferente do
    testado hoje e exigiria reconciliar o retorno do `artifactId` com o cache do
    cliente (`upsertArtifact` filtra por `id`). Isso é um redesenho maior
    (supersessão de artefato por path, com `state: 'stale'` na linha antiga),
    fora do escopo de uma correção mínima e não pedido por nenhuma AC desta
    story. Registrado aqui como candidato a story futura, não como débito desta.
- **Aprovação exige backend Supabase.** Sem credenciais o `/plan` responde 503 e a
  revisão mostra o erro (botões desabilitados) — graceful degradation coerente com
  `campaign.*`. Em modo real de produção o BFF sempre tem Supabase, então não
  ocorre. Modo demo permanece 100% local.
- **`proposal_hash` só é gravado na decisão (não no `onDone`).** A guarda de
  staleness apoia-se primariamente em `proposal_revision`; o gate de hash em
  `skill_runs.proposal_hash` só atua após a primeira decisão/edição. A integridade
  de conteúdo (o payload aprovado precisa hashear no hash esperado) cobre o resto.
- **`repairAll` sem claim/lease entre instâncias (P3-04, mantido documentado).**
  Diferente do skill runner (leases), o repair do outbox não reivindica linhas
  antes de processá-las. Avaliado e mantido como está: todo efeito já é
  idempotente (materialize no-op por hash; upsert por id; CAS guardado), então
  duas instâncias processando a mesma linha em paralelo convergem para o mesmo
  resultado sem duplicar dados — só fariam trabalho redundante. Um claim mínimo
  exigiria nova coluna (`claimed_by`/`claimed_at`) + migração + lógica de
  reivindicação + testes, o que amplia o escopo desta correção sem mudar o
  resultado observável (BFF local, uma instância). Sem impacto no deploy atual.

### QA — correções pré-commit (batch 1, 2026-07-10)

Gate `.aiox/waves/epic-8-wave-2/qa-w2.3-precommit.yaml` (verdict CONCERNS, 1 P2 +
4 P3). Correções aplicadas nesta rodada:

- **P2-01 (correctness/convergence, AC3) — fechado.** Ver risco residual acima:
  `finalizeApproval` no gateway Supabase real reordenado para CAS-first.
- **P3-01 (security, defense-in-depth) — fechado.** `readCurrentFile` (Fase 1,
  `server/artifact-approval.ts`) agora usa `resolveSafeReadTarget`, uma
  contraparte read-only exportada de `artifact-materializer.ts` que reutiliza a
  MESMA função de varredura anti-symlink do materializador W1.3
  (`walkRejectingSymlinks`, extraída de `resolveSafeTarget`) — sem `mkdir`, sem
  efeito colateral. Um symlink na folha ou em qualquer ancestral intermediário
  sob `projetos/{slug}/` agora é recusado na leitura do diff, não só na escrita.
  Testado com symlink de folha e de diretório intermediário apontando para fora
  da raiz do projeto (`server/artifact-approval.test.ts`).
- **P3-02 (correctness, latente) — fechado.** `rejectProposal`
  (`project-journey.tsx`) só espelha `status: 'cancelled'` no cache DEPOIS da
  resposta persistida do BFF (modo real) — nunca antes —, e recusa agir fora de
  `needs_review`. Espelha exatamente o padrão já usado em `approveProposal`.
- **P3-03 (dead-code) — fechado.** `ApprovalErrorCode` nunca produzia
  `'materialize-conflict'` (o approve sempre usa `onConflict: 'overwrite'`, então
  o materializador nunca retorna `outcome: 'conflict'` neste fluxo). Removido do
  union e do switch `approvalErrorStatus` (`app.ts`) em vez de implementar um
  caminho que nunca seria exercitado.
- **P3-04 (robustness, informational) — mantido documentado**, ver risco
  residual acima (decisão: não ampliar escopo).

### QA — recovery loop / re-gate independente (2026-07-10)

O relatório independente `.aiox/waves/epic-8-wave-2/qa-w2.3-regate.yaml`
identificou 2 P1 e 2 P2. Todos foram fechados nesta recuperação, sem alterar o
fluxo CAS-first, a contenção anti-symlink ou o status `InReview`:

- **W23-RG-P1-01 — fechado.** `artifact_approval_outbox` agora é BFF/service-role
  only: `anon` e `authenticated` não têm grant nem policy de leitura/escrita;
  o BFF usa service-role. FKs compostas amarram `(project_id, workspace_id)` a
  `marketing_projects` e `(skill_run_id, workspace_id, project_id)` a
  `skill_runs`. O pgTAP prova leitura e insert/update/delete client-side
  recusados, escrita backend autorizada e referências cross-tenant/cross-project
  recusadas pelo banco.
- **W23-RG-P1-02 — fechado.** O gateway real só faz CAS de `needs_review` para
  `done` na workspace/projeto/revisão esperados. Um CAS zerado só é replay quando
  a releitura está `done` com o mesmo `proposal_hash`; hash diferente nunca
  substitui uma revisão concluída. Testes diretos cobrem replay igual, hash
  divergente e falha depois do CAS antes do upsert seguida de retry determinístico.
- **W23-RG-P2-01 — fechado.** `canonicalizeRelativeArtifactPath` é compartilhada
  por aprovação e materializador, normaliza slash/backslash e segmentos `.`,
  rejeita traversal e detecta paths canônicos duplicados antes de hash, plano,
  outbox ou filesystem. Teste multi-arquivo prova checkpoint parcial e repair
  sem duplicar o primeiro arquivo.
- **W23-RG-P2-02 — fechado.** Reuso de chave compara identidade completa e plano
  imutável canônico, retornando `409 idempotency-conflict` sem side effect quando
  diverge. Índice semântico de run/revisão e lookup correspondente impedem
  decisões duplicadas com chaves alternativas, mantendo replay/repair legítimo.

### Gates finais desta recuperação (2026-07-10)

- `npm test` — PASS, **224 testes / 28 arquivos**.
- `npm run lint` — PASS, exit 0.
- `npm run typecheck` — PASS, exit 0; catálogo validado: 30 skills / 40 edges.
- `npm run build` — PASS, Vite build concluído.
- `npm run build:server` — PASS, `tsc -p tsconfig.server.json` concluído.
- `npm run lint:db` — PASS, **No schema errors found**.
- `npm run test:db` — PASS, **4 arquivos / 26 testes**.
- `git diff --check` — PASS, sem saída.
- Foco da recuperação — PASS, **30 testes / 1 arquivo** em
  `server/artifact-approval.test.ts`; materializador — PASS, **20 testes / 1 arquivo**.

### Riscos residuais após o re-gate

- **`repairAll` sem claim/lease entre instâncias (P3-04, não bloqueante).** Os
  efeitos continuam idempotentes e convergentes, mas duas instâncias podem
  executar trabalho redundante. Um claim/lease dedicado permanece candidato a
  uma evolução operacional futura.
- **Histórico de artefatos por path.** A tabela mantém histórico por `artifactId`
  e não impõe unicidade global `(project_id, path)`, pois reexecuções legítimas
  podem produzir novo registro para o mesmo path. A proteção desta story é a
  rejeição de duplicatas dentro de uma proposta e o CAS/repair; supersessão
  histórica por path continua fora do escopo.

### QA — Sinkra Wave Execute recovery (`qa-w2.3-regate-2.yaml`, 2026-07-10)

O re-gate independente reportou BLOCK por W23-RG2-P1-01 e W23-RG2-P3-01. Ambos
foram fechados nesta rodada, sem alterar o comportamento intencional de aceitar
`projectsRoot` como mount/symlink:

- **W23-RG2-P1-01 — fechado.** `lstat(projectsRoot/{slug})` agora recusa a
  própria raiz do slug antes de `realpath`, tanto no caminho read-only de plan
  quanto no materialize/write. Os testes provam que conteúdo externo não é lido
  no plan nem escrito no materialize; um `projectsRoot` symlink continua aceito.
- **W23-RG2-P3-01 — fechado.** Teste versionado do adapter
  `createSupabaseArtifactApprovalStore.create()` simula `23505`, miss na busca
  por `idempotency_key` e recuperação da mesma linha pela identidade semântica.

### Gates desta recuperação — 2026-07-10

- Foco: PASS, **54 testes / 2 arquivos** (`artifact-materializer` + `artifact-approval`).
- `npm test`: PASS, **228 testes / 28 arquivos**.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, catálogo validado (30 skills / 40 edges).
- `npm run build`: PASS, Vite build concluído.
- `npm run build:server`: PASS, `tsc -p tsconfig.server.json` concluído.
- `supabase db reset --local --yes`: PASS, reset fresco e todas as migrations aplicadas.
- `npm run lint:db`: PASS, **No schema errors found**.
- `supabase test db`: PASS, **4 arquivos / 26 testes**.
- `git diff --check`: PASS, sem saída.

### QA — Sinkra Wave Execute recovery (`qa-w2.3-regate-3.yaml`, 2026-07-10)

O re-gate independente reproduziu dois P1: uma corrida TOCTOU no slug-root
com leitura externa e escrita `ATTACK-19`, e autoridade excessiva de
`authenticated` sobre campos terminais/sensíveis de `skill_runs`. O relatório
QA não foi alterado nesta recuperação.

- **W23-RG3-P1-01 — fechado.** Read/plan e write/materialize agora executam em
  worker filho persistente por projeto/modo, com `cwd` ancorado no inode do
  `projectsRoot/{slug}`, confirmação de `realpath('.')`, travessia relativa
  validada, folha `O_NOFOLLOW`, FileHandle e rename relativo. A leitura retorna
  conteúdo dentro da operação confinada; não há pathname para um caller usar
  depois. O suporte intencional a `projectsRoot` mount/symlink foi preservado.
  A regressão versionada e o harness concorrente equivalente ao QA executaram
  **4.000 writes + 4.000 reads**, com `external=false` e `leaked=false`.
- **W23-RG3-P1-02 — fechado.** A migração revoga o update amplo de
  `authenticated`, concede apenas colunas de runtime, bloqueia por trigger
  `done`, hash/revisão e transições inválidas, e expõe somente a revisão de
  proposta via RPC pública invoker-backed em schema `private`, com membership,
  CAS de revisão e incremento monotônico. O `service_role` segue autorizado
  para a saga terminal. pgTAP prova as negações, fluxo browser permitido, RPC
  monotônica/CAS e conclusão pela saga.
- **W23-RG2-P3-01 — fechado/verificado.** O teste unitário versionado do
  adapter Supabase cobre `create()` após `23505`, miss no lookup lexical e
  recuperação da linha pela identidade semântica.

### Gates desta recuperação RG3 — 2026-07-10

- Foco: PASS, **79 testes / 3 arquivos**.
- `npm test`: PASS, **231 testes / 28 arquivos**.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, catálogo validado: 30 skills / 40 edges.
- `npm run build`: PASS, Vite build concluído.
- `npm run build:server`: PASS, `tsc -p tsconfig.server.json` concluído.
- Runtime do helper compilado: PASS, `compiled-helper-runtime=pass`.
- Harness concorrente RG3: PASS, **4.000 writes + 4.000 reads; external=false; leaked=false**.
- `supabase db reset --local --yes`: PASS, reset fresco e todas as migrations aplicadas.
- `npm run lint:db`: PASS, **No schema errors found**.
- `supabase test db`: PASS, **4 arquivos / 41 testes**.
- `git diff --check 278d671470db295fbada8f725c75cb37f593f83f`: PASS, sem saída.

### QA independente final — re-gate RG5 (2026-07-10)

Relatório `.aiox/waves/epic-8-wave-2/qa-w2.3-regate-5.yaml`: **SHIP**,
sem P0/P1/P2.

- Reset fresco, lint DB e **43/43 pgTAP**: PASS.
- Matriz SQL independente: **21/21** checks de tenancy, FK/cascade,
  membership, CAS, autoridade terminal e transições: PASS.
- Testes focados: **125/125**; suíte completa: **238/238**.
- Lint, typecheck, build frontend e build server: PASS.
- Probes filesystem source e compilado: 4.000 writes + 4.000 reads,
  `external=0`, `leaked=0`, `wrong=0`; sessão/timer/reuse: PASS.
- Saga `service_role` real: plan/approve/replay convergiu para `done` com o
  mesmo hash no run, outbox, audit, artefato e filesystem.
- Residual P3 não bloqueante: RPC recebe o hash da proposta do caller; o BFF
  continua a superfície autoritativa que recomputa hash e controla a saga.

### Verificação de desenvolvimento — correção do worker persistente (2026-07-10)

Esta nota registra a correção após a inspeção independente; não cria nem
substitui um re-gate QA. O arquivo de QA permanece intacto.

- Foco do worker/materializer: PASS, **31 testes**; foco ampliado com approval
  e repository: PASS, **86 testes / 3 arquivos**.
- `npm test`: PASS, **238 testes / 28 arquivos**.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, catálogo validado: 30 skills / 40 edges.
- `npm run build`: PASS, Vite build concluído.
- `npm run build:server`: PASS, `tsc -p tsconfig.server.json` concluído.
- Runtime compilado: PASS, irmãos sequenciais e read sem criação verificados.
- Harness concorrente: PASS, **4.000 writes + 4.000 reads; external=false; leaked=false**.
- `supabase db reset --local --yes`: PASS, reset fresco e migrations aplicadas.
- `npm run lint:db`: PASS, **No schema errors found**.
- `supabase test db`: PASS, **4 arquivos / 41 testes**.
- `git diff --check 278d671470db295fbada8f725c75cb37f593f83f`: PASS, sem saída.

### Verificação de desenvolvimento — correção de integridade tenant RG4 (2026-07-10)

Esta nota registra a correção de `W23-RG4-P1-01`; não cria um novo re-gate e
não altera o relatório QA RG4.

- A migration adiciona scan explícito de legado e a FK composta estável
  `skill_runs_project_workspace_fkey` com `ON DELETE CASCADE`, substituindo a
  FK simples redundante.
- A RPC privada exige explicitamente que a run encontre um
  `marketing_projects(id, workspace_id)` correspondente, preservando
  membership/CAS/incremento monotônico.
- Foco relevante: PASS, **55 testes / 2 arquivos**.
- `npm test`: PASS, **238 testes / 28 arquivos**.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, catálogo validado: 30 skills / 40 edges.
- `npm run build`: PASS, Vite build concluído.
- `npm run build:server`: PASS, `tsc -p tsconfig.server.json` concluído.
- Runtime compilado: PASS, irmãos sequenciais e read sem criação verificados.
- Harness concorrente: PASS, **4.000 writes + 4.000 reads; external=false; leaked=false**.
- `supabase db reset --local --yes`: PASS, reset fresco e migrations aplicadas.
- `npm run lint:db`: PASS, **No schema errors found**.
- `supabase test db`: PASS, **4 arquivos / 43 testes**.
- Probe SQL real cross-tenant: PASS, insert válido same-tenant e rejeição
  cross-tenant com `SQLSTATE 23503`, em transação rollbackada.
- Probe real `service_role`: PASS, outbox e `skill_run` finalizados como `done`,
  em transação rollbackada.
- `git diff --check 278d671470db295fbada8f725c75cb37f593f83f`: PASS, sem saída.

## Change Log

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-07-10 | @dev | Implementação completa da aprovação em duas fases (migração + outbox/saga + endpoints + cliente + UI de revisão + testes). Residual W2.2 fechado. Status Ready → InReview. |
| 2026-07-10 | @dev | QA batch-1 (`qa-w2.3-precommit.yaml`, CONCERNS → correções): P2-01 CAS-first no gateway Supabase real (fecha a divergência DB/FS órfã da corrida de edição concorrente); P3-01 leitura da Fase 1 reusa a contenção anti-symlink do materializador W1.3; P3-02 reject só espelha `cancelled` após persistência real; P3-03 remove o código morto `materialize-conflict`. P3-04 mantido documentado (sem ampliar escopo). +6 testes de regressão (`server/artifact-approval.test.ts`). Gates verdes (218 testes). Status permanece InReview. |
| 2026-07-10 | @dev | Recovery loop do re-gate independente: outbox BFF/service-role only com FKs compostas e pgTAP de privilégios/tenancy; CAS real identity-safe; canonicalização compartilhada e rejeição de paths duplicados; idempotência semântica com índice por run/revisão. Regressões de recovery no servidor e pgTAP final 4 arquivos/26 testes. Gates finais: npm test 224/28, lint, typecheck, build, build:server, lint:db e diff-check verdes. Status permanece InReview. |
| 2026-07-10 | @dev | Sinkra Wave Execute recovery do `qa-w2.3-regate-2.yaml`: rejeição de symlink na raiz `projectsRoot/{slug}` para plan/read e materialize/write, teste de não-efeito externo, compatibilidade com `projectsRoot` mount/symlink e regressão Supabase `create()` após `23505` com fallback semântico. Gates: foco 54/2, npm test 228/28, lint, typecheck, builds, reset/lint/pgTAP do Supabase e diff-check verdes. Status permanece InReview. |
| 2026-07-10 | @dev | Sinkra Wave Execute recovery do `qa-w2.3-regate-3.yaml`: helper filesystem isolado e identity-pinned para eliminar TOCTOU em read/write, grants mínimos + trigger + RPC CAS para autoridade de `skill_runs`, pgTAP de privilégios/transições/saga e revalidação do adapter `23505`. Harness concorrente 4.000 writes + 4.000 reads sem `external`/`leaked`; gates finais 231/28, pgTAP 41, builds e diff-check verdes. Status permanece InReview. |
| 2026-07-10 | @dev | Correção pós-inspeção independente do worker persistente: reancoragem por operação no root canônico, identidade exata de intermediários, read sem criação, invalidação após erro e idle timer protegido por operações ativas. Regressões versionadas para irmãos, parent ausente, sessão limpa, timer/reuse e symlinks externos/internos. Verificação local: 238/28, harness 4.000+4.000 sem external/leaked, builds e gates Supabase verdes. Status permanece InReview. |
| 2026-07-10 | @dev | Correção de W23-RG4-P1-01: FK composta `skill_runs(project_id, workspace_id)` → `marketing_projects(id, workspace_id)` com cascade e scan de legado fail-closed; RPC de review reforçada pela relação explícita; pgTAP same-tenant/cross-tenant (`23503`) e probes SQL/service_role verdes. Status permanece InReview. |
| 2026-07-10 | @qa | Re-gate independente RG5: SHIP sem P0/P1/P2; 43 pgTAP, matriz SQL 21/21, suíte 238/238, probes source/compilado sem external/leaked/wrong e saga service_role real convergente. Status InReview → Done. |
