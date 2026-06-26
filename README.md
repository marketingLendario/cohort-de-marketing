# Cohort de Marketing com Claude Code

> **Academia Lendária**
>
> Sua máquina de marketing com IA, rodando em 4 semanas.

Bem-vinda ao repositório oficial do **Cohort de Marketing**. Este repo contém todo o material das aulas ao vivo, skills do Claude Code, templates e exemplos. É clone-and-run: você clona, abre Claude Code, e começa a executar.

---

## Comece por aqui

```bash
git clone https://github.com/marketingLendario/cohort-de-marketing.git
cd cohort-de-marketing
claude
```

As skills em `.claude/skills/` carregam automaticamente. Digite `/` no Claude Code e veja as 16 skills disponíveis.

---

## Aulas do cohort

### Aula 1 · Pesquisa, Concorrentes e Ofertas com Claude Code

**Status:** disponível
**Onde:** [`aula-01/`](./aula-01/)

Mapear mercado, ler concorrentes e desenhar uma oferta que sai da gaveta. Skills usadas: `/avatar-funil`, `/espiao-do-concorrente`, `/trend-hunting`, `/swipe-file`, `/offerbook`.

**Comece pelo guia visual:** [`aula-01/GUIA-DO-ALUNO.html`](./aula-01/GUIA-DO-ALUNO.html)

### Aula 2 · Funil e Páginas

**Status:** disponível
**Onde:** [`aula-02/`](./aula-02/)

Estruturar o funil, gerar a página de venda e produzir uma bateria de criativos prontos para rodar. Skills usadas: `/metodo-funil`, `/pagina-vendas`, `/vsl-funil`, `/copy-funil`, `/criativos-funil`, `/email-funil`, `/whatsapp-funil`, `/recuperacao`, `/cro-funil`, `/back-end`, `/conteudo-funil`, `/design-md`.

### Aula 3 · Tráfego e Criativos

**Status:** em breve (11/07)

### Aula 4 · Dados e Receita

**Status:** em breve (18/07)

---

## As 16 skills do cohort

Todas instaladas em `.claude/skills/` na raiz. Funcionam de qualquer aula.

### Pesquisa e Oferta (Aula 1)

| Skill | O que faz |
|---|---|
| `/avatar-funil` | Pesquisa de avatar em 7 dimensões + focus group sintético (MD + HTML + PDF) |
| `/espiao-do-concorrente` | Dossiê multi-fonte de 1 concorrente (Meta Ad Library + Google Ads + redes + site + reviews) |
| `/trend-hunting` | Identifica tendências emergentes em 4 fontes antes da saturação |
| `/swipe-file` | Organiza criativos winners categorizados por tipo/formato/padrão |
| `/offerbook` | Livro da Oferta em 7 blocos (MD + DOCX usando template oficial) |

### Funil e Páginas (Aula 2)

| Skill | O que faz |
|---|---|
| `/metodo-funil` | Método de construção de funil (Alan Nicolas) |
| `/pagina-vendas` | Página de vendas estruturada |
| `/vsl-funil` | Video Sales Letter |
| `/copy-funil` | Copy específica para funil |
| `/criativos-funil` | Criativos para anúncios |
| `/email-funil` | Email marketing do funil |
| `/whatsapp-funil` | WhatsApp marketing do funil |
| `/recuperacao` | Recuperação de carrinho abandonado |
| `/cro-funil` | Otimização de conversão |
| `/back-end` | Backend e integrações |
| `/conteudo-funil` | Conteúdo para LP e VSL |
| `/design-md` | Design system markdown que renderiza HTML com brand |

---

## Estrutura do repo

```
.
├── README.md                    este arquivo
├── .env.example                 template de chaves de API (copie para .env)
├── .gitignore
├── .claude/
│   └── skills/                  16 skills carregam automaticamente
├── aula-01/                     Pesquisa, Concorrentes e Ofertas
│   ├── README.md
│   ├── GUIA-DO-ALUNO.html       leia primeiro
│   ├── docs/                    workflow + handoff + SKILLS-INDEX (mapa de nomes)
│   └── templates/               Template-Offerbook.docx
└── aula-02/                     Funil e Páginas
    ├── README.md
    ├── DESIGN.md
    └── slides-aula-funil-claude-design.md
```

---

## Configuração (chaves de API opcionais)

```bash
cp .env.example .env
```

Abra o `.env` e preencha as chaves que quiser usar. Todas são opcionais — as skills funcionam em modo manual sem chaves. Cada chave tem instrução de onde pegar no `.env.example`.

---

## Regras de ouro do cohort

### Pesquisa antes da oferta

A regra-mãe: **pesquisa antes da oferta, oferta antes de copy, copy antes de ads**. Pular essa ordem queima verba.

### Voz do cliente, sempre verbatim

Toda seção com dados reais precisa de citação literal. Sem citação, marcar `[SUPOSIÇÃO]`. Persona inventada vira oferta que não vende.

### Brecha de ângulo > brecha de preço

Preço é copiável em 30 dias. História (ângulo) não se copia.

### Offerbook antes de qualquer copy

Nada de LP, e-mail ou ad antes do offerbook aprovado pelo dono do negócio.

---

## Suporte

- **"Tinha uma skill chamada X, qual é?":** consulte [`aula-01/docs/SKILLS-INDEX.md`](./aula-01/docs/SKILLS-INDEX.md) — mapa de nomes (aliases antigos → canônico)
- **Dúvidas técnicas:** abra issue neste repo
- **Dúvidas de conteúdo:** canal do cohort
- **Bug ou melhoria:** PR direto neste repo

---

**Construído com:** Academia Lendária + Claude Code
