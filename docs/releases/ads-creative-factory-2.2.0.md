# Ads Creative Factory 2.2.0

## Release

A versão 2.2.0 introduz extensibilidade governada para marcas, personas,
mecanismos de copy, cenas UGC, variações, referências, perfis de gate e
arquétipos declarativos. O catálogo resolvido é determinístico e identificado
por `catalog_hash`; nenhum Extension Pack é carregado implicitamente.

## Comandos públicos

O comando `/ads-creative-factory` expõe operações de leitura (`catalog list`,
`catalog show`, `catalog validate`) e autoria confinada ao projeto (`brand
build`, `persona build`, `pack build`, `pack install` e os comandos `add`).
Todos os comandos de escrita aceitam `--dry-run`.

## Runtime e compatibilidade

- campanhas podem declarar `extension_packs` relativos ao diretório do projeto;
- `catalog_hash_expected` bloqueia execução ou retry quando o catálogo mudou;
- IDs de extensões usam namespace e não podem sobrescrever built-ins;
- renderer modes permanecem em uma allow-list fechada;
- o campo legado `mechanism` continua aceito e é adaptado para um mecanismo
  built-in compatível quando necessário;
- packs inválidos, paths fora do projeto, rights ausentes e consentimento
  inválido falham antes da geração.

## Ads Studio

O Ads Studio privado passa a consultar o mesmo catálogo da CLI, persiste o hash
e as versões dos packs no job e no manifesto, e renderiza arquétipos dinâmicos
sem transformar IDs novos em enums no frontend. Publicação de anúncio continua
exclusivamente humana.

## Migração

Campanhas 2.1.1 sem `extension_packs` continuam usando somente o catálogo
built-in. Para ativar extensões, valide e instale o pack explicitamente, grave a
referência relativa no projeto e preserve o `catalog_hash` retornado para a
execução e retries.

## Segurança e distribuição

O release público contém apenas os arquivos enumerados em
`source-manifest.json`. O manifesto é regenerado por
`scripts/generate-ads-creative-factory-manifest.mjs`, com hashes SHA-256,
proveniência e licença por arquivo. Packs de clientes, imagens, outputs, caches,
segredos e fixtures privadas não fazem parte da distribuição.
