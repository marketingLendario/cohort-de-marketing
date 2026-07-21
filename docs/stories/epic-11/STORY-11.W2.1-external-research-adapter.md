# STORY-11.W2.1 - Adapter de coleta externa

## Status

Done

## Critérios de aceite

- [x] Token Apify nunca entra no processo Codex nem no navegador.
- [x] Coleta roda por subprocesso determinístico com allowlist própria.
- [x] Fontes, timestamps, quota e falhas ficam rastreáveis.
- [x] Resultados literais são congelados antes da síntese pelo Codex.
- [x] Retry não duplica cobrança nem fontes já concluídas.
- [x] Modo offline aceita material colado sem fingir coleta externa.
- [x] E2E cobre avatar, concorrente, trend e conteúdo.

## Implementação

- `server/external-research/contracts.ts`: request tipado, fingerprint versionado e hash do snapshot.
- `server/external-research/collector-worker.mjs`: subprocesso sequencial com providers Apify, Meta e URL pública, proteção contra SSRF e erros redigidos.
- `server/external-research/adapter.ts`: allowlist de ambiente, lock por fingerprint, cache imutável e modo offline/híbrido.
- `server/local-skill-runner.ts`: coleta antes do Codex, prompt preso ao snapshot e artefato `researchSnapshot` anexado pelo backend.
- `src/components/project-journey.tsx`: controles Rede, Material colado e Híbrido disponíveis inclusive para refazer pesquisas concluídas.

## Evidências

- `server/external-research/adapter.test.ts`: segurança, offline, quota, falha, cache e worker real.
- `server/external-research/parity.integration.test.ts`: quatro skills, duas superfícies, um snapshot congelado por fingerprint.
- `e2e/epic-11-external-research-visual.mjs`: quatro skills em desktop/mobile, três modos e sete fontes, sem overflow ou segredo visível.
- `design-qa-evidence/epic-11/external-research-live/evidence.json`: chamada Apify real concluída e retry servido pelo cache.
