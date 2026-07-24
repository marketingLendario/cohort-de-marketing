# GUIA META FUNDAÇÃO — BM, Página, conta de anúncios e pagamento do ZERO

> **Estou perdido em:** "não tenho nada na Meta ainda (ou não sei se o que tenho serve) e preciso da base pra anunciar".
> **O que você vai ter no final:** Business Manager + Página com Instagram vinculado + conta de anúncios (fuso/moeda certos) + pagamento aceito + domínio verificado (ou pendência anotada) — a fundação que TODAS as etapas seguintes assumem pronta.
> **Fontes cruzadas:** `guias/super-guia-apis-e-ads.md` B.3 (repo) · `aula-03/materiais/guia-app-meta-integracoes.html` (repo, com telas) · checklist do `/zelador` (código) · tutorial externo de criação de app na Meta (verificação de empresa) · pesquisa web 22/07 sobre os bloqueios mais comuns (Account Quality, limites de conta nova, falhas de pagamento) · referências de mercado reescritas (formas de pagamento, limites de novato, acesso vs propriedade).

---

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Você sabe a diferença entre perfil, Página, BM e conta de anúncios | leia [guia-conceitos-trafego.md](../02-conhecimento-minimo/guia-conceitos-trafego.md) → "O mundo das CONTAS" (5 min) |
| 🔑 Conta | **Perfil pessoal do Facebook real e "aquecido"** (foto, amigos, uso normal há meses). ⚠️ O pré-requisito mais subestimado: perfil novo/parado que sai criando BM é o gatilho nº 1 de bloqueio (erro F1) | use o seu perfil de verdade; não crie perfil novo só pra anunciar |
| 🔑 Conta | **2FA ativada no perfil** — menos restrição por "atividade suspeita", verificações mais rápidas | `accountscenter.facebook.com` → Senha e segurança → Autenticação de dois fatores (2 min) |
| 🧰 Itens | Um e-mail comercial seu · (passo 6) um cartão de crédito válido · (passo 7, opcional agora) um domínio próprio | separe antes de começar |

## Passo a passo

### 1. Business Manager
1. Logado no Facebook, abra `business.facebook.com/overview` → **"Criar uma conta"**.
2. Nome do negócio (o real) · seu nome · e-mail comercial → Avançar.
3. **Confirme o e-mail** que a Meta mandar (sem isso o BM fica manco).
4. Guarde o endereço da casa das configurações: `business.facebook.com/settings`. *(Abriu o Business Suite novo, com feed? Engrenagem no canto inferior esquerdo → "Configurações da empresa" — mesma tela.)*

### 2. Página do Facebook
1. Business settings → **Contas → Páginas → Adicionar**.
2. **"Criar uma nova Página"** (nome = a marca, categoria) — ou **"Adicionar uma Página"** existente sua (aprova na hora, você é admin).
3. Capriche o mínimo: logo, capa, descrição. Página vazia anunciando = suspeita pro algoritmo e conversão pior.

### 3. Instagram profissional vinculado
1. No app do Instagram: Configurações → **Tipo de conta → mudar para Profissional (Empresa)** — grátis.
2. Business settings → **Contas → Contas do Instagram → Adicionar** → login.
3. Na Página → Configurações → **Instagram** → conectar.

### 4. Conta de anúncios
1. Business settings → **Contas → Contas de anúncios → Adicionar → "Criar uma nova conta de anúncios"**.
2. Nome · **fuso (GMT-03:00) São Paulo** · **moeda BRL**. ⚠️ **Fuso e moeda NÃO mudam depois** — errou, só criando outra conta.
3. "Será usada para" → **Meu negócio** → Criar.
4. Adicione você mesmo com **"Gerenciar conta de anúncios"**.
5. ⚠️ Conta recém-criada tem **limites de novato por padrão** (nº de contas = 1 até o primeiro pagamento confirmado; teto de gasto diário baixo no começo). É normal — os limites sobem sozinhos com histórico de pagamento (erro F4).

### 5. Verificação de Empresa (recomendada — destrava quase tudo)
1. Business settings → **Central de Segurança → Verificação da empresa**.
2. Hoje é simples: sobe o **CNPJ** (aceita **MEI**) → a Meta cruza com os dados públicos → pode **ligar no telefone cadastrado no CNPJ** com um código.
3. Prazo: **1 a alguns dias úteis**. Faça AGORA em paralelo — é o destravador dos erros F1, F2 e do Usuário do Sistema em BM novo.

### 6. Forma de pagamento
1. Business settings → **Pagamentos** (ou Ads Manager → engrenagem → Configurações de pagamento) → selecione a conta → **"Adicionar forma de pagamento"**.
2. Brasil: **cartão de crédito** (pós-pago — o recomendado). Boleto/Pix (pré-pago) existe, mas ⚠️ **evite como forma principal**: se a conta for bloqueada (comum em conta nova — erro F1), o saldo pré-pago **fica preso** até a análise resolver; no cartão pós-pago não há dinheiro parado (referência de mercado). Use o pré-pago só como plano B do erro F5.
3. **Prova de sucesso:** a tela de pagamentos **sem nenhum aviso vermelho**.

### 7. Verificar o domínio (pode ficar pra depois — anote a pendência)
1. Business settings → **Segurança da marca → Domínios → Adicionar** → digite o domínio.
2. Método mais simples: **DNS TXT** — copie o `facebook-domain-verification=...`, crie um registro TXT no painel do seu provedor (registro.br etc.), espere minutos–horas → **Verificar**.
3. Sem domínio próprio ainda? Siga sem — o checkout Hotmart usa o domínio deles; o `/zelador` marca como pendência (PARCIAL, não bloqueia).

## Teste de sucesso

Checklist final — tudo precisa estar ✅:
- [ ] `business.facebook.com/settings` abre com o SEU negócio no topo
- [ ] Página com logo + Instagram profissional vinculado
- [ ] Conta de anúncios ativa, fuso São Paulo, moeda BRL
- [ ] Pagamentos **sem aviso vermelho**
- [ ] Verificação de Empresa enviada (ou aprovada)
- [ ] Domínio verificado OU pendência anotada
Se já tiver o token (próximo guia): `node scripts/zelador-audit.mjs --json` confirma BM/conta/pagamento pela API.

---

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **F1** | **Conta de anúncios DESATIVADA logo após criar** (às vezes em minutos, antes de qualquer anúncio) — o bloqueio mais comum de novato | algoritmo antifraude: perfil novo/parado, login de local incomum, dados/pagamento não verificados | 1) NÃO crie outra conta (piora — vira padrão de evasão); 2) abra o **Account Quality** (`facebook.com/accountquality`) → leia o motivo exato → botão **"Solicitar análise"**; 3) complete a **verificação de identidade** se pedida (documento; ~48 h, às vezes até 1 semana); 4) ative **2FA**; 5) enquanto espera, adiante a **Verificação de Empresa** (passo 5); 6) aprovou → comece com verba baixa e constante (nada de R$500/dia no dia 1) |
| **F2** | **"Você atingiu o limite do número de negócios que pode criar"** ao criar o BM | a Meta limita quantos BMs um perfil cria (referência de mercado: normalmente ~2 por perfil; perfis novos, menos) | 1) NÃO precisa de BM novo: **use um existente** a que você tenha acesso (adicione sua Página/IG a ele); 2) faça a Verificação de Empresa no perfil — sobe o limite; 3) alternativa: outro admin de confiança cria o BM e te adiciona como admin |
| **F3** | **"Limite de contas de anúncios atingido"** dentro do BM | todo anunciante começa com direito a **1 conta de anúncios até o primeiro pagamento CONFIRMADO** | 1) use a conta que já existe e rode um gasto real pequeno; 2) após pagamentos confirmados + Verificação de Empresa, o limite sobe (business settings → Informações da empresa mostra o seu teto) |
| **F4** | Campanha limitada a **gasto diário baixo** ("limite de gastos da conta") | teto padrão de conta nova (faixa típica de mercado: ~R$50/dia), sobe com histórico | pague as primeiras faturas em dia; o teto sobe sozinho em dias/semanas; confira em Configurações de pagamento → Limite de gastos da conta |
| **F5** | **Pagamento recusado / "falha no pagamento"** | banco bloqueou (antifraude), limite do cartão, dados desatualizados, cartão não habilitado pra compra internacional/online | 1) Configurações de pagamento → confira/atualize o cartão; 2) ligue no banco e **autorize "Facebook/Meta Ads"** (compra recorrente internacional); 3) tente outro cartão ou o pré-pago (boleto/Pix); 4) conta desabilitada por dívida → quite o saldo devedor na mesma tela e ela reativa |
| **F6** | Errou **fuso ou moeda** da conta | esses dois campos são imutáveis | crie uma NOVA conta de anúncios certa (dentro do mesmo BM, se o limite F3 permitir) e arquive a errada — não há conserto |
| **F7** | **Instagram não vincula** à Página | conta pessoal (não Profissional), ou já vinculada a outra Página | 1) mude para Profissional no app; 2) desvincule da Página antiga (Instagram → Configurações → Central de Contas) e vincule na certa |
| **F8** | **Domínio não verifica** (TXT não "pega") | DNS demora a propagar; registro TXT no lugar errado | 1) espere até 24–48 h; 2) confira que o TXT está no domínio RAIZ (sem `www`); 3) teste a propagação em `dnschecker.org`; 4) alternativa: método da meta-tag no HTML da home |
| **F9** | Verificação de Empresa **recusada** | dados do CNPJ divergem do nome/endereço no BM | iguale o nome legal e endereço do BM aos do CNPJ (business settings → Informações da empresa) e reenvie; MEI é aceito |
| **F10** | "Você não tem permissão" dentro do BM de OUTRO (agência/cliente te deu acesso) | os "poderes" recebidos podem ser parciais (ex.: só analista da conta, sem acesso ao BM ou às Páginas) | business settings → Usuários → veja SEU papel em cada ativo; peça ao dono exatamente o que falta ("me dá Gerenciar conta de anúncios na conta X e acesso ao app Y"); pra APRENDER sem risco: monte a fundação própria deste guia em paralelo. E quando VOCÊ for o dono: gestor/agência recebe **ACESSO, nunca propriedade** — BM, pixel e Página ficam sempre no SEU nome (referência de mercado) |

> Persistiu algo fora do catálogo? Print da tela + "estou preso aqui, pesquise o que fazer" no Claude/Codex — e registre o caso pra virar erro novo deste guia.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | dispare JÁ a Verificação de Empresa (passo 5) se ainda não fez — ela roda em paralelo (1+ dias) e destrava o próximo guia |
| 📖 Ler | **[guia-meta-api.md](guia-meta-api.md)** (app + System User + token). Depois, na cadeia: [guia-pixel-capi](guia-pixel-capi.md) → [guia-criativos](../04-operacao/guia-criativos.md) → [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) |
| 🚑 Se travar | o catálogo F1–F10 acima (conta desativada, limite de BM, pagamento recusado...) |
