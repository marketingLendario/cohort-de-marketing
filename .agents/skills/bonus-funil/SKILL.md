---
name: bonus-funil
description: "Gera os ENTREGÁVEIS dos bônus da oferta — o material de verdade, não só a lista. Lê a curadoria de bônus do offerbook (o que o dono confirmou que consegue entregar) e o Perfil do Projeto e produz o bônus certo pro tipo de negócio: ebook, workbook, checklist, guia, template, calculadora e voucher saem COMPLETOS (md + HTML paginado no DESIGN.md + PDF); áudio/vídeo guiado sai como ROTEIRO palavra-por-palavra pronto pra gravar; comunidade/serviço sai como estrutura operacional. Use quando o dono pedir pra 'criar os bônus da oferta', 'gerar o ebook', 'montar o workbook', 'escrever os áudios guiados', 'fazer o checklist de bônus' ou 'entregar os bônus'. Fecha a promessa da oferta: a skill CRIA os bônus, não só os anuncia. Fluxo com checkpoints (pauta → amostra → lote). Método de funil (autoria Alan Nicolas)."
user_invocable: true
---

# Bônus do Funil — gera os entregáveis dos bônus da oferta

Skill que **produz o material dos bônus** que a oferta promete. O `/offerbook` faz a curadoria (lista + pergunta "consegue entregar?"); **esta skill cria o entregável de verdade** — o ebook, o workbook, o checklist, o guia, o voucher, a calculadora, o roteiro pronto pra gravar. Fecha a promessa pública: a skill CRIA os bônus, não só os anuncia.

> **Promessa do método:** um bônus só aumenta o valor percebido se **existir de fato**. Bônus anunciado e nunca entregue é promessa quebrada — derruba a oferta inteira. Esta skill transforma a lista curada do offerbook em arquivos que o dono pode entregar hoje.

> **Honestidade (regra dura desta skill):** parte dos bônus a skill gera COMPLETO (conteúdo de texto); parte ela entrega como ROTEIRO/estrutura porque o material final exige gravação, comunidade ou operação do dono. A skill nunca finge que gravou um áudio ou montou uma comunidade. Ver a Tipologia abaixo.

> **OS BÔNUS SÃO DO DONO — a skill nunca impõe (regra dura, No Invention).** A hierarquia é inequívoca:
> 1. **Fonte primária = os bônus já definidos no `offerbook.md`** (a curadoria "consegue entregar? sim/não"). A skill **GERA a lista do dono** — o que ele confirmou, na ordem dele. Não substitui, não "melhora", não acrescenta bônus que ele não escolheu.
> 2. **A tabela por nicho (abaixo) é um CARDÁPIO DE PROPOSTAS**, usado SÓ quando o offerbook **não tem bônus definidos** ou o dono **pede ideias**. Nesse caso, proponha **2-3 candidatos** típicos do nicho (ex.: a calculadora de ROI é um **candidato típico de B2B**, nunca um default obrigatório) e **o DONO ESCOLHE na pauta**. A tabela nunca vira lista automática.
> 3. **Nada é gerado sem aprovação:** pauta → amostra → lote. Mesma regra No Invention do downsell — **nunca criar um bônus fechado que o dono não escolheu**.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Onde salva:** os bônus saem em **`projetos/{slug}/bonus/`**, **uma subpasta por bônus** (ex.: `bonus/ebook-primeiros-passos/`, `bonus/checklist-auditoria/`, `bonus/audios-guiados/`), cada um nos 3 formatos onde a skill gera conteúdo. Um **índice** `bonus/index.html` (padrão do Book) lista todos os bônus com card, status e link pro `.html` de cada um. O Book do funil (`projetos/{slug}/index.html`) ganha um card "Bônus da oferta" que abre esse índice.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: bônus existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card "Bônus da oferta" no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (caminho relativo real); a amostra entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

---

## Posição no funil — roda DEPOIS do offerbook e do design

O bônus é reforço de valor percebido, não a espinha do funil. Roda tarde, junto de mockup e criativos (fora da fila do "próximo passo" do `/metodo-funil`).

- **Depende do `offerbook.md`** (obrigatório): dele vêm a **lista de bônus curada** (o que o dono confirmou que "consegue entregar") e os roteiros que ficaram como pendência. É a matéria-prima desta skill.
- **Depende do `DESIGN.md`** (obrigatório): identidade visual do HTML paginado de cada bônus (cores, fontes, capa, tipografia).
- **Recomenda o `copy.md`** (a fundação da `/copy-funil`): léxico do avatar, Big Idea e mecanismos — pra o conteúdo do bônus falar na mesma voz da oferta. Sem ele, a skill PERGUNTA se o dono quer seguir só com a estrutura ou rodar a fundação antes.

### Gate de pré-requisito (execute ANTES de tudo)

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira os obrigatórios:**

```
ls projetos/{slug}/offerbook.md projetos/{slug}/DESIGN.md 2>/dev/null
```

- Se existirem, leia do `offerbook.md` a **curadoria de bônus** (a lista com "sim/não" + os roteiros pendentes) e o **Perfil do Projeto**; leia do `DESIGN.md` os tokens visuais.
- Se FALTAR algum, PARE e aponte a skill que o gera, em linguagem de gente (regra em `.claude/skills/_shared/nunca-travar.md`):

> Pra criar os bônus eu preciso da curadoria de bônus, que está no `offerbook.md` (o Livro da Oferta, última etapa da Aula 1 — é lá que você marcou quais bônus consegue entregar). E preciso do `DESIGN.md` (a identidade visual da sua marca, da skill `/design-md`) pra dar a cara certa a cada bônus. Rode `/offerbook` e `/design-md` primeiro; quando existirem, volte e rode esta skill.

Não invente de cabeça a lista de bônus — ela vem da curadoria do offerbook.

---

## Gate — Perfil do Projeto (CENTRAL: o bônus certo MUDA pelo tipo de negócio)

Leia o **Perfil do Projeto** no topo do `offerbook.md` (regra completa em `.claude/skills/_shared/perfil.md`). O bônus que aumenta valor num infoproduto é inútil numa loja física.

> **A tabela abaixo é o CARDÁPIO DE PROPOSTAS por nicho — não é lista automática.** Ela só entra quando o offerbook não tem bônus definidos ou o dono pede ideias (ver a regra "OS BÔNUS SÃO DO DONO" acima). Nesse caso, proponha 2-3 candidatos da linha do tipo de negócio e o dono escolhe na pauta. Se o offerbook já traz bônus curados, a fonte é ELE — a tabela só ajuda a saber **como gerar** cada tipo (coluna da direita).

| Tipo de negócio | Bônus típicos | O que a skill GERA |
|-----------------|---------------|--------------------|
| **Especialista / infoproduto** | ebook, workbook, áudios guiados, templates | ebook e workbook **completos** (capítulos, exercícios) + **roteiros** dos áudios guiados palavra-por-palavra |
| **Físico / varejo local** | guia de uso do produto, mini-guia (receitas/dicas), cupom/voucher de recompra, clube de fidelidade | o guia/mini-guia **completos** + a **arte do voucher** (HTML) + as **regras do clube**; brinde físico = decisão do dono (pendência) |
| **SaaS / app** | biblioteca de casos de uso, pacote de templates, roteiro de onboarding, trial estendido | guia de **casos de uso**, os **templates** e o **roteiro de onboarding**; trial estendido = decisão do dono (pendência) |
| **Serviço** | checklist de auditoria/diagnóstico, sessão extra, one-pager de boas-vindas | o **checklist** e o **one-pager** completos; escopo/duração da sessão extra = decisão do dono (pendência) |
| **B2B** | template de business case, calculadora de ROI, whitepaper, roteiro de workshop interno | **todos**: template de business case, **calculadora de ROI (HTML interativa)**, whitepaper e roteiro do workshop |
| **Afiliado** | bônus PRÓPRIO pra quem compra pelo seu link (a arma clássica do afiliado) | ebook/checklist **próprio, completo**, complementar ao produto do produtor — pra quem comprar pelo seu link ganhar a mais |
| **Agência** | os bônus são do **CLIENTE** | gera na **voz e marca do cliente** (não do operador); 1 cliente = 1 projeto/pasta; oferece "versão cliente" no fecho |

> **Exceção afiliado (regra dura):** **Perfil = afiliado → não há curadoria própria no offerbook**: proponha **2-3 bônus COMPLEMENTARES ao produto do produtor** (cardápio da linha afiliado acima) e **o dono escolhe na pauta**. Não trave por falta de curadoria; o bônus é a arma do afiliado pra quem compra pelo link dele.

> **Nicho regulado (saúde/médico · jurídico · psico · financeiro):** o compliance vale pro bônus também. Material educativo em **linguagem de possibilidade**, sem promessa de cura/resultado garantido; respeite o conselho do nicho (CFM/OAB/CFP/CVM). Um ebook de bônus de nicho de saúde não pode prometer o que a página de vendas não pode. Se o Perfil marcar regulado, o conteúdo do bônus nasce dentro dessa régua.

> **Guard (regra dura, `_shared/perfil.md`):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é PROIBIDO enquadrar os bônus como "curso/mentoria de especialista" ou usar "depoimento de aluno" por padrão. Use voz do cliente/marca e prova de uso. O default "infoproduto de especialista" só vale quando Tipo = especialista.

---

## Tipologia — o que a skill GERA vs. o que fica pro dono (honestidade)

O que define se a skill entrega o bônus **pronto** ou como **insumo** é a natureza do material, não a vontade de parecer completo.

| Tipo de bônus | O que a skill entrega |
|---------------|-----------------------|
| **Ebook · guia · workbook · checklist · template · planilha · calculadora** | **Entregável COMPLETO.** `.md` fonte + **HTML paginado** nos tokens do `DESIGN.md` (capa, sumário, páginas) + **PDF** (`scripts/gerar_pdf.sh`). Conteúdo REAL: capítulos escritos, exercícios preenchíveis, itens do checklist, campos da planilha/calculadora funcionando. No léxico do `copy.md`, com **[SEM PROVA AINDA]** onde faltar prova real. |
| **Áudio · vídeo guiado** (meditação, série, áudio motivacional, aula-bônus) | **ROTEIRO palavra-por-palavra**, pronto pra gravar: duração alvo, tom, marcação de pausas, e (se vídeo) o texto na tela. + **pendência** com chave `gravar-audio-{slug}`. A skill **NÃO gera o áudio/vídeo** — o dono grava, ou usa uma ferramenta de TTS/vídeo da escolha dele. Roteiro = insumo; gravação = entregável. |
| **Comunidade · encontro · grupo · serviço** (mentoria em grupo, clube, call extra) | **Estrutura operacional**: regras, calendário/cadência, roteiro de onboarding, boas-vindas. Não é artefato de conteúdo — é o "como opera". O que exigir presença/entrega do dono vira pendência. |
| **Mockup VISUAL do bônus** (capa empilhada, box, device) | **Aponte `/mockup-produto-funil`** — não duplique. Esta skill gera o CONTEÚDO do bônus; o mockup gera a imagem de valor percebido pra página de vendas. |

> **Sem cara de IA na copy (regra dura).** No conteúdo dos bônus voltado ao cliente final: **sem travessão (—)** — reescreva com ponto, vírgula ou dois-pontos; e **sem "não é sobre X, é sobre Y"** (e variantes) — esse contraste é assinatura de IA. Afirme direto o que É. **Sem emoji** no corpo. Acentuação perfeita em PT-BR.

> **Honestidade de prova (NON-NEGOTIABLE).** Nunca invente número, case, depoimento ou citação dentro de um bônus. Prova vem do `offerbook.md`/pesquisa. Sem prova real → marque o trecho com **[SEM PROVA AINDA]** e registre em `projetos/{slug}/pendencias.md` (regra em `.claude/skills/_shared/pendencias.md`).

---

## Fluxo com checkpoints (pauta → amostra → lote)

Nunca gera o lote inteiro sem aprovar a pauta e a amostra. É o padrão do repo: barato de corrigir cedo, caro de refazer no fim.

1. **Ler a curadoria (fonte primária)** — do `offerbook.md`, pegue a lista de bônus com "sim/não" e os roteiros pendentes. Só entra o que for **sim**. **Se o offerbook não tiver bônus definidos** (ou o dono pedir ideias): use a tabela de nicho como cardápio e proponha 2-3 candidatos pro dono ESCOLHER — nunca gere um bônus que ele não escolheu (No Invention).
2. **Apresentar a PAUTA** — liste cada bônus (os do offerbook + os candidatos propostos, se for o caso) com: nome, **tipo** (da Tipologia acima) e **o que será gerado** dele (completo / roteiro / estrutura). Deixe explícito o que fica como pendência do dono (áudio a gravar, trial, escopo de sessão, brinde físico). Peça ao dono pra **aprovar, escolher ou cortar** itens.
3. **Dono aprova/corta.** Só depois do "ok" na pauta a skill produz algo.
4. **Gerar 1 AMOSTRA** — o **bônus mais importante** da lista (o de maior valor percebido), completo nos 3 formatos, na cara do `DESIGN.md`. Entra no Book (card "em revisão") ANTES de ir pro chat, é aberto renderizado e enviado.
5. **Dono valida a amostra** — calibragem de voz, profundidade, formato. Ajuste se preciso.
6. **Escalar o lote** — com a amostra aprovada como padrão, gere os demais bônus no mesmo nível. Cada um vira card no `bonus/index.html`; ao fechar, os cards viram "feito".

> Nunca gerar o lote sem aprovar a pauta e a amostra. Pauta primeiro, amostra depois, lote por último.

---

## Modo produto-core (opcional)

Se o dono pedir os **roteiros do PRODUTO principal** (não os bônus) — por exemplo os 21 áudios do programa, os módulos do curso, as aulas — a skill gera os **roteiros dia a dia / módulo a módulo**, no mesmo padrão de roteiro palavra-por-palavra (duração, tom, pausas). Neste modo, avise com honestidade:

> Aprofundamento e produção do produto principal é o foco do **Cohort de Produto** (o terceiro da trilha). Aqui eu entrego os roteiros prontos pra gravar; a construção completa do produto (gravação, edição, área de membros) é lá.

Roteiro do produto-core = insumo; a entrega final continua sendo do dono (mesma regra de áudio/vídeo da Tipologia).

---

## Regras de ouro

**SEMPRE:** os bônus são do DONO — fonte primária é a curadoria do offerbook; a tabela de nicho é só cardápio de propostas (2-3 candidatos) quando não há bônus definidos ou o dono pede ideias, e o dono escolhe na pauta · gerar completo o que é conteúdo de texto (ebook/workbook/checklist/guia/template/calculadora), nos 3 formatos com os tokens do `DESIGN.md` · entregar áudio/vídeo como ROTEIRO + pendência `gravar-audio-{slug}` · falar no léxico do `copy.md` · marcar **[SEM PROVA AINDA]** onde faltar prova · respeitar o compliance de nicho regulado · aprovar pauta e amostra antes do lote · uma subpasta por bônus em `projetos/{slug}/bonus/` + `bonus/index.html` + card no Book · você [dono] revisa antes de entregar/publicar.

**NUNCA:** criar um bônus fechado que o dono não escolheu (No Invention, igual ao downsell) · tratar a tabela de nicho como lista automática/default (a calculadora de ROI é candidato típico de B2B, nunca obrigatória) · fingir que gravou o áudio ou montou a comunidade · gerar mockup visual aqui (é `/mockup-produto-funil`) · usar voz de especialista/depoimento de aluno quando o Perfil for marca/físico/saas/serviço/b2b · prometer cura/resultado garantido em nicho regulado · travessão ou "não é X, é Y" · emoji no corpo · gerar o lote sem aprovar pauta e amostra · publicar/entregar ao cliente final sem o dono revisar.

---

## Ao terminar

Feche apontando **UM único próximo comando** pela ordem canônica do mapa (`/metodo-funil`, gate N12). O bônus é peça tardia/opcional: se ainda faltar peça-núcleo do funil (copy, página, e-mail, conteúdo, recuperação, back-end, cro), o próximo passo é a **primeira peça-núcleo que ainda não existe** — não outro reforço. Se o núcleo já estiver pronto, ofereça `/mockup-produto-funil` (imagem de valor percebido dos bônus na página) ou `/pagina-vendas-funil` pra encaixar os bônus na stack. Um comando só, nunca um menu. Encerre com "Preencha as pendências" e abra o Book.

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável de conteúdo sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint (a amostra) abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o dono ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; ver `_shared/nunca-travar.md`).
