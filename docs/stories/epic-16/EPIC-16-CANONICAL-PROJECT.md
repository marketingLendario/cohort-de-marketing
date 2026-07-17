# EPIC-16 - Projeto canônico como fonte de verdade

## Status

In Progress. O Gate 0 autorizou implementação local na branch de integração;
publicação, push e merge remoto continuam fora deste gate. A W1 está concluída
e a W2 está validada para execução sequencial.

## Problema

O repositório possui um briefing standalone 0.1.0, um envelope persistente v1,
regras de unlock para 31 skills e superfícies que ainda mantêm parte da mesma
informação embutida. Isso permite drift de contagem, estado e próxima skill.

## Objetivo

Tornar ProjectBrief v1, skill catalog e unlock rules a fundação pública única
para briefing, mapa, status, arquivos locais e integração com o Studio privado.

## Arquitetura

```text
ProjectBrief schema + unlock rules + skill catalog
          | validate/migrate
          v
briefing <-> artifact index <-> deterministic readiness
          |
          +-> mapa/status/comecar
          +-> contrato consumido pelo Studio privado
```

O browser não recebe acesso irrestrito ao filesystem. Descoberta local fica em
helper CLI confinado; a UI importa/exporta contratos validados.

## Escopo

- Contrato v1 e migração do 0.1.0.
- Import/export JSON e resumo Markdown derivado.
- Índice seguro de artefatos.
- Superfícies públicas data-driven.
- Próxima skill determinística e explicável.
- Gate público de distribuição.

## Fora de escopo

- Persistência Supabase ou UI React privada.
- Execução automática de todas as skills a partir do briefing.
- Armazenar tokens no ProjectBrief.
- Alterar a autoridade humana sobre campanhas.
- Criar nova skill para resolver responsabilidade já existente.

## Ondas e stories

| Onda | Story | Entrega | Dependências |
|---|---|---|---|
| W1 | 16.W1.1 | Contrato canônico ProjectBrief v1 | Gate 0 |
| W1 | 16.W1.2 | Importação e exportação bidirecional | 16.W1.1 |
| W2 | 16.W2.1 | Descoberta segura de artefatos | 16.W1.1 |
| W2 | 16.W2.2 | Briefing, mapa e status orientados por catálogo | 16.W1.1, 16.W2.1 |
| W2 | 16.W2.3 | Próxima skill determinística | 16.W2.1, 16.W2.2 |
| W3 | 16.W3.1 | Gate público de contrato e distribuição | W1 e W2 |

## Contrato de execução da W2

```text
16.W2.1 -> 16.W2.2 -> 16.W2.3
```

- Cada story inicia somente depois que a dependência anterior estiver `Done`.
- O baseline da wave é o fan-in local da W1 em `06e2b64`.
- A W3 permanece `Draft` até todas as stories da W2 passarem pelo quality gate
  independente e pelo fan-in local.

## Gate de conclusão

A epic só pode ficar `Done` quando um ProjectBrief v1 fizer round-trip sem perda,
um projeto legado migrar de forma determinística, todas as superfícies indicarem
o mesmo estado para as 31 skills e a distribuição pública passar em checkout
limpo sem conteúdo privado.
