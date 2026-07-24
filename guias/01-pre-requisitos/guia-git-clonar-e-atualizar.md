# GUIA GIT — clonar o projeto (1ª vez) e mantê-lo atualizado

> **Estou perdido em:** "como baixo o projeto pro meu computador? / o git pediu senha e não aceita / criei uma pasta e virou pasta dentro de pasta".
> **O que você vai ter no final:** o projeto `cohort-de-marketing` clonado no lugar certo, com credencial que funciona (PAT), sabendo a diferença entre clonar (1ª vez) e atualizar (sempre).
> **Fontes cruzadas:** `GUIA-DO-ALUNO.html` Parte 0 (repo) · [guia-atualizar-projeto](guia-atualizar-projeto.md) (a metade do update, já auditada) · doc oficial do GitHub sobre Personal Access Tokens ([docs.github.com — Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), consultada 22/07) · caso real da Aula 1 ("criar uma pasta para depois clonar… gera erro, porque cria uma pasta dentro da pasta").

## Clonar vs atualizar (1 frase cada)

- **Clonar** = baixar o projeto pela primeira vez (`git clone ...`) — faz UMA vez na vida por máquina.
- **Atualizar** = puxar as novidades (`git pull`) — faz sempre que avisarem que saiu atualização ([guia-atualizar-projeto](guia-atualizar-projeto.md), erros U1–U5).

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Git instalado (`git --version` responde) | Windows: `git-scm.com/download/win` → instale → REABRA o terminal; Mac: o terminal oferece instalar sozinho |
| 📖 Conhecimento | Abrir o terminal na pasta certa | [guia-terminal-e-pastas.md](guia-terminal-e-pastas.md) |
| 🔑 Conta | Conta no GitHub **com acesso ao repositório do curso** (você recebeu o convite) | aceite o convite que chegou no seu e-mail do GitHub |

## Passo 1 — Onde clonar (o erro nº 1, antes de qualquer comando)

⚠️ **NÃO crie uma pasta `cohort-de-marketing` antes.** O `git clone` **JÁ cria a pasta** — quem cria antes acaba com `cohort-de-marketing/cohort-de-marketing` (pasta dentro de pasta, caso real de aula).
Abra o terminal na pasta-MÃE onde você guarda projetos (ex.: `Documentos`) e clone dali.

## Passo 2 — O PAT (a "senha de programa" do GitHub)

O GitHub **não aceita a sua senha normal** no terminal — precisa de um **Personal Access Token (PAT)**:
1. `github.com` → seu avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Nome (`cohort`), validade (90 dias+), **Repository access**: só o repositório do curso → **Permissions**: Repository permissions → **Contents: Read-only** basta pra clonar/atualizar.
3. **Generate** → o token aparece **uma vez** → copie e guarde como senha (gerenciador de senhas; NUNCA em grupo/print).

## Passo 3 — Clonar

```
git clone https://github.com/marketingLendario/cohort-de-marketing.git
```
Quando pedir:
- **Username:** seu usuário do GitHub;
- **Password:** **cole o PAT** (não a senha do site!). No Windows pode abrir uma janelinha de login do GitHub — entrar por ela também vale (e salva a credencial).
Depois: `cd cohort-de-marketing` → `dir`/`ls` confere o conteúdo.

## Teste de sucesso

Dentro da pasta clonada, `git pull` responde **`Already up to date.`** — prova que o clone é um repositório git de verdade, conectado e autenticado. E `/` + "funil" no Claude lista as skills (a pasta oculta `.claude` veio junto).

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| R1 | **"Support for password authentication was removed"** | você digitou a senha do site — o GitHub só aceita PAT no terminal | gere o PAT (passo 2) e use ELE no campo de senha |
| R2 | **Pasta dentro de pasta** (`cohort-de-marketing/cohort-de-marketing`) | criou a pasta antes de clonar | apague a de fora (ou mova a de dentro pro lugar certo) e lembre: o clone cria a pasta sozinho |
| R3 | **"Repository not found"** ou 403 | sem acesso ao repositório privado, ou PAT sem a permissão/repositório certo | 1) aceite o convite do GitHub (e-mail); 2) confira que o fine-grained token inclui O repositório do curso com Contents: Read; 3) URL digitada certinha? |
| R4 | Pede usuário/senha **toda vez** | a credencial não ficou salva | Windows: deixe o Gerenciador de Credenciais salvar (a janelinha do GitHub); Mac: `git config --global credential.helper osxkeychain` → o próximo login fica guardado |
| R5 | Baixou o **ZIP** pelo site em vez de clonar | sem git = sem `git pull` (e o ZIP pode vir sem ajustes de ocultos) | apague e clone com git — é o único caminho que se mantém atualizado |
| R6 | Já clonado, quer **atualizar** | — | é outro guia (uma linha: `git pull`): [guia-atualizar-projeto.md](guia-atualizar-projeto.md), erros U1–U5 |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | `cd cohort-de-marketing` → abra o `claude` → rode `/comecar` |
| 📖 Ler | [guia-env-e-chaves.md](guia-env-e-chaves.md) (o próximo passo do chão) |
| 🚑 Se travar | o catálogo R1–R6 acima (senha recusada, pasta dupla, 403...) |
