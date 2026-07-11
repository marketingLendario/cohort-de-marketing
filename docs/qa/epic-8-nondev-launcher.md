# Epic 8 - Launcher e readiness para não devs

## Escopo validado

A Story 8.W3.3 entrega uma entrada única para o Marketing Studio:

```bash
node scripts/marketing-studio.mjs start
```

O comando carrega o `.env` opcional, valida Node, npm, Codex CLI autenticado,
filesystem, portas, Supabase, migrations e navegador; instala dependências; sobe
BFF e frontend em loopback; e abre a interface. A execução de skills continua
usando `codex exec --ephemeral --sandbox read-only`, sem chave da API OpenAI.

## Segurança e ownership

- `codex login status` roda com `OPENAI_API_KEY` e `CODEX_API_KEY` removidas.
- O caminho validado do Codex é repassado ao BFF por `CODEX_CLI_PATH`.
- O boundary token é efêmero, não é gravado em state/readiness e não chega ao browser.
- O endpoint público expõe somente a projeção allowlisted e redigida do diagnóstico.
- PIDs são encerrados apenas quando o comando contém a raiz desta worktree e o marcador esperado.
- No Windows, `taskkill /T` encerra a árvore; em POSIX, o grupo destacado recebe TERM/KILL.
- Ownership do Supabase não é herdado de state stale: somente a sessão que chamou `start` pode pará-lo.
- Falha de `supabase stop` conserva o state para retry; `projetos/` nunca é removido.

## Jornada E2E

`apps/academia-lendaria-ads-studio/e2e/story-8-w3-3.mjs` executou em `5188/3308`:

1. removeu `node_modules` e deixou o launcher reinstalar por `npm ci`;
2. injetou state stale e confirmou que ownership antigo não foi herdado;
3. iniciou com `OPENAI_API_KEY`/`CODEX_API_KEY` vazias e Codex autenticado via ChatGPT;
4. validou readiness sanitizado pelo proxy/BFF;
5. autenticou usuário real no Supabase e abriu um projeto persistido;
6. inspecionou o painel em desktop `1440x1000` e mobile `390x844`;
7. confirmou `status`, start idempotente e ausência de erros de console;
8. preservou uma pasta-sentinela em `projetos/` após shutdown;
9. reiniciou sem instalar e restaurou o estado inicial do Supabase ao encerrar.

Resultado: **PASS**. Os serviços existentes em `5177/3002` não foram tocados.

## Gates

| Gate | Resultado |
|---|---|
| Launcher unitário | 8/8 PASS |
| Readiness BFF/UI focado | 10/10 PASS |
| Suíte Vitest | 32 arquivos / 263 testes PASS |
| ESLint | PASS |
| TypeScript client/server | PASS |
| Build client/server | PASS |
| DB lint | sem erros |
| pgTAP | 43/43 PASS |
| E2E clean install/restart | PASS |

## Evidência visual

- Desktop: `/tmp/story-8-w3-3-evidence/readiness-desktop.png`
- Mobile: `/tmp/story-8-w3-3-evidence/readiness-mobile.png`
- O painel cabe integralmente na viewport mobile, usa os tokens existentes e não
  apresentou overlap incoerente. Foco entra no diagnóstico e retorna ao trigger
  ao fechar por Escape.

## Ambiente

- Codex CLI `0.144.0`, autenticado com ChatGPT.
- Node local `25.9.0`: operação validada, exibida como degradada porque a versão
  homologada do app é `22.x`.
- Supabase CLI `2.84.2`, seis migrations alinhadas.

## Gate independente

O re-gate final foi executado pelo Codex CLI local `0.144.0`, autenticado com
ChatGPT e sem chaves de API no ambiente. Veredito: **SHIP**, sem findings abertos.
