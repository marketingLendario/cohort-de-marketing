# STORY-14.W3.1 - Extension Packs no runtime da fábrica

## Status

Done

## Dependências

- 14.W1.2
- 14.W2.1
- 14.W2.2
- 14.W2.3

## Objetivo

Fazer o factory consumir o catálogo resolvido e produzir lotes rastreáveis sem
regredir campanhas que usam apenas built-ins.

## Critérios de aceite

- [x] O request aceita `extension_packs` explícitos e relativos à raiz autorizada
  do projeto.
- [x] Packs são validados e resolvidos antes da criação de qualquer job ou output.
- [x] `factory.py`, `variation.py` e `archetype_render.py` consultam o catálogo
  resolvido em vez de reler arquivos isolados durante a campanha.
- [x] Cenas UGC, dispositivos de mockup e estilos didáticos built-in deixam de ser
  arrays hardcoded e passam pelo mesmo contrato declarativo.
- [x] Hooks aceitam `copy_mechanism_id` e `visual_mechanism_id`.
- [x] O adapter legado mapeia `mechanism` para o comportamento v1 e emite aviso
  sanitizado, sem quebrar campanhas existentes.
- [x] O manifesto registra packs, versões, entidades selecionadas, versão da
  factory e `catalog_hash`.
- [x] Retry e retomada recusam catálogo cujo hash divergiu do job original, salvo
  criação explícita de nova versão do lote.
- [x] Anti-saturação inclui IDs namespaced e não mistura janelas de packs distintos.
- [x] Pessoa continua exigindo Persona Pack, foto real, hash e autorização.
- [x] Outputs permanecem fora da skill e somente itens aprovados são promovidos.
- [x] Testes com gerador fake cobrem todos os renderers; smoke real cobre ao menos
  mecanismo novo, cena UGC nova e arquétipo declarativo.
- [x] Campanha sem extension packs mantém compatibilidade de contrato e resultado.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/factory.py`
- `.claude/skills/ads-creative-factory/scripts/archetype_render.py`
- `.claude/skills/ads-creative-factory/scripts/variation.py`
- `.claude/skills/ads-creative-factory/scripts/ugc.py`
- `.claude/skills/ads-creative-factory/scripts/didactic.py`
- `.claude/skills/ads-creative-factory/scripts/saturation.py`
- `.claude/skills/ads-creative-factory/scripts/catalog_loader.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Validação

- Suite Python completa com image generation mockada.
- Smoke real via sessão Codex local, sem API key.
- Manifesto público sanitizado e comparação de hash em retry/retomada.
