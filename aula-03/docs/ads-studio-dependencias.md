# Dependências do Ads Studio

Foi incluído em `aula-03/ads-studio/` um snapshot do Ads Studio para consulta e transporte junto do material da aula.

## Incluído no snapshot

- `src/`: frontend React, rotas, componentes e design system local;
- `server/`: BFF, workers, runner local e orquestração;
- `supabase/`: migrations, configuração e testes de banco versionados;
- `public/`: assets públicos necessários ao app;
- `package.json` e `package-lock.json`: dependências npm fixadas;
- `vite.config.ts`, `tsconfig*.json`, `vercel.json` e demais arquivos de build;
- `.env.example`: documentação de variáveis sem credenciais reais;
- `README.md` e `BOUNDARY.md`: operação e limites de autoridade.

## Não incluído de propósito

- `node_modules/`: reinstalar com `npm install`;
- `dist/` e `dist-ssr/`: artefatos regeneráveis;
- `test-results/`, `.playwright-cli/` e `design-qa-evidence/`: saídas temporárias ou evidências geradas;
- `.env` e `.env.local`: segredos e configuração local.

## Fonte canônica e dependências externas

O snapshot é uma cópia didática. A fonte canônica do runtime continua em [`apps/academia-lendaria-ads-studio/`](../../apps/academia-lendaria-ads-studio/). O app também reutiliza:

- skills em `.claude/skills/` e `.agents/skills/`;
- adapter Meta em `services/meta-ads/`;
- Node.js 22;
- npm;
- Supabase local para os fluxos que usam persistência;
- Codex CLI local para execução das skills;
- credenciais locais fora do repositório.

Não edite o snapshot e o app canônico em paralelo esperando sincronização automática. Quando houver mudança de runtime, atualize a fonte canônica e regenere o snapshot da Aula 3.
