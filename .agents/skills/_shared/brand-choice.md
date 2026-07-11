# Gate de Brand Choice (compartilhado entre skills Aula 01)

Este é o protocolo que TODA skill que gera HTML deve seguir antes de renderizar.

## Lógica

```
1. Verificar se existe .cohort-brand-choice no diretório atual
   ↓
2a. EXISTE → ler arquivo, usar escolha salva (não pergunta de novo)
2b. NÃO EXISTE → perguntar ao aluno, salvar escolha
```

## Implementação na skill

### Passo 1 — Checar arquivo de configuração

```
ls .cohort-brand-choice 2>/dev/null
```

Se existir, leia o conteúdo:

```
cat .cohort-brand-choice
```

Os valores possíveis são:
- `neutro` — usar brand neutro padrão (dark mode + cinza, sem identidade de marca específica)
- `design-md` — usar DESIGN.md (que aluno gerou com /design-md)

Pule para o passo de geração com a escolha salva.

### Passo 2 — Se não existe, perguntar

Exiba esta pergunta exata ao aluno:

> Antes de gerar o entregável visual, como você quer a brand?
>
> **1. Brand neutro (padrão)** — dark mode, cinza limpo, Source Serif 4. Sem identidade de marca específica. Já vem pronto, zero esforço.
>
> **2. Minha brand (via /design-md)** — você roda `/design-md` primeiro pra gerar `DESIGN.md` com sua logo, cores e fontes. Depois eu uso ele em todos os entregáveis visuais. Vou parar agora pra você rodar.
>
> **3. Já rodei /design-md, usa o que já tem** — você já tem `DESIGN.md` em `projetos/{slug}/` (ou na raiz pré-projeto). Eu leio e aplico.
>
> Qual prefere? (1, 2 ou 3)

### Passo 3 — Processar resposta

**Se resposta = 1 (neutro padrão):**

```
echo "neutro" > .cohort-brand-choice
```

Diga: *"Escolha salva. Vou usar brand neutro em todos os entregáveis visuais deste projeto."*

Continue gerando o HTML com tokens neutros hardcoded no template (`#BFBFBF`, Source Serif 4, etc.).

**Se resposta = 2 (rodar /design-md):**

Diga: *"Beleza. Encerro aqui. Rode `/design-md` primeiro pra gerar seu DESIGN.md, depois volte e me chame de novo."*

Encerre a skill (não gere nada).

**Se resposta = 3 (DESIGN.md existente):**

Verifique primeiro dentro do projeto ativo:

```
ls projetos/{slug}/DESIGN.md 2>/dev/null
```

Se ainda não houver projeto, use a raiz como fallback pré-projeto:

```
ls DESIGN.md 2>/dev/null
```

Se não existir em nenhum dos dois lugares, avise: *"Não achei DESIGN.md. Rode `/design-md` primeiro."* e encerre.

Se existir:

```
echo "design-md" > .cohort-brand-choice
```

Leia o `DESIGN.md` e extraia tokens (cores primária/secundária, fontes, logo). Use esses tokens no HTML em vez dos AL.

Diga: *"Escolha salva. Vou usar a brand do seu DESIGN.md em todos os entregáveis visuais deste projeto."*

## Garantia importante

- O `.cohort-brand-choice` é **por projeto**. Assim que o projeto existe, a escolha vive em **`projetos/{slug}/.cohort-brand-choice`** — não na raiz. A raiz (cwd) só guarda o arquivo **pré-projeto** (Aula 1, antes de a pasta `projetos/{slug}/` nascer); quando o `/metodo-funil` migra o pack da Aula 1 pra `projetos/{slug}/`, ele leva o `.cohort-brand-choice` junto. Cada projeto pode ter sua escolha. Ao checar/salvar, procure primeiro em `projetos/{slug}/.cohort-brand-choice` e só caia na raiz se ainda não houver projeto.
- Adicione `.cohort-brand-choice` ao `.gitignore` do aluno se ele perguntar (é decisão local, não precisa versionar).
- Se aluno quiser TROCAR a escolha depois, basta apagar o arquivo: `rm .cohort-brand-choice` e rodar de novo.

## Tokens brand neutro (hardcoded quando escolha = `neutro`)

```css
--background: #0A0A0A;
--card: #0F0F0F;
--raised: #262626;
--border: #262626;
--foreground: #E5E5E5;
--muted-foreground: #999999;
--primary: #BFBFBF;
--primary-light: #E5E5E5;
--primary-deep: #595959;
--font-body: 'Source Serif 4', Georgia, serif;
--font-ui: Inter, system-ui, sans-serif;
--font-display: Inter, system-ui, sans-serif;
--font-mono: ui-monospace, Menlo, monospace;
```

Google Fonts link:
```
https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600&family=Inter:wght@400;600;700&display=swap
```

Os templates dos 4 skills (avatar, espião, trend, swipe) já vêm com esses tokens hardcoded. Quando aluno escolhe `neutro`, basta usar o template como está. Quando escolhe `design-md`, substituir os tokens em `:root` pelos do `DESIGN.md`.
