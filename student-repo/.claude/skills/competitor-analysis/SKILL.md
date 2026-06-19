---
name: competitor-analysis
description: "Analise estruturada de concorrentes com Claude + Apify. Monitora anuncios ativos (Meta Ads Library, Google Ads Transparency), mapeia posicionamento/preco/promessa/angulo dos 3-5 concorrentes principais, identifica brecha competitiva e gera dossie aplicavel direto em copy e media buying. Output: dossie completo + tabela de 4 vetores + recomendacao de brecha. Triggers: 'analisar concorrentes', 'competitor analysis', '/competitor-analysis', 'dossie do concorrente', 'meta ads library'."
user_invocable: true
---

# Competitor Analysis (Analise de Concorrentes)

Esta skill produz **dossie de concorrentes** mapeados em 4 vetores: posicionamento, preco, promessa, angulo. Saida: tabela comparativa + brecha competitiva identificada + briefing pronto para o /swipe-file capturar criativos vencedores.

A regra: voce nao precisa ser o melhor em tudo. Precisa ser **o unico forte em UM vetor** onde todos os outros sao medianos. Esta skill encontra esse vetor.

---

## Quando usar

- Entrada em nicho novo (mapear o terreno antes de lancar)
- Revisao de oferta que perdeu posicao (concorrentes evoluiram)
- Briefing para Media Buyer ou Copy (alimenta ambos)
- Decisao estrategica de preco (ancoragem comparativa)
- Gatilhos: "analisar concorrentes", "concorrente", "competitor", "meta ads library"

## Como ativar

`/competitor-analysis [nicho]` — ex.: `/competitor-analysis softwares-de-contabilidade-br`.

Se nao vier o nicho, **pergunte qual e o mercado e PARE** ate receber a resposta.

---

## Pre-requisitos

1. **Lista de 3-5 concorrentes** — pode ser entregue pelo usuario OU descoberta via Apify (busca por palavra-chave no Meta Ads Library + Google Ads Transparency)
2. **Material publico de cada concorrente** — site, paginas de planos, posts em redes, depoimentos, anuncios ativos
3. **Apify MCP configurado** (para scrape automatico de anuncios) — opcional, mas acelera
4. **Saida do `/pesquisa-icp`** (recomendado) — para comparar concorrentes ao ICP que voce ja definiu

> Se nao tiver Apify, a skill ainda funciona com coleta manual (o usuario cola o material).

---

## Pipeline (passo a passo)

### Etapa 1 — Descoberta dos concorrentes (se nao listados)

Usar Apify para buscar:

- Meta Ads Library: anuncios ativos por palavra-chave no nicho
- Google Ads Transparency: anuncios ativos por dominio
- Google Search: top 10 organicos no nicho

Output: lista de 3-5 concorrentes com URL, perfil de Instagram, dominio.

### Etapa 2 — Coleta de material publico (por concorrente)

Para cada concorrente, coletar (manual ou via Apify):

- 200-500 palavras do site (home, sobre, planos)
- Estrutura de precos (tabela de planos com valor mensal/anual)
- 10-20 anuncios ativos (Meta Ads Library)
- 10 posts recentes (Instagram, LinkedIn)
- 5 depoimentos de clientes
- Pagina "Sobre" / fundadores

### Etapa 3 — Analise em 4 vetores (por concorrente)

Para cada concorrente, preencher tabela:

| Vetor | O que extrair | Marca como |
|---|---|---|
| **Posicionamento** | Como ele se vende (sua interpretacao em 1 frase). Quem ele NAO serve. | Forte/Medio/Fraco |
| **Preco** | Tabela de planos, ancoragem usada, posicao no mercado (caro/igual/barato), modelo de cobranca | Forte/Medio/Fraco |
| **Promessa (USP)** | Promessa principal em 1 frase. Marcar especifica ou generica. | Forte/Medio/Fraco |
| **Angulo (historia)** | Por que existe. Em quem ressoa (racional/emocional/pragmatico). | Forte/Medio/Fraco |

### Etapa 4 — Mapa comparativo

Tabela cruzada: linhas = concorrentes, colunas = 4 vetores.

Cada celula com nota Forte/Medio/Fraco + 1 frase de justificativa.

### Etapa 5 — Identificacao da brecha

**Brecha = vetor onde TODOS os concorrentes sao fracos ou medianos.**

Sair com recomendacao explicita:
- Qual vetor virar campo de batalha
- Por que e defensavel (brecha de angulo > brecha de preco)
- Como atacar (3 ideias concretas para diferenciar)

### Etapa 6 — Briefing para downstream

Gerar 2 briefings:

1. **Para `/swipe-file`** — quais criativos dos concorrentes capturar (os 5 winners de cada um, com link/screenshot)
2. **Para `/offerbook`** — input do bloco "Posicionamento" e "USP" com a brecha identificada

---

## Prompts internos (Claude)

### Prompt 1 — Posicionamento e promessa

```
Voce e analista competitivo senior. Vou colar material publico de um concorrente. Sua tarefa:

1. Posicionamento: em 1 frase, como ele se vende. Nao use as palavras dele. Use sua interpretacao ("ele se posiciona como ___ para ___").
2. Promessa (USP): qual e a promessa principal em 1 frase. Marcar especifica ou generica e explicar por que.
3. Para quem ele NAO serve: 2 perfis que ele explicitamente ou implicitamente exclui.

Material coletado:
[colar 200-500 palavras do site]
```

### Prompt 2 — Preco e ancoragem

```
Vou colar a estrutura de precos do mesmo concorrente. Sua tarefa:

1. Tabela: Plano, Valor mensal, Valor anual, O que inclui em 1 linha
2. Estrategia de ancoragem: como ele guia o cliente a escolher o plano caro (riscado, comparativo, escassez, bonus). Marcar tecnica usada.
3. Diferencial competitivo no preco: ele e mais caro/igual/mais barato que a media? Como justifica?
4. Modelo de cobranca: mensalidade, anual, one-shot, performance. Por que.

Material:
[colar pagina de planos, politica de upgrade, cancelamento]
```

### Prompt 3 — Angulo, brecha e mapa final

```
1. Angulo (historia): qual historia o concorrente conta sobre por que existe. Em 2 frases.
2. Ressonancia emocional: a historia ressoa em qual perfil decisorio (racional, emocional, pragmatico)? Por que?
3. Mapa final dos 4 vetores: para cada vetor (posicionamento, preco, promessa, angulo), marcar Forte/Medio/Fraco com justificativa em 1 frase.
4. Sugestao de brecha: qual vetor e o mais fraco e poderia virar seu campo de batalha?

Material:
[colar 10 posts, 5 depoimentos, pagina Sobre]
```

---

## Output

A skill gera:

1. `competidores-{nicho}.md` — dossie completo com 1 secao por concorrente + tabela comparativa + brecha
2. `competidores-{nicho}.html` — versao apresentavel
3. `briefing-swipe-file.md` — lista de criativos winners para a skill `/swipe-file` capturar
4. `briefing-offerbook.md` — input pronto para a skill `/offerbook` no bloco posicionamento

---

## Regras

- **Cite material publico apenas.** Nao acesse area logada, nao use dados privados.
- **Brecha de angulo > brecha de preco.** Preco e copiavel em 30 dias. Historia nao se copia.
- **Marcar `[NAO HA DADO PUBLICO]`** quando algum vetor nao for analisavel.
- **Minimo 3 concorrentes.** Menos que isso nao da padrao.
- **Maximo 5 concorrentes.** Mais que isso vira ruido.

---

## Checklist de qualidade

**Fundacao**
- [ ] Nicho especificado pelo usuario
- [ ] 3-5 concorrentes mapeados
- [ ] Material publico coletado de cada (site + precos + posts + depoimentos)

**Analise**
- [ ] 4 vetores preenchidos para cada concorrente
- [ ] Justificativa em 1 frase por celula
- [ ] Nada inventado (so material publico citavel)

**Brecha**
- [ ] Brecha identificada e defensavel
- [ ] 3 ideias concretas de como atacar
- [ ] Brecha alinhada ao ICP (`/pesquisa-icp` se rodada antes)

**Downstream**
- [ ] Briefing para `/swipe-file` gerado
- [ ] Briefing para `/offerbook` gerado

---

## Anti-patterns (NUNCA fazer)

- Inventar dado de concorrente
- Generalizar de 1 visita ao site para "o concorrente faz X"
- Marcar brecha em preco como prioridade (e o vetor mais fragil)
- Esquecer de mapear "para quem ele NAO serve" (e onde voce tem chance)
- Pular para "diferenca de produto" sem analisar os 4 vetores primeiro

---

## Conexao com outras skills

```
/pesquisa-icp (opcional, mas recomendado primeiro)
    ↓
/competitor-analysis (esta skill)
    ↓ briefing-swipe-file.md
/swipe-file (captura criativos winners)
    ↓ briefing-offerbook.md
/offerbook (consolida tudo + 3 mentes)
```
