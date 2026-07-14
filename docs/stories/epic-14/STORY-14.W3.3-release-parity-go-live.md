# STORY-14.W3.3 - Regressão, release pública e gate de go-live

## Status

Done

## Dependências

- 14.W3.1
- 14.W3.2

## Objetivo

Provar a extensibilidade ponta a ponta e publicar a release `2.2.0` sem regressão,
asset privado ou drift entre superfícies.

## Critérios de aceite

- [x] Todas as suites de schema, loader, CLI, builder, renderer, runner e painel
  passam a partir de checkout limpo.
- [x] Um Extension Pack sintético é criado apenas pelos comandos públicos.
- [x] O pack inclui brand, persona, mecanismo, cena UGC, variação, referência,
  gate profile e arquétipo declarativo válidos.
- [x] Um lote real usa elementos do pack em ao menos dois formatos e três
  arquétipos, incluindo UGC ou pessoa quando autorizado.
- [x] CLI e painel registram o mesmo catálogo canônico e `catalog_hash`.
- [x] Colisão, traversal, renderer desconhecido, rights ausentes e consentimento
  inválido são exercitados como casos bloqueados.
- [x] Retry, cancelamento, reload, restart e nova versão do catálogo não causam
  processo órfão nem sobrescrita de lote aprovado.
- [x] Somente itens aprovados entram no pacote final, com PNGs, manifesto e copy
  associados.
- [x] Diagnósticos e evidências não contêm segredo, PII ou path absoluto.
- [x] A versão da skill é `2.2.0` e a documentação descreve comandos, migração e
  compatibilidade do campo legado.
- [x] `source-manifest.json`, notices, allow-list e hashes são regenerados pelo
  pipeline de publicação autorizado.
- [x] Nenhum pack de cliente, foto real privada, output, cache ou fixture sensível
  entra no release.
- [x] Os mirrors `.claude` e `.agents` são byte a byte idênticos.
- [x] O gate final registra decisão explícita de release e blockers residuais.

## Ownership

- `.claude/skills/ads-creative-factory/**`
- `.agents/skills/ads-creative-factory/**`
- `data/skill-catalog.json`
- `scripts/validate-skill-catalog.mjs`
- `docs/releases/ads-creative-factory-2.2.0.md`
- `docs/stories/epic-14/EPIC-14-EVIDENCE.md`
- Repositório privado `academia-lendaria-ads-studio` para a evidência da 14.W3.2

## Validação

- Instalação limpa das dependências declaradas.
- Testes Python, validações de catálogo e testes do Ads Studio aplicáveis.
- Playwright desktop/mobile.
- Auditoria de allow-list, licenses, hashes, outputs e secrets.
- `git diff --check` e comparação recursiva dos mirrors.
