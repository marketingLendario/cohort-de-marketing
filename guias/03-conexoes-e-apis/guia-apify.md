# GUIA APIFY — a chave das skills de coleta (Aula 1), sem cartão e sem susto

> **Estou perdido em:** "a skill pediu a chave do Apify / travei criando a conta / tenho medo de estourar a cota".
> **O que você vai ter no final:** `APIFY_API_TOKEN` no `.env`, testado — o `/espiao-do-concorrente`, `/trend-hunting`, `/conteudo-funil` e `/criativos-funil` coletando anúncios e Reels reais sozinhos.
> **Fontes cruzadas:** super-guia B.1 (repo) · as skills que usam a chave (código real) · doc oficial do plano Free do Apify (US$5/mês, sem cartão — consultada 22/07) · a saga REAL da Aula 1 (o bloco Apify+`.env` consumiu ~1h da aula; a correção do MCP foi feita ao vivo).
> **Custo: R$0** — plano Free com US$5 de crédito/mês, sem cadastrar cartão. Dá pra várias coletas de estudo por mês.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Projeto aberto no terminal com `.env` criado | [guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md) |
| 🔑 Conta | Um e-mail seu (ou conta Google) | — |

## Passo a passo (10 min)

1. Abra `https://console.apify.com/sign-up`.
2. Crie a conta: **"Sign up with Google"** (mais fácil — pula a verificação de e-mail) ou e-mail + senha. Com e-mail, o Apify manda um **link de verificação** — clique nele ANTES de continuar (erro Y1).
3. Questionário de boas-vindas ("what do you want to do?")? Responda qualquer opção ou pule — não afeta nada.
4. Você cai no **Console**. Menu lateral esquerdo → desça até **Settings** (engrenagem, canto inferior, embaixo do seu avatar).
5. Dentro de Settings → aba **"API & Integrations"** (em alguns layouts: **"Integrations"** → **"API tokens"** — é a mesma tela).
6. Ali está o **Personal API token** (começa com `apify_api_`) → clique no ícone de **copiar**.
7. Cole no `.env`: `APIFY_API_TOKEN=apify_api_...` (colado no `=`, sem espaço, sem aspas). Salve.
8. **Boa notícia (diferente da Meta):** o token do Apify **fica sempre visível** em Settings — perdeu, volta lá e copia de novo. E não há aprovação nem espera: funciona no segundo em que a conta existe.

## Teste de sucesso

1. No terminal, na raiz: `findstr "APIFY" .env` (Windows) ou `grep APIFY .env` (Mac/Linux) → imprime a linha com a chave.
2. Prova real: rode `/espiao-do-concorrente` (ou `/trend-hunting`) — a skill coleta **sem pedir chave**. Pediu chave = o `.env` não está sendo lido (erro Y5).

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **Y1** | Link de verificação do e-mail **não chega** | caixa de spam/promoções; e-mail digitado errado | 1) confira spam; 2) reenvie pelo próprio site; 3) atalho definitivo: crie de novo com **"Sign up with Google"** (sem verificação por e-mail) |
| **Y2** | Não acho **Settings/token** | layout muda de tempos em tempos | é o ÚLTIMO item do menu lateral esquerdo, embaixo do avatar; dentro dele, procure "API"; o token fica sempre visível lá |
| **Y3** | **"Cota/crédito estourou"** no meio da coleta | os US$5/mês do plano Free acabaram | a skill AVISA e cai no modo manual (você cola o material coletado na mão) — nada é cobrado; a cota renova no mês seguinte; pra estudo, US$5 rendem bastante |
| **Y4** | **Actor falhou** / mensagem de "requires paid plan" | alguns actors do marketplace são pagos ou limitados no Free (certos só rodam pela interface do site, não via API) | 1) rode a skill de novo (falha pontual é comum); 2) persiste: cole o erro na conversa ("o actor X falhou, pesquise") — a skill tem caminho manual como fallback |
| **Y5** | O teste não imprime a linha / a skill pede a chave | o `.env` não salvou, virou `.env.txt`, ou a linha tem espaço/aspas | volte ao [guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md) (é o erro nº 1 de todo o curso) |
| **Y6** | A skill pede **MCP** ou algo que este guia não citou | seu projeto está DESATUALIZADO (esse bug foi corrigido ao vivo na Aula 1) | `git pull` ([guia-atualizar-projeto](../01-pre-requisitos/guia-atualizar-projeto.md)) e rode de novo |

> Fora do catálogo? Print + "estou preso na chave do Apify, pesquise" na conversa.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/espiao-do-concorrente` — a primeira coleta real é o melhor teste da chave |
| 📖 Ler | a cadeia da Aula 1 segue nas skills (`/trend-hunting` → `/offerbook`); as chaves da Meta ficam pra Aula 3: [guia-meta-fundacao](guia-meta-fundacao.md) |
| 🚑 Se travar | o catálogo Y1–Y6 acima (verificação, cota, actor falhando...) |
