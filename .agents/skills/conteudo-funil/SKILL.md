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

## Passo 0 — Checar insumos antes de rodar

Nenhum insumo trava esta skill, mas estes **recomendados** melhoram muito o resultado — leia os que existirem em `projetos/{slug}/`:

- `avatar.md` — a voz do público (dores e verbatim pra calibrar hooks e temas).
- `offerbook.md` — a oferta e o nicho (pra casar o conteúdo de FUNDO com o que se vende).
- `swipe/briefing-swipe-file.md` — padrões de hook já validados.
- `trends/` — ângulos com timing (o que está em alta agora).
- `voz-especialista.md` — extrato da FALA REAL do especialista (ver passo 2 da Ativação). É o insumo que decide se o roteiro soa como a pessoa ou como IA.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — os roteiros finais dos Reels/carrosséis na voz da marca. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

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

## Gate — Perfil do Projeto (ler ANTES de montar a curadoria)

Leia o **Perfil do Projeto** no topo do `projetos/{slug}/offerbook.md` — regra compartilhada em **`.claude/skills/_shared/perfil.md`**. Ele muda quem você modela:

- **Tipo = físico/varejo-local** → modele **NEGÓCIOS LOCAIS que bombam** no ramo/região (não criador viral nacional), com **ganchos de calendário / região / bairro** (data comemorativa local, evento da cidade, "aqui no [bairro]"). Não modele influencer nacional que não fala com o público do ponto.
- **Situação = afiliado** → modele **criadores que promovem produtos como o do produtor** (mesmo nicho/categoria); o **CTA = seu link de afiliado**, nunca uma oferta própria.
- **Guard (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é proibido enquadramento de "especialista/curso/mentoria" e "depoimento de aluno" nos roteiros — use voz do cliente / prova de uso / case.
- Sem Perfil no offerbook → use o padrão (Tipo = especialista, Voz = pessoa) e siga, nunca trave.

> **Antes de disparar a coleta:** LEIA o **§5 do `.claude/skills/_shared/entrega-padrao.md`** (processo carregando) — a coleta roda em segundo plano e o usuário nunca pode ficar no escuro; anuncie o que foi disparado e narre o andamento.

## Ativação
1. **Pergunte em qual plataforma pesquisar** (e PARE até responder): **Instagram**, **YouTube**, **TikTok**, **X (Twitter)** ou **LinkedIn** — pode ser mais de uma. É onde a skill vai caçar os conteúdos **mais em alta** do tema. **Na sequência, pergunte o FORMATO conforme a plataforma escolhida** (e gere SÓ o formato escolhido — nunca assuma). **As duas perguntas saem como OPÇÕES CLICÁVEIS (regra dura):** use a ferramenta de pergunta com opções (AskUserQuestion) — plataforma com múltipla escolha, formato com as opções da plataforma marcada. Nunca pergunta aberta em texto corrido: o aluno marca, não digita.
   - **Instagram** → carrossel, Reels, ou os dois
   - **YouTube** → roteiro de vídeo longo (e Shorts, se o aluno quiser)
   - **TikTok** → vídeo curto
   - **X (Twitter)** → post ou thread
   - **LinkedIn** → post de texto ou artigo

   Se o usuário não souber a plataforma, recomende pelo formato: Reels curtos → Instagram/TikTok; vídeo longo/tutorial → YouTube; texto → X/LinkedIn. O restante do pipeline (pesquisa dos mais em alta, curadoria, modelagem, voz) se aplica ao formato escolhido: post de X/LinkedIn modela post viral de X/LinkedIn, não Reel.
2. **DEFINA DE QUEM É A VOZ.** Se o `projetos/{slug}/offerbook.md` já registrou a **Voz da marca** (campo do Bloco 2: pessoa ou marca), USE essa escolha e não repergunte. Se não houver, PERGUNTE (voz nunca se assume). Duas opções válidas, nenhuma é o "certo" e a outra o remendo:
   - **(a) De uma pessoa** (especialista, fundador, mentor, médica) → peça a FALA REAL dela: "Me manda algo dessa pessoa falando de verdade: vídeo, áudio, transcrição de live/reunião, áudios de WhatsApp, um Reel antigo. Qualquer formato serve." Se vier áudio/vídeo, transcreva (ver **Transcrição de áudio**). Extraia e salve em **`projetos/{slug}/voz-especialista.md`**: vocativos e bordões reais, ritmo, expressões, jeito de abrir/fechar, e o que a pessoa NUNCA diria. (Quem roda a skill nem sempre é essa pessoa: pode ser o marketing pedindo o material do dono.) **Sem material:** siga com a voz da marca (opção b) e marque a calibração fina como pendente.
   - **(b) Da marca** (quando o conteúdo é da marca/produto/app, não de um rosto, OU quando a marca quer falar na própria persona mesmo tendo um especialista) → calibre na **voz da marca** já definida no `projetos/{slug}/copy.md` (Big Idea, mecanismos, léxico do avatar) e no `DESIGN.md`, complementada pela **voz do cliente** (depoimentos/reviews reais, quando existirem). Salve o extrato em **`projetos/{slug}/voz-marca.md`** com o mesmo formato (bordões, ritmo, o que a marca nunca diria). Não precisa de fala de pessoa nenhuma.
   Registre qual voz foi escolhida no topo dos roteiros. Todo roteiro calibra na voz escolhida (nunca em descrição genérica).
3. **Levante os TOP 5 criadores do ramo** na(s) plataforma(s) escolhida(s) — não peça 1 referência e pare: pesquise (WebSearch + o dossiê do `/espiao-do-concorrente`, se existir) e monte a lista dos 5 maiores do nicho, cada um com: **@handle VERIFICADO** (nunca inventar @; se não confirmar, não lista), **porte aproximado** (seguidores do snippet, ou "não obtido"), **posicionamento em 1 linha**, **2-4 conteúdos em alta** (hook literal + link + métrica real ou "métrica não obtida" — nunca inventar número), **por que modelar** e **o risco** (ex.: ângulo hype que contradiz uma marca anti-hype). Se o usuário JÁ tiver um @ em mente, inclua-o na lista e complete até 5.
4. **Apresente a lista de curadoria pro usuário SELECIONAR** — em HTML clicável (cards por criador, com os conteúdos de cada um marcáveis), permitindo escolher **um ou VÁRIOS criadores** e quais conteúdos específicos modelar. Só depois da seleção dele siga pra coleta profunda/roteiros.
5. Confira a afinidade dos selecionados: player grande que viraliza, com afinidade temática com o nicho E com a voz da marca (um criador enorme do ângulo errado modela o hook, nunca o posicionamento).
6. **Colete os conteúdos MAIS EM ALTA do tema** (via API do Apify — ver Execução, passo 1) na(s) plataforma(s) — tanto **vídeos/Reels** quanto **carrosséis** que viralizaram (ordene por views/engajamento). **Mostre a lista pro usuário ESCOLHER** quais quer modelar (curadoria) — só depois gere os roteiros. Não gere o lote sem a escolha dele.

## Transcrição de áudio — como a skill transcreve

A IA não escuta áudio sozinha; a transcrição roda por ferramenta local, via terminal. A skill faz o check e escolhe o caminho:

1. **Verifique o que existe:** `which whisper-cli` (whisper.cpp) e `pip3 show mlx-whisper` (Mac Apple Silicon). Tendo qualquer um + `ffmpeg`, a skill transcreve sozinha:
   - converter se preciso: `ffmpeg -i entrada.(mp4|ogg|m4a) -ar 16000 audio.wav`
   - whisper.cpp: `whisper-cli -m <modelo ggml> -l pt -f audio.wav -otxt` (na 1ª vez, baixar um modelo: `ggml-large-v3-turbo` do repositório do whisper.cpp)
   - mlx-whisper: `mlx_whisper audio.wav --language pt` (baixa o modelo na 1ª execução)
2. **Nada instalado?** Ofereça o setup e PERGUNTE se o aluno quer instalar. macOS: `brew install whisper-cpp ffmpeg` (+ `pip install mlx-whisper` no Apple Silicon). Windows: `winget install ffmpeg` + `pip install faster-whisper` (rode com `python -m faster_whisper` ou script equivalente). Se não quiser instalar nada, o fallback do WhatsApp (segurar a mensagem → transcrever → colar) resolve na hora.
3. **Aluno não técnico / sem setup?** Fallbacks sem instalar nada: o próprio **WhatsApp transcreve áudio** (segurar a mensagem > transcrever; copiar e colar aqui); ditado/notas do celular; ou colar a transcrição de qualquer ferramenta que já use. O que importa é a FALA REAL chegar em texto — a origem não importa.

## Ganchos e retenção (obrigatório — roteiro sem gancho não sai)

Modelar a estrutura da referência NÃO basta. Todo roteiro passa por engenharia de gancho e retenção antes de ser entregue:

- **Estrutura "jeito errado, jeito certo"** (Formato Viral, Hanah Franklin): 1 Conflito (expectativa vs realidade) → 2 Jeito errado (como o público faz hoje) → 3 Descoberta → 4 Jeito certo (o que você ensina) → 5 Mudança. Testada em todos os nichos; posiciona o seu método como a moral da história.
- **Contraste de emoções** (Hanah): falar mal antes de falar bem; duas opiniões contrárias; ou fazer pensar uma coisa e revelar outra (a forma elegante). Roteiro em linha reta entedia; contraste vira montanha-russa.
- **Loop aberto:** o hook PROMETE e retém o payoff pro final ("fica até o final", "o que ninguém mostra", "os primeiros 10 minutos ninguém mostra"). A capa/hook NUNCA entrega a resposta.
- **No carrossel, loop SLIDE A SLIDE:** todo slide termina puxando o próximo (mini-teaser entre os itens do listicle: "o 2 é onde você perde venda sem ver"). Capa = conflito espelho na língua do avatar; clímax retido pro fim.
- **Moldes validados de dono:** opinião contrarian + história com número REAL + tese de mentalidade no fecho. E **comment-gate** ("comenta PALAVRA") SÓ quando a entrega é um artefato específico e desejável (diagnóstico, skill, guia), com DM automatizada ou manual.

**Gate antes de entregar o lote, roteiro a roteiro:** tem conflito ou loop aberto nos 3 primeiros segundos? tem contraste? o carrossel puxa slide a slide? o CTA casa com o estágio E é UM só, no slide final? Se algum falhar, reescreva ANTES de mostrar. E declare no entregável qual mecânica cada roteiro usa.

## Conteúdo por estágio de funil (TOPO · MEIO · FUNDO — obrigatório)

Todo lote de conteúdo cobre os **3 estágios do funil**, casados com o nível de consciência — não só topo:

- **TOPO (atração / consciência):** público amplo e frio. Fala da **dor/tema**, gera identificação e alcance — **sem vender**. Ex.: Reel com gancho de dor ("você também sente isso?").
- **MEIO (consideração / nutrição):** quem já sente a dor. Apresenta o **mecanismo/solução**, educa, quebra objeção. Ex.: carrossel "por que [tentativa comum] não resolve", o método explicado.
- **FUNDO (decisão / conversão):** quem já está quente. **Prova + oferta + CTA direto** pra página. Ex.: estudo de caso/depoimento, a oferta, "comenta X / link na bio".

Distribua os roteiros pelos 3 estágios e **marque cada um com o estágio (TOPO/MEIO/FUNDO)**. Um funil que só produz topo atrai e não converte; só fundo converte pouco porque não atrai.

> **3 de cada nível, em TODO formato (regra dura).** Seja qual for o formato escolhido (carrossel, Reels, vídeo longo, vídeo curto, post, thread, artigo), o lote é **3 peças de CADA estágio — 3 TOPO + 3 MEIO + 3 FUNDO = 9 peças**. Cada uma com ângulo e hook próprios (nunca o mesmo hook reaproveitado nos 3 do estágio): varie a mecânica (listicle, jeito errado/jeito certo, narrativo). No carrossel, as 9 viram PNGs na mesma galeria do Book, agrupadas por estágio; nos formatos de roteiro/texto, as 9 saem no documento e no índice, agrupadas por estágio. **A contagem é regra interna:** não aparece nos rótulos das opções (a opção é só "Carrossel", "Reels"…), você simplesmente entrega o lote completo.
>
> **Checkpoint de pauta ANTES de gerar (regra dura).** NUNCA saia gerando as 9 direto. Primeiro apresente a **pauta do lote**: as 9 propostas numa lista numerada com estágio + hook + mecânica de cada uma, e pergunte quais aprovar, trocar ou cortar — o dono marca e você só gera o que ele aprovou. Aprovada a pauta, **gere a peça 1 e MOSTRE** (carrossel: abra a galeria com ele renderizado; roteiro/texto: mostre a primeira pronta) antes de rodar o resto: o dono valida numa peça só; se pedir ajuste, corrija ANTES de gerar as outras 8. Lote inteiro sem validar a primeira = retrabalho em 9.

## Carrossel: estrutura pra save/share/engajamento + render HTML → PNG

Carrossel não sai só como texto — ele é **montado em slides visuais** (formato Instagram 1080x1350), com o **design system do aluno** (o `DESIGN.md`), e **exportado como PNG** pronto pra postar.

### Estrutura que gera salvamento, compartilhamento e engajamento
- **Slide 1 (CAPA) — para o scroll:** hook forte (dor/curiosidade/promessa numerada), texto GRANDE, imagem/contraste que chama atenção. É o slide que decide se a pessoa desliza.
- **Slides 2–8 (CONTEÚDO) — geram SAVE:** valor real e consultável, **1 ideia por slide**, em formato de lista/passos/checklist ("os 6 sinais", "o passo a passo"). Conteúdo que a pessoa quer **guardar pra depois** = salvamento.
- **Slide de IDENTIFICAÇÃO — gera SHARE:** uma frase-espelho forte que a pessoa quer mandar pra uma amiga ("marca aquela amiga que…") ou que ela se orgulha de repostar.
- **Slide final (CTA) — gera ENGAJAMENTO:** **UM CTA só, e só neste slide** (nenhum outro slide pede ação). Nunca empilhe pedidos ("comenta + salva + segue" = o lead não faz nenhum). VOCÊ escolhe o único CTA pelo nível de consciência do público e pelo estágio do funil de conteúdo: **TOPO** (nível 5-4, descoberta) → seguir ou comentar uma palavra (alcance/conversa); **MEIO** (nutrição) → salvar ("salva pra não esquecer") ou comentar a palavra-chave que dispara o material; **FUNDO** (decisão, quente) → CTA direto pra oferta: link na bio, DM, página, ou **"comenta [PALAVRA]"** com DM (automática ou manual) entregando o link da oferta — o comment-gate vale no fundo quando a entrega é específica e desejável, e costuma converter mais que link na bio (comentário alimenta o algoritmo, DM abre conversa 1-a-1). Pergunta aberta pode acompanhar o CTA de topo/meio como gancho de comentário, mas o pedido de ação é um só. Declare no entregável qual CTA escolheu e por quê.

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
5. **Galeria no Book (obrigatório — PNG nunca fica invisível):** todo lote de PNGs gerado GANHA uma galeria **`projetos/{slug}/carrossel/index.html`** (identidade do `DESIGN.md`, link fixo "← Book do Funil" no topo) mostrando TODOS os PNGs lado a lado, com o papel de cada slide (capa · itens · espelho · CTA) e a legenda sugerida do post. O card do carrossel no **Book do Funil aponta pra essa galeria**, nunca pra um slide HTML solto nem pra pasta — o dono precisa VER os PNGs com 1 clique a partir do Book. Novos carrosséis (C2, C3…) entram na MESMA galeria, em seções, em vez de criar galerias paralelas. **Download em 1 clique (obrigatório):** a galeria tem um botão **"Baixar todos (.zip)"** no topo — a skill gera os `.zip` junto com a galeria e os REGENERA a cada lote novo. **Atenção ao comando de zip:** o zip do LOTE INTEIRO tem que PRESERVAR as subpastas dos carrosséis (`cd <pasta> && zip -r lote.zip t1 t2 … f3 -i '*.png'`) — NUNCA usar `zip -j` (achatar caminhos) no lote inteiro, porque os slides têm nomes repetidos entre carrosséis (`slide-01.png` em t1, m1, f1…) e o `-j` falha com "cannot repeat names in zip file". Cada carrossel também ganha o SEU zip próprio (`cd <carrossel> && zip <slug>.zip slide-*.png` — aí flat é seguro, os nomes não repetem dentro de um só carrossel). E cada PNG tem seu botão **"Baixar PNG"** (`<a href="arquivo.png" download>`). O dono nunca precisa caçar arquivo em pasta: é abrir a galeria e clicar. (Sem `zip` na máquina: o botão do topo dispara o download sequencial de todos os PNGs via JS com `<a download>` — e os zips **por carrossel** também caem pro mesmo download sequencial via JS. No Windows 10+ existe o `tar` nativo como alternativa ao zip: `tar -a -c -f lote.zip *.png`.) **Formato da galeria (regra dura — padrão aprovado pela dona):** peças agrupadas por estágio (TOPO · MEIO · FUNDO), cada carrossel/lote como um cartão com título, CTA e nº de slides + dois botões: **"Baixar este carrossel (.zip)"** e **"Ver os N slides"**. Clicar em "Ver os N slides" EXPANDE a seção na própria página (pra baixo), mostrando TODOS os slides lado a lado, numerados, cada um com seu **"Baixar"**, e o botão vira **"Fechar"**. NUNCA slider lateral (Anterior/Próximo), lightbox nem página separada: tudo expande e fecha na mesma página. No topo da galeria, **"Baixar o lote inteiro (.zip)"**. Imagem não é botão: toda ação tem botão com rótulo. **Lote novo nunca engole lote antigo:** regenerar carrossel/banner cria uma SEÇÃO NOVA na galeria (v2, com data), com os PNGs novos em subpasta própria (`v2/slide-01.png…`) — os arquivos e a seção do lote anterior ficam exatamente como estavam. Cada seção de versão antiga tem no cabeçalho o botão **✕ "Excluir esta versão"** — só ESCONDE a seção da galeria (confirmação *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* + link **"Mostrar versões ocultas (N)"** no rodapé pra reverter, via `localStorage`); os PNGs ficam intocados no disco. Apagar de verdade só com ordem explícita do dono no chat.

## A SUA voz (serve para você e para a sua marca)
Escolha a voz conforme o tema da referência e o alvo. O conteúdo é gerado na SUA voz — a voz que representa você ou a sua marca. Calibre a voz em transcrições reais suas (falas, lives, vídeos que você já gravou), nunca em uma descrição genérica. Case o TEMA da referência com a voz/posicionamento certo (ex.: referência de mentalidade → tom mais reflexivo; referência de tráfego → tom mais técnico).

## Duas trilhas — escolha uma
Você monta o conteúdo por **uma** de duas trilhas (o resultado final é o mesmo: roteiros na sua voz modelados em quem já viraliza):

- **Trilha automática** (`## Execução (resumo)` abaixo) — usa scraper + whisper. Mais escala e amostra maior, mas exige rodar ferramenta.
- **Trilha manual** (`## Trilha manual (sem scraper nem whisper)`) — zero setup, você mesmo observa os Reels. Mais lenta e amostra menor, mas destrava quem não roda ferramenta.

Se você não é técnico ou a ferramenta travou, vá pela trilha manual — ela chega no mesmo lugar.

## Execução (resumo)
1. **Coletar — acione o Apify via API REST primeiro** (não é MCP; é a API, com o SEU token). Use o script da própria skill, `scripts/apify_scraper.py`, que chama `api.apify.com` direto:
   - Check do token: `APIFY_API_TOKEN` (ou `APIFY_API_KEY` — os dois nomes valem) no `.env` ou no ambiente. Sem token: conta gratuita em apify.com > Settings > API tokens.
   - Exemplos (rode com `python scripts/apify_scraper.py`; se `python` não existir, tente `python3` no Mac/Linux ou `py` no Windows): `python scripts/apify_scraper.py instagram-profile "https://www.instagram.com/perfil/" --limit 20` · `tiktok-hashtag "tema" --limit 20` · genérico: `run apify~instagram-scraper --input '{...}'`
   - Limite ENXUTO (10-30 itens): coleta pequena gasta menos cota.
   - A saída é JSON com views, likes, caption, URL e data — leia e analise.

   **Se a cota estourar** ("Monthly usage hard limit exceeded"): AVISE o usuário NA HORA (regra do processo carregando), diga quando tende a renovar (limite é mensal) e caia pros fallbacks SEM travar: **YouTube** raspa direto da página pública (views reais, sem Apify); **Threads** é aberto via fetch; **Instagram/TikTok sem Apify** = hooks via busca (sem métrica, rotule "métrica não obtida") ou trilha manual. Nunca invente número no lugar do que não coletou.
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

## A voz (NON-NEGOTIABLE)
- Gere o conteúdo na voz ESCOLHIDA no passo 2 da Ativação: **voz de uma pessoa** (calibrada em fala real, `voz-especialista.md`) OU **voz da marca** (calibrada no `copy.md`/`DESIGN.md` + voz do cliente, `voz-marca.md`). Nunca de descrição genérica. Se nenhuma voz foi escolhida/calibrada, a skill PERGUNTA antes de gerar o lote. Marca/produto/app sem rosto = voz da marca é o caminho normal, não uma exceção.
- Mantenha o seu jeito de falar: vocativos, expressões e ritmo que são de fato seus.
- Inglês adaptado, nunca traduzido literal.
- Sem emoji, sem cara de IA (evite aforismos artificiais e o padrão "não é X, é Y").
- Frases curtas; hook nos primeiros 3 segundos; fecho consistente com o seu estilo.

## Gates
- Valide 1 amostra antes do lote.
- **Honestidade de dados:** nunca invente número (views, likes), depoimento ou case — métricas vêm da coleta real; prova vem da pesquisa e do offerbook.
- Checagem antes de exportar: voz consistente, sem emoji, sem cara de IA, contagem de roteiros conferida, português correto (ortografia, acento, pontuação).
- Roteiros de notícia: confirme o fato e a data em fontes confiáveis antes de gravar.

## Como funciona o método
O método (autoria Alan Nicolas) é simples e replicável: você escolhe um criador grande que já viralizou no seu tema, coleta os Reels com as métricas reais, descobre os padrões de hook e estrutura que fizeram cada vídeo bombar e, em vez de copiar, recria esses padrões com o SEU tema e a SUA voz. Modelar o que já deu certo encurta o caminho — você não inventa do zero, parte de um formato comprovado e o traduz para a sua linguagem.

---

## Processo carregando — narrar o andamento (obrigatório em coleta longa)

Coletas e pesquisas desta skill rodam em segundo plano e podem levar vários minutos. O usuário NUNCA pode ficar no escuro sem saber o que está acontecendo. Ao disparar qualquer coleta/pesquisa:

1. **Anuncie o que foi disparado**, em linguagem de progresso: quantos coletores, o que CADA um está fazendo (ex.: "coletor 1/2: conteúdos do @fulano no Instagram · coletor 2/2: top criadores do nicho").
2. **Dê a estimativa honesta de tempo** (ex.: "isso leva de 5 a 10 minutos; te aviso a cada retorno").
3. **Avise a cada retorno parcial**: "coletor 1 de 2 voltou: N itens" — nunca silêncio até o fim.
4. **Estourou a estimativa?** Atualize o usuário proativamente ("o coletor X está demorando por [motivo]; opções: esperar ou seguir com o parcial").
5. **Sempre ofereça o atalho**: seguir com o material parcial já disponível enquanto o resto roda — entregar algo revisável cedo vale mais que esperar o completo.


## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).

**Ferramentas específicas desta skill:**

- **Apify (API REST, com o SEU token)** via `scripts/apify_scraper.py` (só stdlib do Python; NÃO é MCP, chama `api.apify.com` direto) — coleta com métrica real (Instagram/TikTok/X). É CENTRAL, nunca opcional: sem a chave no `.env` (aceita `APIFY_API_TOKEN` ou `APIFY_API_KEY`), PARE e explique em linguagem de leigo como pegar o token (conta gratuita em apify.com > Settings > API tokens > copiar > colar no `.env` como `APIFY_API_TOKEN=...`). O fallback (YouTube público raspado, Threads via fetch, trilha manual, "métrica não obtida") existe SÓ quando a cota mensal estoura ("Monthly usage hard limit exceeded"), avisando na hora — nunca pra pular o setup. Nunca invente número.
- **Transcrição de áudio (whisper)** — a IA NÃO escuta áudio sozinha. Check: `which whisper-cli` ou `pip3 show mlx-whisper` (+ `which ffmpeg` pra converter). Tendo, transcreva pelo terminal (`whisper-cli -m <modelo> -l pt -f audio.wav -otxt` ou `mlx_whisper audio.wav --language pt`). Faltando: ofereça o setup e PERGUNTE antes de instalar — macOS `brew install whisper-cpp ffmpeg` (+ `pip install mlx-whisper` no Apple Silicon); Windows `winget install ffmpeg` + `pip install faster-whisper` (rode com `python -m faster_whisper` ou script equivalente). **Fallback sem instalar nada:** o WhatsApp transcreve áudio (segurar a mensagem > transcrever > colar aqui), ditado do celular, ou colar transcrição de qualquer ferramenta. O que importa é a fala real chegar em texto.
- **Chrome (headless)** via `scripts/gerar_png.sh` — exporta os slides do carrossel em PNG 1080x1350. **Fallback:** abrir o HTML no navegador e capturar cada slide (screenshot), ou postar direto do HTML aberto.

> **N14 — Conteúdo é ciclo, não peça única (regra dura no fecho).** Conteúdo orgânico se renova todo mês/lote — o fecho SEMPRE instrui o próximo ciclo: *"Pro próximo mês (ou próximo lote), rode `/conteudo-funil` DE NOVO NESTA MESMA pasta (`projetos/{slug}/`) usando os DADOS DE PERFORMANCE do lote anterior (o que de fato salvou/compartilhou/converteu) MAIS uma varredura nova dos criadores em alta."* O lote novo entra como versão nova na mesma galeria (nunca engole o antigo, conforme a regra de recriar). E ofereça o passo de refino guiado pela realidade: *"Me cola a devolutiva do especialista (o que ele achou do lote — o que soou como ele, o que não soou, o que colou com o público) que eu refino os roteiros na fala real dele e recalibro a `voz-especialista.md`."* Assim cada ciclo fica mais afiado que o anterior: os dados dizem o que repetir, a devolutiva ajusta a voz.
