# Story - Tela 7 de Revisão e Publicação

## Status

Concluída.

## Contexto

O passo 7 consolida os dados, executa o checklist pré-voo e simula o agente de
publicação com cenários de sucesso, falha parcial e adapter indisponível.

## Critérios de aceite

- [x] Consolidado e atalhos de edição refletem os passos anteriores.
- [x] Checklist combina viabilidade, slots, tracking e budget.
- [x] Publicação fica bloqueada enquanto houver gates pendentes.
- [x] Publicar pausado é configurável.
- [x] Cenários sucesso, falha parcial/retry e adapter off funcionam.
- [x] Progresso, logs e resultado persistem por campanha.
- [x] Sucesso libera navegação para o Monitor.
- [x] Desktop/mobile e gates de qualidade passam.

## Fora de escopo

- Chamar a CLI real `meta-ads`.
- Criar campanhas reais na Meta.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/campaign-publication-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-publication.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-operation-steps.test.ts`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
