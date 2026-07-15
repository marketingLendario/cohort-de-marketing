# STORY-16.W2.2 - Briefing, mapa e status orientados por catálogo

## Status

Draft

## Dependências

- 16.W1.1
- 16.W2.1

## Objetivo

Remover contagens e dependências duplicadas das superfícies públicas e fazê-las consumir o catálogo e as regras canônicas.

## Critérios de aceite

- [ ] Briefing e mapa exibem as 31 skills do catálogo ou a quantidade atual gerada, sem literal divergente.
- [ ] Edges, requisitos, artefatos e estados vêm de `skill-catalog.json` e `skill-unlock-rules.json`.
- [ ] As cópias raiz e `aula-03/materiais/` continuam equivalentes.
- [ ] Catálogo ausente ou inválido produz erro útil e não um mapa parcialmente incorreto.
- [ ] Validator falha quando uma skill canônica não aparece nas superfícies públicas.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `briefing.html`
- `mapa-skills.html`
- `mapa-skills-artifacts.js`
- `aula-03/materiais/briefing.html`
- `aula-03/materiais/mapa-skills.html`
- `aula-03/materiais/mapa-skills-artifacts.js`
- `data/skill-catalog.json`
- `data/skill-unlock-rules.json`
- `scripts/validate-mapa-wiring.mjs`
- `scripts/validate-skill-catalog.mjs`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Validação estrutural das 31 skills e 41 edges.
- Smoke do briefing e mapa servidos por HTTP local.
- Teste de falha com catálogo inválido.
- Comparação dos artefatos distribuídos.

## Stop conditions

- Mudança reduzir detalhe hoje disponível no mapa.
- Solução duplicar o catálogo dentro do HTML.

