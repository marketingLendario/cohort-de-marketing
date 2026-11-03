# Painel local do Funil

Interface HTML que roda as skills do cohort pelo Claude Code, sem usar o terminal para conduzir o trabalho.

## Como rodar

Requisitos: Node 22+ e Claude Code instalado e com login (`claude`).

```bash
node painel/server.mjs
```

O painel abre no navegador em `http://127.0.0.1:4747/` (ou na próxima porta livre). Escolha o projeto de `projetos/{slug}/`, clique numa skill, escreva instruções opcionais e rode. Perguntas da skill viram botões; depois que o turno termina, a caixa de resposta permite pedir ajustes na mesma sessão.

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
- O Claude Code roda com as ferramentas `Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Skill` pré-aprovadas e o modo de permissão acima. Rode o painel só no seu computador.

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
- Não verificado com o Claude Code real: a resposta de acompanhamento na mesma sessão (`--resume`) e o cartão de pergunta (`AskUserQuestion`). A skill `status-funil` não faz perguntas, e o limite de sessão da conta foi atingido durante o teste; o painel mostrou a mensagem do limite como erro. Ambos seguem cobertos apenas pelos testes com o claude falso.
