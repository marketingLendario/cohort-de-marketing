# STORY-18.W1.1 - Cena parametrizável no EDIT de foto real do arquétipo Pessoa

## Status

InReview

## Dependências

- 14.W1.1
- 14.W1.2
- 14.W2.3

## Objetivo

Fazer o renderer `person` (foto REAL via EDIT, nunca rosto gerado) aceitar uma
cena do catálogo (`compatible_ugc_scenes`) para montar o ambiente do EDIT, em
vez da string fixa "dark premium near-black cinematic scene" hardcoded em
`person.py`. Sem cena declarada, o resultado deve ser byte-idêntico ao atual.

## Contexto

`_person()` (`archetype_render.py:137-153`) chama
`person_mod.edit_to_scene(photo, ...)`, que usa `EDIT_PROMPT`
(`person.py:89-100`) — uma string literal, sem nenhum parâmetro. Diferente de
`_mockup`/`_didactic`/`_ugc`, o modo `person` nunca passa por
`resolve_internal_selection()` para variação interna. O schema de archetype já
expõe `compatible_ugc_scenes` (usado hoje só pelo modo `ugc`); esta story
reaproveita o mesmo campo e o mesmo grupo de entidade `ugc_scenes` — não exige
mudança em `catalog_cli.py` nem em `catalog_loader.py`.

## Critérios de aceite

- [x] Um arquétipo `renderer_mode: person` com `compatible_ugc_scenes`
  declarado tem sua cena resolvida por `resolve_internal_selection()`, no
  mesmo padrão usado para `mode == "ugc"`.
- [x] Sem `compatible_ugc_scenes` declarado, o EDIT usa a string fixa atual,
  sem nenhuma mudança de comportamento ou de bytes gerados.
- [x] O prompt de EDIT montado a partir da cena resolvida preserva, sem
  exceção, a instrução de manter a pessoa pixel-fiel (rosto, pele, expressão,
  óculos, cabelo) e nunca gerar rosto do zero.
- [x] `preview archetype` retorna a cena resolvida e o prompt sanitizado para
  um arquétipo `person` com cena, usando fixture sintética (sem persona real
  nem foto real).
- [x] Referenciar uma cena inexistente ou incompatível continua bloqueando a
  instalação do Extension Pack (comportamento já coberto por
  `_validate_links`; cobrir com teste específico para `person`).
- [x] Teste de regressão: `person_authority` (built-in, sem cena) gera o
  mesmo prompt de EDIT de antes da mudança.
- [x] Teste novo: arquétipo `person` com cena custom via Extension Pack monta
  o prompt a partir de `setting`/`shot`/`lighting`/`props`/
  `authenticity_guards` da cena.
- [x] `.claude/skills/ads-creative-factory` e
  `.agents/skills/ads-creative-factory` permanecem byte a byte idênticos
  entre si após a mudança.

## Tasks

- [x] Confirmar baseline e ausência de PR cobrindo o escopo.
- [x] Congelar os testes de regressão e de cena custom antes da implementação.
- [x] Implementar somente dentro da File List aprovada (mais
  `test_catalog_authoring.py`, adicionado à File List real abaixo — cobre
  `preview`/bloqueio via CLI, superfície não antecipada na proposta inicial).
- [x] Rodar a suíte de testes da skill (`__tests__/`) e registrar evidências.
- [x] Atualizar checkboxes, File List real e o `epic-18-state.json`.

## File List real

- `.claude/skills/ads-creative-factory/scripts/person.py`
- `.claude/skills/ads-creative-factory/scripts/archetype_render.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/test_factory_catalog_runtime.py`
- `.claude/skills/ads-creative-factory/scripts/__tests__/test_catalog_authoring.py`
- `.claude/skills/ads-creative-factory/SKILL.md`
- `.agents/skills/ads-creative-factory/**` (espelho sincronizado byte a byte)
- `docs/stories/epic-18/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

## Validação

- Testes Python da skill (`scripts/__tests__/test_factory_catalog_runtime.py`,
  `test_catalog_authoring.py`, `test_extension_catalog.py`).
- Comparação de prompt gerado antes/depois para `person_authority` (sem
  cena) — precisa ser idêntica.
- `preview archetype` para um arquétipo `person` com cena, sem persona real.

## Stop conditions

- Qualquer mudança no output de `person_authority` sem cena declarada.
- Necessidade de gerar rosto do zero (violação de FR20) em qualquer caminho
  do modo `person`.
- Divergência entre `.claude/skills/ads-creative-factory` e
  `.agents/skills/ads-creative-factory`.

## Resultado

Implementado: `resolve_internal_selection()` resolve cena para `mode ==
"person"` somente quando o arquétipo declara `compatible_ugc_scenes`
(sem isso, retorna `{}` — zero regressão); `person.build_edit_prompt()`
monta o EDIT a partir da cena quando presente e cai na `EDIT_PROMPT` fixa
quando ausente; `_person()` passa a cena resolvida ao EDIT e ajusta o
eyebrow (não usa mais "· AO VIVO" quando há cena cotidiana). Nenhuma
mudança em `catalog_cli.py`/`catalog_loader.py` foi necessária — o campo
`compatible_ugc_scenes` e a validação de referência (`_validate_links`) já
existiam e cobrem o novo caso genericamente.

Evidências:
- 32 testes da skill passam (`__tests__/test_factory_catalog_runtime.py`,
  `test_catalog_authoring.py`, `test_extension_catalog.py`), incluindo os 7
  testes novos desta story.
- Smoke test manual via CLI real (pack sintético, fora do repositório):
  `archetype add --renderer-mode person --ugc-scene acme.cozinha` valida;
  `preview archetype` retorna `"compatible_ugc_scenes": ["acme.cozinha"]`;
  `archetype add` com `--ugc-scene acme.nao-existe` bloqueia com
  `"Archetype 'acme.candid2' compatible_ugc_scenes references unknown
  entity 'acme.nao-existe'."`.
- `diff -rq .claude/skills/ads-creative-factory .agents/skills/ads-creative-factory`
  sem saída (paridade byte a byte confirmada após cada arquivo tocado).

Pendente (fora do escopo de implementação, autoridade de `@devops` por
`agent-authority.md`): bump de `metadata.version` no `SKILL.md`,
regeneração de `source-manifest.json` via
`scripts/generate-ads-creative-factory-manifest.mjs` (hoje hardcoded para
os releases 2.2.0/2.2.1 — precisa de uma entrada `epic18Files` nova) e o
corte formal do release público. `@po` ainda não validou esta story
(Draft → Ready não foi feito por um agente `@po` separado); o status
`InReview` reflete implementação + auto-verificação, não aprovação humana
final.
