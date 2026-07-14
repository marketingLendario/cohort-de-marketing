# EPIC-14 - Extensibilidade governada da Ads Creative Factory

## Status

Done

## Baseline

- Base de planejamento: `origin/main` em `d831ea3`.
- Skill pública: `ads-creative-factory` `2.1.1`.
- Comando público existente: `/ads-creative-factory [request.json]`.
- Contratos existentes: Brand Pack v1 e Persona Pack v1.
- Renderer modes existentes: `hybrid`, `person`, `mockup`, `ugc` e `didactic`.

## Problema

A skill já executa campanhas com packs externos de marca e persona, porém a
criação e evolução dos elementos que formam sua linguagem ainda não possuem uma
interface única e governada. Arquétipos e mecanismos dependem de edição manual
dos dados canônicos; cenas UGC, dispositivos de mockup e estilos didáticos estão
acoplados ao código; somente o Brand Pack possui builder; e o campo legado
`mechanism` mistura intenção de copy com mecanismo visual.

Isso impede que operadores adicionem repertório com segurança, dificulta a
reutilização entre projetos e cria risco de colisão de IDs, vazamento de assets,
drift entre CLI e painel e quebra silenciosa do renderer.

## Objetivo

Transformar a Ads Creative Factory em um motor extensível por packs versionados,
com comandos CLI-first para inspecionar, criar, validar, pré-visualizar e instalar
brands, personas, arquétipos, mecanismos, cenas UGC, variações e referências,
sem editar diretamente a skill nem permitir execução arbitrária de código.

## Resultado esperado

Um operador poderá usar o mesmo namespace público:

```text
/ads-creative-factory <entidade> <ação> [opções]
```

com equivalência determinística no terminal:

```bash
python3 scripts/catalog_cli.py <entidade> <ação> [opções]
```

Os elementos criados serão materializados em
`projetos/{slug}/creative-factory/packs/{pack-id}/`, validados antes da escrita e
selecionados explicitamente por campanha. CLI e painel deverão resolver o mesmo
catálogo, com versão e hash persistidos no manifesto do lote.

## Escopo

- Contrato `creative-extension-pack.v1` e schemas das entidades extensíveis.
- Loader determinístico de built-ins mais packs externos explícitos.
- Comandos `catalog list`, `catalog show`, `catalog validate` e `preview`.
- Comando `brand create` sobre o builder existente.
- Builder e comando `persona create` com direitos, consentimento e hashes.
- Comandos `ugc-scene add`, `mechanism add`, `variation add` e `reference add`.
- Comando `gate-profile add` para thresholds e políticas declarativas allowlisted.
- Comando `archetype add` limitado aos renderer modes allowlisted.
- Separação entre `copy_mechanism_id` e `visual_mechanism_id`, com adapter legado.
- Remoção dos catálogos hardcoded de cenas UGC, mockups e estilos internos.
- Seleção de extension packs no request da fábrica e rastreabilidade no manifesto.
- Catálogo dinâmico no repositório privado dedicado do Ads Studio.
- Release pública `2.2.0`, mirror literal e gate de redistribuição.

## Fora de escopo

- Carregar Python, JavaScript ou qualquer código executável vindo de um pack.
- Criar renderer mode novo por comando de operador.
- Publicar, pausar ou alterar campanhas na Meta.
- Distribuir logos, fotos, fontes ou referências privadas de clientes.
- Remover o campo legado `mechanism` nesta release.
- Fazer descoberta implícita de packs varrendo todo o filesystem.
- Sobrescrever built-ins ou packs instalados sem confirmação explícita.

## Decisões arquiteturais

1. Existe um único slash command público. As novas capacidades são subcomandos,
   não novas skills no catálogo.
2. A skill canônica continua em `.claude/skills/ads-creative-factory/`; o espelho
   `.agents/skills/ads-creative-factory/` permanece byte a byte idêntico.
3. Built-ins são imutáveis. Packs externos entram somente por seleção explícita.
4. IDs externos são namespaced e colisões falham fechado.
5. Um arquétipo data-driven pode usar apenas renderer modes allowlisted. Um mode
   novo exige story de desenvolvimento, testes e revisão de segurança.
6. Todo asset precisa de path confinado, provenance, rights ID e licença ou
   autorização de uso aplicável.
7. O catálogo resolvido é ordenado deterministicamente e recebe hash persistido.
8. O mecanismo de copy e o mecanismo visual são dimensões distintas. O adapter
   legado mantém campanhas v1 funcionais durante a release `2.2.0`.
9. Comandos de escrita suportam `--dry-run`, `--json` e escrita atômica; `--force`
   nunca é implícito.
10. Outputs gerados e assets privados não entram na pasta pública da skill.

## Interface alvo

| Comando | Responsabilidade |
|---|---|
| `catalog list` | Listar entidades, origem, versão e disponibilidade |
| `catalog show <tipo> <id>` | Exibir contrato e compatibilidades |
| `catalog validate <pack>` | Validar schema, paths, direitos e colisões sem escrever |
| `brand create` | Criar Brand Pack v1 a partir de `DESIGN.md` |
| `persona create` | Criar Persona Pack v1 com fotos autorizadas |
| `archetype add` | Criar preset sobre renderer mode suportado |
| `ugc-scene add` | Cadastrar cenário e guardas de autenticidade |
| `mechanism add` | Cadastrar mecanismo de copy, visual ou híbrido |
| `variation add` | Cadastrar valor de eixo visual allowlisted |
| `reference add` | Cadastrar referência com rights e provenance |
| `gate-profile add` | Cadastrar thresholds dentro dos limites do runtime |
| `preview` | Gerar smoke preview isolado antes da instalação |
| `pack build` | Consolidar entidades em Extension Pack validado |
| `pack install` | Associar explicitamente um pack a um projeto |

## Ondas e stories

| Onda | Story | Entrega | Dependências |
|---|---|---|---|
| W1 | 14.W1.1 | Contratos do Extension Pack e entidades | nenhuma |
| W1 | 14.W1.2 | Loader e resolução determinística do catálogo | 14.W1.1 |
| W1 | 14.W1.3 | CLI read-only de catálogo e diagnóstico | 14.W1.1, 14.W1.2 |
| W2 | 14.W2.1 | Comandos e builders de brand e persona | 14.W1.1, 14.W1.3 |
| W2 | 14.W2.2 | Comandos de mecanismo, UGC, variação e referência | 14.W1.1, 14.W1.3 |
| W2 | 14.W2.3 | Arquétipos declarativos e boundary de renderer | 14.W1.1, 14.W1.2, 14.W2.2 |
| W3 | 14.W3.1 | Integração dos packs no runtime da fábrica | W1 e W2 |
| W3 | 14.W3.2 | Catálogo dinâmico no Ads Studio privado | 14.W3.1 e contrato público versionado |
| W3 | 14.W3.3 | Regressão, release pública e gate de go-live | 14.W3.1, 14.W3.2 |

## Estratégia de release

- `2.2.0`: extension packs opcionais, subcomandos e compatibilidade com campanhas
  que ainda usam `mechanism`.
- `2.x`: telemetria local e avisos de depreciação sem bloquear campanhas antigas.
- `3.0.0` futura: avaliar obrigatoriedade de `copy_mechanism_id` e
  `visual_mechanism_id`; não faz parte desta epic.

## Gate de conclusão

A epic só pode ficar `Done` quando um projeto limpo conseguir criar brand,
persona, mecanismo, cena UGC, variação, referência, gate profile e arquétipo declarativo por
comando; instalar o pack; gerar um lote real usando esses elementos; resolver o
mesmo hash de catálogo no CLI e no painel; rejeitar renderer desconhecido,
colisão, traversal e asset sem direitos; e publicar a skill sem qualquer asset
privado, output de campanha ou divergência entre os mirrors.
