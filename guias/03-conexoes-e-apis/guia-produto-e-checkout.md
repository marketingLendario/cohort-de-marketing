# GUIA PRODUTO E CHECKOUT — ter O QUE vender antes de anunciar

> **Estou perdido em:** "todo mundo fala do checkout e do link de pagamento… mas eu ainda nem cadastrei meu produto em lugar nenhum".
> **O que você vai ter no final:** o produto cadastrado na Hotmart, aprovado, com o link de checkout `pay.hotmart.com/...` funcionando — e o `ticket` e a `margem` anotados (a campanha, o `sck` e o `roas_break_even` da Aula 3/4 dependem EXATAMENTE disto).
> **Fontes cruzadas:** `aula-04/docs/tutorial-hotmart.md` (repo) · a cadeia real das skills (sem checkout não existe `sck`, atribuição nem `projecao.roas_break_even` — o `/diagnosticador` trava sem ele) · Central de Ajuda da Hotmart (["Como cadastrar meu produto"](https://help.hotmart.com/pt-br/article/215828518/como-cadastrar-meu-produto-na-hotmart-) e "Como finalizar o cadastro", consultadas 22/07) · docs oficiais da Stripe (Payment Links + Pix no Brasil, consultadas 22/07) · referências de mercado reescritas (ticket × forma de pagamento).
> A Hotmart é o **caminho-exemplo** deste guia (é a que o painel da Aula 4 lê nativamente) — **não uma prisão**: a seção "Precisa ser Hotmart?" abaixo mostra as outras possibilidades.
> **Custo: R$0** — cadastrar produto na Hotmart é grátis; ela só cobra **por venda** (taxa sobre cada transação).

## Por que este guia existe (a cadeia honesta)

A cadeia inteira do curso assume que o produto EXISTE com checkout ativo: o anúncio aponta pro checkout (com `sck`), o pixel do checkout dispara `Purchase`, o painel casa venda↔campanha, e o `roas_break_even = f(ticket, margem)` decide se a campanha vale. Sem este passo, nada disso tem onde acontecer.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🔑 Conta | Conta Hotmart (grátis) com **cadastro de dados pessoais/financeiros completo** — sem isso a aprovação trava | `hotmart.com` → criar conta → complete perfil e dados de recebimento |
| 📄 Artefato | O produto em si (e-book, curso, mentoria...) e a oferta definida no `offerbook.md` — é de lá que saem nome, promessa e **ticket** | rode `/offerbook` (Aula 1) |
| 📖 Conhecimento | *(Recomendado)* a diferença entre ticket, margem e ROAS | [guia-quanto-custa](../02-conhecimento-minimo/guia-quanto-custa.md) e [guia-conceitos](../02-conhecimento-minimo/guia-conceitos-trafego.md) |

## Passo 1 — Cadastrar o produto (15 min)

1. `app.hotmart.com` → menu **Produtos** → **"Cadastrar produto"** (ou "Adicionar produto").
2. Escolha o formato: **curso online**, **e-book/arquivo**, serviço online etc. — o assistente muda um pouco por formato, mas o fio é o mesmo.
3. Preencha o básico com o que o `offerbook.md` já definiu: **nome do produto** (o nome da oferta), **descrição** (a promessa), **categoria** e **imagem de capa**.
4. **Entrega:** curso → suba as aulas na área de membros da Hotmart (ou integre a sua); e-book → suba o arquivo. Capriche o mínimo — a análise olha se o produto é real e entregável.

## Passo 2 — Preço (o ticket) e forma de pagamento

1. Defina o **preço = o ticket do seu `offerbook.md`** (moeda BRL).
2. **Anote dois números AGORA** (vão pro `PAINEL-DA-SEMANA.yaml` na Aula 3):
   - `ticket:` o preço que você acabou de definir;
   - `margem_pct:` quanto do ticket é seu de verdade, **em %** (tire taxa da Hotmart, coprodução, custo de entrega).
3. Contexto de mercado (referência, não regra): ticket na casa de ~R$300 costuma trazer 60–70% das vendas **no cartão**; tickets muito baixos concentram Pix — e Pix não parcela nem retenta cobrança, o que trava escala. O SEU ticket continua sendo o do offerbook.
4. O checkout da Hotmart já vem pronto: aceita **Pix, cartão e boleto**, com antifraude próprio — você não configura gateway nenhum.

## Passo 3 — Enviar pra análise (e o que esperar)

1. Finalize o cadastro → o produto vai pra **análise da Hotmart**.
2. Prazo típico pra produto digital: **~15 minutos a 1 dia útil** (Central de Ajuda). Casos com pendência de dados podem levar dias (erro K2).
3. Enquanto espera: o **link de checkout já é gerado**, mas **só funciona depois da aprovação** — não saia anunciando um link morto.

## Passo 4 — Pegar o link do checkout

1. Produto aprovado → na página do produto, ache a área de **links/divulgação** (o link direto de pagamento tem o formato `https://pay.hotmart.com/XXXXXXXX`).
2. **Guarde esse link** — é o destino do seu anúncio, SEMPRE com o `sck` pendurado: `https://pay.hotmart.com/XXXXXXXX?sck=meta-c1-frio` ([guia-hotmart](guia-hotmart.md), passo 3).

## Precisa ser Hotmart? NÃO — as outras possibilidades (escolha com critério, não por inércia)

O método precisa de 4 coisas de QUALQUER checkout: (1) um link público de pagamento; (2) onde plugar pixel + CAPI; (3) um jeito de rastrear a origem da venda (sck/UTM); (4) ticket e margem conhecidos. Qualquer plataforma que entregue isso serve — o que muda é ONDE você clica, não o método.

| Possibilidade | Pra quem faz sentido | O que muda na prática |
|---|---|---|
| **Hotmart** (o exemplo deste guia) | infoproduto BR; quer o caixa aparecendo direto no painel da Aula 4 | nada — é o caminho documentado de ponta a ponta |
| **Kiwify · Eduzz · Monetizze · Hubla** | infoproduto BR; você já usa/prefere uma delas (taxas, área de membros, afiliados) | pouquíssimo: todas têm Pix/cartão/boleto, pixel+CAPI nas configurações do produto e UTM no link (a cobertura de UTM da Kiwify é destaque). O painel da Aula 4 lê nativamente a Hotmart — nas outras, o caixa você confere na própria plataforma; TODO o resto do método é igual |
| **Stripe (Payment Links)** | venda internacional/em outra moeda, ou você já vive no ecossistema Stripe | cria link de pagamento sem programar; aceita cartão e **Pix no Brasil** (precisa habilitar). ⚠️ Limites honestos (docs oficiais, 22/07): **sem parcelamento no cartão no BR**, sem afiliados nem área de membros — a entrega do produto vira responsabilidade sua; rastreio = UTM no link |
| **Mercado Pago, Asaas e afins** | quem precisa de link de pagamento BR genérico (serviço, negócio local) | mesmos 4 requisitos; confira onde plugar o pixel antes de decidir |

Escolheu outra que não a Hotmart? Use este guia como MODELO e peça na conversa: *"me guie pra cadastrar produto e pegar o link de checkout na [plataforma X], seguindo a mesma lógica do guia-produto-e-checkout"* — a IA acha os menus da sua tela ([guia-como-ser-guiado](../01-pre-requisitos/guia-como-ser-guiado.md)).

## Teste de sucesso

Abra o link `pay.hotmart.com/...` **em janela anônima**: a página de pagamento carrega com o nome e o preço CERTOS do seu produto, oferecendo cartão/Pix/boleto. Carregou = existe checkout; a cadeia da Aula 3 pode começar. *(Não precisa comprar — o disparo de eventos você testa no [guia-pixel-capi](guia-pixel-capi.md).)*

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **K1** | Produto **reprovado** na análise | conteúdo fora das políticas, descrição vaga, produto sem entrega clara | leia o e-mail da Hotmart com o motivo → ajuste (descrição honesta, entrega funcionando) → reenvie; promessa de renda/cura é reprovação na certa (mesma regra dos anúncios) |
| **K2** | **"Em análise" há dias** | pendência de cadastro (dados pessoais/financeiros incompletos) ou fila | 1) confira se TODOS os dados da conta estão completos (perfil, documento, recebimento); 2) passou de ~3 dias úteis → suporte da Hotmart com o ID do produto |
| **K3** | Link `pay.hotmart.com` dá **erro/página não encontrada** | produto ainda não aprovado, ou checkout desativado na configuração | espere a aprovação (passo 3); confira nas configurações do produto se a venda está ATIVA |
| **K4** | Não sabe que **preço** colocar | a decisão não é do checkout — é da oferta | o ticket vem do `offerbook.md` (Aula 1); se ele ficou vago aí, volte lá e resolva a lacuna ANTES de anunciar (insumo ruim = funil ruim) |
| **K5** | `margem_pct` — "escrevo R$ ou %?" | o campo do Painel é **percentual** | margem em **%** (ex.: ticket R$297, sobra R$208 → `margem_pct: 70`), nunca em reais — o diagnosticador calcula o `roas_break_even` com isso |
| **K6** | Upsell "one-click" não aparece pro comprador | o one-click da Hotmart **só carrega pra quem pagou no cartão** — quem pagou em Pix/boleto vai pra um checkout novo | comportamento da plataforma, não defeito seu (referência de mercado); assunto de backend/upsell fica pra skill `/backend-funil` |
| **K7** | "Minha plataforma NÃO é a Hotmart e as telas não batem" | o guia usa a Hotmart como exemplo — a sua tem os mesmos blocos com outros nomes | seção "Precisa ser Hotmart? NÃO" acima: confira os 4 requisitos e peça pra IA te guiar na tela da SUA plataforma |

> Fora do catálogo? Print + "estou preso cadastrando o produto na Hotmart, pesquise" na conversa — a Central de Ajuda oficial é `help.hotmart.com`.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | anote `ticket` e `margem_pct` num lugar que você ache depois — o Painel da Semana vai pedir os dois |
| 📖 Ler | próximos da cadeia: [guia-pixel-capi.md](guia-pixel-capi.md) (plugar o rastreamento neste checkout) → [guia-hotmart.md](guia-hotmart.md) (ler as vendas) |
| 🚑 Se travar | o catálogo K1–K6 acima (reprovação, análise eterna, link morto...) |
