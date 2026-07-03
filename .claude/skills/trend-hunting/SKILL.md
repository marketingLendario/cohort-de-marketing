---
name: trend-hunting
description: "Identifica tendencias emergentes no nicho usando Claude + Twitter/X + scraping de redes. Mapeia formatos virais (Reels, carousels, threads), detecta timing antes da saturacao, gera 2+ variacoes de hook e identifica vencedor por engajamento. Output: relatorio de tendencias acionavel + variacoes prontas para teste. Triggers: 'tendencias', 'trends', 'trend hunting', '/trend-hunting', 'o que ta bombando', 'formato viral'."
user_invocable: true
---

# Trend Hunting (Caca de Tendencias)

Esta skill detecta **tendencias emergentes** no seu nicho ANTES de virarem saturadas. Mapeia formatos virais (Reels, carousels, threads, vsl curta), identifica timing de entrada e gera variacoes prontas para testar.

A regra: voce nao quer pegar tendencia no pico (todo mundo ja fez). Quer pegar **na rampa de subida** (timing de 2-3 semanas antes da saturacao).

---

## Quando usar

- Briefing semanal de criativos (alimenta /swipe-file e media buyer)
- Lancamento de oferta nova (escolher formato com tracao)
- Diagnostico de campanha que perdeu performance (saturacao de formato)
- Gatilhos: "tendencias", "o que ta bombando", "formato viral", "trend hunting"

## Como ativar

`/trend-hunting [nicho]` — ex.: `/trend-hunting marketing-digital-br`.

Se nao vier o nicho, **pergunte e PARE** ate receber.

---

## Pre-requisitos

1. **Nicho ou palavras-chave** definidas (5-10 termos)
2. **Acesso a Twitter/X** (busca publica, sem login obrigatorio)
3. **Scraper de redes** (OBRIGATÓRIO para coletar Reels/vídeos de Instagram e TikTok com métricas reais — ferramenta de scraping à sua escolha)
4. **Output do `/pesquisa-de-avatar`** (recomendado) — para filtrar tendencias relevantes ao perfil do cliente

---

## Pipeline (passo a passo)

### Etapa 1 — Definir palavras-chave de busca

Apartir do nicho, gerar 5-10 termos de busca em 3 categorias:

- **Termos diretos** (nome do nicho: "contabilidade", "escritorio contabil")
- **Termos de dor** (problemas: "perda de cliente", "atendimento lento")
- **Termos de solucao** (o que oferece: "automatizar contabilidade", "IA contabil")

### Etapa 2 — Scan em 4 fontes

**A. Twitter/X** (busca publica)
- Buscar cada termo
- Filtrar posts dos ultimos 14 dias com 100+ likes
- Capturar: texto do post, formato (thread, single, video), engajamento

**B. Instagram Reels** (via scraper ou manual)
- Buscar hashtags do nicho
- Capturar Reels com 50k+ views dos ultimos 14 dias
- Estrutura: hook (primeiros 3s), formato, narrativa, CTA

**C. TikTok** (via scraper ou manual)
- Mesmo processo dos Reels
- Atentar a formatos especificos de TikTok (POV, story, tutorial)

**D. LinkedIn** (se nicho B2B)
- Posts com 500+ reacoes ultimos 14 dias
- Formato: carousel PDF, post longo, video, enquete

### Etapa 3 — Identificacao de padroes

Agrupar achados em **padroes recorrentes**:

- **Padrao de hook** (3 primeiras linhas / 3 primeiros segundos)
- **Padrao de estrutura** (problema-agitacao-solucao, antes-depois, lista, narrativa, etc.)
- **Padrao de formato** (single image, carousel, video curto, video longo, thread)
- **Padrao de CTA** (link na bio, DM, comentar palavra, etc.)

Para cada padrao, registrar:
- 5 exemplos verbatim (com link)
- Engajamento medio
- Timing (quando comecou a aparecer)

### Etapa 4 — Classificacao por timing

Cada padrao em 1 das 4 fases:

- **Emergente** (1-3 semanas, baixo volume mas crescendo) — **timing ideal**
- **Em alta** (3-6 semanas, volume crescente) — ainda OK, mais saturado
- **Pico** (6-10 semanas, alto volume) — risco de saturacao
- **Declinio** (10+ semanas, queda de engajamento) — evitar

Output: 3-5 padroes na fase **emergente** + 2-3 na fase **em alta** para experimentar.

### Etapa 5 — Geracao de variacoes (2+ por padrao)

Para cada padrao escolhido, gerar 2-4 variacoes adaptadas ao seu nicho:

- **Variacao A** (replica do padrao com seu produto)
- **Variacao B** (adaptacao com angulo do seu ICP)
- **Variacao C** (opcional, hibrido com outro padrao em alta)

Cada variacao com:
- Hook (texto exato)
- Estrutura (bullet do conteudo)
- Formato (imagem, video, carousel, etc.)
- CTA

### Etapa 6 — Briefing para teste

Saida final: briefing acionavel para o Media Buyer ou Designer testar as variacoes em 2 plataformas (Meta + Google ou Meta + TikTok), com:

- Orcamento de teste sugerido (R$ 200-500 por variacao por 3 dias)
- Metrica vencedora (CTR + CPL + watch time)
- Criterio de vencedor (qual variacao escala, qual mata)

---

## Output

A skill gera:

1. `trends-{nicho}-{data}.md` — relatorio completo com 4 fontes, padroes identificados, classificacao por timing
2. `variacoes-teste-{data}.md` — lista de variacoes prontas para teste, com hook + estrutura + CTA
3. `briefing-media-buyer.md` — briefing acionavel com orcamento e metricas

---

## Prompts internos (Claude)

### Prompt 1 — Analise de Twitter/X

```
Voce e analista de tendencias de midia social. Vou colar 30 posts de Twitter/X do nicho [nicho] dos ultimos 14 dias com 100+ likes.

Identifique:
1. Os 5 padroes de hook mais recorrentes (texto literal do hook)
2. Para cada padrao: 3 exemplos verbatim com link
3. Engajamento medio (likes/replies/retweets)
4. Timing estimado (quando esse padrao apareceu na timeline)
5. Classificacao: emergente / em alta / pico / declinio

Posts:
[colar 30 posts com link]
```

### Prompt 2 — Geracao de variacoes

```
Tenho um padrao de tendencia emergente: [colar padrao + 3 exemplos]

Meu produto e: [briefing]
Meu ICP e: [colar 1 paragrafo do /pesquisa-de-avatar]

Gere 3 variacoes adaptadas:
- Variacao A: replica fiel do padrao com meu produto
- Variacao B: adaptacao com angulo do meu ICP
- Variacao C: hibrido (combina este padrao com outro complementar)

Para cada variacao:
- Hook (texto exato, primeiras 3 linhas ou 3 segundos)
- Estrutura completa (bullet do conteudo)
- Formato sugerido
- CTA

E recomende qual testar primeiro e por que.
```

---

## Regras

- **Sempre cite link da fonte.** Sem link, vira invencao.
- **Foque em conteudo organico**, nao em ads pagos (esses sao analisados pelo `/espiao-do-concorrente`).
- **Janela de tempo: 14 dias.** Mais que isso, ja e tendencia velha.
- **Engajamento minimo** para considerar: 100 likes (Twitter), 50k views (Reels/TikTok), 500 reacoes (LinkedIn).
- **Saida do timing classification** e o que importa. Padrao em "pico" entra como aviso, nao como recomendacao.

---

## Checklist de qualidade

**Fundacao**
- [ ] Nicho e palavras-chave definidos (5-10 termos)
- [ ] 4 fontes scaneadas (ou pelo menos 2 das mais relevantes ao formato)
- [ ] Janela de 14 dias respeitada

**Padroes**
- [ ] 5-10 padroes identificados com 3+ exemplos verbatim cada
- [ ] Engajamento medio documentado
- [ ] Timing classificado (emergente/em alta/pico/declinio)

**Variacoes**
- [ ] 2-4 variacoes geradas para cada padrao escolhido
- [ ] Hook, estrutura, formato, CTA preenchidos
- [ ] Adaptadas ao ICP (se ICP disponivel)

**Briefing**
- [ ] Orcamento de teste sugerido
- [ ] Metrica vencedora definida
- [ ] Criterio de vencedor explicito

---

## Anti-patterns (NUNCA fazer)

- Recomendar tendencia em "pico" como prioridade (vai dar fadiga rapido)
- Citar exemplo sem link de origem
- Generalizar de 5 posts para "a tendencia toda"
- Misturar conteudo organico com ads (usar /espiao-do-concorrente para ads)
- Pular Etapa 5 (variacoes) e mandar so o relatorio sem acionavel

---

## Conexao com outras skills

```
/pesquisa-de-avatar (opcional, melhora as variacoes)
    ↓
/trend-hunting (esta skill)
    ↓ variacoes-teste.md
/swipe-file (organiza criativos winners apos teste)
    ↓
Media Buyer (Aula 03 do cohort)
```

---

## Processo carregando — narrar o andamento (obrigatório em coleta longa)

Coletas e pesquisas desta skill rodam em segundo plano e podem levar vários minutos. O usuário NUNCA pode ficar no escuro sem saber o que está acontecendo. Ao disparar qualquer coleta/pesquisa:

1. **Anuncie o que foi disparado**, em linguagem de progresso: quantos coletores, o que CADA um está fazendo (ex.: "coletor 1/2: conteúdos do @fulano no Instagram · coletor 2/2: top criadores do nicho").
2. **Dê a estimativa honesta de tempo** (ex.: "isso leva de 5 a 10 minutos; te aviso a cada retorno").
3. **Avise a cada retorno parcial**: "coletor 1 de 2 voltou: N itens" — nunca silêncio até o fim.
4. **Estourou a estimativa?** Atualize o usuário proativamente ("o coletor X está demorando por [motivo]; opções: esperar ou seguir com o parcial").
5. **Sempre ofereça o atalho**: seguir com o material parcial já disponível enquanto o resto roda — entregar algo revisável cedo vale mais que esperar o completo.


## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **WebSearch / WebFetch** — pesquisa aberta na internet. Já vem no Claude Code, sem instalação. Se um site bloquear (login wall/Cloudflare), diga QUAL fonte falhou e o que veio de snippet.
- **Apify (API REST, com o SEU token)** — coleta com métrica real (Instagram, TikTok, X etc.). NÃO é MCP: a chamada é direto na `api.apify.com`, via o script `scripts/apify_scraper.py` da skill `/conteudo-funil` (só stdlib do Python). Check: `APIFY_API_TOKEN` no `.env` ou no ambiente (`echo $APIFY_API_TOKEN`). Sem token: conta gratuita em apify.com > Settings > API tokens. Se vier "Monthly usage hard limit exceeded", AVISE na hora (cota mensal da conta) e caia pros fallbacks: YouTube raspado da página pública (views reais), Threads via fetch, trilha manual, e "métrica não obtida" no que faltar. Nunca invente número.
- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check: `ls "/Applications/Google Chrome.app" 2>/dev/null`. **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com `open <arquivo>.html` (macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
