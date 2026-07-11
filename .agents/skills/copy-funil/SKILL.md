---
name: copy-funil
description: |
  A FUNDAÇÃO da copy do funil — o cérebro da mensagem, não a fábrica de peças. Você + a IA
  constroem o diagnóstico (Schwartz), a Big Idea + mecanismos (Todd Brown), o banco de
  headlines (Halbert) e bullets (Bencivenga) e a validação (Hopkins + checklist Sugarman),
  aplicando os copywriters lendários como método e referência.

  O resultado vira a fonte única de mensagem do projeto: projetos/{slug}/copy.md.
  A copy APLICADA de cada peça (perguntas do quiz, roteiro de VSL, página, e-mails)
  é gerada na skill da própria peça (/quiz-funil, /vsl-funil, /pagina-vendas-funil,
  /email-funil) a partir do copy.md — não aqui.

  3 fluxos: Lançamento Completo, Tráfego Pago e Otimização de Funil. Escolha por
  Matriz de Decisão de 5 perguntas.

  Use quando: construir a fundação de copy de alta conversão (diagnóstico, Big Idea,
  mecanismos, banco de headlines/bullets), validar/auditar copy existente ou otimizar
  funis existentes.
---

# Copy de Funil — Pipeline de Alta Conversão

Pipeline para criar copy de alta conversão aplicando os frameworks dos copywriters lendários.
Você e a IA escrevem juntos: a IA assume cada método (o diagnóstico de Schwartz, a clareza
de Ogilvy, a visceralidade de Halbert, o rigor de Hopkins) como referência, e você revisa o
resultado em cada fase antes de seguir.

Não é preciso ter nenhum squad ou agente instalado: os copywriters entram como **método de
escrita**, não como sistemas que precisam existir no seu projeto.

## Escopo — o cérebro da copy, não a fábrica de peças

A copy do funil tem **2 camadas**:

1. **FUNDAÇÃO** (esta skill): o diagnóstico de Schwartz, a Big Idea + mecanismos, a voz/léxico do avatar, o banco de headlines e bullets, e a validação Hopkins/Sugarman. Sai daqui e vira a **fonte única** `projetos/{slug}/copy.md`.
2. **APLICAÇÃO** (skills das peças): a copy final de cada peça — perguntas do quiz, roteiro de VSL, e-mails, página — é gerada **dentro da skill de cada peça**, lendo o `copy.md`.

**O que esta skill entrega:** a fundação (Fases 1-3) em `projetos/{slug}/copy.md` + a **validação** (Fase 6) sobre as peças depois que elas existem.

**O que foi movido pras skills das peças** (todas lendo o `copy.md`):

| Peça | Onde a copy aplicada nasce |
|------|----------------------------|
| Roteiro de VSL | `/vsl-funil` |
| E-mails | `/email-funil` |
| Página de vendas | `/pagina-vendas-funil` |
| Quiz (perguntas, diagnósticos, resultado) | `/quiz-funil` |

Isso mata o ping-pong entre skills: o aluno constrói a fundação UMA vez aqui, e cada peça nasce já com a copy aplicada — sem voltar pra cá (só volta pra **validar** a peça pronta, Fase 6).

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output anterior — o **offerbook** que você montou na etapa da oferta. Todo o trabalho de um nicho vive em **`projetos/{slug}/`** (convenção de projeto — ver a skill `/offerbook`).

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira o offerbook:**

```
ls projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir, leia dele o produto, o avatar, o mecanismo, a oferta e o público — não peça de novo o que já está lá.
- Se FALTAR, PARE e aponte a skill que gera o arquivo:

> Pra escrever a copy eu preciso do `projetos/{slug}/offerbook.md` (da skill `/offerbook`). Rode `/offerbook` primeiro e volte.

> **Exceção — Perfil = afiliado:** não há offerbook próprio. O gate se satisfaz com o **Registro da Oferta do Produtor** (`projetos/{slug}/offerbook.md` no formato do afiliado). Nesse caso, a **Fase 2 (Big Idea + mecanismo) LÊ a comunicação oficial do produtor** (promessa, mecanismo, prova que ele já usa) em vez de criar um mecanismo próprio — afiliado não inventa promessa que o produtor não faz.

Não invente o que deveria vir da etapa anterior (a oferta, o avatar, o mecanismo).

> **Onde salvar:** a copy desta skill sai em **`projetos/{slug}/copy.md`** (+ `.html`/`.pdf` quando gerar). Mesma pasta do projeto.

## Passo 0 — Checar insumos antes de rodar

Antes de escrever qualquer linha, confira os insumos da Fase 1 dentro de `projetos/{slug}/`:

| Insumo | Status | Pra que serve |
|--------|--------|----------------|
| `offerbook.md` | **Obrigatório** | Regra-mãe: sem offerbook aprovado, não se escreve copy (é o gate acima). |
| `avatar.md` | Recomendado | Dores e voz verbatim do cliente — a copy usa as palavras DELE, não as suas. |
| `espiao/dossie-*.md` | Recomendado | Brechas do concorrente viram ângulos e quebra de objeção. |
| `swipe/briefing-swipe-file.md` | Recomendado | Hooks e padrões já validados — o swipe-file existe exatamente pra alimentar esta skill. |

Se faltar o **obrigatório**, PARE, aponte a skill que gera (`/offerbook`) e PERGUNTE antes de seguir. Se faltar um recomendado, avise o que falta (e qual skill gera: `/avatar-funil`, `/espiao-do-concorrente`, `/swipe-file`) e pergunte se o aluno quer rodar antes ou seguir sem. Leia os que existirem e use-os como matéria-prima das fases.

## Gate — Perfil do Projeto (ler ANTES de escrever a copy)

Leia o **Perfil do Projeto** no topo do `projetos/{slug}/offerbook.md` (regra completa em `.claude/skills/_shared/perfil.md`) e adapte a copy. **Guard (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é PROIBIDO usar enquadramento de "especialista/curso/mentoria" e "depoimento de aluno" como padrão — use **voz do cliente / prova de uso / case**. O default de infoproduto de especialista só vale quando Tipo = especialista.

- **B2B / serviço** → a copy vira **business case + ROI + autoridade + case**, decisor vs. usuário; não Big Idea emocional de transformação pessoal. Fechamento tende a **reunião**, não checkout.
- **Físico / varejo local** → copy de **oferta local** (promoção, proximidade, urgência real da loja), não manifesto de transformação.
- **SaaS/app** → copy de **antes/depois de produtividade** na voz do cliente ("levava X horas, agora minutos").
- **Afiliado** → a copy se apoia na **oferta do produtor** (não invente mecanismo/promessa próprios além do que o produtor entrega).

## Gate de compliance — nicho sensível

Antes de escrever qualquer promessa, headline ou oferta, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, **médico (CFM)**, **advocacia (OAB)**, **psicologia/terapia**, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- **Exceção dura — médico (CFM) / psicologia (CRP) / jurídico (OAB):** depoimento de paciente/cliente **NÃO entra** (nem com ressalva — é vedação do conselho). A prova vira **credencial** (nome + registro no conselho), **método** e **conteúdo educativo**.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue normalmente, só com a copy calibrada pra não prometer o proibido.

## Regra de honestidade de prova

- NUNCA invente depoimento, número, case, citação ou "resultados de alunos". Toda prova entra na copy vinda do offerbook ou de pesquisa real (avatar, dossiê do concorrente, swipe).
- Sem prova real → use uma estratégia alternativa (garantia forte, bastidor, transparência de método) e marque o trecho com `[SEM PROVA AINDA]` pro aluno preencher.
- Nicho regulado → linguagem de possibilidade, sem promessa garantida (respeite o Gate de compliance acima).

## Visão Geral

```
/copy-funil "descricao do projeto"

Lancamento Completo:
  Fase 1: Fundacao      Diagnostico de awareness (Schwartz) -> base cientifica (Hopkins)
  Fase 2: Estrategia    Avatar + oferta (Kennedy) -> Big Idea + mecanismo (Todd Brown)
    | VOCE REVISA (aprovar Big Idea + Mecanismo)
  Fase 3: Criacao       Headlines (Halbert) + Bullets (Bencivenga)
    | VOCE REVISA (aprovar headlines + bullets)
    -> fundacao aprovada = copy.md (fonte unica)
  Fase 4: Peca Principal VSL (Jon Benson) OU carta (Halbert)
    -> RODA NA SKILL DA PECA (/vsl-funil, /pagina-vendas-funil), lendo o copy.md
  Fase 5: Email          Sequencia (Andre Chaperon / Soap Opera)
    -> RODA NA /email-funil, lendo o copy.md
  Fase 6: Validacao      Auditoria cientifica (Hopkins) + checklist de gatilhos (Sugarman)
    -> volta pra ESTA skill, sobre as pecas prontas
```

## Coleta de Informações (obrigatória — todas as 5 perguntas)

### Contexto do Projeto
Colete: Produto/Oferta, Mercado/público, Objetivo, Materiais já existentes.

### Matriz de Decisão (5 perguntas)
```
Q1 - Nivel de consciencia: 1.Inconsciente 2.Consciente do problema 3.Consciente da solucao 4.Consciente do produto 5.Mais consciente
Q2 - Sofisticacao:         1.Primeiro no mercado 2.Segundo 3.Maduro 4.Cetico 5.Esgotado
Q3 - Ticket:               1.Baixo(<R$500) 2.Medio(R$500-5K) 3.Alto(R$5K-25K) 4.Premium(R$25K+)
Q4 - Trafego:              1.Frio 2.Morno 3.Quente
Q5 - Peca principal:       1.VSL 2.Carta de Vendas 3.Sequencia de Email 4.Criativo de Anuncio 5.Landing Page 6.Otimizacao de Funil
```

**Validação**: todos os 5 inputs são necessários (contexto + Q1-Q5). Se faltar algum, pergunte antes de seguir.

## Qual fluxo usar

| Condição | Fluxo | Fases |
|----------|-------|-------|
| Q3=Premium OU (Q3=Alto + Q4=Frio) | Lançamento Completo | 6 |
| Q3=Alto/Médio/Baixo + Q4=Morno/Quente | Tráfego Pago | 3 |
| Q3=Médio + Q4=Frio | Tráfego Pago | 3 |
| Q5=Otimização de Funil | Otimização de Funil | 4 |
| Padrão / Ambíguo | Lançamento Completo | 6 |

Apresente a recomendação. Você pode trocar o fluxo se quiser.

## Como conduzir

- **Trabalho em fases.** A IA produz a peça de cada fase aplicando o framework indicado, sempre
  partindo do que já foi decidido nas fases anteriores.
- **Comunicação por arquivos do seu projeto.** Salve a saída de cada fase em arquivos no seu
  próprio projeto (uma pasta por projeto de copy, do seu jeito) para que a fase seguinte parta dela.
- **Você revisa nos checkpoints.** Antes de avançar das fases marcadas, leia a saída e aprove ou peça ajuste.

### Princípios de copy (sempre respeitar)
- Sem travessão (—) em nenhuma peça de copy: é cara de texto de IA. Use ponto, vírgula ou dois-pontos, ou reescreva a frase.
- Sem a construção "não é sobre X, é sobre Y" (nem "não é X, é Y", "não se trata de X, e sim de Y"): contraste vazio é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar.
- Não escreva headline antes de diagnosticar o nível de consciência.
- Não pule o diagnóstico de Schwartz em tráfego frio.
- Sugarman é gatilho de **checklist**, não de escrita (use para auditar, não para redigir).
- Use no máximo 15-20 gatilhos por peça — não force os 30.
- Não misture vozes que conflitam na mesma peça (ex.: o visceral de Halbert com o seco de Carlton; a elegância de Ogilvy com a intensidade de Makepeace).
- Não escreva bullets sem o contexto da headline.
- Não escreva emails antes da peça principal existir.
- Em tráfego frio, sempre rode a "conversa mental" do leitor antes de escrever.

---

## Execução — Lançamento Completo

### Fase 1: Fundação (Schwartz -> Hopkins)

**Método Eugene Schwartz** (Breakthrough Advertising)
- Frameworks: 5 Níveis de Consciência, 5 Estágios de Sofisticação, Canalização do Desejo de Massa.
- Missão:
  1. Diagnostique o nível EXATO de consciência (1-5).
  2. Diagnostique o estágio de sofisticação (1-5).
  3. Defina o desejo de massa a canalizar.
  4. Indique a direção de headline adequada ao nível de consciência.
  5. Documente as implicações para as fases seguintes.

**Método Claude Hopkins** (Publicidade Científica) — depois de Schwartz
- Missão:
  1. Defina resultados mensuráveis.
  2. Estabeleça o que rastrear + baselines.
  3. Crie hipóteses de teste.
  4. Documente os princípios científicos (especificidade, reason-why, prova).
  5. Estabeleça os critérios de auditoria para a Fase 6.

---

### Fase 2: Estratégia (Kennedy -> Todd Brown)

**Método Dan Kennedy** (3M's Triangle, Magnetic Marketing)
- Partindo do diagnóstico da Fase 1:
  1. **Mercado**: quem é o comprador? (multidão faminta, dores, linguagem)
  2. **Mensagem**: promessa central, urgência, objeções.
  3. **Mídia**: canais, formatos.
  4. **Oferta**: núcleo + bônus + garantia + preço.

**Método Todd Brown** (Unique Mechanism, Big Marketing Idea) — depois de Kennedy
- Partindo do diagnóstico + avatar + estratégia de oferta:
  1. **Mecanismo do Problema** (por que falharam antes, a causa oculta, batize-a).
  2. **Mecanismo da Solução** (por que ISTO funciona diferente).
  3. **Big Marketing Idea** (uma frase: intelectualmente interessante, emocionalmente irresistível, impossível de ignorar).
  4. **Arquitetura de Prova**.

**VOCÊ REVISA**: leia a Big Idea (uma frase) + resumo do Mecanismo + pontos-chave do Avatar. Aprove antes de seguir.

---

### Fase 3: Criação (Headlines + Bullets)

**Método Gary Halbert** (fórmulas de headline, estrutura de carta de vendas)
- Crie as 25 melhores headlines: 8 de história/curiosidade + 8 de benefício direto + 5 baseadas em mecanismo + 4 emocionais.
- Ranqueie as 25 e selecione as 5 melhores para teste, com justificativa por nível de consciência.

**Método Gary Bencivenga** (fascinations, equação da persuasão)
- Crie 30 bullets de fascination + 20 bullets de benefício.
- Selecione os 15 melhores para a peça de vendas e os 5 melhores para anúncios.
- Marque o princípio de persuasão usado em cada bullet.

**VOCÊ REVISA**: leia as 5 melhores headlines + os 15 melhores bullets. Aprove antes de seguir.

---

### Fase 4: Peça Principal (baseada em Q5) — EXECUTADA NA SKILL DA PEÇA

> **Onde roda agora:** esta fase **não roda mais aqui**. Com a fundação aprovada no `copy.md`, o roteiro de VSL nasce na `/vsl-funil` e a página na `/pagina-vendas-funil` — cada uma lendo o `copy.md`. Os métodos abaixo ficam documentados aqui como **referência** pra essas skills aplicarem.

Se Q5=VSL -> método Jon Benson. Se Q5=Carta de Vendas ou padrão -> método Gary Halbert.

**Se VSL — Método Jon Benson** (5 passos do VSL)
- Roteiro completo: 1. Abertura com sugestão 2. Amplificação do problema 3. História do herói relutante 4. Preview da solução (Big Idea + Mecanismo) 5. Oferta e fechamento ético.
- Integre as melhores headlines, os melhores bullets, a estrutura de oferta e linguagem adequada ao nível de consciência.

**Se Carta de Vendas — Método Gary Halbert**
- Carta completa: 1. Headline (a melhor da Fase 3) 2. Lead (história, casada com o nível de consciência) 3. Corpo (Problema -> Mecanismo -> Solução -> Prova) 4. Bullets (os melhores da Fase 3) 5. Oferta (stack completo) 6. Fechamento (urgência + garantia + CTA) 7. P.S. (reforço do benefício + prazo).

---

### Fase 5: Email (Soap Opera Sequence) — EXECUTADA NA /email-funil

> **Onde roda agora:** esta fase **não roda mais aqui**. Os e-mails nascem na `/email-funil`, lendo a fundação do `copy.md`. O método abaixo fica documentado como **referência** pra essa skill aplicar.

**Método Andre Chaperon** (Soap Opera Sequence)
- Partindo da peça principal + avatar + Big Idea + oferta:
  1. **Sequência de Lançamento (5 emails)**: Montar o palco -> Alta tensão -> Epifania -> Benefícios ocultos -> Urgência. Cada email: final em suspense, referência à Big Idea, link para a peça de vendas, casado com o nível de consciência.
  2. **Carrinho Abandonado (4 emails)**: 1h lembrete leve -> 24h história + prova -> 48h objeção -> 72h urgência final.

---

### Fase 6: Validação (Hopkins -> Sugarman)

**Auditoria Hopkins** (científica)
- Audite TODA a copy. Pontue 7 dimensões de 1-10 (especificidade, reason-why, prova, desperdício, consistência, validação da headline, oferta). Nota geral /100. Recomendações para notas <7. Sugestões de teste A/B.

**Checklist Sugarman** (30 gatilhos psicológicos — como ferramenta, não como escrita)
- Sobre a peça principal:
  1. Identifique os gatilhos presentes.
  2. Conte (espere 15-20).
  3. Aponte os de alto impacto que faltam (#1 Consistência, #5 Reason-Why, #7 Honestidade, #14 Storytelling, #16 Especificidade, #26 Esperança).
  4. Recomende adicionar 3-5 de forma natural. Limite: máximo 20 no total.

---

## Variações de Fluxo

### Tráfego Pago — 3 Fases
- **Fase 1: Diagnóstico** — Schwartz (consciência + sofisticação), depois Kennedy (avatar). Você revisa.
- **Fase 2: Copy de Anúncio** — Halbert (20+ headlines + anúncios multi-plataforma). Você revisa.
- **Fase 3: Landing Page + Email** — Halbert (landing page), depois Kennedy (thank-you + nurture de 5 emails).

### Otimização de Funil — 4 Fases
Para funis EXISTENTES com dados.
- **Fase 1: Diagnóstico** — Hopkins (auditoria científica) + Schwartz (checagem de consciência). Análise de gap em 6 dimensões. Você revisa.
- **Fase 2: Correções** — Halbert (headlines + lead) + Kennedy (oferta + CTA). Prioridade: Headline > Lead > Oferta > CTA > Prova. Você revisa.
- **Fase 3: Gatilhos** — Auditoria Sugarman (adicionar 5-10 que faltam) + verificação Hopkins (manter especificidade).
- **Fase 4: Setup de Teste A/B** — Hopkins. Tamanho de amostra, uma variável por teste, 95% de confiança.

---

## Finalização

### Resumo
Apresente: fluxo usado, respostas da matriz de decisão, a fundação criada (diagnóstico, Big Idea + mecanismos, banco de headlines/bullets no `copy.md`), nota Hopkins e contagem Sugarman (quando a validação rodou), frameworks aplicados.

### Próximos Passos
**O próximo passo é UM comando só: a skill da peça de funil prescrita no `projetos/{slug}/funil.md`** (o formato que o `/metodo-funil` cravou pro estágio de consciência do projeto) — ela gera a peça JÁ com a copy aplicada, lendo o `copy.md`. Se ainda não existir `funil.md`, aponte **`/metodo-funil`** primeiro (é ele que decide o formato). Ofereça também: revisar a fundação em detalhe, refazer uma fase, ou voltar aqui depois pra validar as peças prontas (Fase 6).

## Notas
- Comunicação entre fases sempre por arquivos do seu projeto (não por mensagens).
- Se uma fase precisar ser refeita, refaça a fase — nunca desfaça o que já foi aprovado.
- A IA aplica os frameworks sob demanda em cada fase.
- Os copywriters lendários entram como método/referência de escrita — você + a IA escrevem a copy.

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
