# STORY-16.W2.1 - Descoberta segura de artefatos e proveniência

## Status

Draft

## Dependências

- 16.W1.1

## Objetivo

Substituir declarações manuais de artefatos por um índice verificável e confinado a `projetos/{slug}/`.

## Critérios de aceite

- [ ] O indexador lê somente globs declarados em `skill-unlock-rules.json` dentro do projeto selecionado.
- [ ] Cada artefato registra tipo, path relativo, hash, tamanho, origem e estado de confirmação.
- [ ] Symlink de escape, path absoluto e traversal falham fechado.
- [ ] Artefato inferido não desbloqueia decisão crítica antes de confirmação quando a regra exigir.
- [ ] O índice é reproduzível e não inclui conteúdo sensível por padrão.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/skill-unlock-rules.json`
- `scripts/project-artifact-index.mjs`
- `scripts/project-artifact-index.test.mjs`
- `briefing.html`
- `aula-03/materiais/briefing.html`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Fixtures de projeto válido, ausente, duplicado e traversal.
- Hashes estáveis em duas execuções.
- Teste que prova ausência de conteúdo bruto no índice.

## Stop conditions

- Descoberta exigir varrer fora de `projetos/{slug}/`.
- Regra de unlock não distinguir existência de confirmação.

