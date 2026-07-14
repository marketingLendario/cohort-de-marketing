# STORY-14.W1.3 - CLI read-only de catálogo e diagnóstico

## Status

Done

## Dependências

- 14.W1.1
- 14.W1.2

## Objetivo

Oferecer inspeção e validação do repertório antes de liberar comandos de escrita.

## Critérios de aceite

- [x] Existe `catalog_cli.py` com subcomandos `catalog list`, `catalog show` e
  `catalog validate`.
- [x] `catalog list` filtra por tipo, pack e disponibilidade e informa origem,
  versão e compatibilidade sem revelar path absoluto.
- [x] `catalog show <tipo> <id>` exibe contrato resolvido e dependências.
- [x] `catalog validate <pack>` valida schema, assets, rights, colisões e
  compatibilidade sem modificar o pack.
- [x] Todos os comandos suportam `--json` com schema de saída estável.
- [x] Exit code `0` representa sucesso, `1` bloqueio de validação e `2` erro de
  uso/argumento.
- [x] O `doctor.py` reutiliza o mesmo loader e reporta extension packs quando
  explicitamente informados.
- [x] O frontmatter da skill passa a documentar
  `/ads-creative-factory <entidade> <ação> [opções]` sem criar novas skills.
- [x] A validação do skill catalog continua reconhecendo um único comando
  `/ads-creative-factory`.
- [x] Testes provam que os comandos read-only não alteram mtime, conteúdo ou
  árvore de arquivos do pack.
- [x] Ajuda CLI contém exemplos em português e recuperação para erros comuns.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/catalog_cli.py`
- `.claude/skills/ads-creative-factory/scripts/doctor.py`
- `.claude/skills/ads-creative-factory/SKILL.md`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`
- `data/skill-catalog.json`
- `scripts/validate-skill-catalog.mjs`

## Validação

- Snapshots JSON dos três subcomandos.
- Testes de exit code e prova de ausência de escrita.
- Mirror parity e validação do catálogo de skills.
