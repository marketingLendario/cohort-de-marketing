# server/ — BFF (esqueleto)

Placeholder do Backend-for-Frontend desta app. **Sem lógica de negócio** nesta
story (STORY-AL-ADS-0c.1) — apenas o esqueleto e um health-check.

## Papel arquitetural

- **Boundary:** ONLINE (host público). Nunca executa skills nem guarda secrets
  (Boundary Axiom — Constitution Art. VII; `.claude/rules/devops-escalation-ceiling.md`).
- **Função futura:** orquestrar as skills LOCAL do Hub e o adapter
  `services/meta-ads` via um router tRPC. Ver `../BOUNDARY.md`.

## Roadmap

| Story | Entrega |
|-------|---------|
| STORY-AL-ADS-1.3 | Camada de orquestração real do BFF (tRPC router + adapter HTTP) |
| STORY-AL-ADS-1.5 | Contratos de entrada/saída das skills orquestradas |
| STORY-AL-ADS-1.6 | Handoff para `services/meta-ads` + verificação de deploy |

> NÃO implementar orquestração aqui antes da story 1.3.
