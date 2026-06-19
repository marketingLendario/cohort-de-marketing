# Pesquisa, Concorrentes e Ofertas com IA

Apresentação de aula ao vivo · 4 horas · ~78 slides · 6 partes (abertura + 4 blocos + fechamento)

---

## Brief de design para o Claude

**Identidade visual: Academia Lendária — "A Biblioteca à Meia-Luz"**

Uma sala quase escura onde a única coisa que emite luz é uma lâmpada de ouro veludo. Calma, autoridade, sem urgência, sem gamificação ansiosa, sem ouro gritado. Tipografia faz o trabalho pesado: humanist sans para chrome, true serif para leitura. Profundidade vem de planos tonais (3 níveis de quase-preto), nunca de sombra pesada.

### Tokens (use exatamente estes)

**Cores:**
- `--background: #0A0A0A` — a página
- `--card: #0F0F0F` — primeiro plano (cards, painéis)
- `--raised: #262626` — segundo plano (bordas, inputs, dividers)
- `--foreground: #E5E5E5` — texto principal
- `--muted-foreground: #999999` — texto secundário, captions
- `--primary: #C9B298` — Ouro Velado (champagne velado, desaturado)
- `--primary-light: #D9CBB9` — hover do ouro
- `--primary-deep: #8D7556` — pressed/borda do ouro

**Tipografia:**
- Display: `Rajdhani 600/700` — títulos de slide
- UI: `Inter 400/600/700` — chrome, badges, listas
- Body / Leitura: `Source Serif 4 400/600` (italic permitido) — frases longas
- Mono: `JetBrains Mono 400/700` — prompts de IA, código

**Escala tipográfica (slides 1280×800):**
- Hero h1: `clamp(3em, 7vw, 4.5em)`
- Section h2: `2.4–2.8em`
- Lead body: `1.3em`
- Para o quadro frases: `1.5em italic`
- Body normal: `1.1em`

### Regras inegociáveis de marca (Single Lamp Rule)

1. **Ouro velado em ≤10% de qualquer slide.** Aparece em kickers, números de bloco, bordas de card-tese, palavras de ênfase em `<strong>`, links, CTAs. Nunca como background grande, nunca como decoração espalhada.
2. **Profundidade por planos tonais.** Card sobre página = `#0F0F0F` em `#0A0A0A`. Nunca shadow pesado.
3. **Source Serif 4 para frases longas e citações verbatim.** Inter para títulos curtos e UI.
4. **Zero emoji. Zero em-dash (—). Zero tom de guru.** Voz de professor experiente: direto, denso, sem condescendência.
5. **Centralizar conteúdo verticalmente nos slides.** Slide 1280×800; conteúdo respira no meio, não cola no topo.

### Componentes nomeados

- **kicker:** badge pequeno no topo do slide (`uppercase`, `letter-spacing 0.1em`, `font-size 0.7em`, cor ouro, borda 1px ouro deep, padding `4px 12px`, border-radius pill).
- **card-box:** painel `#0F0F0F` com borda 1px `#262626` e borda esquerda 2px `#C9B298`, padding 24px 28px, border-radius 1rem.
- **tese-frase:** frase grande Rajdhani 700 centralizada, `<strong>` em ouro.
- **quadro-slide:** card com fundo `rgba(201,178,152,0.06)`, borda ouro deep, frase em italic, palavra-chave em ouro.
- **micro-bar:** barra horizontal com 4 segmentos proporcionais (15/20/10/5) mostrando teoria → demo → exercício → quiz.
- **download-cta:** botão ouro sólido com texto preto, padding `10px 20px`, semibold, sombra-md.
- **energy-tag:** chip pequeno marcado "alta" (ouro), "média" (cinza), "pausa" (warning).

### Voz / tom

Frases curtas. Verbos no presente. Zero sales-pitch. Tom Alan Nicolas filtrado pela Academia Lendária: dura mas calma, técnica mas humana. "Você", nunca "vocês". Quando citar Alan, marcar timestamp e dia (`Alan Nicolas, 2026-06-08 · 00:21:50`).

---

## Cronograma (visão geral, para overview de deck)

| Bloco | Tempo | Slides | Cor de capítulo |
|---|---|---|---|
| Abertura | 00:00 – 00:15 | 11 | Ouro Velado kicker |
| Bloco 1 · Vácuo e Diagnóstico | 00:15 – 01:05 | 16 | Ouro Velado |
| Intervalo 1 | 01:05 – 01:15 | 1 | Warning suave |
| Bloco 2 · Focus Group Sintético | 01:15 – 02:05 | 14 | Ouro Velado |
| Intervalo 2 | 02:05 – 02:15 | 1 | Warning suave |
| Bloco 3 · Concorrentes | 02:15 – 03:05 | 15 | Ouro Velado |
| Bloco 4 · Grand Slam Offer | 03:05 – 03:55 | 16 | Ouro Velado |
| Fechamento | 03:55 – 04:00 | 10 | Ouro Velado intenso |

Total: 4 horas. Pausas planejadas só entre 1→2 e 2→3 (Bloco 3 → Bloco 4 é sem intervalo).

---

# Parte 1 — Abertura (15 min · 11 slides)

## Slide 1.1 — Capa
- **Tipo:** capa centralizada (`center`)
- **Kicker:** `Aula ao vivo · 4 horas`
- **H1:** Pesquisa, Concorrentes e Ofertas com IA
- **Lead (Source Serif italic):** O jogo que se ganha antes do anúncio.
- **Notas:** Energia alta sem ansiedade. Pausa 2s. Olha câmera.

## Slide 1.2 — Tese-mãe
- **Tipo:** `tese-slide` centralizado
- **Frase grande:** `Pesquisa antes da oferta.` (com "Pesquisa antes da oferta" em ouro)
- **Notas:** Lê devagar. A tese-mãe.

## Slide 1.3 — Quem vende vs quem queima
- **Tipo:** padrão com 2 H2 empilhados
- **H2.1:** Quem vende milhões com IA faz pesquisa antes da oferta.
- **H2.2 (cinza muted):** Quem queima verba tenta oferta primeiro, pesquisa depois.
- **Linha de fechamento:** A diferença não é orçamento. É **ordem**.
- **Notas:** Pausa entre as duas linhas.

## Slide 1.4 — Você está aqui (Position)
- **Tipo:** padrão centralizado verticalmente
- **H2:** Você está aqui
- **Lista (bullets):**
  - Já criou oferta que não vendeu como esperado, mesmo com produto bom
  - Ou começa do zero, ideia na cabeça, dúvida se vale anunciar
  - Os dois lugares são **normais**
  - O que não é normal: gastar mídia antes de saber o que a oferta resolve
- **Notas:** Position. Reconhece os dois pontos de partida.

## Slide 1.5 — O caso da Alan (2 card-box lado a lado)
- **H2:** O caso da Alan
- **Card esquerdo (h4: Quando inverteu a ordem):**
  - **R$ 300 mil** investidos em design de produto antes de validar dor.
  - *Resultado: estoque parado.* (italic, muted)
- **Card direito (h4: Quando seguiu a ordem):**
  - **Meio milhão de reais** em vendas em um único dia de e-commerce.
  - *Mesma pessoa. Ordem diferente.* (italic, muted)
- **Notas:** Caso concreto. Timestamps 00:30:42 e 00:50:00.

## Slide 1.6 — O mapa dos 4 blocos (tabela)
- **H2:** O mapa dos 4 blocos
- **Tabela 3 colunas:** Bloco | Tese | Saída
  - 1 | Vácuo + dor real vivem em lugares públicos | Frase do cliente
  - 2 | Persona sintética testa mensagem custo zero | Headline testada
  - 3 | Concorrente em 4 vetores em 15 min | Brecha competitiva
  - 4 | Empilhamento faz preço sumir | Oferta completa
- **Notas:** Tabela. Cada bloco entrega algo concreto.

## Slide 1.7 — Cronograma (tabela)
- **H2:** Cronograma
- **Tabela:** Tempo (mono) | Bloco | Energia (tag)
  - `00:00 — 00:15` | Abertura | alta
  - `00:15 — 01:05` | Bloco 1: Vácuo + Diagnóstico | alta
  - `01:05 — 01:15` | Intervalo | pausa
  - `01:15 — 02:05` | Bloco 2: Focus Group Sintético | alta
  - `02:05 — 02:15` | Intervalo | pausa
  - `02:15 — 03:05` | Bloco 3: Concorrentes | média
  - `03:05 — 03:55` | Bloco 4: Grand Slam Offer | alta
  - `03:55 — 04:00` | Fechamento | alta
- **Notas:** 4 horas. 2 intervalos planejados.

## Slide 1.8 — Acordo de presença
- **H2:** Acordo de presença
- **Lista ordenada (3 itens):**
  1. **Computador aberto.** Não é opcional. Cada bloco tem demo e exercício.
  2. **Anote só "Para o quadro".** 2-3 frases por bloco. Não o conteúdo inteiro.
  3. **Perguntas no Q&A.** Cada bloco fecha com 5 min. Guarde para o momento.
- **Notas:** Reforça os 3 combinados. Pergunta confirmação visual.

## Slide 1.9 — IA é meio (tese-slide)
- **Frase principal (2 linhas):** Você não vende IA. / **Vende solução.**
- **Sublinha (Source Serif, muted):** IA é meio. Como eletricidade. Ninguém compra eletricidade, compra geladeira.
- **Notas:** Alan timestamp 00:11:50. Pausa antes do "Vende solução".

## Slide 1.10 — A fórmula (tese-slide gigante)
- **H2:** A fórmula
- **Frase tese (font-size 2em):** **Dor cara** + solução simples + pitch específico = **contrato fechado**
- **Notas:** A fórmula. Aponta cada termo.

## Slide 1.11 — Para o quadro (abertura)
- **H2:** Para o quadro · abertura
- **3 quadro-slides empilhados:**
  - **A tese-mãe:** pesquisa antes da oferta. O jogo se ganha antes do anúncio.
  - **A ordem:** dor cara + solução simples + pitch específico = contrato fechado.
  - **Sobre IA:** você não vende IA. Vende solução.
- **Notas:** Lê devagar. Eles anotam.

---

# Parte 2 — Bloco 1: Vácuo e Diagnóstico de Dor (50 min · 16 slides)

## Slide 2.1 — Capa do Bloco 1
- **Tipo:** centralizado
- **Kicker:** `Bloco 1 · 00:15 — 01:05 · 50 minutos`
- **H1:** Vácuo e Diagnóstico de Dor
- **Lead:** Onde a dor real mora (e não é na sua cabeça).
- **Notas:** Transição: "agora a gente vai aprender onde a dor real mora."

## Slide 2.2 — Tese do bloco
- **Tipo:** tese-slide
- **Frase:** A dor cara **já sangra no caixa** antes da IA entrar.
- **Notas:** Quote literal Alan timestamp 00:21:50.

## Slide 2.3 — Microestrutura
- **H2:** Microestrutura
- **micro-bar (4 segmentos com tempo proporcional):**
  - `0-15 min` Teoria
  - `15-35 min` Demo
  - `35-45 min` Exercício
  - `45-50 min` Quiz
- **Linha de fechamento:** 4 critérios → demo Claude → você minera 1 nicho → quiz oral.

## Slide 2.4 — Os 4 critérios da dor cara
- **H2:** Os 4 critérios da dor cara
- **Lista ordenada:**
  1. **Frequência alta** — acontece toda semana, todo mês
  2. **Custo visível** — quantificável em reais ou tempo
  3. **Quem sente controla orçamento** — não adianta dor onde quem decide não sente
  4. **Palavras literais do cliente** — não é como você descreve, é como ele descreve

## Slide 2.5 — Critério 2 com caso real
- **H2:** Critério 2 · custo visível
- **card-box destacado (Source Serif 1.3em):**
  - "Uma franquia gastando **R$ 20 mil por semana** só para enviar documentação."
  - Citation muted: Alan Nicolas, 2026-06-08 · timestamp 00:24:11
- **Linha de fechamento:** R$ 20 mil é número. Número convence. Dor sem número é hipótese.

## Slide 2.6 — O problema da sua cabeça
- **H2:** O problema da sua cabeça
- **Lead 1:** Dor real **não é o que ele te conta no almoço.**
- **Lead 2:** É **o que ele escreve** quando ninguém está olhando.
- **Notas:** Pausa entre as duas frases.

## Slide 2.7 — Protocolo de triangulação (3 cards)
- **H2:** O protocolo de triangulação
- **Grid 3 colunas:**
  - **Reviews** — Reclame Aqui, B2B Stack, Capterra. Cliente bravo depois de comprar.
  - **Comunidades** — Reddit, Facebook, Discord. Conversa entre pares.
  - **Redes sociais** — Twitter, LinkedIn, TikTok. Desabafo público.
- **Linha de fechamento:** 1 fonte mente. 2 sugerem. **3 confirmam.**

## Slide 2.8 — Anúncio da demo
- **H2:** Demo ao vivo · Claude
- **Texto:** Vamos minerar dor real do nicho **escritórios de contabilidade brasileiros**.
- **Lista ordenada:**
  1. Extrair temas recorrentes (50 reviews)
  2. Cruzar com comunidades (30 mensagens)
  3. Extrair a frase-mestre (1 frase de cliente)
- **Footer muted:** Pode acompanhar. Os prompts vêm a seguir.

## Slide 2.9 — Prompt 1 (mono)
- **H4:** Prompt 1 · Claude
- **Bloco mono completo:**

```
Você é um analista de mercado especializado em mineração de dor.
Vou colar abaixo trechos de reviews públicos de softwares usados
por escritórios de contabilidade no Brasil. Sua tarefa:

1. Identifique os 5 temas de dor mais recorrentes nos reviews
2. Para cada tema, extraia 3 citações VERBATIM (palavras literais
   do cliente, sem reescrita)
3. Para cada tema, estime o custo visível (em horas perdidas ou
   em reais) quando o cliente mencionar
4. Classifique cada tema por frequência (alta, média, baixa)

Formato de saída: tabela com colunas Tema, Citações verbatim,
Custo visível, Frequência.

[colar aqui de 20 a 50 reviews]
```

- **Footer muted:** Material completo no envio pós-aula.
- **Notas:** "Repare que estou pedindo VERBATIM. Sem isso o modelo parafraseia."

## Slide 2.10 — Prompt 2 (mono)
- **H4:** Prompt 2 · Claude
- **Bloco mono:**

```
Agora vou colar trechos de discussões em grupos de Facebook e
Reddit onde contadores discutem essas dores entre si (sem estar
avaliando produto, só conversando). Sua tarefa:

1. Para cada um dos 5 temas que você identificou no prompt anterior,
   marque quais aparecem também nessas discussões
2. Identifique 2 temas NOVOS que aparecem em comunidade mas não
   apareceram em review (isso indica dor que ninguém vende
   solução ainda)
3. Para cada tema novo, extraia 2 citações verbatim

[colar aqui de 10 a 30 mensagens de comunidade]
```

- **Notas:** O que está em comunidade sem review é VÁCUO.

## Slide 2.11 — Prompt 3 (mono)
- **H4:** Prompt 3 · Claude
- **Bloco mono:**

```
Com base nos dois prompts anteriores, escolha A DOR mais frequente,
mais cara, e que aparece com palavras consistentes em todas as
fontes. Para essa dor, me devolva:

1. A frase exata como o cliente escreve (verbatim, na 1ª pessoa)
2. O custo médio em reais ou horas
3. A frequência (quantas vezes por mês)
4. Quem na empresa controla o orçamento para resolver essa dor
5. Se essa dor passa nos 4 critérios da dor cara: frequência alta,
   custo visível, controle de orçamento, palavras literais
```

- **Notas:** A saída deste prompt é o INSUMO do Bloco 2.

## Slide 2.12 — Material Codex/GPT
- **H2:** Material para Codex / GPT
- **Texto:** Mesmos prompts adaptados para ChatGPT.
- **Sublinha (Source Serif muted italic):** Vai no envio pós-aula com diferenças marcadas.
- **CTA ouro:** Baixar prompts paralelos

## Slide 2.13 — Exercício 2 níveis
- **H2:** Exercício · 10 minutos
- **2 card-box lado a lado:**
  - **Nível iniciante:** Escolha seu nicho. Cole 5 reviews no Claude. Receba a tabela com 3 temas + 2 citações por tema.
  - **Nível intermediário:** Rode os 3 prompts em sequência. Saia com a frase-mestre que passa nos 4 critérios da dor cara.
- **Footer muted:** Critério: a frase lida em voz alta soa como cliente bravo, não como descrição corporativa.

## Slide 2.14 — Para o quadro Bloco 1
- **H2:** Para o quadro · Bloco 1
- **3 quadro-slides:**
  - **A dor cara:** sangra no caixa antes da IA entrar.
  - **Triangulação:** reviews + comunidades + redes.
  - **Verbatim:** dor real é o que ele escreve quando ninguém olha.

## Slide 2.15 — Tela de intervalo
- **Tipo:** centralizado
- **Kicker warning:** Intervalo
- **H1 gigante (ouro):** 10 minutos
- **Lead:** Guarda a frase do cliente. Você vai usar no Bloco 2.

---

# Parte 3 — Bloco 2: Focus Group Sintético (50 min · 14 slides)

## Slide 3.1 — Capa do Bloco 2
- **Kicker:** `Bloco 2 · 01:15 — 02:05 · 50 minutos`
- **H1:** Focus Group Sintético
- **Lead:** Testar mensagem com custo zero antes da mídia paga.

## Slide 3.2 — Tese (era da hiperpersonalização)
- **Tipo:** tese-slide
- **Frase:** A era da IA é a era da **hiperpersonalização**.
- **Citation muted:** Alan Nicolas, 2026-06-08 · timestamp 00:58:55

## Slide 3.3 — Tradicional vs Sintético (tabela)
- **H2:** Por que focus group sintético
- **Tabela:** comparação Tradicional vs Sintético
  - Custo: Milhares / Zero
  - Tempo: Semanas / 10 min
  - Iterações: 1-2 / 5+ por hora
  - Insumo: Cliente real / Frase do Bloco 1

## Slide 3.4 — As 7 dimensões da persona
- **H2:** As 7 dimensões da persona
- **Lista ordenada:**
  1. **Demografia** — idade, profissão, renda
  2. **Psicografia** — 3 valores, 3 medos, 3 ambições
  3. **Comportamento atual** — o que faz hoje sobre a dor
  4. **Voz e vocabulário** — 5 frases que usa, 3 que NÃO usa
  5. **Objeções típicas** — 3 contra-argumentos
  6. **Contexto de leitura** — onde, quando, estado emocional
  7. **Padrão de decisão** — rápido/lento, sozinho/grupo

## Slide 3.5 — Caricatura vs interlocutor (tese)
- **Tipo:** tese-slide
- **Frase 2 linhas:** Persona com 1 dimensão é **caricatura**. / Persona com 7 dimensões é **interlocutor**.

## Slide 3.6 — 3 perfis decisórios
- **H2:** Por que 3 personas, não 1
- **Grid 3 cards:**
  - **Decisor racional:** Quer ROI claro, número, prova.
  - **Decisor emocional:** Quer segurança, identidade, pertencimento.
  - **Decisor pragmático:** Quer simplicidade, rapidez, sem fricção.
- **Linha de fechamento:** Headline campeã ressoa em **2 dos 3 sem ofender o terceiro**.

## Slide 3.7 — O ciclo (4 cards horizontais)
- **H2:** O ciclo
- **Grid 4 colunas:**
  - **1. Frase** — Do Bloco 1
  - **2. Personas** — 3 × 7 dimensões
  - **3. Teste** — 1 headline
  - **4. Decide** — 2+ ressoam = mídia
- **Linha de fechamento:** 10 minutos no Claude. **5 versões de headline em 1 hora.**

## Slide 3.8 — Prompt 1 (mono)
- **H4:** Prompt 1 · criar 3 personas
- **Bloco mono:**

```
Você é um pesquisador comportamental especializado em criar
personas sintéticas profundas. Vou te dar uma frase verbatim de
cliente do nicho de escritórios de contabilidade brasileiros.

Sua tarefa: criar 3 personas distintas que poderiam ter dito essa
frase, cada uma representando um perfil decisório diferente:
decisor racional, decisor emocional, decisor pragmático.

Frase verbatim: "Perdi três clientes esse mês porque a equipe
demorou mais de duas horas para responder. O sócio está me
cobrando na reunião de sexta."

Para cada persona, preencha as 7 dimensões:
1. Demografia (nome, idade, cargo, faturamento, cidade)
2. Psicografia (3 valores, 3 medos, 3 ambições)
3. Comportamento atual
4. Voz e vocabulário (5 expressões que usa, 3 que NÃO usa)
5. Objeções típicas (3 contra-argumentos)
6. Contexto de leitura
7. Padrão de decisão

Formato: tabela 3 colunas × 7 linhas.
```

## Slide 3.9 — Prompt 2 (mono)
- **H4:** Prompt 2 · testar headline contra 3 personas
- **Bloco mono:**

```
Agora você vai assumir o papel de cada uma das 3 personas, uma
por vez, e reagir a esta headline candidata como se ela aparecesse
no LinkedIn ou Google Ads para você:

Headline: "Reduza em 80% o tempo de resposta do seu escritório
sem contratar mais ninguém"

Para cada uma das 3 personas:
1. Reação imediata em 1 frase (voz da persona, 1ª pessoa)
2. O que chamou atenção (positivo)
3. O que gerou objeção ou desconfiança
4. Probabilidade de clicar de 0 a 10
5. O que precisaria mudar para subir essa nota em 3 pontos

Síntese final: a headline ressoou em quantas das 3? Qual versão
refinada você recomenda testar a seguir?
```

## Slide 3.10 — Material Codex/GPT
- **H2:** Material para Codex / GPT
- **Texto:** Mesma intenção, sintaxe adaptada para ChatGPT. **Diferença:** o GPT precisa de reforço explícito de "1ª pessoa" para entrar no papel da persona.
- **CTA ouro:** Baixar prompts paralelos

## Slide 3.11 — Exercício 2 níveis
- **H2:** Exercício · 10 minutos
- **2 card-box:**
  - **Iniciante:** Pegue sua frase do Bloco 1. Rode o prompt 1 simplificado. Receba 3 personas com demografia + 3 valores + 3 medos.
  - **Intermediário:** 3 personas completas (7 dimensões). Escreva sua headline candidata. Rode o teste. Refine.
- **Footer muted:** Critério: headline ressoa em pelo menos 2 das 3 personas (nota ≥ 7).

## Slide 3.12 — Para o quadro Bloco 2
- **H2:** Para o quadro · Bloco 2
- **3 quadro-slides:**
  - **Persona profunda:** 7 dimensões. Menos é caricatura.
  - **3 personas, 1 headline:** se ressoar em 2 sem ofender a 3ª, vai para mídia.
  - **Custo:** zero. **Tempo:** 10 minutos.

## Slide 3.13 — Tela de intervalo
- **Tipo:** centralizado
- **Kicker warning:** Intervalo
- **H1 gigante ouro:** 10 minutos
- **Lead:** Próximo: ver o concorrente do alto.

---

# Parte 4 — Bloco 3: Concorrentes em 4 Vetores (50 min · 15 slides)

## Slide 4.1 — Capa do Bloco 3
- **Kicker:** `Bloco 3 · 02:15 — 03:05 · 50 minutos`
- **H1:** Concorrentes em 4 Vetores
- **Lead:** Dossiê em 15 minutos. Brecha em 5.
- **Notas:** Energia da turma costuma cair aqui. Voz mais firme.

## Slide 4.2 — Tese (concorrente bem analisado)
- **Tipo:** tese-slide
- **Frase 2 linhas:** Concorrente bem analisado mostra **brecha**. / Análise sem brecha é tempo perdido.

## Slide 4.3 — Os 4 vetores (grid)
- **H2:** Os 4 vetores
- **Grid 2x2 card-box:**
  - **1. Posicionamento** — Como ele se vende. A identidade que projeta.
  - **2. Preço** — Quanto cobra E como apresenta. Estrutura, não só número.
  - **3. Promessa (USP)** — O que entrega, em quanto, em qual prazo. Específica ou genérica.
  - **4. Ângulos (história)** — Por que existe. A história empacota tudo.

## Slide 4.4 — Caso do médico do estômago
- **H2:** O caso do médico do estômago
- **card-box destacado (Source Serif 1.15em):**
  - "Sou médico especializado no estômago. Criei um **método de 30 segundos** onde pessoas que sentem queimação na parte superior do estômago resolvem de forma simples."
  - Citation muted: Alan Nicolas, 2026-06-08 · timestamp 00:55:59
- **Grid 2 cards (comparação):**
  - **Promessa específica:** "método de 30 segundos" + tipo de pessoa + resultado nomeado
  - **Promessa genérica:** "Cuidamos do seu estômago"

## Slide 4.5 — A brecha competitiva (conceito)
- **H2:** A brecha competitiva
- **Lead:** Brecha é vetor onde **nenhum concorrente é forte**.
- **Texto:** Você não precisa ser o melhor em tudo. Precisa ser **o único forte em UM vetor** onde todos os outros são medianos.

## Slide 4.6 — Brecha de ângulo (tabela)
- **H2:** Brecha de ângulo é a mais defensável
- **Tabela:** Vetor | Defesa contra cópia
  - Preço | Fácil de copiar (30 dias)
  - Promessa | Médio
  - Posicionamento | Médio-alto
  - **Ângulo (história)** | **Difícil. História não se copia.**
- **Linha:** Quem chega primeiro com história autêntica ganha posição que dura anos.

## Slide 4.7 — Antes vs depois da IA
- **H2:** Antes vs depois da IA
- **Grid 2 cards:**
  - **Antes:** Ler site, baixar PDF, falar com ex-clientes. **Semanas.**
  - **Depois:** 5 min coletando + 8 min Claude + 2 min refino. **15 minutos.**
- **Linha:** 4 concorrentes em 1 hora. Antes: 1 concorrente em 1 mês.

## Slide 4.8 — Prompt 1 (mono)
- **H4:** Prompt 1 · posicionamento e promessa
- **Bloco mono:**

```
Você é um analista competitivo sênior. Vou colar abaixo material
público de um concorrente. Sua tarefa:

1. Posicionamento: em 1 frase, como o concorrente se vende.
   Não use as palavras dele. Use sua interpretação
   ("ele se posiciona como ___ para ___").
2. Promessa (USP): qual é a promessa principal, em 1 frase.
   Marcar como específica ou genérica e explicar por quê.
3. Para quem ele NÃO serve: 2 perfis que ele explicitamente
   ou implicitamente exclui.

Material coletado:
[colar 200 a 500 palavras do site, página inicial, sobre nós,
página de planos]
```

## Slide 4.9 — Prompt 2 (mono)
- **H4:** Prompt 2 · preço e ancoragem
- **Bloco mono:**

```
Agora vou colar a estrutura de preços do mesmo concorrente.
Sua tarefa:

1. Tabela de preços com colunas: Plano, Valor mensal, Valor anual,
   O que inclui em 1 linha
2. Estratégia de ancoragem: como ele guia o cliente a escolher
   o plano caro (riscado, comparativo, escassez, bônus).
   Marcar técnica usada.
3. Diferencial competitivo no preço: mais caro, igual ou mais
   barato que a média? Como ele justifica?
4. Modelo de cobrança: mensalidade, anual, one-shot, performance.
   Qual e por quê.

Material:
[colar página de planos, política de upgrade, cancelamento]
```

## Slide 4.10 — Prompt 3 (mono)
- **H4:** Prompt 3 · ângulo e mapa final
- **Bloco mono:**

```
1. Ângulo (história): qual história o concorrente conta sobre
   por que existe. Em 2 frases.
2. Ressonância emocional: a história ressoa em qual perfil
   decisório (racional, emocional, pragmático)? Por quê?
3. Mapa final dos 4 vetores: para cada vetor (posicionamento,
   preço, promessa, ângulo), marque a força do concorrente como
   Forte, Médio ou Fraco, e justifique em 1 frase.
4. Sugestão de brecha: qual vetor é o mais fraco e poderia virar
   seu campo de batalha?

Material:
[colar 10 posts, 5 depoimentos, página Sobre]
```

## Slide 4.11 — Material Codex/GPT
- **H2:** Material para Codex / GPT
- **Texto:** **Diferença:** GPT tende a ser cauteloso em julgar "fraco". Reforce no prompt: "seja direto, marque Fraco quando justificável, não tenha medo de tomar posição".
- **CTA ouro:** Baixar prompts paralelos

## Slide 4.12 — Exercício 2 níveis
- **H2:** Exercício · 10 minutos
- **2 card-box:**
  - **Iniciante:** 1 concorrente seu, prompt 1 com material do site dele. Receba posicionamento + promessa + exclusões.
  - **Intermediário:** 3 prompts em sequência para 2 concorrentes. Compare os 4 vetores lado a lado. Aponte brecha defensável.

## Slide 4.13 — Para o quadro Bloco 3
- **H2:** Para o quadro · Bloco 3
- **3 quadro-slides:**
  - **4 vetores:** posicionamento, preço, promessa, ângulo.
  - **Brecha real:** onde TODOS são fracos.
  - **Defesa:** ângulo é difícil de copiar. Preço é fácil.

## Slide 4.14 — Sem intervalo
- **Tipo:** centralizado
- **H1 ouro:** Sem intervalo
- **Lead:** Próximo bloco depende deste fresco. **Bora direto.**

---

# Parte 5 — Bloco 4: Grand Slam Offer com IA (50 min · 16 slides)

## Slide 5.1 — Capa do Bloco 4
- **Kicker:** `Bloco 4 · 03:05 — 03:55 · 50 minutos`
- **H1:** Grand Slam Offer com IA
- **Lead:** Empilhar valor até o preço sumir.
- **Notas:** Bloco onde tudo se junta. Energia ALTA.

## Slide 5.2 — Tese (preço sem valor)
- **Tipo:** tese-slide
- **Frase:** **Preço sem valor é ruído.**
- **Citation muted:** Alan Nicolas, 2026-06-08 · timestamp 01:15:16

## Slide 5.3 — Eu não cobro 10x, eu entrego 10x
- **Tipo:** tese-slide
- **Frase 2 linhas:** Eu não cobro **dez vezes mais**. / Eu entrego **dez vezes mais**.
- **Notas:** Regra 10x na voz da Alan.

## Slide 5.4 — A inversão pedagógica (tabela)
- **H2:** A inversão pedagógica
- **Tabela:** Pergunta errada | Pergunta certa
  - Quanto cobrar? | **Quanto isso vai gerar para o cliente?**
  - — | Divide por 10. Esse é seu preço.
- **Linha:** Você não chuta preço. Você calcula valor e divide.

## Slide 5.5 — Casos com números (2 cards)
- **H2:** Casos com números
- **Grid 2 cards:**
  - **Caso 1 · regra 10x:** Cliente economiza **R$ 200 mil**. Ele cobra **R$ 22 mil**. Relação 1:10.
  - **Caso 2 · empacotamento:** Projeto cotado em **R$ 20 mil** virou **R$ 120-180 mil** pela apresentação da oferta.
- **Footer muted:** Mesmo trabalho. Empacotamento diferente. Preço 6-9x maior.

## Slide 5.6 — Por que a regra 10x funciona
- **H2:** Por que a regra 10x funciona
- **Lista ordenada:**
  1. **Margem para entregar bem** — oxigênio para entregar com sobra
  2. **Posição na mente do cliente** — gerador de valor, não custo
  3. **Filtro de cliente** — quem entende compra, quem não entende não é seu cliente

## Slide 5.7 — Os 4 componentes (grid 2x2)
- **H2:** Os 4 componentes do empilhamento
- **Grid 2x2:**
  - **1. Promessa específica** — O que entrega, em quanto, em qual prazo. Quantificada.
  - **2. Garantia** — Quem assume risco vende mais. Tira a desculpa do "e se não funcionar".
  - **3. Ancoragem** — Preço comparado a baseline maior. Custo do problema, alternativas, horas do cliente.
  - **4. Nome** — Diz para quem é, sugere resultado, memorizável.

## Slide 5.8 — Promessa: específica vs genérica
- **H2:** Promessa específica vs genérica
- **Grid 2 cards:**
  - **Genérica · morre** (card thin, muted italic): "Ajudamos empresas a crescer."
  - **Específica · arma** (card destacado): "Dobramos sua taxa de resposta em 60 dias ou devolvemos."
- **Linha:** Quantificação + prazo + cláusula "ou". **Sem essas 3, é só propaganda.**

## Slide 5.9 — Ancoragem: 3 caminhos
- **H2:** Ancoragem · 3 caminhos
- **Lista ordenada:**
  1. **Custo do problema** — quanto o cliente perde por mês sem resolver
  2. **Alternativa mais cara** — consultoria tradicional, contratação de funcionário
  3. **Tempo equivalente** — horas do cliente valoradas em R$/hora
- **Linha:** Sem ancoragem, ele compara com expectativa interna dele. Com ancoragem, ele compara com **o que você definiu**.

## Slide 5.10 — Nome ruim mata, nome bom vende
- **Tipo:** tese-slide
- **Frase 2 linhas:** Nome ruim mata **oferta boa**. / Nome bom vende **oferta mediana**.

## Slide 5.11 — Critérios de nome bom
- **H2:** Critérios de nome bom
- **Lista ordenada:**
  1. Diz para quem é em 1-2 palavras
  2. Sugere resultado, não método
  3. Memorizável em uma leitura
  4. Funciona como assunto de e-mail e título de página
  5. Não é genérico (evitar "Sistema de", "Programa de", "Método")

## Slide 5.12 — Prompt 1 (mono · longo)
- **H4:** Prompt 1 · promessa específica
- **Bloco mono:**

```
Você é um copywriter sênior especialista em ofertas de alto
ticket B2B. Vou te dar 3 insumos que vieram de pesquisa
estruturada. Sua tarefa é construir UMA promessa específica
para a oferta.

Insumo 1, dor verbatim do cliente:
"Perdi três clientes esse mês porque a equipe demorou mais de
duas horas para responder. O sócio está me cobrando na reunião
de sexta."

Insumo 2, persona-alvo: sócia de escritório de contabilidade
de médio porte, perfil decisor racional, exige ROI quantificado,
decide em comitê.

Insumo 3, brecha competitiva: concorrentes têm posicionamento
e promessa fortes, ângulo (história) fraco.

Sua tarefa:
1. Escreva 3 versões de promessa específica, cada uma com:
   resultado nomeado, quantificação, prazo, "ou" (devolução,
   dobra, refaz).
2. Classifique cada uma por perfil decisório.
3. Recomende qual usar dado que o perfil-alvo é racional.
```

## Slide 5.13 — Prompt 2 (mono)
- **H4:** Prompt 2 · garantia + ancoragem
- **Bloco mono:**

```
Com a promessa escolhida ("[colar a vencedora]"), agora construa
garantia e ancoragem.

Garantia:
1. Proponha 2 versões: uma forte (devolução total se não bater
   meta), uma híbrida (devolução parcial + 30 dias extras).
2. Para cada, identifique o risco que você assume e como mitigar
   operacionalmente.
3. Recomende qual usar para uma oferta de R$ 50 mil com perfil
   B2B racional.

Ancoragem (para R$ 50 mil):
1. Custo do problema (3 clientes perdidos/mês × R$ 5 mil)
2. Alternativa (gerente de operações sênior R$ 12 mil/mês)
3. Horas do cliente (sócia ganha de volta, valorada R$ 500/h)
Para cada, escreva a frase de ancoragem do material de vendas.
Recomende qual usar como principal.
```

## Slide 5.14 — Prompt 3 (mono)
- **H4:** Prompt 3 · nome
- **Bloco mono:**

```
Você tem agora:
- Promessa: "[colar]"
- Garantia: "[colar]"
- Ancoragem: "[colar]"
- Persona-alvo: sócia de escritório, decisor racional
- Brecha competitiva: ângulo (história) único

Sua tarefa: gerar 5 nomes candidatos para esta oferta seguindo
critérios:
1. Diz para quem é em 1 ou 2 palavras
2. Sugere o resultado, não o método
3. Memorizável em uma leitura
4. Funciona como assunto de e-mail e como título de página
5. Não é genérico (evitar "Sistema de", "Programa de", "Método")

Para cada nome, dê justificativa em 1 frase do porquê funciona.
Recomende o vencedor com argumento de 2 frases.
```

## Slide 5.15 — Material Codex/GPT
- **H2:** Material para Codex / GPT
- **Texto:** Versão paralela completa para a turma que usa ChatGPT. Inclui os 3 prompts adaptados e os 2 testes finais (especificidade + nome).
- **CTA ouro:** Baixar prompts paralelos

## Slide 5.16 — Exercício 2 níveis
- **H2:** Exercício · 10 minutos
- **2 card-box:**
  - **Iniciante:** Prompt 1 com sua dor, persona, brecha. Escolha 1 das 3 promessas.
  - **Intermediário:** 3 prompts em sequência. Sai com oferta completa: promessa, garantia, ancoragem, nome. **Verifique regra 10x.**
- **Footer muted:** 3 testes: especificidade · regra 10x · nome com 2 pessoas do nicho.

## Slide 5.17 — Para o quadro Bloco 4
- **H2:** Para o quadro · Bloco 4
- **3 quadro-slides:**
  - **Regra 10x:** cobre um décimo do que entrega.
  - **4 componentes:** promessa específica + garantia + ancoragem + nome.
  - **Nome:** ruim mata oferta boa. Bom vende oferta mediana.

---

# Parte 6 — Fechamento (5 min · 10 slides)

## Slide 6.1 — Capa do fechamento
- **Tipo:** centralizado
- **Kicker:** `Fechamento · 5 minutos`
- **H1:** Para o quadro.
- **Lead:** 4 frases. Uma ação de 24 horas.
- **Notas:** Voz cai meio tom. Ritmo mais lento. Contato visual.

## Slide 6.2 — Frase do Bloco 1
- **H4 muted:** Do Bloco 1
- **quadro-slide gigante (font 1.6em):**
  - Texto principal: A dor cara já sangra no caixa antes da IA entrar.
  - Sub-frase muted UI 0.7em: Frequência, custo visível, controle de orçamento, palavras literais. Sem os quatro, é hipótese.

## Slide 6.3 — Frase do Bloco 2
- **H4 muted:** Do Bloco 2
- **quadro-slide gigante:**
  - Três personas, uma headline.
  - Sub-frase muted: Custo zero, dez minutos. Se ressoa em duas sem ofender a terceira, vai para mídia.

## Slide 6.4 — Frase do Bloco 3
- **H4 muted:** Do Bloco 3
- **quadro-slide gigante:**
  - Quatro vetores. Brecha onde todos são fracos.
  - Sub-frase muted: Ângulo é a brecha mais difícil de copiar.

## Slide 6.5 — Frase do Bloco 4
- **H4 muted:** Do Bloco 4
- **quadro-slide gigante:**
  - Preço sem valor é ruído. Regra dez por um.
  - Sub-frase muted: Promessa específica, garantia que tira risco, ancoragem que dá referência, nome que vende. Empilhe.

## Slide 6.6 — Ação de 24 horas (intro)
- **H2:** Ação de 24 horas
- **Lead 1.2em:** Conhecimento sem ação vira ressaca.
- **Texto:** Em 24 horas, faça **uma** coisa. Não três. Uma.

## Slide 6.7 — Escolha uma (3 cards)
- **H2:** Escolha uma
- **Grid 3 cards:**
  - **Opção 1 — Sem nicho claro:** Rode o protocolo do Bloco 1 em 15 min. Saia com frase do cliente ou descarte o nicho.
  - **Opção 2 — Nicho mas oferta fraca:** Rode 3 prompts do Bloco 4 em 30 min. Promessa, garantia, ancoragem, nome.
  - **Opção 3 — Oferta mas anúncio não converte:** Teste do Bloco 2 em 10 min. Descubra qual perfil está perdendo.

## Slide 6.8 — A ordem do jogo (tese)
- **Tipo:** tese-slide
- **Frase 3 linhas:** Pesquisa antes de oferta. / Oferta antes de anúncio. / **Anúncio antes de escala.**
- **Sub-frase muted:** Inverter qualquer uma queima verba.

## Slide 6.9 — Em uma semana
- **Tipo:** centralizado
- **H1 grande:** Em uma semana,
- **Lead 1.6em:** eu quero ouvir de você qual opção executou.
- **Notas:** Olha a câmera. 2 segundos de pausa. Despede.

## Slide 6.10 — Capa final
- **Tipo:** centralizado
- **Kicker:** Obrigada
- **H1:** Pesquisa antes da oferta.
- **Lead:** O jogo se ganha antes do anúncio.
- **Footer muted UI:** Material completo: prompts Codex/GPT, "Para o quadro" de cada bloco, transcript da Alan mapeado por tema.
- **CTA ouro:** Roteiro completo

---

## Instruções finais para o Claude Design

1. **Renderiza cada slide acima como uma section reveal.js (ou Keynote/Google Slides/Pitch se for outra ferramenta).** Mantenha a numeração `X.Y` como ID do slide.
2. **Aplique o design system Lendário rigorosamente.** Se na dúvida entre uma escolha visual e outra, escolha a mais sóbria. Calma > brilho.
3. **Centralize verticalmente o conteúdo** em todos os slides, inclusive os com lista. Slides de tese ocupam a tela toda.
4. **Prompts mono ficam em blocos `<pre>` com tipografia JetBrains Mono**, fundo `--card`, borda 1px `--raised`. Texto em ouro velado claro `--primary-light` para destaques (palavras-chave do prompt). Use `font-size: 0.65em` para caber a mensagem inteira sem scroll.
5. **Cite Alan Nicolas com formato exato:** `Alan Nicolas, 2026-06-08 · 00:21:50` (timestamp do transcript). Citações em italic Source Serif, tamanho 0.85em, cor muted.
6. **Notas de instrutor** (presenter notes) vão como speaker notes do reveal.js / Keynote. Não aparecem na tela do aluno.
7. **Transições:** fade rápido entre slides do mesmo bloco. Sem flourish. Sem animações decorativas em texto.
8. **Slide de capa de bloco** usa o kicker do bloco, h1 grande Rajdhani 700, lead italic Source Serif 4. Os 4 capítulos de bloco têm a mesma estrutura visual para sinalizar "estamos em um novo bloco".

Total estimado: 82 slides incluindo telas de intervalo. Tempo médio de slide: 4 horas / 82 = ~3 minutos por slide. Compatível com aula ao vivo onde a instrutora fala enquanto a tela está parada.

---

**Fim do brief. Pronto para virar deck.**
