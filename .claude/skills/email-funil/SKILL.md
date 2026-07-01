---
name: email-funil
description: Gera emails de funil (convite, confirmação, lembrete, recap, nurture e venda) aplicando a SUA identidade visual via design.md, usando o método de email do Alan Nicolas. Usar sempre que você precisar de um email para o seu negócio.
---

# Email Funil — gerador de emails de funil

Gera emails HTML prontos para colar na sua ferramenta de disparo, aplicando o método de email do Alan Nicolas com a identidade visual da sua própria marca.

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Todo o trabalho de um nicho vive em `projetos/{slug}/` (convenção de projeto). Antes de qualquer coisa:

1. **Descubra o projeto ativo:** `ls projetos/ 2>/dev/null` — uma pasta → use-a; várias → pergunte qual; nenhuma → o funil ainda não começou.
2. **Confira que os arquivos das etapas anteriores existem:**

```
ls projetos/{slug}/DESIGN.md projetos/{slug}/offerbook.md 2>/dev/null
```

- Se existir(em), leia deles a identidade visual da sua marca (cores, fontes, header, footer, logo, assinatura) do `projetos/{slug}/DESIGN.md` e o contexto da oferta (produto, transformação, tom) do `projetos/{slug}/offerbook.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra gerar os emails com a cara da sua marca eu preciso do `projetos/{slug}/DESIGN.md`, que sai da skill `/design-md` (e do `projetos/{slug}/offerbook.md` pro contexto da oferta, da skill `/offerbook`). Rode `/design-md` primeiro; quando `projetos/{slug}/DESIGN.md` existir, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Fonte do visual
- **Identidade visual:** o visual vem do SEU `DESIGN.md` (gerado pela skill `design-md`). Cores, fontes, header, footer, logo — tudo sai de lá. Esta skill não fixa nenhuma cor, fonte ou logo: ela aplica o que está no seu DESIGN.md.
- **Regras de tom/marca:** este arquivo + o seu DESIGN.md (voz da marca, assinatura, idioma).

## Fluxo
1. Pegue o briefing: **tipo** de email + **assunto** + **conteúdo** (o que comunicar) + **CTA** (texto + link/destino).
2. Leia o seu `DESIGN.md` e monte o HTML aplicando as cores, fontes, header e footer da sua marca. Preencha os blocos: preheader, eyebrow, headline, subheadline, parágrafos, cards (opcional), CTA, fecho.
3. Salve o arquivo em `projetos/{slug}/emails/`, nomeando por tipo e tema.
4. Rode o **checklist** (abaixo) ANTES de entregar.
5. Abra o HTML para você revisar — nunca dispare a copy sem você revisar.

## Identidade visual (vem do SEU DESIGN.md)
Aplique sempre o que está definido no seu DESIGN.md. A estrutura típica de um email é:
- **Header:** cor de fundo, eyebrow (uppercase, com letter-spacing), headline e subheadline — todos nas cores e fontes da sua marca.
- **Corpo:** fundo e cor de texto da sua marca, 16px, line-height 1.6.
- **CTA:** botão na cor de destaque da sua marca, com bom contraste de texto, cantos arredondados, padding confortável.
- **Cards (foto + texto):** foto redonda com borda na cor de destaque; eyebrow em tom de apoio.
- **Footer:** com a assinatura, logo e links da sua marca, conforme o DESIGN.md.
- **Preheader oculto** (preview da caixa de entrada) sempre no topo, seguido de um spacer.

Se algum elemento não estiver no DESIGN.md, gere o DESIGN.md primeiro (skill `design-md`) — não invente cores nem fontes fixas.

## Regras de tom e marca (NON-NEGOTIABLE)
- **A assinatura é a da sua marca**, conforme o DESIGN.md (você define se assina como a empresa, a equipe ou uma pessoa).
- **Sem emoji** no corpo.
- **Acentuação perfeita** no idioma do email.
- **Nomes de marcas/produtos sempre corretos** (confira a grafia exata).
- **Conferir o texto inteiro** (ortografia, acentuação, nome de marca) antes de fechar.
- Personalização: use a variável de primeiro nome da sua ferramenta de disparo (ex.: um merge tag de FIRSTNAME).
- Evite o contraste espelhado "não é sobre X, é sobre Y".

## Tipos de email (esqueleto)
- **Convite (evento/live):** eyebrow do evento → headline com a promessa → corpo (o que a pessoa vai ver) → agenda/cards → CTA. Se quiser aplicar uma tag no clique, aponte o botão para um endpoint do seu sistema que aplique a tag e redirecione.
- **Confirmação:** "Inscrição confirmada, [nome]" → o que esperar → agenda → reforço do ao vivo.
- **Lembrete (dia do evento):** "Hoje, [horário]" → o que vai rolar → botão **"Entrar agora"** com o LINK do evento.
- **Recap (manhã seguinte):** o que rolou → quem esteve ao vivo já pegou o material → gancho para a próxima.
- **Nurture:** história/valor → 1 ideia → CTA leve.
- **Venda:** oferta → prova → CTA forte. Você escreve a copy de conversão seguindo a sua oferta e o seu playbook de copy.

## Checklist antes de entregar
- [ ] Preheader preenchido (preview da caixa de entrada)
- [ ] Variável de primeiro nome onde personalizar
- [ ] CTA com texto e destino certos (lembrete = link do evento; convite = endpoint/página de obrigado)
- [ ] Sem emoji · acentuação ok · nomes de marca corretos
- [ ] Visual aplicado conforme o seu DESIGN.md (cores, fontes, header, footer, assinatura)
- [ ] Texto relido inteiro (ortografia, marca)
- [ ] Arquivo salvo e aberto para você revisar

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/email-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
