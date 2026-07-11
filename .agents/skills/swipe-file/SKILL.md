---
name: swipe-file
description: "Organiza criativos winners (anuncios, posts, hooks, CTAs) capturados das skills /espiao-do-concorrente e /trend-hunting em uma biblioteca categorizada e pesquisavel. Alimenta direto Copy e Media Buyer com referencias acionaveis. Funciona como Figma vivo: organizado por tipo, formato, performance e nicho. Output: swipe-file.md + estrutura de pastas + instrucoes Figma. NAO copia criativo dos outros: extrai padrao para inspirar. Triggers: 'swipe file', 'organizar criativos', 'biblioteca de referencias', '/swipe-file', 'salvar criativo winner'."
user_invocable: true
---

# Swipe File (Biblioteca de Criativos Winners)

## Posicao na Aula 01

Esta e a **Skill 4 de 5** da Aula 01 do Cohort de Marketing.

**Sequencia:** `/avatar-funil` -> `/espiao-do-concorrente` -> `/trend-hunting` -> `/swipe-file` (voce esta aqui) -> `/offerbook`.

### Gate de pre-requisito (executar ANTES de qualquer coisa)

Antes de comecar, **verifique no diretorio atual** se existe pelo menos UM dos inputs esperados:

```
ls dossie-*.md 2>/dev/null
ls variacoes-teste-*.md 2>/dev/null
```

**Se NENHUM dos dois existir**, exiba este aviso e pergunte:

> Detectei que voce ainda nao tem inputs pra alimentar o swipe file. Esta skill organiza criativos vencedores que vieram de duas fontes:
> - `dossie-{concorrente}.md` (gerado pelo `/espiao-do-concorrente`)
> - `variacoes-teste-{data}.md` (gerado pelo `/trend-hunting`)
>
> Recomendo voltar e rodar pelo menos um deles antes. Quer continuar mesmo assim com captura manual? (s/n)

Se o usuario responder `n`, encerre dizendo: *"Beleza. Rode `/espiao-do-concorrente [nome]` ou `/trend-hunting [nicho]` e volte aqui depois."*

Se responder `s`, prossiga em modo manual (aluno cola criativos um a um).

**Se algum existir**, leia os arquivos e use os criativos ja identificados como base do swipe file. Mencione: *"Encontrei {N} dossies e {M} arquivos de variacoes. Vou usar como base do swipe file."*

### Gate — ler o Perfil do Projeto (buscar winner do TIPO certo)

Antes de capturar/organizar, **leia o Perfil do Projeto** em `.claude/skills/_shared/perfil.md` (Voz da marca + Tipo de negócio). O swipe file só vale se guardar winners **do mesmo tipo** que o projeto — não presuma que todo criativo vencedor é um VSL de infoproduto.

**Perfil ainda não existe (Aula 1 em ordem — o Perfil só nasce no `/offerbook`, skill 5)?** INFIRA o ramo pelo nicho/negócio que o aluno informou e CONFIRME em 1 linha antes de capturar (ex.: *"estúdio de pilates → trato como negócio local, certo?"*) — nunca caia no ramo genérico de infoproduto em silêncio.

> **Buscar o winner certo pro tipo certo.** Se o Tipo do projeto for **B2B**, priorize case studies, posts de LinkedIn, whitepapers, anúncios de geração de lead — não reels de dancinha. Se for **negócio local**, priorize criativos de raio geográfico, prova de bairro, Google local, WhatsApp. Se for **regulado** (saúde, finanças, jurídico), priorize criativos que convertem SEM promessa proibida (linguagem de conformidade, prova indireta). Catalogar winner de infoproduto pra um projeto B2B/local/regulado enche a biblioteca de referência inútil.

> **Guard de enquadramento (segue `.claude/skills/_shared/perfil.md`).** Se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **proibido** classificar ou adaptar criativos sob o enquadramento de especialista/curso/depoimento-de-aluno. Nesses tipos, o padrão extraído e a adaptação ao ICP falam de produto/empresa/cliente, nunca de "aluno", "mentoria" ou "método do professor". Ao gerar as `## Adaptações sugeridas ao meu ICP`, respeite o enquadramento do Perfil.

---

Esta skill mantem **biblioteca viva** de criativos vencedores (anuncios, posts, hooks, CTAs, paginas) **organizados por padrao**, para alimentar Copy e Media Buyer com referencias acionaveis.

**Atencao etica:** swipe file e **biblioteca de inspiracao**, nao copy-paste. Voce extrai o **padrao** (estrutura do hook, formato, angulo) e adapta ao seu ICP. Copiar literalmente e tiro no pe (pena algoritmica + risco de marca).

---

## Quando usar

- Apos rodar `/espiao-do-concorrente` ou `/trend-hunting` (output deles vira input)
- Briefing semanal de criativos para o time
- Diagnostico de campanha que precisa de novos angulos
- Manutencao continua (toda semana, capturar 5-10 novos winners)
- Gatilhos: "swipe file", "salvar criativo", "biblioteca de referencias", "organizar criativos"

## Como ativar

`/swipe-file [acao]` — onde acao pode ser:

- `/swipe-file capturar` — captura novos winners
- `/swipe-file organizar` — reorganiza biblioteca existente
- `/swipe-file briefing [tipo]` — gera briefing por tipo (ex: hooks-vsl, headlines-meta-ads)
- `/swipe-file revisar` — limpa criativos velhos (>90 dias)

Se nao vier acao, mostrar o menu.

---

## Pre-requisitos

1. **Output do `/espiao-do-concorrente`** OU **`/trend-hunting`** (lista de criativos para capturar)
2. **Figma** (opcional, recomendado para visual) ou Notion/Google Drive
3. **ICP definido** (`/avatar-funil`) — filtro de relevância

> **Nunca travar o aluno (segue `.claude/skills/_shared/nunca-travar.md`).** Explique todo pré-requisito e ferramenta em **linguagem de leigo**, com glossário inline na primeira vez (ex.: "swipe file = biblioteca de referências de anúncios que funcionaram"; "winner = criativo que já provou performance"; "ICP = seu cliente ideal"). A coleta de criativos das skills anteriores usa **Apify** como ferramenta central — nunca a trate como opcional; só caia pra captura manual (aluno cola print + link) se a cota do Apify estourar. Nunca prometa que o HTML "abre sozinho": sempre entregue **o caminho do arquivo + como abrir** (macOS `open`, Windows `start`, Linux `xdg-open`). Se faltar input, ofereça o caminho manual em vez de encerrar.

---

## Estrutura da biblioteca

Organizar em 4 dimensoes cruzadas:

### Por tipo de criativo

- `ads-meta/` — anuncios Meta Ads
- `ads-google/` — anuncios Google (search, display, performance max)
- `ads-tiktok/` — anuncios TikTok
- `posts-organicos/` — posts organicos (Instagram, LinkedIn, X)
- `paginas-venda/` — paginas de venda (LP, VSL, checkout)
- `emails/` — e-mails (cold, nutricao, vendas)
- `hooks/` — apenas hooks (texto isolado, sem o resto)

### Por formato

- `single-image/`
- `carousel/`
- `video-curto/` (< 30s)
- `video-medio/` (30s-2min)
- `video-longo/` (2min+)
- `texto/`

### Por padrao de estrutura

- `problema-agitacao-solucao/`
- `antes-depois/`
- `lista-numerada/`
- `narrativa-pessoal/`
- `dado-chocante/`
- `mito-vs-verdade/`
- `tutorial/`
- `pov/` (point-of-view do TikTok)

### Por nicho/concorrente

- `concorrentes-diretos/`
- `nicho-adjacente/`
- `fora-do-nicho-mas-aplicavel/`

---

## Pipeline (passo a passo)

### Etapa 1 — Captura

Para cada criativo winner:

1. **Screenshot** (anuncio inteiro, ou frame relevante do video)
2. **Link da fonte** (Meta Ads Library URL, post URL, etc.)
3. **Metadata**:
   - Concorrente / autor
   - Data de captura
   - Engajamento (likes, views, comments, dias rodando)
   - Performance estimada (winner / promissor / experimentando)
4. **Extracao do padrao**:
   - Hook (primeira linha ou primeiros 3s)
   - Estrutura (bullet)
   - CTA
   - Promessa principal
   - Emocao alvo (medo, desejo, raiva, esperanca, curiosidade)

### Etapa 2 — Categorizacao

Atribuir ao criativo:
- 1 tipo (ads-meta, posts-organicos, etc.)
- 1 formato (single-image, carousel, video-curto, etc.)
- 1-2 padroes de estrutura (problema-agitacao-solucao, narrativa-pessoal, etc.)
- 1 categoria de nicho (concorrente-direto, nicho-adjacente, fora-do-nicho)

### Etapa 3 — Organizacao (Figma ou Markdown)

**Se usar Figma:**
- 1 frame por criativo
- Frames agrupados em paginas por tipo
- Tags coloridas para padroes de estrutura
- Coluna lateral com metadata
- Estrutura template no link `[link template Figma]`

**Se usar Markdown:**
- 1 arquivo por criativo: `{tipo}/{nicho}/{concorrente}-{data}.md`
- Cada arquivo com screenshot embedded + metadata + padrao extraido
- Index master em `swipe-file-index.md`

### Etapa 4 — Briefing (sob demanda)

Quando o time de Copy ou Media Buyer pedir referencias:

`/swipe-file briefing hooks-vsl`

Retorna:
- 10-20 hooks de VSLs winners do nicho
- Agrupados por emocao alvo
- Com metadata de engajamento
- Com link da fonte
- Com 2-3 sugestoes de adaptacao ao ICP atual

### Etapa 5 — Revisao mensal

- Marcar criativos com >90 dias como "arquivo"
- Promover criativos que continuam performando como "evergreen"
- Identificar padroes que ficaram saturados (mover para `archive/`)

---

## Output

A skill gera (depende da acao):

**Para `/swipe-file capturar`:**
1. **2 arquivos por criativo** em `swipe-file/{tipo}/{nicho}/`:
   - `{slug}.md` — markdown editavel (template em `## Template de captura` abaixo)
   - `{slug}.html` — versao visual (template em `templates/criativo.html`)
2. Atualizacao do `swipe-file-index.md` master
3. Instrucoes Figma (link para adicionar frame manualmente, se usar Figma)

### Como gerar HTML por criativo

Apos gerar cada `{slug}.md`, gerar tambem `{slug}.html` copiando `templates/criativo.html` e substituindo:

- `{{ID}}` — id do criativo (ex.: `sw01`)
- `{{HOOK_CURTO}}` — primeiras palavras do hook (vai no `<title>` da aba)
- `{{TITULO}}` — titulo descritivo (ex.: "Prazer, Fernanda Landeiro — apresentacao pessoal direta")
- `{{BADGE}}` — escolher um:
  - `<span class="badge winner">Winner</span>`
  - `<span class="badge promising">Promissor</span>`
  - `<span class="badge anti">Anti-modelo</span>`
  - `<span class="badge original">Variacao original</span>`
- `{{META}}` — preencher 6 `<div class="meta-item">` com: Concorrente, Tipo, Formato, Captura (data), Engajamento, Dias rodando
- `{{HOOK_VERBATIM}}` — texto LITERAL do hook
- `{{ESTRUTURA}}` — uma `<li>` por passo da estrutura
- `{{CTA}}` — texto exato do CTA do criativo
- `{{PROMESSA}}` — promessa principal em 1 frase
- `{{EMOCAO}}` — medo / desejo / raiva / esperanca / curiosidade / outra
- `{{PADRAO_EXTRAIDO}}` — paragrafo explicando POR QUE funciona e como adaptar
- `{{ADAPTACOES}}` — pelo menos 2 `<li><strong>Adaptacao X:</strong> ...</li>`
- `{{FONTE_URL}}` — link da fonte (Meta Ad Library, post URL, etc)
- `{{MARCA}}` — vazio se brand-choice = `neutro`, ou nome do `DESIGN.md`
- `{{DATA}}` — data de captura

**Importante:** ambos arquivos (`.md` e `.html`) vivem na MESMA pasta (`swipe-file/{tipo}/{nicho}/`). O index master mostra os 2 links lado a lado.

**Para `/swipe-file briefing [tipo]`:**
1. Documento `briefing-{tipo}-{data}.md` com 10-20 referencias organizadas (granular, por tipo)
2. **`briefing-swipe-file.md`** (handoff master) — index unico que consolida TODOS os briefings gerados ate aqui, e e o arquivo que voce passa pro Copy (`/copy-funil`) e pro Media Buyer. Atualizado a cada novo briefing gerado.

Estrutura do `briefing-swipe-file.md`:

```markdown
# Briefing Swipe File — {Nicho}

Atualizado: {data}
Briefings ativos: {n}

## Top 3 padroes vencedores (cross-tipo)
1. [padrao] — usado em {n} criativos, performance media: {x}
2. ...

## Briefings por tipo
- [hooks-vsl](./briefing-hooks-vsl-{data}.md) — 18 referencias
- [headlines-meta-ads](./briefing-headlines-meta-ads-{data}.md) — 12 referencias

## Para Copy
Top 5 hooks adaptaveis ao ICP: ...

## Para Media Buyer
Top 5 angulos validados pelo algoritmo: ...
```

**Para `/swipe-file organizar`:**
1. Relatorio de reorganizacao com estatisticas (total, por categoria, mais antigo, etc.)

**Para `/swipe-file revisar`:**
1. Lista de itens marcados como arquivo, evergreen, ou saturado

### Entrega visual (HTML + PDF dos 2 handoffs principais)

Para `/swipe-file capturar` e `/swipe-file briefing`, alem dos MD ja descritos, gerar tambem HTML e PDF dos 2 handoff masters:

**4 arquivos extras:**
- `swipe-file-index.html` + `.pdf`
- `briefing-swipe-file.html` + `.pdf`

**Como gerar:**

**Passo 1 — Aplicar gate de brand-choice** (segue `_shared/brand-choice.md`):

```
ls .cohort-brand-choice 2>/dev/null
```

Se nao existir, perguntar (3 opcoes: neutro / rodar /design-md / usar DESIGN.md existente) e salvar.

**Passo 2 — Gerar swipe-file-index.html** copiando `templates/swipe-file-index.html` e substituindo TODOS os placeholders. O template e premium, com varios componentes visuais. Voce DEVE preencher cada placeholder com HTML semantico real (nao deixe vazio):

- `{{TITULO}}` — nome do projeto/nicho (ex.: "Pos-Graduacao NeuroTCC")
- `{{SUBTITULO}}` — descricao curta (ex.: "10 criativos catalogados · 3 concorrentes · 3 brechas mapeadas")
- `{{DATA}}` — data (ex.: "26 de junho de 2026")
- `{{MARCA}}` — vazio se neutro, ou nome do `DESIGN.md`
- `{{KPIS}}` — 3 a 5 KPIs no formato:
  ```html
  <div class="kpi"><div class="num">10</div><div class="label">Criativos</div></div>
  <div class="kpi"><div class="num accent">7</div><div class="label">Winners</div></div>
  <div class="kpi"><div class="num">3</div><div class="label">Concorrentes</div></div>
  <div class="kpi"><div class="num">3</div><div class="label">Brechas</div></div>
  ```
- `{{CATEGORIAS}}` — uma `<div class="cat">` por categoria (Hooks, Posts, LPs, Vídeos, etc.):
  ```html
  <div class="cat">
    <div class="cat-nome">Hooks</div>
    <div class="cat-count">5</div>
    <div class="cat-desc">Texto isolado, primeiros 3s</div>
  </div>
  ```
- `{{TOP_PADROES}}` — top 3 padroes mais usados, cada um em `<div class="padrao-card">`:
  ```html
  <div class="padrao-card">
    <span class="rank">#1 Padrão</span>
    <h3>Narrativa pessoal + autoridade academica</h3>
    <p class="descricao">Funciona porque da identificacao rapida + credibilidade tecnica que justifica o preco.</p>
    <div class="stats">
      <div class="stat"><strong>Usado em:</strong> 4 criativos</div>
      <div class="stat"><strong>Performance:</strong> 3 winners</div>
      <div class="stat"><strong>Tipos:</strong> Posts, LP, Video</div>
    </div>
  </div>
  ```
- `{{CRIATIVOS}}` — UM card por criativo catalogado, em `<div class="criativo">`. Use badges:
  - `<span class="badge winner">Winner</span>` para winners
  - `<span class="badge promising">Promissor</span>` para promissores
  - `<span class="badge anti">Anti-modelo</span>` para anti-modelos (estudar o que NAO fazer)
  - `<span class="badge original">Variacao original</span>` para variacoes do aluno
  Exemplo completo:
  ```html
  <div class="criativo">
    <div class="criativo-header">
      <span class="criativo-id">sw01</span>
      <span class="badge winner">Winner</span>
    </div>
    <h4>"Prazer, Fernanda Landeiro"</h4>
    <div class="meta-row">
      <div><strong>Concorrente:</strong> Grupo PBE</div>
      <div><strong>Tipo:</strong> Post organico · texto</div>
      <div><strong>Padrao:</strong> Narrativa + autoridade</div>
    </div>
    <div class="meta-row">
      <div><strong>Engajamento:</strong> 604k seguidores · 6 anos</div>
    </div>
    <div class="arquivo-link">
      <a href="./hooks/sw01-fernanda.md" class="fmt-link md">sw01-fernanda.md</a>
      <a href="./hooks/sw01-fernanda.html" class="fmt-link html">sw01-fernanda.html</a>
    </div>
  </div>
  ```
- `{{ANALISE_CRUZADA}}` — secao opcional com analise extra (padroes evitados, anti-modelos, comentarios). Use `<h2>` + paragrafos + `<div class="callout brecha">` ou `<div class="callout anti">` quando relevante.

**Passo 3 — Gerar briefing-swipe-file.html** copiando `templates/briefing-swipe-file.html` e substituindo TODOS os placeholders:

- `{{TITULO}}` — nicho
- `{{SUBTITULO}}` — frase curta (ex.: "Handoff pronto pra Copy e Media Buyer")
- `{{DATA}}`, `{{MARCA}}`
- `{{RESUMO}}` — 4 items no resumo strip:
  ```html
  <div class="resumo-item"><div class="label">Atualizado</div><div class="val">26/06/2026</div></div>
  <div class="resumo-item"><div class="label">Briefings ativos</div><div class="val">3</div></div>
  <div class="resumo-item"><div class="label">Referencias totais</div><div class="val">47</div></div>
  <div class="resumo-item"><div class="label">Top padrao</div><div class="val">Narrativa pessoal</div></div>
  ```
- `{{TOP_PADROES}}` — top 3 padroes em `<div class="top-padrao">`:
  ```html
  <div class="top-padrao">
    <span class="rank">#1 Padrao</span>
    <h3>Narrativa pessoal + autoridade academica</h3>
    <p class="resumo-padrao">Funciona porque da identificacao rapida + credibilidade.</p>
    <div class="exemplo">"Prazer, Fernanda Landeiro. PhD em Psicologia..."</div>
    <div class="meta-padrao">
      <div><strong>Usado em:</strong> 4 criativos</div>
      <div><strong>Performance:</strong> 3 winners + 1 promissor</div>
    </div>
  </div>
  ```
- `{{BRIEFINGS_TIPO}}` — uma linha por briefing ativo:
  ```html
  <div class="briefing-tipo">
    <div class="nome">hooks-vsl</div>
    <div class="qtd">18 refs</div>
  </div>
  ```
- `{{DESTINATARIOS}}` — 2 cards, um para Copy e um para Media Buyer:
  ```html
  <div class="destinatario copy">
    <span class="quem">Para Copy</span>
    <h3>Top 5 hooks adaptaveis ao ICP</h3>
    <ol>
      <li><strong>Narrativa pessoal:</strong> "Prazer, [seu nome]..." — adapte pro especialista da sua oferta</li>
      <li>... etc</li>
    </ol>
  </div>
  <div class="destinatario media">
    <span class="quem">Para Media Buyer</span>
    <h3>Top 5 angulos validados pelo algoritmo</h3>
    <ol>
      <li><strong>Tensao cultural + dado:</strong> formato Reel, primeiros 3s...</li>
      <li>... etc</li>
    </ol>
  </div>
  ```

Se brand-choice = `design-md`, ler `DESIGN.md` e substituir tokens em `:root`.

**Passo 4 — Gerar PDFs:**

```
bash scripts/gerar_pdf.sh swipe-file-index.html
bash scripts/gerar_pdf.sh briefing-swipe-file.html
```

**Passo 5 — Abrir HTML automaticamente:**

```
open swipe-file-index.html
open briefing-swipe-file.html
```

(Windows: `start`. Linux: `xdg-open`.)

Diga ao usuario: *"Abri o index do swipe-file e o briefing no seu navegador."*

---

## Template de captura (1 arquivo por criativo)

```markdown
---
tipo: ads-meta
formato: video-curto
padroes: [problema-agitacao-solucao, narrativa-pessoal]
nicho: concorrente-direto
concorrente: [nome do concorrente]
data_captura: 2026-06-19
engajamento:
  views: 250k
  reactions: 1.2k
  shares: 340
  dias_rodando: 18
performance: winner
fonte: https://www.facebook.com/ads/library/?id=...
---

# [Titulo descritivo curto]

## Screenshot
![criativo](./screenshot.png)

## Hook
[Texto exato do hook ou descricao dos primeiros 3 segundos do video]

## Estrutura
- [bullet 1]
- [bullet 2]
- [bullet 3]
- [CTA]

## CTA
[Texto exato do CTA]

## Promessa principal
[Em 1 frase]

## Emocao alvo
[medo / desejo / raiva / esperanca / curiosidade / outra]

## Padrao extraido (acionavel)
[1 paragrafo: o que faz esse criativo funcionar e como adaptar ao meu nicho. NAO copiar literalmente.]

## Restricao de uso pro MEU nicho
[O que desse criativo NAO pode ser reproduzido no meu ramo. Ex.: "antes/depois catalogado como referencia de ESTRUTURA, PROIBIDO reproduzir em saude (regra do CFM)"; "promessa de renda garantida serve so de anti-modelo, nao replicar em financeiro". Se o meu nicho nao tem restricao, escreva "sem restricao".]

## Adaptacoes sugeridas ao meu ICP
- Adaptacao A: [variacao para meu nicho]
- Adaptacao B: [variacao alternativa]
```

---

## Regras

- **Nunca copiar literal.** Extrair padrao, adaptar ao seu ICP.
- **Sempre ter link da fonte.** Sem link, descartar.
- **Captura sem permissao** = OK pra estudo, NAO OK pra republicar.
- **Imagens com creditos** (concorrente + data) em qualquer uso interno.
- **Capturar so quem performou.** Anuncio rodando 18+ dias = passou no teste do algoritmo. Anuncio 1-3 dias = experimento, ignorar.

---

## Checklist de qualidade

**Captura**
- [ ] Screenshot salvo
- [ ] Link da fonte gravado
- [ ] Metadata preenchida (engajamento + dias rodando + performance)
- [ ] Padrao extraido (nao so descricao do criativo)
- [ ] 2 sugestoes de adaptacao ao ICP

**Organizacao**
- [ ] Categorizado por tipo + formato + padrao + nicho
- [ ] Indexado no master
- [ ] Se Figma: frame criado e tag aplicada

**Briefing**
- [ ] 10-20 referencias por tipo
- [ ] Agrupadas por emocao alvo
- [ ] Cada uma com adaptacao sugerida

**Manutencao**
- [ ] Revisao mensal feita
- [ ] Arquivo limpo (>90 dias movidos)
- [ ] Evergreens promovidos

---

## Anti-patterns (NUNCA fazer)

- Copiar criativo literalmente (penalizado pelo algoritmo + risco juridico)
- Capturar criativos com <7 dias rodando (sem prova de performance)
- Esquecer link da fonte (criativo orfa)
- Organizar so por concorrente (perde o padrao cross-niche)
- Acumular sem revisar (biblioteca de 500 criativos velhos vira inutil)

---

## Conexao com outras skills

```
/espiao-do-concorrente -> dossie-*.md       \
                                              -> /swipe-file (esta skill)
/trend-hunting -> variacoes-teste-*.md      /        |
                                                briefing-swipe-file.md
                                                     |
                                                 /offerbook (proxima)
```

## Anuncio de fechamento (proxima skill)

Apos gerar os 2 arquivos (`swipe-file-index.md` + `briefing-swipe-file.md`), **sempre** diga ao usuario em texto separado:

> Skill 4/5 entregue. Voce tem agora:
> - swipe-file-index.md / .html (abri pra voce) / .pdf
> - briefing-swipe-file.md / .html (abri pra voce) / .pdf (handoff pronto pra Copy e Media Buyer)
>
> **Proxima e ultima skill da Aula 01:** `/offerbook [nome-do-produto]`
>
> Offerbook consolida TUDO (avatar + dossies + swipe-file) num Livro da Oferta de 7 blocos. E o brief mestre que vai alimentar LP, e-mails e ads nas proximas aulas.

Nao pule esse anuncio — e o que orienta o aluno a seguir o trilho da Aula 01.
