# Cohort de Marketing — Aula 01

> **Academia Lendária · Squad Marketing**
>
> Pesquisa, Concorrentes e Ofertas com Claude Code

Bem-vinda ao repositório da **Aula 01** do Cohort de Marketing. Este repo contém tudo o que você precisa para mapear mercado, ler concorrentes e desenhar uma oferta que sai da gaveta — com o Claude Code orquestrando a pesquisa.

---

## Comece por aqui

**Antes de qualquer coisa, abra o guia visual no navegador:**

👉 **[`GUIA-DO-ALUNO.html`](./GUIA-DO-ALUNO.html)** — clica e abre. Tem tudo o que você precisa saber para começar (5 minutos de leitura).

Se preferir markdown puro, o conteúdo está abaixo.

---

## O que você ganha na Aula 01

5 skills para o Claude Code que orquestram todo o squad **Research Analyst**:

| Skill | O que faz | Output |
|---|---|---|
| `/avatar-funil` | Minera dor real em reviews + comunidades + redes, monta avatar em 7 dimensões e roda focus group sintético em 3 personas | Relatório completo de dor + avatar + headline validada |
| `/espiao-do-concorrente` | Varre toda presença pública de 1 concorrente (anúncios pagos + orgânico + site + reputação) e devolve dossiê com brechas | Dossiê com ganchos, ofertas, ângulos, formatos e oportunidades acionáveis |
| `/trend-hunting` | Identifica tendências emergentes em 4 fontes (X, Reels, TikTok, LinkedIn) | Relatório + variações prontas para teste |
| `/swipe-file` | Organiza criativos winners categorizados | Biblioteca pesquisável + briefing para Copy |
| `/offerbook` | Consolida tudo num offerbook de 7 blocos (squad 3 mentes: Jobs + Musk + Hormozi) | Livro da Oferta pronto para alimentar Funil |

**Tese-mãe da Aula 01:** mapear mercado, ler concorrentes e desenhar uma oferta que sai da gaveta.

---

## Setup em 5 minutos

### Pré-requisitos

- **Claude Code** instalado ([download](https://docs.claude.com/claude-code))
- **Git** instalado
- **Python 3.9+** (para os scripts de coleta de algumas skills)

### Passo a passo

**1. Clone este repo**

```bash
git clone https://github.com/marketingLendario/cohort-de-marketing.git
cd cohort-de-marketing
```

**2. Configure suas chaves de API (opcional, mas recomendado)**

```bash
cp .env.example .env
```

Abra o `.env` no editor e preencha as chaves que você quiser usar. **Todas são opcionais** — as skills funcionam sem elas em modo manual (você cola o material, a IA analisa). O `.env.example` explica como pegar cada chave (Meta Ad Library, Apify, OpenAI, etc.) e o que cada uma habilita.

**3. Abra o Claude Code no diretório**

```bash
claude
```

As 5 skills em `.claude/skills/` são carregadas automaticamente.

**4. Teste que as skills estão instaladas**

No Claude Code, digite:

```
/avatar-funil
```

Se aparecer o menu da skill, está funcionando.

---

## Fluxo da aula (4 horas)

### Bloco 1 (50 min) — Pesquisa de Avatar com `/avatar-funil`

```
/avatar-funil [nome do seu negócio ou nicho]
```

A skill faz 4 passos: minera dor real em 3 fontes (reviews, comunidades, redes), ranqueia dores nos 4 critérios da dor cara, monta avatar em 7 dimensões e ainda roda **focus group sintético** com 3 personas testando sua headline. Saída: relatório completo.

**Pré-requisito:** mínimo 20 trechos de dor de 2 fontes diferentes (ou ela cai para modo offline, você cola o que tem).

### Bloco 2 (50 min) — Concorrentes + Tendências (paralelo)

```
/espiao-do-concorrente [nome ou @ do concorrente]
```

A skill varre **toda presença pública** do concorrente (Meta Ad Library, Google Ads Transparency, TikTok Ads, redes sociais, site, reviews, Reclame Aqui) e monta dossiê com ganchos, ofertas, ângulos, brechas e 3 jogadas recomendadas.

Em outra aba do Claude Code:

```
/trend-hunting [seu nicho]
```

### Bloco 3 (50 min) — Swipe File

```
/swipe-file capturar
```

A skill usa os briefings do bloco 2 para organizar 10-15 criativos winners.

### Bloco 4 (50 min) — Offerbook com squad 3 mentes

```
/offerbook [nome do seu produto]
```

Consolida pesquisa de avatar + dossiê do concorrente + tendências + swipe file + as 3 mentes (Jobs + Musk + Hormozi) em 7 blocos.

**Output final:** offerbook completo pronto para alimentar a Aula 02 (Arquiteto de Funil).

---

## Estrutura do repo

```
.
├── README.md                       este arquivo
├── GUIA-DO-ALUNO.html              guia visual interativo (leia primeiro)
├── .env.example                    template de chaves de API (copie para .env)
├── .claude/
│   └── skills/                     as 5 skills (Claude Code carrega automático)
│       ├── avatar-funil/     dor + avatar + focus group (com scripts)
│       ├── espiao-do-concorrente/  dossiê multi-fonte (com scripts)
│       ├── trend-hunting/
│       ├── swipe-file/
│       └── offerbook/
├── templates/
│   └── Template-Offerbook.docx     template Word oficial
├── exemplos/                       exemplos preenchidos
└── docs/
    ├── workflow.md                 fluxo completo da Aula 01
    └── conexao-aula-02.md          handoff para próxima aula
```

---

## Onde você está no cohort

```
VOCÊ
 |
 v
 Squad Marketing
 |
 +-- AULA 01: Research Analyst        <- você está aqui
 +-- AULA 02: Arquiteto de Funil      próxima
 +-- AULA 03: Tráfego Pago            depois
 +-- AULA 04: Análise de Dados        final
```

---

## Regras de ouro

### Pesquisa antes da oferta

A regra-mãe do cohort: **pesquisa antes da oferta, oferta antes de copy, copy antes de ads**. Pular essa ordem queima verba.

### Voz do cliente, sempre verbatim

Toda seção com dados reais precisa de citação literal do cliente. Sem citação, marcar `[SUPOSIÇÃO]` ou `SEM DADO NA PESQUISA`. Persona inventada vira oferta que não vende.

### Brecha de ângulo > brecha de preço

Preço é copiável em 30 dias. História (ângulo) não se copia.

### Swipe file é inspiração, não cópia

Você extrai o **padrão** e adapta ao seu ICP. Copiar literal é pena algorítmica + risco jurídico.

### Offerbook antes de qualquer copy

Nada de LP, e-mail ou ad antes do offerbook aprovado pelo dono do negócio.

### Chaves de API ficam no .env

Nunca cole chave de API direto em código ou em prompt. Sempre no `.env` (gitignored). O `.env.example` explica onde pegar cada uma.

---

## Suporte

- **Dúvidas técnicas:** abra issue neste repo
- **Dúvidas de conteúdo:** canal do cohort
- **Bug ou melhoria:** PR direto neste repo

---

## Próxima aula

**Aula 02 — Arquiteto de Funil:** estruturar o funil, gerar a página de venda e produzir uma bateria de criativos prontos para rodar.

Ver [`docs/conexao-aula-02.md`](./docs/conexao-aula-02.md) para o handoff completo.

---

**Construído com:** Academia Lendária + Claude Code
