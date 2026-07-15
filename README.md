# Cohort de Marketing com Claude Code

> **Academia Lendária**
>
> Sua máquina de marketing com IA, rodando em 4 semanas.

Bem-vinda ao repositório oficial do **Cohort de Marketing**. Este repo contém todo o material das aulas ao vivo, as skills do Claude Code (funcionam também no Codex), templates e exemplos. É clone-and-run: você clona, abre o Claude Code e começa a executar.

---

## Comece por aqui

**1. Leia o [Guia do Aluno](./GUIA-DO-ALUNO.html)** — as Aulas 1 e 2 num documento só, na ordem, do zero absoluto ao funil completo. Abra o arquivo `GUIA-DO-ALUNO.html` no navegador.

**2. Prepare o ambiente:**

```bash
git clone https://github.com/marketingLendario/cohort-de-marketing.git
cd cohort-de-marketing
claude
```

**3. Rode o primeiro comando:**

```
/comecar
```

O `/comecar` confere tudo por você (skills carregadas, chave do Apify, Python, atalhos do terminal) e aponta a primeira skill a rodar. Deu erro em qualquer ponto do curso? Rode `/comecar` de novo.

> Já tem a pasta da aula anterior? **Não clone de novo** — entre na pasta e rode `git pull` pra receber as atualizações.

---

## Aulas do cohort

### Aula 1 · Pesquisa, Concorrentes e Ofertas

**Status:** disponível · **Guia:** [Guia do Aluno, Parte 1](./GUIA-DO-ALUNO.html)

Mapear mercado, ler concorrentes e desenhar uma oferta que sai da gaveta. Skills, na ordem: `/avatar-funil` → `/espiao-do-concorrente` → `/trend-hunting` → `/swipe-file` → `/offerbook`.

### Aula 2 · Identidade e Funil completo

**Status:** disponível · **Guia:** [Guia do Aluno, Parte 2](./GUIA-DO-ALUNO.html)

Da identidade visual ao funil montado: `/design-md` → `/metodo-funil` (o mapa dita a ordem) → copy, quiz/webinário/VSL, página, e-mails, conteúdo, recuperação, back-end, CRO — com o **Book do Funil** como hub de tudo que você gera.

### Aula 3 · Tráfego

**Status:** disponível. [Material da Aula 3](./aula-03/README.md). As seis skills canônicas — `/zelador` → `/briefista` → `/estruturador` → `/ads-creative-factory` → `/leitor-de-metricas` → `/diagnosticador` — executam via Claude Code ou Codex CLI local e preservam os artefatos no projeto. A Creative Factory exige um brand pack externo explícito, mas a versão 2.1.0 já o cria a partir do `DESIGN.md` com preview e declaração de direitos, sem editar JSON; a geração usa a sessão local autenticada do Codex e publicação e decisões continuam humanas.

### Aula 4 · Dados

**Status:** módulo local disponível. Siga o [README da Aula 4](./aula-04/README.md) para executar o exemplo público de três semanas, gerar ledger, leitura histórica, reconciliação e diagnóstico inconclusivo sem Studio ou serviço privado.

---

## As 31 skills

Instaladas canonicamente em `.claude/skills/` — carregam automaticamente ao abrir o Claude Code na pasta. Para o Codex, `.agents/skills/` é um espelho literal da pasta canônica; chame com `@` quando a interface usar esse prefixo. Se houver dúvida, siga sempre `.claude/skills/` como fonte de verdade.

| Grupo | Skills |
|-------|--------|
| **Começo** | `/comecar` (o passo zero) · `/status-funil` (onde você está) |
| **Pesquisa (Aula 1)** | `/avatar-funil` · `/espiao-do-concorrente` · `/trend-hunting` · `/swipe-file` · `/offerbook` |
| **Fundação (Aula 2)** | `/design-md` · `/metodo-funil` · `/copy-funil` |
| **Formatos de funil** | `/quiz-funil` · `/webinario-funil` · `/vsl-funil` · `/advertorial-funil` · `/lancamento-funil` |
| **Peças** | `/pagina-vendas-funil` · `/email-funil` · `/whatsapp-funil` · `/conteudo-funil` · `/recuperacao-funil` · `/backend-funil` · `/cro-funil` |
| **Reforço de oferta** | `/mockup-produto-funil` · `/bonus-funil` · `/criativos-funil` |
| **Tráfego (Aula 3)** | `/zelador` · `/briefista` · `/estruturador` · `/ads-creative-factory` · `/leitor-de-metricas` · `/diagnosticador` |

As skills leem o **Perfil do Projeto** (no topo do seu offerbook) e se adaptam ao seu negócio: especialista, agência, B2B, negócio local, nicho regulado (saúde/jurídico/psico/financeiro), afiliado ou "ainda não sei o que vender".

Para entender exatamente o que cada skill pode pedir ao usuário, consulte o [Mapa de inputs das skills](./docs/skill-inputs.md).

---

## Estrutura do repositório

```
cohort-de-marketing/
├── GUIA-DO-ALUNO.html           ← leia primeiro (Aulas 1 e 2 na ordem)
├── AGENTS.md                     instruções pro Codex e outros agentes
├── .env.example                  template das chaves (copie pra .env)
├── apps/
│   └── academia-lendaria-ads-studio/  painel Ads Factory
├── .claude/
│   └── skills/                   as 31 skills + regras compartilhadas (_shared/)
├── .agents/
│   └── skills/                   espelho literal para Codex carregar as mesmas skills
├── docs/
│   ├── skill-inputs.md            mapa dos inputs pedidos por cada skill
│   ├── stories/                   trilha de desenvolvimento do painel
│   └── design/mocks/              mocks visuais importados
├── aula-01/                      docs e templates da Aula 1
├── aula-02/                      material de apoio da Aula 2
├── aula-03/                      material didático e runtime empacotado da Aula 3
└── projetos/                     nasce quando você roda as skills (só seu, fora do git)
```

---

## Chaves de API (.env)

```bash
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

A chave que importa de verdade é a do **Apify** (`APIFY_API_TOKEN` — grátis, US$ 5/mês de crédito): ela é **central** pras skills de coleta (espião, trend, conteúdo, criativos). Sem ela essas skills param e te ajudam a configurar — ou rode `/comecar`, que cuida disso por você. As demais chaves são opcionais. O `.env` nunca vai pro GitHub (está no `.gitignore`).

---

*Academia Lendária · Cohort de Marketing · material de aluno — dúvidas: rode `/comecar` ou chame no grupo da turma.*
