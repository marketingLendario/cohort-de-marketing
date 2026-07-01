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

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, confira que os arquivos existem no seu projeto:

```
ls offerbook-*.md copy-*.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (dor, mecanismo único, produto/transformação, prova) do `offerbook-*.md` e a copy base do `copy-*.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o advertorial eu preciso do `offerbook-*.md`, que sai da skill `/offerbook` (e da `copy-*.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `offerbook-*.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## O que é (e o que NÃO é)

| É | NÃO é |
|---|-------|
| Conteúdo que **parece** artigo/notícia/história | Anúncio com cara de anúncio |
| Funil de **topo** pra nível 5 (frio) | Página de vendas (isso é a `/pagina-vendas`) |
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
6. **A copy você escreve com a skill `/copy-funil`** — não de cabeça. O advertorial sai da estrutura definida nas fases; a redação editorial fina (lead, bullets, transição) é trabalho da copy.

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
- Lead aquecido (agora nível ~3-4) → /vsl-funil ou /pagina-vendas
- Copy fina → /copy-funil
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + a dor latente + a oferta de destino.
2. **Estrutura das 6 fases** — cada uma com esqueleto/placeholder pra você preencher a copy.
3. **Tipo de lead editorial** escolhido + por quê.
4. **Teste de Rutz** aplicado (vale sem o CTA?).
5. **Encaixe no funil** — qual peça vem depois (VSL/página) e qual skill escreve a copy.

> A **copy final é você** quem escreve, com a skill `/copy-funil`. A skill estrutura o advertorial e mapeia o que entra em cada fase.

---

## Regras

**SEMPRE:** confirmar que o público é **nível 5 (frio)** antes de montar · abrir com **lead editorial** (parece matéria, não anúncio) · **plantar e nomear a dor** (Fase 3) · mecanismo do problema **antes** do mecanismo da solução · prova como **estudo de caso/dados** (não depoimento) · transição **natural** pra oferta · CTA em tom de **convite** · passar no **teste de Rutz** (vale sem o CTA?) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** abrir com "Você quer [resultado]?" (cara de anúncio) · usar **depoimento puro** pra público frio · vender o produto no advertorial (ele aquece, a oferta é na VSL/página) · pular a agitação do problema (o nível 5 não avança sem ela) · CTA "compre agora" (é convite) · encher de fluff sem valor (quebra o teste de Rutz) · subir/publicar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente o caso é `/pagina-vendas` ou `/vsl-funil` direto, não advertorial |
| Não sei a dor latente do público | PARAR → mapear a dor primeiro (sem ela não há Fase 3) |
| Não existe oferta/VSL de destino | PARAR → o advertorial precisa levar pra algum lugar; definir a oferta antes (`/offerbook`, `/vsl-funil`) |
| Pediram a copy pronta | Escrever com `/copy-funil`, não de cabeça |
| Vão publicar sem revisar | PARAR → revisar a estrutura primeiro |

---

*Skill advertorial-funil v1 — funil de topo do nível 5 no método do Alan Nicolas. Modela a tradição de magalog/long-form jornalística (Jim Rutz) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy sai da `/copy-funil`. Toda montagem calibra no KB-advertorial-funil.md.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/advertorial-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
