# ADR-001 - Dominio e autonomia do produto unificado

## Status

Aceito em 2026-07-09.

## Contexto

O repositorio possui tres superficies separadas: briefing standalone, mapa de
skills standalone e Ads Studio React. Elas representam o mesmo trabalho, mas
usam raizes, persistencias e contratos diferentes.

O Ads Studio original tambem admite publicacao e automacao, enquanto o PRD da
Aula 3 define um squad recommend-only, com aprovacao, decisao e publicacao
humanas.

## Decisao

### Hierarquia

```text
Workspace -> Project -> Campaign -> Week
                 |          |
                 |          +-> CampaignPlan revisions
                 +-> ProjectBrief revisions
                 +-> Artifacts
                 +-> SkillRuns
```

- `Workspace` continua sendo o limite de tenancy e RLS.
- `Project` vira a raiz do trabalho de marketing.
- `Campaign` pertence a um projeto e guarda contexto operacional especifico.
- `Week` pertence a uma campanha e nunca sobrescreve semanas anteriores.

### Contratos

- `ProjectBrief`: contexto estavel de projeto, mercado, oferta, marca e funil.
- `CampaignPlan`: contexto de campanha, herancas, overrides e preparacao.
- `WeeklyPanel`: metricas, leitura, diagnostico e decisao de uma semana.

Campanhas referenciam a revisao do briefing. Nao existe copia silenciosa.

### Autoridade

- `.claude/skills/{id}/SKILL.md`: comportamento da skill.
- `.agents/skills`: espelho literal, nunca fonte independente.
- catalogo versionado: identidade, grafo e metadados de produto.
- schemas: contratos estruturados de dados.
- PRD-A3: autoridade funcional da Aula 3 em caso de contradicao.

### Autonomia

O modo Cohort e `recommend-only`:

- nenhuma tool publica, pausa, escala ou altera campanha na Meta;
- toda saida de IA e proposta;
- um humano confirma antes da gravacao definitiva;
- subida na Meta e registrada como acao humana.

### Leitor de Metricas

O contrato autoritativo e literal: o Leitor apenas reporta numeros presentes no
input confirmado. Campo ausente vira `nao_fornecido`; o Leitor nao calcula,
estima ou completa. Calculos deterministas de economia e projecao pertencem a
modulos L0 separados e sao rotulados pela sua propria origem.

## Consequencias

- O dashboard passa a ser orientado a projeto, nao apenas campanha.
- Briefing, mapa e campanhas compartilham shell e projeto ativo.
- Mudancas upstream podem marcar artefatos e runs downstream como `stale`.
- O frontend e o BFF nao duplicam prompts nem regras narrativas das skills.
- Automacao Meta futura exige outro modo, permissoes e ADR.

## Alternativas rejeitadas

- Iframes para os HTMLs: mantem estado e navegacao fragmentados.
- Campanha como projeto: impede reuso do briefing entre campanhas.
- Um schema universal: mistura ciclos de vida e aumenta invalidacao acidental.
- Calculo implicito no Leitor: conflita com o PRD-A3 autoritativo.

