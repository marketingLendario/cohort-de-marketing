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

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

## Passo 0 — Checar insumos antes de rodar

- **Obrigatórios:** `offerbook.md` (a oferta/copy vem dele) e `DESIGN.md` (identidade visual dos e-mails).
- **Recomendados:** `avatar.md` (voz do cliente) e `espiao/dossie-*.md` (quebra de objeção com as brechas do concorrente).

Se faltar um obrigatório, aponte a skill que o gera (`/offerbook`, `/design-md`) e PERGUNTE se o aluno quer seguir mesmo assim.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Todo o trabalho de um nicho vive em `projetos/{slug}/` (convenção de projeto). Antes de qualquer coisa:

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; **nenhuma MAS existe `offerbook-*.md` na raiz** → é um projeto da Aula 1 ainda não migrado: **dispare a migração do pack da raiz** (a mesma lista do `/metodo-funil`, passo 2 — offerbook, avatar, espião, trends, swipe em md+html+pdf, mais `DESIGN.md`, `.cohort-brand-choice` e `pesquisa-avatar-*/`) criando `projetos/{slug}/`, em vez de mandar rodar `/design-md` de novo; **nenhuma e sem offerbook na raiz** → o funil ainda não começou. Nunca peça pro aluno mover arquivo na mão.
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
- Nicho regulado → linguagem de possibilidade, respeitando o gate de compliance do offerbook. **Saúde/regulado (médico CFM / psico CRP / jurídico OAB): a assinatura do e-mail leva nome + registro no conselho (CRM/CRP/OAB)**; depoimento de paciente/cliente não entra (vedação do conselho — troque por credencial + conteúdo educativo).

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem cara de IA na copy (regra dura).** Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro): **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem a construção "não é sobre X, é sobre Y"** (e variantes "não é X, é Y", "não se trata de X, e sim de Y") — esse contraste é assinatura de texto de IA. Afirme direto o que É, ou mostre o contraste com fato concreto do avatar. Vale pra copy aplicada gerada por esta skill.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no `/copy-funil`: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o texto final dos e-mails de cada trilha. O aluno NÃO volta pro `/copy-funil` pra isso. Se o `copy.md` NÃO existe, aponte `/copy-funil` (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do `copy.md` · voz e léxico do avatar · regra de honestidade de prova (**[SEM PROVA AINDA]**) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do `/copy-funil` (nota Hopkins + checklist Sugarman).

## Entregáveis dos e-mails (formato obrigatório)

1. **1 HTML por e-mail, pronto pra colar** (`emails/trilha-{perfil}-email-{n}.html`): HTML de e-mail REAL (layout em tabela, CSS inline, preheader oculto, merge tags da ferramenta) na versão de e-mail do DESIGN.md. Nunca entregar só o documento de copy.
2. **Índice geral clicável** (`emails/index.html`): página com cards por trilha (nº, assunto, dia de envio); cada card abre o e-mail individual. Atalhos no topo pro documento de copy, template base, pendências e mapa do funil.
3. **Documento de revisão** (`emails/trilhas.md` + `.html` + `.pdf`): a copy completa das trilhas pra leitura.
4. **Sem numeração nem notação de cadência visível pro lead:** o eyebrow, o assunto e o corpo NUNCA mostram "e-mail 2 de 4", "D+1", "D+2", "D-1", "dia 3" ou qualquer marcação de régua/agenda — isso é metadado do dono e vive só no índice (`emails/index.html`, no campo "dia de envio" do card) e no documento de revisão. O lead não pode perceber que está numa esteira.
5. **Transacionais avulsos** (confirmação de compra, entrega de acesso, recibo, boas-vindas) seguem a convenção `emails/transacional-{slug}.html` (ou o nome do tipo, ex.: `confirmacao-compra.html`) e entram no índice numa seção própria **"Transacionais"** — com o dia/momento de envio como metadado **só do índice**, nunca visível pro lead. Usam o **mesmo template base da marca** dos demais e-mails e saem nos 3 formatos. Não precisam de documento de trilhas: o `.md` fonte do próprio e-mail basta (são disparos avulsos, não uma régua).


> **Toda mensagem sai SEPARADA e com botão Copiar (regra dura).** Além do documento da peça, cada mensagem individual sai em arquivo próprio pronto pra usar: e-mail = 1 HTML por e-mail no padrão do disparador (tabela, inline, preheader, merge tags) com DOIS botões fixos no canto superior direito do preview: "Copiar texto" (só o texto do e-mail, pronto pra colar no editor da ferramenta) e "Copiar HTML" (o código LIMPO do e-mail, pronto pra colar no modo HTML da ferramenta); os botões removem a si mesmos do que é copiado; WhatsApp/DM = página com as mensagens em texto, botão "Copiar texto" em cada uma. Tudo listado num índice clicável (`emails/index.html` ou equivalente). O dono nunca precisa garimpar copy dentro de documento: é clicar, copiar, colar.

## Gate — Perfil do Projeto (ler ANTES de escrever os e-mails)

Leia o **Perfil do Projeto** no topo do `offerbook.md` (regra em `.claude/skills/_shared/perfil.md`). **Guard:** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, não force voz de especialista nem "depoimento de aluno".
- **B2B / serviço / ticket alto** → a régua **nutre até a reunião, NUNCA vende direto** por e-mail (ciclo longo). CTA = agendar/conversar, não comprar.
- **Físico / varejo local** → e-mail é secundário; o canal principal é o WhatsApp (`/whatsapp-funil`).
- **Afiliado** → e-mails levam pro checkout do produtor.
- **Integração:** não há conexão automática por API com ActiveCampaign/GoHighLevel/ManyChat. O aluno **copia e cola** o HTML/texto em cada fluxo (os botões Copiar já resolvem isso); dá pra pedir ao Claude o **prompt da automação da própria plataforma**. Deixe essa expectativa clara.

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

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
