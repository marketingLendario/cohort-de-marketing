# Story - Conectar Tela 1 ao Gate #1 no modo demo

## Status

Done em 2026-07-09.

## Contexto

A migração trouxe a Tela 1 de Unit Economics e o backend do Gate #1, mas o teste
local atual roda em modo demo, sem Supabase e sem BFF tRPC conectado ao frontend.
O botão "Avançar" da Tela 1 estava apenas habilitado/desabilitado por viabilidade
local e não executava transição real de wizard.

## Criterios de aceite

- [x] O botão "Avançar" salva o Unit Economics antes da tentativa de avanço.
- [x] Em modo demo, o Gate #1 reusa a mesma função determinística de Unit Economics.
- [x] Se `LTV:CAC < 1`, o avanço é bloqueado com motivo numérico.
- [x] Se viável, a campanha demo recebe `step_current=2`.
- [x] Se viável, a UI navega de `/campaigns/:id/1` para `/campaigns/:id/2`.
- [x] A UI não mostra nomes internos de Epic/Story para o usuário final.
- [x] Typecheck, build, testes e lint passam.

## Fora de escopo

- Conectar o frontend ao BFF tRPC em ambiente não-demo.
- Implementar a Tela 2 completa.
- Implementar cards reais de monitoramento do Epic 5.

## Lista de arquivos

- `apps/academia-lendaria-ads-studio/src/lib/demo-mode.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-advance.ts`
- `apps/academia-lendaria-ads-studio/src/lib/campaign-advance.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/wizard/unit-economics-step.tsx`
- `apps/academia-lendaria-ads-studio/src/routes/campaigns/$campaignId.$step.tsx`
- `apps/academia-lendaria-ads-studio/src/components/monitor-alerts.tsx`
- `apps/academia-lendaria-ads-studio/src/components/dashboard.test.tsx`

## Comandos de validação

```bash
npm --prefix apps/academia-lendaria-ads-studio run typecheck
npm --prefix apps/academia-lendaria-ads-studio test
npm --prefix apps/academia-lendaria-ads-studio run lint
npm --prefix apps/academia-lendaria-ads-studio run build
```

## Resultado

- Typecheck: PASS.
- Testes: PASS, 3 arquivos, 17 testes.
- Lint: PASS.
- Build: PASS.

O modo demo agora permite testar a transição da Tela 1 para o passo 2 quando a
campanha é viável. A Tela 2 ainda é placeholder, por escopo.
