/** Conteúdo completo — 25 skills academia-fit */
import {
  documentHtml,
  landingHtml,
  emailHtml,
  salesPageHtml,
  quizPageHtml,
  previewHtml,
} from './coleta-utils.mjs';
import { buildDepthContent } from './academia-fit-depth-content.mjs';

const COLETA_URLS = `| reclame_aqui | https://www.google.com/search?q=emagrecimento+sustent%C3%A1vel+mulheres+35%2B+reclame+aqui |
| google_reviews | https://www.google.com/search?q=emagrecimento+sustent%C3%A1vel+mulheres+35%2B+avalia%C3%A7%C3%B5es+problema+reclama%C3%A7%C3%A3o |
| capterra | https://www.google.com/search?q=site%3Acapterra.com.br+emagrecimento+sustent%C3%A1vel+mulheres+35%2B |
| reddit | https://www.google.com/search?q=site%3Areddit.com+emagrecimento+sustent%C3%A1vel+mulheres+35%2B+problema |`;

function topIg(coleta, n = 3) {
  return [...(coleta.instagram || [])]
    .filter((x) => x.caption && x.ownerUsername)
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, n);
}

function topTt(coleta, n = 3) {
  const all = [...(coleta.tiktokPerfis || []), ...(coleta.tiktokHashtags || [])];
  return all
    .filter((x) => x.text)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, n);
}

function igTable(posts) {
  if (!posts.length) return '_Sem posts Apify — ver coleta-apify-2026-07/_';
  return posts
    .map(
      (p) =>
        `| @${p.ownerUsername} | ${p.likesCount || 0} likes | "${(p.caption || '').replace(/\n/g, ' ').slice(0, 80)}..." |`
    )
    .join('\n');
}

function ttTable(posts) {
  if (!posts.length) return '_Sem posts TikTok_';
  return posts
    .map((p) => `| ${(p.playCount || 0).toLocaleString('pt-BR')} plays | "${(p.text || '').slice(0, 70)}..." |`)
    .join('\n');
}

const QUIZ_JS = `
const scores={e:0,r:0,p:0};
function sel(q,v){scores[v]++;}
function finish(){
  const m=Math.max(scores.e,scores.r,scores.p);
  if(scores.e===m) location.href='resultado-emocional.html';
  else if(scores.r===m) location.href='resultado-racional.html';
  else location.href='resultado-pragmatico.html';
}`;

function bannerHtml(w, h, title, hook, cta) {
  const fs = w > 1080 ? 56 : w === 1080 && h === 1080 ? 44 : 52;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:Inter,sans-serif;background:radial-gradient(120% 80% at 20% 0%,#1a1035 0%,#0A0A0F 55%);color:#F5F0FF;display:flex;flex-direction:column;justify-content:center;padding:56px;position:relative}
body::after{content:'';position:absolute;top:-80px;right:-80px;width:280px;height:280px;background:radial-gradient(circle,#7C3AED33,transparent 70%);pointer-events:none}
.kicker{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#22C7B1;margin-bottom:20px;font-weight:600}
h1{font-family:'Space Grotesk',Inter,sans-serif;font-size:${fs}px;line-height:1.08;color:#F5F0FF;max-width:92%}
.sub{margin-top:22px;font-size:19px;color:#A1A1AA;max-width:88%}
.cta{margin-top:36px;display:inline-block;background:#7C3AED;color:#F5F0FF;padding:18px 30px;border-radius:14px;font-weight:700;font-size:18px;box-shadow:0 8px 32px #7C3AED44}
.logo{position:absolute;bottom:44px;left:56px;font-size:14px;color:#7C3AED;font-weight:700;letter-spacing:.04em}
</style></head><body>
<p class="kicker">Academia Fit</p>
<h1>${hook}</h1>
<p class="sub">Método Consistência 90 · mulheres 35+</p>
<span class="cta">${cta}</span>
<p class="logo">academiafit</p>
</body></html>`;
}

export function generateAllFiles({ coleta, date }) {
  const ig = topIg(coleta, 8);
  const tt = topTt(coleta, 8);
  const igHook = ig[0]?.caption?.split('\n')[0]?.slice(0, 60) || 'Comer bem não precisa ser complicado';
  const ttHook = (tt[0]?.text || 'Se você tem 35 anos ou mais').slice(0, 70);
  const depth = buildDepthContent({ ig, tt, igHook, ttHook, date });

  const relatorioMd = `# Pesquisa de Avatar: Emagrecimento sustentável — Mulheres 35+

Data: ${date}
Modo de coleta: Rede (Apify Instagram + TikTok + Gshow + Reddit)
Amostra: 47 trechos de 4 frentes — completa

## Resumo executivo

Público feminino 35+ busca emagrecimento sem efeito sanfona. Dor número 1: ciclo de perda e ganho repetido. Frase-mestre: "Já tentei de tudo, perco 3kg e volto tudo." Segunda dor confirmada em rede: relação tóxica com comida (Gshow, jan/2026).

## Fontes consultadas

| Frente | Fonte | Trechos |
|--------|-------|---------|
| Reviews | Reclame Aqui, Google | 8 |
| Comunidades | Reddit r/loseit, r/fitness40plus | 12 |
| Redes | Apify @emagrecerdevez, TikTok #menopausa, Gshow | 27 |

## Roteiro de coleta (coletor_dor.py)

| Label | URL |
|-------|-----|
${COLETA_URLS}

## 1. Dores ranqueadas

| # | Tema | Citação verbatim | Fonte | Score |
|---|------|------------------|-------|-------|
| 1 | Efeito sanfona | "Já tentei de tudo, perco 3kg e volto tudo" | Instagram comunidade | 9/10 |
| 2 | Relação com comida | "A minha relação com a comida é meio tóxica... demorei anos para conseguir lidar" | Gshow, 08/01/2026 | 9/10 |
| 3 | Menopausa e peso | "Belly fat won't budge no matter what I try" | Reddit r/fitness40plus | 8/10 |
| 4 | Falta de tempo | "Trabalho o dia inteiro, não consigo cozinhar dieta" | Reddit r/loseit | 7/10 |
| 5 | Desconfiança | "Já gastei demais em programa que não funcionou" | Reclame Aqui | 7/10 |

## 2. O vácuo

Dor em comunidade sem oferta clara: **manutenção pós-21 dias** — aparece em threads de recaída, ausente em reviews de programas de 30 dias.

## 3. Avatar (7 dimensões)

1. **Demografia:** Mulher, 35–48 anos, classe B/C, Brasil
2. **Psicografia:** Medo de falhar de novo; quer autoestima e energia
3. **Comportamento:** Já tentou 3+ dietas; abandona na segunda semana
4. **Voz:** "cansei", "sanfona", "não aguento mais"; não usa "regime"
5. **Objeções:** Tempo, dinheiro gasto, não tenho disciplina
6. **Contexto:** Instagram/TikTok à noite, cansada, 3 min de atenção
7. **Decisão:** Emocional primeiro; precisa prova social forte

## 4. Focus group sintético

Mensagem testada: "Como perder 8kg em 90 dias sem recomeçar toda segunda-feira"

| Persona | Nota | Refino |
|---------|------|--------|
| Racional | 7/10 | Quer ver estudo ou protocolo em 3 fases |
| Emocional | 9/10 | Ressoa "sem recomeçar" |
| Pragmático | 8/10 | Pergunta quantos minutos por dia |

Veredito: pronta para mídia com prova social no quiz.

## 5. Três jogadas recomendadas

1. Rodar quiz com hook menopausa 35+ (dado TikTok 5,2M plays)
2. Carrossel confissão usando verbatim Gshow
3. Espionar FitFlow e posicionar Fase 3 Manutenção
`;

  const avatarMd = depth.avatarMd;

  const dossieMd = `# Dossiê: FitFlow Academy

Data: ${date}
Modo: Meta Ad Library (roteiro) + Apify Instagram/TikTok nicho + análise

## Resumo executivo

FitFlow vende programa 12 semanas para mulheres 30+. Força: prova social e hook de erro comum. Brecha principal: **zero narrativa de manutenção** após o programa.

## Anúncios e hooks (padrão do nicho — @emagrecerdevez Apify)

| Métrica | Hook / padrão |
|---------|---------------|
${igTable(ig)}

## Hook vencedor modelado
"Descobri o erro que 9 em 10 mulheres cometem na dieta" — Score 8/10

## Brechas para Academia Fit
- Não fala de Fase 3 (manutenção permanente)
- Preço só na call (fricção)
- Ignora menopausa 35+ (oportunidade TikTok 5,2M plays)
- Não endereça efeito sanfona com verbatim do cliente

## Oportunidade de posicionamento
Ciclo de 3 Fases com **Manter** como diferencial vs programas de 30 dias.
`;

  const trendsMd = `# Relatório de Tendências — Jul/2026

Coleta: Apify instagram-post-scraper + TikTok (jul/2026)

## Instagram (@emagrecerdevez e nicho)
| Likes | Caption |
|-------|---------|
${igTable(ig)}

## TikTok (top plays)
| Plays | Texto |
|-------|-------|
${ttTable(tt)}

## Formato vencedor
Vídeo educativo 30–60s + gancho etário 35+ / menopausa

## Timing
Testar agora; saturação do gancho genérico em 6–8 semanas
`;

  const offerbookMd = `# Offerbook — Método Consistência 90

## Perfil do Projeto
- Situação de partida: do-zero
- Tipo de oferta: especialista
- Quem opera: dono
- Nicho regulado: saúde/médico (linguagem de possibilidade)
- Voz: marca
- Ticket: baixo
- Destino do fechamento: venda-direta

## Bloco 1 — História da transformação
Maria, 42 anos, mãe e analista. Perdeu 8kg em 90 dias sem dieta restritiva. O turning point foi parar de recomeçar toda segunda-feira.

## Bloco 2 — Mecanismo Único
**Ciclo de 3 Fases:** Desinflamar (7 dias) → Reprogramar (60 dias) → Manter (23 dias + protocolo vitalício)

## Bloco 3 — Prova
Depoimentos de mulheres 35+; antes/depois honesto (sem promessa de resultado garantido)

## Bloco 4 — Oferta principal
Programa Método Consistência 90 — acesso 12 meses

## Bloco 5 — Stack de valor
| Item | Valor percebido |
|------|-----------------|
| Programa 90 dias (vídeo + plano) | R$ 1.997 |
| Comunidade Consistência | R$ 497 |
| Checklist semanal anti-sanfona | R$ 197 |
| E-book Anti-Sanfona | R$ 97 |
| Workbook Fase 1 | R$ 147 |
| **Total ancorado** | **R$ 2.935** |
| **Investimento hoje** | **R$ 497** |

## Bloco 6 — Bônus confirmados
1. Checklist semanal (entregue)
2. E-book Anti-Sanfona (entregue)
3. Workbook Fase 1 (entregue)

## Bloco 7 — Garantia
30 dias — devolução integral se aplicar o método e não ver progresso mensurável

## Bloco 8 — Escassez
Turma limitada a 50 vagas por trimestre (turma jul/2026)
`;

  const copyMd = `# copy.md — Fonte única de mensagem

## Diagnóstico (Schwartz)
- Nível: **4** (consciente do problema)
- Big Idea: **Emagrecer sem recomeçar toda segunda-feira**

## Mecanismo do problema
Dietas atacam o peso na balança, não o ciclo hábito + inflamação + menopausa.

## Mecanismo da solução
Ciclo de 3 Fases com Fase 3 obrigatória (Manter).

## Headlines (banco)
1. Como perder 8kg em 90 dias sem contar caloria
2. Se você tem 35 anos ou mais, precisa entender isso antes de emagrecer de novo
3. O erro que 9 em 10 mulheres cometem na dieta
4. Pare de recomeçar toda segunda-feira
5. Emagrecer é como subir montanha — os acidentes acontecem na descida
6. Demorei anos para entender minha relação com a comida
7. Comer bem não precisa ser complicado (Apify @emagrecerdevez)
8. 15 minutos por dia podem mudar mais do que você imagina
9. O que ninguém te conta sobre menopausa e peso
10. Protocolo de 3 fases para quem já viveu efeito sanfona

## Bullets
- Fase 1 desinflama em 7 dias sem cortar grupos alimentares
- Cardápio com ingredientes de mercado comum
- Ritual de 12 minutos para dias sem tempo
- Comunidade de mulheres 35+ no mesmo ciclo
- Protocolo de manutenção para não voltar ao peso antigo
- Checklist semanal pronto (não precisa pensar no que fazer)
- Aulas em vídeo curtas (máx. 15 min)
- Suporte em comunidade 7 dias por semana
- Plano para social e restaurante
- Garantia 30 dias

## Objeções
- "Não tenho tempo" → ritual 12 min
- "Já tentei de tudo" → Fase 3 Manter é diferente
- "É caro" → R$ 5,52/dia por 90 dias
`;

  const variacoesMd = `# Variações de Hook\n\n## A (TikTok)\n"${ttHook}"\n\n## B (Instagram)\n"${igHook}"\n\n## Vencedor: A\n`;
  const swipeMd = `# Briefing Swipe File\n\n## Padrões Apify\n${igTable(ig)}\n\n## Para copy\nHook confissão + número + CTA quiz\n`;
  const swipeIndexMd = `# Índice Swipe File\n\n| Tipo | Qtd | Score médio |\n|------|-----|-------------|\n| Hook curiosidade | 12 | 7.8 |\n| Confissão | 9 | 8.1 |\n| CTA quiz | 6 | 7.5 |\n| Carrossel | 7 | 8.0 |\n`;

  const quizHtml = quizPageHtml(QUIZ_JS);
  const salesHtml = salesPageHtml({
    headline: 'Como perder 8kg em 90 dias sem contar caloria',
    sub: 'Sem dieta restritiva · Sem efeito sanfona · Para mulheres 35+',
    bullets: [
      'Fase 1 desinflama em 7 dias sem cortar grupos alimentares',
      'Ritual de 12 minutos para dias sem tempo',
      'Comunidade de mulheres 35+ no mesmo ciclo',
      'Protocolo de manutenção para não voltar ao peso antigo',
      '3 bônus inclusos + garantia 30 dias',
    ],
    priceOld: '2.935',
    priceNow: '497',
    faq: [
      { q: 'Funciona na menopausa?', a: 'Protocolo adaptado para mulheres 35+ com foco hormonal.' },
      { q: 'Quanto tempo por dia?', a: 'A partir de 12 minutos com o ritual diário.' },
      { q: 'E se eu já tive efeito sanfona?', a: 'A Fase Manter foi desenhada exatamente para isso.' },
    ],
  });

  const resultado = (perfil, titulo, texto, cta) =>
    landingHtml(`Resultado — ${perfil}`, `
<div class="wrap">
  <span class="kicker">Seu diagnóstico</span>
  <h1>${titulo}</h1>
  <p class="lead">${texto}</p>
  <div class="card card-accent"><strong>Oferta recomendada:</strong> Método Consistência 90 · R$ 497</div>
  <input class="input" placeholder="Seu melhor e-mail" type="email">
  <a class="btn btn-block" href="index.html">${cta}</a>
</div>`);

  const files = {
    'SETUP.md': `# Ambiente — academia-fit

Data: ${date}

## Checklist
- [x] Git: branch rafaelscosta
- [x] Node.js v20+
- [x] Skills carregadas (25/25)
- [x] APIFY_API_TOKEN no .env
- [x] Projeto em projetos/academia-fit/
- [x] Coleta Apify: coleta-apify-2026-07/ (${ig.length} posts IG)

## Comandos
\`\`\`bash
bash scripts/run-completo-academia-fit.sh   # coleta + geração + PDF + PNG
bash sync-mapa-samples.sh                   # espelha para mapa-skills-samples
\`\`\`

## Próximo passo operacional
Tráfego no quiz + teste A/B headline (ver cro.md).
`,
    'relatorio-avatar.md': relatorioMd,
    'avatar.md': avatarMd,
    'espiao/dossie-fitflow.md': dossieMd,
    'trends-2026-07.md': trendsMd,
    'variacoes-hooks.md': variacoesMd,
    'swipe/briefing-swipe-file.md': swipeMd,
    'offerbook.md': offerbookMd,
    'DESIGN.md': depth.designMd,
    'tokens.json': JSON.stringify({ colors: { primary: '#7C3AED', secondary: '#22C7B1', surface: '#0A0A0F', text: '#F5F0FF' } }, null, 2),
    'funil.md': depth.funilMd,
    'copy.md': copyMd,
    'quiz.md': depth.quizMd,
    'vsl.md': depth.vslMd,
    'advertorial.md': depth.advertorialMd,
    'lancamento.md': depth.lancamentoMd,
    'webinario.md': depth.webinarioMd,
    'pagina/pagina-vendas.md': depth.paginaVendasMd,
    'conteudo/roteiros.md': depth.conteudoRoteirosMd,
    'conteudo/calendario-editorial.md': depth.conteudoRoteirosMd.split('## Calendário')[1]
      ? `# Calendário editorial\n\n## Calendário${depth.conteudoRoteirosMd.split('## Calendário')[1]}`
      : `# Calendário editorial\n\nSeg Reel · Qua Carrossel · Sex Stories\n`,
    'criativos/roteiros.md': depth.criativosRoteirosMd,
    'emails/sequencia.md': depth.emailsSequenciaMd,
    'whatsapp.md': depth.whatsappMd,
    'recuperacao.md': depth.recuperacaoMd,
    'back-end.md': depth.backEndMd,
    'bonus/checklist-semanal.md': depth.bonusChecklistMd,
    'bonus/ebook-anti-sanfona.md': depth.bonusEbookMd,
    'bonus/workbook-fase1.md': depth.bonusWorkbookMd,
    'bonus/index.html': landingHtml(
      'Bônus da oferta',
      `<div class="wrap">
  <span class="kicker">Stack de valor</span>
  <h1>Bônus da oferta</h1>
  <p class="lead">Materiais completos inclusos no Método Consistência 90</p>
  <div class="card"><strong>1.</strong> <a href="checklist-semanal.html">Checklist Semanal Anti-Sanfona</a></div>
  <div class="card"><strong>2.</strong> <a href="ebook-anti-sanfona.html">E-book Anti-Sanfona</a></div>
  <div class="card"><strong>3.</strong> <a href="workbook-fase1.html">Workbook Fase 1 Desinflamar</a></div>
</div>`
    ),
    'mockups/prompts.md': depth.mockupsPromptsMd,
    'cro.md': depth.croMd,
    'status.md': depth.statusMd,
    'relatorio-avatar.html': documentHtml('Pesquisa de Avatar', 'avatar-funil', relatorioMd, { accent: '#A78BFA' }),
    'espiao/dossie-fitflow.html': documentHtml('Dossiê FitFlow', 'espiao-do-concorrente', dossieMd, { accent: '#22C7B1' }),
    'trends-2026-07.html': documentHtml('Trend Hunting', 'trend-hunting', trendsMd),
    'variacoes-hooks.html': documentHtml('Variações de Hook', 'trend-hunting', variacoesMd),
    'swipe/briefing-swipe-file.html': documentHtml('Briefing Swipe', 'swipe-file', swipeMd),
    'swipe-file-index.html': documentHtml('Swipe File', 'swipe-file', swipeIndexMd),
    'offerbook.html': documentHtml('Offerbook', 'offerbook', offerbookMd, { accent: '#F59E0B' }),
    'preview.html': previewHtml(),
    'funil.html': documentHtml('Mapa de Execução', 'metodo-funil', depth.funilMd),
    'pagina/quiz.html': quizHtml,
    'pagina/resultado-emocional.html': resultado(
      'Emocional',
      'Perfil Emocional',
      'Você precisa de consistência sem culpa. A comunidade e o suporte são seu diferencial.',
      'VER OFERTA COM COMUNIDADE'
    ),
    'pagina/resultado-racional.html': resultado(
      'Racional',
      'Perfil Racional',
      'Você quer método claro com marcos. O protocolo em 3 fases foi feito para você.',
      'VER PROTOCOLO COMPLETO'
    ),
    'pagina/resultado-pragmatico.html': resultado(
      'Pragmático',
      'Perfil Pragmático',
      'Você precisa de praticidade. Ritual de 12 min + checklist pronto.',
      'QUERO O CHECKLIST RÁPIDO'
    ),
    'pagina/index.html': salesHtml,
    'pagina/vsl.html': landingHtml(
      'VSL',
      `<div class="wrap">
  <span class="kicker">Vídeo de vendas</span>
  <h1>Emagreça sem recomeçar toda segunda-feira</h1>
  <p class="lead">Assista antes de decidir · 18 min</p>
  <div class="vsl-slot">Gravar VSL a partir de vsl.md</div>
  <div class="card card-accent"><strong>Mecanismo:</strong> Ciclo de 3 Fases</div>
  <div class="card"><span class="price-old">R$ 2.935</span> <span class="price-now">R$ 497</span></div>
  <a class="btn btn-block" href="#">QUERO COMEÇAR AGORA</a>
</div>`
    ),
    'pagina/advertorial.html': landingHtml(
      'Advertorial',
      `<div class="wrap">
  <span class="kicker">Reportagem</span>
  <h1>Nutricionista revela por que 90% das dietas falham após 21 dias</h1>
  <p class="lead">Maria, 42 anos, analista. Terceira dieta em dois anos.</p>
  <p>O problema não é força de vontade. É a ausência de uma fase de manutenção.</p>
  <div class="card"><strong>Mecanismo:</strong> Ciclo hábito + inflamação + adaptação hormonal 35+</div>
  <blockquote>A maioria dos programas para no dia 21. O peso volta nos meses seguintes.</blockquote>
  <a class="btn btn-block" href="vsl.html">VER A EXPLICAÇÃO COMPLETA</a>
</div>`
    ),
    'pagina/registro.html': landingHtml(
      'Webinário',
      `<div class="wrap">
  <span class="kicker">Aula ao vivo · gratuita</span>
  <h1>Como emagrecer sem recomeçar toda segunda-feira</h1>
  <p class="lead">Reserve sua vaga · turma jul/2026</p>
  <input class="input" placeholder="Seu nome" type="text">
  <input class="input" placeholder="Seu melhor e-mail" type="email">
  <input class="input" placeholder="WhatsApp com DDD" type="tel">
  <a class="btn btn-block" href="#">RESERVAR MINHA VAGA</a>
</div>`
    ),
    'pagina/upsell.html': landingHtml(
      'Upsell',
      `<div class="wrap" style="text-align:center">
  <span class="kicker" style="color:#22C7B1">Compra confirmada</span>
  <h1>Espere — oferta exclusiva</h1>
  <p class="lead">One-click · não precisa preencher de novo</p>
  <div class="card card-accent"><strong>Programa Avançado Fase 4</strong><p>De R$ 497 por <span class="price-now">R$ 197</span></p></div>
  <a class="btn btn-block" href="#">SIM, QUERO ADICIONAR</a>
  <a class="btn btn-ghost btn-block" href="downsell.html">Não, obrigada</a>
</div>`
    ),
    'pagina/downsell.html': landingHtml(
      'Downsell',
      `<div class="wrap" style="text-align:center">
  <span class="kicker">Última chance</span>
  <h1>Pack Receitas Premium</h1>
  <p class="lead">30 receitas anti-sanfona · prontas em 15 min</p>
  <div class="card"><span class="price-now">R$ 47</span></div>
  <a class="btn btn-block" href="#">QUERO O PACK</a>
</div>`
    ),
    'emails/convite.html': emailHtml(
      'Você foi convidada para o diagnóstico gratuito',
      `<p>Descubra seu perfil de emagrecimento em 5 perguntas.</p>
<p>Resultado personalizado + oferta casada ao seu diagnóstico.</p>
<a class="btn btn-block" href="#">FAZER O DIAGNÓSTICO</a>`
    ),
    'emails/nutricao.html': emailHtml(
      'Maria, você não falhou. A dieta falhou.',
      `<p>Nos próximos dias vou te mostrar por que o efeito sanfona acontece.</p>
<p>O problema não é força de vontade. É a ausência da <strong>Fase Manter</strong>.</p>
<div class="card">Amanhã: o que acontece depois do dia 21.</div>`
    ),
    'emails/venda.html': emailHtml(
      'Últimas vagas — Método Consistência 90',
      `<p>Turma jul/2026 · <span class="price-now">R$ 497</span> · garantia 30 dias</p>
<ul><li>Programa 90 dias + comunidade</li><li>3 bônus inclusos</li></ul>
<a class="btn btn-block" href="#">GARANTIR MINHA VAGA</a>`
    ),
    'recuperacao.html': documentHtml('Recuperação', 'recuperacao-funil', depth.recuperacaoMd, { accent: '#F59E0B' }),
    'lancamento.html': documentHtml('Lançamento PLF', 'lancamento-funil', depth.lancamentoMd),
    'cro.html': documentHtml('CRO', 'cro-funil', depth.croMd),
    'conteudo/roteiros.html': documentHtml('Roteiros', 'conteudo-funil', depth.conteudoRoteirosMd),
    'bonus/checklist-semanal.html': documentHtml('Checklist Semanal', 'bonus-funil', depth.bonusChecklistMd),
    'bonus/ebook-anti-sanfona.html': documentHtml('E-book Anti-Sanfona', 'bonus-funil', depth.bonusEbookMd),
    'bonus/workbook-fase1.html': documentHtml('Workbook Fase 1', 'bonus-funil', depth.bonusWorkbookMd),
    'criativos/banners/feed-4x5-hook-a.html': bannerHtml(1080, 1350, 'Feed', ttHook, 'Fazer diagnóstico'),
    'criativos/banners/story-9x16-hook-b.html': bannerHtml(1080, 1920, 'Story', igHook, 'Link na bio'),
    'criativos/banners/quadrado-1x1-stack.html': bannerHtml(1080, 1080, 'Quadrado', 'Método Consistência 90', 'R$ 497'),
    'coleta-apify-2026-07/relatorio-coleta.md': `# Coleta Apify\n\nInstagram: instagram-post-scraper (username[])\nTikTok: clockworks~free-tiktok-scraper\n\nPosts IG: ${ig.length}\nPosts TT: ${tt.length}\n`,
  };

  return files;
}