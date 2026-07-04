# Aula 2 · Montar o Funil de Vendas com Claude Code

> **Comece por aqui.** Este arquivo é o mapa de quem abriu o repositório da Aula 2 e não sabe por onde começar.

Na Aula 1 você fez a pesquisa e desenhou a **oferta**. Na Aula 2 você monta o **funil de vendas ponta a ponta**: da primeira página até a recuperação de quem não comprou. Cada peça do funil é uma **skill** que você chama com um comando `/`, e você roda as skills **na ordem** — cada uma usa o que a anterior entregou.

**Regra de ouro:** não tente montar o funil "de cabeça". Rode `/metodo-funil` primeiro. Ele diagnostica em que estágio de consciência o seu público está e te devolve o **mapa exato** das peças que você precisa construir — na sequência certa, com a skill de cada uma. Depois é só seguir o mapa.

---

## Convenção de projeto (leia antes de começar)

Todo o trabalho de um nicho vive em **uma pasta**: `projetos/{slug}/`.

- **Um nicho = uma pasta.** Ex.: `projetos/curso-de-ingles/`. Todas as peças do funil (offerbook, copy, página, emails...) ficam dentro dela. Nada solto na raiz — assim você toca vários nichos ao mesmo tempo sem misturar.
- **Como as skills acham o projeto ativo:** você pode passar o slug no comando; se não passar, a skill roda `ls projetos/`. Se houver **uma** pasta, ela usa; se houver **várias**, ela pergunta qual; se **nenhuma**, é porque o funil ainda não começou (rode `/offerbook` da Aula 1 primeiro).
- **Nomes dentro da pasta** (sem repetir o slug): `offerbook.md`, `avatar.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; e subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. As skills geram nos 3 formatos (`.md` + `.html` + `.pdf`) sempre que faz sentido.

A primeira skill que **cria** a pasta `projetos/{slug}/` é a `/offerbook` (na Aula 1). Da Aula 2 em diante, as skills **leem** dessa pasta e **gravam** de volta nela.

---

## A ordem do funil (Aula 1 → Aula 2)

O funil é um caminho numerado. Cada skill entrega uma peça e consome a peça anterior.

### Aula 1 — Pesquisa e Oferta (o alicerce)

1. **`/avatar-funil`** — minera a dor real do público e monta o avatar. Consome: o nicho/produto que você informar. Entrega: `avatar.md`.
2. **`/espiao-do-concorrente`** — dossiê do que o concorrente faz, vende e onde é fraco. Consome: nome/@/site do concorrente. Entrega: o dossiê competitivo.
3. **`/trend-hunting`** — tendências e formatos virais do nicho, com roteiros. Consome: o nicho. Entrega: relatório de tendências + roteiros.
4. **`/swipe-file`** — organiza os criativos vencedores achados acima numa biblioteca. Consome: os achados do espião e do trend-hunting. Entrega: `swipe-file.md`.
5. **`/offerbook`** — o Livro da Oferta (Story Selling), que fundamenta TODA a copy depois. Consome: a pesquisa de avatar real. Entrega: `offerbook.md` — e **cria** a pasta `projetos/{slug}/`.

### Aula 2 — O Funil (a construção)

6. **`/metodo-funil`** — **o mapa.** Diagnostica o estágio de consciência (1 a 5) e prescreve o funil certo, mais o mapa de execução com todas as peças na ordem. Consome: `offerbook.md`. Entrega: `funil.md`.
7. **`/copy-funil`** — headlines, bullets, CTA, quebra de objeções. Consome: `offerbook.md`. Entrega: `copy.md`.
8. **`/design-md`** — extrai a identidade visual (cores, fontes, tokens) de uma URL de referência sua. Consome: uma URL. Entrega: `DESIGN.md`.
9. **`/pagina-vendas-funil`** — estrutura a página de vendas (16 elementos), aplicando o seu `DESIGN.md`. Consome: `copy.md` + `DESIGN.md`. Entrega: `pagina/`.
10. **`/email-funil`** — a sequência de emails (convite → nutrição → venda → recuperação), na sua marca. Consome: `offerbook.md` + `DESIGN.md`. Entrega: `emails/`.
11. **`/conteudo-funil`** — roteiros de Reels na sua voz, modelados num criador de referência. Consome: uma referência do Instagram (+ `offerbook.md`). Entrega: `conteudo/`.
12. **`/recuperacao-funil`** — a sequência de quem chegou no checkout e não comprou (carrinho abandonado, cartão recusado, boleto, downsell). Consome: `offerbook.md` + `funil.md`. Entrega: `recuperacao.md`.
13. **`/cro-funil`** — mede cada etapa, define o teste A/B certo e diz quando escalar. Consome: os dados do seu funil no ar. Entrega: `cro.md`.

### Formatos de funil alternativos (use conforme o `/metodo-funil` prescrever)

O `/metodo-funil` decide **qual formato de funil** o seu público pede. Use estas skills quando ele mandar:

- **`/vsl-funil`** — funil de VSL (vídeo de vendas) Direct Response.
- **`/advertorial-funil`** — página editorial de pré-venda para público frio (nível 5).
- **`/lancamento-funil`** — lançamento estilo PLF, para público frio quando você já tem lista.
- **`/webinario-funil`** — webinário/aula ao vivo que vende (níveis 4 e 3).
- **`/quiz-funil`** — quiz/diagnóstico que segmenta o lead e casa a oferta ao resultado (nível 4).
- **`/whatsapp-funil`** — a sequência de WhatsApp/DM por momento.
- **`/criativos-funil`** — roteiros de anúncio modelados na Biblioteca de Anúncios de um concorrente.
- **`/mockup-produto-funil`** — prompts para gerar os mockups visuais dos produtos e bônus na sua marca.
- **`/backend-funil`** — a estrutura de upsell, OTO, order bump e downsell (onde mora o lucro).

---

## O primeiro comando

Se você **já fez a oferta** na Aula 1 (tem o `offerbook.md`):

```
/metodo-funil
```

Ele lê o seu offerbook, diagnostica o público e te devolve o mapa exato das peças a construir. A partir daí, é seguir o mapa.

Se você **ainda não fez a oferta**, volte à Aula 1 e comece pela `/offerbook` (que por sua vez usa a `/avatar-funil`). Sem oferta, não há funil.

---

## Todas as skills

Comando · o que faz · o que lê · o que gera (dentro de `projetos/{slug}/`).

### Aula 1 — Pesquisa e Oferta

| Comando | O que faz | Lê | Gera |
|---|---|---|---|
| `/avatar-funil` | Minera a dor real do público, monta o avatar em 7 dimensões e roda um focus group sintético | Nicho/produto/público que você informa (ou reviews e prints que você colar) | `avatar.md` (md + html + pdf) |
| `/espiao-do-concorrente` | Dossiê competitivo multi-fonte: anúncios, orgânico, ofertas, preços, reputação e brechas | Nome, @ ou site do concorrente | Dossiê do concorrente |
| `/trend-hunting` | Detecta tendências e formatos virais do nicho e gera roteiros prontos para teste | O nicho | Relatório de tendências + roteiros |
| `/swipe-file` | Organiza os criativos vencedores numa biblioteca pesquisável por padrão | Achados de `/espiao-do-concorrente` e `/trend-hunting` | `swipe-file.md` + estrutura de pastas |
| `/offerbook` | Monta o Livro da Oferta (Story Selling, 7 blocos) que fundamenta toda a copy; cria a pasta do projeto | Pesquisa de avatar real (`avatar.md`) | `offerbook.md` (+ `briefing-offerbook.md`, `.docx`) |

### Aula 2 — O Funil

| Comando | O que faz | Lê | Gera |
|---|---|---|---|
| `/metodo-funil` | Diagnostica o estágio de consciência (1–5) e entrega o mapa de execução do funil na ordem | `offerbook.md` | `funil.md` (md + html + pdf) |
| `/copy-funil` | Pipeline de copy de alta conversão (headlines, bullets, CTA, objeções) usando os frameworks dos copywriters lendários | `offerbook.md` | `copy.md` (+ html/pdf) |
| `/design-md` | Extrai a identidade visual (cores, fontes, tokens) de uma URL de referência | Uma URL pública | `DESIGN.md` (+ `tokens.json`, `preview.html`) |
| `/pagina-vendas-funil` | Estrutura a página de vendas de alta conversão (16 elementos) na sua marca | `copy.md` + `DESIGN.md` | `pagina/` |
| `/email-funil` | Gera os emails do funil (convite, confirmação, lembrete, recap, nurture, venda) na sua marca | `offerbook.md` + `DESIGN.md` | `emails/` |
| `/conteudo-funil` | Modela os Reels de um criador de referência e gera roteiros na sua voz | Uma referência do Instagram (+ `offerbook.md`) | `conteudo/` |
| `/recuperacao-funil` | Estrutura a sequência de recuperação de quem não comprou (carrinho, cartão, boleto, downsell) | `offerbook.md` + `funil.md` | `recuperacao.md` |
| `/cro-funil` | Monta os KPIs por etapa, o teste A/B da headline e diz quando escalar | Dados do seu funil no ar | `cro.md` |

### Formatos de funil e peças extras (conforme o `/metodo-funil` prescrever)

| Comando | O que faz | Lê | Gera |
|---|---|---|---|
| `/vsl-funil` | Estrutura um funil de VSL Direct Response (oferta → funil → escala → ticket) | `offerbook.md` | Estrutura da VSL |
| `/advertorial-funil` | Página editorial de pré-venda para aquecer público frio (nível 5) | `offerbook.md` | Estrutura do advertorial |
| `/lancamento-funil` | Régua de lançamento estilo PLF para público frio quando você tem lista | `offerbook.md` | Régua do lançamento |
| `/webinario-funil` | Funil completo de webinário/aula que vende (níveis 4 e 3) | `offerbook.md` | As 5 peças do webinário |
| `/quiz-funil` | Funil de quiz/diagnóstico que segmenta o lead e casa a oferta ao resultado (nível 4) | `offerbook.md` | Estrutura do quiz |
| `/whatsapp-funil` | Sequência de WhatsApp/DM por momento, casada ao estágio de consciência | `offerbook.md` + `funil.md` | Sequência de WhatsApp/DM |
| `/criativos-funil` | Modela a Biblioteca de Anúncios de um concorrente em roteiros de criativo na sua voz | Concorrente (Biblioteca de Anúncios) | Roteiros de criativo |
| `/mockup-produto-funil` | Monta prompts prontos para gerar os mockups visuais dos produtos e bônus na sua marca | `offerbook.md` + `DESIGN.md` | `mockups/` (prompts) |
| `/backend-funil` | Estrutura o back-end do funil (upsell, OTO, order bump, downsell, janela de 4h, LTV) | Produto de entrada + público | Estrutura do back-end |

---

> **Resumindo:** oferta pronta (Aula 1) → `/metodo-funil` te dá o mapa → você segue o mapa peça por peça. Cada skill lê da pasta `projetos/{slug}/` e grava de volta nela. Rode na ordem.
