---
name: whatsapp-funil
description: "Estrutura a sequência de WhatsApp/DM de um funil — mensagens por momento: lembrete de evento/live, confirmação, carrinho abandonado, cartão recusado, nutrição e re-engajamento — casadas ao estágio de consciência. O aluno preenche com o produto/oferta dele; a copy final é dele. Use quando precisar montar/diagnosticar a sequência de WhatsApp ou DM de um funil, decidir que mensagem mandar em cada momento, ou casar o tom e o timing de cada disparo ao quão quente está o contato. A skill estrutura a sequência — o texto final de cada mensagem é trabalho de copy seu."
user_invocable: true
---

# WhatsApp / DM de Funil — Sequência por momento

Skill que estrutura a **sequência de WhatsApp / DM** de um funil: que mensagem mandar em cada momento (lembrete de evento, confirmação, carrinho abandonado, cartão recusado, nutrição, re-engajamento), com que tom e em que timing — casado ao quão quente está o contato.

> **KB (fonte de verdade):** `KB-whatsapp-funil.md` (nesta pasta). Tem o método completo, os momentos da sequência, os timings (ex.: "30 min após o carrinho") e o **verbatim** da fonte. **Carregue o KB antes de prescrever** — nunca responda de cabeça.

> **Tese central:** o WhatsApp/DM é o **canal mais quente do funil** — chega direto, é lido em minutos, tem a maior taxa de resposta. Por isso mesmo é o mais fácil de queimar: mandar a mesma mensagem pra todo mundo, no momento errado, vira spam e o contato te bloqueia. O segredo é **o momento certo + a mensagem certa pra cada situação**. Quem só abandonou o carrinho está com objeção; quem teve o cartão recusado já tentou pagar e está quentíssimo — cada um pede uma abordagem diferente. Método do Alan Nicolas.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, confira que os arquivos existem no seu projeto:

```
ls offerbook-*.md copy-*.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (produto, ticket, público, momentos do funil) do `offerbook-*.md` e a copy base do `copy-*.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar a sequência de WhatsApp/DM eu preciso do `offerbook-*.md`, que sai da skill `/offerbook` (e da `copy-*.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `offerbook-*.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Como usar

Quando você precisar montar/diagnosticar a sequência de WhatsApp ou DM de um funil:

1. **Carregue o KB** (`KB-whatsapp-funil.md`) pra ter os momentos, os timings e o verbatim na mão.
2. **Colete os inputs do seu projeto** (você preenche com a realidade do seu funil):
   - **Produto / oferta** e **ticket** — o que está sendo vendido.
   - **Tem evento no funil?** — live, aula, webinário, masterclass? (define os lembretes).
   - **O que seu funil consegue detectar?** — carrinho abandonado? cartão recusado? boleto/pix gerado? (define quais mensagens de recuperação dá pra ativar).
   - **Sua ferramenta de automação de WhatsApp/DM** — você dispara manual ou tem automação? (genérico: qualquer ferramenta de automação de WhatsApp/DM serve).
   - **Quão quente é o contato** — ele veio de tráfego frio, da sua base, de um evento? (define o tom).
3. **Diagnostique cada momento** que existe no seu funil (Passo a passo abaixo).
4. **Monte a sequência** de mensagens por momento, do mais quente ao mais frio.
5. **Apresente a estrutura pra você revisar/aprovar** antes de configurar qualquer disparo.
6. **Escreva (ou mande escrever) a copy** de cada mensagem depois — a skill estrutura a sequência; o texto final é seu.

---

## Gate (antes de prescrever)

A sequência de WhatsApp/DM só funciona se você **distingue os momentos**. Tratar todo contato igual é o erro número um — e o que mais queima o canal.

> *"Se ela abandonou o carrinho... ela está com objeções. Se ela chegou a colocar o cartão e recusou, percebe que ela tentou... a tua abordagem vai ser completamente diferente."*

Antes de montar a sequência, confirme: **quais momentos seu funil consegue detectar?** Você só ativa a mensagem certa pros momentos que consegue identificar (tem evento? detecta carrinho abandonado? detecta cartão recusado?).

---

## Processo passo a passo

1. **Listar os momentos do seu funil** — quais existem: lembrete de evento, confirmação, carrinho abandonado, cartão recusado, boleto/pix, nutrição, re-engajamento.
2. **Para cada momento, ler o que o contato está sentindo** (a tabela abaixo / KB §3).
3. **Definir o timing** de cada disparo (ex.: lembrete antes do evento; "30 min após o carrinho"; cartão recusado logo após a falha).
4. **Definir o tom** de cada mensagem (mais quente pra quem tentou pagar; mais leve/cuidadoso pra quem só abandonou).
5. **Encadear a sequência** do contato mais quente ao mais frio.
6. **Mapear os disparos** (momento + timing + tom) — deixando o **texto da mensagem como tarefa de copy separada**.
7. **Apresentar a estrutura pra você aprovar.**

---

## Mensagens por momento do funil

| Momento | O que o contato está sentindo | Mensagem (objetivo) | Timing |
|---------|-------------------------------|---------------------|--------|
| **Confirmação de inscrição** | Acabou de entrar — interesse no pico | Confirmar, reforçar o que vai receber, baixar a ansiedade | Imediato, logo após a inscrição |
| **Lembrete de evento/live** | Inscrito, mas a vida puxa pra outro lado | Lembrar do evento + reforçar o valor de aparecer | Sequência: véspera → dia → 1h antes → "estamos começando" |
| **Link do evento** | Hora de entrar | Mandar o link de acesso (Zoom/live), curto e direto | Bem perto da hora (não junto da agenda) |
| **Carrinho abandonado** | Chegou no checkout e travou — está com objeção | Tom leve, "aconteceu algo errado?" — abrir conversa | **30 min depois** do abandono |
| **Cartão recusado** | Tentou pagar e falhou — quentíssimo, só faltou passar | Mais quente e direta: ajudar a finalizar, **trocar o meio de pagamento** e/ou desconto | Logo após a falha |
| **Boleto/pix gerado** | Escolheu pagar mas não concluiu — interesse alto | Empurrar pra finalizar (ex.: cartão com desconto) | Antes de vencer / esfriar |
| **Nutrição / re-engajamento** | Esfriou, não converteu em nada | Reativar a dor, voltar pro problema, reconstruir o caminho | Sequência mais longa, sem pressão |

**Regra de leitura:** quem **tentou pagar** (cartão recusado) está mais quente que quem **só abandonou** o carrinho. A mensagem do cartão recusado é mais quente e direta; a do carrinho é mais cuidadosa, porque ali existe objeção. Quem **apareceu no evento** está mais quente que quem só se inscreveu.

---

## Regras de tom e timing

**Tom:**
- WhatsApp/DM é conversa, não panfleto. Tom de pessoa falando com pessoa, nunca aviso automático seco.
- Quanto mais quente o contato (tentou pagar, apareceu no evento), mais direta pode ser a mensagem.
- Quanto mais frio ou com objeção (carrinho abandonado, nutrição), mais leve e curioso o tom — abrir conversa, não pressionar.
- Uma mensagem, uma ideia. Mensagem longa no WhatsApp não é lida.

**Timing:**
- **30 min** é a janela do carrinho abandonado — quente o bastante pra reagir, fresco o bastante pra lembrar.
- Cartão recusado: **logo após** a falha (a intenção de pagar ainda está viva).
- Lembrete de evento: **cadência**, não um disparo só (véspera, dia, 1h antes, "começando agora").
- Link do evento perto da hora; **a agenda** vai antes, **o link** vai na hora.
- Boleto/pix: agir **antes de vencer** ou esfriar.

---

## Regras de ouro

**SEMPRE:** distinguir o momento antes de escolher a mensagem · tratar cartão recusado diferente de carrinho abandonado · tom de conversa (pessoa pra pessoa) · timing certo por momento (30 min no carrinho, logo após a falha no cartão recusado) · cadência nos lembretes de evento · uma ideia por mensagem · apresentar a estrutura pra revisão antes de configurar disparo.

**NUNCA:** mandar a mesma mensagem pra todo contato · pressionar quem está só com objeção (carrinho) como se fosse cartão recusado · mandar o link do evento junto da agenda (link vai na hora) · texto de aviso automático seco (vira spam, o contato bloqueia) · mensagem longa demais · escrever a copy final dentro da skill (é tarefa de copy sua) · configurar/disparar nada sem você aprovar.

---

## Output (o que a skill entrega)

1. **Mapa dos momentos** que seu funil consegue detectar.
2. **Mensagem prescrita** pra cada momento (objetivo, tom, timing).
3. **Sequência ordenada** do contato mais quente ao mais frio.
4. **Cadência dos lembretes** de evento (se houver evento no funil).
5. **Mapa de disparos** (momento + timing + tom) — com o texto marcado como tarefa de copy sua.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Você não sabe quais momentos seu funil detecta | PARAR → levantar isso primeiro (é o gate) |
| Pediram a copy pronta das mensagens | Estruturar a sequência e deixar o texto como tarefa de copy sua |
| Vão configurar/disparar sem você aprovar | PARAR → apresentar a estrutura, esperar o OK |

---

*Skill whatsapp-funil v1 — sequência de WhatsApp/DM de funil por momento de consciência. Método do Alan Nicolas. Toda prescrição calibra no KB. A skill estrutura a sequência; o texto final de cada mensagem é trabalho de copy seu. NUNCA executa ou dispara nada.*
