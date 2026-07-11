# Pendências — regra de escrita compartilhada (dedup por decisão)

> Referenciada por toda skill que grava `projetos/{slug}/pendencias.md`. Corrige o bug do re-run (14→17): a mesma decisão nunca deve recontar.

Sempre que a skill deixar um placeholder do dono (`[DONO ...]`, `[A PREENCHER]`, `[PLUG ...]`, `[SEM PROVA AINDA]`, `[N]`), registre em `projetos/{slug}/pendencias.md` **agrupando por DECISÃO** (uma decisão resolve vários arquivos), não por arquivo.

**Chave por decisão (regra dura — mata a duplicação no re-run):**
- Cada pendência tem uma **chave estável** = o slug da decisão (ex.: `checkout-link`, `especialista-rosto`, `bonus-janela`, `pixel-id`). Grave a chave no item (ex.: `<!-- key: checkout-link -->` ou um prefixo).
- Antes de adicionar, **procure a chave**. Se já existir → **ATUALIZE a entrada** (mescle os arquivos afetados), NÃO crie uma nova. Se não existir → cria.
- Rodar a skill de novo **reconcilia** a lista (mesma chave = mesmo item), nunca soma. O placar (abertas/aplicadas) conta chaves únicas.
- Quando o dono informa um valor, marque a chave como resolvida e atualize TODOS os arquivos afetados de uma vez.

O `/status-funil` lê esse arquivo e mostra o placar por chave (não por linha), então re-runs não inflam o número.
