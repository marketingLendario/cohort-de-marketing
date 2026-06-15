/* =============================================================================
   Pesquisa, Concorrentes e Ofertas com IA — dados dos slides
   Voz: Academia Lendária. Conteúdo verbatim do brief.
   Acentos <em> = palavra serif itálica em ouro (assinatura do DS).
   ============================================================================= */
window.SLIDES = [

/* ====================== PARTE 1 — ABERTURA ====================== */
{ id:"1.1", type:"cover", label:"Capa",
  kicker:"Aula ao vivo · 4 horas",
  h1:"Pesquisa, Concorrentes e Ofertas com <em>IA</em>",
  lead:"O jogo que se ganha antes do anúncio.",
  note:"Energia alta sem ansiedade. Pausa 2s. Olha câmera." },

{ id:"1.2", type:"tese", label:"Tese-mãe",
  phrase:"<em>Pesquisa</em> antes da oferta.",
  note:"Lê devagar. A tese-mãe." },

{ id:"1.3", type:"statement", label:"Vende vs queima",
  lines:[
    { html:"Quem vende milhões com IA faz pesquisa <em>antes</em> da oferta." },
    { html:"Quem queima verba tenta oferta primeiro, pesquisa depois.", muted:true }
  ],
  closing:"A diferença não é orçamento. É <strong>ordem</strong>.",
  note:"Pausa entre as duas linhas." },

{ id:"1.4", type:"standard", label:"Você está aqui",
  title:"Você está <em>aqui</em>",
  list:{ ordered:false, items:[
    { html:"Já criou oferta que não vendeu como esperado, mesmo com produto bom." },
    { html:"Ou começa do zero, ideia na cabeça, dúvida se vale anunciar." },
    { html:"Os dois lugares são <strong>normais</strong>." },
    { html:"O que não é normal: gastar mídia antes de saber o que a oferta resolve." }
  ]},
  note:"Position. Reconhece os dois pontos de partida." },

{ id:"1.5", type:"two-cards", label:"O caso da Alan",
  eyebrow:"Caso real", title:"O caso da <em>Alan</em>",
  cards:[
    { label:"Quando inverteu a ordem", big:"R$ 300 mil",
      body:"investidos em design de produto antes de validar a dor.",
      foot:"Resultado: estoque parado." },
    { label:"Quando seguiu a ordem", big:"Meio milhão", accent:true,
      body:"de reais em vendas em um único dia de e-commerce.",
      foot:"Mesma pessoa. Ordem diferente." }
  ],
  note:"Caso concreto. Timestamps 00:30:42 e 00:50:00." },

{ id:"1.6", type:"table", label:"Mapa dos 4 blocos",
  title:"O mapa dos <em>4 blocos</em>",
  head:["Bloco","Tese","Saída"], firstColMono:true,
  rows:[
    ["01","Vácuo + dor real vivem em lugares públicos","Frase do cliente"],
    ["02","Persona sintética testa mensagem a custo zero","Headline testada"],
    ["03","Concorrente em 4 vetores em 15 minutos","Brecha competitiva"],
    ["04","Empilhamento faz o preço sumir","Oferta completa"]
  ],
  note:"Tabela. Cada bloco entrega algo concreto." },

{ id:"1.7", type:"table", label:"Cronograma",
  title:"Cronograma",
  head:["Tempo","Bloco","Energia"], firstColMono:true, energyCol:2,
  rows:[
    ["00:00 — 00:15","Abertura",{tag:"alta"}],
    ["00:15 — 01:05","Bloco 1 · Vácuo + Diagnóstico",{tag:"alta"}],
    ["01:05 — 01:15","Intervalo",{tag:"pausa"}],
    ["01:15 — 02:05","Bloco 2 · Focus Group Sintético",{tag:"alta"}],
    ["02:05 — 02:15","Intervalo",{tag:"pausa"}],
    ["02:15 — 03:05","Bloco 3 · Concorrentes",{tag:"media"}],
    ["03:05 — 03:55","Bloco 4 · Grand Slam Offer",{tag:"alta"}],
    ["03:55 — 04:00","Fechamento",{tag:"alta"}]
  ],
  note:"4 horas. 2 intervalos planejados." },

{ id:"1.8", type:"standard", label:"Acordo de presença",
  title:"Acordo de <em>presença</em>",
  list:{ ordered:true, items:[
    { t:"Computador aberto", d:"não é opcional. Cada bloco tem demo e exercício." },
    { t:"Anote só \u201cPara o quadro\u201d", d:"2 a 3 frases por bloco. Não o conteúdo inteiro." },
    { t:"Perguntas no Q&A", d:"cada bloco fecha com 5 minutos. Guarde para o momento." }
  ]},
  note:"Reforça os 3 combinados. Pergunta confirmação visual." },

{ id:"1.9", type:"tese", label:"IA é meio",
  phrase:"Você não vende IA.<br><em>Vende solução.</em>",
  sub:"IA é meio. Como eletricidade. Ninguém compra eletricidade, compra geladeira.",
  note:"Alan timestamp 00:11:50. Pausa antes do \u201cVende solução\u201d." },

{ id:"1.10", type:"tese", label:"A fórmula",
  eyebrow:"A fórmula",
  phrase:"<em>Dor cara</em> + solução simples + pitch específico = <em>contrato fechado</em>",
  small:true,
  note:"A fórmula. Aponta cada termo." },

{ id:"1.11", type:"quadro", label:"Para o quadro · abertura",
  title:"Para o quadro · <em>abertura</em>",
  items:[
    { label:"A tese-mãe", phrase:"Pesquisa antes da oferta. O jogo se ganha antes do anúncio." },
    { label:"A ordem", phrase:"Dor cara + solução simples + pitch específico = contrato fechado." },
    { label:"Sobre IA", phrase:"Você não vende IA. Vende solução." }
  ],
  note:"Lê devagar. Eles anotam." },

/* ====================== PARTE 2 — BLOCO 1 ====================== */
{ id:"2.1", type:"block-cover", label:"Bloco 1", numeral:"1",
  kicker:"Bloco 1 · 00:15 — 01:05 · 50 minutos",
  h1:"Vácuo e Diagnóstico de <em>Dor</em>",
  lead:"Onde a dor real mora — e não é na sua cabeça.",
  note:"Transição: \u201cagora a gente vai aprender onde a dor real mora\u201d." },

{ id:"2.2", type:"tese", label:"Tese do bloco",
  phrase:"A dor cara <em>já sangra no caixa</em> antes da IA entrar.",
  citation:"Alan Nicolas, 2026-06-08 · 00:21:50",
  note:"Quote literal Alan timestamp 00:21:50." },

{ id:"2.3", type:"micro", label:"Microestrutura",
  title:"Microestrutura",
  segments:[
    { time:"0 — 15 min", name:"Teoria", flex:15 },
    { time:"15 — 35 min", name:"Demo", flex:20 },
    { time:"35 — 45 min", name:"Exercício", flex:10 },
    { time:"45 — 50 min", name:"Quiz", flex:5 }
  ],
  closing:"4 critérios → demo Claude → você minera 1 nicho → quiz oral." },

{ id:"2.4", type:"standard", label:"4 critérios da dor cara",
  title:"Os 4 critérios da <em>dor cara</em>",
  list:{ ordered:true, items:[
    { t:"Frequência alta", d:"acontece toda semana, todo mês." },
    { t:"Custo visível", d:"quantificável em reais ou em tempo." },
    { t:"Quem sente controla o orçamento", d:"não adianta dor onde quem decide não sente." },
    { t:"Palavras literais do cliente", d:"não é como você descreve, é como ele descreve." }
  ]} },

{ id:"2.5", type:"quote", label:"Critério 2 · custo visível",
  eyebrow:"Critério 2", title:"Custo <em>visível</em>",
  quote:"Uma franquia gastando <em>R$ 20 mil por semana</em> só para enviar documentação.",
  citation:"Alan Nicolas, 2026-06-08 · 00:24:11",
  closing:"R$ 20 mil é número. Número convence. Dor sem número é hipótese." },

{ id:"2.6", type:"statement", label:"O problema da sua cabeça",
  eyebrow:"O problema da sua cabeça",
  lines:[
    { html:"Dor real <strong>não é o que ele te conta no almoço.</strong>", muted:true },
    { html:"É <em>o que ele escreve</em> quando ninguém está olhando." }
  ],
  note:"Pausa entre as duas frases." },

{ id:"2.7", type:"cards", label:"Triangulação", cols:3,
  eyebrow:"Protocolo", title:"O protocolo de <em>triangulação</em>",
  items:[
    { label:"Reviews", body:"Reclame Aqui, B2B Stack, Capterra. Cliente bravo depois de comprar." },
    { label:"Comunidades", body:"Reddit, Facebook, Discord. Conversa entre pares." },
    { label:"Redes sociais", body:"Twitter, LinkedIn, TikTok. Desabafo público." }
  ],
  closing:"1 fonte mente. 2 sugerem. <strong>3 confirmam.</strong>" },

{ id:"2.8", type:"standard", label:"Demo ao vivo",
  eyebrow:"Demo ao vivo · Claude", title:"Minerar dor de um <em>nicho real</em>",
  intro:"Vamos minerar dor real do nicho <strong>escritórios de contabilidade brasileiros</strong>.",
  list:{ ordered:true, items:[
    { html:"Extrair temas recorrentes (50 reviews)." },
    { html:"Cruzar com comunidades (30 mensagens)." },
    { html:"Extrair a frase-mestre (1 frase de cliente)." }
  ]},
  footer:"Pode acompanhar. Os prompts vêm a seguir." },

{ id:"2.9", type:"mono", label:"Prompt 1",
  promptLabel:"Prompt 1 · Claude",
  code:`Você é um analista de mercado especializado em mineração de dor.
Vou colar abaixo trechos de reviews públicos de softwares usados
por escritórios de contabilidade no Brasil. Sua tarefa:

1. Identifique os 5 temas de dor mais recorrentes nos reviews
2. Para cada tema, extraia 3 citações VERBATIM (palavras literais
   do cliente, sem reescrita)
3. Para cada tema, estime o custo visível (em horas perdidas ou
   em reais) quando o cliente mencionar
4. Classifique cada tema por frequência (alta, média, baixa)

Formato de saída: tabela com colunas Tema, Citações verbatim,
Custo visível, Frequência.

[colar aqui de 20 a 50 reviews]`,
  footer:"Material completo no envio pós-aula.",
  note:"\u201cRepare que estou pedindo VERBATIM. Sem isso o modelo parafraseia.\u201d" },

{ id:"2.10", type:"mono", label:"Prompt 2",
  promptLabel:"Prompt 2 · Claude",
  code:`Agora vou colar trechos de discussões em grupos de Facebook e
Reddit onde contadores discutem essas dores entre si (sem estar
avaliando produto, só conversando). Sua tarefa:

1. Para cada um dos 5 temas que você identificou no prompt anterior,
   marque quais aparecem também nessas discussões
2. Identifique 2 temas NOVOS que aparecem em comunidade mas não
   apareceram em review (isso indica dor que ninguém vende
   solução ainda)
3. Para cada tema novo, extraia 2 citações verbatim

[colar aqui de 10 a 30 mensagens de comunidade]`,
  note:"O que está em comunidade sem review é VÁCUO." },

{ id:"2.11", type:"mono", label:"Prompt 3",
  promptLabel:"Prompt 3 · Claude",
  code:`Com base nos dois prompts anteriores, escolha A DOR mais frequente,
mais cara, e que aparece com palavras consistentes em todas as
fontes. Para essa dor, me devolva:

1. A frase exata como o cliente escreve (verbatim, na 1ª pessoa)
2. O custo médio em reais ou horas
3. A frequência (quantas vezes por mês)
4. Quem na empresa controla o orçamento para resolver essa dor
5. Se essa dor passa nos 4 critérios da dor cara: frequência alta,
   custo visível, controle de orçamento, palavras literais`,
  note:"A saída deste prompt é o INSUMO do Bloco 2." },

{ id:"2.12", type:"standard", label:"Material Codex / GPT",
  eyebrow:"Material complementar", title:"Material para <em>Codex / GPT</em>",
  intro:"Mesmos prompts adaptados para ChatGPT.",
  subItalic:"Vai no envio pós-aula com as diferenças marcadas.",
  cta:"Baixar prompts paralelos" },

{ id:"2.13", type:"two-cards", label:"Exercício",
  eyebrow:"Exercício · 10 minutos", title:"Mineração em <em>dois níveis</em>",
  cards:[
    { label:"Nível iniciante", body:"Escolha seu nicho. Cole 5 reviews no Claude. Receba a tabela com 3 temas + 2 citações por tema." },
    { label:"Nível intermediário", accent:true, body:"Rode os 3 prompts em sequência. Saia com a frase-mestre que passa nos 4 critérios da dor cara." }
  ],
  footer:"Critério: a frase lida em voz alta soa como cliente bravo, não como descrição corporativa." },

{ id:"2.14", type:"quadro", label:"Para o quadro · Bloco 1",
  title:"Para o quadro · <em>Bloco 1</em>",
  items:[
    { label:"A dor cara", phrase:"Sangra no caixa antes da IA entrar." },
    { label:"Triangulação", phrase:"Reviews + comunidades + redes." },
    { label:"Verbatim", phrase:"Dor real é o que ele escreve quando ninguém olha." }
  ]},

{ id:"2.15", type:"interval", label:"Intervalo", tone:"warning",
  kicker:"Intervalo", big:"10 minutos",
  lead:"Guarda a frase do cliente. Você vai usar no Bloco 2." },

/* ====================== PARTE 3 — BLOCO 2 ====================== */
{ id:"3.1", type:"block-cover", label:"Bloco 2", numeral:"2",
  kicker:"Bloco 2 · 01:15 — 02:05 · 50 minutos",
  h1:"Focus Group <em>Sintético</em>",
  lead:"Testar mensagem com custo zero antes da mídia paga." },

{ id:"3.2", type:"tese", label:"Tese · hiperpersonalização",
  phrase:"A era da IA é a era da <em>hiperpersonalização</em>.",
  citation:"Alan Nicolas, 2026-06-08 · 00:58:55" },

{ id:"3.3", type:"table", label:"Tradicional vs Sintético",
  title:"Por que focus group <em>sintético</em>",
  head:["","Tradicional","Sintético"], emphCol:2,
  rows:[
    ["Custo","Milhares","Zero"],
    ["Tempo","Semanas","10 minutos"],
    ["Iterações","1 a 2","5+ por hora"],
    ["Insumo","Cliente real","Frase do Bloco 1"]
  ] },

{ id:"3.4", type:"standard", label:"7 dimensões da persona",
  title:"As 7 dimensões da <em>persona</em>",
  list:{ ordered:true, items:[
    { t:"Demografia", d:"idade, profissão, renda." },
    { t:"Psicografia", d:"3 valores, 3 medos, 3 ambições." },
    { t:"Comportamento atual", d:"o que faz hoje sobre a dor." },
    { t:"Voz e vocabulário", d:"5 frases que usa, 3 que NÃO usa." },
    { t:"Objeções típicas", d:"3 contra-argumentos." },
    { t:"Contexto de leitura", d:"onde, quando, estado emocional." },
    { t:"Padrão de decisão", d:"rápido ou lento, sozinho ou em grupo." }
  ]} },

{ id:"3.5", type:"tese", label:"Caricatura vs interlocutor",
  phrase:"Persona com 1 dimensão é <em>caricatura</em>.<br>Persona com 7 dimensões é <em>interlocutor</em>." },

{ id:"3.6", type:"cards", label:"3 perfis decisórios", cols:3,
  eyebrow:"Por que 3 personas, não 1", title:"Três perfis <em>decisórios</em>",
  items:[
    { label:"Decisor racional", body:"Quer ROI claro, número, prova." },
    { label:"Decisor emocional", body:"Quer segurança, identidade, pertencimento." },
    { label:"Decisor pragmático", body:"Quer simplicidade, rapidez, sem fricção." }
  ],
  closing:"Headline campeã ressoa em <strong>2 dos 3 sem ofender o terceiro</strong>." },

{ id:"3.7", type:"cards", label:"O ciclo", cols:4, numbered:true,
  eyebrow:"O ciclo", title:"Quatro passos, <em>dez minutos</em>",
  items:[
    { label:"Frase", body:"Do Bloco 1." },
    { label:"Personas", body:"3 × 7 dimensões." },
    { label:"Teste", body:"1 headline." },
    { label:"Decide", body:"2+ ressoam = mídia." }
  ],
  closing:"10 minutos no Claude. <strong>5 versões de headline em 1 hora.</strong>" },

{ id:"3.8", type:"mono", label:"Prompt 1",
  promptLabel:"Prompt 1 · criar 3 personas",
  code:`Você é um pesquisador comportamental especializado em criar
personas sintéticas profundas. Vou te dar uma frase verbatim de
cliente do nicho de escritórios de contabilidade brasileiros.

Sua tarefa: criar 3 personas distintas que poderiam ter dito essa
frase, cada uma representando um perfil decisório diferente:
decisor racional, decisor emocional, decisor pragmático.

Frase verbatim: "Perdi três clientes esse mês porque a equipe
demorou mais de duas horas para responder. O sócio está me
cobrando na reunião de sexta."

Para cada persona, preencha as 7 dimensões:
1. Demografia (nome, idade, cargo, faturamento, cidade)
2. Psicografia (3 valores, 3 medos, 3 ambições)
3. Comportamento atual
4. Voz e vocabulário (5 expressões que usa, 3 que NÃO usa)
5. Objeções típicas (3 contra-argumentos)
6. Contexto de leitura
7. Padrão de decisão

Formato: tabela 3 colunas × 7 linhas.` },

{ id:"3.9", type:"mono", label:"Prompt 2",
  promptLabel:"Prompt 2 · testar headline contra 3 personas",
  code:`Agora você vai assumir o papel de cada uma das 3 personas, uma
por vez, e reagir a esta headline candidata como se ela aparecesse
no LinkedIn ou Google Ads para você:

Headline: "Reduza em 80% o tempo de resposta do seu escritório
sem contratar mais ninguém"

Para cada uma das 3 personas:
1. Reação imediata em 1 frase (voz da persona, 1ª pessoa)
2. O que chamou atenção (positivo)
3. O que gerou objeção ou desconfiança
4. Probabilidade de clicar de 0 a 10
5. O que precisaria mudar para subir essa nota em 3 pontos

Síntese final: a headline ressoou em quantas das 3? Qual versão
refinada você recomenda testar a seguir?` },

{ id:"3.10", type:"standard", label:"Material Codex / GPT",
  eyebrow:"Material complementar", title:"Material para <em>Codex / GPT</em>",
  intro:"Mesma intenção, sintaxe adaptada para ChatGPT.",
  alert:"Diferença: o GPT precisa de reforço explícito de \u201c1ª pessoa\u201d para entrar no papel da persona.",
  cta:"Baixar prompts paralelos" },

{ id:"3.11", type:"two-cards", label:"Exercício",
  eyebrow:"Exercício · 10 minutos", title:"Personas em <em>dois níveis</em>",
  cards:[
    { label:"Iniciante", body:"Pegue sua frase do Bloco 1. Rode o prompt 1 simplificado. Receba 3 personas com demografia + 3 valores + 3 medos." },
    { label:"Intermediário", accent:true, body:"3 personas completas (7 dimensões). Escreva sua headline candidata. Rode o teste. Refine." }
  ],
  footer:"Critério: headline ressoa em pelo menos 2 das 3 personas (nota ≥ 7)." },

{ id:"3.12", type:"quadro", label:"Para o quadro · Bloco 2",
  title:"Para o quadro · <em>Bloco 2</em>",
  items:[
    { label:"Persona profunda", phrase:"7 dimensões. Menos é caricatura." },
    { label:"3 personas, 1 headline", phrase:"Se ressoar em 2 sem ofender a 3ª, vai para mídia." },
    { label:"Economia", phrase:"Custo zero. Tempo: 10 minutos." }
  ]},

{ id:"3.13", type:"interval", label:"Intervalo", tone:"warning",
  kicker:"Intervalo", big:"10 minutos",
  lead:"Próximo: ver o concorrente do alto." },

/* ====================== PARTE 4 — BLOCO 3 ====================== */
{ id:"4.1", type:"block-cover", label:"Bloco 3", numeral:"3",
  kicker:"Bloco 3 · 02:15 — 03:05 · 50 minutos",
  h1:"Concorrentes em <em>4 Vetores</em>",
  lead:"Dossiê em 15 minutos. Brecha em 5.",
  note:"Energia da turma costuma cair aqui. Voz mais firme." },

{ id:"4.2", type:"tese", label:"Tese · brecha",
  phrase:"Concorrente bem analisado mostra <em>brecha</em>.<br>Análise sem brecha é tempo perdido." },

{ id:"4.3", type:"cards", label:"Os 4 vetores", cols:2, numbered:true,
  eyebrow:"O dossiê", title:"Os 4 <em>vetores</em>",
  items:[
    { label:"Posicionamento", body:"Como ele se vende. A identidade que projeta." },
    { label:"Preço", body:"Quanto cobra e como apresenta. Estrutura, não só número." },
    { label:"Promessa (USP)", body:"O que entrega, em quanto, em qual prazo. Específica ou genérica." },
    { label:"Ângulos (história)", body:"Por que existe. A história empacota tudo." }
  ] },

{ id:"4.4", type:"quote", label:"Médico do estômago",
  eyebrow:"Caso real", title:"O caso do <em>médico do estômago</em>",
  quote:"Sou médico especializado no estômago. Criei um <em>método de 30 segundos</em> onde pessoas que sentem queimação na parte superior do estômago resolvem de forma simples.",
  citation:"Alan Nicolas, 2026-06-08 · 00:55:59",
  compare:[
    { label:"Promessa específica", accent:true, text:"\u201cmétodo de 30 segundos\u201d + tipo de pessoa + resultado nomeado." },
    { label:"Promessa genérica", text:"\u201cCuidamos do seu estômago.\u201d" }
  ] },

{ id:"4.5", type:"standard", label:"A brecha competitiva",
  title:"A brecha <em>competitiva</em>",
  intro:"Brecha é o vetor onde <strong>nenhum concorrente é forte</strong>.",
  body:["Você não precisa ser o melhor em tudo. Precisa ser <strong>o único forte em UM vetor</strong> onde todos os outros são medianos."] },

{ id:"4.6", type:"table", label:"Brecha de ângulo",
  title:"Brecha de ângulo é a mais <em>defensável</em>",
  head:["Vetor","Defesa contra cópia"], emphRows:[3],
  rows:[
    ["Preço","Fácil de copiar (30 dias)"],
    ["Promessa","Médio"],
    ["Posicionamento","Médio-alto"],
    ["Ângulo (história)","Difícil. História não se copia."]
  ],
  closing:"Quem chega primeiro com história autêntica ganha posição que dura anos." },

{ id:"4.7", type:"two-cards", label:"Antes vs depois da IA",
  eyebrow:"Velocidade", title:"Antes vs depois da <em>IA</em>",
  cards:[
    { label:"Antes", body:"Ler site, baixar PDF, falar com ex-clientes.", foot:"Semanas." },
    { label:"Depois", accent:true, body:"5 min coletando + 8 min Claude + 2 min refino.", foot:"15 minutos." }
  ],
  footer:"4 concorrentes em 1 hora. Antes: 1 concorrente em 1 mês." },

{ id:"4.8", type:"mono", label:"Prompt 1",
  promptLabel:"Prompt 1 · posicionamento e promessa",
  code:`Você é um analista competitivo sênior. Vou colar abaixo material
público de um concorrente. Sua tarefa:

1. Posicionamento: em 1 frase, como o concorrente se vende.
   Não use as palavras dele. Use sua interpretação
   ("ele se posiciona como ___ para ___").
2. Promessa (USP): qual é a promessa principal, em 1 frase.
   Marcar como específica ou genérica e explicar por quê.
3. Para quem ele NÃO serve: 2 perfis que ele explicitamente
   ou implicitamente exclui.

Material coletado:
[colar 200 a 500 palavras do site, página inicial, sobre nós,
página de planos]` },

{ id:"4.9", type:"mono", label:"Prompt 2",
  promptLabel:"Prompt 2 · preço e ancoragem",
  code:`Agora vou colar a estrutura de preços do mesmo concorrente.
Sua tarefa:

1. Tabela de preços com colunas: Plano, Valor mensal, Valor anual,
   O que inclui em 1 linha
2. Estratégia de ancoragem: como ele guia o cliente a escolher
   o plano caro (riscado, comparativo, escassez, bônus).
   Marcar técnica usada.
3. Diferencial competitivo no preço: mais caro, igual ou mais
   barato que a média? Como ele justifica?
4. Modelo de cobrança: mensalidade, anual, one-shot, performance.
   Qual e por quê.

Material:
[colar página de planos, política de upgrade, cancelamento]` },

{ id:"4.10", type:"mono", label:"Prompt 3",
  promptLabel:"Prompt 3 · ângulo e mapa final",
  code:`1. Ângulo (história): qual história o concorrente conta sobre
   por que existe. Em 2 frases.
2. Ressonância emocional: a história ressoa em qual perfil
   decisório (racional, emocional, pragmático)? Por quê?
3. Mapa final dos 4 vetores: para cada vetor (posicionamento,
   preço, promessa, ângulo), marque a força do concorrente como
   Forte, Médio ou Fraco, e justifique em 1 frase.
4. Sugestão de brecha: qual vetor é o mais fraco e poderia virar
   seu campo de batalha?

Material:
[colar 10 posts, 5 depoimentos, página Sobre]` },

{ id:"4.11", type:"standard", label:"Material Codex / GPT",
  eyebrow:"Material complementar", title:"Material para <em>Codex / GPT</em>",
  alert:"Diferença: GPT tende a ser cauteloso em julgar \u201cfraco\u201d. Reforce no prompt: \u201cseja direto, marque Fraco quando justificável, não tenha medo de tomar posição\u201d.",
  cta:"Baixar prompts paralelos" },

{ id:"4.12", type:"two-cards", label:"Exercício",
  eyebrow:"Exercício · 10 minutos", title:"Dossiê em <em>dois níveis</em>",
  cards:[
    { label:"Iniciante", body:"1 concorrente seu, prompt 1 com material do site dele. Receba posicionamento + promessa + exclusões." },
    { label:"Intermediário", accent:true, body:"3 prompts em sequência para 2 concorrentes. Compare os 4 vetores lado a lado. Aponte a brecha defensável." }
  ] },

{ id:"4.13", type:"quadro", label:"Para o quadro · Bloco 3",
  title:"Para o quadro · <em>Bloco 3</em>",
  items:[
    { label:"4 vetores", phrase:"Posicionamento, preço, promessa, ângulo." },
    { label:"Brecha real", phrase:"Onde TODOS são fracos." },
    { label:"Defesa", phrase:"Ângulo é difícil de copiar. Preço é fácil." }
  ]},

{ id:"4.14", type:"interval", label:"Sem intervalo", tone:"gold",
  big:"Sem intervalo",
  lead:"O próximo bloco depende deste fresco. <strong>Bora direto.</strong>" },

/* ====================== PARTE 5 — BLOCO 4 ====================== */
{ id:"5.1", type:"block-cover", label:"Bloco 4", numeral:"4",
  kicker:"Bloco 4 · 03:05 — 03:55 · 50 minutos",
  h1:"Grand Slam Offer com <em>IA</em>",
  lead:"Empilhar valor até o preço sumir.",
  note:"Bloco onde tudo se junta. Energia ALTA." },

{ id:"5.2", type:"tese", label:"Tese · preço sem valor",
  phrase:"<em>Preço sem valor</em> é ruído.",
  citation:"Alan Nicolas, 2026-06-08 · 01:15:16" },

{ id:"5.3", type:"tese", label:"Entrego 10x",
  phrase:"Eu não cobro <em>dez vezes mais</em>.<br>Eu entrego <em>dez vezes mais</em>.",
  note:"Regra 10x na voz da Alan." },

{ id:"5.4", type:"table", label:"Inversão pedagógica",
  title:"A inversão <em>pedagógica</em>",
  head:["Pergunta errada","Pergunta certa"], emphCol:1,
  rows:[
    ["Quanto cobrar?","Quanto isso vai gerar para o cliente?"],
    ["","Divide por 10. Esse é o seu preço."]
  ],
  closing:"Você não chuta preço. Você calcula valor e divide." },

{ id:"5.5", type:"two-cards", label:"Casos com números",
  eyebrow:"Casos com números", title:"Mesmo trabalho, <em>preço diferente</em>",
  cards:[
    { label:"Caso 1 · regra 10x", big:"1 : 10",
      body:"Cliente economiza R$ 200 mil. Ele cobra R$ 22 mil." },
    { label:"Caso 2 · empacotamento", big:"6 — 9×", accent:true,
      body:"Projeto cotado em R$ 20 mil virou R$ 120 a 180 mil pela apresentação da oferta." }
  ],
  footer:"Mesmo trabalho. Empacotamento diferente. Preço 6 a 9× maior." },

{ id:"5.6", type:"standard", label:"Por que a regra 10x funciona",
  title:"Por que a regra <em>10x</em> funciona",
  list:{ ordered:true, items:[
    { t:"Margem para entregar bem", d:"oxigênio para entregar com sobra." },
    { t:"Posição na mente do cliente", d:"gerador de valor, não custo." },
    { t:"Filtro de cliente", d:"quem entende compra; quem não entende não é seu cliente." }
  ]} },

{ id:"5.7", type:"cards", label:"4 componentes", cols:2, numbered:true,
  eyebrow:"O empilhamento", title:"Os 4 componentes do <em>empilhamento</em>",
  items:[
    { label:"Promessa específica", body:"O que entrega, em quanto, em qual prazo. Quantificada." },
    { label:"Garantia", body:"Quem assume risco vende mais. Tira a desculpa do \u201ce se não funcionar\u201d." },
    { label:"Ancoragem", body:"Preço comparado a uma baseline maior. Custo do problema, alternativas, horas do cliente." },
    { label:"Nome", body:"Diz para quem é, sugere resultado, memorizável." }
  ] },

{ id:"5.8", type:"two-cards", label:"Específica vs genérica",
  eyebrow:"Promessa", title:"Específica vs <em>genérica</em>",
  cards:[
    { label:"Genérica · morre", muted:true, body:"\u201cAjudamos empresas a crescer.\u201d" },
    { label:"Específica · arma", accent:true, body:"\u201cDobramos sua taxa de resposta em 60 dias ou devolvemos.\u201d" }
  ],
  footer:"Quantificação + prazo + cláusula \u201cou\u201d. Sem essas 3, é só propaganda." },

{ id:"5.9", type:"standard", label:"Ancoragem · 3 caminhos",
  title:"Ancoragem · <em>3 caminhos</em>",
  list:{ ordered:true, items:[
    { t:"Custo do problema", d:"quanto o cliente perde por mês sem resolver." },
    { t:"Alternativa mais cara", d:"consultoria tradicional, contratação de funcionário." },
    { t:"Tempo equivalente", d:"horas do cliente valoradas em R$ por hora." }
  ]},
  closing:"Sem ancoragem, ele compara com a expectativa interna dele. Com ancoragem, ele compara com <strong>o que você definiu</strong>." },

{ id:"5.10", type:"tese", label:"Nome",
  phrase:"Nome ruim mata <em>oferta boa</em>.<br>Nome bom vende <em>oferta mediana</em>." },

{ id:"5.11", type:"standard", label:"Critérios de nome bom",
  title:"Critérios de <em>nome bom</em>",
  list:{ ordered:true, items:[
    { html:"Diz para quem é em 1 a 2 palavras." },
    { html:"Sugere o resultado, não o método." },
    { html:"Memorizável em uma leitura." },
    { html:"Funciona como assunto de e-mail e título de página." },
    { html:"Não é genérico (evitar \u201cSistema de\u201d, \u201cPrograma de\u201d, \u201cMétodo\u201d)." }
  ]} },

{ id:"5.12", type:"mono", label:"Prompt 1",
  promptLabel:"Prompt 1 · promessa específica",
  code:`Você é um copywriter sênior especialista em ofertas de alto
ticket B2B. Vou te dar 3 insumos que vieram de pesquisa
estruturada. Sua tarefa é construir UMA promessa específica
para a oferta.

Insumo 1, dor verbatim do cliente:
"Perdi três clientes esse mês porque a equipe demorou mais de
duas horas para responder. O sócio está me cobrando na reunião
de sexta."

Insumo 2, persona-alvo: sócia de escritório de contabilidade
de médio porte, perfil decisor racional, exige ROI quantificado.

Insumo 3, brecha competitiva: concorrentes têm posicionamento
e promessa fortes, ângulo (história) fraco.

Sua tarefa:
1. Escreva 3 versões de promessa específica, cada uma com:
   resultado nomeado, quantificação, prazo, "ou" (devolução).
2. Classifique cada uma por perfil decisório.
3. Recomende qual usar dado que o perfil-alvo é racional.`,
  fontSmall:true },

{ id:"5.13", type:"mono", label:"Prompt 2",
  promptLabel:"Prompt 2 · garantia + ancoragem",
  code:`Com a promessa escolhida ("[colar a vencedora]"), agora construa
garantia e ancoragem.

Garantia:
1. Proponha 2 versões: uma forte (devolução total se não bater
   meta), uma híbrida (devolução parcial + 30 dias extras).
2. Para cada, identifique o risco que você assume e como mitigar.
3. Recomende qual usar para uma oferta de R$ 50 mil, perfil
   B2B racional.

Ancoragem (para R$ 50 mil):
1. Custo do problema (3 clientes perdidos/mês × R$ 5 mil)
2. Alternativa (gerente de operações sênior R$ 12 mil/mês)
3. Horas do cliente (sócia, valorada R$ 500/h)
Para cada, escreva a frase de ancoragem do material de vendas.
Recomende qual usar como principal.`,
  fontSmall:true },

{ id:"5.14", type:"mono", label:"Prompt 3",
  promptLabel:"Prompt 3 · nome",
  code:`Você tem agora:
- Promessa: "[colar]"
- Garantia: "[colar]"
- Ancoragem: "[colar]"
- Persona-alvo: sócia de escritório, decisor racional
- Brecha competitiva: ângulo (história) único

Sua tarefa: gerar 5 nomes candidatos para esta oferta seguindo
critérios:
1. Diz para quem é em 1 ou 2 palavras
2. Sugere o resultado, não o método
3. Memorizável em uma leitura
4. Funciona como assunto de e-mail e como título de página
5. Não é genérico (evitar "Sistema de", "Programa de", "Método")

Para cada nome, dê justificativa em 1 frase do porquê funciona.
Recomende o vencedor com argumento de 2 frases.` },

{ id:"5.15", type:"standard", label:"Material Codex / GPT",
  eyebrow:"Material complementar", title:"Material para <em>Codex / GPT</em>",
  intro:"Versão paralela completa para a turma que usa ChatGPT.",
  subItalic:"Inclui os 3 prompts adaptados e os 2 testes finais: especificidade + nome.",
  cta:"Baixar prompts paralelos" },

{ id:"5.16", type:"two-cards", label:"Exercício",
  eyebrow:"Exercício · 10 minutos", title:"Oferta em <em>dois níveis</em>",
  cards:[
    { label:"Iniciante", body:"Prompt 1 com sua dor, persona e brecha. Escolha 1 das 3 promessas." },
    { label:"Intermediário", accent:true, body:"3 prompts em sequência. Sai com oferta completa: promessa, garantia, ancoragem, nome. Verifique a regra 10x." }
  ],
  footer:"3 testes: especificidade · regra 10x · nome com 2 pessoas do nicho." },

{ id:"5.17", type:"quadro", label:"Para o quadro · Bloco 4",
  title:"Para o quadro · <em>Bloco 4</em>",
  items:[
    { label:"Regra 10x", phrase:"Cobre um décimo do que entrega." },
    { label:"4 componentes", phrase:"Promessa específica + garantia + ancoragem + nome." },
    { label:"Nome", phrase:"Ruim mata oferta boa. Bom vende oferta mediana." }
  ]},

/* ====================== PARTE 6 — FECHAMENTO ====================== */
{ id:"6.1", type:"cover", label:"Fechamento",
  kicker:"Fechamento · 5 minutos",
  h1:"Para o <em>quadro.</em>",
  lead:"Quatro frases. Uma ação de 24 horas.",
  note:"Voz cai meio tom. Ritmo mais lento. Contato visual." },

{ id:"6.2", type:"quadro-big", label:"Frase · Bloco 1",
  tag:"Do Bloco 1",
  phrase:"A dor cara <em>já sangra no caixa</em> antes da IA entrar.",
  sub:"Frequência, custo visível, controle de orçamento, palavras literais. Sem os quatro, é hipótese." },

{ id:"6.3", type:"quadro-big", label:"Frase · Bloco 2",
  tag:"Do Bloco 2",
  phrase:"Três personas, <em>uma headline</em>.",
  sub:"Custo zero, dez minutos. Se ressoa em duas sem ofender a terceira, vai para mídia." },

{ id:"6.4", type:"quadro-big", label:"Frase · Bloco 3",
  tag:"Do Bloco 3",
  phrase:"Quatro vetores. <em>Brecha onde todos são fracos.</em>",
  sub:"Ângulo é a brecha mais difícil de copiar." },

{ id:"6.5", type:"quadro-big", label:"Frase · Bloco 4",
  tag:"Do Bloco 4",
  phrase:"<em>Preço sem valor é ruído.</em> Regra dez por um.",
  sub:"Promessa específica, garantia que tira risco, ancoragem que dá referência, nome que vende. Empilhe." },

{ id:"6.6", type:"standard", label:"Ação de 24 horas",
  title:"Ação de <em>24 horas</em>",
  intro:"Conhecimento sem ação vira ressaca.",
  body:["Em 24 horas, faça <strong>uma</strong> coisa. Não três. Uma."] },

{ id:"6.7", type:"cards", label:"Escolha uma", cols:3,
  eyebrow:"Escolha uma", title:"Onde você <em>está</em>",
  items:[
    { label:"Sem nicho claro", body:"Rode o protocolo do Bloco 1 em 15 min. Saia com a frase do cliente ou descarte o nicho." },
    { label:"Nicho, oferta fraca", body:"Rode os 3 prompts do Bloco 4 em 30 min. Promessa, garantia, ancoragem, nome." },
    { label:"Anúncio não converte", body:"Teste do Bloco 2 em 10 min. Descubra qual perfil está perdendo." }
  ] },

{ id:"6.8", type:"tese", label:"A ordem do jogo",
  phrase:"Pesquisa antes de oferta.<br>Oferta antes de anúncio.<br><em>Anúncio antes de escala.</em>",
  sub:"Inverter qualquer uma queima verba." },

{ id:"6.9", type:"cover", label:"Em uma semana",
  h1:"Em uma semana,",
  lead:"eu quero ouvir de você qual opção executou.",
  note:"Olha a câmera. 2 segundos de pausa. Despede." },

{ id:"6.10", type:"cover", label:"Capa final", final:true,
  kicker:"Obrigada",
  h1:"Pesquisa antes da <em>oferta.</em>",
  lead:"O jogo se ganha antes do anúncio.",
  footer:"Material completo: prompts Codex/GPT, \u201cPara o quadro\u201d de cada bloco, transcript da Alan mapeado por tema.",
  cta:"Roteiro completo" }

];
