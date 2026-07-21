# STORY-10.W1.1 - Portar a skill Creative Factory

## Status

Done local / Release blocked

## Critérios de aceite

- [x] Skill canônica em `.claude/skills/ads-creative-factory/`.
- [x] Espelho literal em `.agents/skills/ads-creative-factory/`.
- [ ] Scripts, fontes, brand pack, referências e personas necessários versionados publicamente. Bloqueado por direitos de redistribuição.
- [x] Logos e fotos usadas pelo default não dependem de `sinkra-hub` em runtime local.
- [x] Outputs, caches e arquivos efêmeros não são copiados.
- [x] O adapter usa sandbox `workspace-write`; não usa bypass global.
- [x] `OPENAI_API_KEY` e `CODEX_API_KEY` não são necessários nem herdados.
- [x] Catálogo passa a reconhecer 31 skills sem hardcode divergente.
- [x] Os 69 testes portados passam dentro deste repositório.

## Ownership

- `.claude/skills/ads-creative-factory/**`
- `.agents/skills/ads-creative-factory/**`
- `data/skill-catalog.json`
- `scripts/validate-skill-catalog.mjs`
