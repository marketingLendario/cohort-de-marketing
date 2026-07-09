# Story - Migrar Ads Factory para o Cohort de Marketing

## Status

Done em 2026-07-09.

## Contexto

O painel visual Ads Factory/Ads Studio estava no `sinkra-hub` e era referenciado
por este repo apenas como fonte visual. A decisão desta story é trazer o produto
para o `cohort-de-marketing` para que o desenvolvimento continue daqui.

## Critérios de aceite

- [x] App importada para `apps/academia-lendaria-ads-studio/`.
- [x] Mock visual canônico importado para `docs/design/mocks/academia-lendaria-ads-studio/`.
- [x] Dependências `workspace:*` do `sinkra-hub` removidas do `package.json`.
- [x] DS Lendária, unit economics e runtime stubs portados para módulos locais.
- [x] Typecheck, build, testes e lint executados sem erro.
- [x] Dev server local validado por HTTP.
- [x] Modo demo local adicionado para testar sem Supabase.

## Comandos de validação

```bash
npm --prefix apps/academia-lendaria-ads-studio install
npm --prefix apps/academia-lendaria-ads-studio run typecheck
npm --prefix apps/academia-lendaria-ads-studio run build
npm --prefix apps/academia-lendaria-ads-studio test
npm --prefix apps/academia-lendaria-ads-studio run lint
npm --prefix apps/academia-lendaria-ads-studio run dev -- --host 127.0.0.1 --port 5177 --strictPort
```

## Resultado

O painel roda localmente em:

```text
http://127.0.0.1:5177/
```

O `.env.local` foi criado localmente a partir de `.env.example` e é ignorado pelo
Git.

Credenciais do modo demo local:

```text
demo@academialendaria.local / adsfactory
```

## Lista de arquivos principais

- `apps/academia-lendaria-ads-studio/`
- `docs/design/mocks/academia-lendaria-ads-studio/`
- `apps/academia-lendaria-ads-studio/src/lib/lendaria-ds/`
- `apps/academia-lendaria-ads-studio/src/lib/ads-economics.ts`
- `apps/academia-lendaria-ads-studio/server/lib/ads-economics.ts`
- `apps/academia-lendaria-ads-studio/server/lib/job-runtime/`
- `apps/academia-lendaria-ads-studio/server/lib/job-stream/`
- `apps/academia-lendaria-ads-studio/server/lib/agent-host/`
