# Evidência - Story 17.W1.2

## Escopo verificado

- Baseline de execução: `85cad244a1de66837354f8c5f3761a25fa567b57`.
- Dependência `17.W1.1`: `Done`, com Quality Gate `PASS 98` e validators integrados.
- Cobertura remota: `gh pr list --state open --limit 100` retornou lista vazia no preflight.
- RED: `65c6b75` congela schema, fixtures, identidade, hash, códigos de saída e imutabilidade.
- Implementação: `d9a66a0` adiciona o builder append-only e seus probes adversariais.
- `docs/stories/epic-17/epic-17-state.json` não foi alterado; o estado do epic permanece reservado ao fan-in.

## Contrato congelado

- Identidade idempotente: `projectId + campaignId + weekStart + revision`.
- Hash: SHA-256 hexadecimal minúsculo sobre JSON compacto do `WeeklyPanel` validado, com chaves de objetos ordenadas recursivamente e ordem dos arrays preservada.
- Validação de entrada: o mesmo `validateAula04Contract` aprovado em `17.W1.1`, sem coerção, defaults, remoção ou normalização.
- Persistência: o lote inteiro, conflitos, ledger prévio e ledger gerado são validados antes da criação de temporário e do `rename` atômico.
- Projeção: somente referências, metadados e os oito campos literais de cada métrica; `reader`, `diagnosis`, `decision`, `events` e seus textos não são projetados.

## Matriz de aceitação

| Critério | Prova |
|---|---|
| AC1 | Schema fecha cada entrada e exige as sete referências mais `metrics`; fixture esperada congela quatro hashes independentes. |
| AC2 | Teste preserva integralmente métricas `Real`, `Estimado` e `nao_fornecido`; remoção de `source` falha antes da escrita. |
| AC3 | Replay com todas as chaves JSON reordenadas mantém o arquivo byte a byte; conflito retorna exit `1` e preserva SHA-256. |
| AC4 | Revisão 2 é anexada sem alterar a entrada da revisão 1; índice ordena projeto, campanha, semana e revisão. |
| AC5 | Probe busca e não encontra campos brutos, decisão, eventos, reader, diagnosis, e-mails de fixture ou textos de ação humana na saída. |

## Execuções automatizadas

### Testes focais

```text
node --test scripts/build-weekly-ledger.test.mjs
tests 10
pass 10
fail 0
```

Os probes cobrem três semanas, revisão posterior, proveniência literal, replay por hash canônico, conflito simples, conflito ao fim de lote, ledger prévio forjado, ausência de proveniência, minimização da saída, uso, parse, leitura e falha de escrita atômica.

### Regressão completa de scripts

```text
node --test scripts/*.test.mjs
tests 55
pass 55
fail 0
```

Inclui os oito testes dos validators de `17.W1.1` e as suítes adjacentes de ProjectBrief, ArtifactIndex e superfícies data-driven.

### Sintaxe e escopo

```text
node --check scripts/build-weekly-ledger.mjs
node --check scripts/build-weekly-ledger.test.mjs
git diff 85cad244a1de66837354f8c5f3761a25fa567b57 --check
```

Resultado: todos concluíram com exit `0`; nenhum arquivo fora da File List foi alterado.

## Execução manual das fixtures

```text
{"added":4,"replayed":0,"total":4}
SHA-256 ledger: df4eea739b46f5c2a8ea84bdbee5aa133f8f0b18a59912f333bf294d71e05d13
{"added":0,"replayed":1,"total":4}
SHA-256 após replay: df4eea739b46f5c2a8ea84bdbee5aa133f8f0b18a59912f333bf294d71e05d13
{"valid":false,"code":"LEDGER_IDENTITY_CONFLICT","identity":{"projectId":"project-acme","campaignId":"campaign-acme-launch","weekStart":"2026-07-13","revision":1}}
SHA-256 após conflito: df4eea739b46f5c2a8ea84bdbee5aa133f8f0b18a59912f333bf294d71e05d13
```

O ledger produzido também foi comparado byte a byte com `ledger-three-weeks.expected.json`.

## Veredito do executor

`READY_FOR_QUALITY_GATE`. A story permanece `InReview`; `Done` depende do Quality Gate de `@architect`.
