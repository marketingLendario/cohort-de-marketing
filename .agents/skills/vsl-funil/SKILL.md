---
name: vsl-funil
description: "Estrutura um funil de VSL Direct Response do zero, seguindo o método de oferta -> funil -> escala -> ticket. Entra nicho + produto, sai a estrutura completa: oferta (dor, mecanismo do problema, mecanismo da solução), funil de VSL com upsell, plano de escala por múltiplos funis e estratégia de ticket cartão/Pix. Use quando você pedir pra montar funil, VSL, estruturar oferta Direct Response ou planejar escala de funil."
user_invocable: true
---

# Funil VSL — Direct Response

Skill que estrutura um funil de VSL (Video Sales Letter) no modelo Direct Response, do zero até a escala. Baseada no método do Alan Nicolas.

> **Promessa do método:** estruturar um funil que escala por múltiplos canais, onde o ticket de entrada é isca e o lucro real vem do upsell.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/vsl.md`** (+ `.html` e `.pdf`).

---

## Passo 0 — Checar insumos antes de rodar

Rode `ls projetos/{slug}/` e veja o que já existe. Insumos desta skill:

- **Obrigatório:** `offerbook.md` — dele saem a dor, o mecanismo e a oferta (sai da skill `/offerbook`).
- **Recomendados:** `avatar.md` (dores e público reais), `espiao/dossie-*.md` (brechas do concorrente), `swipe/briefing-swipe-file.md` (hooks e referências validadas).

Se faltar um obrigatório, aponte a skill que o gera e **PERGUNTE** se o usuário quer seguir mesmo assim — não trave silenciosamente, não assuma.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o **projeto ativo** (ver "convenção de projeto" acima) e confira que os arquivos existem dentro dele:

```
ls projetos/ 2>/dev/null                                        # descobrir o projeto ativo (slug)
ls projetos/{slug}/copy.md projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir(em), leia deles a copy base da VSL/página do `projetos/{slug}/copy.md` e a oferta (dor, mecanismo do problema/solução, entregáveis, preço) do `projetos/{slug}/offerbook.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de VSL eu preciso da `projetos/{slug}/copy.md`, que sai da skill `/copy-funil` (e do `projetos/{slug}/offerbook.md` pra oferta, da skill `/offerbook`). Rode `/copy-funil` primeiro; quando `projetos/{slug}/copy.md` existir, volte e rode esta skill de novo.

> **Exceção:** **Perfil = afiliado → NÃO pare aqui; siga pro Modo Afiliado abaixo** (o gate se satisfaz com o Registro da Oferta do Produtor no lugar do offerbook/copy próprios).

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 (inconsciente/frio), ticket de entrada baixo (R$ 297-497) com lucro no upsell.

---

## Gate — Perfil do Projeto (ler ANTES de montar a VSL)

Leia o **Perfil do Projeto** no topo do `projetos/{slug}/offerbook.md` — regra compartilhada em **`.claude/skills/_shared/perfil.md`**. Ele muda a VSL:

- **Ticket / Tipo mandam no CTA (regra dura):** o CTA da VSL não é sempre "compre agora por R$297". Leia **Ticket** e **Tipo** do Perfil: ticket **alto (5k+)** ou **B2B / serviço** → o fecho da VSL é **marcar uma reunião / aplicação / diagnóstico** (agendamento), NUNCA checkout direto nem "adicione ao carrinho". Ticket **baixo** → venda direta no checkout (o padrão deste formato). Ajuste a fase de oferta e o botão da página à realidade do Perfil.
- **Guard de enquadramento (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **PROIBIDO** enquadrar a VSL como especialista/curso/mentoria e usar "depoimento de aluno" como prova. Use voz do cliente, prova de uso e case. O enquadramento "especialista que ensina um método" só vale quando **Tipo = especialista**.
- Sem Perfil no offerbook → use o padrão (Tipo = especialista, Ticket = baixo, Voz = pessoa) e siga, nunca trave.

> **Nunca travar (glossário de leigo).** Vale aqui a regra de **`.claude/skills/_shared/nunca-travar.md`**: todo pré-requisito ou ferramenta é explicado em linguagem de leigo com glossário inline (ex.: "VSL = o vídeo de vendas que a pessoa assiste antes de decidir comprar"; "checkout = a página de pagamento"). Se algum passo usa scraping/coleta, a ferramenta central é o **Apify** (nunca opcional; fallback só quando a cota estourou). E **nunca prometa que o HTML abre sozinho** — sempre entregue o caminho do arquivo + como abrir no SO do aluno.

---

## Modo Afiliado — VSL sobre a OFERTA DO PRODUTOR (quando Situação = afiliado)

Se o **Perfil** traz **Situação = afiliado**, NÃO existe offerbook nem mecanismo próprios: a VSL é construída **sobre a oferta do PRODUTOR**. Regras deste modo:

- **A oferta vem do produtor, não sua:** produto, promessa/transformação, preço, comissão e a **página oficial de vendas/checkout** são os do produtor. Você NÃO cria dor+mecanismo do problema+mecanismo da solução próprios (Fase 1 vira **leitura** da oferta do produtor, não construção). Não invente entregáveis, bônus ou garantia que o produtor não oferece.
- **Sem back-end próprio:** sem upsell/OTO/downsell/order bump seus (Fase 2 e Fase 3 de back-end não se aplicam) — o upsell é o do produtor, dentro do funil dele. Sua VSL é uma **peça de pré-venda / vídeo-ponte** que aquece e entrega o clique.
- **O CTA leva pro checkout do produtor:** o botão da VSL manda pra **página oficial do produtor com o seu link de afiliado** (o que preserva a comissão), NUNCA pra um checkout seu. Marque o link como `[PLUG: SEU_LINK_DE_AFILIADO]` no `pendencias.md` se o aluno ainda não tiver.
- **Honestidade de prova continua valendo:** só use prova (número, depoimento, case) que o **produtor** disponibiliza publicamente ou que seja sua e real; nunca invente resultado alheio. Respeite o compliance do nicho do produto.
- **Insumo:** na falta de offerbook próprio, os insumos são a **página oficial do produtor** e o material de afiliado que ele libera. Se o aluno não colou nada, PERGUNTE pela página/oferta do produtor antes de escrever a VSL — não assuma.

---

## Regra de honestidade de prova

- **Nunca inventar** depoimento, número, case ou citação. Toda prova vem do offerbook ou de pesquisa real.
- **Sem prova disponível** → use estratégia alternativa (garantia forte, bastidor, transparência) e marque `[SEM PROVA AINDA]`.
- **Nicho regulado** → linguagem de possibilidade, sem "resultado garantido" (respeite o gate de compliance do offerbook).

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: PageView · play da VSL · profundidade de vídeo (25/50/75%) · **chegou_no_pitch** (o minuto da oferta: o KB manda pixel exatamente aí, pra remarketing) · InitiateCheckout. Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página.

> **Roteiro da VSL (específico desta skill).** O vídeo é a própria VSL: o roteiro completo (método Jon Benson: sugestão → amplificação → história → solução → oferta) sai como HTML próprio em `pagina/vsl-roteiro.html`, e a página da VSL inclui o botão "Ver roteiro do vídeo" DENTRO do slot do player. O dono grava a partir do roteiro e troca o slot pelo player.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o roteiro completo da VSL (método Jon Benson: sugestão → amplificação → história → solução → oferta), integrando as headlines e bullets do banco. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## Como usar

Quando você pedir pra montar/estruturar um funil de VSL, uma oferta Direct Response ou um plano de escala:

1. **Coletar 2 inputs** (perguntar se não vieram no briefing):
   - **Nicho** do produto (ex: renda extra, nutrição, emagrecimento, desenvolvimento pessoal, IA/marketing)
   - **Produto/transformação** que vai ser vendido
2. **Rodar as 4 fases** abaixo, preenchendo cada bloco com o caso real.
3. **Entregar a estrutura completa** pra você aprovar — NUNCA executar/subir nada sem OK.
4. A skill **gera a copy aplicada** da VSL e da página a partir do `projetos/{slug}/copy.md` (ver "Copy aplicada" acima) e da oferta definida nas fases — o aluno revisa e aprova. Nunca de cabeça.

## O Framework — 4 Fases

### Fase 1 — Construção da Oferta

A oferta nasce de 3 perguntas, nesta ordem:

| Pergunta | O que extrair |
|----------|---------------|
| **Qual a dor?** | A dor que a pessoa acorda sentindo TODOS os dias e que o produto resolve |
| **Por que ainda não resolveu?** | A pessoa já tentou e falhou — descobrir o motivo da falha |
| **Mecanismo do problema** | A causa-raiz real por que as tentativas anteriores falharam |
| **Mecanismo da solução** | O método único que resolve o mecanismo do problema |

> Regra: primeiro o **mecanismo do problema**, depois o **mecanismo da solução**. Sem mecanismo do problema, a solução parece "mais um curso".

> **Se Situação = afiliado:** esta fase NÃO constrói dor+mecanismos próprios — ela LÊ a oferta do produtor (ver "Modo Afiliado" acima). Use a promessa e o mecanismo que o produtor já comunica na página oficial; não invente os seus.

### Fase 2 — Construção do Funil

- **Funil indicado:** VSL (Video Sales Letter)
- **Duração da VSL:** 20 a 50 minutos. **Não existe padrão** — é o tempo necessário pra convencer o lead daquilo que está sendo vendido. Mais curto se a consciência for alta, mais longo se for baixa.
- **Order bump:** NÃO recomendado nesse funil.
- **Upsell:** obrigatório e tem que converter bem — **meta de 20 a 30% direto**.
  - O upsell **NÃO é um "próximo passo"** do produto.
  - O upsell é um **facilitador** (faz o resultado vir mais rápido/com menos esforço) OU **maior acesso a você** (mentoria, grupo, contato direto).

### Fase 3 — Escala

Montou o funil e botou a VSL pra rodar → escala por **múltiplos funis simultâneos**:

1. VSL (base)
2. Time comercial
3. Webinário diário
4. Ascensão quinzenal
5. Lançamento

> A combinação desses canais é o que sustenta volume alto e recorrente. Não depender de um funil só.

### Fase 4 — Ticket e Estratégia de Pagamento

- **Ticket ideal da VSL:** R$297 a R$497 (entrada baixa de propósito).
- **O lucro vem do upsell**, não do front-end.
- **Cartão > Pix:** pra rodar One Click Buy (compra do upsell em 1 clique), a pessoa precisa ter comprado no **cartão**.
- **Alavanca de ticket:** se o ticket está baixo (ex: R$297) mas tem muita compra no **Pix**, **suba o ticket** — ticket maior empurra mais gente pro cartão, o que aumenta a taxa de upsell.

## Template de Saída

Entregar sempre neste formato preenchido com o caso real:

```markdown
# Funil VSL — [Produto] ([Nicho])

## 1. Oferta
- Dor diária: ...
- Por que não resolveu: ...
- Mecanismo do problema: ...
- Mecanismo da solução: ...

## 2. Funil
- VSL: ~[X] min (justificativa do tempo pela consciência do lead)
- Order bump: não
- Upsell: [facilitador OU maior acesso] — meta 20-30% conversão

## 3. Escala
- [ ] VSL
- [ ] Time comercial
- [ ] Webinário diário
- [ ] Ascensão quinzenal
- [ ] Lançamento

## 4. Ticket
- Front-end: R$[297-497]
- Estratégia cartão/Pix: ...
- Upsell (onde está o lucro): R$... — ...
```

## Regras

- Sempre **mostrar a estrutura pra você revisar** antes de qualquer execução — nunca subir copy/página sem OK.
- Copy da VSL/página: esta skill gera a copy aplicada a partir do `projetos/{slug}/copy.md` e da oferta definida nas 4 fases — o aluno revisa e aprova. Nunca de cabeça.
- Números (ticket, % de upsell) são **referências do método** — validar contra os dados reais do seu negócio antes de prometer em público.
- Este é um framework de **referência** — ao aplicar no SEU produto, adapte ao seu contexto (público, oferta, tickets reais).

---

**Método:** Alan Nicolas

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
