# EPIC-19 - Estruturador v2: públicos mornos/quentes + matriz de funil

## Status

Ready. Materializado de `plans/estruturador-funil-publicos-v2.md` (viabilidade
validada ao vivo em 2026-07-15: 331 públicos lidos da conta real, read-only).
Execução autorizada pelo operador em 2026-07-15.

## Problema

O Estruturador v1 só monta o "default sagrado" — público amplo/frio +
Advantage+ com no máximo 1 interesse. O targeting gerado é apenas
`targeting_automation: {advantage_audience: 1}` + `flexible_spec` de 1
interesse. Não existe `custom_audiences`, exclusões nem leitura de
`/act_X/customaudiences`. Também não há escolha de funil: a lógica "qual funil
para qual público" mora em `metodo-funil` (níveis de consciência 1–5) e não
está integrada. A conta real tem 331 públicos (engajamento, listas, site)
inutilizados pelo squad.

## Objetivo

Estender o squad de tráfego com kits **morno** e **quente** (retargeting com
públicos existentes na conta) e com a matriz funil×temperatura derivada do
`metodo-funil` — por allowlist, sem afrouxar nenhum guardrail do kit frio v1.

## Arquitetura

```text
zelador --publicos (read-only)          matriz funil×temperatura (SKILL.md)
        |  elegibilidade compartilhada em scripts/lib/publicos.mjs
        v
estruturador-publish.mjs v2  --  bloco "publico" no campanha.json
        |  targeting: custom_audiences + exclusões + advantage_audience: 0
        v
PAINEL-DA-SEMANA.yaml (publico_tipo)  ->  réguas por temperatura
        (leitor-metricas · circuit-breaker saturação · alavanca diagnosticador)
```

## Escopo

- Auditoria read-only de públicos no Zelador (`--publicos`) + lib compartilhada.
- Matriz funil×temperatura na SKILL.md do Estruturador (+ handoff `metodo-funil`).
- `estruturador-publish.mjs` v2: schema `publico`, guardrails novos,
  validação ao vivo de cada público, `--listar-publicos`.
- Réguas por temperatura no Leitor, gatilho de saturação no circuit-breaker,
  alavanca nova no Diagnosticador.
- Espelhos `.agents/` sincronizados byte a byte para toda SKILL.md alterada.

## Fora de escopo

- Criação de públicos via API (Fase E do plano — v2.1 opcional).
- Lookalike e upload de listas de clientes (LGPD/hashing — decisão de produto).
- Exclusão de públicos quentes do kit frio (limitação conhecida, Aula 4).
- Ativação de campanha (`--ativar`) — pendência herdada do v1, validação
  supervisionada com verba real fora deste epic.
- Qualquer escrita na conta real durante o desenvolvimento (E2E PAUSED
  supervisionado é gate de conclusão, não task de story).

## Ondas e stories

| Onda | Story | Entrega | Dependências |
|---|---|---|---|
| W1 | 19.W1.1 | Zelador `--publicos` + `scripts/lib/publicos.mjs` | — |
| W1 | 19.W1.2 | Matriz funil×temperatura na SKILL.md do Estruturador | — |
| W2 | 19.W2.1 | `estruturador-publish.mjs` v2 (schema `publico` + guardrails) | 19.W1.1, 19.W1.2 |
| W3 | 19.W3.1 | Réguas por temperatura (leitor + circuit-breaker + diagnosticador) | 19.W2.1 |

Partição de arquivos por onda: W1.1 (scripts/lib, zelador) e W1.2 (SKILL.md do
estruturador + espelho) não se sobrepõem — paralelizáveis.

## Gate de conclusão

A epic só pode ficar `Done` quando:

1. Todos os guardrails novos recusarem os casos de fixture (público inexistente,
   op ≠ 200, bound oculto, quente sem exclusão, frio com custom_audiences,
   interesse+retargeting, teto R$100).
2. `campanha.json` v1 (sem bloco `publico`) produzir comportamento byte a byte
   idêntico ao v1 (retrocompatibilidade).
3. **E2E supervisionado pelo operador**: campanha quente criada PAUSED na conta
   real com público elegível, targeting conferido no gerenciador
   (`advantage_audience: 0`, exclusões aplicadas) e apagada em seguida.
4. Espelhos `.claude/` e `.agents/` idênticos para toda SKILL.md alterada.

O item 3 exige humano na sala — nunca é executado autonomamente.
