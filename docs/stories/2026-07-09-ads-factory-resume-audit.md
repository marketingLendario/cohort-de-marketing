# Story - Auditoria de retomada do Ads Factory

## Status

Draft em 2026-07-09.

## Contexto

Depois da migração do painel para este repositório, o primeiro login local mostrou
um texto interno sobre alertas do monitor: "Epic 5 — Story 5.2". A investigação
confirmou que esse texto vinha de um placeholder esperado da fundação, não de um
erro de autenticação.

## O que já está feito neste repo

- App local em `apps/academia-lendaria-ads-studio/`, rodando no Vite.
- Modo demo local sem Supabase, com login `demo@academialendaria.local`.
- Dashboard/Home com lista de campanhas e criação de campanha draft.
- Seletor de spoke em modo demo.
- Wizard route `/campaigns/$campaignId/$step`.
- Tela 1 do wizard: Setup de Produto + Unit Economics.
- Cálculo determinístico local de CAC, LTV, LTV:CAC, payback, Max CPA e ROAS.
- Persistência demo de campanhas e unit economics em `localStorage`.
- BFF/worker skeleton importado em `server/`.
- Backend do Gate #1 importado: `campaign.advanceToStep`, `advance-step`,
  `l0-deterministic` e repositório Supabase backend.

## O que veio pronto do sinkra-hub

As stories formais encontradas no `sinkra-hub` cobrem a fundação até
`STORY-AL-ADS-1.6`.

- `STORY-AL-ADS-1.4`: Dashboard/Home, com área de alertas vazia até Epic 5.
- `STORY-AL-ADS-1.5`: Tela 1 + Unit Economics.
- `STORY-AL-ADS-1.6`: Gate Duro #1 no backend + thresholds + estado retomavel.

O PRD também define Epic 2 a Epic 5, mas não foram encontradas stories
versionadas de implementação para esses epics neste momento.

## Achados da auditoria

1. A mensagem sobre "Story 5.2" era um vazamento de roadmap interno na UI.
   O comportamento correto para a fundação é manter a faixa vazia/oculta quando
   não há alertas reais.
2. O monitor real pertence ao Epic 5, então não é o ponto certo de retomada.
3. O backend da Story 1.6 existe no app importado, mas o frontend ainda não chama
   `campaign.advanceToStep` via tRPC em ambiente não-demo.
4. No momento da auditoria, o botão "Avançar" da Tela 1 apenas ficava
   habilitado/desabilitado por viabilidade local. Isso foi corrigido no modo
   demo pela story `2026-07-09-ads-factory-gate1-ui-bridge.md`.
5. No teste local atual, apenas o Vite está rodando. O BFF tRPC é separado
   (`npm run dev:server`) e ainda não existe cliente tRPC no frontend.

## Ponto recomendado de retomada

Retomar pela ponte da `STORY-AL-ADS-1.6` no contexto deste repo:

- conectar o botão "Avançar" da Tela 1 a uma ação real;
- salvar o Unit Economics antes de tentar avançar;
- enforçar o Gate #1 também no modo demo, usando a mesma função determinística;
- quando viável, atualizar `step_current` para 2 e navegar para o passo 2;
- quando inviável, mostrar motivo numérico claro sem permitir o avanço;
- depois decidir se o modo não-demo usa cliente tRPC para o BFF ou se a app
  continua temporariamente demo-first enquanto Supabase/BFF são religados.

## Próxima story sugerida

`2026-07-09-ads-factory-gate1-ui-bridge.md` — "Conectar Tela 1 ao Gate #1 e
retomada do wizard" — concluída para modo demo.

A próxima retomada real é escolher entre:

- conectar o frontend ao BFF tRPC para o fluxo não-demo;
- ou avançar para a Tela 2, criando a primeira story local do Epic 2.

## Validacao esperada para a proxima story

```bash
npm --prefix apps/academia-lendaria-ads-studio run typecheck
npm --prefix apps/academia-lendaria-ads-studio run build
npm --prefix apps/academia-lendaria-ads-studio test
npm --prefix apps/academia-lendaria-ads-studio run lint
```
