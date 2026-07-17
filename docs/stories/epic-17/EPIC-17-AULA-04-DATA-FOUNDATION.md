# EPIC-17 - Fundação da Aula 4: dados

## Status

Concluída. W1, W2 e W3 estão `Done`; `17.W3.1` passou no QG3 com `98/100` e
`17.W3.2` passou no gate público independente com `99/100`, confiança `0.99`
e zero findings. O epic tem veredito final `PASS` local.

## Problema

A Aula 3 já produz CampaignPlan, WeeklyPanel, métricas com selos e decisões
humanas. A Aula 4 existe como handoff, mas ainda não possui ledger longitudinal,
validators, fluxo didático e reconciliação de fontes completos.

## Objetivo

Transformar semanas isoladas em histórico confiável para aprender com decisões
sem inventar métricas, misturar janelas incompatíveis ou automatizar mutações na
Meta.

## Fluxo de dados

```text
CampaignPlan + WeeklyPanel + fontes confirmadas
                    |
                    v
             weekly ledger v1
                    |
       +------------+-------------+
       v                          v
leitor histórico          reconciliação de fontes
       +------------+-------------+
                    v
       diagnóstico decisão/resultado
                    |
                    v
             decisão humana
```

## Escopo

- Validators e fixtures para contratos da Aula 4.
- Ledger multi-semana append-only.
- Evolução das skills de leitura e diagnóstico.
- Reconciliação plataforma, checkout e caixa.
- Material didático e release pública.

## Fora de escopo

- Publicar, pausar ou escalar anúncios.
- Conectar automaticamente credenciais de checkout/caixa nesta epic.
- Dashboard privado do Studio, pertencente a APP-19.
- Criar série histórica a partir de métrica sem proveniência.

## Ondas e stories

| Onda | Story | Entrega | Dependências |
|---|---|---|---|
| W1 | 17.W1.1 | Validadores dos contratos | 16.W1.1 |
| W1 | 17.W1.2 | Ledger multi-semana | 17.W1.1 |
| W2 | 17.W2.1 | Leitura histórica | 17.W1.2 |
| W2 | 17.W2.2 | Diagnóstico decisão/resultado | 17.W1.2, 17.W2.1 |
| W2 | 17.W2.3 | Reconciliação de fontes | 17.W1.1, 17.W1.2 |
| W3 | 17.W3.1 | Módulo didático e fluxo local | W2 |
| W3 | 17.W3.2 | Gate público da Aula 4 | 17.W3.1 |

## Gate de conclusão

A epic só pode ficar `Done` quando um aluno executar três semanas versionadas,
rastrear fontes e janelas, comparar uma decisão com o resultado e registrar uma
nova decisão humana sem que nenhum número ausente seja inventado.
