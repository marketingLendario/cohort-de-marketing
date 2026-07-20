# Tutorial — como obter o token da Meta (para o painel de tráfego)

Este é o passo-a-passo para o **Modo API** da Aula 04: puxar os dados reais da sua conta. Se você só quer ver o painel funcionando, **não precisa disto** — rode `/analista-de-dados` e escolha **Modo Exemplo**.

> **Precisa de ajuda?** Rode `/analista-de-dados`, escolha "criar o `.env` e configurar a API", e a skill caminha com você por cada passo abaixo. Você não precisa fazer nada sozinho.

O que você vai preencher no final, no arquivo `.env` (na raiz do projeto):

| Variável | O que é |
|---|---|
| `META_ACCESS_TOKEN` | O **token** (a "senha" que autoriza a leitura). O principal. |
| `META_APP_ID` / `META_APP_SECRET` | Identificam o seu app (reforço de segurança do token). |
| `META_AD_ACCOUNT_ID` | A conta de anúncios (`act_...`) que você quer analisar. |
| `META_BUSINESS_MANAGER_ID`, `META_PIXEL_ID`, `META_FACEBOOK_PAGE_ID` | Outros IDs — o Zelador descobre sozinho. |

> **Glossário rápido:** *token* = chave de acesso · *escopo* = permissão que o token carrega · *System User* = "usuário robô" do Business Manager, feito para automação · *ativo* = conta de anúncios, página ou pixel.

---

## Caminho recomendado — token de System User (longa duração)

É o jeito certo para automação: o token não expira toda hora.

### 1. Crie (ou abra) um app na Meta → App ID e App Secret

1. Acesse **https://developers.facebook.com/apps/** e faça login.
2. **Criar app** → tipo **Empresa (Business)** → dê um nome (ex.: "Cohort Tráfego").
3. No app, vá em **Configurações → Básico**. Copie:
   - **ID do app** → `META_APP_ID`
   - **Chave secreta do app** (clique em "Mostrar") → `META_APP_SECRET`
4. Ainda no app, adicione o produto **Marketing API** (menu "Adicionar produto"), se não estiver lá.

### 2. Crie o Usuário do Sistema e ATRIBUA OS ATIVOS (antes de gerar o token)

A Meta exige uma ordem específica: **primeiro o Usuário do Sistema precisa ter o app (e a conta) atribuídos a ele; só depois o token pode ser gerado com permissões.** Se você tentar gerar o token antes, aparece o erro *"Nenhuma permissão disponível"*.

1. Acesse o **Gerenciador de Negócios**: **https://business.facebook.com/settings** → **Usuários → Usuários do sistema**.
2. **Adicionar** → nome (ex.: "leitor-trafego") → função **Funcionário** → criar.
3. Com o usuário selecionado, clique em **Atribuir ativos** (ou "Adicionar ativos"):
   - Aba **Apps** → selecione o **app do passo 1** → ative **Gerenciar app** (controle total) → **Salvar**. **Este é o passo que destrava os escopos do token.**
   - Aba **Contas de anúncios** → selecione a sua conta → permissão **Ver desempenho** (basta para ler) → **Salvar**.
   - *(orgânico — roadmap)* Aba **Páginas** → selecione a página → permissão de leitura.

> ⚠️ **Erro "Nenhuma permissão disponível" ao gerar o token?** É porque o **app ainda não foi atribuído** ao usuário do sistema (aba **Apps** acima). Volte, atribua o app com "Gerenciar app", e os escopos passam a aparecer.

### 3. Gere o token → META_ACCESS_TOKEN

Agora sim, com os ativos já atribuídos:

1. Em **Usuários do sistema**, com o usuário selecionado, clique em **Gerar novo token**.
2. Escolha o seu **app** (o do passo 1).
3. Em **escopos (permissões)**, marque:
   - **`ads_read`** — ler desempenho de anúncios (é o que o painel usa);
   - **`business_management`** — enxergar os ativos do Business Manager;
   - *(só se for usar o perfil orgânico — roadmap)* **`pages_read_engagement`** e **`read_insights`**.
4. **Gere** e **copie o token** (ele só aparece uma vez). Cole em `META_ACCESS_TOKEN` no `.env`.

### 4. Descubra os IDs (o Zelador faz por você)

Com o token já no `.env`, rode:

```bash
node scripts/zelador-audit.mjs --gravar-env   # descobre e grava META_AD_ACCOUNT_ID, PIXEL, PÁGINA, BM
node scripts/zelador-audit.mjs --json         # valida token e escopos, sem alterar nada
```

Tem mais de uma conta? Liste e escolha:

```bash
node scripts/painel-trafego-data.mjs --listar-contas
# depois use no painel:  --ad-account-id=act_1234567890
```

---

## Caminho rápido — token temporário (só para testar)

Para um teste pontual, sem criar System User:

1. Acesse o **Explorador da Graph API**: **https://developers.facebook.com/tools/explorer/**
2. Selecione o seu app, clique em **Gerar token de acesso** e marque `ads_read`.
3. Copie o token para `META_ACCESS_TOKEN`.

> **Atenção:** esse token **expira em poucas horas**. Serve para experimentar, não para o dia a dia — para isso, use o token de System User acima.

---

## Token de página (engajamento orgânico — curtidas, comentários, sentimento)

Para a seção **Engajamento & perfil** (curtidas/comentários/reações por post + sentimento), o token precisa de escopos de **página**, que o token de anúncios normalmente não tem:

1. No **Usuário do Sistema** (Gerenciador de Negócios), **Atribuir ativos → aba Páginas** → selecione a sua página → permissão de leitura → Salvar. **Faça isso ANTES de gerar o token** — os escopos de página só aparecem na lista depois que a Página está atribuída.
2. **Gerar novo token** marcando **`pages_read_engagement`** (o essencial — curtidas/comentários/reações/sentimento). O **`read_insights` é opcional** (só adiciona alcance/visualizações dos posts, que o painel ainda não usa) — marque se aparecer, ignore se não.
3. Confirme `META_FACEBOOK_PAGE_ID` no `.env` (o `/zelador` descobre e grava). Para Instagram, preencha `META_INSTAGRAM_BUSINESS_ACCOUNT_ID`.
4. Rode `node scripts/painel-trafego-data.mjs --account --perfil` — se voltar `perfil.disponivel:true`, funcionou.

Sem esses escopos, o painel mostra a seção como **"em breve"** e segue (nunca trava). Ler **DM/Direct** é fase futura (exige App Review + webhook) — ver [`organico-roadmap.md`](./organico-roadmap.md).

> **⚠️ Aprendizados reais (do piloto) — leia antes de investir tempo aqui:**
> 1. **Atribua a página ao MESMO usuário do sistema que é dono do token.** Se você gerou o token pelo usuário `X`, a página tem que estar atribuída ao `X` (não a outro usuário). Confira o dono do token com `GET /me`. Sem isso, o `granular_scope` de `pages_read_engagement` fica com "alvos: nenhum" e dá `#10`.
> 2. **É um fluxo de dois passos:** com o token de System User, pegue o **page access token** (`GET /{page_id}?fields=access_token`) e use ESSE token nas chamadas de posts/comentários (a "nova experiência de Páginas" recusa o token de usuário direto com `#190`).
> 3. **O MURO real:** mesmo com tudo acima certo, ler `/{page}/posts`, `/feed` ou `/published_posts` retorna `#10` exigindo `pages_read_engagement` / `pages_read_user_content` **aprovados por App Review da Meta** (não basta o escopo no token). O texto dos comentários (necessário pro sentimento) exige `pages_read_user_content`, que muitas vezes nem aparece na lista até você adicionar o caso de uso ao app + passar por revisão. **Portanto: engajamento/sentimento orgânico é roadmap gated por App Review** (dias a semanas).
> 4. **O que funciona SEM nada disso:** a **audiência paga** (idade/gênero/região de quem os anúncios atingem) vem dos *breakdowns* dos Insights de anúncios — só precisa de `ads_read`. É a aba **Audiência** do painel, já real.

### Caminho A — engajamento na SUA conta agora (modo dev, sem App Review)

Apps em **modo Desenvolvimento** liberam as permissões para quem tem papel no app (admin/dev/testador) **sem revisão**. O painel lê **Instagram** (conta business vinculada à página) OU a **Página do Facebook** — escolha o que tiver engajamento.

**Pré-requisitos:** você é **admin do app E da conta** (página/IG); o caso de uso certo está adicionado no app (developers.facebook.com → seu app → **Casos de uso**):
- **Instagram** → caso de uso "Gerenciar mensagens e conteúdo no Instagram" (traz `instagram_basic`, `instagram_manage_comments`).
- **Facebook** → caso de uso "Gerenciar tudo na sua Página" → **Personalizar** → adicione `pages_read_engagement` + `pages_read_user_content`.

**Passos:**
1. **Gere um token de USUÁRIO** no **Graph API Explorer** (developers.facebook.com/tools/explorer): selecione seu app → "Get User Access Token" → marque os escopos:
   - **Instagram:** `instagram_basic` + `instagram_manage_comments` + `pages_show_list` (+ `pages_read_engagement`).
   - **Facebook:** `pages_read_engagement` + `pages_read_user_content`.
2. **Estenda para ~60 dias:** cole o token curto no **Access Token Debugger** (developers.facebook.com/tools/debug/accesstoken) → "Extend Access Token" → copie o longo.
3. **Cole em `META_PAGE_ACCESS_TOKEN`** no `.env` (o `META_ACCESS_TOKEN` de anúncios continua o mesmo). O `META_INSTAGRAM_BUSINESS_ACCOUNT_ID` e o `META_FACEBOOK_PAGE_ID` o `/zelador` já descobre/grava.
4. Rode `node scripts/painel-trafego-data.mjs --account --perfil` — o conector faz o fluxo de 2 passos, resolve a conta do Instagram e, se liberado, a aba **Engajamento** enche de verdade.

> Serve só para a **sua** conta (modo dev). Para qualquer aluno em produção, é o **Caminho B**: App Review dos escopos + Verificação de Negócio (semanas).

#### Se o seu app usa a **API do Instagram com login do Instagram** (a nova)

Se no app aparecem os escopos **`instagram_business_basic`** / **`instagram_business_manage_comments`** (e não `instagram_manage_comments`), o token **não** é gerado no Graph API Explorer — é na própria tela do app, e o conector fala com `graph.instagram.com`:

1. App → **Casos de uso → API do Instagram → Personalizar → aba Funções**: adicione sua conta **@** como **Testador do Instagram** e **aceite o convite** no Instagram (Configurações → Apps e sites, ou a notificação).
2. Em **"Gerar tokens de acesso" → Adicionar conta** → selecione a conta → clique em **Add all required permissions** (garante `instagram_business_basic` + `instagram_business_manage_comments`) → **gerar token**.
3. Copie o token e cole em **`META_INSTAGRAM_TOKEN=`** no `.env` (esse token já costuma ser de longa duração).
4. Rode `--perfil` — o conector detecta o `META_INSTAGRAM_TOKEN` e lê mídias + comentários do Instagram.

## Escopos por objetivo (resumo)

| Você quer… | Escopos no token |
|---|---|
| O painel de tráfego pago (impressões, cliques, CTR, gasto, ROAS) | `ads_read` (+ `business_management`) |
| Engajamento orgânico: curtidas, comentários, reações, sentimento | `pages_read_engagement` (essencial) · `read_insights` (opcional, p/ alcance de posts) |
| DM / Direct (roadmap) | `instagram_business_manage_messages` / `pages_messaging` + App Review |

---

## Problemas comuns (troubleshooting)

**"Nenhuma permissão disponível" ao gerar o token.**
O app ainda não foi atribuído ao Usuário do Sistema. Vá em **Usuários do sistema → Atribuir ativos → aba Apps → seu app → Gerenciar app → Salvar**. Depois volte em **Gerar novo token** — os escopos passam a aparecer.

**"(#10) Permission Denied" na conta de anúncios (mesmo com o token válido).**
A **conta** ainda não foi atribuída ao Usuário do Sistema. **Atribuir ativos → aba Contas de anúncios → sua conta → Ver desempenho → Salvar.** Pode levar alguns minutos para propagar.
- **Observação importante:** mesmo depois de liberar, o `/zelador` pode continuar marcando a conta com `#10` **num item de pagamento** — isso é normal com o papel "Ver desempenho", que não enxerga dados de cobrança. **Se o painel puxar insights e campanhas, está tudo certo para a Aula 4.** O teste que vale é: `node scripts/painel-trafego-data.mjs --account` retornar `"modo":"api"` com dados.

**O token expira rápido.**
Se você gerou pelo **Graph API Explorer**, ele dura poucas horas (bom só para teste). Para o dia a dia, use o **token de System User** (longa duração).

**Tem mais de uma conta e não sei qual usar.**
`node scripts/painel-trafego-data.mjs --listar-contas` mostra todas com id e status; use a escolhida com `--ad-account-id=act_...`.

## Segurança

- O `.env` **nunca vai para o GitHub** (está no `.gitignore`) — a chave fica só no seu computador.
- Os scripts têm um *scrubber*: token e app secret saem como `[REDACTED]` em qualquer log, JSON ou no painel.
- Se desconfiar que o token vazou, gere um novo em **Usuários do sistema** e o antigo deixa de valer.

---

## Guia visual mais detalhado

Este tutorial é o essencial para a Aula 04. Para o passo-a-passo completo com telas (criação do app, Business Manager, pixel, CAPI), veja o guia da Aula 03: [`../../aula-03/materiais/guia-app-meta-integracoes.html`](../../aula-03/materiais/guia-app-meta-integracoes.html).

**Configuração das variáveis no `.env`:** [`configurar-chaves-meta.md`](./configurar-chaves-meta.md).
