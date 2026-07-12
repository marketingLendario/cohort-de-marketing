# Mapa de inputs das skills

> Fonte de verdade auditada: `.claude/skills/*/SKILL.md`.
> `.agents/skills/` é apenas o espelho usado pelo Codex para carregar as mesmas skills.
> Revisado em 09/07/2026.

Este documento mapeia o que cada skill pode pedir ao usuário. A regra geral é:

1. A skill deve ler primeiro os arquivos do projeto em `projetos/{slug}/`.
2. Se a informação já estiver em `offerbook.md`, `copy.md`, `DESIGN.md`, `funil.md`, `avatar.md`, dossiês ou briefs, ela não deve perguntar de novo.
3. Se a informação estiver ausente, ambígua ou depender de uma decisão do dono do projeto, a skill deve perguntar.
4. Quando uma skill gera uma direção criativa, estrutura ou lote de peças, ela pode exigir aprovação antes de continuar.

## Inputs globais

Estes inputs aparecem em várias skills.

### Projeto ativo

Perguntar qual projeto usar quando:

- o usuário não passou `slug`/nicho no comando;
- existe mais de uma pasta em `projetos/`;
- a skill encontra materiais soltos na raiz e precisa confirmar a qual cliente/projeto eles pertencem;
- o contexto for agência/multi-cliente e houver risco de misturar identidades, ofertas ou arquivos.

Se existir uma única pasta em `projetos/`, a skill pode usar essa pasta sem perguntar.

### Perfil do Projeto

O Perfil do Projeto fica normalmente no topo de `offerbook.md`. Se faltar, as skills devem perguntar apenas os campos necessários ao comportamento delas.

Campos do perfil:

- Situação de partida: `rodando`, `do-zero`, `sem-projeto` ou `afiliado`.
- Tipo de oferta: `especialista`, `físico/varejo-local`, `saas-app`, `serviço` ou `b2b`.
- Quem opera: `dono` ou `agência`.
- Nicho regulado: `não`, `saúde/médico`, `jurídico`, `psico` ou `financeiro`.
- Voz: `pessoa` ou `marca`.
- Ticket: `baixo`, `médio`, `alto (5k+)` ou `premium`.

### Destino do fechamento

Algumas skills precisam saber se o funil fecha por:

- venda direta/checkout;
- reunião, diagnóstico ou conversa comercial.

Esse campo pode nascer em `quiz-funil` ou `webinario-funil` e depois orientar e-mail, WhatsApp, página, recuperação, backend e CRO.

### Credenciais e ferramentas

Credenciais não devem ser inventadas. Quando forem necessárias:

- `APIFY_API_TOKEN`: usado por skills de coleta, como `comecar`, `espiao-do-concorrente`, `trend-hunting`, `conteudo-funil` e `criativos-funil`.
- `OPENROUTER_API_KEY`: usado apenas em caminhos avançados do `design-md` quando o provedor escolhido for OpenRouter.
- `ACTIVECAMPAIGN_URL` e `ACTIVECAMPAIGN_API_KEY`: usados no `cro-funil` quando houver integração com ActiveCampaign.
- Tokens de agenda, como Calendly/TidyCal: usados no `cro-funil` quando o funil mede reuniões marcadas, realizadas ou no-show.

Se a credencial faltar, a skill deve pedir a chave, ajudar a configurar ou oferecer um caminho manual quando existir.

## Resumo rápido por skill

| Skill | Inputs principais que pode pedir |
| --- | --- |
| `comecar` | pasta do projeto, permissão de instalação, chave Apify, confirmação de skills carregadas, aula/etapa atual |
| `avatar-funil` | alvo, modo de pesquisa, materiais do usuário, decisão de nicho quando ainda não há projeto |
| `espiao-do-concorrente` | concorrente, objetivo, modo web/offline, materiais do concorrente, confirmação de seguir sem avatar |
| `trend-hunting` | nicho ou termos de busca, concorrentes opcionais, chave Apify, confirmação de seguir sem avatar |
| `swipe-file` | ação desejada, criativos manuais, metadados dos criativos, tipo de briefing |
| `offerbook` | produto/oferta, perfil do projeto, dados de afiliado, materiais da oferta, aprovações de bônus |
| `design-md` | modo de design, projeto/cliente, URL, referências visuais, dados de marca ou aprovação de direção |
| `metodo-funil` | projeto, offerbook correto, quatro decisores do funil, confirmação de migração ou seguir sem recomendados |
| `copy-funil` | nível de consciência, sofisticação, ticket, tráfego, peça principal, aprovações de copy |
| `quiz-funil` | eixo de segmentação, quantidade de resultados, destino do fechamento, momento de captura, aprovação |
| `webinario-funil` | nível de consciência, big domino, três segredos, formato, destino do fechamento, apresentadores |
| `vsl-funil` | dados de afiliado quando aplicável, dor, mecanismos, ticket, upsell, aprovação |
| `advertorial-funil` | destino da peça, público frio/dor latente, nível N5, dados de afiliado, aprovação |
| `lancamento-funil` | tamanho/tipo de lista, data de carrinho, tipo de lançamento, dados de afiliado, aprovação |
| `pagina-vendas-funil` | nicho, produto, público, tráfego, oferta, dados do especialista/mentor, aprovação |
| `email-funil` | tipo de e-mail, assunto, conteúdo, CTA, link, timing, links de evento |
| `whatsapp-funil` | momentos da sequência, automação/manual, eventos detectáveis, canais, timing |
| `conteudo-funil` | plataformas, formatos, voz, materiais de fala, criadores/modelos, pauta e amostra aprovadas |
| `criativos-funil` | canal, tipo de peça, formatos, quantidade, concorrente/page_id, voz, amostra aprovada |
| `mockup-produto-funil` | lista/tipo de mockups se não inferido, materiais visuais, aprovação dos mockups |
| `bonus-funil` | bônus escolhidos/aprovados, tipo de entregável, amostra aprovada |
| `backend-funil` | produto front-end, produto back-end, downsell, momento de compra, exceções B2B/serviço |
| `recuperacao-funil` | comportamentos detectáveis, canais, suporte humano/IA, links, timing, oferta/downsell |
| `cro-funil` | dados de conversão, credenciais, CSVs ou formulário manual, variante do funil |
| `status-funil` | apenas escolha de projeto quando houver mais de um |
| `zelador` | confirmação literal dos 7 itens de conta/tracking e evidência vista na tela |
| `briefista` | ângulos validados, nível de consciência, provas, voz e formatos |
| `estruturador` | gate do Zelador, 2-3 finalistas, objetivo, verba e período |
| `ads-creative-factory` | brand pack explícito, finalistas curados, formatos, arquétipos e autorização de likeness quando aplicável |
| `leitor-de-metricas` | métricas prontas e nomeadas, fonte, janela e confirmação de venda para ROAS Real |
| `diagnosticador` | leitura confirmada, break-even e decisão humana sobre a alavanca |

## Detalhe por skill

### `comecar`

Inputs diretos:

- Pasta/caminho do projeto, se o terminal não estiver na pasta correta.
- Permissão para instalar ou orientar instalação de ferramentas ausentes, como Git, Node ou Python.
- Chave Apify, quando `.env` não tiver `APIFY_API_TOKEN` ou `APIFY_API_KEY`.
- Confirmação visual de que as skills aparecem ao digitar `/` ou `@`.
- Aula/etapa atual quando não estiver claro: Aula 1 para pesquisa ou Aula 2 para design/funil.

Inputs condicionais:

- Se o aluno ainda não tiver chave Apify, a skill registra pendência e continua.
- Se o sistema operacional ou terminal estiver ambíguo, a skill orienta pelo caminho correspondente.

### `avatar-funil`

Inputs diretos:

- Alvo inicial: nicho, produto, oferta ou público específico.
- Se não houver projeto: habilidades, experiência, contexto, pessoas próximas e possíveis oportunidades.
- Se for afiliado: nome/link do produto do produtor.
- Objetivo da pesquisa: minerar dor, montar avatar, testar headline/ângulo ou pacote completo.
- Modo de trabalho: material enviado pelo usuário, pesquisa web feita pela skill ou modo híbrido.

Materiais que pode pedir:

- Reviews, reclamações, comentários, prints, posts, conversas de comunidade ou entrevistas.
- Fonte de cada trecho enviado.
- Idealmente 20 ou mais trechos, vindos de pelo menos duas fontes.

Decisões:

- Quando a skill propuser 2 ou 3 nichos/oportunidades, o usuário escolhe qual alvo seguir.
- Se a web não tiver verbatim suficiente, o usuário pode enviar materiais ou aceitar modo offline.

### `espiao-do-concorrente`

Inputs diretos:

- Concorrente alvo: nome de marca, perfil `@`, URL ou página.
- Objetivo: batalha de anúncios, lacunas de oferta, ângulos de copy ou dossiê completo.
- Modo: pesquisa web ou análise offline.
- Confirmação para continuar sem contexto de `avatar-funil`, quando o avatar não existir.

Materiais no modo offline:

- Anúncios do concorrente.
- Links ou prints de landing pages, páginas de venda, checkout ou precificação.
- Bio, posts, reviews, reclamações e fontes.
- Pelo menos 5 peças, quando possível.

Inputs condicionais:

- Confirmar tipo de negócio inferido quando o Perfil do Projeto estiver ausente.
- Confirmar qual cliente/projeto usar em contexto de agência.
- Chave Apify quando a coleta web depender dela.

### `trend-hunting`

Inputs diretos:

- Nicho, se não vier no comando.
- Opcionalmente 5 a 10 termos de busca, se o usuário quiser controlar a busca.
- Links de concorrentes/perfis de referência, se o usuário quiser enriquecer a caça de tendências.
- Confirmação para continuar sem avatar, quando `avatar-funil` ainda não existir.

Inputs condicionais:

- Chave Apify quando faltar no `.env`.
- Confirmação do ramo/tipo de negócio quando o Perfil do Projeto estiver ausente e a inferência não for segura.

Observação:

- Se o usuário não trouxer termos de busca, a skill gera termos a partir do nicho.

### `swipe-file`

Inputs diretos:

- Ação desejada: capturar, organizar, gerar briefing ou revisar.
- Confirmação para seguir com captura manual quando não houver dossiê de concorrente nem variações de teste.
- Tipo de briefing, como `hooks-vsl`, quando a ação for briefing.

Materiais para captura manual:

- Screenshot ou arquivo da peça.
- Link de origem.
- Concorrente/autor.
- Data de captura.
- Engajamento ou sinal de performance, se existir.
- Padrão extraído: hook, estrutura, CTA, promessa principal e emoção alvo.

Inputs condicionais:

- Confirmar tipo de negócio inferido se o Perfil do Projeto estiver ausente.

### `offerbook`

Inputs diretos:

- Produto/oferta, se não vier no comando.
- Perfil do Projeto, quando não estiver inferível: situação de partida, tipo de oferta, operador, nicho regulado, voz e ticket.
- Confirmação para continuar sem `avatar` ou `dossiê`, caso esses arquivos estejam ausentes.
- Campo de compliance quando o nicho regulado não estiver claro.

Inputs para afiliado:

- Produto do produtor.
- Promessa ou transformação.
- Preço.
- Comissão.
- Link de afiliado.
- Página oficial do produtor.

Materiais que pode pedir:

- Transcrições, depoimentos, currículo do produto, hooks, e-mails aprovados, guia de voz, página de venda, checkout e redes sociais.
- Promessa central, mecanismo único, preço âncora, garantia, bônus confirmados e casos/provas.

Decisões:

- Para cada bônus sugerido, perguntar se o dono consegue entregar. Apenas bônus aprovados entram na stack.

### `design-md`

Inputs diretos:

- Modo de design:
  - usar `DESIGN.md` existente;
  - extrair de uma URL;
  - criar do zero;
  - criar a partir de referências/imagens;
  - usar neutro por enquanto.
- Projeto/cliente quando houver mais de um.
- Qual `DESIGN.md` usar quando houver mais de um arquivo possível.

Modo URL:

- URL do site/referência.
- Projeto de destino quando não estiver claro.

Modo do zero:

- O que é o negócio.
- Sensação/vibe desejada em três palavras.
- Cores desejadas ou proibidas.
- Público.
- Logo, paleta, manual, fontes, cor de fundo ou outros ativos existentes.
- Aprovação da direção visual proposta.

Modo referências/imagens:

- De 3 a 5 imagens, prints ou referências.
- Se houver apenas uma imagem, pedir logo e uma segunda referência.
- Se um link de Pinterest/referência bloquear acesso, pedir screenshots ou imagens.

Inputs técnicos avançados:

- `--url`, `--out`, `--prompt`, `--compare`, `--provider`, `--model`, `--max-tokens`.
- `OPENROUTER_API_KEY` quando o provedor escolhido for OpenRouter.

### `metodo-funil`

Inputs diretos:

- Projeto ativo, quando houver mais de um.
- Confirmação de qual `offerbook.md` usar, quando houver mais de um candidato.
- Confirmação para migrar pacote solto da raiz para um projeto, quando encontrado.
- Confirmação para continuar sem arquivos recomendados, como avatar, dossiê ou swipe.

Quatro decisores do funil:

- Tipo de oferta.
- Origem do público: ads frio, base quente ou orgânico/lista.
- Valor: ticket e formato da oferta.
- Prova disponível: depoimentos, cases, reviews ou necessidade de coleta.

Observação:

- Sem `offerbook.md`, a skill não deve prescrever o funil. Ela deve apontar para `offerbook`.

### `copy-funil`

Inputs obrigatórios quando não estiverem nos arquivos:

- Produto/oferta.
- Mercado/público.
- Objetivo da copy.
- Materiais existentes.
- Nível de consciência, de 1 a 5.
- Sofisticação do mercado: primeiro, segundo, maduro, cético ou esgotado.
- Ticket: baixo, médio, alto ou premium.
- Tráfego: frio, morno ou quente.
- Peça principal: VSL, carta de vendas, e-mail, criativo, landing page ou otimização de funil.

Decisões/checkpoints:

- Aprovar Big Idea e mecanismo.
- Aprovar headlines e bullets.
- Revisar peças geradas antes de tratar como finais.

Bloqueio:

- Sem `offerbook.md`, a skill deve parar e pedir `offerbook`.

### `quiz-funil`

Inputs diretos:

- Nicho/mercado, quando ausente.
- Produto/transformação e ticket, quando ausentes.
- Público e nível de consciência, quando ausentes.
- Eixo de segmentação: arquétipo, dor dominante, estágio/maturidade ou score/nota.
- Quantidade de resultados: normalmente 3 a 5.
- Destino do fechamento: venda direta/checkout ou reunião/diagnóstico.
- Momento de captura: antes ou depois do resultado.

Campos de captura:

- Nome, e-mail e telefone.
- Tag do resultado.

Decisões/checkpoints:

- Aprovar estrutura do quiz antes de publicar ou configurar.

Bloqueios:

- Sem `offerbook.md`, a skill para.
- Se o nível de consciência for N1 ou N2, a skill veta quiz como formato principal.

### `webinario-funil`

Inputs diretos:

- Nicho/mercado, produto/transformação e ticket, se ausentes.
- Público, nível de consciência e origem do tráfego.
- Oferta: entregáveis, preço âncora, bônus e garantia.
- Big Domino: a crença única que precisa mudar.
- Três segredos ou blocos da aula.
- História de origem/epifania e provas/cases.
- Formato: ao vivo, evergreen ou híbrido.
- Destino final: checkout direto ou reunião/diagnóstico.
- Se for serviço, agência ou B2B com equipe: um apresentador ou vários consultores.

Decisões/checkpoints:

- Confirmar se o formato bate com a recomendação de `funil.md`.
- Aprovar estrutura antes de agendar, enviar ou configurar.

Bloqueios:

- Sem `offerbook.md` e `copy.md`, a skill para.

### `vsl-funil`

Inputs diretos:

- Nicho.
- Produto/transformação.
- Dor principal.
- Por que o problema ainda não foi resolvido.
- Mecanismo do problema.
- Mecanismo da solução.
- Ticket e estratégia de pagamento, quando necessário.
- Upsell obrigatório para VSL padrão: facilitador ou mais acesso ao dono/especialista.

Inputs para afiliado:

- Página oficial do produtor.
- Produto.
- Promessa/transformação.
- Preço.
- Comissão.
- Página de venda ou checkout oficial.
- Link de afiliado.

Decisões/checkpoints:

- Confirmar se o formato bate com `funil.md`.
- Aprovar estrutura e copy.

Bloqueios:

- Sem `copy.md` e `offerbook.md`, a skill para, exceto quando o fluxo de afiliado tiver dados suficientes.

### `advertorial-funil`

Inputs diretos:

- Nicho/mercado.
- Produto/transformação.
- Destino da peça: VSL, página, webinar ou outro passo.
- Público frio e dor latente.
- Confirmação de nível de consciência N5.

Inputs para afiliado:

- Produto.
- Promessa.
- Mecanismo.
- Provas públicas.
- Página oficial e link de afiliado.

Decisões/checkpoints:

- Confirmar se o formato bate com `funil.md`.
- Aprovar estrutura.

Bloqueios:

- Sem `offerbook.md` e `copy.md`, a skill para, exceto no modo afiliado com dados suficientes.

### `lancamento-funil`

Inputs diretos:

- Nicho/mercado.
- Produto/transformação.
- Oferta: entregáveis, preço, bônus e garantia.
- Tamanho e tipo de lista/audiência.
- Data alvo de abertura/fechamento de carrinho.
- Tipo de lançamento: semente, interno ou parceria/JV.
- Confirmação de nível N5 e existência ou plano de captura de lista.

Inputs para afiliado:

- Página oficial do produtor.
- Datas de abertura e fechamento de carrinho.
- Regras de bônus de afiliado, se houver.

Decisões/checkpoints:

- Confirmar se o formato bate com `funil.md`.
- Aprovar régua e estrutura.

Bloqueios:

- Sem `offerbook.md` e `copy.md`, a skill para.

### `pagina-vendas-funil`

Inputs diretos:

- Nicho/mercado.
- Produto/transformação e ticket.
- Público, nível de consciência e origem do tráfego.
- Oferta: entregáveis, preço âncora, bônus e garantia.
- Confirmação para seguir só com estrutura/placeholders se `copy.md` estiver ausente, quando a skill permitir esse fallback.

Inputs para mentoria, consultoria ou serviço 1-a-1:

- Foto real ou placeholder do especialista.
- Nome.
- Credencial real.
- Bio curta.
- Fatos verificáveis.

Decisões/checkpoints:

- Aprovar estrutura e copy.
- Corrigir headline quando faltar resultado específico, tempo ou objeção.

Bloqueios:

- Para página final, `copy.md` e `DESIGN.md` são obrigatórios.

### `email-funil`

Inputs diretos:

- Tipo de e-mail: convite, confirmação, lembrete, recap, nurture, venda ou transacional.
- Assunto.
- Conteúdo ou mensagem que precisa ser comunicada.
- CTA: texto e destino.
- Link de evento, página de obrigado, checkout ou endpoint, quando aplicável.
- Timing/cadência operacional.
- Confirmação para seguir com estrutura se `copy.md` estiver ausente, quando a skill permitir.

Inputs condicionais:

- Se o Perfil indicar B2B, serviço ou high-ticket, confirmar CTA de conversa/reunião em vez de compra direta.
- Se for afiliado, usar checkout/link do produtor.

Bloqueios:

- `DESIGN.md` e `offerbook.md` são base obrigatória para e-mails finais.

### `whatsapp-funil`

Inputs diretos:

- Produto/oferta e ticket.
- Se existe evento, aula, webinário ou masterclass.
- O que o funil consegue detectar: abandono de carrinho, cartão recusado, boleto/pix gerado, no-show etc.
- Ferramenta de automação ou envio manual.
- Origem/temperatura do contato.
- Momentos da sequência: confirmação, lembretes, link do evento, carrinho abandonado, cartão recusado, boleto/pix, nurture ou reengajamento.
- Timing de cada envio, quando o setup fugir do padrão.

Decisões/checkpoints:

- Revisar mensagens antes de configurar.

Bloqueios:

- Sem `offerbook.md` e `copy.md`, a skill para.

### `conteudo-funil`

Inputs diretos:

- Plataformas: Instagram, YouTube, TikTok, X, LinkedIn ou combinações.
- Formatos por plataforma: carrossel, Reels, vídeos longos, Shorts, posts, threads ou artigos.
- Voz: pessoa ou marca, se o offerbook não trouxer.
- Materiais de fala real quando a voz for pessoa: vídeo, áudio, live, reunião, WhatsApp ou Reels antigos.
- Criadores de referência, se o usuário já tiver.
- Conteúdos específicos de referência a modelar.

Decisões/checkpoints:

- Escolher um ou mais criadores da lista curada.
- Aprovar/trocar/cortar a pauta de 9 peças.
- Aprovar uma amostra antes de gerar o lote completo.
- Autorizar instalação de ferramenta de transcrição, quando necessária.

Inputs para caminho manual:

- 5 a 10 Reels/conteúdos.
- Views ou sinal de performance.
- Hook dos primeiros segundos.
- Estrutura e CTA.

Bloqueio:

- Carrossel visual exige `DESIGN.md`; texto/roteiros podem seguir com fallback.

### `criativos-funil`

Inputs diretos:

- Concorrente ou `page_id` na Meta Ad Library.
- Oferta/campanha alvo.
- Canal: Meta, LinkedIn, Google Display, TikTok Ads ou combinação.
- Tipo de peça: roteiro de vídeo, banner estático ou ambos.
- Formatos/placements: feed 4:5, stories/reels 9:16, square 1:1, display kit etc.
- Escopo: quantidade de peças e quais estruturas viram criativo.
- Voz: pessoa ou marca, se ausente no offerbook.
- Material de fala real quando a voz for pessoa.

Decisões/checkpoints:

- Confirmar se segue sem briefs de swipe/espiao/trends quando ausentes.
- Aprovar uma amostra antes do lote.

Bloqueios:

- `offerbook.md` e `DESIGN.md` são obrigatórios.

### `mockup-produto-funil`

Inputs diretos:

- Lista de produtos/bônus a mockupar, quando não estiver clara no offerbook.
- Tipo de mockup por item, quando a inferência não for suficiente.
- Materiais visuais adicionais, se o `DESIGN.md` não cobrir o necessário.

Tipos de mockup que podem exigir confirmação:

- Ebook/PDF.
- Módulo ou tela de área de membros.
- Caixa/embalagem.
- Bundle de bônus.
- Device mockup.
- Embalagem física, proposta, app ou material local para ofertas que não sejam infoproduto.

Decisões/checkpoints:

- O usuário aprova os mockups gerados na ferramenta de imagem escolhida.

Bloqueios:

- `DESIGN.md` e `offerbook.md` são obrigatórios.

### `bonus-funil`

Inputs diretos:

- Quais bônus aprovados no `offerbook` entram na produção.
- Se não houver bônus aprovados: escolher entre 2 ou 3 candidatos propostos.
- Para afiliado: escolher bônus próprios complementares ao produto do produtor.
- Tipo de entregável de cada bônus quando houver ambiguidade.

Decisões/checkpoints:

- Aprovar pauta de bônus.
- Validar uma amostra antes de gerar o lote.

Observações:

- Ebook, guia, workbook, checklist, template, planilha e calculadora devem virar entregáveis completos.
- Áudio/vídeo guiado vira roteiro para o dono gravar.
- Comunidade, grupo ou serviço vira estrutura operacional.

Bloqueios:

- `offerbook.md` e `DESIGN.md` são obrigatórios.

### `backend-funil`

Inputs diretos:

- Produto front-end e ticket.
- Produto(s) de back-end de maior ticket.
- Produto mais barato para downsell.
- Público/origem/temperatura no momento da compra.

Inputs para B2B/serviço/reunião:

- Conta ou cliente a expandir.
- Oferta de renovação.
- Programa de indicação.

Decisões:

- Se o dono não tiver back-end ou downsell definidos, a skill propõe 2 ou 3 candidatos por slot e o usuário escolhe.
- Se nome/preço de order bump ou downsell não existir, fica pendente ou precisa de confirmação.

Bloqueios:

- `offerbook.md` e `funil.md` são obrigatórios.
- Em afiliado, a skill não cria backend próprio; orienta a próxima peça possível.

### `recuperacao-funil`

Inputs diretos:

- Nicho/mercado.
- Produto/oferta principal e ticket.
- Downsell, se existir.
- Comportamentos que o checkout/CRM consegue detectar: abandono, cartão recusado, boleto/pix, no-show etc.
- Canais disponíveis: e-mail, WhatsApp, SMS, remarketing.
- Se há suporte humano ou IA.
- Link do suporte, quando existir.
- Timing e tom por comportamento, quando não puder ser inferido.

Inputs condicionais:

- Em pré-lançamento, não pedir números inexistentes; pedir apenas o setup que será rastreado.
- Em B2B/high-ticket, tratar recuperação como no-show/remarcação.
- Em físico/local, priorizar WhatsApp.
- Em afiliado, considerar que a recuperação de checkout pertence ao produtor.

Bloqueios:

- `offerbook.md` e `copy.md` são obrigatórios.

### `cro-funil`

Inputs diretos:

- Dados reais de conversão. Nunca inventar números.
- Variante do funil quando não estiver clara: checkout direto, reunião B2B/serviço, físico/local ou afiliado.
- Credenciais de integração, quando o usuário quiser leitura automática.
- CSVs exportados, quando não houver API.
- Respostas ao formulário manual, quando não houver credenciais nem CSV.

KPIs para funil com checkout:

- Visitantes únicos.
- Leads capturados.
- Participantes/show-up, se houver webinar.
- Pessoas que chegaram na oferta.
- Entradas no checkout.
- Compras/conversão final.

KPIs para reunião B2B/serviço:

- Leads.
- Reuniões marcadas.
- Reuniões realizadas.
- Propostas enviadas.
- Fechamentos.

KPIs para físico/local:

- Visitas ao perfil/Google Maps.
- Mensagens no WhatsApp.
- Visitas na loja/unidade.
- Vendas registradas, se houver.

KPIs para afiliado:

- Clique no link de afiliado.
- Dados de checkout/compra somente se o produtor/plataforma disponibilizar.

Credenciais que pode pedir:

- `ACTIVECAMPAIGN_URL`.
- `ACTIVECAMPAIGN_API_KEY`.
- Token Calendly/TidyCal ou ferramenta equivalente.

Bloqueios:

- Sem `funil.md` e alguma base de copy/página, CRO não tem alvo claro.
- Em pré-lançamento, entregar plano de instrumentação em vez de pedir números inexistentes.

### `status-funil`

Inputs diretos:

- Apenas escolha de projeto quando houver mais de uma pasta em `projetos/` e o usuário não tiver passado um slug.

O que a skill não deve pedir:

- Não pede conteúdo novo.
- Não altera arquivos.
- Não cria entregáveis.

Ela lê arquivos existentes, `pendências.md`, Perfil do Projeto e Destino do fechamento para mostrar o estado real do funil.

### `zelador`

Inputs diretos:

- O que o operador viu para BM, conta, pixel, CAPI, deduplicação, domínio e pagamento.
- Evidência textual concreta para cada confirmação.
- Event Match Quality somente quando aparecer literalmente no Events Manager.

Bloqueio:

- Qualquer item crítico falso, ambíguo ou sem evidência mantém o status CRÍTICO.

### `briefista`

Inputs diretos:

- Ângulos produzidos na Aula 2.
- Nível de consciência declarado para cada ângulo.
- Provas, voz, formatos e contexto da campanha.
- Curadoria humana de dois a três finalistas.

Bloqueio:

- Ângulo sem nível de consciência não entra na bateria.

### `estruturador`

Inputs diretos:

- Auditoria do Zelador não crítica.
- Dois a três finalistas curados.
- Objetivo Vendas ou Cadastro.
- Verba diária e período.

Bloqueios:

- Verba abaixo de R$20 por dia.
- Tracking crítico.
- Finalistas ainda não escolhidos pelo operador.

### `ads-creative-factory`

Inputs diretos:

- Brand pack v1 explícito, validado pelo schema da skill.
- Dois a três finalistas já curados pelo operador.
- Formatos, arquétipos, quantidade de variantes, CTA e descrição do link.
- Persona pack e autorizações de likeness somente quando houver pessoa real.

Bloqueios:

- Brand pack ausente, inválido ou fora das raízes permitidas.
- Finalistas não curados ou tentativa de usar likeness sem foto e autorização.
- Codex CLI local não autenticado.

Contrato:

- Gera imagens e legendas como propostas; promoção para o pacote final exige revisão humana.
- Não usa `OPENAI_API_KEY` nem `CODEX_API_KEY`.

### `leitor-de-metricas`

Inputs diretos:

- Métricas prontas, nomeadas e copiadas literalmente da fonte.
- Fonte e janela de atribuição.
- Confirmação de venda no checkout/CRM para carimbar ROAS como Real.

Contrato:

- Não calcula CTR, CPM, CPA, ROAS ou frequência a partir de outros campos.
- Campo ausente vira `não fornecido`.

### `diagnosticador`

Inputs diretos:

- Sinais confirmados pelo Leitor.
- Break-even correto para a unidade comparada.
- Aprovação ou rejeição humana da alavanca.

Saída obrigatória:

- Hipótese.
- Uma alavanca.
- Critério de sucesso.
- Critério de reversão.

## Próximos usos deste documento

Este mapa pode virar:

- checklist de QA das skills;
- schema para o `mapa-skills.html` mostrar inputs por skill;
- base para uma futura automação que valide se cada `SKILL.md` declara explicitamente seus inputs.
