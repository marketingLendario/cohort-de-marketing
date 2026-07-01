---
name: lancamento-funil
description: "Estrutura um funil de lançamento estilo Product Launch Formula (PLF / Jeff Walker) pra aquecer público FRIO (nível 5 — não te conhece nem sabe que tem o problema) quando você TEM lista/audiência pra aquecer. Entra nicho + produto + tamanho da lista, sai a régua completa em fases: pré-pré-lançamento (aquecimento + captação de lista + pesquisa), os 3 PLCs de pré-lançamento (Oportunidade, Transformação, Propriedade/Experiência), abertura de carrinho, sequência de carrinho aberto e fechamento com escassez real — mais os 9 gatilhos mentais, a régua de dias por fase e os tipos de lançamento (semente, interno, parceria/JV). É o funil de TOPO alternativo do nível 5 no método do Alan Nicolas. Use quando precisar montar lançamento, PLF, sequência de aquecimento, sideways sales letter, abertura/fechamento de carrinho ou planejar a régua de um lançamento. Modela o Product Launch Formula (Jeff Walker) e os níveis de consciência (Eugene Schwartz)."
user_invocable: true
---

# Lançamento — Funil de PLF pra Público Frio com Lista (Nível 5)

Skill que estrutura um **funil de lançamento** no estilo **Product Launch Formula (PLF)**: uma **sequência de aquecimento** que pega público **frio** (nível 5) e o leva, por etapas e gatilhos mentais, de "não sabia que tinha esse problema" até comprar numa **janela de carrinho** que abre e fecha. Baseada no método de funil do **Alan Nicolas**, modelando o **Product Launch Formula (Jeff Walker)** e os **níveis de consciência (Eugene Schwartz)**.

> **KB (fonte de verdade):** `KB-lancamento-funil.md` (nesta pasta). Tem a anatomia completa do lançamento, os 3 PLCs detalhados, os 9 gatilhos mentais, a régua de tempo, os tipos de lançamento e o casamento com o nível 5. **Carregue o KB antes de montar** — não responda de cabeça.

> **Promessa do método:** transformar uma lista fria num **evento de vendas concentrado** — onde a antecipação é construída antes do carrinho abrir, o valor é entregue antes de qualquer pedido, e a escassez real (carrinho que fecha) concentra a maior parte das vendas no último dia. *"It's not a pitch, it's a conversation."* (Jeff Walker)

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, confira que os arquivos existem no seu projeto:

```
ls offerbook-*.md copy-*.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto/transformação, preço, bônus, garantia, público) do `offerbook-*.md` e a copy base do `copy-*.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de lançamento (PLF) eu preciso do `offerbook-*.md`, que sai da skill `/offerbook` (e da `copy-*.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `offerbook-*.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## O que é (e o que NÃO é)

| É | NÃO é |
|---|-------|
| Funil de **topo** pra nível 5 (frio) **quando você tem lista/audiência** pra aquecer | Tráfego frio direto pra oferta perpétua (isso é `/advertorial-funil` + `/vsl-funil`) |
| **Sequência** espalhada no tempo (sideways sales letter) | Uma página única que vende tudo de uma vez |
| **Evento** com data: carrinho que abre e fecha | Venda sempre disponível (perpétuo) |
| Entrega **valor** (3 PLCs) antes de pedir a compra | Pitch direto sem construir relacionamento |
| Escassez **real** (o carrinho fecha mesmo) | Escassez fabricada ("últimas vagas" que nunca acabam) |

> **Onde encaixa no funil:** no Mapa de Execução do `/metodo-funil`, o **nível 5** prescreve "lançamento/PLF, VSL + advertorial, ou conteúdo grátis". O lançamento é a opção pra quem **já tem audiência/lista** (ou consegue captar uma antes): em vez de aquecer o estranho 1-a-1 numa página editorial, você aquece a **lista inteira ao mesmo tempo**, por uma sequência, e concentra as vendas numa janela.

---

## Lançamento vs. Advertorial+VSL — qual funil de nível 5 escolher

Os dois servem o **mesmo nível 5 (frio)**. A diferença é o **ativo** que você tem e o **modelo de venda** que quer:

| Escolha **LANÇAMENTO** (esta skill) se… | Escolha **ADVERTORIAL + VSL** se… |
|----------------------------------------|-----------------------------------|
| Você **tem lista/audiência** (email, Instagram, YouTube, grupo) — ou vai captar uma antes | Você vai mandar **tráfego frio pago direto**, sem lista prévia |
| Quer um **evento** com pico de vendas (data marcada) | Quer venda **perpétua**, rodando 24/7 todo dia |
| Topa a **régua longa** (semanas de aquecimento) por um faturamento concentrado | Quer um funil **sempre ligado**, escala por verba de ads |
| A **escassez real** (carrinho fecha) é o motor da conversão | A **VSL** e a oferta perpétua são o motor |

> Não são excludentes no tempo: muita gente **lança** (evento) e depois transforma a sequência em **evergreen** (perpétuo) — que aí vira mais perto de `/vsl-funil`. Mas pra ESTE pedido, escolha um modelo. Regra do Jeff: **faça o lançamento ao vivo primeiro**, depois automatize.

---

## Como usar

Quando você pedir pra montar/estruturar um lançamento, um PLF, uma sequência de aquecimento ou a régua de carrinho:

1. **Carregar o KB** (`KB-lancamento-funil.md`) pra ter a anatomia, os PLCs, os gatilhos e a régua na mão.
2. **Confirmar o nível de consciência + o ativo.** Lançamento é peça do **nível 5 (frio)** e só faz sentido se você **tem lista/audiência pra aquecer** (ou vai captar uma no pré-pré-lançamento). Se você não tem nem vai captar lista → o caso é `/advertorial-funil` + `/vsl-funil` (ver Veto conditions).
3. **Coletar os inputs** (perguntar só os que não vieram no briefing/offerbook):
   - **Nicho / mercado** (ex.: renda extra, saúde, produtividade, IA pra marketing)
   - **Produto / transformação** + a **oferta** (entregáveis, preço, bônus, garantia — sai do `/offerbook`)
   - **Tamanho e tipo da lista/audiência** — é o que decide o **tipo de lançamento** (semente / interno / parceria)
   - **Data alvo** do carrinho (pra montar a régua pra trás)
4. **Escolher o tipo de lançamento** (semente / interno / parceria) pela tabela do KB.
5. **Rodar as 5 fases** abaixo, preenchendo cada bloco com o caso real e montando a **régua de dias**.
6. **Entregar a estrutura completa + a régua** pra você aprovar — NUNCA subir/disparar/agendar nada sem OK. A skill só estrutura.
7. **A copy você escreve com a `/copy-funil` e os e-mails com a `/email-funil`** — não de cabeça. A skill estrutura o lançamento e mapeia o que entra em cada PLC e cada e-mail; a redação fina é trabalho da copy.

---

## A regra de ouro (o que separa lançamento de "mandar e-mail de venda")

> **Valor ANTES do pedido. Conversa, não pitch. Escassez REAL.**

- **Valor antes do pedido:** os 3 PLCs entregam algo genuinamente útil **antes** do carrinho abrir. Se o PLC é só teaser ("vou revelar no próximo"), quebra a reciprocidade e o lançamento esfria.
- **Conversa, não pitch:** a venda é espalhada numa sequência (sideways sales letter), não concentrada numa página. Cada peça prepara a próxima.
- **Escassez real:** o carrinho **fecha de verdade** numa data e não reabre por um período. Escassez fabricada destrói a confiança — e a lista não volta no próximo lançamento.

---

## O Framework — 5 Fases (a régua do lançamento)

Monte de trás pra frente a partir da **data do carrinho**. Cada fase prepara a próxima. Detalhe e roteiro de cada peça no KB.

### Fase 1 — Pré-pré-lançamento (aquecimento + lista + pesquisa)

**Régua:** ~1 a 4 semanas antes do pré-lançamento.

Constrói/aquece a audiência e colhe inteligência **antes** de qualquer conteúdo de venda. O que entra:
- **Captar/aquecer a lista** (se ainda não existe, captar com isca; se existe, reengajar).
- **Pesquisa** com a lista (as dores, o que já tentaram, o que mudaria) → alimenta os PLCs e a copy.
- **Sementes de antecipação** ("vem aí algo grande", "marca essa data").

> Sem lista aquecida aqui, o lançamento nasce morto. Esta fase é o que diferencia o lançamento do advertorial: aqui você **junta e aquece o público** antes de falar de produto.

### Fase 2 — Pré-lançamento: os 3 PLCs (o coração do PLF)

**Régua:** os 3 PLCs ao longo de ~7 a 14 dias (um a cada 2-3 dias), cada um anunciado por e-mail.

A **sideways sales letter**: em vez de uma página que vende tudo, 3 conteúdos que educam, provam e geram desejo. Cada PLC entrega **valor real** e abre antecipação pro próximo.

| PLC | Foco | O que faz | Gatilhos principais |
|-----|------|-----------|---------------------|
| **PLC1 — Oportunidade** | mostra o que é possível | hook + autoridade (sua história) + revela a oportunidade/transformação + 1º ensino real + antecipa o PLC2 | Autoridade, Antecipação, Prova social |
| **PLC2 — Transformação** | prova que funciona | recap + estudos de caso (transformação real) + ensino mais profundo + quebra de objeções + antecipa o PLC3 | Prova social, Reciprocidade, Confiança |
| **PLC3 — Propriedade / Experiência** | faz a pessoa se ver usando | recap da jornada + visão do futuro (future pacing, "imagine acordar...") + último ensino + ponte pra oferta + monta a escassez do carrinho | Antecipação, Comunidade, Eventos |

> Regra: PLC **não é teaser** — cada um vale como conteúdo sozinho. E para frio, a prova é **estudo de caso/transformação**, não depoimento puro (casamento prova↔consciência do método).

### Fase 3 — Abertura de carrinho (Open Cart)

**Régua:** dia 1 do carrinho (carrinho aberto por ~4 a 7 dias no total).

O carrinho abre. A oferta aparece (o **Launch Stack**: core + bônus + garantia + escassez). Dispara a sequência de abertura:
- **2-3 e-mails no dia 1** ("estamos abertos" / primeira resposta / por dentro do que tem).
- A oferta é apresentada **depois** de toda a antecipação dos PLCs — a pessoa já quer.

> Padrão do PLF: **~25% das vendas acontecem no dia 1.**

### Fase 4 — Carrinho aberto (Mid-Launch)

**Régua:** dias 2 a (penúltimo), ~1 e-mail por dia.

Mantém o momentum e derruba objeções enquanto o carrinho está aberto:
- estudos de caso adicionais · FAQ respondendo objeções · bastidor/prova em tempo real · lembrete do prazo.

### Fase 5 — Fechamento (Close Cart, escassez real)

**Régua:** último dia, **3 a 5 e-mails** com contagem regressiva.

A escassez real entra em cena: o carrinho **fecha** numa hora marcada e não reabre. Sequência do último dia:
- manhã ("último dia") → tarde ("horas finais") → noite ("fechando em X horas") → última chamada ("é agora ou nunca").

> Padrão do PLF: **~50% das vendas acontecem no último dia.** Por isso o fechamento não é um e-mail — é uma sequência. Pular o último dia = deixar metade do dinheiro na mesa.

---

## Os 9 gatilhos mentais (distribuir ao longo da régua)

O lançamento funciona porque ativa, **na ordem certa**, os 9 gatilhos (detalhe no KB):

| Gatilho | Onde entra com mais força |
|---------|---------------------------|
| **Autoridade** | PLC1 (sua história/origem) |
| **Reciprocidade** | os 3 PLCs (valor real, de graça) |
| **Confiança** | a sequência inteira (valor entregue repetido) |
| **Antecipação** | fim de cada PLC + contagem pro carrinho |
| **Afinidade** | storytelling pessoal em cada peça |
| **Eventos** | o lançamento é um EVENTO com data |
| **Comunidade** | comentários/grupo, "faça parte do movimento" |
| **Prova social** | PLC2 (cases) + compradores em tempo real no carrinho |
| **Escassez** | Open/Close Cart — **sempre real, nunca fabricada** |

---

## Tipos de lançamento (escolher 1 pelo seu ativo)

| Tipo | Pra quem | Lista | Como roda |
|------|----------|-------|-----------|
| **Semente (Seed)** | quem está começando ou quer **validar** o produto antes de criar | pequena (~100-500) | lançamento simples (pode ser só e-mails); vende antes de criar e entrega ao vivo coletando feedback |
| **Interno (Internal)** | quem **já tem lista própria** | qualquer tamanho | o PLF clássico completo: pré-pré → 3 PLCs → carrinho 4-7 dias → fechamento |
| **Parceria (JV)** | quem quer **escalar com parceiros/afiliados** | alavanca a lista dos parceiros | parceiros promovem pra audiência deles; coordena datas e materiais; PLF pra audiência combinada |

> Comece pela **semente** se está validando. **Interno** é o padrão de quem tem lista. **Parceria** escala, mas é mais complexo de coordenar.

---

## Casamento com o nível 5 (por que o lançamento é peça certa)

| Onde o público frio (nível 5) trava | Como o lançamento resolve |
|-------------------------------------|---------------------------|
| Não sabe que tem o problema | PLC1 **revela a oportunidade**; a pesquisa do pré-pré nomeia a dor |
| Não confia (te viu agora) | 3 PLCs entregam **valor antes de pedir** → confiança construída por repetição |
| Mandar direto pra oferta não converte | a oferta só aparece **depois** dos PLCs, quando já há desejo |
| Depoimento não funciona com frio | PLC2 usa **estudo de caso / transformação**, não depoimento puro |
| Falta urgência pra agir | **carrinho que fecha** (escassez real) concentra a decisão |

> *"Em média, 80% a 90% do mercado está inconsciente."* (nível 5). O lançamento é como você **aquece a lista inteira** desse mercado de uma vez e a leva à compra num evento.

---

## Template de Saída

Entregar sempre neste formato, preenchido com o caso real:

```markdown
# Lançamento (PLF) — [Produto] ([Nicho])

## Diagnóstico
- Nível de consciência: 5 (frio) — justificativa
- Ativo (lista/audiência): [tamanho + canal] → tipo de lançamento: [semente/interno/parceria]
- Por que LANÇAMENTO e não advertorial+VSL: [tem lista / quer evento]
- Oferta (Launch Stack): core + bônus + garantia + preço (← do /offerbook)
- Data do carrinho: abre [data] / fecha [data]

## Régua (de trás pra frente a partir do carrinho)
- D-[X..]  Fase 1 — Pré-pré: captar/aquecer lista + pesquisa + sementes de antecipação
- D-[X..]  Fase 2 — PLC1 (Oportunidade)  → e-mail de anúncio
-          Fase 2 — PLC2 (Transformação) → e-mail de anúncio
-          Fase 2 — PLC3 (Propriedade)   → e-mail + monta escassez
- D-0      Fase 3 — Abertura: 2-3 e-mails (≈25% das vendas)
- D-1..n   Fase 4 — Carrinho aberto: 1 e-mail/dia (cases, FAQ, prova)
- D-final  Fase 5 — Fechamento: 3-5 e-mails contagem regressiva (≈50% das vendas)

## PLCs (esqueleto de cada um)
- PLC1 — Oportunidade: hook / autoridade / oportunidade / 1º ensino / antecipa PLC2
- PLC2 — Transformação: recap / cases / ensino / objeções / antecipa PLC3
- PLC3 — Propriedade: recap / visão de futuro / último ensino / ponte pra oferta / escassez

## Gatilhos mentais — distribuição na régua
[quais entram em cada fase]

## Próxima peça
- Copy de cada PLC/página → /copy-funil
- Sequência de e-mails (anúncio + carrinho) → /email-funil
- Oferta/Launch Stack → /offerbook
- Página de inscrição/checkout → /pagina-vendas (+ /design-md)
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + o ativo (lista) + tipo de lançamento + por que lançamento e não advertorial+VSL.
2. **A régua completa** — dias por fase, montada de trás pra frente a partir da data do carrinho.
3. **Estrutura das 5 fases** — cada uma com esqueleto/placeholder pra preencher.
4. **Os 3 PLCs** detalhados (esqueleto de cada).
5. **Distribuição dos 9 gatilhos** ao longo da régua.
6. **Encaixe no funil** — quais skills escrevem a copy e os e-mails.

> A **copy final é você** quem escreve, com a `/copy-funil` (PLCs/página) e a `/email-funil` (sequências). A skill estrutura o lançamento e a régua.

---

## Regras

**SEMPRE:** confirmar **nível 5 (frio) + que você tem (ou vai captar) lista** antes de montar · montar a **régua de trás pra frente** a partir da data do carrinho · entregar **valor real** nos 3 PLCs (nunca só teaser) · **valor antes do pedido** · prova como **estudo de caso/transformação** (não depoimento puro) pro frio · **escassez real** (carrinho fecha mesmo) · sequência de **fechamento** no último dia (3-5 e-mails) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** pular os PLCs e ir direto pro carrinho · usar **escassez fabricada** ("vagas" que nunca acabam) · fazer PLC que é só teaser sem valor · abrir carrinho sem deadline real · ignorar o último dia (vem ~50% das vendas) · tratar a lista como caixa eletrônico (lançar sem dar valor entre lançamentos) · depoimento puro pra público frio · subir/disparar/agendar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Você **não tem lista/audiência** nem vai captar uma | PARAR → o caso é `/advertorial-funil` + `/vsl-funil` (tráfego frio direto), não lançamento |
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente é `/pagina-vendas` ou `/webinario-funil`, não lançamento de aquecimento |
| Oferta/offerbook não existe | PARAR → construir a oferta antes (`/offerbook`): sem Launch Stack não há o que abrir no carrinho |
| Não há data de carrinho | PARAR → a escassez real (abre/fecha) é o motor; definir a data primeiro |
| Pediram a copy/os e-mails prontos | Escrever com `/copy-funil` (PLCs/página) e `/email-funil` (sequências), não de cabeça |
| Vão disparar sem revisar | PARAR → revisar a estrutura e a régua primeiro |

---

## Encaixe no Mapa de Execução do método

```
Estágio 5 (frio, COM lista) → Funil: Lançamento / PLF

PEÇA           SKILL              O QUE ENTREGA
01 Offerbook   /offerbook         oferta, Launch Stack, mecanismo, ancoragem  ← precisa existir antes
02 Lançamento  /lancamento-funil  ESTA SKILL — a régua do PLF (pré-pré → PLCs → carrinho → fechamento)
03 Copy        /copy-funil        copy dos PLCs, página de inscrição, bullets, CTA
04 Email       /email-funil       sequências: anúncio de PLC + abertura + carrinho + fechamento
05 Página      /design-md +       identidade visual + página de inscrição/checkout
               /pagina-vendas
```

O lançamento é a **peça 02** do nível 5 (alternativa ao advertorial+VSL): vem depois da oferta existir. A **copy** sai da `/copy-funil` e os **e-mails** da `/email-funil`.

---

*Skill lancamento-funil v1 — funil de topo do nível 5 (com lista) no método do Alan Nicolas. Modela o Product Launch Formula (Jeff Walker) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy sai da `/copy-funil` e os e-mails da `/email-funil`. Toda montagem calibra no KB-lancamento-funil.md.*
</content>
</invoke>

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/lancamento-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
