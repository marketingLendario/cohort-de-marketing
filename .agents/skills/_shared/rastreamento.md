# Rastreamento pixel-ready — regra canônica compartilhada (skills que geram página de lead)

> Texto integral da regra que antes vivia duplicada nas skills de página. A skill carrega a versão compacta (com a SUA lista de eventos) e lê ESTE arquivo ao gerar a página.

**A página nasce PIXEL-READY; os IDs entram na Aula 3 (Tráfego).** Nenhuma página do funil nasce cega, mas esta etapa não cria fricção: **NÃO mande o aluno pro Gerenciador de Eventos agora.** Toda página gerada sai com os snippets de **Meta Pixel** (recomendado: constrói a audiência de remarketing) e **GTM** (opcional: gerencia tags sem mexer em código) **prontos porém COMENTADOS** no `<head>` (+ `<noscript>` após `<body>`), com placeholders `[PLUG: SEU_PIXEL_ID]` / `[PLUG: GTM-XXXXXXX]` e os eventos-padrão da peça já ligados no código (a lista de eventos é definida na SKILL.md de cada peça).

Diga ao aluno em 1 linha: *"a página já nasce pronta pra rastreamento; os IDs a gente cria e pluga na Aula 3 (Tráfego): é colar 2 códigos e descomentar"*. Exceção: se o aluno JÁ tiver Pixel/GTM, pergunte os IDs e entregue plugado. Lembrete de LGPD: aviso de cookies/consentimento é responsabilidade do aluno. Os eventos alimentam a planilha de KPIs do `/cro-funil`.

**Página de negócio LOCAL (Perfil tipo = físico/varejo-local):** a lista de eventos troca. No lugar de `Lead`/`checkout` (que pressupõem venda online), os eventos-padrão viram **clique-WhatsApp · clique-rota/mapa · clique-ligar** — são esses os KPIs que o `/cro-funil` local mede (contato, deslocamento até o ponto, ligação). Mantenha os snippets do Pixel/GTM comentados do mesmo jeito, só ajuste os eventos ligados no código pro comportamento de um negócio de bairro.

**Layout da página do lead (regra dura, vale pra toda página gerada):** (1) com vídeo, o CTA fica SEMPRE ABAIXO do vídeo, nunca acima — badges/selos vêm DEPOIS do CTA, nunca entre a headline e o vídeo; (2) CTA sempre centralizado, em toda dobra; (3) no mobile, o vídeo aparece na primeira dobra, sem rolar — se não couber, enxugue o que vem antes, nunca empurre o vídeo pra baixo; (4) **jargão interno do método NUNCA vira texto visível na página do lead** — nada de "Big Idea", "mecanismo único", "ancoragem", "stack de valor", "prova social", "escassez", "OTO", "upsell" como eyebrow/rótulo/título de seção; esses nomes vivem nos documentos internos do dono.

**Slot de vídeo nasce com roteiro:** página com vídeo NUNCA fica só com placeholder — gere também o ROTEIRO do vídeo a partir do `copy.md` (gancho, espelho/narrativa, mecanismo, convite, fecho; fala pronta, texto na tela, notas de gravação) como HTML próprio na pasta `pagina/`, e o slot inclui o botão "Ver roteiro do vídeo". O dono grava e troca o slot pelo player.

**Sem barra de revisão dentro da página:** a página do lead NÃO leva barra de revisão, atalhos internos nem bastidor — a navegação entre peças mora no Book do Funil, fora da página.
