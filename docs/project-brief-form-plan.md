# Plano da tela de briefing único

> Fonte de entrada: `docs/skill-inputs.md`.
> Artefatos de execução: `data/project-brief.schema.json` e `data/skill-unlock-rules.json`.
> Objetivo: permitir que o usuário preencha uma vez as informações únicas do projeto, com autosave e painel de skills desbloqueadas.

## Princípio do produto

A tela não deve ser “mais um formulário antes das skills”. Ela deve ser o centro de preparação do projeto:

- coleta campos únicos, sem repetir perguntas entre skills;
- salva o progresso automaticamente;
- mostra quais skills já podem rodar;
- explica o que falta para desbloquear a próxima skill;
- exporta um estado legível para `projetos/{slug}/`;
- nunca substitui os artefatos gerados pelas skills, como `offerbook.md`, `DESIGN.md`, `funil.md` ou `copy.md`.

O formulário coleta briefing. As skills continuam produzindo os arquivos finais.

## Arquitetura recomendada

### 1. Schema canônico

Arquivo: `data/project-brief.schema.json`.

Responsabilidades:

- declarar cada campo uma única vez;
- definir tipo, opções, etapa, rótulo, ajuda e obrigatoriedade condicional;
- separar campos sensíveis de campos públicos;
- manter versionamento para migração futura de drafts.

O schema usa grupos estáveis:

- `meta`: versão, timestamps e status;
- `project`: identidade do projeto e Perfil do Projeto;
- `market`: nicho, avatar, dores, objeções e consciência;
- `offer`: oferta, preço, garantia, bônus, upsell, downsell e backend;
- `brand`: modo de design, referências, ativos e direção visual;
- `funnel`: formato, destino, quiz, webinar, VSL e lançamento;
- `channels`: e-mail, WhatsApp, conteúdo e criativos;
- `data`: métricas e fontes de CRO;
- `integrations`: status de ferramentas e integrações.

### 2. Regras de desbloqueio

Arquivo: `data/skill-unlock-rules.json`.

Responsabilidades:

- declarar o que cada skill exige;
- separar campos obrigatórios, campos recomendados, artefatos obrigatórios e artefatos recomendados;
- representar exceções por perfil, como afiliado, B2B, físico/local e pré-lançamento;
- permitir estados além de “liberada/bloqueada”.

Estados sugeridos:

- `available`: pode rodar agora;
- `recommended`: pode rodar, mas há lacunas de qualidade;
- `almost`: faltam poucos campos;
- `blocked`: falta requisito duro;
- `not_applicable`: não faz sentido para o perfil atual;
- `done`: artefato principal já existe.

### 3. UI em etapas

A tela deve ter uma coluna principal e um painel lateral direito.

Coluna principal:

1. Projeto
2. Mercado
3. Oferta
4. Marca
5. Funil
6. Canais
7. Dados
8. Revisão

Painel lateral:

- progresso geral;
- próxima skill recomendada;
- lista de skills por estado;
- ao clicar em uma skill, mostrar:
  - requisitos atendidos;
  - campos faltantes;
  - artefatos faltantes;
  - botão para ir ao campo;
  - comando sugerido, como `/offerbook`.

### 4. Autosave

O autosave deve ter duas camadas.

Primeira camada: autosave local imediato.

- Salvar em `localStorage` ou IndexedDB por `project.slug`.
- Debounce de 500 a 800 ms.
- Indicador discreto: “salvo agora”, “salvando”, “erro ao salvar”.
- Recuperar rascunho quando o navegador reabrir.

Segunda camada: persistência durável.

- Em protótipo standalone: exportar/importar JSON manualmente.
- Em app React com backend: salvar por campanha/projeto, seguindo o padrão já existente de store + camada de persistência.
- Em ambiente local com helper: gravar em `projetos/{slug}/project-brief.json`.

O arquivo durável recomendado:

```text
projetos/{slug}/project-brief.json
```

Opcionalmente gerar também:

```text
projetos/{slug}/project-brief.md
```

### 5. Importação de arquivos existentes

Para não obrigar o usuário a preencher tudo de novo, a tela deve importar dados de:

- `offerbook.md`;
- `DESIGN.md`;
- `funil.md`;
- `copy.md`;
- `avatar.md`;
- dossiês em `espiao/`;
- briefs de swipe;
- `pendencias.md`.

Cada campo importado deve guardar origem:

- `user`: preenchido pelo usuário;
- `artifact`: extraído de arquivo;
- `inferred`: inferido pela tela;
- `pending_confirmation`: precisa de confirmação;
- `not_applicable`: não se aplica.

Essa origem é importante porque “inferido” não deve desbloquear decisões críticas sem confirmação.

## Modelo de dados

O estado salvo deve ter esta forma geral:

```json
{
  "schemaVersion": "0.1.0",
  "project": {},
  "market": {},
  "offer": {},
  "brand": {},
  "funnel": {},
  "channels": {},
  "data": {},
  "integrations": {},
  "fieldMeta": {
    "project.slug": {
      "source": "user",
      "updatedAt": "2026-07-09T12:00:00.000Z"
    }
  }
}
```

`fieldMeta` não deve ser obrigatório no primeiro protótipo, mas deve ser previsto desde já.

## Como calcular desbloqueio

Para cada skill:

1. Verificar se a skill é aplicável ao perfil.
2. Verificar artefatos obrigatórios existentes.
3. Verificar campos obrigatórios preenchidos.
4. Verificar alternativas (`anyOf`) quando a skill aceita mais de um caminho.
5. Separar campos recomendados ausentes.
6. Marcar como `done` se o artefato principal já existe.

Exemplo:

```text
offerbook
  obrigatório: project.slug, offer.name, project.startingPoint
  recomendado: market.avatarSummary, market.competitors, channels.swipePatterns
  artefatos recomendados: avatar.md, espiao/dossie-*.md, swipe/briefing-swipe-file.md
```

## O que ainda precisa de decisão

### Standalone ou app?

Opção A: evoluir `mapa-skills.html`.

- Mais rápido.
- Funciona como protótipo local.
- Autosave fica limitado ao navegador.
- Escrita em arquivo exige export/import ou servidor local.

Opção B: criar tela no app React em `apps/academia-lendaria-ads-studio`.

- Melhor para autosave real e evolução de produto.
- Reaproveita componentes e padrão de store/persistência já existentes.
- Exige integrar rota, estado e camada de dados.

Recomendação: começar com protótipo standalone se o objetivo é validar UX rápido; migrar para app React quando a estrutura estiver aprovada.

### O que desbloqueia de verdade?

Algumas skills dependem de campos. Outras dependem de artefatos gerados por skills anteriores.

Por isso, a UI deve evitar prometer que uma skill está liberada apenas porque o formulário foi preenchido. O estado correto é:

- “briefing suficiente” quando os campos estão prontos;
- “skill liberada” quando campos e artefatos obrigatórios existem.

### Campos sensíveis

Não salvar tokens/API keys dentro do briefing.

Salvar apenas status:

- `missing`;
- `configured`;
- `not_needed`;
- `unknown`.

A chave real continua no `.env`.

### Campos repetidos por nome, mas não por significado

Alguns inputs parecem repetidos, mas têm granularidade diferente.

Exemplos:

- “ticket” do perfil é uma faixa;
- “preço” da oferta é valor exato;
- “destino do fechamento” é estratégia;
- “CTA link” é implementação por canal.

Esses campos devem continuar separados, mas com rótulos claros.

### Não aplicável

Campo vazio e “não se aplica” são estados diferentes.

Exemplos:

- afiliado pode não ter backend próprio;
- negócio local pode não precisar de e-mail como canal principal;
- pré-lançamento pode não ter métricas CRO reais.

O formulário deve permitir marcar `not_applicable` em campos condicionais.

## Plano de implementação

### Fase 1 — Fundação de dados

- Criar `data/project-brief.schema.json`.
- Criar `data/skill-unlock-rules.json`.
- Criar validação básica para garantir que toda skill canônica tem regra.
- Criar validação básica para garantir que toda regra aponta para campos existentes no schema.

### Fase 2 — Protótipo de UI

- Adicionar tela `briefing` no `mapa-skills.html` ou criar `briefing.html`.
- Renderizar etapas a partir do schema.
- Implementar autosave local.
- Implementar painel lateral lendo `skill-unlock-rules.json`.
- Permitir clicar em uma skill para ir ao campo faltante.

### Fase 3 — Import/export

- Exportar `project-brief.json`.
- Importar `project-brief.json`.
- Gerar resumo em Markdown.
- Mapear dados existentes de `projetos/{slug}/`.

### Fase 4 — Integração com execução

- No mapa de skills, mostrar requisitos do briefing por skill.
- No detalhe da skill, exibir “pronta para rodar” ou “faltam estes campos”.
- Sugerir comando exato.
- Opcionalmente gerar um prompt de handoff para a skill.

### Fase 5 — Persistência real

- Se a tela virar app React, mover o estado para store dedicada.
- Implementar camada de persistência por projeto/campanha.
- Manter export local para ambientes sem backend.

## Próximo passo técnico

Implementar um validador simples:

```bash
node scripts/validate-project-brief-rules.mjs
```

Esse script deve verificar:

- todo campo referenciado nas regras existe no schema;
- toda skill em `.claude/skills/*/SKILL.md` tem regra;
- nenhuma regra referencia skill inexistente;
- as regras JSON são parseáveis.

Depois disso, a UI pode ser construída em cima de dados confiáveis.
