---
name: criativos-funil
description: "Espiona a Biblioteca de Anúncios de um concorrente e transforma os ads vencedores em criativos prontos na SUA voz: roteiros de vídeo E banners estáticos (HTML -> PNG na identidade do DESIGN.md, por rede e formato: feed 4:5, stories 9:16, quadrado 1:1). Pipeline: perguntar rede/tipo/formato/escopo -> coletar ads ativos -> baixar vídeos -> transcrever -> analisar (vencedores/hooks/mecanismo) -> gerar roteiros e banners modelados -> calibrar voz -> entregar com galeria no Book. Use quando quiser modelar/espionar ads de um concorrente, gerar criativos em massa para uma campanha, ou criar banners de anúncio na identidade da marca."
user_invocable: true
---

# Espião de Ads → Criativos Modelados

Pipeline que vai de "modelar os ads de um concorrente" até "roteiros de ad prontos, na SUA voz, na sua pasta de entrega".

Método baseado no **método do Alan Nicolas**: o concorrente já validou o que funciona (com o dinheiro dele). Você espiona o que está no ar há mais tempo, extrai a estrutura por trás do sucesso e remodela na sua própria voz — sem copiar, e sem reinventar a roda do zero.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Onde salvar:** os roteiros de criativo desta skill saem na subpasta **`projetos/{slug}/criativos/`**.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o projeto ativo e confira que os arquivos existem dentro dele:

```
# 1. Descubra o projeto ativo:
ls projetos/ 2>/dev/null
# 2. Confira os arquivos dentro do projeto ativo:
ls projetos/{slug}/offerbook.md projetos/{slug}/DESIGN.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (mecanismo único, produto, vilão/inimigo) do `projetos/{slug}/offerbook.md` e a identidade visual (cores, fontes, tom) do `projetos/{slug}/DESIGN.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra gerar os criativos eu preciso do `projetos/{slug}/offerbook.md` (da skill `/offerbook`) e do `projetos/{slug}/DESIGN.md` (da skill `/design-md`). Rode `/offerbook` e `/design-md` primeiro; quando os dois existirem, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

## Passo 0 — Checar insumos antes de rodar

Além dos obrigatórios do gate acima (`offerbook.md` e `DESIGN.md`), confira em `projetos/{slug}/` os insumos recomendados da Fase 1:

- `swipe/briefing-swipe-file.md` — padrões de criativo winners já organizados (da `/swipe-file`).
- `espiao/dossie-*.md` — os ads do concorrente já dissecados (da `/espiao-do-concorrente`).
- `trends/variacoes-teste-*.md` — ângulos com o timing certo (da `/trend-hunting`).

Leia os que existirem e use-os na análise e nos roteiros. Se faltar algum, avise o que falta (e qual skill gera) e PERGUNTE se o aluno quer rodar antes ou seguir sem.

## Gate — Perfil do Projeto (ler ANTES de gerar qualquer criativo)

Leia o **Perfil do Projeto** no topo do `projetos/{slug}/offerbook.md` — regra compartilhada em **`.claude/skills/_shared/perfil.md`**. Ele muda o criativo em 3 ramos:

- **Tipo = físico/varejo-local** → criativo de **raio geográfico** e **prova de bairro** (o ponto, a região, quem já é cliente ali); o CTA é **"Chame no WhatsApp"** / traçar rota / "vem aqui na loja", **nunca só "inscreva-se"** de funil online.
- **Nicho regulado = saúde/médico** → ao modelar o concorrente, **DESCARTE** o que a regra do conselho veta: **antes/depois**, **depoimento de paciente** e **preço/desconto de procedimento**. Extraia só a **estrutura** e o **gancho educativo** (o formato do ad, não a prova proibida). Autoridade do profissional habilitado usa a credencial (CRM/CRO etc.), nunca promessa de resultado.
- **Situação = afiliado (Modo Afiliado)** → você modela os ads **do PRODUTOR e de outros afiliados** do mesmo produto; o CTA = **seu link de afiliado** (nunca oferta/checkout próprios). Neste modo, o **Gate de pré-requisito aceita o Registro da Oferta do Produtor no lugar do `offerbook.md`** (produto, promessa, página oficial, comissão) — não trave por falta de offerbook próprio.
- **Guard (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é proibido enquadramento de "especialista/curso/mentoria" e "depoimento de aluno" nos criativos — use voz do cliente / prova de uso / case.
- Sem Perfil no offerbook → use o padrão (Tipo = especialista, Voz = pessoa) e siga, nunca trave.

> **Antes de disparar a coleta:** LEIA o **§5 do `.claude/skills/_shared/entrega-padrao.md`** (processo carregando) — a coleta roda em segundo plano e o usuário nunca pode ficar no escuro; anuncie o que foi disparado e narre o andamento.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — os roteiros finais dos criativos, com hooks do banco. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

---

## Ativação

1. Defina: qual concorrente (o `page_id` dele na Biblioteca de Anúncios do Meta) e qual a SUA oferta/campanha de destino.
2. **Passo 0 obrigatório:** olhe a página/fonte REAL da sua oferta antes de escrever qualquer roteiro. Nunca invente papéis, datas ou CTA de memória — confira no destino real.
3. **Perguntas obrigatórias ANTES de gerar qualquer peça (e PARE até responder — igual à Ativação da `/conteudo-funil`):**
   - **Rede/canal:** Meta (Instagram + Facebook), LinkedIn, Google Display, TikTok Ads? (pode ser mais de uma; cada rede muda formato, compliance e CTA)
   - **Tipo de peça:** só roteiros de vídeo, só banners estáticos, ou ambos?
   - **Formatos/posicionamentos:** feed 4:5 (1080x1350) · stories/reels 9:16 (1080x1920) · quadrado 1:1 (1080x1080) · kit Display (se Google)?
   - **Escopo:** quantas peças / quais estruturas do mapa viram criativo?

   Nunca gerar peça visual sem essas respostas. Depois delas, continua valendo o gate de **1 amostra antes do lote**.

## Execução

1. **Coletar** — pegue os anúncios ativos do concorrente na Biblioteca de Anúncios do Meta. A longevidade do anúncio (há quanto tempo está no ar) é o melhor sinal de que é um vencedor.
2. **Baixar** os vídeos. As URLs de mídia do Facebook/Meta EXPIRAM rápido — baixe assim que coletar.
3. **Transcrever** os vídeos (ex.: Whisper). **A fala é o ouro**, não a copy do post — é o roteiro falado que converte.
4. **Analisar** — separe os vencedores (longevidade), mapeie o mecanismo único da oferta, as famílias de hook usadas e os "vilões"/inimigos que o anúncio ataca. Registre tudo num documento de análise.
5. **Validar 1 amostra** antes do batch. Gere UM roteiro, você revisa, e só depois escala para o lote inteiro.
6. **Gerar** os roteiros — variando pelo menos 8 estruturas vencedoras diferentes que você identificou na análise.
7. **Calibrar a voz** — na voz ESCOLHIDA (mesma lógica da `/conteudo-funil`): se o `projetos/{slug}/offerbook.md` já registrou a **Voz da marca** (Bloco 2: pessoa ou marca), use essa; senão pergunte. Duas opções válidas: **(a) de uma pessoa** (calibra em fala real dela, `voz-especialista.md`) OU **(b) da marca** (calibra no `copy.md`/`DESIGN.md` + voz do cliente, `voz-marca.md` — o caminho normal pra produto/app/marca sem rosto, e válido mesmo quando há especialista). Nunca voz genérica. Sem material da pessoa (opção a), caia na voz da marca e marque a calibração fina como pendente. (Os banners estáticos já saem na voz da marca por padrão, porque o texto é hook do `copy.md`.)
8. **Entregar** — exporte os roteiros (ex.: Markdown → documento) e suba na sua pasta de entrega.

**Material visual usa o `DESIGN.md` da marca.** Se você renderizar os roteiros/criativos como material visual (HTML, PDF, PNG, slides), gere-o JÁ com os tokens do `projetos/{slug}/DESIGN.md` — cores, fontes, borda/raio, tamanho, logo. NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.

## Banners estáticos (HTML → PNG, na identidade da marca)

Além dos roteiros de vídeo, a skill produz **banners estáticos de ad** — pelo mesmo pipeline do carrossel da `/conteudo-funil`: HTML com os tokens do `DESIGN.md` → PNG via Chrome headless. Regras:

1. **Só depois das perguntas da Ativação** (rede, tipo, formatos, escopo) e com **1 amostra aprovada antes do lote**.
2. **Um HTML por banner**, com a dimensão exata do posicionamento fixada no `html,body` (`width/height` + `overflow:hidden`): feed 4:5 = 1080x1350 · stories/reels 9:16 = 1080x1920 · quadrado 1:1 = 1080x1080. Nomeie por formato (`feed-01.html`, `story-01.html`…) — o prefixo permite renderizar cada formato no tamanho certo.
3. **Anatomia que funciona em estático:** kicker curto · hook do banco do `copy.md` como texto dominante (a headline É o criativo) · sub de 1-2 linhas · CTA em pílula ("Saiba mais", "Fazer o teste") · marca no rodapé. Nos stories, deixar a base da tela mais livre (o CTA nativo do Meta cobre o rodapé).
4. **Compliance por rede:** as mesmas regras Meta-safe dos roteiros (sem cifra de renda, linguagem de possibilidade, CTA de clique, sem citar o concorrente).
5. **Exportar** com `scripts/gerar_png.sh <pasta> [largura] [altura] [prefixo]` — um passe por formato (ex.: `gerar_png.sh projetos/{slug}/criativos/banners 1080 1350 feed` e depois `... 1080 1920 story`).
> **N11 — SAFE-AREA nos Stories 9:16 (regra dura).** No template de banner **stories/reels 9:16 (1080x1920)**, reserve uma **faixa livre de ~15-20% na BASE** da tela (≈ 290-380px): o CTA nativo do Meta (botão "Saiba mais" + @ do perfil + barra de progresso) fica sobreposto ali e cobre o rodapé. **Suba o CTA/pílula e qualquer texto importante pra FORA dessa faixa** — nada de hook, sub, preço ou botão dentro dos ~15-20% de baixo, ou o anúncio nativo engole. Só fundo/imagem pode entrar nessa zona. (Vale só pro 9:16; feed 4:5 e quadrado 1:1 não têm essa sobreposição.)

6. **Galeria no Book (obrigatório — PNG nunca fica invisível):** todo lote ganha **`projetos/{slug}/criativos/banners/index.html`** (identidade do `DESIGN.md`, link fixo "← Book do Funil" no topo) mostrando TODOS os PNGs agrupados por formato, com o papel de cada um e as notas de uso; o card no Book do Funil aponta pra essa galeria, nunca pra pasta nem pra arquivo solto. Lotes novos entram na MESMA galeria, em seções. **Download em 1 clique (obrigatório):** a galeria tem um botão **"Baixar todos (.zip)"** no topo — a skill gera o `.zip` do lote junto com a galeria (`zip -j <pasta>/lote.zip <pasta>/*.png`) e o REGENERA a cada lote novo — e cada PNG tem seu botão **"Baixar PNG"** (`<a href="arquivo.png" download>`). O dono nunca precisa caçar arquivo em pasta: é abrir a galeria e clicar. (Sem `zip` na máquina: o botão do topo dispara o download sequencial de todos os PNGs via JS com `<a download>` — e os zips **por carrossel/lote** também caem pro mesmo download sequencial via JS. No Windows 10+ existe o `tar` nativo como alternativa ao zip: `tar -a -c -f lote.zip *.png`.) **Formato da galeria (regra dura — padrão aprovado pela dona):** peças agrupadas por estágio (TOPO · MEIO · FUNDO), cada carrossel/lote como um cartão com título, CTA e nº de slides + dois botões: **"Baixar este carrossel (.zip)"** e **"Ver os N slides"**. Clicar em "Ver os N slides" EXPANDE a seção na própria página (pra baixo), mostrando TODOS os slides lado a lado, numerados, cada um com seu **"Baixar"**, e o botão vira **"Fechar"**. NUNCA slider lateral (Anterior/Próximo), lightbox nem página separada: tudo expande e fecha na mesma página. No topo da galeria, **"Baixar o lote inteiro (.zip)"**. Imagem não é botão: toda ação tem botão com rótulo. **Lote novo nunca engole lote antigo:** regenerar carrossel/banner cria uma SEÇÃO NOVA na galeria (v2, com data), com os PNGs novos em subpasta própria (`v2/slide-01.png…`) — os arquivos e a seção do lote anterior ficam exatamente como estavam. Cada seção de versão antiga tem no cabeçalho o botão **✕ "Excluir esta versão"** — só ESCONDE a seção da galeria (confirmação *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* + link **"Mostrar versões ocultas (N)"** no rodapé pra reverter, via `localStorage`); os PNGs ficam intocados no disco. Apagar de verdade só com ordem explícita do dono no chat.

## Gates de qualidade (NÃO pular)

- **Anúncio pago é "Meta-safe":** sem cifra de renda nem promessa financeira. Você pega a ESTRUTURA do concorrente e tira as cifras dele. Cifra de faturamento só vale em conteúdo orgânico/página, nunca em ad pago.
- **Honestidade de prova:** nunca invente depoimento, número, case ou citação no roteiro — toda prova vem do offerbook/pesquisa real. Sem prova, troque por garantia/bastidor/transparência e marque `[SEM PROVA AINDA]`; nicho regulado usa linguagem de possibilidade, sem promessa garantida.
- **CTA por canal:** ad pago = "inscreva-se"/"clique"; orgânico/isca = "comenta PALAVRA".
- **Voz:** zero emoji, frases curtas, hook nos primeiros 3 segundos, e nada de fórmulas com cara de IA ("não é X, é Y").
- **Checagem antes de entregar:** confira a quantidade de roteiros, releia as falas (sem CTA trocado, sem cara de IA) e confirme datas e nomes corretos.

## Caso de uso típico

Você escolhe um concorrente forte do seu nicho, coleta os anúncios que estão no ar há mais tempo, transcreve, identifica os 8+ ângulos vencedores e gera um lote de roteiros remodelados na sua voz — prontos para gravar e rodar na sua próxima campanha.

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
- **Apify (API REST, com o SEU token)** — coleta com métrica real, via `scripts/apify_scraper.py` da `/conteudo-funil` (chamada direta na `api.apify.com`, só stdlib do Python). Check `APIFY_API_TOKEN` (ou `APIFY_API_KEY` — os dois nomes valem) no `.env`/ambiente; sem token, conta gratuita em apify.com > Settings > API tokens. Só em "Monthly usage hard limit exceeded" (cota mensal) avise e caia pros fallbacks (YouTube raspado da página, Threads via fetch, trilha manual, "métrica não obtida"). Nunca invente número.
- **Transcrição de áudio (whisper)** — a IA NÃO escuta áudio sozinha. Check `which whisper-cli` ou `pip3 show mlx-whisper` (+ `which ffmpeg`); tendo, transcreva no terminal (`whisper-cli -m <modelo> -l pt -f audio.wav -otxt` ou `mlx_whisper audio.wav --language pt`); faltando, ofereça o setup (pergunte antes) — macOS `brew install whisper-cpp ffmpeg` (+ `pip install mlx-whisper` no Apple Silicon); Windows `winget install ffmpeg` + `pip install faster-whisper` (rode com `python -m faster_whisper` ou script equivalente). Fallback sem instalar nada: transcrição do WhatsApp (segurar a mensagem > transcrever > colar), ditado do celular, ou colar transcrição de qualquer ferramenta.
- **Chrome (headless)** via `scripts/gerar_png.sh <pasta> [largura] [altura] [prefixo]` — exporta os banners em PNG no tamanho exato do posicionamento (um passe por formato; o tamanho da janela tem que bater com o width/height fixado no HTML, senão corta). Fallback: abrir cada HTML no navegador e capturar screenshot no tamanho do formato.
