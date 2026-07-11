# Epic 9 — Source Map do pacote piloto da Academia Lendária

## Escopo

O pacote piloto da Story 9.W2.2 foi montado apenas com:

- artefatos reais em `/Users/rafaelcosta/Projects/AIOX/sinkra-hub/.claude/worktrees/cohort-marketing-aula-3-cbff0b/outputs/businesses/academia-lendaria/projetos/maquina-de-receita-com-ia/artefatos/`
- o SOT reconciliado em `workspace/businesses/academia-lendaria/L3-product/cohort_marketing_receita/{curriculum.yaml,offerbook.yaml}`

Nenhum arquivo foi alterado no `sinkra-hub`. O runtime do aluno não depende desses paths: o pacote importável é `data/pilots/academia-lendaria-project-brief.json`.

## Fontes congeladas

| ID | Papel | SHA-256 |
|---|---|---|
| `src-index` | aponta o SOT reconciliado e posiciona a Aula 3 no conjunto de artefatos | `1aaa634141311780796831726244e565a86f545785ce31284a1f6a2c4d1617b2` |
| `src-curriculum` | autoridade para estrutura do cohort, datas, A3, handoffs e foco Meta | `bb91dad2d79c1c9b6bde0b0431c60014967e0febddfbe93c6335e4635d5ae145` |
| `src-offerbook` | autoridade para promessa, ICP/avatar, mecanismo, narrativa e pricing/garantia | `2dc506e06ec59d15eae2625576ea3bd8747dc9f4b681ed902a4af0a342083f71` |
| `src-a3-prd` | autoridade para o contrato operacional da Aula 3 e o default sagrado | `1314ad40a8355b836483fdf3db35cacb2b6c344a754cf40a20035c6a19bf81ce` |
| `src-squad-readme` | autoridade para os 5 papéis do squad e a ordem de uso | `3c38f969fd94e71f3d9081f6801e6b738ba683f511991b725a1b850403a2966c` |
| `src-copy-a3` | copy real da Aula 3 usada como fundação do Briefista | `b9eb1031bfe999091806ee6eb9f6b7a2be987f17f6b9c58eb2100ee505b07214` |

## Mapa de fatos para o ProjectBrief

| Campo | Origem |
|---|---|
| `project.slug` | segmento de path `/projetos/maquina-de-receita-com-ia/` |
| `project.name` | `offerbook.yaml → metadata.programa_mae` |
| `project.ownerName` | segmento de path `/businesses/academia-lendaria/` |
| `project.currentStage` | `curriculum.yaml → modulos[A3].titulo` |
| `market.niche` | `offerbook.yaml → posicionamento.oferta.categoria` |
| `market.productCategory` | `curriculum.yaml → formato.modelo` |
| `market.targetAudience` | `offerbook.yaml → avatar.perfil` |
| `market.avatarSummary` | `offerbook.yaml → avatar.descricao` |
| `market.dominantPain` | `offerbook.yaml → avatar.dor_visceral.estado_atual` |
| `market.objections` | `offerbook.yaml → solucao.objecoes[].objecao` |
| `market.desiredTransformation` | `offerbook.yaml → posicionamento.oferta.dream_outcome` |
| `offer.name` | `offerbook.yaml → metadata.product_name` |
| `offer.productName` | `offerbook.yaml → metadata.programa_mae` |
| `offer.promise` | `offerbook.yaml → posicionamento.oferta.promise` |
| `offer.uniqueMechanism` | `offerbook.yaml → solucao.mecanismo_unico` |
| `offer.deliverables` | `offerbook.yaml → solucao.entregaveis_heroi[].output_acionavel` |
| `channels.primaryCtaText` | `offerbook.yaml → narrativa.ato_4_cta.cta` |
| `channels.adChannels` | `curriculum.yaml → modulos[A3].foco_plataforma` |
| `channels.creativeScope` | `offerbook.yaml → solucao.entregaveis_heroi[A2].output_acionavel` |

## Lacunas registradas como `unknown`

- `project.clientName`
- `channels.primaryCtaUrl`
- `integrations.*`

## Lacunas mantidas fora do briefing e registradas no manifesto

- `project.startingPoint`
- `project.offerType`
- `project.operator`
- `project.regulatedNiche`
- `project.voice`
- `project.ticketRange`
- `market.awarenessLevel`
- `market.marketSophistication`
- `market.trafficTemperature`
- `market.trafficSource`
- `market.competitors`
- `offer.exactPrice`
- `offer.anchorPrice`
- `offer.guarantee`
- seção `brand`
- seção `funnel`
- `data.analyticsVariant`

## Divergências explícitas

1. `curriculum.yaml` já aponta `PRD-A3-trafego-v1.md` como PRD da A3.
2. `offerbook.yaml` ainda marca o PRD da A3 como `*A definir*`.

Decisão do pacote: congelar ambos, registrar a divergência no manifesto e nunca sintetizar uma “verdade única” inventada.

## Prova da jornada W1

- O pacote importável está em `data/pilots/academia-lendaria-project-brief.json` com `schemaVersion: 0.1.0`.
- O manifesto prova que os artefatos do intake são `curriculum`, `offerbook`, `a3-prd`, `squad-trafego-readme` e a fundação `copy` real da Aula 3.
- O repositório ganhou um teste de jornada em `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts` que importa o briefing pela rota `createProjectWorkspaceController.importProjectBrief`.
- O teste passou com 17 casos usando somente a URL e a anon key públicas do
  `.env.example`; a jornada importou o pacote sem seed oculto e o typecheck do
  app permaneceu verde.

## Validações executadas

- `node scripts/validate-pilot-manifest.mjs` — PASS
- `node --test scripts/validate-pilot-manifest.test.mjs` — PASS
- `npm test -- use-project-workspace.test.ts` — PASS (17 testes)
- `npm run typecheck` — PASS

## Finding corrigido durante a execução

- P2: o validador rejeitava lacunas de seção (`integrations`) quando o briefing marcava subcampos (`integrations.apifyStatus`, etc.). O matcher foi corrigido para aceitar gaps por prefixo sem relaxar a detecção de campo inventado.
- P2: a primeira prova Vitest tentou ler o fixture por `import.meta.url`, que o
  ambiente jsdom converte em URL HTTP. O teste agora sobe pelos ancestrais do
  diretório de execução até encontrar `data/pilots/`, ficando estável tanto no
  app quanto na raiz do worktree.
