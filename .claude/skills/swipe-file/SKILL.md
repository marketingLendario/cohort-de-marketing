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

---

Esta skill mantem **biblioteca viva** de criativos vencedores (anuncios, posts, hooks, CTAs, paginas) **organizados por padrao**, para alimentar Copy e Media Buyer com referencias acionaveis.

**Atencao etica:** swipe file e **biblioteca de inspiracao**, nao copy-paste. Voce extrai o **padrao** (estrutura do hook, formato, angulo) e adapta ao seu ICP. Copiar literalmente e tiro no pe (pena algoritmica + risco de marca).

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`, `swipe/`. Nos 3 formatos (md/html/pdf) onde a skill gera. O swipe file desta skill vive em **`projetos/{slug}/swipe/`**.

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
3. **ICP definido** (`/avatar-funil`) — filtro de relevancia

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
- 1 arquivo por criativo: `projetos/{slug}/swipe/{tipo}/{nicho}/{concorrente}-{data}.md`
- Cada arquivo com screenshot embedded + metadata + padrao extraido
- Index master em `projetos/{slug}/swipe/swipe-file-index.md`

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
1. **2 arquivos por criativo** em `projetos/{slug}/swipe/{tipo}/{nicho}/`:
   - `{slug}.md` — markdown editavel (template em `## Template de captura` abaixo)
   - `{slug}.html` — versao visual (template em `templates/criativo.html`)
2. Atualizacao do `projetos/{slug}/swipe/swipe-file-index.md` master
3. Instrucoes Figma (link para adicionar frame manualmente, se usar Figma)

**Material visual usa o `DESIGN.md` da marca.** Se você renderizar a biblioteca ou o briefing como HTML/PDF (relatório visual), gere-o JÁ com os tokens do `projetos/{slug}/DESIGN.md` — cores, fontes, borda/raio, tamanho, logo. NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes. (Os screenshots dos criativos winners entram como estão — o design da marca aplica só ao documento, não às peças capturadas.)

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

**Importante:** ambos arquivos (`.md` e `.html`) vivem na MESMA pasta (`projetos/{slug}/swipe/{tipo}/{nicho}/`). O index master mostra os 2 links lado a lado.

**Para `/swipe-file briefing [tipo]`:**
1. Documento `projetos/{slug}/swipe/briefing-{tipo}-{data}.md` com 10-20 referencias organizadas (granular, por tipo)
2. **`projetos/{slug}/swipe/briefing-swipe-file.md`** (handoff master) — index unico que consolida TODOS os briefings gerados ate aqui, e e o arquivo que voce passa pro Copy (`/copy-funil`) e pro Media Buyer. Atualizado a cada novo briefing gerado.

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
---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **WebSearch / WebFetch** — pesquisa aberta na internet. Já vem no Claude Code, sem instalação. Se um site bloquear (login wall/Cloudflare), diga QUAL fonte falhou e o que veio de snippet.
- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
