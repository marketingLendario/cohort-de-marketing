# Plano de integração - Squad de Tráfego no Ads Studio

## Status

Implementado em 2026-07-10 no Marketing Studio. O produto unificado fechou as
ondas funcionais e o Epic 8 entregou persistência Supabase, runtime durável via
Codex CLI local, aprovação em duas fases, materialização no filesystem, piloto
das cinco skills e launcher para não técnicos. Este documento permanece como
registro do diagnóstico e das decisões de produto.

## Objetivo

Transformar o Ads Studio numa ponte visual para as cinco skills do Squad de
Tráfego, permitindo que um operador não técnico execute a rotina sem usar CLI,
editar YAML ou conhecer a estrutura interna dos prompts.

O produto continua obedecendo ao contrato central da Aula 3:

> O squad prepara e recomenda. O humano confirma, aprova, decide e publica.

## Fontes analisadas

### Bundle do squad

- Worktree: `claude/cohort-marketing-aula-3-cbff0b`.
- HEAD do worktree: `7acb4c04c1ce45d7fe67ed51352255b15b30bc09`.
- Estado: o diretório `artefatos/squad-trafego/` está não rastreado no worktree.
- Hash agregado do bundle lido:
  `f7a74b131d63a2f45428b56050ba6e667de4b5d00bf535187f15cf2ee3f531d0`.
- Arquivos: cinco `SKILL.md`, Painel da Semana, README, duas rodadas E2E e
  exemplo preenchido.

### Produto e currículo

- `artefatos/INDEX.md`.
- `artefatos/PRD-A3-trafego-v1.md`, fonte autoritativa da Aula 3.
- Estrutura, roteiro, tópicos de conteúdo e roundtable da Aula 3.
- `workspace/businesses/academia-lendaria/L3-product/cohort_marketing_receita/curriculum.yaml`.
- `workspace/businesses/academia-lendaria/L3-product/cohort_marketing_receita/offerbook.yaml`.
- PRD, arquitetura, modelo de dados e topologia do Ads Studio no `sinkra-hub`.
- Aplicação portada neste repositório, incluindo UI, BFF, jobs e modo demo.

## Diagnóstico executivo

O encaixe é forte, mas não é uma operação de copiar cinco pastas e adicionar
cinco botões. Existem dois produtos conceitualmente diferentes:

1. O PRD original do Ads Studio prevê publicação via agente/CLI Meta e monitor
   com decisões automáticas de kill/scale.
2. O PRD da Aula 3 exige `recommend-only 100%` e `act-only 0%`: nenhuma skill
   publica, pausa, escala ou muda público; o aluno realiza a ação na Meta.

A recomendação é manter o Ads Studio como base tecnológica e criar nele um
**modo Cohort guiado**, que será o modo padrão para estes cinco papéis. O modo
autônomo do PRD antigo fica fora deste corte, atrás de feature flag e sem
reaproveitar estados que possam sugerir ação aplicada.

O BFF já contém a fundação certa - jobs assíncronos, SSE/polling, retry e
roteamento L0-L3 -, mas o L2 ainda é esqueleto e o frontend atual não o consome.
Hoje as telas 2-8 usam estado local e simulações determinísticas no browser.

## Achados que precisam ser resolvidos antes do build

### P0 - Autoridade e segurança

1. **Fonte não promovida.** O bundle das skills está não rastreado num worktree.
   Ele precisa ser promovido antes de virar dependência do produto.
2. **Contrato do Leitor divergente.** O início da skill e o relatório E2E
   permitem aritmética determinística quando todos os insumos foram fornecidos;
   a seção `Não fazer`, o template e o PRD ainda dizem `nunca calcula`.
3. **Dois modelos de autonomia.** Publicação automática e kill/scale do Ads
   Studio conflitam com a regra recommend-only da Aula 3.
4. **Ordem operacional divergente.** No app atual, Estrutura vem antes de
   Briefing e Tracking vem quase no fim. No squad, Zelador é pré-requisito,
   Briefista gera os finalistas e só então o Estruturador monta a campanha.
5. **Tracking simulado.** A tela atual pode declarar o gate saudável sem a
   confirmação concreta, item a item, exigida pelo Zelador.
6. **Estado sem histórico.** `localStorage` salva apenas a projeção atual. O
   Painel da Semana exige histórico append-only, proveniência e retomada.

### P1 - Coerência de produto

1. O PRD fala em quatro agentes + operador e depois inclui o Zelador. A
   interface deve ser explícita: são cinco skills e um operador humano.
2. O `curriculum.yaml` ainda informa que o PRD da A3 é inexistente.
3. O `offerbook.yaml` ainda aponta PRD `A definir` e menciona Meta/Google,
   enquanto a v1 foi fechada como Meta Ads apenas.
4. A publicação simulada atual exibe logs que parecem ações reais na Meta. No
   modo Cohort, o CTA deve gerar instruções e depois registrar uma confirmação
   manual do aluno.
5. O monitor atual marca decisões como `aplicado`; o Diagnosticador só pode
   produzir uma recomendação pendente de aprovação e execução humana.

## Decisão de produto recomendada

### Modo Cohort guiado

- Público: aluno ou operador não técnico.
- Plataforma: Meta Ads.
- Autonomia: recomendação e preparação apenas.
- Estado: Painel da Semana estruturado, com importação/exportação YAML.
- Interação: formulários, confirmações, revisão de propostas e histórico.
- Linguagem: tarefas e decisões, não nomes de comandos ou detalhes de prompt.
- Sucesso: campanha pronta/publicada manualmente, rotina datada e uma alavanca
  decidida, conforme a métrica-âncora do PRD.

### Modo avançado

Publicação via adapter Meta e automação do monitor permanecem fora deste plano.
Se retomadas, devem usar outro modo, permissões próprias, novo aceite de risco e
feature flags independentes. Não podem ser habilitadas por herança do modo
Cohort.

## Arquitetura de experiência

### Navegação recomendada

O wizard deve representar o trabalho real, não a ordem histórica das telas:

1. **Fundamentos** - importa Oferta/Funil, ticket, margem, página e ângulos.
2. **Saúde da conta** - Zelador, com confirmação concreta dos sete itens.
3. **Bateria criativa** - Briefista gera hooks/copy a partir dos ângulos válidos.
4. **Curadoria** - humano escolhe 2-3 finalistas e, opcionalmente, produz peças.
5. **Estrutura** - Estruturador monta o default sagrado com os finalistas.
6. **Subida manual** - checklist e instruções; humano confirma o clique na Meta.
7. **Leitura da semana** - Leitor recebe dados colados/importados e os rotula.
8. **Próxima alavanca** - Diagnosticador produz uma recomendação falseável.

O Dashboard deixa de ser apenas uma lista de campanhas e passa a abrir a
**Operação da Semana**, mostrando:

- etapa atual e próximo passo;
- gate bloqueante e como resolver;
- última execução de cada papel;
- campanha e semana ativas;
- uma única decisão pendente do operador;
- histórico das semanas anteriores.

### Mapeamento das skills para a UI

| Skill | Entrada amigável | Execução | Saída visual | Confirmação humana |
|---|---|---|---|---|
| Zelador | Checklist guiado + texto do que o aluno viu | L0 para status; L2 apenas para orientação textual | Saúde OK/PARCIAL/CRÍTICO + pendências | Cada item exige evidência textual; nenhuma inferência |
| Briefista | Ângulos herdados, nível de consciência, provas e tom | Job L2 estruturado | Bateria agrupada por ângulo/categoria/formato | Curadoria de 2-3 finalistas |
| Estruturador | Finalistas, verba e objetivo | L0 para regras duras + L2 para explicação | Plano de campanha campo a campo | Aprovar plano; publicação é manual |
| Leitor | Colar/exportar números nomeados da Meta | Extração assistida + confirmação + cálculo L0 | Métricas com selo, fonte, fórmula e ausências | Confirmar os valores extraídos antes de gravar |
| Diagnosticador | Sinais confirmados + break-even | Guardas L0 + job L2 | Hipótese, alavanca, sucesso e reversão | Aprovar ou rejeitar; nunca aplicar automaticamente |

## Painel da Semana como contrato central

O YAML fornecido deve continuar portátil, mas não será a interface primária.
Internamente, o produto trabalha com um schema versionado e apresenta os campos
em linguagem de operação.

### Autoridade do contrato

- `SKILL.md`: comportamento, limites e voz de cada papel.
- JSON Schema/Zod compartilhado: formato normativo de entrada, saída e Painel.
- Manifesto do squad: ordem, pré-requisitos, campos lidos/escritos, versão e
  efeitos proibidos.
- YAML: formato de importação/exportação e material didático.

Essas autoridades são complementares. Testes de contrato impedem que o texto da
skill e o schema se afastem silenciosamente.

### Estado recomendado

Reutilizar o modelo previsto para o Ads Studio e adicionar apenas o necessário:

- `ads_campaigns`: raiz e vínculo com `workspace_id`.
- `ads_unit_economics`: ticket, margem e break-even.
- `ads_structure`, `ads_creatives` e `ads_ad_slots`: plano e finalistas.
- `ads_tracking_audits`: snapshots do Zelador/tracking.
- `skill_jobs`: lifecycle das cinco skills; ampliar tipos e persistir
  `skill_version`, `skill_hash`, `input_snapshot` e `output_proposal`.
- `monitor_decisions`: recomendações do Diagnosticador, sem status automático
  `applied` no modo Cohort.
- `ads_weekly_panels`: projeção materializada do Painel, `schema_version` e
  `revision`.
- `ads_weekly_panel_events`: log append-only de patches, ator, papel, fonte e
  decisão humana.

Todas as tabelas carregam `workspace_id` e RLS por `workspace_members`, seguindo
o modelo já especificado no `sinkra-hub`.

### Escrita em duas fases

1. A skill produz uma **proposta** validada pelo schema.
2. A UI mostra o que vai mudar em linguagem humana.
3. O operador confirma.
4. O backend grava o patch e um evento append-only na mesma transação.

Nenhuma execução de IA escreve diretamente no Painel definitivo.

## Arquitetura de execução

```text
React/Vite no Vercel
        |
        | tRPC + SSE/polling
        v
Fastify BFF + worker dedicado
        |
        +-- L0: regras e cálculos determinísticos
        +-- L2: cinco executores de skill com saída estruturada
        +-- registry: SKILL.md + manifesto + schemas versionados
        |
        v
Supabase: painel, eventos, jobs, evidências e RLS
```

### Registry e empacotamento

As skills canônicas deste repositório devem viver em:

- `.claude/skills/zelador/`
- `.claude/skills/briefista/`
- `.claude/skills/estruturador/`
- `.claude/skills/leitor-de-metricas/`
- `.claude/skills/diagnosticador/`
- `.claude/skills/_shared/squad-trafego/` para manifesto, schemas e fixtures.

`.agents/skills/` continua sendo espelho literal, gerado e validado. O build do
worker empacota o registry com hash; não haverá uma segunda cópia manual dos
prompts dentro de `src/` ou `server/`.

Cada `skill_job` grava o hash da skill usada. Uma alteração de prompt nunca muda
retroativamente a interpretação de uma execução passada.

### Camadas por skill

- Zelador: a decisão de status é determinística; IA ajuda a formular perguntas
  e pendências, mas não decide se o aluno confirmou algo.
- Briefista: geração L2, saída JSON validada; erro granular por ângulo.
- Estruturador: gates/piso/default em L0; narrativa e plano em L2.
- Leitor: L2 pode extrair candidatos de texto bagunçado; o usuário confirma;
  CTR/CPM/CPA são calculados em L0 apenas quando todos os insumos existem.
- Diagnosticador: pré-condições e circuit-breaker em L0; hipótese e recomendação
  em L2; exatamente uma alavanca.

L3 headless permanece desabilitado em produção. O caminho de produção é o job
L2 estruturado no worker, não `claude -p` no host público.

## Segurança e governança

### Invariantes de backend

- Nenhuma rota do modo Cohort chama `services/meta-ads` para mutação.
- Publicação, pausa, mudança de público e verba não existem como tool do runner.
- Gate do Zelador é recalculado no backend.
- Briefista recusa ângulo sem nível de consciência.
- Estruturador bloqueia status CRÍTICO e verba abaixo de R$20/dia.
- Leitor não completa dado ausente e guarda a fonte de cada valor.
- ROAS só recebe selo Real após confirmação de venda no caixa.
- Diagnosticador exige leitura anterior e retorna exatamente quatro partes.
- Toda proposta exige aceite humano antes da gravação definitiva.

### Kill switches

- `TRAFFIC_SQUAD_ENABLED`: desliga o módulo inteiro.
- Flag por skill para desativar um executor isoladamente.
- `TRAFFIC_SQUAD_AI_ENABLED`: mantém formulários, estado e exportação, mas
  desliga geração por IA.
- `TRAFFIC_SQUAD_META_MUTATIONS=false`: constante obrigatória no modo Cohort.
- Pin de versão/hash das skills por ambiente.

## Plano de entrega

### Onda 0 - Congelar autoridade

1. Promover o bundle não rastreado do worktree.
2. Importar as cinco skills para `.claude/skills/` e gerar o espelho `.agents`.
3. Registrar hashes e proveniência num lockfile.
4. Corrigir as divergências do Leitor, curriculum e offerbook.
5. Criar ADR separando `modo Cohort` de `modo avançado`.
6. Validar o bundle contra os dois exemplos E2E.

**Saída:** fonte canônica versionada, sem ambiguidades P0.

### Onda 1 - Contratos e estado

1. Criar schemas do Painel e das cinco entradas/saídas.
2. Criar manifesto de pré-requisitos, leituras e escritas.
3. Implementar importação/exportação YAML com migração de versão.
4. Materializar migrations/RLS de Painel, eventos e extensões de `skill_jobs`.
5. Criar repositório transacional de proposta + confirmação + evento.

**Saída:** Painel retomável e auditável, ainda sem IA.

### Onda 2 - Runtime de skills

1. Ligar o frontend ao BFF e substituir a fila esqueleto por execução real.
2. Criar registry versionado e carregamento do prompt empacotado.
3. Implementar executores L0/L2 e validação de saída.
4. Implementar SSE, polling, cancelamento e retry granular.
5. Persistir hash, input, proposta, logs e erros de cada run.

**Saída:** uma skill pode ser executada de ponta a ponta sem CLI.

### Onda 3 - Preparar campanha

1. Reorganizar o wizard para a ordem Fundamentos -> Zelador -> Briefista ->
   Curadoria -> Estruturador -> Subida manual.
2. Adaptar a tela de Tracking para o checklist item a item do Zelador.
3. Ligar Briefing/Fábrica ao Briefista real e ao gate de curadoria.
4. Mover Estrutura para depois dos finalistas.
5. Trocar `Publicar campanha` por instruções e confirmação manual na v1.

**Saída:** campanha pronta para o aluno publicar, sem mutação automática.

### Onda 4 - Operar a semana

1. Criar entrada amigável de dados da Meta e revisão dos campos extraídos.
2. Implementar selos Real/Estimado/Não fornecido e fórmulas auditáveis.
3. Adaptar Monitor para o contrato do Diagnosticador.
4. Implementar aprovar/rejeitar alavanca e handoff ao Briefista/Estruturador.
5. Implementar rotina datada, semanas append-only e handoff A3 -> A4.

**Saída:** um ciclo semanal completo e retomável.

### Onda 5 - Prova e liberação

1. Rodar os dois casos simulados como testes de regressão.
2. Rodar três casos reais em conta Meta, sem ação automática.
3. Testar onboarding com 5-10 usuários não técnicos.
4. Medir tempo, abandono, campos ambíguos e necessidade de ajuda.
5. Corrigir P0/P1 e liberar gradualmente por workspace.

**Saída:** evidência para fechar RA-1 e a meta final de ativação.

## Backlog em stories

| ID sugerido | Story | Dependência |
|---|---|---|
| TRAF-BRIDGE-0 | Promover e importar bundle canônico | - |
| TRAF-BRIDGE-1 | Reconciliar contratos e registrar ADR de autonomia | 0 |
| TRAF-BRIDGE-2 | Schemas + manifesto + validação de fixtures | 1 |
| TRAF-BRIDGE-3 | Persistência do Painel + eventos + RLS | 2 |
| TRAF-BRIDGE-4 | Registry e executor L2 versionado | 2, 3 |
| TRAF-BRIDGE-5 | Cliente tRPC/SSE e estados de execução | 4 |
| TRAF-BRIDGE-6 | Zelador guiado e gate backend | 3, 5 |
| TRAF-BRIDGE-7 | Briefista + curadoria humana | 3, 5 |
| TRAF-BRIDGE-8 | Estruturador + submissão manual | 6, 7 |
| TRAF-BRIDGE-9 | Leitor com proveniência e cálculo determinístico | 3, 5 |
| TRAF-BRIDGE-10 | Diagnosticador + decisão humana | 9 |
| TRAF-BRIDGE-11 | Rotina semanal + handoff A4 | 8, 10 |
| TRAF-BRIDGE-12 | E2E, piloto real e rollout por flag | 6-11 |

## Critérios de aceite do programa

1. Um usuário não técnico completa o fluxo sem terminal e sem editar YAML.
2. O estado sobrevive a reload, logout e retomada em outro dispositivo.
3. Cada execução mostra status, versão da skill, logs e caminho de recuperação.
4. Nenhuma proposta altera o Painel antes do aceite humano.
5. O Zelador bloqueia o Estruturador quando um crítico falha.
6. O Briefista não processa ângulo sem nível de consciência.
7. O Estruturador usa apenas finalistas curados e respeita o piso de verba.
8. A publicação da v1 é registrada como ação humana, sem comando Meta.
9. O Leitor nunca inventa valor e torna fórmula/fonte auditáveis.
10. O Diagnosticador retorna uma única alavanca com hipótese, sucesso e reversão.
11. O histórico semanal é append-only e exporta YAML válido.
12. RLS impede leitura e escrita entre workspaces.
13. Os dois testes simulados passam e três casos reais são registrados.

## Métricas de sucesso

### Produto

- Taxa de conclusão sem assistência por papel.
- Tempo até a primeira campanha pronta.
- Percentual de propostas aprovadas, editadas e rejeitadas.
- Erros de schema e reexecuções por skill.
- Percentual de runs retomados após falha.

### Aula 3

- Percentual com campanha publicada/agendada em até 7 dias.
- Percentual com rotina semanal datada.
- Percentual com uma alavanca decidida.
- Percentual que completa um ciclo semanal por quatro semanas.

A meta numérica final permanece bloqueada pelo reality-check, como determina o
PRD. O valor provisório não deve virar promessa de produto sem essa evidência.

## Riscos e respostas

| Risco | Resposta |
|---|---|
| Skill muda e quebra runs antigos | Hash e versão persistidos por execução |
| LLM devolve estrutura inválida | Schema estrito, retry reparador e proposta não aplicada |
| Extração inventa métricas | Revisão humana obrigatória e cálculos L0 |
| Usuário confunde recomendação com execução | Copy explícita, estados `proposta`/`confirmada pelo humano` |
| Fonte YAML e banco divergem | Banco é estado operacional; YAML é adapter versionado |
| BFF indisponível | Estado tratável, polling e modo manual sem IA |
| Acesso cross-workspace | RLS + `workspace_id` + testes negativos |
| Interface tenta preservar ordem antiga | Migração explícita e fluxo guiado por pré-requisitos |

## Próximo ponto de retomada

Abrir o go-live da Aula 3: fechar hardenings pós-piloto, iniciar o Studio pelo
launcher oficial, observar operadores não técnicos em projetos reais e medir
conclusão sem assistência, tempo até campanha pronta e retomada após falha. O
handoff para a Aula 4 começa somente depois desse aceite de campo.
