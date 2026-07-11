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

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/lancamento.md`** (nos 3 formatos: `.md` + `.html` + `.pdf`).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o projeto ativo e confira que os arquivos existem dentro dele:

```
# 1. Descubra o projeto ativo:
ls projetos/ 2>/dev/null
# 2. Confira os arquivos dentro do projeto ativo:
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto/transformação, preço, bônus, garantia, público) do `projetos/{slug}/offerbook.md` e a copy base do `projetos/{slug}/copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de lançamento (PLF) eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `projetos/{slug}/offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 COM lista/audiência própria pra aquecer.

---

## Gate — ler o Perfil do Projeto (antes de montar a régua)

> **Leia o Perfil do Projeto** (topo de `projetos/{slug}/offerbook.md`; regra em `.claude/skills/_shared/perfil.md`) ANTES de estruturar. O Perfil muda o tom, o CTA e o motor do lançamento — não assuma "curso de especialista com lista de e-mail" por padrão:
> - **Tipo = serviço / b2b** → o lançamento NÃO fecha em checkout/e-mail de venda direta. Os PLCs entregam autoridade/business case/ROI e a régua fecha em **marcar reunião** (aplicação, diagnóstico, call). "Carrinho" vira janela de inscrição/vagas de agenda; a escassez é de agenda, não de link de pagamento.
> - **Tipo = físico/varejo-local** → o "lançamento" é um **evento local/regional** (turma, data, ponto): captação por WhatsApp/Google Perfil, sequência local, escassez de vagas/estoque. Não force régua de e-mail nacional.
> - **Tipo = saas-app** → PLCs = casos de uso; a régua fecha em **trial/demo**, não em depoimento de aluno.
> - **Voz = marca** → PLCs saem na voz da marca (calibrada no `copy.md`/`DESIGN.md` + voz do cliente), não na história pessoal de um especialista.
>
> **Guard (regra dura, de `_shared/perfil.md`):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é PROIBIDO o enquadramento de "especialista/curso/mentoria" e o "depoimento de aluno" como padrão nos PLCs e na prova. Use voz do cliente / prova de uso / case. O default "curso de especialista com lançamento por e-mail" só vale quando **Tipo = especialista**.

## Gate — modo AFILIADO (lançamento da oferta do produtor)

> **Situação = afiliado (Perfil):** não há offerbook nem Launch Stack próprios — o lançamento/aquecimento é da **oferta do produtor**. A skill se apoia na oferta oficial (produto, promessa, preço, **comissão**, data de carrinho e **página oficial do produtor**), não numa oferta sua. Nesse modo:
> - **Você não abre/fecha carrinho** — a data e o carrinho são do produtor. Sua régua aquece a **sua** lista/audiência PARA o carrinho dele e manda pro **link de afiliado**, sem prometer bônus/garantia que não são seus.
> - **PLCs = aquecimento e pré-venda seus**, casando o público que você tem com a promessa do produtor; o pitch e a página de venda ficam com o produtor.
> - **Sem back-end próprio** (upsell/OTO/downsell são do produtor). O foco é topo/pré-venda: aquecer, gerar desejo e entregar o lead quente no carrinho oficial na janela certa.
> - Pergunte, se não vier no briefing: **página oficial + data de abertura/fechamento do carrinho do produtor + regras de bônus de afiliado** (se houver). Sem a data do produtor, a régua não fecha — peça antes de montar.
>
> Sem `offerbook.md` próprio e Perfil ≠ afiliado → siga o Gate de pré-requisito normal (`/offerbook` primeiro). Com Perfil = afiliado, o Gate de pré-requisito se satisfaz com a **oferta do produtor** no lugar do Launch Stack próprio.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: PageView por PLC (1, 2, 3: segmenta remarketing por consumo) · Lead (captação) · abertura de carrinho · InitiateCheckout. Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página. Nesta skill cada PLC é um vídeo: os roteiros dos 3 PLCs saem como HTML próprios em `pagina/plc-1-roteiro.html` (2, 3), com o botão "Ver roteiro do vídeo" dentro do slot do player.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — os roteiros dos PLCs e a sequência de carrinho. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

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
7. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): roteiros dos PLCs e sequência de carrinho — o aluno revisa e aprova. Os e-mails saem com a `/email-funil`; nunca de cabeça.

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
- Copy aplicada dos PLCs e da sequência de carrinho → gerada nesta skill a partir do copy.md
- Sequência de e-mails (anúncio + carrinho) → /email-funil
- Oferta/Launch Stack → /offerbook
- Página de inscrição/checkout → /pagina-vendas-funil (+ /design-md)
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + o ativo (lista) + tipo de lançamento + por que lançamento e não advertorial+VSL.
2. **A régua completa** — dias por fase, montada de trás pra frente a partir da data do carrinho.
3. **Estrutura das 5 fases** — cada uma com esqueleto/placeholder pra preencher.
4. **Os 3 PLCs** detalhados (esqueleto de cada).
5. **Distribuição dos 9 gatilhos** ao longo da régua.
6. **Encaixe no funil** — de onde vem a copy aplicada e quem escreve os e-mails.

> A **copy aplicada** (roteiros dos PLCs + sequência de carrinho) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. Os e-mails saem da `/email-funil`. A skill também estrutura o lançamento e a régua.

---

## Regras

**SEMPRE:** confirmar **nível 5 (frio) + que você tem (ou vai captar) lista** antes de montar · montar a **régua de trás pra frente** a partir da data do carrinho · entregar **valor real** nos 3 PLCs (nunca só teaser) · **valor antes do pedido** · prova como **estudo de caso/transformação** (não depoimento puro) pro frio · **escassez real** (carrinho fecha mesmo) · sequência de **fechamento** no último dia (3-5 e-mails) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** pular os PLCs e ir direto pro carrinho · usar **escassez fabricada** ("vagas" que nunca acabam) · fazer PLC que é só teaser sem valor · abrir carrinho sem deadline real · ignorar o último dia (vem ~50% das vendas) · tratar a lista como caixa eletrônico (lançar sem dar valor entre lançamentos) · depoimento puro pra público frio · subir/disparar/agendar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Você **não tem lista/audiência** nem vai captar uma | PARAR → o caso é `/advertorial-funil` + `/vsl-funil` (tráfego frio direto), não lançamento |
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente é `/pagina-vendas-funil` ou `/webinario-funil`, não lançamento de aquecimento |
| Oferta/offerbook não existe | PARAR → construir a oferta antes (`/offerbook`): sem Launch Stack não há o que abrir no carrinho |
| Não há data de carrinho | PARAR → a escassez real (abre/fecha) é o motor; definir a data primeiro |
| Pediram a copy/os e-mails prontos | PLCs e sequência de carrinho: gerar nesta skill a partir do `copy.md` (sem `copy.md` → /copy-funil primeiro); e-mails com `/email-funil` — nunca de cabeça |
| Vão disparar sem revisar | PARAR → revisar a estrutura e a régua primeiro |

---

## Encaixe no Mapa de Execução do método

```
Estágio 5 (frio, COM lista) → Funil: Lançamento / PLF

PEÇA           SKILL              O QUE ENTREGA
01 Offerbook   /offerbook         oferta, Launch Stack, mecanismo, ancoragem  ← precisa existir antes
02 Lançamento  /lancamento-funil  ESTA SKILL — a régua do PLF (pré-pré → PLCs → carrinho → fechamento)
03 Copy        /copy-funil        FUNDAÇÃO da copy (copy.md); a copy aplicada dos PLCs sai desta skill
04 Email       /email-funil       sequências: anúncio de PLC + abertura + carrinho + fechamento
05 Página      /design-md +       identidade visual + página de inscrição/checkout
               /pagina-vendas-funil
```

O lançamento é a **peça 02** do nível 5 (alternativa ao advertorial+VSL): vem depois da oferta existir. A **fundação da copy** (copy.md) sai da `/copy-funil`; a **copy aplicada** dos PLCs e da sequência de carrinho é gerada nesta skill a partir dela; os **e-mails** saem da `/email-funil`.

---

*Skill lancamento-funil v1 — funil de topo do nível 5 (com lista) no método do Alan Nicolas. Modela o Product Launch Formula (Jeff Walker) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy aplicada dos PLCs e da sequência de carrinho é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem da `/email-funil`. Toda montagem calibra no KB-lancamento-funil.md.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
