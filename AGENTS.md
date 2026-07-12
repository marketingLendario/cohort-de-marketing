# Cohort de Marketing — instruções para o agente (Codex e afins)

Este repositório é o material do Cohort de Marketing (Academia Lendária). O trabalho acontece por **skills**: comandos prontos que executam uma etapa do funil.

## Onde as skills vivem

Todas as skills canônicas estão em **`.claude/skills/{nome}/SKILL.md`** (uma pasta por skill, com scripts e KBs dentro). A pasta **`.agents/skills/` é um espelho literal** para o Codex carregar as mesmas skills; não edite divergindo dela. Quando o usuário digitar `@{nome}`, `/{nome}` ou pedir pela skill por extenso (ex.: "roda o comecar", "quero o offerbook"), **leia o arquivo `.claude/skills/{nome}/SKILL.md` e execute-o fielmente**, incluindo os arquivos compartilhados que ele referencia em `.claude/skills/_shared/`.

## O primeiro comando

O aluno sempre começa por **`comecar`** (`.claude/skills/comecar/SKILL.md`): prepara o ambiente (git, chave do Apify no `.env`, atalhos) e aponta a primeira skill do funil. Se o usuário parecer perdido ou o ambiente der erro, execute essa skill.

## Skills disponíveis

`comecar` · `avatar-funil` · `espiao-do-concorrente` · `trend-hunting` · `swipe-file` · `offerbook` · `design-md` · `metodo-funil` · `copy-funil` · `quiz-funil` · `webinario-funil` · `vsl-funil` · `advertorial-funil` · `lancamento-funil` · `pagina-vendas-funil` · `email-funil` · `whatsapp-funil` · `conteudo-funil` · `criativos-funil` · `mockup-produto-funil` · `bonus-funil` · `backend-funil` · `recuperacao-funil` · `cro-funil` · `status-funil` · `zelador` · `briefista` · `estruturador` · `ads-creative-factory` · `leitor-de-metricas` · `diagnosticador`

## Regras gerais (valem em qualquer agente)

- Todo o trabalho de um projeto vive em `projetos/{slug}/` — o estado são os ARQUIVOS, não o chat.
- Português com acentuação correta, sem emoji nos entregáveis.
- Nunca prometa que um HTML "abre sozinho": entregue o caminho do arquivo + como abrir no sistema do aluno (regra completa em `.claude/skills/_shared/nunca-travar.md`).
- Siga as regras compartilhadas de `.claude/skills/_shared/` (perfil do projeto, entrega padrão, Book do Funil, pendências).
