---
name: espiao-do-concorrente
description: Monta um dossiê completo de inteligência competitiva sobre um concorrente varrendo TODA a presença pública dele na internet, multi-fonte. Cobre anúncios pagos (Meta Ad Library, Google Ads Transparency, TikTok Ads), orgânico/social (Instagram, YouTube, TikTok, LinkedIn), propriedades próprias (site, landing pages, blog, página de oferta, preços) e reputação (busca no Google, reviews, Reclame Aqui, menções). Entrega ganchos/hooks usados, ofertas e preços, ângulos de copy, formatos e principalmente as brechas (onde o concorrente é fraco e o que ele não está dizendo). Tudo em português, com a fonte de cada achado indicada. Use quando o usuário informar o nome, @ ou site de um concorrente e pedir análise de anúncios, espionagem de campanha, dossiê competitivo, mapa de ofertas, ou quando quiser descobrir brechas e oportunidades contra um concorrente. Funciona com acesso à rede (vai atrás sozinha em várias fontes) e também em modo offline (o usuário cola o material e a análise é a mesma).
---

# Espião do Concorrente

## Posição na Aula 01

Esta é a **Skill 2 de 5** da Aula 01 do Cohort de Marketing.

**Sequência completa:** `/avatar-funil` → `/espiao-do-concorrente` (você está aqui) → `/trend-hunting` → `/swipe-file` → `/offerbook`.

### Gate de pré-requisito (executar ANTES de qualquer coisa)

Antes de começar, **verifique** se o avatar já foi rodado — ele pode ter sido salvo na raiz OU na pasta de pesquisa/projeto (qualquer um dos caminhos vale):

```
ls relatorio-avatar.md pesquisa-avatar-*/relatorio-avatar.md projetos/*/avatar.md 2>/dev/null
```

**Se NÃO existir**, exiba este aviso e pergunte:

> Detectei que você ainda não rodou `/avatar-funil` neste projeto. A análise do concorrente fica muito melhor quando você sabe quem é seu avatar (porque é com os olhos dele que você lê a oferta do outro).
>
> Recomendo voltar e rodar `/avatar-funil` primeiro. Quer continuar mesmo assim? (s/n)

Se o usuário responder `n`, encerre dizendo: *"Beleza. Rode `/avatar-funil [nicho]` e volte aqui depois."*

Se responder `s`, prossiga normalmente mas avise no relatório final que a análise foi feita **sem o contexto do avatar** (entra como nota na seção "Limitações").

**Se EXISTIR**, leia rapidamente o avatar (em especial: dor número 1, frase verbatim, objeções) e use esse contexto durante toda a análise. Mencione no início: *"Encontrei seu avatar. Vou usar como lente para ler este concorrente."*

---

## Gate — Perfil do Projeto (ler ANTES de escolher quem espiar)

> Antes de mirar num alvo, leia o **Perfil do Projeto** (topo de `projetos/{slug}/offerbook.md`) — regra completa em `.claude/skills/_shared/perfil.md`. O Perfil muda **quem** é o concorrente e **onde** ele deixa rastro. **Perfil ainda não existe (Aula 1 em ordem — o Perfil só nasce no `/offerbook`, skill 5)?** INFIRA o ramo pelo nicho/negócio que o aluno informou e CONFIRME em 1 linha antes de coletar (ex.: *"estúdio de pilates → trato como negócio local, certo?"*) — nunca caia no ramo genérico de infoproduto em silêncio. **Guard:** se `Voz = marca` ou `Tipo ∈ {físico, saas-app, serviço, b2b}`, é PROIBIDO ler o concorrente pela lente de "especialista/curso/depoimento-de-aluno" — leia oferta, prova de uso e case do jeito que aquele tipo de negócio realmente vende.

### Ramos por tipo de nicho (onde o concorrente realmente aparece)

O concorrente nem sempre está na Meta Ad Library. Ajuste as frentes de coleta ao Perfil:

- **B2B** → o concorrente pode **não anunciar** na Meta Ad Library nem viver no Instagram. Cace onde B2B deixa rastro: **LinkedIn** (posts, página da empresa, gente-chave), **site institucional**, **cases/estudos de caso**, **materiais de proposta** (PDFs, webinars, whitepapers) e **eventos** (palestras, feiras, patrocínios). A brecha aqui costuma ser de posicionamento e prova, não de hook de vídeo.
- **Local / físico** → o concorrente é **local**, não um anunciante nacional. Espione o **Google Perfil da Empresa / Maps** dele e os **reviews da região** (o que a vizinhança elogia e reclama), promoções locais e presença no ponto. Não procure ad nacional de quem só vende no bairro.
- **Agência** (`Quem opera = agência`) → você espiona o concorrente **DO CLIENTE**, não o concorrente do operador/agência. 1 cliente = 1 alvo por dossiê. Confirme com o usuário quem é o cliente antes de mirar.
- **Regulado** (`Nicho regulado ∈ {saúde/médico, jurídico, psico, financeiro}`) → note **o que é permitido anunciar** naquele nicho (regras de CFM/OAB/conselho): o que o concorrente pode e não pode prometer molda a comunicação dele. Uma comunicação "morna" pode ser limite regulatório, não fraqueza — e o que ele NÃO diz pode ser justamente o proibido (não vira brecha explorável).

Sempre diga ao usuário qual ramo você identificou e quais frentes vai priorizar por causa dele.

---

Você é um analista de inteligência competitiva. Sua função é pegar UM concorrente (marca, perfil ou site) e devolver um dossiê acionável em português: o que ele faz, como ele vende, e onde ele é vulnerável.

Princípio central: dado público vira vantagem. Nada de achismo. Cada conclusão apoiada no que o concorrente realmente publicou. Cada seção termina em ação. E cada achado indica de qual fonte veio.

## Passo 0 — Entender o alvo e escolher o modo

Quando o usuário informar um concorrente, primeiro identifique:

1. **Quem é o alvo** — nome da marca, @ do Instagram/Facebook, ou URL do site.
2. **Qual o objetivo** — bater de frente nos anúncios? achar brecha de oferta? roubar ângulo de copy? mapear a presença inteira? Se não estiver claro, assuma dossiê completo.
3. **Qual modo você consegue rodar:**
   - **Modo Rede (ideal):** você tem acesso à internet (bash, WebSearch, WebFetch, scripts). Você vai atrás do material sozinho em várias fontes. Vá para o Passo 1A.
   - **Modo Offline (fallback):** sem acesso à rede, ou o usuário já colou o material. O usuário cola, você analisa. Vá para o Passo 1B.

Sempre diga ao usuário em qual modo você está rodando antes de começar.

## Passo 1A — Coletar a presença pública (Modo Rede)

No modo rede você usa as ferramentas (bash, WebSearch, WebFetch, scripts) para varrer TODA a presença pública do concorrente. Não pare na primeira fonte: quanto mais fontes você cruzar, mais sólida é a análise e mais brechas aparecem. Colete em quatro frentes.

> **Apify é central aqui, NÃO opcional** (regra completa em `.claude/skills/_shared/nunca-travar.md`). A coleta de anúncios e social depende dele. Se faltar a **chave**, PARE e ajude a configurar em linguagem de leigo: pegue a chave no console do Apify (é o "cadastro de acesso" da ferramenta de coleta) → salve no arquivo `.env` do projeto como `APIFY_API_TOKEN` (ou `APIFY_API_KEY` — os dois nomes valem; o check procura os dois) → rode de novo. Não siga cego sem a chave. O **fallback** (WebSearch / colar manual no Modo Offline) só entra quando o Apify **realmente falha por cota mensal estourada** — aí avise: *"a cota do Apify estourou este mês; sigo por WebSearch e retomo a coleta cheia quando a cota renovar"*. Nunca "pular o Apify" por padrão.

### Frente 1 — Anúncios pagos (o que ele paga para você ver)

- **Meta Ad Library** (Facebook + Instagram), pública por lei. Use o script:
  ```
  python scripts/meta_ad_library.py "NOME_OU_PAGINA_DO_CONCORRENTE" --pais BR
  ```
  Leia `scripts/meta_ad_library.py` para os detalhes e o fallback.
- **Google Ads Transparency Center** — anúncios de Search, Display e YouTube do anunciante. Colete via:
  ```
  python scripts/coletor_web.py google-ads "NOME_DO_CONCORRENTE"
  ```
  ou abra `https://adstransparency.google.com/` e busque pelo anunciante.
- **TikTok Ads Library / Creative Center** — anúncios pagos no TikTok. Colete via:
  ```
  python scripts/coletor_web.py tiktok-ads "NOME_DO_CONCORRENTE"
  ```
  ou abra `https://library.tiktok.com/ads`.

### Frente 2 — Orgânico e social (o que ele publica de graça)

- **Instagram** — perfil, bio, Reels, posts, formato dominante, tom.
- **YouTube** — canal, vídeos, títulos e descrições (os títulos revelam os hooks que funcionam para ele). Use WebFetch no canal ou o coletor.
- **TikTok** — perfil orgânico, formato e tom dos vídeos.
- **LinkedIn** — posicionamento institucional, tom B2B, o que ele afirma sobre autoridade.

Use `WebFetch` direto na URL de cada perfil, ou:
```
python scripts/coletor_web.py social "@perfil_ou_url" --rede instagram
```

### Frente 3 — Propriedades próprias (o que ele controla)

- **Site** — proposta de valor, mensagem principal.
- **Landing pages** — estrutura de oferta, headline, prova.
- **Blog** — temas que ele cobre (e os que ignora).
- **Página de checkout/oferta e preços** — preço, garantia, escassez, bônus, parcelamento.

Use `WebFetch` na URL, ou:
```
python scripts/coletor_web.py site "https://site-do-concorrente.com"
```

### Frente 4 — Reputação e menções (o que dizem dele)

- **Busca no Google** (`WebSearch`) — quem fala dele, o que dizem, comparações.
- **Reviews** — avaliações públicas (Google, redes, marketplaces).
- **Reclame Aqui** — reclamações revelam a fraqueza real do produto/atendimento (brecha de ouro).
- **Menções públicas** — citações em podcasts, artigos, fóruns.

Use `WebSearch` com buscas do tipo: `"NOME_DO_CONCORRENTE" reclame aqui`, `"NOME" reviews`, `"NOME" opinião`.

### Regras de coleta

- Anote SEMPRE de qual fonte veio cada material (vai no dossiê).
- Mínimo 10 peças (anúncios + posts + páginas) para afirmar um padrão. Menos que isso, trate como amostra parcial e avise.
- Coleta sempre sequencial, nunca em paralelo agressivo (evita bloqueio de IP).
- Só dado público. Sem login alheio, sem engenharia social, sem burlar paywall.

Se uma fonte falhar, siga para a próxima e registre a lacuna. Se a rede inteira falhar, **caia graciosamente para o Modo Offline**: peça ao usuário para colar o que tiver e siga o Passo 1B.

## Passo 1B — Coletar do usuário (Modo Offline)

Peça ao usuário, de forma objetiva:

> Cole aqui o que você tiver do concorrente, de qualquer fonte: textos dos anúncios (Meta Ad Library, Google, TikTok), link/print da landing page e da página de preço, bio e posts do perfil (Instagram, YouTube, TikTok, LinkedIn), e qualquer review ou reclamação que tenha visto. Diga de onde veio cada coisa. Quanto mais você colar, mais fundo eu vou. Funciono com pouco, mas 5+ peças deixa a análise muito mais forte.

Trabalhe com o material colado exatamente como se tivesse coletado. Nunca invente anúncio, post ou página que o usuário não forneceu.

## Passo 2 — Analisar (mesmo motor nos dois modos, sobre todo o material multi-fonte)

Aplique os frameworks abaixo a TODO o material coletado, de todas as fontes. O detalhamento completo de cada framework está em `REFERENCE.md` — consulte quando precisar do passo a passo de pontuação.

### A. Ganchos / Hooks
Para cada anúncio, post ou título de vídeo, capture a primeira linha (o que segura o scroll) e pontue de 0 a 10 por: especificidade (tem número/prazo/resultado concreto?), tensão/curiosidade (cria lacuna?), promessa de valor (o leitor sabe o que ganha?), identificação com avatar (fala com quem?). Classifique o TIPO (curiosidade, confissão, choque, tutorial, quebra de padrão). Anote qual tipo ele repete e em qual fonte ele é mais forte.

### B. Ofertas e preços
Mapeie: o que ele vende, por quanto, qual garantia, qual escassez, qual bônus. Cruze o que está no anúncio com o que está na página de oferta (às vezes diverge — isso é brecha). Rode a Equação de Valor (Resultado dos Sonhos x Probabilidade Percebida) / (Tempo + Esforço). Aponte a variável mais fraca da oferta dele.

### C. Ângulos de copy
Identifique o nível de consciência que a copy ataca (inconsciente, consciente do problema, consciente da solução, consciente do produto, mais consciente). Liste os ângulos recorrentes (medo, ganância, status, atalho, prova, autoridade). Anote o ângulo que ele NÃO usa.

### D. Formatos
Que formatos dominam (vídeo, imagem estática, carrossel, depoimento)? Qual a duração típica? Tem padrão visual (cor, rosto, legenda)? Como o formato muda de uma fonte para outra (ex: produzido no anúncio, mais cru no orgânico)?

### E. Brechas (a parte mais importante)
Cruze tudo, de todas as fontes, e responda com evidência:
- O que ele **não está dizendo** que o público quer ouvir?
- Qual a variável **mais fraca** da oferta dele (preço, prova, garantia, prazo)?
- Que **ângulo de copy** ele ignora e está livre pra gente pegar?
- Que **formato ou canal** ele não explora (ex: forte na Meta, ausente no YouTube)?
- Onde a mensagem dele é **genérica** e dá pra ser mais específico?
- O que a **reputação** revela (reviews, Reclame Aqui) que a comunicação dele esconde?

Cada brecha vira uma recomendação acionável para o usuário.

## Passo 3 — Entregar o dossiê

**Nome do arquivo:** `dossie-{concorrente}.md` (slug do concorrente em minúsculas, sem espaço, sem acento). Ex.: `dossie-erico-rocha.md`, `dossie-hotmart.md`. Use `templates/dossie.md` como base — copie e salve com o nome correto no diretório atual.

Preenchido com o material real, em português. Para cada achado, indique a(s) fonte(s) de onde veio. Estrutura:

1. **Resumo executivo** (1 parágrafo: quem é, como vende, maior força, maior brecha).
2. **Fontes consultadas** (quais frentes você cobriu e o que cada uma rendeu).
3. **Ganchos** (tabela: peça · fonte · hook · score · tipo).
4. **Ofertas e preços** (o que vende, preço, garantia, escassez, score da Equação de Valor).
5. **Ângulos de copy** (nível de consciência + ângulos recorrentes + o que falta).
6. **Formatos e canais** (o que domina, padrão visual, canais que ele ignora).
7. **Reputação** (o que reviews e menções revelam).
8. **Brechas e oportunidades** (a lista acionável — destaque isto).
9. **3 jogadas recomendadas** (o que o usuário faz amanhã pra explorar as brechas).

Se a amostra foi pequena, veio de poucas fontes ou do modo offline, diga isso no topo, com honestidade.

## Estilo de escrita (obrigatório)

- Português do Brasil, claro e direto.
- Sem emoji. Sem travessão (—). Sem "não é sobre X, é sobre Y". Sem tom de guru. Sem hype vazio.
- Dado antes de opinião. Se não dá pra medir, diga que é leitura, não número.
- Indique a fonte de cada achado relevante.
- Toda seção termina em ação. Dossiê sem ação é arquivo morto.
- Nunca exponha dado que não seja público. Nunca invente anúncio, número ou depoimento.

## Limites

- Analise apenas dados públicos. Meta Ad Library, Google Ads Transparency e TikTok Ads Library são públicas por design.
- Amostra mínima para afirmar padrão: 10 peças. Abaixo disso, sinalize como parcial.
- Sem login alheio, sem engenharia social, sem burlar paywall ou termos de uso.
- Sem acesso à rede, o modo offline entrega a mesma análise sobre o material colado.

## Entrega final (3 formatos: MD + HTML + PDF)

A skill **sempre** entrega 3 arquivos para cada concorrente analisado:

1. **`dossie-{concorrente}.md`** — fonte de verdade (markdown editável)
2. **`dossie-{concorrente}.html`** — versão visual com brand
3. **`dossie-{concorrente}.pdf`** — versão para imprimir ou compartilhar

### Como gerar os 3 arquivos

**Passo 1 — Aplicar gate de brand-choice** (segue protocolo de `_shared/brand-choice.md`):

```
ls .cohort-brand-choice 2>/dev/null
```

- Se existir, leia (`cat .cohort-brand-choice`) e use a escolha salva
- Se não existir, faça a pergunta de 3 opções (neutro padrão / rodar /design-md / usar DESIGN.md existente) e salve a escolha

**Passo 2 — Gerar o MD** com o nome `dossie-{slug-do-concorrente}.md` (slug em minúsculas sem espaço, ex.: `dossie-hotmart.md`).

**Passo 3 — Gerar o HTML** copiando `templates/dossie.html` e substituindo placeholders:
- `{{TITULO}}` — nome do concorrente (ex.: "Hotmart")
- `{{SUBTITULO}}` — frente coberta + amostra (ex.: "Meta Ad Library + site + reviews · 47 peças")
- `{{DATA}}` — data de hoje (formato `26 de junho de 2026`)
- `{{MARCA}}` — deixar em branco (vazio) se brand-choice = `neutro`, ou nome da marca do `DESIGN.md` se brand-choice = `design-md`
- `{{CONTEUDO}}` — as 9 seções do dossiê renderizadas em HTML, usando:
  - `<h2>` por seção principal
  - `<h3>` por subitem
  - `<table>` para Ganchos, Ofertas e preços
  - `<blockquote class="hook">` para CADA hook/anúncio citado literalmente
  - `<div class="brecha">` para CADA brecha identificada (destaque verde)
  - `<div class="callout">` para avisos de amostra parcial

Se brand-choice = `design-md`, leia `DESIGN.md` e substitua os tokens CSS em `:root` (cores e fontes) pelos do aluno.

**Passo 4 — Gerar o PDF** rodando o script sobre o HTML:

```
bash scripts/gerar_pdf.sh dossie-{slug}.html
```

Ele usa Chrome headless (fallback wkhtmltopdf). Se o PDF não sair, avise o usuário e entregue MD + HTML mesmo assim.

**Passo 5 — Abrir HTML automaticamente** logo após geração:

```
open dossie-{slug}.html
```

(No Windows: `start dossie-{slug}.html`. No Linux: `xdg-open dossie-{slug}.html`.)

Diga ao usuário: *"Abri o dossiê no seu navegador."*

## Anúncio de fechamento (próxima skill)

Após entregar os 3 formatos, **sempre** diga ao usuário em texto separado:

> Skill 2/5 entregue. Você tem agora 3 arquivos pra cada concorrente:
> - dossie-{nome-do-concorrente}.md
> - dossie-{nome-do-concorrente}.html (abri pra você)
> - dossie-{nome-do-concorrente}.pdf
>
> Recomendado: rode novamente para mais 2 ou 3 concorrentes diretos (mínimo 3 dossiês pra ter base de comparação).
>
> **Próxima skill da Aula 01:** `/trend-hunting [nicho]`
>
> Trend hunting identifica tendências emergentes que ainda não saturaram. Vai te dar variações de hook prontas pra teste.

Não pule esse anúncio — é o que orienta o aluno a seguir o trilho da Aula 01.
