# Cohort de Marketing — Aula 04

> **Academia Lendária · Central de Dados**
>
> Análise de tráfego e de perfil da Meta: séries no tempo, comparação de períodos e campanhas, vendas reais (Hotmart), audiência, engajamento e o board de especialistas — fechando o ciclo com a retroalimentação das Aulas 1 e 2

Bem-vinda ao material da **Aula 04 do Cohort de Marketing**. Esta aula transforma o histórico da operação de tráfego (Aula 03) em **decisão**: um painel local no estilo Grafana/Looker com a identidade da sua marca, e um board de **clones de especialistas de mercado** que lê os números e recomenda a próxima alavanca — sem publicar ou alterar nada na Meta.

## Comece por aqui

1. Confira o handoff da [Aula 03](./docs/conexao-aula-03.md).
2. Abra o [guia visual da Aula 04](./aula-dados-GUIA-ALUNO.html).
3. Leia o [fluxo da aula](./docs/fluxo-da-aula-04.md).
4. Configure as chaves da Meta pelo [guia de configuração](./docs/configurar-chaves-meta.md) e pelo [tutorial de token](./docs/tutorial-token-meta.md) — ou rode em Modo Exemplo.
5. (Opcional) Conecte o caixa real pela Hotmart com o [tutorial](./docs/tutorial-hotmart.md).
6. Rode `/analista-de-dados` — o hub do Squad de Dados executa tudo (coleta → board → painel → retroalimentação).
7. Rode `/gestor-de-campanhas` — realizado × planejado (7/30 dias) para fechar o ciclo.
8. Veja o [painel de exemplo](./exemplos/painel-trafego-exemplo.html) para saber ler o resultado.

## O que você ganha na Aula 04

A Aula 04 entrega o **Squad de Dados** — como na Aula 3, uma skill por função. O `/analista-de-dados` é a porta de entrada: um comando roda a sequência inteira; cada etapa também funciona sozinha (útil pra re-rodar só o board ou só o painel, sem recoletar).

| Etapa | Skill | Entrega |
|---|---|---|
| 0 | `/analista-de-dados` (hub) | Setup das chaves Meta (delegado ao `/zelador`) ou Modo Exemplo; conexão opcional da Hotmart; orquestra as etapas abaixo |
| 1 | `/coletor-de-dados` | Bundle: séries dia/mês/quarter, campanhas (com data de início), funil (agregado, por dia e por campanha×dia), heatmap, demografia (idade/gênero/UF), vendas + atribuição honesta, engajamento orgânico — tudo sem PII |
| 2 | `/board-de-especialistas` | Sentimento dos comentários (leitura por IA) + leitura dos **6 clones** (Media Buyer, Analista de Dados, Diretor de Criativos, CRO/Growth, **Estrategista de Audiência**, **Social/Comunidade**) + síntese |
| 3 | `/painel-de-dados` | `painel-trafego.html` self-contained e interativo: 7 telas (Visão geral com filtro de mês, Séries, Campanhas ordenáveis, Vendas com filtros, Audiência com pirâmide etária + mapa do Brasil, Engajamento com posts ordenáveis + "Quem é o meu cliente", Board) + PDF |
| 4 | `/retroalimentacao` | `retroalimentacao.md` — demografia/linguagem → avatar (Aula 1); produtos/prova social/objeções → copy (Aula 2) |
| 5 | `/gestor-de-campanhas` | `gestao-campanhas.md` — realizado 7/30 dias × planejado (PAINEL-DA-SEMANA) com desvios, tendência e parecer |

## Regra central

O Analista prepara e recomenda. **Quem decide é o aluno.** Nada nesta aula publica, pausa ou altera campanha na Meta. Toda métrica carrega origem e selo:

- `Real`: valor literal confirmado da Graph API;
- `Estimado`: atribuição da plataforma (**todo ROAS é Estimado** — ≠ caixa);
- `Calculado`: variação entre dois valores Real (comparação de períodos);
- `não fornecido`: campo ausente, que não pode ser inventado nem derivado.

Regra de transição (de `docs/regras-de-dados.md`): **uma métrica sem fonte, janela ou contexto não vira série histórica**; no trimestre, taxas não são recalculadas.

## Como rodar localmente

Abra este repositório no Claude Code ou Codex e rode `/analista-de-dados`. Sem credenciais no `.env`, o painel roda em **Modo Exemplo** (dados fictícios) — a demo nunca trava. Com `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`, ele lê a conta real.

```bash
# dados (cai na fixture se não houver credenciais)
node scripts/painel-trafego-data.mjs --account --saida=projetos/{slug}/dados-trafego/bundle.json
# painel (self-contained, abre offline)
node scripts/painel-trafego-render.mjs --dados=projetos/{slug}/dados-trafego/bundle.json \
  --board=projetos/{slug}/dados-trafego/board.json --tokens=projetos/{slug}/tokens.json \
  --projeto="Sua Marca" --saida=projetos/{slug}/painel-trafego.html
```

## Onde ficam as fontes canônicas

- skills do squad: [`analista-de-dados`](../.claude/skills/analista-de-dados/) · [`coletor-de-dados`](../.claude/skills/coletor-de-dados/) · [`board-de-especialistas`](../.claude/skills/board-de-especialistas/) · [`painel-de-dados`](../.claude/skills/painel-de-dados/) · [`retroalimentacao`](../.claude/skills/retroalimentacao/) · [`gestor-de-campanhas`](../.claude/skills/gestor-de-campanhas/);
- espelhos para Codex em [`.agents/skills/`](../.agents/skills/) (mesmos nomes);
- scripts: [`scripts/painel-trafego-data.mjs`](../scripts/painel-trafego-data.mjs), [`scripts/painel-trafego-render.mjs`](../scripts/painel-trafego-render.mjs), [`scripts/hotmart-vendas.mjs`](../scripts/hotmart-vendas.mjs), [`scripts/gestor-campanhas.mjs`](../scripts/gestor-campanhas.mjs) e [`scripts/retroalimentacao.mjs`](../scripts/retroalimentacao.mjs);
- camadas de dados (reuso): [`scripts/lib/meta-graph.mjs`](../scripts/lib/meta-graph.mjs) (Graph API) e [`scripts/lib/hotmart.mjs`](../scripts/lib/hotmart.mjs) (vendas);
- mapa de skills atualizado: [`mapa-skills.html`](../mapa-skills.html).

## Privacidade e segurança (inegociável)

- `.env` (chaves Meta/Hotmart) e `projetos/` (dados reais da SUA conta) são **gitignorados** — nunca sobem pro GitHub;
- nenhum dado pessoal de comprador ou autor de comentário entra nos bundles (agregados sem PII);
- os exemplos versionados (`mapa-skills-samples/academia-fit/`) usam **dados fictícios**.

## Materiais complementares

- [Configurar chaves da Meta](./docs/configurar-chaves-meta.md) — token, escopos e IDs;
- [Como obter o token da Meta](./docs/tutorial-token-meta.md) — tutorial passo-a-passo (App ID/Secret, System User, escopos, token de página p/ engajamento);
- [Conectar a Hotmart](./docs/tutorial-hotmart.md) — caixa real e atribuição honesta;
- [Perfil orgânico — roadmap](./docs/organico-roadmap.md) — comentários e visualizações de posts;
- [Regras de dados e evidências](./docs/regras-de-dados.md);
- [Template de análise](./templates/analise-trafego.yaml) e [exemplos](./exemplos/).

## Próxima aula

Encerra a trilha do Cohort 1. O Squad de Dados fecha o ciclo Oferta → Funil → Tráfego → **Dados** (Método O.F.T.R.): a retroalimentação devolve os aprendizados reais para o avatar (Aula 1) e a oferta/copy (Aula 2), orientando a próxima rodada de decisão — sempre com o aluno aprovando.
