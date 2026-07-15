# STORY-17.W2.2 - Diagnóstico decisão versus resultado

## Status

Draft

## Dependências

- 17.W1.2
- 17.W2.1

## Objetivo

Estender `diagnosticador` para confrontar a decisão anterior com o resultado observado antes de sugerir nova alavanca.

## Critérios de aceite

- [ ] Diagnóstico referencia hipótese, alavanca, critério de sucesso e reversão anteriores.
- [ ] Resultado é classificado como sustentou, refutou, inconclusivo ou não mensurável.
- [ ] Somente uma nova alavanca é proposta.
- [ ] Circuit breaker e decisão humana permanecem obrigatórios.
- [ ] Ausência de evidência produz pendência, não narrativa conclusiva.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `.claude/skills/diagnosticador/SKILL.md`
- `.agents/skills/diagnosticador/SKILL.md`
- `.claude/skills/_shared/squad-trafego/**`
- `.agents/skills/_shared/squad-trafego/**`
- `aula-04/templates/diagnostico-longitudinal.yaml`
- `docs/stories/epic-17/**`

## Validação

- Golden cases para quatro vereditos.
- Mirror parity.
- Teste de uma única alavanca e circuit breaker.

## Stop conditions

- Diagnóstico executar ação na plataforma.
- Modelo apagar decisão rejeitada ou inconclusiva.

