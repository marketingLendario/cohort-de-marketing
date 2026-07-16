# STORY-19.W1.2 - Matriz funil×temperatura na SKILL.md do Estruturador

## Status

Ready

## Dependências

- Nenhuma (só prompt/documentação; paralelizável com 19.W1.1)

## Objetivo

Dar ao Estruturador a camada de decisão "qual funil para qual público":
matriz frio/morno/quente derivada da tabela de consciência do `metodo-funil`,
com gate pedagógico e handoff explícito — sem tocar em código.

## Critérios de aceite

- [x] Nova seção "Passo 0.5 — temperatura e funil" na SKILL.md do estruturador:
      pergunta a origem do público, cruza com `zelador.publicos` (quando existir)
      e com `nivel_consciencia` dos ângulos do Briefista, e prescreve o kit pela
      matriz. A decisão do aluno é registrada no Painel (`publico_tipo` +
      justificativa) — a IA não chuta temperatura (mesma regra do Briefista).
- [x] Matriz documentada: frio (nível 5–4, amplo Advantage+, v1 inalterado,
      R$30/dia×7d) · morno (nível 3–2, ENGAGEMENT/WEBSITE-topo, estudo de
      caso/webinário, R$20–30/dia×7d) · quente (nível 2–1, WEBSITE-fundo/listas,
      checkout direto/depoimento, R$20/dia×5–7d, exclusão de compradores
      obrigatória).
- [x] Regras de ouro do `metodo-funil` citadas: depoimento só converte no
      nível 2; estudo de caso no 3+; nunca depoimento para frio.
- [x] Handoff explícito: aluno sem nível de consciência definido → rodar o gate
      de diagnóstico do `metodo-funil` ANTES de montar (padrão "rode o zelador
      primeiro").
- [x] Gate pedagógico documentado: kit morno/quente só é oferecido se já existe
      campanha fria validada no Painel OU a conta tem públicos maduros
      pré-existentes (histórico real).
- [x] "Não fazer" ampliado: não misturar temperaturas no mesmo conjunto · não
      usar depoimento em frio · não montar quente sem exclusão de compradores ·
      não montar morno/quente com público inelegível na auditoria do Zelador.
- [x] Modo API documenta o bloco `publico` do `campanha.json` (formato da
      19.W2.1) e o comando `--listar-publicos`.
- [x] Espelho `.agents/skills/estruturador/SKILL.md` byte a byte idêntico.
- [x] Nada do default sagrado frio v1 é afrouxado ou removido.

## Tasks

- [x] Ler `plans/estruturador-funil-publicos-v2.md` (Fase B e matriz) e a tabela
      de níveis do `metodo-funil`.
- [x] Escrever Passo 0.5 + matriz + regras de ouro + gate pedagógico.
- [x] Atualizar seção Modo API (bloco `publico`, `--listar-publicos`) e
      "Não fazer".
- [x] Sincronizar espelho `.agents/`.
- [x] Atualizar checkboxes e File List real. (state JSON NÃO tocado — fora do
      escopo instruído para esta execução.)

## File List proposta

- `.claude/skills/estruturador/SKILL.md`
- `.agents/skills/estruturador/SKILL.md`
- `docs/stories/epic-19/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story.

## Validação

- `diff .claude/skills/estruturador/SKILL.md .agents/skills/estruturador/SKILL.md` vazio.
- Leitura crítica: a seção v1 (default sagrado, 3 gates, guardrails) permanece
  intacta; o novo conteúdo só ADICIONA caminhos.

## Stop conditions

- Qualquer edição que enfraqueça guardrail v1 (piso, teto, Impulsionar,
  1 conjunto, 2-3 criativos) → parar.
- Conflito entre a matriz e a tabela do `metodo-funil` → parar e registrar.

## File List real

- `.claude/skills/estruturador/SKILL.md` (editado — 4 blocos adicionados)
- `.agents/skills/estruturador/SKILL.md` (espelho sincronizado byte a byte via `cp`)
- `docs/stories/epic-19/STORY-19.W1.2-matriz-funil-temperatura-skill.md` (esta story)

Nenhum arquivo fora da File List proposta foi tocado. `epic-19-state.json` não foi
alterado (instrução explícita da execução).

## Dev Agent Record

**Agente:** @dev (Dex) · **Data:** 2026-07-15 · **Branch:** main (sem commit/push)

**Seções adicionadas à SKILL.md (só adição, zero remoção — `git diff`: 146 insertions, 0 deletions):**

1. `## Passo 0.5 — temperatura e funil` — posicionada entre "Dois modos" e
   "Modo API". Cobre: temperatura é decisão do aluno registrada no Painel
   (`estruturador.publico_tipo` + justificativa), cruzamento de 3 fontes
   (`zelador.publicos`, `nivel_consciencia` do Briefista, origem declarada pelo
   aluno), e o handoff de diagnóstico do `metodo-funil` quando o nível é
   desconhecido ("pare e rode o gate antes de montar").
2. `### A matriz funil×temperatura` — tabela frio (5–4) / morno (3–2) /
   quente (2–1) com público na conta, funil/destino, criativo permitido e kit de
   verba (incl. teto R$100/dia para morno/quente). Seguida das regras de ouro
   citadas do `metodo-funil` e da regra estrutural nova "1 campanha = 1 conjunto
   = 1 temperatura".
3. `### Gate pedagógico` — morno/quente só com campanha fria validada (a) OU
   públicos maduros na auditoria do Zelador (b); senão, frio. Remarketing/escala
   = Aula 4.
4. `### Kit morno/quente — o bloco `publico` (v2)` — dentro do Modo API:
   schema do bloco `publico` do `campanha.json` (tipo/custom_audiences/exclusoes,
   ausente = frio), comando `--listar-publicos`, `advantage_audience: 0`
   (hard audience) e validação ao vivo com recusa de inelegível.
5. Bloco YAML do Painel (Modo Manual) ganhou `publico_tipo: "frio"` (default).
6. `## Não fazer` ampliado com 6 itens novos (misturar temperaturas · depoimento
   em frio · quente sem exclusão de compradores · público inelegível na auditoria
   · interesse guarda-chuva + retargeting · morno/quente sem gate pedagógico).

**Validações rodadas:**

- `diff .claude/... .agents/...` → **vazio** ("Files are identical") tanto ANTES
  da mudança (espelhos já estavam sincronizados no baseline) quanto DEPOIS do
  `cp` final.
- `git diff --stat` → **146 insertions(+), 0 deletions** (73 por espelho);
  `git diff | grep '^-'` → nenhuma linha removida. Todo o conteúdo v1 (default
  sagrado, piso R$20, teto R$200 do frio, Impulsionar-nunca, 1 conjunto, 2-3
  criativos, 3 gates, circuit-breaker, handoff, 8 itens originais do "Não fazer")
  permanece intacto.

**Observações honestas:**

- **Sem conflito matriz × tabela do `metodo-funil`** (stop condition não
  disparada). A matriz agrupa 5 níveis em 3 temperaturas — há sobreposição nas
  fronteiras (nível 4 aparece no frio; nível 2 aparece em morno e quente), o que
  é destilação, não contradição. O casamento criativo↔nível respeita fielmente
  a regra de ouro: frio nunca usa depoimento (nível 2 só), morno usa estudo de
  caso (3+) e depoimento só se nível 2, quente pode depoimento (nível 2–1). A
  tensão interna já existente na fonte ("estudo de caso a partir do nível 4" na
  linha da tabela vs "estudo de caso no 3+" na regra de ouro) é do próprio
  `metodo-funil`, não introduzida aqui; adotei o range da matriz do plano.
- O teto R$100/dia de morno/quente é **mais restritivo** que o teto R$200 do
  frio v1 — não afrouxa nada. O `advantage_audience: 0` e a proibição de
  interesse guarda-chuva em morno/quente também endurecem, não afrouxam.
- Espelhos `.claude` e `.agents` estavam idênticos no baseline (nenhuma
  divergência pré-existente neste arquivo, apesar das mudanças não commitadas
  em outros arquivos do repo).
