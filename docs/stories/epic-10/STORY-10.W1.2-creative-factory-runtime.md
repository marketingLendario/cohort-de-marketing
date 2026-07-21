# STORY-10.W1.2 - Runtime seguro e durável da Creative Factory

## Status

Done

## Critérios de aceite

- [x] `ads-creative-factory` usa o journal durável existente.
- [x] Input possui schema estrito para campanha, formatos, arquétipos e variantes.
- [x] Finalistas curados são a única fonte de hooks/copy do lote.
- [x] Python e subprocessos Codex recebem ambiente allowlisted.
- [x] Timeout/cancelamento encerram toda a árvore de processos.
- [x] Outputs ficam em raiz de runtime estável, identificados por `batchId` opaco.
- [x] Manifesto persistido não contém paths absolutos ou segredos.
- [x] Endpoint de mídia resolve apenas assets presentes no manifesto do lote.
- [x] Promoção copia somente itens aprovados para `projetos/{slug}/criativos/`.
- [x] Pacote aprovado contém manifesto, hashes e `legendas.md`.
- [x] Retry cria nova tentativa sem duplicar o pacote final.

## Ownership

- `apps/academia-lendaria-ads-studio/server/creative-factory/**`
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/**`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `scripts/marketing-studio.mjs`
