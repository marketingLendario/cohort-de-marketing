---
name: mockup-produto-funil
description: "Gera mockups visuais dos produtos e bônus da sua oferta — capa de ebook/PDF, tela de módulo/área de membros, box/caixa do produto, bundle de bônus empilhado, device mockup — na identidade visual da SUA marca (extraída via DESIGN.md da skill design-md). Os produtos/bônus vêm do offerbook; o estilo (cores, fontes, tom visual) vem do DESIGN.md. A skill monta PROMPTS de geração de imagem prontos, parametrizados pela sua marca, pra você gerar numa ferramenta de geração de imagem à sua escolha. Use quando quiser aumentar o valor percebido da oferta com mockups visuais na página de vendas e nos criativos. Gatilhos: 'mockup', 'capa de ebook', 'box do produto', 'empilhar bônus', 'mockup dos módulos', 'visual do produto pra página de vendas'."
user_invocable: true
---

# Mockup de Produto — visual da oferta na sua marca (genérico, pra usar no seu projeto)

Skill que **gera mockups visuais dos seus produtos e bônus** — a capa do ebook, a tela da área de membros, o box do produto, o bundle de bônus empilhado — na **identidade visual da sua própria marca**. Ela não desenha em ferramenta nenhuma por você: ela monta os **prompts de geração de imagem prontos**, já parametrizados com as cores e fontes da sua marca, pra você gerar na **ferramenta de geração de imagem à sua escolha**.

> **Tese central:** na página de vendas, o que o lead **vê** vale tanto quanto o que ele lê. Um produto sem mockup parece "um arquivo"; o mesmo produto com capa, box e bônus empilhados parece **um produto de verdade que vale o preço**. Mockup é alavanca de **valor percebido** — entra junto com a `/pagina-vendas-funil` e o `/offerbook`.

> **Skill de apoio, não um funil.** O mockup-produto não estrutura oferta nem escreve copy. Ele transforma a oferta que já existe (no offerbook) em **imagens** com a cara da sua marca (do DESIGN.md).

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou.

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Versões, pendências e Book do Funil (regra dura — texto completo em `.claude/skills/_shared/book-do-funil.md`; LEIA-o ao fechar a peça).** Recriar nunca apaga: peça existente ganha versão nova (`-v2`), e o ✕ das versões antigas só esconde do Book (nunca apaga do disco). Pendências do dono vão pra `projetos/{slug}/pendencias.md` com CHAVE por decisão (re-run reconcilia, nunca soma). Ao terminar: atualize o card da peça no Book (`projetos/{slug}/index.html` — cards linkam sempre o `.html`, nunca `.md`) e o "VOCÊ ESTÁ AQUI" do mapa; documentos internos levam "← Voltar" + "← Book do Funil" (roteiro/VSL leva os DOIS botões, com caminho relativo real); amostra/checkpoint entra no Book ANTES de ir pro chat; feche com "Preencha as pendências" e abra o Book. Se o Perfil disser agência, ofereça a "versão cliente" do Book.

> **Onde salvar:** os mockups e prompts desta skill saem na subpasta **`projetos/{slug}/mockups/`**.

---

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, descubra o projeto ativo e confira que os arquivos existem dentro dele:

```
# 1. Descubra o projeto ativo:
ls projetos/ 2>/dev/null
# 2. Confira os arquivos dentro do projeto ativo:
ls projetos/{slug}/DESIGN.md projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir(em), leia deles a identidade visual (cores, fontes, raio de borda, tom) do `projetos/{slug}/DESIGN.md` e os entregáveis/bônus a mockupar do `projetos/{slug}/offerbook.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra gerar os mockups na cara da sua marca eu preciso do `projetos/{slug}/DESIGN.md`, que sai da skill `/design-md` (e do `projetos/{slug}/offerbook.md` pros entregáveis, da skill `/offerbook`). Rode `/design-md` primeiro; quando `projetos/{slug}/DESIGN.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

> **Antes de montar, leia o Perfil do Projeto** (`.claude/skills/_shared/perfil.md`): Tipo de oferta, Voz e público saem de lá. **Guard de enquadramento (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é PROIBIDO dar aos mockups cara de curso/infoproduto — nada de "capa de ebook do especialista", tela de "área de aluno", selo de "método", depoimento de aluno estampado na peça. O mockup mostra o PRODUTO real (embalagem, tela do app, proposta), não um professor.

> **O aluno nunca trava** (`.claude/skills/_shared/nunca-travar.md`): todo pré-requisito e ferramenta em linguagem de leigo, com glossário inline (ex.: "mockup = imagem realista do produto"; "DESIGN.md = a ficha com as cores e fontes da sua marca"). Quando precisar puxar dado da web (ex.: imagem de referência do produto real), a coleta é via **Apify** — é o caminho central, nunca "opcional"; só caia pro fallback se a **cota estourar**. E **nunca prometa que o `.html` abre sozinho**: sempre entregue o caminho do arquivo + como abrir (macOS `open`, Windows `start ""`, Linux `xdg-open`).

---

## Gate — o TIPO de oferta escolhe o mockup (leia o Perfil ANTES)

O tipo de mockup **não é livre**: ele é ditado pelo **Tipo de oferta** do Perfil do Projeto (`.claude/skills/_shared/perfil.md`). Um produto físico com "capa de ebook" fica falso e derruba o valor percebido. Case assim:

| Tipo de oferta (do Perfil) | Mockup certo | Mockup PROIBIDO |
|----------------------------|--------------|-----------------|
| **Produto físico** | embalagem/rótulo, caixa (box), display de PDV, produto na mão / em uso, foto de estúdio | capa de ebook, tela de "módulos", área de aluno |
| **SaaS / app** | tela do produto (dashboard, app) dentro de device — notebook/celular/tablet | box físico, capa de ebook |
| **Serviço / consultoria** | mockup de apresentação/proposta (deck, PDF de proposta, one-pager), tela de agenda/entregável | box de produto, "capa de curso" |
| **Infoproduto / curso** | capa de ebook/PDF, tela de módulos/área de membros, bundle de bônus | (livre — é o único que usa capa de ebook/módulos) |

> **Regra dura:** só **infoproduto/curso** usa capa de ebook e tela de módulos. Para físico, SaaS/app e serviço, escolha o mockup da linha correspondente e ignore os templates de ebook/módulos abaixo (ou adapte o device/box ao produto real). Na dúvida do tipo, confirme no Perfil antes de gerar — não assuma "curso" por padrão.

---

## De onde vêm os dois inputs

| Input | Vem de | O que tira de lá |
|-------|--------|------------------|
| **O que mockupar** (produtos + bônus) | **`/offerbook`** → Bloco 2 (Posicionamento › Oferta): nome do produto, módulos do treinamento, bônus confirmados, stack de valor | a lista exata de itens que viram mockup |
| **Como deve parecer** (identidade visual) | **`/design-md`** → `DESIGN.md` + `tokens.json` da SUA marca (cores, fontes, raio de borda, tom visual) | a paleta, a tipografia e o estilo que vão em cada prompt |

> Sem offerbook → você não sabe **o que** mockupar (quantos módulos? quais bônus?). Sem DESIGN.md → o mockup sai genérico, sem a cara da sua marca. A skill funciona melhor com os dois; sem eles, ela monta o prompt com placeholders marcados (`{{cor-primaria}}`, `{{fonte-titulo}}`, `{{nome-do-bonus}}`) pra você preencher.

---

## Como usar

### Passo 0 (pré-requisitos) — Ter o offerbook e o DESIGN.md da sua marca

1. **Offerbook da oferta** — rode `/offerbook [produto]` antes. É de lá que sai a lista de produtos/bônus a mockupar (Bloco 2 › Oferta: módulos + bônus).
2. **DESIGN.md da sua marca** — rode `/design-md` apontando pra uma URL da sua marca:

```bash
node .claude/skills/design-md/run.cjs --url https://SUA-MARCA.com/
```

Isso gera `DESIGN.md` + `tokens.json` (cores, fontes, espaçamento, raio de borda) da SUA marca. É esse arquivo que dá identidade aos mockups.

> **Sem DESIGN.md → a skill monta os prompts mesmo assim, mas deixa as partes visuais como placeholder (`{{cor-primaria}}`, `{{cor-secundaria}}`, `{{fonte-titulo}}`)** pra você preencher com o seu manual. Nenhuma cor/fonte é inventada.

### Passos seguintes — Escolher os mockups e montar os prompts

1. **Carregar o offerbook** — listar os itens reais da oferta: produto principal, cada módulo, cada bônus.
2. **Carregar o DESIGN.md da sua marca** — cores (primária, secundária, fundo, texto), fontes (título, corpo), raio de borda, tom visual (dark/premium, claro/clean, colorido/jovem…).
3. **Escolher os tipos de mockup** (tabela abaixo) — um por item, ou combinar (ex.: ebook principal + box + bônus empilhado).
4. **Montar os prompts** — preencher os templates da seção "Templates de prompt" com o item do offerbook + os tokens do DESIGN.md.
5. **Você [aluno] gera as imagens** na ferramenta de geração de imagem da sua escolha e **aprova**. A skill **não** gera imagem nem publica nada — ela entrega os prompts prontos.
6. **Rodar o checklist de qualidade** antes de levar pra página/criativo.

---

## Tipos de mockup (escolha por item)

| # | Tipo | Quando usar | O que representa |
|---|------|-------------|------------------|
| 1 | **Capa de ebook / PDF** | produto ou bônus entregue em PDF/ebook/guia | capa frontal com título, subtítulo e a marca — dá "cara de livro" |
| 2 | **Tela de módulo / área de membros** | curso/treinamento com aulas em plataforma | print/tela mostrando os módulos listados — prova que existe uma área real |
| 3 | **Box / caixa do produto** | produto principal, pra ancorar como "produto físico" de valor | caixa 3D fechada com a marca — eleva o percebido de um digital |
| 4 | **Bundle de bônus empilhado** | quando há vários bônus e você quer mostrar volume | vários elementos (ebooks, boxes, telas) empilhados/agrupados — "olha tudo que vem junto" |
| 5 | **Device mockup** | conteúdo consumido em tela (vídeo-aula, dashboard, app) | notebook/celular/tablet exibindo a tela do produto |

> Regra de seleção: **produto principal** quase sempre pede box ou device; **bônus** costumam render bem como capa de ebook ou empilhados num bundle; **módulos** ficam fortes como tela de área de membros.

---

## Templates de prompt (parametrizados pelo DESIGN.md)

Cada template tem **placeholders entre `{{ }}`** que você preenche com: o item do **offerbook** e os tokens do **DESIGN.md**. Copie o template do tipo escolhido, preencha e cole na sua ferramenta de geração de imagem.

> Convenção dos placeholders visuais (todos vêm do `tokens.json` / `DESIGN.md`):
> `{{cor-primaria}}` · `{{cor-secundaria}}` · `{{cor-fundo}}` · `{{cor-texto}}` · `{{fonte-titulo}}` · `{{fonte-corpo}}` · `{{estilo-visual}}` (ex.: "dark premium", "clean minimalista", "colorido moderno") · `{{logo-ou-marca}}`.
> Placeholders de conteúdo vêm do **offerbook**: `{{titulo-do-produto}}` · `{{subtitulo}}` · `{{nome-do-modulo}}` · `{{nome-do-bonus}}`.

### 1. Capa de ebook / PDF

```
Mockup de capa de ebook 3D, em pé, vista frontal levemente em ângulo, fundo {{cor-fundo}} liso.
Título "{{titulo-do-produto}}" em destaque, tipografia estilo {{fonte-titulo}}, na cor {{cor-primaria}}.
Subtítulo "{{subtitulo}}" menor, na cor {{cor-texto}}.
Detalhes/acentos na cor {{cor-secundaria}}. Marca/logo no rodapé da capa.
Estilo visual geral: {{estilo-visual}}. Iluminação de estúdio suave, sombra realista no chão.
Sem texto extra, sem marca-d'água, alta resolução, proporção vertical de livro.
```

### 2. Tela de módulo / área de membros

```
Mockup de tela de área de membros / plataforma de curso online, vista de frente em um {{device: notebook ou navegador}}.
Cabeçalho com a marca "{{logo-ou-marca}}" na cor {{cor-primaria}}, fundo da interface {{cor-fundo}}.
Lista de módulos visível na lateral/grid: {{nome-do-modulo-1}}, {{nome-do-modulo-2}}, {{nome-do-modulo-3}} (use os módulos reais do offerbook).
Cada card de módulo com cantos arredondados (raio {{raio-borda}}), título em {{fonte-titulo}}, na cor {{cor-texto}}.
Botão de ação na cor {{cor-secundaria}}. Estilo visual: {{estilo-visual}}, interface limpa e profissional.
Alta resolução, sem texto solto fora da interface.
```

### 3. Box / caixa do produto

```
Mockup de caixa de produto 3D, fechada, vista frontal em ângulo, sobre superfície neutra, fundo {{cor-fundo}}.
A caixa estampa o título "{{titulo-do-produto}}" em {{fonte-titulo}}, na cor {{cor-primaria}}, com a marca "{{logo-ou-marca}}".
Acentos gráficos na cor {{cor-secundaria}}. Acabamento premium (ex.: fosco/verniz conforme {{estilo-visual}}).
Iluminação de estúdio, reflexo e sombra realistas. Proporção de caixa de produto, alta resolução, sem texto extra.
```

### 4. Bundle de bônus empilhado

```
Mockup de bundle/kit completo: vários elementos do produto agrupados e empilhados juntos numa composição —
incluir {{lista-de-itens-do-offerbook: ex. 1 box principal + 2 ebooks + 1 tela em notebook}}.
Todos com a mesma identidade: cor primária {{cor-primaria}}, cor secundária {{cor-secundaria}}, fundo {{cor-fundo}},
títulos em {{fonte-titulo}}, marca "{{logo-ou-marca}}" em cada peça.
Composição organizada mostrando volume e valor ("tudo que vem junto"). Estilo visual: {{estilo-visual}}.
Iluminação de estúdio, sombras realistas, alta resolução, sem texto solto.
```

### 5. Device mockup

```
Mockup de {{device: notebook / celular / tablet}} exibindo a tela do produto "{{titulo-do-produto}}".
Tela com a interface na cor de fundo {{cor-fundo}}, elementos de destaque em {{cor-primaria}} e {{cor-secundaria}},
texto em {{fonte-corpo}}, marca "{{logo-ou-marca}}" visível. Conteúdo da tela: {{descrição-do-que-aparece: ex. vídeo-aula, dashboard, módulos}}.
Device centralizado, vista frontal, fundo {{cor-fundo}} liso, iluminação suave, sombra realista.
Estilo visual: {{estilo-visual}}. Alta resolução, sem texto fora da tela.
```

> **Dica de consistência:** gere todos os mockups da mesma oferta com os **mesmos tokens** (`{{cor-primaria}}`, `{{fonte-titulo}}`, `{{estilo-visual}}`). É isso que faz o conjunto parecer "uma família de produtos" e não peças soltas.

---

## Ferramenta de geração de imagem

A skill **não** depende de nenhuma ferramenta específica. Você gera os mockups na **ferramenta de geração de imagem à sua escolha** — pode ser:

- um **gerador de imagem por IA** (qualquer um que aceite prompt de texto);
- um **editor de design online** com templates de mockup prontos;
- um **banco/gerador de mockups** dedicado.

O que a skill entrega é o **prompt/briefing visual** pronto e parametrizado pela sua marca. Onde a ferramenta pedir cor/fonte manualmente (editores de template), use os mesmos valores do seu `DESIGN.md`.

---

## Checklist de qualidade (conferir antes de usar na página/criativo)

**Legibilidade**
- [ ] O título do produto/bônus está **legível** no mockup (não cortado, não sobre fundo de baixo contraste)
- [ ] O texto não ficou borrado/deformado pela geração de imagem (gerador às vezes erra letra — refazer se ilegível)

**Fidelidade à marca (bate com o DESIGN.md?)**
- [ ] A **cor primária** e a **secundária** são as do `tokens.json` (não cores aleatórias que o gerador inventou)
- [ ] A **tipografia** lembra a fonte do DESIGN.md (ou foi ajustada depois no editor)
- [ ] O **tom visual** (`{{estilo-visual}}`) bate com a marca (dark premium ≠ claro clean ≠ colorido jovem)
- [ ] A **marca/logo** aparece e está correta

**Consistência entre mockups**
- [ ] Todos os mockups da mesma oferta usam a **mesma paleta e a mesma fonte** (família de produtos, não peças soltas)
- [ ] Fundo, iluminação e ângulo estão **coerentes** entre as peças (parecem do mesmo conjunto)

**Aderência ao offerbook**
- [ ] Os itens mockados são os **reais do offerbook** (produto + módulos + bônus que existem), nada inventado
- [ ] O número de bônus no bundle bate com o número de bônus confirmados na oferta

---

## Output (o que a skill entrega)

Para cada pedido, entregar:
1. **Lista de mockups escolhidos** — qual tipo (1-5) para cada item do offerbook (produto, módulos, cada bônus).
2. **Prompts prontos** — um prompt por mockup, com os placeholders **já preenchidos** com o item do offerbook + os tokens do DESIGN.md.
3. **Mapa de tokens usados** — qual cor/fonte/estilo do DESIGN.md entrou em cada prompt (pra você conferir fidelidade).
4. **Checklist de qualidade** — pra rodar depois de gerar as imagens.

> Você [aluno] gera as imagens na ferramenta da sua escolha e aprova. A skill **estrutura e parametriza os prompts**; quem gera a imagem é você.

---

## Regras

**SEMPRE:** puxar os itens a mockupar do **offerbook** (produto + módulos + bônus reais) · puxar cores/fontes/estilo do **DESIGN.md** da sua marca · usar os **mesmos tokens** em todos os mockups da mesma oferta (consistência) · preencher cada template com dados reais (nada de item inventado) · rodar o checklist de legibilidade + fidelidade + consistência antes de usar · você [aluno] revisa antes de publicar.

**NUNCA:** inventar cor/fonte que não está no DESIGN.md · mockupar bônus/módulo que não existe no offerbook · misturar paletas/estilos diferentes na mesma família de mockups · gerar a imagem ou publicar por conta própria (a skill só entrega os prompts) · usar texto ilegível/deformado num criativo final.

---

## Veto conditions (NÃO montar se…)

| Situação | Ação |
|----------|------|
| Não tenho o offerbook da oferta | Rodar `/offerbook` antes — é dele que saem os itens a mockupar |
| Não tenho o DESIGN.md da marca | Rodar `/design-md` antes — ou montar os prompts com placeholders visuais marcados |
| Não sei quantos/quais bônus a oferta tem | Definir no offerbook primeiro (decide quantos mockups e o bundle) |
| Pediram pra gerar a imagem/publicar | PARAR — a skill só entrega os prompts; você [aluno] gera na ferramenta da sua escolha e publica |

---

*Skill mockup-produto v1 — skill de apoio (não é funil). Os produtos/bônus vêm do `/offerbook`; a identidade visual vem do `DESIGN.md` gerado pelo `/design-md`. A skill monta prompts de geração de imagem parametrizados pela sua marca; quem gera a imagem é você, na ferramenta de sua escolha. Zero marca de terceiros embutida.*

---

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Todo entregável sai nos **3 formatos** (`.md` fonte · `.html` com os tokens do `projetos/{slug}/DESIGN.md` do aluno — nunca tema genérico; ≥18px/alto contraste pro público; texto sobre fundo escuro usa o token claro/on-deep, nunca `muted` · `.pdf` via `scripts/gerar_pdf.sh`). Toda entrega E todo checkpoint abrem o `.html` renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e enviam o arquivo na conversa; nunca peça aprovação sem o usuário ver renderizado. Feche SEMPRE apontando UM próximo comando (ordem canônica do mapa). Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF; Apify é central nas skills de coleta, fallback só em cota estourada — `_shared/nunca-travar.md`).
