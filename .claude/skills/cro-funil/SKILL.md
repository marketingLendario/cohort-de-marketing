---
name: cro-funil
description: "Otimização de conversão (CRO) de um funil já montado, pelo método de elevação de consciência do Alan Nicolas. Monta a planilha de KPIs por etapa (visitas → cadastros → participantes → oferta → checkout → compras), prioriza o teste de maior alavancagem (a headline), conduz o teste A/B do jeito certo (1 teste por vez, mínimo 1.000 views únicos) e diz quando o funil está pronto pra escalar. Use quando você quiser otimizar a conversão do seu funil, montar a planilha de KPIs, decidir qual elemento testar, estruturar um teste A/B ou avaliar se já pode botar mais verba em tráfego. A skill dá o método e a estrutura; você preenche com os dados do seu projeto."
user_invocable: true
---

# CRO Funil — Otimização de Conversão pelo Método do Alan

Skill que estrutura a otimização de conversão de um funil pelo método do **Alan Nicolas**. Foca no que vem **depois** de montar o funil: medir cada etapa, testar o elemento certo e decidir quando escalar.

> **KB (base de conhecimento):** `KB-cro-funil.md` (nesta pasta). Tem os frameworks de teste/otimização com o **verbatim do método**, a planilha de KPIs por etapa e os 3 testes que movem o ponteiro. **Carregue o KB antes de prescrever** — nunca responda de cabeça.

> **Tese central:** uma coisa que mexe no funil mexe no resultado todo. *"Uma coisa que tu mexe no funil, já mexe em tudo, mexe em todo o resultado."* Cada etapa é uma vitória a otimizar; ganhos pequenos por etapa multiplicam no resultado final. Por isso a ordem importa: testar primeiro o que tem **maior alavancagem** (a headline), não o que é fácil (cor de botão, footer).

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output anterior do funil. Primeiro descubra o projeto ativo (`ls projetos/`), depois confira que os arquivos existem:

```
ls projetos/{slug}/funil.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles (o `projetos/{slug}/funil.md` te dá a estrutura do funil e as etapas a medir; o `projetos/{slug}/copy.md`, a headline a testar).
- Se FALTAR, PARE e aponte a skill anterior:

> Pra otimizar a conversão do funil eu preciso de `projetos/{slug}/funil.md` (da skill `/metodo-funil`) e da headline em `projetos/{slug}/copy.md` (da skill `/copy-funil`). Rode `/metodo-funil` primeiro e volte.

Não invente o que deveria vir da etapa anterior.

> **Onde salvar:** o resultado desta skill sai em **`projetos/{slug}/cro.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

---

## Como usar

Quando você quiser otimizar conversão, montar a planilha de KPIs, ou estruturar um teste:

1. **Carregar o KB** (`KB-cro-funil.md`) pra ter os frameworks e o verbatim na mão.
2. **Montar / preencher a planilha de KPIs por etapa** com os números do **seu funil** (Passo 1) — sem isso não há otimização, só achismo.
3. **Identificar a etapa que mais sangra** e o **elemento de maior alavancagem** a testar (headline primeiro).
4. **Estruturar 1 único teste A/B** seguindo as regras (1 por vez, mín. 1.000 views únicos).
5. **Dizer quando o funil está pronto pra escalar** (converte bem e barato → botar mais verba).
6. **Apresentar a estrutura pra você revisar e aprovar** — a skill desenha o plano e o teste; não sobe, não roda nem altera nada no seu funil. A decisão e a execução são suas.

---

## Gate de medição (OBRIGATÓRIO antes de otimizar)

**Não dá pra otimizar o que não se mede.** Antes de propor qualquer teste, garanta que existe a planilha de KPIs por etapa do seu funil. Sem ela, pare e monte-a primeiro.

Preencha com os números do **seu projeto**:

| Etapa do funil | KPI | Seu número (preencher) |
|----------------|-----|------------------------|
| **Visitas** | visitantes únicos na página | `____` |
| **Cadastros** | leads captados / taxa de cadastro | `____` |
| **Participantes** | quem aparece / show up (se houver aula/webinário) | `____` |
| **Oferta** | quem chega no momento da oferta | `____` |
| **Checkout** | quem entra no checkout | `____` |
| **Compras** | compras / taxa de conversão final | `____` |

> Cada etapa é uma "vitória" a ser otimizada separadamente. *"No mínimo, mil views únicos, mil pessoas diferentes que caíram na tua página"* antes de decidir qualquer coisa.

---

## Modo pré-lançamento (o funil ainda não rodou)

Quase sempre o aluno está ANTES do primeiro lançamento — não há dados de KPI ainda. Nesse caso **não peça números que não existem**. Em vez de otimizar no vácuo, entregue o SETUP:

1. **O que instrumentar, em ordem de prioridade:**
   1. **Evento de checkout** — sem registrar compra/checkout você não mede a etapa que mais importa.
   2. **UTM / rastreio no link da bio** — pra saber de onde vem cada visita.
   3. **Pixel / analytics de visitas** na página de captura.
   4. **Pixel na página de oferta** — pra medir quem chega no momento da oferta.

2. **Baselines / faixas de referência por etapa** como META a bater — marcadas como **referência de mercado, NÃO promessa**. Servem de alvo inicial de cada etapa; o seu número real só aparece quando o funil rodar.

3. **Quando o funil rodar e você tiver os números, volte e rode `/cro-funil` de novo** pra achar o gargalo real e priorizar o teste certo.

Nesse modo, a planilha de KPIs sai **vazia / preenchível**, só com as etapas certas na ordem (visitas → cadastros → participantes → oferta → checkout → compras) — pronta pra você preencher assim que os dados existirem.

---

## Processo passo a passo (otimização)

1. **Montar a planilha de KPIs por etapa** com os números do seu funil (visitas → cadastros → participantes → oferta → checkout → compras). É o gate. Sem medição não há CRO.
2. **Achar o gargalo** — a etapa onde mais gente cai fora é onde está a maior alavancagem de melhoria.
3. **Priorizar o teste de maior impacto:** começar pela **headline** (o "ouro"), depois oferta/preço, depois prova/criativo-hook casado ao nível de consciência (ver KB §"3 testes").
4. **Estruturar 1 único teste A/B** — nunca A/B/C/D ao mesmo tempo. Uma variável por vez.
5. **Definir o critério de decisão:** mínimo **1.000 views únicos** por variação. Tráfego baixo → esperar mais de uma semana. Não decidir com amostra pequena.
6. **Rodar A/B da headline continuamente** — toda semana, é o teste que mais derruba custo (*"reduzi em 100 reais o meu custo por MQL, só mudamos a headline"*).
7. **Ler o resultado e decidir** — comparar a variação A vs B só depois de atingir a amostra mínima.
8. **Decidir escala:** se converte bem e barato, **botar mais verba em ads** (*"bota mais dinheiro, porque a gente vai comprar mais lead"*). Se um elo está sangrando, otimizar antes de escalar.
9. **Iterar:** próximo teste no próximo elemento de maior alavancagem. Ganhos pequenos por etapa compõem.

---

## Os 3 testes que movem o ponteiro

Em ordem de alavancagem (detalhe + verbatim no KB):

1. **Headline** (verbatim, "o ouro") — A/B contínuo, toda semana. Item de maior alavancagem da página inteira.
2. **Oferta / preço** (síntese) — stack de valor, ancoragem e ponto de preço. *"Se você não tem uma boa oferta você vai botar muito dinheiro, muito tempo e não vai gerar tanto resultado."*
3. **Prova / criativo-hook** casado ao nível de consciência (síntese) — depoimento → nível 2; estudo de caso → nível 3+; hook de captação → níveis 1–2.

> **Erro clássico que o Alan ridiculariza:** testar **cor de botão / footer** achando que é isso que converte. *"Não, eu não acho que as pessoas estão comprando é porque eu devia alterar o meu footer."* O que move é a headline.

---

## Regras do teste A/B

| Regra | Verbatim / razão |
|-------|------------------|
| **1 teste por vez (só A/B)** | *"não quero fazer teste A/B/C/D/E/F, não: faz agora só um teste A/B"* — isolar a variável |
| **Mínimo 1.000 views únicos** | *"no mínimo, mil views únicos, mil pessoas diferentes que caíram na tua página"* |
| **Tráfego baixo → esperar mais** | se não bate 1.000 views rápido, esperar mais de uma semana antes de decidir |
| **Headline primeiro** | maior alavancagem; A/B contínuo toda semana |
| **Não testar elemento secundário achando que move** | cor de botão / footer NÃO movem conversão |
| **Planilha de KPIs por etapa** | medir cada etapa pra saber onde o teste precisa atacar |

---

## Quando o funil está pronto pra escalar

- **Converte bem e barato** em cada etapa → **botar mais dinheiro em ads** (a oferta de entrada banca o tráfego; converter demais e barato é sinal de escalar). *"A gente está gastando 30 reais, se uma pessoa paga 48 está errado, bota mais dinheiro, bota mais dinheiro, porque a gente vai comprar mais lead."*
- **Tem etapa sangrando** → otimizar a etapa-gargalo ANTES de escalar (escalar tráfego em funil furado só amplifica o vazamento).

---

## Output (o que a skill entrega)

Pra cada pedido de otimização, entregar um **plano estruturado** pra você revisar:
1. **Planilha de KPIs por etapa** (estrutura preenchível: visitas → cadastros → participantes → oferta → checkout → compras).
2. **Diagnóstico de gargalo** (qual etapa mais sangra — quando você tem os dados; senão, o que medir primeiro).
3. **Teste priorizado** (qual elemento, por que é o de maior alavancagem — headline primeiro).
4. **Desenho do teste A/B** (variação A vs B, métrica de decisão, amostra mínima de 1.000 views).
5. **Critério de escala** (converte bem e barato → mais verba; sangrando → otimizar antes).

---

## Regras de ouro

**SEMPRE:** montar a planilha de KPIs por etapa antes de otimizar · testar primeiro o elemento de maior alavancagem (headline) · 1 teste A/B por vez · mín. 1.000 views únicos antes de decidir · A/B da headline toda semana · escalar verba quando converte bem e barato · apresentar a estrutura pra você revisar e aprovar.

**NUNCA:** otimizar sem medir (achismo) · testar cor de botão/footer achando que move conversão · rodar A/B/C/D ao mesmo tempo · decidir com < 1.000 views únicos · escalar tráfego em funil com etapa furada · alterar/subir/rodar nada no seu funil sem sua aprovação.

---

## Veto conditions (NÃO prescrever se…)

| Situação | Ação |
|----------|------|
| Não existe planilha de KPIs / não há medição | PARAR → montar a planilha primeiro (é o gate) |
| Pediram pra testar cor de botão/footer | Realinhar → o que move é headline/oferta/prova |
| Amostra < 1.000 views únicos | PARAR → não decidir; esperar atingir a amostra |
| Vão alterar/subir/rodar teste sem revisão | PARAR → apresentar a estrutura, esperar o OK |

---

*Skill cro-funil v1 — método do Alan Nicolas (Workshop de Funis + Clube 100M): KPIs por etapa, teste A/B só na headline, 1 teste por vez, mínimo 1.000 views únicos. A skill dá o método e a estrutura; você preenche com os dados do seu projeto e decide. Toda prescrição calibra no KB. Irmã da skill funil-alan (que monta o funil — esta otimiza o que já está montado).*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/cro-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
