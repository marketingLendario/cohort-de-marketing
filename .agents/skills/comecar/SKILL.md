---
name: comecar
description: "O primeiro comando do cohort de marketing. Prepara o ambiente do aluno do zero — em português de gente, do leigo total ao dev. Explica o que é terminal e pasta, ajuda a abrir o terminal na pasta do projeto (detectando macOS/Windows/Linux), checa e resolve o ambiente (git pull da Aula 1, Claude Code OU Codex, Node e a CHAVE do Apify), confirma que as skills de funil carregaram e aponta o ÚNICO primeiro comando a rodar. Use quando o aluno acabou de chegar, não sabe por onde começar, deu erro de ambiente, ou perguntou 'e agora?'. Nunca trava: sempre devolve um próximo passo claro."
user_invocable: true
---

# Começar — o primeiro comando do cohort

> Este é o **passo zero**. Antes de qualquer skill de funil, rode `/comecar` (ou, no Codex, `@comecar`). Ele arruma a casa: prepara o computador, confere se está tudo no lugar e te entrega **um único próximo passo**. Segue [`.claude/skills/_shared/nunca-travar.md`](../_shared/nunca-travar.md) à risca: nunca deixa o aluno num beco, sempre tem uma saída em português.

**Regra de ouro desta skill:** a turma vai do leigo total (nunca abriu um terminal) ao dev avançado. Você segura a mão de quem nunca fez, **sem atrapalhar** quem já sabe. Explicações extras vão curtas e entre parênteses — o leigo lê, o dev passa reto. Nunca infantilize; nunca assuma que a pessoa usa Mac.

---

## Glossário relâmpago (só a 1ª vez que o termo aparecer)

- **Terminal** = a janelinha preta/branca onde você digita comandos pro computador em vez de clicar. Também chamada de "prompt", "console" ou "linha de comando".
- **Pasta do projeto** = a pasta no seu computador com os arquivos do cohort (a que você baixou na Aula 1). Tudo acontece dentro dela.
- **Comando** = uma linha de texto que você digita e aperta Enter pra o computador fazer algo.
- **git** = o programa que baixa e atualiza os arquivos do cohort.
- **Claude Code / Codex** = o assistente de IA que roda as skills. É onde você digita `/comecar`.
- **Skill** = um comando pronto (começa com `/` no Claude Code, ou `@` no Codex) que faz um trabalho inteiro do funil pra você.
- **Node** = um motor que alguns comandos precisam pra rodar por baixo dos panos.
- **Apify** = o serviço que sai na internet e coleta dados reais (anúncios do concorrente, Reels, tendências). É **central** no cohort, não é opcional.
- **Chave / API key** = uma senha comprida que autoriza o seu computador a usar o Apify.

> Se em algum momento aparecer um termo que você não conhece, é só perguntar "o que é isso?" — a gente explica antes de seguir.

---

## Kit de sobrevivência do terminal (mostre isto ao aluno logo no começo)

Quatro atalhos que tiram o aluno de qualquer aperto. Mostre em linguagem de gente:

- **Esc** — cancela uma pergunta ou ação que o Claude deixou pendente (te devolve o controle sem fechar nada).
- **Seta pra cima (↑)** — no terminal, repete o último comando que você digitou (não precisa redigitar).
- **Shift+Tab** — liga o **modo de aceitação automática**: o Claude para de pedir confirmação a cada passo e segue sozinho. Use só quando **já confia no fluxo** (é mais rápido, mas você perde o "posso?" antes de cada ação).
- **NUNCA** use `--dangerously-skip-permissions` sem entender o risco: essa opção **remove TODAS as proteções** de uma vez (o Claude passa a fazer qualquer coisa sem perguntar). Não é atalho de conveniência — é pra casos muito específicos e conscientes.

---

## Custo, modelo e sessão

> Antes de rodar as skills, vale alinhar 3 coisas com o aluno: as skills **rodam bem em Sonnet** (não precisa Opus pra tudo), rodadas pesadas de coleta+geração **consomem bastante** (dá pra fazer por partes) e **o progresso mora nos arquivos de `projetos/{slug}/`, não no chat** — pode fechar/limpar a conversa entre skills sem perder nada. Regra completa em [`.claude/skills/_shared/nunca-travar.md`](../_shared/nunca-travar.md), seção "Custo, modelo e sessão".

---

## Como o Claude conduz `/comecar`

Você (Claude) roda os passos abaixo **na ordem**, um de cada vez, checando o resultado antes de avançar. Fale sempre em português de gente. A cada tranco, dê o comando exato pronto pra copiar e **o que era pra acontecer**. Nunca despeje erro cru; traduza.

### Passo 0 — Detectar o sistema operacional (nunca assuma Mac)

Descubra em qual sistema o aluno está e **use isso em todos os exemplos daqui pra frente**:

```bash
uname -s 2>/dev/null || echo "Windows"
```

- Resposta `Darwin` → **macOS**
- Resposta `Linux` → **Linux**
- Resposta começando com `MINGW`, `MSYS` ou `CYGWIN` → **Windows** (é o Git Bash)
- Deu erro / `Windows` → **Windows**

Guarde o resultado. Sempre que mostrar um caminho de arquivo ou "como abrir", mostre a versão do SO certo — não os três, só o dele (o dev que quiser os outros pergunta).

### Passo 1 — O que é terminal e como abrir na pasta do projeto (3 linhas)

Diga, com estas palavras ou parecidas:

> "**Terminal** é uma janelinha onde você digita comandos em vez de clicar. **Pasta do projeto** é a pasta com os arquivos do cohort que você baixou na Aula 1. O que a gente vai fazer é **abrir o terminal já dentro dessa pasta** — assim os comandos sabem onde trabalhar."

Depois entregue o caminho do SO detectado:

- **macOS:** Abra o **Finder**, ache a pasta do cohort, clique nela com o botão direito → **Serviços** → **Novo Terminal na Pasta**. (Ou abra o app **Terminal** e digite `cd ` — com espaço — e arraste a pasta pra dentro da janela, depois Enter.)
- **Windows:** Abra o **Explorador de Arquivos**, entre na pasta do cohort, clique na **barra de endereço** lá em cima, apague o que estiver escrito, digite `cmd` e aperte Enter. (Abre o terminal já na pasta certa.)
- **Linux:** No gerenciador de arquivos, botão direito na pasta → **Abrir no Terminal**. (Ou `cd /caminho/da/pasta` no terminal.)

Como confirmar que deu certo — peça pra rodar:

```bash
ls
```

**No Windows (cmd)** o comando é `dir` (o `ls` não existe no cmd; se abrir o **PowerShell** em vez do cmd, `ls` funciona).

Se aparecer uma lista com nomes tipo `.claude`, `docs`, `projetos` (ou similar), está na pasta certa. Se aparecer vazio ou nomes estranhos, o aluno abriu o terminal em outro lugar — **não trave**: peça pra ele dizer o nome da pasta do cohort e ajude a chegar nela com `cd`.

### Passo 2 — Checar o ambiente e resolver (git, IA, Node, Apify)

Rode as checagens abaixo. Para **cada** ferramenta que faltar, ofereça a instalação em 1 linha, **pergunte antes de instalar** e sempre deixe um fallback. Nunca falhe em silêncio.

**2a. git — e atualizar a Aula 1 (nunca clonar de novo)**

```bash
git --version && git status
```

- Se `git` não existe: no macOS, rodar `xcode-select --install` costuma resolver; no Windows, baixar em `https://git-scm.com/download/win`; no Linux, `sudo apt install git` (ou o gerenciador da distro). Pergunte antes.
- Se `git` existe **e** estamos dentro do repositório do cohort, **atualize a pasta que já existe** (nunca crie clone novo, nunca sobrescreva o trabalho do aluno):

```bash
git pull
```

  - Deu certo: siga.
  - Deu conflito ou "local changes": **não force nada**. Explique: "você tem trabalho salvo aqui que ainda não subiu; vou preservar" e siga sem o pull (o material da aula já está local). Ofereça guardar as mudanças com `git stash` só se o aluno topar.
  - Não é um repositório git ("not a git repository"): o aluno provavelmente baixou a pasta como .zip. Tudo bem — o material está lá. Siga; não mande clonar por cima.

**2b. Claude Code OU Codex — onde as skills rodam**

Se você está lendo isto, uma das duas ferramentas já está rodando (foi por ela que o aluno chamou `/comecar` ou `@comecar`). Confirme qual é e ajuste a linguagem:

- **Claude Code** → os comandos começam com **`/`** (ex.: `/avatar-funil`). As skills ficam em `.claude/skills/`.
- **Codex** → os comandos podem começar com **`@`** (ex.: `@avatar-funil`) e as skills ficam em **`.agents/skills/`**, que neste repo é espelho literal de `.claude/skills/`. A fonte de verdade continua sendo `.claude/skills/`; se o espelho estiver faltando ou divergente, refaça com `cp -R .claude/skills/. .agents/skills/` e reabra a sessão.

Trate `/` e `@` como equivalentes o tempo todo: sempre que citar um comando, use o prefixo da ferramenta do aluno.

**2c. Node — o motor de alguns comandos**

```bash
node --version
```

- Aparece algo como `v18...` ou maior: ótimo, siga.
- "command not found": ofereça instalar. Caminho mais simples pro leigo: baixar a versão **LTS** em `https://nodejs.org`. Pergunte antes. (Node não é preciso pra tudo — se o aluno não quiser instalar agora, siga; avisamos quando alguma peça realmente precisar.)

**2d. Apify — a chave (central, não opcional)**

O Apify é o que faz o cohort sair na internet e trazer **dados reais** (anúncios do concorrente, Reels, tendências). Sem a chave, as skills de espionagem/tendência/conteúdo/criativos não conseguem coletar. Então a gente configura **agora**, com calma.

Primeiro veja se a chave já está salva:

```bash
grep -E "APIFY_API_(TOKEN|KEY)" .env 2>/dev/null && echo "chave encontrada" || echo "sem chave ainda"
```

(O check procura os **dois** nomes: `APIFY_API_TOKEN` — o oficial do Apify — e `APIFY_API_KEY`. Qualquer um dos dois vale; as skills aceitam ambos.)

- **"chave encontrada"**: perfeito, Apify pronto. Siga.
- **"sem chave ainda"**: guie o aluno, passo a passo, sem pressa:
  1. Abra `https://console.apify.com` no navegador e faça login (ou crie a conta grátis).
  2. No menu, vá em **Settings → API & Integrations** (ou "Integrations"). Ali aparece o **Personal API token** — uma senha comprida começando com `apify_api_...`.
  3. Copie esse token.
  4. Volte aqui e **cole o token no chat**. Eu salvo pra você no arquivo `.env` (é onde ficam as senhas do projeto), assim:

```bash
# o Claude executa isto com o token que o aluno colou (nunca invente o valor):
# grave sempre com o nome oficial APIFY_API_TOKEN (APIFY_API_KEY também é aceito pelas skills):
echo 'APIFY_API_TOKEN=apify_api_COLE_O_SEU_AQUI' >> .env
```

  5. Confirme que salvou repetindo o `grep` acima.

  - Se o aluno **não tiver a chave agora** (não achou, conta ainda não criada): **não trave o onboarding**. Diga que dá pra seguir pro primeiro comando (o começo do funil não usa Apify) e que a gente configura a chave junto na hora que a primeira skill de coleta precisar. Deixe o passo anotado como pendência.

> Nunca "pule o Apify" como padrão. Fallback (busca manual) é só quando o Apify **realmente falha** (ex.: cota mensal estourada) — e aí você avisa e retoma quando renovar. O default é: configurar a chave.

**2e. Python — para as coletas da Aula 1 e o DOCX do offerbook**

```bash
python --version
```

- Se falhar, tente `py --version` (no Windows o lançador costuma ser `py`).
- Aparece algo como `Python 3...`: ótimo, siga.
- Python é dependência **real** das skills de coleta da Aula 1 e da geração do DOCX do offerbook. Se faltar, ofereça instalar de `https://www.python.org` marcando a caixa **"Add Python to PATH"** durante a instalação (sem isso, o terminal não acha o `python` depois). **Pergunte antes de instalar.**
- Aviso importante no Windows: digitar `python` **sem ter instalado** abre a **loja da Microsoft** (é o "stub" da Microsoft, não um erro do aluno) — se isso acontecer, é sinal de que o Python ainda não está instalado; feche a loja e siga pela instalação do python.org.
- Fallback: se o aluno não quiser instalar agora, **não trave** — siga pro primeiro comando e instale quando a primeira coleta realmente precisar. Deixe anotado como pendência.

### Passo 3 — Confirmar que as skills carregaram

Peça pro aluno digitar, no chat do Claude Code / Codex, só o caractere de comando e olhar a listinha que aparece:

- No **Claude Code**: digite `/` e comece a escrever `funil` — aparecem as skills de funil (`avatar-funil`, `copy-funil`, `pagina-vendas-funil`, `status-funil`…). O `offerbook` não tem "funil" no nome: pra achá-lo, escreva `offer`.
- No **Codex**: digite `@` e faça o mesmo.

- **Apareceram**: pronto, ambiente montado. Vá pro Passo 4.
- **Não apareceram nada**: não trave. Cheque se você (Claude/Codex) está rodando **dentro da pasta do projeto** (o `ls` do Passo 1 mostrando `.claude/` confirma). No Codex, confirme que `.agents/skills/` existe e está espelhada de `.claude/skills/` (ver 2b). Se ainda assim não vierem, peça pro aluno fechar e reabrir a ferramenta na pasta e rodar `/comecar` de novo — a gente recomeça sem susto.
- **Apareceram DUAS `/design-md`** na listinha: é a versão **antiga da Aula 1**, instalada **global** (em `~/.claude/skills/design-md`), brigando com a do projeto (em `.claude/skills/design-md`). Precisa ficar **só uma** — a do projeto. Oriente a remover/atualizar a global antiga. Mostre só o caminho do SO detectado (Passo 0):
  - **macOS / Linux:** a global fica em `~/.claude/skills/design-md`. Compare com a do projeto; se for a versão velha, apague com `rm -rf ~/.claude/skills/design-md` (pergunte antes de rodar).
  - **Windows:** a global fica em `C:\Users\SeuNome\.claude\skills\design-md`. Apague essa pasta antiga pelo Explorador de Arquivos (ou `rmdir /s "%USERPROFILE%\.claude\skills\design-md"`); pergunte antes.
  - Depois de apagar, peça pra **fechar e reabrir a sessão** — deve sobrar só uma `/design-md` (a do projeto).

### Passo 4 — O primeiro comando (UM só)

Aponte **um único** próximo passo, conforme a aula do aluno. Não liste vários; não crie ansiedade. Pergunte só se não der pra inferir:

- **Aula 1 (pesquisa → oferta):** o primeiro comando é **`/avatar-funil`** (no Codex, `@avatar-funil`). É a pesquisa de mercado e de avatar — a fundação de tudo. Não tem pré-requisito.
- **Aula 2 (identidade → funil):** o primeiro comando é **`/design-md`** (no Codex, `@design-md`). É a identidade visual da marca, que as peças do funil vão usar.

Se não estiver claro em qual aula o aluno está, pergunte em uma linha: "Você está na **Aula 1** (começar pela pesquisa) ou na **Aula 2** (começar pelo design)?" e aponte o comando certo.

Feche assim, com o prefixo da ferramenta do aluno:

> "Está tudo pronto. Seu próximo passo é **um só**: digite `/avatar-funil` e aperte Enter. Eu te guio a partir dali. Qualquer erro, é só chamar `/comecar` de novo — a gente destrava juntos."

---

## Regras invioláveis (herdadas de `nunca-travar.md`)

1. **Nunca deixe o aluno num beco.** Todo passo termina com um comando exato + o que era pra acontecer + a saída se der errado.
2. **Ferramenta faltando = oferecer instalar em 1 linha (perguntar antes) + fallback.** Nunca falhar calado.
3. **Apify é central, não opcional.** Faltou a chave → ajude a configurar (console → grave `APIFY_API_TOKEN` no `.env`; `APIFY_API_KEY` também é aceito — o check procura os dois). Fallback só quando o Apify realmente falha.
4. **git pull na pasta que existe, NUNCA clone novo.** Nunca sobrescreva o trabalho do aluno; conflito = preservar e seguir.
5. **Nunca assuma macOS.** Detecte o SO no Passo 0 e mostre só os caminhos do SO do aluno.
6. **Um único próximo passo no fim.** Sempre `/avatar-funil` (Aula 1) ou `/design-md` (Aula 2) — nunca uma lista.
7. **Não infantilize o avançado.** Explicações extras vão curtas e entre parênteses; quem sabe passa reto.
