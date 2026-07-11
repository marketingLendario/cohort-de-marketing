# Masterplan - Produto unificado do Cohort de Marketing

## Status

Implementacao concluida em 2026-07-10. O produto unificado foi entregue pela
story `docs/stories/2026-07-09-cohort-marketing-unified-product.md` e recebeu
persistencia, runtime operacional e launcher no Epic 8. Este documento permanece
como registro das decisoes e do recorte arquitetural.

Ele consolida tres superficies hoje separadas:

1. `briefing.html`, que coleta o contexto base do projeto;
2. `mapa-skills.html`, que explica a jornada e os artefatos das skills;
3. `apps/academia-lendaria-ads-studio/`, que prepara e opera campanhas.

O plano de integracao do Squad de Trafego permanece valido como plano
especializado e passa a ser subordinado a este masterplan:
`docs/design/ads-studio-squad-trafego-integration-plan.md`.

## Objetivo

Criar um unico produto para que uma pessoa nao tecnica consiga:

- criar ou selecionar um projeto;
- preencher uma vez os dados estaveis do negocio, publico e oferta;
- entender qual e o proximo trabalho recomendado;
- executar skills sem precisar conhecer comandos, caminhos ou YAML;
- abrir os artefatos produzidos e resolver pendencias;
- transformar o contexto do projeto em uma campanha;
- operar a rotina semanal de trafego com historico e confirmacao humana.

O resultado deve parecer um unico sistema, nao tres paginas conectadas por
links.

## Fontes analisadas

### Superficies atuais

- `briefing.html`.
- `mapa-skills.html`.
- `mapa-skills-artifacts.js`.
- `mapa-skills-samples/academia-fit/`.
- `assets/al/hub-brand.css`.
- `assets/al/mapa-skills.css`.
- Aplicacao React em `apps/academia-lendaria-ads-studio/`.
- Mock visual canonico em
  `docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`.

### Contratos e documentacao

- `data/project-brief.schema.json`.
- `data/skill-unlock-rules.json`.
- `docs/skill-inputs.md`.
- `docs/project-brief-form-plan.md`.
- As 25 skills canonicas em `.claude/skills/*/SKILL.md`.
- Boundary ONLINE/LOCAL do Ads Studio.
- Plano do Squad de Trafego e suas fontes da Aula 3.

### Estado verificado

- O mapa e as regras possuem hoje os mesmos 25 IDs de skill.
- As regras fazem 206 referencias a campos do briefing; todas apontam para
  caminhos existentes no schema atual.
- As cinco skills do Squad de Trafego ainda nao fazem parte do catalogo
  canonico deste repositorio.
- O catalogo inicial unificado tera 30 skills: 25 atuais e 5 de trafego.
- Nao existe `project-brief.json` persistido nos projetos atuais.
- O Ads Studio ja possui autenticacao, tenancy por workspace, TanStack Router,
  Supabase, Zustand, BFF Fastify/tRPC, jobs e uma DS Lendaria local.
- As telas operacionais ainda usam, em grande parte, estado local e simulacoes.

## Decisao executiva

### Um produto, tres contextos de dominio

A recomendacao e evoluir o Ads Studio para o **Cohort Marketing Studio**, usando
a aplicacao React atual como shell tecnico e visual.

Unificar a experiencia nao significa colocar tudo no mesmo documento. O produto
tera tres contextos com ciclos de vida diferentes:

| Contexto | Pergunta que responde | Ciclo de vida |
|---|---|---|
| Projeto e briefing | Quem somos, para quem vendemos e qual e a oferta? | Estavel, revisado ocasionalmente |
| Jornada e skills | O que esta pronto, bloqueado, rodando ou desatualizado? | Derivado e orientado por eventos |
| Campanha e semana | O que vamos publicar e o que faremos com os resultados? | Mutavel por campanha e por semana |

O produto e uno. Os contratos de dados permanecem separados para evitar que
uma alteracao semanal sobrescreva o contexto mestre do projeto.

### O que nao fazer

- Nao embutir `briefing.html` ou `mapa-skills.html` em iframe.
- Nao criar uma quarta aplicacao paralela.
- Nao transformar o mapa no dashboard inicial.
- Nao duplicar a logica de uma skill dentro do frontend ou do BFF.
- Nao usar `mapa-skills-artifacts.js` como fonte de estado real.
- Nao copiar silenciosamente campos do briefing para a campanha.
- Nao manter o catalogo de skills escrito manualmente em mais de um arquivo.
- Nao permitir que uma saida de IA altere o estado definitivo sem revisao.

## Diagnostico das superficies atuais

### Briefing

Pontos fortes:

- schema externo e formulario gerado a partir dele;
- autosave simples;
- boa cobertura de projeto, mercado, oferta, marca, funil e canais;
- painel de desbloqueio e salto para campos faltantes;
- metadados de origem previstos desde o prototipo.

Limites estruturais:

- salva apenas uma chave global, `cohort.projectBrief.current`;
- os dados ficam restritos ao navegador e a origem HTTP usada;
- nao ha autenticacao, tenancy, versoes ou retomada em outro dispositivo;
- o schema e usado para renderizar, mas nao para validar o documento;
- artefatos sao marcados manualmente, sem verificacao de existencia;
- `availableWhen` das regras nao e executado;
- a proxima skill depende da ordem do JSON, nao da topologia do grafo;
- nomes tecnicos como `project.slug` aparecem na interface principal;
- a coluna lateral tenta exibir as 25 skills durante o preenchimento e aumenta
  a carga cognitiva.

### Mapa de skills

Pontos fortes:

- explica relacoes, dependencias, saidas e guardas;
- possui visualizacoes em fluxo, grade e Mermaid;
- oferece amostras concretas de artefatos;
- ja expressa uma jornada pedagogica reconhecivel.

Limites estruturais:

- `SKILLS`, posicoes, arestas e tour sao hardcoded no HTML;
- nao conhece o projeto ativo nem o estado do briefing;
- os previews sao fixtures fixas de `academia-fit`;
- copiar `/comando` nao executa a skill;
- nao distingue artefato real, exemplo, proposta ou arquivo desatualizado;
- o auto-fit inicial reduz o fluxo a nos pequenos em viewports desktop;
- bibliotecas e estilos dependem de CDNs e scripts globais;
- nao representa as cinco novas skills de trafego.

### Ads Studio

Pontos fortes:

- e a unica base preparada para autenticacao, persistencia e deploy;
- ja possui shell visual, componentes locais e rotas tipadas;
- modela workspace, campanha, wizard e jobs;
- possui separacao ONLINE/LOCAL explicita;
- tem fundacao para SSE, polling, retry e execucao assincrona.

Limites estruturais:

- a entidade raiz visivel ainda e campanha, nao projeto;
- o dashboard nao conhece briefing, artefatos ou jornada;
- o header do dashboard e diferente do shell visual do wizard;
- os oito passos refletem o produto original, nao a ordem do Squad de Trafego;
- varias telas simulam execucao no browser;
- o frontend ainda nao consome o runtime L2 real;
- o contrato de dados importado do `sinkra-hub` nao esta materializado por
  migrations neste repositorio.

## Bloqueadores P0 antes da integracao

### P0.1 - Export atual invalido contra o proprio schema

`briefing.html` grava e exporta a propriedade raiz `artifacts`, mas
`project-brief.schema.json` usa `additionalProperties: false` e nao declara essa
propriedade. Portanto, um export produzido pela tela e invalido contra o schema
que deveria defini-lo.

Correcao:

- remover `artifacts` de `ProjectBrief`;
- tratar artefatos como entidades verificadas do projeto;
- criar migracao para exports legados que ainda contenham o campo.

### P0.2 - Semantica de campo preenchido incorreta

O prototipo considera `false` e `0` como ausentes. Isso quebra casos validos,
como zero compras, zero clientes, uma confirmacao negativa ou uma opcao
booleana explicitamente recusada.

Correcao:

- separar `nao informado`, `informado com valor zero`, `false confirmado` e
  `nao aplicavel`;
- usar validacao por schema e semantica por campo, nao uma funcao generica de
  truthiness.

### P0.3 - Artefato concluido por declaracao manual

O usuario pode marcar um artefato como existente e a skill passa a `done` sem
que o arquivo tenha sido encontrado, versionado ou validado.

Correcao:

- criar um registro de artefatos com origem, caminho, hash, tipo, skill run e
  instante de verificacao;
- permitir declaracao manual apenas como evidencia pendente de confirmacao;
- calcular `done` a partir do registro, nao de checkbox local.

### P0.4 - Autoridade de skill duplicada

O mapa, as regras e as skills repetem nome, ordem, relacoes e artefatos. Hoje os
25 IDs coincidem, mas a igualdade e acidental e nao existe um gate que impeça
drift.

Correcao:

- criar um catalogo canonico versionado;
- gerar os adaptadores do mapa e do motor de prontidao;
- validar catalogo, regras, schemas e diretorios de skill no CI.

### P0.5 - Entidades `workspace`, `project` e `campaign` nao estao reconciliadas

O Ads Studio usa `workspace_id` como tenancy e campanha como raiz. O briefing
usa `project.slug`. Misturar os dois diretamente criaria campanha como projeto
ou projeto como conta.

Correcao:

- manter `workspace` como limite de acesso;
- introduzir `project` como raiz do trabalho de marketing;
- vincular uma ou mais campanhas ao projeto;
- preservar `slug` como identificador humano, nunca como chave de tenancy.

### P0.6 - Dois contratos de autonomia

O Ads Studio original permite publicacao e automacao. A Aula 3 exige operacao
recommend-only e confirmacao humana.

Correcao:

- tornar o modo Cohort o unico modo deste corte;
- remover mutacoes Meta do conjunto de tools disponiveis ao runner;
- deixar qualquer modo avancado fora do masterplan, sob flags e aceite proprio.

### P0.7 - Fonte do Squad de Trafego ainda nao foi promovida

As cinco skills estao em bundle nao rastreado de um worktree do `sinkra-hub`.

Correcao:

- executar a Onda 0 do plano especializado antes de expor essas skills no
  catalogo unificado;
- resolver a contradicao do Leitor de Metricas antes de congelar schemas.

## Principios de produto

1. **Projeto antes de campanha.** O usuario entra num projeto e depois decide
   qual trabalho ou campanha abrir.
2. **Preencher uma vez, herdar com transparencia.** Campos estaveis sao lidos
   do briefing; overrides de campanha sao explicitos.
3. **Proximo passo acima do mapa completo.** O dashboard recomenda uma acao; o
   mapa existe para orientacao e exploracao.
4. **Artefatos sao estado.** Arquivos e saidas versionadas determinam progresso,
   nao o historico do chat.
5. **Skill LOCAL continua canonica.** A interface coleta, executa, revisa e
   apresenta; nao reescreve o raciocinio da skill.
6. **Toda IA produz proposta.** Um humano confirma antes de alterar o estado
   definitivo.
7. **Bloqueio deve ser acionavel.** Todo estado bloqueado explica o motivo e
   oferece um salto direto para resolver a pendencia.
8. **Mudanca invalida o downstream.** Preco, promessa, angulo ou tracking
   alterado torna dependencias antigas `stale`, em vez de fingir que continuam
   validas.
9. **Exemplo nao e dado real.** Fixtures visuais sao rotuladas e isoladas do
   registro operacional.
10. **Nenhum token no briefing.** O produto guarda apenas o status de uma
    integracao; secrets permanecem fora do bundle e do banco de contexto.

## Arquitetura de informacao alvo

### Navegacao global

O shell autenticado deve usar a DS Lendaria que ja existe no Ads Studio e
manter um header consistente em todas as rotas.

Elementos globais:

- wordmark Lendaria e nome do produto;
- seletor de workspace;
- seletor de projeto;
- busca/comando rapido;
- central de execucoes e notificacoes;
- conta, tema e saida.

Navegacao do projeto:

1. **Visao geral**
2. **Briefing**
3. **Jornada**
4. **Artefatos**
5. **Campanhas**
6. **Operacao semanal**

O usuario nao ve nomes de schema, comandos CLI ou caminhos internos por padrao.
Esses detalhes ficam num modo tecnico ou no painel de proveniencia.

### Rotas recomendadas

```text
/projects
/projects/new
/projects/:projectId/overview
/projects/:projectId/briefing/:sectionId
/projects/:projectId/journey
/projects/:projectId/artifacts
/projects/:projectId/campaigns
/projects/:projectId/campaigns/:campaignId/:stepId
/projects/:projectId/weeks
/projects/:projectId/weeks/:weekId
/projects/:projectId/runs/:runId
```

Compatibilidade temporaria:

```text
/dashboard                                  -> redireciona para o ultimo projeto
/campaigns/:campaignId/:legacyStep          -> resolve project e step canonico
```

### Primeira tela do projeto

A primeira tela deve ser a Visao Geral, com foco operacional:

- proxima acao recomendada;
- motivo da recomendacao;
- uma pendencia bloqueante por vez;
- briefing e artefatos recentemente alterados;
- skills em execucao ou aguardando revisao;
- campanhas ativas;
- ultima leitura semanal e proxima rotina;
- acesso secundario ao mapa completo.

O mapa nao deve competir com o proximo passo. Ele responde “como tudo se
conecta”; a Visao Geral responde “o que eu faco agora”.

## Jornadas prioritarias

### Jornada A - Novo projeto

1. Criar projeto e perfil minimo.
2. Preencher a secao essencial do briefing.
3. Ver skills que ficaram prontas e por que.
4. Executar a primeira skill pela interface.
5. Revisar a proposta e confirmar o artefato.
6. Voltar a Visao Geral com o proximo passo recalculado.

### Jornada B - Projeto existente

1. Importar `project-brief.json` ou escanear a pasta do projeto.
2. Conciliar campos extraidos e conflitos.
3. Confirmar a origem de campos criticos.
4. Indexar artefatos reais.
5. Recalcular prontidao e marcar saidas antigas como `stale` quando necessario.

### Jornada C - Briefing para campanha

1. Criar campanha dentro do projeto.
2. Herdar campos do briefing em modo somente leitura.
3. Preencher apenas dados especificos da campanha.
4. Editar na fonte quando o dado for de projeto.
5. Registrar override quando a campanha divergir deliberadamente.
6. Executar a sequencia do Squad de Trafego.

### Jornada D - Ciclo semanal

1. Abrir ou criar a semana da campanha.
2. Inserir/importar dados nomeados da Meta.
3. Confirmar valores e fontes.
4. Rodar Leitor de Metricas.
5. Rodar Diagnosticador.
6. Aprovar ou rejeitar uma alavanca.
7. Registrar a acao humana e manter historico append-only.

## Modelo de dominio

```text
Workspace
  -> Project
       -> ProjectBrief revisions
       -> Artifacts
       -> SkillRuns
       -> Campaigns
            -> CampaignPlan revisions
            -> TrackingAudits
            -> CreativeSets
            -> Weeks
                 -> WeeklyPanel revisions
                 -> MetricSources
                 -> Decisions
```

### Entidades principais

#### Workspace

- limite de tenancy e RLS;
- membros e permissoes;
- configuracoes de integracao;
- nunca substituido por `project.slug`.

#### Project

- identidade do trabalho de marketing;
- pertence a um workspace;
- possui nome, slug, status e projeto ativo;
- agrega briefing, artefatos, runs e campanhas.

#### ProjectBrief

- contexto estavel e reutilizavel;
- schema versionado;
- revisoes imutaveis e uma revisao ativa;
- proveniencia por campo;
- sem estado de artefato e sem metricas semanais.

#### CampaignPlan

- contexto especifico de uma campanha;
- guarda objetivo, periodo, orcamento, angulos, finalistas, estrutura, tracking e
  confirmacao de subida manual;
- referencia a revisao do briefing usada como base;
- aceita overrides explicitos com justificativa.

#### WeeklyPanel

- estado temporal de uma campanha em uma semana;
- entradas de midia, saida do Leitor, diagnostico e decisao;
- versao e eventos append-only;
- nunca altera retroativamente semanas anteriores.

#### Artifact

- caminho/URI, tipo, hash, tamanho e estado de verificacao;
- projeto, skill run e revisao de origem;
- rotulo `real`, `example`, `proposal`, `confirmed` ou `stale`;
- preview seguro e download quando permitido.

#### SkillRun

- skill, versao e hash do prompt;
- input snapshot, output estruturado, logs e erros;
- estado de revisao humana;
- artefatos propostos e confirmados;
- idempotency key e tentativas.

## Contratos de dados

### ProjectBrief v1

Evoluir `project-brief.schema.json` para um contrato validado de fato.

Manter:

- `project`;
- `market`;
- `offer`;
- `brand`;
- `funnel`;
- `channels`;
- `data` apenas para baseline nao temporal;
- `integrations` como status;
- `fieldMeta` com proveniencia e confirmacao.

Adicionar:

- revisao e timestamps obrigatorios gerados pelo servidor;
- semantica explicita de `unknown` e `not_applicable`;
- `fieldMeta.sourceArtifactId` e `sourceRevisionId`;
- status de confirmacao para campos inferidos;
- economia estavel da oferta que for realmente reutilizavel, como margem bruta
  e modelo de recorrencia.

Remover:

- `artifacts` da raiz;
- metricas que representam uma semana especifica;
- qualquer secret ou token.

### CampaignPlan v1

Criar um schema separado para:

- objetivo da campanha;
- periodo e budget;
- oferta/revisao herdada;
- pagina de destino;
- canais e formatos;
- angulos e nivel de consciencia por angulo;
- provas selecionadas;
- finalistas criativos;
- estrutura proposta;
- checklist do Zelador;
- confirmacao de publicacao manual;
- overrides e sua justificativa.

### WeeklyPanel v1

Usar o Painel da Semana do squad como contrato portatil, com adapter YAML e
representacao interna validada por JSON Schema/Zod.

Separar:

- valores importados;
- valores confirmados;
- metricas calculadas deterministicamente;
- interpretacoes do Leitor;
- recomendacao do Diagnosticador;
- decisao e acao humana.

## Heranca do briefing para a campanha

| Fonte no briefing | Uso inicial na campanha | Politica |
|---|---|---|
| `project.name` | prefixo/nome sugerido | editavel como nome da campanha |
| `offer.name` e `offer.productName` | oferta promovida | herdado; trocar exige override |
| `offer.exactPrice` | preco e economia | somente leitura; editar na fonte |
| margem/economia da oferta | break-even e gate | somente leitura; nova revisao invalida gate |
| `market.targetAudience` | ICP inicial | herdado; campanha pode refinar |
| `market.avatarSummary` | contexto do Briefista | herdado com proveniencia |
| `market.dominantPain` | semente de angulos | gera sugestoes, nunca finalistas automaticos |
| `market.awarenessLevel` | default dos angulos | cada angulo precisa confirmar seu nivel |
| `market.trafficTemperature` | default de publico | override explicito permitido |
| `offer.proofAssets` | provas selecionaveis | campanha escolhe subconjunto |
| `project.voice` e `brand` | voz e direcao visual | herdado; mudanca global ocorre na fonte |
| `funnel.recommendedFormat` | formato recomendado | bloquear se artefato `funil.md` estiver stale |
| `channels.primaryCtaUrl` | pagina de destino | confirmar antes do Zelador |
| `channels.adChannels` | canal | v1 do squad limita a Meta |
| `channels.adFormats` | formatos pedidos | campanha escolhe o lote final |

### Politica de overrides

Cada valor exibido na campanha deve mostrar uma destas origens:

- `Herdado do briefing`;
- `Extraido de artefato`;
- `Definido nesta campanha`;
- `Inferido, precisa confirmar`;
- `Desatualizado pela revisao X`.

O usuario pode:

- abrir a fonte;
- editar a fonte;
- criar override local com justificativa;
- remover o override e voltar a herdar.

Nao existe copia silenciosa. A campanha referencia a revisao e registra o valor
resolvido no snapshot de cada execucao.

## Invalidacao e estado derivado

Mudancas relevantes devem invalidar dependencias de forma previsivel.

| Mudanca | Dependencias afetadas |
|---|---|
| preco, margem ou bump/upsell | economia, estrutura e diagnostico |
| promessa ou mecanismo | copy, angulos, briefing criativo e anuncios |
| avatar, dor ou consciencia | copy e bateria criativa |
| marca ou direcao visual | pecas visuais e mockups |
| funil ou pagina de destino | estrutura, tracking e publicacao |
| angulos finalistas | Briefista, criativos e Estruturador |
| tracking | gate de subida e confiabilidade da leitura |
| metricas confirmadas | Leitor e Diagnosticador da semana |

Estados unificados:

- `locked`;
- `ready`;
- `running`;
- `needs_review`;
- `done`;
- `stale`;
- `not_applicable`;
- `failed`.

`available`, `recommended` e `almost` podem continuar como explicacao de
prontidao, mas nao devem competir com o lifecycle de execucao.

## Catalogo canonico de skills

### Autoridades

- `.claude/skills/{id}/SKILL.md`: comportamento e limites da skill.
- `.agents/skills/`: espelho literal gerado e validado.
- `data/skill-catalog.yaml`: metadados de produto, grafo e UI.
- `data/skill-unlock-rules.json`: requisitos declarativos por skill.
- schemas compartilhados: entradas e saidas estruturadas.

### Conteudo minimo do catalogo

```yaml
id: offerbook
command: /offerbook
title: Offerbook
phase: offer
kind: foundation
skill_path: .claude/skills/offerbook/SKILL.md
prerequisites: []
feeds: []
primary_artifacts: []
ui:
  summary: "..."
  route: project-skill
execution:
  mode: local_skill
  requires_human_review: true
```

### Pipeline de geracao e validacao

Criar um comando CLI-first:

```bash
npm --prefix apps/academia-lendaria-ads-studio run catalog:validate
```

O comando deve falhar quando:

- uma pasta canonica nao possuir entrada no catalogo;
- uma regra apontar para skill ou campo inexistente;
- uma aresta apontar para ID inexistente;
- um artefato primario nao tiver tipo/glob;
- `.agents/skills` divergir de `.claude/skills`;
- houver ciclo proibido no grafo;
- uma skill executavel nao possuir schema de entrada/saida;
- uma versao do catalogo nao possuir migracao.

O frontend recebe um bundle gerado. Nenhum componente React reescreve a lista
de skills manualmente.

## Motor de prontidao

O calculo deve migrar do HTML para um modulo compartilhado e testavel.

Entradas:

- revisao ativa do briefing;
- perfil e aplicabilidade;
- artefatos verificados;
- runs e propostas pendentes;
- estado de campanhas;
- invalidacoes;
- integracoes configuradas.

Saidas por skill:

- aplicabilidade;
- estado de prontidao;
- estado de execucao;
- campos faltantes;
- artefatos faltantes;
- recomendados pendentes;
- motivo do bloqueio;
- acao primaria para resolver;
- proximo no grafo apos conclusao.

O backend recalcula antes de iniciar uma execucao. O frontend pode calcular uma
previa para resposta imediata, mas nao autoriza o job sozinho.

## Experiencia por superficie

### Briefing React

- portar o renderer de schema para componentes React da DS Lendaria;
- usar etapas e salvamento por projeto;
- validar na mudanca de campo, na saida da etapa e no servidor;
- exibir no maximo uma acao principal e poucas lacunas contextuais;
- mover a lista completa de skills para a Jornada;
- mostrar proveniencia sem expor path tecnico por padrao;
- oferecer importacao de briefing legado e conciliacao de conflitos;
- permitir `nao sei`, `nao se aplica`, zero e falso confirmado.

### Jornada React

- gerar nos e arestas do catalogo;
- usar status real do projeto;
- permitir zoom, pan, busca e foco por fase;
- abrir detalhe com requisitos, artefatos e historico;
- trocar `copiar comando` por uma acao contextual:
  `Preencher dado`, `Abrir artefato`, `Executar`, `Revisar` ou `Retomar`;
- manter Grid como alternativa de acessibilidade e varredura;
- manter Mermaid apenas como export/debug, nao como view principal;
- carregar exemplos somente em modo `Ver exemplo` e com rotulo inequívoco.

### Ads Studio dentro do produto

- renomear o modulo de navegacao para `Campanhas`;
- manter `Ads Studio` como nome do workspace de execucao da campanha;
- reorganizar o wizard segundo os pre-requisitos reais do squad;
- herdar dados do projeto com proveniencia;
- persistir cada etapa e cada proposta;
- integrar runs e revisao no mesmo padrao das demais skills;
- substituir publicacao simulada por subida manual confirmada na v1.

### Artefatos

- listar por fase, skill, tipo e estado;
- preview de Markdown, HTML, PDF e imagem com sandbox adequado;
- mostrar origem, hash, revisao e run;
- distinguir artefato real de exemplo;
- oferecer `Abrir no projeto`, `Baixar`, `Comparar revisoes` e `Usar como fonte`;
- nunca assumir que a existencia de um path em fixture significa conclusao.

## Arquitetura tecnica alvo

```text
React/Vite + TanStack Router + DS Lendaria
                |
                | tRPC + SSE/polling
                v
Fastify BFF
  + project/brief services
  + readiness engine
  + artifact registry
  + skill job orchestration
  + campaign/week services
                |
                +-- L0: validacao, grafo, calculos e gates
                +-- L2: skills com saida estruturada
                |
                v
Supabase/Postgres + RLS + object storage
                |
                v
Runner LOCAL versionado para skills e acesso a arquivos
```

### Boundary ONLINE/LOCAL

O host ONLINE:

- autentica e autoriza;
- persiste estado e eventos;
- calcula prontidao e gates deterministas;
- enfileira jobs;
- apresenta propostas;
- nunca executa prompt local nem acessa secrets do aluno.

O runner LOCAL:

- resolve a skill canonica e seu hash;
- le os arquivos autorizados do projeto;
- executa a capacidade;
- envia eventos e proposta estruturada;
- materializa artefatos apenas apos o protocolo permitido;
- nunca recebe uma tool de mutacao Meta no modo Cohort.

### Persistencia recomendada

Tabelas logicas:

- `marketing_projects`;
- `project_brief_revisions`;
- `project_field_sources`;
- `project_artifacts`;
- `skill_runs`;
- `skill_run_events`;
- `ads_campaigns` com `project_id`;
- `campaign_plan_revisions`;
- `ads_weekly_panels`;
- `ads_weekly_panel_events`;
- `human_decisions`.

Todas as entidades operacionais carregam `workspace_id`, com RLS e testes
negativos de acesso cruzado.

### Escrita em duas fases

1. Runner produz proposta validada.
2. BFF guarda proposta e evento.
3. UI mostra diff e impactos.
4. Humano confirma, edita ou rejeita.
5. Transacao grava revisao definitiva e eventos.
6. Motor recalcula prontidao e invalidacoes.

## Estrategia de migracao

### HTMLs legados

Durante a migracao:

- `briefing.html` e `mapa-skills.html` permanecem como referencia visual e
  fallback de demonstracao;
- nao recebem novas features de produto;
- correcoes criticas de export podem ser aplicadas apenas para permitir
  migracao segura;
- depois da paridade, viram redirects/documentacao e deixam de ser runtime.

### Dados do briefing legado

O app em `127.0.0.1:5177` nao pode ler automaticamente o `localStorage` de uma
pagina servida em outra porta ou origem. A politica de same-origin impede essa
migracao silenciosa.

Fluxo seguro:

1. corrigir o export legado para um envelope versionado;
2. oferecer importacao JSON no novo produto;
3. validar e migrar `0.1.0 -> 1.0.0`;
4. mostrar conflitos e campos descartados;
5. exigir confirmacao antes de criar a primeira revisao;
6. registrar o arquivo original como evidencia da migracao.

Se o briefing legado estiver hospedado na mesma origem durante o cutover, um
bridge de uma unica execucao pode ser criado, mas o import JSON continua como
fallback obrigatorio.

### Fixtures do mapa

- mover metadados de amostra para fixtures tipadas;
- remover qualquer inferencia de status operacional a partir delas;
- preservar `academia-fit` como demo versionada;
- carregar a demo apenas quando o workspace estiver explicitamente em modo
  demonstracao.

## Plano de entrega

### Onda 0 - Autoridade e P0s

1. Promover o bundle do Squad de Trafego.
2. Resolver o contrato do Leitor de Metricas.
3. Registrar ADR de autonomia recommend-only.
4. Corrigir a incompatibilidade `artifacts` versus schema.
5. Definir a relacao Workspace -> Project -> Campaign.
6. Congelar IDs e versoes dos contratos legados.

**Saida:** fontes versionadas e decisoes irreversiveis explicitadas.

### Onda 1 - Catalogo e contratos

1. Criar `skill-catalog` canonico e seu schema.
2. Importar as cinco skills de trafego no catalogo.
3. Criar validador CLI e gate de CI.
4. Criar `ProjectBrief v1`, `CampaignPlan v1` e `WeeklyPanel v1`.
5. Criar migrador do briefing `0.1.0`.
6. Extrair o motor de prontidao para modulo compartilhado.

**Saida:** dados e grafo confiaveis, ainda sem nova UI.

### Onda 2 - Fundacao do produto unificado

1. Criar migrations, RLS e repositorios.
2. Introduzir `marketing_projects` e vincular campanhas.
3. Unificar header, navegacao e seletores no shell React.
4. Criar rotas de Projeto, Visao Geral e Artefatos.
5. Criar lifecycle de revisoes e eventos.
6. Manter compatibilidade com rotas antigas.

**Saida:** um projeto abre num shell unico e persistente.

### Onda 3 - Portar o Briefing

1. Construir renderer React guiado pelo schema.
2. Implementar autosave duravel e optimistic UI.
3. Implementar semantica de unknown/zero/false/not-applicable.
4. Implementar proveniencia e confirmacao.
5. Implementar importacao e conciliacao do legado.
6. Integrar o motor de prontidao e a proxima acao.

**Saida:** briefing deixa de depender do HTML standalone.

### Onda 4 - Portar a Jornada e Artefatos

1. Construir grafo a partir do catalogo.
2. Integrar estados reais de prontidao, runs e invalidacao.
3. Construir detalhe acionavel da skill.
4. Integrar registry e preview de artefatos reais.
5. Portar Grid e busca; manter Mermaid como export.
6. Rotular e isolar exemplos.

**Saida:** mapa passa de documentacao interativa para controle de jornada.

### Onda 5 - Integrar Campanhas e Squad de Trafego

Executar as Ondas 1 a 3 do plano especializado:

1. conectar Briefing -> CampaignPlan com heranca e overrides;
2. ligar runtime real de skills;
3. reorganizar Fundamentos -> Zelador -> Briefista -> Curadoria ->
   Estruturador -> Subida manual;
4. substituir simulacoes por propostas versionadas;
5. registrar publicacao como acao humana.

**Saida:** campanha preparada de ponta a ponta sem CLI e sem mutacao Meta.

### Onda 6 - Operacao semanal

Executar as Ondas 4 e 5 do plano especializado:

1. importar e confirmar metricas;
2. executar Leitor e Diagnosticador;
3. registrar uma alavanca e sua decisao humana;
4. manter semanas append-only;
5. fechar testes simulados, casos reais e piloto com nao tecnicos.

**Saida:** ciclo completo do briefing a decisao semanal.

### Onda 7 - Cutover e desativacao do legado

1. rodar comparacao funcional e visual por viewport;
2. migrar dados legados conhecidos;
3. medir adocao e erros por rota;
4. ativar por workspace;
5. manter rollback por flags;
6. transformar HTMLs antigos em referencia/redirect depois da paridade.

**Saida:** um unico produto em producao, com rollback controlado.

## Backlog em stories

| ID | Story | Dependencias |
|---|---|---|
| CMS-UNIFY-00 | ADR do produto, autonomia e hierarquia de entidades | - |
| CMS-UNIFY-01 | Promover Squad de Trafego e reconciliar Leitor | 00 |
| CMS-UNIFY-02 | Corrigir contrato/export legado do briefing | 00 |
| CMS-UNIFY-03 | Catalogo canonico e validador CLI | 00, 01 |
| CMS-UNIFY-04 | ProjectBrief v1 e migrador 0.1.0 | 02, 03 |
| CMS-UNIFY-05 | CampaignPlan v1 e WeeklyPanel v1 | 01, 03 |
| CMS-UNIFY-06 | Motor compartilhado de prontidao | 03, 04 |
| CMS-UNIFY-07 | Migrations, RLS e Project repositories | 00, 04, 05 |
| CMS-UNIFY-08 | Shell global, project switcher e novas rotas | 07 |
| CMS-UNIFY-09 | Visao Geral e proxima acao | 06, 08 |
| CMS-UNIFY-10 | Briefing React e validacao | 04, 07, 08 |
| CMS-UNIFY-11 | Proveniencia, autosave e revisoes | 07, 10 |
| CMS-UNIFY-12 | Importacao e conciliacao do legado | 04, 10, 11 |
| CMS-UNIFY-13 | Jornada React gerada do catalogo | 06, 08 |
| CMS-UNIFY-14 | Registry e preview de artefatos reais | 07, 08 |
| CMS-UNIFY-15 | Detalhe acionavel e lifecycle de runs | 13, 14 |
| CMS-UNIFY-16 | Heranca Briefing -> Campaign e overrides | 05, 11 |
| CMS-UNIFY-17 | Runtime LOCAL de skills e revisao de propostas | 03, 07, 15 |
| CMS-UNIFY-18 | Fluxo Cohort de preparacao de campanha | 16, 17 |
| CMS-UNIFY-19 | Operacao semanal e historico append-only | 05, 17, 18 |
| CMS-UNIFY-20 | E2E, piloto, rollout e desativacao do legado | 09-19 |

## Estrategia de testes

### Contratos

- schema parseavel e exemplos validos;
- migracoes fixture a fixture;
- catalogo, diretorios e regras em paridade;
- ausencia de ciclos proibidos;
- hashes e versoes persistidos.

### Dominio

- zero e falso confirmado contam corretamente;
- `not_applicable` nao e tratado como vazio;
- uma alteracao upstream marca dependencias `stale`;
- o motor escolhe o proximo no grafo, nao na ordem do JSON;
- artefato manual nao conclui skill sem politica de verificacao;
- override e remocao de override preservam proveniencia.

### Seguranca

- RLS entre workspaces e projetos;
- URLs e previews de artefato sanitizados/sandboxed;
- nenhum secret no ProjectBrief;
- runner sem tools Meta mutaveis no modo Cohort;
- proposta de IA nao escreve revisao definitiva sozinha.

### Experiencia

- criar projeto, preencher briefing e executar proxima skill;
- importar briefing legado;
- abrir bloqueio e saltar para o campo correto;
- transformar briefing em campanha sem redigitar dados;
- retomar run falho;
- completar um ciclo semanal;
- desktop e mobile sem sobreposicao ou texto truncado;
- comparacao visual com os mocks e superficies de origem.

## Criterios de aceite do programa

1. O usuario troca de Briefing, Jornada, Artefatos e Campanhas sem perder o
   contexto do projeto.
2. O mesmo dado de oferta nao precisa ser digitado novamente na campanha.
3. Todo valor herdado mostra sua origem e oferece edicao na fonte.
4. O briefing e validado no frontend e no backend.
5. Zero, falso, desconhecido e nao aplicavel sao estados distintos.
6. O mapa e gerado do catalogo e reflete o estado real do projeto.
7. Cada bloqueio tem motivo e acao de recuperacao.
8. Uma skill pode ser iniciada, acompanhada, revisada e retomada sem terminal.
9. Artefatos possuem origem, hash, run e revisao.
10. Exemplos nunca contam como artefatos reais.
11. Mudancas upstream invalidam downstream de forma visivel.
12. O fluxo de trafego respeita a ordem e os gates do squad.
13. Publicacao e alteracoes Meta sao confirmadas como acoes humanas na v1.
14. O estado sobrevive a reload, logout e outro dispositivo.
15. O ciclo semanal mantem historico append-only.
16. RLS impede acesso cruzado entre workspaces.
17. Os HTMLs legados podem ser desativados sem perda funcional.

## Metricas de sucesso

### Ativacao

- tempo ate criar o primeiro projeto;
- tempo ate o briefing minimo valido;
- percentual que executa a primeira skill;
- percentual que cria campanha a partir do briefing.

### Eficiencia

- campos redigitados por campanha;
- cliques ate resolver um bloqueio;
- tempo entre run e revisao;
- taxa de retomada apos falha;
- percentual de valores herdados versus overrides.

### Qualidade

- erros de schema por revisao;
- artefatos `stale` usados indevidamente;
- propostas editadas/rejeitadas;
- discrepancias entre catalogo, regras e skills;
- incidentes de acesso ou proveniencia.

### Aula 3

- campanha pronta/publicada manualmente em ate 7 dias;
- rotina semanal datada;
- uma alavanca decidida por ciclo;
- quatro semanas consecutivas com painel retomavel.

## Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Escopo vira reescrita total | Entregar por ondas verticais e manter rotas legadas |
| Um mega-schema mistura tudo | Tres contratos e snapshots de referencia |
| Skill muda e quebra runs | Hash, versao e fixtures de contrato |
| Usuario nao entende o mapa | Proxima acao na Home; mapa como exploracao |
| Migracao perde localStorage | Export/import versionado e conciliacao visivel |
| Fixtures parecem dados reais | Estado `example` e modo demo explicito |
| Alteracao de briefing quebra campanha sem aviso | Grafo de invalidacao e estado `stale` |
| IA altera estado indevidamente | Escrita em duas fases e tools limitadas |
| RLS do app portado nao esta materializada | Migrations versionadas e testes negativos |
| Dois design systems persistem | Portar para a DS Lendaria local e remover CDNs |

## Kill switches e rollback

- `UNIFIED_PROJECT_SHELL_ENABLED`;
- `PROJECT_BRIEF_REACT_ENABLED`;
- `SKILL_JOURNEY_REACT_ENABLED`;
- `LOCAL_SKILL_RUNNER_ENABLED`;
- `CODEX_CLI_PATH` e `CODEX_SKILL_MODEL` opcionais;
- `TRAFFIC_SQUAD_ENABLED`;
- flag por skill;
- `TRAFFIC_SQUAD_AI_ENABLED`;
- `TRAFFIC_SQUAD_META_MUTATIONS=false` obrigatorio;
- redirect reversivel para as rotas legadas durante o cutover.

## Decisoes fechadas na implementacao

1. Nome publico: `Marketing Studio`; `Ads Studio` permanece como modulo de
   campanhas.
2. Artefatos: modelo hibrido, com filesystem canonico e Supabase para
   metadados, hash, revisao e snapshot opcional.
3. Colaboracao: optimistic concurrency por revisao, sem coedicao em tempo real
   neste corte.
4. Economia: defaults pertencem ao projeto; campanhas registram apenas
   overrides explicitos e sua proveniencia.
5. Runtime LOCAL: o BFF chama `codex exec` com a autenticacao ativa no Codex
   CLI, execucao efemera, sandbox `read-only` e contrato JSON estruturado.

As proximas decisoes pertencem ao go-live da Aula 3 e ao produto de Dados da
Aula 4; nao reabrem o recorte arquitetural entregue.

## Fora de escopo deste corte

- publicacao automatica na Meta;
- kill/scale automatico;
- Google Ads;
- editor visual generico de workflows;
- colaboracao em tempo real estilo documento;
- substituicao do filesystem canonico das skills por prompts salvos no banco;
- reescrita das 25 skills existentes.

## Primeiro incremento executavel

Comecar por um corte sem UI nova:

1. criar `CMS-UNIFY-00` como story/ADR;
2. executar `CMS-UNIFY-01` e promover o Squad de Trafego;
3. corrigir o export legado em `CMS-UNIFY-02`;
4. criar catalogo + validador em `CMS-UNIFY-03`;
5. congelar os tres schemas em `CMS-UNIFY-04/05`.

Somente depois disso iniciar o shell e as telas. Esse corte elimina as
contradicoes que hoje fariam a interface consolidar dados errados ou duplicar
fontes de verdade.
