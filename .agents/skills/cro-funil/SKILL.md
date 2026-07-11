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

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

---

## Passo 0 — Checar insumos antes de rodar

> **Fonte dos KPIs: os eventos de Pixel + GTM das páginas.** As skills de página instalam GTM + Meta Pixel com eventos-padrão (PageView, Lead, quiz_start/complete, chegou_na_oferta, InitiateCheckout, Purchase). A planilha de KPIs desta skill lê ESSES eventos — confira se as páginas publicadas estão com os IDs reais plugados (não placeholders) antes de medir.

- **Obrigatório:** o funil já montado — `projetos/{slug}/funil.md` e/ou `projetos/{slug}/pagina/` existentes. CRO sem funil não tem o que otimizar. Se faltar, aponte a skill que gera (`/metodo-funil` pro funil; `/pagina-vendas-funil` pra página) e **PERGUNTE se o usuário quer seguir mesmo assim**.
- **Recomendados:** `offerbook.md` (contexto da oferta) e **dados reais de tráfego** — peça-os ao usuário; **NUNCA invente números de conversão**.

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

> **Antes de tudo, leia os dois `_shared` (regra dura):** `.claude/skills/_shared/perfil.md` (Perfil do Projeto — Tipo, Voz e destino do funil; define quais KPIs medir — ver o Gate de KPIs abaixo) e `.claude/skills/_shared/nunca-travar.md` (o aluno nunca trava: todo pré-requisito e ferramenta explicados em linguagem de leigo, com glossário inline; **Apify é central, nunca "opcional"** — fallback só quando a cota estoura; **nunca prometa que o HTML abre sozinho** — sempre dê o caminho do arquivo + como abrir no SO do aluno).

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

## Quem preenche a planilha é a SKILL (não o aluno no braço)

A planilha de KPIs nunca sai como tabela morta pro aluno digitar em outro lugar. Em ordem de preferência:

1. **Com API disponível, a skill COLETA e preenche sozinha.** Check das credenciais no `.env`/ambiente: ActiveCampaign (`ACTIVECAMPAIGN_URL` + `ACTIVECAMPAIGN_API_KEY` → contatos novos por dia e por TAG = leads/dia e distribuição de perfis) e Calendly/TidyCal (token → agendados e no-shows). Tendo credencial, a skill consulta, preenche a planilha no `cro.md`, CALCULA as taxas etapa a etapa, aponta o gargalo e regenera o html. Sem credencial: ofereça configurar (1 linha no `.env`) e PERGUNTE.
2. **Sem API, a planilha sai PREENCHÍVEL em HTML** (padrão do `pendencias.html`): campos de input com localStorage + botão "Copiar respostas pro Claude". O aluno digita os números no navegador (5 min), copia, cola no chat, e a skill faz o resto: preenche o `cro.md`, calcula as taxas, acha o gargalo, atualiza o html e diz qual teste atacar.
3. **Fallback CSV:** exportar os contatos do ActiveCampaign (CSV) e apontar o arquivo; a skill lê, conta por dia/TAG e preenche.

**O que sempre fica manual (dizer isso ao aluno):** eventos de página/CRM (visitas, leads, TAGs) são automatizáveis por API e viram dashboard na Aula de Dados (Bruno). Mas o RESULTADO de venda humana (veio na sessão · fechou · aceitou upsell) nenhum pixel enxerga: é registro do dono, 30 segundos pós-sessão. A skill separa na planilha o que se automatiza do que é registro humano, pra não vender automação impossível.

**Honestidade preservada:** a skill só preenche com dado real (coletado por API, colado pelo aluno ou lido de export). Célula sem dado fica vazia; nunca estimar pra "completar" a planilha.

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

> **Honestidade de dados:** KPIs e taxas de conversão vêm de dados REAIS do usuário — nunca inventar benchmark como se fosse dado do funil. Benchmark de mercado entra sempre rotulado como benchmark, com fonte.

## Gate — KPIs conforme o Perfil do Projeto (não é sempre checkout)

Antes de montar a planilha, **leia `.claude/skills/_shared/perfil.md`** (Perfil do Projeto) e pegue o **Tipo** e o campo **`Destino do fechamento`** (`venda-direta | reunião`) — **leia o campo, não re-deduza** (o `/quiz-funil` e o `/webinario-funil` já gravaram a escolha lá). A etapa final NEM SEMPRE é um checkout — a planilha de KPIs muda conforme o destino:

- **B2B / serviço (destino = reunião):** os KPIs são de **PIPELINE**, não de checkout. As etapas viram: **leads → reuniões marcadas → reuniões feitas → propostas enviadas → fechamento**. O "gargalo que sangra" e o teste de maior alavancagem se leem sobre essa régua (ex.: lead → reunião marcada, no-show entre marcada e feita, proposta → fechamento).
- **Físico / local (destino = presença/procura):** os KPIs são de **presença e procura**, não de compra online. As etapas viram: **visitas ao perfil/Google Maps → mensagens no WhatsApp → visitas à loja** (e, quando houver, venda registrada pelo dono). Nenhum pixel de checkout enxerga isso — grande parte é registro humano (ver a regra de "resultado de venda humana" acima).
- **Digital com checkout (destino = compra online):** a régua padrão desta skill (visitas → cadastros → participantes → oferta → checkout → compras).
- **Afiliado:** meça **até o clique no seu link de afiliado**; do **checkout → compra é do produtor** (você não controla o checkout) — peça os números a ele se estiverem disponíveis, e otimize o que é seu (criativo, hook, CTR até o clique).

> **Guard de enquadramento (do `perfil.md`):** se o Perfil disser **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **proibido** enquadrar a otimização como especialista/curso/depoimento-de-aluno (ex.: "prova = depoimento de aluno" só vale pra infoproduto). Ajuste a prova/criativo-hook ao Tipo real do negócio.

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

## Conexão com as próximas aulas do cohort (declarar SEMPRE no fecho)

O CRO não termina em si: ele é a PONTE pras duas aulas seguintes. Toda entrega desta skill diz explicitamente o que fica pronto aqui e o que cada aula pluga:

- **Aula de Tráfego (Rafa):** é onde os IDs de Pixel + GTM são criados e plugados (as páginas já saem pixel-ready daqui, com os eventos cravados), as campanhas nascem e o UTM avançado entra. O que esta skill entrega pra lá: páginas instrumentáveis em 2 colagens, o gate de escala (3 mini-cases antes de ads) e a conta reversa que diz QUANTO tráfego comprar.
- **Aula de Dados (Bruno):** a planilha de KPIs desta skill é o EMBRIÃO do dashboard. É onde a medição manual vira automatizada (eventos do Pixel/GTM + ActiveCampaign alimentando o painel) e as taxas/gargalos passam a ser lidos de dado vivo. O que esta skill entrega pra lá: as etapas certas do funil já definidas, a planilha estruturada e a rotina semanal de leitura.

Regra: o aluno chega nessas aulas COM a estrutura pronta (planilha + páginas pixel-ready + gate); as aulas plugam a tecnologia, não redesenham o funil.

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

## Como RODAR o teste A/B na prática (3 trilhas — nunca prescrever teste sem dizer COMO dividir o tráfego)

1. **Split embutido na página (recomendado):** a página nasce A/B-READY — a variante B da headline vive no código, com sorteio 50/50 e localStorage (o mesmo visitante sempre vê a mesma variante) + evento por variante no dataLayer. Fica DESLIGADO (`AB_ATIVO=false`); quando o teste começar, o aluno liga com 1 linha. A skill instala a mecânica; o aluno só liga e desliga.
2. **Duas URLs alternadas** (`?v=a` / `?v=b` no link da bio) — pra quando o split JS não der.
3. **Sequencial** (semana inteira com A, depois semana com B) — último recurso: comparar períodos diferentes tem viés (sazonalidade, ritmo de conteúdo); rotular o resultado como INDICATIVO, não veredito.

A regra de decisão não muda: mínimo 1.000 views únicos POR variante.

## Árvore de diagnóstico (usar quando o aluno voltar com os números)

O gargalo aponta a causa provável e a peça a mexer — 1 gargalo por vez, o pior primeiro:

| Gargalo (taxa baixa em...) | Causa provável | Peça a mexer | Skill que regenera |
|---------------------------|----------------|--------------|--------------------|
| Visita → início do quiz | Promessa/headline da capa do quiz | Capa do quiz | `/quiz-funil` + banco do `copy.md` |
| Início → conclusão do quiz | Uma pergunta derruba (ver drop-off por pergunta) | A pergunta com maior queda | `/quiz-funil` (recalibrar) |
| Conclusão → lead (gate) | Atrito do formulário ou promessa fraca do resultado | Gate de captura | `/quiz-funil` |
| Lead → agendamento | Assunto/CTA dos e-mails ou fricção do calendário | E-mails · link de agenda | `/email-funil` |
| Agendou → show-up | Lembrete fraco ou intervalo longo demais | Sequência de lembrete | `/recuperacao-funil` (C2) · `/whatsapp-funil` |
| Sessão → fechamento | Roteiro da sessão ou oferta | Roteiro/oferta | `/backend-funil` + `offerbook.md` |
| Fechou → upsell | Fala do SIM ou preço da continuidade | Fala do upsell | `/backend-funil` |

## A/Bs baratos que JÁ existem nas ferramentas do aluno (usar antes de inventar)

- **ActiveCampaign: teste A/B de ASSUNTO é nativo** — todo e-mail de trilha pode rodar com 2 assuntos sem nenhum setup. Começar pelo e-mail 1 de cada trilha (maior volume).
- **Drop-off do quiz:** evento por pergunta (`quiz_pergunta` N) instrumentado nas páginas geradas — o funil de perguntas mostra ONDE o lead desiste.
- **Microsoft Clarity (grátis):** heatmap + gravação de sessão mostram ONDE a página perde antes de qualquer A/B. 1 script (ver Ferramentas); casa com a Aula de Dados (Bruno).

## Registro de testes (test log — obrigatório)

Todo teste entra num log no `cro.md`: data início/fim · elemento · A vs B · amostra por variante · resultado (taxa A vs B) · decisão (mantém/troca) · aprendizado em 1 linha. Sem log, o aluno re-testa o que já perdeu e esquece o que aprendeu. A skill atualiza o log a cada decisão.

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

**NUNCA:** otimizar sem medir (achismo) · inventar número de conversão ou benchmark como se fosse dado do funil · testar cor de botão/footer achando que move conversão · rodar A/B/C/D ao mesmo tempo · decidir com < 1.000 views únicos · escalar tráfego em funil com etapa furada · alterar/subir/rodar nada no seu funil sem sua aprovação.

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

## Fecho da Aula 2 (esta é a última peça — o fecho é especial)

O `/cro-funil` fecha o mapa de execução. Quando ele termina, NÃO aponte outra skill: aponte a LIÇÃO DE CASA. Após confirmar a entrega, **sempre** diga ao aluno em texto separado (mesmo padrão do fecho da Aula 01):

> 🎉 **Aula 02 concluída.** Você completou as 9 peças do funil.
>
> Seu projeto `projetos/{slug}/` agora tem o funil completo: oferta (offerbook), fundação de copy (copy.md), identidade (DESIGN.md), página, e-mails, conteúdo, back-end, recuperação e o plano de testes (cro.md). Tudo reunido no **Book do Funil** (`projetos/{slug}/index.html`) — abri ele pra você.
>
> **Agora, antes da Aula de Tráfego (Rafa): zere as pendências.** Abra o `pendencias.html` e responda o que está aberto — são essas respostas que deixam o funil PUBLICÁVEL (link de agendamento, integrações, decisões de oferta). Quem chega na Aula de Tráfego com pendência aberta compra tráfego pra funil que não fecha.
>
> **Enquanto isso:** grave os conteúdos (os roteiros produzem a prova) e rode o funil no orgânico pra chegar na Aula de Dados (Bruno) com números na planilha.

Não pule esse anúncio — fecha o trilho completo da Aula 02.

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).

**Ferramentas específicas desta skill:**
- **Microsoft Clarity (grátis)** — heatmap + gravação de sessão (o qualitativo do CRO). Setup: criar projeto em clarity.microsoft.com e colar o script no `<head>` (as páginas geradas saem com o snippet COMENTADO + `[PLUG: CLARITY_ID]`; é descomentar na Aula de Dados). **Fallback:** seguir só com o quantitativo (planilha); o teste A/B não depende dele.
