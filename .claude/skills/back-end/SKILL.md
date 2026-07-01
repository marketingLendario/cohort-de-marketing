---
name: back-end
description: "Estrutura o back-end de um funil pelo método de Alan Nicolas — a parte onde mora o lucro. Dado o produto de entrada (front-end) e o público, monta a estrutura ramificada de maximização de ticket: upsell (e segundo upsell), OTO (One Time Offer), order bump, downsell, a janela de 4h pós-compra, a página de upsell com a janela de dopamina (3–7 segundos) e o raciocínio de LTV (lifetime value). Estrutura ramificada: comprou → sobe (upsell), não comprou → desce (downsell). Use quando você quiser montar/diagnosticar o back-end de um funil, decidir upsell vs downsell, desenhar a página de upsell ou planejar como vender mais de uma vez ao mesmo cliente. A skill estrutura — a copy final é escrita por você."
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
6. **A copy final fica com você:** os textos da página de upsell, do downsell e dos e-mails são escritos por você (ou pelo seu copywriter). A skill estrutura a mecânica, não escreve a copy.

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

**NUNCA:** medir lucro pelo front-end · deixar quem recusa o upsell sair sem downsell · reoferecer a OTO depois (mata a credibilidade) · esperar e-mail frio pra oferecer o upgrade (a janela esfria) · escrever a copy final pela skill (a copy é sua).

---

## Output (o que a skill entrega)

Pra cada pedido de back-end, entregar um **plano estruturado**:
1. **Raciocínio de LTV** do seu funil (front banca, back lucra).
2. **Mapa da ramificação** (comprou → upsell 1 → upsell 2 / downsell; não comprou → downsell), com seus produtos encaixados.
3. **Esqueleto de cada oferta** (upsell, 2ª OTO, order bump, downsell) com a regra de cada uma.
4. **Estrutura da página de upsell** (vídeo curto, janela de dopamina, gatilhos).
5. **Timing** (janela de 4h + janela de 3–7s).
6. **O que falta você preencher / escrever** (copy, valores, produtos).

> **Lacunas conhecidas** (KB §6): o termo **order bump** não é verbatim do Alan (inferido do princípio "mesmo frete" + momento de compra); e a fonte não traz métricas de MRR/recorrência nem CAC/payback. Sinalizar quando o pedido cair nessas áreas.

> **Onde salvar:** o plano desta skill sai em **`projetos/{slug}/back-end.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Quando NÃO estruturar

| Situação | Ação |
|----------|------|
| Não há produto de back-end (ticket maior) | PARAR → definir a oferta cara antes |
| Não há produto pra downsell | PARAR → definir o produto mais barato antes |
| Pediram a copy pronta (textos finais) | A skill não escreve copy — entregar o esqueleto pra você escrever |
| Vão subir sem revisão | PARAR → apresentar a estrutura, esperar seu OK |

---

*Skill back-end v1 — método extraído do funil de Alan Nicolas (Workshop de Funis): Front-end/Back-end e LTV, Upsell/OTO/Downsell, página de upsell e janela de dopamina. Toda estrutura calibra no KB. A copy final é escrita por você.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base `projetos/{slug}/back-end`:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/back-end/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
