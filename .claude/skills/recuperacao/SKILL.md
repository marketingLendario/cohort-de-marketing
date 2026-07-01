---
name: recuperacao
description: "Estrutura a sequência de recuperação de um funil — o que fazer quando o lead chega no checkout e não compra. Cada comportamento tem uma abordagem diferente: carrinho abandonado, cartão recusado, boleto gerado, downsell e re-elevação de consciência (jogar o lead de volta pro nível do problema). Funciona pelo princípio de que recuperar um lead que já chegou no checkout é mais barato do que adquirir um lead novo. Use quando precisar montar/diagnosticar a recuperação de um funil, decidir como abordar cada tipo de lead que não converteu, ou estruturar a cascata de re-engajamento. A skill estrutura a sequência — o texto final de cada mensagem é trabalho de copy."
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
6. **Escreva (ou mande escrever) a copy** de cada mensagem depois — a skill estrutura a sequência; o texto final é trabalho de copy.

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

Assim que o checkout começar a registrar os comportamentos, volte e rode `/recuperacao` de novo pra ativar a cascata com os dados reais.

---

## Processo passo a passo

1. **Listar os comportamentos disponíveis** no seu funil (carrinho abandonado, cartão recusado, boleto gerado — quais você consegue rastrear).
2. **Para cada comportamento, ler a objeção** que ele revela (a tabela abaixo / KB §3).
3. **Definir a abordagem** correspondente (tom, gatilho de tempo, incentivo: desconto / troca de pagamento / nada).
4. **Encadear a cascata** do mais quente ao mais frio (KB §4): cartão recusado → boleto → carrinho abandonado → downsell → re-nutrição.
5. **Definir a re-elevação** pra quem não converteu em nada: jogar o lead pro **nível 4 (problema)** num funil de nutrição que reativa a dor.
6. **Mapear os disparos** (canal + momento) pra cada etapa — deixando o **texto da mensagem como tarefa de copy separada**.
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

**NUNCA:** mandar a mesma mensagem pra todo mundo que não comprou · pressionar quem está só com objeção (carrinho) como se fosse cartão recusado · esquecer o downsell pra quem não fecha no ticket cheio · escrever a copy final dentro da skill (é tarefa de copy separada) · disparar nada sem você aprovar.

---

## Output (o que a skill entrega)

1. **Mapa dos comportamentos** que seu funil consegue rastrear.
2. **Abordagem prescrita** pra cada comportamento (tom, tempo, incentivo).
3. **Cascata de recuperação** ordenada do mais quente ao mais frio.
4. **Plano de re-elevação** (pra qual nível jogar quem não converteu e por quê).
5. **Mapa de disparos** (canal + momento por etapa) — com o texto marcado como tarefa de copy.

> **Onde salvar:** a sequência desta skill sai em **`projetos/{slug}/recuperacao.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Você não sabe quais comportamentos seu checkout rastreia | PARAR → levantar isso primeiro (é o gate) |
| Pediram a copy pronta das mensagens | Estruturar a sequência e deixar o texto como tarefa de copy separada |
| Vão disparar sem você aprovar | PARAR → apresentar a estrutura, esperar o OK |

---

*Skill recuperacao v1 — método de funil de recuperação / re-elevação de consciência. Toda prescrição calibra no KB. A skill estrutura a sequência; o texto final de cada mensagem é trabalho de copy.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base `projetos/{slug}/recuperacao`:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/recuperacao/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
