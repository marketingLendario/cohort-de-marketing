---
name: pesquisa-icp
description: "Pesquisa estruturada de ICP (Ideal Customer Profile) com 10 modulos sequenciais. Faz perguntas guiadas ao usuario, coleta dados reais (entrevistas, formularios, reviews), e gera persona estruturada com top 5 dores+citacoes, top 5 desejos+citacoes, 10 palavras obrigatorias, 3 crencas copy-ready, 5 frases literais, diagnostico de mercado e gatilhos de compra. Output em markdown + PDF. Alimenta direto a skill /offerbook. Triggers: 'pesquisa icp', 'pesquisar avatar', 'criar persona', '/pesquisa-icp', 'icp do meu negocio'."
user_invocable: true
---

# Pesquisa de ICP (Ideal Customer Profile)

Esta skill conduz uma pesquisa estruturada de cliente ideal em **10 modulos sequenciais**, partindo de dados reais (entrevistas, formularios, reviews, comentarios) e gerando uma persona aplicavel direto em copy, oferta e media.

A saida desta skill **alimenta direto** a skill `/offerbook`. A regra-mae: **ICP antes de oferta, oferta antes de copy, copy antes de ads**.

Baseada no guia interativo [guia-icp.vercel.app](https://guia-icp.vercel.app/).

---

## Quando usar

- Inicio de qualquer oferta nova (antes de `/offerbook`)
- Revisao de oferta que nao converte (geralmente ICP raso)
- Briefing para equipe de copy ou media buyer
- Pesquisa inicial em nicho novo
- Gatilhos: "pesquisa icp", "pesquisar avatar", "criar persona", "icp do meu negocio"

## Como ativar

`/pesquisa-icp [nicho ou negocio]` — ex.: `/pesquisa-icp escritorio-de-contabilidade`.

Se nao vier o nicho, **pergunte qual e o negocio e PARE** ate receber a resposta.

---

## Pre-requisitos (o que voce precisa ter a mao)

1. **Dados reais de cliente** — escolher pelo menos UMA fonte:
   - Formularios respondidos (Google Forms, Typeform, Tally)
   - Entrevistas transcritas (roteiro de 60 min sugerido no Modulo 0)
   - Reviews publicos (Reclame Aqui, Google Reviews, B2B Stack)
   - Comentarios em redes sociais / comunidades (Facebook, Reddit, Discord)
   - Mensagens de WhatsApp / DMs reais
2. **Minimo de 10 fontes** para validade estatistica minima. Abaixo de 10, marcar tudo como [SUPOSICAO].
3. **Voz da marca/negocio** definida (uma frase: "voce vende X para Y resolvendo Z")

---

## Princypio fundamental

**Persona sem voz literal e ficcao.** Toda secao desta pesquisa precisa de citacoes verbatim (palavras exatas do cliente). Quando nao houver dado, marcar `[SUPOSICAO]` ou `SEM DADO NA PESQUISA`. Persona inventada gera oferta que nao vende.

---

## Pipeline (10 modulos sequenciais)

Cada modulo gera perguntas para o usuario responder. Apos coletar todas as respostas, gerar a sintese final.

### Modulo 0 — Coleta de dados

Antes de comecar os 10 modulos, validar:
- Voce tem **quantas fontes** de dados reais? (alvo: 10+)
- Quais sao? (formularios, entrevistas, reviews, comentarios)
- Tem **citacoes literais** disponiveis? (sim/nao)
- Voce ja conhece o nicho ou esta entrando? (relevante para nivel de [SUPOSICAO])

> Se < 10 fontes: avisar que persona vai sair com mais [SUPOSICAO] e sugerir coletar mais antes.

### Modulo 1 — Demografia

Coletar:
- Faixa etaria (com %, ex: "70% entre 35-50 anos")
- Genero
- Localizacao geografica
- Renda media
- Profissao / cargo
- Estado civil
- Filhos

Cada dado com **N** (numero de respostas) e **%**. Sem N → [SUPOSICAO].

### Modulo 2 — Mapa de empatia (4 quadrantes)

Para cada quadrante, **3 citacoes literais**:

- **O que pensa e sente** (medos, ambicoes, frustracoes internas)
- **O que ve** (ambiente, concorrentes, midia que consome)
- **O que fala e faz** (atitude publica, comportamento)
- **O que ouve** (chefe, familia, parceiros, influencias)

### Modulo 3 — Jobs-to-be-Done (JTBD)

Tres dimensoes:

- **Job funcional** (a tarefa pratica que ele quer realizar)
- **Job emocional** (como ele quer se sentir realizando isso)
- **Job social** (como ele quer ser percebido pelos outros)

Para cada job, citacao literal de cliente que ilustra.

### Modulo 4 — Dores e desejos

Lista expandida (~10-15 itens) por categoria:
- **Dores funcionais** (problemas praticos quantificaveis)
- **Dores emocionais** (sentimentos negativos recorrentes)
- **Dores sociais** (medos de imagem/status)
- **Desejos funcionais**
- **Desejos emocionais**
- **Desejos sociais**

Cada item com citacao literal. Marcar [SUPOSICAO] sem dado.

### Modulo 5 — Crencas e objecoes

- **5 crencas atuais** que sustentam o problema (o que ele acredita hoje que o paralisa)
- **5 crencas necessarias** para comprar (o que ele precisa acreditar para fechar)
- **5 objecoes principais** (verbatim, no formato "Eu nao compro porque...")
- **5 objecoes ocultas** (o que ele nao verbaliza mas pesa)

### Modulo 6 — Psicografia

- **Valores centrais** (3-5)
- **Estilo de vida** (rotina, lazer, consumo)
- **Personalidade** (introvertido/extrovertido, racional/emocional, etc.)
- **Comportamento de compra** (impulsivo, comparador, fiel, etc.)
- **Influenciadores que segue**
- **Midias que consome** (podcasts, newsletters, perfis)

### Modulo 7 — Arquitetura da linguagem

Saida obrigatoria desta pesquisa:

- **Top 10 palavras obrigatorias** (que o cliente usa repetidamente, com frequencia documentada)
- **Top 5 palavras proibidas** (jargon ou termos que afastam ele)
- **Tom de voz preferido** (formal/casual, tecnico/coloquial, agressivo/calmo)
- **Estrutura de frase favorita** (curta direta, narrativa, perguntas, comandos)
- **Niveis de consciencia** (Eugene Schwartz: inconsciente → consciente do problema → consciente da solucao → consciente do produto → mais consciente)

### Modulo 8 — Diagnostico de mercado

- **Tamanho estimado** do nicho
- **Maturidade** (emergente, crescimento, maduro, declinio)
- **Saturacao de oferta** (vazio, medio, saturado)
- **3-5 concorrentes principais** (com posicionamento de cada em 1 frase)
- **Brecha competitiva** (onde nenhum concorrente atua bem)
- **Ticket medio do mercado**
- **Tendencias relevantes** (3-5 com timestamps de quando viraram tendencia)

### Modulo 9 — Sintese final (output da skill)

Documento estruturado com:

1. **Persona Capa** — nome ficticio + foto sugerida + 1 paragrafo de abertura
2. **Top 5 dores** com citacao literal de cada
3. **Top 5 desejos** com citacao literal de cada
4. **Top 10 palavras obrigatorias**
5. **3 crencas prontas para copywriting** (em formato copy-ready)
6. **5 frases literais poderosas** (verbatim, prontas para virar headlines)
7. **Diagnostico de mercado consolidado** (1 pagina)
8. **5 gatilhos de compra** (o que faz ele decidir fechar)
9. **Lacunas e proximos passos** (o que falta de dado, por que, como conseguir)

### Modulo 10 — Validacao

Checklist de qualidade (todos devem passar antes de declarar pronto):

- [ ] Cada secao tem citacao literal OU esta marcada [SUPOSICAO]
- [ ] Demografia tem N e % em cada dado
- [ ] Top 10 palavras tem frequencia documentada
- [ ] Crencas estao em formato copy-ready (frases curtas, primeira pessoa)
- [ ] Diagnostico de mercado cita fontes
- [ ] Concorrentes mapeados (minimo 3)
- [ ] Lacunas explicitas em secao propria
- [ ] Validado contra o roteiro de entrevista de 60 min (se feito)

---

## Output

A skill gera **3 arquivos** ao final:

1. `icp-{nome-negocio}.md` — versao markdown completa, alimenta direto `/offerbook`
2. `icp-{nome-negocio}.html` — versao apresentavel (design Lendaria, para print ou PDF via navegador)
3. `icp-{nome-negocio}-resumo.md` — versao 1 pagina (capa + top 5 + top 10 palavras + gatilhos)

Para gerar PDF: abrir o `.html` no navegador, Cmd+P (Mac) ou Ctrl+P (Win) → Salvar como PDF.

---

## Roteiro de entrevista de 60 minutos

Quando voce nao tem dados reais, faca **5 entrevistas** com clientes/leads usando este roteiro:

**0-5 min — Quebra-gelo**
- "Me conta um pouco do seu dia a dia profissional."

**5-15 min — Contexto e desafios**
- "Qual o maior desafio que voce enfrenta hoje em [area do seu nicho]?"
- "Como esse desafio impacta o seu dia?"
- "Quanto isso custa pra voce (em tempo, dinheiro, energia)?"

**15-30 min — Solucoes tentadas**
- "O que voce ja tentou pra resolver isso?"
- "Por que nao funcionou?"
- "O que voce esta evitando fazer e por que?"

**30-45 min — Desejos e crencas**
- "Se voce resolvesse isso amanha, como seria sua vida?"
- "Quem voce vai mostrar primeiro?"
- "O que voce acredita que precisa pra resolver isso?"

**45-55 min — Objecoes**
- "O que faria voce NAO comprar uma solucao pra isso?"
- "Ja viu alguma solucao? O que te impediu?"

**55-60 min — Linguagem**
- "Se voce contasse pro seu melhor amigo, como descreveria esse problema?"
- "Que palavras voce usaria?"

> Sempre gravar (com permissao) e transcrever. Citacao literal e ouro.

---

## Erros fatais (evitar sempre)

1. **Persona inventada** — sem dados reais, vira ficcao que nao converte
2. **Demografia sem N** — "homem de 35 anos" sem amostra e palpite
3. **Palavras suas, nao do cliente** — sempre verbatim
4. **Pular Modulo 7 (linguagem)** — sem isso a copy soa generica
5. **Diagnostico sem concorrente** — voce nao sabe onde esta competindo
6. **Sem lacunas explicitas** — toda pesquisa tem buracos, esconder vira problema na execucao
7. **Generalizar de 3 entrevistas para "o mercado todo"** — minimo 10 fontes

---

## Conexao com outras skills

```
/pesquisa-icp (esta skill)
    ↓ output: icp-{nome}.md
/offerbook
    ↓ output: offerbook-{nome}.md
/competitor-analysis (paralelo, alimenta offerbook tambem)
/trend-hunting (paralelo, alimenta criativos)
/swipe-file (consolida criativos winners para passar pro Media Buyer)
```

A ordem importa. ICP primeiro. Sem ele, oferta vira chute e copy vira tiro no escuro.

---

## Checklist final (antes de declarar pronto)

**Fundacao**
- [ ] Nicho ou negocio especificado pelo usuario (nao inventado)
- [ ] Minimo 10 fontes de dados reais ou [SUPOSICAO] marcado
- [ ] Voz da marca clara

**Modulos**
- [ ] Modulo 1-9 completos
- [ ] Modulo 10 (validacao) passou

**Output**
- [ ] Arquivo `.md` gerado e legivel
- [ ] Arquivo `.html` gerado (design Lendaria opcional)
- [ ] Arquivo `resumo.md` de 1 pagina gerado
- [ ] Lacunas listadas explicitamente

**Gate final**
- [ ] Apresentado para aprovacao do dono do negocio
- [ ] Citacoes literais conferidas contra a fonte
- [ ] Pronto para alimentar `/offerbook`

---

## Referencia

Versao web interativa deste guia: [guia-icp.vercel.app](https://guia-icp.vercel.app/)
