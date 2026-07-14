# EPIC-14 - Plano de evidências

## Status

Done

## Regra de evidência

Nenhuma story pode ser marcada como `Done` apenas por inspeção narrativa. Cada
critério precisa apontar para teste automatizado, fixture versionada, manifesto
sanitizado ou evidência operacional reproduzível. Evidência nunca contém segredo,
PII, path absoluto ou asset privado.

## Matriz mínima

| Story | Evidência obrigatória |
|---|---|
| 14.W1.1 | fixtures válidas e inválidas para todos os schemas |
| 14.W1.2 | resolução determinística, hash estável e testes de colisão |
| 14.W1.3 | snapshots JSON, exit codes e prova read-only |
| 14.W2.1 | packs de brand/persona sintéticos, relatório e consent gate |
| 14.W2.2 | pack sintético com mecanismo, UGC, variação, referência e gate profile |
| 14.W2.3 | preset válido e rejeição de renderer mode desconhecido |
| 14.W3.1 | lote fake determinístico e lote real sanitizado |
| 14.W3.2 | CLI/painel com mesmo catálogo e mesmo hash após reload |
| 14.W3.3 | testes completos, mirror parity, release manifest e auditoria de assets |

## Gates transversais

- [x] `git diff --check` sem erro.
- [x] Schemas rejeitam additional properties não previstas.
- [x] Paths absolutos, `..`, symlinks de escape e arquivos ausentes falham fechado.
- [x] IDs duplicados ou tentativa de override de built-in falham fechado.
- [x] Packs sem rights/provenance aplicáveis falham fechado.
- [x] Persona com likeness sem foto, hash e consentimento falha fechado.
- [x] Comandos de escrita passam por `--dry-run` antes da materialização.
- [x] Nenhum comando escreve fora de `projetos/{slug}/creative-factory/`.
- [x] `OPENAI_API_KEY` e `CODEX_API_KEY` não são exigidas nem herdadas.
- [x] `.claude/skills/ads-creative-factory/` e `.agents/skills/ads-creative-factory/` são idênticos.
- [x] `source-manifest.json` cobre exatamente a allow-list pública.
- [x] Nenhum pack de cliente, imagem gerada, cache ou output entra no release.
- [x] Revisão humana continua obrigatória antes da promoção do lote.

## Gate operacional final

1. Criar um Extension Pack sintético apenas por comandos públicos, incluindo
   build e instalação explícita no projeto.
2. Validar e instalar o pack em projeto temporário.
3. Rodar campanha com ao menos um mecanismo novo, uma cena UGC nova e um
   arquétipo declarativo sobre renderer existente.
4. Comparar o hash do catálogo resolvido no CLI e no painel.
5. Exercitar reload, retry e nova versão sem sobrescrever versão aprovada.
6. Confirmar que o pacote final contém somente itens aprovados e diagnósticos
   sanitizados.

## Execução final

| Gate | Resultado |
|---|---|
| Skill pública | 24 testes Python aprovados; validação estrutural da skill e catálogo com 31 skills/41 edges aprovadas |
| Skill no Ads Studio | 122 testes Python aprovados; mirrors byte a byte idênticos |
| Ads Studio | typecheck, lint, 555 testes JS/TS, build web e build server aprovados em Node 22 |
| Contrato CLI/painel | endpoint autenticado e teste de paridade sobre o mesmo `catalog_hash` aprovados |
| Playwright | desktop 1440×1000 e mobile 390×844 aprovados, incluindo persistência entre BrowserContexts |
| Smoke real | três arquétipos e dois formatos via Codex local; mecanismo, cena UGC, arquétipo e gate profile namespaced rastreados |
| Release | `source-manifest.json` com 46 arquivos allowlisted, hashes verificados e mirrors idênticos |

O manifesto sanitizado do smoke está em `live-smoke-2.2.0.json`. O gate aprovou
somente `proof-live-epic14-editorial-0`; as peças `light_clean` e `ugc_native`
permaneceram bloqueadas para promoção. Nenhum output de imagem, path absoluto,
segredo, PII ou asset de cliente foi incorporado ao release público.

## Decisão

**PASS para release 2.2.0.** Blockers residuais: nenhum. A publicação de
anúncios e a aprovação visual final continuam humanas.
