# GUIA PIXEL + CAPI — a Meta enxergando a sua página e o seu checkout

> **Estou perdido em:** "criei o pixel mas 'o evento não dispara' / não sei ligar a CAPI / o Pixel Helper não acende".
> **O que você vai ter no final:** pixel criado, plugado na sua página PUBLICADA, CAPI ligada via Hotmart e a deduplicação confirmada — com o teste objetivo de cada etapa. É o rastreamento que a campanha e a Aula 4 inteira dependem.
> **Fontes cruzadas:** super-guia Parte C + `aula-03/materiais/manual-trackeamento.html` (repo) · `scripts/zelador-audit.mjs` + SKILL.md do `/zelador` (código real — é ele que confere tudo isto) · tutoriais externos reescritos (GTM/pixel/verificação de domínio/checkout) e referências de mercado (configs que a Meta desliga sozinha, mito do "pixel frio") · pesquisa web 22/07 (Pixel Helper × CAPI, opções do pixel na Hotmart, prazo da deduplicação — Conversios, Central de Ajuda Hotmart, Nexus Data Science) · erros reais de PS.
> Custo: **R$0** — nada aqui gasta dinheiro.

## ⚠️ A ordem certa (o erro de ordem é o mais caro)

**Criar o pixel → plugar na página → publicar → ligar CAPI na Hotmart → testar.** Publicou sem plugar? Não quebrou nada — pluga e republica (erro T1). Mas testar antes de publicar não funciona: pixel só dispara em página NO AR.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | O que é pixel, evento, CAPI e deduplicação (2 frases de cada) | leia [guia-conceitos-trafego](../02-conhecimento-minimo/guia-conceitos-trafego.md) → "O mundo do RASTREAMENTO" (5 min) |
| 🔑 Conta | Fundação Meta pronta (BM + conta de anúncios) | siga [guia-meta-fundacao.md](guia-meta-fundacao.md) |
| 📄 Artefato | Página de vendas **PUBLICADA na internet** (URL `https://...`) — pixel não dispara em `file:///` | siga [guia-publicar-pagina.md](guia-publicar-pagina.md) |
| 🔑 Conta | Produto cadastrado na Hotmart com checkout ativo (link `pay.hotmart.com`) — é onde a CAPI vive | siga [guia-produto-e-checkout.md](guia-produto-e-checkout.md) |
| 🧰 Ferramenta | Chrome com a extensão **Meta Pixel Helper** (o testador; instala no passo 5) | Chrome Web Store → "Meta Pixel Helper" |
| 🔑 Chave | *(Opcional)* `META_ACCESS_TOKEN` no `.env` — o `/zelador` confere tudo sozinho | [guia-meta-api.md](guia-meta-api.md); sem ele o zelador vira checklist manual |

## Passo 1 — Criar o pixel ("Conjunto de dados" · 3 min)

1. `business.facebook.com/events_manager2` (Gerenciador de Eventos) → **"Conectar dados"** (ou o botão verde "Conectar fontes de dados").
2. Escolha **"Web"** → **Conectar** → nome (ex.: `Pixel Sua Marca`) → **Criar**.
3. Quando perguntar como instalar, pode fechar — a instalação vem nos passos 2 e 3. **Anote o ID** (número longo embaixo do nome) → é o seu `META_PIXEL_ID` no `.env`.

## Passo 2 — Plugar na SUA página de vendas (o passo que todo mundo pula)

As páginas geradas pelas skills do cohort **já nascem pixel-ready**:
1. Abra o HTML da página (`projetos/{slug}/pagina/index.html`).
2. No `<head>`, o snippet do Meta Pixel vem **pronto porém COMENTADO**, com o placeholder `[PLUG: SEU_PIXEL_ID]`.
3. Substitua o placeholder pelo ID do passo 1 e **descomente** o snippet (e o bloco `<noscript>` logo abaixo). Não sabe mexer em HTML? Cole na conversa: *"substitua o [PLUG: SEU_PIXEL_ID] da minha página pelo ID X e descomente o snippet do pixel"*.
4. **Republique** a página (`vercel --prod` — [guia-publicar-pagina](guia-publicar-pagina.md)). Mudou o HTML = precisa de novo deploy.

## Passo 3 — Ligar pixel + CAPI pela Hotmart (o pulo do gato, zero código)

A Hotmart instala o pixel no **checkout** E manda os eventos pelo servidor (CAPI) por você:
1. `app.hotmart.com` → **Ferramentas** → busque **"Pixel de rastreamento"** → escolha o produto → **Facebook/Meta**.
2. Cole o **ID do pixel** (passo 1).
3. Nas opções de disparo: deixe **"vendas realizadas"** em todos os métodos de pagamento e **marque "visita à página de pagamento"** — é ela que dispara o `InitiateCheckout`. **NÃO marque** "visitas à página de produto da Hotmart" (só infla evento sem valor).
4. Na parte **"API de Conversões"**: gere o token na Meta — Events Manager → seu pixel → aba **Configurações** → seção **"API de Conversões"** → **"Gerar token de acesso"** (demora uns segundos) → copie → cole no campo da Hotmart → **Verificar** → "Token verificado" → **Salvar**.
5. A Hotmart passa a disparar `InitiateCheckout` e `Purchase` com **`event_id`** automático — é isso que garante a **deduplicação** (navegador + servidor contam UMA vez).
6. ⚠️ Boleto/Pix: na hora sai `Payment Generated`; o `Purchase` só dispara quando o pagamento **aprova** — e só via CAPI. Sem a CAPI ligada, venda de boleto "some" do pixel.
7. **Checkout em OUTRA plataforma (Kiwify, Hubla, Eduzz...)?** O fluxo é análogo em todas: configurações do produto → área de pixel/rastreamento → colar o ID do pixel (+ token da CAPI, quando houver). Tela diferente, mesma lógica — peça pra IA te guiar na sua ([guia-como-ser-guiado](../01-pre-requisitos/guia-como-ser-guiado.md)).

## Passo 4 — Conferir as configurações do Events Manager (2 min que evitam semanas de confusão)

No Events Manager → seu pixel → **Configurações**:
1. Ative **"Correspondência avançada automática"** (melhora o casamento visitante↔conta Meta).
2. ⚠️ **A Meta às vezes desativa/reativa essas opções SOZINHA** e a tela não tem botão "salvar" explícito — depois de mexer, saia, reabra e confirme que ficou como você deixou (referência de mercado).
3. Alerta vermelho/amarelo nesta tela **raramente é crítico** — leia o texto antes do pânico (erro T6).

## Passo 5 — Testar que dispara (5 min)

1. Instale a extensão **Meta Pixel Helper** no Chrome (Chrome Web Store).
2. Abra a sua página publicada → o ícone acende e lista **`PageView`**.
3. Clique no botão de compra até a tela do checkout Hotmart → o Helper OU o **"Testar eventos"** do Events Manager lista **`InitiateCheckout`**.
4. ⚠️ **O Pixel Helper NÃO enxerga a CAPI** — ele só vê o que dispara pelo navegador. Evento do servidor (o `Purchase` da Hotmart, ex.) você confere no **Events Manager** (Testar eventos / Visão geral), nunca na extensão (pesquisa web 22/07).
5. Deduplicação: Events Manager → Visão geral → o evento listado como **"Navegador + Servidor"** com selo de desduplicado. Dê **até 24 h** para esse selo consolidar depois de ligar a CAPI.

## E se a minha página NÃO é a das skills? (WordPress, Wix, construtor, site com programador)

O caminho genérico — qualquer página, qualquer plataforma:
- **Via parceiro (o mais simples):** Events Manager → instalação → **"Procurar parceiro"** → sua plataforma (WordPress, Shopify, Wix...) → seguir o passo a passo dela. Só pede o **ID** do pixel.
- **Via GTM (o jeito de quem gerencia vários códigos):** crie conta+contêiner **Web** no Google Tag Manager → Tags → Nova → galeria de modelos da comunidade → **"Facebook Pixel"** → cole o ID → acionamento "Todas as páginas" → **Enviar + Publicar** (no GTM nada vale antes de publicar) → instale o GTM no site (WordPress: um plugin de GTM resolve; outros: o snippet do contêiner no `<head>`) → confira pelo **Visualizar/debug** do GTM que a tag "disparou".
- **Manual:** copie o código completo do pixel e cole no `<head>` do site (é o que a página das skills já traz pronto).
Em todos os casos, o teste do passo 5 é o mesmo.

## Teste de sucesso

Quatro verdes, nesta ordem:
1. Pixel Helper na sua página publicada lista `PageView`;
2. Events Manager → "Testar eventos" mostra `InitiateCheckout` quando você chega no checkout;
3. em até 24 h, o evento aparece como **"Navegador + Servidor" desduplicado** na Visão geral;
4. `node scripts/zelador-audit.mjs --json` → itens de pixel/CAPI sem crítico (a deduplicação ele confirma com você na tela — a API não enxerga esse item).

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa provável | O que fazer (em ordem) |
|---|---|---|---|
| **T1** | Pixel Helper **não acende** na sua página | snippet ainda comentado/`[PLUG:` não trocado; publicou ANTES de plugar e não republicou; bloqueador de anúncios do navegador | 1) na página publicada, Ctrl+U (ver código-fonte) e procure `fbq(` — achou `[PLUG:` ou nada? volte ao passo 2; 2) republique (`vercel --prod`); 3) teste em janela anônima sem extensões de bloqueio; 4) espere alguns minutos e recarregue |
| **T2** | Helper não mostra `Purchase`/eventos do checkout | **a CAPI dispara pelo SERVIDOR — o Helper não tem como ver** | confira no Events Manager (Testar eventos / Visão geral), não na extensão; é comportamento normal, não defeito |
| **T3** | Evento aparece **cinza/"inativo"** no Gerenciador de Anúncios | o evento nunca disparou de verdade | 1) percorra você mesmo página→checkout com o passo 5; 2) na Hotmart, confira que **"visita à página de pagamento"** está marcada (senão não há `InitiateCheckout`); 3) `Purchase` só ativa com venda real ou compra-teste — não trave nisso pra subir a campanha |
| **T4** | Deduplicação não confirma ("faltam parâmetros de deduplicação") | pixel do navegador e CAPI enviando sem o mesmo `event_id`; ou você olhou cedo demais | 1) use a integração NATIVA da Hotmart pros dois lados (não cole snippet manual extra no checkout — duplica sem `event_id`); 2) espere **24 h** e reveja; 3) persiste: print do Events Manager + "diagnostique minha deduplicação" na conversa |
| **T5** | Configuração que você LIGOU aparece desligada depois | a Meta desativa/reativa opções do pixel silenciosamente (sem aviso e sem botão salvar) | reabra Configurações após qualquer mudança e reconfirme; se desligou de novo, ligue de novo — é manha conhecida da plataforma (referência de mercado) |
| **T6** | **Alertas vermelhos** no Events Manager | a tela exagera; a maioria dos alertas não é crítica | leia o TEXTO do alerta antes de mexer em qualquer coisa; só aja se ele apontar um evento que você USA (Purchase/InitiateCheckout) sem funcionar |
| **T7** | Venda por **boleto/Pix "sumiu"** do pixel | `Purchase` de boleto só dispara na APROVAÇÃO do pagamento, e só via CAPI | ligue a CAPI (passo 3.4); a venda aparece quando o boleto compensar — confira depois na Visão geral |
| **T8** | "Meu pixel é novo/frio — preciso 'aquecer' antes de anunciar?" | mito de mercado | não: otimize a campanha direto pro evento que você quer (Purchase). Se o Purchase não sai, o problema é checkout/oferta/página — não o pixel. "Aquecer" = anunciar por um bom período + melhorar o pós-clique (referência de mercado) |
| **T9** | Domínio não verifica | DNS/metatag ainda propagando (a Meta leva até **72 h** pra reconferir) | siga o F8 do [guia-meta-fundacao](guia-meta-fundacao.md); domínio pendente NÃO bloqueia começar (o zelador marca PARCIAL) |

> Fora do catálogo? Print do Events Manager + "estou preso no rastreamento, pesquise o que fazer" no Claude/Codex — e registre o caso pra virar erro novo deste guia.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/zelador` — ele confere pixel, CAPI, deduplicação e o resto da fundação de uma vez |
| 📖 Ler | próximo da cadeia: [guia-criativos.md](../04-operacao/guia-criativos.md) → [guia-campanha-no-ar.md](../04-operacao/guia-campanha-no-ar.md) |
| 🚑 Se travar | o catálogo T1–T9 acima (Helper apagado, evento inativo, dedup, boleto sumido...) |
