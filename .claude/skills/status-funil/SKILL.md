---
name: funil-status
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
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → liste e mostre o status de cada uma (ou pergunte qual); **nenhuma** → o funil ainda não começou (aponte `/offerbook` ou a Aula 1).

---

## Como funciona (determinístico — só checa arquivos)

1. Descubra o projeto ativo (acima).
2. Verifique a existência de cada peça em `projetos/{slug}/`:

```
ls projetos/{slug}/avatar.md \
   projetos/{slug}/offerbook.md \
   projetos/{slug}/copy.md \
   projetos/{slug}/DESIGN.md \
   projetos/{slug}/funil.md \
   projetos/{slug}/pagina/ \
   projetos/{slug}/emails/ \
   projetos/{slug}/conteudo/ \
   projetos/{slug}/recuperacao.md \
   projetos/{slug}/cro.md 2>/dev/null
```

3. Monte o checklist na ordem do funil, marcando `[x]` o que existe e `[ ]` o que falta.
4. Aponte **"você está aqui"** na primeira peça que falta, e diga qual skill roda essa peça.

---

## A ordem do funil (referência)

| # | Peça | Arquivo em `projetos/{slug}/` | Skill |
|---|------|-------------------------------|-------|
| 1 | Avatar | `avatar.md` | `/avatar-funil` |
| 2 | Offerbook | `offerbook.md` | `/offerbook` |
| 3 | Diagnóstico do funil | `funil.md` | `/metodo-funil` |
| 4 | Copy | `copy.md` | `/copy-funil` |
| 5 | Identidade visual | `DESIGN.md` | `/design-md` |
| 6 | Página de vendas | `pagina/` | `/pagina-vendas-funil` |
| 7 | E-mails | `emails/` | `/email-funil` |
| 8 | Conteúdo | `conteudo/` | `/conteudo-funil` |
| 9 | Recuperação | `recuperacao.md` | `/recuperacao-funil` |
| 10 | CRO / teste | `cro.md` | `/cro-funil` |

> As peças de formato alternativo (`vsl.md`, `advertorial.md`, `quiz.md`, `webinario.md`, `lancamento.md`, `whatsapp.md`, `criativos/`, `mockups/`, `back-end.md`) entram conforme o `/metodo-funil` prescrever — se existirem, liste-as também.

---

## Formato de saída

```
Funil: {slug}   ({N}/10 peças)

[x] 1. Avatar          avatar.md
[x] 2. Offerbook       offerbook.md
[x] 3. Diagnóstico     funil.md
[x] 4. Copy            copy.md
[x] 5. Design          DESIGN.md
[ ] 6. Página          pagina/          <- você está aqui
[ ] 7. E-mails         emails/
[ ] 8. Conteúdo        conteudo/
[ ] 9. Recuperação     recuperacao.md
[ ] 10. CRO            cro.md

Próximo passo: rode /pagina-vendas-funil — monta a página de vendas com a copy + o DESIGN.md.
```

Sempre termine com a linha **"Próximo passo:"** apontando a skill da primeira peça que falta. Se estiver tudo pronto (10/10), diga que o funil está completo e sugira `/cro-funil` pra otimizar quando tiver dados.

---

## Regras

**SEMPRE:** só ler (nunca criar/alterar) · marcar `[x]`/`[ ]` pela existência real do arquivo · apontar "você está aqui" na primeira lacuna · fechar com o próximo passo.

**NUNCA:** inventar que uma peça existe sem checar o arquivo · alterar qualquer peça · pular a descoberta do projeto ativo.

> **Abra o HTML ao terminar E em todo checkpoint (obrigatório):** toda entrega ao usuário — o resultado final OU um checkpoint de revisão/aprovação no meio da skill — gera um `.html` da peça e termina SEMPRE mostrando: envie o HTML renderizado na conversa (ferramenta de envio de arquivo) E abra no navegador com o comando do sistema do aluno — macOS: `open <arquivo>.html` · Windows: `start "" <arquivo>.html` · Linux: `xdg-open <arquivo>.html` (detecte o SO antes; NUNCA assuma macOS). NUNCA peça aprovação de algo que o usuário não consegue ver renderizado. Nunca encerre entregando só o caminho do arquivo.

## Ferramentas desta skill — check antes de rodar (o aluno nunca trava)

Antes de usar qualquer ferramenta, VERIFIQUE se ela existe na máquina. Se faltar: ofereça a instalação em 1 linha (e PERGUNTE antes de instalar) e SEMPRE dê um fallback sem instalação. Skill nunca trava nem falha em silêncio por ferramenta ausente — ela avisa o que falta e segue pelo fallback.

- **Chrome (headless)** via `scripts/gerar_pdf.sh` — gera os PDF dos entregáveis. Check — macOS: `ls "/Applications/Google Chrome.app"` · Windows (Git Bash): `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"`; no Windows o script também usa o Edge como fallback (já vem instalado). **Fallback sem Chrome:** entregue md+html, abra o `.html` no navegador e oriente imprimir em PDF (Cmd+P no Mac, Ctrl+P no Windows > Salvar como PDF).

