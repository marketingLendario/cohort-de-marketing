---
name: webinario-funil
description: "Estrutura o funil completo de um webinário/aula ao vivo (ou evergreen) que vende — do registro ao fechamento — pelo método do Alan Nicolas, com base teórica em Russell Brunson (Perfect Webinar), Jeff Walker (PLF) e Jason Fladlien (9 gatilhos). É o funil de meio prescrito pelo metodo-funil para público NÍVEL 4 (sente a dor, não sabe que há solução) e NÍVEL 3 (consciente da solução). Entrega as 5 peças: página de registro, sequência de aquecimento (e-mail + WhatsApp), roteiro do webinário (abertura/promessa → 3 segredos → transição → stack da oferta → fechamento/escassez) e pós-webinário (replay + e-mails de venda). Use quando precisar montar um webinário, aula ao vivo, palestra ou masterclass que vende, estruturar um funil de webinário, ou escrever o roteiro de uma apresentação de vendas one-to-many. A copy aplicada do roteiro e das páginas é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem do /email-funil; a identidade visual da página vem do seu DESIGN.md."
user_invocable: true
---

# Webinário Funil — funil de webinário que vende (níveis 4 e 3)

Skill que estrutura o **funil completo de um webinário** (aula ao vivo, palestra, masterclass ou evergreen) pelo método do **Alan Nicolas**, no modelo **Perfect Webinar / PLF**. É o funil de **meio** — para público **morno**, que já sente a dor mas ainda não comprou.

> **Promessa do método:** transformar uma audiência que *sente o problema* (nível 4) ou *já conhece a solução* (nível 3) em compradores, através de uma apresentação one-to-many que **educa de verdade enquanto vende naturalmente**.

> **KB (fonte de verdade):** `KB-webinario-funil.md` (nesta pasta). Traz o roteiro fase a fase, o Big Domino, os 3 segredos, os 9 gatilhos, as sequências de e-mail e os benchmarks. **Carregue o KB antes de montar o webinário** — não responda de cabeça.

> **Tese central:** webinário não é "uma live de conteúdo com um pitch no fim". É uma **sequência de elevação de consciência ao vivo** — registro → aquecimento → apresentação → oferta → recuperação — onde cada peça prepara a próxima. *"Para cada estágio de consciência existe um funil ideal."* O webinário é o ideal para os **níveis 4 e 3**.

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
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (entregáveis, preço-âncora, bônus, garantia, público) do `offerbook.md` e a copy base do `copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de webinário eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando o `offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** níveis 4 e 3, ticket acima de R$ 1.000, venda one-to-many.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: PageView · CompleteRegistration (inscrição) · show-up (clique no link da sala) · **chegou_na_oferta** (minuto do pitch, pixel pra remarketing) · InitiateCheckout. Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o roteiro do webinário e as páginas de registro/obrigado. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## Como usar

Quando você pedir pra montar um webinário, uma aula ao vivo que vende ou o funil de uma masterclass:

1. **Carregar o KB** (`KB-webinario-funil.md`) pra ter o roteiro e os gatilhos na mão.
2. **Diagnosticar o nível de consciência** (4 ou 3) — é o gate que decide o tipo de webinário (ver tabela abaixo). Se o público for nível 5, 2 ou 1, este **não é** o funil certo (ver Veto).
3. **Coletar os inputs** (definir só os que ainda não estão claros):
   - **Nicho / mercado** e **produto/transformação** + **ticket**
   - **Público + nível de consciência (4 ou 3)** — de onde ele vem (sente a dor? já compara soluções?)
   - **Oferta** — entregáveis, preço-âncora, bônus, garantia (precisa existir ANTES; sai do `offerbook` / `/oferta-funil`)
   - **Big Domino** — a ÚNICA crença que, se mudar, derruba todas as objeções
   - **3 segredos** — os 3 blocos de conteúdo que quebram as 3 crenças (veículo, interna, externa)
   - **História de origem** (epiphany bridge) + provas/estudos de caso
   - **Formato:** ao vivo, evergreen ou híbrido
4. **Montar as 5 peças do funil** (registro → aquecimento → roteiro → pós) seguindo o framework.
5. **Entregar a estrutura pra você aprovar** — NUNCA subir/agendar/disparar nada sem OK. A skill só estrutura.
6. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): o roteiro do webinário e as páginas de registro/obrigado — o aluno revisa e aprova. Os e-mails de aquecimento e de venda saem com `/email-funil`; a identidade visual da página de registro vem do seu `DESIGN.md` (skill `/design-md`).

---

## Gate — Nível 4 vs Nível 3 decide o tipo de webinário

O webinário serve aos dois níveis mornos, mas **muda de peso**. Diagnostique antes de montar:

| | **Nível 4 — consciente do problema** | **Nível 3 — consciente da solução** |
|---|--------------------------------------|--------------------------------------|
| **Estado do público** | sente a dor, **não sabe que há solução** | conhece as categorias de solução, **não conhece a sua** |
| **Objetivo do webinário** | **revelar que existe uma solução** e que ela é nova/diferente | provar que **a SUA solução** é a melhor entre as que ele já conhece |
| **Big Domino** | "existe um caminho novo pra resolver isso" (a nova oportunidade) | "o MEU veículo/mecanismo é o que faz dar certo" |
| **Peso do conteúdo** | mais **educativo** — 70-80% ensino / 20-30% oferta | mais **solução/estudo de caso** — 60% ensino / 40% oferta |
| **Prova que entra** | **estudo de caso** que mostra a transformação possível | **estudo de caso aprofundado** + demonstração do mecanismo único |
| **Foco dos 3 segredos** | peso no **Segredo 1 (o veículo/método existe e funciona)** | peso em **por que o seu veículo vence** os outros que ele conhece |
| **Tom** | "deixa eu te mostrar que dá pra resolver isso" | "deixa eu te mostrar por que ESTE é o jeito certo" |
| **Duração típica** | 60-90 min (precisa construir mais crença) | 45-75 min (a pessoa já está mais perto) |

> **Regra de ouro:** depoimento puro **não** é a prova do webinário morno — quem converte aqui é o **estudo de caso** (nível 3+). Depoimento "corredor polonês" é nível 2 (outro funil). *"Anúncio de depoimento pra público frio? Burrice total."*

---

## Gate — Perfil do Projeto (ler ANTES de montar o webinário)

Leia o **Perfil do Projeto** no topo do `projetos/{slug}/offerbook.md` — regra compartilhada em **`.claude/skills/_shared/perfil.md`**. Ele muda o webinário:

- **Guard de enquadramento (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **PROIBIDO** enquadrar o webinário como "mentoria do especialista" e usar "depoimento de aluno" como prova. O roteiro fala de **empresa / cliente / case** (voz do cliente, prova de uso, estudo de caso), NUNCA "mentoria do especialista" nem "depoimento de aluno". O enquadramento "especialista que ensina um método" só vale quando **Tipo = especialista**.
- **Afiliado (regra dura):** **Perfil = afiliado → webinário só se o PRODUTOR fornece a estrutura; o afiliado promove, não apresenta oferta própria.**
- Sem Perfil no offerbook → use o padrão (Tipo = especialista, Voz = pessoa) e siga, nunca trave.

---

## Gate de configuração (define ANTES de montar)

Antes das 5 peças, resolva 3 coisas. O que dá pra ler do offerbook/avatar, leia (não pergunte); o que é decisão do dono, pergunte em opção clicável, sem pré-marcar nenhuma.

### 1. Destino do fechamento — PERGUNTE (2 opções, nenhuma marcada)
> **No fim do webinário, o que você quer?**
> - **Venda direta (checkout)** — o lead compra ali mesmo, na oferta do webinário. Costuma casar com ticket que a pessoa decide sozinha.
> - **Marcar reunião/diagnóstico** — o lead agenda uma conversa; o fechamento é na call. Costuma casar com ticket alto, serviço ou B2B, onde a venda precisa de conversa.

Consequências: **venda direta** → Peça 4 é oferta + checkout (stack, ancoragem, escassez). **Marcar reunião** → Peça 4 é convite pra call + link de agendamento (não checkout), e a régua de e-mail **nutre até a reunião, NUNCA vende direto** (ciclo longo). O ticket do offerbook é só contexto pra sua decisão, não decide por você.

> **GRAVAR a escolha:** quando o dono responder, grave a resposta como o campo **`Destino do fechamento: [venda-direta | reunião]`** no **Perfil do Projeto** (topo do `projetos/{slug}/offerbook.md`) — é de lá que `/recuperacao-funil`, `/cro-funil` e `/status-funil` leem pra não empurrar checkout onde o certo é agendar reunião (regra em `_shared/perfil.md`).

### 2. Ao vivo ou gravado — leia do offerbook, pergunte só se faltar
Webinário pode ser **ao vivo** (mais crença, mais trabalho) ou **gravado/evergreen** (escala, roda sempre). Se o offerbook não disser, pergunte. Pra ticket alto, gravado é aceitável (aquece o lead antes da reunião).

### 3. Segmentação — LEIA do offerbook + avatar (não pergunte)
- Se o avatar tem **1 dor dominante** e há **1 produto** → **1 webinário**.
- Se há **dores/segmentos diferentes com produtos por dor** → **1 webinário por segmento** (mesmo apresentador serve). A skill decide isso lendo as dores ranqueadas do `avatar.md` + a oferta do `offerbook.md`.
- **Apresentador:** default 1 (a marca ou o especialista). SÓ pergunte "1 apresentador ou vários consultores?" quando o tipo de oferta for **serviço / agência / B2B com time**; se vários, gere uma variante de roteiro por consultor (cada um na sua voz).
- **Multi-nicho:** se cada apresentador atende um **nicho diferente**, isso são **projetos separados** (um offerbook por nicho). Não empilhe nichos num webinário só. Avise: *"Nicho diferente = projeto separado. Este webinário é do projeto atual; rode o pipeline uma vez por nicho."*

---

## As 5 peças do funil de webinário

Monte nesta ordem. Cada peça tem sua skill responsável.

| # | Peça | O que entrega | Skill / fonte |
|---|------|---------------|---------------|
| 1 | **Páginas de registro + obrigado** | **inscrição** (captura nome + e-mail + WhatsApp; promessa + data/hora + o que vai aprender) E **obrigado** com a **pesquisa de maturidade** (2-4 perguntas que segmentam o lead e, no B2B, qualificam pra reunião). GERAR os DOIS HTMLs de fato (`pagina/registro.html`, `pagina/obrigado.html`), não só o esqueleto. | `/design-md` (visual) + `/pagina-vendas-funil` (estrutura) + `/quiz-funil` (mecânica da pesquisa) + `/copy-funil` (copy) |
| 2 | **Sequência de aquecimento** | e-mails + WhatsApp do registro até o "estamos ao vivo" — sobe show rate. No destino "marcar reunião", a régua **nutre até a reunião, nunca vende direto**. | `/email-funil` + `/whatsapp-funil` |
| 3 | **Roteiro do webinário** | a apresentação fase a fase (abertura → 3 segredos → transição → stack → fechamento). Ao vivo ou gravado. | esta skill (estrutura) + `/copy-funil` (falas) |
| 4 | **Fechamento (pelo destino escolhido)** | **venda direta** → oferta + checkout (stack, ancoragem, bônus, garantia, escassez, CTA). **Marcar reunião** → convite + link de agendamento (NÃO checkout); a venda fecha na call. | `offerbook` + `/pagina-vendas-funil` (venda direta) · `/pagina-vendas-funil` (modo B2B/agendar reunião — o back-end fica pro pós-fechamento/expansão) |
| 5 | **Pós-webinário** | replay + sequência até o fechamento: **venda direta** → e-mails de carrinho; **reunião** → lembrete/no-show da call e re-agendamento. | `/email-funil` + `/recuperacao-funil` |

---

## Peça 3 — Roteiro do webinário (5 fases)

A espinha do Perfect Webinar (Brunson). Detalhe e falas-modelo no KB §3.

| Fase | Tempo (de 60 min) | O que acontece | Por que converte |
|------|-------------------|----------------|------------------|
| **1. Abertura + promessa** | 0-5 min | hook + promessa do que vão aprender; sem small talk; "fica até o fim que a parte mais importante vem no final" | prende e ancora a expectativa |
| **2. História de origem** | 5-15 min | epiphany bridge — onde você estava, a descoberta, a transformação; introduz o mecanismo | autoridade + identificação; transfere crença |
| **3. Os 3 segredos** | 15-40 min | Segredo 1 (o veículo/método), Segredo 2 (crença interna "eu não consigo"), Segredo 3 (crença externa "não funciona pra mim") | cada segredo quebra **uma objeção** com ensino + estudo de caso |
| **4. Transição + stack** | 40-50 min | recap → "2 caminhos: sozinho ou comigo" → apresenta a oferta → stack de valor empilhado → ancoragem → preço → garantia | empilha valor, estica a distância valor↔preço |
| **5. Fechamento + Q&A** | 50-60 min | triple close (lógica → custo de não agir → urgência) → CTA repetido → bônus fast-action → Q&A vendendo nas respostas | comprime a decisão; recupera quem hesita |

**Big Domino (gate antes de escrever o roteiro):** *"Se eu fizer [público] acreditar que [nova oportunidade/mecanismo] é a chave para [desejo] e que só se alcança através do [seu veículo único], então todas as outras objeções ficam irrelevantes."* Sem Big Domino definido, o roteiro vira aula solta que não vende.

> **Razão de conteúdo↔oferta:** nível 4 → 70-80% conteúdo; nível 3 → 60% conteúdo. **Nunca** inverta (oferta esmagando o conteúdo derruba a confiança do morno).

---

## Peça 2 — Sequência de aquecimento (pré-webinário)

Show rate é o que decide o faturamento do webinário (KB §5). Sequência-modelo:

| Quando | Canal | Mensagem |
|--------|-------|----------|
| Na hora do registro | e-mail + WhatsApp | confirmação + data/hora + adicionar ao calendário + "responda com sua maior dúvida sobre [tema]" |
| 1 dia antes | e-mail | uma dica de valor ligada ao tema + lembrete do horário |
| Manhã do dia | e-mail + WhatsApp | "hoje é o dia, às [hora]" + o que preparar (papel/caneta) |
| 1 hora antes | WhatsApp | contagem + link |
| No início | e-mail + WhatsApp | "estamos AO VIVO — entra agora" + link direto |

> Antecedência: público **nível 3** decai rápido — janela curta (3-7 dias). **Nível 4** tolera um pouco mais de nutrição (7-14 dias) porque precisa de mais aquecimento. A escassez do ao vivo ("sem replay garantido") é o que puxa o show rate.

---

## Peça 5 — Pós-webinário (replay + venda)

O carrinho não fecha quando o webinário acaba. Sequência-modelo (KB §6):

| Quando | Mensagem |
|--------|----------|
| Logo após | "perdeu? o replay está no ar — a oferta fecha em [X]h" + link |
| Dia seguinte | recap do que foi ensinado + estudo de caso de quem comprou + deadline |
| Antes do deadline | "última chance — encerra hoje" + o que ele perde + link direto |

> A oferta do webinário tem **escassez real** (fecha o carrinho / bônus do ao vivo expira) — nunca falsa. Escassez fabricada destrói a confiança que o webinário construiu. Carrinho recusado / boleto / abandono → entra no `/recuperacao-funil`.

---

## Regras de ouro

**SEMPRE:** diagnosticar nível (4 ou 3) antes de montar · oferta/offerbook pronta ANTES do roteiro · definir o Big Domino antes de escrever · cada segredo quebra uma objeção (com estudo de caso) · 70-80% conteúdo no nível 4 / 60% no nível 3 · escassez **real** · sequência de aquecimento pra subir show rate · sequência de pós-webinário pra fechar (50% das vendas vêm depois/no último dia) · você revisa a estrutura antes de qualquer coisa.

**NUNCA:** webinário sem oferta definida · oferta esmagando o conteúdo (morno foge) · depoimento puro como prova central (isso é nível 2) · escassez falsa · mandar nível 5/2/1 pro webinário (funil errado — ver Veto) · "ensinar tudo" a ponto da pessoa não precisar comprar · subir/agendar/disparar sem você revisar · escrever a copy de cabeça (a copy aplicada sai do `copy.md`; e-mails com `/email-funil`).

---

## Output (o que a skill entrega)

Pra cada pedido, entregar:

1. **Diagnóstico** — nível (4 ou 3) + justificativa + tipo de webinário (educativo vs solução).
2. **Big Domino** + os **3 segredos** mapeados (qual crença cada um quebra).
3. **Mapa das 5 peças** — registro → aquecimento → roteiro → fechamento → pós, cada uma com a skill responsável.
4. **As páginas GERADAS de fato** (HTML na identidade do `DESIGN.md`, não só esqueleto): `pagina/registro.html` (inscrição), `pagina/obrigado.html` (confirmação + **pesquisa de maturidade** clicável, mecânica do `/quiz-funil`), e — pelo destino escolhido — `pagina/oferta.html` (venda direta) OU o bloco de **convite + link de agendamento** (marcar reunião). Faltou isso ao vivo: NÃO entregue só a de vendas.
5. **Roteiro fase a fase** (as 5 fases, com tempos e falas geradas do `copy.md`) em `pagina/webinario-roteiro.html`.
6. **Sequências** — aquecimento (e-mail + WhatsApp) e pós-webinário, como esqueleto pra `/email-funil` (no destino "reunião", nutrição até a call, nunca venda direta).
7. **Checklist** pré / durante / pós-webinário (KB §7).

> A **copy aplicada** (roteiro + páginas de registro/obrigado + pesquisa) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. `/email-funil` escreve os e-mails; o `DESIGN.md` dá a identidade visual das páginas.

> **Onde salvar:** a estrutura desta skill sai em **`projetos/{slug}/webinario.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Encaixe no Mapa de Execução do metodo-funil

Esta skill é o **funil dos níveis 4-3** que o `metodo-funil` prescreve mas não detalhava. No Mapa de Execução, quando o diagnóstico der **nível 4 ou 3 → funil = webinário/aula**, a peça "Funil" se expande assim:

```
Estágio 4-3 → Funil: WEBINÁRIO  →  /webinario-funil

PEÇA            SKILL                  O QUE ENTREGA
01 Offerbook    offerbook/oferta-funil oferta, mecanismo, ancoragem, bônus  ← antes do webinário
02 Registro     design-md + pagina-vendas + copy-funil   página de captura
03 Aquecimento  email-funil + whatsapp-funil             show rate até o ao vivo
04 Roteiro      webinario-funil + copy-funil             apresentação 5 fases
05 Pós/venda    email-funil + recuperacao                replay + fechamento do carrinho
06 Teste        cro-funil                                show rate, conversão, A/B
```

> O webinário se conecta ao funil amplo: a **página de registro** usa a estrutura de `/pagina-vendas-funil` (enxuta — só promessa, data e captura), a **oferta** vem do `offerbook`, e a **recuperação** roda no `/recuperacao-funil`. Este skill é a peça que faltava entre o diagnóstico e a venda para o público morno.

---

## Veto conditions (NÃO montar webinário se…)

| Situação | Ação |
|----------|------|
| Público é **nível 5** (inconsciente) | PARAR → webinário converte pouco no frio; usar VSL+advertorial/lançamento (`/vsl-funil`, `/metodo-funil`) |
| Público é **nível 2 ou 1** (consciente do produto / quase comprando) | PARAR → funil errado; usar página+depoimento ou checkout direto (`/pagina-vendas-funil`) |
| **Oferta/offerbook não existe** | PARAR → construir a oferta ANTES (`offerbook` / `/oferta-funil`) |
| **Big Domino não definido** | PARAR → definir a crença central antes de escrever o roteiro |
| Pediram a **copy pronta** das falas/e-mails | Falas e páginas: gerar nesta skill a partir do `copy.md` (sem `copy.md` → /copy-funil primeiro); e-mails com `/email-funil` — nunca de cabeça |
| Vão **subir/agendar/disparar** sem revisar | PARAR → você revisa a estrutura primeiro |

---

*Skill webinario-funil — funil de webinário (níveis 4 e 3) pelo método do Alan Nicolas, com base teórica em Russell Brunson (Perfect Webinar), Jeff Walker (PLF) e Jason Fladlien (9 gatilhos). Toda montagem calibra no KB-webinario-funil.md. A copy aplicada (roteiro + páginas) é gerada nesta skill a partir do copy.md (fundação do /copy-funil); os e-mails saem do /email-funil; a identidade visual vem do seu DESIGN.md. Você revisa, aprova e publica.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
