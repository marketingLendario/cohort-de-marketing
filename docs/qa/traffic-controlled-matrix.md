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

Este teste valida o comportamento das skills e dos handoffs no runner local. Não usa credenciais Meta nem substitui o próximo teste controlado em uma conta real, que deve começar em modo de leitura/recomendação e sem publicação.

## Gate Meta em modo leitura

O check L1 foi executado para `controlled-traffic` e retornou:

- `adapterAvailable: false`;
- `capabilityUnavailable: true`;
- motivo: `services/meta-ads/index.js` não existe neste checkout.

Isso é um bloqueio de capacidade, não uma falha silenciosa. O `MetaCliPublisher` atual implementa apenas `check`; criação e confirmação de campanhas continuam como stubs. Nenhuma chamada de mutação foi realizada.
