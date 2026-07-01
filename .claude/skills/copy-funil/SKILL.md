---
name: copy-funil
description: |
  Pipeline de copy de alta conversao que voce roda no seu proprio projeto. Voce + a IA
  escrevem cada peca aplicando os frameworks dos copywriters lendarios (Schwartz, Ogilvy,
  Halbert, Hopkins, Kennedy, Sugarman e outros) como metodo e referencia.

  Fluxo research-first em fases: Fundacao (diagnostico) -> Estrategia (avatar + oferta) ->
  Criacao (headlines + bullets) -> Peca principal (VSL ou carta de vendas) -> Email ->
  Validacao. Voce revisa em pontos de checkpoint antes de avancar.

  3 fluxos: Lancamento Completo, Trafego Pago e Otimizacao de Funil. Escolha por
  Matriz de Decisao de 5 perguntas.

  Use quando: criar copy de alta conversao, lancamentos de produto, campanhas de
  marketing direto, sales pages, VSLs, sequencias de email ou otimizar funis existentes.
---

# Copy de Funil — Pipeline de Alta Conversao

Pipeline para criar copy de alta conversao aplicando os frameworks dos copywriters lendarios.
Voce e a IA escrevem juntos: a IA assume cada metodo (o diagnostico de Schwartz, a clareza
de Ogilvy, a visceralidade de Halbert, o rigor de Hopkins) como referencia, e voce revisa o
resultado em cada fase antes de seguir.

Nao e preciso ter nenhum squad ou agente instalado: os copywriters entram como **metodo de
escrita**, nao como sistemas que precisam existir no seu projeto.

## Gate de pré-requisito (execute ANTES de tudo)

Esta skill parte do output anterior — o **offerbook** que você montou na etapa da oferta. Confira que o arquivo existe:

```
ls offerbook-*.md 2>/dev/null   # o offerbook real; ignore briefing-offerbook.md (é só o checklist de fontes)
```

- Se existir, leia dele o produto, o avatar, o mecanismo, a oferta e o público — não peça de novo o que já está lá.
- Se FALTAR, PARE e aponte a skill que gera o arquivo:

> Pra escrever a copy eu preciso do `offerbook-{slug}.md` (da skill `/offerbook`). Rode `/offerbook` primeiro e volte.

Não invente o que deveria vir da etapa anterior (a oferta, o avatar, o mecanismo).

## Gate de compliance — nicho sensível

Antes de escrever qualquer promessa, headline ou oferta, verifique se o nicho é **regulado**: saúde/bem-estar/emagrecimento/estética, finanças/investimento/renda, jurídico, ou autoestima/relacionamento com promessa de resultado.

- **Se for**, evite alegação que vira problema legal: "cura", "garantido", "resultado em X dias", "renda garantida", "sem esforço".
- Use **linguagem de possibilidade**: "pode ajudar", "muitas pessoas relatam", "com dedicação". Todo depoimento entra com ressalva: *"resultados variam de pessoa pra pessoa"*.
- Recomende ao aluno **conferir as regras e os órgãos reguladores do mercado dele** — este gate só **alerta**, não é aconselhamento jurídico, e validar é responsabilidade do aluno.
- Isto é um **aviso, não um bloqueio**: a skill segue normalmente, só com a copy calibrada pra não prometer o proibido.

## Visao Geral

```
/copy-funil "descricao do projeto"

Lancamento Completo:
  Fase 1: Fundacao      Diagnostico de awareness (Schwartz) -> base cientifica (Hopkins)
  Fase 2: Estrategia    Avatar + oferta (Kennedy) -> Big Idea + mecanismo (Todd Brown)
    | VOCE REVISA (aprovar Big Idea + Mecanismo)
  Fase 3: Criacao       Headlines (Halbert) + Bullets (Bencivenga)
    | VOCE REVISA (aprovar headlines + bullets)
  Fase 4: Peca Principal VSL (Jon Benson) OU carta de vendas (Halbert)
  Fase 5: Email          Sequencia (Andre Chaperon / Soap Opera)
  Fase 6: Validacao      Auditoria cientifica (Hopkins) + checklist de gatilhos (Sugarman)
```

## Coleta de Informacoes (obrigatoria — todas as 5 perguntas)

### Contexto do Projeto
Colete: Produto/Oferta, Mercado/publico, Objetivo, Materiais ja existentes.

### Matriz de Decisao (5 perguntas)
```
Q1 - Nivel de consciencia: 1.Inconsciente 2.Consciente do problema 3.Consciente da solucao 4.Consciente do produto 5.Mais consciente
Q2 - Sofisticacao:         1.Primeiro no mercado 2.Segundo 3.Maduro 4.Cetico 5.Esgotado
Q3 - Ticket:               1.Baixo(<R$500) 2.Medio(R$500-5K) 3.Alto(R$5K-25K) 4.Premium(R$25K+)
Q4 - Trafego:              1.Frio 2.Morno 3.Quente
Q5 - Peca principal:       1.VSL 2.Carta de Vendas 3.Sequencia de Email 4.Criativo de Anuncio 5.Landing Page 6.Otimizacao de Funil
```

**Validacao**: todos os 5 inputs sao necessarios (contexto + Q1-Q5). Se faltar algum, pergunte antes de seguir.

## Qual fluxo usar

| Condicao | Fluxo | Fases |
|----------|-------|-------|
| Q3=Premium OU (Q3=Alto + Q4=Frio) | Lancamento Completo | 6 |
| Q3=Alto/Medio/Baixo + Q4=Morno/Quente | Trafego Pago | 3 |
| Q3=Medio + Q4=Frio | Trafego Pago | 3 |
| Q5=Otimizacao de Funil | Otimizacao de Funil | 4 |
| Padrao / Ambiguo | Lancamento Completo | 6 |

Apresente a recomendacao. Voce pode trocar o fluxo se quiser.

## Como conduzir

- **Trabalho em fases.** A IA produz a peca de cada fase aplicando o framework indicado, sempre
  partindo do que ja foi decidido nas fases anteriores.
- **Comunicacao por arquivos do seu projeto.** Salve a saida de cada fase em arquivos no seu
  proprio projeto (uma pasta por projeto de copy, do seu jeito) para que a fase seguinte parta dela.
- **Voce revisa nos checkpoints.** Antes de avancar das fases marcadas, leia a saida e aprove ou peca ajuste.

### Principios de copy (sempre respeitar)
- Nao escreva headline antes de diagnosticar o nivel de consciencia.
- Nao pule o diagnostico de Schwartz em trafego frio.
- Sugarman e gatilho de **checklist**, nao de escrita (use para auditar, nao para redigir).
- Use no maximo 15-20 gatilhos por peca — nao force os 30.
- Nao misture vozes que conflitam na mesma peca (ex.: o visceral de Halbert com o seco de Carlton; a elegancia de Ogilvy com a intensidade de Makepeace).
- Nao escreva bullets sem o contexto da headline.
- Nao escreva emails antes da peca principal existir.
- Em trafego frio, sempre rode a "conversa mental" do leitor antes de escrever.

---

## Execucao — Lancamento Completo

### Fase 1: Fundacao (Schwartz -> Hopkins)

**Metodo Eugene Schwartz** (Breakthrough Advertising)
- Frameworks: 5 Niveis de Consciencia, 5 Estagios de Sofisticacao, Canalizacao do Desejo de Massa.
- Missao:
  1. Diagnostique o nivel EXATO de consciencia (1-5).
  2. Diagnostique o estagio de sofisticacao (1-5).
  3. Defina o desejo de massa a canalizar.
  4. Indique a direcao de headline adequada ao nivel de consciencia.
  5. Documente as implicacoes para as fases seguintes.

**Metodo Claude Hopkins** (Publicidade Cientifica) — depois de Schwartz
- Missao:
  1. Defina resultados mensuraveis.
  2. Estabeleca o que rastrear + baselines.
  3. Crie hipoteses de teste.
  4. Documente os principios cientificos (especificidade, reason-why, prova).
  5. Estabeleca os criterios de auditoria para a Fase 6.

---

### Fase 2: Estrategia (Kennedy -> Todd Brown)

**Metodo Dan Kennedy** (3M's Triangle, Magnetic Marketing)
- Partindo do diagnostico da Fase 1:
  1. **Mercado**: quem e o comprador? (multidao faminta, dores, linguagem)
  2. **Mensagem**: promessa central, urgencia, objecoes.
  3. **Midia**: canais, formatos.
  4. **Oferta**: nucleo + bonus + garantia + preco.

**Metodo Todd Brown** (Unique Mechanism, Big Marketing Idea) — depois de Kennedy
- Partindo do diagnostico + avatar + estrategia de oferta:
  1. **Mecanismo do Problema** (por que falharam antes, a causa oculta, batize-a).
  2. **Mecanismo da Solucao** (por que ISTO funciona diferente).
  3. **Big Marketing Idea** (uma frase: intelectualmente interessante, emocionalmente irresistivel, impossivel de ignorar).
  4. **Arquitetura de Prova**.

**VOCE REVISA**: leia a Big Idea (uma frase) + resumo do Mecanismo + pontos-chave do Avatar. Aprove antes de seguir.

---

### Fase 3: Criacao (Headlines + Bullets)

**Metodo Gary Halbert** (formulas de headline, estrutura de carta de vendas)
- Crie as 25 melhores headlines: 8 de historia/curiosidade + 8 de beneficio direto + 5 baseadas em mecanismo + 4 emocionais.
- Ranqueie as 25 e selecione as 5 melhores para teste, com justificativa por nivel de consciencia.

**Metodo Gary Bencivenga** (fascinations, equacao da persuasao)
- Crie 30 bullets de fascination + 20 bullets de beneficio.
- Selecione os 15 melhores para a peca de vendas e os 5 melhores para anuncios.
- Marque o principio de persuasao usado em cada bullet.

**VOCE REVISA**: leia as 5 melhores headlines + os 15 melhores bullets. Aprove antes de seguir.

---

### Fase 4: Peca Principal (baseada em Q5)

Se Q5=VSL -> metodo Jon Benson. Se Q5=Carta de Vendas ou padrao -> metodo Gary Halbert.

**Se VSL — Metodo Jon Benson** (5 passos do VSL)
- Roteiro completo: 1. Abertura com sugestao 2. Amplificacao do problema 3. Historia do heroi relutante 4. Preview da solucao (Big Idea + Mecanismo) 5. Oferta e fechamento etico.
- Integre as melhores headlines, os melhores bullets, a estrutura de oferta e linguagem adequada ao nivel de consciencia.

**Se Carta de Vendas — Metodo Gary Halbert**
- Carta completa: 1. Headline (a melhor da Fase 3) 2. Lead (historia, casada com o nivel de consciencia) 3. Corpo (Problema -> Mecanismo -> Solucao -> Prova) 4. Bullets (os melhores da Fase 3) 5. Oferta (stack completo) 6. Fechamento (urgencia + garantia + CTA) 7. P.S. (reforco do beneficio + prazo).

---

### Fase 5: Email (Soap Opera Sequence)

**Metodo Andre Chaperon** (Soap Opera Sequence)
- Partindo da peca principal + avatar + Big Idea + oferta:
  1. **Sequencia de Lancamento (5 emails)**: Montar o palco -> Alta tensao -> Epifania -> Beneficios ocultos -> Urgencia. Cada email: final em suspense, referencia a Big Idea, link para a peca de vendas, casado com o nivel de consciencia.
  2. **Carrinho Abandonado (4 emails)**: 1h lembrete leve -> 24h historia + prova -> 48h objecao -> 72h urgencia final.

---

### Fase 6: Validacao (Hopkins -> Sugarman)

**Auditoria Hopkins** (cientifica)
- Audite TODA a copy. Pontue 7 dimensoes de 1-10 (especificidade, reason-why, prova, desperdicio, consistencia, validacao da headline, oferta). Nota geral /100. Recomendacoes para notas <7. Sugestoes de teste A/B.

**Checklist Sugarman** (30 gatilhos psicologicos — como ferramenta, nao como escrita)
- Sobre a peca principal:
  1. Identifique os gatilhos presentes.
  2. Conte (espere 15-20).
  3. Aponte os de alto impacto que faltam (#1 Consistencia, #5 Reason-Why, #7 Honestidade, #14 Storytelling, #16 Especificidade, #26 Esperanca).
  4. Recomende adicionar 3-5 de forma natural. Limite: maximo 20 no total.

---

## Variacoes de Fluxo

### Trafego Pago — 3 Fases
- **Fase 1: Diagnostico** — Schwartz (consciencia + sofisticacao), depois Kennedy (avatar). Voce revisa.
- **Fase 2: Copy de Anuncio** — Halbert (20+ headlines + anuncios multi-plataforma). Voce revisa.
- **Fase 3: Landing Page + Email** — Halbert (landing page), depois Kennedy (thank-you + nurture de 5 emails).

### Otimizacao de Funil — 4 Fases
Para funis EXISTENTES com dados.
- **Fase 1: Diagnostico** — Hopkins (auditoria cientifica) + Schwartz (checagem de consciencia). Analise de gap em 6 dimensoes. Voce revisa.
- **Fase 2: Correcoes** — Halbert (headlines + lead) + Kennedy (oferta + CTA). Prioridade: Headline > Lead > Oferta > CTA > Prova. Voce revisa.
- **Fase 3: Gatilhos** — Auditoria Sugarman (adicionar 5-10 que faltam) + verificacao Hopkins (manter especificidade).
- **Fase 4: Setup de Teste A/B** — Hopkins. Tamanho de amostra, uma variavel por teste, 95% de confianca.

---

## Finalizacao

### Resumo
Apresente: fluxo usado, respostas da matriz de decisao, todas as pecas criadas, nota Hopkins, contagem Sugarman, frameworks aplicados, proximos passos (revisar, implementar mudancas, montar testes A/B, lancar).

### Proximos Passos
Ofereca: revisar uma peca em detalhe, refazer uma fase, iniciar um fluxo complementar.

## Notas
- Comunicacao entre fases sempre por arquivos do seu projeto (nao por mensagens).
- Se uma fase precisar ser refeita, refaca a fase — nunca desfaca o que ja foi aprovado.
- A IA aplica os frameworks sob demanda em cada fase.
- Os copywriters lendarios entram como metodo/referencia de escrita — voce + a IA escrevem a copy.

---

## Output nos 3 formatos (md + html + pdf) — igual à Aula 1

Todo entregável desta skill sai em **3 formatos**, com o mesmo nome-base:

1. **`.md`** — o conteúdo (fonte de verdade).
2. **`.html`** — versão estilizada no padrão visual do cohort (paleta dark + champagne, fontes Source Serif 4 + Inter, cards). Use o `offerbook-*.html` ou `relatorio-avatar.html` como referência de estilo. CSS inline, self-contained, sem emoji, português acentuado.
3. **`.pdf`** — gerado a partir do html:

   ```
   bash .claude/skills/copy-funil/scripts/gerar_pdf.sh <arquivo>.html
   ```

Salve os 3 e confirme ao final. Nunca entregar só o `.md`.

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
