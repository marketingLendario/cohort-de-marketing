# STORY-19.W3.1 - Réguas por temperatura: leitor + circuit-breaker + diagnosticador

## Status

Done

## Dependências

- 19.W2.1 (bloco `estruturador.publico_tipo` no Painel é o seletor de régua)

## Objetivo

Fazer o resto do squad ler a campanha com a régua certa por temperatura:
frequência alta é esperada em retargeting, CPM alto é normal em quente, e
público saturado é um gatilho novo de circuit-breaker.

## Critérios de aceite

- [x] `leitor-metricas.mjs` aceita `--publico-tipo=frio|morno|quente`
      (default frio — retrocompatível) e ajusta a leitura: alerta de
      frequência passa de > 3,0/semana (frio) para > 6,0/semana (morno/quente);
      CPM alto em quente é selado como "esperado para retargeting" em vez de
      sinal vermelho.
- [x] `circuit-breaker.mjs` ganha gatilho de saturação para quente/morno:
      `frequência >= 8 em 7d` OU entrega estagnada (impressões diárias caindo
      > 50% com verba constante) → exit 3 com motivo `saturacao_publico`,
      mesmo sem estourar o CPA. Gatilho v1 (CPA/CTR) permanece intacto.
- [x] SKILL.md do diagnosticador ganha a alavanca "público saturado → pausar
      quente e renovar exclusões/criativos" no cardápio (execução continua
      gated como hoje).
- [x] SKILL.md do leitor-de-metricas documenta a régua por temperatura e manda
      ler `estruturador.publico_tipo` do Painel.
- [x] Sem `publico_tipo` no Painel, tudo se comporta como v1 (frio).
- [x] Espelhos `.agents/` byte a byte idênticos para toda SKILL.md alterada.

## Tasks

- [x] Confirmar baseline de `leitor-metricas.mjs` e `circuit-breaker.mjs`.
- [x] Implementar seleção de régua no leitor (+ flag CLI).
- [x] Implementar gatilho de saturação no circuit-breaker (com teste de
      fixture para os dois ramos: frequência e estagnação).
- [x] Atualizar SKILL.md do leitor e do diagnosticador (+ espelhos).
- [x] Atualizar checkboxes e File List real. (state JSON `epic-19-state.json`
      deixado intacto por instrução do orquestrador — ver Dev Agent Record.)

## File List proposta

- `scripts/leitor-metricas.mjs`
- `scripts/circuit-breaker.mjs`
- `scripts/fixtures/insights-*.json` (se necessário para teste)
- `.claude/skills/leitor-de-metricas/SKILL.md`
- `.agents/skills/leitor-de-metricas/SKILL.md`
- `.claude/skills/diagnosticador/SKILL.md`
- `.agents/skills/diagnosticador/SKILL.md`
- `docs/stories/epic-19/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story.

## Validação

- Teste/fixture: mesma série de insights lida com régua fria vs quente produz
  alertas diferentes (frequência 4,5 → alerta no frio, ok no quente).
- Circuit-breaker: fixture de saturação aciona exit 3 com motivo novo;
  fixture v1 continua com o comportamento atual.
- `diff` dos espelhos vazio.

## Stop conditions

- Contrato "não-inferir" do leitor violado (régua não pode inventar número,
  só mudar limiar de alerta) → parar.
- Mudança no gatilho v1 do circuit-breaker → parar (só ADICIONAR gatilho).

## File List real

Alterados:

- `scripts/leitor-metricas.mjs` — flag `--publico-tipo`; funções puras
  exportáveis `reguaPorTipo` e `avaliarGatilhosFadiga`; observação de CPM e
  limiar de frequência por régua; guarda `executadoDireto`.
- `scripts/circuit-breaker.mjs` — flag `--publico-tipo`; funções puras
  exportáveis `avaliarGatilhoV1` (v1 extraído sem mudança) e `avaliarSaturacao`
  (ramo de frequência + estagnação diária honesta); guarda `executadoDireto`.
- `.claude/skills/leitor-de-metricas/SKILL.md` + espelho
  `.agents/skills/leitor-de-metricas/SKILL.md` — seção "Régua por temperatura".
- `.claude/skills/diagnosticador/SKILL.md` + espelho
  `.agents/skills/diagnosticador/SKILL.md` — Passo 0 com `--publico-tipo`,
  linha nova no cardápio de alavancas, seção circuit-breaker com o gatilho de
  saturação e a alavanca "público saturado".
- `docs/stories/epic-19/STORY-19.W3.1-reguas-temperatura-leitor-diagnosticador.md`
  — esta story.

Criados (extensão da File List proposta, autorizada pela allow-list — testes
solicitados na tarefa):

- `scripts/leitor-metricas.test.mjs` — régua por temperatura + decisão de fadiga.
- `scripts/circuit-breaker.test.mjs` — v1 intacto + saturação (frequência,
  estagnação, degradação honesta).

Não usados: `scripts/fixtures/insights-*.json` (as funções puras recebem objetos
inline nos testes — nenhum arquivo de fixture novo foi necessário).

Não tocado: `docs/stories/epic-19/epic-19-state.json` (instrução do orquestrador).

## Dev Agent Record

**Data:** 2026-07-16 · **Agente:** @dev (Dex) · **Branch:** main (sem commit/push).

**Testes (`node --test`):** 19/19 passam nos arquivos novos
(`leitor-metricas.test.mjs` + `circuit-breaker.test.mjs`); 35/35 no conjunto
com `estruturador-publish.test.mjs` (zero regressão). `node --check` OK nos 4
arquivos `.mjs` tocados. Casos-chave cobertos:
- frequência 4,5 → alerta no frio (`> 3`), OK no morno/quente (`> 6`);
- saturação quente com frequência ≥ 8 → `acionado` + motivo `saturacao_publico`;
- saturação por estagnação (impressões caindo > 50% com verba constante) →
  acionado; verba que variou ou série curta (< 4 dias) → estagnação marcada
  como não-avaliável, cai só na frequência (honestidade);
- v1 travado: 4 casos de gatilho v1 (conversão, CTR, gasto) inalterados.

**Smoke live (read-only, conta real):**
- Leitor `--publico-tipo=quente` na campanha `6999279136225` (`[QUENTE]`,
  ACTIVE): régua exibida ("alerta de frequência > 6/semana · CPM alto esperado
  para retargeting"), CPM R$25,74 com o selo, `publico_tipo: "quente"` no YAML.
  Números reais: gasto R$833,46; CTR 4,65%; frequência 1,61; 259 leads; 2 compras.
- Leitor **sem flag** na mesma campanha: 0 ocorrências de "Régua:",
  "publico_tipo" ou "esperado para retargeting" — retrocompat frio confirmada
  ao vivo.
- Circuit-breaker `--publico-tipo=quente`: bloco v1 idêntico + seção de
  saturação; frequência < 8 e a série diária de `last_7d` veio com 1 dia
  (< 4) → estagnação corretamente marcada "não avaliada... só o ramo de
  frequência vale". NÃO ACIONADO (exit 0). Sem flag: bloco v1 puro, exit 0.

**Contrato não-inferir:** preservado — a régua só muda limiar de alerta
(frequência 3→6) e adiciona rótulo textual ao CPM; nenhuma métrica é derivada.
O gatilho de saturação compara médias da própria série real da API, sem inventar
campo ausente (quando a série não permite, declara e não afirma).

**Gatilho v1:** apenas extraído para `avaliarGatilhoV1` sem alteração de lógica;
avaliado sempre, inclusive no frio. Nenhuma escrita na conta.

**Desvios honestos:**
- Ramo de estagnação implementado de verdade (série `time_increment=1` de 7d),
  não só documentado — mas com degradação honesta: exige ≥ 4 dias e verba
  aproximadamente constante (variação ≤ 20%); fora disso, marca não-avaliável e
  usa só a frequência. Validado ao vivo (a campanha real caiu nesse ramo).
- Status da story movido para `InReview` (dev completo, aguardando QA).
- `epic-19-state.json` não alterado, conforme instrução.

## Change Log

- 2026-07-16 — @dev — Implementadas as réguas por temperatura no leitor e o
  gatilho de saturação no circuit-breaker; alavanca nova no diagnosticador;
  seção de régua no leitor; espelhos `.agents/` sincronizados; testes novos.
  Status Ready → InReview.
