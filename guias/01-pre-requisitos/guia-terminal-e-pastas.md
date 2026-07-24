# GUIA TERMINAL E PASTAS — o chão de tudo (sem isso, nada roda)

> **Estou perdido em:** "não entendi o que é pra fazer nesse terminal / abri e as skills não aparecem / arrastei a pasta e sumiu tudo".
> **O que você vai ter no final:** você abre o terminal JÁ NA PASTA CERTA do projeto, sabe conferir onde está, conhece as teclas de sobrevivência e entende por que NUNCA se arrasta a pasta do projeto no Explorador.
> **Fontes cruzadas:** `GUIA-DO-ALUNO.html` Parte 0 (repo — o texto-base) · o funcionamento real do Claude Code (só enxerga a pasta onde foi aberto) · travadas REAIS da Aula 1 ("não entendi o que é para fazer"; a pasta oculta `.claude` perdida ao arrastar no Finder — debugado ao vivo) · pesquisa web 22/07 (Explorador sem barra de endereço/travado — Microsoft Support/Q&A).

## Pré-requisitos (confira ANTES)

**Nenhum — este é o guia de entrada do ambiente.** Se "terminal" é uma palavra nova pra você, começa exatamente aqui (10 min).

## 1. O que é o terminal (2 frases)

O **terminal** é a janelinha onde você digita comandos em vez de clicar em botões — é por ele que o Claude Code roda. *Analogia: o balcão de pedidos do computador — você fala o que quer por escrito, ele executa.*

## 2. Abrir o terminal NA PASTA CERTA (a regra de ouro)

O Claude Code **só enxerga a pasta onde foi aberto**. Abriu no lugar errado = skills "somem". Por isso, o jeito certo de abrir já elimina o erro:
- **Windows:** abra o **Explorador de Arquivos** → navegue até a pasta `cohort-de-marketing` → clique na **barra de endereço** no topo → digite `cmd` → Enter. O terminal abre JÁ DENTRO da pasta.
- **Mac:** Spotlight (`Cmd + espaço`) → digite `Terminal` → Enter → digite `cd ` (com espaço) e **arraste a pasta** `cohort-de-marketing` pra janela → Enter.

**Conferir onde você está** (faça sempre que desconfiar): digite `dir` (Windows) ou `ls` (Mac/Linux) — deve listar as pastas do projeto (`aula-01`, `guias`, `projetos`...). Não listou? Você está na pasta errada.

## 3. A pasta oculta `.claude` (o segredo que quebra tudo)

Dentro do projeto existe a pasta **`.claude`** — é onde vivem as skills. Ela é **OCULTA**: o Explorador/Finder não mostra por padrão, mas ela ESTÁ lá.
- **Ver ocultos:** Windows: Explorador → **Exibir → Mostrar → Itens ocultos**. Mac: `Cmd + Shift + .` no Finder.
- ⚠️ **NUNCA copie o projeto arrastando a pasta** no Finder/Explorador: em algumas situações os ocultos ficam pra trás e as skills somem (caso real, debugado ao vivo em aula). Precisa do projeto em outro lugar/máquina? **Clone de novo com git** ([guia-git-clonar-e-atualizar](guia-git-clonar-e-atualizar.md)) — nunca arraste.

## 4. Kit de sobrevivência (as 4 teclas que resolvem 90%)

| Tecla | O que faz |
|---|---|
| **Esc** | cancela uma pergunta/ação pendente do Claude |
| **↑** (seta pra cima) | repete o último comando digitado |
| **Shift+Tab** | liga o modo de aceitação automática (o Claude para de pedir confirmação a cada passo) — use só quando já confia no fluxo |
| **Ctrl+C** | interrompe um comando travado no terminal |

E **nunca** use `--dangerously-skip-permissions` sem entender o risco — remove TODAS as proteções de uma vez.

## 5. Abrir os `.html` que as skills geram

No Claude Code costumam abrir sozinhos. Se não abrir (ou no Codex): dois cliques no arquivo, ou no terminal:
- Windows: `start "" caminho\do\arquivo.html` (barra invertida `\`, aspas vazias depois do start)
- Mac: `open caminho/do/arquivo.html` · Linux: `xdg-open caminho/do/arquivo.html`

## Teste de sucesso

Abra o terminal pelo caminho da seção 2 e digite `dir` (ou `ls`): a lista mostra `aula-01`, `guias`, `projetos`... Depois abra o `claude` e digite `/` + "funil": as skills aparecem na lista. Os dois verdes = seu chão está pronto.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| W1 | `git não é reconhecido` / `command not found` | o Git não está instalado | Windows: instale de `git-scm.com/download/win` → feche e REABRA o terminal; Mac: aceite a instalação que o próprio terminal oferece |
| W2 | **Skills não aparecem** no Claude/Codex | abriu a IA fora da raiz do projeto (ou numa subpasta) | feche → abra o terminal DENTRO da pasta `cohort-de-marketing` (seção 2) → reabra a IA → `/` + "funil" |
| W3 | Copiei/arrastei o projeto e **as skills sumiram** | o arraste perdeu a pasta oculta `.claude` | não tente consertar na mão: clone o projeto de novo com git na pasta nova ([guia-git-clonar-e-atualizar](guia-git-clonar-e-atualizar.md)); seu trabalho em `projetos/` pode ser copiado por cima depois |
| W4 | O `cmd` abriu em `C:\Windows\System32` (pasta errada) | você abriu o terminal pelo menu Iniciar, não pela pasta | use o caminho da seção 2 (barra de endereço do Explorador → `cmd`); ou digite `cd C:\caminho\ate\cohort-de-marketing` |
| W5 | "Não vejo a pasta `.claude`" | ela é oculta (é normal!) | Exibir → Itens ocultos (Windows) ou `Cmd+Shift+.` (Mac); e mesmo invisível ela funciona — não precisa vê-la pra usar |
| W6 | O `.html` da skill **não abriu sozinho** | comportamento normal fora do Claude Code | dois cliques no arquivo, ou os comandos da seção 5 — o arquivo NÃO está quebrado |
| W7 | A **barra de endereço do Explorador sumiu**/o Explorador travou (não dá pra digitar `cmd`) | o processo do Explorador bugou (acontece após atualização do Windows) | Ctrl+Shift+Esc (Gerenciador de Tarefas) → ache **"Windows Explorer"** → botão direito → **Reiniciar** (fonte: Microsoft Support); alternativa: Shift + clique direito DENTRO da pasta → "Abrir janela do PowerShell aqui" |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | ainda sem o Claude instalado? é o próximo guia; já tem tudo? rode `/comecar` — ele confere o ambiente inteiro |
| 📖 Ler | [guia-instalar-claude-e-codex.md](guia-instalar-claude-e-codex.md) → [guia-git-clonar-e-atualizar.md](guia-git-clonar-e-atualizar.md) → [guia-env-e-chaves.md](guia-env-e-chaves.md) |
| 🚑 Se travar | o catálogo W1–W7 acima (git não reconhecido, skills sumidas, pasta errada, Explorador travado...) |
