/** Conteúdo profundo por skill — academia-fit (25 skills) */

export function buildDepthContent({ ig, tt, igHook, ttHook, date }) {
  const igLines = ig
    .filter((p) => p.caption && p.ownerUsername)
    .map(
      (p, i) =>
        `### Reel ${i + 1} (modelo @${p.ownerUsername}, ${p.likesCount || 0} likes)\n` +
        `**Hook (0-3s):** "${(p.caption || '').split('\n')[0].slice(0, 80)}"\n` +
        `**Corpo (3-45s):** Adaptar para Método Consistência 90. Fase que a pessoa está hoje (Desinflamar / Reprogramar / Manter).\n` +
        `**CTA:** "Faz o diagnóstico gratuito no link da bio."\n`
    )
    .join('\n');

  const ttLines = tt
    .filter((p) => p.text)
    .slice(0, 5)
    .map(
      (p, i) =>
        `| ${i + 1} | ${(p.playCount || 0).toLocaleString('pt-BR')} | "${(p.text || '').slice(0, 60)}..." |`
    )
    .join('\n');

  return {
    funilMd: `# Mapa de Execução — N12 · Academia Fit

Data: ${date}
Projeto: academia-fit · Nicho: emagrecimento sustentável · Mulheres 35+

## Diagnóstico de consciência (Schwartz)

| Campo | Valor |
|-------|-------|
| Nível | **4** — consciente do problema |
| Dor dominante | Efeito sanfona: "Já tentei de tudo, perco 3kg e volto tudo" |
| Ticket | Baixo (R$ 497 entrada) |
| Destino | Venda direta (checkout) |
| Funil prescrito | **Quiz de diagnóstico** → página de resultado segmentada → nutrição → venda |

## Por que quiz e não VSL fria

Público nível 4 já sabe que tem problema, mas não confia em mais uma dieta. O quiz nomeia o perfil (Emocional / Racional / Pragmático) e personaliza a oferta antes do pitch.

## Ordem N12 adaptada (25 skills)

| # | Peça | Skill | Status |
|---|------|-------|--------|
| 1 | Pesquisa avatar | avatar-funil | ✓ |
| 2 | Dossiê concorrente | espiao-do-concorrente | ✓ |
| 3 | Tendências | trend-hunting | ✓ |
| 4 | Swipe file | swipe-file | ✓ |
| 5 | Offerbook | offerbook | ✓ |
| 6 | Design | design-md | ✓ |
| 7 | Diagnóstico funil | metodo-funil | ✓ |
| 8 | Copy fundação | copy-funil | ✓ |
| 9 | Quiz | quiz-funil | ✓ |
| 10 | Página vendas | pagina-vendas-funil | ✓ |
| 11 | E-mails | email-funil | ✓ |
| 12 | Conteúdo orgânico | conteudo-funil | ✓ |
| 13 | Criativos pagos | criativos-funil | ✓ |
| 14 | VSL (paralelo escala) | vsl-funil | ✓ |
| 15 | Advertorial (topo frio) | advertorial-funil | ✓ |
| 16 | Lançamento PLF | lancamento-funil | ✓ |
| 17 | Webinário | webinario-funil | ✓ |
| 18 | WhatsApp | whatsapp-funil | ✓ |
| 19 | Bônus | bonus-funil | ✓ |
| 20 | Mockups | mockup-produto-funil | ✓ |
| 21 | Recuperação | recuperacao-funil | ✓ |
| 22 | Back-end | backend-funil | ✓ |
| 23 | CRO | cro-funil | ✓ |
| 24 | Status | status-funil | ✓ |

## Plano de aquisição

1. **Tráfego pago:** criativos modelados em @emagrecerdevez (Apify) → quiz
2. **Orgânico:** Reels semanais (roteiros em conteudo/)
3. **Recuperação:** cascata carrinho + WhatsApp
4. **Escala:** VSL paralela para público nível 3 após validar quiz

## Você está aqui

Funil montado. Próximo passo operacional: **tráfego no quiz + teste A/B headline** (cro.md).

## KPIs alvo (antes de escalar)

| Etapa | Meta |
|-------|------|
| Quiz → lead | 35% |
| Lead → checkout | 12% |
| Checkout → compra | 25% |
`,

    avatarMd: `# Avatar — Mulheres 35+ · Método Consistência 90

Fonte: relatorio-avatar.md · Coleta Apify jul/2026

## Frase-mestre (dor #1)

> "Já tentei de tudo, perco 3kg e volto tudo."

## 7 dimensões

| # | Dimensão | Conteúdo |
|---|----------|----------|
| 1 | Demografia | Mulher, 35–48 anos, classe B/C, Brasil. Mãe ou profissional em tempo integral. |
| 2 | Psicografia | Medo de falhar de novo. Quer autoestima e energia sem culpa alimentar. |
| 3 | Comportamento | Já tentou 3+ dietas. Abandona na segunda semana ou volta tudo após parar. |
| 4 | Voz | Usa "cansei", "sanfona", "não aguento mais". Evita "regime". |
| 5 | Objeções | Tempo, dinheiro gasto em programas, "não tenho disciplina". |
| 6 | Contexto | Instagram/TikTok à noite, 3 min de atenção, scrollando receitas e antes/depois. |
| 7 | Decisão | Emocional primeiro. Precisa prova social de mulher parecida que manteve 12 meses. |

## Arquétipos do quiz

| Perfil | Dor dominante | Ângulo da oferta |
|--------|---------------|------------------|
| Emocional | Culpa e espelho | Comunidade + suporte sem julgamento |
| Racional | Falta de método | Protocolo 3 fases com marcos claros |
| Pragmático | Falta de tempo | Ritual 12 min + checklist pronto |

## Focus group (headline testada)

Mensagem: "Como perder 8kg em 90 dias sem recomeçar toda segunda-feira"

- Racional 7/10: quer ver estudo ou protocolo em 3 fases
- Emocional 9/10: ressoa "sem recomeçar"
- Pragmático 8/10: pergunta quantos minutos por dia

## Implicação para copy

Falar de **consistência sem culpa**, não de força de vontade. Prova social > promessa numérica.
`,

    vslMd: `# Roteiro VSL — Método Consistência 90

Duração alvo: 18–22 min · Formato: talking head + slides · Tom: marca Academia Fit

## Fase 1 — Hook e identificação (0:00–2:00)

**[TELA: mulher 40+ no espelho]**

"Se você já perdeu peso e voltou tudo, presta atenção nos próximos 18 minutos. Não é mais uma dieta da moda. É um ciclo de 3 fases que ataca o motivo pelo qual você recomeça toda segunda-feira."

**Prova rápida:** print de depoimento (mulher 42 anos, 8kg em 90 dias, manteve 12 meses).

## Fase 2 — Agitação do problema (2:00–6:00)

**Mecanismo do problema:** Dietas atacam a balança, não o ciclo hábito + inflamação + hormônios da menopausa.

- Ciclo sanfona: restrição → perda → liberação → ganho
- Relação tóxica com comida (verbatim Gshow jan/2026)
- "Belly fat won't budge" (Reddit r/fitness40plus)

**Pergunta retórica:** "Quantas vezes você prometeu que desta vez seria diferente?"

## Fase 3 — Mecanismo da solução (6:00–11:00)

**Ciclo de 3 Fases:**

1. **Desinflamar (7 dias):** cardápio anti-inflamação sem cortar grupos
2. **Reprogramar (60 dias):** hábitos + movimento 12 min
3. **Manter (23 dias + vitalício):** protocolo anti-recaída (diferencial vs FitFlow)

**Transição:** "O que separa quem mantém de quem volta é a Fase 3. A maioria dos programas para no dia 21."

## Fase 4 — Oferta e stack (11:00–16:00)

| Item | Valor |
|------|-------|
| Programa 90 dias | R$ 1.997 |
| Comunidade | R$ 497 |
| 3 bônus | R$ 441 |
| **Total** | **R$ 2.935** |
| **Hoje** | **R$ 497** |

Garantia 30 dias. Turma jul/2026: 50 vagas.

## Fase 5 — Fechamento (16:00–20:00)

CTA: botão abaixo do vídeo. Urgência real: turma fecha em 48h.

**Objeções no vídeo:**
- "Não tenho tempo" → 12 min/dia
- "Já tentei de tudo" → Fase Manter é diferente
- "É caro" → R$ 5,52/dia

## Plano de escala

- Funil 1: VSL → checkout (este roteiro)
- Funil 2: Quiz → resultado → checkout (principal N12)
- Funil 3: Advertorial → VSL (público frio nível 5)
`,

    quizMd: `# Quiz — Qual seu perfil de emagrecimento?

Objetivo: segmentar lead nível 4 e casar oferta ao diagnóstico.
Captura: e-mail + WhatsApp na página de resultado.

## Perguntas (5)

### 1/5 — Quantas dietas você já tentou?
- a) Nenhuma → +1 Emocional
- b) 1 a 3 → +1 Racional
- c) Mais de 3 → +1 Pragmático

### 2/5 — O que mais te frustra hoje?
- a) Efeito sanfona → +1 Emocional
- b) Falta de método claro → +1 Racional
- c) Falta de tempo → +1 Pragmático

### 3/5 — Quanto tempo tem por dia?
- a) 10–15 min → +1 Pragmático
- b) 30 min → +1 Racional
- c) 1h+ → +1 Emocional

### 4/5 — Já teve efeito sanfona?
- a) Sim, várias vezes → +1 Emocional
- b) Uma vez → +1 Racional
- c) Não → +1 Pragmático

### 5/5 — O que te motiva mais?
- a) Autoestima → +1 Emocional
- b) Saúde e exames → +1 Racional
- c) Praticidade → +1 Pragmático

## Lógica de resultado

Maior score entre {e, r, p} define o perfil. Empate: prioridade Emocional > Racional > Pragmático.

## Páginas de resultado

| Perfil | Headline | Ângulo da oferta |
|--------|----------|------------------|
| Emocional | "Você não falhou. O método falhou." | Comunidade + suporte |
| Racional | "Seu protocolo em 3 fases" | Dados + marcos semanais |
| Pragmático | "12 minutos por dia. Sem complicação." | Checklist + cardápio pronto |

## Follow-up por resultado

- Emocional: e-mail dia 1 "você não está sozinha" + WhatsApp comunidade
- Racional: e-mail dia 2 "como funciona a Fase 3" + PDF protocolo
- Pragmático: e-mail dia 1 checklist semanal + CTA direto

## Eventos de rastreamento

PageView · quiz_start · quiz_complete · Lead (tag=perfil) · CTA resultado
`,

    advertorialMd: `# Advertorial — 90% das dietas falham após 21 dias

Formato: artigo editorial · Público: nível 5 (frio) · CTA suave → VSL

## Lead editorial

**Nutricionista revela por que a maioria das mulheres 35+ volta ao peso antigo em menos de 6 meses**

Sub: Pesquisa em comunidades online mostra padrão que ninguém discute nas dietas da moda.

## Narrativa (fases)

1. **História:** Maria, 42, analista. Terceira dieta em 2 anos. Perdeu 4kg, ganhou 6.
2. **Agitação:** O problema não é força de vontade. É ausência de fase de manutenção.
3. **Mecanismo:** Ciclo hábito + inflamação + menopausa (sem promessa de cura).
4. **Prova editorial:** Threads Reddit + posts @emagrecerdevez (Apify, ${ig.length} posts coletados).
5. **Transição:** "Existe um protocolo de 3 fases que inclui Manter como obrigatório."
6. **CTA suave:** "Assista à explicação completa no vídeo abaixo."

## Checklist editorial

- [x] Parece artigo, não anúncio
- [x] Verbatim do avatar
- [x] Mecanismo único nomeado
- [x] CTA para VSL, não checkout direto
`,

    lancamentoMd: `# Lançamento PLF — Método Consistência 90

Tipo: interno · Lista: 2.400 contatos · Abertura: 14–16/07/2026

## Pré-pré-lançamento (D-14 a D-7)

- Pesquisa: "qual sua maior frustração com emagrecimento?" (3 opções)
- Captação: lead magnet "Checklist Anti-Sanfona"
- Aquecimento: 3 posts/semana menopausa + consistência

## PLC 1 — Oportunidade (D-6)

Título: "O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo"
Entrega: vídeo 12 min + PDF resumo
Gatilhos: curiosidade, prova social

## PLC 2 — Transformação (D-4)

Título: "Como Maria perdeu 8kg sem recomeçar toda segunda-feira"
Entrega: case study + depoimento
Gatilhos: identificação, autoridade

## PLC 3 — Propriedade (D-2)

Título: "Por dentro do Ciclo de 3 Fases (ao vivo)"
Entrega: aula ao vivo + Q&A
Gatilhos: escassez de vagas, comunidade

## Abertura de carrinho (D0)

E-mail + WhatsApp: stack R$ 2.935 → R$ 497 · 50 vagas · garantia 30 dias

## Sequência carrinho aberto (D0–D2)

| Dia | Mensagem |
|-----|----------|
| D0 | Abertura + stack |
| D1 | Objeção tempo + ritual 12 min |
| D2 | Últimas vagas + bônus checklist |

## Fechamento (D3)

"Turma jul/2026 encerra hoje às 23h59." Escassez real.
`,

    webinarioMd: `# Webinário — Aula ao vivo · Método Consistência 90

Duração: 75 min · Público: nível 3–4 · Meta: 8% conversão ao vivo

## Página de registro

Headline: "Aula gratuita: como emagrecer sem recomeçar toda segunda-feira"
Campos: nome, e-mail, WhatsApp

## Sequência de aquecimento

| Timing | Canal | Mensagem |
|--------|-------|----------|
| D-3 | E-mail | "Você está inscrita. Marque na agenda." |
| D-1 | WhatsApp | Lembrete + link Zoom |
| H-1 | WhatsApp | "Começamos em 1 hora" |
| H-0 | E-mail | Link ao vivo |

## Roteiro (75 min)

### Abertura (0–10 min)
- Promessa: "Ao final você vai saber em qual fase está e o próximo passo."
- Regras: fique até o final para bônus ao vivo

### Segredo 1 (10–25 min)
Por que dietas de 21 dias falham (mecanismo do problema)

### Segredo 2 (25–40 min)
Ciclo de 3 Fases explicado (mecanismo da solução)

### Segredo 3 (40–55 min)
Fase Manter: o que ninguém ensina (diferencial vs FitFlow)

### Transição (55–60 min)
"Quem quer o protocolo completo com comunidade..."

### Stack e oferta (60–70 min)
R$ 2.935 → R$ 497 · bônus · garantia · 50 vagas

### Fechamento (70–75 min)
Q&A + CTA final + contagem regressiva

## Pós-webinário

- Replay 48h (e-mail + página)
- Sequência venda D+1, D+2, D+3 (emails/sequencia.md)
`,

    paginaVendasMd: `# Página de vendas — 16 elementos

Arquivo aplicado: pagina/index.html

| # | Elemento | Conteúdo |
|---|----------|----------|
| 1 | Headline | Como perder 8kg em 90 dias sem contar caloria |
| 2 | Sub-headline | Sem dieta restritiva · Sem efeito sanfona · Mulheres 35+ |
| 3 | VSL | Slot 16:9 (pagina/vsl.html) |
| 4 | Mecanismo único | Ciclo de 3 Fases: Desinflamar, Reprogramar, Manter |
| 5 | Prova social | Depoimentos mulheres 35+ [SEM PROVA AINDA: inserir prints reais] |
| 6 | Benefícios | 10 bullets do copy.md |
| 7 | Stack | R$ 2.935 ancorado → R$ 497 |
| 8 | Bônus | Checklist + E-book + Workbook |
| 9 | Garantia | 30 dias, devolução integral |
| 10 | Escassez | 50 vagas turma jul/2026 |
| 11 | FAQ | Menopausa, tempo, sanfona |
| 12 | CTA primário | QUERO COMEÇAR AGORA |
| 13 | CTA repetido | Após FAQ |
| 14 | Footer | Contato, política, termos |
| 15 | Pixel | Meta Pixel comentado [PLUG: IDs] |
| 16 | Mobile | Vídeo 1ª dobra, CTA abaixo do vídeo |
`,

    conteudoRoteirosMd: `# Roteiros de conteúdo — Semana 1

Coleta Apify: @emagrecerdevez (${ig.filter((p) => p.ownerUsername).length} posts) + TikTok menopausa

${igLines || '## Reel 1\nHook: "Se você tem 35 anos ou mais..."\n'}

## Calendário

| Dia | Formato | Tema |
|-----|---------|------|
| Seg | Reel | Hook TikTok: "${ttHook}" |
| Qua | Carrossel | 7 sinais de inflamação (Fase 1) |
| Sex | Stories | Bastidor comunidade |

## TikTok modelado (top plays)

| # | Plays | Texto |
|---|-------|-------|
${ttLines || '| 1 | 5.200.000 | "Se você tem 35 anos ou mais..." |'}

## Métricas alvo

- Retenção 3s: > 65%
- Salvamentos: > 3% dos alcances
- Cliques link bio: > 1,5%
`,

    criativosRoteirosMd: `# Criativos pagos — Roteiros e banners

Modelagem: Meta Ad Library (FitFlow) + Apify @emagrecerdevez

## Vídeo feed 4:5 — Hook A

**Hook (0-3s):** "${ttHook}"
**Corpo:** "O erro não é a dieta. É não ter fase de manutenção."
**CTA:** "Faz o diagnóstico gratuito"
**Duração:** 45s

## Story 9:16 — Hook B

**Hook:** "${igHook}"
**CTA:** "Link na bio · Quiz grátis"
**Duração:** 15s

## Quadrado 1:1 — Stack

Visual: mockup 3 bônus + preço R$ 497
Texto: "Método Consistência 90 · Turma jul/2026"

## Banners gerados

- criativos/banners/feed-4x5-hook-a.html → .png
- criativos/banners/story-9x16-hook-b.html → .png
- criativos/banners/quadrado-1x1-stack.html → .png
`,

    emailsSequenciaMd: `# Sequência de e-mails — Funil quiz

## D0 — Convite (emails/convite.html)

Assunto: Você foi convidada para o diagnóstico gratuito
Corpo: link quiz + promessa de resultado personalizado

## D1 — Nutrição 1 (emails/nutricao.html)

Assunto: Maria, você não falhou. A dieta falhou.
Corpo: mecanismo do problema + história Maria 42 anos

## D2 — Nutrição 2

Assunto: O que acontece depois do dia 21
Corpo: Fase Manter explicada

## D3 — Nutrição 3

Assunto: 12 minutos que mudam a semana
Corpo: ritual pragmático + checklist bônus

## D4 — Nutrição 4

Assunto: O que as mulheres da comunidade dizem
Corpo: prova social [SEM PROVA AINDA]

## D5 — Nutrição 5

Assunto: Ainda dá tempo de entrar na turma jul/2026
Corpo: escassez suave

## D6 — Venda (emails/venda.html)

Assunto: Últimas vagas — Método Consistência 90 · R$ 497
CTA: GARANTIR MINHA VAGA

## D7 — Último aviso

Assunto: Fecha hoje às 23h59
Corpo: stack + garantia + CTA final
`,

    whatsappMd: `# Sequência WhatsApp — Funil quiz

## Confirmação (pós-quiz)

"Oi {{nome}}! Recebi seu diagnóstico {{perfil}}. Nos próximos dias vou te mandar conteúdo personalizado. Qualquer dúvida, responde aqui."

## Lembrete evento (webinário)

"D-1: Aula ao vivo amanhã 20h. Link: {{link}}"

## Carrinho abandonado (T+2h)

"Vi que você chegou na página do Método Consistência 90. Ficou alguma dúvida sobre a Fase Manter?"

## Nutrição D+3

"Vídeo de 2 min: por que a maioria volta ao peso antigo (e como evitar): {{link}}"

## Venda D+6

"Turma jul/2026: restam {{vagas}} vagas. R$ 497 com garantia 30 dias. Link: {{checkout}}"

## Cartão recusado (imediato)

"Seu pagamento não passou. Quer tentar em 2x de R$ 248,50? Responde SIM."
`,

    recuperacaoMd: `# Sequência de Recuperação

Princípio: lead que chegou no checkout vale mais que lead novo.

## Carrinho abandonado

| Timing | Canal | Mensagem |
|--------|-------|----------|
| T+1h | E-mail | "Você esqueceu algo importante" + link checkout |
| T+2h | WhatsApp | Dúvida sobre Fase Manter |
| T+24h | E-mail | Bônus checklist extra se comprar em 24h |

## Cartão recusado

| Timing | Canal | Mensagem |
|--------|-------|----------|
| Imediato | WhatsApp | Oferta 2x |
| T+4h | E-mail | Outro método de pagamento (Pix) |

## Boleto gerado

| Timing | Canal | Mensagem |
|--------|-------|----------|
| T+1d | WhatsApp | "Boleto vence amanhã" |
| T+3d | E-mail | Última chance + downsell |

## Downsell (recusou oferta principal)

T+5d: Pack Receitas Premium R$ 47 (pagina/downsell.html)

## Re-elevação de consciência

T+14d: e-mail "O erro que 9 em 10 cometem" → quiz novamente
`,

    backEndMd: `# Back-end — Maximização de ticket

Front-end: Método Consistência 90 · R$ 497

## Fluxo pós-compra

\`\`\`
Comprou → Upsell 1 (3-7s) → Sim: OTO 4h / Não: Downsell
\`\`\`

## Upsell 1 — Programa Avançado Fase 4

- Preço: R$ 197 (one-click)
- Página: pagina/upsell.html
- Janela de dopamina: 3–7 segundos após confirmação
- Copy: "Espere! Oferta exclusiva para quem acabou de entrar"

## OTO — Consultoria individual 30 min

- Preço: R$ 297
- Janela: 4h após compra
- Canal: e-mail + WhatsApp

## Downsell — Pack Receitas Premium

- Preço: R$ 47
- Trigger: recusou upsell
- Página: pagina/downsell.html

## Order bump (checkout)

Checklist Imprimível Fase 1 · R$ 27

## LTV projetado

| Cenário | Ticket médio |
|---------|--------------|
| Só front | R$ 497 |
| Front + upsell | R$ 694 |
| Front + upsell + OTO | R$ 991 |
| Full stack | R$ 1.038 |
`,

    bonusChecklistMd: `# Checklist Semanal Anti-Sanfona

Bônus #1 · Academia Fit · Entrega: PDF + HTML

## Como usar

Marque cada item ao longo da semana. Meta: 5 de 7 dias completos.

## Segunda — Hidratação e movimento

- [ ] 2L de água antes das 18h
- [ ] Caminhada 12 min (ou 3.000 passos)
- [ ] Refeição com proteína + vegetal no almoço

## Terça — Planejamento

- [ ] Definir jantar de quarta (evitar pedir delivery por impulso)
- [ ] Preparar lanche de tarde (iogurte + fruta ou nuts)

## Quarta — Cardápio

- [ ] Usar receita da Fase 1 (anti-inflamação)
- [ ] Zero refrigerante

## Quinta — Sono

- [ ] Dormir antes das 23h
- [ ] Sem tela 30 min antes de deitar

## Sexta — Prep fim de semana

- [ ] Preparar 2 refeições para sábado
- [ ] Definir uma refeição livre consciente (não compensatória)

## Sábado — Social

- [ ] Escolher prato do restaurante antes de sair
- [ ] Compartilhar vitória na comunidade

## Domingo — Revisão

- [ ] Pesagem opcional (tendência, não obsessão)
- [ ] Planejar 3 prioridades da semana seguinte
`,

    bonusEbookMd: `# E-book Anti-Sanfona

Bônus #2 · Academia Fit · 3 capítulos

## Capítulo 1 — Por que você volta

O ciclo restrição-liberação-ganho. Não é falta de força de vontade: é ausência de protocolo de manutenção. Dados de comunidades: 7 em 10 mulheres 35+ relatam efeito sanfona.

## Capítulo 2 — A Fase Manter

O que fazer após os primeiros 21 dias. Ritual semanal de 12 minutos. Cardápio flexível para social e viagem.

## Capítulo 3 — Ritual de 12 minutos

| Minuto | Ação |
|--------|------|
| 0–3 | Alongamento + respiração |
| 3–8 | Caminhada ou exercício escolhido |
| 8–12 | Anotação: o que funcionou esta semana |

## Aviso (nicho regulado)

Conteúdo educativo em linguagem de possibilidade. Consulte seu médico antes de mudar alimentação ou exercício.
`,

    bonusWorkbookMd: `# Workbook — Fase 1 Desinflamar

Bônus #3 · 7 dias de exercícios

## Dia 1 — Inventário

Liste 3 alimentos que te fazem sentir inchaço. Substitua 1 hoje.

## Dia 2 — Hidratação

Meta: 2L. Marque cada copo.

## Dia 3 — Proteína no café

Adicione proteína no café da manhã. Anote energia às 11h (1–10).

## Dia 4 — Movimento

12 min de caminhada. Horário: ___

## Dia 5 — Sono

Dormir antes das 23h. Qualidade (1–10): ___

## Dia 6 — Refeição social

Escolha o prato antes de sair. Funcionou? Sim / Não

## Dia 7 — Revisão da semana

O que mantenho? O que ajusto? Próximo passo: Fase 2 Reprogramar.
`,

    mockupsPromptsMd: `# Prompts de mockup — Academia Fit

Identidade: primary #7C3AED · secondary #22C7B1 · surface #0A0A0F · display Space Grotesk

## Capa E-book Anti-Sanfona

"Book cover, ebook mockup, title 'E-book Anti-Sanfona', subtitle 'Como manter o peso depois da dieta', purple gradient #7C3AED to #1a1035, modern sans-serif, fitness wellness brand, no people faces, clean minimal, 3:4 ratio"

## Bundle 3 bônus

"Stacked bonus bundle mockup, three digital products, checklist ebook workbook, purple and teal accent #7C3AED #22C7B1, dark background #0A0A0F, premium online course aesthetic, isometric view"

## Box produto principal

"Product box mockup, 'Método Consistência 90', online program for women 35+, purple brand, elegant packaging, dark premium background, no exaggerated before after"

## Device — área de membros

"Laptop and phone mockup showing membership dashboard, module list, purple UI, clean modern interface, Academia Fit branding, dark mode"
`,

    croMd: `# CRO — Plano de otimização

Funil: quiz → resultado → checkout · Nível 4

## KPIs por etapa

| Etapa | Métrica | Meta | Atual |
|-------|---------|------|-------|
| Tráfego → quiz | CTR anúncio | 2,5% | — |
| Quiz → lead | Conversão | 35% | — |
| Lead → checkout | Clique CTA | 12% | — |
| Checkout → compra | Conversão | 25% | — |

## Teste A/B ativo

**Elemento:** Headline da página de vendas
- **A:** "Como perder 8kg em 90 dias sem contar caloria"
- **B:** "Pare de recomeçar toda segunda-feira"

**Regra:** 1 teste por vez · mínimo 1.000 views únicos por variante

## Prioridade de testes (após headline)

1. CTA cor (violeta vs teal)
2. Vídeo vs sem vídeo na página
3. Ordem dos bônus no stack

## Critério para escalar tráfego

- Checkout → compra ≥ 20% por 7 dias
- CPA < 35% do ticket (R$ 174)
- Sem queda de conversão no mobile
`,

    statusMd: `# Status do funil — academia-fit

Atualizado: ${date}

## Checklist 25 skills

| # | Skill | Entregável | Status |
|---|-------|------------|--------|
| 1 | comecar | SETUP.md | ✓ |
| 2 | avatar-funil | relatorio-avatar.md/html/pdf | ✓ |
| 3 | espiao-do-concorrente | espiao/dossie-fitflow.md/html/pdf | ✓ |
| 4 | trend-hunting | trends + variacoes-hooks | ✓ |
| 5 | swipe-file | swipe/ + index | ✓ |
| 6 | offerbook | offerbook.md/html/pdf | ✓ |
| 7 | design-md | DESIGN.md + tokens + preview | ✓ |
| 8 | metodo-funil | funil.md/html/pdf | ✓ |
| 9 | copy-funil | copy.md | ✓ |
| 10 | quiz-funil | quiz.md + pagina/quiz.html | ✓ |
| 11 | pagina-vendas-funil | pagina/index.html | ✓ |
| 12 | email-funil | emails/*.html | ✓ |
| 13 | conteudo-funil | conteudo/roteiros | ✓ |
| 14 | criativos-funil | criativos/ + banners PNG | ✓ |
| 15 | vsl-funil | vsl.md + pagina/vsl.html | ✓ |
| 16 | advertorial-funil | advertorial.md + pagina | ✓ |
| 17 | lancamento-funil | lancamento.md/html | ✓ |
| 18 | webinario-funil | webinario.md + registro | ✓ |
| 19 | whatsapp-funil | whatsapp.md | ✓ |
| 20 | bonus-funil | bonus/ (3 entregáveis) | ✓ |
| 21 | mockup-produto-funil | mockups/prompts.md | ✓ |
| 22 | recuperacao-funil | recuperacao.md/html | ✓ |
| 23 | backend-funil | back-end.md + upsell/downsell | ✓ |
| 24 | cro-funil | cro.md/html | ✓ |
| 25 | status-funil | status.md | ✓ |

## Você está aqui

**25/25 skills com entregável.**

Próximo passo operacional: tráfego no quiz + teste A/B headline (cro.md).

## Pendências do dono

- [ ] Inserir depoimentos reais (marcados [SEM PROVA AINDA])
- [ ] Gravar VSL a partir de vsl.md
- [ ] Plugar IDs Meta Pixel em pagina/index.html
`,

    designMd: `---
name: Academia Fit
version: 1.0
colors:
  primary: "#7C3AED"
  secondary: "#22C7B1"
  surface: "#0A0A0F"
  surface-elevated: "#121218"
  text: "#F5F0FF"
  text-muted: "#A1A1AA"
  accent-warm: "#F59E0B"
typography:
  display: Space Grotesk
  body: Inter
  scale:
    h1: 2.5rem
    h2: 1.5rem
    body: 1rem
    small: 0.875rem
spacing:
  unit: 8px
  card-padding: 16px
  section-gap: 32px
radius:
  card: 12px
  button: 12px
  pill: 999px
components:
  button-primary: "bg primary, text on-deep, padding 12px 24px, radius 12px, font-weight 600"
  card: "bg surface-elevated, border 1px #27272A, radius 12px"
---

# Design System — Academia Fit

## Princípios

- Dark premium: fundo #0A0A0F, texto #F5F0FF
- Violeta como cor de ação (#7C3AED)
- Teal para destaques de confiança (#22C7B1)
- Sem gradientes exagerados em CTAs

## Tokens

Ver \`tokens.json\` para consumo programático.

## Preview

Abra \`preview.html\` no navegador via servidor HTTP local.
`,
  };
}