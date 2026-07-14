# STORY-14.W2.2 - Comandos de mecanismos, UGC e elementos criativos

## Status

Done

## Dependências

- 14.W1.1
- 14.W1.3

## Objetivo

Permitir que o operador expanda a essência criativa da skill por entidades
declarativas versionadas, sem editar os dados built-in.

## Critérios de aceite

- [x] `mechanism add` cria mecanismo `copy`, `visual` ou `hybrid` dentro de um
  Extension Pack selecionado.
- [x] Mecanismo de copy declara transformação de crença, estrutura do hook, tipo
  de prova, objeção, campos obrigatórios e claims proibidos.
- [x] Mecanismo visual declara `core`, intenção psicológica, necessidade de
  likeness e compatibilidades de arquétipo/formato.
- [x] `ugc-scene add` declara setting, shot, lighting, props, authenticity guards,
  negative guards, formatos e necessidade de persona.
- [x] `variation add` aceita somente eixos allowlisted e valida fragmento,
  compatibilidades e locks. Os eixos incluem material, lighting, composition,
  density, finish, backdrop, layout, mockup device e didactic style.
- [x] `reference add` copia o asset para o pack, calcula SHA-256 e exige source,
  rights ID, licença/autorização e redistributability.
- [x] `gate-profile add` aceita somente métricas e intervalos allowlisted pelo
  runtime; não pode desativar revisão humana, likeness gate ou confinamento.
- [x] `pack build` consolida as entidades do workspace temporário em um Extension
  Pack e só publica o destino após validação completa.
- [x] `pack install` associa explicitamente o pack ao projeto em arquivo de
  configuração versionável; não existe registry global implícito.
- [x] Promoção de referência gerada escreve no pack do projeto, nunca no catálogo
  público interno da skill.
- [x] Todos os comandos aceitam `--dry-run`, `--json`, pack explícito e escrita
  atômica.
- [x] Nenhum comando permite override de built-in ou ID já instalado.
- [x] O campo legado `mechanism` possui regra documentada de adaptação para
  `visual_mechanism_id`; não é removido nesta story.
- [x] `preview` consegue validar composição textual e prompt sanitizado sem exigir
  geração de imagem real.
- [x] Fixtures e testes cobrem todas as entidades, campos condicionais, colisões,
  rights e rollback em falha.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/catalog_cli.py`
- `.claude/skills/ads-creative-factory/scripts/catalog_loader.py`
- `.claude/skills/ads-creative-factory/schemas/**`
- `.claude/skills/ads-creative-factory/scripts/anchors.py`
- `.claude/skills/ads-creative-factory/scripts/variation.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Validação

- Um único pack sintético recebe mecanismo, cena UGC, variação, referência e
  gate profile, depois passa por `pack build` e `pack install`.
- `catalog list/show/validate` resolve todas as entidades e o hash do pack.
- Diff confirma que nenhum YAML built-in foi alterado pelos comandos.
