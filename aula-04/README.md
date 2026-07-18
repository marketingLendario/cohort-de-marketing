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
6. Rode `/analista-de-trafego` — ele monta o painel e convoca o board.
7. Rode `/gestor-de-campanhas` — realizado × planejado (7/30 dias) + retroalimentação das Aulas 1 e 2.
8. Veja o [painel de exemplo](./exemplos/painel-trafego-exemplo.html) para saber ler o resultado.

## O que você ganha na Aula 04

| Etapa | Skill | Entrega |
|---|---|---|
| 1 | `/analista-de-trafego` (setup) | Validação das chaves Meta (delegada ao `/zelador`) ou Modo Exemplo; conexão opcional da Hotmart (caixa real) |
| 2 | `/analista-de-trafego` (dados) | Bundle: séries dia/mês/quarter, campanhas (com data de início), funil (agregado, por dia e por campanha×dia), heatmap, demografia (idade/gênero/UF), vendas + atribuição honesta, engajamento orgânico |
| 3 | `/analista-de-trafego` (board) | Leitura dos **6 clones** (Media Buyer, Analista de Dados, Diretor de Criativos, CRO/Growth, **Estrategista de Audiência**, **Social/Comunidade**) + síntese |
| 4 | `/analista-de-trafego` (painel) | `painel-trafego.html` self-contained e interativo: 7 telas (Visão geral com filtro de mês, Séries, Campanhas ordenáveis, Vendas com filtros, Audiência com pirâmide etária + mapa do Brasil, Engajamento com posts ordenáveis + "Quem é o meu cliente", Board) |
| 5 | `/analista-de-trafego` (retro) | `retroalimentacao.md` — demografia/linguagem → avatar (Aula 1); produtos/prova social/objeções → copy (Aula 2) |
| 6 | `/gestor-de-campanhas` | `gestao-campanhas.md` — realizado 7/30 dias × planejado (PAINEL-DA-SEMANA) com desvios, tendência e parecer |

## Regra central

O Analista prepara e recomenda. **Quem decide é o aluno.** Nada nesta aula publica, pausa ou altera campanha na Meta. Toda métrica carrega origem e selo:

- `Real`: valor literal confirmado da Graph API;
- `Estimado`: atribuição da plataforma (**todo ROAS é Estimado** — ≠ caixa);
- `Calculado`: variação entre dois valores Real (comparação de períodos);
- `não fornecido`: campo ausente, que não pode ser inventado nem derivado.

Regra de transição (de `docs/regras-de-dados.md`): **uma métrica sem fonte, janela ou contexto não vira série histórica**; no trimestre, taxas não são recalculadas.

## Como rodar localmente

Abra este repositório no Claude Code ou Codex e rode `/analista-de-trafego`. Sem credenciais no `.env`, o painel roda em **Modo Exemplo** (dados fictícios) — a demo nunca trava. Com `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`, ele lê a conta real.

```bash
# dados (cai na fixture se não houver credenciais)
node scripts/painel-trafego-data.mjs --account --saida=projetos/{slug}/dados-trafego/bundle.json
# painel (self-contained, abre offline)
node scripts/painel-trafego-render.mjs --dados=projetos/{slug}/dados-trafego/bundle.json \
  --board=projetos/{slug}/dados-trafego/board.json --tokens=projetos/{slug}/tokens.json \
  --projeto="Sua Marca" --saida=projetos/{slug}/painel-trafego.html
```

## Onde ficam as fontes canônicas

- skills: [`.claude/skills/analista-de-trafego/`](../.claude/skills/analista-de-trafego/) e [`.claude/skills/gestor-de-campanhas/`](../.claude/skills/gestor-de-campanhas/);
- espelhos para Codex: [`.agents/skills/analista-de-trafego/`](../.agents/skills/analista-de-trafego/) e [`.agents/skills/gestor-de-campanhas/`](../.agents/skills/gestor-de-campanhas/);
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

Encerra a trilha do Cohort 1. O painel, o board e o `/gestor-de-campanhas` fecham o ciclo Oferta → Funil → Tráfego → **Dados** (Método O.F.T.R.): a retroalimentação devolve os aprendizados reais para o avatar (Aula 1) e a oferta/copy (Aula 2), orientando a próxima rodada de decisão — sempre com o aluno aprovando.
