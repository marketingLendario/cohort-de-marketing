# Plano — Amostras das 6 skills de tráfego no mapa de skills

> Objetivo: completar `window.ARTIFACT_SAMPLES` (25/31 → 31/31) com amostras
> ilustrativas das skills de tráfego, coerentes com o projeto fictício
> `academia-fit` e com os formatos REAIS de saída dos scripts do squad.
> Execução: subagentes Sonnet (conteúdo + integração); orquestração e revisão
> pelo agente principal, sem tocar em código.

## Estado atual

- `mapa-skills.html` (raiz + `aula-03/materiais/`, idênticos): 31 skills.
- `mapa-skills-artifacts.js` (raiz + `aula-03/materiais/`): 25 entradas.
- **Faltantes:** zelador, briefista, estruturador, leitor-de-metricas,
  diagnosticador, ads-creative-factory.
- Helpers disponíveis: `md/html` (arquivo em `mapa-skills-samples/` — evitar,
  não temos os arquivos), `mdInline/htmlInline` (conteúdo embutido — **usar**),
  `pdf` (exige arquivo — evitar).
- Fallback atual: `buildGenericArtifact` (placeholder genérico — é o que o
  aluno vê hoje ao clicar nas skills de tráfego).

## Conteúdo por skill (2-3 artefatos cada, `mdInline`)

| Skill | Artefatos | Fonte do formato real |
|---|---|---|
| zelador | Painel YAML do Modo API (status PARCIAL, selos de fonte) + relatório ✔/✖/△ | `scripts/zelador-audit.mjs` |
| briefista | Bateria YAML (3 ângulos × hooks, nivel_consciencia) + finalistas curados | SKILL.md do briefista |
| estruturador | `campanha.json` (plano com guardrails) + bloco `estruturador:` do painel (criada_pausada, IDs) | `scripts/estruturador-publish.mjs` |
| leitor-de-metricas | Leitura YAML com selos Real/Estimado + relatório humano | `scripts/leitor-metricas.mjs` |
| diagnosticador | Diagnóstico 4 partes YAML + saída do circuit-breaker (não acionado) | SKILL.md + `scripts/circuit-breaker.mjs` |
| ads-creative-factory | `legendas.md` + trecho de `manifest.json` do lote | SKILL.md da ACF + `scripts/acf-upload.mjs` |

Regras de conteúdo: PT-BR; números coerentes entre si e com o projeto
academia-fit (mesma oferta/preço/público das amostras existentes); nada de
credenciais; IDs fictícios óbvios; caminhos `path` sob `projetos/academia-fit/trafego/`.

## Execução (subagentes Sonnet)

1. **3 agentes de conteúdo em paralelo** (sem conflito de arquivo — cada um
   escreve rascunho próprio em `/tmp/mapa-amostras/<skill>.snippet.js`):
   A: zelador + estruturador · B: leitor + diagnosticador · C: briefista + ACF.
   Cada rascunho é um bloco `"<skill-id>": [ ... ],` válido, usando os helpers.
2. **1 agente integrador**: insere os 6 blocos em `window.ARTIFACT_SAMPLES`
   nas DUAS cópias (raiz e `aula-03/materiais/`, mantidas idênticas), valida
   sintaxe (`node --check`) e roda `validate-mapa-skills` + `validate-mapa-wiring`.
3. **Revisão (principal)**: diff das duas cópias, spot-check de qualidade e
   coerência, validadores, e **validação visual** com Playwright
   (`scripts/validate-mapa-preview.mjs` + screenshot de um nó de tráfego).

## Playwright (pré-requisito da validação visual)

`scripts/package.json` já declara `playwright ^1.52.0`:
`npm install --prefix scripts` + `npx playwright install chromium`.

## Status: ✅ CONCLUÍDO (2026-07-15)

Executado por 3 agentes Sonnet de conteúdo + 1 integrador, com 3 rodadas de
revisão do orquestrador: (1) correção de aritmética no cânon do circuit-breaker
(CPA-alvo R$60 → R$55, flag do próprio agente B); (2) correção de renderização
markdown em 5 artefatos (YAML/JSON/terminal sem cerca de código viravam
parágrafo corrido — detectado por screenshot via Playwright); (3) fidelidade de
versão (v23.0 → v24.0 nas amostras do zelador). Resultado: 31/31 skills com
amostras, cópias idênticas, validadores skills/wiring/preview OK, screenshots
de zelador, estruturador, diagnosticador e ACF conferidos visualmente.

## Critérios de aceite

- 31/31 skills com entrada em `ARTIFACT_SAMPLES`, cópias idênticas.
- `node --check` passa nos dois arquivos; validadores wiring/skills OK.
- `validate-mapa-preview.mjs` OK (sem pageerrors) + preview de skill de
  tráfego renderizando conteúdo real (screenshot conferido).
- Conteúdo fiel aos formatos reais dos scripts (selos, guardrails, 4 partes).
