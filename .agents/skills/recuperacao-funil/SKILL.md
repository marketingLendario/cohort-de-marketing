---
name: recuperacao-funil
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

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatório:** `offerbook.md` (produto, oferta e ticket que travam no checkout vêm dele).
- **Recomendados:** `avatar.md` (objeções reais de quem não comprou) e `espiao/dossie-*.md` (quebra de objeção com as brechas do concorrente).

Se faltar o obrigatório, aponte a skill que o gera (`/offerbook`) e PERGUNTE se o aluno quer seguir mesmo assim.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

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

> **CTA "falar com o time / IA de atendimento" (regra dura).** Pergunte se o dono tem um canal de atendimento humano ou IA. Se tiver, **insira em cada sequência** (sobretudo **cartão recusado** e **boleto/Pix**) um CTA "fale com a gente / tirar dúvida no WhatsApp" além do link de pagamento. Reabrir a conversa com uma pessoa converte muito no lead que travou. Registre o link como `[PLUG: canal de atendimento]` se ainda não houver.

> **Downsell — NÃO inventar nome nem preço** (mesma regra do `/backend-funil`): se o dono não definiu o produto/preço do downsell, marque `[DONO: definir downsell]` em `pendencias.md` e, no máximo, proponha candidatos pra ele escolher. Nunca gere "Ebook X por R$ 27" como oferta pronta.

> **Recuperação muda pelo Perfil** (topo do offerbook · `.claude/skills/_shared/perfil.md`): **B2B / ticket alto** → não é carrinho abandonado, é **no-show / reagendamento de reunião** (lembrete, "perdeu o horário? remarca aqui"). **Físico/local** → recuperação por **WhatsApp** local. **Afiliado** → a recuperação de checkout é do PRODUTOR (você não tem o checkout); avise em 1 linha e aponte a próxima peça do afiliado (`/conteudo-funil` ou `/criativos-funil`), sem gerar nada.

> **Pendências:** grave com **chave por decisão** (dedup no re-run) — regra em `.claude/skills/_shared/pendencias.md`.

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


> **Toda mensagem sai SEPARADA e com botão Copiar (regra dura).** Além do documento da peça, cada mensagem individual sai em arquivo próprio pronto pra usar: e-mail = 1 HTML por e-mail no padrão do disparador (tabela, inline, preheader, merge tags) com DOIS botões fixos no canto superior direito do preview: "Copiar texto" (só o texto do e-mail, pronto pra colar no editor da ferramenta) e "Copiar HTML" (o código LIMPO do e-mail, pronto pra colar no modo HTML da ferramenta); os botões removem a si mesmos do que é copiado; WhatsApp/DM = página com as mensagens em texto, botão "Copiar texto" em cada uma. Tudo listado num índice clicável (`emails/index.html` ou equivalente). O dono nunca precisa garimpar copy dentro de documento: é clicar, copiar, colar.

> **Mesmo layout dos e-mails da trilha (regra dura).** O e-mail de recuperação chega na MESMA caixa de entrada que os e-mails da trilha — tem que ser visivelmente a mesma marca. Antes de gerar os HTML: procure os e-mails já gerados pela `/email-funil` em `projetos/{slug}/emails/` e REUSE exatamente o mesmo template base (header, footer, cores, fontes, blocos — a versão de e-mail do `DESIGN.md`), trocando só o conteúdo. Se ainda não existir e-mail de trilha no projeto, monte o template a partir do `DESIGN.md` seguindo o mesmo padrão da `/email-funil` (preheader, eyebrow, headline, parágrafos, CTA, fecho). NUNCA invente um layout novo só pra recuperação.

> **Numeração de cadência invisível (regra dura).** E01/E02, "e-mail 1 de 3" ou qualquer notação de esteira NUNCA aparece renderizada: nem no assunto, nem no eyebrow, nem no corpo do e-mail, nem em badge no preview do dono. No preview, identifique o e-mail pelo comportamento e timing ("Cartão recusado · 15 min pós-falha"), sem código. A numeração vive só no nome do arquivo (`e01.html`) e na ordem do índice.

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

> **Nicho regulado — saúde (regra dura):** onde a tabela prescreve **desconto** (cartão recusado, boleto), em **saúde/médico** o incentivo **NUNCA é desconto anunciado** (vedação do conselho): é **facilitar o pagamento** (parcelar, trocar o meio, reenviar) e **reagendar**, nunca "R$ X off" na mensagem.

> **Sequência, NUNCA mensagem única (regra dura).** 1 mensagem por comportamento não é recuperação, é lembrete. Cada comportamento ativo gera uma **sequência de no mínimo 3 toques com timing definido**, e cada toque tem um ângulo DIFERENTE (nunca a mesma mensagem reenviada). Cadência padrão (o "Quando" da tabela acima é só o 1º toque; ajuste ao ciclo de compra do nicho e declare o que ajustou):
>
> | Comportamento | Toque 1 | Toque 2 | Toque 3 |
> |---|---|---|---|
> | **Cartão recusado** | 15 min: ajuda operacional (limite? banco travou?) + parcelado + Pix | 24h: quebra a objeção real + prova | 48h: urgência honesta (vaga/turma/condição expira) |
> | **Pix/boleto gerado** | 30 min: reenvia o código + facilita (copia e cola) | 24h ou véspera do vencimento: "vence hoje" + o que ele perde | Após vencer: gera código novo + última condição |
> | **Carrinho abandonado** | 30 min: leve, "aconteceu algo?" (sem vender) | 24h: quebra a objeção nº 1 do avatar + prova | 72h: escassez real ou ponte pro downsell |
> | **No-show de reunião (B2B/serviço)** | 15 min: "imprevisto? remarca aqui" + link | 24h: valor da conversa + 2 horários | 72h: última janela honesta |
>
> A progressão de ângulo é sempre: **1º toque remove atrito · 2º quebra objeção com prova · 3º dá o motivo honesto de agir agora.** Se o aluno tem WhatsApp além do e-mail, intercale os canais (ex.: toque 2 no WhatsApp). Downsell e re-nutrição entram DEPOIS da sequência direta esgotar, como degraus próprios da cascata. Cada toque sai como arquivo separado (`recuperacao/{comportamento}-{n}.html`) no índice, seguindo as regras de layout e numeração invisível acima.

> **Tudo separado POR COMPORTAMENTO (regra dura).** A recuperação nunca sai misturada: cada comportamento (cartão recusado, Pix/boleto, carrinho abandonado) é um **bloco fechado próprio**, com os seus 3 toques em CADA canal e o seu fluxo. No índice, os blocos aparecem lado a lado (Cartão recusado · Pix · Carrinho), e dentro de cada um: os 3 e-mails (`{comportamento}-1/2/3.html`), o WhatsApp do comportamento (`whatsapp-{comportamento}.html`) e o fluxo do comportamento (`fluxo-{comportamento}.html`). NUNCA um arquivo único de WhatsApp ou de fluxo juntando os comportamentos.
>
> **Contagem de toques bate entre os canais (regra dura).** Se o comportamento tem 3 toques, então são 3 e-mails E 3 mensagens de WhatsApp E 3 mensagens no fluxo, alinhados aos MESMOS 3 momentos (mesmo timing, mesmo ângulo). Nunca 3 num canal e 2 no outro. O dono escolhe por qual canal disparar cada toque (ou intercala), mas o toque existe nos três.
>
> **Fluxo de automação por comportamento (WhatsApp/DM via ManyChat ou equivalente).** Quando há WhatsApp/DM, cada comportamento ganha o **blueprint do fluxo de automação** pronto pra remontar na ferramenta do aluno (ManyChat, ou a que ele usar), em `recuperacao/{comportamento}-fluxo.html` (ou `fluxo-{comportamento}.html`), com a identidade do `DESIGN.md`. O fluxo é uma **sequência visual de passos de cima pra baixo**: **Gatilho** (tag/evento do checkout, ex.: `cartao_recusado`, `pix_gerado`, `carrinho_abandonado`) → para cada toque: **Smart Delay** (o tempo) → **Condição "comprou?"** (se SIM, sai do fluxo — NUNCA cobrar quem já pagou; se NÃO, segue) → **Mensagem** → ... → **Fim** (marca tag de esgotado e joga o lead na re-nutrição nível 4). Regras do fluxo: (1) a Condição "comprou?" vem SEMPRE antes de cada mensagem; (2) cada passo **"Mensagem" é CLICÁVEL e abre o texto ali mesmo** (expande na própria página, sem ir pra outra tela), e o texto aberto tem um **botão "Copiar texto"** dentro (nunca só o texto passivo, nunca só um link "abrir na outra página": o dono copia direto do passo do fluxo); (3) o nº de passos "Mensagem" bate com o nº de toques do comportamento. O fluxo entra como card próprio no bloco do comportamento, ao lado dos e-mails e do WhatsApp.

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

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
