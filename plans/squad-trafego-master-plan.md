# Master Plan — Squad de Tráfego v2: do assistido ao operacional via Graph API

> Continuação de `plans/zelador-auditoria-real-meta.md` (Zelador v2, concluído).
> Escopo: **briefista, estruturador, leitor-de-metricas, diagnosticador, ads-creative-factory** — incluindo **publicação de campanhas via API**.
> Data da análise: 2026-07-15. Validado ao vivo contra conta real (System User token com `ads_management`).

## Viabilidade confirmada por teste ao vivo

| Capacidade | Endpoint | Resultado do teste |
|---|---|---|
| Insights (Leitor) | `GET /act_X/insights?date_preset=last_7d&fields=spend,impressions,clicks,ctr,cpm,frequency,actions,purchase_roas` | ✅ retorna tudo, incl. conversões por `action_type` e ROAS |
| Ler campanhas | `GET /act_X/campaigns?fields=id,name,status,objective` | ✅ |
| Criar campanha (dry-run) | `POST /act_X/campaigns` + `execution_options=["validate_only"]` | ⚠️ valida parâmetros (acusou campo faltante `is_adset_budget_sharing_enabled`), mas retorna erro genérico código 1 em alguns casos — usar como pré-flight best-effort, não como gate confiável. **Nada foi criado na conta** (verificado). |
| Escopos de escrita | `debug_token` | ✅ token tem `ads_management` — publicação é possível |

## Princípios transversais (herdados do squad, inegociáveis)

1. **O aluno decide; a API executa.** Automatizar execução ≠ automatizar decisão. Toda escrita (publicar, pausar, trocar criativo, mudar verba) exige aprovação explícita registrada no Painel (`aprovado_pelo_aluno`, `decidido_em`). A regra de ouro muda de "você não tem acesso ao gerenciador" para "você tem acesso, mas só age com ordem expressa".
2. **Criar sempre `PAUSED`.** Campanha/adset/ad nascem pausados via API; a ativação é um segundo passo com confirmação própria. O aluno pode ativar pelo gerenciador (vendo tudo na tela) ou pedir ativação via API.
3. **Default sagrado vira validação programática.** O que hoje é instrução de prompt vira código que recusa: objetivo fora de `OUTCOME_SALES`/`OUTCOME_LEADS`, verba < R$20/dia, >1 conjunto, >1 interesse, <2 ou >3 criativos.
4. **Selo de fonte em tudo** (padrão do Zelador v2): `fonte: api` / `fonte: aluno` / `nao_verificavel_api`. Dado da API é `Real (fonte: API em <data>)`; ROAS da API continua `Estimado` até confirmação de caixa pelo aluno.
5. **Lib compartilhada, zero deps.** Extrair de `scripts/zelador-audit.mjs` → `scripts/lib/meta-graph.mjs`: `loadEnv`, `graphGet`, `graphPost`, `makeScrubber`, `ERROR_HINTS`, `appsecret_proof`, timeout. Todos os scripts do squad usam a mesma base (Node ≥18, fetch nativo).
6. **Fallback manual intacto em toda skill.** Sem `.env` → fluxo atual, sem regressão.
7. **`PAINEL-DA-SEMANA.yaml` continua sendo o contrato** — ganha os IDs reais (`campaign_id`, `adset_id`, `ad_ids[]`) para fechar o ciclo ler→diagnosticar→agir na mesma campanha.

---

## 1. leitor-de-metricas → Modo API (menor risco, maior ganho imediato)

**Hoje:** o aluno cola números do gerenciador; contrato "não-inferir" proíbe até calcular CTR a partir de cliques/impressões. Honesto, porém friccional e sujeito a erro de digitação.

**Plano — `scripts/leitor-metricas.mjs [--campaign-id=X] [--date-preset=last_7d|last_3d|lifetime] [--json]`:**

- `GET /act_X/insights` no nível `campaign` (e `--level=ad` para fadiga do Briefista), campos: `spend, impressions, clicks, ctr, cpm, cpc, frequency, actions, cost_per_action_type, purchase_roas, date_start, date_stop`.
- Janela de atribuição real via `action_attribution_windows` — resolve o eterno "não fornecido".
- Mapeamento de selos:
  - Métricas de entrega (gasto, impressões, cliques, CTR, CPM, frequência) → `selo: Real`, `fonte: "API Graph em <data>"`. **O contrato "não-inferir" é preservado**: os números vêm prontos da Meta, não são derivados por nós.
  - Conversões (`actions`) → `Real` como *evento reportado pela plataforma*, com nome do `action_type` literal.
  - `purchase_roas` → **`Estimado`** com premissa "atribuição da plataforma, não confirmado no caixa" — regra atual mantida; só vira `Real` com confirmação do aluno.
- Regra da semana 1 automatizada: conta conversões na janela; `< 10` → `amostra_suficiente_para_cpa: false` + nota padrão.
- Detecção automática de campanha: se o Painel tem `estruturador.campaign_id`, usa; senão lista campanhas ativas para escolha (padrão descoberta do Zelador).
- Saída: YAML pronto para `leitor.sinais` do Painel + JSON.
- SKILL.md: Passo 0 igual ao Zelador (tem `.env` → roda script; senão → fluxo colado atual). Selo dos dados muda de "colado pelo aluno" para "API", o resto do contrato fica.

**Risco baixo:** 100% leitura. Único cuidado: não deixar o modo API afrouxar o "não-inferir" — o script só repassa campos que a API entrega prontos.

---

## 2. estruturador → montagem + PUBLICAÇÃO via API (o coração do pedido)

**Hoje:** entrega configuração campo a campo para o aluno replicar manualmente no gerenciador ("você não tem acesso de API ao gerenciador na v1"). O clique em Publicar é do aluno.

**Plano — `scripts/estruturador-publish.mjs` com subcomandos:**

```bash
node scripts/estruturador-publish.mjs --plano=campanha.yaml --dry-run   # valida contra default sagrado + validate_only best-effort
node scripts/estruturador-publish.mjs --plano=campanha.yaml --criar     # cria TUDO PAUSED, imprime IDs + link do gerenciador
node scripts/estruturador-publish.mjs --ativar --campaign-id=X          # ativa (exige --confirmo-ativacao)
node scripts/estruturador-publish.mjs --pausar --campaign-id=X          # kill-switch imediato
node scripts/estruturador-publish.mjs --status --campaign-id=X          # effective_status + review status dos ads
```

**Cadeia de criação (4 POSTs, na ordem, com rollback):**

1. `POST /act_X/campaigns` — `objective: OUTCOME_SALES|OUTCOME_LEADS` (nunca outro), `status: PAUSED`, `special_ad_categories`, `is_adset_budget_sharing_enabled: false`, `buying_type: AUCTION`.
2. `POST /act_X/adsets` — `daily_budget` (centavos, validado ≥ 2000), `optimization_goal: OFFSITE_CONVERSIONS`, `promoted_object: {pixel_id, custom_event_type: PURCHASE|LEAD}`, `billing_event: IMPRESSIONS`, `targeting: {geo_locations: {countries: ['BR']}, targeting_automation: {advantage_audience: 1}}` (+ no máx. 1 interesse), `status: PAUSED`.
3. Criativos: `POST /act_X/adimages` (upload dos PNGs do ads-creative-factory, por hash) ou `video_id` → `POST /act_X/adcreatives` com `object_story_spec: {page_id, link_data: {link (com UTMs), message (copy do finalista), image_hash, call_to_action}}`.
4. `POST /act_X/ads` — 1 por finalista (2-3), `status: PAUSED`.
5. **Rollback:** falhou o passo N → deletar o que foi criado nos passos anteriores (`DELETE`), reportar o erro com `ERROR_HINTS`.

**Guardrails programáticos (o script recusa, não avisa):**

- Objetivo fora da lista branca (impossível criar "Impulsionar").
- `daily_budget < R$20` → recusa com a mensagem pedagógica do piso.
- Mais de 1 adset, mais de 1 interesse, <2 ou >3 ads.
- Zelador: lê o Painel/roda `zelador-audit.mjs --json`; `status_geral: CRITICO` → recusa criar.
- Nome da campanha com prefixo rastreável (ex.: `[COHORT1]_[slug]_[data]`) para o Leitor achar depois.
- `--ativar` exige flag explícita `--confirmo-ativacao` E imprime resumo (verba/dia × período, projeção de gasto total) antes.

**Mudanças na SKILL.md:** regra de ouro atualizada ("a publicação é sua, a DECISÃO de publicar é do aluno — registre quem mandou e quando"); fluxo em 3 gates: (1) aluno aprova a estrutura montada → (2) `--criar` PAUSED → aluno revê no gerenciador (link direto impresso) → (3) aluno manda ativar (via API ou clique). `submetida_por_humano_em` vira `aprovada_pelo_aluno_em` + `publicada_via` (`api|manual`) + `ativada_em`. Painel ganha `campaign_id`, `adset_id`, `ad_ids`.

**Riscos:** é escrita com dinheiro real — mitigado por PAUSED-first, gates, kill-switch e piso/teto de verba; ads passam por revisão da Meta após ativação (o `--status` acompanha `effective_status`); `validate_only` instável (usar como best-effort no `--dry-run`, com fallback para validação local); conta do aluno precisa da página vinculada ao BM (o Zelador já checa `pagina_vinculada`).

---

## 3. diagnosticador → dados reais + execução gated da alavanca

**Hoje:** diagnostica em cima do que o Leitor colou; a execução da alavanca aprovada é 100% manual.

**Plano (sem script novo grande — orquestra os outros dois):**

- **Entrada:** consome o JSON do `leitor-metricas.mjs` (dados `Real` da API tornam a heurística "uma alavanca por vez" muito mais confiável — hoje ela roda sobre 4-6 números digitados).
- **Circuit-breaker automatizado:** `scripts/circuit-breaker.mjs --campaign-id=X` (read-only): busca gasto/conversões/CTR da campanha, avalia o gatilho nomeado (`gasto ≥ 2× CPA-alvo com 0 conversões E CTR < 0,5%`) e devolve `acionado: true|false` com os números. A skill roda isso no início de toda sessão de diagnóstico. (Opcional v2.1: agendável via cron/rotina para vigiar a semana.)
- **Execução da alavanca aprovada:** após `aprovado_pelo_aluno: true`, o Diagnosticador faz handoff COM IDs: alavanca estrutural → `estruturador-publish.mjs` (`--pausar`, troca de criativo = novo ad PAUSED + pausa do antigo, ajuste de verba com re-validação do piso); alavanca criativa → Briefista. A skill continua **proibida** de executar sem aprovação registrada.
- **SKILL.md:** pré-requisito ganha o caminho API; contrato de 4 partes (hipótese/alavanca/sucesso/reversão) intacto; critério de reversão agora é **verificável pelo próprio squad** na leitura seguinte (fecha o loop "mentor falseável").

---

## 4. briefista → detecção de fadiga com dados reais (mudança mínima)

**Hoje:** geração de bateria é trabalho de LLM puro (correto — não mexer). A regra de fadiga (CTR -20% do pico em 7d, frequência >3,0, criativo 14+ dias) depende de o aluno trazer números.

**Plano:**

- Reusar `leitor-metricas.mjs --level=ad --date-preset=last_14d`: CTR e frequência **por anúncio** + idade do criativo (`created_time` do ad) → relatório de fadiga por finalista, com selo `Real`.
- SKILL.md: seção de fadiga passa a mandar rodar o script quando houver campanha no Painel; os 3 gatilhos ficam, agora computados sobre série real (pico de CTR observável de verdade).
- **Não muda:** recusa de ângulo sem `nivel_consciencia`, curadoria humana dos finalistas, categorias de hook. Zero API na geração.

---

## 5. ads-creative-factory → ponte de publicação (motor intacto)

**Hoje:** gera PNGs multi-formato via Codex CLI + gates anti-slop; entrega arquivos locais. Skill grande, versionada (2.1.1), com espelho byte a byte em `.agents/`.

**Plano (não tocar no motor Python):**

- **Novo adapter** `scripts/acf-upload.mjs` (fora da pasta da skill, que é extend-only por convenção): lê o manifest de saída da factory (`out/.../manifest`), sobe cada PNG aprovado via `POST /act_X/adimages`, devolve `{finalista_id → image_hash}` para o `estruturador-publish.mjs` consumir.
- Formatos já casam com o placement: feed 4:5, story 9:16, square 1:1 — o `object_story_spec` usa `image_hash` por placement (v2.1: `asset_feed_spec` para placement asset customization).
- Curadoria humana continua antes do upload: só sobe o que o aluno aprovou.
- SKILL.md da ACF: acrescentar apenas uma seção curta "Publicação" apontando para o adapter (mantendo o espelho `.agents/` sincronizado).

---

## Ordem de implementação (dependências → risco crescente)

| Fase | Entrega | Status (2026-07-15) |
|---|---|---|
| A | `scripts/lib/meta-graph.mjs` + refactor do zelador | ✅ zelador re-testado, resultado idêntico |
| B | `leitor-metricas.mjs` (+ `--fadiga`) + SKILL.md do leitor | ✅ testado em campanha real (11 sinais, janela de atribuição literal, amostra automática) |
| C | `circuit-breaker.mjs` + SKILL.md do diagnosticador | ✅ testado (gatilho corretamente NÃO acionado; exit 3 quando aciona) |
| D | `estruturador-publish.mjs` completo + guardrails + SKILL.md | ✅ guardrails recusam 12 violações; rollback testado; **E2E real**: campanha+conjunto+2 criativos+2 anúncios criados PAUSED e apagados depois |
| E | `--ativar`/`--pausar`/`--status` + alavancas do Diagnosticador (`--trocar-verba`, `--adicionar-criativo`, `--pausar-anuncio`) | ✅ código pronto; `--status`, `--pausar-anuncio`, `--trocar-verba` (com guardrails de piso/teto e `--confirmo-mudanca`) e `--adicionar-criativo` testados em campanha pausada real e limpos depois; **`--ativar` pendente de validação supervisionada** (gasta dinheiro real — fazer com o Rafael: ativar R$20-30/dia por 24-48h, ler, pausar) |
| F | `acf-upload.mjs` + fadiga do briefista + seção Publicação na ACF | ✅ upload real testado (image_hash retornado) |
| G | PAINEL-DA-SEMANA.yaml com bloco `estruturador` (IDs) + SKILL.md de todas as skills + espelhos `.agents/` | ✅ |

## Descobertas críticas da implementação (2026-07-15)

1. **ID de conta alias**: o `.env` tinha `6006053461825`, um ID antigo que a Graph API resolve em LEITURA mas rejeita em toda ESCRITA com erro genérico código 1 (sem explicação). O canônico é `512182632166013` (`GET act_X?fields=id` resolve). Corrigido no `.env`; `resolveActId()` na lib normaliza automaticamente em todos os scripts; o zelador avisa quando detecta alias. **Esse é um modo de falha que alunos vão ter** — o hint do erro 1 documenta as 3 causas (alias, permissão parcial do System User, app sem Marketing API).
2. **v23.0 deprecada para DELETE de campanha** — lib atualizada para `v24.0` (tudo re-testado).
3. **`validate_only` funciona normalmente** na conta canônica — a instabilidade observada era o alias.
4. **Pré-flight de escrita** (ad label create+delete, metadado invisível): embutido no `estruturador-publish` e como `--testar-escrita` no zelador (`api_escrita_habilitada`).

## Riscos globais

- **Conta/app do aluno:** app em modo desenvolvimento funciona para ativos do próprio BM (caso padrão do cohort, já documentado no guia da Aula 3). Zelador v2 é o pré-flight que pega 90% dos problemas de permissão antes de qualquer escrita.
- **Rate limits de escrita** são mais sensíveis que leitura — a cadeia de criação faz ≤10 POSTs; ok.
- **Revisão de anúncios da Meta:** ativação ≠ entrega imediata; `--status` reporta `effective_status`/`ad_review_feedback` para o aluno não achar que "quebrou".
- **Versão da API:** pinada em `v23.0` na lib compartilhada; um lugar só para upgrade.
- **Segurança:** mesmos padrões do zelador-audit (scrub de secrets, `appsecret_proof`, nunca ecoar token); escrita ganha log local de auditoria (`outputs/trafego/log-publicacoes.jsonl`: quem aprovou, quando, o quê).
