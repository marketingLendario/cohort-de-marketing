# Configurar as chaves da Meta (Aula 04)

O painel roda **sem chave nenhuma** em Modo Exemplo. Para ler a sua conta real, configure o `.env` na raiz do projeto. O Analista **não reimplementa** a auditoria — ele delega ao Zelador.

## Modo Exemplo (zero configuração)

Nada a fazer: rode `/analista-de-dados` e o painel abre com dados fictícios rotulados "modo exemplo". Use para aprender a ler o painel antes de conectar a conta.

## Modo API — o que você precisa

No arquivo `.env` (na raiz, **fora do git**), com base no [`.env.example`](../../.env.example):

| Variável | Para quê | Obrigatória |
|---|---|---|
| `META_ACCESS_TOKEN` | Token de System User (leitura de anúncios) | Sim |
| `META_AD_ACCOUNT_ID` | Conta de anúncios (`act_...`) | Sim |
| `META_APP_SECRET` | Assina as chamadas (`appsecret_proof`) | Recomendada |
| `META_FACEBOOK_PAGE_ID` | Perfil orgânico (roadmap) | Só p/ orgânico |

**Escopos do token:** `ads_read` (leitura de anúncios) basta para o painel pago. Para o perfil orgânico (comentários/visualizações de posts) o token precisa de `pages_read_engagement` / `read_insights` — ver [organico-roadmap.md](./organico-roadmap.md).

**Não tem o token ainda?** Siga o [tutorial passo-a-passo de como obter o token da Meta](./tutorial-token-meta.md) — ou rode `/analista-de-dados` e escolha "criar o `.env` e configurar a API": a skill caminha com você.

## Validar e descobrir IDs (delegado ao Zelador)

```bash
node scripts/zelador-audit.mjs --json        # valida token, escopos e IDs; nada é alterado
node scripts/zelador-audit.mjs --gravar-env  # descobre e grava os IDs faltantes no .env
```

Se o token estiver inválido/expirado, o próprio Zelador aponta o código de erro da Meta e a correção (guia da Aula 03). **Nunca trave por falta de chave:** sem credenciais completas, o Analista cai no Modo Exemplo e segue.

## Segurança

O `.env` é gitignored. Toda saída dos scripts passa por um *scrubber* que troca segredos por `[REDACTED]` — token e app secret nunca aparecem em log, JSON ou no painel.
