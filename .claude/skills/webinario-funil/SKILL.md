---
name: webinario-funil
description: "Estrutura o funil completo de um webinário/aula ao vivo (ou evergreen) que vende — do registro ao fechamento — pelo método do Alan Nicolas, com base teórica em Russell Brunson (Perfect Webinar), Jeff Walker (PLF) e Jason Fladlien (9 gatilhos). É o funil de meio prescrito pelo metodo-funil para público NÍVEL 4 (sente a dor, não sabe que há solução) e NÍVEL 3 (consciente da solução). Entrega as 5 peças: página de registro, sequência de aquecimento (e-mail + WhatsApp), roteiro do webinário (abertura/promessa → 3 segredos → transição → stack da oferta → fechamento/escassez) e pós-webinário (replay + e-mails de venda). Use quando precisar montar um webinário, aula ao vivo, palestra ou masterclass que vende, estruturar um funil de webinário, ou escrever o roteiro de uma apresentação de vendas one-to-many. A copy aplicada do roteiro e das páginas é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem do /email-funil; a identidade visual da página vem do seu DESIGN.md."
user_invocable: true
---

# Webinário Funil — funil de webinário que vende (níveis 4 e 3)

Skill que estrutura o **funil completo de um webinário** (aula ao vivo, palestra, masterclass ou evergreen) pelo método do **Alan Nicolas**, no modelo **Perfect Webinar / PLF**. É o funil de **meio** — para público **morno**, que já sente a dor mas ainda não comprou.

> **Promessa do método:** transformar uma audiência que *sente o problema* (nível 4) ou *já conhece a solução* (nível 3) em compradores, através de uma apresentação one-to-many que **educa de verdade enquanto vende naturalmente**.

> **KB (fonte de verdade):** `KB-webinario-funil.md` (nesta pasta). Traz o roteiro fase a fase, o Big Domino, os 3 segredos, os 9 gatilhos, as sequências de e-mail e os benchmarks. **Carregue o KB antes de montar o webinário** — não responda de cabeça.

> **Tese central:** webinário não é "uma live de conteúdo com um pitch no fim". É uma **sequência de elevação de consciência ao vivo** — registro → aquecimento → apresentação → oferta → recuperação — onde cada peça prepara a próxima. *"Para cada estágio de consciência existe um funil ideal."* O webinário é o ideal para os **níveis 4 e 3**.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto acima).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos existem:**

```
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (entregáveis, preço-âncora, bônus, garantia, público) do `offerbook.md` e a copy base do `copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de webinário eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando o `offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** níveis 4 e 3, ticket acima de R$ 1.000, venda one-to-many.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e cada card linka SEMPRE o `.html` da peça (o `.md` e o `.docx` são fonte interna; o que o dono abre pelo Book é o `.html`) — NUNCA linke `.md` no Book, e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. **Página de roteiro/VSL leva DOIS botões explícitos no topo (regra dura):** um **"← Voltar pra [a página a que ela pertence]"** (link DIRETO pro arquivo da página, ex.: `index.html` da própria pasta) E o **"← Book do Funil"** — nunca só o do Book, senão quem lê o roteiro e clica em voltar cai no hub em vez da página de onde veio. **O fallback do "← Voltar" resolve pro caminho relativo REAL do Book conforme a profundidade da pasta** (`../index.html`, `../../index.html`…), NUNCA um `index.html` fixo que não existe naquele nível: `href` errado faz o "Voltar" cair em nada. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: PageView · CompleteRegistration (inscrição) · show-up (clique no link da sala) · **chegou_na_oferta** (minuto do pitch, pixel pra remarketing) · InitiateCheckout.

> **SEM barra de revisão dentro da página (a navegação mora no Book).** A página do lead NÃO leva barra de revisão, atalhos internos nem elemento de bastidor: a navegação entre as peças (copy, mapa, quiz, e-mails, pendências) fica no **Book do Funil** (`projetos/{slug}/index.html`), fora da página. Página de venda só carrega o que o LEAD deve ver.

> **Slot de vídeo nasce com roteiro (copy aplicada do vídeo).** Página com vídeo NUNCA fica só com placeholder: gere também o ROTEIRO do vídeo (gancho, espelho/narrativa, mecanismo, convite, fecho; com fala pronta, texto na tela e notas de gravação) a partir do `copy.md`, como HTML próprio na pasta `pagina/`. Nesta skill o vídeo é o próprio webinário (o script é lei): o roteiro completo sai como HTML próprio em `pagina/webinario-roteiro.html`, e toda página gerada com vídeo (registro, obrigado, replay) inclui o botão "Ver roteiro do vídeo" DENTRO do slot. O dono grava a partir do roteiro e troca o slot pelo player.

> **Layout da página do lead (regra dura).** Vale pra TODA página voltada ao lead gerada por esta skill (registro, obrigado, replay): **(1) quando a página tem vídeo, o botão de CTA fica SEMPRE ABAIXO do vídeo, nunca acima** — a ordem do topo é headline → sub-headline → vídeo → CTA (badges, selos e números de credibilidade vêm DEPOIS do CTA, nunca entre a headline e o vídeo); **(2) o botão de CTA é sempre centralizado** na página, em toda dobra em que aparecer; **(3) no mobile, o vídeo aparece assim que a página abre** — visível na primeira dobra, sem rolar; se não couber, enxugue o que vem antes dele (headline mais curta, sub de 1 linha), nunca empurre o vídeo pra baixo; **(4) jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "escassez" como eyebrow/rótulo/título de seção em NENHUMA página. Esses nomes vivem nos documentos internos do dono; na página, cada seção mostra só a copy real que o lead deve ler.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o roteiro do webinário e as páginas de registro/obrigado. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## Como usar

Quando você pedir pra montar um webinário, uma aula ao vivo que vende ou o funil de uma masterclass:

1. **Carregar o KB** (`KB-webinario-funil.md`) pra ter o roteiro e os gatilhos na mão.
2. **Diagnosticar o nível de consciência** (4 ou 3) — é o gate que decide o tipo de webinário (ver tabela abaixo). Se o público for nível 5, 2 ou 1, este **não é** o funil certo (ver Veto).
3. **Coletar os inputs** (definir só os que ainda não estão claros):
   - **Nicho / mercado** e **produto/transformação** + **ticket**
   - **Público + nível de consciência (4 ou 3)** — de onde ele vem (sente a dor? já compara soluções?)
   - **Oferta** — entregáveis, preço-âncora, bônus, garantia (precisa existir ANTES; sai do `offerbook` / `/oferta-funil`)
   - **Big Domino** — a ÚNICA crença que, se mudar, derruba todas as objeções
   - **3 segredos** — os 3 blocos de conteúdo que quebram as 3 crenças (veículo, interna, externa)
   - **História de origem** (epiphany bridge) + provas/estudos de caso
   - **Formato:** ao vivo, evergreen ou híbrido
4. **Montar as 5 peças do funil** (registro → aquecimento → roteiro → pós) seguindo o framework.
5. **Entregar a estrutura pra você aprovar** — NUNCA subir/agendar/disparar nada sem OK. A skill só estrutura.
6. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): o roteiro do webinário e as páginas de registro/obrigado — o aluno revisa e aprova. Os e-mails de aquecimento e de venda saem com `/email-funil`; a identidade visual da página de registro vem do seu `DESIGN.md` (skill `/design-md`).

---

## Gate — Nível 4 vs Nível 3 decide o tipo de webinário

O webinário serve aos dois níveis mornos, mas **muda de peso**. Diagnostique antes de montar:

| | **Nível 4 — consciente do problema** | **Nível 3 — consciente da solução** |
|---|--------------------------------------|--------------------------------------|
| **Estado do público** | sente a dor, **não sabe que há solução** | conhece as categorias de solução, **não conhece a sua** |
| **Objetivo do webinário** | **revelar que existe uma solução** e que ela é nova/diferente | provar que **a SUA solução** é a melhor entre as que ele já conhece |
| **Big Domino** | "existe um caminho novo pra resolver isso" (a nova oportunidade) | "o MEU veículo/mecanismo é o que faz dar certo" |
| **Peso do conteúdo** | mais **educativo** — 70-80% ensino / 20-30% oferta | mais **solução/estudo de caso** — 60% ensino / 40% oferta |
| **Prova que entra** | **estudo de caso** que mostra a transformação possível | **estudo de caso aprofundado** + demonstração do mecanismo único |
| **Foco dos 3 segredos** | peso no **Segredo 1 (o veículo/método existe e funciona)** | peso em **por que o seu veículo vence** os outros que ele conhece |
| **Tom** | "deixa eu te mostrar que dá pra resolver isso" | "deixa eu te mostrar por que ESTE é o jeito certo" |
| **Duração típica** | 60-90 min (precisa construir mais crença) | 45-75 min (a pessoa já está mais perto) |

> **Regra de ouro:** depoimento puro **não** é a prova do webinário morno — quem converte aqui é o **estudo de caso** (nível 3+). Depoimento "corredor polonês" é nível 2 (outro funil). *"Anúncio de depoimento pra público frio? Burrice total."*

---

## As 5 peças do funil de webinário

Monte nesta ordem. Cada peça tem sua skill responsável.

| # | Peça | O que entrega | Skill / fonte |
|---|------|---------------|---------------|
| 1 | **Página de registro** | captura nome + e-mail + WhatsApp; promessa + data/hora + o que vai aprender | `/design-md` (visual) + `/pagina-vendas-funil` (estrutura enxuta) + `/copy-funil` (copy) |
| 2 | **Sequência de aquecimento** | e-mails + WhatsApp do registro até o "estamos ao vivo" — sobe show rate | `/email-funil` + `/whatsapp-funil` |
| 3 | **Roteiro do webinário** | a apresentação fase a fase (abertura → 3 segredos → transição → stack → fechamento) | esta skill (estrutura) + `/copy-funil` (falas) |
| 4 | **Oferta + checkout** | stack de valor, ancoragem, bônus, garantia, escassez real, CTA | `offerbook` / `/oferta-funil` + `/pagina-vendas-funil` |
| 5 | **Pós-webinário** | replay + sequência de e-mails de venda até o fechamento do carrinho | `/email-funil` + `/recuperacao-funil` |

---

## Peça 3 — Roteiro do webinário (5 fases)

A espinha do Perfect Webinar (Brunson). Detalhe e falas-modelo no KB §3.

| Fase | Tempo (de 60 min) | O que acontece | Por que converte |
|------|-------------------|----------------|------------------|
| **1. Abertura + promessa** | 0-5 min | hook + promessa do que vão aprender; sem small talk; "fica até o fim que a parte mais importante vem no final" | prende e ancora a expectativa |
| **2. História de origem** | 5-15 min | epiphany bridge — onde você estava, a descoberta, a transformação; introduz o mecanismo | autoridade + identificação; transfere crença |
| **3. Os 3 segredos** | 15-40 min | Segredo 1 (o veículo/método), Segredo 2 (crença interna "eu não consigo"), Segredo 3 (crença externa "não funciona pra mim") | cada segredo quebra **uma objeção** com ensino + estudo de caso |
| **4. Transição + stack** | 40-50 min | recap → "2 caminhos: sozinho ou comigo" → apresenta a oferta → stack de valor empilhado → ancoragem → preço → garantia | empilha valor, estica a distância valor↔preço |
| **5. Fechamento + Q&A** | 50-60 min | triple close (lógica → custo de não agir → urgência) → CTA repetido → bônus fast-action → Q&A vendendo nas respostas | comprime a decisão; recupera quem hesita |

**Big Domino (gate antes de escrever o roteiro):** *"Se eu fizer [público] acreditar que [nova oportunidade/mecanismo] é a chave para [desejo] e que só se alcança através do [seu veículo único], então todas as outras objeções ficam irrelevantes."* Sem Big Domino definido, o roteiro vira aula solta que não vende.

> **Razão de conteúdo↔oferta:** nível 4 → 70-80% conteúdo; nível 3 → 60% conteúdo. **Nunca** inverta (oferta esmagando o conteúdo derruba a confiança do morno).

---

## Peça 2 — Sequência de aquecimento (pré-webinário)

Show rate é o que decide o faturamento do webinário (KB §5). Sequência-modelo:

| Quando | Canal | Mensagem |
|--------|-------|----------|
| Na hora do registro | e-mail + WhatsApp | confirmação + data/hora + adicionar ao calendário + "responda com sua maior dúvida sobre [tema]" |
| 1 dia antes | e-mail | uma dica de valor ligada ao tema + lembrete do horário |
| Manhã do dia | e-mail + WhatsApp | "hoje é o dia, às [hora]" + o que preparar (papel/caneta) |
| 1 hora antes | WhatsApp | contagem + link |
| No início | e-mail + WhatsApp | "estamos AO VIVO — entra agora" + link direto |

> Antecedência: público **nível 3** decai rápido — janela curta (3-7 dias). **Nível 4** tolera um pouco mais de nutrição (7-14 dias) porque precisa de mais aquecimento. A escassez do ao vivo ("sem replay garantido") é o que puxa o show rate.

---

## Peça 5 — Pós-webinário (replay + venda)

O carrinho não fecha quando o webinário acaba. Sequência-modelo (KB §6):

| Quando | Mensagem |
|--------|----------|
| Logo após | "perdeu? o replay está no ar — a oferta fecha em [X]h" + link |
| Dia seguinte | recap do que foi ensinado + estudo de caso de quem comprou + deadline |
| Antes do deadline | "última chance — encerra hoje" + o que ele perde + link direto |

> A oferta do webinário tem **escassez real** (fecha o carrinho / bônus do ao vivo expira) — nunca falsa. Escassez fabricada destrói a confiança que o webinário construiu. Carrinho recusado / boleto / abandono → entra no `/recuperacao-funil`.

---

## Regras de ouro

**SEMPRE:** diagnosticar nível (4 ou 3) antes de montar · oferta/offerbook pronta ANTES do roteiro · definir o Big Domino antes de escrever · cada segredo quebra uma objeção (com estudo de caso) · 70-80% conteúdo no nível 4 / 60% no nível 3 · escassez **real** · sequência de aquecimento pra subir show rate · sequência de pós-webinário pra fechar (50% das vendas vêm depois/no último dia) · você revisa a estrutura antes de qualquer coisa.

**NUNCA:** webinário sem oferta definida · oferta esmagando o conteúdo (morno foge) · depoimento puro como prova central (isso é nível 2) · escassez falsa · mandar nível 5/2/1 pro webinário (funil errado — ver Veto) · "ensinar tudo" a ponto da pessoa não precisar comprar · subir/agendar/disparar sem você revisar · escrever a copy de cabeça (a copy aplicada sai do `copy.md`; e-mails com `/email-funil`).

---

## Output (o que a skill entrega)

Pra cada pedido, entregar:

1. **Diagnóstico** — nível (4 ou 3) + justificativa + tipo de webinário (educativo vs solução).
2. **Big Domino** + os **3 segredos** mapeados (qual crença cada um quebra).
3. **Mapa das 5 peças** — registro → aquecimento → roteiro → oferta → pós, cada uma com a skill responsável e o esqueleto a preencher.
4. **Roteiro fase a fase** (as 5 fases, com tempos e o que entra em cada bloco — com as falas geradas nesta skill a partir do `copy.md`, pra você revisar).
5. **Sequências** — aquecimento (e-mail + WhatsApp) e pós-webinário (replay + venda), como esqueleto pra `/email-funil`.
6. **Checklist** pré / durante / pós-webinário (KB §7).

> A **copy aplicada** (roteiro + páginas de registro/obrigado) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. `/email-funil` escreve os e-mails; o `DESIGN.md` dá a identidade visual da página.

> **Onde salvar:** a estrutura desta skill sai em **`projetos/{slug}/webinario.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Encaixe no Mapa de Execução do metodo-funil

Esta skill é o **funil dos níveis 4-3** que o `metodo-funil` prescreve mas não detalhava. No Mapa de Execução, quando o diagnóstico der **nível 4 ou 3 → funil = webinário/aula**, a peça "Funil" se expande assim:

```
Estágio 4-3 → Funil: WEBINÁRIO  →  /webinario-funil

PEÇA            SKILL                  O QUE ENTREGA
01 Offerbook    offerbook/oferta-funil oferta, mecanismo, ancoragem, bônus  ← antes do webinário
02 Registro     design-md + pagina-vendas + copy-funil   página de captura
03 Aquecimento  email-funil + whatsapp-funil             show rate até o ao vivo
04 Roteiro      webinario-funil + copy-funil             apresentação 5 fases
05 Pós/venda    email-funil + recuperacao                replay + fechamento do carrinho
06 Teste        cro-funil                                show rate, conversão, A/B
```

> O webinário se conecta ao funil amplo: a **página de registro** usa a estrutura de `/pagina-vendas-funil` (enxuta — só promessa, data e captura), a **oferta** vem do `offerbook`, e a **recuperação** roda no `/recuperacao-funil`. Este skill é a peça que faltava entre o diagnóstico e a venda para o público morno.

---

## Veto conditions (NÃO montar webinário se…)

| Situação | Ação |
|----------|------|
| Público é **nível 5** (inconsciente) | PARAR → webinário converte pouco no frio; usar VSL+advertorial/lançamento (`/vsl-funil`, `/metodo-funil`) |
| Público é **nível 2 ou 1** (consciente do produto / quase comprando) | PARAR → funil errado; usar página+depoimento ou checkout direto (`/pagina-vendas-funil`) |
| **Oferta/offerbook não existe** | PARAR → construir a oferta ANTES (`offerbook` / `/oferta-funil`) |
| **Big Domino não definido** | PARAR → definir a crença central antes de escrever o roteiro |
| Pediram a **copy pronta** das falas/e-mails | Falas e páginas: gerar nesta skill a partir do `copy.md` (sem `copy.md` → /copy-funil primeiro); e-mails com `/email-funil` — nunca de cabeça |
| Vão **subir/agendar/disparar** sem revisar | PARAR → você revisa a estrutura primeiro |

---

*Skill webinario-funil — funil de webinário (níveis 4 e 3) pelo método do Alan Nicolas, com base teórica em Russell Brunson (Perfect Webinar), Jeff Walker (PLF) e Jason Fladlien (9 gatilhos). Toda montagem calibra no KB-webinario-funil.md. A copy aplicada (roteiro + páginas) é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem do /email-funil; a identidade visual vem do seu DESIGN.md. Você revisa, aprova e publica.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base `projetos/{slug}/webinario`:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/webinario-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
