# STORY-16.W2.3 - Próxima skill determinística

## Status

Draft

## Dependências

- 16.W2.1
- 16.W2.2

## Objetivo

Calcular um único próximo passo a partir do ProjectBrief, artefatos verificados e regras públicas, com explicação auditável.

## Critérios de aceite

- [ ] Estados suportados são `available`, `recommended`, `almost`, `blocked`, `not_applicable` e `done`.
- [ ] Empates usam prioridade declarativa e estável, nunca ordem acidental do objeto.
- [ ] O resultado inclui requisitos atendidos, ausentes e razão da recomendação.
- [ ] `comecar`, briefing, mapa e `status-funil` não apresentam próximos passos contraditórios.
- [ ] Perfil e `not_applicable` alteram a rota sem apagar artefatos existentes.

## Tasks

- [ ] Confirmar baseline e ausência de PR cobrindo o escopo.
- [ ] Congelar contrato e testes antes da implementação.
- [ ] Implementar somente dentro da File List aprovada.
- [ ] Rodar validações incrementais e registrar evidências sanitizadas.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/skill-unlock-rules.json`
- `scripts/lib/skill-readiness.mjs`
- `scripts/lib/skill-readiness.test.mjs`
- `briefing.html`
- `mapa-skills.html`
- `.claude/skills/comecar/SKILL.md`
- `.claude/skills/status-funil/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/skills/status-funil/SKILL.md`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Table tests para perfis e estados.
- Golden fixtures com próxima skill e explicação.
- Mirror parity das skills alteradas.
- Smoke de retomada de projeto parcialmente concluído.

## Stop conditions

- Prioridade precisar ser hardcoded fora das regras.
- Alteração quebrar a autonomia de uma skill chamada diretamente.

