# Gate 0 - Evidência de execução local

## Veredito

`CONDITIONAL_PASS_LOCAL` em 2026-07-14. O código pode avançar em waves locais
isoladas; publicação permanece bloqueada até handoff DevOps e CI remoto executável.

## Baselines integradas

| Repositório | Branch local | SHA | Conteúdo integrado |
|---|---|---|---|
| Público | `wave/gate-0/public-baseline` | `1cd9232` | `origin/main` `9128da6` + Plan 004 Meta read-only |
| Privado | `wave/gate-0/private-baseline` | `4c4f865` | `origin/main` `90a4897` + Story 16 + commits dos Plans 001/002/003/005/006 |

As checkouts `main` originais e seus arquivos não rastreados foram preservados.

## Evidência pública

- Meta adapter: 14 testes, 14 PASS.
- Skill catalog: 31 skills, 41 edges, mirror canônico verificado.
- ProjectBrief rules: 120 campos, 31 skills, PASS.
- Mapa wiring: 69/69 `sampleUrl`, PASS.
- Preview real em Playwright: canvas `810x1138`, zero `pageerror`, PASS.
- `verify-skill-contracts.mjs` não é gate de checkout limpo: ele exige um projeto
  de aluno já inicializado e reportou corretamente os artefatos operacionais ausentes.

## Evidência privada

- Catalog validate: 31 skills, 41 edges, 31 full-parity, PASS.
- Typecheck: PASS.
- ESLint: PASS.
- Vitest: 76 arquivos PASS, 2 skipped; 595 testes PASS, 5 skipped.
- Creative Factory Python: 123 testes PASS.
- Frontend build: PASS.
- Server build: PASS.
- Launcher e demo local: 13 testes PASS.
- Worktree permaneceu clean após geração e validações.

## Bloqueios remotos

- PR privado #6 permanece aberto e `UNSTABLE`.
- O run do GitHub Actions encerrou os dois jobs antes de qualquer step; não há
  log de teste remoto. Isso não é convertido em PASS narrativo.
- Push, abertura/atualização de PR, merge e release exigem `@devops`.

## Exceção de saída

As epics posteriores podem usar exclusivamente os SHAs desta evidência como
base local. O fan-in final deve gerar handoff e não pode publicar ou declarar
release concluída enquanto os bloqueios remotos acima existirem.
