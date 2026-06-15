# Pesquisa, Concorrentes e Ofertas com IA

Aula ao vivo de 4 horas. Tese-mae: **pesquisa antes da oferta — o jogo que se ganha antes do anuncio.**

Material completo: roteiro de instrutora, slides apresentaveis, prompts copy-paste para Claude e ChatGPT, e quality gates pedagogicos. Tudo construido com o squad pedagogico do Synkra AIOX e branding Academia Lendaria.

---

## Sumario

- [Por que essa aula existe](#por-que-essa-aula-existe)
- [Como esse material foi criado](#como-esse-material-foi-criado)
- [Ferramentas e frameworks usados](#ferramentas-e-frameworks-usados)
- [O que tem neste repo](#o-que-tem-neste-repo)
- [Como usar (antes, durante, depois da aula)](#como-usar)
- [Estrutura pedagogica da aula](#estrutura-pedagogica-da-aula)
- [Fundamentacao didatica](#fundamentacao-didatica)
- [Quality gates e validacao](#quality-gates-e-validacao)
- [Stack de design e brand](#stack-de-design-e-brand)
- [Licenca](#licenca)

---

## Por que essa aula existe

A maioria das aulas de IA hoje ensina **ferramenta**. Cliente sai sabendo usar Claude ou GPT mas ainda erra a oferta, queima verba em anuncio e perde dinheiro. O problema nao e tecnico. E de ordem.

Esta aula inverte: ensina **metodo antes de ferramenta**. Como usar IA para descobrir dor real antes de empacotar oferta, testar mensagem com persona sintetica antes de gastar em midia, ler concorrente em 15 minutos para achar brecha, e empilhar valor ate o preco sumir.

A tese-mae **"pesquisa antes da oferta"** vem da pratica da Alan Nicolas (faturou mais de R$ 100 milhoes com este metodo) e foi decomposta em 4 blocos didaticos seguindo a Didatica Lendaria.

## Como esse material foi criado

### Workflow completo (Synkra AIOX)

1. **Visao global** definida com a instrutora: 4 pilares conceituais (vacuo + diagnostico, focus group sintetico, concorrentes, Grand Slam Offer)
2. **Squad pedagogico instalado** com 6 agentes especialistas (chief, curriculum architect, live class designer, quiz designer, demo prompt curator, pedagogical QA)
3. **Transcript da Alan Nicolas** (4h19min, 9.342 linhas VTT) mapeado por bloco com timestamps verbatim
4. **Decomposicao** da tese-mae em 4 blocos de 50 minutos, cada um com tese propria e maximo 3 conceitos novos
5. **Microestrutura** aplicada a cada bloco: teoria 15min + demo 20min + exercicio 10min + quiz oral 5min
6. **Geracao iterativa** dos artefatos: abertura piloto -> validacao -> batch dos 4 blocos -> fechamento
7. **Quality gate** deterministico em cada bloco (10 pontos + validator script)
8. **Roteiro mestre** com cronograma minuto-a-minuto, transicoes, contingencia
9. **HTMLs** gerados em 3 versoes (painel interativo, documento de leitura, slides reveal.js)
10. **Deck final** construido com Claude Design usando o Academia Lendaria Design System

### Princypios inegociaveis aplicados

- **Regra da uma coisa por bloco** — uma tese, no maximo 2-3 conceitos novos
- **GPS na abertura** — Goal (com hook nivel 4-5) + Position + Steps
- **Verbatim sobre invencao** — todo claim factual ancorado em fonte citavel (Artigo IV: No Invention)
- **Fato vs narrativa explicito** — numero documentado pela Alan vs narrativa apresentada como "o que ela conta"
- **Anti-slop rigido** — zero emoji, zero em-dash, zero tom de guru
- **Tom Academia Lendaria** — calma, autoridade, sem urgencia, sem gamificacao ansiosa

## Ferramentas e frameworks usados

### Producao do conteudo

| Ferramenta | Uso |
|---|---|
| **Claude Code** (Opus 4.7) | Orquestracao, geracao de roteiros, validacao deterministica |
| **Synkra AIOX** | Framework de squads e agentes pedagogicos |
| **Squad pedagogico** (proprio) | 6 agentes que decompoem tese, desenham microestrutura, validam |
| **Skill `cria-aula`** | Pipeline que materializa roteiro em markdown + HTML |
| **`validate-lesson.mjs`** | Validator deterministico (frontmatter, quiz YAML, anti-slop) |
| **Claude Design** | Geracao do deck visual final com Academia DS |

### Frameworks pedagogicos

| Framework | Origem | Aplicacao |
|---|---|---|
| **GPS (Goal-Position-Steps)** | Adriano de Marqui | Abertura de cada bloco com hook emocional nivel 4-5 |
| **Didatica Lendaria** | Academia Lendaria | Regra da uma coisa, 5 erros fatais, fato vs narrativa |
| **Microestrutura de bloco** | Sintese pedagogica | Teoria-demo-exercicio-quiz em 50 min |
| **Bloom Taxonomy** | Benjamin Bloom | Progressao remember → understand → apply → analyze → create |

### Insumo verbatim

Toda referencia a Alan Nicolas vem do transcript da aula dela em 2026-06-08 (4h19min, mapeado em `insumos/alan-nicolas-mapped.md` com timestamps exatos). Casos com numeros (R$ 20 mil/semana, R$ 200 mil de economia, R$ 300 mil perdidos por inverter ordem) sao **fato** documentado por ela. Frases sem fonte primaria sao apresentadas como **narrativa** ("o que ela conta").

## O que tem neste repo

```
.
├── 00-abertura.md                    Abertura de 15 minutos (GPS + mapa + acordo)
├── 01-vacuo-e-diagnostico.md         Bloco 1: minerar dor real com IA (50 min)
├── 02-focus-group-sintetico.md       Bloco 2: testar headline em 3 personas (50 min)
├── 03-concorrentes.md                Bloco 3: dossie de concorrente em 4 vetores (50 min)
├── 04-grand-slam-offer.md            Bloco 4: empilhar oferta com regra 10x (50 min)
├── 05-fechamento.md                  Fechamento: 4 frases para o quadro + acao 24h
│
├── ROTEIRO-MESTRE.md                 Roteiro completo da instrutora
├── ROTEIRO-MESTRE-painel.html        Copiloto interativo (timer, checklist, cronograma vivo)
├── ROTEIRO-MESTRE-documento.html     Versao leitura/impressao do roteiro
│
├── slides.html                       Slides reveal.js (primeira versao)
├── slides.md                         Brief de slides + brand para Claude Design
├── CoHort Pesquisa, concorrente e ofertaa/   Deck final do Claude Design (Academia DS)
│   ├── Pesquisa, Concorrentes e Ofertas com IA.html
│   ├── Pesquisa Concorrentes e Ofertas com IA - standalone.html  (1.6 MB, com tudo embarcado)
│   ├── slides-data.js                78 slides estruturados como JSON
│   ├── deck-stage.js                 web component customizado
│   └── _ds/                          Academia Design System completo
│
├── insumos/
│   └── alan-nicolas-mapped.md        Transcript Alan mapeado por bloco com timestamps
│
├── gates/
│   ├── gate-00-abertura.yaml
│   ├── gate-01-vacuo-e-diagnostico.yaml
│   ├── gate-02-focus-group-sintetico.yaml
│   ├── gate-03-concorrentes.yaml
│   ├── gate-04-grand-slam-offer.yaml
│   └── gate-05-fechamento.yaml       Quality gates pedagogicos (10 pontos por bloco)
│
├── README.md                         Este arquivo
└── .gitignore                        Exclui macOS, editores, VTTs originais
```

### O que cada tipo de arquivo entrega

- **Arquivos `0X-*.md` (blocos):** roteiro detalhado de cada bloco com microestrutura, prompts copy-paste Claude + Codex/GPT, exercicios em 2 niveis, quiz oral com rationale, Q&A guiado, Para o quadro, transicao
- **ROTEIRO-MESTRE.md:** cronograma minuto-a-minuto, transicoes entre blocos, checklist pre-aula (30 min antes), plano de contingencia, pos-aula
- **HTMLs:** versoes navegaveis para uso real durante a aula (painel ao vivo, slides para projetar, documento para imprimir)
- **insumos/alan-nicolas-mapped.md:** transcript da Alan segmentado por bloco com prompts verbatim, casos com numeros, analogias, citacoes timestampadas
- **gates/:** registro de auditoria do quality gate de cada bloco (verdict PASS/CONCERNS/FAIL, score 10/10, checklist 10 pontos)

## Como usar

### Antes da aula (preparacao, ~2 horas)

1. Leia `ROTEIRO-MESTRE.md` ou abra `ROTEIRO-MESTRE-documento.html` no navegador
2. Faca o ensaio de 1 hora descrito na Parte 5 do roteiro:
   - Ler abertura em voz alta cronometrada (alvo 15 min)
   - Rodar prompts da demo do Bloco 1 e Bloco 4 no Claude real
   - Validar que outputs ainda sao os esperados (modelos mudam)
   - Cronometrar transicao Bloco 3 → Bloco 4 (a unica sem intervalo)
3. Reler "Para o quadro" de cada bloco para ter na ponta da lingua

### 30 minutos antes da aula

1. Abrir `ROTEIRO-MESTRE-painel.html` em segunda tela
2. Usar a checklist clicavel (tecnico, conteudo, pessoal) — ela salva no localStorage
3. Ter o Claude aberto em janela limpa, **uma aba por bloco** (4 abas)
4. Para apresentar slides, abrir `CoHort Pesquisa, concorrente e ofertaa/Pesquisa, Concorrentes e Ofertas com IA.html` em tela cheia

### Durante a aula (4 horas)

1. **Painel ao vivo:** `ROTEIRO-MESTRE-painel.html` mostra cronograma vivo, timer iniciavel, bloco atual destacado, transicoes, Para o quadro, plano de contingencia
2. **Slides:** deck do Claude Design em tela cheia, navega com setas
3. **Demos:** os prompts copy-paste estao em cada bloco `.md` na secao "Demo ao vivo com Claude"
4. **Exercicios:** instrucoes em 2 niveis (iniciante e intermediario) em cada bloco
5. **Quiz oral:** 3 perguntas com cenario com defeito + feedback que ensina nos dois caminhos

### Apos a aula

Material para enviar para a turma:

- **Prompts paralelos Codex/GPT:** estao em cada bloco `.md`, secao "Material para envio pos-aula"
- **"Para o quadro" de cada bloco:** as 3 frases finais que cada aluno deve repetir uma semana depois
- **Link para `insumos/alan-nicolas-mapped.md`:** transcript Alan com timestamps verbatim para quem quiser ir fundo

## Estrutura pedagogica da aula

| Tempo | Bloco | Tese | Saida concreta |
|---|---|---|---|
| 00:00 - 00:15 | Abertura | Pesquisa antes da oferta | Acordo de presenca |
| 00:15 - 01:05 | Bloco 1: Vacuo + Diagnostico | Dor cara ja sangra no caixa antes da IA entrar | Frase verbatim do cliente |
| 01:05 - 01:15 | Intervalo planejado | — | — |
| 01:15 - 02:05 | Bloco 2: Focus Group Sintetico | Persona sintetica testa mensagem com custo zero | Headline testada em 3 personas |
| 02:05 - 02:15 | Intervalo planejado | — | — |
| 02:15 - 03:05 | Bloco 3: Concorrentes | Concorrente bem analisado mostra brecha em 4 vetores | Dossie de concorrente com brecha apontada |
| 03:05 - 03:55 | Bloco 4: Grand Slam Offer | Preco sem valor e ruido. Regra 10x | Oferta empilhada (promessa + garantia + ancoragem + nome) |
| 03:55 - 04:00 | Fechamento | A ordem do jogo | Acao concreta de 24 horas |

**Total:** 200 min de conteudo (4 × 50 min) + 20 min de intervalo (2 × 10) + 15 min de abertura + 5 min de fechamento = 240 min exatos.

## Fundamentacao didatica

### A regra das regras: uma coisa por bloco

Cada bloco ensina UMA tese, decomposta em NO MAXIMO 2-3 conceitos novos. Conceito = abstracao nova que o aluno precisa formar. Sub-conceitos do mesmo guarda-chuva contam como um. Sintomas de violacao: "e tambem" no resumo, quiz cobrindo assuntos desconexos, mais de 8 secoes.

### GPS na abertura

Toda abertura segue Goal → Position → Steps:

1. **Goal:** comeca pelo fim com hook descendo aos 5 porques (alvo: nivel 4-5 emocional)
2. **Position:** empatia explicita com onde o aluno esta agora, especifica ao perfil da turma
3. **Steps:** mapa do bloco (microestrutura)

### Microestrutura previsivel de bloco

```
00-15 min  Teoria      conceito + analogia + diagrama
15-35 min  Demo        instrutor executa em tela, prompts verbatim
35-45 min  Exercicio   aluno executa, 2 niveis (iniciante + intermediario)
45-50 min  Quiz oral   3 perguntas + Q&A guiado
```

Previsibilidade libera o instrutor para improvisar onde importa (demos e perguntas da plateia). Mudanca de modo a cada 15 min mantem atencao da plateia. Quiz no fim cria sintese acionavel imediata.

### Fato vs narrativa (separacao inegociavel)

Toda afirmacao no material e marcada:

- **FATO:** caso real, numero documentado pela Alan, com timestamp no transcript
- **NARRATIVA:** o que ela conta como referencial, sem fonte primaria. Apresentado como "Alan relata que..." ou em aside `> **Nota:**`

Esta separacao e auditavel. Nenhum claim factual e inventado.

## Quality gates e validacao

### Validator deterministico

Cada bloco `.md` foi validado por `validate-lesson.mjs` que verifica:

- Frontmatter YAML completo (course_slug, lesson_slug, title, summary, status, etc.)
- Status enum valido (draft, reviewed, published)
- Sem H1 no body (titulo vem do frontmatter)
- Sem em-dash em lugar nenhum (anti-slop hard ban)
- Sem emoji em lugar nenhum
- Sem HTML inline no body
- Cada quiz fence: YAML valido, 2-5 opcoes, exatamente 1 correta, feedback em todas
- Cada svg fence: viewBox presente, sem script/foreignObject, sem cores hex fixas (so var())
- C1 warning: aula com claim factual e sources vazio

Todos os 6 arquivos passaram com **exit 0**.

### Checklist pedagogico 10 pontos

Aplicado em cada bloco pelo agente `pedagogical-qa`:

1. GPS presente e substantivo
2. Regra da uma coisa respeitada
3. Microestrutura completa (teoria + demo + exercicio + quiz)
4. Para o quadro presente (2-3 frases memoraveis)
5. Fato vs narrativa explicito
6. Verbatim quando aplicavel (zero invencao quando ha fonte)
7. Demo executavel (prompts copy-paste prontos)
8. Exercicio em 2 niveis (turma mista)
9. Anti-slop rigido (zero emoji, em-dash, tom de guru)
10. Validator script passa

**Resultado:** 4 blocos centrais com 10/10 (PASS). Abertura e fechamento com 9/10 (CONCERNS-low pelo nao-uso de quiz, esperado por design).

## Stack de design e brand

### Academia Lendaria Design System

**Identidade visual:** "A Biblioteca a Meia-Luz". Uma sala quase escura onde a unica coisa que emite luz e uma lampada de ouro velado.

**Paleta:**
- Background: `#0A0A0A` (dark profundo)
- Surface card: `#0F0F0F`
- Raised: `#262626`
- Foreground: `#E5E5E5`
- Muted: `#999999`
- **Ouro Velado** (primary): `#C9B298` (champagne desaturado, deliberadamente velado)
- Ouro deep: `#8D7556`

**Tipografia:**
- Display: Rajdhani 600/700 (titulos)
- UI / chrome: Inter 400/600/700
- Leitura: Source Serif 4 400/600 (italic permitido)
- Mono: JetBrains Mono 400/700 (prompts)

**Regras inegociaveis:**

1. **Single Lamp Rule:** ouro velado em ≤10% de qualquer tela, sempre como luz, nunca como decoracao espalhada
2. **Tonal Depth Rule:** profundidade vem dos 3 planos near-black (#0A0A0A → #0F0F0F → #262626), nunca de sombra pesada
3. **Reading Measure Rule:** texto longo nunca acima de 70ch em Source Serif 4 a 21px / 1.6
4. **Light-Not-Lift:** se um elemento precisa destacar, sobe um plano tonal ou ganha o champagne glow

### Tom

Calma, autoridade, sobriedade. Sem urgencia, sem badges, sem gamificacao ansiosa, sem tom de guru. Voz de professor experiente falando com praticante inteligente: direto, denso, zero condescendencia.

## Licenca

Material proprietario da Franciane Lima. Uso restrito a instrutora e turmas autorizadas. Distribuicao requer autorizacao expressa.

Citacoes da Alan Nicolas sao verbatim de aula publica dela em 2026-06-08 e usadas com atribuicao explicita em todos os pontos do material.

---

**Construido com:** Synkra AIOX · Claude Code Opus 4.7 · Squad pedagogico · Skill cria-aula · Claude Design · Academia Lendaria Design System

**Versao:** 1.0 (aula piloto)

**Data de geracao:** 2026-06-14
