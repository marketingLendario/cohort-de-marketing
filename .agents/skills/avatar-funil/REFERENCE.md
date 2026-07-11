# REFERENCE — Frameworks de pesquisa de dor e avatar

Guia detalhado dos frameworks usados pela skill. O Claude carrega este arquivo só quando precisa do passo a passo de pontuação. Tudo aqui é o método de pesquisa antes da oferta: minerar dor real, construir avatar profundo e testar mensagem em persona sintética.

Os frameworks rodam sobre o material de todas as fontes coletadas (reviews, comunidades, redes). Sempre que possível, anote de qual fonte veio o sinal e cole a frase literal do cliente.

---

## A. Os 4 critérios da dor cara

Dor cara é a que já sangra no caixa antes da sua solução entrar. A pessoa já sabe que está perdendo dinheiro com aquilo, antes de você aparecer. Você não precisa convencer que a dor existe. Pontue cada tema de dor de 0 a 3 em cada critério e some.

| Critério | Peso | O que avaliar | Fraco | Forte |
|----------|------|---------------|-------|-------|
| Frequência | 3 | Com que frequência acontece? | "uma vez por ano" | "toda semana", "todo fechamento de mês" |
| Custo visível | 3 | Dá pra quantificar em reais ou horas? | "atrapalha um pouco" | "perdi 3 clientes", "gasto 20 mil por semana nisso" |
| Controle de orçamento | 2 | Quem sente é quem decide a compra? | "o estagiário sofre" | "o sócio é cobrado por isso na reunião" |
| Palavras literais | 2 | Está escrito como o cliente escreve? | "otimização de SLA" | "ninguém respondeu em 2 horas e perdi a venda" |

Score 8-10: dor cara, tese de oferta. Score 5-7: dor real mas precisa de mais prova de custo ou de decisor. Abaixo de 5: ainda é hipótese, não dor.

O critério que mais separa hipótese de dor real é o **controle de orçamento**. Dor frequente e cara que está nas mãos de quem não assina cheque não vira contrato. É o critério que mais elimina nicho falso.

> Sobre verbatim: dor real não é o que o cliente te conta no almoço. É o que ele escreve quando ninguém está olhando. "Perdi cliente porque ninguém respondeu em 2 horas" é palavra de cliente. "Otimização de SLA de atendimento" é palavra sua. Quando você não pede verbatim explicitamente, a IA parafraseia por default e você perde a voz do cliente. Sempre exija a frase literal.

---

## B. Protocolo de triangulação (reviews + comunidades + redes)

Uma fonte só mente. Duas sugerem. Três confirmam. Por isso cruze sempre três frentes antes de afirmar que uma dor é real.

| Fonte | O que ela revela | Onde buscar |
|-------|------------------|-------------|
| Reviews | dor de quem já comprou; reclamação recorrente é promessa não cumprida | Reclame Aqui, Google Reviews, B2B Stack, Capterra, lojas de app, marketplaces |
| Comunidades | dor discutida entre pares, sem produto envolvido | grupos de Facebook, Reddit, Discord, fóruns do nicho |
| Redes sociais | dor dita em voz alta | Twitter/X, LinkedIn, TikTok, comentários de YouTube e Instagram |

Classifique cada tema depois de cruzar:

- **Dor real** — confirmada em 3 fontes.
- **Hipótese a testar** — aparece em 1 fonte só. Não vire oferta antes de validar com persona sintética.
- **Vácuo de oferta** — aparece em comunidade mas NÃO em review. Isto é ouro: dor real sem solução comprável. Cliente só reclama em review depois de comprar; se não há review, é porque ninguém vende solução ainda. Ausência de review não é ausência de demanda.
- **Nicho a abandonar** — não aparece em nenhuma fonte com consistência.

Quantidade: entre 20 e 50 trechos somando as fontes. Abaixo de 20, a IA enviesa por outliers. Acima de 50, gasta sem ganho. 30 é o ponto ideal.

---

## C. As 7 dimensões da persona

Persona com menos de 7 dimensões é caricatura: tem casca, não tem motor, e na hora de testar mensagem ela reage de qualquer jeito. Persona com as 7 vira interlocutor que reage de forma previsível, como um cliente real reagiria.

| # | Dimensão | O que define | Por que importa |
|---|----------|--------------|-----------------|
| 1 | Demografia | idade, profissão, renda, geografia | a casca; sem o resto, vira ficção |
| 2 | Psicografia | 3 valores, 3 medos, 3 ambições | o motor; o que motiva e o que paralisa |
| 3 | Comportamento atual | o que faz hoje sobre o problema, mesmo mal feito | o ponto de partida real |
| 4 | Voz e vocabulário | expressões que usa, o que NÃO diz | se a mensagem soa familiar |
| 5 | Objeções típicas | os contra-argumentos a qualquer proposta | o que a headline precisa antecipar |
| 6 | Contexto de leitura | onde lê, em que estado, com quanto tempo | o formato da mensagem |
| 7 | Padrão de decisão | rápido ou lento, sozinho ou em grupo, racional ou emocional | o gatilho certo |

Âncora obrigatória: construa o avatar a partir da frase verbatim do cliente (a dor número 1). Sem essa âncora, a IA inventa persona genérica que diz o que você quer ouvir. Com a âncora, ela constrói alguém que poderia ter dito aquela frase.

---

## D. Os 3 perfis decisórios (focus group sintético)

Cliente real não é uma pessoa. São 3 a 5 perfis que compram pela mesma dor por motivos diferentes. Teste sempre em 3:

| Perfil | O que quer | O que o convence | O que o trava |
|--------|------------|------------------|---------------|
| Racional | ROI claro, prova | número, caso com dado, garantia | promessa redonda sem prova |
| Emocional | segurança, identidade, pertencimento | história, "você não está sozinho" | frieza, jargão |
| Pragmático | simplicidade, rapidez, sem fricção | "copia, cola e tá feito", prazo curto | implementação complexa |

A mesma headline ressoa diferente nos 3. Sua headline campeã é a que ressoa em pelo menos 2 dos 3 (nota maior ou igual a 7) sem ofender o terceiro.

### Como ler o resultado do teste

- **Ressoou em 0 ou 1 persona** — refaça a headline. Use a sugestão de refino da persona que chegou mais perto.
- **Ressoou em 2 das 3** — pronta para mídia, desde que não ofenda a terceira.
- **Ressoou nas 3 com nota alta** — desconfie de genérico. Headline universal que não compromete agrada todo mundo e não converte ninguém. Compare com uma versão mais específica: se a específica cai muito, a primeira era genérica; se mantém ou supera, era excelente mesmo.
- **B2B de alto ticket** — a persona que precisa ressoar é a racional, mesmo que as outras não. Em compra de comitê, quem assina precisa defender a decisão com business case. Os outros perfis influenciam, mas o racional é o gate.

### Teste de viés da persona

Se você desconfia que a persona está dizendo o que você quer ouvir, teste com uma headline propositalmente ruim. Se ela der nota alta para algo obviamente fraco, está enviesada. Refaça com vocabulário e objeções mais críticas, puxados do material real do Passo 2.

---

## E. Prompts encadeados (referência de execução)

Os prompts abaixo são o motor que a skill executa, internamente ou colando para o usuário. Sempre exigir verbatim e quantificação.

### Prompt 1 — extrair temas e verbatim de reviews
```
Você é um analista de mineração de dor. Vou colar reviews públicos do nicho [NICHO].
Tarefa: 5 temas de dor mais recorrentes; para cada tema, 3 citações VERBATIM
(palavras literais, sem reescrita) com a fonte; custo visível (R$ ou horas)
quando o cliente mencionar; frequência (alta/média/baixa).
Não parafraseie citações.
Saída: tabela Tema, Citações verbatim, Fonte, Custo, Frequência.
[colar 20 a 50 reviews]
```

### Prompt 2 — cruzar com comunidades
```
Agora vou colar conversas de comunidade (Facebook, Reddit, Discord) onde o público
discute essas dores entre si, sem avaliar produto.
Tarefa: 1) marque quais dos 5 temas anteriores aparecem também aqui;
2) identifique 2 temas NOVOS que aparecem em comunidade mas não em review
(candidatos a vácuo de oferta); 3) 2 citações verbatim de cada tema novo.
[colar conversas]
```

### Prompt 3 — frase-mestre
```
Escolha A dor mais frequente, mais cara, com palavras consistentes nas fontes.
Devolva: 1) a frase exata como o cliente escreve (verbatim, 1ª pessoa);
2) custo médio (R$ ou horas); 3) frequência mensal; 4) quem controla o orçamento
para resolver; 5) verificação dos 4 critérios da dor cara.
```

### Prompt 4 — montar 3 personas
```
Crie 3 personas distintas (decisor racional, emocional, pragmático) a partir da
frase verbatim abaixo. Para cada uma, as 7 dimensões: demografia; psicografia
(3 valores, 3 medos, 3 ambições); comportamento atual; voz e vocabulário
(5 expressões que usa, 3 que NÃO usa); objeções típicas (3); contexto de leitura;
padrão de decisão. Saída: tabela com 3 colunas (uma por persona) e 7 linhas.
Frase verbatim: "[frase do Prompt 3]"
```

### Prompt 5 — testar a mensagem
```
Assuma o papel de cada uma das 3 personas, uma por vez, em 1ª pessoa, e reaja a
esta mensagem como se aparecesse num anúncio para você:
Mensagem: "[headline, ideia ou ângulo]"
Para cada persona: 1) reação imediata em 1 frase; 2) o que chamou atenção;
3) o que gerou objeção; 4) probabilidade de agir 0 a 10; 5) o que mudar para
subir 3 pontos. Síntese final: ressoou em quantas das 3? Qual refino testar?
```

> Diferença ChatGPT/Codex: o GPT tende a parafrasear citações e a reagir em 3ª pessoa. Reforce "não parafraseie" no Prompt 1 e "1ª pessoa" no Prompt 5. No Claude, o verbatim e o papel da persona costumam ser respeitados de primeira.

---

## Red flags (sinais de que a pesquisa ainda não terminou)

- A dor saiu como "preciso melhorar o atendimento" (genérica, sem custo, sem decisor) em vez de "perdi 3 clientes esse mês porque levei mais de 2 horas para responder e o sócio me cobra na sexta".
- Citações parafraseadas em vez de literais.
- Tema afirmado como dor real com base em 1 fonte só.
- Persona que para na demografia e reage sem voz própria.
- Headline que agrada as 3 personas mas não diz nada específico.
- Amostra abaixo de 20 trechos tratada como conclusiva.

---

## Regras de honestidade da análise

- Amostra mínima para afirmar padrão: 20 trechos de pelo menos 2 fontes. Abaixo disso, escreva "leitura parcial".
- Verbatim antes de paráfrase. Citação entra como o cliente escreveu.
- Indique a fonte de cada dor relevante.
- Separe o que é número medido do que é leitura sua.
- Persona sintética não substitui pesquisa com cliente real; substitui o teste cego.
- Toda observação gera uma ação recomendada.
