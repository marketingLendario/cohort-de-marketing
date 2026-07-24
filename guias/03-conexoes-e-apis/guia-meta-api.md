# GUIA META API — do zero absoluto ao token funcionando

> **Estou perdido em:** "preciso conectar a conta de anúncios da Meta (app, token, IDs) e nunca fiz isso".
> **Meta deste guia:** alguém que NUNCA pegou nisso termina com `META_ACCESS_TOKEN` + IDs no `.env` e o teste respondendo `"modo":"api"`. Sem pulo lógico. Com TODOS os erros conhecidos catalogados no fim.
>
> **Fontes cruzadas (por que confiar):** `aula-04/docs/tutorial-token-meta.md` e `configurar-chaves-meta.md` (repo) · `scripts/zelador-audit.mjs` e `painel-trafego-data.mjs` (código real) · guia visual `aula-03/materiais/guia-app-meta-integracoes.html` · 3 tutoriais externos em vídeo (integração Claude+Meta Ads via API; token permanente App+System User; criação de app na Meta do zero) · e os erros REAIS registrados no PS de 21/07.
> **Regra de leitura:** a Meta muda telas conforme a época E a conta (dois apps criados em meses diferentes têm menus diferentes — confirmado em fonte externa). Se o nome não bater, procure o equivalente; o caminho lógico não muda.

---

## 0. O que você vai ter no final

- Um **app** da Meta (de graça, em modo Desenvolvimento — não precisa publicar).
- Um **Usuário do Sistema** ("robô") com um **token que não expira**, só de leitura.
- Os **IDs** dos seus ativos gravados no `.env`.
- O teste `node scripts/painel-trafego-data.mjs --account` respondendo `"modo": "api"`.

**O que você NÃO vai precisar (ignore se a Meta oferecer):** política de privacidade, termos de uso, ícone 512px, publicar o app, App Review, webhooks — isso tudo é só para WhatsApp API/login social/orgânico em produção. Para LER a própria conta de anúncios, nada disso entra.

---

## 1. Pré-requisitos (a fundação — 15 min se já tiver, 1 dia se criar do zero)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Você sabe o que é API, app, token, escopo e Usuário do Sistema (2 frases de cada basta) | leia [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) → "O mundo da API" (3 min) |
| 🔑 Conta | **Perfil pessoal do Facebook** real e usado (perfil novo só pra anunciar = risco de bloqueio) | use o seu perfil real |
| 🔑 Conta | **Business Manager (BM)** criado, com e-mail confirmado | siga [guia-meta-fundacao.md](guia-meta-fundacao.md) passo 1 (ou [super-guia B.3](super-guia-apis-e-ads.md)) |
| 🔑 Conta | **Conta de anúncios** dentro do BM (fuso São Paulo + moeda BRL — não mudam depois) | [guia-meta-fundacao.md](guia-meta-fundacao.md) passo 4 |
| 🔑 Conta | **Pagamento** cadastrado sem aviso vermelho | [guia-meta-fundacao.md](guia-meta-fundacao.md) passo 6 |
| 🔑 Conta | *(Recomendado, não obrigatório pra ler)* **Verificação de Empresa** — sobe o CNPJ (aceita MEI), a Meta cruza os dados e pode ligar no telefone do CNPJ. Prazo: 1+ dias úteis. Destrava BMs novos que seguram o Usuário do Sistema (erro E6) | [guia-meta-fundacao.md](guia-meta-fundacao.md) passo 5 — dispare agora, roda em paralelo |
| 🧰 Ferramenta | Projeto aberto no terminal com `.env` criado (é onde o token vai ser colado) | [guia-env-e-chaves](../01-pre-requisitos/guia-env-e-chaves.md) |

---

## 2. Conta de desenvolvedor (primeira vez · 5–10 min)

1. Abra `developers.facebook.com` **logado no perfil que é admin do BM** (confira no canto superior direito).
2. **"Começar"/"Get Started"**. Se já aparece **"Meus apps"** no topo, você já tem conta — pule pro passo 3.
3. Assistente de 4 telas: **Registrar** (aceitar termos) → **Verificar conta** (celular → **código de 6 dígitos por SMS** → digite; não chegou? veja o erro **E1**, o mais comum de todos) → **Contato** (confirmar e-mail) → **Sobre você** (qualquer opção; não trava nada).
4. Prova de sucesso: menu **"Meus apps"** visível no topo.

## 3. Criar o app (10 min) — com as TRÊS variações de tela conhecidas

1. **Meus apps → Criar app**.
2. Tela "Requisitos" (se aparecer) → Avançar.
3. **Tela de casos de uso** — três variações documentadas (as duas primeiras do repo, a terceira confirmada em fonte externa):
   - **Variação A:** cartões ("Autenticar...", "Interação de WhatsApp", "Outro"...) → escolha **"Outro"** → Avançar → tipo de app: **"Negócios"/"Empresa"** → Avançar.
   - **Variação B (contas antigas):** direto "Que tipo de app?" → **Empresa**.
   - **Variação C:** cartão **"Anúncio e monetização"** (pode marcar as opções dele) → Avançar. Dá no mesmo destino.
4. **Detalhes:** nome sem acento/emoji, nunca com "Meta/Facebook/Insta" (ex.: `Cohort Trafego`) · seu e-mail.
5. ⚠️ **Portfólio empresarial (BM):** SELECIONE o seu BM aqui. Deixar em branco = a causa nº 1 da "lista de permissões vazia" lá na frente (erro E3). 
6. **Criar app** → a Meta pede senha/2FA (tenha o celular por perto) → confirme.
7. No painel do app: deixe o **Modo: Desenvolvimento** (é o certo pra ler os próprios dados). Banner "Acesso à API restrito"? → **"Ver ações necessárias"** → siga (erro E9).
8. **Configurações → Básico**: copie **ID do app** → `META_APP_ID=` · **"Mostrar"** na Chave Secreta (pede a senha de novo) → `META_APP_SECRET=`. Os outros campos (política, ícone, domínio) **ignore** — não são necessários pra leitura.
9. *(Cinto e suspensório, de fonte externa — opcional mas elimina uma classe de erros:)* atribua a conta de anúncios **também ao APP**: business settings → **Contas → Aplicativos** → selecione o app → **Atribuir ativos → Contas de anúncios** → sua conta → salvar.

## 4. Usuário do Sistema (o "robô" · 5 min)

1. `business.facebook.com/settings` (se abrir o Business Suite novo: engrenagem → "Configurações da empresa").
2. **Usuários → Usuários do sistema → Adicionar**.
3. Nome `leitor-trafego` · função **Funcionário** (basta pra ler; fontes externas usam Admin — só é necessário se este mesmo robô for ADMINISTRAR campanhas depois. Menos poder = menos risco).
4. Não deixou criar? Veja o erro **E6** (BM novo/limite).

## 5. Atribuir os ativos (⚠️ ANTES do token — a ordem é obrigatória)

Com `leitor-trafego` selecionado → **"Atribuir ativos"** (às vezes atrás do menu "..."):
1. Aba **Apps** → `Cohort Trafego` → chavinha **"Gerenciar app"** → Salvar. *(É este toggle que destrava os escopos do token. A mesma coisa pode ser feita pelo lado do app: no app → "Atribuir pessoas" → adicionar o usuário do sistema com "Gerenciar aplicativo" — é o MESMO vínculo por outra porta.)*
2. De novo → aba **Contas de anúncios** → sua conta → **"Ver desempenho"** (não precisa "Gerenciar campanhas" pra ler) → Salvar.
3. (Só p/ orgânico da Aula 4) aba **Páginas** → leitura → Salvar.
4. ⏱ **Espere 2–5 minutos** (propagação — gerar o token no segundo seguinte às vezes vem sem permissões).

## 6. Gerar o token (2 min + atenção máxima ao copiar)

1. Usuário selecionado → **"Gerar novo token"** → escolha o app.
2. **Expiração: "Nunca"** (se só houver "60 dias", ok — anote no calendário).
3. **Escopos:** `ads_read` ✅ + `business_management` ✅. *(Se um dia este robô for PUBLICAR campanhas via API — estruturador Gates 2/3 — inclua também `ads_management`.)*
4. **Gerar** → pode aparecer um pop-up de **verificação de conta/identidade** no meio (erro E7 — normal, complete e volte).
5. O token aparece **UMA única vez** → copie → `META_ACCESS_TOKEN=` no `.env` → salve → só então feche. ⚠️ **NUNCA** cole o token em grupo, print público ou GitHub — quem tem o token acessa a conta.

## 7. Alternativa rápida (só pra testar HOJE, sem System User)

Fluxo das fontes externas, útil pra validar a conexão em 5 minutos — **mas expira**:
1. `developers.facebook.com/tools/explorer` → selecione o app → **"Generate Access Token"** (faz login, escolhe página/conta, aceita) → marque `ads_read`.
2. O token dura **~1–24 h**. Pra esticar: **Ferramentas → Depurador de Token** (`/tools/debug/accesstoken`) → colar → **"Estender token"** → vira ~30–60 dias.
3. Serve para o teste do passo 9. **Não** deixe o projeto dependendo dele: quando sumir do nada (e some), volte ao passo 4 e faça o definitivo.

## 8. Os IDs dos ativos

1. Automático: `node scripts/zelador-audit.mjs --gravar-env` → grava `META_AD_ACCOUNT_ID`, `META_PIXEL_ID`, `META_FACEBOOK_PAGE_ID`, `META_BUSINESS_MANAGER_ID` (Instagram é manual).
2. **Vários ativos?** O script **não grava nada** (nunca escolhe por você) — ele LISTA as opções no relatório pra você copiar a linha certa. Só contas: `node scripts/painel-trafego-data.mjs --listar-contas`.
3. Na mão (plano B): conta = número na URL do Ads Manager (`act=123...` → grave **só o número, sem `act_`**) · pixel = Events Manager → Fontes de dados · página = Página → Sobre → ID · BM = business settings → Informações da empresa · Instagram = business settings → Contas → Contas do Instagram.

## 9. Testes de sucesso (nesta ordem)

1. `node scripts/zelador-audit.mjs --json` → token e escopos OK.
2. `node scripts/painel-trafego-data.mjs --account` → responde **`"modo": "api"`** com dados. (Respondeu "exemplo"? Falta `META_AD_ACCOUNT_ID` — erro E13.)
3. Vai publicar via API depois? `node scripts/zelador-audit.mjs --testar-escrita` (cria e apaga um rótulo invisível; exige `ads_management` no token).

---

## POSSÍVEIS ERROS — o catálogo completo (todos os já registrados)

> Regra de ouro herdada do PS: **a Meta demora a persistir** (~10 min em algumas telas). Antes de concluir que quebrou: espere, atualize, refaça o passo. E se travar de vez: print da tela + "estou preso aqui, o que fazer? pesquise" pro Claude/Codex.

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **E1** | **SMS de verificação não chega** (caso real do PS — dias sem chegar; problema RECORRENTE nos fóruns oficiais da Meta, onde o sistema chega a **bloquear novos pedidos de código** após várias tentativas, por proteção anti-spam) | operadora × Meta; anti-spam após tentativas; bloqueador de SMS no celular | 1) confira o formato: tente **com e sem o 9º dígito**; 2) **espere 15+ min entre tentativas** (clicar "reenviar" seguidas vezes ativa o anti-spam e piora); 3) desative temporariamente **antivírus/bloqueador de SMS** do celular e confira sinal/armazenamento; 4) tente **outro número** de confiança; 5) procure a opção de confirmar por **e-mail ou WhatsApp** quando oferecida (a Central de Ajuda oficial indica o e-mail como alternativa ao SMS); 6) espere **algumas horas/1 dia** (a fila reseta); 7) persiste → suporte da Meta (`facebook.com/business/help`) com print |
| **E2** | **"Você só pode fazer essa operação na central de contas"** e a central não leva à página certa (caso real do PS) | o número/2FA é gerenciado na Central de Contas (accountscenter) e não na tela atual | abra direto `accountscenter.facebook.com` → **Senha e segurança** / **Detalhes pessoais** → atualize o celular LÁ → volte à tela de developers e reenvie o código |
| **E3** | **Lista de permissões VAZIA** ao gerar o token | app não atribuído ao usuário do sistema; ou app criado SEM portfólio empresarial; ou propagação | 1) refaça o passo 5.1 (toggle "Gerenciar app" + Salvar); 2) app sem BM? vincule: business settings → Contas → Aplicativos → Adicionar → ID do app; 3) espere 2–5 min e gere de novo |
| **E4** | **"(#10) Permission Denied"** ao ler a conta | conta de anúncios não atribuída ao robô; ou propagação | refaça o passo 5.2 ("Ver desempenho"); aguarde minutos. **Atenção:** `#10` só no item de PAGAMENTO do zelador é **normal** com "Ver desempenho" (não vê cobrança) — o teste que vale é o `--account` responder `"modo":"api"` |
| **E5** | **Token morreu em horas/dias** | foi gerado no Graph Explorer (passo 7), não no System User | faça o definitivo (passos 4–6); o do Explorer é só pra teste |
| **E6** | **"Usuários do sistema" não deixa criar** / "disponível em breve" / limite atingido | BM recém-criado sem "idade"/verificação; ou limite de usuários do BM | 1) espere horas/1 dia e tente; 2) faça a **Verificação de Empresa** (CNPJ/MEI, seção 1) — destrava; 3) limite atingido: apague um usuário do sistema antigo sem uso |
| **E7** | Pop-up de **verificação de conta/identidade** no meio da geração do token | checagem de segurança padrão da Meta | complete (senha/2FA/selfie quando pedir) e refaça o "Gerar token" — o fluxo continua de onde parou |
| **E8** | **Nome do app recusado** sem explicação | acento/emoji, ou "Meta/Facebook/Insta/FB/IG" no nome | renomeie simples e sem marca: `Cohort Trafego` |
| **E9** | Banner **"Acesso à API restrito"** no painel do app | cadastro de dev incompleto | botão **"Ver ações necessárias"** → normalmente é só confirmar contato |
| **E10** | **A tela não bate com o guia** (menus diferentes) | a Meta muda a UI por época E por conta (confirmado: dois apps da mesma pessoa com menus diferentes) | procure o nome equivalente; use a busca do menu lateral; em último caso, print + "o guia diz X, minha tela mostra Y — me guie" pro Claude/Codex |
| **E11** | Pede **senha/2FA** no meio de qualquer passo | normal ao criar app, mostrar App Secret e gerar token | tenha o celular por perto; não é erro |
| **E12** | `--gravar-env` **não gravou nada** | mais de um ativo do mesmo tipo (ele nunca escolhe por você) | leia o relatório do zelador: ele lista as opções → copie a linha certa no `.env` |
| **E13** | Painel responde **"modo": "exemplo"** com token válido | falta `META_AD_ACCOUNT_ID` no `.env` | preencha (passo 8) e rode de novo |
| **E14** | Algo exige **empresa verificada** | BMs novos/casos de uso avançados | Verificação de Empresa (seção 1): CNPJ (aceita MEI), Meta liga no telefone do CNPJ com código; 1+ dias úteis |
| **E15** | Mudou algo e **não refletiu** | persistência lenta da Meta (~10 min) | espere, atualize a página, refaça o passo — antes de concluir que quebrou |
| **E16** | **Token "que não expira" morreu do nada** — erro `190 / OAuthException` ("Error validating access token: the session has been invalidated") | você **trocou a senha** do Facebook, fez logout forçado, ou a Meta invalidou por **evento de segurança** (atividade suspeita) — token permanente ≠ token imortal | 1) não perca tempo depurando: gere um **token novo** (passos 4–6, leva 2 min, os ativos continuam atribuídos); 2) troque no `.env` e rode o teste do passo 9; 3) se invalidar de novo em dias: confira alertas de segurança na conta (`accountscenter.facebook.com`) e ative 2FA |

---

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode os 2 testes do passo 9 (`zelador-audit --json` e `painel-trafego-data --account` respondendo `"modo": "api"`) — só siga adiante com os dois verdes |
| 📖 Ler | próximo da cadeia: [guia-pixel-capi.md](guia-pixel-capi.md) → [guia-criativos.md](../04-operacao/guia-criativos.md) → [guia-campanha-no-ar.md](../04-operacao/guia-campanha-no-ar.md) |
| 🚑 Se travar | o catálogo E1–E16 acima (SMS que não chega, permissões vazias, token que morreu...) — e a regra de ouro: a Meta demora ~10 min a persistir; espere antes de concluir que quebrou |
