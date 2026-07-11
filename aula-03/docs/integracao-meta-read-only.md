# Integração Meta em modo read-only

O adapter compartilhado está em [`services/meta-ads/`](../../services/meta-ads/). Ele resolve credenciais por spoke fora do Git, chama o CLI oficial e higieniza a saída antes de devolvê-la.

## O que a integração atual faz

- valida autenticação com `meta auth status`;
- consulta insights em modo de leitura;
- lista campanhas, conjuntos, páginas e outros recursos suportados pelo CLI;
- persiste snapshots quando o `insights-runner.js` é usado;
- falha fechado em caso de credencial ausente, CLI indisponível ou timeout.

## O que ela não faz

- não publica campanhas;
- não pausa, escala ou altera anúncios;
- não guarda tokens na pasta da Aula 03;
- não transforma dados da plataforma em venda confirmada.

Consulte o README do adapter para o onboarding de um novo spoke. O pacote didático deve referenciar a integração, não duplicar sua implementação.
