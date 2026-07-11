# Story - Hardening do contrato de artefatos do Marketing Studio

## Status

Done

## Objetivo

Fechar os casos reais encontrados depois do Epic 8 na revisão e materialização
de propostas: uma skill pode devolver vários blocos destinados ao mesmo arquivo
compartilhado e pode nomear um artefato com o prefixo
`projetos/{slug}/`, embora o materializador já esteja ancorado no projeto.

## Acceptance Criteria

- [x] Blocos com o mesmo path e formato são consolidados numa única proposta de
  arquivo antes da revisão humana.
- [x] Blocos com o mesmo path e formatos diferentes permanecem ambíguos e são
  rejeitados pelo contrato do backend.
- [x] Um path `projetos/{slug}/arquivo` do próprio projeto é reduzido para
  `arquivo` antes de hash, planejamento, persistência e escrita.
- [x] Um path prefixado por outro projeto é rejeitado antes de qualquer escrita.
- [x] Hash, plano persistido e arquivo materializado usam o mesmo path canônico.
- [x] O E2E do Squad de Tráfego prova que nenhum artefato persistido mantém o
  prefixo `projetos/`.
- [x] A evidência do piloto contém as cinco skills concluídas, recusa, retry,
  reloads e validação visual desktop/mobile.
- [x] Testes, lint, typecheck e builds passam.

## Tasks

- [x] Consolidar blocos de proposta por path e formato no client helper.
- [x] Introduzir normalização de path consciente do slug no materializador.
- [x] Aplicar a mesma normalização ao hash, plano, replay e decisão.
- [x] Cobrir consolidação, alias permitido e tentativa cross-project com testes.
- [x] Reforçar no E2E que paths persistidos são relativos ao projeto.
- [x] Regenerar o piloto real e seu relatório.
- [x] Executar os quality gates completos.
- [x] Atualizar documentação operacional que ainda descreve o corte como
  pendente.

## Evidências de validação

- `npm test`: 32 arquivos e 268 testes aprovados.
- `npm run lint`, `npm run typecheck`, `npm run build` e
  `npm run build:server`: aprovados.
- `npm run lint:db`: sem erros de schema.
- `npm run test:db`: 43 testes pgTAP aprovados.
- Playwright real: cinco skills concluídas, uma recusa, um retry cancelado e
  12 reloads reidratados; campanha permaneceu `draft`.
- Artefatos: todos os paths persistidos ficaram relativos ao projeto e todos
  os hashes DB/filesystem foram reconciliados.
- Desktop `1280x900` e mobile `390x844`: mesmo estado final, sem overlaps,
  erros de console ou falhas de rede.

## Riscos e limites

- A consolidação não mistura formatos diferentes para o mesmo path.
- A normalização aceita somente o prefixo exato do projeto ativo.
- O filesystem continua canônico e nenhuma skill recebe permissão de escrita.
- O modo Cohort continua sem publicação, pausa, escala ou alteração na Meta.

## File List

- `docs/stories/2026-07-10-marketing-studio-artifact-contract-hardening.md`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-materializer.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/artifact-materializer.test.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts`
- `apps/academia-lendaria-ads-studio/e2e/traffic-squad.spec.ts`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/run.json`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-desktop.png`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-mobile.png`
- `docs/qa/epic-8-traffic-pilot.md`
- `README.md`
- `docs/design/cohort-marketing-unified-product-masterplan.md`
- `docs/design/ads-studio-squad-trafego-integration-plan.md`
