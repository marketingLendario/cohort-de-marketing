# Aula 01 — Pesquisa, Concorrentes e Ofertas com Claude Code

> **Squad Marketing · Cohort Academia Lendaria**

Repo do aluno da Aula 01. Aqui voce recebe **5 skills** para o Claude Code que orquestram pesquisa de ICP, analise de concorrentes, caca de tendencias, organizacao de criativos e construcao de offerbook. Tudo o que voce precisa para chegar pronta na Aula 02 (Arquiteto de Funil).

---

## O que voce ganha nesta aula

| Skill | O que faz | Output |
|---|---|---|
| `/pesquisa-icp` | Pesquisa estruturada de cliente ideal em 10 modulos | ICP completo (md + html + resumo) |
| `/competitor-analysis` | Mapeia 3-5 concorrentes em 4 vetores e aponta brecha | Dossie + briefing para offerbook |
| `/trend-hunting` | Identifica tendencias emergentes em 4 fontes (X, Reels, TikTok, LinkedIn) | Relatorio + variacoes prontas para teste |
| `/swipe-file` | Organiza criativos winners categorizados | Biblioteca pesquisavel + briefing para Copy |
| `/offerbook` | Consolida tudo num offerbook de 7 blocos (squad 3 mentes) | Livro da Oferta pronto para alimentar Funil |

**Tese-mae da aula:** mapear mercado, ler concorrentes e desenhar uma oferta que sai da gaveta, com o Claude Code orquestrando a pesquisa.

---

## Setup (5 minutos)

### Pre-requisitos

- **Claude Code** instalado ([download](https://docs.claude.com/claude-code))
- **Git** instalado
- **Apify MCP** (opcional, para automatizar scrape de concorrentes e tendencias)

### Passo a passo

**1. Clone este repo no seu computador**

```bash
git clone https://github.com/fran-lendaria/aula-01-pesquisa-claude-code.git
cd aula-01-pesquisa-claude-code
```

**2. Abra o Claude Code no diretorio**

```bash
claude
```

As 5 skills estao em `.claude/skills/` e serao carregadas automaticamente.

**3. Verifique que as skills estao instaladas**

No Claude Code, digite:

```
/pesquisa-icp
```

Deve aparecer o menu da skill. Se aparecer, esta funcionando.

---

## Fluxo da aula (4 horas)

### Bloco 1 (50 min) — ICP com /pesquisa-icp

```
/pesquisa-icp [nome do seu negocio]
```

A skill faz 10 modulos de perguntas. Voce responde com dados reais (formularios, entrevistas, reviews). Saida: 3 arquivos ICP.

**Pre-requisito:** ter minimo 10 fontes de dados reais (entrevistas, formularios, comentarios).

### Bloco 2 (50 min) — Concorrentes + Tendencias (paralelo)

```
/competitor-analysis [seu nicho]
```

E em outra aba do Claude Code:

```
/trend-hunting [seu nicho]
```

Saida: dossie de concorrentes + relatorio de tendencias + 2 briefings.

### Bloco 3 (50 min) — Swipe File

```
/swipe-file capturar
```

A skill usa os briefings do bloco 2 para organizar 10-15 criativos winners.

### Bloco 4 (50 min) — Offerbook com squad 3 mentes

```
/offerbook [nome do seu produto]
```

A skill consolida ICP + dossie + swipe file + as 3 mentes (Jobs + Musk + Hormozi do advisory-board) em 7 blocos do offerbook.

**Output final:** offerbook completo pronto para alimentar a Aula 02 (Arquiteto de Funil).

---

## Estrutura do repo

```
.
├── README.md                       este arquivo
├── .claude/
│   └── skills/                     as 5 skills (Claude Code carrega automatico)
│       ├── pesquisa-icp/
│       │   └── SKILL.md
│       ├── competitor-analysis/
│       │   └── SKILL.md
│       ├── trend-hunting/
│       │   └── SKILL.md
│       ├── swipe-file/
│       │   └── SKILL.md
│       └── offerbook/
│           └── SKILL.md
├── templates/
│   ├── Template-Offerbook.docx     template Word original
│   └── ICP-template.md             template para preencher manualmente (se nao usar a skill)
├── exemplos/
│   └── icp-exemplo-contabilidade.md   ICP completo preenchido (nicho contabilidade)
└── docs/
    ├── workflow.md                 fluxo completo da Aula 01
    └── conexao-aula-02.md          handoff para a proxima aula
```

---

## Onde voce esta no cohort

```
VOCE
 |
 v
 Squad Marketing
 |
 +-- AULA 01: Research Analyst        <- voce esta aqui
 +-- AULA 02: Arquiteto de Funil      proxima
 +-- AULA 03: Trafego Pago            depois
 +-- AULA 04: Analise de Dados        final
```

Cada aula entrega um squad pronto. Voce sai da Aula 01 com:

1. ICP completo
2. Dossie de concorrentes
3. Relatorio de tendencias
4. Swipe file organizado
5. **Offerbook preenchido**

Esses 5 artefatos sao o **input direto** da Aula 02.

---

## Regras de ouro

### Pesquisa antes da oferta

A regra-mae do cohort: **pesquisa antes da oferta, oferta antes de copy, copy antes de ads**. Pular essa ordem queima verba e queima reputacao.

### Voz do cliente, sempre verbatim

Toda secao com dados reais precisa de citacao literal do cliente. Sem citacao, marcar `[SUPOSICAO]`. Persona inventada vira oferta que nao vende.

### Brecha de angulo > brecha de preco

Preco e copiavel em 30 dias. Historia (angulo) nao se copia. Quando o `/competitor-analysis` sugere brecha, prefira sempre angulo.

### Swipe file e inspiracao, nao copia

Voce extrai o **padrao** (estrutura, formato, angulo) e adapta ao seu ICP. Copiar literal e pena algoritmica + risco juridico.

### Offerbook antes de qualquer copy

Nada de LP, email ou ad antes do offerbook aprovado pelo dono do negocio. Essa regra esta no SKILL.md da `/offerbook` e voce vai ouvir varias vezes ao longo do cohort.

---

## Suporte

- **Duvidas tecnicas (skills nao carregam, Claude Code com erro):** abra issue neste repo
- **Duvidas de conteudo (como interpretar o ICP, qual brecha escolher):** canal do cohort no Discord/WhatsApp
- **Bug ou melhoria nas skills:** PR direto neste repo

---

## Proxima aula

**Aula 02 — Arquiteto de Funil:** estruturar o funil, gerar a pagina de venda e produzir uma bateria de criativos prontos para rodar.

A Aula 02 assume que voce traz os 5 artefatos da Aula 01. Ver `docs/conexao-aula-02.md` para o handoff completo.

---

**Construido com:** Synkra AIOX + Claude Code + Academia Lendaria
