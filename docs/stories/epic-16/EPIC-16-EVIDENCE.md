# EPIC-16 - Plano de evidências

## Status

PASS. W1/W2 estão integradas e o gate W3.1 foi aprovado localmente pelo
quality gate independente de arquitetura.

## Matriz

| Story | Evidência obrigatória |
|---|---|
| 16.W1.1 | fixtures v0.1/v1 válidas e inválidas, round-trip e diff semântico |
| 16.W1.2 | smoke de import/export, reload e recuperação de arquivo inválido |
| 16.W2.1 | fixtures de índices, hashes e rejeição de traversal/symlink |
| 16.W2.2 | catálogo de 31 skills renderizado nas duas cópias distribuídas |
| 16.W2.3 | golden matrix de estados e próxima skill por perfil |
| 16.W3.1 | checkout limpo, validators, browser smoke e scan de privacidade |

## Gates transversais

- [x] Sem capability loss do briefing e mapa atuais.
- [x] ProjectBrief v1 é a única fonte persistente dos dados de briefing; ArtifactIndex permanece um contrato separado.
- [x] Configuração mutável fica em JSON/YAML validado, não hardcoded.
- [x] Mirrors canônico e Codex permanecem equivalentes quando alterados.
- [x] Evidência sanitizada, reproduzível e sem dados de cliente.
- [x] Sign-offs de Product Owner, Architect e QA registrados.

## Veredito

PASS. QA executor aprovou o gate técnico; Architect aprovou o quality gate com
`98/100`, confiança alta e zero findings no HEAD `dfbdf10`. Os registros PO/QA
são evidências de fases sequenciais do SDC, não identidades humanas adicionais.

Evidência detalhada: `docs/stories/epic-16/evidence/STORY-16.W3.1.md`.
