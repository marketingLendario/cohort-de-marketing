# GUIA — Gerar os criativos (e eles saírem BONS)

> **Estou perdido em:** "preciso dos criativos do anúncio e não sei gerar / gerei e saiu ruim".
> **O caminho simples deste guia:** banners estáticos via `/criativos-funil` (HTML→PNG na identidade da sua marca). Não depende de Codex nem de IA de imagem. Roteiros de vídeo saem no mesmo passo, para você gravar depois se quiser.
> **O que você vai ter no final:** 2–3 criativos APROVADOS (PNG em feed 4:5, story 9:16 e quadrado 1:1) na identidade do seu `DESIGN.md` — no nível do exemplo do academia-fit, prontos pro Gerenciador.
> **Fontes cruzadas:** SKILL.md do `/criativos-funil` e do `/briefista` (código real) · samples `mapa-skills-samples/academia-fit/criativos/` (repo) · referências de mercado reescritas (anúncio nativo, fluidez anúncio→página, cuidados legais) · erros reais de PS (o caso "saiu um lixo — foi falha minha?").

## Pré-requisitos (confira ANTES — 2 min)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📄 Artefato | `projetos/{seu-slug}/offerbook.md` existe — **bloqueante**: sem ele a skill PARA (afiliado pode usar o Registro da Oferta do Produtor no lugar) | rode `/offerbook` (Aula 1) |
| 📄 Artefato | `projetos/{seu-slug}/DESIGN.md` existe — **bloqueante**: sem ele o banner sai sem identidade (a causa nº 1 de criativo "lixo") | rode `/design-md` (Aula 2) |
| 📄 Artefato | `copy.md` existe (recomendado — é de onde saem os hooks; sem ele o texto sai mais genérico) | rode `/copy-funil` (Aula 2) |
| 🧰 Ferramenta | Chrome ou Edge instalado (é ele que transforma o HTML em PNG) | instale o Chrome |
| 🔑 Chave | Apify no `.env` (SÓ se for espionar concorrente; sem ela dá pra colar os anúncios manualmente) | [guia-apify](../03-conexoes-e-apis/guia-apify.md) |

## Passo a passo

1. Abra o Claude Code na **raiz** do projeto e rode:
   ```
   /briefista
   ```
   Ele transforma os ângulos validados da Aula 2 em uma bateria de variações (hook + copy + formato). **Se ele recusar dizendo que falta "nível de consciência" no ângulo**: rode `/metodo-funil` antes — é ele que carimba o nível.
2. **CURE a bateria**: escolha 2–3 finalistas. Critério simples: o hook fala a dor com as palavras do avatar (verbatim)? Se você não consegue escolher, escolha 1 de dor + 1 de benefício + 1 de prova.
3. Rode:
   ```
   /criativos-funil
   ```
   Responda as perguntas (rede: Meta · tipo: estático · formatos: feed 4:5, story 9:16, quadrado 1:1). Ele gera **1 amostra primeiro** — aprove ou peça ajuste ANTES do lote.
4. **Gate da amostra (o filtro anti-lixo)** — só aprove se:
   - as cores e a fonte são as do seu `DESIGN.md` (não azul/roxo genérico de IA);
   - o texto do banner é um dos seus hooks finalistas, sem erro de português;
   - dá pra ler o hook em 2 segundos com o celular a um palmo do rosto;
   - nada essencial está cortado nas bordas (o 9:16 é o que mais corta);
   - o banner parece um POST que caberia no feed, não um panfleto — anúncio com "cara de anúncio" paga CPM mais caro ("pensa como peixe, não como pescador" — referência de mercado);
   - a promessa do banner é a MESMA da página e do checkout ("prometeu banana, mostrou maçã = morreu" — a venda escorre na quebra de fluidez).
5. Aprovada a amostra → ele gera o lote: 3 formatos × seus 2–3 hooks, salvos em `projetos/{slug}/criativos/banners/` (`.html` + `.png` de cada).
6. **Confira os PNGs finais** abrindo a pasta — o que vai pro Gerenciador é o `.png`.

## Teste de sucesso

Abra a pasta `projetos/{slug}/criativos/banners/`: existe um `.png` em cada um dos 3 formatos para CADA finalista (2–3), e cada um passa nos 6 critérios do gate (passo 4) — com o hook legível em 2 segundos no celular. Régua final: lado a lado com `mapa-skills-samples/academia-fit/criativos/banners/`, o seu não fica devendo.

## POSSÍVEIS ERROS — catálogo (pare no primeiro que resolver)

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| V1 | Cores/fontes erradas (azul/roxo genérico de IA) | o `DESIGN.md` não existe ou está na pasta errada | confira `projetos/{slug}/DESIGN.md` → rode `/criativos-funil` de novo |
| V2 | Texto genérico/inventado no banner | faltou `copy.md`, ou você pulou a curadoria do briefista | volte ao passo 2 (curar 2–3 finalistas) e gere de novo |
| V3 | PNG não gerou (só ficou o `.html`) | Chrome/Edge não encontrado | instale o Chrome OU abra o `.html` no navegador e tire um screenshot no tamanho exato do formato (o fallback oficial da skill) — o Gerenciador só aceita imagem, não PDF |
| V4 | Layout quebrado / texto cortado na borda (o 9:16 é o que mais corta) | ajuste fino do formato | peça na conversa: "refaça o banner X, o texto está cortando na borda inferior" — UM banner por vez, não o lote |
| V5 | Continua ruim depois de tudo | falta parâmetro de comparação | abra `mapa-skills-samples/academia-fit/criativos/banners/` (o padrão esperado) → cole o exemplo + o seu na conversa e peça "iguale a qualidade deste exemplo" → se persistir: print dos dois + "pesquise por que meu banner sai abaixo disso" |

## Os 3 caminhos de criativo que existem (e o que cada um custa)

| Caminho | O que sai | Custo |
|---|---|---|
| **`/criativos-funil`** (este guia — o caminho simples) | banners PNG reais (4:5, 9:16, 1:1) na sua identidade + roteiros de vídeo | **grátis** (usa o Chrome/Edge do seu PC; a coleta de concorrente usa a cota grátis do Apify) |
| **`/conteudo-funil`** | carrosséis PNG (1080×1350) para orgânico, mesmo motor | **grátis** |
| **`/ads-creative-factory`** (avançado) | imagens geradas por IA em 8 estilos (editorial, pessoa real, UGC, mockup, comparativo, chat, tweet), com gate automático de marca e melhor-de-N | **exige assinatura ChatGPT** (a imagem sai pelo Codex CLI logado — chave de API não serve). Guia próprio em breve; por ora, só para quem já tem Codex funcionando |

> Vídeo pronto NÃO é gerado por nenhuma skill — o que sai são **roteiros** pra você gravar. Mockups de produto saem como **prompts** (`/mockup-produto-funil`) pra colar na ferramenta de imagem que você tiver.
> Gravou os roteiros? As duas métricas que dizem se o VÍDEO funciona (referência de mercado): **Hook Rate** (% que segue assistindo após os primeiros 3–5 s — mede o gancho) e **Hold Rate** até o CTA (mede a copy). A leitura entra no ritual do [guia-e-depois](guia-e-depois.md).

## "Posso usar OUTRO gerador de imagem (Gemini, Midjourney, Ideogram...)?"

Pode — entendendo o papel de cada peça:
- O caminho simples (`/criativos-funil`) **não usa motor de imagem nenhum** (é HTML→PNG). Trocar de IA não muda nada nele.
- A `/ads-creative-factory` é **Codex-only por código** — não existe como plugar outro motor (mudança é dos donos da skill).
- O que funciona com QUALQUER gerador é o **"traga sua própria imagem"**: pegue os finalistas do briefista (hook + copy) + as cores/fontes/tom do seu `DESIGN.md` → monte o prompt no gerador que preferir → gere → **você vira o gate de qualidade** (logo certo? cores do DESIGN? texto legível? mão sem 6 dedos?) → salve em `projetos/{slug}/criativos/externos/` → suba pelo Gerenciador na mão. A Meta não sabe nem se importa com quem gerou o PNG.
- Trade-off honesto: o que se perde não é a imagem — é a **automação** do gate e do lote. Com motor externo, a curadoria é 100% sua (use o gate do passo 4 como checklist). As regras de ouro abaixo valem igual.

## Regras de ouro (legais — valem pros 3 caminhos)

1. **Inspiração ≠ cópia**: do concorrente você extrai a ESTRUTURA (tipo de hook, sequência) e reescreve na sua voz — nunca reproduz texto/arte. Copiar literal = penalidade algorítmica + risco jurídico.
2. **Rosto de pessoa NUNCA é gerado por IA** no método — pessoa real entra só como edição de foto real, com autorização.
3. **Logo não entra na geração** — é aplicado depois, na composição.
4. **Sem promessa de renda com cifra, sem antes/depois em saúde, sem depoimento inventado** — é o que derruba anúncio (e conta) na Meta.
5. **Nunca AFIRME uma característica da pessoa** no texto ("você está acima do peso", "você que está endividado") — a Meta reprova por atributo pessoal. Pergunte: **"por acaso você...?"** (referência de mercado — evita reprovação sem perder o alvo).

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | confira os PNGs finais na pasta `criativos/banners/` contra o gate da amostra (passo 4) — só 2–3 APROVADOS seguem adiante |
| 📖 Ler | **[guia-campanha-no-ar.md](guia-campanha-no-ar.md)** (zelador → estruturador → Gerenciador) |
| 🚑 Se travar | o catálogo V1–V5 acima — e compare sempre com o exemplo `mapa-skills-samples/academia-fit/criativos/banners/` |
