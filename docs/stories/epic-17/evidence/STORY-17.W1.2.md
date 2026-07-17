# Evidência - Story 17.W1.2

## Escopo verificado

- Baseline de execução: `85cad244a1de66837354f8c5f3761a25fa567b57`.
- Dependência `17.W1.1`: `Done`, com Quality Gate `PASS 98` e validators integrados.
- Cobertura remota: `gh pr list --state open --limit 100` retornou lista vazia no preflight.
- RED: `65c6b75` congela schema, fixtures, identidade, hash, códigos de saída e imutabilidade.
- Implementação: `d9a66a0` adiciona o builder append-only e seus probes adversariais.
- QG1: `FAIL 52/100`, com reprodução independente de 24 exits `0` para somente 2 entradas finais e projeção de PII/decisão/conteúdo bruto por `source`.
- RED da remediação: `bf61b2a` congela concorrência, lock stale/crash, timeout de owner e minimização de `source`/`premise`.
- Remediação: `e3636f6` implementa lock cross-process, owner/token, CAS com retry e referências estruturadas.
- Fechamento semântico: `fffec23` restringe todo `premiseRef` não nulo a `kind: assumption` e rejeita ledger prévio forjado sem reescrevê-lo.
- QG2: `FAIL 64/100`; privacidade e concorrência normal passaram, mas 24 contenders sobre o mesmo lock stale produziram 22 exits `0`, 2 exits `2` e somente 22 entradas. Trocar owner/token antes do rename também não impedia o owner antigo de commitar.
- RED Round3: `4bf2f0b` congela recovery stale 24/24, replay concorrente, ENOENT no gap de inicialização, hijack, SIGKILL e symlink.
- Remediação Round3: `2d354d5` reclama o owner observado por rename para quarantine, remove somente diretório vazio por `rmdir`, repete ENOENT transitório e aplica fencing de inode, PID e token antes da leitura, do CAS e do rename.
- QG3 independente: `PASS 98/100`, alta confiança e zero blockers no HEAD `d27a1017d320552e263f3468b7ed907c548cb1f6`.
- `docs/stories/epic-17/epic-17-state.json` não foi alterado; o estado do epic permanece reservado ao fan-in.

## Contrato congelado

- Identidade idempotente: `projectId + campaignId + weekStart + revision`.
- Hash: SHA-256 hexadecimal minúsculo sobre JSON compacto do `WeeklyPanel` validado, com chaves de objetos ordenadas recursivamente e ordem dos arrays preservada.
- Validação de entrada: o mesmo `validateAula04Contract` aprovado em `17.W1.1`, sem coerção, defaults, remoção ou normalização.
- Persistência: o lote inteiro, conflitos, ledger prévio e ledger gerado são validados; lock cross-process cobre leitura até `rename`, owner vivo não é removido, owner morto/stale é reclamado por quarantine mais `rmdir` do diretório vazio, e CAS reexecuta a transação se o snapshot mudar.
- Fencing: diretório e arquivo do owner são vinculados por `dev/ino`, PID e token. Ownership é revalidado antes da leitura, imediatamente antes do CAS e imediatamente antes do rename; troca de owner aborta com exit `2`, preserva o lock alheio e não cria o ledger.
- Política de proveniência: `source` aceita somente `ref:<kind>:<id>` com kind permitido; `premise` aceita `ref:assumption:<id>` ou `null`. Erros retornam apenas linha, índice e campo, sem ecoar o valor.
- Projeção: somente referências, metadados e métricas minimizadas; `sourceRef`/`premiseRef` são reconstruídos como `{kind,id}` e nenhuma string bruta é copiada. `reader`, `diagnosis`, `decision` e `events` também não são projetados.

## Matriz de aceitação

| Critério | Prova |
|---|---|
| AC1 | Schema fecha cada entrada e exige as sete referências mais `metrics`; fixture esperada congela quatro hashes independentes. |
| AC2 | Teste preserva métricas `Real`, `Estimado` e `nao_fornecido` com referências estruturadas; ausência ou texto livre em `source`/`premise` falha antes do lock e sem eco. |
| AC3 | Replay reordenado mantém o arquivo byte a byte; conflito retorna exit `1`; lock+CAS preserva 24 updates normais, 24 contenders partindo do mesmo lock stale e 24 replays exatamente uma vez. |
| AC4 | Revisão 2 é anexada sem alterar a revisão 1; índice ordena projeto, campanha, semana e revisão; 24 writers distintos resultam em 24 entradas consultáveis. |
| AC5 | Probe injeta e-mail, decisão e conteúdo bruto em `source` e `premise`, recebe rejeição sanitizada e prova que a saída contém somente `sourceRef`/`premiseRef`. |

## Execuções automatizadas

### Testes focais

```text
node --test scripts/build-weekly-ledger.test.mjs
tests 21
pass 21
fail 0
```

Os probes cobrem três semanas, revisão posterior, proveniência referencial, replay por hash canônico, conflito simples e ao fim de lote, ledger prévio forjado, ausência de proveniência, minimização da saída, uso, parse, leitura, falha de escrita, 24 writers concorrentes, 24 contenders sobre lock stale, 24 replays, ENOENT entre `mkdir` e owner write, hijack de owner/token, SIGKILL real, symlink, timeout de owner vivo e rejeição sanitizada de `source` e `premise` livres.

### Regressão completa de scripts

```text
node --test scripts/*.test.mjs
tests 66
pass 66
fail 0
```

Inclui os oito testes dos validators de `17.W1.1` e as suítes adjacentes de ProjectBrief, ArtifactIndex e superfícies data-driven. O probe de 24 contenders partindo do mesmo lock stale passou em oito repetições adicionais: sempre 24 exits `0`, 24 entradas e 24 identidades únicas.

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
SHA-256 ledger: 475b3f539ebd973374cae6eb9704d48b3715dcbb84a01054797e03b5b825ed28
{"added":0,"replayed":1,"total":4}
SHA-256 após replay: 475b3f539ebd973374cae6eb9704d48b3715dcbb84a01054797e03b5b825ed28
{"valid":false,"code":"LEDGER_IDENTITY_CONFLICT","identity":{"projectId":"project-acme","campaignId":"campaign-acme-launch","weekStart":"2026-07-13","revision":1}}
SHA-256 após conflito: 475b3f539ebd973374cae6eb9704d48b3715dcbb84a01054797e03b5b825ed28
```

O ledger produzido também foi comparado byte a byte com `ledger-three-weeks.expected.json`.

## Veredito do executor

`SDC_COMPLETE`. QG3 independente aprovou a story com `PASS 98/100`, alta confiança e zero blockers. A story está `Done`; deploy foi dispensado por `deploy_type: none`, e epic-state/fan-in permanecem reservados ao `@devops`.
