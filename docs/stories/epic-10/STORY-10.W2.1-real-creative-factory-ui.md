# STORY-10.W2.1 - Tela real da Creative Factory

## Status

Done

## Critérios de aceite

- [x] Campanha unificada possui etapa `Criativos` entre Estrutura e Subida manual.
- [x] Configuração permite formatos, arquétipos, variantes e personas disponíveis.
- [x] A UI mostra progresso durável, cancelamento, falha e retry.
- [x] Galeria usa PNGs reais do lote, sem samples estáticos.
- [x] Cada item mostra imagem, headline, legenda, descrição, CTA, gate e formato.
- [x] Operador aprova/rejeita itens individualmente e pode gerar nova versão do lote.
- [x] Somente peças aprovadas podem entrar no pacote final.
- [x] Aprovação do lote materializa pacote e artefatos rastreáveis.
- [x] Estado sobrevive a reload, novo BrowserContext e restart do launcher.
- [x] Desktop e mobile não possuem overflow ou controles sobrepostos.

## Ownership

- `apps/academia-lendaria-ads-studio/src/components/creative-factory/**`
- `apps/academia-lendaria-ads-studio/src/components/traffic-campaign-workspace.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/creative-factory-runtime.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts`
