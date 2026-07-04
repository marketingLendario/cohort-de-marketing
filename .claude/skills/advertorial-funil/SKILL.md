---
name: advertorial-funil
description: "Estrutura um advertorial — a página editorial de pré-venda que aquece o público FRIO (nível 5 de consciência: não te conhece nem sabe que tem o problema). Parece artigo/notícia/história, não anúncio: planta o problema, agita a dor, apresenta o mecanismo único e faz a transição natural pra oferta (normalmente a VSL). Entra nicho + produto + público, sai a estrutura completa do advertorial em fases: lead/hook editorial, narrativa, agitação, mecanismo, prova costurada como editorial, transição e CTA suave. É o funil de TOPO do nível 5 no método do Alan Nicolas. Use quando precisar montar advertorial, página de pré-venda, conteúdo editorial de aquecimento, lead magnet editorial ou aquecer público frio antes da oferta. Modela a tradição de magalog/long-form jornalística (Jim Rutz) e os níveis de consciência (Eugene Schwartz)."
user_invocable: true
---

# Advertorial — Pré-venda Editorial pra Público Frio (Nível 5)

Skill que estrutura um **advertorial**: a página de **pré-venda editorial** que aquece o público **frio** e o entrega aquecido pra oferta. Baseada no método de funil do **Alan Nicolas**, modelando a escola de **long-form jornalística / magalog (Jim Rutz)** e os **níveis de consciência (Eugene Schwartz)**.

> **KB (fonte de verdade):** `KB-advertorial-funil.md` (nesta pasta). Tem a anatomia completa do advertorial, os tipos de lead editorial, o casamento com nível 5 e a regra do "remover o pedido". **Carregue o KB antes de montar** — não responda de cabeça.

> **Promessa do método:** transformar um estranho que **nem sabe que tem o problema** em alguém que **sente a dor, entende o mecanismo e quer a solução** — sem nunca parecer um anúncio. O advertorial não vende: ele **prepara a venda**.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/advertorial.md`** (+ `.html` e `.pdf`).

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o **projeto ativo** (ver "convenção de projeto" acima) e confira que os arquivos existem dentro dele:

```
ls projetos/ 2>/dev/null                                        # descobrir o projeto ativo (slug)
ls projetos/{slug}/offerbook.md projetos/{slug}/copy.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (dor, mecanismo único, produto/transformação, prova) do `projetos/{slug}/offerbook.md` e a copy base do `projetos/{slug}/copy.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o advertorial eu preciso do `projetos/{slug}/offerbook.md`, que sai da skill `/offerbook` (e da `projetos/{slug}/copy.md` pra copy base, da skill `/copy-funil`). Rode `/offerbook` primeiro; quando `projetos/{slug}/offerbook.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 (público frio que não sabe que tem o problema) — topo de funil editorial.

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: PageView · scroll 50/75% (leu o editorial) · clique na transição pra VSL/oferta (a audiência aquecida pra remarketing).

> **SEM barra de revisão dentro da página (a navegação mora no Book).** A página do lead NÃO leva barra de revisão, atalhos internos nem elemento de bastidor: a navegação entre as peças (copy, mapa, quiz, e-mails, pendências) fica no **Book do Funil** (`projetos/{slug}/index.html`), fora da página. Página de venda só carrega o que o LEAD deve ver.

> **Slot de vídeo nasce com roteiro (copy aplicada do vídeo).** Página com vídeo NUNCA fica só com placeholder: gere também o ROTEIRO do vídeo (gancho, espelho/narrativa, mecanismo, convite, fecho; com fala pronta, texto na tela e notas de gravação) a partir do `copy.md`, como HTML próprio na pasta `pagina/`. Se o advertorial embute vídeo ou transiciona pra uma VSL, o slot de vídeo inclui o botão "Ver roteiro do vídeo" DENTRO dele, apontando pro roteiro correspondente (gerado aqui ou na /vsl-funil). O dono grava a partir do roteiro e troca o slot pelo player.

> **Layout da página do lead (regra dura).** Vale pra TODA página voltada ao lead gerada por esta skill: **(1) quando a página tem vídeo, o botão de CTA fica SEMPRE ABAIXO do vídeo, nunca acima** — badges, selos e números de credibilidade vêm DEPOIS do CTA, nunca entre o texto e o vídeo; **(2) o botão de CTA é sempre centralizado** na página, em toda dobra em que aparecer; **(3) no mobile, o vídeo aparece assim que a página abre** — visível na primeira dobra, sem rolar; se não couber, enxugue o que vem antes dele, nunca empurre o vídeo pra baixo; **(4) jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "escassez" como eyebrow/rótulo/título de seção em NENHUMA página. Esses nomes vivem nos documentos internos do dono; na página, cada seção mostra só a copy real que o lead deve ler.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto editorial completo (lead, narrativa, agitação, mecanismo, transição, CTA). O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## O que é (e o que NÃO é)

| É | NÃO é |
|---|-------|
| Conteúdo que **parece** artigo/notícia/história | Anúncio com cara de anúncio |
| Funil de **topo** pra nível 5 (frio) | Página de vendas (isso é a `/pagina-vendas-funil`) |
| **Aquece** o lead e o entrega pra oferta (VSL) | A oferta em si (isso é o `/offerbook` + `/vsl-funil`) |
| Educa, planta o problema, gera curiosidade | Pitch direto de produto |
| Vale como leitura **mesmo se a oferta sumisse** | Material que sem o CTA não tem valor |

> **Onde encaixa no funil:** no Mapa de Execução do `/metodo-funil`, o **nível 5** prescreve "VSL + advertorial". O advertorial é a **camada de cima**: anúncio frio → **advertorial** (aquece) → VSL/oferta → checkout. Ele resolve o problema de mandar tráfego frio direto pra uma oferta (que não converte porque a pessoa ainda não sabe que tem o problema).

---

## Como usar

Quando você pedir pra montar/estruturar um advertorial, página de pré-venda ou conteúdo editorial de aquecimento:

1. **Carregar o KB** (`KB-advertorial-funil.md`) pra ter a anatomia e os tipos de lead na mão.
2. **Confirmar o nível de consciência.** Advertorial é a peça do **nível 5 (frio)**. Se o público já é nível 3+ (consciente da solução/produto), o advertorial é exagero — provavelmente o caso é página de vendas ou VSL direta. (ver Veto conditions)
3. **Coletar 3 inputs** (perguntar só os que não vieram no briefing):
   - **Nicho / mercado** (ex.: renda extra, saúde, produtividade, IA pra marketing)
   - **Produto / transformação** + a **oferta** pra onde o advertorial vai levar (a VSL, a página, o webinário)
   - **Público frio** — de onde ele vem (tráfego frio de ads? descoberta orgânica?) e qual a **dor latente** que ele ainda não nomeou
4. **Rodar as 6 fases** abaixo, preenchendo cada bloco com o caso real.
5. **Entregar a estrutura completa** pra você aprovar — NUNCA subir/publicar nada sem OK. A skill só estrutura.
6. **A copy aplicada é gerada nesta skill** a partir do `projetos/{slug}/copy.md` (fundação do /copy-funil): o texto editorial completo sai daqui, a partir da estrutura definida nas fases — o aluno revisa e aprova. Nunca de cabeça.

---

## A regra de ouro (o teste de Jim Rutz)

Um advertorial só funciona se passar neste teste:

> **"Se eu apagasse o caminho pra oferta, isso ainda valeria a pena ser lido?"**

Se a resposta é **sim**, você tem um advertorial. Se é **não**, você tem um anúncio disfarçado — e o público frio fecha a aba. *"O melhor anúncio não parece anúncio."* (Jim Rutz)

---

## O Framework — 6 Fases

Monte nesta ordem (topo → fundo). Cada fase prepara a próxima — é uma **ponte de crença** do estranho frio até a oferta.

### Fase 1 — Lead / Hook editorial

Como abre. **Parece manchete de matéria, não headline de anúncio.** Escolha 1 dos tipos de lead (detalhe no KB §Tipos de Lead):

| Tipo de lead | Quando usar |
|--------------|-------------|
| **Descoberta** | há um "novo dado/método/breakthrough" pra revelar |
| **Jornada pessoal** | uma pessoa real que saiu do problema pra transformação |
| **Exposé** | uma "verdade que escondem" sobre o mercado |
| **Mistério / paradoxo** | um fato curioso e contraintuitivo que prende |
| **Dateline / cena** | abre num lugar/cena concreta ("Numa sala em...") |

> Regra: a abertura **abre um loop de curiosidade** que o público frio precisa fechar. NUNCA abre com "Você quer [resultado]?" (cara de anúncio).

### Fase 2 — Narrativa (história que prende)

A história é o veículo. Ela **baixa a guarda** do público frio porque, imerso numa história, ele não está analisando nem resistindo — está experimentando. Aqui você ainda **não vendeu nada**; está construindo o cenário onde o problema vive.

### Fase 3 — Agitação do problema (plantar a dor latente)

O coração do advertorial pro nível 5. O público **ainda não sabe que tem o problema** — esta fase **nomeia a dor** pra ele e mostra o custo de não resolver. Sai daqui com a pessoa pensando *"isso sou eu"*. Sem esta fase, o nível 5 nunca avança pro nível 4 (consciente do problema).

### Fase 4 — Mecanismo único (por que falhou antes + a nova categoria)

Explica **por que as tentativas comuns falham** (mecanismo do problema) e apresenta a **categoria nova** que resolve (mecanismo da solução). É o que faz a pessoa pensar *"então é por isso que nunca funcionou — e isto aqui é diferente"*. Dá nome ao método.

> Regra (Alan): primeiro o **mecanismo do problema**, depois o **mecanismo da solução**. Sem mecanismo do problema, a solução parece "mais um curso".

### Fase 5 — Prova costurada como editorial

Prova que sustenta a crença, **sem parecer depoimento de anúncio**: estudo de caso contado como reportagem, dados/números com fonte, citação de autoridade, "como funciona na prática". Para público frio, **estudo de caso > depoimento puro** (regra de casamento do método: depoimento só converte no nível 2).

### Fase 6 — Transição pra oferta + CTA suave

A virada do editorial pra oferta tem que ser **uma conclusão lógica, não um pitch abrupto**. Padrão: *"o que levanta uma pergunta óbvia: como ter acesso a isso?"* → leva pra **VSL/oferta**. CTA em tom de **convite** ("descubra", "veja como funciona"), nunca "compre agora".

> O advertorial **não fecha a venda** — ele entrega o lead aquecido (agora nível 3-4) pra próxima peça (VSL/página). É lá que a oferta acontece.

---

## Casamento com o nível 5 (por que o advertorial é a peça certa)

| Onde o público frio (nível 5) trava | Como o advertorial resolve |
|-------------------------------------|----------------------------|
| Não sabe que tem o problema | Fase 3 **planta e nomeia** a dor |
| Não confia (tráfego frio, te viu agora) | Formato editorial **baixa a guarda**; prova costurada gera crença |
| Mandar direto pra oferta não converte | Advertorial **aquece** e entrega o lead já no nível 3-4 pra VSL |
| Depoimento não funciona com frio | Usa **estudo de caso / dados**, não depoimento |

> *"Em média, 80% a 90% do mercado está inconsciente."* (nível 5). O advertorial é como você fala com a maior parte do mercado sem queimar o tráfego numa oferta que eles ainda não estão prontos pra ouvir.

---

## Template de Saída

Entregar sempre neste formato, preenchido com o caso real:

```markdown
# Advertorial — [Produto] ([Nicho]) → leva pra [oferta/VSL]

## Diagnóstico
- Nível de consciência: 5 (frio) — justificativa
- Dor latente que o público ainda NÃO nomeou: ...
- Oferta de destino (pra onde o CTA leva): ...

## Estrutura (6 fases)
1. Lead / Hook editorial — tipo: [descoberta/jornada/exposé/mistério/dateline] — esqueleto
2. Narrativa — quem/onde/qual cena, o loop que abre
3. Agitação do problema — a dor nomeada + custo de não resolver
4. Mecanismo único — mecanismo do problema → mecanismo da solução (nome do método)
5. Prova editorial — [estudo de caso / dados / autoridade] costurada como reportagem
6. Transição + CTA suave — frase de virada → destino [VSL/página] → CTA convite

## Teste de Rutz
- Se eu apagasse o CTA, isso valeria como leitura? [sim/não — se não, reforçar valor editorial]

## Próxima peça
- Lead aquecido (agora nível ~3-4) → /vsl-funil ou /pagina-vendas-funil
- Copy aplicada do texto editorial → gerada nesta skill a partir do copy.md (auditoria na validação do /copy-funil)
```

---

## Output (o que a skill entrega)

1. **Diagnóstico** — confirmação do nível 5 + a dor latente + a oferta de destino.
2. **Estrutura das 6 fases** — cada uma preenchida com a copy aplicada gerada a partir do `copy.md` (ou esqueleto/placeholder, se o aluno optar por seguir sem `copy.md`).
3. **Tipo de lead editorial** escolhido + por quê.
4. **Teste de Rutz** aplicado (vale sem o CTA?).
5. **Encaixe no funil** — qual peça vem depois (VSL/página).

> A **copy aplicada** (texto editorial completo) é gerada nesta skill a partir do `copy.md` — você revisa e aprova. A skill também estrutura o advertorial e mapeia o que entra em cada fase.

---

## Regras

**SEMPRE:** confirmar que o público é **nível 5 (frio)** antes de montar · abrir com **lead editorial** (parece matéria, não anúncio) · **plantar e nomear a dor** (Fase 3) · mecanismo do problema **antes** do mecanismo da solução · prova como **estudo de caso/dados** (não depoimento) · transição **natural** pra oferta · CTA em tom de **convite** · passar no **teste de Rutz** (vale sem o CTA?) · você [aluno] revisa antes de qualquer coisa.

**NUNCA:** abrir com "Você quer [resultado]?" (cara de anúncio) · usar **depoimento puro** pra público frio · vender o produto no advertorial (ele aquece, a oferta é na VSL/página) · pular a agitação do problema (o nível 5 não avança sem ela) · CTA "compre agora" (é convite) · encher de fluff sem valor (quebra o teste de Rutz) · subir/publicar (a skill só estrutura).

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Público não é nível 5 (já é consciente da solução/produto) | PARAR → provavelmente o caso é `/pagina-vendas-funil` ou `/vsl-funil` direto, não advertorial |
| Não sei a dor latente do público | PARAR → mapear a dor primeiro (sem ela não há Fase 3) |
| Não existe oferta/VSL de destino | PARAR → o advertorial precisa levar pra algum lugar; definir a oferta antes (`/offerbook`, `/vsl-funil`) |
| Pediram a copy pronta | Gerar nesta skill a partir do `copy.md` (sem `copy.md` → rodar /copy-funil primeiro), não de cabeça |
| Vão publicar sem revisar | PARAR → revisar a estrutura primeiro |

---

*Skill advertorial-funil v1 — funil de topo do nível 5 no método do Alan Nicolas. Modela a tradição de magalog/long-form jornalística (Jim Rutz) e os níveis de consciência (Eugene Schwartz). Estrutura genérica; a copy aplicada é gerada nesta skill a partir do copy.md (fundação do /copy-funil). Toda montagem calibra no KB-advertorial-funil.md.*

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/advertorial-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo. E aponte **UM comando só**: NADA de "alternativas paralelas", menu de opções ou lista de skills pra escolher — isso enche o aluno de dúvida e quebra o fluxo. Se existir mais de um caminho possível, escolha você (pela ordem do mapa) e aponte só ele; as outras peças continuam no mapa/Book e chegam na vez delas.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
