# Painel local do Funil

Interface HTML que roda as skills do cohort pelo Claude Code, sem usar o terminal para conduzir o trabalho.

## Como rodar

Abra sempre pelo servidor. Abrir `painel/web/index.html` direto do Finder não funciona.

Requisitos: Node 22+ e Claude Code instalado e com login (`claude`).

```bash
node painel/server.mjs
```

O painel abre no navegador em `http://127.0.0.1:4747/` (ou na próxima porta livre). O layout segue o do Claude: à esquerda, o cliente (cada cliente é uma pasta em `projetos/`; o botão + cadastra um novo) e os arquivos dele; no centro, a conversa com a barra de escrita fixa embaixo, onde você escolhe a skill pelo botão **Skills** ou digitando `/`; à direita, o histórico do cliente em ordem e o botão **Avaliar conta**, que mostra as etapas do funil entregues, a próxima, as execuções, o gasto com IA e as pendências. Quando a skill usa a ferramenta de perguntas, as opções aparecem como botões, e depois que o turno termina a caixa de resposta permite continuar a mesma sessão. Os dois recursos foram verificados com o Claude Code real.

## Variáveis de ambiente

| Variável | Efeito |
|---|---|
| `PAINEL_PORT` | Porta inicial (padrão 4747; tenta até +9) |
| `PAINEL_NO_OPEN=1` | Não abre o navegador |
| `PAINEL_PERMISSION_MODE` | Modo de permissão do Claude Code (padrão `acceptEdits`) |
| `PAINEL_CLAUDE_BIN` | Caminho alternativo do executável `claude` |
| `PAINEL_FAKE=1` | Usa um claude falso (desenvolvimento da interface). Escreva `[pergunta]`, `[lento]` ou `[erro]` nas instruções para simular cada caso |

## Segurança

- Escuta somente em `127.0.0.1`; rejeita `Host` e `Origin` externos.
- Toda rota `/api` exige um token novo a cada inicialização, entregue à página servida pelo próprio servidor.
- A API só lê arquivos dentro de `projetos/`; `..`, caminhos absolutos e symlinks que escapam são recusados. `projetos/{slug}/.painel/` (logs dos runs) não é servido.
- O Claude Code roda com as ferramentas `Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Skill` pré-aprovadas e o modo de permissão acima. **Risco:** como `Bash`, `WebFetch` e `WebSearch` ficam liberados sem confirmação, uma página da web maliciosa lida por uma skill de pesquisa (concorrente, trend, swipe) pode tentar executar comandos na sua máquina, por exemplo ler o `.env` com a chave do Apify. Rode o painel só no seu computador, só com projetos seus, e não deixe a porta exposta na rede. O painel mostra esse aviso no topo da tela. Restringir as ferramentas por skill é uma melhoria futura.

## Estado e logs

Cada run grava `projetos/{slug}/.painel/runs/{id}.meta.json` e `{id}.jsonl`. Fechar o navegador não interrompe o run; reabra o painel e escolha-o em "Execuções". Se o servidor for reiniciado no meio de um run, ele aparece como "Erro: interrompido".

## Testes

```bash
cd painel && npm test
```

## Limitações conhecidas

- Uma skill por vez por projeto (fila); projetos diferentes rodam em paralelo.
- Só Claude Code (não Codex).
- Telas específicas por skill, redline/roteiro com comentário por trecho e painel de tráfego são os sub-projetos seguintes.
- Verificado com o Claude Code real (2.1.185): `/status-funil` roda em modo headless (`claude -p "/skill ..."`), com streaming, estado "Concluído" e custo. O resultado final de um turno pode chegar cerca de um minuto depois do texto final, e o estado continua "Executando" nesse intervalo.
- Verificado com o Claude Code real em 2026-11-03: a resposta de acompanhamento continua a mesma sessão (`--resume`, mesmo `session_id` e contexto preservado). Em modo headless, `AskUserQuestion` aparece no stream como pergunta, a ferramenta é recusada pelo próprio Claude Code e o turno termina; o painel mostra as opções como botões e envia a escolha na mesma sessão. Se o texto das instruções parecer uma ordem para o modelo ("faça X antes de tudo"), ele pode tratá-lo como injeção e ignorar; escreva as instruções como contexto do pedido.
