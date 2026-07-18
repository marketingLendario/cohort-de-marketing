# Conexão com a Aula 03 — Tráfego

A Aula 04 é a **Central de Dados**: ela consome o que a operação de tráfego da Aula 03 produziu e o transforma em painel + decisão. Não é uma releitura informal dos anúncios — parte de métricas com origem, janela e contexto.

## O que a Aula 03 entrega (insumo desta aula)

- Painéis semanais versionados (`PAINEL-DA-SEMANA.yaml`);
- leitura literal com fonte e selo (Leitor de Métricas);
- janela de atribuição, quando confirmada;
- diagnóstico e decisão humana (Diagnosticador);
- eventos de tracking e lacunas conhecidas (Zelador);
- registro do que foi feito manualmente na plataforma.

## O que a Aula 04 faz com isso

- **Séries no tempo:** evolução por dia, mês e quarter da conta e das campanhas;
- **Comparação:** dois períodos lado a lado (com deltas `Calculado`) e ranking de campanhas por gasto/ROAS;
- **Board de especialistas:** 4 clones de mercado leem os mesmos dados por lentes diferentes e recomendam uma alavanca cada, com síntese;
- **Perfil orgânico (roadmap):** comentários e visualizações de posts, quando o token de página permitir (ver [organico-roadmap.md](./organico-roadmap.md)).

## Regra de transição (herdada)

Uma métrica sem fonte, janela ou contexto **não vira série histórica** — marque a lacuna antes de agregar. No trimestre, soma-se só o que é aditivo (gasto, impressões, cliques); taxas e alcance não são recalculados. Todo ROAS é `Estimado` até o aluno confirmar venda no caixa.
