# Mapa Guiado do Projeto — Cohort de Marketing

> Versão Markdown do guia `mapa-guiado-do-projeto.html`, otimizada para leitura por IA (Claude Code / Codex) e humanos.
> Repositório: https://github.com/marketingLendario/cohort-de-marketing (privado)
> Sucessor do mapa do "Academia Lendária Ads Studio". Atualizado em 2026-07-21.

---

## Instruções para a IA que ler este arquivo

Se você é um assistente de IA operando neste repositório, siga estas regras ao usar este guia:

1. **Fontes de verdade**: este arquivo é um mapa, não a fonte. As fontes canônicas são: `README.md`, `AGENTS.md`, `.claude/skills/{nome}/SKILL.md` (skills), `data/skill-catalog.json` (catálogo), `data/skill-unlock-rules.json` (desbloqueio), `skill-surface-contract.js` (contrato do mapa/prontidão), `data/contracts/` (schemas versionados). Em conflito, a fonte vence este guia.
2. **Nunca instale nada sem perguntar antes.** Ofereça a instalação em 1 linha, aguarde o "sim".
3. **Nunca deixe o usuário num beco** (regra `.claude/skills/_shared/nunca-travar.md`): todo erro vira explicação em português simples + UM próximo passo.
4. **O estado são os arquivos** em `projetos/{slug}/`, nunca o chat. Nunca diga que fechar a conversa perde progresso.
5. **Nada é publicado sem aprovação humana explícita.** O squad de tráfego prepara e recomenda; publicar, pausar ou alterar campanha na Meta é sempre ação humana (o `/estruturador` só publica via API em 3 gates, com confirmação).
6. **Toda métrica carrega selo**: `Real` (literal da fonte) · `Estimado` (atribuição/projeção da plataforma — todo ROAS é Estimado) · `Calculado` (variação entre dois Real) · `não fornecido` (ausente; nunca inventar nem derivar).
7. **`.claude/skills/` é a fonte canônica; `.agents/skills/` é espelho byte a byte.** Nunca deixe divergirem (`cp -R .claude/skills/. .agents/skills/` refaz).
8. **`projetos/` e `.env` não são versionados** (gitignore). Nunca commite `.env` nem dados reais da conta do aluno.
9. **Slug de projeto**: minúsculas, números e hífen (`^[a-z0-9][a-z0-9-]*$`).
10. Para o usuário leigo: traduza jargão na primeira ocorrência (4 palavras entre parênteses), não infantilize o avançado.

---

## 0. O que é este repositório

**Em uma frase**: a fábrica de marketing do Cohort — **37 skills** (roteiros de IA que executam trabalhos inteiros de funil: pesquisa, oferta, copy, design, páginas, e-mails, criativos, tráfego e análise de dados), organizadas em **4 aulas**, operadas por CLI (Claude Code ou Codex) com aprovação humana em cada passo.

**O que mudou em relação ao Ads Studio antigo**: não existe mais o painel web (`npm run studio`, Supabase, Docker, BFF) — o modo de uso é **CLI puro**. Em troca, o que era estático virou vivo: o mapa de skills é gerado do catálogo, o progresso do projeto é lido do disco (`/status-funil` + motor de prontidão), cada projeto tem um hub próprio (Book do Funil) e a Aula 4 gera um painel de dados interativo que abre offline.

### Os 5 axiomas

1. **A IA executa, você aprova** — nenhuma skill publica anúncio, dispara e-mail ou sobe página sozinha.
2. **O estado são os arquivos** (`projetos/{slug}/`), não o chat.
3. **Fonte única para cada coisa**: oferta = `offerbook.md`; mensagem = `copy.md`; identidade visual = `DESIGN.md`; catálogo = `data/skill-catalog.json`; prontidão = `skill-surface-contract.js` + `scripts/lib/skill-readiness.mjs`.
4. **Dado sem fonte não existe**: verbatim ou `[SUPOSIÇÃO]` na pesquisa; selo Real/Estimado/Calculado/não fornecido nas métricas.
5. **O ciclo fecha** — método **O.F.T.R.**: Oferta → Funil → Tráfego → **Retroalimentação** (os dados reais da Aula 4 voltam pro avatar da Aula 1 e pra copy da Aula 2).

### As 4 aulas (trajeto pedagógico)

| Fase | Pergunta | Skills (ordem) | Entregável-chave |
|---|---|---|---|
| Aula 1 — Pesquisa → Oferta | Para quem, contra quem, o quê? | `/comecar` → `/avatar-funil` → `/espiao-do-concorrente` → `/trend-hunting` → `/swipe-file` → `/offerbook` | `offerbook.md` (+ Perfil do Projeto) |
| Aula 2 — Identidade → Funil | Como falo, com que cara, por qual caminho? | `/design-md` → `/metodo-funil` → `/copy-funil` → peça de topo → `/pagina-vendas-funil` → `/email-funil` → `/conteudo-funil` → `/recuperacao-funil` → `/backend-funil` → `/cro-funil` | `copy.md` + `DESIGN.md` + `funil.md` + peças |
| Aula 3 — Tráfego | Como subo, leio e otimizo? | `/zelador` → `/briefista` → `/estruturador` → `/leitor-de-metricas` → `/diagnosticador` | `PAINEL-DA-SEMANA.yaml` |
| Aula 4 — Central de Dados | O que os números dizem e o que devolvo pro funil? | `/analista-de-dados` (hub) → `/coletor-de-dados` → `/board-de-especialistas` → `/painel-de-dados` → `/retroalimentacao` → `/gestor-de-campanhas` | `painel-trafego.html` + `retroalimentacao.md` |

> As pastas `aula-01/` a `aula-04/` são **material didático** (guias, docs, templates, exemplos). O seu trabalho **nunca** é gravado dentro delas — vive em `projetos/{slug}/`, na raiz.

---

## 1. Instalação

### Trilha ZERO — prompts prontos (a IA instala; sempre perguntando antes)

**Prompt 0 (oficial):** `/comecar` (Codex: `@comecar`) — detecta SO, confere git/Node/Python/Apify, instala o que faltar perguntando, aponta UM próximo comando. É a rede de segurança do curso: voltou a travar em qualquer aula, rode de novo.

**Prompt 1 — ambiente das skills:**
```text
Leia o arquivo README.md e a skill .claude/skills/comecar/SKILL.md deste repositório. Depois verifique o que já tenho instalado (git, Node, Python) e se existe a chave do Apify no arquivo .env da raiz. Para cada coisa que faltar: me explique em 1 frase o que é e para que serve, me pergunte antes de instalar, e instale pelo caminho mais simples do meu sistema operacional. Não sou programador — traduza qualquer erro em português simples e nunca me deixe sem um próximo passo. Ao final, me diga qual é o único próximo comando que devo rodar.
```

**Prompt 2 — Apify do zero:**
```text
Ainda não tenho conta nem chave do Apify. Me guie passo a passo, com calma: (1) criar a conta gratuita em console.apify.com; (2) encontrar o Personal API token nas configurações; (3) eu colo o token aqui no chat e VOCÊ cria ou atualiza o arquivo .env na raiz deste projeto com a linha APIFY_API_TOKEN=... (o arquivo .env pode não existir ainda — crie se for o caso); (4) confirme que ficou salvo mostrando o resultado de um grep. Nunca invente o valor do token: use exatamente o que eu colar.
```

**Prompt 3 — chaves da Meta (Aulas 3 e 4):**
```text
Quero conectar a minha conta de anúncios da Meta em modo LEITURA. Leia aula-04/docs/configurar-chaves-meta.md e aula-04/docs/tutorial-token-meta.md e me guie passo a passo: criar o app, gerar o token de usuário do sistema com business_management + ads_read, e preencher no .env as variáveis META_ACCESS_TOKEN e META_AD_ACCOUNT_ID. Se eu só tiver o token, rode node scripts/zelador-audit.mjs para descobrir os IDs pela API. Nada de publicar ou alterar campanha — só leitura. Se eu não quiser conectar agora, confirme que tudo roda em Modo Exemplo.
```

**Prompt 4 — Python da Creative Factory:**
```text
Quero usar a ads-creative-factory. Instale as dependências Python dela a partir de .claude/skills/ads-creative-factory/requirements.txt (me pergunte antes de instalar), rode o script doctor.py da mesma skill para diagnosticar o ambiente e me traduza o resultado: o que está ok e o que falta.
```

**Prompt 5 — socorro:**
```text
O comando que acabei de rodar deu erro. Leia a mensagem de erro acima, me explique em português simples o que aconteceu (sem jargão), me diga se é grave, e me proponha UMA correção de cada vez, perguntando antes de executar. Se a correção envolver apagar ou sobrescrever qualquer coisa, me avise explicitamente antes.
```

### Passo a passo (Modo Aluno — o único modo)

1. **Obter o projeto** (repo privado — o git pede login do GitHub; senha no terminal = Personal Access Token, não a senha comum; alternativa: Code → Download ZIP, sem `git pull` depois):
   ```bash
   git clone https://github.com/marketingLendario/cohort-de-marketing.git
   cd cohort-de-marketing
   # depois, sempre: git pull  (nunca clonar de novo por cima)
   ```
2. **Abrir a IA na pasta RAIZ** (`cohort-de-marketing`), nunca dentro de `aula-XX/`: `claude` (ou `codex`). Digitar `/` + "funil" deve listar as skills. As skills só existem na raiz (`.claude/skills/` ↔ `.agents/skills/`); os caminhos (`projetos/{slug}/`) resolvem a partir de onde você abriu.
3. **Rodar `/comecar`** — fecha apontando UM próximo comando.
4. **Node** (`node --version`, v18+) e **Python** (`python --version`; Windows: `py --version`; instalar do python.org marcando "Add Python to PATH"; digitar `python` sem ter instalado abre a loja da Microsoft = stub, não erro).
5. **Apify e o `.env`** (que NÃO vem no clone — o `.gitignore` o exclui de propósito):
   - Conta em `https://console.apify.com` → Settings → API & Integrations → copiar o Personal API token (`apify_api_...`).
   - Criar o `.env` na RAIZ: `cp .env.example .env` (Windows: `copy .env.example .env`) e colar o token em `APIFY_API_TOKEN=` (o nome `APIFY_API_KEY` também vale). Ou deixar o `/comecar` fazer.
   - Conferir: `grep -E "APIFY_API_(TOKEN|KEY)" .env`.
   - Windows/Bloco de Notas: salvar como "Todos os arquivos" com nome `.env` (senão vira `.env.txt` e nada funciona).
   - Sem a chave o começo do funil funciona; a primeira skill de coleta configura com você. Nunca "pular Apify" em silêncio.
6. **Chaves da Meta (quando chegar na Aula 3/4)** e **Hotmart (opcional, Aula 4)** — ver a seção de variáveis abaixo. Sem elas, `/zelador` roda em Modo Manual e a Aula 4 roda em **Modo Exemplo** (dados fictícios) — nada trava.
7. **Creative Factory (quando for gerar criativos)**: `python -m pip install -r .claude/skills/ads-creative-factory/requirements.txt` e diagnóstico `python .claude/skills/ads-creative-factory/scripts/doctor.py --json`.

### Sem conta do Codex — gerar imagens mesmo assim

O motor de imagem da `ads-creative-factory` usa o Codex CLI logado; chaves `OPENAI_API_KEY` não destravam a fábrica canônica. Caminhos alternativos:

| # | Opção | Como | Cobre |
|---|---|---|---|
| 1 | **Conta ChatGPT legítima** | `codex login` (navegador) · conferir `codex login status` | Fábrica completa |
| 2 | **Banners sem IA de imagem** | `/criativos-funil` monta banners HTML na identidade do `DESIGN.md` e captura PNG (4:5, 9:16, 1:1) via `gerar_png.sh` + Chrome | Criativos estáticos |
| 3 | **Prompts portáveis** | `/mockup-produto-funil` gera prompts parametrizados pela marca para colar em qualquer ferramenta de imagem | Mockups e imagens pontuais |
| 4 | **Ponte via API própria** | A IA cria um script alternativo em `projetos/{slug}/creative-factory/custom/` usando a SUA chave (Gemini/OpenAI/OpenRouter), sem modificar a fábrica canônica; amostra → aprovação → lote; registrado nas pendências | Geração por IA sem Codex |

Regras de marca valem sempre: nunca gerar rosto/likeness de pessoa real por IA; logo nunca entra na geração — é aplicado depois, na composição.

### Inventário de dependências

| Dependência | Obrigatória para | Verificar | Instalar |
|---|---|---|---|
| Git | baixar/atualizar (todos) | `git --version` | git-scm.com / `xcode-select --install` / apt |
| Claude Code ou Codex CLI | rodar skills (todos) | digitar `/` ou `@` na pasta raiz | sites oficiais |
| Node 18+ | design-md, validadores, scripts da Aula 3/4, painel de dados | `node --version` | nodejs.org LTS |
| Python 3.x | coletores, DOCX do offerbook, Creative Factory | `python --version` / `py --version` | python.org + "Add to PATH" |
| python-docx | só o DOCX do offerbook | a skill avisa | `pip install python-docx` (fallback: md+html) |
| numpy, Pillow, PyYAML | só ads-creative-factory | `doctor.py --json` | `pip install -r .claude/skills/ads-creative-factory/requirements.txt` |
| Chrome/Edge | gerar_pdf.sh (~15 skills), gerar_png.sh | navegador instalado | fallback: abrir .html e imprimir (Ctrl/Cmd+P) |
| Chave Apify | skills de coleta | `grep -E "APIFY_API_(TOKEN\|KEY)" .env` | console.apify.com → token → .env |
| Chaves Meta (leitura) | `/zelador` Modo API + Aula 4 com dados reais | linhas no `.env` | `aula-04/docs/configurar-chaves-meta.md` + `tutorial-token-meta.md` |
| Hotmart Client ID/Secret (opcional) | caixa real na Aula 4 | linhas no `.env` | `aula-04/docs/tutorial-hotmart.md` |
| META_AD_LIBRARY_TOKEN (opcional) | melhora coleta do espião | linha no `.env` | opcional (fallback: URL pública) |
| FIGMA_API_KEY (opcional) | swipe file visual no Figma | linha no `.env` | opcional (fallback: markdown) |

### Variáveis de `.env` reconhecidas (fonte: `.env.example`)

| Variável | Para quê | Precisa? |
|---|---|---|
| `APIFY_API_TOKEN` (ou `APIFY_API_KEY`) | coletas (espião, trend, conteúdo, criativos) | Sim, p/ skills de coleta |
| `META_AD_LIBRARY_TOKEN` | Ad Library via Graph API no espião | opcional |
| `META_ACCESS_TOKEN` | Graph API em leitura (zelador Modo API, Aula 4) | p/ dados reais |
| `META_APP_ID` / `META_APP_SECRET` | validação extra do token (appsecret_proof) | recomendadas |
| `META_BUSINESS_MANAGER_ID` / `META_AD_ACCOUNT_ID` / `META_PIXEL_ID` / `META_FACEBOOK_PAGE_ID` / `META_INSTAGRAM_BUSINESS_ACCOUNT_ID` | IDs dos ativos (o `node scripts/zelador-audit.mjs` descobre pela API; `--gravar-env` grava sozinho quando único) | p/ dados reais |
| `META_PAGE_ACCESS_TOKEN` / `META_INSTAGRAM_TOKEN` | engajamento orgânico (comentários/sentimento) na Aula 4 | opcionais |
| `HOTMART_CLIENT_ID` / `HOTMART_CLIENT_SECRET` (/ `HOTMART_BASIC`) | vendas reais (caixa) e atribuição na Aula 4 | opcionais |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | só scripts fora do Claude Code | opcionais |
| `FIGMA_API_KEY` / `FIGMA_FILE_ID` | swipe file no Figma | opcionais |

**Nunca** commitar o `.env`. Stubs preparados (ainda não conectados): Kiwify, Eduzz, Monetizze.

---

## 2. As "telas" do projeto (sem painel web)

O painel web do Ads Studio foi descontinuado. As superfícies de navegação agora são arquivos que abrem no navegador:

| Superfície | Onde | O que mostra |
|---|---|---|
| **GUIA-DO-ALUNO.html** | raiz | o curso inteiro (Partes 0–5): ambiente, Aulas 1–4, socorro, glossário |
| **mapa-skills.html** | raiz (espelho em `aula-03/materiais/`) | o grafo das skills gerado de `data/skill-catalog.json` + `skill-unlock-rules.json`, com exemplo de entregável por skill (amostras `academia-fit`) e a próxima skill recomendada (estado salvo no navegador) |
| **Book do Funil** | `projetos/{slug}/index.html` | o hub do SEU projeto: cards por fase, badges de status, galeria das peças, pendências e "VOCÊ ESTÁ AQUI" (regra: `.claude/skills/_shared/book-do-funil.md`) |
| **painel-trafego.html** | `projetos/{slug}/` (Aula 4) | painel de dados self-contained (abre offline) com 7 telas: Visão geral, Séries, Campanhas, Vendas & atribuição, Audiência (pirâmide etária + mapa do Brasil), Engajamento + "Quem é o meu cliente", Board de especialistas |
| **`/status-funil`** | no chat | o "você está aqui" determinístico: lê `projetos/` do disco, marca [x]/[ ] cada peça, mostra pendências por decisão e fecha com o próximo comando + razão do motor de prontidão |
| **briefing.html** | raiz | formulário standalone do Project Brief (salva no navegador, exporta `{slug}-project-brief.json`) |
| **Guias por aula** | `aula-0X/` | `aula-trafego-GUIA-ALUNO.html` (3), `aula-dados-GUIA-ALUNO.html` (4), guias e docs de cada aula |

### O ciclo de trabalho (o que substitui a "Jornada" do painel)

1. Rode a skill da vez (o `/status-funil` ou o mapa dizem qual).
2. A skill pergunta o que precisa, propõe, **você revisa e aprova** — só então grava em `projetos/{slug}/`.
3. Toda skill fecha atualizando o Book do Funil e as pendências (`pendencias.md`, contadas por decisão, nunca por linha — re-run não infla o placar).
4. Entregável visual sai em 3 formatos: `.md` (fonte de verdade), `.html` (na identidade do `DESIGN.md`), `.pdf`.
5. Entre skills: `/status-funil`. Travou: `/comecar`. Trocou de cliente: conversa nova (um projeto, uma conversa, uma pasta).

---

## 3. Fundações (glossário mínimo)

- **Terminal**: janela de comandos. Tudo aqui é comando, mas `/comecar` guia cada um.
- **`.env`**: arquivo de chaves locais na raiz; não vem no clone (de propósito); nunca vai pro git.
- **Git**: baixa/atualiza o material preservando `projetos/`.
- **Claude Code / Codex**: assistentes que executam as skills (`.claude/skills/` ↔ `.agents/skills/`, espelhos byte a byte).
- **Node/npm**: motor da design-md (18+), dos validadores e dos scripts das Aulas 3/4 (leitor, gestor, painel de dados).
- **Python**: coletores, DOCX do offerbook, Creative Factory (numpy/Pillow/PyYAML).
- **Chrome/Edge headless**: converte HTML→PDF (`gerar_pdf.sh`) e HTML→PNG (`gerar_png.sh`).
- **Apify**: scraping com dados reais (API REST direta via `.env`; NÃO é MCP). Central nas skills de coleta.
- **Graph API (Meta)**: leitura da conta de anúncios — insights, campanhas, demografia, funil. Sempre read-only neste repo (exceto o `/estruturador`, que cria campanha pausada em 3 gates com a sua confirmação).
- **Hotmart API**: caixa real (vendas) para a atribuição honesta da Aula 4 — sem dado pessoal de comprador.
- **Contratos (JSON Schema)**: `data/contracts/` versiona as interfaces (project-brief, campaign-plan, weekly-panel, weekly-ledger, traffic-analytics, decision-outcome, source-reconciliation); `skill-surface-contract.js` valida catálogo, regras, brief e ArtifactIndex.
- **ArtifactIndex v1**: índice determinístico do que existe em `projetos/{slug}/` (`scripts/project-artifact-index.mjs`, com sha256 e hardening) — a ponte entre o disco e o motor de prontidão.
- **Motor de prontidão**: `scripts/lib/skill-readiness.mjs` — decide a próxima skill e a razão; usado pelo `/status-funil` e pelo mapa (nunca hardcoded).
- **Testes/validadores**: bateria `.test.mjs` em `scripts/` (release gate da Aula 4, weekly ledger, circuit breaker, contratos, artifact index) + `validate-mapa-*.mjs`, `validate-skill-catalog.mjs`, `verify-skill-contracts.mjs`.

---

## 4. Taxonomia das 37 skills

Formato: **comando** — o que faz. [pré-requisitos] → saídas.

### Setup
- **/comecar** — passo zero: ambiente do leigo ao dev, chave Apify, UM próximo comando. [—] → ambiente pronto.
- **/status-funil** — checklist do funil: o que existe, o que falta, próximo comando + razão do motor. Vários projetos → status de todos. [projeto iniciado] → relatório.

### Pesquisa (Aula 1)
- **/avatar-funil** — pesquisa de avatar/mercado, dor em 3 frentes com verbatim + focus group sintético. [—] → `relatorio-avatar.{md,html,pdf}`. (Python, Apify/WebSearch)
- **/espiao-do-concorrente** — dossiê competitivo multi-fonte: hooks, ofertas, preços, brechas. [—] → `dossie-{X}.*`. (Apify; offline ok)
- **/trend-hunting** — tendências e formatos virais, variações de hook. [—] → `trends-*.*` + briefing p/ media buyer. (Apify obrigatório)
- **/swipe-file** — biblioteca categorizada dos winners do espião/trend. [saídas deles] → `swipe-file-index.*`. (Figma opcional)

### Oferta / Copy
- **/offerbook** — o Livro da Oferta em 7 blocos + Perfil do Projeto; gate central do sistema. [avatar + ≥1 dossiê] → `offerbook-{slug}.{md,docx,html}`. (python-docx p/ o DOCX)
- **/copy-funil** — fundação da mensagem: Schwartz, Big Idea, mecanismos, headlines, bullets. [offerbook] → `copy.md` (fonte única da mensagem).
- **/bonus-funil** — gera os ENTREGÁVEIS dos bônus (ebook, workbook, checklist…). [offerbook + DESIGN.md] → bônus completos.
- **/mockup-produto-funil** — prompts de imagem parametrizados pela marca (portáveis). [offerbook + DESIGN.md] → prompts + mockups.

### Design / Método
- **/design-md** — identidade visual em 5 modos → `DESIGN.md` + `tokens.json` + `preview.html`. [—] (Node 18+)
- **/metodo-funil** — diagnóstico de consciência (1–5) + Mapa de Execução. [offerbook] → `funil.md`.

### Peças de funil (Aula 2)
- **/advertorial-funil** (topo, nível 5) — página editorial de pré-venda p/ público frio. [copy, offerbook, DESIGN.md]
- **/lancamento-funil** (topo, nível 5) — PLF: PLCs, carrinho, gatilhos, régua. [copy/offerbook]
- **/vsl-funil** (topo, nível 5) — funil de VSL Direct Response + escala + ticket. [offerbook/copy]
- **/webinario-funil** (meio, nível 4/3) — Perfect Webinar: registro→roteiro→pós. [copy, DESIGN.md]
- **/quiz-funil** (meio, nível 4) — quiz segmentador com N resultados e follow-up. [copy, offerbook, DESIGN.md]
- **/pagina-vendas-funil** (fundo) — página de 16 elementos na identidade da marca. [**DESIGN.md + copy.md obrigatórios**]
- **/email-funil** — sequência de e-mails na identidade. [copy, DESIGN.md] *(negócio local: `/whatsapp-funil` no lugar)*
- **/whatsapp-funil** — sequência de WhatsApp/DM por momento. [copy quando existe]
- **/recuperacao-funil** — cascata pós-checkout (carrinho, cartão, boleto, downsell). [copy, Perfil]
- **/backend-funil** — upsell/OTO/order bump/downsell/LTV. [offerbook, copy]
- **/cro-funil** — KPIs por etapa, teste A/B (1 por vez, ≥1000 views), quando escalar. [funil montado]

### Conteúdo / Criativos
- **/conteudo-funil** — modela Reels de referência → roteiros na sua voz. [voz da marca] (Apify, Python)
- **/criativos-funil** — espiona Ad Library → roteiros + banners HTML→PNG na identidade. [DESIGN.md p/ banners] (Apify, Chrome)
- **/ads-creative-factory** — motor Python de criativos: packs versionados, 6 arquétipos, gate automático de marca. [brand pack do DESIGN.md] (numpy/Pillow/PyYAML; imagem via Codex — alternativas na Seção 1)

### Tráfego (Aula 3 — squad recommend-only; memória: `PAINEL-DA-SEMANA.yaml`)
- **/zelador** — saúde de conta/tracking (pixel, CAPI, deduplicação, BM, pagamento). SEMPRE primeiro; bloqueante. Modo API (com chaves Meta) ou Modo Manual. Auditoria: `node scripts/zelador-audit.mjs`.
- **/briefista** — bateria de anúncios a partir dos ângulos da Aula 2, p/ curadoria humana.
- **/estruturador** — campanha no "default sagrado". Com credenciais, publica via Graph API em **3 gates** (aprovar → criar pausado → ativar com confirmação); sem, entrega a configuração campo a campo. [zelador ok + briefing]
- **/leitor-de-metricas** — sinais honestos com selo Real/Estimado; nunca inventa ausente. [Graph API ou dados colados]
- **/diagnosticador** — UMA alavanca por vez: hipótese, critérios de sucesso e reversão. [leitura do leitor]

### Central de Dados (Aula 4 — Squad de Dados; fecha o O.F.T.R.)
- **/analista-de-dados** — **hub**: configura chaves Meta/Hotmart (ou Modo Exemplo, que nunca trava) e orquestra as etapas abaixo na ordem. [—]
- **/coletor-de-dados** — bundle bruto: séries dia/mês/trimestre, campanhas, funil (agregado/dia/campanha×dia), heatmap, demografia (idade/gênero/UF), vendas + atribuição, engajamento orgânico — tudo sem PII. → `dados-trafego/bundle.json`
- **/board-de-especialistas** — sentimento dos comentários + board de 6 clones (Media Buyer, Analista de Dados, Diretor de Criativos, CRO/Growth, Estrategista de Audiência, Social/Comunidade): veredito + alavanca + evidência com selo. → `dados-trafego/board.json`
- **/painel-de-dados** — renderiza `painel-trafego.html` (7 telas, self-contained, identidade do DESIGN.md) + PDF + registro no Book. [bundle + board]
- **/retroalimentacao** — devolve os dados ao início: demografia/linguagem → avatar (Aula 1); produtos/prova/objeções → copy e offerbook (Aula 2). → `retroalimentacao.md`
- **/gestor-de-campanhas** — realizado 7/30 dias × planejado (`PAINEL-DA-SEMANA.yaml`): desvios, tendência, parecer. → `gestao-campanhas.md`

### Regras compartilhadas (`.claude/skills/_shared/`)
`nunca-travar.md` (nunca beco; glossário inline; estado=arquivos) · `perfil.md` (Perfil do Projeto + guard de enquadramento) · `book-do-funil.md` (hub `index.html`; versões nunca sobrescrevem; "VOCÊ ESTÁ AQUI") · `entrega-padrao.md` (3 formatos md/html/pdf) · `pendencias.md` (dedup por decisão) · `rastreamento.md` (páginas pixel-ready) · `brand-choice.md` (neutro vs DESIGN.md) · `squad-trafego/` (contrato + template do Painel da Semana).

### Cadeia de dados (a regra de dependência)

```
avatar + espiao (+trend +swipe) → offerbook → [design-md] → metodo-funil → copy.md → TODAS as peças
copy.md   = fonte única da mensagem
DESIGN.md = fonte única da identidade
offerbook = fonte única da oferta/Perfil
bundle + board (Aula 4) → retroalimentacao.md → de volta pro avatar e pra copy
```

---

## 5. Mapa de fluxo

```
AULA 1 · PESQUISA
/comecar (ambiente + chave Apify no .env)
   ├─ /avatar-funil ──────────→ relatorio-avatar.md   (a dor real, verbatim)
   ├─ /espiao-do-concorrente ─→ dossie-{X}.md          (hooks, ofertas, brechas)
   ├─ /trend-hunting ─────────→ trends-*.md            (formatos virais)
   └─ /swipe-file ────────────→ swipe-file-index.md    (biblioteca de winners)
                 ↓  (avatar + dossiê OBRIGATÓRIOS)
            /offerbook ────────→ offerbook.md + Perfil  [FONTE ÚNICA DA OFERTA]

AULA 2 · IDENTIDADE + FUNIL
/design-md ────────────────────→ DESIGN.md + tokens     [FONTE ÚNICA DA IDENTIDADE]
/metodo-funil (lê offerbook) ──→ funil.md               (consciência 1–5 + Mapa de Execução)
/copy-funil (lê offerbook) ────→ copy.md                [FONTE ÚNICA DA MENSAGEM]
       ├─ topo (nível 5): /advertorial-funil · /lancamento-funil · /vsl-funil
       ├─ meio (nível 4/3): /webinario-funil · /quiz-funil
       ├─ fundo (nível 2/1): /pagina-vendas-funil
       ├─ sequências: /email-funil · /whatsapp-funil · /recuperacao-funil
       ├─ conteúdo/criativos: /conteudo-funil · /criativos-funil · /mockup-produto-funil · /bonus-funil
       └─ back-end/otimização: /backend-funil · /cro-funil
       ↓  tudo registrado no Book do Funil (projetos/{slug}/index.html)
          + pendencias.md (decisões do dono) + "VOCÊ ESTÁ AQUI"

AULA 3 · TRÁFEGO (squad recommend-only)
/zelador → /briefista → /estruturador → [VOCÊ publica na Meta — ou 3 gates via API]
              └→ ads-creative-factory        ↓
                                   /leitor-de-metricas → /diagnosticador
              memória compartilhada: PAINEL-DA-SEMANA.yaml ←┘

AULA 4 · CENTRAL DE DADOS (Squad de Dados — fecha o ciclo O.F.T.R.)
/analista-de-dados (hub; chaves Meta/Hotmart ou Modo Exemplo)
   → /coletor-de-dados ────────→ dados-trafego/bundle.json
   → /board-de-especialistas ──→ dados-trafego/board.json (6 clones + sentimento)
   → /painel-de-dados ─────────→ painel-trafego.html (7 telas, offline) + PDF
   → /retroalimentacao ────────→ retroalimentacao.md ──→ volta pro /avatar-funil e /copy-funil
   → /gestor-de-campanhas ─────→ gestao-campanhas.md (realizado × planejado, 7/30 dias)
```

### Pipeline do exemplo canônico (`academia-fit`) e do mapa

```
scripts/run-nucleo-cohort.sh      → gera projetos/academia-fit/ (Aulas 1–2, ordem N12)
scripts/run-aula-04-walkthrough.mjs → gera as peças da Aula 4 do exemplo
sync-mapa-samples.sh              → rsync projetos/academia-fit/ → mapa-skills-samples/ + regen PDFs
scripts/validate-mapa-wiring.mjs  → confere que todo sampleUrl do mapa existe e abre
scripts/validate-mapa-preview.mjs → valida os previews
```
(A sincronização é manual — rode a cadeia quando o exemplo mudar.)

---

## 6. Anatomia do repositório

```
.claude/skills/          ← fonte canônica das 37 skills (SKILL.md + scripts + templates)
.agents/skills/          ← espelho byte a byte p/ Codex (nunca divergir)
aula-01/ … aula-04/      ← material didático por aula (README, guia HTML, docs/, templates/, exemplos/)
data/                    ← skill-catalog.json, skill-unlock-rules.json, project-brief.schema.json,
                           contracts/ (schemas versionados: campaign-plan, weekly-panel, weekly-ledger,
                           traffic-analytics, decision-outcome, source-reconciliation)
scripts/                 ← validadores (mapa, catálogo, contratos), motor de prontidão (lib/skill-readiness.mjs),
                           ArtifactIndex (project-artifact-index.mjs), Aula 3 (zelador-audit, leitor-metricas,
                           estruturador-publish, circuit-breaker), Aula 4 (painel-trafego-data/render,
                           hotmart-vendas, gestor-campanhas, retroalimentacao) + testes .test.mjs
services/meta-ads/       ← adapter Graph API (leitura; credenciais via .env local)
assets/al/               ← identidade Academia Lendária (fonts, css, logo) usada pelos guias
GUIA-DO-ALUNO.html       ← o curso inteiro num documento (Partes 0–5)
mapa-skills.html + mapa-skills-artifacts.js + skill-surface-contract.js  ← mapa vivo das skills
mapa-skills-samples/     ← amostras do projeto-exemplo academia-fit (o que o mapa exibe)
sync-mapa-samples.sh     ← sincroniza projetos/academia-fit → amostras
briefing.html            ← Project Brief standalone
mapa-guiado-do-projeto.{md,html}  ← ESTE guia
projetos/                ← SEU trabalho (fora do git; um subdiretório por cliente/funil; criado na 1ª skill)
docs/ · plans/           ← stories, releases, notas de merge
.gitignore · AGENTS.md   ← guardas (.env e projetos/ nunca sobem)
```

---

## 7. Checklist de validação (falsificável)

### Bloco 1 — Fundação
- [ ] `ls`/`dir` na raiz mostra `.claude`, `aula-01`…`aula-04`, `data`, `scripts` (senão: pasta errada)
- [ ] `git --version` ok e `git pull` sem erro (ZIP: aceitável, sem updates)
- [ ] IA aberta na RAIZ: digitar `/` + "funil" lista as skills (senão: abriu dentro de `aula-XX/` ou fora da pasta)
- [ ] `design-md` aparece UMA vez (duas = apagar a global antiga em `~/.claude/skills/design-md`)
- [ ] `node --version` v18+ · `python --version` 3.x (loja da Microsoft abrindo = não instalado)
- [ ] `grep -E "APIFY_API_(TOKEN|KEY)" .env` imprime a linha
- [ ] `/comecar` termina apontando exatamente UM comando

### Bloco 2 — Funil (Aulas 1–2)
- [ ] `projetos/{slug}/relatorio-avatar.md` + ≥1 `dossie-*.md` existem
- [ ] `offerbook-{slug}.md` (ou `offerbook.md`) existe com Perfil no topo
- [ ] `DESIGN.md` + `preview.html` existem e o preview tem a cara da marca
- [ ] `funil.md` existe com estágio de consciência + próximo passo
- [ ] `copy.md` existe (sem ele nenhuma peça se monta)
- [ ] `projetos/{slug}/index.html` (Book) abre com cards + "VOCÊ ESTÁ AQUI:"
- [ ] `pendencias.md` mostra placar por decisão e re-run NÃO duplica
- [ ] `/status-funil` fecha com "Próximo passo:" + "Razão:" vindos do motor

### Bloco 3 — Tráfego (Aula 3)
- [ ] `/zelador` rodou (Modo API com chaves Meta, ou Modo Manual) e aprovou o tracking
- [ ] Bateria do `/briefista` existe e foi curada por você
- [ ] Estrutura do `/estruturador` no default sagrado; publicação só pausada e com a sua confirmação
- [ ] `PAINEL-DA-SEMANA.yaml` preenchido (verba diária, critério de sucesso, critério de reversão)
- [ ] Toda métrica no leitor/diagnosticador tem selo Real/Estimado/não fornecido

### Bloco 4 — Central de Dados (Aula 4)
- [ ] `/analista-de-dados` rodou (Modo Exemplo sem chaves; dados reais com `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`)
- [ ] `projetos/{slug}/dados-trafego/bundle.json` + `board.json` existem
- [ ] `painel-trafego.html` abre offline com as 7 telas e a identidade da marca
- [ ] Todo ROAS aparece como "Estimado" (só vira Real com caixa Hotmart conferido)
- [ ] `retroalimentacao.md` existe e aponta o que muda no avatar e na copy
- [ ] `gestao-campanhas.md` compara realizado × planejado (7/30 dias)

### Bloco 5 — Qualidade (dev)
- [ ] `node scripts/validate-skill-catalog.mjs` código 0
- [ ] `node scripts/verify-skill-contracts.mjs` código 0
- [ ] `node scripts/validate-mapa-wiring.mjs` e `validate-mapa-preview.mjs` código 0
- [ ] Testes de `scripts/` verdes (`node --test scripts/` ou os `.test.mjs` individualmente)
- [ ] `diff -rq .claude/skills .agents/skills` sem diferenças
- [ ] `git status` não mostra `.env` nem `projetos/`

> Regra de ouro: um checklist só vale se puder reprovar. Item sem teste executado = não-verificado, não "provavelmente ok".
