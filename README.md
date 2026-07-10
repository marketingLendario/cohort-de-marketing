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

**Status:** operacional em piloto no Marketing Studio. As cinco skills canônicas — `/zelador` → `/briefista` → `/estruturador` → `/leitor-de-metricas` → `/diagnosticador` — já executam via Codex CLI local, com persistência, revisão humana e artefatos no projeto. O modo Cohort prepara e recomenda; publicação e decisões continuam humanas.

### Aula 4 · Dados

**Status:** em breve. A operação semanal da Aula 3 já preserva métricas, selos, diagnóstico e decisões como base do futuro painel.

---

## As 30 skills

Instaladas canonicamente em `.claude/skills/` — carregam automaticamente ao abrir o Claude Code na pasta. Para o Codex, `.agents/skills/` é um espelho literal da pasta canônica; chame com `@` quando a interface usar esse prefixo. Se houver dúvida, siga sempre `.claude/skills/` como fonte de verdade.

| Grupo | Skills |
|-------|--------|
| **Começo** | `/comecar` (o passo zero) · `/status-funil` (onde você está) |
| **Pesquisa (Aula 1)** | `/avatar-funil` · `/espiao-do-concorrente` · `/trend-hunting` · `/swipe-file` · `/offerbook` |
| **Fundação (Aula 2)** | `/design-md` · `/metodo-funil` · `/copy-funil` |
| **Formatos de funil** | `/quiz-funil` · `/webinario-funil` · `/vsl-funil` · `/advertorial-funil` · `/lancamento-funil` |
| **Peças** | `/pagina-vendas-funil` · `/email-funil` · `/whatsapp-funil` · `/conteudo-funil` · `/recuperacao-funil` · `/backend-funil` · `/cro-funil` |
| **Reforço de oferta** | `/mockup-produto-funil` · `/bonus-funil` · `/criativos-funil` |
| **Tráfego (Aula 3)** | `/zelador` · `/briefista` · `/estruturador` · `/leitor-de-metricas` · `/diagnosticador` |

As skills leem o **Perfil do Projeto** (no topo do seu offerbook) e se adaptam ao seu negócio: especialista, agência, B2B, negócio local, nicho regulado (saúde/jurídico/psico/financeiro), afiliado ou "ainda não sei o que vender".

Para entender exatamente o que cada skill pode pedir ao usuário, consulte o [Mapa de inputs das skills](./docs/skill-inputs.md).

---

## Marketing Studio

O Marketing Studio unifica Briefing, Jornada de Skills, Artefatos, Ads Studio e Operação Semanal em `apps/academia-lendaria-ads-studio/`.

### Primeira vez no Studio

Depois que o Studio abrir no navegador, toda a jornada acontece pela tela:

1. Em **Seu primeiro acesso**, informe e-mail, senha e o nome do seu negócio.
2. Em **Seus projetos**, escolha **Começar meu projeto** e dê um nome ao trabalho.
3. Se você já tem materiais, escolha **Trazer materiais**, confira a lista e confirme. Os arquivos originais não são alterados.
4. Escolha **Ver minha próxima ação**. A visão geral mostra uma única recomendação e leva direto ao ponto que precisa de atenção.

Se algo interromper a jornada, não apague nem refaça o projeto. Use **Tentar novamente** na própria mensagem. O nome digitado é preservado. No cabeçalho, o indicador de estado explica em linguagem simples o que precisa de atenção; escolha **Verificar novamente** depois de seguir a orientação. Em telas pequenas, os mesmos passos aparecem em uma coluna, com botões de toque amplo.

As instruções abaixo são apenas para quem prepara a instalação. O aluno não precisa copiá-las durante o uso.

Para iniciar tudo pela raiz do repositório, use um único comando:

```bash
node scripts/marketing-studio.mjs start
```

O inicializador prepara os serviços locais necessários e abre o Studio. A tela
do aluno não mostra comandos, configurações internas nem detalhes de banco.

O indicador no cabeçalho mostra **tudo pronto**, **um item precisa de atenção**
ou **ação necessária para continuar**, sempre com recuperação na própria tela.

Comandos de apoio:

```bash
node scripts/marketing-studio.mjs check   # diagnostica sem iniciar
node scripts/marketing-studio.mjs status  # mostra a sessão atual
node scripts/marketing-studio.mjs stop    # encerra só o que o launcher iniciou
```

O shutdown preserva o banco e os artefatos em `projetos/`. Para portas
alternativas, use `--web-port 5188 --bff-port 3308`. A inicialização manual com
`npm run dev` e `npm run dev:server` continua disponível para desenvolvimento.

Validação completa do app:

```bash
npm --prefix apps/academia-lendaria-ads-studio test
npm --prefix apps/academia-lendaria-ads-studio run test:launcher
npm --prefix apps/academia-lendaria-ads-studio run test:visual
npm --prefix apps/academia-lendaria-ads-studio run lint:db
npm --prefix apps/academia-lendaria-ads-studio run test:db
```

O mock visual canônico importado fica em `docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`.

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
│   └── skills/                   as 30 skills + regras compartilhadas (_shared/)
├── .agents/
│   └── skills/                   espelho literal para Codex carregar as mesmas skills
├── docs/
│   ├── skill-inputs.md            mapa dos inputs pedidos por cada skill
│   ├── stories/                   trilha de desenvolvimento do painel
│   └── design/mocks/              mocks visuais importados
├── aula-01/                      docs e templates da Aula 1
├── aula-02/                      material de apoio da Aula 2
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
