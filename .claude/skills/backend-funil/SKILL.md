---
name: back-end
description: "Estrutura o back-end de um funil pelo método de Alan Nicolas — a parte onde mora o lucro. Dado o produto de entrada (front-end) e o público, monta a estrutura ramificada de maximização de ticket: upsell (e segundo upsell), OTO (One Time Offer), order bump, downsell, a janela de 4h pós-compra, a página de upsell com a janela de dopamina (3–7 segundos) e o raciocínio de LTV (lifetime value). Estrutura ramificada: comprou → sobe (upsell), não comprou → desce (downsell). Use quando você quiser montar/diagnosticar o back-end de um funil, decidir upsell vs downsell, desenhar a página de upsell ou planejar como vender mais de uma vez ao mesmo cliente. A skill estrutura e gera a copy aplicada (página de upsell/OTO e downsell) a partir do copy.md, quando ele existe; você revisa e aprova."
user_invocable: true
---

# Back-end do Funil — Onde Mora o Lucro

Skill que estrutura o **back-end** de um funil pelo método de **Alan Nicolas** (Workshop de Funis). O front-end captura o lead e banca o tráfego; é no back-end que o dinheiro de verdade aparece.

> **KB (fonte de verdade):** `KB-back-end.md` (nesta pasta). Tem os frameworks de back-end com o **verbatim real do Alan**, a estrutura ramificada e a tabela das mecânicas. **Carregue o KB antes de estruturar** — nunca responda de cabeça.

> **Tese central:** o produto de entrada não é onde está o lucro — ele banca o tráfego e captura o lead. O lucro mora no back-end (oferta cara: consultoria, mentoria, produto premium), e o melhor momento de vender pra alguém é **logo depois que essa pessoa compra**. *"O melhor momento de vender algo pra pessoa? Depois que ela compra."*

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatório:** `projetos/{slug}/offerbook.md` — o front-end/oferta de entrada é o gatilho de toda a ramificação. Se faltar, aponte a skill `/offerbook` (que o gera) e **PERGUNTE se o usuário quer seguir mesmo assim**.
- **Recomendados:** `avatar.md` (da `/avatar-funil`) e `funil.md` (da `/metodo-funil`).

> **Honestidade de dados:** nunca invente número, depoimento ou case — a prova vem da pesquisa e do `offerbook.md`.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e cada card linka SEMPRE o `.html` da peça (o `.md` e o `.docx` são fonte interna; o que o dono abre pelo Book é o `.html`) — NUNCA linke `.md` no Book, e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. **Página de roteiro/VSL leva DOIS botões explícitos no topo (regra dura):** um **"← Voltar pra [a página a que ela pertence]"** (link DIRETO pro arquivo da página, ex.: `index.html` da própria pasta) E o **"← Book do Funil"** — nunca só o do Book, senão quem lê o roteiro e clica em voltar cai no hub em vez da página de onde veio. **O fallback do "← Voltar" resolve pro caminho relativo REAL do Book conforme a profundidade da pasta** (`../index.html`, `../../index.html`…), NUNCA um `index.html` fixo que não existe naquele nível: `href` errado faz o "Voltar" cair em nada. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: Purchase (front) · view da página de upsell · Purchase do upsell/OTO · downsell aceito. Sem esses eventos não existe conta de LTV.

> **Layout da página do lead (regra dura).** Vale pra TODA página voltada ao lead gerada por esta skill (upsell, OTO, downsell): **(1) quando a página tem vídeo, o botão de CTA fica SEMPRE ABAIXO do vídeo, nunca acima** — badges, selos e números de credibilidade vêm DEPOIS do CTA, nunca entre a headline e o vídeo; **(2) o botão de CTA é sempre centralizado** na página, em toda dobra em que aparecer; **(3) no mobile, o vídeo aparece assim que a página abre** — visível na primeira dobra, sem rolar; se não couber, enxugue o que vem antes dele, nunca empurre o vídeo pra baixo; **(4) jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "OTO", "upsell", "downsell" como eyebrow/rótulo/título de seção em NENHUMA página. Esses nomes vivem nos documentos internos do dono; na página, cada seção mostra só a copy real que o lead deve ler.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — a copy da página de upsell/OTO e do downsell. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto acima).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos existem:**

```
ls projetos/{slug}/offerbook.md projetos/{slug}/funil.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto de entrada/front-end, produtos de back-end, ticket) do `offerbook.md` e a estrutura do funil do `funil.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o back-end do funil eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e do `projetos/{slug}/funil.md` pra estrutura do funil, da skill `/metodo-funil`). Rode `/offerbook` primeiro; quando o `offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Como usar

Quando você quiser montar ou diagnosticar o back-end de um funil:

1. **Carregar o KB** (`KB-back-end.md`) pra ter os frameworks e o verbatim na mão.
2. **Coletar os inputs do seu projeto** (preencher com os dados do seu negócio — perguntar só os que ainda não vieram):
   - **Produto de entrada (front-end)** e o ticket dele — `[preencher]`
   - **Produto(s) de back-end** disponíveis pra subir o cliente (ticket maior) — `[preencher]`
   - **Produto mais barato** pra oferecer a quem recusa o upsell (downsell) — `[preencher]`
   - **Público** — de onde ele vem e quão quente está no momento da compra — `[preencher]`
3. **Mapear a estrutura ramificada** (Passo a passo abaixo): comprou → sobe, não comprou → desce.
4. **Desenhar a página de upsell** dentro da janela de dopamina (3–7s) e respeitar a janela de 4h.
5. **Apresentar a estrutura pra você revisar/aprovar** — a skill entrega o esqueleto, você decide e aprova.
6. **Copy aplicada nesta skill:** os textos da página de upsell/OTO e do downsell são gerados aqui a partir do `projetos/{slug}/copy.md` (quando ele existe) — você revisa e aprova. Os e-mails saem do `/email-funil`.

---

## Gate (antes de estruturar)

**Antes de montar o back-end, três coisas precisam existir.** Sem elas, não dá pra ramificar:

| Pré-requisito | Por quê |
|---------------|---------|
| **Front-end definido** (produto de entrada + ticket) | é o gatilho da ramificação — tudo começa na compra dele |
| **Pelo menos um produto de back-end** (ticket maior) | sem oferta cara pra subir, não há upsell |
| **Um produto mais barato** pra downsell | sem ele, quem recusa o upsell sai sem nada — perde-se a recuperação |

Se faltar algum, **PARAR e definir antes** — não dá pra estruturar back-end sem os produtos das pontas.

---

## Passo a passo (montar o back-end)

Reconstruído do método (ordem que o Alan crava):

1. **Confirmar o raciocínio de LTV** — entender que o front banca o tráfego e o lucro está no back; o objetivo é **vender mais de uma vez ao mesmo cliente**. O front pode até dar prejuízo controlado porque o back recupera.
2. **Mapear a ramificação** — comprou o front → oferece **upsell** (ticket maior); não comprou / recusou → oferece **downsell** (ticket menor).
3. **Definir o upsell** — vídeo curto (2–5 min) com o upgrade, oferecido **imediatamente** após a compra.
4. **Adicionar o segundo upsell (2ª OTO)** quando fizer sentido — os melhores funis têm dois.
5. **Transformar a oferta em OTO de verdade** — única, irrepetível naquele momento; **não reoferecer depois** (é o que dá credibilidade). Usar plausibilidade ("já que vai no mesmo frete", "renovar com 80% off pra eu não ter que te lembrar depois").
6. **Definir o order bump** (se houver) — item adicional no checkout, mesma lógica do "mesmo frete".
7. **Estruturar o downsell** — produto mais barato pra recuperar quem disse não ao upsell.
8. **Desenhar a página de upsell** — vídeo curto que aparece na **janela de dopamina (3–7s)** pós-checkout (dopamina elevada, cartão na mão, momento máximo de confiança).
9. **Respeitar a janela de 4h** — o cliente esfria depois disso; toda a sequência de back-end acontece quente.

---

## Slots vazios? A skill pesquisa o mercado e propõe (nunca deixa só [DONO DEFINE])

Se o offerbook não tem produto de back-end, downsell ou entrada barata definidos, a skill NÃO devolve um placeholder seco. Ela pesquisa e propõe candidatos:

1. **Olhe o que o NICHO já vende** — fontes na ordem: `espiao/dossie-*.md` (o que o concorrente vende como entrada/club/premium), a curadoria/coleta do `/conteudo-funil` (ofertas visíveis nos conteúdos dos criadores do nicho) e WebSearch ("o que [nicho] vende low ticket", concorrentes + "preço"). Cite a fonte de cada referência; se não achou preço real, "preço não obtido".
2. **Proponha 2-3 candidatos POR SLOT** com formato + faixa de ticket + prós/contras, sempre casando com o MECANISMO da marca (o downsell coerente vende o mesmo mecanismo num degrau menor — nunca um produto que contradiz a Big Idea).
3. **Inclua a opção de LOW TICKET DE CAPTAÇÃO** (self-liquidating front): produto barato (R$ 27-97: guia, template, workshop pago, diagnóstico ao vivo) cujo papel não é lucro, é **bancar o tráfego e encher a base com COMPRADOR** (lead que pagou vale mais que lead de isca grátis). Formatos comuns por nicho: ebook/guia, template/planilha, workshop/imersão paga, miniauditoria/diagnóstico pago, comunidade de entrada.
4. O dono escolhe; a decisão entra em `pendencias.md` como 1 decisão com os slots juntos.

## Estrutura ramificada (comprou → sobe / não comprou → desce)

Reconstrução fiel do exemplo do Alan (adapte aos seus produtos):

```
COMPRA do front-end
   │
   ├─ comprou ──► UPSELL 1 (ticket maior)
   │                 │
   │                 ├─ comprou / já tem / com cartão ──► UPSELL 2 (2ª OTO, ticket ainda maior)
   │                 │
   │                 └─ recusou / sem cartão ───────────► DOWNSELL (produto mais barato)
   │
   └─ não comprou ──► DOWNSELL (produto mais barato)
```

- **Comprou → sobe** (upsell de ticket maior).
- **Não comprou → desce** (downsell pra recuperar).
- Os melhores funis têm um **segundo upsell** na ramificação de quem subiu.

---

## Mecânicas do back-end (resumo — detalhe + verbatim no KB)

| Mecânica | Quando | Formato / regra |
|----------|--------|-----------------|
| **Front-end** | entrada | banca o tráfego + captura o lead; pode dar prejuízo controlado |
| **Back-end** | depois da entrada | ticket alto; onde mora o lucro |
| **LTV** | ciclo do cliente | vender mais de uma vez ao mesmo cliente |
| **Janela de 4h** | até 4h pós-compra | prazo em que a pessoa ainda compra de você |
| **Upsell** | logo após a compra | vídeo curto 2–5 min com o upgrade |
| **Segundo upsell (2ª OTO)** | após o 1º upsell | os melhores funis têm dois |
| **OTO (One Time Offer)** | momento único | irrepetível de verdade; não reoferecer; plausibilidade ajuda |
| **Order bump** | no checkout | item adicional somado ao pedido ("mesmo frete") |
| **Downsell** | quem recusa o upsell | produto mais barato pra recuperar |
| **Página de upsell** | imediato pós-checkout | janela de dopamina 3–7s; vídeo curto |

---

## As duas janelas (não confundir)

- **Janela de 4 horas** (macro): prazo em que a pessoa ainda está quente pra comprar de você depois da compra. *"Quatro horas após a pessoa comprar, ela já esfriou pra comprar algo de ti."*
- **Janela de dopamina de 3–7 segundos** (micro): o gatilho do momento exato pós-checkout em que a página de upsell deve aparecer. *"dopamina elevada, consistência cognitiva, cartão na mão, momento máximo de confiança... você tem de 3 a 7 segundos antes da dopamina começar a cair."*

---

## Regras de ouro

**SEMPRE:** raciocinar por LTV (vender mais de uma vez ao mesmo cliente) · oferecer o upsell logo depois da compra · fazer a OTO ser realmente única · usar plausibilidade na oferta (mesmo frete, porquê) · oferecer downsell a quem recusa · colocar a página de upsell na janela de dopamina (3–7s) · agir dentro da janela de 4h.

**NUNCA:** medir lucro pelo front-end · deixar quem recusa o upsell sair sem downsell · reoferecer a OTO depois (mata a credibilidade) · esperar e-mail frio pra oferecer o upgrade (a janela esfria) · inventar número, depoimento ou case (prova vem da pesquisa/offerbook) · entregar copy aplicada sem você revisar e aprovar (a skill gera a partir do `copy.md`; a aprovação é sua).

---

## Output (o que a skill entrega)

Pra cada pedido de back-end, entregar um **plano estruturado**:
1. **Raciocínio de LTV** do seu funil (front banca, back lucra).
2. **Mapa da ramificação** (comprou → upsell 1 → upsell 2 / downsell; não comprou → downsell), com seus produtos encaixados.
3. **Esqueleto de cada oferta** (upsell, 2ª OTO, order bump, downsell) com a regra de cada uma.
4. **Estrutura da página de upsell** (vídeo curto, janela de dopamina, gatilhos).
5. **Timing** (janela de 4h + janela de 3–7s).
6. **A copy aplicada da página de upsell/OTO e do downsell** (gerada nesta skill a partir do `copy.md`, quando ele existe) + o que falta você preencher (valores, produtos).

> **Lacunas conhecidas** (KB §6): o termo **order bump** não é verbatim do Alan (inferido do princípio "mesmo frete" + momento de compra); e a fonte não traz métricas de MRR/recorrência nem CAC/payback. Sinalizar quando o pedido cair nessas áreas.

> **Onde salvar:** o plano desta skill sai em **`projetos/{slug}/backend-funil.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Quando NÃO estruturar

| Situação | Ação |
|----------|------|
| Não há produto de back-end (ticket maior) | PARAR → definir a oferta cara antes |
| Não há produto pra downsell | PARAR → definir o produto mais barato antes |
| Pediram a copy pronta (textos finais) | Gerar a copy aplicada a partir do `copy.md`; se ele não existir, apontar `/copy-funil` e perguntar se segue só com a estrutura |
| Vão subir sem revisão | PARAR → apresentar a estrutura, esperar seu OK |

---

*Skill back-end v1 — método extraído do funil de Alan Nicolas (Workshop de Funis): Front-end/Back-end e LTV, Upsell/OTO/Downsell, página de upsell e janela de dopamina. Toda estrutura calibra no KB. A copy aplicada é gerada nesta skill a partir do copy.md (quando ele existe); o aluno revisa e aprova.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base `projetos/{slug}/backend-funil`:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/backend-funil/scripts/gerar_pdf.sh <arquivo>.html
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
