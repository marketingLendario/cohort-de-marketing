# GUIA CONCEITOS — o repertório mínimo de tráfego (o que é cada coisa, sem jargão)

> **Estou perdido em:** "todo mundo fala BM, pixel, CAPI, GTM... e eu não sei nem o que são essas coisas".
> **O que você vai ter no final:** o vocabulário inteiro da Aula 3/4 traduzido — cada termo em 2 frases + uma analogia + ONDE você mexe nele no curso. Leia uma vez antes da Aula 3; volte sempre que esbarrar num termo.
> **Fontes:** docs do repo (zelador, rastreamento, tutoriais da aula-03/04) + Central de Ajuda da Meta. Sem opinião — só o que cada coisa É.

---

## Pré-requisitos (confira ANTES)

**Nenhum — este é o guia de ENTRADA do tráfego.** Se você só sabe que "vai anunciar na Meta" e mais nada, começa aqui. Reserve ~15 minutos de leitura corrida (ou use como dicionário: Ctrl+F no termo que travou você).

## O mundo das CONTAS (quem é quem na Meta)

**Perfil pessoal** — a sua conta de gente no Facebook. Tudo na Meta pendura nela. *Analogia: o seu CPF.* → Onde mexe: login em tudo; precisa estar "aquecida" (uso real) pra não levantar suspeita.

**Página (Fan Page)** — a presença pública da marca no Facebook. Todo anúncio sai EM NOME de uma Página, nunca do perfil. *Analogia: a fachada da loja.* → Onde mexe: criada na fundação ([guia-meta-fundacao](../03-conexoes-e-apis/guia-meta-fundacao.md)); selecionada no nível "anúncio" do Gerenciador.

**Business Manager (BM) / Gerenciador de Negócios / "portfólio empresarial"** — o cofre corporativo que agrupa e controla os ativos do negócio: Páginas, contas de anúncios, pixels, apps e as PESSOAS com acesso a cada um. Três nomes, a mesma coisa. *Analogia: o CNPJ + o chaveiro de todas as chaves da empresa.* → Onde mexe: `business.facebook.com/settings` — a tela mais importante do curso fora do Gerenciador.

**Conta de anúncios** — onde o dinheiro acontece: verba, campanhas, faturas. Vive dentro do BM. Tem fuso e moeda IMUTÁVEIS. *Analogia: o cartão corporativo com extrato próprio.* → Onde mexe: criada na fundação; usada no Gerenciador; o ID dela (`act_...`) vai no `.env`.

**Gerenciador de Anúncios (Ads Manager)** — a ferramenta onde campanhas são criadas e monitoradas (`adsmanager.facebook.com`). Não confunda: BM = cofre de ativos; Ads Manager = mesa de operação. → Onde mexe: [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md).

**Instagram profissional** — a conta do IG convertida pra modo empresa e vinculada à Página. Sem isso, anúncio não sai no Instagram em nome da marca. → Onde mexe: fundação, passo 3.

## O mundo do RASTREAMENTO (como a Meta "vê" o que acontece fora dela)

**Pixel (hoje "Conjunto de dados")** — um código invisível na sua página que avisa a Meta o que o visitante fez ("viu a página", "clicou em comprar"). É o GPS que liga o clique no anúncio ao resultado. *Analogia: a catraca que conta quem entrou e o que fez na loja.* → Onde mexe: criado no Events Manager; plugado na página (o famoso `[PLUG: SEU_PIXEL_ID]`) e no checkout via Hotmart — [guia-pixel-capi](../03-conexoes-e-apis/guia-pixel-capi.md).

**Evento** — cada "aviso" que o pixel manda, com nome padronizado: `PageView` (abriu a página), `ViewContent` (viu o conteúdo), `Lead` (cadastrou), `InitiateCheckout` (foi pro carrinho), `Purchase` (comprou). A campanha OTIMIZA para um evento — por isso o evento certo importa mais que tudo. → Onde mexe: escolhido no conjunto de anúncios ("evento de conversão").

**CAPI (API de Conversões)** — o irmão do pixel que avisa a Meta PELO SERVIDOR, sem depender do navegador do cliente (que bloqueia cookies, fecha aba, usa iOS...). Pixel = aviso pelo navegador; CAPI = aviso por trás. Os dois juntos = máxima precisão. *Analogia: além da catraca, o caixa também reporta a venda.* → Onde mexe: a Hotmart liga pra você (Ferramentas → Pixel de rastreamento → "Conversions API").

**Deduplicação (event_id)** — quando pixel E CAPI avisam a MESMA compra, a Meta precisa saber que é uma só (senão conta 2). O `event_id` igual nos dois avisos é o que permite isso. → Onde mexe: automático via Hotmart; o `/zelador` confere.

**GTM (Google Tag Manager)** — um "porta-códigos": em vez de colar pixel, analytics etc. um por um no site, você instala SÓ o GTM e gerencia todos os códigos por um painel, sem mexer no site de novo. NÃO é obrigatório no curso (a página das skills já vem com o slot do pixel pronto) — é o caminho de quem tem site próprio/programador. *Analogia: a régua de tomadas onde você pluga os aparelhos.* → Onde mexe: só se seu site já usa; as páginas do cohort têm snippet direto.

**Verificação de domínio** — provar pra Meta que o site é SEU (um código TXT no DNS do domínio). Dá autoridade sobre os eventos daquele domínio e evita que terceiros anunciem com ele. → Onde mexe: fundação, passo 7 (business settings → Segurança da marca → Domínios). Não bloqueia começar — vira pendência.

**UTM** — etiquetas que você pendura no link (`?utm_source=meta&utm_campaign=...`) pra saber DE ONDE veio cada visita/venda em qualquer ferramenta de analytics. → Onde mexe: no link do anúncio.

**sck (Hotmart)** — a "UTM da Hotmart": um código curto no link do checkout (`?sck=meta-c1-frio`, máx. 30 caracteres, sem underscore) que volta junto com a venda — é o que casa venda ↔ campanha no painel da Aula 4. → Onde mexe: [guia-hotmart](../03-conexoes-e-apis/guia-hotmart.md).

## O mundo das CAMPANHAS (a hierarquia de 3 andares)

**Campanha → Conjunto de anúncios → Anúncio** — os 3 andares do Gerenciador: a campanha define o OBJETIVO (Vendas/Cadastro); o conjunto define QUEM vê, QUANTO gasta por dia e QUAL evento otimizar; o anúncio é a PEÇA (criativo + texto + link). Default sagrado do curso: 1 campanha → 1 conjunto → 2–3 anúncios. *Analogia: pasta → subpasta → arquivos.*

**CBO vs ABO** — onde vive a verba: CBO = orçamento na campanha (a Meta distribui entre conjuntos); ABO = orçamento em cada conjunto. O método usa **orçamento no conjunto** (com 1 conjunto só, dá no mesmo).

**Advantage+** — o "modo automático" da Meta: ela escolhe posicionamentos (feed, stories, reels...) e expande o público sozinha. O default sagrado ACEITA (iniciante segmentando à mão erra mais que o algoritmo).

**Público frio / morno / quente** — frio: nunca te viu (anúncio pra desconhecidos); morno: já interagiu (viu vídeo, visitou página); quente: quase comprou (carrinho, lista). Cada temperatura = campanha separada. O curso começa 100% no FRIO.

**Fase de aprendizado** — os primeiros dias em que o algoritmo está descobrindo pra quem entregar. Toda edição RESETA essa fase — por isso a regra dos 7 dias sem mexer ([guia-e-depois](../04-operacao/guia-e-depois.md)).

**Campanha PAUSADA ("posso testar sem gastar?" — SIM)** — criar campanha, subir criativo e ver tudo no Gerenciador não custa NADA enquanto o status for Pausado: só anúncio ATIVO rodando gasta. E nenhuma skill do curso ativa nada sozinha — o `/estruturador` cria tudo pausado e a ativação (Gate 3) é decisão explícita SUA. *Analogia: o carro na garagem com o tanque cheio — só gasta quando VOCÊ dirige.* → Onde vê: [guia-campanha-no-ar](../04-operacao/guia-campanha-no-ar.md).

**Painel da Semana (PAINEL-DA-SEMANA.yaml)** — o caderno de bordo da operação: um arquivo no seu projeto onde CADA semana registra o planejado (verba, critérios de sucesso e reversão), o realizado (as 8 métricas com selo) e a decisão tomada. É a memória que o `/leitor-de-metricas`, o `/diagnosticador` e a Aula 4 inteira leem. *Analogia: o prontuário do paciente — sem ele, cada consulta começa do zero.* → Onde vê um PREENCHIDO: `aula-03/exemplos/painel-semana-exemplo.yaml`.

**Criativo** — a peça visual do anúncio (imagem/vídeo). "Hook" é a primeira frase/imagem que segura a atenção. → Onde mexe: [guia-criativos](../04-operacao/guia-criativos.md).

## O mundo das MÉTRICAS (as 6 que importam agora)

**CTR** — % de quem VIU e clicou. Termômetro do criativo (regra de bolso do método: <0,5% em campanha fria = criativo fraco). · **CPM** — custo por mil exibições (termômetro de leilão/concorrência). · **CPA** — custo por resultado (a métrica-rainha: quanto custou cada venda/lead). · **ROAS** — retorno sobre gasto (receita ÷ gasto). ⚠️ O ROAS do Gerenciador é ATRIBUIÇÃO (estimativa) — dinheiro de verdade é o caixa da Hotmart. E **ROAS ≠ ROI**: o ROAS ignora os SEUS custos (produto, taxas, ferramentas) — dá pra ter ROAS 2 e ainda estar no prejuízo; quem fecha a conta é a sua margem (a pegadinha nº 1 do novato — referência de mercado). · **Frequência** — quantas vezes a MESMA pessoa viu (alta = saturou). · **Conversões** — o evento otimizado acontecendo; com menos de ~10 na janela, nenhuma conclusão vale.

## O mundo da API (a Aula 3/4 "por trás")

**API** — a porta de serviço de um site: programas entram por ela e pegam dados direto, sem clicar em tela. **Graph API** é a API da Meta. → **App** — o seu "crachá de desenvolvedor" registrado na Meta; é dele que saem tokens. → **Token** — a senha comprida que autoriza um programa a agir na sua conta (trate como senha de banco). → **Escopo** — o que o token PODE fazer (`ads_read` = só ler). → **Usuário do Sistema** — um "usuário robô" do BM, dono de tokens que não expiram (o jeito profissional). → **Webhook** — o inverso da API: em vez de você perguntar, o serviço te AVISA quando algo acontece (é como a Hotmart avisa a venda). → Onde mexe em tudo isso: [guia-meta-api](../03-conexoes-e-apis/guia-meta-api.md).

**GitHub ≠ VS Code ≠ terminal** — três coisas que todo mundo confunde: **GitHub** é o SITE onde o material do curso mora (é de lá que o `git pull` puxa); **VS Code** é um EDITOR de arquivos no seu computador; o **terminal** é onde você digita comandos (e onde o Claude Code roda). Você pode nunca abrir o GitHub — o `git pull` no terminal já traz tudo ([guia-atualizar-projeto](../01-pre-requisitos/guia-atualizar-projeto.md)).

---

## Teste de sucesso (autoavaliação de 60 segundos)

Você consegue completar de cabeça? — "O anúncio sai em nome da ___, pago pela ___ que vive dentro do ___. Quem avisa a Meta que houve venda é o ___ (pelo navegador) e a ___ (pelo servidor), sem contar duas vezes graças ao ___. A campanha define o ___, o conjunto define ___ e ___, e o anúncio é a ___."
*(Página · conta de anúncios · BM · pixel · CAPI · event_id · objetivo · público/verba · evento · peça.)* Errou dois ou mais? Releia a seção correspondente — 5 min.

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | o teste de autoavaliação acima — errou 2+? releia a seção correspondente (5 min) |
| 📖 Ler (a cadeia) | [guia-gerenciador-de-anuncios.md](guia-gerenciador-de-anuncios.md) (conhecer a ferramenta) → [guia-meta-fundacao.md](../03-conexoes-e-apis/guia-meta-fundacao.md) (montar a base) → [guia-meta-api.md](../03-conexoes-e-apis/guia-meta-api.md) (conectar) |
| 🚑 Se travar | esbarrou num termo que não está aqui? pergunte na conversa: "o que é X no contexto de tráfego? explique como pra leigo" — e avise no PS pra entrar neste guia |
