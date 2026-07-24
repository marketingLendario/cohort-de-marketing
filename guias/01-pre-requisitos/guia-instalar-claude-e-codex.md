# GUIA INSTALAR CLAUDE (E CODEX) — a ferramenta na mão, aberta no lugar certo

> **Estou perdido em:** "ainda não instalei o Claude Code / instalei e as skills não aparecem / uso Codex, muda algo?"
> **O que você vai ter no final:** o Claude Code instalado, logado no SEU plano, aberto NA RAIZ do projeto e com as skills aparecendo — e a variação Codex explicada.
> **Fontes cruzadas:** `GUIA-DO-ALUNO.html` Parte 0 (repo) · vídeos de instalação do **Cohort Fundamentals** no [portal de cursos](https://membros.academialendaria.ai/m/courses?tenant=1749742382792) (o clique a clique oficial — apontamos, não duplicamos) · doc oficial de instalação do Claude Code (`code.claude.com/docs/pt/setup`, consultada 22/07) · travadas reais ("skills não aparecem" = abriu na subpasta).
> Este guia é **LEVE/apontador**: o vídeo do portal é a fonte visual; aqui fica o resumo + os erros.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Você sabe abrir o terminal na pasta certa | leia [guia-terminal-e-pastas.md](guia-terminal-e-pastas.md) (10 min) |
| 🔑 Conta | Assinatura ativa do Claude (Pro/Max) — é ela que o Claude Code usa | `claude.ai` → assinar; sem plano o login não completa |
| 📖 Conhecimento | *(Recomendado)* o vídeo de instalação do Fundamentals | assista no [portal de cursos](https://membros.academialendaria.ai/m/courses?tenant=1749742382792) |

## Passo a passo (10 min)

1. **Instalar** (doc oficial: `code.claude.com/docs/pt/setup`):
   - **Windows:** abra o **PowerShell** e rode: `irm https://claude.ai/install.ps1 | iex` (instalador nativo — não precisa de WSL).
   - **Mac/Linux:** `curl -fsSL https://claude.ai/install.sh | bash`.
2. **Feche e reabra o terminal** (o comando novo só "aparece" em terminal novo).
3. Abra o terminal **NA RAIZ do projeto** `cohort-de-marketing` ([como](guia-terminal-e-pastas.md)) e digite `claude`.
4. **Login (1ª vez):** ele abre o navegador pra você entrar com a conta do seu plano → autorize → volte ao terminal.
5. **Prova das skills:** digite `/` + "funil" → a lista aparece com as skills do cohort.
6. Rode `/comecar` — o passo zero oficial: confere skills, `.env`, Node/Python e te entrega UM próximo passo.

## E o Codex? (se você usa ChatGPT)

- Funciona também: o repositório mantém `.agents/skills/` como **espelho pronto** — depois do `git pull` o Codex já enxerga as skills (invoque com `@nome`). Detalhes e manhas: [guia-codex.md](guia-codex.md).
- A diferença prática: no Codex as páginas `.html` não abrem sozinhas (abra com dois cliques) e a invocação é `@` em vez de `/`.

## Dois avisos de custo (antes que doa)

- Os **tokens do plano são finitos** — conversa longa e modelo pesado consomem mais; as skills rodam bem sem o modelo mais caro. Detalhe completo: [guia-quanto-custa](../02-conhecimento-minimo/guia-quanto-custa.md).
- **Shift+Tab** liga o modo automático (menos confirmações). Prático, mas gaste-o quando já confiar no fluxo.

## Teste de sucesso

No terminal, `claude --version` responde com um número de versão; dentro do Claude (aberto na raiz), `/` + "funil" lista as skills. Os dois verdes = instalado e no lugar certo.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| N1 | `claude não é reconhecido` depois de instalar | terminal aberto antes da instalação | feche e reabra o terminal; persiste → rode o instalador de novo e cole a saída na conversa de qualquer IA |
| N2 | **Skills não aparecem** | abriu fora da raiz do projeto (o clássico) | feche → terminal NA pasta `cohort-de-marketing` → `claude` → `/` + "funil" |
| N3 | Login não completa / pede assinatura | o Claude Code exige plano ativo (Pro/Max) na conta usada | confira em `claude.ai` qual conta tem o plano; faça login com ELA |
| N4 | Instalador do PowerShell dá erro de permissão/política | política de execução do Windows | abra o PowerShell **como Administrador** e rode de novo; persiste → o vídeo do Fundamentals mostra o caminho alternativo |
| N5 | Instalou via `npm` e deu erro de versão do Node | o caminho npm exige Node recente e não é o recomendado | use o instalador oficial do passo 1 (não depende do seu Node) |
| N6 | "Instalei mas está TUDO em outra pasta" | rodou o `claude` fora do projeto e ele trabalhou onde estava | nada se perdeu: feche, abra na raiz certa e siga; arquivos criados no lugar errado podem ser movidos depois |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/comecar` dentro do Claude — ele valida a instalação inteira e aponta o próximo passo |
| 📖 Ler | ainda não clonou o projeto? [guia-git-clonar-e-atualizar.md](guia-git-clonar-e-atualizar.md) · usa Codex? [guia-codex.md](guia-codex.md) |
| 🚑 Se travar | o catálogo N1–N6 acima — e o vídeo oficial de instalação no portal do Fundamentals |
