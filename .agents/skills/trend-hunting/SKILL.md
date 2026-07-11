---
name: trend-hunting
description: "Identifica tendências emergentes no nicho usando Claude + Twitter/X + Apify. Mapeia formatos virais (Reels, carousels, threads), detecta timing antes da saturação, gera 2+ variações de hook e identifica vencedor por engajamento. Output: relatório de tendências acionável + variações prontas para teste. Triggers: 'tendencias', 'trends', 'trend hunting', '/trend-hunting', 'o que ta bombando', 'formato viral'."
user_invocable: true
---

# Trend Hunting (Caça de Tendências)

## Posição na Aula 01

Esta é a **Skill 3 de 5** da Aula 01 do Cohort de Marketing.

**Sequência:** `/avatar-funil` -> `/espiao-do-concorrente` -> `/trend-hunting` (você está aqui) -> `/swipe-file` -> `/offerbook`.

### Gate de pré-requisito (executar ANTES de qualquer coisa)

Antes de começar, **verifique** se o avatar já foi rodado — ele pode ter sido salvo na raiz OU na pasta de pesquisa/projeto (qualquer um dos caminhos vale):

```
ls relatorio-avatar.md pesquisa-avatar-*/relatorio-avatar.md projetos/*/avatar.md 2>/dev/null
```

**Se NÃO existir**, exiba este aviso e pergunte:

> Detectei que você ainda não rodou `/avatar-funil` neste projeto. Sem avatar, as variações de hook saem genéricas (sem âncora no que o seu cliente realmente diz).
>
> Recomendo voltar e rodar `/avatar-funil` primeiro. Quer continuar mesmo assim? (s/n)

Se o usuário responder `n`, encerre dizendo: *"Beleza. Rode `/avatar-funil [nicho]` e volte aqui depois."*

Se responder `s`, prossiga mas marque no relatório que as variações não foram ancoradas em avatar real.

**Se EXISTIR**, leia rapidamente o avatar (vocabulário do cliente, dor principal) e use essa linguagem nas variações de hook. Mencione: *"Encontrei seu avatar. Vou ancorar as variações na linguagem dele."*

### Gate — ler o Perfil do Projeto (antes de caçar tendência)

> **Leia o Perfil do Projeto** (topo do `projetos/{slug}/offerbook.md`) seguindo `.claude/skills/_shared/perfil.md`. O Perfil (Tipo de oferta, Voz, Nicho) muda o que conta como "tendência" e como as variações são enquadradas. **Perfil ainda não existe (Aula 1 em ordem — o Perfil só nasce no `/offerbook`, skill 5)?** INFIRA o ramo pelo nicho/negócio que o aluno informou e CONFIRME em 1 linha antes de coletar (ex.: *"estúdio de pilates → trato como negócio local, certo?"*) — nunca caia no ramo genérico de infoproduto em silêncio. Se mesmo assim não der pra inferir, use o padrão e siga — nunca trave.
>
> **Guard (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **PROIBIDO** enquadrar as variações como especialista/curso/mentoria ou usar depoimento-de-aluno. Use voz do cliente / prova de uso / case. O default "curso de especialista" só vale quando Tipo = especialista.

---

Esta skill detecta **tendências emergentes** no seu nicho ANTES de virarem saturadas. Mapeia formatos virais (Reels, carousels, threads, vsl curta), identifica timing de entrada e gera variações prontas para testar.

A regra: você não quer pegar tendência no pico (todo mundo já fez). Quer pegar **na rampa de subida** (timing de 2-3 semanas antes da saturação).

---

## Quando usar

- Briefing semanal de criativos (alimenta /swipe-file e media buyer)
- Lançamento de oferta nova (escolher formato com tração)
- Diagnóstico de campanha que perdeu performance (saturação de formato)
- Gatilhos: "tendências", "o que tá bombando", "formato viral", "trend hunting"

## Como ativar

`/trend-hunting [nicho]` — ex.: `/trend-hunting marketing-digital-br`.

Se não vier o nicho, **pergunte e PARE** até receber.

### Opção: pesquisar a partir de concorrentes

Além do nicho, o usuário pode (opcionalmente) colar **links de concorrentes** para a skill puxar as tendências direto dos perfis deles. Logo após receber o nicho, pergunte:

> Quer que eu também cace tendências a partir de concorrentes específicos? Cole os links dos perfis (Instagram, TikTok, YouTube ou LinkedIn) — um por linha. Eu uso o Apify para raspar os posts recentes deles e extrair os formatos que estão funcionando.
>
> Se não tiver concorrentes em mente, é só dizer "não" que eu sigo só pelo nicho.

- Se o usuário colar links, **valide cada um** (perfil público, plataforma suportada) e trate cada perfil como uma fonte extra na Etapa 2 (ver "Concorrentes" na Etapa 2). Use o Apify para raspar os últimos 14 dias de cada perfil.
- Se o usuário disser "não", siga só pelo nicho normalmente.
- **Distinção importante:** aqui você coleta o **orgânico** dos concorrentes (Reels, TikToks, posts) para mapear formato/tendência. Quem analisa os **anúncios pagos** do concorrente é a `/espiao-do-concorrente`. Não misture os dois (ver Anti-patterns).

---

## Pré-requisitos

1. **Apify configurado** (OBRIGATÓRIO) — a **chave** no `.env` (`APIFY_API_TOKEN` ou `APIFY_API_KEY`). **NÃO é MCP:** a coleta roda por **API REST direta** (chamada à `api.apify.com`, com o SEU token), do mesmo jeito que a `/conteudo-funil` faz pelo `scripts/apify_scraper.py`. Sem a chave a skill não coleta. Veja a seção **Setup do Apify** logo abaixo. É o que dá o scrape de Reels (Instagram), TikTok e perfis de concorrentes.
2. **Nicho ou palavras-chave** definidas (5-10 termos)
3. **Acesso a Twitter/X** (busca pública, sem login obrigatório)
4. **Output do `/avatar-funil`** (recomendado) — para filtrar tendências relevantes ao perfil do cliente

---

## Setup do Apify (OBRIGATÓRIO — fazer 1 vez)

Esta skill **depende do Apify** para raspar Instagram Reels, TikTok e perfis de concorrentes. A coleta é por **API REST direta** (chamada à `api.apify.com` com o SEU token) — **NÃO é MCP**: não precisa instalar servidor, nem `claude mcp add`, nem reiniciar nada. O único pré-requisito é a **chave** no `.env`. É o mesmo padrão da `/conteudo-funil`, que chama a API pelo `scripts/apify_scraper.py` (só stdlib do Python). Faça esse setup uma única vez; depois é só usar.

### É grátis?

Sim, dá pra começar de graça. O plano **Free** da Apify não pede cartão e entrega **US$ 5 de crédito por mês**. Cada scrape consome um pouco desse crédito (centavos por post/perfil). Para uso leve de trend hunting (alguns perfis e dezenas de Reels por mês), os **US$ 5 grátis costumam bastar**. Se você for raspar muito toda semana, o crédito acaba e o próximo plano é o Starter (US$ 29/mês). Comece no Free e só suba se precisar.

### Passo 1 — Criar conta e pegar o token

1. Acesse https://console.apify.com/sign-up e crie a conta gratuita (sem cartão).
2. No console, vá em **Settings -> Integrations -> API tokens**.
3. Copie o **Personal API token**.

### Passo 2 — Colocar a chave no `.env`

Na raiz do projeto, abra (ou crie a partir do `.env.example`) o arquivo `.env` e cole o token na variável `APIFY_API_TOKEN`:

```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Se ainda não tem `.env`, rode na raiz: `cp .env.example .env` e depois edite a linha do `APIFY_API_TOKEN`. O `.env` já está no `.gitignore` — sua chave não vai pro GitHub. (Se você configurou pela `/comecar`, a chave pode estar salva como `APIFY_API_KEY` — tudo bem, os dois nomes funcionam.)

### Passo 3 — Verificar antes de rodar a skill

No início de cada execução, **cheque se a chave está no `.env`** (aceite qualquer um dos dois nomes):

```
grep -qE "APIFY_API_(TOKEN|KEY)=apify" .env 2>/dev/null && echo "chave ok" || echo "chave faltando"
```

- Se a **chave** estiver faltando, **PARE** e ajude a configurar (não caia para coleta manual — o Apify é pré-requisito desta skill):

  > Esta skill precisa da sua chave do Apify para raspar Reels, TikTok e perfis de concorrentes, e ela ainda não está no `.env`. Siga o **Setup do Apify** na SKILL: criar conta (US$ 5 grátis, sem cartão) → pegar o token no **console.apify.com > Settings > Integrations > API tokens** → colar no `.env` como `APIFY_API_TOKEN=apify_api_...`. Quando terminar, rode `/trend-hunting [nicho]` de novo.

- Se a chave estiver lá, siga o pipeline normalmente (a coleta usa a API REST com o script `apify_scraper.py`).

> **Apify é central, nunca opcional — fallback só em cota estourada** (segue `.claude/skills/_shared/nunca-travar.md`). Se faltar a chave, o certo é **ajudar a configurar** (os passos acima), não pular. Só existe um caso de fallback: quando o Apify **realmente falha por cota mensal estourada** (os US$ 5 grátis do mês acabaram). Aí, avise em texto: *"A cota do Apify estourou este mês. Sigo pelas fontes que dão pra buscar manualmente (Twitter/X público, busca por hashtag no navegador) e retomo o scrape completo quando a cota renovar."* Nunca "pular Apify" por padrão nem falhar em silêncio. Glossário: *cota* (limite de crédito do mês); *fallback* (plano B).

---

## Pipeline (passo a passo)

### Gate — o que é "tendência" muda por ramo (ler o Perfil primeiro)

> Nem todo negócio caça Reel viral. Ajuste as fontes e o conceito de tendência ao **Tipo de oferta** do Perfil:
>
> - **Serviço / B2B** → tendência **não** é Reel/TikTok viral. São **pautas de LinkedIn**, **relatórios de setor**, **eventos/feiras**, mudanças regulatórias e temas que a decisão do comprador acompanha. Priorize a fonte D (LinkedIn) e busca de relatórios/notícias do setor; formatos = carousel PDF, post longo, artigo, palestra. Variações enquadram autoridade/ROI, não hook de dopamina.
> - **Físico / varejo-local** → tendência é **sazonal e regional**: datas locais (feriado da cidade, festa regional), sazonalidade do produto (verão, volta às aulas, Dia das Mães), clima e evento local. Menos "formato viral global", mais gancho de calendário e proximidade. Fontes = Google/redes locais + calendário sazonal, não só hashtags nacionais.
> - **Especialista / saas-app** → segue o pipeline padrão abaixo (Reels, TikTok, threads, carrosséis).
> - **Nicho REGULADO (saúde / jurídico / psico / financeiro)** → as variações saem **só em linguagem de possibilidade**: sem promessa de cura, sem prazo de resultado, sem antes/depois. A tendência de formato pode ser modelada, mas o hook e a copy da variação respeitam as regras do conselho (mesmo que o formato viral original prometa o proibido — não replique a promessa, só a estrutura).
>
> Glossário: *sazonal* (que varia com a época do ano). Na dúvida sobre o Tipo, pergunte antes de escolher as fontes.

### Etapa 1 — Definir palavras-chave de busca

A partir do nicho, gerar 5-10 termos de busca em 3 categorias:

- **Termos diretos** (nome do nicho: "contabilidade", "escritório contábil")
- **Termos de dor** (problemas: "perda de cliente", "atendimento lento")
- **Termos de solução** (o que oferece: "automatizar contabilidade", "IA contábil")

### Etapa 2 — Scan nas fontes

**A. Twitter/X** (busca pública)
- Buscar cada termo
- Filtrar posts dos últimos 14 dias com 100+ likes
- Capturar: texto do post, formato (thread, single, vídeo), engajamento

**B. Instagram Reels** (via Apify — obrigatório)
- Buscar hashtags do nicho com o scraper de Instagram
- Capturar Reels com 50k+ views dos últimos 14 dias
- Estrutura: hook (primeiros 3s), formato, narrativa, CTA

**C. TikTok** (via Apify — obrigatório)
- Mesmo processo dos Reels, com o scraper de TikTok
- Atentar a formatos específicos de TikTok (POV, story, tutorial)

**D. LinkedIn** (se nicho B2B)
- Posts com 500+ reações últimos 14 dias
- Formato: carousel PDF, post longo, vídeo, enquete

**E. Concorrentes** (só se o usuário colou links na ativação — via Apify)
- Para cada perfil que o usuário colou, use o scraper Apify da plataforma certa (Instagram, TikTok, YouTube ou LinkedIn) para puxar os posts dos últimos 14 dias.
- Capture os mesmos campos das outras fontes (hook, formato, narrativa, CTA, engajamento) e **marque a origem como `[CONCORRENTE: @perfil]`** em cada exemplo.
- Foque no **orgânico** do concorrente (o que ele posta). Anúncio pago é com a `/espiao-do-concorrente`.

### Etapa 3 — Identificação de padrões

Agrupar achados em **padrões recorrentes**:

- **Padrão de hook** (3 primeiras linhas / 3 primeiros segundos)
- **Padrão de estrutura** (problema-agitação-solução, antes-depois, lista, narrativa, etc.)
- **Padrão de formato** (single image, carousel, vídeo curto, vídeo longo, thread)
- **Padrão de CTA** (link na bio, DM, comentar palavra, etc.)

Para cada padrão, registrar:
- 5 exemplos verbatim (com link)
- Engajamento médio
- Timing (quando começou a aparecer)

### Etapa 4 — Classificação por timing

Cada padrão em 1 das 4 fases:

- **Emergente** (1-3 semanas, baixo volume mas crescendo) — **timing ideal**
- **Em alta** (3-6 semanas, volume crescente) — ainda OK, mais saturado
- **Pico** (6-10 semanas, alto volume) — risco de saturação
- **Declínio** (10+ semanas, queda de engajamento) — evitar

Output: 3-5 padrões na fase **emergente** + 2-3 na fase **em alta** para experimentar.

### Etapa 5 — Geração de variações (2+ por padrão)

Para cada padrão escolhido, gerar 2-4 variações adaptadas ao seu nicho:

- **Variação A** (réplica do padrão com seu produto)
- **Variação B** (adaptação com ângulo do seu ICP)
- **Variação C** (opcional, híbrido com outro padrão em alta)

Cada variação com:
- Hook (texto exato)
- Estrutura (bullet do conteúdo)
- Formato (imagem, vídeo, carousel, etc.)
- CTA

### Etapa 6 — Briefing para teste

Saída final: briefing acionável para o Media Buyer ou Designer testar as variações em 2 plataformas (Meta + Google ou Meta + TikTok), com:

- Orçamento de teste sugerido (R$ 200-500 por variação por 3 dias)
- Métrica vencedora (CTR + CPL + watch time)
- Critério de vencedor (qual variação escala, qual mata)

---

## Output

A skill gera 7 arquivos no total (MD + HTML + PDF dos 2 entregáveis visuais, mais o briefing):

**Trends (3 formatos):**
1. `trends-{nicho}-{data}.md` — relatório completo com as fontes, padrões identificados, classificação por timing
2. `trends-{nicho}-{data}.html` — versão visual
3. `trends-{nicho}-{data}.pdf` — versão para imprimir/compartilhar

**Variações (3 formatos):**
4. `variacoes-teste-{data}.md` — lista de variações prontas para teste, com hook + estrutura + CTA
5. `variacoes-teste-{data}.html` — versão visual em cards
6. `variacoes-teste-{data}.pdf` — versão para imprimir/compartilhar

**Briefing:**
7. `briefing-media-buyer.md` — briefing acionável com orçamento e métricas (só MD, é arquivo de trabalho)

### Como gerar os 7 arquivos

**Passo 1 — Aplicar gate de brand-choice** (segue `_shared/brand-choice.md`):

```
ls .cohort-brand-choice 2>/dev/null
```

- Se existir, ler e usar a escolha salva (neutro ou design-md)
- Se não existir, perguntar (3 opções) e salvar

**Passo 2 — Gerar os 3 MD** (trends, variações, briefing) conforme as etapas anteriores

**Passo 3 — Gerar os 2 HTML** copiando os templates:

Para `trends-{nicho}-{data}.html`, copiar `templates/trends.html` e substituir:
- `{{TITULO}}` — nicho (ex.: "Marketing digital para advogados")
- `{{SUBTITULO}}` — fontes + amostra (ex.: "Twitter/X + Reels + TikTok + LinkedIn · 47 padrões")
- `{{DATA}}` — data de hoje
- `{{MARCA}}` — vazio se neutro, ou nome do `DESIGN.md`
- `{{CONTEUDO}}` — seções em HTML com `<h2>`, `<h3>`, `<table>`, `<blockquote class="padrao">`. Use os badges `<span class="timing emergente">`, `<span class="timing em-alta">` e `<span class="timing saturado">` ao lado dos padrões.

Para `variacoes-teste-{data}.html`, copiar `templates/variacoes.html` e substituir:
- `{{TITULO}}` — nicho
- `{{SUBTITULO}}` — quantidade de variações (ex.: "12 variações prontas para teste A/B")
- `{{CONTEUDO}}` — cada variação envolvida em `<div class="variacao">`:

```html
<div class="variacao">
  <span class="numero">Variação 1 — Formato: Reels POV</span>
  <p class="hook">"Você nunca mais vai escrever uma petição do zero depois de ver isso"</p>
  <ul class="estrutura">
    <li>0-3s: gancho visual (cliente bravo na delegacia)</li>
    <li>3-10s: revelação (modelo de IA pronto)</li>
    <li>10-20s: demo rápida</li>
    <li>20-25s: CTA</li>
  </ul>
  <p class="meta"><strong>Tom:</strong> direto · <strong>Persona:</strong> advogado autônomo</p>
  <span class="cta">CTA: link na bio</span>
</div>
```

Se brand-choice = `design-md`, ler `DESIGN.md` e substituir os tokens em `:root` (cores e fontes) pelos do aluno.

**Passo 4 — Gerar os 2 PDF** rodando o script sobre cada HTML:

```
bash scripts/gerar_pdf.sh trends-{nicho}-{data}.html
bash scripts/gerar_pdf.sh variacoes-teste-{data}.html
```

**Passo 5 — Abrir HTML automaticamente** (só os 2 visuais, briefing-media-buyer fica em MD):

```
open trends-{nicho}-{data}.html
open variacoes-teste-{data}.html
```

(Windows: `start`. Linux: `xdg-open`.)

Diga ao usuário: *"Abri o trend report e as variações no seu navegador."*

---

## Prompts internos (Claude)

### Prompt 1 — Análise de Twitter/X

```
Você é analista de tendências de mídia social. Vou colar 30 posts de Twitter/X do nicho [nicho] dos últimos 14 dias com 100+ likes.

Identifique:
1. Os 5 padrões de hook mais recorrentes (texto literal do hook)
2. Para cada padrão: 3 exemplos verbatim com link
3. Engajamento médio (likes/replies/retweets)
4. Timing estimado (quando esse padrão apareceu na timeline)
5. Classificação: emergente / em alta / pico / declínio

Posts:
[colar 30 posts com link]
```

### Prompt 2 — Geração de variações

```
Tenho um padrão de tendência emergente: [colar padrão + 3 exemplos]

Meu produto é: [briefing]
Meu ICP é: [colar 1 parágrafo do /avatar-funil]

Gere 3 variações adaptadas:
- Variação A: réplica fiel do padrão com meu produto
- Variação B: adaptação com ângulo do meu ICP
- Variação C: híbrido (combina este padrão com outro complementar)

Para cada variação:
- Hook (texto exato, primeiras 3 linhas ou 3 segundos)
- Estrutura completa (bullet do conteúdo)
- Formato sugerido
- CTA

E recomende qual testar primeiro e por quê.
```

---

## Regras

- **Sempre cite link da fonte.** Sem link, vira invenção.
- **Foque em conteúdo orgânico**, não em ads pagos (esses são analisados pelo `/espiao-do-concorrente`).
- **Janela de tempo: 14 dias.** Mais que isso, já é tendência velha.
- **Engajamento mínimo** para considerar: 100 likes (Twitter), 50k views (Reels/TikTok), 500 reações (LinkedIn).
- **Saída do timing classification** é o que importa. Padrão em "pico" entra como aviso, não como recomendação.

---

## Checklist de qualidade

**Fundação**
- [ ] Apify configurado (chave `APIFY_API_TOKEN` ou `APIFY_API_KEY` no `.env`) — pré-requisito bloqueante
- [ ] Nicho e palavras-chave definidos (5-10 termos)
- [ ] Fontes scaneadas (Twitter/X + Reels + TikTok; LinkedIn se B2B; concorrentes se houver links)
- [ ] Janela de 14 dias respeitada

**Padrões**
- [ ] 5-10 padrões identificados com 3+ exemplos verbatim cada
- [ ] Engajamento médio documentado
- [ ] Timing classificado (emergente/em alta/pico/declínio)

**Variações**
- [ ] 2-4 variações geradas para cada padrão escolhido
- [ ] Hook, estrutura, formato, CTA preenchidos
- [ ] Adaptadas ao ICP (se ICP disponível)
- [ ] Texto pronto pra gravação: **sem emoji** por padrão, **sem gíria escrita** ("rs", "kkk"), e releitura antifrase-quebrada — sem palavra duplicada nem frase truncada (ex.: "antes da colega escolher antes"). As variações vão direto pro especialista gravar, então cada hook tem que ler limpo em voz alta.

**Briefing**
- [ ] Orçamento de teste sugerido
- [ ] Métrica vencedora definida
- [ ] Critério de vencedor explícito

---

## Anti-patterns (NUNCA fazer)

- Recomendar tendência em "pico" como prioridade (vai dar fadiga rápido)
- Citar exemplo sem link de origem
- Generalizar de 5 posts para "a tendência toda"
- Misturar conteúdo orgânico com ads (usar /espiao-do-concorrente para ads)
- Pular Etapa 5 (variações) e mandar só o relatório sem acionável

---

## Conexão com outras skills

```
/avatar-funil (pré-requisito recomendado)
    ↓
/trend-hunting (esta skill)
    ↓ trends-{nicho}-{data}.md + variacoes-teste-{data}.md + briefing-media-buyer.md
/swipe-file (organiza criativos winners após teste)
    ↓
/offerbook
```

## Anúncio de fechamento (próxima skill)

Após gerar os 7 arquivos, **sempre** diga ao usuário em texto separado:

> Skill 3/5 entregue. Você tem agora 7 arquivos:
> - trends-{nicho}-{data}.md / .html (abri pra você) / .pdf
> - variacoes-teste-{data}.md / .html (abri pra você) / .pdf
> - briefing-media-buyer.md
>
> **Próxima skill da Aula 01:** `/swipe-file capturar`
>
> Swipe file vai organizar os criativos vencedores do `/espiao` e do `/trend-hunting` numa biblioteca pesquisável. Ela alimenta Copy e Media Buyer.

Não pule esse anúncio — é o que orienta o aluno a seguir o trilho da Aula 01.
