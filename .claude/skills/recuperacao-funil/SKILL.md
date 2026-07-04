---
name: recuperacao
description: "Estrutura a sequência de recuperação de um funil — o que fazer quando o lead chega no checkout e não compra. Cada comportamento tem uma abordagem diferente: carrinho abandonado, cartão recusado, boleto gerado, downsell e re-elevação de consciência (jogar o lead de volta pro nível do problema). Funciona pelo princípio de que recuperar um lead que já chegou no checkout é mais barato do que adquirir um lead novo. Use quando precisar montar/diagnosticar a recuperação de um funil, decidir como abordar cada tipo de lead que não converteu, ou estruturar a cascata de re-engajamento. A skill estrutura a sequência e gera a copy aplicada das mensagens a partir do copy.md (quando ele existe); o aluno revisa e aprova."
user_invocable: true
---

# Recuperação — Sequência de re-elevação de consciência

Skill que estrutura o **funil de recuperação**: a sequência que reconquista o lead que chegou no checkout e não comprou. Cada comportamento (carrinho abandonado, cartão recusado, boleto, etc.) revela uma objeção diferente — e cada objeção pede uma abordagem diferente.

> **KB (fonte de verdade):** `KB-recuperacao.md` (nesta pasta). Tem o método completo com **verbatim** da fonte, as 5 abordagens por comportamento e a escala de consciência. **Carregue o KB antes de prescrever** — nunca responda de cabeça.

> **Tese central:** **recuperar é mais barato que adquirir.** O lead que travou no checkout já passou por todo o funil e já está quente. Em vez de comprar um lead novo, você o joga num funil de recuperação que o devolve a um nível mais baixo de consciência (de preferência o nível 4 — o problema) e reconstrói o caminho até a compra. *"Onde é que eu consigo fazer ele converter de novo mais rápido? Quando eu jogo ele pra cá, no nível 4. Eu elevo a consciência dele sobre os problemas dele. Então é aqui que converte mais."*

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatório:** `offerbook.md` (produto, oferta e ticket que travam no checkout vêm dele).
- **Recomendados:** `avatar.md` (objeções reais de quem não comprou) e `espiao/dossie-*.md` (quebra de objeção com as brechas do concorrente).

Se faltar o obrigatório, aponte a skill que o gera (`/offerbook`) e PERGUNTE se o aluno quer seguir mesmo assim.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem travessão (—) na copy (regra dura).** Travessão é cara de texto de IA. Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro), reescreva com ponto, vírgula ou dois-pontos. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo um link fixo **"← Book do Funil"** de volta pro hub — de qualquer peça se volta pro Book com 1 clique. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto final das mensagens da cascata de recuperação. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output anterior do funil. Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto acima).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos existem:**

```
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles (o `offerbook.md` te dá o produto/oferta/ticket que trava no checkout; o `copy.md`, o argumento pra reconstruir na recuperação).
- Se FALTAR, PARE e aponte a skill anterior:

> Pra montar a sequência de recuperação eu preciso de `projetos/{slug}/offerbook.md` (da skill `/offerbook`) e de `projetos/{slug}/copy.md` (da skill `/copy-funil`). Rode `/offerbook` primeiro e volte.

Não invente o que deveria vir da etapa anterior.

---

## Como usar

1. **Carregue o KB** (`KB-recuperacao.md`) pra ter o método e o verbatim na mão.
2. **Colete os inputs do seu projeto** (você preenche com a realidade do seu funil):
   - **Nicho / mercado** — em que mercado você vende.
   - **Produto / oferta principal** e **ticket** — o que trava no checkout.
   - **Produto de downsell** — você tem uma oferta mais barata pra oferecer a quem não fechou? Se não, é uma decisão a tomar.
   - **Comportamentos que seu checkout registra** — você consegue saber quem abandonou o carrinho? Quem teve cartão recusado? Quem gerou boleto? (isso define quais abordagens dá pra ativar).
   - **Canais que você tem** — e-mail, WhatsApp, SMS, remarketing.
3. **Diagnostique cada comportamento** que aparece no seu funil (Passo a passo abaixo).
4. **Monte a cascata** de recuperação, do lead mais quente ao mais frio.
5. **Apresente a estrutura pra você revisar/aprovar** antes de implementar qualquer disparo.
6. **Gere a copy aplicada de cada mensagem nesta skill**, a partir do `projetos/{slug}/copy.md` (quando ele existe) — você revisa e aprova o texto final.

---

## Gate (antes de prescrever)

A recuperação só funciona se você **distingue os comportamentos**. Tratar todo mundo que não comprou igual é o erro número um.

> *"Se ela abandonou o carrinho... ela está com objeções. Se ela chegou a colocar o cartão e recusou, percebe que ela tentou... a tua abordagem vai ser completamente diferente."*

Antes de montar a sequência, confirme: **quais comportamentos seu checkout/CRM consegue identificar?** Você só pode ativar a abordagem certa pros comportamentos que consegue medir.

---

## Modo pré-lançamento (o funil ainda não rodou)

Quase sempre o aluno está ANTES do primeiro lançamento — o checkout ainda não registrou comportamento nenhum (carrinho, cartão, boleto). Nesse caso **não monte a cascata no vácuo**. Entregue o SETUP:

1. **O que o checkout precisa rastrear pra cada abordagem funcionar:**
   - **Cartão recusado** — normalmente **nativo** do checkout (o gateway já sinaliza a falha do pagamento).
   - **Boleto gerado** — normalmente **nativo** (o checkout sabe que o boleto foi emitido e quando vence).
   - **Carrinho abandonado** — exige **integração** (capturar e-mail/contato antes do pagamento e disparar por um automatizador).

2. **Estrutura da cascata como PLANO pronto pra ativar** assim que o rastreio existir: cartão recusado → boleto → carrinho abandonado → downsell → re-nutrição (nível 4). Deixe cada degrau desenhado, mesmo que ainda não dê pra disparar.

3. **Qual integração habilita cada degrau:**
   - cartão recusado e boleto → já vêm do próprio checkout/gateway (nativos).
   - carrinho abandonado → integração checkout ↔ e-mail/WhatsApp (automatizador) capturando o contato antes do pagamento.
   - downsell e re-nutrição → automação de e-mail/WhatsApp com a lista segmentada por comportamento.

Assim que o checkout começar a registrar os comportamentos, volte e rode `/recuperacao-funil` de novo pra ativar a cascata com os dados reais.

---


> **Toda mensagem sai SEPARADA e com botão Copiar (regra dura).** Além do documento da peça, cada mensagem individual sai em arquivo próprio pronto pra usar: e-mail = 1 HTML por e-mail no padrão do disparador (tabela, inline, preheader, merge tags) com um botão flutuante "Copiar HTML do e-mail" que copia o código LIMPO (o botão remove a si mesmo do que é copiado); WhatsApp/DM = página com as mensagens em texto, botão "Copiar texto" em cada uma. Tudo listado num índice clicável (`emails/index.html` ou equivalente). O dono nunca precisa garimpar copy dentro de documento: é clicar, copiar, colar.

## Processo passo a passo

1. **Listar os comportamentos disponíveis** no seu funil (carrinho abandonado, cartão recusado, boleto gerado — quais você consegue rastrear).
2. **Para cada comportamento, ler a objeção** que ele revela (a tabela abaixo / KB §3).
3. **Definir a abordagem** correspondente (tom, gatilho de tempo, incentivo: desconto / troca de pagamento / nada).
4. **Encadear a cascata** do mais quente ao mais frio (KB §4): cartão recusado → boleto → carrinho abandonado → downsell → re-nutrição.
5. **Definir a re-elevação** pra quem não converteu em nada: jogar o lead pro **nível 4 (problema)** num funil de nutrição que reativa a dor.
6. **Mapear os disparos** (canal + momento) pra cada etapa — e **gerar a copy aplicada de cada mensagem a partir do `copy.md`** (quando ele existe), pra você revisar.
7. **Apresentar a estrutura pra você aprovar.**

---

## Abordagens por comportamento

| Comportamento | O que revela | Abordagem | Quando |
|---------------|--------------|-----------|--------|
| **Cartão recusado** | Tentou pagar — quentíssimo, só faltou o pagamento passar | Mais quente: **desconto** e/ou **trocar o meio de pagamento** | Logo após a falha |
| **Boleto gerado** | Escolheu pagar mas não tentou ainda — interesse alto | **Empurrar pro cartão com desconto** | Antes do boleto vencer |
| **Carrinho abandonado** | Está com objeção — algo travou a decisão | Mensagem leve, tom de "aconteceu algo errado?" | **30 min depois** |
| **Não comprou nada disso** | Barreira de preço | **Downsell** (produto mais barato) | Após a recuperação direta falhar |
| **Não comprou o downsell** | Esfriou — precisa reconstruir o caminho | **Funil de nutrição → re-eleva pro nível 4 (problema)** | Sequência mais longa |

**Regra de leitura:** quem **tentou pagar** (cartão recusado) está mais quente do que quem **só abandonou** o carrinho. A abordagem do cartão recusado é mais quente e direta; a do carrinho é mais cuidadosa, porque ali existe objeção.

---

## A escala de consciência (pra re-elevação)

| Nível | Estado do lead |
|-------|----------------|
| 5 — Inconsciente | não conhece você, nem sabe que tem o problema |
| 4 — Consciente do problema | sente a dor, não sabe que há solução |
| 3 — Consciente da solução | conhece categorias, não o seu produto |
| 2 — Consciente do produto | já sabe que seu produto existe |
| 1 — Mais consciente | já viu o pitch, só falta o empurrão |

**Recuperar = mover o lead de volta pro nível 4 (problema) ou 3 (solução)** e reconstruir a sequência. O nível 4 reconverte mais porque é onde a **dor** é reativada.

---

## Regras de ouro

**SEMPRE:** distinguir o comportamento antes de escolher a abordagem · tratar cartão recusado diferente de carrinho abandonado · começar pela abordagem mais quente e descer a cascata · re-elevar pro nível 4 (problema) quem não converteu · apresentar a estrutura pra revisão antes de disparar.

**NUNCA:** mandar a mesma mensagem pra todo mundo que não comprou · pressionar quem está só com objeção (carrinho) como se fosse cartão recusado · esquecer o downsell pra quem não fecha no ticket cheio · entregar copy aplicada sem você revisar e aprovar (a skill gera a partir do `copy.md`; a aprovação é sua) · disparar nada sem você aprovar.

**Honestidade de prova:** nunca invente depoimento, número, case ou citação nas mensagens de recuperação — prova vem do `offerbook.md`/pesquisa. Sem prova → garantia/bastidor/transparência e marque **[SEM PROVA AINDA]**; nicho regulado → linguagem de possibilidade (gate de compliance do offerbook).

---

## Output (o que a skill entrega)

1. **Mapa dos comportamentos** que seu funil consegue rastrear.
2. **Abordagem prescrita** pra cada comportamento (tom, tempo, incentivo).
3. **Cascata de recuperação** ordenada do mais quente ao mais frio.
4. **Plano de re-elevação** (pra qual nível jogar quem não converteu e por quê).
5. **Mapa de disparos** (canal + momento por etapa) — com a copy aplicada de cada mensagem gerada nesta skill a partir do `copy.md` (quando ele existe), pra você revisar e aprovar.

> **Onde salvar:** a sequência desta skill sai em **`projetos/{slug}/recuperacao.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Você não sabe quais comportamentos seu checkout rastreia | PARAR → levantar isso primeiro (é o gate) |
| Pediram a copy pronta das mensagens | Gerar a copy aplicada a partir do `copy.md`; se ele não existir, apontar `/copy-funil` e perguntar se segue só com a estrutura |
| Vão disparar sem você aprovar | PARAR → apresentar a estrutura, esperar o OK |

---

*Skill recuperacao v1 — método de funil de recuperação / re-elevação de consciência. Toda prescrição calibra no KB. A skill estrutura a sequência e gera a copy aplicada a partir do copy.md (quando ele existe); o aluno revisa e aprova.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base `projetos/{slug}/recuperacao` (convenção da pasta):

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/recuperacao-funil/scripts/gerar_pdf.sh <arquivo>.html
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
