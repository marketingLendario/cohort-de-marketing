# STORY-19.W1.1 - Zelador: auditoria read-only de públicos (`--publicos`)

## Status

Ready

## Dependências

- Nenhuma (leitura pura; lib `scripts/lib/meta-graph.mjs` já existe)

## Objetivo

Inventariar e classificar os públicos personalizados da conta via
`GET /act_X/customaudiences`, com regra de elegibilidade compartilhável
(o Estruturador v2 reutiliza na 19.W2.1), e escrever o bloco
`zelador.publicos` no Painel com selo `fonte: api`.

## Critérios de aceite

- [x] `scripts/lib/publicos.mjs` exporta: busca paginada dos públicos
      (`fetchPublicos`), classificação por temperatura (`classificarPublico`)
      e elegibilidade (`avaliarElegibilidade`) — lógica testável sem rede.
- [x] Classificação: ENGAGEMENT e WEBSITE-topo (PageView/visitantes) → morno;
      WEBSITE-fundo (IC/checkout, exclui Purchase) e CUSTOM (listas) → quente;
      LOOKALIKE → fora do escopo v2 (reportado como `nao_aplicavel`).
- [x] Elegibilidade exige TUDO: `operation_status.code == 200` E
      `delivery_status.code == 200` E `approximate_count_lower_bound >= 1000`
      E frescor (`time_updated` <= 90 dias). Lower bound 20 é reportado como
      "contagem oculta pela Meta (público pequeno)" — inelegível.
- [x] Listas CSV (subtype CUSTOM) desatualizadas geram warning de
      envelhecimento, com a data da última atualização.
- [x] `zelador-audit.mjs --publicos` imprime o inventário (elegíveis por
      temperatura, inelegíveis com motivo) e o bloco YAML `zelador.publicos`
      pronto para o Painel; `--json` cobre o novo bloco. Flag é opt-in — a
      auditoria padrão não muda.
- [x] Nenhuma chamada de escrita (só GET) — compatível com o boundary
      read-only do Zelador.
- [x] Contagens sempre seladas como aproximadas (bounds da Meta), nunca exatas.
- [x] SKILL.md do zelador ganha seção curta sobre `--publicos`;
      espelho `.agents/` byte a byte idêntico.

## Tasks

- [x] Confirmar baseline (nenhuma outra mudança pendente em `zelador-audit.mjs`).
- [x] Implementar `scripts/lib/publicos.mjs` com classificação/elegibilidade puras.
- [x] Integrar flag `--publicos` no `zelador-audit.mjs` (paginado via `graphGetAll`).
- [x] Fixtures com casos reais anonimizados: ENGAGEMENT grande saudável,
      op 441, bound 20, lista CSV velha, LOOKALIKE.
- [x] Teste node dos casos de classificação/elegibilidade.
- [x] Atualizar SKILL.md (`.claude/` + `.agents/`).
- [x] Atualizar checkboxes e File List real. State JSON (`epic-19-state.json`)
      deixado para o orquestrador (fora do escopo do @dev, por instrução).

## File List proposta

- `scripts/lib/publicos.mjs`
- `scripts/lib/publicos.test.mjs`
- `scripts/fixtures/publicos-*.json`
- `scripts/zelador-audit.mjs`
- `.claude/skills/zelador/SKILL.md`
- `.agents/skills/zelador/SKILL.md`
- `docs/stories/epic-19/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story.

## Validação

- `node --test scripts/lib/publicos.test.mjs` — casos de classificação e elegibilidade.
- Smoke read-only opcional contra a conta real (`--publicos`), sem nenhum POST.
- `diff` entre espelhos `.claude/` e `.agents/` vazio.
- Auditoria padrão (sem `--publicos`) inalterada em relação ao baseline.

## Stop conditions

- Qualquer necessidade de chamada de escrita → parar (viola o boundary do Zelador).
- Endpoint retornar shape inesperado que invalide a regra de elegibilidade →
  registrar evidência e parar para revisão do plano.

## File List real

Criados:

- `scripts/lib/publicos.mjs` — lib pura: `classificarPublico`, `avaliarElegibilidade`,
  `dataAtualizacao`, `fetchPublicos` (read-only via `graphGetAll`) + constantes
  `PISO_TAMANHO`, `DIAS_FRESCOR`, `BOUND_OCULTO`, `PUBLICOS_FIELDS`.
- `scripts/lib/publicos.test.mjs` — 18 testes `node:test`, sem rede.
- `scripts/fixtures/publicos-amostra.json` — 7 casos anonimizados espelhando os reais
  do plano (ENGAGEMENT ~215k saudável, ENGAGEMENT op 441, WEBSITE bound 20,
  CUSTOM lista velha >90d, CUSTOM lista recente ~1000, LOOKALIKE, WEBSITE topo PageView).

Alterados:

- `scripts/zelador-audit.mjs` — flag opt-in `--publicos` (import da lib, `parseArgs`,
  `auditarPublicos`, `publicosParaYaml`, `publicosHuman`, integração no `main`/`printHuman`,
  docstring e `--help`). Todo o código novo fica atrás da flag — auditoria padrão inalterada.
- `.claude/skills/zelador/SKILL.md` e `.agents/skills/zelador/SKILL.md` — seção nova
  "Auditoria de públicos (opt-in: `--publicos`)", idêntica byte a byte nos dois espelhos.

## Dev Agent Record

**Data:** 2026-07-16 · **Agente:** @dev (Dex) · **Branch:** main (sem commit/push, por instrução).

**Testes (fixture, obrigatório):** `node --test scripts/lib/publicos.test.mjs` →
**18/18 PASS**, 0 falhas. Cobre classificação (ENGAGEMENT/WEBSITE-topo→morno,
WEBSITE-fundo/CUSTOM→quente, LOOKALIKE/desconhecido→nao_aplicavel), elegibilidade
(op≠200, delivery≠200, bound 20 = "contagem oculta", piso genérico <1000, envelhecimento
de lista CSV >90d com data, frescor exatamente no limite de 90d), precedência de motivos e
`dataAtualizacao` (epoch→YYYY-MM-DD). `node --check` OK nos dois arquivos.

**Smoke read-only live (`node scripts/zelador-audit.mjs --publicos`):** rodou com o `.env`
real, exit 0, sem erros. **331 públicos na conta** (bate com o plano). Resumo:
morno 168 (elegíveis **3**), quente 16 (elegíveis **8**), lookalike/não aplicável 147,
inelegíveis 173. Motivos reais mais comuns entre inelegíveis: `operation_status 450` (72×,
público fora de uso/expirado), `operation_status 441` (32×, ainda populando),
**contagem oculta bound 20 (20×)** — exatamente o caso "[SA] InitiateCheckout" do plano —,
`operation_status 100` (12×), `442` (9×), além de listas CSV e públicos desatualizados >90d
(com data). Elegíveis quente reais são as `Lista_*.csv` (52.700 / 17.000 / ~1.000); elegíveis
morno são ENGAGEMENT de vídeo (~215k / ~2.100 / ~1.000). Nenhuma chamada POST/DELETE.

**Auditoria padrão inalterada:** JSON pós-mudança **byte a byte idêntico** ao baseline
(`scratchpad/zelador-baseline.json`), inclusive normalizando o timestamp dinâmico.

**Espelhos SKILL.md:** `diff .claude/… .agents/…` → **vazio** (idênticos). Já estavam
idênticos no baseline; a seção nova entrou igual nos dois.

**Desvios/observações honestas:**
- A fixture tem **7** casos (não 6): adicionei um WEBSITE-topo (PageView) para cobrir o
  ramo morno de WEBSITE, que ficaria sem teste com só os 6 casos listados.
- Os motivos de inelegibilidade carregam a `description` da própria Meta quando existe
  (ex.: op 441/450/100), o que deixa a linha longa mas mais pedagógica; o YAML do Painel
  capa as listas no top 10 e conta o resto, então não polui.
- Divergência **pré-existente** (fora do escopo, não corrigida): o rodapé do SKILL.md diz
  "Graph API v23.0" enquanto o código roda `v24.0`. Não toquei — não faz parte desta story
  e os dois espelhos seguem idênticos.
- `epic-19-state.json` não foi tocado (responsabilidade do orquestrador).
