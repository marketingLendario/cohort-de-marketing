---
name: ads-creative-factory
description: "Motor agnóstico de criativos de performance. De 1 briefing → N criativos em arquétipos distintos, usando packs externos versionados, multi-formato e gate anti-AI-slop."
version: "2.1.0"
user-invocable: true
argument-hint: "[request.json]"
---

## Invocação (slash command)

`/ads-creative-factory [request.json]`

Na interface, o adapter converte os finalistas curados pelo `briefista` em um
`campaign.yaml` fechado. No terminal, a skill recebe esse arquivo diretamente.
Formatos, variações, arquétipos e personas são campos de `params:` no YAML:

| Argumento | Default | O que faz |
|---|---|---|
| `campaign.yaml` (posicional) | — | Campanha estruturada com hooks já curados |
| `--formats` | `feed` | Formatos: `feed` (4:5) · `story` (9:16) · `square` (1:1) |
| `--variants N` | `1` | Variantes (instâncias) por mensagem — N×hooks = total de criativos |
| `--archetypes` | declarados no request | Subconjunto de espécies a usar |
| `--personas` | `[]` | IDs ou caminhos explicitamente declarados para Pessoa/UGC |
| `brand_pack` | obrigatório | Brand pack v1 explícito |
| `persona_pack` | opcional | Pack v1 de persona quando houver likeness |
| `output_root` | obrigatório | Raiz relativa materializada em `projetos/{slug}/` após aprovação |

O adapter preenche a copy de imagem e a copy de anúncio (`caption` +
`link_description`) por hook; ambas viajam no manifesto sanitizado.

## Criar o Brand Pack sem editar JSON

Quando o projeto já possui um `projetos/{slug}/DESIGN.md` aprovado, converta-o
com o builder canônico. A declaração de direitos é obrigatória e o pack nasce
como **não redistribuível**; isso permite uso no projeto sem presumir licença
pública de logo, fonte ou referência:

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/ads-creative-factory"
python3 "$SKILL_DIR/scripts/build_brand_pack.py" \
  --design "projetos/meu-projeto/DESIGN.md" \
  --output "projetos/meu-projeto/brand-pack" \
  --rights-notice "Declaro que tenho direito de usar estes ativos neste projeto." \
  --asset "logo:/caminho/para/logo.svg" \
  --json
```

`--asset` é opcional e repetível (`logo`, `font`, `reference`, `texture` ou
`other`). O builder gera `pack.json`, `assets/DESIGN.md`, `preview.html` e
`build-report.json`, valida tudo com o mesmo loader do runtime e falha fechado
quando faltam cores, tipografia, provenance ou declaração de direitos. No
painel, o fluxo "Criar pack" invoca este mesmo comando e salva no projeto.

# ads-creative-factory

Motor agnóstico de criativos de **performance** (lead-gen). A
diversidade é de **ARQUÉTIPO** (a *espécie* da peça) — é isso que faz o stop-scroll,
não trocar objeto+copy dentro do mesmo molde.

**Motor:** Codex CLI local autenticado (`image_gen`). Texto-a-imagem para fundos;
**image-to-image EDIT** somente com `persona_pack` e autorização explícitos.
Nenhuma `OPENAI_API_KEY` ou `CODEX_API_KEY` é usada.

## Localização da implementação

Esta skill é autocontida em `.claude/skills/ads-creative-factory/`. Scripts e
contratos genéricos viajam juntos; identidade, referências, logos e fotos entram
somente por pack externo explícito. O
espelho `.agents/skills/ads-creative-factory/` deve ser byte a byte idêntico.

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/ads-creative-factory"
python3 "$SKILL_DIR/scripts/doctor.py" --json
ACF_OUT_DIR="$(mktemp -d)" ACF_BRAND_PACK="/caminho/para/pack-v1" \
  python3 "$SKILL_DIR/scripts/factory.py" campaign.yaml
```

> **Segredos:** a geração usa exclusivamente a sessão autenticada do Codex CLI.
> `OPENAI_API_KEY` e `CODEX_API_KEY` não são exigidas nem herdadas pelo runtime.
> Outputs ficam fora da skill, sob a raiz indicada por `ACF_OUT_DIR`.

## Contrato compartilhado CLI/painel

O painel e o CLI enviam o mesmo objeto v1 dentro de `context.creativeFactory`.
`brand_pack` é obrigatório, `persona_pack` só aparece quando necessário e
`output_root` sempre é relativo:

```json
{
  "schema_version": "1.0.0",
  "brand_pack": { "id": "brand-alpha" },
  "output_root": "criativos/factory",
  "campaign_id": "campanha-01",
  "production_skill_id": "ads-creative-factory",
  "formats": ["feed", "story"],
  "archetypes": ["dark_editorial", "light_clean"],
  "variants": 1,
  "personas": [],
  "likeness_authorizations": [],
  "cta": "Saiba mais",
  "finalists": [{ "id": "hook-1", "hook": "Hook", "copy": "Copy", "format": "feed" }]
}
```

Adapters de painel devem persistir o objeto `context.creativeFactory` acima e
usar um `jobId` durável para retry, cancelamento, aprovação e retomada. No CLI
standalone, `ACF_BRAND_PACK` e `ACF_OUT_DIR` materializam o mesmo boundary;
falhas de pack, dependência ou path são bloqueantes e acionáveis.

## Os 6 arquétipos (eixo primário) — `data/archetypes.yaml`

| Arquétipo | Modo | Linguagem |
|---|---|---|
| dark_editorial | hybrid (dark) | superfície escura e acento definidos pelo pack |
| light_clean | hybrid (light) | superfície clara e contraste definidos pelo pack |
| person_authority | person (EDIT) | rosto REAL do expert + cena temática |
| mockup_product | mockup | tela/dashboard (devices variados) |
| ugc_native | ugc | story nativo do Instagram (9:16) |
| didactic_compare | didactic | comparação ✕/✓ (3 estilos) |

O factory sorteia arquétipos **distintos** por job (eixo primário) + variação
interna por instância (estilo/device/foto) → diversidade entre E dentro das espécies.

## campaign.yaml

```yaml
campaign: "campaign-example"
brand_id: "brand-alpha"
params:
  primary_axis: "archetype"
  variants_per_hook: 3
  formats: ["feed","story","square"]
  personas: []
hooks:
  - { id: H, mechanism: ..., eyebrow: "...", headline: "...", emphasis_word: "...",
      sub: "...", cta: "...", native_text: "...(ugc)", compare: {...(didactic)} }
```

## Modo carrossel

Use quando a peça precisa de sequência narrativa (capa/hook → corpo → CTA), não
como 7º arquétipo. A invocação continua CLI-first:

```bash
python3 "$SKILL_DIR/scripts/carousel_copy_adapter.py" copy.yaml -o hooks.yaml
python3 "$SKILL_DIR/scripts/factory.py" campaign-carousel.yaml
```

Schema mínimo do hook:

```yaml
hooks:
  - id: "aula-carousel"
    mode: "carousel"
    caption: "Legenda do anúncio..."
    link_description: "Descrição do link..."
    slides:
      - { role: "hook", headline: "Capa forte", source_slide: 1 }
      - { role: "body", headline: "Ideia do corpo", sub: "1-3 linhas", source_slide: 2 }
      - { role: "cta", headline: "Fechamento", cta: "Quero participar", source_slide: 3 }
```

`slides[]` aceita 3-10 itens; primeiro `role: hook`, último `role: cta`. O
adapter aceita YAML `carousel_output` do `create-carousel` como formato primário
e Markdown com headings explícitos de slide como fallback. Custo esperado:
`single_bg` usa ~1 chamada de imagem por carrossel e re-typeset vetorial por slide;
`per_slide` usa 1 chamada por slide e passa por gate de paleta inter-slides.

Exemplo representativo versionado: `campaign-archetypes-final.yaml`.

## Pipeline

copy (will-binder) → **arquétipo** (eixo primário) → variação secundária → geração
por modo → **gate archetype-aware** (dark/light/native) → logo discreto + finish →
**revisão final** → **multi-formato** (mesma cena reenquadrada). Anti-saturação +
acervo auto-curado. Pessoa = foto REAL via EDIT (nunca likeness gerada do zero).

## Princípios inegociáveis

- Diversidade = arquétipo (espécie), não elemento dentro do molde.
- Logo NUNCA difundido (asset fixo, composto discreto).
- Pessoa = EDIT da foto real ("mantenha a pessoa, troque o fundo"); nunca gerar rosto (FR20).
- Revisar o entregável FINAL com olho crítico, não confiar na cadeia.

## Estrutura da skill

```
.claude/skills/ads-creative-factory/
  SKILL.md                       — este arquivo (entry point)
  scripts/                       — pipeline Python (factory, gate, person, archetype_render, ...)
  schemas/                       — contratos v1 de brand e persona packs
  data/                          — arquétipos, hooks e eixos de variação genéricos
  fonts/                         — dependências tipográficas neutras do runtime
  THIRD_PARTY_NOTICES.md         — gate de licença e redistribuição
```

Identidade, logos, pessoas, referências e exemplos de campanha vivem somente
em packs externos explicitamente selecionados; não existem defaults de cliente.

Nunca versionar `out/`, `tmp/`, `__pycache__/`, `.last`, manifests de execução
ou imagens geradas para projetos reais dentro da pasta da skill.
