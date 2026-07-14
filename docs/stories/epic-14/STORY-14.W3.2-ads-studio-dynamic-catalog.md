# STORY-14.W3.2 - Catálogo dinâmico no Ads Studio

## Status

Draft

## Dependências

- 14.W3.1
- Contrato público `2.2.0` disponível para consumo pelo repositório privado do Ads Studio.

## Entry gate

Esta story pertence ao repositório privado dedicado do Ads Studio. O app não deve
ser reintroduzido no repositório público do Cohort. A implementação deve partir de
branch limpa do repositório privado e consumir o contrato público versionado.

## Objetivo

Substituir listas e enums fixos do painel pelo catálogo resolvido no backend,
preservando o mesmo contrato, hash e regras do CLI.

## Critérios de aceite

- [ ] O backend expõe endpoint local autenticado para listar o catálogo resolvido
  do projeto, sem devolver path absoluto ou asset privado.
- [ ] A validação de request usa ID seguro mais lookup no catálogo, em vez de enum
  estático de seis arquétipos ou personas conhecidas.
- [ ] A UI lista entidade, pack, versão, compatibilidade e estado bloqueado com
  motivo acionável.
- [ ] O operador consegue criar/validar packs pelos mesmos comandos do CLI; o
  painel não implementa um segundo builder.
- [ ] Seleções persistem IDs namespaced, versões e `catalog_hash`.
- [ ] Mudança de catálogo após criação do lote exige nova versão, não mutação do
  lote em andamento.
- [ ] Consentimento e autorização de likeness continuam obrigatórios e visíveis.
- [ ] Reload, novo BrowserContext e restart preservam pack e seleções.
- [ ] Estados de loading, vazio, pack inválido, incompatibilidade e retry possuem
  tratamento acessível por teclado e leitor de tela.
- [ ] Testes de contrato provam que CLI e painel resolvem o mesmo JSON canônico e
  o mesmo hash.
- [ ] Playwright cobre desktop e mobile sem overflow, request failure ou erro de
  console.

## Ownership no repositório privado

- `apps/academia-lendaria-ads-studio/server/creative-factory/**`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/src/components/creative-factory/**`
- `apps/academia-lendaria-ads-studio/src/lib/creative-factory-runtime.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-domain.ts`
- `apps/academia-lendaria-ads-studio/e2e/**`

## Validação

- Contract test CLI versus endpoint.
- Testes unitários de estados e compatibilidades.
- Playwright desktop/mobile com reload e restart.
- Prova de que nenhum source, fixture ou asset privado do app voltou ao repositório público.
