# Tutorial — conectar a Hotmart (vendas reais / caixa)

Conectar a Hotmart faz o painel deixar de mostrar só o **ROAS estimado da Meta** (atribuição) e passar a mostrar o **caixa real** — quanto entrou de fato — atribuindo cada venda à campanha que a gerou.

> **Precisa de ajuda?** Rode `/analista-de-dados`, escolha "conectar plataforma de vendas", e a skill caminha com você por cada passo abaixo. Sem conectar, o painel continua funcionando — só sem a seção de Vendas.

O que você vai preencher no `.env` (na raiz do projeto):

| Variável | O que é |
|---|---|
| `HOTMART_CLIENT_ID` | O identificador da sua credencial de desenvolvedor. |
| `HOTMART_CLIENT_SECRET` | A "senha" da credencial. |
| `HOTMART_BASIC` | Opcional — derivado automaticamente do ID+Secret; só preencha se a Hotmart te der um valor pronto. |

---

## Passo 1 — Gerar a credencial de desenvolvedor

1. Acesse a Hotmart e vá em **Ferramentas → Credenciais de Desenvolvedor** (Developer Credentials).
2. Clique em **Criar credencial** (ou "Nova credencial"), dê um nome (ex.: "Painel Tráfego").
3. Copie o **Client ID** e o **Client Secret** que aparecem.
4. Cole no `.env`:
   - `HOTMART_CLIENT_ID=...`
   - `HOTMART_CLIENT_SECRET=...`
5. Salve o `.env` e me diga **"pronto"** — eu valido a conexão sem nunca ver os valores.

## Passo 2 — Rastreamento (para a atribuição funcionar melhor)

O painel atribui cada venda a uma campanha por uma **cascata de confiança**:

1. **UTM / SCK / SRC (o ideal — atribuição "Real"):** a Hotmart repassa, no objeto `origin` da venda, os campos **`sck`**, **`src`** e **`xcode`**, além de UTMs quando presentes. Se você colocar o **ID (ou o nome) da campanha da Meta** dentro do parâmetro **SCK** (ou de uma UTM) no link do anúncio, a venda casa exatamente com a campanha. É o padrão de mercado no Brasil.
2. **Nome do produto (fallback — "Estimado"):** quando não há rastreio, mas a campanha aponta para um produto específico.
3. **Janela temporal (último recurso — "Estimado"):** associa a venda à campanha que estava ativa antes dela. Funciona sem UTM (cobre "dark social"), mas é correlação, não causação — por isso sai marcada como estimada, nunca como Real.

> **Regra de ouro:** venda rastreada (UTM/SCK) = **Real**; venda por janela temporal = **Estimado**. O painel **nunca soma** as duas como mesma confiança e sempre mostra a **% de vendas rastreadas** — é o jeito honesto de lidar com o "attribution mirage".

## Passo 3 — Checkout integrado com a Meta (recomendado)

Além de ler o caixa, vale confirmar se a **Hotmart já manda as compras para a Meta** (evento `Purchase` via CAPI):

- Na Hotmart: **Ferramentas → Pixel de rastreamento** → escolha enviar por **Conversions API** (ou "ambos") e cole o **access token** gerado no Gerenciador de Eventos da Meta.
- O `/zelador` e o `/analista-de-dados` conferem se há evento `Purchase` **server-side** chegando. Se não houver, o painel usa a atribuição externa (UTM/SCK) que você configurou aqui.
- **Pegadinha do boleto/Pix:** pagamento não imediato dispara `Payment Generated` (não `Purchase`); o `Purchase` só sai quando aprova — e só com a CAPI ligada.

---

## Problemas comuns

**"HOTMART_CLIENT_ID / SECRET ausentes".** As chaves não estão no `.env` (ou o nome está diferente). Confira as linhas `HOTMART_CLIENT_ID=` e `HOTMART_CLIENT_SECRET=`.

**Falha de autenticação (401).** Client ID/Secret errados, ou a credencial foi revogada. Gere de novo em Ferramentas → Credenciais de Desenvolvedor.

**Conectou, mas "0 vendas na janela".** Talvez não haja vendas no período (`--dias`), ou o filtro de status esteja restrito. Rode `node scripts/hotmart-vendas.mjs --dias=90 --debug` para inspecionar.

## Segurança

O `.env` fica fora do git. O conector tem *scrubber*: Client ID/Secret e Basic saem como `[REDACTED]` em qualquer log ou JSON. Se desconfiar de vazamento, revogue a credencial na Hotmart e gere outra.

## Outras plataformas

O conector pronto é o da **Hotmart**. **Kiwify, Eduzz e Monetizze** têm o mesmo padrão (API + webhook com repasse de UTM — a Kiwify tem a melhor cobertura de UTM nativa) e estão como stubs em `scripts/lib/hotmart.mjs` (`PLATAFORMAS`) e no `.env.example`. Me diga qual você usa que eu ativo o conector dela.
