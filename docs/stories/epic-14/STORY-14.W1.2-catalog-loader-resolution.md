# STORY-14.W1.2 - Loader e resolução determinística do catálogo

## Status

Draft

## Dependências

- 14.W1.1

## Objetivo

Resolver built-ins e packs externos explicitamente selecionados em um catálogo
imutável, reproduzível e rastreável.

## Critérios de aceite

- [ ] Existe `catalog_loader.py` separado do loader estrutural de packs.
- [ ] O loader recebe uma lista explícita de packs; não varre projetos ou pastas
  globais automaticamente.
- [ ] Built-ins são carregados como namespace reservado e não podem ser
  sobrescritos por packs externos.
- [ ] IDs duplicados dentro ou entre packs falham fechado com origem dos dois
  registros na mensagem.
- [ ] A ordem de resolução independe da ordem do filesystem.
- [ ] O catálogo resolvido é imutável e não vaza cache entre campanhas.
- [ ] O resultado registra pack ID, versão, origem sanitizada e versão mínima da
  factory.
- [ ] Um hash canônico é calculado sobre representação ordenada e permanece
  estável entre processos, CLI e painel.
- [ ] Compatibilidades entre arquétipo, mecanismo, persona, formato, gate profile
  e renderer mode são validadas antes da geração.
- [ ] O loader expõe consultas tipadas por entidade e uma visão completa para
  diagnóstico.
- [ ] Erros são acionáveis e não incluem path absoluto no payload público.
- [ ] Testes cobrem determinismo, colisão, override, versão incompatível,
  referência quebrada e isolamento entre duas campanhas.

## Ownership

- `.claude/skills/ads-creative-factory/scripts/catalog_loader.py`
- `.claude/skills/ads-creative-factory/scripts/pack_loader.py`
- `.claude/skills/ads-creative-factory/data/**`
- `.claude/skills/ads-creative-factory/scripts/__tests__/**`
- `.agents/skills/ads-creative-factory/**`

## Validação

- Duas resoluções equivalentes produzem o mesmo JSON canônico e hash.
- Troca de uma entidade ou versão altera o hash.
- Campanhas concorrentes com packs diferentes não compartilham estado.
