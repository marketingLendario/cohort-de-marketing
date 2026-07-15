---
name: status-funil
description: "Mostra o estado do seu funil — quais peças já estão prontas e qual é a próxima. Lê a pasta projetos/{slug}/ e devolve um checklist do funil (avatar, offerbook, copy, design, página, e-mails, conteúdo, recuperação, CRO), marcando o que existe, o que falta e onde você está. Use quando quiser saber o que já fez e o que vem a seguir no seu funil."
user_invocable: true
---

# Funil Status — mapa vivo do seu funil

Mostra, de um olhar, **em que ponto do funil você está**: o que já foi construído, o que falta e qual é o próximo passo. Não cria nem altera nada — só lê os arquivos do seu projeto e monta o checklist.

> É o "você está aqui" do funil. Rode a qualquer momento entre uma skill e outra.

---

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Esta skill só LÊ dessa pasta.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → liste e mostre o status de cada uma (ou pergunte qual); **nenhuma** → o funil ainda não começou — aponte **`/comecar`** (se o aluno está montando o ambiente) ou **`/avatar-funil`** (pra começar a Aula 1 pela pesquisa). **Nunca aponte `/offerbook` aqui:** o offerbook exige o avatar e devolveria o aluno pro `/avatar-funil` — mande direto pro início certo.

---

## Como funciona (determinístico — contratos + arquivos)

1. Descubra o projeto ativo (acima).
2. Verifique a existência de cada peça em `projetos/{slug}/`:

```
ls projetos/{slug}/avatar.md \
   projetos/{slug}/offerbook.md \
   projetos/{slug}/DESIGN.md \
   projetos/{slug}/funil.md \
   projetos/{slug}/copy.md \
   projetos/{slug}/pagina/ \
   projetos/{slug}/emails/ \
   projetos/{slug}/conteudo/ \
   projetos/{slug}/recuperacao.md \
   projetos/{slug}/back-end.md \
   projetos/{slug}/cro.md 2>/dev/null
```

3. Gere/valide o ArtifactIndex v1 com `scripts/project-artifact-index.mjs` e
   avalie catálogo, regras, ProjectBrief e índice com o contrato público. Artefato
   apenas detectado, mas ainda `pending_confirmation`, não libera requisito crítico.
4. Carregue `skill-surface-contract.js`, `scripts/lib/skill-readiness.mjs` e os
   quatro contratos públicos. Derive `contractRefs` do mesmo SOT e execute:

```js skill-readiness-probe
const contractInputs = { catalog, rules, legacySchema, projectBriefSchema };
const contractRefs = SkillSurfaceContract.createReadinessContractRefs(contractInputs);
const evaluatedSkills = SkillSurfaceContract.evaluateSkills({
  ...contractInputs,
  projectBrief,
  artifactIndex,
  allowPartialProjectBrief: true,
});
const decision = decideNextSkill({
  rules,
  contractRefs,
  evaluatedSkills,
  projectBrief,
  artifactIndex,
});
```

   Mostre exatamente `decision.nextSkill.command` e `decision.reason`; prioridade vem somente de
   `data/skill-unlock-rules.json`, nunca da ordem abaixo nem do filesystem.
5. Monte o checklist na ordem do funil, marcando `[x]` o que existe e `[ ]` o
   que falta. Marque **"você está aqui"** na skill retornada pelo motor. Se o
   motor falhar por regra/estado inválido, falhe fechado e não invente rota.

O recomendador orienta o próximo passo, mas a invocação direta de qualquer skill
continua autônoma: `/status-funil` nunca bloqueia um comando chamado pelo aluno.

---

## A ordem do funil (referência)

A ordem segue a **ordem canônica N12 do `/metodo-funil`** (design antes de copy; recuperação e back-end na posição do N12):

| # | Peça | Arquivo em `projetos/{slug}/` | Skill |
|---|------|-------------------------------|-------|
| 1 | Avatar | `avatar.md` | `/avatar-funil` |
| 2 | Offerbook / Registro da oferta do produtor (afiliado) | `offerbook.md` | `/offerbook` |
| 3 | Identidade visual | `DESIGN.md` | `/design-md` |
| 4 | Diagnóstico do funil | `funil.md` | `/metodo-funil` |
| 5 | Copy | `copy.md` | `/copy-funil` |
| 6 | Página de vendas | `pagina/` | `/pagina-vendas-funil` |
| 7 | E-mails | `emails/` | `/email-funil` |
| 8 | Conteúdo | `conteudo/` | `/conteudo-funil` |
| 9 | Recuperação | `recuperacao.md` | `/recuperacao-funil` |
| 10 | Back-end | `back-end.md` | `/backend-funil` |
| 11 | CRO / teste | `cro.md` | `/cro-funil` |

> As peças de formato alternativo (`vsl.md`, `advertorial.md`, `quiz.md`, `webinario.md`, `lancamento.md`, `whatsapp.md`, `criativos/`, `mockups/`) entram conforme o `/metodo-funil` prescrever — se existirem, liste-as também.

> **Leia o Perfil do Projeto antes de mostrar o checklist (regra dura):** o caminho do funil muda com o tipo de negócio. Leia o **Perfil do Projeto** (topo do `projetos/{slug}/offerbook.md`, regra em `.claude/skills/_shared/perfil.md`) e adapte a lista e o "próximo passo" ao Tipo de oferta:
> - **físico / varejo-local** → o funil é local/regional (Google Perfil/Maps, WhatsApp, oferta no ponto); não aponte quiz→checkout online como próximo passo.
> - **saas-app** → funil de trial/demo; prova = voz do cliente + caso de uso, nunca depoimento de aluno.
> - **serviço / b2b** → fechamento por **reunião** (webinário/quiz → marcar reunião), não checkout nem e-mail direto pra comprar.
> - **afiliado** → o offerbook é o **Registro da Oferta do Produtor** (`offerbook.md` com `Situação de partida: afiliado`); a peça se apoia na oferta do produtor (foco em página-ponte/criativo), sem back-end próprio. Marque a peça 2 como existente quando esse registro estiver na pasta.
>
> **Leia também o campo `Destino do fechamento` do Perfil quando existir** (`venda-direta | reunião`, regra em `.claude/skills/_shared/perfil.md`): se o destino for **reunião**, o "próximo passo" e o checklist falam em agendar/qualificar, nunca em checkout; se for **venda-direta**, seguem no fluxo de checkout. Não presuma o destino — leia-o do Perfil.
>
> **Guard:** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **PROIBIDO** enquadrar o funil como "curso/mentoria de especialista" ou sugerir "depoimento de aluno" como próximo passo — use voz do cliente / prova de uso / case. Se o Perfil não existir, use o padrão e siga (nunca trave). Termos técnicos sempre com uma explicação de leigo ao lado (regra em `.claude/skills/_shared/nunca-travar.md`), ex.: "trial (período de teste grátis)".

---

## Pendências do dono — placar por CHAVE (nunca por linha)

Além das peças, o status lê `projetos/{slug}/pendencias.md` e mostra o placar de decisões que ainda dependem do dono (link de checkout, rosto do especialista, ID do Pixel, janela do bônus etc.).

> **Conte por chave de decisão, não por linha (regra dura — mata o bug do re-run):** cada pendência tem uma **chave estável** = o slug da decisão (regra em `.claude/skills/_shared/pendencias.md`). O placar (abertas / resolvidas) conta **chaves únicas**, então rodar as skills de novo **reconcilia** a lista (mesma chave = mesmo item) e **nunca infla o número** — 14 pendências não viram 17 num re-run. Uma decisão pode afetar vários arquivos; ela conta **uma vez só**. Se `pendencias.md` não existir, não há pendências a mostrar (nunca trave).

Formato:

```
Pendências do dono: 3 abertas · 11 resolvidas   (por decisão, não por linha)
  [ ] checkout-link      afeta: pagina/, emails/, whatsapp.md
  [ ] pixel-id           afeta: pagina/
  [ ] especialista-rosto afeta: criativos/
```

---

## Formato de saída

```
Funil: {slug}   ({N}/11 peças)

[x] 1. Avatar          avatar.md
[x] 2. Offerbook       offerbook.md
[x] 3. Design          DESIGN.md
[x] 4. Diagnóstico     funil.md
[x] 5. Copy            copy.md
[ ] 6. Página          pagina/          <- você está aqui
[ ] 7. E-mails         emails/
[ ] 8. Conteúdo        conteudo/
[ ] 9. Recuperação     recuperacao.md
[ ] 10. Back-end       back-end.md
[ ] 11. CRO            cro.md

Próximo passo: rode /pagina-vendas-funil — monta a página de vendas com a copy + o DESIGN.md.
Razão: Próxima skill: /pagina-vendas-funil (estado recommended, prioridade 9). Requisitos obrigatórios atendidos; 2 recomendações de qualidade seguem pendentes.
```

Sempre termine com as linhas **"Próximo passo:"** e **"Razão:"** copiadas da
decisão do motor. Se `nextSkill` for `null`, explique a ausência explícita com a
razão retornada; não force `/cro-funil` quando a regra disser `done`,
`not_applicable` ou `blocked`.

---

## Regras

**SEMPRE:** só ler (nunca criar/alterar peças) · marcar `[x]`/`[ ]` pela existência real do arquivo · apontar "você está aqui" pela decisão canônica · fechar com comando e razão do motor.

**NUNCA:** inventar que uma peça existe sem checar o arquivo · alterar qualquer peça · pular a descoberta do projeto ativo · escolher a primeira lacuna por ordem hardcoded quando o motor estiver disponível.

## Entrega padrão (texto completo em `.claude/skills/_shared/entrega-padrao.md` — LEIA-o ao fechar a entrega)

Esta skill só LÊ o projeto, mas a entrega do checklist segue o padrão: abra o resultado renderizado (detecte o SO — macOS `open` · Windows `start ""` · Linux `xdg-open`; se não abrir sozinho, ex. Codex, imprima o caminho + como abrir) e envie na conversa; nunca encerre entregando só o caminho. Feche SEMPRE apontando o único comando e a razão retornados por `scripts/lib/skill-readiness.mjs`. Ferramentas: check antes de usar (Chrome pro PDF, fallback imprimir em PDF — `_shared/nunca-travar.md`).
