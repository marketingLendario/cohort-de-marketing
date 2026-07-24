# GUIA HOTMART — as vendas REAIS (caixa) entrando no seu painel

> **Estou perdido em:** "como ligo a Hotmart no projeto pra ver as vendas de verdade / deu 401 / a venda não aparece na campanha certa".
> **O que você vai ter no final:** credenciais da Hotmart no `.env`, o link do anúncio com o `sck` certo e o teste respondendo — o painel da Aula 4 deixa de mostrar só o ROAS Estimado da Meta e passa a mostrar o **caixa real**, venda a venda.
> **Fontes cruzadas:** `aula-04/docs/tutorial-hotmart.md` + super-guia B.7 + `aula-03/materiais/manual-trackeamento.html` (repo) · `scripts/hotmart-vendas.mjs` e `scripts/lib/hotmart.mjs` (código real) · docs oficiais da Hotmart (Central de Ajuda "Como utilizo as APIs" + developers.hotmart.com, consultadas 22/07) · erros já registrados (401, menu de afiliado, sck sanitizado).
> **O que este guia NÃO cobre:** pixel/CAPI no checkout — isso é o [guia-pixel-capi](guia-pixel-capi.md) (Passo 3 de lá). Aqui é a LEITURA do caixa + o rastreio do link.
> **Usa outra plataforma (Kiwify, Eduzz, Monetizze, Hubla, Stripe...)?** Você NÃO está preso à Hotmart: veja a seção "Precisa ser Hotmart? NÃO" do [guia-produto-e-checkout](guia-produto-e-checkout.md) — este guia continua servindo de MODELO (credencial + rastreio no link é a mesma lógica em todas; o caixa você confere na sua plataforma).

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🔑 Conta | Conta Hotmart de **Produtor** (dona do produto) — a área de credenciais é exclusiva de Produtor | afiliado não vê o menu (erro M2); crie o produto próprio no [guia-produto-e-checkout](guia-produto-e-checkout.md) |
| 📄 Artefato | Produto cadastrado com checkout ativo (link `pay.hotmart.com/...`) | siga [guia-produto-e-checkout.md](guia-produto-e-checkout.md) |
| 🧰 Ferramenta | Projeto no terminal com `.env` criado | [guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md) |
| 📖 Conhecimento | O que é `sck` e por que venda "gruda" em campanha | [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) → "sck (Hotmart)" (1 min) |

## Passo 1 — Gerar a credencial de desenvolvedor (5 min)

1. Login em `app.hotmart.com` **com a conta de Produtor**.
2. Menu lateral → **Ferramentas**. ⚠️ Variações de tela: o item pode se chamar **"Credenciais"** dentro de Ferramentas, ou **"Credenciais de Desenvolvedor"** (Developer Credentials). Não achou? Use a **lupa de busca** do topo e digite "credenciais".
3. **"Criar credencial"** (ou "Nova credencial") → nome identificável: `Painel Trafego`.
4. ⚠️ Se aparecer a opção **"Sandbox"**: **NÃO marque** — sandbox é ambiente de teste com dados falsos; queremos as vendas reais (erro M7).
5. **Criar** → copie na hora: **Client ID**, **Client Secret** e, se exibido, o **Basic** (opcional). Perdeu? Sem drama: gere outra credencial — é rápido e o painel não se importa.

## Passo 2 — Colar no `.env`

```
HOTMART_CLIENT_ID=seu_client_id
HOTMART_CLIENT_SECRET=seu_client_secret
HOTMART_BASIC=        ← só se a tela mostrou; vazio o script deriva sozinho
```
Regras de sempre: sem espaços em volta do `=`, sem aspas, uma linha por chave ([guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md)).

## Passo 3 — O `sck` no link do anúncio (o truque do ROAS "Real")

O painel atribui cada venda a uma campanha por uma **cascata de confiança** (é assim que o código decide):
1. **`sck`/UTM no link = atribuição "Real"** — a Hotmart devolve o `sck` junto com a venda, e o painel casa venda ↔ campanha exatamente;
2. sem rastreio, cai pra **nome do produto** ("Estimado");
3. último recurso: **janela temporal** ("Estimado" — correlação, não causação).

Como montar o link do anúncio (exemplo literal):
```
https://pay.hotmart.com/A12345678B?sck=meta-c1-frio
```
**Regras do `sck`** (do manual de trackeamento do repo): máx. **30 caracteres** · só letras, números, hífen e pipe (`a-z A-Z 0-9 - |`) · **underscore é PROIBIDO** (o sanitizador converte `_` em `-` e o casamento quebra). Use `meta-c1-frio`, nunca `meta_c1_frio`.

## Teste de sucesso

```
node scripts/hotmart-vendas.mjs --dias=90 --debug
```
Responde listando vendas — e **"0 vendas na janela" também é sucesso** (provou que conectou; só não há venda no período). O fracasso tem cara própria: `401` (credencial errada — M1) ou `CLIENT_ID ausente` (linha do `.env` errada — M6). No painel completo: a seção Vendas mostra a **% de vendas rastreadas** — quanto mais alto, melhor o seu `sck`.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **M1** | **`401` / falha de autenticação** | Client ID/Secret errados, credencial revogada, ou criada em ambiente errado (sandbox) | 1) confira se copiou os valores inteiros, sem espaço; 2) gere uma credencial NOVA (Ferramentas → Credenciais) sem marcar Sandbox e troque no `.env`; 3) rode o teste de novo |
| **M2** | O menu **Credenciais não aparece** pra você | sua conta é de **Afiliado** — a área é exclusiva do Produtor | 1) se o produto é seu, entre com a conta que é DONA do produto; 2) se você é só afiliado: pule este guia — o painel funciona sem o caixa (tudo fica Estimado) e o resto do método não muda |
| **M3** | Conectou mas **"0 vendas na janela"** o tempo todo | não há vendas no período consultado, ou você esperava vendas de OUTRA conta | aumente a janela (`--dias=180`); confira que a credencial é da conta que recebe as vendas |
| **M4** | Venda aparece no painel mas **sem campanha** (tudo Estimado) | o link do anúncio foi publicado SEM `sck`/UTM | corrija o link na próxima campanha (passo 3); as vendas antigas não ganham rastreio retroativo — é assim mesmo |
| **M5** | O `sck` que chegou está **diferente** do que você colou | tinha underscore/caractere inválido — o sanitizador converteu | monte o `sck` já dentro das regras (30 chars, `-` no lugar de `_`) e atualize o link do anúncio |
| **M6** | **"CLIENT_ID ausente"** no teste | o nome da linha no `.env` não é exatamente `HOTMART_CLIENT_ID` | confira o nome literal das 2 linhas; sem espaços antes do `=` |
| **M7** | Credencial criada mas números estranhos/zerados | credencial **Sandbox** (ambiente de teste) | apague e crie outra SEM marcar sandbox |

> Persistiu? Print da tela + a saída do comando + "pesquise este erro da API da Hotmart" na conversa (a doc oficial vive em `developers.hotmart.com`).

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | monte o link do seu anúncio com o `sck` (passo 3) — é ele que transforma ROAS Estimado em Real |
| 📖 Ler | ainda sem pixel/CAPI no checkout? [guia-pixel-capi.md](guia-pixel-capi.md) (Passo 3) · tudo conectado? [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) |
| 🚑 Se travar | o catálogo M1–M7 acima (401, menu invisível, sck sanitizado...) |
