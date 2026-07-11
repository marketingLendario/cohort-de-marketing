---
# Template de DESIGN.md do Cohort — usado pelos caminhos "Criar do zero" e "Com o que eu tenho".
# Preencha os campos com os valores reais da marca do aluno. Mantenha o formato (frontmatter YAML + corpo).
# Mínimo que o brand-choice precisa: colors.primary/secondary, typography.body/heading, logo.
name: "{NOME DA MARCA}"
colors:
  primary: "{#hex}"        # cor principal / de destaque (botões, âncoras)
  secondary: "{#hex}"      # cor de apoio
  accent: "{#hex}"         # realce pontual
  surface: "{#hex}"        # fundo da página
  text: "{#hex}"           # texto principal
  text-muted: "{#hex}"     # texto secundário
  border: "{#hex}"         # bordas / divisórias
  neutral: "{#hex}"        # cinza neutro
typography:
  display:
    fontFamily: "{Fonte de título}, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: -0.02em
  heading:
    fontFamily: "{Fonte de subtítulo}, system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "{Fonte de corpo}, system-ui, sans-serif"
    fontWeight: 400
logo:
  description: "{descrição do logo ou caminho do arquivo enviado}"
  source: "aluno"
---

# {NOME DA MARCA} — Design System

> Gerado no Cohort de Marketing a partir da identidade do aluno.

## Identidade
**Tom visual:** {ex.: claro e acolhedor · dark premium · vibrante · minimalista}
**Sensação que transmite:** {3 palavras}

## Cores
| Token | Hex | Uso |
|---|---|---|
| primary | {#hex} | Destaque, CTAs |
| secondary | {#hex} | Apoio |
| accent | {#hex} | Realce pontual |
| surface | {#hex} | Fundo |
| text | {#hex} | Texto principal |
| text-muted | {#hex} | Texto secundário |

## Tipografia
- **Títulos:** {fonte} — {peso}
- **Corpo:** {fonte} — {peso}

## Regras visuais
- {regra 1 — ex.: nunca usar gradiente colorido}
- {regra 2 — ex.: destaques sempre na cor primary}
- {regra 3 — ex.: cantos arredondados de 8px}

## Logo
{descrição / onde está o arquivo}
