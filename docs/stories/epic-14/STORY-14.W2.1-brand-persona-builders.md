# STORY-14.W2.1 - Comandos e builders de brand e persona

## Status

Done

## Dependências

- 14.W1.1
- 14.W1.3

## Objetivo

Entregar caminhos guiados e equivalentes para criar Brand Pack e Persona Pack
sem edição manual de JSON.

## Critérios de aceite

- [x] `brand create` delega ao `build_brand_pack.py` existente, sem implementar
  um segundo contrato ou builder paralelo.
- [x] Existe `build_persona_pack.py` e o subcomando `persona create` usa o mesmo
  loader do runtime para validar o resultado.
- [x] Persona exige nome, papel, descrição, voz, tópicos, guardas, ao menos uma
  foto, rights notice e consent reference.
- [x] Cada foto recebe SHA-256 e permanece associada ao consentimento informado.
- [x] Assets são copiados para diretório temporário e o pack só substitui o
  destino após validação completa.
- [x] O destino padrão fica sob
  `projetos/{slug}/creative-factory/packs/{pack-id}/`.
- [x] Path fora da raiz do projeto, destino não vazio e symlink de escape falham
  fechado.
- [x] `--dry-run` gera somente plano/relatório e não cria o pack.
- [x] `--json` emite resumo sanitizado; `--force` é explícito e auditável.
- [x] Brand e persona geram `pack.json`, `preview.html` e
  `build-report.json` consistentes.
- [x] O builder não presume licença pública nem redistribuição de assets.
- [x] Testes cobrem idempotência, rollback atômico, foto adulterada, ausência de
  consentimento e direitos insuficientes.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/build_brand_pack.py`
- `.claude/skills/ads-creative-factory/scripts/build_persona_pack.py`
- `.claude/skills/ads-creative-factory/scripts/catalog_cli.py`
- `.claude/skills/ads-creative-factory/schemas/persona-pack.v1.schema.json`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Validação

- Build de brand e persona sintéticos em diretório temporário.
- Revalidação dos dois packs por `catalog validate` e `doctor --pack-only`.
- Comparação dos hashes das fotos com o manifesto do Persona Pack.
