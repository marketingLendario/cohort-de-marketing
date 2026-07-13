# Integração Meta em modo read-only

O adapter compartilhado está em [`services/meta-ads/`](../../services/meta-ads/). Ele resolve credenciais por spoke fora do Git, chama o CLI oficial e higieniza a saída antes de devolvê-la.

## Os dois entrypoints

O pacote expõe exatamente dois comandos, ambos de leitura:

| Entrypoint | O que faz |
|---|---|
| `services/meta-ads/index.js` | Lista os spokes disponíveis (`--list-spokes`) e valida as credenciais de um spoke (`--check --spoke=<slug>`, que roda `meta auth status`). |
| `services/meta-ads/insights-runner.js` | Coleta insights, campanhas e páginas em modo de leitura e grava os snapshots em JSON. |

## O que a integração atual faz

- valida autenticação com `meta auth status`;
- consulta insights em modo de leitura;
- lista campanhas e páginas ao gerar os snapshots do `insights-runner.js`;
- persiste esses snapshots em disco;
- falha fechado em caso de credencial ausente, CLI indisponível ou timeout.

## O que ela não faz

- não publica campanhas;
- não pausa, escala ou altera anúncios;
- não expõe comandos arbitrários do CLI da Meta: qualquer argumento fora dos dois entrypoints acima é recusado com código de saída 2, antes de qualquer chamada ao CLI;
- não guarda tokens na pasta da Aula 03;
- não transforma dados da plataforma em venda confirmada.

Não há flag, variável de ambiente ou atalho que reabra a escrita. Uma consulta nova precisa entrar como operação nomeada, testada e de leitura.

Consulte o README do adapter para o onboarding de um novo spoke. O pacote didático deve referenciar a integração, não duplicar sua implementação.
