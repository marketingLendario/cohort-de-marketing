---
name: email-funil
description: Gera emails de funil (convite, confirmação, lembrete, recap, nurture e venda) aplicando a SUA identidade visual via design.md, usando o método de email do Alan Nicolas. Usar sempre que você precisar de um email para o seu negócio.
---

# Email Funil — gerador de emails de funil

Gera emails HTML prontos para colar na sua ferramenta de disparo, aplicando o método de email do Alan Nicolas com a identidade visual da sua própria marca.

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatórios:** `offerbook.md` (a oferta/copy vem dele) e `DESIGN.md` (identidade visual dos e-mails).
- **Recomendados:** `avatar.md` (voz do cliente) e `espiao/dossie-*.md` (quebra de objeção com as brechas do concorrente).

Se faltar um obrigatório, aponte a skill que o gera (`/offerbook`, `/design-md`) e PERGUNTE se o aluno quer seguir mesmo assim.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Todo o trabalho de um nicho vive em `projetos/{slug}/` (convenção de projeto). Antes de qualquer coisa:

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos das etapas anteriores existem:**

```
ls projetos/{slug}/DESIGN.md projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir(em), leia deles a identidade visual da sua marca (cores, fontes, header, footer, logo, assinatura) do `projetos/{slug}/DESIGN.md` e o contexto da oferta (produto, transformação, tom) do `projetos/{slug}/offerbook.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra gerar os emails com a cara da sua marca eu preciso do `projetos/{slug}/DESIGN.md`, que sai da skill `/design-md` (e do `projetos/{slug}/offerbook.md` pro contexto da oferta, da skill `/offerbook`). Rode `/design-md` primeiro; quando `projetos/{slug}/DESIGN.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Fonte do visual
- **Identidade visual:** o visual vem do SEU `DESIGN.md` (gerado pela skill `design-md`). Cores, fontes, header, footer, logo — tudo sai de lá. Esta skill não fixa nenhuma cor, fonte ou logo: ela aplica o que está no seu DESIGN.md.
- **Regras de tom/marca:** este arquivo + o seu DESIGN.md (voz da marca, assinatura, idioma).

## Fluxo
1. Pegue o briefing: **tipo** de email + **assunto** + **conteúdo** (o que comunicar) + **CTA** (texto + link/destino).
2. Leia o seu `DESIGN.md` e monte o HTML aplicando as cores, fontes, header e footer da sua marca. Preencha os blocos: preheader, eyebrow, headline, subheadline, parágrafos, cards (opcional), CTA, fecho.
3. Salve o arquivo em `projetos/{slug}/emails/`, nomeando por tipo e tema.
4. Rode o **checklist** (abaixo) ANTES de entregar.
5. Abra o HTML para você revisar — nunca dispare a copy sem você revisar.

## Identidade visual (vem do SEU DESIGN.md)
Aplique sempre o que está definido no seu DESIGN.md. A estrutura típica de um email é:
- **Header:** cor de fundo, eyebrow (uppercase, com letter-spacing), headline e subheadline — todos nas cores e fontes da sua marca.
- **Corpo:** fundo e cor de texto da sua marca, 16px, line-height 1.6.
- **CTA:** botão na cor de destaque da sua marca, com bom contraste de texto, cantos arredondados, padding confortável. **Sempre centralizado** no e-mail (nunca alinhado à esquerda): em HTML de e-mail, centralize do jeito compatível com os clientes — `<td align="center">` na tabela envolvendo o botão (não confie só em `margin: 0 auto`).
- **Cards (foto + texto):** foto redonda com borda na cor de destaque; eyebrow em tom de apoio.
- **Footer:** com a assinatura, logo e links da sua marca, conforme o DESIGN.md.
- **Preheader oculto** (preview da caixa de entrada) sempre no topo, seguido de um spacer.

Se algum elemento não estiver no DESIGN.md, gere o DESIGN.md primeiro (skill `design-md`) — não invente cores nem fontes fixas.

## Regras de tom e marca (NON-NEGOTIABLE)
- **A assinatura é a da sua marca**, conforme o DESIGN.md (você define se assina como a empresa, a equipe ou uma pessoa).
- **Sem emoji** no corpo.
- **Acentuação perfeita** no idioma do email.
- **Nomes de marcas/produtos sempre corretos** (confira a grafia exata).
- **Conferir o texto inteiro** (ortografia, acentuação, nome de marca) antes de fechar.
- Personalização: use a variável de primeiro nome da sua ferramenta de disparo (ex.: um merge tag de FIRSTNAME).
- Evite o contraste espelhado "não é sobre X, é sobre Y".

## Honestidade de prova (NON-NEGOTIABLE)

- **Nunca invente** depoimento, número, case ou citação nos e-mails. Prova vem do `offerbook.md`/pesquisa — nunca da imaginação.
- Sem prova real → use garantia, bastidor ou transparência, e marque o trecho com **[SEM PROVA AINDA]**.
- Nicho regulado → linguagem de possibilidade, respeitando o gate de compliance do offerbook.

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo o par de navegação: **"← Voltar"** (volta pra página de onde o leitor veio: `<a href="../index.html" onclick="if(history.length>1){history.back();return false}">` — usa o histórico do navegador, com o Book como fallback quando o arquivo foi aberto direto) e **"← Book do Funil"** (link fixo pro hub). Quem clica numa VSL a partir de uma página e volta, volta PRA PÁGINA, não pro Book. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto final dos e-mails de cada trilha. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

## Entregáveis dos e-mails (formato obrigatório)

1. **1 HTML por e-mail, pronto pra colar** (`emails/trilha-{perfil}-email-{n}.html`): HTML de e-mail REAL (layout em tabela, CSS inline, preheader oculto, merge tags da ferramenta) na versão de e-mail do DESIGN.md. Nunca entregar só o documento de copy.
2. **Índice geral clicável** (`emails/index.html`): página com cards por trilha (nº, assunto, dia de envio); cada card abre o e-mail individual. Atalhos no topo pro documento de copy, template base, pendências e mapa do funil.
3. **Documento de revisão** (`emails/trilhas.md` + `.html` + `.pdf`): a copy completa das trilhas pra leitura.
4. **Sem numeração nem notação de cadência visível pro lead:** o eyebrow, o assunto e o corpo NUNCA mostram "e-mail 2 de 4", "D+1", "D+2", "D-1", "dia 3" ou qualquer marcação de régua/agenda — isso é metadado do dono e vive só no índice (`emails/index.html`, no campo "dia de envio" do card) e no documento de revisão. O lead não pode perceber que está numa esteira.


> **Toda mensagem sai SEPARADA e com botão Copiar (regra dura).** Além do documento da peça, cada mensagem individual sai em arquivo próprio pronto pra usar: e-mail = 1 HTML por e-mail no padrão do disparador (tabela, inline, preheader, merge tags) com DOIS botões fixos no canto superior direito do preview: "Copiar texto" (só o texto do e-mail, pronto pra colar no editor da ferramenta) e "Copiar HTML" (o código LIMPO do e-mail, pronto pra colar no modo HTML da ferramenta); os botões removem a si mesmos do que é copiado; WhatsApp/DM = página com as mensagens em texto, botão "Copiar texto" em cada uma. Tudo listado num índice clicável (`emails/index.html` ou equivalente). O dono nunca precisa garimpar copy dentro de documento: é clicar, copiar, colar.

## Tipos de email (esqueleto)
- **Convite (evento/live):** eyebrow do evento → headline com a promessa → corpo (o que a pessoa vai ver) → agenda/cards → CTA. Se quiser aplicar uma tag no clique, aponte o botão para um endpoint do seu sistema que aplique a tag e redirecione.
- **Confirmação:** "Inscrição confirmada, [nome]" → o que esperar → agenda → reforço do ao vivo.
- **Lembrete (dia do evento):** "Hoje, [horário]" → o que vai rolar → botão **"Entrar agora"** com o LINK do evento.
- **Recap (manhã seguinte):** o que rolou → quem esteve ao vivo já pegou o material → gancho para a próxima.
- **Nurture:** história/valor → 1 ideia → CTA leve.
- **Venda:** oferta → prova → CTA forte. A copy de conversão é gerada nesta skill a partir do `copy.md` (quando ele existe); você revisa e aprova.

## Checklist antes de entregar
- [ ] Preheader preenchido (preview da caixa de entrada)
- [ ] Variável de primeiro nome onde personalizar
- [ ] CTA com texto e destino certos (lembrete = link do evento; convite = endpoint/página de obrigado)
- [ ] Botão de CTA centralizado (`<td align="center">` na tabela do botão)
- [ ] Nenhuma notação de cadência visível pro lead (nada de "D+1", "D+2", "e-mail 2 de 4", "dia 3" no eyebrow, assunto ou corpo)
- [ ] Sem emoji · acentuação ok · nomes de marca corretos
- [ ] Visual aplicado conforme o seu DESIGN.md (cores, fontes, header, footer, assinatura)
- [ ] Texto relido inteiro (ortografia, marca)
- [ ] Arquivo salvo e aberto para você revisar

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/email-funil/scripts/gerar_pdf.sh <arquivo>.html
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
