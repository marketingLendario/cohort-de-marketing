---
name: iniciar-trafego
description: Inicia a ponte da Aula 2 para a Aula 3 em um projeto identificado, valida os insumos, propõe o Painel da Semana, sincroniza o Marketing Studio e pergunta apenas se o aluno quer abrir.
user_invocable: true
---

# Iniciar Tráfego

Esta é a única porta que o aluno usa para iniciar a operação de tráfego. O fluxo é orientado pelo código; não reimplemente descoberta, validações, instalação, sincronização ou retomada na conversa.

Leia os contratos compartilhados `.claude/skills/_shared/nunca-travar.md`, `.claude/skills/_shared/entrega-padrao.md` e `.claude/skills/_shared/handoff-padrao.md` quando existirem.

## 1. Resolver o projeto

Se o pedido trouxer um caminho, execute diretamente:

```bash
node scripts/iniciar-trafego.mjs select --project="<caminho informado>" --json
```

Sem caminho explícito:

```bash
node scripts/iniciar-trafego.mjs discover --json
```

Siga o resultado:

- zero candidatos: apresente as rotas devolvidas pelo worker; não invente pasta;
- um candidato: execute `select` com o `projectRoot` devolvido;
- vários candidatos: mostre nome e caminho de cada candidato e pergunte somente qual projeto será iniciado; depois execute `select`;
- candidato excluído ou ambíguo: apresente o motivo e as opções devolvidas; não escolha silenciosamente.

Nunca reorganize, mova ou renomeie os projetos durante a descoberta.

## 2. Assessment

Com o caminho absoluto selecionado:

```bash
node scripts/iniciar-trafego.mjs start --project="<projectRoot>" --json
```

- `PROPOSAL_SEED_READY`: prossiga para a proposta.
- `BLOCKED`: apresente cada pendência estruturada e seu `routeCommand`. Não copie template, não grave painel e não delegue ao aluno a tarefa de lembrar de voltar.
- `STALE` ou erro: apresente o código e a ação retomável devolvida pelo worker.

O JSON é a fonte de verdade. Não faça checklist paralelo por leitura manual dos arquivos.

Se o único bloqueio tratável for URL publicada ainda não registrada, solicite a URL e execute:

```bash
node scripts/iniciar-trafego.mjs set-page-url --project="<projectRoot>" --url="<https://...>" --json
```

A URL só se torna canônica após verificação do worker.

## 3. Proposta e aprovação

```bash
node scripts/iniciar-trafego.mjs propose --project="<projectRoot>" --json
```

Mostre a proposta persistida e aguarde aprovação textual explícita. Use o texto literal e o `proposalId` retornado:

```bash
node scripts/iniciar-trafego.mjs approve --project="<projectRoot>" --proposal-id="<proposalId>" --approval-text="<texto literal>" --json
```

O comando chama internamente o lifecycle de `/iniciar-studio`, instala ou atualiza dependências quando possível, garante Docker/Supabase/BFF, aplica migrations, sincroniza, faz readback fail-closed e só então promove o painel.

- `OPEN_DECISION`: sincronização e readback foram verificados. Pergunte exatamente: **Quer abrir?**
- `STUDIO_SYNC_FAILED`, `STUDIO_READBACK_FAILED` ou `STALE`: não declare pronto; apresente a ação retomável.
- ausência de distribuição oficial ou plataforma suportada: reporte o bloqueio estruturado; nunca transforme `unverified` ou `unsupported` em PASS.

Se a resposta a **Quer abrir?** for sim:

```bash
node scripts/iniciar-trafego.mjs open --project="<projectRoot>" --json
```

Se for não:

```bash
node scripts/iniciar-trafego.mjs open --project="<projectRoot>" --decline=true --json
```

“Não” recusa apenas a interface. O projeto já permanece sincronizado. Não pergunte se quer sincronizar e não peça um segundo comando ao aluno.

## 4. Retomada

Quando houver run persistido:

```bash
node scripts/iniciar-trafego.mjs resume --project="<projectRoot>" --execute --json
```

Use `status` apenas para diagnóstico:

```bash
node scripts/iniciar-trafego.mjs status --project="<projectRoot>" --json
```

O worker decide a próxima ação pelo run-state. Não reconstrua estado pela memória da conversa.

## 5. Encerramento

Somente `READY_FOR_ZELADOR` autoriza o handoff para `/zelador`. Entregue:

- projeto e `projectId`;
- estado final;
- painel promovido e receipt verificado;
- se abriu ou não abriu;
- próximo comando único: `/zelador`.

## Vetos

- Não editar o Painel manualmente para contornar o worker.
- Não usar `aula-03/templates/PAINEL-DA-SEMANA.yaml`.
- Não inferir URL publicada pela primeira URL encontrada em HTML.
- Não aceitar pixel comentado, placeholder ou checkout incompatível com o modo de conversão.
- Não alimentar expected com dados observados no readback.
- Não orientar `/iniciar-studio` como segundo comando da jornada.
- Não declarar pronto sem receipt, readback e estado `READY_FOR_ZELADOR`.

## Prova determinística

Antes de declarar uma entrega de código pronta:

```bash
node scripts/validate-iniciar-trafego-complete-journey.mjs
```

O agregador deve executar todos os subvalidadores e falhar se qualquer um não rodar ou não passar. Provas live indisponíveis permanecem `UNVERIFIED`; plataformas sem artefato oficial permanecem `UNSUPPORTED`.
