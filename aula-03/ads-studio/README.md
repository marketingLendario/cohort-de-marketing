# Academia Lendária Ads Studio

Aplicação web do **Academia Lendária Ads Studio** — base implantável onde o
restante do produto de mídia paga da Academia Lendária será construído.

- **Pacote:** `academia-lendaria-ads-studio` (`private: true`)
- **Origem:** portado de `sinkra-hub/apps/academia-lendaria-ads-studio`
- **Boundary:** ONLINE (deploy alvo Vercel) — ver [`BOUNDARY.md`](./BOUNDARY.md)
- **Status neste repo:** app local autônoma; dependências internas do `sinkra-hub`
  foram portadas para `src/lib` e `server/lib`.

## Stack

REUSA a stack canônica de `apps/web` (arch §2.3 — IDS REUSE):

| Camada | Tecnologia |
|--------|------------|
| UI | React 19 |
| Bundler/dev | Vite |
| Roteamento | TanStack Router (file-based, autoCodeSplitting) |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Tema | `next-themes` (dark-first, `light` obrigatório) |
| Design System | DS Lendária local em `src/lib/lendaria-ds` |

> NÃO usa Next.js App Router. NÃO depende de pacotes `@sinkra/*` do monorepo.

## Como rodar

A app tem dependências próprias. A partir da raiz deste repo:

```bash
# instalar deps da app (uma vez)
npm --prefix apps/academia-lendaria-ads-studio install

# dev server (Vite)
npm --prefix apps/academia-lendaria-ads-studio run dev
```

O painel também pode ser aberto a partir deste repo sem entrar no `sinkra-hub`.
As variáveis de Supabase continuam em `apps/academia-lendaria-ads-studio/.env`
ou `.env.local`.

### Login demo local

Para testar sem Supabase local, deixe `VITE_DEMO_AUTH=true` em `.env.local` e use:

```text
E-mail: demo@academialendaria.local
Senha: adsfactory
```

### Executar uma skill pelo CLI local

O CLI usa o mesmo BFF, journal, Codex autenticado e saga de aprovação do painel. As credenciais e o token local entram apenas por variáveis de ambiente; não use chave da OpenAI.

```bash
npm run skill:cli -- --skill pagina-vendas-funil --input entrada.json --output proposta.json

# Depois de revisar proposta.json:
npm run skill:cli -- --approve-run <skill-run-id> --proposal proposta.json --output aprovacao.json

# Repetir um run reprovado sem criar outro pointer:
npm run skill:cli -- --retry-run <skill-run-id> --job <job-id> --workspace <workspace-id> --output proposta-retry.json

# Consultar ou cancelar o mesmo job durável:
npm run skill:cli -- --run-status <job-id>
npm run skill:cli -- --cancel-run <skill-run-id> --job <job-id> --workspace <workspace-id>

# Rejeitar uma proposta pela mesma saga do painel:
npm run skill:cli -- --reject-run <skill-run-id> --proposal proposta.json

# Utilities efêmeras, sem criar artefato:
npm run skill:cli -- --setup
npm run skill:cli -- --status <project-id>
```

O primeiro comando termina com código `3` quando há decisões pendentes. Responda-as em uma nova entrada com `elicitationParentRunId`; o checkpoint anterior será supersedido pela RPC tenant-safe.

```bash
# build de produção
npm --prefix apps/academia-lendaria-ads-studio run build

# typecheck + lint
npm --prefix apps/academia-lendaria-ads-studio run typecheck
npm --prefix apps/academia-lendaria-ads-studio run lint
```

### Origem visual

O mock canônico importado fica em:

```text
docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html
```

O DS local foi copiado a partir do mesmo pacote usado pelo mock, para manter
radius 2/4/6px, hairlines e a estética editorial flat.

### Health-check / canary

- Rota `/healthz` → renderiza o payload de status (`status: "ok"`) como JSON.
- Rota `/` (Home) → exibe o mesmo contrato de status visualmente.
- Fonte única: `src/lib/canary.ts` (paridade CLI-First).

## Estrutura

```
apps/academia-lendaria-ads-studio/
├── src/                 # frontend React 19
│   ├── routes/          # rotas file-based (TanStack Router): /, /healthz
│   └── lib/canary.ts    # contrato de status (canary/health)
├── server/              # BFF e orquestração stub/local
├── BOUNDARY.md          # classificação ONLINE + skills LOCAL orquestradas
├── vite.config.ts       # alias @/ → ./src; plugins React/Tailwind/Router
├── tsconfig*.json       # TS strict
└── vercel.json          # config de deploy Vercel
```

## Referências

- Origem: `/Users/rafaelcosta/Projects/AIOX/sinkra-hub/apps/academia-lendaria-ads-studio`
- Mock visual: `docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`
- Boundary detalhado: [`BOUNDARY.md`](./BOUNDARY.md)
