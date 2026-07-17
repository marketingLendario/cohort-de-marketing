# EPIC-18 - Cena parametrizável para o arquétipo Pessoa (EDIT de foto real)

## Status

InProgress — 18.W1.1 implementada e auto-verificada (InReview); pendente
sign-off humano/@po e release management (@devops).

## Baseline

- `gitRef`: `origin/main`
- `gitCommit`: `84f0b31ec0d37e24853f703f8225135a98398fc6`
- `skillVersion`: `2.2.1`

## Problema

O renderer `person` (`.claude/skills/ads-creative-factory/scripts/person.py`)
é o único modo que edita a foto REAL de uma persona declarada (`EDIT_PROMPT`,
`person.py:89-100`) em vez de gerar rosto do zero — correto pelo princípio
inegociável da skill ("Pessoa = EDIT da foto real; nunca gerar rosto", FR20).
Só que a cena desse EDIT é uma string fixa hardcoded ("dark premium near-black
cinematic scene, warm gold rim light...") e não lê nada do catálogo. Um novo
arquétipo criado via `archetype add --renderer-mode person` hoje **valida**
no catálogo, mas na geração real produz pixel a pixel o mesmo resultado do
built-in `person_authority`, porque `_person()` (`archetype_render.py:137-153`)
nunca consulta `compatible_ugc_scenes` — diferente de `_mockup()`/`_didactic()`/
`_ugc()`, que resolvem sua variação interna via `resolve_internal_selection()`.

Isso foi uma decisão consciente da STORY-14.W2.3 ("Fora de escopo: implementar
renderer mode adicional"), não um bug — mas bloqueia um caso de uso real:
persona real (rosto verdadeiro) em cenas cotidianas/espontâneas (ex.: mesa de
trabalho, cozinha, transporte), em vez de sempre a cena de autoridade
cinematográfica escura.

Achado relacionado (fora do escopo desta epic, registrado para rastreio): o
modo `ugc` já lê `ugc_scenes` do catálogo, mas `_ugc()` gera a foto do zero
por texto (`alib.codex_image`), mesmo quando a cena declara
`needs_persona: true` — nunca insere de fato a foto real da persona. Uma cena
UGC marcada como "precisa de persona" hoje não recebe rosto real nenhum. Não
tratar aqui; abrir story própria se o produto quiser esse comportamento no
modo `ugc`.

## Objetivo

Permitir que um arquétipo `renderer_mode: person` referencie uma cena do
catálogo (`compatible_ugc_scenes`, campo que o schema de archetype já expõe)
para parametrizar o ambiente do EDIT de foto real, preservando a foto da
persona pixel-fiel. Sem cena declarada, o comportamento atual (cena fixa
cinematográfica) continua idêntico — zero regressão em `person_authority`.

## Resultado esperado

- Extension Packs podem declarar novas cenas cotidianas (reaproveitando o
  mesmo schema de `ugc_scenes`: `setting`, `shot`, `lighting`, `props`,
  `authenticity_guards`) e ligá-las a um arquétipo `person` via
  `--ugc-scene` (comando já existente, sem mudança de contrato de CLI).
- O EDIT da foto real passa a montar o prompt de ambiente a partir da cena
  resolvida, mantendo intacta a instrução de preservar rosto/pele/expressão.
- `preview archetype` mostra a cena resolvida e o prompt sanitizado para
  arquétipos `person` com cena.

## Escopo

- `archetype_render.py`: `resolve_internal_selection()` resolve `mode ==
  "person"` quando o arquétipo declara `compatible_ugc_scenes` (mesmo padrão
  já usado para `ugc`/`mockup`/`didactic`).
- `person.py`: `edit_to_scene()` aceita uma cena resolvida opcional e monta o
  prompt de ambiente a partir dela; sem cena, usa a string fixa atual
  inalterada.
- Testes de regressão (`person_authority` sem cena) e de cena custom via
  Extension Pack.
- Documentação (`SKILL.md`) e espelho `.agents/skills/ads-creative-factory/`
  byte a byte idêntico.

## Fora de escopo

- Mudar o contrato de `catalog_cli.py` / `catalog_loader.py` (o campo
  `compatible_ugc_scenes` já existe no schema de archetype).
- Corrigir o `ugc` mode para inserir foto real em cenas `needs_persona`
  (achado registrado acima; story separada).
- Novo `renderer_mode` (continua sendo apenas um preset dentro do modo
  `person` existente).

## Ondas e stories

| Onda | Story | Objetivo |
|---|---|---|
| W1 | 18.W1.1 | Cena parametrizável no EDIT de foto real do arquétipo Pessoa |

## Gate de conclusão

- Testes do runtime, catálogo e autoria passam.
- `person_authority` gera output byte-idêntico ao pré-mudança quando nenhuma
  cena é declarada (fixture de regressão).
- `.claude` e `.agents` permanecem byte a byte idênticos.
- `@po` valida a story (Draft → Ready) antes de `@dev` implementar.
