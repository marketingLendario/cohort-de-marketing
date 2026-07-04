---
name: whatsapp-funil
description: "Estrutura a sequência de WhatsApp/DM de um funil — mensagens por momento: lembrete de evento/live, confirmação, carrinho abandonado, cartão recusado, nutrição e re-engajamento — casadas ao estágio de consciência. O aluno preenche com o produto/oferta dele; a skill gera a copy aplicada das mensagens a partir do copy.md (quando ele existe) e o aluno revisa e aprova. Use quando precisar montar/diagnosticar a sequência de WhatsApp ou DM de um funil, decidir que mensagem mandar em cada momento, ou casar o tom e o timing de cada disparo ao quão quente está o contato. A skill estrutura a sequência e gera a copy aplicada a partir do copy.md; o texto final é revisado e aprovado por você."
user_invocable: true
---


> **Toda mensagem sai SEPARADA e com botão Copiar (regra dura).** Além do documento da peça, cada mensagem individual sai em arquivo próprio pronto pra usar: e-mail = 1 HTML por e-mail no padrão do disparador (tabela, inline, preheader, merge tags) com DOIS botões fixos no canto superior direito do preview: "Copiar texto" (só o texto do e-mail, pronto pra colar no editor da ferramenta) e "Copiar HTML" (o código LIMPO do e-mail, pronto pra colar no modo HTML da ferramenta); os botões removem a si mesmos do que é copiado; WhatsApp/DM = página com as mensagens em texto, botão "Copiar texto" em cada uma. Tudo listado num índice clicável (`emails/index.html` ou equivalente). O dono nunca precisa garimpar copy dentro de documento: é clicar, copiar, colar.

# WhatsApp / DM de Funil — Sequência por momento

Skill que estrutura a **sequência de WhatsApp / DM** de um funil: que mensagem mandar em cada momento (lembrete de evento, confirmação, carrinho abandonado, cartão recusado, nutrição, re-engajamento), com que tom e em que timing — casado ao quão quente está o contato.

> **KB (fonte de verdade):** `KB-whatsapp-funil.md` (nesta pasta). Tem o método completo, os momentos da sequência, os timings (ex.: "30 min após o carrinho") e o **verbatim** da fonte. **Carregue o KB antes de prescrever** — nunca responda de cabeça.

> **Tese central:** o WhatsApp/DM é o **canal mais quente do funil** — chega direto, é lido em minutos, tem a maior taxa de resposta. Por isso mesmo é o mais fácil de queimar: mandar a mesma mensagem pra todo mundo, no momento errado, vira spam e o contato te bloqueia. O segredo é **o momento certo + a mensagem certa pra cada situação**. Quem só abandonou o carrinho está com objeção; quem teve o cartão recusado já tentou pagar e está quentíssimo — cada um pede uma abordagem diferente. Método do Alan Nicolas.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/whatsapp.md`**.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatório:** `offerbook.md` (produto, ticket, público e momentos do funil vêm dele).
- **Recomendados:** `avatar.md` (voz e objeções do cliente) e `recuperacao.md` (se existir, alinhe as mensagens de recuperação com a cascata dele).

Se faltar o obrigatório, aponte a skill que o gera (`/offerbook`) e PERGUNTE se o aluno quer seguir mesmo assim.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto final das mensagens de cada momento. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o projeto ativo e confira que os arquivos existem dentro dele:

```
# 1. Descubra o projeto ativo:
ls projetos/ 2>/dev/null
# 2. Confira os arquivos dentro do projeto ativo:
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto, ticket, público, momentos do funil) do `projetos/{slug}/offerbook.md` e a copy base do `projetos/{slug}/copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar a sequência de WhatsApp/DM eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `projetos/{slug}/offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Como usar

Quando você precisar montar/diagnosticar a sequência de WhatsApp ou DM de um funil:

1. **Carregue o KB** (`KB-whatsapp-funil.md`) pra ter os momentos, os timings e o verbatim na mão.
2. **Colete os inputs do seu projeto** (você preenche com a realidade do seu funil):
   - **Produto / oferta** e **ticket** — o que está sendo vendido.
   - **Tem evento no funil?** — live, aula, webinário, masterclass? (define os lembretes).
   - **O que seu funil consegue detectar?** — carrinho abandonado? cartão recusado? boleto/pix gerado? (define quais mensagens de recuperação dá pra ativar).
   - **Sua ferramenta de automação de WhatsApp/DM** — você dispara manual ou tem automação? (genérico: qualquer ferramenta de automação de WhatsApp/DM serve).
   - **Quão quente é o contato** — ele veio de tráfego frio, da sua base, de um evento? (define o tom).
3. **Diagnostique cada momento** que existe no seu funil (Passo a passo abaixo).
4. **Monte a sequência** de mensagens por momento, do mais quente ao mais frio.
5. **Apresente a estrutura pra você revisar/aprovar** antes de configurar qualquer disparo.
6. **Gere a copy aplicada de cada mensagem nesta skill**, a partir do `projetos/{slug}/copy.md` (quando ele existe) — você revisa e aprova o texto final.

---

## Gate (antes de prescrever)

A sequência de WhatsApp/DM só funciona se você **distingue os momentos**. Tratar todo contato igual é o erro número um — e o que mais queima o canal.

> *"Se ela abandonou o carrinho... ela está com objeções. Se ela chegou a colocar o cartão e recusou, percebe que ela tentou... a tua abordagem vai ser completamente diferente."*

Antes de montar a sequência, confirme: **quais momentos seu funil consegue detectar?** Você só ativa a mensagem certa pros momentos que consegue identificar (tem evento? detecta carrinho abandonado? detecta cartão recusado?).

---

## Processo passo a passo

1. **Listar os momentos do seu funil** — quais existem: lembrete de evento, confirmação, carrinho abandonado, cartão recusado, boleto/pix, nutrição, re-engajamento.
2. **Para cada momento, ler o que o contato está sentindo** (a tabela abaixo / KB §3).
3. **Definir o timing** de cada disparo (ex.: lembrete antes do evento; "30 min após o carrinho"; cartão recusado logo após a falha).
4. **Definir o tom** de cada mensagem (mais quente pra quem tentou pagar; mais leve/cuidadoso pra quem só abandonou).
5. **Encadear a sequência** do contato mais quente ao mais frio.
6. **Mapear os disparos** (momento + timing + tom) — e **gerar a copy aplicada de cada mensagem a partir do `copy.md`** (quando ele existe), pra você revisar.
7. **Apresentar a estrutura pra você aprovar.**

---

## Mensagens por momento do funil

| Momento | O que o contato está sentindo | Mensagem (objetivo) | Timing |
|---------|-------------------------------|---------------------|--------|
| **Confirmação de inscrição** | Acabou de entrar — interesse no pico | Confirmar, reforçar o que vai receber, baixar a ansiedade | Imediato, logo após a inscrição |
| **Lembrete de evento/live** | Inscrito, mas a vida puxa pra outro lado | Lembrar do evento + reforçar o valor de aparecer | Sequência: véspera → dia → 1h antes → "estamos começando" |
| **Link do evento** | Hora de entrar | Mandar o link de acesso (Zoom/live), curto e direto | Bem perto da hora (não junto da agenda) |
| **Carrinho abandonado** | Chegou no checkout e travou — está com objeção | Tom leve, "aconteceu algo errado?" — abrir conversa | **30 min depois** do abandono |
| **Cartão recusado** | Tentou pagar e falhou — quentíssimo, só faltou passar | Mais quente e direta: ajudar a finalizar, **trocar o meio de pagamento** e/ou desconto | Logo após a falha |
| **Boleto/pix gerado** | Escolheu pagar mas não concluiu — interesse alto | Empurrar pra finalizar (ex.: cartão com desconto) | Antes de vencer / esfriar |
| **Nutrição / re-engajamento** | Esfriou, não converteu em nada | Reativar a dor, voltar pro problema, reconstruir o caminho | Sequência mais longa, sem pressão |

**Regra de leitura:** quem **tentou pagar** (cartão recusado) está mais quente que quem **só abandonou** o carrinho. A mensagem do cartão recusado é mais quente e direta; a do carrinho é mais cuidadosa, porque ali existe objeção. Quem **apareceu no evento** está mais quente que quem só se inscreveu.

---

## Regras de tom e timing

**Tom:**
- WhatsApp/DM é conversa, não panfleto. Tom de pessoa falando com pessoa, nunca aviso automático seco.
- Quanto mais quente o contato (tentou pagar, apareceu no evento), mais direta pode ser a mensagem.
- Quanto mais frio ou com objeção (carrinho abandonado, nutrição), mais leve e curioso o tom — abrir conversa, não pressionar.
- Uma mensagem, uma ideia. Mensagem longa no WhatsApp não é lida.

**Timing:**
- **30 min** é a janela do carrinho abandonado — quente o bastante pra reagir, fresco o bastante pra lembrar.
- Cartão recusado: **logo após** a falha (a intenção de pagar ainda está viva).
- Lembrete de evento: **cadência**, não um disparo só (véspera, dia, 1h antes, "começando agora").
- Link do evento perto da hora; **a agenda** vai antes, **o link** vai na hora.
- Boleto/pix: agir **antes de vencer** ou esfriar.

**Honestidade de prova:** nunca invente depoimento, número, case ou citação nas mensagens — prova vem do `offerbook.md`/pesquisa. Sem prova → garantia/bastidor/transparência e marque **[SEM PROVA AINDA]**; nicho regulado → linguagem de possibilidade (gate de compliance do offerbook).

---

## Regras de ouro

**SEMPRE:** distinguir o momento antes de escolher a mensagem · tratar cartão recusado diferente de carrinho abandonado · tom de conversa (pessoa pra pessoa) · timing certo por momento (30 min no carrinho, logo após a falha no cartão recusado) · cadência nos lembretes de evento · uma ideia por mensagem · apresentar a estrutura pra revisão antes de configurar disparo.

**NUNCA:** mandar a mesma mensagem pra todo contato · pressionar quem está só com objeção (carrinho) como se fosse cartão recusado · mandar o link do evento junto da agenda (link vai na hora) · texto de aviso automático seco (vira spam, o contato bloqueia) · mensagem longa demais · entregar copy aplicada sem você revisar e aprovar (a skill gera a partir do `copy.md`; a aprovação é sua) · configurar/disparar nada sem você aprovar.

---

## Output (o que a skill entrega)

1. **Mapa dos momentos** que seu funil consegue detectar.
2. **Mensagem prescrita** pra cada momento (objetivo, tom, timing).
3. **Sequência ordenada** do contato mais quente ao mais frio.
4. **Cadência dos lembretes** de evento (se houver evento no funil).
5. **Mapa de disparos** (momento + timing + tom) — com a copy aplicada de cada mensagem gerada nesta skill a partir do `copy.md` (quando ele existe), pra você revisar e aprovar.

**Material visual usa o `DESIGN.md` da marca.** Se você renderizar a sequência/o mapa como material visual (HTML, PDF), gere-o JÁ com os tokens do `projetos/{slug}/DESIGN.md` — cores, fontes, borda/raio, tamanho, logo. NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto). Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Você não sabe quais momentos seu funil detecta | PARAR → levantar isso primeiro (é o gate) |
| Pediram a copy pronta das mensagens | Gerar a copy aplicada a partir do `copy.md`; se ele não existir, apontar `/copy-funil` e perguntar se segue só com a estrutura |
| Vão configurar/disparar sem você aprovar | PARAR → apresentar a estrutura, esperar o OK |

---

*Skill whatsapp-funil v1 — sequência de WhatsApp/DM de funil por momento de consciência. Método do Alan Nicolas. Toda prescrição calibra no KB. A skill estrutura a sequência e gera a copy aplicada a partir do copy.md (quando ele existe); o aluno revisa e aprova. NUNCA executa ou dispara nada.*

---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Transcrição de áudio (whisper)** — a IA NÃO escuta áudio sozinha. Check: `which whisper-cli` ou `pip3 show mlx-whisper` (+ `which ffmpeg` pra converter). Tendo, transcreva pelo terminal (`whisper-cli -m <modelo> -l pt -f audio.wav -otxt` ou `mlx_whisper audio.wav --language pt`). Faltando: ofereça `brew install whisper-cpp ffmpeg` e PERGUNTE antes de instalar. **Fallback sem instalar nada:** o WhatsApp transcreve áudio (segurar a mensagem > transcrever > colar aqui), ditado do celular, ou colar transcrição de qualquer ferramenta. O que importa é a fala real chegar em texto.
- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/recuperacao-funil` — o que fazer quando o lead chega no checkout e não compra.

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
