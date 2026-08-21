# STORY-17.W3.2 - Gate público da Aula 4

## Status

Draft

## Dependências

- 17.W3.1

## Objetivo

Provar contratos, skills, materiais e exemplo da Aula 4 antes da publicação.

## Critérios de aceite

- [ ] Validators, mirrors e skill catalog passam.
- [ ] Exemplo executa de semana bruta até decisão registrada.
- [ ] Métricas sem fonte/janela/confirmador são bloqueadas ou marcadas como ausentes.
- [ ] Evidência não contém segredo, PII, path absoluto ou dado privado.
- [ ] Compatibilidade com a operação de uma semana da Aula 3 é comprovada.
- [ ] PO, Architect e QA registram veredito.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `scripts/validate-aula-04-contracts.mjs`
- `scripts/validate-skill-catalog.mjs`
- `docs/releases/aula-04-data-loop-v1.md`
- `docs/stories/epic-17/EPIC-17-EVIDENCE.md`
- `docs/stories/epic-17/epic-17-state.json`

## Validação

- Checkout limpo.
- Suites Node e golden fixtures.
- Walkthrough do aluno.
- Scan de distribuição e privacidade.

## Stop conditions

- Qualquer fonte não rastreável virar série histórica.
- Sign-off humano pendente.

