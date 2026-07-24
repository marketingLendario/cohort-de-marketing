# GUIA — Publicar a sua página na internet (rápido, de graça)

> **Estou perdido em:** "a skill gerou a página, mas ela só abre no MEU computador — como isso vira um site de verdade?"
> **O que você vai ter no final:** a sua `pagina/index.html` acessível numa URL pública (ex.: `seuprojeto.vercel.app`) — o pré-requisito do pixel e do anúncio (anúncio não aponta pra arquivo local). E, se quiser, a IA fazendo isso POR você daqui pra frente (CLI + token).
> **Fontes:** as aulas do **AIOX** no [portal de cursos](https://membros.academialendaria.ai/m/courses?tenant=1749742382792) — o caminho de estudo RECOMENDADO em vídeo (atenção: a publicação é uma das **últimas** aulas da trilha do AIOX, não a primeira) · o Fundamentals também mostra publicação (existe lá, mas não é o clique a clique recomendado) · docs da Vercel (CLI e tokens).

## ⚠️ A ordem certa (pixel e página andam juntos)

O pixel tem **3 momentos**, e este guia fica no meio deles:
1. **CRIAR o pixel** (Events Manager — [super-guia C.1](super-guia-apis-e-ads.md)) — só precisa da conta Meta; faça ANTES.
2. **PLUGAR o ID no HTML** da página ([C.2.5](super-guia-apis-e-ads.md) — o `[PLUG: SEU_PIXEL_ID]`) — de preferência ANTES de publicar (poupa uma republicação).
3. **Publicar** (este guia) → e só então **TESTAR o disparo** ([C.3](super-guia-apis-e-ads.md)) — o teste exige a página NO AR.

Publicou sem plugar? Não quebrou nada — pluga e republica (erro H3). Mas a ordem redonda é: **criar pixel → plugar → publicar → testar**.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📄 Artefato | `projetos/{seu-slug}/pagina/index.html` existe (a página gerada na Aula 2) | rode `/pagina-vendas-funil` |
| 🔑 Conta | Uma conta na Vercel (grátis; entre com o GitHub se tiver) | `vercel.com` → Sign Up |
| 🧰 Ferramenta | *(só pro caminho 1B, o da IA)* Node/npm instalado — você JÁ tem (é o mesmo que roda as skills) | `node -v` responde? então está ok |
| 📖 Conhecimento | *(recomendado)* as aulas do **AIOX** no portal — a trilha em vídeo recomendada (a publicação é uma das ÚLTIMAS aulas dela; não precisa esperar a trilha inteira pra publicar por este guia) | assista no [portal de cursos](https://membros.academialendaria.ai/m/courses?tenant=1749742382792) |
| 🔑 Conta | *(recomendado — ver "A ordem certa" acima)* Pixel criado e ID plugado no HTML antes de publicar | [super-guia C.1 + C.2.5](super-guia-apis-e-ads.md); publicou sem? H3 resolve |
| 🔑 Conta | Domínio próprio — **OPCIONAL agora**: pra TESTAR, o subdomínio grátis (`*.vercel.app`) serve perfeitamente | quando for pra valer: compre (ex.: registro.br, ~R$40/ano) e conecte (seção "Domínio" abaixo) |

## As 3 opções (escolha UMA)

| Opção | Pra quem | Custo |
|---|---|---|
| **1. Vercel direto** — em duas versões: **1A** pelo site (mouse) ou **1B** pelo CLI com a IA fazendo por você | todo mundo que quer a página NO AR hoje | R$0 |
| **2. Pelo AIOX** — o pipeline profissional: repositório no GitHub conectado à Vercel, deploy automático a cada merge (`*environment-bootstrap` → `*setup-github`). **As aulas do AIOX no portal são o caminho de estudo recomendado** (a publicação é uma das últimas aulas da trilha — não vamos duplicar aqui); esta opção é pra quem JÁ está com o AIOX rodando | quem segue a trilha do AIOX e quer a página versionada com o resto | R$0 |
| **3. Hospedagem contratada** (Hostinger e similares) — painel tradicional, sobe os arquivos por lá | quem já TEM site/hospedagem paga e quer tudo no mesmo lugar | ~R$10–20/mês |

> Tanto faz a opção — o que importa é o RESULTADO: uma URL pública que abre a sua página. O resto do método não muda.

## Caminho 1A — pelo site da Vercel (~5 min, sem terminal)

1. `vercel.com` → login → **Add New → Project**.
2. Suba a pasta `projetos/{seu-slug}/pagina/` (arraste/importe).
3. **Deploy** → a Vercel te dá a URL: `https://alguma-coisa.vercel.app`. **Copie e guarde.**
4. Republicar depois de mudar a página = subir de novo (a URL continua a mesma).

## Caminho 1B — pelo CLI, com a IA fazendo por você (o jeito do cohort)

A Vercel tem um programa de terminal (CLI). Instalado uma vez, **a IA publica e republica a página sozinha** — você nunca mais abre o site da Vercel. É o caminho natural pra quem já vive no Claude Code.

**O que acontece por baixo (pra você entender o que a IA vai rodar):**
1. Instalar o CLI (1× na vida): `npm i -g vercel`
2. Entrar na sua conta (1× na vida): `vercel login` → ele abre o navegador/manda link pro seu e-mail → você confirma → o terminal fica autorizado.
3. Publicar: dentro da pasta `pagina/`, rodar `vercel` (primeira vez ele faz 3–4 perguntas de setup — pode aceitar as sugestões) e depois `vercel --prod` → sai a URL pública.
4. Republicar depois de qualquer mudança: `vercel --prod` de novo. Mesma URL.

**Mas você não precisa decorar nada disso — peça (seção de prompts abaixo).**

## O token da Vercel (opcional — pra IA trabalhar SEM pedir login)

O `vercel login` resolve pra você usando o SEU terminal. Se você quiser que a IA publique **sem depender do login interativo** (ou rodando de outro lugar), aí entra o **token** — a "senha de programa" da Vercel, igual às outras chaves do curso:

1. **Onde pegar:** `vercel.com` → clique no seu avatar (canto superior direito) → **Account Settings** → **Tokens** → **Create Token**.
2. Dê um nome (ex.: `cohort-marketing`), escopo na sua conta, validade (pode deixar sem expirar ou 1 ano) → **Create**.
3. O token aparece **UMA vez só** → copie na hora.
4. **Guarde no `.env`** do projeto (mesma regra de todas as chaves — [guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md)):
   ```
   VERCEL_TOKEN=seu_token_aqui
   ```
5. Com ele no `.env`, a IA consegue rodar `vercel --prod --token $VERCEL_TOKEN` sem nenhuma interação. ⚠️ Regra de sempre: token é senha — nunca em print, grupo ou GitHub.

**Precisa do token?** Na prática do curso: **não** — o `vercel login` (1×) basta. O token é o upgrade de conforto/automação.

## 💬 Prompts prontos (copie e cole na conversa)

| Situação | Cole isto |
|---|---|
| **Publicar pela primeira vez** | "Instale o CLI da Vercel (`npm i -g vercel`), me guie no `vercel login`, e depois publique a pasta `projetos/MEU-SLUG/pagina/` em produção. No final, me devolva a URL pública e grave ela no meu `PAINEL-DA-SEMANA.yaml` como `pagina_url`." |
| **Republicar (mudei a página)** | "Atualizei a página de vendas. Republique na Vercel em produção mantendo a mesma URL e confirme que a mudança está no ar." |
| **Configurar o token** | "Criei um token na Vercel. Grave como `VERCEL_TOKEN` no `.env` (vou colar em seguida, não registre em mais lugar nenhum) e passe a usar `--token` nos deploys pra não depender de login." |
| **Deu erro** | "O deploy na Vercel falhou. Aqui está a saída do terminal: [cole]. Diagnostique, PESQUISE se precisar, e me guie passo a passo." |
| **Conectar domínio** | "Comprei o domínio X. Conecte ele ao projeto da Vercel e me diga exatamente o que configurar no painel do registro.br (registros DNS)." |
| **Conferir que está tudo certo** | "Abra/verifique a URL pública da minha página: o `index.html` responde? O pixel está no HTML (procure `fbq(` ou `[PLUG:`)? Me dê um checklist do que está ok e do que falta." |

## Domínio próprio (quando for pra valer)

1. Compre o domínio (registro.br pra `.com.br`, ou qualquer registrador).
2. Na Vercel: projeto → **Settings → Domains → Add** → digite o domínio → a Vercel mostra os registros DNS (A/CNAME) pra criar no painel do registrador.
3. Propagação leva de minutos a ~24 h. O https é automático (a Vercel emite o certificado sozinha).
4. Depois de trocar: atualize o `pagina_url` no Painel e **verifique o domínio na Meta** ([guia-meta-fundacao](guia-meta-fundacao.md), passo 7 — deixa de ser pendência).

## Teste de sucesso

Abra a URL **no seu celular, fora do wifi de casa** (4G). Abriu a página certa, com `https://` na barra? Publicado de verdade. *(Se só abre no seu computador, você está abrindo o arquivo local — `file:///` não é site.)*

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer |
|---|---|---|---|
| H1 | O link que você guardou começa com `file:///C:/...` | isso é o arquivo LOCAL, não o site | use a URL `https://...vercel.app` que a Vercel mostrou no fim do deploy |
| H2 | Publicou mas a URL abre **404** | o arquivo principal não se chama `index.html`, ou subiu a pasta errada (a pasta-mãe em vez da `pagina/`) | garanta que DENTRO do que você subiu existe um `index.html` na raiz; no CLI, rode o `vercel` DENTRO da pasta `pagina/` |
| H3 | Página no ar, mas o **pixel não dispara** | publicar não instala o pixel — são dois passos | siga o [guia-pixel-capi](guia-pixel-capi.md) (passo 2: destravar o `[PLUG: SEU_PIXEL_ID]` no HTML) e **republique** (mudou o HTML = novo deploy) |
| H4 | `vercel: command not found` (ou "não é reconhecido") logo após instalar | o terminal aberto ainda não enxerga o programa novo | feche e reabra o terminal e tente de novo; persiste → `npm i -g vercel` de novo e cole a saída pra IA |
| H5 | `vercel login` não completa (link não chega / navegador não abre) | e-mail errado na conta, ou bloqueio do navegador | confira o e-mail da conta Vercel; tente o login pelo site primeiro e repita; alternativa definitiva: crie o **token** (seção acima) e pule o login |
| H6 | Deploy ok, mas a página no ar está DESATUALIZADA | você editou o arquivo local e não republicou (ou republicou a pasta errada) | `vercel --prod` de novo na pasta certa; confirme com Ctrl+F5 (ignora o cache do navegador) |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | guarde a URL pública — ela é o `pagina_url` do seu `PAINEL-DA-SEMANA.yaml` e o destino do seu anúncio |
| 📖 Ler | próximo da cadeia: [guia-pixel-capi.md](guia-pixel-capi.md) — se você seguiu a ordem redonda (pixel já plugado), vá direto ao **passo 5 de lá: testar o disparo** com a página no ar; se publicou sem pixel, siga o guia do começo |
| 🚑 Se travar | catálogo H1–H6 acima; fora dele → print + "estou preso publicando a página, pesquise e me guie" na conversa — e em vídeo, a referência recomendada são as **aulas do AIOX** no portal (publicação = uma das últimas da trilha) |
