# GUIA TOKENS DO ORGÂNICO — Página e Instagram no painel (avançado, 100% opcional)

> **Estou perdido em:** "a aba de engajamento do painel está 'em breve' — quero comentários/curtidas/sentimento da minha Página e do IG lá dentro".
> **O que você vai ter no final:** `META_PAGE_ACCESS_TOKEN` (Facebook) e/ou `META_INSTAGRAM_TOKEN` (Instagram) no `.env`, com o teste `--perfil` respondendo. **Sem eles o painel funciona normalmente** — a aba fica "em breve" e nada mais muda.
> **Fontes cruzadas:** super-guia B.6 + `aula-04/docs/tutorial-token-meta.md` Caminho A (repo) · `scripts/painel-trafego-data.mjs --perfil` (código real) · docs/tutoriais da API do Instagram (convite de testador em "Apps e sites"; token longo ~60 dias — consultados 22/07).
> **Aviso honesto:** é o setup mais chato da Meta, validade ~60 dias, e ler Página em produção exigiria App Review (semanas). No modo dev funciona só na SUA conta — que é exatamente o caso do curso. Baixa prioridade de verdade.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🔑 Conta | App da Meta + fundação prontos (você é admin do app E da Página) | [guia-meta-api](guia-meta-api.md) · [guia-meta-fundacao](guia-meta-fundacao.md) |
| 🔑 Conta | Instagram **Profissional (Empresa)** vinculado à Página | [guia-meta-fundacao](guia-meta-fundacao.md), passo 3 |
| 📄 Artefato | O resto da Aula 4 já rodando (este é o ÚLTIMO enfeite, não o começo) | [guia-central-de-dados](../05-metricas/guia-central-de-dados.md) |

## Facebook (`META_PAGE_ACCESS_TOKEN`)

1. No app (`developers.facebook.com` → seu app → **Casos de uso**): caso **"Gerenciar tudo na sua Página"** → **Personalizar** → adicione **`pages_read_engagement`** e **`pages_read_user_content`**.
2. **Graph API Explorer** (`developers.facebook.com/tools/explorer`) → selecione o app → **"Get User Access Token"** → marque `pages_read_engagement`, `pages_read_user_content`, `pages_show_list` → **Generate**.
3. **Estenda a validade:** copie o token → **Access Token Debugger** (`developers.facebook.com/tools/debug/accesstoken`) → cole → **"Estender token de acesso"** (~60 dias) → copie o LONGO.
4. `.env`: `META_PAGE_ACCESS_TOKEN=...` → teste: `node scripts/painel-trafego-data.mjs --account --perfil` → `perfil.disponivel: true`.

## Instagram (`META_INSTAGRAM_TOKEN`) — a API nova ("login do Instagram")

1. Confira se é o seu caso: no app aparecem escopos `instagram_business_basic` / `instagram_business_manage_comments` (e não `instagram_manage_comments`).
2. App → **Casos de uso → API do Instagram → Personalizar → aba Funções** → adicione a sua conta @ como **"Testador do Instagram"**.
3. ⚠️ **Aceite o convite DENTRO do Instagram** — app do Instagram → Configurações → **"Apps e sites" → Convites de testador → Aceitar** (ou toque na notificação). *Este passo esquecido é a causa nº 1 de falha.*
4. De volta ao app → seção **"Gerar tokens de acesso"** → **Adicionar conta** → selecione o @ → "Add all required permissions" → **gerar token** (já sai de longa duração).
5. `.env`: `META_INSTAGRAM_TOKEN=...` → teste com `--perfil`.

## Teste de sucesso

`node scripts/painel-trafego-data.mjs --account --perfil` responde `perfil.disponivel: true` — e no próximo `/analista-de-dados`, a aba de engajamento deixa de ser "em breve".

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| OT1 | Token gerado mas `perfil.disponivel: false` | escopo faltando, ou token curto que já expirou | refaça com os 3 escopos do passo 2; estenda no Debugger; confira se colou o LONGO |
| OT2 | Instagram: geração falha / conta não aparece | o convite de testador não foi ACEITO dentro do Instagram | passo 3 do bloco Instagram ("Apps e sites" → aceitar) e gere de novo |
| OT3 | "Apps e sites" não aparece no Instagram | conta não é Profissional, não está vinculada à Página, ou app desatualizado | mude pra Profissional + vincule ([guia-meta-fundacao](guia-meta-fundacao.md) passo 3); atualize o app do Instagram |
| OT4 | Token **morreu em ~60 dias** | é a validade normal do modo dev | regenere (passos 2–3 de cada bloco); anote no calendário — ou aceite a aba "em breve" e viva feliz |
| OT5 | "Preciso disso pro curso?" | não — é o opcional mais opcional do arsenal | o painel, o board e as decisões funcionam SEM; faça só se o engajamento orgânico importa pra você |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/analista-de-dados` de novo — a aba de engajamento acende com o token no lugar |
| 📖 Ler | [guia-como-ler-os-numeros](../05-metricas/guia-como-ler-os-numeros.md) (o que fazer com os números novos) |
| 🚑 Se travar | o catálogo OT1–OT5 acima (convite não aceito, token curto, aba apagada...) |
