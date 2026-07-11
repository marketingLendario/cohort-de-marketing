# Cohort de Marketing — Aula 02

> **Academia Lendária · Squad Funil**
>
> Funil, Páginas e Conteúdo com Claude Code

Bem-vinda ao material da **Aula 02** do Cohort de Marketing. Este repo contém tudo o que você precisa para transformar o offerbook da Aula 01 em um funil completo — com páginas, copy, email, conteúdo e back-end — usando o Claude Code.

---

## Comece por aqui

O offerbook que você montou na Aula 01 é o pré-requisito. Se ainda não fez, volte para a Aula 01 antes de continuar.

**Ponto de entrada da Aula 02:**

```
/design-md
```

O `/design-md` cria ou ativa a identidade visual do projeto em `projetos/{slug}/DESIGN.md`. Depois rode `/metodo-funil`: ele lê o offerbook, identifica o estágio de consciência do público e gera o **mapa de execução** — a ordem exata de quais skills rodar e em que sequência.

---

## O que você ganha na Aula 02

As skills abaixo montam o squad **Arquiteto de Funil**:

| Skill | O que faz | Output |
|---|---|---|
| `/metodo-funil` | Diagnóstico de estágio + mapa de execução completo | Qual funil usar + ordem das skills |
| `/avatar-funil` | ICP detalhado, dores, objeções e voz do cliente | Perfil de avatar pronto para copy |
| `/copy-funil` | Hooks, headline, bullets, CTA e objeções por estágio | Blocos de copy organizados |
| `/design-md` | Extrai paleta, tipografia e estilo da sua URL | DESIGN.md da sua marca |
| `/pagina-vendas-funil` | Estrutura completa da página de vendas (15 blocos) | Página estruturada para revisar e publicar |
| `/vsl-funil` | Roteiro de VSL Direct Response | Script de vídeo de vendas |
| `/advertorial-funil` | Página editorial de pré-venda pra público frio (nível 5) | Estrutura de advertorial |
| `/lancamento-funil` | Funil de lançamento/PLF pra público frio com lista (nível 5) | PLCs → carrinho → fechamento |
| `/webinario-funil` | Funil de webinário/aula que vende (níveis 4-3) | Registro → roteiro → pós-venda |
| `/quiz-funil` | Funil de quiz/diagnóstico que segmenta e casa a oferta (nível 4) | Quiz + páginas de resultado |
| `/mockup-produto-funil` | Mockups dos produtos/bônus na identidade da marca | Prompts de mockup prontos |
| `/email-funil` | Sequências de nutrição e venda por estágio | Cadência de email pronta |
| `/conteudo-funil` | Mapa de conteúdo orgânico por estágio de consciência | Reels · carrosséis · stories · roteiros |
| `/criativos-funil` | Anúncios casados ao estágio do público | Briefing de criativos pagos |
| `/whatsapp-funil` | Sequências WhatsApp e DM por momento do funil | Mensagens prontas por etapa |
| `/backend-funil` | Upsell, OTO, downsell, order bump, janela 4h, LTV | Estrutura completa de back-end |
| `/recuperacao-funil` | Carrinho abandonado, cartão recusado, boleto | Sequências de recuperação |
| `/cro-funil` | KPIs por etapa, teste A/B, quando escalar | Protocolo de otimização |

**Tese-mãe da Aula 02:** um funil não é uma página. É um sistema. Cada peça tem um trabalho — e existe uma ordem certa para montar.

---

## Setup em 5 minutos

### Pré-requisitos

- **Claude Code** instalado ([download](https://docs.claude.com/claude-code))
- **Aula 01 concluída** — você precisa ter um offerbook do seu produto
- **Git** instalado

### Passo a passo

**1. Clone este repo (se ainda não clonou)**

```bash
git clone https://github.com/marketingLendario/cohort-de-marketing.git
cd cohort-de-marketing
```

**2. Abra o Claude Code no diretório**

```bash
claude
```

As 25 skills em `.claude/skills/` são carregadas automaticamente. No Codex, `.agents/skills/` é um espelho literal da mesma pasta.

**3. Teste que as skills estão instaladas**

```
/metodo-funil
```

Se aparecer o menu da skill, está funcionando.

---

## Fluxo da aula

### Passo 1 — Identidade visual (10 min)

```
/design-md
```

Cria ou reaproveita o `DESIGN.md` da marca e salva em `projetos/{slug}/`.

### Passo 2 — Diagnóstico (15 min)

```
/metodo-funil
```

Lê o offerbook do projeto e retorna:
- Estágio de consciência do seu público (1–5)
- Tipo de funil recomendado
- Mapa de execução com todas as peças em ordem

### Passo 3 — Copy (20 min)

```
/copy-funil [nome do produto]
```

Use o mapa de execução do passo 2. A skill gera hooks, headline, bullets, CTA e trata objeções com base no estágio identificado.

### Passo 4 — Página de vendas (30 min)

```
/pagina-vendas-funil [nome do produto]
```

Usa o `DESIGN.md` + copy do passo 3. Gera a estrutura completa em 15 blocos.

### Passo 5 — Email + Conteúdo (paralelo, 30 min)

Em abas separadas do Claude Code:

```
/email-funil [nome do produto]
```

```
/conteudo-funil [nome do produto]
```

### Passo 6 — Back-end (15 min)

```
/backend-funil [nome do produto]
```

Monta a estrutura de upsell, OTO, downsell e janela de 4h.

---

## Estrutura do repo

```
.
├── README.md                          aula 01 (Fran — Research + Offerbook)
├── GUIA-DO-ALUNO.html                 guia visual da aula 01
├── .env.example                       template de chaves de API
├── .claude/
│   └── skills/
│       ├── avatar-funil/              aula 01 + reforço de pesquisa
│       ├── espiao-do-concorrente/     aula 01
│       ├── trend-hunting/             aula 01
│       ├── swipe-file/                aula 01
│       ├── offerbook/                 aula 01
│       ├── metodo-funil/              aula 02
│       ├── copy-funil/                aula 02
│       ├── design-md/                 aula 02
│       ├── pagina-vendas-funil/       aula 02
│       ├── vsl-funil/                 aula 02
│       ├── email-funil/               aula 02
│       ├── conteudo-funil/            aula 02
│       ├── criativos-funil/           aula 02
│       ├── whatsapp-funil/            aula 02
│       ├── backend-funil/             aula 02
│       ├── recuperacao-funil/         aula 02
│       ├── cro-funil/                 aula 02
│       ├── advertorial-funil/         aula 02
│       ├── lancamento-funil/          aula 02
│       ├── webinario-funil/           aula 02
│       ├── quiz-funil/                aula 02
│       └── mockup-produto-funil/      aula 02
├── .agents/
│   └── skills/                        espelho literal para Codex
├── aula-02/
│   ├── README.md                      este arquivo
│   └── aula-design-md-GUIA-ALUNO.html guia visual do design-md
└── projetos/                          nasce quando as skills rodam
```

---

## Onde você está no cohort

```
VOCÊ
 |
 v
 Squad Marketing
 |
 +-- AULA 01: Research Analyst        concluída
 +-- AULA 02: Arquiteto de Funil      <- você está aqui
 +-- AULA 03: Tráfego Pago            próxima
 +-- AULA 04: Análise de Dados        final
```

---

## Regras de ouro

### Offerbook antes de funil

A skill `/metodo-funil` precisa do offerbook para funcionar. Sem offerbook, não tem diagnóstico de estágio — e sem diagnóstico, você monta o funil errado pro público certo.

### Execute na ordem do mapa

O mapa de execução do `/metodo-funil` define a ordem por um motivo: cada skill usa o output da anterior. `/pagina-vendas-funil` consome a copy do `/copy-funil`. `/email-funil` consome o `DESIGN.md`. Pular etapas gera retrabalho.

### DESIGN.md é a âncora visual

Rode `/design-md` uma vez e aprove explicitamente a identidade. O arquivo gerado é referenciado por `/pagina-vendas-funil`, `/email-funil`, `/conteudo-funil` e demais peças automaticamente a partir de `projetos/{slug}/DESIGN.md`.

### Recovery é dinheiro esquecido

Não pule `/recuperacao-funil` e `/cro-funil`. Carrinho abandonado, cartão recusado e boleto vencido representam receita que já estava quase dentro. São as sequências com maior ROI do funil.

---

## Suporte

- **Dúvidas técnicas:** abra issue neste repo
- **Dúvidas de conteúdo:** canal do cohort
- **Bug ou melhoria:** PR direto neste repo

---

**Construído com:** Academia Lendária + Claude Code
