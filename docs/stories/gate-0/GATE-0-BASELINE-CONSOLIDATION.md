# GATE-0 - Consolidação do baseline público e privado

## Status

Conditional Pass local em 2026-07-14. As baselines integradas existem em
worktrees isoladas e passaram os gates locais aplicáveis. Push, PR e merge
continuam pendentes do handoff DevOps; waves posteriores estão autorizadas
somente contra os SHAs locais registrados em `GATE-0-EVIDENCE.md`.

## Objetivo

Garantir que as branches principais representem tudo que já foi implementado
antes de iniciar novas features. O gate não reimplementa planos encerrados.

## Baseline observado em 2026-07-14

| Superfície | Estado observado |
|---|---|
| Público local | `main` em `d831ea3`, três commits atrás de `origin/main` |
| Público remoto | `origin/main` em `9128da6`, com Epics 14/15 |
| Meta read-only | branch `advisor/004-enforce-meta-read-only-boundary` em `e66e6cb`, sem PR aberto |
| Privado local | `main` em `44b8548`, um commit à frente e três atrás do remoto |
| Privado remoto | `origin/main` em `90a4897`, catálogo dinâmico e release 2.2.1 |
| Hardening privado | PR #6 aberto; quality gate bloqueado conforme `plans/README.md` privado |

Todos os refs devem ser atualizados no início da execução. Drift não autoriza
reset destrutivo nem descarte de mudanças locais.

## Work items

### G0.1 - Consolidar o público

- [x] Criar worktree/branch segura a partir do remoto aprovado.
- [x] Confirmar Epics 14/15 e release 2.2.1 no baseline.
- [x] Preservar `plans/` e qualquer mudança não rastreada do operador.

### G0.2 - Integrar o boundary Meta read-only

- [x] Revalidar consumidores antes de remover pass-through.
- [x] Rebasear o Plan 004 no baseline atualizado.
- [x] Rodar testes do adapter, catálogo e documentação.
- [ ] Abrir PR somente sob autoridade DevOps.

### G0.3 - Reconciliar o privado

- [x] Combinar Story 16 local com catálogo dinâmico e 2.2.1 remotos sem perder commits.
- [x] Confirmar que os estados dos Epics 8-16 continuam coerentes.
- [x] Não duplicar trabalho coberto pelo PR #6.

### G0.4 - Fechar o hardening

- [x] Atualizar a base do PR #6 em branch local e revalidar localmente os planos 001, 002, 003 e 005.
- [ ] Resolver o blocker de billing ou separar o gate CI do código já validado.
- [x] Registrar decisão explícita: código com PASS local; publicação bloqueada até DevOps e CI remoto executável.

### G0.5 - Baseline integrado

- [ ] Mains remotas pública e privada contêm todas as entregas aprovadas.
- [ ] Nenhuma correção P1 existe somente em branch local.
- [x] Catálogo, mirrors, manifests, lint, typecheck e testes aplicáveis passam localmente.
- [x] Estado local, exceção e SHAs são registrados em `gate-0-state.json` e `GATE-0-EVIDENCE.md`.

## Stop conditions

- Worktree sujo sem rota não destrutiva de preservação.
- Novo PR cobrindo integralmente um item planejado.
- Divergência de contrato entre skill pública e Studio privado.
- Teste indica perda de capacidade já aprovada.
- Operação exige push, merge ou mudança de billing sem autoridade correspondente.

## Gate de saída

Exceção escrita: `PUB-16`, `APP-17`, `APP-18`, `PUB-17` e `APP-19` podem executar
localmente sobre os SHAs integrados registrados. Nenhuma wave pode publicar,
abrir PR, mergear ou declarar release concluída antes de G0.5 remoto.
