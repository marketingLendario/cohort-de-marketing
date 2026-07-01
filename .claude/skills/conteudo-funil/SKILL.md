---
name: conteudo-funil
description: "Modela os Reels virais de um criador de referência e gera roteiros de conteúdo na SUA voz (ou na voz da sua marca). Pipeline: coletar Reels com uma ferramenta de scraping de Instagram à sua escolha (vídeo + métricas reais) -> baixar -> transcrever -> analisar hooks/estrutura/viralização -> amostra -> gerar roteiros na sua voz -> exportar. Use quando quiser criar conteúdo orgânico modelado em um criador de referência, ou roteiros de Reels para o seu negócio a partir de uma referência do Instagram. Método de conteúdo baseado em modelagem de criadores (autoria Alan Nicolas)."
user_invocable: true
---

# Criação de Conteúdo Modelado (referência → a SUA voz)

Pega os Reels virais de um criador de referência e gera roteiros de conteúdo na SUA voz (ou na voz da sua marca), para o seu negócio.

> **Skill irmã:** `/criativos-funil` é para ADS pagos (Biblioteca de Anúncios). Esta é para CONTEÚDO ORGÂNICO (Reels de criador → conteúdo na sua voz).

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

## Gate de pré-requisito (execute ANTES de tudo)
O conteúdo puxa o nicho e a identidade das etapas anteriores. Primeiro descubra o projeto ativo (`ls projetos/`), depois confira:
```
ls projetos/{slug}/DESIGN.md projetos/{slug}/offerbook.md 2>/dev/null
```
- Se existir(em), leia deles o nicho, o avatar e a identidade visual (o carrossel usa o `projetos/{slug}/DESIGN.md`).
- Se FALTAR o `projetos/{slug}/DESIGN.md`, PARE e avise:
> Pra montar os carrosséis eu preciso do `projetos/{slug}/DESIGN.md` da sua marca (da skill `/design-md`). Rode `/design-md` primeiro e volte. (Os roteiros de Reels em texto eu consigo sem ele, mas o carrossel visual não.)

(ignore `projetos/{slug}/briefing-offerbook.md`)

> **Onde salvar:** os roteiros de Reels desta skill saem em **`projetos/{slug}/conteudo/`** e os carrosséis (HTML + PNG) em **`projetos/{slug}/carrossel/`**. Mesma pasta do projeto.

## Ativação
1. **Pergunte em qual plataforma pesquisar** (e PARE até responder): **Instagram**, **YouTube**, **TikTok** ou **X (Twitter)** — pode ser mais de uma. É onde a skill vai caçar os conteúdos **mais em alta** do tema. Se o usuário não souber, recomende pelo formato: Reels curtos → Instagram/TikTok; vídeo longo/tutorial → YouTube; thread/texto → X.
2. Defina qual criador de referência (@username) na(s) plataforma(s) escolhida(s) e qual a VOZ/alvo.
3. **Se não tiver um criador definido, SUGIRA você um** — proponha 1-3 criadores GRANDES que viralizam no nicho naquela plataforma (com o @ e o porquê de cada um). Não deixe a skill travar por falta de referência: você indica, é só confirmar ou trocar. Se já rodou o `/espiao-do-concorrente` na Aula 1, use esse dossiê como ponto de partida.
4. Confira a afinidade: a referência deve ser um player grande que viraliza, com afinidade temática com o seu nicho.
5. **Colete os conteúdos MAIS EM ALTA do tema** na(s) plataforma(s) — tanto **vídeos/Reels** quanto **carrosséis** que viralizaram (ordene por views/engajamento). **Mostre a lista pro usuário ESCOLHER** quais quer modelar (curadoria) — só depois gere os roteiros. Não gere o lote sem a escolha dele.

## Conteúdo por estágio de funil (TOPO · MEIO · FUNDO — obrigatório)

Todo lote de conteúdo cobre os **3 estágios do funil**, casados com o nível de consciência — não só topo:

- **TOPO (atração / consciência):** público amplo e frio. Fala da **dor/tema**, gera identificação e alcance — **sem vender**. Ex.: Reel com gancho de dor ("você também sente isso?").
- **MEIO (consideração / nutrição):** quem já sente a dor. Apresenta o **mecanismo/solução**, educa, quebra objeção. Ex.: carrossel "por que [tentativa comum] não resolve", o método explicado.
- **FUNDO (decisão / conversão):** quem já está quente. **Prova + oferta + CTA direto** pra página. Ex.: estudo de caso/depoimento, a oferta, "comenta X / link na bio".

Distribua os roteiros pelos 3 estágios e **marque cada um com o estágio (TOPO/MEIO/FUNDO)**. Um funil que só produz topo atrai e não converte; só fundo converte pouco porque não atrai.

## Carrossel: estrutura pra save/share/engajamento + render HTML → PNG

Carrossel não sai só como texto — ele é **montado em slides visuais** (formato Instagram 1080x1350), com o **design system do aluno** (o `DESIGN.md`), e **exportado como PNG** pronto pra postar.

### Estrutura que gera salvamento, compartilhamento e engajamento
- **Slide 1 (CAPA) — para o scroll:** hook forte (dor/curiosidade/promessa numerada), texto GRANDE, imagem/contraste que chama atenção. É o slide que decide se a pessoa desliza.
- **Slides 2–8 (CONTEÚDO) — geram SAVE:** valor real e consultável, **1 ideia por slide**, em formato de lista/passos/checklist ("os 6 sinais", "o passo a passo"). Conteúdo que a pessoa quer **guardar pra depois** = salvamento.
- **Slide de IDENTIFICAÇÃO — gera SHARE:** uma frase-espelho forte que a pessoa quer mandar pra uma amiga ("marca aquela amiga que…") ou que ela se orgulha de repostar.
- **Slide final (CTA) — gera ENGAJAMENTO:** pergunta aberta ("qual desses você sente?") + CTA claro (**comenta** X · **salva** pra não esquecer · **segue**).

### Passo obrigatório — Pesquisa de mercado do nicho (modele o que dá certo, NÃO invente o layout)

Antes de montar o carrossel, faça uma **pesquisa de mercado do nicho** pra modelar o formato que já converte — nunca invente o layout do zero:

1. **Identifique o nicho** — do briefing, do offerbook, ou da marca/estética do **`DESIGN.md`** do aluno.
2. **Pesquise os carrosséis que viralizam nesse nicho** — use **WebSearch** (criadores grandes do nicho, exemplos, o que gera save/share) + o **dossiê do `/espiao-do-concorrente`** (Aula 1), se existir.
3. **Extraia 3–5 modelos do nicho** — pra cada um: estrutura slide-a-slide, **onde a foto entra (e onde NÃO entra)**, tipografia e o hook que funciona. Salve num doc de referência (`modelos-carrossel-{nicho}.md`, nos 3 formatos).
4. **Escolha o modelo** que casa com o objetivo/estágio e **modele dele** — recriando com o tema do aluno e o design system (`DESIGN.md`).

**Padrão que costuma se repetir (confirme na pesquisa do SEU nicho):** nem todo slide precisa de imagem. Em nichos de **dor interna** (autoestima, identidade), os carrosséis que mais salvam/compartilham são de **texto forte**, com **foto só na capa e/ou no fecho** — a foto ancora emoção, o texto carrega a mensagem. Em nichos **visuais** (moda, decor, gastronomia) a foto pesa mais. Modelos comuns: **texto-forte/reflexão**, **listicle numerado (save)**, **foto-capa + texto (stop-scroll)**, **manifesto/quote (share)**.

Regra: use imagem **onde ela valoriza** (capa, prova, fecho) — não force foto em todo slide (polui e quebra o layout).

### Render HTML → PNG (com o design system)
1. Monte o carrossel como **1 arquivo HTML** com N slides — cada um uma `<section class="slide">` de **1080x1350**, aplicando os tokens do `DESIGN.md` (cores, fontes, logo). Legibilidade em 1º lugar (fonte grande, alto contraste).
2. Use **imagens que chamem atenção** (foto real do público, textura/elemento gráfico da marca) coerentes com o design system.
3. Exporte cada slide como PNG com `scripts/gerar_png.sh <arquivo>.html` (Chrome headless captura cada `.slide` em 1080x1350).
4. Saída: `projetos/{slug}/carrossel/slide-01.png … slide-0N.png`, numerados e prontos pra subir no Instagram.

## A SUA voz (serve para você e para a sua marca)
Escolha a voz conforme o tema da referência e o alvo. O conteúdo é gerado na SUA voz — a voz que representa você ou a sua marca. Calibre a voz em transcrições reais suas (falas, lives, vídeos que você já gravou), nunca em uma descrição genérica. Case o TEMA da referência com a voz/posicionamento certo (ex.: referência de mentalidade → tom mais reflexivo; referência de tráfego → tom mais técnico).

## Duas trilhas — escolha uma
Você monta o conteúdo por **uma** de duas trilhas (o resultado final é o mesmo: roteiros na sua voz modelados em quem já viraliza):

- **Trilha automática** (`## Execução (resumo)` abaixo) — usa scraper + whisper. Mais escala e amostra maior, mas exige rodar ferramenta.
- **Trilha manual** (`## Trilha manual (sem scraper nem whisper)`) — zero setup, você mesmo observa os Reels. Mais lenta e amostra menor, mas destrava quem não roda ferramenta.

Se você não é técnico ou a ferramenta travou, vá pela trilha manual — ela chega no mesmo lugar.

## Execução (resumo)
1. **Coletar** — rode um scraper de Reels com a ferramenta de scraping de Instagram da sua escolha (use a sua própria conta/token; traz vídeo + views/likes/caption) para o perfil do criador de referência.
2. **Baixar** os vídeos a partir das URLs coletadas (URLs do Instagram EXPIRAM rápido — baixe logo).
3. **Transcrever** com whisper (no idioma do criador).
4. **Analisar** — VIEWS = vencedor; identifique famílias de hook, estrutura e mecanismos de viralização. Consolide num arquivo de análise.
5. **Amostra** — gere 1 roteiro na SUA voz e revise ANTES de produzir o lote.
6. **Gerar** — cada roteiro modela 1 reel (hook + estrutura), com o tema adaptado ao seu negócio e a SUA voz calibrada na transcrição bruta das suas falas reais.
7. **Entregar** — salve os roteiros em `projetos/{slug}/conteudo/` (e, se quiser, exporte também para documento ou para o seu drive).

## Trilha manual (sem scraper nem whisper)
Alternativa completa à trilha automática, pensada pra quem não roda ferramenta. Em vez de raspar e transcrever, você observa os Reels na mão:

1. **Escolha 5–10 Reels** do criador de referência que você JÁ ASSISTE — abra o perfil dele no app do Instagram e selecione os que claramente performaram (muitos views/comentários).
2. **Para cada Reel, anote numa lista simples:**
   - (a) **nº de views** — o vencedor é o mais visto;
   - (b) **os primeiros 3 segundos falados** — o hook, palavra por palavra;
   - (c) **a estrutura em 1 linha** — como abre → como desenvolve → como fecha;
   - (d) **o CTA** — o que ele pede no fim (comenta, salva, link na bio…).
3. **Com os 5–10 anotados, extraia o PADRÃO** — a skill ajuda a achar o hook e a estrutura que se REPETEM nos mais vistos (não nos seus favoritos).
4. **Gere os roteiros na SUA voz** — a partir do padrão, igual à trilha automática (modela o hook + estrutura, adapta o tema ao seu negócio, calibra na sua voz real).

**Cuidado que decide a qualidade:** a amostra é menor e o processo é mais lento — então a qualidade do modelo depende de escolher Reels **realmente virais** (muitos views), não os que você gosta pessoalmente. Reel que você ama mas que ninguém viu não ensina nada sobre viralização.

## A SUA voz (NON-NEGOTIABLE)
- Gere o conteúdo na SUA voz real, calibrada em transcrições suas (não em descrição genérica).
- Mantenha o seu jeito de falar: vocativos, expressões e ritmo que são de fato seus.
- Inglês adaptado, nunca traduzido literal.
- Sem emoji, sem cara de IA (evite aforismos artificiais e o padrão "não é X, é Y").
- Frases curtas; hook nos primeiros 3 segundos; fecho consistente com o seu estilo.

## Gates
- Valide 1 amostra antes do lote.
- Checagem antes de exportar: voz consistente, sem emoji, sem cara de IA, contagem de roteiros conferida, português correto (ortografia, acento, pontuação).
- Roteiros de notícia: confirme o fato e a data em fontes confiáveis antes de gravar.

## Como funciona o método
O método (autoria Alan Nicolas) é simples e replicável: você escolhe um criador grande que já viralizou no seu tema, coleta os Reels com as métricas reais, descobre os padrões de hook e estrutura que fizeram cada vídeo bombar e, em vez de copiar, recria esses padrões com o SEU tema e a SUA voz. Modelar o que já deu certo encurta o caminho — você não inventa do zero, parte de um formato comprovado e o traduz para a sua linguagem.

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/conteudo-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
