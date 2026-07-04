---
name: lancamento-funil
description: "Estrutura um funil de lançamento estilo Product Launch Formula (PLF / Jeff Walker) pra aquecer público FRIO (nível 5 — não te conhece nem sabe que tem o problema) quando você TEM lista/audiência pra aquecer. Entra nicho + produto + tamanho da lista, sai a régua completa em fases: pré-pré-lançamento (aquecimento + captação de lista + pesquisa), os 3 PLCs de pré-lançamento (Oportunidade, Transformação, Propriedade/Experiência), abertura de carrinho, sequência de carrinho aberto e fechamento com escassez real — mais os 9 gatilhos mentais, a régua de dias por fase e os tipos de lançamento (semente, interno, parceria/JV). É o funil de TOPO alternativo do nível 5 no método do Alan Nicolas. Use quando precisar montar lançamento, PLF, sequência de aquecimento, sideways sales letter, abertura/fechamento de carrinho ou planejar a régua de um lançamento. Modela o Product Launch Formula (Jeff Walker) e os níveis de consciência (Eugene Schwartz)."
user_invocable: true
---

# Lançamento — Funil de PLF pra Público Frio com Lista (Nível 5)

Skill que estrutura um **funil de lançamento** no estilo **Product Launch Formula (PLF)**: uma **sequência de aquecimento** que pega público **frio** (nível 5) e o leva, por etapas e gatilhos mentais, de "não sabia que tinha esse problema" até comprar numa **janela de carrinho** que abre e fecha. Baseada no método de funil do **Alan Nicolas**, modelando o **Product Launch Formula (Jeff Walker)** e os **níveis de consciência (Eugene Schwartz)**.

> **KB (fonte de verdade):** `KB-lancamento-funil.md` (nesta pasta). Tem a anatomia completa do lançamento, os 3 PLCs detalhados, os 9 gatilhos mentais, a régua de tempo, os tipos de lançamento e o casamento com o nível 5. **Carregue o KB antes de montar** — não responda de cabeça.

> **Promessa do método:** transformar uma lista fria num **evento de vendas concentrado** — onde a antecipação é construída antes do carrinho abrir, o valor é entregue antes de qualquer pedido, e a escassez real (carrinho que fecha) concentra a maior parte das vendas no último dia. *"It's not a pitch, it's a conversation."* (Jeff Walker)

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/lancamento.md`** (nos 3 formatos: `.md` + `.html` + `.pdf`).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o projeto ativo e confira que os arquivos existem dentro dele:

```
# 1. Descubra o projeto ativo:
ls projetos/ 2>/dev/null
# 2. Confira os arquivos dentro do projeto ativo:
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto/transformação, preço, bônus, garantia, público) do `projetos/{slug}/offerbook.md` e a copy base do `projetos/{slug}/copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de lançamento (PLF) eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `projetos/{slug}/offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 COM lista/audiência própria pra aquecer.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e cada card linka SEMPRE o `.html` da peça (o `.md` e o `.docx` são fonte interna; o que o dono abre pelo Book é o `.html`) — NUNCA linke `.md` no Book, e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. **Página de roteiro/VSL leva DOIS botões explícitos no topo (regra dura):** um **"← Voltar pra [a página a que ela pertence]"** (link DIRETO pro arquivo da página, ex.: `index.html` da própria pasta) E o **"← Book do Funil"** — nunca só o do Book, senão quem lê o roteiro e clica em voltar cai no hub em vez da página de onde veio. **O fallback do "← Voltar" resolve pro caminho relativo REAL do Book conforme a profundidade da pasta** (`../index.html`, `../../index.html`…), NUNCA um `index.html` fixo que não existe naquele nível: `href` errado faz o "Voltar" cair em nada. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: PageView por PLC (1, 2, 3: segmenta remarketing por consumo) · Lead (captação) · abertura de carrinho · InitiateCheckout.

> **SEM barra de revisão dentro da página (a navegação mora no Book).** A página do lead NÃO leva barra de revisão, atalhos internos nem elemento de bastidor: a navegação entre as peças (copy, mapa, quiz, e-mails, pendências) fica no **Book do Funil** (`projetos/{slug}/index.html`), fora da página. Página de venda só carrega o que o LEAD deve ver.

> **Slot de vídeo nasce com roteiro (copy aplicada do vídeo).** Página com vídeo NUNCA fica só com placeholder: gere também o ROTEIRO do vídeo (gancho, espelho/narrativa, mecanismo, convite, fecho; com fala pronta, texto na tela e notas de gravação) a partir do `copy.md`, como HTML próprio na pasta `pagina/`. Nesta skill cada PLC é um vídeo: os roteiros dos 3 PLCs saem como HTML próprios em `pagina/plc-1-roteiro.html` (2, 3), e cada página de PLC inclui o botão "Ver roteiro do vídeo" DENTRO do slot do player. O dono grava a partir do roteiro e troca o slot pelo player.

> **Layout da página do lead (regra dura).** Vale pra TODA página voltada ao lead gerada por esta skill (captação, PLCs, carrinho): **(1) quando a página tem vídeo, o botão de CTA fica SEMPRE ABAIXO do vídeo, nunca acima** — a ordem do topo é headline → sub-headline → vídeo → CTA (badges, selos e números de credibilidade vêm DEPOIS do CTA, nunca entre a headline e o vídeo); **(2) o botão de CTA é sempre centralizado** na página, em toda dobra em que aparecer; **(3) no mobile, o vídeo aparece assim que a página abre** — visível na primeira dobra, sem rolar; se não couber, enxugue o que vem antes dele (headline mais curta, sub de 1 linha), nunca empurre o vídeo pra baixo; **(4) jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "escassez", "PLC" como eyebrow/rótulo/título de seção em NENHUMA página. Esses nomes vivem nos documentos internos do dono; na página, cada seção mostra só a copy real que o lead deve ler.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — os roteiros dos PLCs e a sequência de carrinho. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## O que é (e o que NÃO é)

| É | NÃO é |
|---|-------|
| Funil de **topo** pra nível 5 (frio) **quando você tem lista/audiência** pra aquecer | Tráfego frio direto pra oferta perpétua (isso é `/advertorial-funil` + `/vsl-funil`) |
| **Sequência** espalhada no tempo (sideways sales letter) | Uma página única que vende tudo de uma vez |
| **Evento** com data: carrinho que abre e fecha | Venda sempre disponível (perpétuo) |
| Entrega **valor** (3 PLCs) antes de pedir a compra | Pitch direto sem construir relacionamento |
| Escassez **real** (o carrinho fecha mesmo) | Escassez fabricada ("últimas vagas" que nunca acabam) |

> **Onde encaixa no funil:** no Mapa de Execução do `/metodo-funil`, o **nível 5** prescreve "lançamento/PLF, VSL + advertorial, ou conteúdo grátis". O lançamento é a opção pra quem **já tem audiência/lista** (ou consegue captar uma antes): em vez de aquecer o estranho 1-a-1 numa página editorial, você aquece a **lista inteira ao mesmo tempo**, por uma sequência, e concentra as vendas numa janela.

---

## Lançamento vs. Advertorial+VSL — qual funil de nível 5 escolher

Os dois servem o **mesmo nível 5 (frio)**. A diferença é o **ativo** que você tem e o **modelo de venda** que quer:

| Escolha **LANÇAMENTO** (esta skill) se… | Escolha **ADVERTORIAL + VSL** se… |
|----------------------------------------|-----------------------------------|
| Você **tem lista/audiência** (email, Instagram, YouTube, grupo) — ou vai captar uma antes | Você vai mandar **tráfego frio pago direto**, sem lista prévia |
| Quer um **evento** com pico de vendas (data marcada) | Quer venda **perpétua**, rodando 24/7 todo dia |
| Topa a **régua longa** (semanas de aquecimento) por um faturamento concentrado | Quer um funil **sempre ligado**, escala por verba de ads |
| A **escassez real** (carrinho fecha) é o motor da conversão | A **VSL** e a oferta perpétua são o motor |

> Não são excludentes no tempo: muita gente **lança** (evento) e depois transforma a sequência em **evergreen** (perpétuo) — que aí vira mais perto de `/vsl-funil`. Mas pra ESTE pedido, escolha um modelo. Regra do Jeff: **faça o lançamento ao vivo primeiro**, depois automatize.

---

## Como usar

Quando você pedir pra montar/estruturar um lançamento, um PLF, uma sequência de aquecimento ou a régua de carrinho:

1. **Carregar o KB** (`KB-lancamento-funil.md`) pra ter a anatomia, os PLCs, os gatilhos e a régua na mão.
2. **Confirmar o nível de consciência + o ativo.** Lançamento é peça do **nível 5 (frio)** e só faz sentido se você **tem lista/audiência pra aquecer** (ou vai captar uma no pré-pré-lançamento). Se você não tem nem vai captar lista → o caso é `/advertorial-funil` + `/vsl-funil` (ver Veto conditions).
3. **Coletar os inputs** (perguntar só os que não vieram no briefing/offerbook):
   - **Nicho / mercado** (ex.: renda extra, saúde, produtividade, IA pra marketing)
   - **Produto / transformação** + a **oferta** (entregáveis, preço, bônus, garantia — sai do `/offerbook`)
   - **Tamanho e tipo da lista/audiência** — é o que decide o **tipo de lançamento** (semente / interno / parceria)
   - **Data alvo** do carrinho (pra montar a régua pra trás)
4. **Escolher o tipo de lançamento** (semente / interno / parceria) pela tabela do KB.
5. **Rodar as 5 fases** abaixo, preenchendo cada bloco com o caso real e montando a **régua de dias**.
6. **Entregar a estrutura completa + a régua** pra você aprovar — NUNCA subir/disparar/agendar nada sem OK. A skill só estrutura.
7. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): roteiros dos PLCs e sequência de carrinho — o aluno revisa e aprova. Os e-mails saem com a `/email-funil`; nunca de cabeça.

---

## A regra de ouro (o que separa lançamento de "mandar e-mail de venda")

> **Valor ANTES do pedido. Conversa, não pitch. Escassez REAL.**

- **Valor antes do pedido:** os 3 PLCs entregam algo genuinamente útil **antes** do carrinho abrir. Se o PLC é só teaser ("vou revelar no próximo"), quebra a reciprocidade e o lançamento esfria.
- **Conversa, não pitch:** a venda é espalhada numa sequência (sideways sales letter), não concentrada numa página. Cada peça prepara a próxima.
- **Escassez real:** o carrinho **fecha de verdade** numa data e não reabre por um período. Escassez fabricada destrói a confiança — e a lista não volta no próximo lançamento.

---

## O Framework — 5 Fases (a régua do lançamento)

Monte de trás pra frente a partir da **data do carrinho**. Cada fase prepara a próxima. Detalhe e roteiro de cada peça no KB.

### Fase 1 — Pré-pré-lançamento (aquecimento + lista + pesquisa)

**Régua:** ~1 a 4 semanas antes do pré-lançamento.

Constrói/aquece a audiência e colhe inteligência **antes** de qualquer conteúdo de venda. O que entra:
- **Captar/aquecer a lista** (se ainda não existe, captar com isca; se existe, reengajar).
- **Pesquisa** com a lista (as dores, o que já tentaram, o que mudaria) → alimenta os PLCs e a copy.
- **Sementes de antecipação** ("vem aí algo grande", "marca essa data").

> Sem lista aquecida aqui, o lançamento nasce morto. Esta fase é o que diferencia o lançamento do advertorial: aqui você **junta e aquece o público** antes de falar de produto.

### Fase 2 — Pré-lançamento: os 3 PLCs (o coração do PLF)

**Régua:** os 3 PLCs ao longo de ~7 a 14 dias (um a cada 2-3 dias), cada um anunciado por e-mail.

A **sideways sales letter**: em vez de uma página que vende tudo, 3 conteúdos que educam, provam e geram desejo. Cada PLC entrega **valor real** e abre antecipação pro próximo.

| PLC | Foco | O que faz | Gatilhos principais |
|-----|------|-----------|---------------------|
| **PLC1 — Oportunidade** | mostra o que é possível | hook + autoridade (sua história) + revela a oportunidade/transformação + 1º ensino real + antecipa o PLC2 | Autoridade, Antecipação, Prova social |
| **PLC2 — Transformação** | prova que funciona | recap + estudos de caso (transformação real) + ensino mais profundo + quebra de objeções + antecipa o PLC3 | Prova social, Reciprocidade, Confiança |
| **PLC3 — Propriedade / Experiência** | faz a pessoa se ver usando | recap da jornada + visão do futuro (future pacing, "imagine acordar...") + último ensino + ponte pra oferta + monta a escassez do carrinho | Antecipação, Comunidade, Eventos |

> Regra: PLC **não é teaser** — cada um vale como conteúdo sozinho. E para frio, a prova é **estudo de caso/transformação**, não depoimento puro (casamento prova↔consciência do método).

### Fase 3 — Abertura de carrinho (Open Cart)

**Régua:** dia 1 do carrinho (carrinho aberto por ~4 a 7 dias no total).

O carrinho abre. A oferta aparece (o **Launch Stack**: core + bônus + garantia + escassez). Dispara a sequência de abertura:
- **2-3 e-mails no dia 1** ("estamos abertos" / primeira resposta / por dentro do que tem).
- A oferta é apresentada **depois** de toda a antecipação dos PLCs — a pessoa já quer.

> Padrão do PLF: **~25% das vendas acontecem no dia 1.**

### Fase 4 — Carrinho aberto (Mid-Launch)

**Régua:** dias 2 a (penúltimo), ~1 e-mail por dia.

Mantém o momentum e derruba objeções enquanto o carrinho está aberto:
- estudos de caso adicionais · FAQ respondendo objeções · bastidor/prova em tempo real · lembrete do prazo.

### Fase 5 — Fechamento (Close Cart, escassez real)

**Régua:** último dia, **3 a 5 e-mails** com contagem regressiva.

A escassez real entra em cena: o carrinho **fecha** numa hora marcada e não reabre. Sequência do último dia:
- manhã ("último dia") → tarde ("horas finais") → noite ("fechando em X horas") → última chamada ("é agora ou nunca").

> Padrão do PLF: **~50% das vendas acontecem no último dia.** Por isso o fechamento não é um e-mail — é uma sequência. Pular o último dia = deixar metade do dinheiro na mesa.

---

## Os 9 gatilhos mentais (distribuir ao longo da régua)

O lançamento funciona porque ativa, **na ordem certa**, os 9 gatilhos (detalhe no KB):

| Gatilho | Onde entra com mais força |
|---------|---------------------------|
| **Autoridade** | PLC1 (sua história/origem) |
| **Reciprocidade** | os 3 PLCs (valor real, de graça) |
| **Confiança** | a sequência inteira (valor entregue repetido) |
| **Antecipação** | fim de cada PLC + contagem pro carrinho |
| **Afinidade** | storytelling pessoal em cada peça |
| **Eventos** | o lançamento é um EVENTO com data |
| **Comunidade** | comentários/grupo, "faça parte do movimento" |
| **Prova social** | PLC2 (cases) + compradores em tempo real no carrinho |
| **Escassez** | Open/Close Cart — **sempre real, nunca fabricada** |

---

## Tipos de lançamento (escolher 1 pelo seu ativo)

| Tipo | Pra quem | Lista | Como roda |
|------|----------|-------|-----------|
| **Semente (Seed)** | quem está começando ou quer **validar** o produto antes de criar | pequena (~100-500) | lançamento simples (pode ser só e-mails); vende antes de criar e entrega ao vivo coletando feedback |
| **Interno (Internal)** | quem **já tem lista própria** | qualquer tamanho | o PLF clássico completo: pré-pré → 3 PLCs → carrinho 4-7 dias → fechamento |
| **Parceria (JV)** | quem quer **escalar com parceiros/afiliados** | alavanca a lista dos parceiros | parceiros promovem pra audiência deles; coordena datas e materiais; PLF pra audiência combinada |

> Comece pela **semente** se está validando. **Interno** é o padrão de quem tem lista. **Parceria** escala, mas é mais complexo de coordenar.

---

## Casamento com o nível 5 (por que o lançamento é peça certa)

| Onde o público frio (nível 5) trava | Como o lançamento resolve |
|-------------------------------------|---------------------------|
| Não sabe que tem o problema | PLC1 **revela a oportunidade**; a pesquisa do pré-pré nomeia a dor |
| Não confia (te viu agora) | 3 PLCs entregam **valor antes de pedir** → confiança construída por repetição |
| Mandar direto pra oferta não converte | a oferta só aparece **depois** dos PLCs, quando já há desejo |
| Depoimento não funciona com frio | PLC2 usa **estudo de caso / transformação**, não depoimento puro |
| Falta urgência pra agir | **carrinho que fecha** (escassez real) concentra a decisão |

> *"Em média, 80% a 90% do mercado está inconsciente."* (nível 5). O lançamento é como você **aquece a lista inteira** desse mercado de uma vez e a leva à compra num evento.

---

## Template de Saída

Entregar sempre neste formato, preenchido com o caso real:

```markdown
# Lançamento (PLF) — [Produto] ([Nicho])

## Diagnóstico
- Nível de consciência: 5 (frio) — justificativa
- Ativo (lista/audiência): [tamanho + canal] → tipo de lançamento: [semente/interno/parceria]
- Por que LANÇAMENTO e não advertorial+VSL: [tem lista / quer evento]
- Oferta (Launch Stack): core + bônus + garantia + preço (← do /offerbook)
- Data do carrinho: abre [data] / fecha [data]

## Régua (de trás pra frente a partir do carrinho)
- D-[X..]  Fase 1 — Pré-pré: captar/aquecer lista + pesquisa + sementes de antecipação
- D-[X..]  Fase 2 — PLC1 (Oportunidade)  → e-mail de anúncio
-          Fase 2 — PLC2 (Transformação) → e-mail de anúncio
-          Fase 2 — PLC3 (Propriedade)   → e-mail + monta escassez
- D-0      Fase 3 — Abertura: 2-3 e-mails (≈25% das vendas)
- D-1..n   Fase 4 — Carrinho aberto: 1 e-mail/dia (cases, FAQ, prova)
- D-final  Fase 5 — Fechamento: 3-5 e-mails contagem regressiva (≈50% das vendas)

## PLCs (esqueleto de cada um)
- PLC1 — Oportunidade: hook / autoridade / oportunidade / 1º ensino / antecipa PLC2
- PLC2 — Transformação: recap / cases / ensino / objeções / antecipa PLC3
- PLC3 — Propriedade: recap / visão de futuro / último ensino / ponte pra oferta / escassez

## Gatilhos mentais — distribuição na régua
[quais entram em cada fase]

## Próxima peça
- Copy aplicada dos PLCs e da sequência de carrinho → gerada nesta skill a partir do copy.md
- Sequência de e-mails (anúncio + carrinho) → /email-funil
- Oferta/Launch Stack → /offerbook
- Página de inscrição/checkout → /pagina-vendas-funil (+ /design-md)
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + o ativo (lista) + tipo de lançamento + por que lançamento e não advertorial+VSL.
2. **A régua completa** — dias por fase, montada de trás pra frente a partir da data do carrinho.
3. **Estrutura das 5 fases** — cada uma com esqueleto/placeholder pra preencher.
4. **Os 3 PLCs** detalhados (esqueleto de cada).
5. **Distribuição dos 9 gatilhos** ao longo da régua.
6. **Encaixe no funil** — de onde vem a copy aplicada e quem escreve os e-mails.

> A **copy aplicada** (roteiros dos PLCs + sequência de carrinho) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. Os e-mails saem da `/email-funil`. A skill também estrutura o lançamento e a régua.

---

## Regras

**SEMPRE:** confirmar **nível 5 (frio) + que você tem (ou vai captar) lista** antes de montar · montar a **régua de trás pra frente** a partir da data do carrinho · entregar **valor real** nos 3 PLCs (nunca só teaser) · **valor antes do pedido** · prova como **estudo de caso/transformação** (não depoimento puro) pro frio · **escassez real** (carrinho fecha mesmo) · sequência de **fechamento** no último dia (3-5 e-mails) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** pular os PLCs e ir direto pro carrinho · usar **escassez fabricada** ("vagas" que nunca acabam) · fazer PLC que é só teaser sem valor · abrir carrinho sem deadline real · ignorar o último dia (vem ~50% das vendas) · tratar a lista como caixa eletrônico (lançar sem dar valor entre lançamentos) · depoimento puro pra público frio · subir/disparar/agendar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Você **não tem lista/audiência** nem vai captar uma | PARAR → o caso é `/advertorial-funil` + `/vsl-funil` (tráfego frio direto), não lançamento |
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente é `/pagina-vendas-funil` ou `/webinario-funil`, não lançamento de aquecimento |
| Oferta/offerbook não existe | PARAR → construir a oferta antes (`/offerbook`): sem Launch Stack não há o que abrir no carrinho |
| Não há data de carrinho | PARAR → a escassez real (abre/fecha) é o motor; definir a data primeiro |
| Pediram a copy/os e-mails prontos | PLCs e sequência de carrinho: gerar nesta skill a partir do `copy.md` (sem `copy.md` → /copy-funil primeiro); e-mails com `/email-funil` — nunca de cabeça |
| Vão disparar sem revisar | PARAR → revisar a estrutura e a régua primeiro |

---

## Encaixe no Mapa de Execução do método

```
Estágio 5 (frio, COM lista) → Funil: Lançamento / PLF

PEÇA           SKILL              O QUE ENTREGA
01 Offerbook   /offerbook         oferta, Launch Stack, mecanismo, ancoragem  ← precisa existir antes
02 Lançamento  /lancamento-funil  ESTA SKILL — a régua do PLF (pré-pré → PLCs → carrinho → fechamento)
03 Copy        /copy-funil        FUNDAÇÃO da copy (copy.md); a copy aplicada dos PLCs sai desta skill
04 Email       /email-funil       sequências: anúncio de PLC + abertura + carrinho + fechamento
05 Página      /design-md +       identidade visual + página de inscrição/checkout
               /pagina-vendas-funil
```

O lançamento é a **peça 02** do nível 5 (alternativa ao advertorial+VSL): vem depois da oferta existir. A **fundação da copy** (copy.md) sai da `/copy-funil`; a **copy aplicada** dos PLCs e da sequência de carrinho é gerada nesta skill a partir dela; os **e-mails** saem da `/email-funil`.

---

*Skill lancamento-funil v1 — funil de topo do nível 5 (com lista) no método do Alan Nicolas. Modela o Product Launch Formula (Jeff Walker) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy aplicada dos PLCs e da sequência de carrinho é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem da `/email-funil`. Toda montagem calibra no KB-lancamento-funil.md.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/lancamento-funil/scripts/gerar_pdf.sh <arquivo>.html
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
