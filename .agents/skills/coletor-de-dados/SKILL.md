---
name: coletor-de-dados
description: Etapa 1 do Squad de Dados (Aula 4) — coleta os dados brutos da Central de Dados. Meta Graph API (séries dia/mês/quarter, campanhas com metadados, funil agregado/por dia/por campanha×dia, heatmap dia×hora, demografia idade/gênero/UF, engajamento orgânico) e Hotmart (caixa real, sem PII), aplicando a config do painel (período, produtos, expurgo de campanhas, labels). Use quando o aluno pedir para atualizar/recoletar os dados do painel, mudar o período ou os produtos da análise, conectar as vendas, ou quando o bundle estiver desatualizado. Sem credenciais cai no Modo Exemplo (fixture) — nunca trava.
---

# Coletor de Dados — Squad de Dados Lendár[IA] (etapa 1)

Você coleta a matéria-prima da Central de Dados: o `bundle.json` (Meta) e o `vendas.json` (caixa). Só leitura — nada aqui altera campanha. Setup de chaves/modo é o Passo 0 do hub **`/analista-de-dados`** (delega ao `/zelador`); se o aluno chegou aqui sem ambiente decidido, resolva o Passo 0 primeiro.

## Contrato (inegociável)

Não-inferir: só entra o que a API entrega pronto; derivados são Calculado e rotulados. **PII nunca** (nem comprador, nem autor de comentário — só textos e agregados). Segredos passam pelo scrubber; nada de token em log ou arquivo de saída.

## Config do painel — grave antes de coletar (pergunte)

Pergunte o **período** (default **90 dias**) e **quais produtos** carregar nas vendas. Grave/atualize `projetos/{slug}/dados-trafego/painel-config.json` (idempotente):

```jsonc
{ "schemaVersion":"1.0.0", "periodo_dias":90, "produtos_incluidos":"todos",
  "assoc_campanha_produtos":{}, "labels":{}, "campanhas_excluidas":[], "fieldMeta":{} }
```

- `campanhas_excluidas`: **expurgo** — campanhas marcadas (acidente, conta compartilhada) saem no coletor e o painel filtra como salvaguarda. A decisão de expurgar é do aluno (o painel revela).
- `labels` / `assoc_campanha_produtos`: rótulos e associações que o aluno edita no próprio painel (✎ Editar → "Salvar config"/"Copiar p/ chat" → você atualiza este arquivo e regenera).
- **Nunca** grave segredos aqui.

## Coleta Meta (bundle)

```bash
node scripts/painel-trafego-data.mjs --account --perfil \
  --config=projetos/{slug}/dados-trafego/painel-config.json \
  --saida=projetos/{slug}/dados-trafego/bundle.json
# --periodo=<dias> sobrescreve pontualmente; --campaign-id=<id> p/ uma campanha;
# --ad-account-id=<id> usa outra conta só nesta execução; sem credenciais → fixture (modo exemplo).
```

O bundle traz: `series.{dia,mes,quarter}` · `campanhas` (até 100 por gasto, com `inicio/criada/fim`) · `comparacao` (deltas) · `funil` + `funil_por_dia` + `funil_por_campanha_dia` (compacto, coletado em janelas de 15 dias para não estourar timeout) · `heatmap` · `demografia` (breakdowns — **sem token de página**) · `perfil` (engajamento orgânico: até 100 posts + textos de comentários; sem escopo de página degrada com o motivo e o painel mostra "em breve").

## Coleta do caixa (Hotmart — se conectada)

```bash
node scripts/hotmart-vendas.mjs --dias=90 --produtos="todos" \
  --saida=projetos/{slug}/dados-trafego/vendas.json
# depois cruze caixa + Meta na MESMA janela:
node scripts/painel-trafego-data.mjs --account --perfil \
  --config=projetos/{slug}/dados-trafego/painel-config.json \
  --vendas=projetos/{slug}/dados-trafego/vendas.json \
  --saida=projetos/{slug}/dados-trafego/bundle.json
```

Sem credencial Hotmart, pule — o painel mostra "vendas não conectadas". A coleta grava só valor/produto/data/status agregados (`por_dia_produto` incluso, sem PII).

**Atribuição (pergunte uma vez):** UTM/SCK por campanha = Real (ideal — o aluno marca o link do anúncio com o id da campanha); nome do produto = Estimado; janela temporal = Estimado (default sem UTM/SCK). O "teto de ROAS" (receita total ÷ gasto Meta) é de TODOS os canais — nunca apresente como ROAS da Meta; sempre mostre a % de vendas rastreadas.

## Validação da coleta (antes de encerrar)

Confira e reporte: `modo` (api/exemplo), nº de dias na série, nº de campanhas (e quantas expurgadas), funil presente, demografia com regiões, perfil disponível (ou o motivo), vendas conectadas. Qualquer seção indisponível é dita **com o motivo** — nunca inventada.

**Próxima etapa:** `/board-de-especialistas` (leitura) → `/painel-de-dados` (render). O hub `/analista-de-dados` faz a sequência inteira.

---

*Squad de Dados Lendár[IA] · Aula 4 · Academia Lendária. Reusa `scripts/lib/meta-graph.mjs` e `scripts/lib/hotmart.mjs`.*
