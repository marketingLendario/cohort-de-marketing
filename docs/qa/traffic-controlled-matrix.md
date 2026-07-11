# Teste controlado — Squad de Tráfego

Data: **10/07/2026**

Script: [`traffic-controlled-matrix.mts`](../../apps/academia-lendaria-ads-studio/scripts/traffic-controlled-matrix.mts)

## Resultado

**PASS — 5/5 skills.** A matriz executou as skills canônicas em sandbox `read-only`, com entrada determinística e sem editar arquivos, publicar, pausar ou escalar campanhas.

| Skill | Gates validados |
|---|---|
| `zelador` | Tracking sem evidência retorna `CRITICO` e não libera campanha. |
| `briefista` | Gera somente para ângulos com nível declarado e mantém a recusa humana pendente. |
| `estruturador` | Recomenda Vendas/Conversão, público amplo/frio e Advantage+ sem publicar. |
| `leitor-de-metricas` | Preserva valores literais; CTR, CPM, alcance e frequência ficam `nao_fornecido`; ROAS fica estimado. |
| `diagnosticador` | Retorna uma alavanca com sucesso/reversão e zero derivação das métricas ausentes. |

## Limites

Este teste valida o comportamento das skills e dos handoffs no runner local. A matriz determinística não usa credenciais Meta; o handoff real abaixo cobre a leitura controlada em conta configurada, ainda sem publicação.

## Gate Meta em modo leitura

O check L1 foi executado para o spoke local configurado e retornou:

- adapter disponível em `services/meta-ads/index.js`;
- autenticação read-only aprovada para o spoke `natalia-tanaka`;
- saída do CLI higienizada, sem repassar token integral ou fragmentos.

O `MetaCliPublisher` atual continua implementando apenas `check`; criação e confirmação de campanhas continuam como stubs. Nenhuma chamada de mutação foi realizada.

## Handoff real read-only

Script: [`traffic-real-readonly-handoff.mts`](../../apps/academia-lendaria-ads-studio/scripts/traffic-real-readonly-handoff.mts)

**PASS — Meta → Leitor → Diagnosticador.** A leitura real usou o período `03/07/2026` a `09/07/2026` e preservou `spend`, `impressions`, `ctr`, `cpc`, `reach`, `clicks`, `frequency` e `cpm`. `conversões`, `CPA` e `ROAS` permaneceram `nao_fornecido`; o diagnóstico produziu `trafficDiagnosis`, uma única alavanca e zero derivação dessas métricas.

O contrato também normaliza os aliases da Meta (`reach`/`alcance` e `frequency`/`frequência`) e o adapter falha fechado após `META_ADS_TIMEOUT_MS` (padrão de 30 segundos). O comando de campanha não foi usado para mutação; quando testado, o timeout foi tratado como erro controlado.

## E2E do launcher

Comando: `npm run test:e2e:launcher`

**PASS — Story 8.W3.3.** O launcher foi validado com migration local alinhada, fixture Supabase isolada, autenticação real, BFF, interface, shutdown e restart. A infraestrutura backend recebeu grants explícitos para `service_role` nas tabelas usadas pelo worker e pelo harness; a fixture também reaplica o grant da tabela legada `ads_campaigns` quando ela já existe.
