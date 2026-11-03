# Painel local (HTML) — Núcleo

Data: 2026-11-03
Status: rascunho para revisão

## Contexto

O aluno hoje executa as skills do cohort pelo Claude Code (app desktop ou terminal). A meta do painel é fazer todo o trabalho (avatar, funil, pesquisa de concorrente, redline, roteiro, análise do gerenciador de anúncios) por uma interface HTML local, sem usar o terminal.

O Marketing Studio existente (`iniciar-studio`) não pode ser estendido: o código-fonte não está neste repositório nem disponível ao autor. O painel é, portanto, um app novo, independente, neste repo.

## Decomposição

Cada item tem seu próprio spec, plano e entrega.

1. **Núcleo** (este spec): servidor, runner de skills, streaming, seletor de projeto, visualizador de arquivos.
2. **Funil**: telas e gatilhos de avatar, concorrente, offerbook, copy, VSL e demais skills do funil.
3. **Aprovações**: redline e roteiro com comentário por trecho.
4. **Tráfego**: painel do gerenciador de anúncios e board de especialistas.

Este spec cobre só o item 1, deixando encaixes (registro de skills e de telas) para os itens 2 a 4.

## Objetivo do núcleo

Abrir um painel no navegador, escolher um projeto de `projetos/{slug}/`, disparar uma skill, acompanhar a execução em tempo real, responder às perguntas da skill e ver os arquivos gerados.

## Fora do escopo

Multiusuário, hospedagem em nuvem, login, telas específicas de cada skill, aprovação por trecho, painel de tráfego.

## Arquitetura

- `painel/server.mjs`: servidor Node sem dependências externas, escutando somente em `127.0.0.1`. Iniciado com `node painel/server.mjs`, abre o navegador no endereço local.
- `painel/web/`: frontend HTML/JS puro, sem etapa de build.
- Estado: arquivos de `projetos/{slug}/` (fonte da verdade). Metadados do painel em `projetos/{slug}/.painel/`, incluindo o log de cada run.

## Runner de skills

- Executa `claude -p "<invocação da skill>" --output-format stream-json` com `cwd` na raiz do repositório. As skills de `.claude/skills/` rodam como hoje.
- Cada run recebe um `run_id` e guarda o `session_id` da sessão do Claude Code.
- Continuação de uma sessão (resposta a pergunta da skill) usa `--resume <session_id>`.
- O stream é gravado em `projetos/{slug}/.painel/runs/{run_id}.jsonl` e reenviado ao navegador por SSE.
- Fila por projeto: uma skill por vez em cada projeto. Projetos diferentes podem rodar em paralelo.
- Cancelar encerra o processo filho do run.

## API (HTTP local)

- `GET /api/projetos`: lista projetos.
- `GET /api/projetos/:slug/arquivos`: árvore de arquivos do projeto.
- `GET /api/projetos/:slug/arquivo?path=...`: conteúdo de um arquivo (md, html, json, imagem).
- `GET /api/skills`: skills disponíveis (lidas de `.claude/skills/*/SKILL.md`).
- `POST /api/runs`: inicia run `{ skill, projeto, args }`.
- `GET /api/runs/:id/events`: stream SSE do run.
- `POST /api/runs/:id/resposta`: resposta a uma pergunta da skill (continua via `--resume`).
- `POST /api/runs/:id/cancelar`: cancela o run.
- `GET /api/diagnostico`: checa `claude` instalado e autenticado.

## Interface do núcleo

- Barra lateral: seletor de projeto e lista de skills.
- Área principal: log do run em andamento (texto, ferramentas usadas, estado), com formulário quando a skill pede uma decisão.
- Painel de arquivos: árvore do projeto e visualizador (markdown renderizado, HTML em iframe isolado, JSON formatado, imagens).
- Tela de diagnóstico quando o ambiente não está pronto.

## Encaixes para os próximos sub-projetos

- Registro de skills (`painel/web/skills/`): cada skill pode declarar uma tela própria e seus argumentos. No núcleo, todas usam a tela genérica de run.
- O visualizador aceita "extensões" por tipo de arquivo, para o item 3 plugar a revisão com comentário por trecho.

## Erros e segurança

- `claude` ausente ou sem login: tela de diagnóstico com o comando exato para corrigir, no espírito de `.claude/skills/_shared/nunca-travar.md`.
- Run travado ou navegador fechado: o run continua no servidor; reabrir o painel retoma pelo log em disco.
- Falha da skill: mostra a última mensagem, preserva arquivos parciais, oferece tentar de novo.
- Servidor só em `127.0.0.1`. Todo caminho de arquivo é resolvido e validado dentro de `projetos/`, rejeitando `..` e links simbólicos que saiam do diretório.
- Requisições que alteram estado exigem token aleatório gerado a cada inicialização e entregue à página servida pelo próprio servidor, para impedir chamadas de outros sites no navegador.

## Testes

- Unitários com `node --test` (padrão já usado em `scripts/`): validação de caminhos, parser do stream-json, fila por projeto, leitura do log de run.
- Runner testado com um `claude` falso (script que emite stream-json fixo), sem consumo de tokens.
- Verificação manual: um run real de uma skill curta ponta a ponta no navegador.

## Critérios de aceite

1. `node painel/server.mjs` abre o painel sem instalar dependências.
2. É possível escolher um projeto, rodar uma skill e ver a saída em tempo real.
3. Perguntas da skill aparecem como formulário e a resposta continua a mesma sessão.
4. Arquivos gerados aparecem no visualizador sem recarregar a página.
5. Fechar e reabrir o painel durante um run retoma o acompanhamento.
6. Nenhum arquivo fora de `projetos/` é acessível pela API.

## Questões em aberto

- Como detectar de forma confiável, no stream-json, que a skill está esperando uma resposta do usuário (a validar no primeiro protótipo do runner).
- Se o aluno usa Codex em vez de Claude Code, o runner precisará de um adaptador; fora do núcleo por ora.
