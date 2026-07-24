# GUIA COMO SER GUIADO — deixar a IA te levar pela mão (a habilidade que ninguém ensina)

> **Estou perdido em:** "eu tenho a IA e tenho os guias… mas fico travado sem saber o que PEDIR pra ela".
> **O que você vai ter no final:** os 4 prompts que destravam qualquer situação + os atalhos por cenário. Ser guiado é uma habilidade — e cabe numa página.
> **Fontes cruzadas:** os prompts ditados AO VIVO no PS de 21/07 (a mini-lição que nasceu quando um aluno contou que nunca tinha pedido "me guie") · os atalhos por situação do manual interno de operação · o funcionamento real do Claude Code (ele LÊ arquivos que você aponta).

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🧰 Ferramenta | Claude Code (ou Codex) aberto na raiz do projeto | [guia-instalar-claude-e-codex](guia-instalar-claude-e-codex.md) |

## A ideia em 1 frase

A IA enxerga os seus arquivos e sabe pesquisar — **o gargalo é você pedir do jeito certo**. Os 4 prompts abaixo cobrem 90% das situações; copie e cole trocando o que está entre colchetes.

## Os 4 prompts que destravam tudo

| # | Situação | Cole isto |
|---|---|---|
| 1 | **Travado num passo** | "Estou tentando fazer [X] e estou preso NISTO aqui: [cole o print ou a mensagem de erro]. Me guie passo a passo a partir daqui." |
| 2 | **Erro que você não entende** | "Quando eu faço [X], acontece [Y]. O que tem que ser feito? **PESQUISE** isso antes de responder." *(a palavra PESQUISE faz a IA buscar na web em vez de chutar)* |
| 3 | **Não sabe se pode começar uma etapa** | "Veja se eu já tenho os pré-requisitos de [etapa/guia X] — faça um **checklist** do que já foi feito e do que falta no meu projeto." |
| 4 | **Tem um guia e preguiça de ler** | jogue o ARQUIVO do guia na conversa (ou o caminho, ex.: `guias/03-conexoes-e-apis/guia-meta-api.md`) e peça: "leia este guia e **me guie por ele**, um passo por vez, conferindo comigo antes de avançar". |

## Atalhos por situação (o mapa rápido)

- **"Não sei nem o que eu já tenho"** → rode `/status-funil` (ele mapeia seu projeto e aponta o próximo passo).
- **"Não sei nem por onde começar"** → rode `/comecar`.
- **Skill recusou/travou** → prompt 1 com o texto EXATO da recusa (as skills explicam o que falta).
- **Tela do site diferente do guia** → "o guia diz [X], minha tela mostra [Y] — me guie" + print.
- **Quer conferir antes de gastar/publicar** → prompt 3, sempre.

## 3 manhas que multiplicam o resultado

1. **Print vale mais que descrição.** "Deu erro" não ajuda; o print/mensagem literal resolve.
2. **UM passo por vez.** Peça explicitamente ("me dê um passo, espere eu confirmar") — evita a IA despejar 20 passos que você não vai seguir.
3. **O progresso mora nos ARQUIVOS.** Pode fechar o chat sem medo e abrir outro: com o prompt 3 a IA reconstrói onde você estava.

## Teste de sucesso

Use o prompt 3 agora: *"faça um checklist do que já foi feito e do que falta no meu projeto pra próxima aula"*. Se a resposta listar seus arquivos reais (de `projetos/{seu-slug}/`) com faltas concretas — funcionou, e você acabou de descobrir seu próximo passo.

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer |
|---|---|---|---|
| I1 | A IA responde genérico, sem olhar seus arquivos | o pedido não apontou arquivo/pasta | inclua o caminho (`projetos/meu-slug/...`, `guias/...`) — apontar arquivo muda tudo |
| I2 | A IA "chuta" solução de erro | faltou mandar pesquisar | use o prompt 2 com a palavra **PESQUISE** |
| I3 | Resposta gigante que você não segue | pediu tudo de uma vez | peça "um passo por vez, espere eu confirmar" |
| I4 | Cada chat novo "esquece" tudo | contexto vive na conversa, não no projeto — mas seus ARQUIVOS ficam | abra o novo chat com o prompt 3 (checklist) ou `/status-funil` |
| I5 | Você nem sabe O QUE perguntar | normal — é o cenário do roteador | abra o [roteador de guias](../README.md), ache a linha "estou perdido em..." mais parecida e use o prompt 4 com o guia dela |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/status-funil` e depois o prompt 3 — em 2 minutos você sabe exatamente onde está |
| 📖 Ler | o guia da etapa que o checklist apontar (o [roteador](../README.md) acha pelo problema) |
| 🚑 Se travar | o catálogo I1–I5 acima — e sim, pode usar o prompt 1 pra pedir ajuda SOBRE este guia |
