# SUPER GUIA — Todas as APIs e a Operação de Ads, passo a passo para novato completo

> Companion do `mapa-guiado-do-projeto.md`. Este guia NÃO assume nada: cada chave de API do `.env` e cada etapa da Aula 3 (ads) explicada do zero, clique a clique, sem pulos lógicos.
> Regra de leitura: siga na ordem. Se um passo falhar, pare nele e use o bloco "Se der errado" — não pule pra frente.
> Aviso honesto: a Meta muda nomes de menu com frequência. Se um botão não estiver com o nome exato daqui, procure o nome mais parecido ou use a lupa de busca da página — o caminho lógico continua o mesmo.

---

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Os termos básicos (BM, pixel, CAPI, token, campanha/conjunto/anúncio) | leia [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) (15 min) — este super-guia explica o COMO; o conceitos explica o O QUÊ |
| 🧰 Ferramenta | Projeto clonado + terminal abrindo NA pasta do projeto | [guia-atualizar-projeto](../01-pre-requisitos/guia-atualizar-projeto.md) (e o GUIA-DO-ALUNO Parte 0 se nunca clonou) |
| 🔑 Conta | Perfil do Facebook real e aquecido (pras Partes B.3+ da Meta) | detalhes em [guia-meta-fundacao](guia-meta-fundacao.md) |
| 📄 Artefato | Nenhum pra começar — as chaves vêm ANTES dos artefatos | — |

## PARTE A — Fundamentos absolutos (leia antes de qualquer chave)

### A.1 O que é uma API e uma "chave"
- **API** = a porta de serviço de um site. Em vez de você clicar na tela, um programa entra por essa porta e pega os dados direto.
- **Chave / token** = a senha dessa porta. É um texto comprido (ex.: `apify_api_x7Kb9...`). Quem tem a chave age em seu nome — trate como senha de banco.
- **Escopo / permissão** = o que aquela chave pode fazer (ex.: `ads_read` = só LER anúncios, sem poder alterar nada).

### A.2 As 4 regras de ouro de toda chave
1. **A chave aparece UMA vez só** na maioria dos sites (Meta, OpenAI, Anthropic, Figma). Copie na hora, cole no `.env`, salve. Se perder: apague a chave no site e gere outra — nunca "procure onde ficou".
2. **Nunca cole a chave em lugar público** (grupo, print, planilha compartilhada). No cohort ela vive num único lugar: o arquivo `.env` na raiz do projeto.
3. **O `.env` nunca sobe pro GitHub** (o `.gitignore` já garante). Se um dia uma chave vazar: revogue no site de origem e gere outra.
4. **Colou errado é o erro nº 1.** Sem espaços antes/depois do `=`, sem aspas, a chave inteira numa linha só. Certo: `APIFY_API_TOKEN=apify_api_abc123`. Errado: `APIFY_API_TOKEN = "apify_api_abc123"`.

### A.3 Como criar e editar o `.env` (uma vez)
1. Abra o terminal na pasta raiz do `cohort-de-marketing` (Windows: abra a pasta no Explorador → clique na barra de endereço → digite `cmd` → Enter).
2. Copie o modelo: Mac/Linux `cp .env.example .env` · Windows `copy .env.example .env`.
3. Abra pra editar: Windows `notepad .env` · Mac `open -e .env` · ou pelo VS Code.
4. **Pegadinha do Windows/Bloco de Notas:** ao salvar, o tipo deve ser "Todos os arquivos" e o nome exatamente `.env` — se virar `.env.txt`, nada funciona. (Pra conferir: no Explorador, Exibir → marque "Extensões de nomes de arquivo".)
5. Jeito mais fácil de todos: rode `/comecar` dentro do Claude Code — ele cria o `.env` e cola as chaves com você, conferindo no final.

### A.4 Como conferir que uma chave foi salva
No terminal, na raiz: `grep -E "NOME_DA_VARIAVEL" .env` (Windows/cmd: `findstr "NOME_DA_VARIAVEL" .env`). Tem que imprimir a linha com a chave. Não imprimiu = não salvou (volte ao A.3).

---

## PARTE B — Cada chave, do zero ao "funcionou"

Ordem de prioridade pro aluno: **B.1 Apify** (Aula 1) → **B.2–B.6 Meta** (Aulas 3–4) → **B.7 Hotmart** (Aula 4, opcional) → **B.8 opcionais**.

---

### B.1 APIFY (`APIFY_API_TOKEN`) — a chave das skills de coleta

**Serve para:** `/espiao-do-concorrente`, `/trend-hunting`, `/conteudo-funil`, `/criativos-funil` coletarem anúncios, Reels e perfis reais.
**Custo:** plano Free = US$ 5 de crédito/mês, **sem cartão**. Dá pra várias coletas de estudo por mês.
**Pré-requisito:** um e-mail seu.

**Passo a passo:**
1. Abra `https://console.apify.com/sign-up`.
2. Crie a conta: "Sign up with Google" (mais fácil) ou e-mail + senha. Com e-mail, o Apify manda um **link de verificação** — abra seu e-mail e clique nele antes de continuar.
3. Se aparecer um questionário de boas-vindas ("what do you want to do?"), responda qualquer opção ou pule — não afeta nada.
4. Você cai no **Console** do Apify. No menu lateral esquerdo, desça até **Settings** (ícone de engrenagem, canto inferior esquerdo).
5. Dentro de Settings, procure a aba **"API & Integrations"** (em alguns layouts aparece como **"Integrations"** com sub-item **"API tokens"** — é a mesma tela).
6. Ali está o **Personal API token** — um texto começando com `apify_api_`. Clique no ícone de **copiar** (dois quadradinhos) ao lado dele.
7. Cole no `.env`, na linha `APIFY_API_TOKEN=` (imediatamente após o `=`, sem espaço). Salve o arquivo.
8. **Confira:** `grep -E "APIFY_API_(TOKEN|KEY)" .env` deve imprimir a linha.

**Se der errado:**
- Não acha "Settings"? É o último item do menu lateral esquerdo, embaixo do seu avatar.
- Estourou os US$ 5 do mês? A skill avisa e cai no modo manual (você cola o material); a cota renova no mês seguinte.
- O nome `APIFY_API_KEY` também é aceito pelas skills — mas use `APIFY_API_TOKEN`, o oficial.
- **Boa notícia (diferente da Meta/Hotmart):** o token do Apify **fica sempre visível** na tela de Settings — perdeu, é só voltar lá e copiar de novo. E não há aprovação nem espera: a chave funciona no segundo em que a conta existe.

---

### B.2 META — o mapa dos 3 tokens (leia antes de pegar qualquer um)

A Meta tem **três tokens diferentes** neste projeto. Não confunda:

| Token | Variável | Serve para | Quando pegar |
|---|---|---|---|
| **Token da conta de anúncios** (System User) | `META_ACCESS_TOKEN` | ler campanhas, métricas, demografia (zelador Modo API + painel da Aula 4) | Aula 3/4 — o principal |
| **Token da Ad Library** | `META_AD_LIBRARY_TOKEN` | o espião puxar anúncios de concorrentes automaticamente | opcional, Aula 1 (tem fallback manual) |
| **Token de página / Instagram** | `META_PAGE_ACCESS_TOKEN` / `META_INSTAGRAM_TOKEN` | engajamento orgânico (comentários, sentimento) na Aula 4 | opcional, avançado |

E antes de qualquer token, você precisa da **fundação** (B.3): conta pessoal → Business Manager → Página → conta de anúncios → pagamento.

---

### B.3 FUNDAÇÃO META — criar BM, Página, conta de anúncios e pagamento (do absoluto zero)

**Isso nenhum doc do curso ensinava — está aqui completo. Sem esta fundação, nada da Aula 3/4 existe.**

**B.3.1 — Conta pessoal do Facebook**
Você precisa de um perfil pessoal real e "aquecido" (com foto, amigos, uso normal). Perfil recém-criado só pra anúncios = alto risco de bloqueio automático. Se não tem: `facebook.com` → "Criar nova conta" → use seus dados reais → confirme e-mail/telefone → use normalmente por alguns dias antes de anunciar.

**B.3.2 — Criar o Business Manager (Gerenciador de Negócios)**
1. Logado no Facebook, abra `https://business.facebook.com/overview`.
2. Clique em **"Criar uma conta"** (canto superior direito).
3. Preencha: **nome do negócio** (o nome real da sua empresa/projeto), **seu nome**, **e-mail comercial** → **Avançar/Enviar**.
4. Abra o e-mail e **confirme** clicando no link que a Meta mandou.
5. Você cai no painel do BM. Tudo que criaremos a seguir mora aqui: `https://business.facebook.com/settings` (guarde esse endereço — é as "Configurações do negócio").

**B.3.3 — Criar (ou vincular) a Página do Facebook**
A campanha sempre sai em nome de uma Página.
1. Em `business.facebook.com/settings` → menu esquerdo **Contas → Páginas** → botão azul **"Adicionar"**.
2. Escolha: **"Criar uma nova Página"** (se não tem) → nome da Página = nome da marca, categoria do negócio → criar. Ou **"Adicionar uma Página"** (se já existe uma sua) → cole o nome/URL → como você é admin, aprova na hora.
3. Depois, capriche o básico da Página (foto de perfil com o logo, capa, descrição) — anúncio de Página vazia converte pior e levanta suspeita da Meta.

**B.3.4 — Vincular o Instagram (recomendado)**
1. Primeiro, no app do Instagram: Configurações → **"Tipo de conta"** → mude para **Profissional (Empresa)** — é grátis.
2. Em `business.facebook.com/settings` → **Contas → Contas do Instagram** → **"Adicionar"** → faça login no Instagram quando pedir.
3. Vincule o Instagram à Página: na Página do Facebook → Configurações → **Instagram** → conectar.

**B.3.5 — Criar a conta de anúncios**
1. Em `business.facebook.com/settings` → **Contas → Contas de anúncios** → **"Adicionar"** → **"Criar uma nova conta de anúncios"**.
2. Preencha: nome da conta (ex.: "Conta Principal — Sua Marca"), **fuso horário = (GMT-03:00) São Paulo**, **moeda = BRL (Real brasileiro)**. ⚠️ Fuso e moeda **não podem ser trocados depois** — errou, tem que criar outra conta.
3. "Essa conta de anúncios será usada para": **"Meu negócio"** → Criar.
4. Em "Adicionar pessoas": adicione você mesmo com acesso total (**Gerenciar conta de anúncios**).

**B.3.6 — Adicionar a forma de pagamento**
1. Em `business.facebook.com/settings` → **Pagamentos** (menu esquerdo, pode aparecer como "Formas de pagamento") → selecione a conta de anúncios → **"Adicionar forma de pagamento"**.
2. Opções no Brasil: **cartão de crédito** (recomendado — pós-pago). Boleto/Pix (pré-pago: você carrega um saldo antes) existe, mas ⚠️ **evite como forma principal** — conta bloqueada com saldo pré-pago = dinheiro preso até a análise resolver (referência de mercado); detalhes no [guia-meta-fundacao](guia-meta-fundacao.md) passo 6. Preencha e confirme.
3. **Confira que valeu:** abra `https://adsmanager.facebook.com` → ícone de engrenagem → Configurações de pagamento → deve mostrar o cartão/saldo **sem** nenhum aviso vermelho.

**B.3.7 — Verificar o domínio (necessário pro tracking sério)**
1. Você precisa ter um domínio próprio (ex.: `suamarca.com.br` — compra-se em registro.br por ~R$40/ano).
2. Em `business.facebook.com/settings` → **Segurança da marca → Domínios** → **"Adicionar"** → digite o domínio.
3. A Meta oferece 3 métodos. O mais simples é **"Verificação por DNS (TXT)"**: copie o código `facebook-domain-verification=...`, entre no painel do seu provedor de domínio (registro.br, Hostinger, GoDaddy…), crie um **registro TXT** no DNS com esse valor, espere de minutos a algumas horas, volte e clique **"Verificar"**.
4. Ficou verde = verificado. (Sem site próprio ainda? Pule por ora e registre como pendência — venda via Hotmart usa o domínio da Hotmart no checkout.)

**Checklist da fundação (tudo precisa estar ✅ antes da Aula 3):**
- [ ] BM criado e e-mail confirmado
- [ ] Página criada/vinculada, com logo e descrição
- [ ] Instagram profissional vinculado
- [ ] Conta de anúncios criada (fuso São Paulo, moeda BRL)
- [ ] Pagamento adicionado, sem aviso vermelho
- [ ] Domínio verificado (ou pendência anotada)

---

### B.4 META `META_ACCESS_TOKEN` + App — o token principal (System User)

**Serve para:** o `/zelador` auditar a conta pela API e a Aula 4 ler campanhas/métricas/demografia. Só leitura (`ads_read`).
**Pré-requisito:** a fundação B.3 completa.
**Fontes complementares no repo:** guia visual `aula-03/materiais/guia-app-meta-integracoes.html` · tutorial em texto `aula-04/docs/tutorial-token-meta.md`.

> **Antes de começar — como a Meta se comporta (leia isto):** a Meta é conhecida por (a) mudar nomes de menu sem aviso, (b) mostrar telas DIFERENTES pra contas diferentes (o mesmo clique pode abrir assistentes distintos), e (c) demorar pra propagar permissões (minutos) e aprovar verificações (dias). Por isso cada passo abaixo descreve O QUE A TELA FAZ, as variações conhecidas, e o tempo de espera esperado. Se a sua tela não bater com nenhuma variação: use a busca do menu lateral, ou o Prompt 3 do mapa-guiado (a IA acha o caminho com você).

**B.4.1 — Criar a conta de desenvolvedor (primeira vez; 5–10 min)**
1. Abra `https://developers.facebook.com/` **já logado** no Facebook (o mesmo perfil que é admin do seu BM — confira no canto superior direito).
2. Clique em **"Começar" / "Get Started"** (canto superior direito). Se em vez disso você já vê **"Meus apps"**, sua conta de desenvolvedor já existe — pule para B.4.2.
3. O assistente "Create a Meta for Developers account" tem **4 etapas em sequência**, cada uma numa tela:
   - **Registrar**: aceite os termos → Avançar.
   - **Verificar conta**: a Meta pede seu **celular** → envia um **código de 6 dígitos por SMS** → digite o código. Não chegou em 2 min? Botão **"Update Mobile Number"** reenvia. (Se pedir também confirmação de e-mail, chega na hora.)
   - **Informações de contato**: confirme o e-mail.
   - **Sobre você**: selecione a opção mais próxima de "profissional de marketing" ou "dono de negócio" (essa escolha não trava nada depois).
4. Terminou = você cai na home de desenvolvedor. Confirmação de que deu certo: o menu **"Meus apps"** aparece no topo.

**B.4.2 — Criar o app (10 min) — com as DUAS variações de tela**
1. **"Meus apps"** (topo direito) → botão verde **"Criar app"**.
2. **Tela "Requisitos" (se aparecer):** algumas contas veem primeiro um resumo de requisitos ("você precisará de um portfólio empresarial…") → **Avançar**.
3. **Tela de CASOS DE USO** — aqui a Meta mostra cartões clicáveis, e há **duas variações**:
   - **Variação A (mais comum hoje):** cartões como "Autenticar e solicitar dados de usuários", "Interação de WhatsApp", "Gerenciar tudo na sua Página", **"Outro"**. Para o nosso caso (Marketing API / leitura de anúncios): selecione **"Outro"** → **Avançar** → na tela seguinte, "Selecione um tipo de app": escolha **"Negócios" / "Empresa" (Business)** → **Avançar**.
   - **Variação B (contas mais antigas):** vai direto para "Que tipo de app?" com as opções Consumidor / **Empresa** / etc. → escolha **Empresa**.
4. **Tela "Detalhes do app":**
   - **Nome do app**: ex. `Cohort Trafego` — sem acento, sem emoji (nomes com caracteres especiais às vezes são recusados sem explicação). ⚠️ Não use "Facebook", "Meta", "Insta" no nome — é recusado na hora.
   - **E-mail de contato do app**: o seu.
5. **Tela/campo "Portfólio empresarial" (Business Manager)** — ⚠️ **o passo mais importante e mais esquecido**: selecione **o BM da B.3** no seletor. Se você deixar em branco ("Não conectar um portfólio"), o app nasce solto, a Meta pode não enxergar a sua BM verificada depois, e a B.4.4 falha com lista de permissões vazia — retrabalho garantido. **Selecione o BM AGORA.**
6. **"Criar app"** → a Meta pede **sua senha do Facebook** (ou o código do 2FA) pra confirmar → confirme.
7. Você cai no **painel do app** (dashboard). Repare em duas coisas:
   - No topo há um seletor **"Modo do app: Desenvolvimento"** — é o modo certo pra nós; **NÃO** precisa publicar o app ("Ativo") pra ler os SEUS próprios dados. Deixe em Desenvolvimento.
   - Se aparecer um banner **"Acesso à API restrito"** com o botão **"Ver ações necessárias"**: clique e siga (normalmente é só confirmar dados de contato) — isso libera o acesso básico à API.
8. Menu esquerdo → **Configurações → Básico**. Nesta tela:
   - **ID do app**: o número no primeiro campo → copie → `META_APP_ID=` no `.env`.
   - **Chave Secreta do app**: clique **"Mostrar"** (a Meta pede a senha do Facebook de novo) → copie → `META_APP_SECRET=` no `.env`.
   - Os demais campos (domínios, política de privacidade, ícone) **NÃO são necessários** pra leitura dos seus próprios dados — só entram se um dia você for pedir App Review.
9. **Marketing API (opcional, mas recomendado):** no menu esquerdo, procure **"Adicionar produto"** ou, no dashboard, um bloco **"Adicionar casos de uso"**. Se existir **Marketing API** → clique **"Configurar"** (não precisa preencher nada depois — só o ato de adicionar já registra o produto). **Se não aparecer em lugar nenhum: siga em frente sem culpa** — para tokens de System User com `ads_read`, o produto não é pré-requisito; o que destrava os escopos é a B.4.3.
10. **Vincular o app ao BM (só se você errou o passo 5):** `business.facebook.com/settings` → **Contas → Aplicativos** → **"Adicionar" → "Adicionar um ID do app"** → cole o ID do app → adicionar. Agora o app pertence ao BM e a B.4.3 funciona.

**B.4.3 — Criar o Usuário do Sistema (o "usuário robô") — 5 min**
1. Abra `https://business.facebook.com/settings` (Configurações do negócio). ⚠️ **Variação de tela:** se abrir o **Meta Business Suite** (layout novo, feed no meio), clique na **engrenagem (Configurações)** no canto inferior esquerdo → **"Configurações da empresa" / "Business settings"** — os dois caminhos levam à mesma tela clássica com menu lateral.
2. Menu esquerdo → **Usuários → Usuários do sistema**.
3. Botão **"Adicionar"**. Se for o seu **primeiro** usuário do sistema, a Meta pode exibir um aviso pedindo aceite dos termos ou dizendo que o recurso "estará disponível em breve" — nesse caso aguarde alguns minutos/horas e tente de novo (acontece em BMs recém-criados; BM muito novo às vezes precisa de alguns dias de "idade" ou da Verificação de Empresa pra liberar).
4. Preencha: nome `leitor-trafego` → função **Funcionário** (Admin não é necessário pra só ler; menos poder = menos risco) → **Criar usuário do sistema**.

**B.4.4 — ATRIBUIR OS ATIVOS (⚠️ a ordem é OBRIGATÓRIA: ativos ANTES do token)**
A tela do usuário do sistema tem os botões no topo à direita; em alguns layouts ficam atrás do menu **"..." (Mais opções)**.
1. Com `leitor-trafego` selecionado → **"Atribuir ativos"** (ou "..." → "Atribuir ativos").
2. Abre um modal com abas à esquerda. Aba **Apps** → marque `Cohort Trafego` → à direita, ative a chavinha **"Gerenciar app"** (controle total) → **"Salvar alterações"**. ← *É este toggle que destrava os escopos na hora de gerar o token. Sem ele, a tela do token vem com a lista de permissões VAZIA — o erro nº 1 de todo mundo.*
3. Repita **"Atribuir ativos"** → aba **Contas de anúncios** → marque a sua conta → permissão **"Ver desempenho"** (parcial; NÃO precisa "Gerenciar campanhas") → **Salvar alterações**.
4. (Só se for usar o orgânico da Aula 4) repita → aba **Páginas** → sua Página → permissão de leitura ("Ver desempenho da Página") → Salvar.
5. ⏱ **Espere 2–5 minutos** antes do próximo passo — a atribuição propaga com atraso; gerar o token no segundo seguinte às vezes vem sem as permissões.

**B.4.5 — Gerar o token (2 min + atenção total na hora de copiar)**
1. Ainda em Usuários do sistema, `leitor-trafego` selecionado → **"Gerar novo token"** (ou "..." → "Gerar token").
2. Abre o assistente. **Tela 1 — "Selecionar app":** escolha `Cohort Trafego` → Avançar.
3. **Campo "Expiração do token":** as opções típicas são **"60 dias"** e **"Nunca" (never)**. Escolha **"Nunca"** se aparecer (token permanente = não precisa refazer isso a cada 2 meses). Se a sua conta só mostrar "60 dias", tudo bem — anote no calendário pra regenerar.
4. **Lista de permissões (escopos):** marque **somente** `ads_read` ✅ e `business_management` ✅. Não marque escopos de escrita — o método é leitura. ⚠️ Se a lista vier **vazia**: o app não foi atribuído (volte à B.4.4 passo 2) ou você não esperou a propagação (B.4.4 passo 5).
5. **"Gerar token"** → o token aparece **UMA ÚNICA VEZ**, num campo com botão de copiar. **Copie AGORA** → cole em `META_ACCESS_TOKEN=` no `.env` → salve o arquivo → só então feche o modal. Fechou sem copiar? Sem drama: "Gerar novo token" de novo (o anterior continua válido, mas irrecuperável).

**B.4.6 — Descobrir os IDs automaticamente**
Na raiz do projeto: `node scripts/zelador-audit.mjs --gravar-env` — descobre e grava `META_AD_ACCOUNT_ID`, `META_PIXEL_ID`, `META_FACEBOOK_PAGE_ID`, `META_BUSINESS_MANAGER_ID` (o Instagram você pega na mão, B.4.7). Validar sem alterar nada: `node scripts/zelador-audit.mjs --json`.
**Mais de uma conta/pixel/página?** O `--gravar-env` **não grava nada nesse caso** (ele nunca escolhe por você): o relatório lista as opções pra você copiar a linha certa no `.env`. Alternativa só pra contas: `node scripts/painel-trafego-data.mjs --listar-contas`.

**B.4.7 — Plano B: achar cada ID na mão (se o script falhar)**
- **Conta de anúncios:** abra `adsmanager.facebook.com` — o número está na URL (`act=123456...`) e no seletor de conta no topo. Grave como `META_AD_ACCOUNT_ID=123456...` — **só o número, sem o `act_`** (é o padrão que o `--gravar-env` grava; com prefixo também funciona, mas siga o padrão do repo).
- **Pixel:** `business.facebook.com/events_manager2` → Fontes de dados → o número embaixo do nome do pixel → `META_PIXEL_ID=`.
- **Página:** abra a Página → "Sobre" → desça até "ID da Página" (ou em business settings → Contas → Páginas, o número embaixo do nome) → `META_FACEBOOK_PAGE_ID=`.
- **BM:** em `business.facebook.com/settings` → Informações da empresa → "ID do Gerenciador de Negócios" → `META_BUSINESS_MANAGER_ID=`.
- **Instagram:** business settings → Contas → Contas do Instagram → número embaixo do @ → `META_INSTAGRAM_BUSINESS_ACCOUNT_ID=`.

**Teste final (o que prova que TUDO funcionou):** `node scripts/painel-trafego-data.mjs --account` deve responder com `"modo": "api"` e dados de verdade.

**Se der errado:**
- *"Nenhuma permissão disponível" / lista de escopos vazia* ao gerar token → o app não foi atribuído ao usuário do sistema com "Gerenciar app" (B.4.4 passo 2), OU você não escolheu o portfólio empresarial na criação do app (B.4.2 passo 5 — vincule pelo B.4.2 passo 10), OU não esperou a propagação (2–5 min).
- *"(#10) Permission Denied"* na conta → a conta de anúncios não foi atribuída (B.4.4 passo 3); depois de atribuir, aguarde alguns minutos. Nota: mesmo tudo certo, o zelador pode marcar `#10` num item de **pagamento** — é normal com "Ver desempenho" (não vê cobrança); o teste que vale é o `--account` responder `"modo":"api"`.
- *Token expirou em horas* → foi gerado no Graph API Explorer (atalho de teste), não no System User. Refaça pela B.4.5.
- *"Usuários do sistema" não aparece ou pede verificação* → BM muito novo. Faça a **Verificação de Empresa** (business settings → Central de segurança → Verificação da empresa; exige CNPJ/documentos; prazo típico da Meta: de 1 a alguns dias úteis) e tente de novo.

**⏱ Resumo dos tempos de espera da Meta (planeje a aula com isso):**
| Etapa | Tempo típico |
|---|---|
| Código SMS do cadastro de dev | imediato–2 min |
| Criação do app | imediata |
| Propagação de ativos atribuídos ao System User | 2–5 min (às vezes mais) |
| Verificação de identidade (Ad Library) | horas a dias |
| Verificação de Empresa (BM) | 1 a alguns dias úteis |
| App Review (só p/ orgânico em produção) | ~10 dias úteis |

---

### B.5 META `META_AD_LIBRARY_TOKEN` — anúncios dos concorrentes (opcional)

**Serve para:** o `/espiao-do-concorrente` puxar anúncios ativos de qualquer página automaticamente. **Sem ele a skill funciona igual** — abre a Biblioteca de Anúncios pública (`facebook.com/ads/library`) e você cola os textos no chat.

**Pré-requisito pesado (por isso é opcional):** identidade confirmada na Meta — o mesmo processo exigido de quem anuncia política. Passo a passo completo:

1. **Confirmar a identidade (uma vez na vida; 1–3 dias úteis):**
   - Abra `https://www.facebook.com/ID` logado no seu perfil.
   - O fluxo pede: **país de residência** → **upload de foto de um documento oficial com foto** (RG, CNH ou passaporte — foto nítida, sem corte, sem reflexo) → confirmação do endereço em alguns países.
   - Envie e aguarde: a Meta responde por notificação/e-mail em **1 a 3 dias úteis**. ⚠️ Isso significa que este passo **não conclui ao vivo numa aula** — dispare antes.
2. **Aceitar os termos da Ad Library API:** aprovada a identidade, abra `https://www.facebook.com/ads/library/api/` → **"Get Started"** → leia e **aceite os termos**. A página então libera as seções de acesso.
3. **Ter um app** (o mesmo `Cohort Trafego` da B.4 serve — não precisa criar outro). Se a página da Ad Library oferecer "adicionar o produto Ad Library API" ao app, adicione.
4. **Gerar o token** — dois caminhos equivalentes:
   - **Pela própria página da API**: seção **"Tools"/"Ferramentas"** → gerar token de acesso.
   - **Pelo Graph API Explorer** (`developers.facebook.com/tools/explorer`): no painel direito, selecione o app `Cohort Trafego` → **"Generate Access Token"** → login/confirmar → o token aparece no campo. Não precisa marcar escopo especial para a Ad Library.
5. Copie → `META_AD_LIBRARY_TOKEN=` no `.env`.
6. **Teste de sucesso (30 s):** no próprio Graph API Explorer, digite no campo de consulta `ads_archive?search_terms='emagrecimento'&ad_reached_countries=['BR']` → **Enviar**. Voltou uma lista JSON no meio da tela = funcionando. Erro de permissão = identidade ainda não aprovada ou termos não aceitos.

**Se der errado:**
- *"Application does not have permission"* → os termos da Ad Library não foram aceitos com ESTE perfil, ou a identidade ainda está em análise.
- *Token expira rápido* → tokens de usuário duram horas; estenda no **Access Token Debugger** (`developers.facebook.com/tools/debug/accesstoken` → "Estender") para ~60 dias.
- **Recomendação didática:** deixe este por último. O fallback manual (abrir `facebook.com/ads/library`, filtrar por país/anunciante e colar os textos no chat) dá o mesmo resultado analítico, sem nenhum pré-requisito.

---

### B.6 META orgânico — `META_PAGE_ACCESS_TOKEN` e `META_INSTAGRAM_TOKEN` (avançado, opcional)

**Serve para:** a aba Engajamento da Aula 4 (comentários, curtidas, sentimento). **Sem eles o painel funciona** — a aba fica "em breve". É o setup mais chato da Meta ("Caminho A": modo desenvolvedor, sem App Review; validade ~60 dias).

**Facebook (`META_PAGE_ACCESS_TOKEN`):**
1. Pré: você é admin do app E da Página; no app (developers.facebook.com → seu app → **Casos de uso**) existe o caso **"Gerenciar tudo na sua Página"** → botão **Personalizar** → adicione as permissões **`pages_read_engagement`** e **`pages_read_user_content`**.
2. Abra o **Graph API Explorer**: `developers.facebook.com/tools/explorer` → selecione o seu app → **"Get User Access Token"** → marque `pages_read_engagement`, `pages_read_user_content`, `pages_show_list` → **Generate**.
3. Estenda a validade: copie o token → abra o **Access Token Debugger** (`developers.facebook.com/tools/debug/accesstoken`) → cole → **"Estender token de acesso"** (vira ~60 dias) → copie o LONGO.
4. Cole em `META_PAGE_ACCESS_TOKEN=`. Rode `node scripts/painel-trafego-data.mjs --account --perfil` — sucesso = `perfil.disponivel: true`.
5. ⚠️ Limite real e honesto: ler posts/comentários da Página em produção exige **App Review** aprovado pela Meta (semanas). No modo dev funciona só na SUA conta.

**Instagram (`META_INSTAGRAM_TOKEN`) — API nova, "login do Instagram":**
1. Como saber se é o seu caso: no app aparecem escopos `instagram_business_basic` / `instagram_business_manage_comments` (e não `instagram_manage_comments`).
2. No app → **Casos de uso → API do Instagram → Personalizar → aba Funções** → **adicione a sua conta @ como "Testador do Instagram"**.
3. **Aceite o convite dentro do Instagram**: app do Instagram → Configurações → **"Apps e sites"** (ou toque na notificação de convite) → aceitar. *(Este passo esquecido é a causa nº 1 de falha.)*
4. De volta ao painel do app → seção **"Gerar tokens de acesso"** → **Adicionar conta** → selecione o @ → **"Add all required permissions"** → **gerar token** (já sai de longa duração).
5. Cole em `META_INSTAGRAM_TOKEN=` → teste com `--perfil`.
6. Pré-requisito: a conta do Instagram precisa ser **Profissional (Empresa)** e vinculada à Página (B.3.4).

---

### B.7 HOTMART — `HOTMART_CLIENT_ID` + `HOTMART_CLIENT_SECRET` (Aula 4, caixa real)

> 🔀 **Esta seção virou guia próprio:** [guia-hotmart.md](guia-hotmart.md) (erros M1–M7). E o pré-requisito dela (ter produto com checkout) ganhou o [guia-produto-e-checkout.md](guia-produto-e-checkout.md).

**Serve para:** o painel da Aula 4 ler as **vendas reais** (caixa) e cruzar com as campanhas — o ROAS das vendas rastreadas vira "Real" em vez de "Estimado".
**Pré-requisito:** conta Hotmart de **Produtor** (quem vende o produto) — a área de credenciais normalmente é exclusiva de Produtor; se o menu não aparecer pra você, é provável que sua conta seja só de Afiliado — nesse caso pule (o painel funciona sem).

**Passo a passo:**
1. Faça login em `app.hotmart.com` **com a conta de Produtor** (a que é dona do produto).
2. Menu lateral esquerdo → **Ferramentas**. ⚠️ Variações: em alguns layouts o item se chama só **"Credenciais"** dentro de Ferramentas; em outros, **"Credenciais de Desenvolvedor"** (Developer Credentials). Não achou? Use a **lupa de busca** do topo e digite "credenciais". (Área exclusiva de Produtor — afiliado não vê este menu.)
3. Abra a tela de credenciais → botão **"Criar credencial"** (ou "Nova credencial").
4. Preencha o **nome** identificável: `Painel Trafego`. ⚠️ Se aparecer a opção **"Sandbox"**: **NÃO marque** — sandbox é ambiente de teste com dados falsos; queremos as vendas reais.
5. Clique **"Criar Credencial"**.
6. Copie os valores na hora: **Client ID**, **Client Secret** e, se exibido, o **Basic** (opcional — o script deriva do ID+Secret). Se perder ou tiver dúvida depois, gere uma nova credencial em Ferramentas → Credenciais — é rápido e o painel não se importa.
7. Cole no `.env`:
   - `HOTMART_CLIENT_ID=` ← o Client ID
   - `HOTMART_CLIENT_SECRET=` ← o Client Secret
   - `HOTMART_BASIC=` ← o valor "Basic" que a tela mostrou (se você não copiou, pode deixar vazio — o script deriva do ID+Secret).
8. **Teste de sucesso:** `node scripts/hotmart-vendas.mjs --dias=90 --debug` — deve responder listando vendas ("0 vendas" na janela também prova que conectou; erro 401 é que significa credencial errada).

**O truque do rastreamento (pro ROAS "Real")** — no link do anúncio que aponta pro checkout, inclua o parâmetro **`sck`** com o identificador da campanha. Exemplo concreto e literal:
`https://pay.hotmart.com/A12345678B?sck=meta-c1-frio`
Regras do `sck` (fonte: `aula-03/materiais/manual-trackeamento.html`): **máx. 30 caracteres**, só letras, números, hífen e pipe (`a-z A-Z 0-9 - |`) — **underscore é proibido** (o sanitizador converte `_` em `-`). Use `meta-c1-frio`, nunca `meta_c1_frio`. A venda chega no webhook com esse `sck` e o painel casa venda ↔ campanha ("Real"). Sem `sck`, o painel usa nome do produto ou janela temporal ("Estimado").

**Se der errado:** 401 = ID/Secret errados ou credencial revogada (gere outra); "CLIENT_ID ausente" = confira o nome exato da linha no `.env`.

---

### B.8 Chaves OPCIONAIS (só se você for usar)

**ANTHROPIC (`ANTHROPIC_API_KEY`)** — só pra rodar scripts FORA do Claude Code. Dentro do Claude Code NÃO precisa.
1. `https://console.anthropic.com/` → criar conta → **Settings → API Keys → Create Key** → copie (aparece uma vez) → `ANTHROPIC_API_KEY=`.
2. ⚠️ A API é **paga à parte** do plano do Claude: em Settings → Billing, adicione cartão/créditos, senão a chave existe mas toda chamada falha.

**OPENAI (`OPENAI_API_KEY`)** — só pra fallback GPT em scripts.
1. `https://platform.openai.com/api-keys` → login → **"Create new secret key"** → copie (aparece uma vez) → `OPENAI_API_KEY=`.
2. ⚠️ Também exige billing: `platform.openai.com/settings` → Billing → adicionar créditos.

**FIGMA (`FIGMA_API_KEY` + `FIGMA_FILE_ID`)** — só pra versão visual do swipe file (sem ela, o swipe funciona em markdown).
1. Abra `figma.com` logado → clique no seu **avatar** (canto superior) → **Settings** → aba **Security**.
2. Seção **Personal access tokens** → **"Generate new token"** → nome `cohort-swipe` → escopos: marque **File content: Read** (leitura basta) → gerar → copie (aparece uma vez) → `FIGMA_API_KEY=`.
3. `FIGMA_FILE_ID`: abra o arquivo do Figma no navegador → a URL é `figma.com/design/XXXXXXXX/nome-do-arquivo` → o `XXXXXXXX` (entre `/design/` e a barra seguinte) é o ID. *(Em URLs antigas aparece `/file/XXXXXXXX` — mesmo lugar.)*

---

## PARTE C — Trackeamento para novato (Pixel, CAPI e deduplicação SEM programar)

> 🔀 **Esta parte virou guia próprio:** [guia-pixel-capi.md](guia-pixel-capi.md) (erros T1–T9, com o caminho genérico WordPress/GTM). O conteúdo abaixo permanece como referência dentro do índice.

O `manual-trackeamento.html` da aula-03 é o blueprint avançado (pra quem tem programador). **Este atalho aqui é o caminho do aluno comum vendendo via Hotmart — só cliques, zero código.**

### C.1 Criar o Pixel (agora chamado "Conjunto de dados")
1. `business.facebook.com/events_manager2` (Gerenciador de Eventos) → menu esquerdo **"Conectar dados"** (ou botão verde "Conectar fontes de dados").
2. Escolha **"Web"** → **Conectar** → dê um nome (ex.: `Pixel Sua Marca`) → **Criar**.
3. Quando perguntar como instalar, pode fechar — quem vai instalar é a Hotmart no passo C.2. Anote o **ID do conjunto de dados/pixel** (número longo embaixo do nome) → é o seu `META_PIXEL_ID`.

### C.2 Ligar o Pixel + CAPI pela Hotmart (o pulo do gato)
A Hotmart instala o pixel no checkout E manda os eventos pelo servidor (CAPI) por você:
1. Em `app.hotmart.com` → **Ferramentas → Pixel de rastreamento** → escolha o produto → **Facebook/Meta**.
2. Cole o **ID do Pixel** (C.1).
3. Onde perguntar o modo de envio, escolha **"Conversions API"** ou **"Ambos (navegador + servidor)"** — para isso, gere o **token da CAPI** no Gerenciador de Eventos: Events Manager → seu pixel → aba **Configurações** → seção **"API de Conversões"** → **"Gerar token de acesso"** → copie → cole no campo da Hotmart. Se a tela perguntar ONDE disparar: marque **"visita à página de pagamento"** (é o `InitiateCheckout`) e NÃO marque a página de produto da Hotmart — só infla evento sem valor (referência de mercado).
4. Salve. A Hotmart passa a disparar `InitiateCheckout` e `Purchase` com **`event_id`** automático — que é o que garante a **deduplicação** (o mesmo evento vindo do navegador E do servidor conta uma vez só).
5. ⚠️ Boleto/Pix: gera `Payment Generated` na hora; o `Purchase` só dispara quando o pagamento **aprova** — e só via CAPI. Sem a CAPI ligada, venda de boleto "some" do pixel.

### C.2.5 Plugar o pixel na SUA página de vendas (o passo que todo mundo pula)
A Hotmart instala o pixel só no **checkout**. Na sua página de vendas é você que pluga — e as páginas geradas pelas skills do cohort **já nascem pixel-ready**:
1. Abra o HTML da sua página (`projetos/{slug}/pagina/...`).
2. Procure no `<head>` o snippet do Meta Pixel — ele vem **pronto porém COMENTADO**, com o placeholder `[PLUG: SEU_PIXEL_ID]`.
3. Substitua o placeholder pelo ID do pixel (C.1) e **descomente** o snippet (e o bloco `<noscript>` logo abaixo).
4. Republique a página. Só então o teste C.3 mostra o `PageView`.

### C.3 Testar que dispara (5 min)
1. Instale a extensão **Meta Pixel Helper** no Chrome (busque na Chrome Web Store).
2. Abra a sua página de vendas → o ícone da extensão deve acender e listar `PageView`.
3. Clique no botão de compra até a tela do checkout Hotmart → o Helper (ou o **"Testar eventos"** dentro do Events Manager) deve listar `InitiateCheckout`.
4. No Events Manager → seu pixel → aba **"Visão geral"**: nas próximas horas os eventos aparecem no gráfico. `Purchase` você só vê com venda real (ou compra-teste).
5. Deduplicação: Events Manager → Visão geral → um evento listado como "Navegador + Servidor" com aviso verde de desduplicado = perfeito.

> ⚠️ Duas manhas do Events Manager (referência de mercado): (1) a Meta às vezes desativa/reativa **sozinha** configurações como a "Correspondência avançada automática" — depois de salvar qualquer coisa, reabra a tela e confirme que ficou como você deixou; (2) alerta vermelho/amarelo no Events Manager **raramente é crítico** — leia o texto antes do pânico: "Purchase não dispara" quase sempre é problema de checkout/CAPI, não pixel "estragado" ("pixel frio/sujo" é mito).

### C.4 O que o `/zelador` confere depois (o seu gabarito)
BM ativo · conta ativa · **Pixel disparando** · **CAPI ativa** · **Purchase com `event_id` (deduplicado)** · domínio verificado (B.3.7) · pagamento ok.
- Se qualquer item **crítico** estiver vermelho (todos, exceto o domínio verificado), o Estruturador **não deixa** subir campanha — por design. Domínio não verificado deixa o status em PARCIAL, que **não bloqueia** — siga com a pendência anotada.
- Dois itens a API **não consegue provar** — deduplicação e domínio verificado: mesmo no Modo API, o zelador confirma com VOCÊ olhando a tela (compra-teste no Events Manager; Segurança da Marca → Domínios).
- Vai deixar o `/estruturador` publicar via API (Gates 2/3)? Rode antes `node scripts/zelador-audit.mjs --testar-escrita` — ele testa a escrita com um ad label invisível; se falhar, o estruturador fica no caminho manual.

---

## PARTE D — Operação de Ads da Aula 3, clique a clique (o "default sagrado" no Gerenciador)

Pré-requisitos: fundação B.3 ✅ · tracking C ✅ · Aula 2 pronta (`offerbook.md`, `copy.md`, `DESIGN.md`) · criativos finalistas curados pelo `/briefista` (2–3 peças).

### D.1 A ordem do squad (sempre)
`/zelador` (audita — bloqueante) → `/briefista` (gera a bateria; VOCÊ cura 2–3 finalistas) → `/estruturador` (monta a campanha) → você publica → 7 dias → `/leitor-de-metricas` → `/diagnosticador` → decisão no `PAINEL-DA-SEMANA.yaml`.

### D.2 O default sagrado (decorado antes de abrir o Gerenciador)
- **1 campanha → 1 conjunto de anúncios → 2–3 criativos.** Nunca mais que isso na v1.
- Objetivo **Vendas** (ou Cadastro). **NUNCA "Impulsionar publicação".**
- Otimização por **Conversão** (evento Compra ou Cadastro do SEU pixel).
- Público **amplo/frio + Advantage+**; no máximo **1 interesse** guarda-chuva.
- Posicionamentos **Advantage+ (automáticos)**.
- Verba **R$ 30/dia por 7 dias** (piso R$ 20; alternativa: R$ 70/dia × 3 dias com 1 ângulo só).
- **7 dias sem mexer em NADA** (cada edição reseta o aprendizado). Única exceção (circuit breaker): gastou ≥ 2× o CPA-alvo com 0 conversões E CTR < 0,5% → pode trocar criativo/ângulo antes do prazo.
- 1 campanha = 1 conjunto = **1 temperatura** (não misturar frio/morno/quente).

### D.3 Criando a campanha no Gerenciador de Anúncios (tela a tela)

**Nível campanha:**
1. Abra `https://adsmanager.facebook.com` → confira no topo que a **conta de anúncios** selecionada é a certa.
2. Botão verde **"+ Criar"**.
3. Objetivo: **"Vendas"** (produto com checkout) ou **"Cadastros"** (captura de lead) → **Continuar**. Se aparecer "configuração recomendada vs manual", escolha **manual** pra ver todos os campos.
4. **Nome da campanha** — use um padrão rastreável, ex.: `[SUAMARCA] Oferta X - Vendas - 2026-07`.
5. **Orçamento**: defina **no conjunto de anúncios** (R$ 30,00/dia) — é assim que o Modo API do estruturador cria; se o Gerenciador oferecer o "orçamento da campanha (Advantage/CBO)", desligue e siga com o orçamento no conjunto. Com 1 conjunto só, o efeito prático é o mesmo.
6. Categoria de anúncio especial: só marque se for crédito/emprego/moradia/social/eleitoral — senão, deixe em branco. → **Avançar**.

**Nível conjunto de anúncios:**
7. **Nome do conjunto**: `Frio - Advantage+ - BR`.
8. **Conversão**: local = **Site** · **Pixel** = o seu (C.1) · **Evento de conversão** = **Comprar (Purchase)** (ou Cadastro/Lead). ⚠️ Se o evento aparecer cinza/"inativo", o pixel ainda não registrou esse evento — volte ao C.3.
9. **Data**: início hoje; **defina término em 7 dias** (o default sagrado tem fim programado).
10. **Público**: se aparecer "Público Advantage+", aceite (é o padrão novo). Localização = **Brasil** (ou sua região de atendimento) · Idade = deixe no padrão/amplo (o default sagrado não restringe idade) · **NÃO empilhe interesses** — no máximo 1 interesse guarda-chuva em "sugestão de público" (ex.: "Emagrecimento"), ou nenhum (100% amplo).
11. **Posicionamentos**: **"Posicionamentos Advantage+"** (automático). Não desmarque nada. → **Avançar**.

**Nível anúncio (repita para cada um dos 2–3 finalistas):**
12. **Nome do anúncio**: `H1 - dor - reels` (hook + ângulo + formato, pra você reconhecer nos relatórios).
13. **Identidade**: selecione a sua **Página** e o **Instagram** vinculado.
14. **Configurar anúncio**: "Criar anúncio" → formato **"Imagem ou vídeo único"**.
15. **Adicionar mídia** → suba o criativo (vídeo 9:16 pra Reels/Stories; a Meta recorta pros outros posicionamentos — revise os recortes no preview à direita).
16. **Texto principal** = a copy do finalista (do briefista) · **Título** = o hook curto · **Descrição** = opcional.
17. **Chamada para ação (CTA)**: "Saiba mais" (página de vendas) ou "Comprar agora" (checkout direto).
18. **URL do site**: o link de destino **já com o rastreio**: página de vendas com UTMs, ou checkout com `sck` (B.7), ex.: `https://pay.hotmart.com/A12345678B?sck=meta-c1-frio`.
19. Confira o **preview** em Feed, Stories e Reels (menu à direita) → nada cortado ou ilegível.
20. Para o 2º e 3º criativos: no menu esquerdo do editor, passe o mouse sobre o anúncio criado → **"Duplicar"** → troque só a mídia/copy → renomeie (`H2 - beneficio - reels`…).

**Publicar:**
21. Botão verde **"Publicar"** (canto inferior direito). A campanha entra em **"Em análise"** (minutos a ~24 h) e depois roda sozinha.
22. **Recomendação do método:** publique e **pause imediatamente** (toggle azul ao lado do nome da campanha) OU crie tudo já pausado — revise com calma, e ative quando estiver 100%. É exatamente o que o `/estruturador` faz no Modo API (Gate 2 cria pausado; Gate 3 ativa só com a sua ordem).
23. Registre no `PAINEL-DA-SEMANA.yaml`: data da subida, verba, criativos, **critério de sucesso** (ex.: ≥ 1 venda ou CPA ≤ R$ X em 7 dias) e **critério de reversão** (ex.: R$ 210 gastos sem venda = pausa).

### D.4 Os 7 dias e o ciclo semanal
- **Dias 1–7: não mexa.** Não edite copy, não troque público, não "dê uma ajustadinha" — cada edição reseta a fase de aprendizado. Só o circuit breaker (D.2) autoriza intervenção antecipada.
- **Dia 7:** rode `/leitor-de-metricas` (com as chaves da B.4 ele lê sozinho; sem, você cola os números do Gerenciador). Cada métrica sai com selo Real/Estimado/não fornecido.
- Depois `/diagnosticador`: ele aponta **UMA** alavanca (hipótese + critério de sucesso + critério de reversão). Você decide e registra no `PAINEL-DA-SEMANA.yaml` (que é histórico — nunca apague semanas passadas).
- Na Aula 4, o `/gestor-de-campanhas` compara esse planejado com o realizado de 7/30 dias e a `/retroalimentacao` devolve os aprendizados pro avatar e pra copy.

---

## Apêndice — Tabela-resumo: chave → onde pegar → teste de sucesso

| Chave | Onde pegar (resumo) | Teste que prova que funcionou |
|---|---|---|
| `APIFY_API_TOKEN` | console.apify.com → Settings → API & Integrations | `grep` imprime a linha; skill de coleta roda sem pedir chave |
| `META_APP_ID`/`SECRET` | developers.facebook.com → app → Configurações → Básico | valores no `.env` |
| `META_ACCESS_TOKEN` | business.facebook.com/settings → Usuários do sistema → atribuir ativos → gerar token (`ads_read`+`business_management`) | `node scripts/painel-trafego-data.mjs --account` → `"modo":"api"` |
| IDs Meta (conta, pixel, página, BM, IG) | `node scripts/zelador-audit.mjs --gravar-env` (plano B: B.4.6) | IDs preenchidos no `.env` |
| `META_AD_LIBRARY_TOKEN` | facebook.com/ads/library/api → identidade verificada → termos → token | espião coleta sem colar manualmente |
| `META_PAGE_ACCESS_TOKEN` | Graph API Explorer → escopos de página → estender no Debugger | `--perfil` → `perfil.disponivel:true` |
| `META_INSTAGRAM_TOKEN` | app → Casos de uso → API do Instagram → testador → gerar token | idem |
| `HOTMART_CLIENT_ID`/`SECRET` | app.hotmart.com → Ferramentas → Credenciais de Desenvolvedor | `node scripts/hotmart-vendas.mjs --dias=90 --debug` responde |
| `ANTHROPIC_API_KEY` | console.anthropic.com → Settings → API Keys (+ billing!) | script SDK responde |
| `OPENAI_API_KEY` | platform.openai.com/api-keys (+ billing!) | idem |
| `FIGMA_API_KEY` | figma.com → avatar → Settings → Security → tokens | swipe-file exporta pro Figma |

> Fonte de verdade em conflito: os arquivos do repositório e as telas reais dos serviços vencem este guia. UI mudou de nome? O caminho lógico (a sequência de conceitos) continua o mesmo — procure o equivalente.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/zelador` — ele confere TODAS as conexões deste guia de uma vez e aponta o que ficou faltando |
| 📖 Ler | com as chaves no lugar, a operação: [guia-criativos](../04-operacao/guia-criativos.md) → [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md) → [guia-e-depois](../04-operacao/guia-e-depois.md) |
| 🚑 Se travar | Meta app/token → catálogo E1–E16 do [guia-meta-api](guia-meta-api.md) · fundação/conta → F1–F10 do [guia-meta-fundacao](guia-meta-fundacao.md) · cada seção B.x tem o próprio bloco "Se der errado" |
