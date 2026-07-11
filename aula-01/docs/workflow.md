# Workflow da Aula 01 — Pesquisa, Concorrentes e Ofertas com Claude Code

Mapa mental da Aula 01 traduzido em workflow executavel. As 5 skills deste repo orquestradas em sequencia.

## A grande imagem

```
VOCE
 |
 v
 Squad Marketing (orquestrado por voce, o AI Head de Marketing)
 |
 +-- AULA 01: Research Analyst   <- voce esta aqui
 |    |
 |    +-- /avatar-funil           (Pesquisa Lendaria)
 |    +-- /espiao-do-concorrente    (Apify + Claude)
 |    +-- /trend-hunting          (Claude + Twitter/X)
 |    +-- /swipe-file             (organiza criativos)
 |    +-- /offerbook              (squad 3 mentes -> Jobs + Musk + Hormozi)
 |
 +-- AULA 02: Arquiteto de Funil   (proxima)
 +-- AULA 03: Tragefo Pago         (Media Buyer)
 +-- AULA 04: Analise de Dados     (Painel de receita)
```

## Output da Aula 01 (o que voce sai entregando)

Um pacote de 5 documentos prontos:

1. **ICP completo** (formato A-G + Modulo 10 validado) — `icp-{negocio}.md` + `.html` + `-resumo.md`
2. **Dossie de concorrentes** (4 vetores + brecha apontada) — `competidores-{nicho}.md`
3. **Relatorio de tendencias** (3-5 padroes emergentes + variacoes) — `trends-{nicho}-{data}.md`
4. **Swipe file organizado** (10-30 criativos winners categorizados) — pasta `swipe-file/`
5. **Offerbook completo** (7 blocos preenchidos com voz da marca) — `offerbook-{produto}.md`

Esse pacote vira input direto da **Aula 02 (Arquiteto de Funil)**.

## Ordem de execucao (4h ao vivo)

### Bloco 1 (50 min) — ICP

1. Abrir Claude Code no projeto do aluno
2. `/avatar-funil [seu nicho]` -> a skill faz 10 modulos de perguntas
3. Aluno responde com dados reais (formularios, entrevistas, reviews)
4. Output: 3 arquivos ICP (md, html, resumo)
5. Validar com checklist do Modulo 10

### Bloco 2 (50 min) — Concorrentes + Tendencias (paralelo)

1. `/espiao-do-concorrente [seu nicho]` -> coleta 3-5 concorrentes, mapeia 4 vetores
2. Em paralelo (segunda aba/tab): `/trend-hunting [seu nicho]` -> 4 fontes, padroes emergentes
3. Output: dossie + relatorio de tendencias + briefings para swipe-file e offerbook

### Bloco 3 (50 min) — Swipe File

1. `/swipe-file capturar` -> usa briefings do bloco 2 para organizar criativos
2. Configurar estrutura (tipo/formato/padrao/nicho)
3. Capturar 10-15 winners
4. Gerar briefing para Copy (proxima aula)

### Bloco 4 (50 min) — Offerbook (squad 3 mentes)

1. `/offerbook [nome do produto]` -> a skill puxa ICP + dossie + swipe file
2. Squad 3 mentes (Steve Jobs + Elon Musk + Alex Hormozi via advisory-board) consolidado em 7 blocos
3. Output: offerbook completo pronto para alimentar Funil (Aula 02)

## Conexao entre as skills

```
/avatar-funil
    \
     v output: icp-{negocio}.md
/espiao-do-concorrente  -- briefing-offerbook.md ---->  /offerbook
    \                                                    ^
     v output: briefing-swipe-file.md                    |
/trend-hunting -- variacoes-teste.md -->                |
    \                                                    |
     v                                                   |
/swipe-file -- briefing para Copy --------------------> Aula 02
```

## Conselheiros (advisory-board AIOX)

A skill `/offerbook` usa 3 mentes do advisory-board do AIOX como "conselheiros":

- **Steve Jobs** — visao, produto, storytelling
- **Elon Musk** — inovacao, execucao, pensamento exponencial
- **Alex Hormozi** — lucro, oferta, alto ticket

Cada um responde a uma pergunta especifica do offerbook. A consolidacao das 3 mentes vira o output final.

## Regras do Research Analyst

Do mapa mental original:

**O que faz:**
- Pesquisa de ICP estruturada (formato A-G + 10 modulos)
- Monitora concorrentes (4 vetores)
- Identifica tendencias antes da saturacao
- Organiza criativos winners
- Consolida tudo em offerbook

**O que NAO faz:**
- Cria conteudo (e da Aula 02 - Arquiteto de Funil)
- Roda campanha (e da Aula 03 - Media Buyer)
- Copia criativo dos concorrentes literalmente

## Ferramentas necessarias

- **Claude Code** com as 5 skills instaladas (este repo)
- **Apify via API REST** (central para coletas; chave `APIFY_API_TOKEN` no `.env`, sem MCP)
- **Twitter/X** acesso (busca publica)
- **Figma** ou Notion (organizar swipe file visualmente)
- **Editor de markdown** (preencher templates das skills ou abrir o offerbook .docx)
