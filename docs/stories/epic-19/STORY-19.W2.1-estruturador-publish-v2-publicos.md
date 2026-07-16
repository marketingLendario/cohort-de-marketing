# STORY-19.W2.1 - estruturador-publish.mjs v2: schema `publico` + guardrails

## Status

Ready

## Dependências

- 19.W1.1 (reutiliza elegibilidade de `scripts/lib/publicos.mjs`)
- 19.W1.2 (SKILL.md já documenta o contrato que este código materializa)

## Objetivo

Materializar os kits morno/quente no executor de publicação: bloco `publico`
no `campanha.json`, targeting de retargeting real (hard audience), validação
ao vivo de cada público e guardrails que recusam — mantendo o kit frio v1
byte a byte retrocompatível.

## Critérios de aceite

- [x] `campanha.json` aceita bloco opcional `publico`:
      `{tipo: "frio"|"morno"|"quente", custom_audiences: [{id,name}], exclusoes: [{id,name}]}`.
      Ausente = frio = comportamento v1 idêntico (retrocompatibilidade provada
      por fixture).
- [x] Targeting por temperatura: morno/quente → `custom_audiences` (1–3),
      `excluded_custom_audiences`, `targeting_automation: {advantage_audience: 0}`
      (hard audience — com Advantage+ ligado a Meta trata o público como
      sugestão e expande, furando o retargeting). Frio → inalterado.
- [x] Guardrails novos (recusa com mensagem pedagógica, padrão v1):
      1. `tipo != frio` sem `custom_audiences` → recusa; `custom_audiences`
         com `tipo == frio` (ou ausente) → recusa.
      2. Validação ao vivo de cada público no `--dry-run` e `--criar`
         (`GET <audience_id>` — existe na conta, op/delivery == 200,
         lower_bound >= 1000; lista velha > 90d = warning, não bloqueio).
      3. `tipo == quente` sem exclusão → recusa ("pagar de novo por quem já
         comprou é o desperdício nº1 do remarketing").
      4. Máximo 3 públicos incluídos e 3 excluídos.
      5. Piso R$20/dia mantido; teto morno/quente = R$100/dia (frio mantém R$200).
      6. `interesse_guarda_chuva` com `tipo != frio` → recusa (interesse em
         cima de retargeting só encolhe público pequeno).
- [x] Nome da campanha ganha sufixo de temperatura
      (`[COHORT1]_[slug]_[quente]_[data]`) para o Leitor separar réguas.
- [x] `--listar-publicos` (read-only): imprime só os elegíveis, ordenados por
      tamanho, máximo 20 linhas, com id/nome/temperatura/tamanho aproximado.
- [x] Bloco impresso para o Painel ganha `publico_tipo`, `custom_audiences` e
      `exclusoes` (ids + nomes).
- [x] Fixtures de recusa cobrem os 7 casos do gate de conclusão do epic;
      fixture de aceitação cobre morno e quente válidos (mock/dry local, sem
      chamada de escrita real).
- [x] Nenhum teste cria objeto real na conta — E2E PAUSED real é gate
      supervisionado do epic, fora desta story.
- [x] `ERROR_HINTS`: hint específico para conta em categoria especial de anúncio.

## Tasks

- [x] Confirmar baseline do `estruturador-publish.mjs` (nenhum conflito com W1).
- [x] Estender `validarPlano` com o bloco `publico` e os guardrails 1/3/4/5/6.
- [x] Implementar validação ao vivo dos públicos (guardrail 2) reutilizando
      `scripts/lib/publicos.mjs`.
- [x] Gerar targeting por temperatura na criação do conjunto.
- [x] Implementar `--listar-publicos`.
- [x] Fixtures + teste node dos guardrails (validação local, sem rede).
- [x] Atualizar cabeçalho de documentação do script (formato do plano).
- [x] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `scripts/estruturador-publish.mjs`
- `scripts/lib/publicos.mjs` (reuso; extensão só se necessário)
- `scripts/fixtures/campanha-*.json`
- `scripts/estruturador-publish.test.mjs`
- `docs/stories/epic-19/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story.

## Validação

- Teste node: 7 fixtures de recusa recusadas + 2 de aceitação aceitas
  (validação local; rede mockada ou pulada).
- Fixture v1 sem bloco `publico`: targeting gerado idêntico ao v1
  (comparação de objeto).
- `--listar-publicos` smoke read-only opcional contra a conta real.

## Stop conditions

- Qualquer caminho que crie objeto real na conta durante teste → parar.
- Necessidade de afrouxar guardrail v1 para acomodar o v2 → parar e registrar.
- `advantage_audience: 0` rejeitado pela API em dry-run → registrar evidência
  e parar (fallback documentado no plano precisa de decisão humana).

## File List real

Alterados:

- `scripts/estruturador-publish.mjs` — v2 do executor:
  - Cabeçalho: bloco `publico` no formato do plano + regra de temperatura + modo `--listar-publicos`.
  - Imports novos da lib `scripts/lib/publicos.mjs` (`fetchPublicos`, `classificarPublico`,
    `avaliarElegibilidade`, `PUBLICOS_FIELDS`) e `GRAPH_VERSION` de `meta-graph.mjs` — reuso, sem
    duplicar regra de elegibilidade.
  - Constantes: `TETO_DIARIO_MORNO_QUENTE_REAIS` (100), `TEMPERATURAS_VALIDAS`, `MIN_PUBLICOS`/`MAX_PUBLICOS`,
    `HINT_CATEGORIA_ESPECIAL` (hint local de conta em categoria especial de anúncio).
  - `validarPlano` (agora exportada): normaliza o bloco `publico` (ausente = frio), guardrails 1/3/4/5/6,
    teto de verba por temperatura (frio R$200 inalterado; morno/quente R$100), nome carregando a temperatura.
  - `montarTargeting` (nova, exportada): targeting por temperatura; frio byte a byte igual ao v1.
  - `validarPublicosAoVivo` (nova, exportada): validação ao vivo via `fetcher` injetável; recusa por
    inexistente/op/delivery/tamanho, warning para lista/público > 90d.
  - `criar`: resumo do público, chamada da validação ao vivo ANTES de qualquer escrita, `montarTargeting`
    no conjunto, hint de categoria especial no erro do conjunto (morno/quente), bloco do Painel com
    `publico_tipo`/`custom_audiences`/`exclusoes`.
  - `listarPublicos` (nova) + wiring de `--listar-publicos` no `parseArgs`/`main`.
  - Guarda `executadoDireto`: `main()` só roda como CLI (import dos testes não dispara o CLI).

Criados:

- `scripts/estruturador-publish.test.mjs` — 16 testes `node:test`, sem rede (fetcher de públicos mockado).
- `scripts/fixtures/campanha-v1-frio.json` — v1 sem bloco `publico` (retrocompat).
- `scripts/fixtures/campanha-morno-valido.json`, `campanha-quente-valido.json` — aceitação.
- `scripts/fixtures/campanha-recusa-quente-sem-exclusao.json`, `campanha-recusa-frio-com-custom.json`,
  `campanha-recusa-interesse-retargeting.json`, `campanha-recusa-verba-acima-teto.json` — recusas locais.
- `scripts/fixtures/campanha-recusa-publico-inexistente.json`, `campanha-recusa-op-nao-200.json`,
  `campanha-recusa-bound-oculto.json` — recusas na validação ao vivo (fetcher mockado).

Não tocados de propósito (fora da allow-list): `scripts/lib/publicos.mjs` (reuso puro, sem extensão),
`scripts/lib/meta-graph.mjs` (o hint de categoria especial ficou local em `estruturador-publish.mjs`
para não mexer na lib compartilhada), `.claude/`+`.agents/` SKILL.md do estruturador (o contrato já
estava documentado pela 19.W1.2; o código foi escrito para bater com ele).

## Dev Agent Record

**Data:** 2026-07-15 · **Agente:** @dev (Dex) · **Branch:** main (sem commit/push, por instrução).

**Testes (fixture, obrigatório):** `node --test scripts/estruturador-publish.test.mjs` → **16/16 PASS**,
0 falhas. Rodando junto com a lib da W1 (`scripts/lib/publicos.test.mjs`): **34/34 PASS**. `node --check`
OK no script e no teste. Cobertura:
- 7 recusas do gate do epic: quente sem exclusão, frio com custom_audiences, interesse+retargeting,
  verba acima do teto R$100 (locais); público inexistente, `operation_status` 441, bound 20 oculto
  (ao vivo, via fetcher mockado).
- 2 aceitações: morno válido (targeting `advantage_audience:0`, `custom_audiences`, sem
  `excluded_custom_audiences`, sem `flexible_spec`) e quente válido (com `excluded_custom_audiences`).
- Retrocompatibilidade: v1 sem bloco `publico` gera `montarTargeting` **profundamente igual** ao objeto
  do v1 (`advantage_audience:1`, sem custom), e o ramo frio + interesse guarda-chuva mantém o
  `flexible_spec` do v1.
- Extras: público > 90d é warning (não recusa), frio não toca a rede na validação ao vivo, teto de 3
  incluídos, nome sem temperatura recusado, e os guardrails v1 (piso R$20 / teto R$200 do frio) intactos.

**Smoke read-only live (`node scripts/estruturador-publish.mjs --listar-publicos`):** rodou com o `.env`
real, só GET, nenhuma escrita. **331 públicos na conta · 11 elegíveis morno/quente (3 morno + 8 quente) ·
320 inelegíveis/fora de escopo.** Bate com o registro da 19.W1.1 (elegíveis morno 3, quente 8). Amostra do
topo: "Vídeo View 3s - Distribuição" (~215.600–253.700, morno), "Lista_leads_2.csv" (~52.700–62.000, quente),
"Lista_leads_1.csv" (~17.100–20.100, quente).

**Escrita real:** NENHUMA em nenhum momento. Não rodei `--criar` nem `--dry-run` live (o preflight do dry-run
cria/apaga um ad label = escrita). A validação ao vivo de públicos foi exercida só via fetcher mockado.

**Desvios/observações honestas:**
- **ERROR_HINTS de categoria especial ficou local** (`HINT_CATEGORIA_ESPECIAL` em `estruturador-publish.mjs`),
  não no mapa `ERROR_HINTS` de `meta-graph.mjs`. Motivo: `meta-graph.mjs` está fora da File List desta story
  e é lib compartilhada por vários scripts; o ponto onde o erro estoura (criação do conjunto com
  `custom_audiences`) é do Estruturador, então o hint mora junto dele. O AC ("hint específico para conta em
  categoria especial") é atendido — só não como entrada no mapa global.
- **Bloco do Painel (publico_tipo/custom_audiences/exclusoes) e o hint de categoria especial** vivem dentro
  de `criar()`, que é ligada à rede; foram validados por revisão de código, não por teste automatizado
  (testar exigiria mockar toda a cadeia de POST da campanha, fora do escopo desta story). O núcleo testável
  (validação + targeting) está coberto.
- **Guardrail 2 (validação ao vivo)** foi estruturado em `validarPublicosAoVivo(publico, fetcher, hoje)` com
  fetcher injetável, exatamente para os testes rodarem sem rede — conforme pedido.
- **`epic-19-state.json` não foi tocado** (responsabilidade do orquestrador, por instrução).
- A distinção "lista velha (envelhecimento) vs público velho (frescor)" > 90d ambos viram **warning** na
  validação ao vivo (não bloqueio), como manda o AC; a recusa fica só para inexistente/op/delivery/tamanho.
