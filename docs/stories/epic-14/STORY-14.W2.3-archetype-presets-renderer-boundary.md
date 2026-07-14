# STORY-14.W2.3 - Arquétipos declarativos e boundary de renderer

## Status

Done

## Dependências

- 14.W1.1
- 14.W1.2
- 14.W2.2

## Objetivo

Permitir novos arquétipos como presets de renderers existentes, mantendo novos
renderer modes dentro do processo normal de desenvolvimento de código.

## Critérios de aceite

- [x] `archetype add` cria um preset namespaced em Extension Pack explícito.
- [x] O preset exige label, renderer mode, theme, formatos, required fields,
  compatibilidades, variantes internas e gate profile.
- [x] Renderer mode é validado contra allowlist do runtime.
- [x] Um mode desconhecido é recusado com orientação para abrir story de
  desenvolvimento; não existe import dinâmico de código do pack.
- [x] Presets podem referenciar cenas UGC, mecanismos, variações e referências do
  mesmo catálogo resolvido.
- [x] Referência inexistente ou incompatível bloqueia a instalação.
- [x] `preview archetype` produz plano de render e prompt sanitizado com fixture
  determinística.
- [x] O preview não exige likeness real; persona sintética ou ausência explícita
  cobre os caminhos aplicáveis.
- [x] O gate profile do arquétipo é validado antes do primeiro job.
- [x] Built-ins são migráveis para o mesmo modelo declarativo sem mudar o output
  funcional existente.
- [x] Testes cobrem cada renderer mode allowlisted e a rejeição de mode arbitrário.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/catalog_cli.py`
- `.claude/skills/ads-creative-factory/scripts/catalog_loader.py`
- `.claude/skills/ads-creative-factory/scripts/archetype_render.py`
- `.claude/skills/ads-creative-factory/data/archetypes.yaml`
- `.claude/skills/ads-creative-factory/schemas/**`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Fora de escopo

- Implementar renderer mode adicional.
- Executar código ou template arbitrário vindo do pack.
