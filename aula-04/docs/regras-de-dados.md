# Regras de dados e evidências — Aula 04

O painel e o board herdam o contrato do Leitor de Métricas. Estas são as regras que mantêm a leitura honesta.

## Selos de fonte

- **Real** — valor que a Meta entregou pronto (impressões, cliques, CTR, CPM…). Nada é calculado localmente.
- **Estimado** — atribuição da plataforma. **Todo ROAS é Estimado** — não é o mesmo que dinheiro no caixa. Só vira Real quando o aluno confere a venda (checkout/extrato/CRM).
- **Calculado** — variação percentual entre dois valores Real, na comparação de períodos. Transparente por ser uma comparação, não uma métrica fabricada.
- **não fornecido** — campo ausente. Não se inventa, não se deriva, não se completa com benchmark.

## Não-inferir (proibições)

- Proibido calcular CTR, CPM, CPC, CPA, ROAS ou frequência a partir de outros campos — mesmo que a conta seja trivial.
- Proibido completar com média de mercado, taxa assumida ou dado de outra conta.
- Amostra pequena (poucas conversões) → leia sinal de topo (CTR, CPM, custo por clique no link); não confie em CPA.

## Agregação trimestral

O trimestre (quarter) **soma apenas contadores aditivos**: gasto, impressões, cliques, cliques no link. Taxas (CTR/CPM/CPC/frequência) e **alcance único** não são recalculados — aparecem como "não fornecido" no quarter. Para ler taxa, use as granularidades **Mês** ou **Dia**.

## Evidência no board

Cada clone de especialista **ancora** sua leitura num número do bundle e cita o selo. Nenhuma recomendação sai sem o dado que a sustenta. Se o dado não existe, o clone diz "amostra insuficiente" — não preenche o vazio.

## Regra de transição (da Aula 03)

Uma métrica sem fonte, janela ou contexto não vira série histórica. Marque a lacuna antes de agregar.

## Segurança

Segredos (token, app secret) passam por *scrubber* → `[REDACTED]` em qualquer saída. O `.env` fica fora do git.
