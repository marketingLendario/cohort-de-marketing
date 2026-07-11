---
name: quiz-funil
description: "Estrutura um funil de quiz/diagnóstico que captura lead segmentado e casa a oferta ao resultado de cada pessoa. Dado nicho + produto + público, desenha o objetivo de segmentação, as perguntas com ramificação por arquétipo/dor, a lógica de N resultados (diagnósticos), a página de resultado que casa a oferta a cada diagnóstico, a captura de lead (e-mail/WhatsApp) e a sequência de follow-up por resultado. É o funil ideal pra qualificar e segmentar público de NÍVEL 4 (consciente do problema). Use quando quiser montar um quiz, um diagnóstico interativo, uma isca que segmenta o lead, ou um funil de qualificação que personaliza a oferta. Método de elevação de consciência (autoria Alan Nicolas), base teórica em Hormozi (Equação de Valor)."
user_invocable: true
---

# Funil de Quiz / Diagnóstico — captura segmentada que casa a oferta ao resultado

Skill que estrutura um **funil de quiz/diagnóstico**: a pessoa responde perguntas, recebe um **resultado/diagnóstico personalizado** e a sua **oferta entra casada àquele resultado**. No caminho, você captura um **lead já segmentado** (você sabe quem ele é antes de vender).

> **Promessa do método:** transformar uma isca passiva ("baixe meu PDF") em uma **experiência de autodescoberta** que qualifica, segmenta e prepara a venda — porque a oferta chega desenhada pro diagnóstico exato da pessoa.

> **KB (fonte de verdade):** `KB-quiz-funil.md` (nesta pasta). Traz a mecânica de pergunta→resultado, a Equação de Valor aplicada ao quiz, o desenho de arquétipos, o trade-off do momento de captura e a matriz de follow-up. **Carregue o KB antes de montar** — não responda de cabeça.

> **Onde encaixa:** no método de funil (skill `/metodo-funil`), o quiz é o **funil/captação prescrito pro NÍVEL 4 — consciente do problema** (a pessoa sente a dor, ainda não sabe que existe solução). O diagnóstico nomeia a dor dela, prova que você entende o problema e abre a porta pra solução.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/quiz.md`** (+ `.html` e `.pdf`).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, confira que os arquivos existem no seu projeto:

```
ls projetos/{slug}/offerbook.md offerbook-*.md 2>/dev/null
```

(o `projetos/{slug}/offerbook.md` é o nome novo, dentro do projeto; o `offerbook-*.md` na raiz é o formato antigo da Aula 1, fallback pré-migração.)

- Se existir, leia dele a oferta (produto/transformação, ticket, mecanismo, público) pra casar a oferta ao resultado do quiz.
- Se FALTAR, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de quiz eu preciso do `projetos/{slug}/offerbook.md` (ou o `offerbook-*.md` da raiz, formato antigo da Aula 1), que sai da skill `/offerbook`. Rode `/offerbook` primeiro; quando o offerbook existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pixel-ready + layout de página do lead (texto completo em `.claude/skills/_shared/rastreamento.md` — LEIA-o ao gerar página).** Snippets Meta Pixel/GTM prontos porém COMENTADOS no `<head>` com `[PLUG: IDs]` (entram na Aula 3; se o aluno já tiver, plugue). Eventos desta peça: PageView · quiz_start (1ª resposta) · quiz_complete · Lead (gate, com a TAG do resultado como parâmetro: alimenta remarketing por perfil) · clique no CTA da revelação. Layout: CTA sempre ABAIXO do vídeo e centralizado; vídeo na 1ª dobra no mobile; jargão interno do método NUNCA visível pro lead; slot de vídeo nasce com roteiro (botão "Ver roteiro"); sem barra de revisão na página.

A copy do funil tem 2 camadas: a **fundação** (Big Idea, mecanismos, voz/léxico, banco de headlines/bullets) vive no `projetos/{slug}/copy.md`, gerado pela `/copy-funil`; a **copy aplicada** do quiz nasce **aqui**.

- **Se `projetos/{slug}/copy.md` existe** (fundação aprovada): esta skill gera a copy final das **perguntas, diagnósticos, CTAs e página de resultado** A PARTIR dele — o aluno **não volta pro `/copy-funil`** pra escrever a copy do quiz.
- **Se não existe:** aponte a `/copy-funil` (é ela que constrói a fundação) e **PERGUNTE** se o aluno quer seguir só com a estrutura (esqueleto sem copy final) ou rodar a fundação antes.
- **A copy aplicada obedece:** a Big Idea e os mecanismos do `copy.md` · a voz/léxico do avatar (palavras reais, não as suas) · a honestidade de prova (sem prova real → `[SEM PROVA AINDA]`) · o gate de compliance de nicho regulado.
- **Depois de aplicada**, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

---

## Como usar

Quando você pedir pra montar um quiz, um diagnóstico ou um funil de qualificação/segmentação:

1. **Carregar o KB** (`KB-quiz-funil.md`) pra ter a mecânica na mão.
2. **Coletar 3 inputs** (perguntar só os que ainda não estão claros):
   - **Nicho / mercado** (ex.: o seu mercado).
   - **Produto / transformação** + **ticket** que vai ser casado ao resultado.
   - **Público + nível de consciência (1-5)** — o quiz brilha no **nível 4**. Em nível 1-2 (quente) ele vira fricção desnecessária; ver o gate abaixo.
3. **Ter o avatar/arquétipos** — o quiz segmenta por **arquétipo ou dor dominante**. Se você ainda não mapeou, use a skill `/avatar-funil` antes (é o eixo que define os resultados).
4. **Ter o offerbook** — a oferta precisa existir pra ser casada ao resultado (skill `/offerbook`). Sem oferta, o quiz captura mas não converte.
5. **Rodar as 6 fases** abaixo, preenchendo cada bloco com o caso real.
6. **Entregar a estrutura pra você aprovar** — NUNCA subir/publicar/configurar nada sem OK. A skill estrutura; você publica.
7. **Copy: fundação no `/copy-funil`, aplicação AQUI.** A fundação (Big Idea, mecanismos, banco de headlines/bullets) vem do `projetos/{slug}/copy.md`; **esta skill** gera a copy aplicada das perguntas, dos diagnósticos, dos CTAs e da página de resultado a partir dele (ver a seção "Copy aplicada" acima). Página de resultado: estrutura com `/pagina-vendas-funil` + identidade com `/design-md`. E-mails de follow-up: `/email-funil`. Não escrever copy de cabeça — partir sempre do `copy.md` e da estrutura definida aqui.

---

## Gate de SEGURANÇA — nicho de saúde / psico (regra dura)

Se o Perfil do Projeto (offerbook) indicar **nicho regulado = saúde/médico/psico** (ou o tema envolver sofrimento psíquico, transtorno, dor clínica), o quiz **precisa de uma pergunta-guarda de triagem**: se a resposta indicar **risco (ideação/auto-lesão, emergência)**, o quiz NÃO segue pra captura/oferta — mostra **orientação de emergência** (ex.: no Brasil, CVV 188; procurar atendimento) e encerra com acolhimento. Nunca etiquetar e vender pra um lead em risco. Isso vale junto com o gate de compliance de nicho regulado (linguagem de possibilidade, sem promessa de cura).

> **Prova em nicho regulado (médico/psico/jurídico):** na página de resultado e nos e-mails de follow-up, depoimento de paciente/cliente **NÃO entra** (nem com ressalva — é vedação do conselho); a prova vira **credencial** (nome + registro no conselho), **método** e **conteúdo educativo**.

## Gate de adequação (OBRIGATÓRIO antes de montar)

Quiz não serve pra todo público. Diagnostique o nível de consciência primeiro (regra do método):

| Nível | Estado do público | Quiz serve? |
|-------|-------------------|-------------|
| **5 — Inconsciente** | não sabe que tem o problema | Quiz que **revela o problema** ("descubra se você comete estes erros") — funciona como despertador, mas a oferta entra fraca |
| **4 — Consciente do problema** | sente a dor, não sabe que há solução | **SIM — é o nível ideal.** O diagnóstico nomeia a dor e abre pra solução |
| **3 — Consciente da solução** | conhece categorias | Quiz que segmenta **qual caminho/produto** serve pra ela |
| **2 — Consciente do produto** | já conhece seu produto | Quiz **vira fricção** — prefira página + depoimento |
| **1 — Mais consciente** | só falta empurrão | **NÃO** — mande direto pro checkout. Quiz aqui faz a pessoa se perder |

**Regra de ouro:** o quiz é a captação de **nível 4** por excelência. Se o público for quente (1-2), ele atrasa a venda — não monte.

---

## O Framework — 6 Fases

### Fase 1 — Objetivo e eixo de segmentação

Antes das perguntas, decida **o que o quiz vai descobrir**. Todo quiz segmenta por **um eixo** — escolha um:

| Eixo de segmentação | Quando usar | Resultado vira… |
|---------------------|-------------|-----------------|
| **Arquétipo** (perfil/tipo) | público heterogêneo com perfis distintos | "Você é o tipo X" → oferta na linguagem do tipo X |
| **Dor dominante** | mesma transformação, dores diferentes | "Sua maior trava é Y" → oferta atacando Y primeiro |
| **Estágio/maturidade** | mesma jornada, pontos diferentes | "Você está no estágio Z" → oferta no ponto de partida Z |
| **Score/nota** (diagnóstico) | há um "certo e errado" mensurável | "Sua nota é N/100" → oferta como o caminho pra subir a nota |

> Regra: **um eixo só.** Misturar arquétipo + score no mesmo quiz confunde a pessoa e quebra o casamento com a oferta. Defina o eixo e a quantidade de resultados (3 a 5 — ver Fase 3).

### Fase 2 — Desenho das perguntas

| Elemento | Como desenhar |
|----------|---------------|
| **Pergunta de entrada** | A 1ª pergunta é a de **menor fricção** — fácil, intrigante, sem pedir dado. Gera o micro-compromisso que puxa a pessoa pro quiz (princípio do comprometimento progressivo). |
| **Quantidade** | **5 a 8 perguntas.** Menos que 5 não segmenta; mais que 8 derruba a taxa de conclusão. |
| **Tipo de pergunta** | Múltipla escolha (cada alternativa **pontua** pra um resultado). Evite texto livre — quebra a ramificação e a experiência. |
| **Ramificação / pontuação** | Cada alternativa soma pontos pra **um arquétipo/dor**. No fim, o resultado é o de maior pontuação. (Quiz simples = soma de pontos; quiz avançado = ramificação que muda a próxima pergunta.) |
| **Linguagem** | As alternativas usam as **palavras reais do avatar** (vêm da `/avatar-funil`). A pessoa tem que se reconhecer em cada opção. |
| **Sem pergunta inútil** | Toda pergunta serve pra segmentar OU pra aprofundar a dor. Pergunta que não muda o resultado nem aquece = corta. |

### Fase 3 — Lógica de resultados (os N diagnósticos)

- **3 a 5 resultados.** Menos de 3 não vale o quiz; mais de 5 dilui e dá trabalho de manter.
- Cada resultado é um **diagnóstico nomeado**, com:

| Campo do resultado | O que entra |
|--------------------|-------------|
| **Nome do diagnóstico** | rótulo que a pessoa quer carregar ("O Estrategista", "A Travada na Execução") — nomear cria identidade |
| **Espelho** | 1-2 frases que descrevem a pessoa com precisão ("você é assim, sente isso") → o "como ele sabe disso?" |
| **Dor central** | a trava nº 1 daquele perfil — a que a sua oferta resolve |
| **Ponte pra solução** | por que existe saída + qual o próximo passo |
| **Oferta casada** | qual variação da oferta entra pra esse resultado (mesma oferta, ângulo/headline diferente — ou produto diferente se o eixo for "qual produto") |

> O diagnóstico tem que ser **honesto e específico**, não elogio genérico. Resultado que dá 10 pra todo mundo mata a credibilidade (anti-sicofancia).

### Fase 4 — Página de resultado (casa a oferta ao diagnóstico)

**Antes de montar, PERGUNTE o destino do resultado** (2 opções clicáveis, nenhuma pré-marcada):
> **Depois do diagnóstico, o que você quer?**
> - **Venda direta (checkout)** — o lead compra ali mesmo, na oferta casada ao resultado. Costuma casar com ticket que a pessoa decide sozinha.
> - **Marcar reunião/diagnóstico** — o lead agenda uma conversa; o fechamento é na call. Costuma casar com ticket alto, serviço ou B2B, onde a venda precisa de conversa.

O ticket do offerbook é só contexto; quem decide é o dono. O destino muda o passo 4 e o CTA abaixo, e a régua de follow-up (Fase 6): no destino "reunião", os e-mails **nutrem até a call, nunca vendem direto**.

> **Grave a escolha:** ao responder venda direta vs reunião, registre-a como o campo **"Destino do fechamento"** no **Perfil do Projeto** (topo do `projetos/{slug}/offerbook.md`) — a recuperação (`/recuperacao-funil`), o CRO (`/cro-funil`) e o status (`/status-funil`) leem de lá.

A página de resultado é uma **página de vendas personalizada pelo diagnóstico**. Monte a estrutura com `/pagina-vendas-funil` (visual via `/design-md`), na ordem:

1. **Revelação do diagnóstico** — nome + espelho ("Você é X"). Momento de maior atenção do funil.
2. **Aprofundamento da dor central** — agita a trava nº 1 daquele perfil.
3. **Ponte** — "existe um caminho pra sair disso".
4. **Oferta casada ao destino** — **venda direta:** a oferta com headline/bullets ajustados ao resultado (mecanismo, stack, ancoragem, prova, garantia, escassez). **Marcar reunião:** convite pra call + link de agendamento casado ao diagnóstico (não checkout, não stack de preço).
5. **CTA** — em 1ª pessoa, no contexto do diagnóstico: *"Quero começar"* (venda direta) ou *"Quero marcar minha conversa"* (reunião).

> Para público **nível 4**, a prova que casa é **estudo de caso** (não depoimento puro — depoimento converte no nível 2). Regra herdada do `/metodo-funil`.

### Fase 5 — Captura de lead (e-mail / WhatsApp)

| Decisão | Opções e trade-off |
|---------|--------------------|
| **O que capturar** | **Nome + e-mail + telefone (sempre os três).** O telefone é obrigatório porque a recuperação por WhatsApp (`/recuperacao-funil` · `/whatsapp-funil`) é peça do funil: sem ele, você perde o canal que mais recupera lead. Microcopy de privacidade perto do formulário reduz a fricção do telefone. |
| **Quando capturar** | **(a) Antes de mostrar o resultado** (gate) → captura mais leads, mas alguns abandonam por não verem o resultado. **(b) Depois do resultado** → menos leads, porém mais qualificados e engajados. **Recomendado no nível 4: gate logo antes do resultado** — a curiosidade pelo diagnóstico é o que paga o e-mail. |
| **Segmentação na captura** | Grave o **resultado/arquétipo como tag** no lead (campo/etiqueta no seu sistema de e-mail/CRM). É isso que destrava o follow-up segmentado (Fase 6). |
| **Promessa de privacidade** | Microcopy curta perto do formulário ("seu contato fica seguro") reduz fricção. |

### Fase 6 — Follow-up por resultado

O lead entrou **etiquetado pelo diagnóstico** → a sequência fala com a dor DELE, não genérica. Estruture os e-mails com `/email-funil`, uma trilha por resultado:

| E-mail | Função | Ângulo (puxa do diagnóstico) |
|--------|--------|------------------------------|
| **1 — Entrega** | reforça o resultado | "Seu diagnóstico foi X. Aqui está o que ele significa." |
| **2 — Aprofunda a dor** | agita a trava do perfil | história/erro comum do arquétipo X |
| **3 — Prova** | estudo de caso de alguém **do mesmo perfil** | "Fulano também era X e saiu assim" |
| **4 — Ponte pra oferta** | conecta diagnóstico → solução | a oferta como o caminho específico pra quem é X |

> Mantém a coerência: quem recebeu o diagnóstico "Travado na Execução" não pode receber e-mail genérico de "estrategista". A tag de resultado é o que segura isso.

---

## Ferramentas (genéricas)

- **Plataforma de quiz:** use a **ferramenta de quiz da sua escolha** (qualquer construtor de quiz/formulário interativo que faça ramificação/pontuação e mostre resultado por lógica). A skill **não** depende de ferramenta específica — ela entrega a **estrutura** (perguntas, pontuação, resultados) pra você montar onde quiser.
- **Conexão com a captura:** a plataforma de quiz precisa **mandar o lead + a tag do resultado** pro seu sistema de e-mail/CRM (via integração nativa, webhook ou automação). É essa ponte que liga o quiz ao follow-up segmentado da Fase 6.
- **Página de resultado:** pode ser a tela de resultado da própria ferramenta de quiz OU uma página própria montada com `/pagina-vendas-funil` (mais controle sobre a oferta).

---

## Template de Saída

Entregar sempre neste formato, preenchido com o caso real:

```markdown
# Funil de Quiz — [Produto] ([Nicho]) · Nível 4

## 1. Objetivo e eixo
- Eixo de segmentação: [arquétipo | dor | estágio | score]
- Nº de resultados: [3-5]
- O que o quiz descobre: ...

## 2. Perguntas (5-8)
- P1 (entrada, baixa fricção): ... → [pontua pra quê]
- P2 ... → ...
- ...

## 3. Resultados (diagnósticos)
- Resultado A — [nome] · espelho · dor central · ponte · oferta casada
- Resultado B — ...
- Resultado C — ...

## 4. Página de resultado (por diagnóstico)
- Revelação → dor → ponte → oferta casada (headline/bullets ajustados) → CTA
- Prova: estudo de caso (nível 4)

## 5. Captura
- Campos: nome + [e-mail/WhatsApp]
- Momento: [gate antes do resultado | depois]
- Tag gravada: [resultado/arquétipo]

## 6. Follow-up (por resultado)
- Trilha do Resultado A: e1 entrega → e2 dor → e3 prova → e4 oferta
- (repetir por resultado)
```

---

## Regras de ouro

**SEMPRE:** rodar o gate de adequação (quiz é de nível 4) · um eixo de segmentação só · pergunta de entrada de baixa fricção · 5-8 perguntas · 3-5 resultados nomeados · diagnóstico honesto e específico · casar a oferta a CADA resultado · capturar nome + e-mail + telefone (sempre) · perguntar o destino do resultado (venda direta ou reunião) · gravar o resultado como tag pra segmentar o follow-up · prova = estudo de caso no nível 4 · você [aluno] revisa antes de publicar.

**NUNCA:** montar quiz pra público quente (nível 1-2) · misturar dois eixos no mesmo quiz · pergunta que não segmenta nem aquece · resultado genérico/elogioso que dá nota alta pra todo mundo · pedir campos além de nome + e-mail + telefone · mandar follow-up genérico pra lead já etiquetado · vender antes de entregar o diagnóstico · subir/publicar/configurar a ferramenta (a skill só estrutura).

---

## Output (o que a skill entrega)

1. **Adequação** — nível de consciência do público + por que o quiz serve (ou não).
2. **Eixo + nº de resultados** — a decisão de segmentação.
3. **Mapa de perguntas** — 5-8 perguntas com a pontuação de cada alternativa (copy aplicada nesta skill a partir do `copy.md`).
4. **Resultados** — os N diagnósticos (nome, espelho, dor, ponte, oferta casada).
5. **Estrutura da página de resultado** — ordem dos blocos, com gancho pra `/pagina-vendas-funil`.
6. **Plano de captura** — campos, momento, tag.
7. **Matriz de follow-up** — uma trilha por resultado, com gancho pra `/email-funil`.
8. **PROTÓTIPO FUNCIONAL da página do quiz** (`projetos/{slug}/pagina/quiz-app.html`) — **só depois da copy aplicada aprovada.** A ordem é: fundação aprovada no `projetos/{slug}/copy.md` (da `/copy-funil`) → esta skill entrega a ESTRUTURA (itens 1-7) e **gera a copy aplicada** das perguntas, diagnósticos e CTAs a partir do `copy.md` → o aluno revisa e aprova → **então** gera-se o protótipo, já com a copy aplicada aprovada. NUNCA montar a página com copy de rascunho — aluno vendo página v1 com texto provisório se confunde e publica errado. O protótipo em si: página interativa REAL, arquivo único e self-contained — tela de abertura, perguntas clicáveis com barra de progresso, pontuação rodando (soma + desempate), gate de captura (**nome + e-mail + telefone**, microcopy de privacidade) e as N telas de resultado completas (espelho → dor → ponte → oferta casada ao destino → CTA), renderizada com os tokens do `projetos/{slug}/DESIGN.md`. Deixar os DOIS pontos de integração marcados como comentário no código e documentados no `quiz.md`: (a) envio de nome + e-mail + telefone + tag do resultado pro CRM/ferramenta de e-mail (webhook/fetch); (b) no botão do CTA, o **link do destino escolhido**: checkout (venda direta) OU link de agendamento (marcar reunião). O aluno pluga os 2 pontos e publica — ou usa o protótipo como blueprint pra montar na ferramenta de quiz da escolha dele.

> A ordem é lei: **fundação da copy (`/copy-funil` → `copy.md`) → esta skill estrutura E aplica a copy a partir do copy.md → protótipo montado com a copy aplicada aprovada.** A página nasce depois da copy aplicada aprovada, nunca antes.

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Público é quente (nível 1-2) | PARAR → quiz vira fricção; mande pra página/checkout |
| Não sei os arquétipos/dores do avatar | PARAR → mapear com `/avatar-funil` antes (é o eixo dos resultados) |
| Oferta/offerbook não existe | PARAR → construir a oferta antes (`/offerbook`); o quiz casa a oferta ao resultado |
| Não existe `copy.md` (fundação) e pediram copy final | PERGUNTAR → rodar `/copy-funil` (fundação) antes, ou seguir só com estrutura; nunca copy de cabeça |
| Pediram pra publicar/configurar a ferramenta | PARAR — a skill só estrutura; você [aluno] publica |

---

## Como encaixa no Mapa de Execução (nível 4)

No `/metodo-funil`, depois de diagnosticar o público como **nível 4 (consciente do problema)**, esta skill é a **captação prescrita** desse estágio. Sequência:

```
/avatar-funil   → arquétipos e dores (o eixo do quiz)
/offerbook      → a oferta que será casada ao resultado
/copy-funil     → fundação da copy (Big Idea, mecanismos, banco) → copy.md
/quiz-funil     → estrutura o quiz + resultados + captura + follow-up
                  E aplica a copy (perguntas, diagnósticos, CTAs) a partir do copy.md
/design-md      → identidade visual
/pagina-vendas-funil  → página de resultado (oferta casada ao diagnóstico)
/email-funil    → trilhas de follow-up por resultado
/cro-funil      → KPIs (início → conclusão → captura → clique na oferta) + A/B
```

> KPIs do quiz (no `/cro-funil`): **taxa de início, taxa de conclusão, taxa de captura, distribuição por resultado, clique na oferta por resultado.** A maior alavanca costuma ser a **pergunta de entrada** (taxa de início) e a **revelação do resultado** (clique na oferta).

---

*Skill quiz-funil — funil de quiz/diagnóstico pelo método de elevação de consciência (autoria Alan Nicolas), base teórica em Hormozi (Equação de Valor). Captação ideal de NÍVEL 4. Toda montagem calibra no KB-quiz-funil.md. A skill estrutura e gera a copy aplicada a partir do copy.md; você revisa, aprova — e a publicação é sua.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
