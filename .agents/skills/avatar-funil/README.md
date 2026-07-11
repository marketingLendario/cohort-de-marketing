# Pesquisa de Avatar

Uma skill que faz pesquisa de mercado antes da oferta. Você dá o nicho ou o produto e ela faz três coisas:

1. **Minera a dor real** do seu público varrendo fontes públicas (reviews, comunidades, redes) e devolve as dores ranqueadas com a frase exata do cliente (verbatim), o custo de cada dor e a fonte de onde saiu.
2. **Monta o avatar** em 7 dimensões, ancorado nessa dor real.
3. **Roda um focus group sintético**: testa a sua headline ou ângulo em 3 personas de perfis diferentes (racional, emocional, pragmático) e diz o que ressoou, o que gerou objeção e o que mudar, antes de você gastar um real em mídia.

O princípio é simples: a dor real não está na sua cabeça. Está em texto público de gente bravo. A IA lê isso rápido. A skill cruza três frentes (uma fonte mente, duas sugerem, três confirmam):

- **Reviews:** Reclame Aqui, Google Reviews, Capterra, B2B Stack, lojas de app. Dor de quem já comprou.
- **Comunidades:** grupos de Facebook, Reddit, Discord. Dor discutida entre pares.
- **Redes:** Twitter/X, LinkedIn, TikTok, comentários de YouTube e Instagram. Dor dita em voz alta.

Funciona de dois jeitos:
- **Com acesso à internet:** ela mesma vai atrás do material nas fontes e cruza tudo.
- **Sem internet:** você cola o que tiver (reviews, prints, comentários) e ela faz a mesma análise.

No relatório, cada dor vem com a fonte de onde saiu, e a frase entra como o cliente escreveu.

---

## Instalar em 3 passos

### No Claude (claude.ai — planos Pro, Max ou Team)

1. Baixe o arquivo `avatar-funil.zip`.
2. No Claude, abra **Settings > Capabilities > Skills** e clique em **Upload skill**. Selecione o .zip.
3. Volte para uma conversa e escreva: **"faz pesquisa de avatar do nicho [seu nicho]"**. Pronto.

### No Claude Code (terminal)

1. Descompacte a pasta `avatar-funil`.
2. Coloque ela dentro de `~/.claude/skills/` (uso pessoal; no Windows, `C:\Users\SeuNome\.claude\skills\`) ou de `.claude/skills/` (dentro de um projeto).
3. Abra o Claude Code e peça: **"faz pesquisa de avatar do [nicho]"**. A skill carrega sozinha quando o assunto bate.

> Dica: o nome da pasta tem que continuar com o `SKILL.md` dentro dela. Não renomeie o arquivo `SKILL.md`.

---

## Como usar

Depois de instalada, é só falar naturalmente. Exemplos:

- "faz pesquisa de avatar do nicho de escritórios de contabilidade"
- "minera a dor do público de clínicas odontológicas"
- "monta o avatar de quem compra [seu produto]"
- "testa essa headline em personas antes de eu subir o anúncio: [headline]"

Se você não tiver acesso à rede, ela vai te pedir para colar o material. Quanto mais você colar (20 ou mais trechos de pelo menos 2 fontes é o ideal), mais sólida a análise.

### Onde achar o material para colar (modo manual)

- **Reviews:** busque no Google por "[nicho] reclame aqui" e "[nicho] avaliações". Copie a frase do cliente como ela está, sem corrigir.
- **Comunidades:** entre em grupos de Facebook, Reddit ou Discord do nicho e copie os desabafos sobre o problema.
- **Redes:** busque no Twitter/X, LinkedIn e TikTok por quem reclama do problema em voz alta.
- **Headline para testar:** tenha em mãos a headline, ideia ou ângulo que você quer validar.

Cole tudo no Claude e diga de onde veio cada parte. Quanto mais fontes, mais a triangulação confirma a dor.

---

## Não consegue instalar? Use o prompt colável

Se você está num plano que não roda skills, ou só quer testar rápido, abra o arquivo `PROMPT-COLAVEL.md`, copie o texto inteiro e cole numa conversa nova do Claude ou de qualquer IA de chat. Ele faz a mesma análise, sem instalar nada.

---

## O que tem dentro

```
avatar-funil/
  SKILL.md              instruções principais (o cérebro da skill)
  REFERENCE.md          frameworks de pesquisa em detalhe (4 critérios, 7 dimensões, 3 perfis)
  README.md             este guia
  PROMPT-COLAVEL.md     versão colável para quem não instala
  templates/
    avatar.md           o formato do avatar em 7 dimensões
    relatorio.md        o formato do relatório final
    relatorio.html      o formato do relatório em HTML (estilo neutro, personalizável)
  scripts/
    coletor_dor.py      monta as URLs públicas das 3 frentes de dor (com fallback offline)
    gerar_pdf.sh        gera o PDF a partir do HTML
```

---

Baseado no método de pesquisa antes da oferta do Alan Nicolas. Só usa dado público: reviews, comunidades abertas e Reclame Aqui são públicos. Sem login alheio, sem invadir nada. A frase do cliente entra como ele escreveu.
