# Plano — Zelador v2: Auditoria Real via Meta Graph API

## Objetivo

Evoluir a skill `zelador` (primeira do squad de tráfego da Aula 3) de auditoria assistida/manual para **dois modos**:

- **Modo Manual (mantido)** — o fluxo atual de checklist guiado, sem credenciais.
- **Modo API (novo)** — auditoria automática real via Graph API, validando BM, ad account, pixel/CAPI, página, domínio e pagamento "sem precisar do usuário", usando credenciais do `.env`.

## Análise do estado atual

| Item | Situação |
|---|---|
| `.claude/skills/zelador/SKILL.md` | 100% manual: pergunta item a item, aluno confirma na tela, gera bloco YAML no `PAINEL-DA-SEMANA.yaml` |
| `aula-03/templates/checklist-zelador.md` | Checklist de 11 itens, regra "não marque saudável por presunção" |
| `services/meta-ads/` | Já existe um adapter Node (STORY-152.2) que envelopa o CLI `meta-ads` (Python), com resolução de credenciais por spoke, masking e scrub de secrets — mas depende de CLI Python instalado e de `.env.{spoke}` em `~/Downloads/apps/` (padrão Sinkra Hub, não do aluno do cohort) |
| `.env.example` (raiz) | Só tem `META_AD_LIBRARY_TOKEN` — **não tem** `META_APP_ID`, `META_APP_SECRET`, nem token de acesso |
| `aula-03/materiais/guia-app-meta-integracoes.html` | Guia do aluno para criar app Meta, App Review e gerar token de System User — ou seja, o aluno do cohort já é conduzido a ter App ID/Secret e token |

## Restrição técnica central (não negociável)

**App ID + App Secret sozinhos NÃO auditam BM/ad account.** O token de app (`app_id|app_secret`) só serve para:

- `GET /debug_token` — validar/inspecionar outro token (validade, escopos, expiração)
- Trocar token curto por longo (`fb_exchange_token`)

Para ler Business Manager, ad account, pixel etc. é obrigatório um **access token de usuário/System User** com escopos `business_management`, `ads_read` (ou `ads_management`). Portanto o `.env` precisa de **3 credenciais**: `META_APP_ID`, `META_APP_SECRET` e `META_ACCESS_TOKEN` (+ IDs dos ativos). O guia da Aula 3 já ensina a gerar esse token — o plano aproveita isso.

Papel real do App ID/Secret na auditoria:
1. `debug_token` para verificar o próprio token (escopos presentes, expiração próxima) — primeiro check do audit.
2. `appsecret_proof` (HMAC-SHA256 do token com o secret) em toda chamada — melhor prática de segurança da Meta.
3. Futuro: fluxo OAuth guiado para renovar token expirado.

## Arquitetura proposta

Criar um script auditor standalone (sem dependência do CLI Python), no padrão dos scripts do repo:

```
scripts/zelador-audit.mjs        # Node ≥18, só fetch nativo, zero deps
.claude/skills/zelador/SKILL.md  # atualizado: Modo API (default se .env ok) + Modo Manual (fallback)
.env.example                     # + bloco META (app id, secret, token, ids)
```

### Variáveis no `.env` (raiz do projeto do aluno)

```bash
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=        # System User token com business_management + ads_read
META_BUSINESS_ID=         # opcional — descoberto via /me/businesses se ausente
META_AD_ACCOUNT_ID=       # opcional — descoberto via /me/adaccounts se ausente
META_PIXEL_ID=            # opcional — descoberto via /act_X/adspixels se ausente
META_PAGE_ID=             # opcional
```

Descoberta automática: se os IDs não estiverem no `.env`, o script lista os ativos acessíveis pelo token e, havendo exatamente 1, usa-o; havendo vários, lista para o aluno escolher (a skill grava a escolha no `.env`).

### Checks do audit (mapeados 1:1 ao checklist atual)

| Check | Endpoint Graph API (v23.0+) | Campo do painel |
|---|---|---|
| 0. Token válido + escopos | `GET /debug_token?input_token=...` (app token) | pré-requisito; reporta expiração |
| 1. BM ativo | `GET /{business_id}?fields=id,name,verification_status` + acesso ok = sem restrição visível | `bm_ativo` |
| 2. Conta de anúncios ativa | `GET /act_{id}?fields=account_status,disable_reason,name,currency,timezone_name` (status 1=ATIVA, 2=DISABLED, 3=UNSETTLED...) | `conta_anuncios_ativa` |
| 3. Pagamento aprovado | `act_status=3 (UNSETTLED)` / `funding_source_details` presente e sem erro | `pagamento_aprovado` |
| 4. Pixel existe e recebe eventos | `GET /{pixel_id}?fields=id,name,last_fired_time,is_unavailable` — `last_fired_time` < 48h = disparando | `pixel_disparando` |
| 5. CAPI ativa | `GET /{pixel_id}/stats?aggregation=event_source` — presença de eventos `server` recentes (fallback: reportar "não verificável via API, confira Events Manager") | `capi_ativo` |
| 6. Deduplicação | `stats` por evento: se Purchase chega por browser E server, checar orientação de `event_id` — **parcialmente verificável**; API não confirma dedup por si só → status `PARCIAL` com instrução manual do teste de compra | `evento_compra_deduplicado` |
| 7. Domínio verificado | `GET /{business_id}/owned_domains?fields=domain,status` | `dominio_verificado` |
| 8. Página vinculada | `GET /{business_id}/owned_pages` ou `/me/accounts` | novo campo `pagina_vinculada` |
| 9. Limites/qualidade da conta | `GET /act_{id}?fields=adtrust_dsl,spend_cap,amount_spent` (limite diário de gasto = proxy de conta nova/restrita) | `observacoes` |

Honestidade epistêmica preservada (regra de ouro da skill): cada campo sai com selo **`fonte: api` / `fonte: aluno` / `nao_verificavel_api`**. Dedup e "pixel dispara na página certa" continuam tendo componente manual — o modo API reduz o checklist manual de 11 para ~2 itens, não elimina.

### Saída do script

```bash
node scripts/zelador-audit.mjs            # human-readable, PT-BR
node scripts/zelador-audit.mjs --json     # para a skill parsear
```

JSON com o mesmo shape do bloco `zelador:` do PAINEL-DA-SEMANA.yaml + `fonte` por campo + `status_geral` (OK/PARCIAL/CRITICO) + `observacoes` acionáveis (ex.: "token expira em 12 dias — renove").

### Segurança

- Secret e token **nunca** aparecem em output (reusar padrão `scrubSecrets`/`maskSecret` de `services/meta-ads/index.js`).
- `appsecret_proof` em todas as chamadas.
- Somente chamadas **read-only** (GET). Nenhuma mutação.
- `.env` já está no `.gitignore` (confirmar na implementação).

### Mudanças na SKILL.md do zelador

1. **Passo 0 novo:** detectar `.env` com `META_APP_ID`+`META_APP_SECRET`+`META_ACCESS_TOKEN` → rodar `scripts/zelador-audit.mjs --json`.
2. Se credenciais ausentes/token inválido → **Modo Manual** (fluxo atual intacto) + oferta de setup apontando para `guia-app-meta-integracoes.html`.
3. No Modo API: apresentar resultado por item, pedir confirmação manual só dos itens `nao_verificavel_api` (dedup via compra-teste, Pixel Helper na página de conversão).
4. Bloco YAML do painel ganha `modo: api|manual` e `fonte` por campo.
5. Regra de bloqueio do Estruturador inalterada (`CRITICO` bloqueia).

## Fases de implementação

1. ✅ **Fase 1 — Script auditor** (`scripts/zelador-audit.mjs`): debug_token + checks determinísticos. Testado com conta real (2026-07-15): todos os checks API passaram; exit codes 0/1/2 validados; sem vazamento de secret.
2. ✅ **Fase 2 — Checks probabilísticos**: CAPI via `/stats?aggregation=event_source` (funciona — retorna SERVER+BROWSER), sinal de dedup, breakdown por evento (`aggregation=event`); selos `fonte` por campo.
3. ✅ **Fase 3 — Skill + docs**: `SKILL.md` com dois modos (ambas as cópias `.claude/` e `.agents/`), `checklist-zelador.md`, bloco META documentado no `.env.example`, descrição do zelador atualizada nos mapas de skills.
4. ✅ **Fase 4 — Robustez**: descoberta automática de IDs (`/me/adaccounts`; BM derivado de `act_X?fields=business` porque `/me/businesses` vem vazio para System User; pixels via `/adspixels`; páginas via `/me/accounts`) — ativo único é usado e sugerido para o `.env`, múltiplos são listados para escolha (nunca chuta); flag `--gravar-env` persiste os únicos no `.env` sem sobrescrever chaves preenchidas; dicas pedagógicas por código de erro da Graph API (190/102 token, 100 ID, 200/10 permissão, 4/17/32/613 rate limit).

## Descobertas na implementação

- `owned_domains`/`verified_domains` **não existem mais** na Graph API (testado v19–v23) → domínio verificado ficou como check manual (`nao_verificavel_api`). O `verification_status` do BM cobre parte do risco.
- `adtrust_dsl` inacessível para System User → removido do escopo.
- `/stats?aggregation=event` funciona e dá o breakdown de eventos recentes do pixel (informativo no relatório).
- Melhor caso do Modo API é `status_geral: PARCIAL` — dedup exige compra-teste; a skill sobe para `OK` após confirmação manual do aluno.

## Riscos

- **Token do aluno sem escopo `business_management`** → debug_token detecta e o script degrada com instrução exata de qual escopo falta.
- **App do aluno em modo desenvolvimento** → funciona para ativos próprios (caso do cohort); documentar.
- **`/stats` do pixel exige permissão no dataset** → fallback para `nao_verificavel_api`, nunca inventar.
- **Rate limit** → volume irrisório (≤10 GETs por audit).
