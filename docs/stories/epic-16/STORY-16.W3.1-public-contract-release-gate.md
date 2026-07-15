# STORY-16.W3.1 - Gate público de contrato e distribuição

## Status

Draft

## Dependências

- 16.W1.2
- 16.W2.2
- 16.W2.3

## Objetivo

Provar que ProjectBrief, catálogo, mapa e distribuição pública permanecem coerentes em checkout limpo.

## Critérios de aceite

- [ ] Um projeto novo completa briefing, exporta v1, é reimportado e recebe a mesma próxima skill.
- [ ] Um projeto legado migra sem perda semântica.
- [ ] Catálogo, regras, mirrors e cópias distribuídas passam seus validators.
- [ ] Nenhum segredo, PII, path absoluto ou artefato de cliente entra na evidência.
- [ ] Release registra versão de contrato, compatibilidade e rollback.
- [ ] Product Owner, Architect e QA registram veredito antes de `Done`.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `scripts/validate-project-brief-rules.mjs`
- `scripts/validate-skill-catalog.mjs`
- `scripts/validate-mapa-wiring.mjs`
- `docs/releases/project-brief-v1.md`
- `docs/stories/epic-16/EPIC-16-EVIDENCE.md`
- `docs/stories/epic-16/epic-16-state.json`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Checkout limpo e servidor HTTP local.
- Suites Node e validators públicos.
- Smoke desktop/mobile.
- Scan de secrets, paths e divergência de mirrors.

## Stop conditions

- Qualquer capability loss vs briefing/mapa atual.
- Sign-off estrutural pendente.
- Evidência depender de dado privado não redistribuível.

