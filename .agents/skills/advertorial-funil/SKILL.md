---
name: advertorial-funil
description: "Estrutura um advertorial — a página editorial de pré-venda que aquece o público FRIO (nível 5 de consciência: não te conhece nem sabe que tem o problema). Parece artigo/notícia/história, não anúncio: planta o problema, agita a dor, apresenta o mecanismo único e faz a transição natural pra oferta (normalmente a VSL). Entra nicho + produto + público, sai a estrutura completa do advertorial em fases: lead/hook editorial, narrativa, agitação, mecanismo, prova costurada como editorial, transição e CTA suave. É o funil de TOPO do nível 5 no método do Alan Nicolas. Use quando precisar montar advertorial, página de pré-venda, conteúdo editorial de aquecimento, lead magnet editorial ou aquecer público frio antes da oferta. Modela a tradição de magalog/long-form jornalística (Jim Rutz) e os níveis de consciência (Eugene Schwartz)."
user_invocable: true
---

# Advertorial — Pré-venda Editorial pra Público Frio (Nível 5)

Skill que estrutura um **advertorial**: a página de **pré-venda editorial** que aquece o público **frio** e o entrega aquecido pra oferta. Baseada no método de funil do **Alan Nicolas**, modelando a escola de **long-form jornalística / magalog (Jim Rutz)** e os **níveis de consciência (Eugene Schwartz)**.

> **KB (fonte de verdade):** `KB-advertorial-funil.md` (nesta pasta). Tem a anatomia completa do advertorial, os tipos de lead editorial, o casamento com nível 5 e a regra do "remover o pedido". **Carregue o KB antes de montar** — não responda de cabeça.

> **Promessa do método:** transformar um estranho que **nem sabe que tem o problema** em alguém que **sente a dor, entende o mecanismo e quer a solução** — sem nunca parecer um anúncio. O advertorial não vende: ele **prepara a venda**.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/advertorial.md`** (+ `.html` e `.pdf`).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o **projeto ativo** (ver "convenção de projeto" acima) e confira que os arquivos existem dentro dele:

```
ls projetos/ 2>/dev/null                                        # descobrir o projeto ativo (slug)
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (dor, mecanismo único, produto/transformação, prova) do `projetos/{slug}/offerbook.md` e a copy base do `projetos/{slug}/copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o advertorial eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `projetos/{slug}/offerbook.md` existir, volte e rode esta skill de novo.

> **Exceção:** **Perfil = afiliado → NÃO pare aqui; siga pro Modo Afiliado abaixo** (o gate se satisfaz com o Registro da Oferta do Produtor no lugar do offerbook/copy próprios).

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

> **Ler o Perfil do Projeto ANTES de montar (regra dura).** Leia o **Perfil do Projeto** no topo de `projetos/{slug}/offerbook.md` (regra em `.claude/skills/_shared/perfil.md`) e adapte o advertorial ao caso — nunca assuma "infoproduto de especialista" por padrão. **Guard:** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é PROIBIDO o enquadramento de "especialista/curso/mentoria" e "depoimento de aluno" — a prova editorial (Fase 5) usa **voz do cliente / caso de uso / case / dados com fonte**, e a narrativa (Fase 2) fala pela marca ou pelo cliente, não por um rosto-especialista. Nicho regulado (saúde/jurídico/psico/financeiro) → linguagem de possibilidade e regras do conselho, nunca "cura/garantido".

> **Modo AFILIADO — advertorial de pré-venda sobre a oferta do PRODUTOR (Perfil: Situação = afiliado).** Quando não há offerbook próprio, o advertorial NÃO tem oferta própria e NÃO leva pro seu checkout: ele é a **pré-venda editorial da oferta do produtor** e o CTA leva pra **página oficial do produtor** (VSL/checkout dele, com seu link de afiliado). Sem `offerbook.md`, apoie-se na **oferta do produtor** (produto, promessa, mecanismo, prova pública e página oficial); pergunte esses dados ao aluno se não vierem no briefing. A Fase 3 (agitar a dor) e a Fase 4 (mecanismo) usam o material do produtor, sem inventar promessa nem prova que ele não fez. A transição (Fase 6) é convite pra "ver como funciona" na página do produtor, nunca "compre agora". Sem back-end, upsell ou recuperação própria (isso é do produtor). O guard do Perfil continua valendo (voz/tipo/nicho regulado).

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 (público frio que não sabe que tem o problema) — topo de funil editorial.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: PageView · scroll 50/75% (leu o editorial) · clique na transição pra VSL/oferta (a audiência aquecida pra remarketing). Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto editorial completo (lead, narrativa, agitação, mecanismo, transição, CTA). O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## O que é (e o que NÃO é)

| É | NÃO é |
|---|-------|
| Conteúdo que **parece** artigo/notícia/história | Anúncio com cara de anúncio |
| Funil de **topo** pra nível 5 (frio) | Página de vendas (isso é a `/pagina-vendas-funil`) |
| **Aquece** o lead e o entrega pra oferta (VSL) | A oferta em si (isso é o `/offerbook` + `/vsl-funil`) |
| Educa, planta o problema, gera curiosidade | Pitch direto de produto |
| Vale como leitura **mesmo se a oferta sumisse** | Material que sem o CTA não tem valor |

> **Onde encaixa no funil:** no Mapa de Execução do `/metodo-funil`, o **nível 5** prescreve "VSL + advertorial". O advertorial é a **camada de cima**: anúncio frio → **advertorial** (aquece) → VSL/oferta → checkout. Ele resolve o problema de mandar tráfego frio direto pra uma oferta (que não converte porque a pessoa ainda não sabe que tem o problema).

---

## Como usar

Quando você pedir pra montar/estruturar um advertorial, página de pré-venda ou conteúdo editorial de aquecimento:

1. **Carregar o KB** (`KB-advertorial-funil.md`) pra ter a anatomia e os tipos de lead na mão.
2. **Confirmar o nível de consciência.** Advertorial é a peça do **nível 5 (frio)**. Se o público já é nível 3+ (consciente da solução/produto), o advertorial é exagero — provavelmente o caso é página de vendas ou VSL direta. (ver Veto conditions)
3. **Coletar 3 inputs** (perguntar só os que não vieram no briefing):
   - **Nicho / mercado** (ex.: renda extra, saúde, produtividade, IA pra marketing)
   - **Produto / transformação** + a **oferta** pra onde o advertorial vai levar (a VSL, a página, o webinário)
   - **Público frio** — de onde ele vem (tráfego frio de ads? descoberta orgânica?) e qual a **dor latente** que ele ainda não nomeou
4. **Rodar as 6 fases** abaixo, preenchendo cada bloco com o caso real.
5. **Entregar a estrutura completa** pra você aprovar — NUNCA subir/publicar nada sem OK. A skill só estrutura.
6. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): o texto editorial completo sai daqui, a partir da estrutura definida nas fases — o aluno revisa e aprova. Nunca de cabeça.

---

## A regra de ouro (o teste de Jim Rutz)

Um advertorial só funciona se passar neste teste:

> **"Se eu apagasse o caminho pra oferta, isso ainda valeria a pena ser lido?"**

Se a resposta é **sim**, você tem um advertorial. Se é **não**, você tem um anúncio disfarçado — e o público frio fecha a aba. *"O melhor anúncio não parece anúncio."* (Jim Rutz)

---

## O Framework — 6 Fases

Monte nesta ordem (topo → fundo). Cada fase prepara a próxima — é uma **ponte de crença** do estranho frio até a oferta.

### Fase 1 — Lead / Hook editorial

Como abre. **Parece manchete de matéria, não headline de anúncio.** Escolha 1 dos tipos de lead (detalhe no KB §Tipos de Lead):

| Tipo de lead | Quando usar |
|--------------|-------------|
| **Descoberta** | há um "novo dado/método/breakthrough" pra revelar |
| **Jornada pessoal** | uma pessoa real que saiu do problema pra transformação |
| **Exposé** | uma "verdade que escondem" sobre o mercado |
| **Mistério / paradoxo** | um fato curioso e contraintuitivo que prende |
| **Dateline / cena** | abre num lugar/cena concreta ("Numa sala em...") |

> Regra: a abertura **abre um loop de curiosidade** que o público frio precisa fechar. NUNCA abre com "Você quer [resultado]?" (cara de anúncio).

### Fase 2 — Narrativa (história que prende)

A história é o veículo. Ela **baixa a guarda** do público frio porque, imerso numa história, ele não está analisando nem resistindo — está experimentando. Aqui você ainda **não vendeu nada**; está construindo o cenário onde o problema vive.

### Fase 3 — Agitação do problema (plantar a dor latente)

O coração do advertorial pro nível 5. O público **ainda não sabe que tem o problema** — esta fase **nomeia a dor** pra ele e mostra o custo de não resolver. Sai daqui com a pessoa pensando *"isso sou eu"*. Sem esta fase, o nível 5 nunca avança pro nível 4 (consciente do problema).

### Fase 4 — Mecanismo único (por que falhou antes + a nova categoria)

Explica **por que as tentativas comuns falham** (mecanismo do problema) e apresenta a **categoria nova** que resolve (mecanismo da solução). É o que faz a pessoa pensar *"então é por isso que nunca funcionou — e isto aqui é diferente"*. Dá nome ao método.

> Regra (Alan): primeiro o **mecanismo do problema**, depois o **mecanismo da solução**. Sem mecanismo do problema, a solução parece "mais um curso".

### Fase 5 — Prova costurada como editorial

Prova que sustenta a crença, **sem parecer depoimento de anúncio**: estudo de caso contado como reportagem, dados/números com fonte, citação de autoridade, "como funciona na prática". Para público frio, **estudo de caso > depoimento puro** (regra de casamento do método: depoimento só converte no nível 2).

### Fase 6 — Transição pra oferta + CTA suave

A virada do editorial pra oferta tem que ser **uma conclusão lógica, não um pitch abrupto**. Padrão: *"o que levanta uma pergunta óbvia: como ter acesso a isso?"* → leva pra **VSL/oferta**. CTA em tom de **convite** ("descubra", "veja como funciona"), nunca "compre agora".

> O advertorial **não fecha a venda** — ele entrega o lead aquecido (agora nível 3-4) pra próxima peça (VSL/página). É lá que a oferta acontece.

---

## Casamento com o nível 5 (por que o advertorial é a peça certa)

| Onde o público frio (nível 5) trava | Como o advertorial resolve |
|-------------------------------------|----------------------------|
| Não sabe que tem o problema | Fase 3 **planta e nomeia** a dor |
| Não confia (tráfego frio, te viu agora) | Formato editorial **baixa a guarda**; prova costurada gera crença |
| Mandar direto pra oferta não converte | Advertorial **aquece** e entrega o lead já no nível 3-4 pra VSL |
| Depoimento não funciona com frio | Usa **estudo de caso / dados**, não depoimento |

> *"Em média, 80% a 90% do mercado está inconsciente."* (nível 5). O advertorial é como você fala com a maior parte do mercado sem queimar o tráfego numa oferta que eles ainda não estão prontos pra ouvir.

---

## Template de Saída

Entregar sempre neste formato, preenchido com o caso real:

```markdown
# Advertorial — [Produto] ([Nicho]) → leva pra [oferta/VSL]

## Diagnóstico
- Nível de consciência: 5 (frio) — justificativa
- Dor latente que o público ainda NÃO nomeou: ...
- Oferta de destino (pra onde o CTA leva): ...

## Estrutura (6 fases)
1. Lead / Hook editorial — tipo: [descoberta/jornada/exposé/mistério/dateline] — esqueleto
2. Narrativa — quem/onde/qual cena, o loop que abre
3. Agitação do problema — a dor nomeada + custo de não resolver
4. Mecanismo único — mecanismo do problema → mecanismo da solução (nome do método)
5. Prova editorial — [estudo de caso / dados / autoridade] costurada como reportagem
6. Transição + CTA suave — frase de virada → destino [VSL/página] → CTA convite

## Teste de Rutz
- Se eu apagasse o CTA, isso valeria como leitura? [sim/não — se não, reforçar valor editorial]

## Próxima peça
- Lead aquecido (agora nível ~3-4) → /vsl-funil ou /pagina-vendas-funil
- Copy aplicada do texto editorial → gerada nesta skill a partir do copy.md (auditoria na validação do /copy-funil)
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + a dor latente + a oferta de destino.
2. **Estrutura das 6 fases** — cada uma preenchida com a copy aplicada gerada a partir do `copy.md` (ou esqueleto/placeholder, se o aluno optar por seguir sem `copy.md`).
3. **Tipo de lead editorial** escolhido + por quê.
4. **Teste de Rutz** aplicado (vale sem o CTA?).
5. **Encaixe no funil** — qual peça vem depois (VSL/página).

> A **copy aplicada** (texto editorial completo) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. A skill também estrutura o advertorial e mapeia o que entra em cada fase.

---

## Regras

**SEMPRE:** confirmar que o público é **nível 5 (frio)** antes de montar · abrir com **lead editorial** (parece matéria, não anúncio) · **plantar e nomear a dor** (Fase 3) · mecanismo do problema **antes** do mecanismo da solução · prova como **estudo de caso/dados** (não depoimento) · transição **natural** pra oferta · CTA em tom de **convite** · passar no **teste de Rutz** (vale sem o CTA?) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** abrir com "Você quer [resultado]?" (cara de anúncio) · usar **depoimento puro** pra público frio · vender o produto no advertorial (ele aquece, a oferta é na VSL/página) · pular a agitação do problema (o nível 5 não avança sem ela) · CTA "compre agora" (é convite) · encher de fluff sem valor (quebra o teste de Rutz) · subir/publicar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente o caso é `/pagina-vendas-funil` ou `/vsl-funil` direto, não advertorial |
| Não sei a dor latente do público | PARAR → mapear a dor primeiro (sem ela não há Fase 3) |
| Não existe oferta/VSL de destino | PARAR → o advertorial precisa levar pra algum lugar; definir a oferta antes (`/offerbook`, `/vsl-funil`) |
| Pediram a copy pronta | Gerar nesta skill a partir do `copy.md` (sem `copy.md` → rodar /copy-funil primeiro), não de cabeça |
| Vão publicar sem revisar | PARAR → revisar a estrutura primeiro |

---

*Skill advertorial-funil v1 — funil de topo do nível 5 no método do Alan Nicolas. Modela a tradição de magalog/long-form jornalística (Jim Rutz) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy aplicada é gerada nesta skill a partir do copy.md (fundação do /copy-funil). Toda montagem calibra no KB-advertorial-funil.md.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
