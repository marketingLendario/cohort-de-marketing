# STORY-11.W1.1 - Contrato de paridade painel/CLI

## Status

Done

## Critérios de aceite

- [x] As 31 skills possuem uma entrada única na matriz canônica.
- [x] A matriz separa `full_e2e`, `partial` e `proposal_only`.
- [x] Cada skill não completa declara adapter e capabilities pendentes.
- [x] O catálogo falha se houver skill ausente, duplicada ou desconhecida.
- [x] `full_e2e` exige modo especializado, evidência e zero lacuna.
- [x] O arquivo gerado do frontend inclui a matriz.
- [x] A Jornada mostra o nível real de paridade da skill selecionada.
- [x] O CTA usa `Executar skill`, `Executar etapa guiada` ou `Gerar proposta`.
- [x] O usuário vê qual família de adapter ainda falta.
- [x] Testes cobrem o baseline exato de 6 skills completas.

## Ownership

- `data/skill-execution-matrix.json`
- `scripts/generate-skill-catalog.mjs`
- `scripts/validate-skill-catalog.mjs`
- `apps/academia-lendaria-ads-studio/src/lib/skill-execution-parity.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`
