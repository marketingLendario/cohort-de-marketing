# Evidência sanitizada — Story 16.W2.1

## Veredito do executor

Implementação concluída e encaminhada em `InReview` para o quality gate
independente de `@architect`. Nenhum push, PR, merge ou deploy foi realizado.

## Proveniência

- Baseline da wave: `06e2b64`, presente na ancestry da branch de story.
- Dependência: `16.W1.1` registrada como `Done` no state canônico.
- Cobertura remota antes da execução: nenhum PR aberto no repositório público.
- Test-first: `c1121f9`.
- Implementação: `71fdf32`.
- Hardening de paths sensíveis: teste `948e1df`, correção `66b3909`.
- QG Round 1: FAIL 68/100; reprodução `dcca6e7`, correção `c5030e6`.
- QG Round 2: FAIL 82/100; reprodução `50f3f92`, correção `f99f4bc`.

## Matriz executada

| Prova | Resultado |
|---|---|
| Unitários, adversariais, CLI e Playwright | PASS, 18/18 |
| Reprodutibilidade do índice | PASS |
| Projeto ausente ou raiz inválida | Recusa tipada |
| Absoluto, traversal e symlink de escape | Recusa tipada e sanitizada |
| Duplicidade no mesmo tipo | Deduplicação determinística |
| Ambiguidade entre tipos | Recusa tipada |
| Confirmação exata | Somente a entrada alvo muda |
| Conteúdo bruto e path da máquina | Ausentes da serialização |
| Assinatura forte de credencial em filename | Recusa tipada sem eco |
| Path sem casar pattern de origem | Recusa fail-closed |
| Policy divergente das unlock rules | Recusa fail-closed |
| Path repetido entre tipos | Recusa global |
| Provenance com assinatura sensível | Recusa sem eco |
| Storage com schema v999 ou propriedade extra | Unlocks limpos; ProjectBrief preservado |
| Storage com path/pattern/policy adulterado | Unlocks limpos; ProjectBrief preservado |
| Storage com índice válido | Confirmações derivadas novamente |
| NUL e controles C0/C1 em path | Mesma recusa em Node e browser |
| Provenance parcialmente falsa | Recusa: todos os patterns precisam casar |
| Glob `**` terminal com `file.md` | Recusa em matcher/rules/validator/builder |
| Briefings distribuídos | Byte a byte idênticos |
| Smoke HTTP das duas URLs | PASS, zero `pageerror` |
| ProjectBrief rules | PASS, 120 campos e 31 skills |
| Skill catalog | PASS, 31 skills e 41 edges |
| Mapa wiring | PASS, 69/69 URLs |
| Mapa preview | PASS, canvas/PDF e zero `pageerror` |
| Dependências de `scripts/` | 0 vulnerabilidades |
| Whitespace check | PASS |

## Garantias do contrato

- A leitura de bytes ocorre somente depois de um path corresponder a glob
  declarado e permanecer, após `realpath`, dentro de `projetos/{slug}`.
- O índice possui apenas metadados necessários: tipo, path POSIX relativo,
  SHA-256, tamanho, regra/pattern de origem e confirmação.
- A política versionada exige confirmação por padrão. Descoberta não confirmada
  permanece `pending_confirmation` e não satisfaz requisito crítico.
- A UI não lê diretórios. Ela aceita somente `ArtifactIndex v1` fechado e
  alinhado à versão corrente de `skill-unlock-rules.json`.
- Node e browser usam o matcher `1.0.0` espelhado e provado pela mesma matriz;
  provenance canônica não é apenas declarada, precisa casar o path.
- A gramática portátil também é compartilhada e cobre controles C0/C1. Patterns
  de origem são uma conjunção verificável, não uma lista com um único álibi válido.
- O storage nunca restaura o mapa booleano legado como autoridade. Somente um
  índice integralmente revalidado pode reconstruir os desbloqueios.

## Limites e handoff

- `deploy_type: none`; não há publicação externa nesta story.
- A story permanece `InReview` até reprobe independente de arquitetura.
- A W2.2 deve consumir este índice após o fan-in e não implementar outro
  indexador no browser.
