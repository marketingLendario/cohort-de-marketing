# GUIA COMO LER OS NÚMEROS — a árvore de decisão das métricas (sem se enganar)

> **Estou perdido em:** "abro o painel/Gerenciador e vejo 20 números… qual manda? qual ignoro? quando um número 'ruim' importa?"
> **O que você vai ter no final:** a árvore que o mercado inteiro usa e o método confirma — UMA métrica principal decide, as secundárias só diagnosticam — com os limiares de significância e as faixas de referência pra você nunca mais pausar campanha boa por pânico.
> **Fontes cruzadas:** SKILL.md do `/leitor-de-metricas` e do `/diagnosticador` (código real: selos, limiar de 10, uma alavanca) · [guia-o-que-e-coletado](guia-o-que-e-coletado.md) (repo) · referências de mercado reescritas (métrica principal vs secundária, coluna mapeada ao funil, janelas de análise, benchmarks) · métricas de VSL (reescritas — só se você tiver VSL).
> ⚠️ Números de mercado aqui são sempre **FAIXA de referência**, nunca lei — e quando divergirem do método do curso, **o método vence**.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | As 6 métricas básicas (CTR, CPM, CPA, ROAS, frequência, conversões) | [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) → "O mundo das MÉTRICAS" (3 min) |
| 📄 Artefato | Números pra ler: o painel da Central ([guia-central-de-dados](guia-central-de-dados.md)) ou as colunas do Gerenciador ([guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md), seção 3) | sem campanha ainda? leia mesmo assim — é vacina |

## A regra-mãe: UMA métrica principal; o resto diagnostica

- **Métrica principal** = a única que define sucesso/fracasso. No método: **CPA** (ou ROAS, se Purchase) — comparada com o SEU `roas_break_even`/CPA-alvo, não com média de mercado.
- **Métricas secundárias** (CTR, CPC, CPM, frequência...) **nunca dão veredito** — só apontam ONDE mexer.
- O erro nº 1 do iniciante (e de muito gestor): campanha LUCRATIVA pausada porque "o CTR está baixo". Se CPA/ROAS estão bons, a campanha está boa — ponto (consenso de mercado + método).

## A árvore: cada número aponta um culpado

Leia as colunas NA ORDEM do funil — o primeiro número ruim indica onde o problema mora:

| Número ruim | Culpado provável | Alavanca |
|---|---|---|
| **CPM** alto | leilão/criativo não-nativo | criativo ([guia-criativos](../04-operacao/guia-criativos.md)) |
| **CPC/CTR** ruim | anúncio (gancho fraco) | criativo/ângulo |
| **Connect rate** baixo (cliques que não viram visita) | página LENTA ou quebrada | página (velocidade ≤ ~2,5 s é a faixa saudável de mercado) |
| **Custo por finalização** de compra alto | página de vendas/oferta | copy/página — "se o CPC está bom, é a copy que precisa melhorar" (referência de mercado) |
| **CPA/ROAS** ruim com tudo acima ok | oferta/checkout/preço | oferta — assunto de funil, não de tráfego |

Faixas de mercado pra se situar (FAIXA, não lei — low ticket BR): CPC bom < ~R$1,50, preocupante > ~R$2,80 · CPM na casa de ~R$30 costuma estar ok · perda de tráfego (clique→página) < 20% boa, > 30% péssima. E **não existe "taxa de conversão média de mercado"** — o alvo é função do SEU CPC e do SEU ticket.

## Significância: quando um número VALE alguma coisa

1. **Regra de bolso de mercado:** 1 venda é sorte, 2 é talvez, 3 começa a ser sinal.
2. **Limiar do método (o que o `/leitor-de-metricas` usa):** menos de **~10 conversões** na janela = `amostra_suficiente_para_cpa: false` — nenhuma conclusão de CPA vale.
3. **Não confunda** com as ~50 conversões/7d que tiram o conjunto da fase de aprendizado — isso é critério do ALGORITMO da Meta, não critério da SUA decisão. São réguas diferentes.

## As 3 janelas de análise (referência de mercado que o ritual usa)

Sempre olhe três recortes antes de opinar: **hoje** (parcial — o mais traiçoeiro) · **ontem** (último dia completo) · **últimos 7 dias** (o panorama que decide). Decisão só na janela de 7 dias — as outras duas são contexto. E cuidado com a comparação torta: painel em "30 dias" contra Gerenciador em "7 dias" sempre "diverge".

## O selo antes do número

Todo número do método chega com selo: **Real** (confirmado na fonte) · **Estimado** (atribuição da plataforma — TODO ROAS do Gerenciador) · **não fornecido** (ausente ≠ zero). Regra: decisão de dinheiro pede Real (o caixa da Hotmart); Estimado orienta, não fecha conta — atribuição erra mesmo ([guia-o-que-e-coletado](guia-o-que-e-coletado.md)).

## Se você tem VSL (vídeo de vendas) — as 3 métricas extras

Faixas de mercado reescritas, pra quem roda página com vídeo: **play rate > ~60%** (o vídeo começa a ser assistido — abaixo disso o problema é a página/thumb) · **retenção no 1º minuto > ~60%** (o lead segura) · **retenção até o pitch ≥ ~30%** (queda brusca NO pitch é onde a venda morre). Sem VSL? Ignore esta seção inteira.

## Teste de sucesso

Pegue a SUA última janela de 7 dias (painel ou Gerenciador) e responda por escrito no `PAINEL-DA-SEMANA.yaml`: (1) qual é a métrica principal e qual o valor dela vs o seu alvo? (2) a amostra passa de 10 conversões? (3) qual é o PRIMEIRO número ruim na ordem do funil? Se as 3 respostas saíram sem travar, você leu — e a decisão vira assunto do `/diagnosticador`.

## POSSÍVEIS ERROS — catálogo (os enganos clássicos de leitura)

| # | Sintoma | Causa | O que fazer |
|---|---|---|---|
| LN1 | Quer pausar campanha lucrativa "porque o CTR está baixo" | julgou pela secundária | veredito é SÓ da principal (CPA/ROAS vs alvo); CTR baixo com CPA bom = anote como melhoria futura de criativo e NÃO mexa |
| LN2 | "3 vendas no criativo A — achei o vencedor!" | amostra minúscula | espere as ~10 conversões do limiar; com 3, é acaso ([guia-e-depois](../04-operacao/guia-e-depois.md)) |
| LN3 | "O painel diz X e o Gerenciador diz Y" | janelas/atribuição diferentes | iguale o período; lembre Real vs Estimado (CD5 do [guia-central-de-dados](guia-central-de-dados.md)) |
| LN4 | ROAS 2 no Gerenciador e você "no lucro" | ROAS ≠ ROI + atribuição é estimativa | desconte SEUS custos (margem!) e confirme no caixa da Hotmart antes de comemorar/escalar |
| LN5 | CTR ótimo, visitas baixas — "o anúncio piorou?" | não: os cliques não estão VIRANDO visita (connect rate) | teste a velocidade da página (4G, celular); página lenta queima verba boa |
| LN6 | Leu "hoje de manhã" e entrou em pânico | a janela "hoje" é parcial e volátil | decisão só nos 7 dias; hoje/ontem são contexto |

> Uma alavanca por vez: identificou o problema? NÃO saia mexendo — leve pro `/diagnosticador`, que devolve UMA alavanca com critério de sucesso e reversão. Analisar ≠ otimizar.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/leitor-de-metricas` (dia 7) e aplique o teste de sucesso acima na SUA janela |
| 📖 Ler | [guia-e-depois](../04-operacao/guia-e-depois.md) (o ritual que usa esta leitura) · [guia-central-de-dados](guia-central-de-dados.md) (o painel mensal) |
| 🚑 Se travar | o catálogo LN1–LN6 acima — e na dúvida entre dois diagnósticos, o `/diagnosticador` desempata |
