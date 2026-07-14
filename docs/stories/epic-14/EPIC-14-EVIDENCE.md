# EPIC-14 - Plano de evidências

## Status

Not started

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

- [ ] `git diff --check` sem erro.
- [ ] Schemas rejeitam additional properties não previstas.
- [ ] Paths absolutos, `..`, symlinks de escape e arquivos ausentes falham fechado.
- [ ] IDs duplicados ou tentativa de override de built-in falham fechado.
- [ ] Packs sem rights/provenance aplicáveis falham fechado.
- [ ] Persona com likeness sem foto, hash e consentimento falha fechado.
- [ ] Comandos de escrita passam por `--dry-run` antes da materialização.
- [ ] Nenhum comando escreve fora de `projetos/{slug}/creative-factory/`.
- [ ] `OPENAI_API_KEY` e `CODEX_API_KEY` não são exigidas nem herdadas.
- [ ] `.claude/skills/ads-creative-factory/` e `.agents/skills/ads-creative-factory/` são idênticos.
- [ ] `source-manifest.json` cobre exatamente a allow-list pública.
- [ ] Nenhum pack de cliente, imagem gerada, cache ou output entra no release.
- [ ] Revisão humana continua obrigatória antes da promoção do lote.

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
