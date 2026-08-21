# STORY-17.W2.3 - Reconciliação plataforma, checkout e caixa

## Status

Draft

## Dependências

- 17.W1.1
- 17.W1.2

## Objetivo

Representar diferenças entre fontes de mídia, checkout e caixa sem escolher uma verdade por heurística.

## Critérios de aceite

- [ ] Cada fonte mantém valor, timestamp, moeda, janela e status de confirmação.
- [ ] Diferenças são exibidas como gap absoluto e relativo somente quando comparáveis.
- [ ] Cash confirmed nunca é inferido de evento da plataforma.
- [ ] Fonte ausente permanece `nao_fornecido`.
- [ ] Dados sensíveis de comprador não entram no ledger público.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/contracts/source-reconciliation.v1.schema.json`
- `scripts/reconcile-aula-04-sources.mjs`
- `scripts/reconcile-aula-04-sources.test.mjs`
- `aula-04/templates/reconciliacao-fontes.yaml`
- `docs/stories/epic-17/**`

## Validação

- Fixtures de match, mismatch e fonte ausente.
- Teste de moeda/janela incompatível.
- Scan de PII.

## Stop conditions

- Integração exigir armazenar dados pessoais de comprador.
- Reconciliação decidir automaticamente qual fonte está correta.

