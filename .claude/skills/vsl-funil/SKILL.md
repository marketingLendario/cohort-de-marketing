---
name: vsl-funil
description: "Estrutura um funil de VSL Direct Response do zero, seguindo o método de oferta -> funil -> escala -> ticket. Entra nicho + produto, sai a estrutura completa: oferta (dor, mecanismo do problema, mecanismo da solução), funil de VSL com upsell, plano de escala por múltiplos funis e estratégia de ticket cartão/Pix. Use quando você pedir pra montar funil, VSL, estruturar oferta Direct Response ou planejar escala de funil."
user_invocable: true
---

# Funil VSL — Direct Response

Skill que estrutura um funil de VSL (Video Sales Letter) no modelo Direct Response, do zero até a escala. Baseada no método do Alan Nicolas.

> **Promessa do método:** estruturar um funil que escala por múltiplos canais, onde o ticket de entrada é isca e o lucro real vem do upsell.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Onde salvar:** o entregável desta skill sai em **`projetos/{slug}/vsl.md`** (+ `.html` e `.pdf`).

---

## Passo 0 — Checar insumos antes de rodar

Rode `ls projetos/{slug}/` e veja o que já existe. Insumos desta skill:

- **Obrigatório:** `offerbook.md` — dele saem a dor, o mecanismo e a oferta (sai da skill `/offerbook`).
- **Recomendados:** `avatar.md` (dores e público reais), `espiao/dossie-*.md` (brechas do concorrente), `swipe/briefing-swipe-file.md` (hooks e referências validadas).

Se faltar um obrigatório, aponte a skill que o gera e **PERGUNTE** se o usuário quer seguir mesmo assim — não trave silenciosamente, não assuma.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o **projeto ativo** (ver "convenção de projeto" acima) e confira que os arquivos existem dentro dele:

```
ls projetos/ 2>/dev/null                                        # descobrir o projeto ativo (slug)
ls projetos/{slug}/copy.md projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir(em), leia deles a copy base da VSL/página do `projetos/{slug}/copy.md` e a oferta (dor, mecanismo do problema/solução, entregáveis, preço) do `projetos/{slug}/offerbook.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra estruturar o funil de VSL eu preciso da `projetos/{slug}/copy.md`, que sai da skill `/copy-funil` (e do `projetos/{slug}/offerbook.md` pra oferta, da skill `/offerbook`). Rode `/copy-funil` primeiro; quando `projetos/{slug}/copy.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Gate de adequação — o funil prescrito é este? (executar ANTES de montar)

Leia `projetos/{slug}/funil.md` (a prescrição do /metodo-funil). Se o funil prescrito NÃO for este formato, AVISE o desalinhamento — mostre o nível de consciência e o perfil de ticket que este formato exige vs. o que foi prescrito — e PERGUNTE antes de seguir: pode ser legítimo (funil futuro, funil paralelo de escala), mas nunca montar por engano. Sem `funil.md` → rode /metodo-funil primeiro (ou pergunte o nível de consciência do público).

**Este formato serve:** nível 5 (inconsciente/frio), ticket de entrada baixo (R$ 297-497) com lucro no upsell.

---

## Regra de honestidade de prova

- **Nunca inventar** depoimento, número, case ou citação. Toda prova vem do offerbook ou de pesquisa real.
- **Sem prova disponível** → use estratégia alternativa (garantia forte, bastidor, transparência) e marque `[SEM PROVA AINDA]`.
- **Nicho regulado** → linguagem de possibilidade, sem "resultado garantido" (respeite o gate de compliance do offerbook).

---

## Copy aplicada — gerada NESTA skill a partir do copy.md

> **Sem travessão (—) na copy (regra dura).** Travessão é cara de texto de IA. Em TODA copy voltada ao cliente final (headline, bullet, página, e-mail, mensagem, roteiro), reescreva com ponto, vírgula ou dois-pontos. Vale pra copy aplicada gerada por esta skill.

> **Pendências do dono em UM lugar só.** Sempre que esta skill deixar um placeholder pro dono ([DONO ...], [A PREENCHER], [PLUG ...], [SEM PROVA AINDA], [N]), registre/atualize a entrada correspondente em **`projetos/{slug}/pendencias.md`** (+ `.html` com checklist clicável; crie se não existir): O QUÊ decidir, ONDE aparece (arquivos afetados) e COMO resolver. Agrupar por DECISÃO (1 decisão resolve vários arquivos), não por arquivo. Quando o dono informar um valor, atualizar TODOS os arquivos afetados de uma vez e marcar o item. O `/status-funil` lê esse arquivo.
>
> **Book do Funil (o hub do projeto) + fecho obrigatório:** o projeto tem um hub único em **`projetos/{slug}/index.html`, o Book do Funil**: cards clicáveis de TODAS as peças já geradas, agrupados por fase (Pesquisa · Oferta e Fundação · Peças do funil · Próximas peças), cada card com badge de status (feito / em revisão / ação do dono / fila), e a seção de **pendências + mapa NO FINAL** do Book. **Todo DOCUMENTO interno gerado** (mapas, docs de copy, índices, checklists, roteiros: tudo que é do dono, nunca as páginas do lead) leva no topo um link fixo **"← Book do Funil"** de volta pro hub — de qualquer peça se volta pro Book com 1 clique. Ao terminar a skill: (1) **atualize o card da sua peça no Book** E o status da peça no mapa (`funil.md` + `funil.html`): o "VOCÊ ESTÁ AQUI" tem que apontar SEMPRE pro ponto real do dono, nunca pra etapa já vencida (crie o Book se ainda não existir, na identidade do DESIGN.md); (2) encerre com *"Preencha as pendências"* e **abra o Book no navegador** — dele o dono chega a qualquer peça e ao `pendencias.html` (checklist com CAMPO DE RESPOSTA em cada item e o botão "Copiar respostas pro Claude"). Instrua o dono: preencher os campos, clicar em Copiar respostas e COLAR de volta no chat. **Ao receber as respostas coladas, atualize todos os arquivos afetados, marque os itens no `pendencias.md`, REGENERE o `pendencias.html` refletindo o estado novo (placar aplicadas/parciais/abertas; itens aplicados em verde com o valor; parciais em laranja com o que falta; abertos com campo de resposta) e ABRA o html atualizado — o dono precisa VER o que continua pendente, não só ler no chat.**

> **Rastreamento: a página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa também não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada já sai com os snippets de **Meta Pixel** (recomendado: é o que constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código; junto com o Pixel dá o melhor rastreamento) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código. Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`. Eventos desta peça: PageView · play da VSL · profundidade de vídeo (25/50/75%) · **chegou_no_pitch** (o minuto da oferta: o KB manda pixel exatamente aí, pra remarketing) · InitiateCheckout.

> **SEM barra de revisão dentro da página (a navegação mora no Book).** A página do lead NÃO leva barra de revisão, atalhos internos nem elemento de bastidor: a navegação entre as peças (copy, mapa, quiz, e-mails, pendências) fica no **Book do Funil** (`projetos/{slug}/index.html`), fora da página. Página de venda só carrega o que o LEAD deve ver.

> **Slot de vídeo nasce com roteiro (copy aplicada do vídeo).** Página com vídeo NUNCA fica só com placeholder: gere também o ROTEIRO do vídeo (gancho, espelho/narrativa, mecanismo, convite, fecho; com fala pronta, texto na tela e notas de gravação) a partir do `copy.md`, como HTML próprio na pasta `pagina/`. Nesta skill o vídeo é a própria VSL: o roteiro completo (método Jon Benson: sugestão, amplificação, história, solução, oferta) sai como HTML próprio em `pagina/vsl-roteiro.html`, e a página da VSL inclui o botão "Ver roteiro do vídeo" DENTRO do slot do player. O dono grava a partir do roteiro e troca o slot pelo player.

Se `projetos/{slug}/copy.md` existe (fundação da copy aprovada no /copy-funil: Big Idea, mecanismos, voz/léxico, banco de headlines e bullets, objeções), esta skill GERA a copy aplicada da sua peça a partir dele — o roteiro completo da VSL (método Jon Benson: sugestão → amplificação → história → solução → oferta), integrando as headlines e bullets do banco. O aluno NÃO volta pro /copy-funil pra isso. Se `copy.md` NÃO existe, aponte /copy-funil (a fundação) e PERGUNTE se o aluno quer seguir só com a estrutura. A copy aplicada obedece: Big Idea e mecanismos do copy.md · voz e léxico do avatar · regra de honestidade de prova (`[SEM PROVA AINDA]`) · compliance de nicho sensível. Depois de aplicada, a peça pode ser auditada na fase de validação do /copy-funil (nota Hopkins + checklist Sugarman).

---

## Como usar

Quando você pedir pra montar/estruturar um funil de VSL, uma oferta Direct Response ou um plano de escala:

1. **Coletar 2 inputs** (perguntar se não vieram no briefing):
   - **Nicho** do produto (ex: renda extra, nutrição, emagrecimento, desenvolvimento pessoal, IA/marketing)
   - **Produto/transformação** que vai ser vendido
2. **Rodar as 4 fases** abaixo, preenchendo cada bloco com o caso real.
3. **Entregar a estrutura completa** pra você aprovar — NUNCA executar/subir nada sem OK.
4. A skill **gera a copy aplicada** da VSL e da página a partir do `projetos/{slug}/copy.md` (ver "Copy aplicada" acima) e da oferta definida nas fases — o aluno revisa e aprova. Nunca de cabeça.

## O Framework — 4 Fases

### Fase 1 — Construção da Oferta

A oferta nasce de 3 perguntas, nesta ordem:

| Pergunta | O que extrair |
|----------|---------------|
| **Qual a dor?** | A dor que a pessoa acorda sentindo TODOS os dias e que o produto resolve |
| **Por que ainda não resolveu?** | A pessoa já tentou e falhou — descobrir o motivo da falha |
| **Mecanismo do problema** | A causa-raiz real por que as tentativas anteriores falharam |
| **Mecanismo da solução** | O método único que resolve o mecanismo do problema |

> Regra: primeiro o **mecanismo do problema**, depois o **mecanismo da solução**. Sem mecanismo do problema, a solução parece "mais um curso".

### Fase 2 — Construção do Funil

- **Funil indicado:** VSL (Video Sales Letter)
- **Duração da VSL:** 20 a 50 minutos. **Não existe padrão** — é o tempo necessário pra convencer o lead daquilo que está sendo vendido. Mais curto se a consciência for alta, mais longo se for baixa.
- **Order bump:** NÃO recomendado nesse funil.
- **Upsell:** obrigatório e tem que converter bem — **meta de 20 a 30% direto**.
  - O upsell **NÃO é um "próximo passo"** do produto.
  - O upsell é um **facilitador** (faz o resultado vir mais rápido/com menos esforço) OU **maior acesso a você** (mentoria, grupo, contato direto).

### Fase 3 — Escala

Montou o funil e botou a VSL pra rodar → escala por **múltiplos funis simultâneos**:

1. VSL (base)
2. Time comercial
3. Webinário diário
4. Ascensão quinzenal
5. Lançamento

> A combinação desses canais é o que sustenta volume alto e recorrente. Não depender de um funil só.

### Fase 4 — Ticket e Estratégia de Pagamento

- **Ticket ideal da VSL:** R$297 a R$497 (entrada baixa de propósito).
- **O lucro vem do upsell**, não do front-end.
- **Cartão > Pix:** pra rodar One Click Buy (compra do upsell em 1 clique), a pessoa precisa ter comprado no **cartão**.
- **Alavanca de ticket:** se o ticket está baixo (ex: R$297) mas tem muita compra no **Pix**, **suba o ticket** — ticket maior empurra mais gente pro cartão, o que aumenta a taxa de upsell.

## Template de Saída

Entregar sempre neste formato preenchido com o caso real:

```markdown
# Funil VSL — [Produto] ([Nicho])

## 1. Oferta
- Dor diária: ...
- Por que não resolveu: ...
- Mecanismo do problema: ...
- Mecanismo da solução: ...

## 2. Funil
- VSL: ~[X] min (justificativa do tempo pela consciência do lead)
- Order bump: não
- Upsell: [facilitador OU maior acesso] — meta 20-30% conversão

## 3. Escala
- [ ] VSL
- [ ] Time comercial
- [ ] Webinário diário
- [ ] Ascensão quinzenal
- [ ] Lançamento

## 4. Ticket
- Front-end: R$[297-497]
- Estratégia cartão/Pix: ...
- Upsell (onde está o lucro): R$... — ...
```

## Regras

- Sempre **mostrar a estrutura pra você revisar** antes de qualquer execução — nunca subir copy/página sem OK.
- Copy da VSL/página: esta skill gera a copy aplicada a partir do `projetos/{slug}/copy.md` e da oferta definida nas 4 fases — o aluno revisa e aprova. Nunca de cabeça.
- Números (ticket, % de upsell) são **referências do método** — validar contra os dados reais do seu negócio antes de prometer em público.
- Este é um framework de **referência** — ao aplicar no SEU produto, adapte ao seu contexto (público, oferta, tickets reais).

---

**Método:** Alan Nicolas

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/vsl-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check: `ls "/Applications/Google Chrome.app" 2>/dev/null`. **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P > Salvar como PDF).

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com `open <arquivo>.html` (macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.
