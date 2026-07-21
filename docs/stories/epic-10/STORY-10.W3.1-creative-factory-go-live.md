# STORY-10.W3.1 - E2E e gate de go-live da Creative Factory

## Status

Done

## Critérios de aceite

- [x] Lote real executado via Codex CLI `image_gen`, sem API key externa.
- [x] Ao menos um criativo de três arquétipos e dois formatos é produzido.
- [x] Caption e link description acompanham cada peça até o pacote final.
- [x] Gate visual bloqueia item reprovado e aprovação parcial funciona.
- [x] Cancelamento e retry são exercitados sem processo órfão.
- [x] Reload, novo BrowserContext e restart preservam o lote.
- [x] Evidência contém hashes e dimensões, mas não segredo, PII ou path absoluto.
- [x] Vitest, testes Python, pgTAP, lint, typecheck e builds passam.
- [x] Playwright desktop/mobile e inspeção visual passam.
- [x] Gate final registra `SHIP_LOCAL / NO_SHIP_PUBLIC` com blockers concretos.
