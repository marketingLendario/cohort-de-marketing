# EPIC-19 - Plano de evidências

## Status

EXECUTADO em 2026-07-15/16 (waves W1–W3). Evidência local completa; E2E
supervisionado pendente (exige humano — ver Veredito).

## Matriz

| Story | Evidência obrigatória | Resultado |
|---|---|---|
| 19.W1.1 | teste node de classificação/elegibilidade; smoke read-only na conta real (zero POST); diff vazio dos espelhos | ✅ 18/18 PASS; smoke live: 331 públicos, 3 elegíveis morno + 8 quente, 173 inelegíveis (op 450/441, bound 20, listas velhas); espelhos idênticos; auditoria padrão byte a byte igual ao baseline |
| 19.W1.2 | diff vazio dos espelhos; seção v1 do default sagrado intacta (diff só adiciona) | ✅ 73 inserções / 0 remoções por espelho (conferido pelo orquestrador no diff); espelhos idênticos |
| 19.W2.1 | 7 fixtures de recusa recusadas + 2 de aceitação aceitas; fixture v1 sem `publico` gera targeting idêntico ao v1; zero objeto criado na conta | ✅ 16/16 PASS (re-executado pelo orquestrador); deepEqual do targeting v1; `validarPublicosAoVivo` roda ANTES de preflight/POST (conferido no código); smoke `--listar-publicos` read-only: 11 elegíveis |
| 19.W3.1 | mesma série com régua fria vs quente gera alertas diferentes; circuit-breaker v1 inalterado + gatilho novo acionando exit 3 | ✅ 19/19 PASS (freq 4,5: alerta no frio, ok no quente; saturação por freq e por estagnação; degradação honesta; 4 casos travando o v1); smoke live read-only na campanha `[QUENTE]` real com e sem flag |

Suíte completa do épico re-executada pelo orquestrador no fechamento:
**53/53 PASS** (`node --test scripts/lib/publicos.test.mjs scripts/estruturador-publish.test.mjs scripts/leitor-metricas.test.mjs scripts/circuit-breaker.test.mjs`).

## Gates transversais

- [x] Kit frio v1 retrocompatível byte a byte (plano sem bloco `publico` — teste de deepEqual; leitor/circuit-breaker sem flag = saída v1; auditoria padrão do zelador idêntica ao baseline).
- [x] Nenhuma escrita na conta real durante desenvolvimento/teste (smokes só GET; `--dry-run`/`--criar` não executados ao vivo).
- [x] Espelhos `.claude/` e `.agents/` equivalentes em toda SKILL.md alterada (estruturador, zelador, leitor-de-metricas, diagnosticador — diffs vazios).
- [x] Contagens de público sempre seladas como aproximadas, com fonte e data.
- [x] Evidência sanitizada (sem token; números de campanha/públicos são da conta do projeto, já usados nos artefatos do squad).
- [ ] E2E supervisionado (campanha quente PAUSED real, conferida no gerenciador e apagada) — **exige humano; não executado**.

## Veredito

**PASS_LOCAL — pendente E2E supervisionado.** Os 4 itens do gate de conclusão
do épico: (1) guardrails recusam os 7 casos ✅ · (2) retrocompatibilidade v1 ✅ ·
(3) E2E supervisionado ⏳ pendente (operador na sala) · (4) espelhos idênticos ✅.
O épico só vira `Done` após o item 3 e sign-off humano. Pendência herdada do v1
que continua aberta: `--ativar` nunca validado com verba real.
