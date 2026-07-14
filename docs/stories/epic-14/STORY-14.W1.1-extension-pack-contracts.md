# STORY-14.W1.1 - Contratos de Extension Pack e entidades criativas

## Status

Draft

## Objetivo

Definir contratos versionados e fail-closed para extensões da Creative Factory,
sem alterar ainda o comportamento do renderer.

## Critérios de aceite

- [ ] Existe `creative-extension-pack.v1.schema.json` com `schema_version`,
  `pack_type`, `id`, `version`, `namespace`, compatibilidade mínima da factory,
  entidades, assets e rights.
- [ ] IDs de entidades externas são namespaced e possuem formato canônico.
- [ ] O contrato cobre `archetypes`, `mechanisms`, `ugc_scenes`, `variations`,
  `references` e `gate_profiles`.
- [ ] Mecanismos declaram `kind: copy`, `visual` ou `hybrid` e seus campos
  obrigatórios por tipo.
- [ ] Cenas UGC declaram setting, shot, lighting, authenticity guards, formato e
  necessidade de persona.
- [ ] Arquétipos declaram renderer mode, tema, campos exigidos, compatibilidades,
  variantes internas e gate profile.
- [ ] Renderer mode é limitado a `hybrid`, `person`, `mockup`, `ugc` e
  `didactic` nesta versão.
- [ ] Variações declaram eixo allowlisted, fragmento, compatibilidades e locks.
- [ ] Referências e demais assets exigem path relativo confinado, rights ID e
  provenance.
- [ ] `additionalProperties: false` é aplicado nos boundaries públicos.
- [ ] Fixtures cobrem pack mínimo válido, pack completo e falhas de versão, ID,
  rights, traversal, symlink, campo desconhecido e renderer desconhecido.
- [ ] Os schemas ficam disponíveis nos mirrors canônico e Codex sem divergência.

## Ownership

- `.claude/skills/ads-creative-factory/schemas/**`
- `.claude/skills/ads-creative-factory/scripts/pack_loader.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Validação

- Testes unitários do loader contra todas as fixtures.
- Prova de confinamento de path em Linux/macOS e sem dependência de cwd.
- Comparação byte a byte entre os mirrors.

## Fora de escopo

- Resolver ou instalar packs.
- Alterar `factory.py` ou executar image generation.
