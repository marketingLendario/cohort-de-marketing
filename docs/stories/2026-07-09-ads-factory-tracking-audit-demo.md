# Story - Tela 6 de Auditoria de Tracking

## Status

Concluída.

## Contexto

O passo 6 é o Gate #2: configura pixel e domínio, valida eventos, calcula EMQ e
bloqueia a publicação quando Purchase falha.

## Critérios de aceite

- [x] Pixel, domínio e eventos esperados são editáveis.
- [x] A auditoria possui estados idle, running, aprovado e bloqueado.
- [x] EMQ e variance reproduzem a referência.
- [x] O cenário de Purchase quebrado pode ser alternado para teste.
- [x] Avançar fica bloqueado até a auditoria aprovada.
- [x] Resultado persiste por campanha no modo demo.
- [x] Desktop/mobile e gates de qualidade passam.

## Fora de escopo

- Auditoria real de Pixel/CAPI.
- Credenciais reais da Meta.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/components/wizard/tracking-audit-step.tsx`
- `apps/academia-lendaria-ads-studio/src/lib/tracking-audit.ts`
- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-operation-steps.test.ts`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/index.css`
