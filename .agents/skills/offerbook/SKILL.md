---
name: offerbook
description: "Preenche o Offerbook (Livro da Oferta — Story Selling) de um produto/oferta. Cria o documento, extrai o avatar de uma fonte de pesquisa real, escreve o conteúdo na voz da marca e organiza em blocos separados. Tudo o que a skill precisa está neste arquivo — nenhum arquivo externo é necessário."
user_invocable: true
---

# Offerbook (Livro da Oferta)

## Posição na Aula 01

Esta é a **Skill 5 de 5 (última)** da Aula 01 do Cohort de Marketing.

**Sequência:** `/avatar-funil` → `/espiao-do-concorrente` → `/trend-hunting` → `/swipe-file` → `/offerbook` (você está aqui).

### Gate de pré-requisito (executar ANTES de qualquer coisa)

Antes de começar, **verifique no diretório atual** os 3 inputs esperados:

```
ls relatorio-avatar.md pesquisa-avatar-*/relatorio-avatar.md projetos/*/avatar.md 2>/dev/null
ls dossie-*.md 2>/dev/null
ls briefing-swipe-file.md 2>/dev/null
```

**Checklist de pré-requisitos:**

| Input | Skill que gera | Obrigatório? |
|---|---|---|
| `relatorio-avatar.md` | `/avatar-funil` | **SIM** (sem avatar, offerbook vira ficção) |
| `dossie-{concorrente}.md` (1+) | `/espiao-do-concorrente` | **SIM** (sem concorrente, posicionamento vira chute) |
| `briefing-swipe-file.md` | `/swipe-file` | Recomendado (sem ele, copy fica sem referência) |

**Se faltar `relatorio-avatar.md` OU nenhum dossiê existir**, exiba este aviso:

> Detectei que faltam inputs essenciais pra montar um offerbook de qualidade. Sem eles, o offerbook vira ficção (e isso quebra a regra-mãe da Aula 01).
>
> Faltando:
> - [ ] `relatorio-avatar.md` → rode `/avatar-funil [nicho]`
> - [ ] Pelo menos 1 `dossie-{concorrente}.md` → rode `/espiao-do-concorrente [nome]`
> - [ ] `briefing-swipe-file.md` → rode `/swipe-file briefing`
>
> Recomendo voltar e rodar as skills faltantes. Quer continuar mesmo assim? (s/n)

Se o usuário responder `n`, encerre dizendo: *"Beleza. Rode as skills acima e volte aqui depois. O offerbook fica muito melhor com a fundação completa."*

Se responder `s`, prossiga mas:
- Marque no offerbook (Bloco 1 — Materiais) o que estava faltando
- Use o aviso "SEM DADO NA PESQUISA" nos campos que dependeriam do input ausente
- No fim, adicione na seção "Lacunas e Próximos Passos" que o offerbook foi gerado parcialmente

**Se TODOS os inputs existirem**, leia-os antes de começar (avatar + dossiês + briefing) e mencione: *"Encontrei: 1 avatar + {N} dossiês de concorrentes + 1 briefing de swipe-file. Vou usar como fundação."*

---

Esta skill produz o **Offerbook** de uma oferta: o brief de Story Selling que fundamenta TODA a copy depois (LP, e-mails, ads). Regra-mãe: **toda oferta nova começa pelo offerbook**, antes de qualquer copy.

Este arquivo é **autossuficiente**: a estrutura completa, o passo a passo, as regras e o checklist estão todos aqui dentro. Não depende de nenhum template, banco de dados ou pasta externa.

---

## Quando usar

- Início de qualquer oferta/produto novo.
- Gatilhos: "offerbook", "livro da oferta", "preencher offerbook", "monta a oferta de [produto]".

## Como ativar

`/offerbook [produto]` — ex.: `/offerbook curso-de-ingles`.
Se não vier o nome do produto, **pergunte qual é a oferta e PARE** até receber a resposta.

### Gate — PERFIL DO PROJETO (perguntar ANTES do Bloco 2 — grava no topo do offerbook, e PARA até responder)

O offerbook não é só de infoproduto de especialista. Antes de preencher a oferta, defina o **Perfil do Projeto**: 6 campos que viram o cabeçalho do offerbook e que **TODAS as skills seguintes leem** (`/metodo-funil` e as peças) pra não puxar tudo pra "curso de especialista". O que der pra ler de material existente, leia; o resto, pergunte em opção clicável. Grave assim no topo:

```
## Perfil do Projeto
- Situação de partida: [rodando | do-zero | sem-projeto | afiliado]
- Tipo de oferta: [especialista | físico/varejo-local | saas-app | serviço | b2b]
- Quem opera: [dono | agência (pra cliente)]
- Nicho regulado: [não | saúde/médico | jurídico | psico | financeiro]
- Voz: [pessoa | marca]
- Ticket: [baixo | médio | alto (5k+) | premium]
```

**1. Situação de partida** (decide se o offerbook começa do avatar ou puxa ativos):
- **rodando** (já tem oferta/produto no ar) → PUXE ativamente o que já existe: fluxo comercial atual, o que entrega, oferta em uso, pesquisas/ICP anteriores, design.md. Não recrie do zero.
- **do-zero** (tem a ideia, não lançou) → fluxo normal do offerbook.
- **sem-projeto** (não tem oferta nem ideia) → PARE o offerbook e aponte `/avatar-funil` no **modo research-first** (acha a oportunidade a partir das habilidades/contexto da pessoa); **volte com o NICHO/projeto escolhido — a oferta é o próprio offerbook que se constrói com você aqui (fluxo do-zero)**. Não espere ter "uma oferta pronta" antes de voltar: o nicho escolhido já basta pra começar.
- **afiliado** (vai promover produto de terceiro) → o afiliado **GRAVA SIM** um `projetos/{slug}/offerbook.md`, só que no formato **"Registro da Oferta do Produtor"** (não um offerbook autoral): Perfil do Projeto no topo (com `Situação de partida: afiliado`) + **produto, promessa, preço, comissão, link de afiliado, página oficial do produtor**, e a curadoria de valor vira "**o que o PRODUTOR entrega**" (você não promete nada que não seja dele). O funil do afiliado foca em criativo + página-ponte + tráfego, lendo essa oferta. Importante: esse Registro **é o offerbook dele** — TODAS as skills seguintes o tratam como tal e os gates de pré-requisito passam normalmente (nada de "afiliado não tem offerbook").

**2. Tipo de oferta** (muda o Bloco 2):

| Tipo | O que muda no Bloco 2 |
|------|------------------------|
| **Especialista / infoproduto** | módulos + técnica de cada um · autoridade = especialista + depoimentos |
| **Produto físico / varejo local** | linha/variações + o que resolve · autoridade = prova de uso (reviews, antes/depois) · **funil pode ser local/regional (presença, WhatsApp, Google/Maps), não checkout online** |
| **SaaS / app / software** | features + casos de uso + diferencial técnico · autoridade = **voz do cliente** + prova de resultado |
| **Serviço** (agência, consultoria, feito-pra-você) | escopo + entregáveis + processo · autoridade = cases + credencial de quem executa |
| **B2B / high-ticket** | jornada/ciclo de compra (venda longa com qualificação), decisor vs. usuário, quente vs. frio |

Quando não houver especialista humano (app, produto, SaaS), NÃO force "Autoridade (Especialista)" — use voz do cliente / prova de uso.

**3. Quem opera** — **dono** (é o próprio negócio) ou **agência** (monta pra um cliente/terceiro). Se agência: 1 cliente = 1 projeto/pasta (nunca misturar); a voz e as decisões são do CLIENTE, não do operador; e o offerbook pode oferecer uma "versão cliente" (sem bastidor) no fecho.

**4. Nicho regulado** — se saúde/médico/jurídico/psico/financeiro, liga o compliance certo (linguagem de possibilidade; regras de publicidade do conselho — CFM/OAB/etc.; nada de promessa de cura/resultado garantido). Detalhe no Gate de compliance abaixo.

**5. Voz** — pessoa (especialista/fundador) ou marca (persona da marca, do copy.md/DESIGN.md). Ver Bloco 2 › Voz da marca.

**6. Ticket / faixa de valor** — baixo · médio · alto (5k+) · premium. É decisor do funil (baixo → venda direta VSL/quiz; alto/B2B → webinário/quiz → marcar reunião). O valor detalhado (âncora, stack, bônus) fica no Bloco 2; aqui só a faixa.

---

## Gate — Compliance por nicho com conselho (ler o Perfil › campo "Nicho regulado")

Se o campo **Nicho regulado** do Perfil do Projeto for diferente de "não", a copy do offerbook (promessa, USP, história, ads) segue as regras de publicidade do conselho da profissão. Regra-mãe de todos: **linguagem de possibilidade, nunca de garantia** — proibido prometer cura, resultado garantido, "antes e depois" milagroso ou sensacionalismo. Um "conselho" aqui é o órgão que fiscaliza a profissão e pode multar/cassar quem anuncia errado.

| Nicho | Conselho | Regras de publicidade que a copy respeita |
|-------|----------|--------------------------------------------|
| **Médico / saúde** | CFM (Resolução 1.974/2011 e Manual de Publicidade Médica) | Proibido: prometer cura, garantir resultado, divulgar "antes e depois", usar depoimento de paciente, sensacionalismo, autopromoção, concorrer preço/desconto de procedimento. Sempre citar nome + CRM do responsável. Foto de paciente só com autorização e sem fim de comparação. |
| **Advocacia / jurídico** | OAB (Provimento 205/2021 do Código de Ética) | Publicidade só informativa e moderada — proibido: captação/mercantilização (angariar cliente), prometer êxito ou resultado da causa, divulgar valores/honorários como promoção, usar "melhor advogado"/superlativos, depoimento de cliente. Nada de linguagem de "vende-se". |
| **Psicologia** | CFP (Código de Ética + Resolução 010/2005) | Proibido: garantir resultado/cura, criar sensacionalismo ou alarde social, usar depoimento de paciente, prometer atendimento infalível. Sempre nome + CRP. Anúncio informativo, sem estimular demanda por autoafirmação. |
| **Financeiro / investimentos** | CVM (Resolução 179) + ANBIMA + regras BACEN | Proibido: prometer rentabilidade/lucro garantido, "renda garantida", omitir riscos. Toda promessa de retorno exige aviso de risco e ressalva de que resultado passado não garante futuro. Se houver oferta de valor mobiliário, respeitar registro/dispensa da CVM. |

**Como aplicar no offerbook:**
- Marque o nicho e o conselho no Bloco 1 (Materiais) e repita o aviso no topo do Bloco 7 (Copy), pra quem for escrever LP/e-mails/ads já entrar travado nas regras.
- Reescreva promessa e USP em **linguagem de possibilidade** ("pode ajudar a", "muitos relatam", "foi desenhado para") — nunca "cura", "garante", "resultado certo".
- Todo depoimento em nicho que proíbe (médico, jurídico, psico) sai da copy e vira anotação em "Lacunas" com o motivo — não some sem registro.
- Na dúvida sobre uma peça específica, marque em "Lacunas e Próximos Passos" (dono da oferta) como "validar com o jurídico/conselho antes de publicar". Nunca invente que algo é permitido.

Se o Perfil ainda não trouxe o nicho definido, **pergunte** ("Esse produto é de saúde, advocacia, psicologia ou financeiro? Ou nenhum?") e só então siga — em opção clicável, em linguagem de leigo. Ver `.claude/skills/_shared/perfil.md` (ler o Perfil do Projeto; guard: se Voz=marca ou Tipo ∈ {físico, saas-app, serviço, b2b}, é proibido enquadrar como especialista/curso/depoimento-de-aluno) e `.claude/skills/_shared/nunca-travar.md` (pré-requisito e termo técnico sempre explicados em linguagem de leigo).

---

## Pré-requisitos (o que você precisa ter à mão)

1. **Um documento de destino** — pode ser um Google Doc, Notion, Word ou Markdown. Use a estrutura de 7 blocos abaixo. (Se tiver um template próprio, duplique-o e preencha a cópia; **nunca edite o template original**.)
2. **Uma fonte de pesquisa de avatar REAL** — formulários, pesquisas, respostas de leads, entrevistas, comentários, depoimentos. O Avatar e a Análise de Cliente saem **daqui**, com número (N), porcentagem e citações literais. Onde não houver dado: escreva **"SEM DADO NA PESQUISA"**.
3. **Materiais já existentes da oferta** — qualquer transcrição, depoimento, grade do produto, hooks, e-mails aprovados, guia de voz da marca. Regra: **não recriar o que já existe, não inventar dado.**

---

## Pipeline (passo a passo)

1. **Gerar o `briefing-offerbook.md`** — antes de escrever o offerbook, consolidar inputs em 1 arquivo curto (1-2 páginas) que será o checklist de fontes:

   ```markdown
   # Briefing Offerbook — [Produto]

   ## Inputs disponíveis (checklist)
   - [ ] `relatorio-avatar.md` — caminho: ...
   - [ ] `dossie-{concorrente}.md` (1+ concorrentes) — caminhos: ...
   - [ ] `briefing-swipe-file.md` — caminho: ...
   - [ ] Depoimentos/cases (N=?)
   - [ ] Voz da marca / DESIGN.md
   - [ ] Materiais existentes (transcrições, e-mails aprovados, etc.)

   ## Decisões prévias do dono da oferta
   - Promessa central (1 frase): ...
   - Mecanismo único (nome interno): ...
   - Preço-âncora pretendido: ...
   - Garantia: ...
   - Bônus já confirmados: ...

   ## Lacunas conhecidas (vão pra "Lacunas e Próximos Passos")
   - ...

   ## Autorização do dono
   - [ ] Dono da oferta aprovou esse briefing para virar offerbook
   ```

   **Regra:** se o briefing ficar com mais de 30% de campos vazios ou sem `relatorio-avatar.md`, **PARAR e pedir os dados antes** de escrever o offerbook. Offerbook sem briefing aprovado = ficção.

2. **Criar o documento** "Offerbook — [Produto]" (cópia de um template, ou do zero usando a estrutura abaixo).
3. **Checar o que já existe** antes de produzir (materiais da oferta, pesquisas, depoimentos, voz da marca). Não inventar.
4. **Avatar e Análise de Cliente vêm da pesquisa real** (obrigatório). Trazer N, % e citações literais dos leads/clientes. Onde faltar dado: "SEM DADO NA PESQUISA".
5. **Escrever o conteúdo** (Oferta, História, Copy) com dados reais + a voz da marca.
6. **Organizar em blocos/guias separadas**, uma por bloco: Capa e Materiais · Posicionamento (Oferta) · Avatar · História · Análise de Cliente · Copy · Lacunas.
7. **Lacunas:** o que não dá pra inventar (datas, stack oficial, bônus da turma, garantia, links) vai numa seção "Lacunas e Próximos Passos", separado **por quem resolve** (dono da oferta vs. equipe de marketing).
8. **Apresentar e conferir campo a campo** contra a estrutura antes de declarar "completo".

> Só depois do offerbook aprovado é que se escreve LP, e-mails e ads.

---

## Estrutura completa (os 7 blocos)

Preencher TODOS os campos. Não reorganizar, não resumir, não pular campo.

### 1. Materiais
- Links de Social Media / URLs (Instagram, Página de vendas, Checkout)
- Materiais de apoio
- Conteúdos de referência
- *(Materiais = links que a equipe abre. Sem link ainda → "A ADICIONAR".)*

### 2. Posicionamento › Oferta
- **Tipo de oferta** (do Gate de Tipo de Oferta): especialista/infoproduto · produto físico · SaaS/app · serviço · B2B/high-ticket
- Nome do produto
- Promessa
- USP (proposta única de venda)
- Valor, ancoragem e bônus (responder as 9 perguntas de valor)

> **Curadoria de bônus (perguntar antes de listar como oferta).** Para CADA bônus sugerido, pergunte ao dono da oferta: *"Consegue entregar isso? (sim / não)"* — bônus que ninguém entrega vira promessa quebrada e derruba a oferta inteira. Só entra na stack de valor o que for **sim**. O que for "não" vai pra "Lacunas e Próximos Passos" (dono da oferta) como "produzir bônus X" — nunca some, mas também não entra como se já existisse.
>
> **Quem GERA os bônus curados aqui é a `/bonus-funil`.** Este offerbook só faz a curadoria (lista + "consegue entregar?") e guarda os roteiros de áudio/vídeo como pendência. Os entregáveis de fato dos bônus (o ebook, o workbook, o checklist, o guia, o voucher, a calculadora, o roteiro pronto pra gravar) são produzidos pela skill `/bonus-funil`, que lê esta curadoria e o Perfil do Projeto pra gerar o bônus certo pro tipo de negócio. Aponte-a quando o dono quiser "criar os bônus".
>
> **Bônus de áudio ou vídeo (aula-bônus, meditação guiada, série de vídeos, áudio motivacional):** o offerbook NÃO é o entregável final desses. A skill gera o **ROTEIRO** do áudio/vídeo (script pronto pra gravar) e manda o roteiro pra "Lacunas e Próximos Passos" como pendência de produção — ex.: *"gravar áudio 'X' (roteiro pronto no offerbook)"*. Nunca entregue o roteiro como se fosse o bônus pronto: o bônus só existe quando o dono da oferta grava. Roteiro = insumo; gravação = entregável.
>
> Se o termo confundir: **bônus** é um extra que aumenta o valor percebido da oferta (algo a mais que a pessoa ganha ao comprar); **roteiro** é o texto que guia a gravação, não o material final. Ver `.claude/skills/_shared/nunca-travar.md` (pré-requisito e insumo sempre em linguagem de leigo; nunca prometer que algo se produz sozinho — sempre o passo de quem produz).
- **O que a pessoa recebe** (adaptar ao tipo):
  - infoproduto → módulos + a técnica de cada um
  - produto físico → linha/variações + o que cada uma resolve
  - SaaS/app → features + casos de uso + diferencial técnico
  - serviço → escopo + entregáveis + processo
- **Autoridade / prova** (adaptar ao tipo):
  - especialista → quem assina + credencial + depoimentos
  - produto/SaaS/app → prova de uso (reviews, antes/depois, "antes eu levava X, agora minutos")
  - serviço → cases + credencial de quem executa
  - (nunca inventar especialista/credencial que não existe)
- **Voz da marca** (escolha, NÃO é fallback — a `/conteudo-funil` e a `/criativos-funil` leem daqui):
  - **de uma pessoa** (especialista/fundador) → nome de quem fala; a fala real dela vira `voz-especialista.md` na skill de conteúdo
  - **da marca** → a persona da marca fala (mesmo que exista um especialista); calibra no `copy.md`/`DESIGN.md` + voz do cliente → `voz-marca.md`
  - marca/produto/app sem rosto: voz da marca é o caminho normal, não a exceção
- **(B2B) Jornada de compra:** ciclo (imediato vs. venda longa com qualificação), decisor vs. usuário, público quente vs. frio

### 3. Avatar  *(da pesquisa real)*
- Cliente ideal
- Desejo
- Problema
- Erros (o que ele já tentou e errou)
- Solução (Solução técnica + Mecanismo único + "Bambu chinês")
- Objeções
- Benefícios diretos
- Benefícios profundos

### 4. História
- Promessa · estilo · bambu chinês
- Problema · o "porquê" do problema · erros · porque não funciona
- Nome da situação do problema
- Contexto da solução · mecanismo
- Nome da situação do resultado
- Exemplo (gancho para a oferta + USP)

### 5. História v2 (versão expandida)
- [Atenção] · Boas-vindas · Promessa · Lead
- Problema (mundo atual) e consequências · porque acontece
- Como tentam resolver (erros) · porque não funciona · o que pode piorar
- Tirar a culpa · inimigo comum
- "Porquê" é outra solução · provas · mecanismo único
- Exemplo / big idea · mundo ideal
- Bônus com escassez · objeções

### 6. Análise de Cliente  *(da pesquisa real)*
- Demográfico
- Personalidade
- Armadilhas
- Dores · Dores escondidas
- Medos
- Desejos · Desejos profundos
- Vida Perfeita
- Objeções (Da promessa + Do produto)

### 7. Copy
- Ads
- Landing Page (Versão A, B, C)
- E-mails

---

## Output (4 arquivos)

A skill **sempre** entrega 4 arquivos no diretório atual:

1. **`briefing-offerbook.md`** — gerado no Passo 1 do Pipeline. Consolida inputs (avatar + concorrentes + swipe-file + decisões do dono) e serve de gate: sem briefing aprovado, não escreve offerbook.
2. **`offerbook-{slug}.md`** — fonte de verdade (Markdown com os 7 blocos completos).
3. **`offerbook-{slug}.docx`** — gerado a partir do MD com `python scripts/gerar_docx.py offerbook-{slug}.md` usando o `Template-Offerbook.docx` oficial.
4. **`offerbook-{slug}.html`** — versão visual com TOC sticky lateral, gerado com `python scripts/gerar_html.py offerbook-{slug}.md`. Útil pra navegar rápido pelos 7 blocos no browser.

> **Afiliado (`Situação de partida: afiliado`):** os arquivos entregues são o **"Registro da Oferta do Produtor"** nos mesmos 3 formatos (`.md` fonte + `.docx` + `.html`) — não um offerbook autoral, e sim o registro da oferta do produtor descrito no Gate acima. Ele ocupa o lugar do `offerbook-{slug}.md`: **TODAS as skills seguintes tratam esse registro como o offerbook do afiliado** e os gates de pré-requisito passam com ele. Não existe "afiliado sem offerbook".

Regras de geração:
- MD é a fonte de verdade. Nunca editar só o DOCX/HTML; corrigir o MD e regenerar ambos.
- Template original do DOCX NUNCA é modificado — o script faz cópia.
- Se faltar campo no MD, o DOCX gera com `[A PREENCHER]` no lugar (não falha).
- Pré-requisito DOCX: `pip install python-docx` (uma vez) — no Windows, `py -m pip install python-docx`.
- HTML não tem dependência externa (script puro Python 3).
- HTML respeita o `.cohort-brand-choice` do projeto (neutro padrão ou DESIGN.md).

### Comandos completos pra gerar os 4 arquivos

Depois de salvar o `offerbook-{slug}.md`:

```
python scripts/gerar_docx.py offerbook-{slug}.md
python scripts/gerar_html.py offerbook-{slug}.md
```

### Abrir DOCX e HTML automaticamente (entrega visual ao aluno)

Logo após gerar, **rode automaticamente** os comandos para abrir:

```
open offerbook-{slug}.docx
open offerbook-{slug}.html
```

(No Windows: `start ...`. No Linux: `xdg-open ...`.)

Diga ao usuário: *"Abri o offerbook no Word (revisão/edição) e no navegador (TOC pra navegar rápido entre os 7 blocos)."*

### Anúncio de fechamento (última skill da Aula 01)

Após confirmar entrega, **sempre** diga ao usuário em texto separado:

> 🎉 **Aula 01 concluída.** Você completou as 5 skills.
>
> Você tem agora 24+ arquivos no projeto:
> - 3 do `/avatar-funil` (relatorio-avatar.md/html/pdf)
> - 3+ do `/espiao-do-concorrente` por concorrente (dossie-{concorrente}.md/html/pdf)
> - 7 do `/trend-hunting` (trends md/html/pdf + variacoes md/html/pdf + briefing-media-buyer.md)
> - 6+ do `/swipe-file` (index md/html/pdf + briefing-swipe-file md/html/pdf + 2 por criativo capturado)
> - 4 do `/offerbook` (briefing-offerbook + offerbook.md + offerbook.docx + offerbook.html — abri os 2 visuais pra você)
>
> **Próximo passo manual:** crie o `lacunas-aula-01.md` (copie de `aula-01/docs/template-lacunas-aula-01.md` pra raiz do projeto). É o único artefato que não tem skill — você preenche o que ficou pendente em até 30 minutos.
>
> Esse pacote inteiro é o que vai alimentar a Aula 02 (Funil e Páginas). Sem ele aprovado pelo dono da oferta, NÃO se escreve copy. Essa é a regra-mãe do cohort.
>
> **Pronto pra continuar? A Aula 02 começa agora:** rode `/design-md` — ele cria a identidade visual da sua marca (todo HTML e PDF das próximas skills usa ela). Depois, rode `/metodo-funil` — ele diagnostica o nível de consciência do seu público e monta o mapa de execução do seu funil, peça por peça.

Nao pule esse anúncio — fecha o trilho completo da Aula 01 e já abre a porta da Aula 02.

---

## Regras

- **Idêntico à estrutura:** todas as seções e campos exatos, inclusive os campos específicos da História (estilo, "porquê" do problema, nome da situação do problema/resultado). Não reorganizar nem resumir.
- **Blocos separados** (guias/tabs), um por bloco.
- **Materiais = links que a equipe abre, NUNCA caminhos de arquivo local.** Sem link → "A ADICIONAR".
- **Avatar e Análise de Cliente vêm da pesquisa real**, nunca de inferência.
- **Texto limpo:** nada de markdown cru no documento final (sem `##`, `**`, `===`).
- **Sem emoji por padrão** no conteúdo do offerbook (o dono pode pedir).
- **Substituir** qualquer texto residual de template (exemplos de outro projeto) pelo conteúdo da oferta atual.
- **Só depois do offerbook aprovado** o copywriter escreve LP/e-mails/ads.

---

## ✅ Checklist de qualidade (conferir antes de entregar)

**Fundação**
- [ ] Nome do produto a partir do argumento/briefing (não inventado)
- [ ] Documento criado como CÓPIA — template original intacto
- [ ] Materiais já existentes foram checados antes de produzir
- [ ] Nenhum dado inventado

**Avatar e Análise de Cliente**
- [ ] Avatar saiu da pesquisa REAL (não de inferência)
- [ ] Tem N (número de respostas), % e citações literais dos leads
- [ ] Campos sem dado estão marcados como "SEM DADO NA PESQUISA"

**Estrutura (campo a campo)**
- [ ] Bloco 1 — Materiais completo (links, não caminhos de arquivo)
- [ ] Bloco 2 — Posicionamento/Oferta (nome, promessa, USP, 9 perguntas de valor, módulos, autoridade)
- [ ] Bloco 3 — Avatar (8 campos)
- [ ] Bloco 4 — História (todos os campos, inclusive nomes da situação problema/resultado)
- [ ] Bloco 5 — História v2 (versão expandida completa)
- [ ] Bloco 6 — Análise de Cliente (demográfico → objeções)
- [ ] Bloco 7 — Copy (Ads, LP A/B/C, E-mails)

**Forma**
- [ ] Cada bloco em sua guia/seção separada
- [ ] Texto limpo, sem markdown cru
- [ ] Nenhum texto residual de outro projeto
- [ ] Guia "Lacunas e Próximos Passos" separada por quem resolve (dono da oferta vs. equipe)

**Gate final**
- [ ] Conferido campo a campo contra esta estrutura
- [ ] Apresentado para aprovação
- [ ] Só liberar copy (LP/e-mails/ads) depois do offerbook aprovado

---

## Limitação conhecida

Se for usar um conector de Google Docs: alguns conectores só aplicam formatação (heading/negrito) na guia padrão; nas guias novas o texto entra limpo, sem hierarquia visual. Se a formatação idêntica ao template for prioridade, usar um documento único formatado (perde a separação em guias).
