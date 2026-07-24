# GUIA QUANTO CUSTA — a tabela honesta do que é grátis e do que gasta

> **Estou perdido em:** "tenho medo de ser cobrado sem perceber / quanto vou gastar pra rodar esse curso inteiro?"
> **O que você vai ter no final:** a conta exata de cada peça (IA, Apify, página, domínio, Hotmart, Meta) — o que é R$0, o que é opcional e o ÚNICO passo que gasta dinheiro de verdade. Ansiedade de custo resolvida em 5 minutos de leitura.
> **Fontes cruzadas:** verificação no código real (`estruturador/SKILL.md`: "TUDO CRIADO EM PAUSED — nada está gastando"; upload ≠ publicação) · `_interno`: varredura dos 3 motores de criativo (grátis vs pago) e plano de demo sem verba · referências de mercado reescritas (verba de teste, CPA-alvo, stack) · a ansiedade REAL registrada nas 4 aulas ("deixe um pouco de Token pra terça", "medo de acabar meus créditos").

## Pré-requisitos (confira ANTES)

**Nenhum — este é um guia de entrada.** Leia antes de criar qualquer conta; volte sempre que bater o medo de "isso vai me cobrar?".

## A tabela honesta (peça por peça)

| Peça | Custa? | Detalhe |
|---|---|---|
| **Claude (o plano que você já tem)** | já pago — mas os **tokens são FINITOS** | cada conversa consome cota que renova por período; veja "Os tokens da IA" abaixo |
| **Apify** (coleta da Aula 1) | **R$0** | plano Free = US$5 de crédito/mês, **sem cartão**; estourou, a skill avisa e cai no modo manual; renova mês seguinte |
| **Publicar a página** (Vercel) | **R$0** | o subdomínio `*.vercel.app` serve pra TODO o curso ([guia-publicar-pagina](../03-conexoes-e-apis/guia-publicar-pagina.md)) |
| **Domínio próprio** | opcional, ~**R$40/ano** | só quando for "pra valer" (registro.br); teste não precisa |
| **Hotmart** | **R$0** pra ter produto | ela cobra **taxa por venda** — sem venda, sem custo |
| **Meta: criar tudo** (BM, conta, app, token, pixel, campanha PAUSADA) | **R$0** | cadastrar o cartão é grátis; **campanha PAUSADA não gasta NADA**; upload de criativo ≠ publicação |
| **Meta: campanha ATIVA** | **R$30/dia × 7 dias = R$210** | o ÚNICO gasto real do método — e é DECISÃO SUA (Gate 3) |
| **ChatGPT/Codex** | opcional (assinatura) | SÓ se quiser a `/ads-creative-factory` (imagens por IA); o caminho grátis de criativos cobre o curso inteiro |

**Resumo:** dá pra executar TUDO — até ver a campanha montada no Gerenciador — por **R$0**. O curso inteiro com uma campanha real no ar: **R$210** (+R$40/ano se quiser domínio).

## O único passo que gasta (e os 3 cintos de segurança)

O `/estruturador` cria a campanha em 3 gates: dry-run (R$0) → criar **TUDO PAUSADO** (R$0) → **ativar** (Gate 3 — só este gasta, e só com a sua confirmação explícita).
1. **PAUSED não gasta.** Você pode criar, olhar no Gerenciador, mostrar pra alguém e apagar — custo zero.
2. **Cartão cadastrado ≠ cartão cobrado.** Só cobra quando anúncio RODA.
3. **Cinto extra:** defina o **limite de gastos da conta** (Configurações de pagamento → teto baixo, ex.: R$25) — nem um erro humano passa disso. Suba o teto só quando for ativar de verdade.

## Os tokens da IA (o custo invisível que pega todo mundo)

- O plano do Claude tem **cota finita** que renova por período — dá pra "gastar tudo" num dia de uso pesado (aconteceu em aula: "deixe um pouco de Token pra terça").
- **3 hábitos que economizam:** feche conversas longas e abra novas (o progresso está nos ARQUIVOS, não no chat); confira o **modelo** selecionado (modelo mais pesado consome mais); `Shift+Tab` alterna o modo de execução — em modo automático a IA trabalha mais por conta própria (mais consumo de uma vez, menos idas e vindas).
- Planeje a semana: se o PS é terça, não zere a cota na segunda.
- Atualização de projeto NUNCA deve custar meia hora de tokens: é `git pull` ([guia-atualizar-projeto](../01-pre-requisitos/guia-atualizar-projeto.md), erro U3).

## O que o mercado gasta (pra você se situar — referência, não meta)

- Verba de teste de mercado: R$100–150/dia, ou 0,5–1× o valor do ticket por dia por conjunto. O método usa **R$30/dia** — é o mínimo que gera sinal; profissional testa com mais. Não é "errado" — é a roda de treino.
- **CPA-alvo ≈ metade da sua margem** por venda; infoproduto costuma mirar **ROAS ≥ 1,5**.
- **ROAS ≠ ROI**: ROAS 2 pode ainda ser prejuízo — a conta fecha na MARGEM ([guia-conceitos](guia-conceitos-trafego.md)).
- Stack "do zero" de mercado sai ~R$400 (hospedagem paga + ferramenta de funil + teste); o nosso é mais barato porque página e funil saem das skills e a hospedagem é grátis.

## Teste de sucesso (autoavaliação de 30 segundos)

Responda de cabeça: (1) Criar campanha e deixar PAUSADA custa quanto? (2) Qual é o único gate que gasta? (3) Quanto custa o ciclo completo de 7 dias do método? (4) O Apify pede cartão? *(R$0 · Gate 3 · R$210 · não.)* Errou alguma? Releia a tabela — 2 min.

## POSSÍVEIS ERROS — catálogo (as ansiedades clássicas)

| # | Sintoma | Causa | O que fazer |
|---|---|---|---|
| Q1 | "Acho que estou sendo COBRADO sem saber" | quase sempre não está: PAUSED não gasta; cadastro de cartão não cobra | Gerenciador → confira o toggle (cinza = pausado = R$0) → Configurações de pagamento → veja o histórico de cobranças (vazio = nada foi gasto) → defina o teto (cinto 3) |
| Q2 | **Tokens do Claude acabaram** no meio do trabalho | cota do período consumida (conversas longas, modelo pesado) | feche a conversa e abra nova; confira o modelo; espere o reset da cota; nos dias de PS, trabalhe pesado DEPOIS do encontro |
| Q3 | Medo de estourar a **cota do Apify** | os US$5/mês acabam mesmo com muita coleta | a skill AVISA e cai no modo manual (você cola o material) — nada é cobrado; renova mês seguinte |
| Q4 | "Preciso comprar domínio AGORA?" | não — ansiedade de completude | teste tudo no `*.vercel.app`; compre (~R$40/ano) só quando for rodar pra valer |
| Q5 | "Preciso assinar o ChatGPT pro curso?" | não — só a creative factory (opcional) exige | o caminho grátis (`/criativos-funil`) cobre o método; a factory é upgrade, não requisito |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | defina o limite de gastos da conta Meta (cinto 3) assim que cadastrar o cartão — 1 min que compra paz |
| 📖 Ler | [guia-conceitos-trafego.md](guia-conceitos-trafego.md) (o vocabulário) → depois a cadeia da sua etapa no [roteador](../README.md) |
| 🚑 Se travar | o catálogo Q1–Q5 acima (cobrança fantasma, tokens, cota do Apify...) |
