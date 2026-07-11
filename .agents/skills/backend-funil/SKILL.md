---
name: backend-funil
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

## Passo 0 — Checar insumos antes de rodar

- **Obrigatório:** `projetos/{slug}/offerbook.md` — o front-end/oferta de entrada é o gatilho de toda a ramificação. Se faltar, aponte a skill `/offerbook` (que o gera) e **PERGUNTE se o usuário quer seguir mesmo assim**.
- **Recomendados:** `avatar.md` (da `/avatar-funil`) e `funil.md` (da `/metodo-funil`).

> **Honestidade de dados:** nunca invente número, depoimento ou case — a prova vem da pesquisa e do `offerbook.md`.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: Purchase (front) · view da página de upsell · Purchase do upsell/OTO · downsell aceito (sem esses eventos não existe conta de LTV). Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página.

> **Tarja de urgência (específico desta peça).** A página de upsell/OTO sai por padrão com a TARJA DE URGÊNCIA no topo ("Espere, não saia desta página" / "sua compra ainda não terminou") — ajuda muito a conversão da janela de dopamina.

> **Downsell — NÃO inventar nome nem preço (regra dura, No Invention).** Se o dono não informou o produto/preço do downsell (ou do order bump), NÃO gere um produto fechado tipo "Ebook X por R$ 27". Marque `[DONO: definir produto e preço do downsell]` e mande pra `pendencias.md`. Você pode PROPOR candidatos (formato + faixa) casados ao mecanismo, mas apresentados como proposta pro dono escolher, nunca como oferta pronta.

> **Back-end muda pelo Perfil do Projeto** (ler o topo do offerbook; regra em `.claude/skills/_shared/perfil.md`): **B2B** → o "back-end" é expansão de conta, renovação, programa de indicação e material de venda interna (não upsell/OTO digital). **Físico/varejo local** → fidelidade, recompra, clube/assinatura. **Afiliado** → não há back-end próprio (o back-end é do produtor).

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

> **Exceção B2B/serviço de reunião (regra dura — lê o Perfil do topo do offerbook):** **Perfil = B2B / serviço de reunião → os 3 pré-requisitos viram: conta pra EXPANDIR, oferta de RENOVAÇÃO e programa de INDICAÇÃO — a ramificação upsell/OTO/janela de dopamina NÃO se aplica; monte o back-end B2B com esses 3.**
> **Exceção afiliado (regra dura):** **Perfil = afiliado → o back-end é do PRODUTOR (você não controla o checkout); avise em 1 linha e aponte a próxima peça do afiliado (`/conteudo-funil` ou `/criativos-funil`), sem gerar nada.**

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

> **Exceções do Perfil (ver Gate acima):** **B2B / serviço de reunião** não para por falta de upsell/downsell — monta EXPANSÃO + RENOVAÇÃO + INDICAÇÃO (a ramificação upsell/OTO/dopamina não se aplica). **Afiliado** não gera back-end (é do produtor): avise em 1 linha e aponte `/conteudo-funil` ou `/criativos-funil`.

---

*Skill back-end v1 — método extraído do funil de Alan Nicolas (Workshop de Funis): Front-end/Back-end e LTV, Upsell/OTO/Downsell, página de upsell e janela de dopamina. Toda estrutura calibra no KB. A copy aplicada é gerada nesta skill a partir do copy.md (quando ele existe); o aluno revisa e aprova.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
