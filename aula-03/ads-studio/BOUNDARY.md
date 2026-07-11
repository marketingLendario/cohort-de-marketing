# academia-lendaria-ads-studio — App Boundary

> Layer: L3 Product | Boundary: **ONLINE** | Owner: business owner academia-lendaria + @architect
> Story: STORY-AL-ADS-0c.1 (scaffold) | Epic: AL-ADS-STUDIO

## Classificação: ONLINE (Boundary Axiom — Constitution Art. VII)

Esta app é **ONLINE**: software de produto implantável (deploy alvo Vercel),
servindo o operador de mídia da Academia Lendária. Como toda superfície ONLINE,
ela **ORQUESTRA** capacidades LOCAL — **nunca embute** a lógica delas (NFR2).

| Regra | Aplicação |
|-------|-----------|
| ONLINE orquestra, LOCAL executa | A app chama skills/adapters; a lógica de negócio vive na superfície LOCAL |
| Host público nunca executa skills | O runtime Vercel não roda agentes/skills nem guarda secrets |
| Sem lógica de skill embutida | `src/` e `server/` orquestram; não duplicam regras das skills |

## Skills LOCAL que esta app ORQUESTRA (não embute)

As skills abaixo são artefatos **LOCAL** (`.claude/skills/`). A app
as invoca/coordena através do BFF (`server/`, a partir da STORY-AL-ADS-1.3) e
**não reimplementa** sua lógica:

| Capacidade LOCAL | Papel orquestrado pela app |
|------------------|----------------------------|
| `*unit-economics` | Cálculo de unit economics (alimenta dashboards/gates) |
| `*funnel-selection` | Seleção de funil para a campanha |
| `*campaign-structure` | Estruturação de campanha (ABC etc.) |
| `creative-brief` | Geração de brief criativo |
| `/ads-creative-factory` | Produção de criativos de anúncio |
| `*monitor-campaigns` | Monitoramento de campanhas em operação |
| `zelador` | Confirma saúde da conta e tracking com evidência humana |
| `briefista` | Gera bateria de anúncios para curadoria humana |
| `estruturador` | Prepara o default sagrado sem publicar |
| `leitor-de-metricas` | Rotula somente métricas literais confirmadas |
| `diagnosticador` | Propõe uma alavanca falseável para decisão humana |

No modo Cohort, as cinco skills acima são `recommend-only`. O runner local não
recebe tools de mutação Meta e o BFF público mantém essa capacidade desabilitada.

## Adapter ONLINE consumido

| Adapter | Papel |
|---------|-------|
| `services/meta-ads` | Adapter Meta Ads CLI (Marketing API + Pages + Catalog + Pixels). A app faz **handoff** para ele (a partir da STORY-AL-ADS-1.6); não fala direto com a Meta API |

## Migração para o Cohort de Marketing

Esta app (`academia-lendaria-ads-studio`) foi trazida do `sinkra-hub` para este
repo para que o desenvolvimento do painel Ads Factory continue junto do material
do cohort. O mock visual canônico importado está em
`docs/design/mocks/academia-lendaria-ads-studio/`.

## Design System

Esta app usa a **DS Lendária local** em `src/lib/lendaria-ds`, portada junto com
o painel para remover a dependência do monorepo `sinkra-hub`. A regra visual
continua a mesma: noite default, ouro só em acentos, hairlines, radius quase reto
e estética editorial flat.

## Contratos-chave

1. CLI-First: o contrato de status (`src/lib/canary.ts`) é o mesmo em `/healthz`
   (JSON) e na Home (visual).
2. Sem secrets no host público (Vercel) — credenciais ficam em `.env` local /
   GitHub Environment, nunca no repo nem no bundle.
3. Imports absolutos `@/`, arquivos kebab-case, TS strict sem `any` (NFR14).

## Referências

- `docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`
