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

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

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

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e cada card linka SEMPRE o `.html` da peça (o `.md` e o `.docx` são fonte interna; o que o dono abre pelo Book é o `.html`) — NUNCA linke `.md` no Book, e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. **Página de roteiro/VSL leva DOIS botões explícitos no topo (regra dura):** um **"← Voltar pra [a página a que ela pertence]"** (link DIRETO pro arquivo da página, ex.: `index.html` da própria pasta) E o **"← Book do Funil"** — nunca só o do Book, senão quem lê o roteiro e clica em voltar cai no hub em vez da página de onde veio. **O fallback do "← Voltar" resolve pro caminho relativo REAL do Book conforme a profundidade da pasta** (`../index.html`, `../../index.html`…), NUNCA um `index.html` fixo que não existe naquele nível: `href` errado faz o "Voltar" cair em nada. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

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
7. **Calibrar a voz** — ajuste cada roteiro para a SUA voz (ou a voz da sua equipe), usando transcrições/conteúdos reais seus como referência. Se ainda não tiver material de referência, marque como "primeiro corte" para refinar depois.
8. **Entregar** — exporte os roteiros (ex.: Markdown → documento) e suba na sua pasta de entrega.

**Material visual usa o `DESIGN.md` da marca.** Se você renderizar os roteiros/criativos como material visual (HTML, PDF, PNG, slides), gere-o JÁ com os tokens do `projetos/{slug}/DESIGN.md` — cores, fontes, borda/raio, tamanho, logo. NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.

## Banners estáticos (HTML → PNG, na identidade da marca)

Além dos roteiros de vídeo, a skill produz **banners estáticos de ad** — pelo mesmo pipeline do carrossel da `/conteudo-funil`: HTML com os tokens do `DESIGN.md` → PNG via Chrome headless. Regras:

1. **Só depois das perguntas da Ativação** (rede, tipo, formatos, escopo) e com **1 amostra aprovada antes do lote**.
2. **Um HTML por banner**, com a dimensão exata do posicionamento fixada no `html,body` (`width/height` + `overflow:hidden`): feed 4:5 = 1080x1350 · stories/reels 9:16 = 1080x1920 · quadrado 1:1 = 1080x1080. Nomeie por formato (`feed-01.html`, `story-01.html`…) — o prefixo permite renderizar cada formato no tamanho certo.
3. **Anatomia que funciona em estático:** kicker curto · hook do banco do `copy.md` como texto dominante (a headline É o criativo) · sub de 1-2 linhas · CTA em pílula ("Saiba mais", "Fazer o teste") · marca no rodapé. Nos stories, deixar a base da tela mais livre (o CTA nativo do Meta cobre o rodapé).
4. **Compliance por rede:** as mesmas regras Meta-safe dos roteiros (sem cifra de renda, linguagem de possibilidade, CTA de clique, sem citar o concorrente).
5. **Exportar** com `scripts/gerar_png.sh <pasta> [largura] [altura] [prefixo]` — um passe por formato (ex.: `gerar_png.sh projetos/{slug}/criativos/banners 1080 1350 feed` e depois `... 1080 1920 story`).
6. **Galeria no Book (obrigatório — PNG nunca fica invisível):** todo lote ganha **`projetos/{slug}/criativos/banners/index.html`** (identidade do `DESIGN.md`, link fixo "← Book do Funil" no topo) mostrando TODOS os PNGs agrupados por formato, com o papel de cada um e as notas de uso; o card no Book do Funil aponta pra essa galeria, nunca pra pasta nem pra arquivo solto. Lotes novos entram na MESMA galeria, em seções. **Download em 1 clique (obrigatório):** a galeria tem um botão **"Baixar todos (.zip)"** no topo — a skill gera o `.zip` do lote junto com a galeria (`zip -j <pasta>/lote.zip <pasta>/*.png`) e o REGENERA a cada lote novo — e cada PNG tem seu botão **"Baixar PNG"** (`<a href="arquivo.png" download>`). O dono nunca precisa caçar arquivo em pasta: é abrir a galeria e clicar. (Sem `zip` na máquina: o botão do topo dispara o download sequencial de todos os PNGs via JS com `<a download>`.) **Formato da galeria (regra dura — padrão aprovado pela dona):** peças agrupadas por estágio (TOPO · MEIO · FUNDO), cada carrossel/lote como um cartão com título, CTA e nº de slides + dois botões: **"Baixar este carrossel (.zip)"** e **"Ver os N slides"**. Clicar em "Ver os N slides" EXPANDE a seção na própria página (pra baixo), mostrando TODOS os slides lado a lado, numerados, cada um com seu **"Baixar"**, e o botão vira **"Fechar"**. NUNCA slider lateral (Anterior/Próximo), lightbox nem página separada: tudo expande e fecha na mesma página. No topo da galeria, **"Baixar o lote inteiro (.zip)"**. Imagem não é botão: toda ação tem botão com rótulo. **Lote novo nunca engole lote antigo:** regenerar carrossel/banner cria uma SEÇÃO NOVA na galeria (v2, com data), com os PNGs novos em subpasta própria (`v2/slide-01.png…`) — os arquivos e a seção do lote anterior ficam exatamente como estavam. Cada seção de versão antiga tem no cabeçalho o botão **✕ "Excluir esta versão"** — só ESCONDE a seção da galeria (confirmação *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* + link **"Mostrar versões ocultas (N)"** no rodapé pra reverter, via `localStorage`); os PNGs ficam intocados no disco. Apagar de verdade só com ordem explícita do dono no chat.

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


## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Apify (API REST, com o SEU token)** — coleta com métrica real (Instagram, TikTok, X etc.). NÃO é MCP: a chamada é direto na `api.apify.com`, via o script `scripts/apify_scraper.py` da skill `/conteudo-funil` (só stdlib do Python). Check: `APIFY_API_TOKEN` no `.env` ou no ambiente (`echo $APIFY_API_TOKEN`). Sem token: conta gratuita em apify.com > Settings > API tokens. Se vier "Monthly usage hard limit exceeded", AVISE na hora (cota mensal da conta) e caia pros fallbacks: YouTube raspado da página pública (views reais), Threads via fetch, trilha manual, e "métrica não obtida" no que faltar. Nunca invente número.
- **Transcrição de áudio (whisper)** — a IA NÃO escuta áudio sozinha. Check: `which whisper-cli` ou `pip3 show mlx-whisper` (+ `which ffmpeg` pra converter). Tendo, transcreva pelo terminal (`whisper-cli -m <modelo> -l pt -f audio.wav -otxt` ou `mlx_whisper audio.wav --language pt`). Faltando: ofereça `brew install whisper-cpp ffmpeg` e PERGUNTE antes de instalar. **Fallback sem instalar nada:** o WhatsApp transcreve áudio (segurar a mensagem > transcrever > colar aqui), ditado do celular, ou colar transcrição de qualquer ferramenta. O que importa é a fala real chegar em texto.
- **WebSearch / WebFetch** — pesquisa aberta na internet. Já vem no Claude Code, sem instalação. Se um site bloquear (login wall/Cloudflare), diga QUAL fonte falhou e o que veio de snippet.
- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).
- **Chrome (headless)** via `scripts/gerar_png.sh <pasta> [largura] [altura] [prefixo]` — exporta os banners em PNG no tamanho exato do posicionamento (um passe por formato; o tamanho da janela tem que bater com o width/height fixado no HTML, senão corta). **Fallback:** abrir cada HTML no navegador e capturar screenshot no tamanho do formato.

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
