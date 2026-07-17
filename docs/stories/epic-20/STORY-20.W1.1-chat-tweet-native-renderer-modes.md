# STORY-20.W1.1 - Renderer modes nativos chat + tweet (print de conversa e tweet card)

## Status

InReview

## Dependências

- 14.W1.1
- 14.W1.2

## Objetivo

Adicionar as duas espécies nativas programáticas ao motor: **print de
conversa/notificação** (`chat_notification`, renderer `chat`) e **meme/tweet
card** (`tweet_card`, renderer `tweet`), 100% PIL (zero chamadas de geração de
imagem), brand-agnostic (identidade só via brand/persona pack) e integradas ao
catálogo no mesmo padrão dos modos existentes. Port adaptado do trabalho
equivalente na skill do sinkra-hub (v1.3.0), com registro formal exigido pela
governança da skill ("Renderer novo exige story de desenvolvimento").

## Contexto

Este registro é **retroativo à implementação na mesma sessão** — a story
documenta ACs verificados, não planejados a priori. A arquitetura seguida é a
do motor extensível v2.2.x: built-ins declarativos em `data/archetypes.yaml`,
variação interna como entidades de eixo no catálogo
(`variation-axes.yaml` → `_builtin_variations()`), seleção explícita por hook
validada antes da geração (`explicit_internal` no `factory.py`), gate
archetype-aware por profile (`builtin.default-native`) e identidade
exclusivamente via packs (nenhum default de cliente na skill).

## Critérios de aceite

- [x] Renderer modes `chat` e `tweet` aceitos pelo núcleo: allowlist de
  `_builtin_archetypes()` (`catalog_loader.py`), enum `renderer_mode` do
  `creative-extension-pack.v1.schema.json` e dispatcher de
  `render_archetype()`.
- [x] Built-ins `chat_notification` (tema `native`, 3 estilos:
  `whatsapp_dark`, `whatsapp_light`, `notification_stack`) e `tweet_card`
  (tema `native`, 2 estilos: `dark_card`, `light_card`) declarados em
  `data/archetypes.yaml`, com variação interna nos eixos novos `chat_style` e
  `tweet_style` (`variation-axes.yaml` + enum `axis` do schema).
- [x] Hooks selecionam estilo explicitamente por `chat_style_id` /
  `tweet_style_id` (mesmo contrato de `didactic_style_id`); ID desconhecido ou
  de eixo incompatível falha antes da geração; a seleção viaja no manifesto em
  `selected_entities`.
- [x] `chat.py` e `tweet.py` são brand-agnostic: fontes via
  `alib.font_path(brand, role)`, cores de moldura via
  `alib.style_palette(brand)`, contato/autor via persona pack
  (`persona["name"]` + foto REAL por `person_mod.pick_photo`) com fallback
  para `identity` do brand pack; sem foto legível, avatar neutro com inicial
  (nunca likeness gerada). Logo/tile só quando `alib.has_logo_assets(brand)`;
  o tweet compõe via `compose_logo` (sidecar `.logo.json` habilita o guard de
  proporção do `review.py`).
- [x] Nenhuma chamada de geração de imagem nos dois renderers (custo de API
  zero), provado por teste com `alib.codex_image` patcheado para explodir.
- [x] Salvaguardas da espécie nativa: sem selo de verificado (não fabricamos
  status), números de engajamento orgânicos (nunca redondos), copy sem emoji
  (fontes neutras não renderizam emoji — caracteres removidos), notificação
  nunca exibe mensagem `from: me` (notificação é o que CHEGA do contato).
- [x] Correção do bug latente `logo_icon-cream.png` em `didactic.py`/`ugc.py`:
  `prepare_assets.py` gera sufixos por superfície (`dark`/`light`/`gold`) —
  referência corrigida para `logo_icon-dark.png` (overlay de logo voltou a
  acontecer).
- [x] Modos existentes preservados byte a byte no comportamento (nenhum teste
  pré-existente alterado além do bump de versão assertado e das listas que
  enumeram os modos).
- [x] `.claude/skills/ads-creative-factory` e
  `.agents/skills/ads-creative-factory` permanecem byte a byte idênticos.

## Tasks

- [x] Mapear a arquitetura alvo (catalog, packs, gate profiles, testes) antes
  de portar — port ADAPT, não copy-paste.
- [x] Implementar módulos, built-ins, eixos, wiring e schema.
- [x] Estender a suíte (`test_factory_catalog_runtime.py`): dispatcher cobre
  os 7 modos, seleção interna resolve `chat_style_id`/`tweet_style_id`,
  render real dos 5 estilos sem chamada de imagem, seletores explícitos
  honrados pelo factory.
- [x] Rodar suíte completa + `doctor.py` e registrar evidências.
- [x] Espelhar em `.agents/` e confirmar paridade.
- [x] Materializar este registro (epic + story + state) e atualizar SKILL.md
  (v2.3.0, 8 built-ins, seletores novos, seção das espécies nativas).

## File List real

- `.claude/skills/ads-creative-factory/SKILL.md`
- `.claude/skills/ads-creative-factory/data/archetypes.yaml`
- `.claude/skills/ads-creative-factory/data/variation-axes.yaml`
- `.claude/skills/ads-creative-factory/schemas/creative-extension-pack.v1.schema.json`
- `.claude/skills/ads-creative-factory/scripts/catalog_loader.py`
- `.claude/skills/ads-creative-factory/scripts/factory.py`
- `.claude/skills/ads-creative-factory/scripts/archetype_render.py`
- `.claude/skills/ads-creative-factory/scripts/chat.py` (novo)
- `.claude/skills/ads-creative-factory/scripts/tweet.py` (novo)
- `.claude/skills/ads-creative-factory/scripts/didactic.py`
- `.claude/skills/ads-creative-factory/scripts/ugc.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/test_factory_catalog_runtime.py`
- `.agents/skills/ads-creative-factory/**` (espelho sincronizado byte a byte)
- `docs/stories/epic-20/**`

## Validação

- Suíte Python da skill: **34 testes, todos passando** (inclui os 2 novos
  desta story e os 3 estendidos).
- `doctor.py --json`: `status: ready` (python, pillow, pyyaml, numpy,
  imagemagick, codex).
- Smoke visual com brand pack sintético (identity + paleta, sem logo, sem
  persona): chat dark com avatar-inicial e tweet card com acento do pack
  renderizados corretamente.
- `diff -rq .claude/skills/ads-creative-factory .agents/skills/ads-creative-factory`
  (excluindo `__pycache__`): sem saída.

## Stop conditions

- Qualquer chamada de geração de imagem nos renderers `chat`/`tweet`.
- Likeness gerada, selo de verificado ou identidade hardcoded de cliente em
  qualquer caminho das espécies nativas.
- Regressão de comportamento em qualquer um dos 5 modos pré-existentes.
- Divergência entre `.claude/` e `.agents/`.

## Resultado

Implementado conforme os ACs. A skill vai de 6 → **8 arquétipos built-in** e
de 5 → **7 renderer modes**; Extension Packs podem declarar presets sobre
`chat`/`tweet` (incluindo variações novas nos eixos `chat_style`/
`tweet_style`) sem tocar no núcleo. `FACTORY_VERSION` e
`SKILL.md metadata.version` avançaram para **2.3.0** — o mesmo alvo já
declarado pelo `epic-18-state.json`, então o corte de release 2.3.0 cobre os
dois epics de uma vez.

Pendente (fora do escopo de implementação, autoridade de `@devops` por
`agent-authority.md`, compartilhado com o EPIC-18): entrada `epic20Files` em
`scripts/generate-ads-creative-factory-manifest.mjs`, regeneração de
`source-manifest.json` e corte formal do release 2.3.0. `@po` ainda não
validou esta story (registro retroativo; `InReview` reflete implementação +
auto-verificação, não aprovação humana final).
