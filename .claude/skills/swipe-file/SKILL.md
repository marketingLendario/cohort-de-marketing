---
name: swipe-file
description: "Organiza criativos winners (anuncios, posts, hooks, CTAs) capturados das skills /espiao-do-concorrente e /trend-hunting em uma biblioteca categorizada e pesquisavel. Alimenta direto Copy e Media Buyer com referencias acionaveis. Funciona como Figma vivo: organizado por tipo, formato, performance e nicho. Output: swipe-file.md + estrutura de pastas + instrucoes Figma. NAO copia criativo dos outros: extrai padrao para inspirar. Triggers: 'swipe file', 'organizar criativos', 'biblioteca de referencias', '/swipe-file', 'salvar criativo winner'."
user_invocable: true
---

# Swipe File (Biblioteca de Criativos Winners)

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
3. **ICP definido** (`/pesquisa-de-avatar`) — filtro de relevancia

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
1. Arquivos `.md` em `projetos/{slug}/swipe/{tipo}/{nicho}/` (um por criativo)
2. Atualizacao do `projetos/{slug}/swipe/swipe-file-index.md` master
3. Instrucoes Figma (link para adicionar frame manualmente, se usar Figma)

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
/espiao-do-concorrente → briefing-swipe-file.md ↘
                                                /swipe-file (esta skill)
/trend-hunting → variacoes-teste.md          ↗      ↓
                                                briefing para Copy + Media Buyer
                                                     ↓
                                                Aula 02 (Arquiteto de Funil)
                                                Aula 03 (Media Buyer)
```

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
