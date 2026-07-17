# EPIC-20 - Renderer modes nativos programáticos (chat + tweet)

## Status

InProgress — 20.W1.1 implementada e auto-verificada (InReview); pendente
sign-off humano/@po e release management (@devops, compartilhado com o
EPIC-18 no corte 2.3.0).

## Baseline

- `gitRef`: `origin/main`
- `gitCommit`: `b08ec03d5fd866f4bf962d28415f1c81d7122cb8`
- `skillVersion`: `2.2.1`

## Problema

A diversidade de espécie da `ads-creative-factory` parava nas 6 espécies
built-in — todas dependentes de geração de imagem (Codex `image_gen`) exceto a
didática. Faltavam as duas espécies nativas de maior tração em lead-gen que
"furam o radar de ad": o **print de conversa/notificação** (chat/lock screen
carregando o hook como mensagens) e o **meme/tweet card** (post repostado
flutuando sobre backdrop de marca). Ambas são 100% desenháveis em PIL — custo
de API zero — mas exigiam **renderer modes novos**, e a governança da skill é
explícita: "Renderer novo exige story de desenvolvimento e nunca é carregado
do pack".

Este epic é o registro formal (retroativo, mesma sessão da implementação) do
port desses dois renderers a partir do trabalho equivalente na skill do
sinkra-hub (v1.3.0), adaptado à arquitetura de motor extensível deste
repositório: built-ins declarativos, eixos de variação no catálogo, seleção
explícita por hook, gate profile nativo e identidade exclusivamente via packs.

## Escopo

- Renderer modes `chat` e `tweet` registrados no núcleo (allowlist do
  `catalog_loader`, enum do schema de Extension Pack, dispatcher do
  `archetype_render`, seletores explícitos do `factory`).
- Built-ins `chat_notification` (3 estilos no eixo `chat_style`) e
  `tweet_card` (2 estilos no eixo `tweet_style`), tema `native`
  (`builtin.default-native`).
- Módulos `scripts/chat.py` e `scripts/tweet.py` brand-agnostic (identidade
  via brand/persona pack; nunca likeness gerada; sem selo de verificado;
  números de engajamento orgânicos).
- Correção do bug latente `logo_icon-cream.png` (asset inexistente) em
  `didactic.py`/`ugc.py`.

## Fora de escopo

- Renderização servida por Extension Pack (presets de pack continuam
  declarativos sobre os renderer modes do núcleo).
- Corte do release público 2.3.0 (autoridade `@devops`, junto com o EPIC-18).

## Waves

- W1 — Renderer modes chat/tweet + espécies nativas built-in (1 story).
