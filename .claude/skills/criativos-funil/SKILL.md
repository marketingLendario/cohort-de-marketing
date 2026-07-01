---
name: criativos-funil
description: "Espiona a Biblioteca de Anúncios de um concorrente e transforma os ads vencedores em roteiros de criativo prontos, na SUA voz (ou na voz da sua equipe). Pipeline: coletar ads ativos -> baixar vídeos -> transcrever -> analisar (vencedores/hooks/mecanismo) -> gerar roteiros modelados -> calibrar voz -> entregar. Use quando quiser modelar/espionar ads de um concorrente ou gerar criativos em massa para uma campanha."
user_invocable: true
---

# Espião de Ads → Criativos Modelados

Pipeline que vai de "modelar os ads de um concorrente" até "roteiros de ad prontos, na SUA voz, na sua pasta de entrega".

Método baseado no **método do Alan Nicolas**: o concorrente já validou o que funciona (com o dinheiro dele). Você espiona o que está no ar há mais tempo, extrai a estrutura por trás do sucesso e remodela na sua própria voz — sem copiar, e sem reinventar a roda do zero.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output das etapas anteriores do funil. Antes de qualquer coisa, confira que os arquivos existem no seu projeto:

```
ls offerbook-*.md DESIGN.md 2>/dev/null
```

- Se existir(em), leia deles a oferta (mecanismo único, produto, vilão/inimigo) do `offerbook-*.md` e a identidade visual (cores, fontes, tom) do `DESIGN.md`.
- Se FALTAR algum, PARE e exiba um aviso claro apontando qual skill rodar antes:

> Pra gerar os criativos eu preciso do `offerbook-*.md` (da skill `/offerbook`) e do `DESIGN.md` (da skill `/design-md`). Rode `/offerbook` e `/design-md` primeiro; quando os dois existirem, volte e rode esta skill de novo.

Não invente de cabeça o conteúdo que deveria vir da etapa anterior.

---

## Ativação

1. Defina: qual concorrente (o `page_id` dele na Biblioteca de Anúncios do Meta) e qual a SUA oferta/campanha de destino.
2. **Passo 0 obrigatório:** olhe a página/fonte REAL da sua oferta antes de escrever qualquer roteiro. Nunca invente papéis, datas ou CTA de memória — confira no destino real.

## Execução

1. **Coletar** — pegue os anúncios ativos do concorrente na Biblioteca de Anúncios do Meta. A longevidade do anúncio (há quanto tempo está no ar) é o melhor sinal de que é um vencedor.
2. **Baixar** os vídeos. As URLs de mídia do Facebook/Meta EXPIRAM rápido — baixe assim que coletar.
3. **Transcrever** os vídeos (ex.: Whisper). **A fala é o ouro**, não a copy do post — é o roteiro falado que converte.
4. **Analisar** — separe os vencedores (longevidade), mapeie o mecanismo único da oferta, as famílias de hook usadas e os "vilões"/inimigos que o anúncio ataca. Registre tudo num documento de análise.
5. **Validar 1 amostra** antes do batch. Gere UM roteiro, você revisa, e só depois escala para o lote inteiro.
6. **Gerar** os roteiros — variando pelo menos 8 estruturas vencedoras diferentes que você identificou na análise.
7. **Calibrar a voz** — ajuste cada roteiro para a SUA voz (ou a voz da sua equipe), usando transcrições/conteúdos reais seus como referência. Se ainda não tiver material de referência, marque como "primeiro corte" para refinar depois.
8. **Entregar** — exporte os roteiros (ex.: Markdown → documento) e suba na sua pasta de entrega.

## Gates de qualidade (NÃO pular)

- **Anúncio pago é "Meta-safe":** sem cifra de renda nem promessa financeira. Você pega a ESTRUTURA do concorrente e tira as cifras dele. Cifra de faturamento só vale em conteúdo orgânico/página, nunca em ad pago.
- **CTA por canal:** ad pago = "inscreva-se"/"clique"; orgânico/isca = "comenta PALAVRA".
- **Voz:** zero emoji, frases curtas, hook nos primeiros 3 segundos, e nada de fórmulas com cara de IA ("não é X, é Y").
- **Checagem antes de entregar:** confira a quantidade de roteiros, releia as falas (sem CTA trocado, sem cara de IA) e confirme datas e nomes corretos.

## Caso de uso típico

Você escolhe um concorrente forte do seu nicho, coleta os anúncios que estão no ar há mais tempo, transcreve, identifica os 8+ ângulos vencedores e gera um lote de roteiros remodelados na sua voz — prontos para gravar e rodar na sua próxima campanha.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
