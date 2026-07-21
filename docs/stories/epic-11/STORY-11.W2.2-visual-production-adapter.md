# STORY-11.W2.2 - Adapter de produção visual

## Status

Done

## Critérios de aceite

- [x] `design-md` importa ou cria identidade com preview validado.
- [x] `criativos-funil` gera roteiro e banners reais.
- [x] `mockup-produto-funil` gera imagens reais e galeria revisável.
- [x] Toda imagem possui hash, dimensões, prompt sanitizado e gate visual.
- [x] Personas e likeness exigem foto e autorização compatíveis.
- [x] O usuário seleciona peças antes da promoção ao projeto.
- [x] Desktop/mobile e formatos 4:5, 9:16 e 1:1 passam no E2E.

## Evidências

- `server/brand-design/preview.test.ts` valida frontmatter simples e Google-spec enriquecido, tokens e preview responsivo.
- `server/visual-production/runner.test.ts` prova a ordem skill canônica -> produção binária e o roteamento de mockup.
- `server/creative-factory/creative-factory.test.ts` prova hashes, proveniência sanitizada, gate, confinamento, autorização de likeness e promoção idempotente.
- `src/components/visual-production-review.test.tsx` prova bloqueio de peças sinalizadas, seleção humana e saga de aprovação.
- `e2e/epic-11-visual-production.mjs` executa as três skills via Codex CLI local, reabre no painel, aprova e promove.
- `apps/academia-lendaria-ads-studio/design-qa-evidence/epic-11/visual-production-live/evidence.json` registra 6 PNGs reais, dimensões, SHA-256, screenshots desktop/mobile e runs finais `done`.

## File List

- `apps/academia-lendaria-ads-studio/server/brand-design/preview.ts`
- `apps/academia-lendaria-ads-studio/server/creative-factory/runner.ts`
- `apps/academia-lendaria-ads-studio/server/creative-factory/storage.ts`
- `apps/academia-lendaria-ads-studio/server/routed-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/server/visual-production/runner.ts`
- `apps/academia-lendaria-ads-studio/server/skill-cli.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`
- `apps/academia-lendaria-ads-studio/src/components/visual-production-review.tsx`
- `apps/academia-lendaria-ads-studio/src/components/creative-factory/real-creative-factory.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/creative-factory-runtime.ts`
- `apps/academia-lendaria-ads-studio/e2e/epic-11-visual-production.mjs`
