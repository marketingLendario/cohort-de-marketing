# Perfil orgânico — roadmap (comentários e visualizações)

A Aula 04 entrega **sólido** o tráfego pago (impressões, cliques, CTR, gasto, ROAS por dia/mês/quarter, comparação de períodos e campanhas). O **perfil orgânico** — comentários, reações e visualizações de posts da página — é **roadmap**: o painel já tem o card, e o script tenta puxar quando o token permite; sem escopo, mostra "em breve" e **nunca inventa** o dado.

## Status (confirmado no piloto — 2026-07)

**Funciona no modo dev (Caminho A) — a aba Engajamento foi preenchida de verdade.** O que destravou:
- **Instagram** (o caso da Academia Lendária): token de usuário do **Graph API Explorer** (login do Facebook) com `instagram_basic` + `instagram_manage_comments` + `pages_show_list` + `pages_read_engagement`, colado em **`META_PAGE_ACCESS_TOKEN`**. O conector pega o page token, resolve a conta business do IG e lê `/{ig-id}/media` + `/{media}/comments`. Também há o caminho da **API nova do Instagram** (`graph.instagram.com`, `META_INSTAGRAM_TOKEN`).
- **Facebook** (posts/comentários de Página): exige `pages_read_user_content` — que costuma precisar de **App Review**.

**Aprendizados que travam quem tenta:** a página tem que estar atribuída ao **mesmo** usuário do sistema/dono do token; é fluxo de **2 passos** (page access token); e apps na "API do Instagram com login do Instagram" usam `instagram_business_*` em vez de `instagram_manage_comments`. Tudo em `tutorial-token-meta.md` → "Caminho A".

**Para produção (qualquer aluno, não só a própria conta):** aí sim entra **App Review** + Verificação de Negócio (Caminho B) — semanas.

**Independe de tudo isso e já é real:** a **audiência paga** (idade/gênero/região) vem dos *breakdowns* de Insights de anúncios (`ads_read`) — aba **Audiência**.

## DM / Direct — roadmap

Ler mensagens diretas (DM) segue como fase futura: exige `instagram_business_manage_messages` / `pages_messaging` + **App Review** + webhook público (HTTPS) + Verificação de Negócio, e só permite responder dentro da janela de 24h após o usuário escrever primeiro. Fora do escopo do painel local por ora.

## O que o script já tenta

`node scripts/painel-trafego-data.mjs --perfil` chama, best-effort:

- `GET <PAGE_ID>/posts?fields=message,created_time,comments.summary(true),reactions.summary(true)` — comentários e reações por post;
- (roadmap) `GET <PAGE_ID>/insights` e `GET <PAGE_ID>/video_insights` — visualizações e alcance orgânico.

Se a Graph API recusar (falta de escopo), o `perfil.disponivel` fica `false` com o motivo, e o painel mostra o card **"Em breve (roadmap)"**.

## O que falta para ligar

1. **Page Access Token** com `pages_read_engagement` e `read_insights` (via um usuário admin da página, ou System User com a página atribuída e os escopos concedidos);
2. `META_FACEBOOK_PAGE_ID` no `.env` (o Zelador já descobre e grava);
3. quando aplicável, submeter os escopos ao App Review da Meta.

A camada HTTP (`scripts/lib/meta-graph.mjs`) já suporta qualquer endpoint da Graph API — falta só o token com escopo. Nenhuma mudança de arquitetura é necessária para promover o orgânico de roadmap a produção.
