# STORY-17.W2.1 - Leitura histórica sem invenção

## Status

Draft

## Dependências

- 17.W1.2

## Objetivo

Estender `leitor-de-metricas` para comparar períodos usando somente métricas confirmadas e contexto de atribuição.

## Critérios de aceite

- [ ] Comparações separam Real, Estimado e não fornecido.
- [ ] Janelas incompatíveis não são agregadas sem aviso e decisão humana.
- [ ] A saída aponta fonte e revisão de cada número.
- [ ] A skill não deriva CPA, ROAS ou tendência quando o denominador ou a amostra faltam.
- [ ] Execução de uma única semana continua compatível.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `.claude/skills/leitor-de-metricas/SKILL.md`
- `.agents/skills/leitor-de-metricas/SKILL.md`
- `.claude/skills/_shared/squad-trafego/**`
- `.agents/skills/_shared/squad-trafego/**`
- `aula-04/templates/leitura-historica.yaml`
- `docs/stories/epic-17/**`

## Validação

- Fixtures de semanas compatíveis e incompatíveis.
- Mirror parity.
- Golden outputs sem números inventados.

## Stop conditions

- Skill precisar acessar credencial diretamente.
- Comparação remover selos ou fontes atuais.

