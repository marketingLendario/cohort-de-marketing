# STORY-11.W3.1 - Gate final 31/31

## Status

Done

## Critérios de aceite

- [x] `comecar` possui jornada nativa equivalente ao CLI.
- [x] `status-funil` reconcilia Book, banco, filesystem e próximo comando.
- [x] As 31 skills estão em `full_e2e` na matriz.
- [x] Cada skill roda em fixture isolada pelo painel e diretamente pelo CLI.
- [x] Outputs, hashes e decisões humanas são comparados entre superfícies.
- [x] Reload, retry, cancelamento e restart são exercitados por família.
- [x] Evidência não contém credencial, PII, path absoluto ou conteúdo privado.
- [x] Gate registra blockers concretos; não aceita aprovação narrativa.

## Evidência incremental

- `status-funil`: resultado efêmero read-only no painel e CLI, Perfil do Projeto, mapa `← PRÓXIMO`, pendências por chave e hashes das três superfícies.
- E2E: `apps/academia-lendaria-ads-studio/e2e/epic-11-setup-status-parity.mjs`.
- Evidência: `apps/academia-lendaria-ads-studio/design-qa-evidence/epic-11/setup-status-parity/evidence.json` e screenshots desktop/mobile.
- `/comecar`: probes compartilhados, Git conservador, configuração protegida de Apify e recuperação com consentimento comprovados no painel e CLI.
- Matriz final: 31 `full_e2e`, 0 `partial`, 0 `proposal_only` em `data/skill-execution-matrix.json`.
- Regressão: 543 testes Vitest aprovados, 78 testes Python da Creative Factory, 67 pgTAP e 9 testes do launcher.
- E2E real: Creative Factory, Squad de Tráfego, onboarding, projeto persistente, setup/status e contrato 31/31 passaram.
- Privacy gate: 27 arquivos finais aprovados, sem segredo, e-mail, path absoluto ou chave privada.
- Bloqueio remanescente de release pública: autorização de redistribuição da Creative Factory, fora do aceite funcional desta story.
