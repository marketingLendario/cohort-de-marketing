---
name: mockup-produto
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

> **Recriar NUNCA apaga o que existe (regra dura).** Se a peça que você vai gerar JÁ EXISTE no projeto (arquivo, lote de PNGs, pasta), o novo sai como **versão nova** (sufixo `-v2`, `-v3`… ou subpasta `v2/`) e o antigo fica intocado. Apagar ou sobrescrever trabalho existente SÓ com ordem explícita do dono nesta conversa ("pode apagar", "substitui"). O dono compara as versões e decide qual usar; índices, galerias e o Book mostram as duas, com a mais nova primeiro, e **cada versão antiga leva um botão ✕ "Excluir esta versão"**: o ✕ NUNCA apaga arquivo do disco — ele só tira a versão da visualização, pra não poluir o Book/galeria. Ao clicar, abre a confirmação: *"Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco."* Confirmou, a seção some (persistido em `localStorage`) e um link discreto **"Mostrar versões ocultas (N)"** no rodapé traz de volta quando quiser. Apagar do disco de verdade continua exigindo ordem explícita do dono no chat.

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

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada aplicando os **tokens do `projetos/{slug}/DESIGN.md` da marca do aluno** (cores, fontes, borda/raio, tamanho, logo). NUNCA use um tema fixo/genérico (dark, champagne, "padrão do cohort", template pronto) — a identidade é sempre a do `DESIGN.md`. Legibilidade conforme o público (nichos 50+/acessibilidade → fonte grande ≥18px, alto contraste). **Contraste por fundo (regra dura):** texto sobre fundo ESCURO usa o token CLARO da marca (ex.: `on-deep`/creme), NUNCA o token `muted` (que é do fundo CLARO e some no escuro); e legenda/microcopy de apoio sai MENOR e mais leve (opacidade ~.7) que o corpo, pra não competir com headline nem com o botão. CSS inline, self-contained, sem emoji, português acentuado. Se não houver `DESIGN.md`, gere-o com `/design-md` antes.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/mockup-produto-funil/scripts/gerar_pdf.sh <arquivo>.html
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
