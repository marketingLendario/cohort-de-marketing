# GUIA COMANDOS — todas as skills do cohort, na ordem do funil (o índice completo)

> **Estou perdido em:** "todo mundo fala em `/isso` e `/aquilo` — não sei o que cada comando faz nem qual rodar agora".
> **O que você vai ter no final:** a lista COMPLETA das 38 skills que VOCÊ usa (+ os comandos internos de bastidor), na ordem em que você usa, cada uma em uma linha (o que faz) + o guia que detalha. É o seu mapa de comandos — deixe aberto do lado enquanto trabalha.
> **Fontes cruzadas:** o `SKILL.md` real de CADA uma das 38 skills em `.claude/skills/` (lido um a um em 23/07 — não de memória) · o `AGENTS.md` do projeto · os guias que detalham cada etapa.
> **Como invocar:** no **Claude Code** digite `/nome`; no **Codex** digite `@nome` (ou peça por extenso: "roda o comecar"). Não decore a lista — ache o comando pelo seu momento.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Claude Code (ou Codex) aberto NA raiz do projeto | [guia-instalar-claude-e-codex](guia-instalar-claude-e-codex.md) · [guia-terminal-e-pastas](guia-terminal-e-pastas.md) |
| 📖 Conhecimento | Saber que `/` é no Claude e `@` é no Codex, e como pedir | [guia-como-ser-guiado](guia-como-ser-guiado.md) |

## Comece sempre por estes 2 (o ambiente)

| Comando | O que faz | Guia |
|---|---|---|
| `/comecar` | O **primeiro comando do cohort**: prepara o ambiente do zero (terminal, `git pull`, chave do Apify, confere que as skills carregaram) e aponta o ÚNICO próximo passo. Deu erro ou "e agora?" → volte aqui. | [terminal](guia-terminal-e-pastas.md) · [como-ser-guiado](guia-como-ser-guiado.md) |
| `/status-funil` | Mostra o **estado do seu funil**: o que já está pronto, o que falta e onde você parou (lê `projetos/{slug}/`). O "onde estou?" que sempre responde. | — |

## Aula 1 — Pesquisa e Oferta

| Comando | O que faz | Guia |
|---|---|---|
| `/avatar-funil` | Pesquisa de mercado + **avatar em 7 dimensões** a partir da dor REAL do público (frases literais, com a fonte) + focus group sintético pra testar headline/ângulo. | — |
| `/espiao-do-concorrente` | **Dossiê completo** de um concorrente (ads pagos, orgânico, site, preços, reputação) — com as brechas: onde ele é fraco e o que não está dizendo. | [ad-library](../03-conexoes-e-apis/guia-ad-library.md) (o token opcional) |
| `/trend-hunting` | **Tendências emergentes** do nicho (formatos virais, timing antes da saturação) + variações de hook prontas pra testar. | [apify](../03-conexoes-e-apis/guia-apify.md) (a chave) |
| `/swipe-file` | Organiza os **criativos vencedores** capturados (do espião/trends) numa biblioteca categorizada e pesquisável. | — |
| `/offerbook` | Preenche o **Offerbook (Livro da Oferta)** — a fonte da verdade da oferta (ticket, mecanismo, promessa). Alimenta tudo depois. | — |

## Aula 2 — Mensagem, Funil e Página

**A fundação (rode estes 3 primeiro):**

| Comando | O que faz | Guia |
|---|---|---|
| `/design-md` | Gera o **`DESIGN.md`** — a identidade visual da marca (cores, fontes, tom). É de onde os criativos e páginas puxam o visual. | — |
| `/metodo-funil` | Diagnostica o **nível de consciência (1–5)** do seu público e **prescreve o funil/anúncio/página certos** + estrutura a oferta. **Rode quando não souber qual funil usar.** | — |
| `/copy-funil` | A **fundação da copy** (Big Idea, mecanismos, banco de hooks/headlines) → grava `copy.md`, a fonte de mensagem do projeto. | — |

**O tipo de funil (escolha 1 — o `/metodo-funil` te diz qual):**

| Comando | O que faz |
|---|---|
| `/quiz-funil` | Funil de **quiz/diagnóstico** que segmenta o lead e casa a oferta ao resultado (público nível 4). |
| `/webinario-funil` | Funil de **webinário/aula ao vivo** que vende, do registro ao fechamento (níveis 3–4). |
| `/vsl-funil` | Funil de **VSL Direct Response** (oferta → funil → escala → ticket). |
| `/advertorial-funil` | **Advertorial** — página editorial de pré-venda que aquece o público FRIO (nível 5). |
| `/lancamento-funil` | **Lançamento estilo PLF** (Jeff Walker) pra aquecer quem já tem lista/audiência (nível 5). |

**As peças do funil:**

| Comando | O que faz | Guia |
|---|---|---|
| `/pagina-vendas-funil` | Estrutura + copy da **página de vendas** de alta conversão, na sua identidade. | [publicar-pagina](../03-conexoes-e-apis/guia-publicar-pagina.md) (pra pôr no ar) |
| `/email-funil` | **E-mails do funil** (convite, confirmação, lembrete, nurture, venda) na sua identidade. | — |
| `/whatsapp-funil` | **Sequência de WhatsApp/DM** por momento (lembrete, carrinho abandonado, nutrição, re-engajamento). | — |
| `/conteudo-funil` | **Roteiros de Reels** orgânicos modelados num criador de referência, na sua voz (carrosséis PNG também). | [criativos](../04-operacao/guia-criativos.md) |
| `/criativos-funil` | Espiona ads e gera **criativos prontos**: roteiros de vídeo + **banners PNG** na identidade (feed/story/quadrado). | [criativos](../04-operacao/guia-criativos.md) |
| `/mockup-produto-funil` | Prompts prontos pra gerar **mockups** do produto/bônus (capa de ebook, box, área de membros) na sua identidade. | — |
| `/bonus-funil` | Gera os **ENTREGÁVEIS dos bônus** completos (ebook, workbook, checklist, template...) — não só a lista. | — |
| `/backend-funil` | Estrutura o **back-end** (upsell, OTO, order bump, downsell) — a parte onde mora o lucro. | — |
| `/recuperacao-funil` | **Sequência de recuperação** de quem chegou no checkout e não comprou (carrinho, cartão recusado, boleto). | — |
| `/cro-funil` | **Otimização de conversão** do funil já montado: KPIs por etapa + teste A/B da headline + quando escalar. | [como-ler-os-numeros](../05-metricas/guia-como-ler-os-numeros.md) |

## A ponte Aula 2 → 3

| Comando | O que faz | Guia |
|---|---|---|
| `/iniciar-trafego` | O **porteiro da Aula 3**: checa os pré-requisitos (artefatos A1–A2, página publicada, pixel, checkout), aponta o guia de cada item faltante e monta o **Painel da Semana** com a sua aprovação. Rode depois de fechar a Aula 2 e antes do `/zelador`. | as pontes: [pixel-capi](../03-conexoes-e-apis/guia-pixel-capi.md) · [hotmart](../03-conexoes-e-apis/guia-hotmart.md) · [produto-e-checkout](../03-conexoes-e-apis/guia-produto-e-checkout.md) |

## Aula 3 — Tráfego

| Comando | O que faz | Guia |
|---|---|---|
| `/zelador` | Checa a **saúde da conta e do tracking** (pixel, CAPI, deduplicação, BM, pagamento) antes de qualquer campanha subir. **Bloqueante** — CRÍTICO trava o estruturador. | [pixel-capi](../03-conexoes-e-apis/guia-pixel-capi.md) · [campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) |
| `/briefista` | Gera a **bateria de criativos/copy** a partir dos ângulos validados (com nível de consciência), pra VOCÊ curar 2–3 finalistas. | [criativos](../04-operacao/guia-criativos.md) |
| `/estruturador` | Monta a campanha no **default sagrado** e, com `.env`, publica em **3 gates** (aprovar → criar PAUSADO → ativar). Sem `.env`, entrega a config campo a campo. | [campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) |
| `/ads-creative-factory` | Motor de **criativos por IA** (arquétipos, gate de marca, melhor-de-N) — **precisa de Codex logado** (assinatura ChatGPT). Opcional. | [criativos](../04-operacao/guia-criativos.md) |
| `/leitor-de-metricas` | Lê as métricas da campanha com selo **Real/Estimado** — nunca inventa dado ausente ("não fornecido" ≠ zero). | [e-depois](../04-operacao/guia-e-depois.md) · [como-ler-os-numeros](../05-metricas/guia-como-ler-os-numeros.md) |
| `/diagnosticador` | Aponta **UMA alavanca por vez** (hipótese + critério de sucesso + critério de reversão) a partir da leitura. Você decide se acata. | [e-depois](../04-operacao/guia-e-depois.md) |

## Aula 4 — Central de Dados (o Squad de Dados)

| Comando | O que faz | Guia |
|---|---|---|
| `/analista-de-dados` | A **porta de entrada da Aula 4**: orquestra a Central de ponta a ponta na ordem certa. Não sabe por qual começar? É por aqui. | [central-de-dados](../05-metricas/guia-central-de-dados.md) |
| `/coletor-de-dados` | Etapa 1 — **coleta os dados brutos** (Meta Graph API + Hotmart, sem dado pessoal). Sem chaves cai no Modo Exemplo. | [o-que-e-coletado](../05-metricas/guia-o-que-e-coletado.md) |
| `/board-de-especialistas` | Etapa 2 — **6 clones de especialistas** leem os números e entregam veredito + alavanca + evidência com selo. | — |
| `/painel-de-dados` | Etapa 3 — **gera o `painel-trafego.html`** (7 telas, abre offline, na identidade da marca) + PDF. | [o-que-e-coletado](../05-metricas/guia-o-que-e-coletado.md) |
| `/retroalimentacao` | Etapa 4 — **devolve o aprendizado dos dados** pro avatar (Aula 1) e pra copy (Aula 2). Fecha o loop. | [central-de-dados](../05-metricas/guia-central-de-dados.md) |
| `/gestor-de-campanhas` | Etapa 5 — compara o **realizado × planejado** (7/30 dias) e retroalimenta avatar/oferta/copy. | [e-depois](../04-operacao/guia-e-depois.md) |

## Comandos internos (existem, mas você NÃO digita)

Alguns comandos são "trabalhadores de bastidor" chamados por OUTRA skill — aparecem na lista técnica do projeto, mas não fazem parte da sua jornada:

| Comando | O que é | Quem chama |
|---|---|---|
| `iniciar-studio` | worker do lifecycle do Marketing Studio (baixa/prepara o app, Docker, etc.) | é acionado pelo `/iniciar-trafego` — você nunca precisa digitar |

Se você rodar um destes sem querer, sem problema: ele só faz sentido dentro do fluxo que o chama. Na dúvida, volte pro `/status-funil`.

## Teste de sucesso

Pense no que você quer fazer AGORA → ache o comando na tabela da sua aula em menos de 30 segundos → e rode `/status-funil`: se ele apontar uma próxima peça que bate com a tabela, você já sabe navegar o arsenal inteiro.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| CO1 | Digito `/` e as skills **não aparecem** na lista | a IA foi aberta fora da raiz do projeto | feche → abra o terminal NA pasta `cohort-de-marketing` → reabra ([guia-terminal](guia-terminal-e-pastas.md), W2) |
| CO2 | Digitei `/comando` e **não aconteceu nada** | você está no **Codex** — lá é `@comando`, não `/` | use `@nome` (ou peça por extenso: "roda o X") — [guia-codex](guia-codex.md) |
| CO3 | A skill **recusou** pedindo um artefato/pré-requisito | falta a peça da etapa anterior (garbage in, garbage out) | rode `/status-funil` pra ver o que falta, ou a skill que gera a peça faltante — a recusa diz qual |
| CO4 | Não sei **qual funil** usar (quiz? vsl? webinário?) | é uma decisão de método, não sua na marra | rode `/metodo-funil`: ele diagnostica o nível de consciência e prescreve o funil certo |
| CO5 | A lista de comandos da minha versão tem **menos** skills | projeto desatualizado | `git pull` ([guia-atualizar-projeto](guia-atualizar-projeto.md)) e reabra a IA |
| CO6 | Tem um comando que **não está** nesta lista | skill nova entrou depois desta versão | `git pull`; se persistir, me avise no PS pra entrar aqui |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/status-funil` — ele cruza esta lista com o SEU projeto e diz o próximo comando exato |
| 📖 Ler | não sabe o que cada TERMO significa? [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) · não sabe PEDIR? [guia-como-ser-guiado](guia-como-ser-guiado.md) |
| 🚑 Se travar | o catálogo CO1–CO6 acima (skills não aparecem, `/` vs `@`, skill recusou, qual funil...) |
