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
ls relatorio-avatar.md 2>/dev/null
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
- Nome do produto
- Promessa
- USP (proposta única de venda)
- Valor, ancoragem e bônus (responder as 9 perguntas de valor)
- Conteúdo do treinamento (módulos + a técnica de cada um)
- Autoridade (Especialista + Depoimentos)

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

Regras de geração:
- MD é a fonte de verdade. Nunca editar só o DOCX/HTML; corrigir o MD e regenerar ambos.
- Template original do DOCX NUNCA é modificado — o script faz cópia.
- Se faltar campo no MD, o DOCX gera com `[A PREENCHER]` no lugar (não falha).
- Pré-requisito DOCX: `pip install python-docx` (uma vez).
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
> **Pronto pra continuar? A Aula 02 começa agora:** rode `/metodo-funil` — ele diagnostica o nível de consciência do seu público e monta o mapa de execução do seu funil, peça por peça.

Nao pule esse anúncio — fecha o trilho completo da Aula 01 e já abre a porta da Aula 02.

---

## Regras

- **Idêntico à estrutura:** todas as seções e campos exatos, inclusive os campos específicos da História (estilo, "porquê" do problema, nome da situação do problema/resultado). Não reorganizar nem resumir.
- **Blocos separados** (guias/tabs), um por bloco.
- **Materiais = links que a equipe abre, NUNCA caminhos de arquivo local.** Sem link → "A ADICIONAR".
- **Avatar e Análise de Cliente vêm da pesquisa real**, nunca de inferência.
- **Texto limpo:** nada de markdown cru no documento final (sem `##`, `**`, `===`).
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
