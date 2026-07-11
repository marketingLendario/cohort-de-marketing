#!/usr/bin/env bash
# Bootstrap projetos/academia-fit — entregáveis núcleo N12 (referência do mapa de skills)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/projetos/academia-fit"
PDF_SH="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"
DATE="07/07/2026"

mkdir -p "$PROJ"/{espiao,swipe,pesquisa-avatar-2026-07,pagina,emails}

write_md() { local f="$1"; mkdir -p "$(dirname "$f")"; cat > "$f"; }

# ── SETUP ──
write_md "$PROJ/SETUP.md" <<'EOF'
# Ambiente — academia-fit

Projeto canônico de referência do Cohort de Marketing.
Nicho: emagrecimento sustentável · mulheres 35+ · Método Consistência 90

## Status N12 (núcleo)
- [x] avatar-funil
- [x] espiao-do-concorrente
- [x] trend-hunting
- [x] swipe-file
- [x] offerbook
- [x] design-md
- [x] metodo-funil
- [x] copy-funil
- [x] quiz-funil (prescrito)
- [x] email-funil
- [x] recuperacao-funil
- [x] backend-funil
EOF

# ── AVATAR ──
write_md "$PROJ/avatar.md" <<EOF
# Avatar: Personal Trainer Online — Mulheres 35+

Ancorado na dor número 1 (frase verbatim do cliente):
> "Já tentei de tudo, perco 3kg e volto tudo. Não aguento mais me olhar no espelho."
> Fonte: Comentário Instagram @coachmaria — 47 curtidas

| # | Dimensão | Conteúdo |
|---|----------|----------|
| 1 | Demografia | Mulher, 35–48 anos, classe B/C |
| 2 | Psicografia | Medos: falhar de novo, envelhecer mal. Ambição: autoestima |
| 5 | Objeções | Tempo, dinheiro gasto, disciplina |
| 7 | Decisão | Emocional primeiro; precisa prova social forte |
EOF

write_md "$PROJ/relatorio-avatar.md" <<EOF
# Pesquisa de Avatar: Emagrecimento — Mulheres 35+

Data: $DATE
Modo de coleta: Rede (Instagram, Reclame Aqui, Reddit)
Amostra: 47 trechos de 12 fontes — completa

## Resumo executivo

Público feminino 35+ busca emagrecimento sustentável após múltiplas tentativas frustradas. Dor #1: efeito sanfona. Frase-mestre verbatim acima.

## 1. Dores ranqueadas

| # | Tema | Citação verbatim | Fonte | Score |
|---|------|------------------|-------|-------|
| 1 | Efeito sanfona | "Já tentei de tudo, perco 3kg e volto tudo" | Instagram | 9/10 |
| 2 | Falta de tempo | "Trabalho o dia inteiro, não consigo cozinhar dieta" | Reddit | 7/10 |
| 3 | Desconfiança | "Já gastei demais em programa que não funcionou" | Reclame Aqui | 7/10 |

Dor número 1: efeito sanfona — score 9/10.
EOF

# ── ESPIÃO ──
write_md "$PROJ/espiao/dossie-fitflow.md" <<EOF
# Dossiê do Concorrente: FitFlow Academy

Data: $DATE
Modo de coleta: Meta Ad Library + Instagram + Site
Amostra: 23 peças — completa

## Resumo executivo

FitFlow vende programa 12 semanas para mulheres 30+. Força: prova social massiva. Brecha: não fala de manutenção pós-30 dias.

## Hook vencedor
"Descobri o erro que 9 em 10 mulheres cometem na dieta" — Score 8/10

## Brechas
- Zero narrativa de recaída
- Preço só na call
- Nicho homens 40+ livre
EOF

# ── TREND ──
write_md "$PROJ/trends-2026-07.md" <<EOF
# Relatório de Tendências — Jul/2026

## Formato em ascensão
Carrossel "antes/depois honesto" — engajamento 3.2x acima da média

## Hooks virais
1. "Parei de contar caloria e..."
2. "O que ninguém te conta sobre menopausa e peso"

## Timing
Saturação estimada: 6–8 semanas. Testar agora.
EOF

write_md "$PROJ/variacoes-hooks.md" <<EOF
# Variações de Hook — prontas pra teste

## Variação A (curiosidade)
"O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo"

## Variação B (confissão)
"Parei de me pesar todo dia. Em 90 dias perdi 8kg."

## Vencedor provável
Variação A — baseado em engajamento do nicho.
EOF

# ── SWIPE ──
write_md "$PROJ/swipe/briefing-swipe-file.md" <<EOF
# Briefing Swipe File — academia-fit

## Padrões extraídos
- Hook confissão + número específico
- CTA suave no carrossel (slide 7)
- Prova: foto real, não stock

## Para Copy
Usar estrutura confissão nos headlines do copy.md
EOF

# ── OFFERBOOK ──
write_md "$PROJ/offerbook.md" <<'EOF'
# Offerbook — Método Consistência 90

## Perfil do Projeto
- Situação de partida: do-zero
- Tipo de oferta: especialista
- Quem opera: dono
- Nicho regulado: saúde/médico (linguagem de possibilidade)
- Voz: marca
- Ticket: baixo
- Destino do fechamento: venda-direta

## Bloco 1 — História
Maria, 42 anos, perdeu 8kg em 90 dias sem dieta restritiva usando o ciclo de 3 fases.

## Bloco 2 — Mecanismo Único
**Ciclo de 3 Fases:** Desinflamar → Reprogramar → Manter

## Stack de Valor
| Item | Valor percebido |
|------|-----------------|
| Programa 90 dias | R$ 1.997 |
| Comunidade | R$ 497 |
| Checklist semanal | R$ 197 |
| **Preço** | **R$ 497** |
EOF

# ── DESIGN ──
write_md "$PROJ/DESIGN.md" <<'EOF'
---
name: "Academia Fit"
colors:
  primary: "#7C3AED"
  secondary: "#22C7B1"
  accent: "#F59E0B"
  surface: "#0A0A0F"
  text: "#F5F0FF"
  text-muted: "#A1A1AA"
  border: "#27272A"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
---

# Academia Fit — Design System

Tom visual: dark premium · fitness feminino
CTA: fundo primary (#7C3AED), texto claro
EOF

cat > "$PROJ/tokens.json" <<'EOF'
{"colors":{"primary":"#7C3AED","secondary":"#22C7B1","surface":"#0A0A0F","text":"#F5F0FF"},"typography":{"display":"Space Grotesk","body":"Inter"}}
EOF

# ── FUNIL ──
write_md "$PROJ/funil.md" <<'EOF'
# Mapa de Execução — N12 adaptado

## Diagnóstico
- Consciência: **Nível 4** → Quiz + página de vendas
- Público: mulheres 35+, dor efeito sanfona

## Peça prescrita
**quiz-funil** (principal) + pagina-vendas-funil

## Ordem N12
1–8 ✓ · 9 quiz-funil · 10 conteudo · 11 email · 12 recuperacao · 13 cro
EOF

# ── COPY ──
write_md "$PROJ/copy.md" <<'EOF'
# copy.md — Fonte única de mensagem

## Diagnóstico (Schwartz)
- Nível: **4**
- Big Idea: **Emagrecer sem recomeçar toda segunda-feira**

## Mecanismo do problema
Dietas atacam sintoma (peso), não causa (hábito + inflamação).

## Mecanismo da solução
Ciclo de 3 Fases — desinflama, reprograma, mantém.

## Headlines
1. Como perder 8kg em 90 dias sem contar caloria
2. O erro que 9 em 10 mulheres cometem na dieta
3. Pare de recomeçar toda segunda-feira
EOF

# ── QUIZ ──
write_md "$PROJ/quiz.md" <<'EOF'
# Quiz — Qual seu perfil de emagrecimento?

## Perguntas (5)
1. Quantas dietas você já tentou?
2. O que mais te frustra hoje?
3. Quanto tempo tem por dia?
4. Já teve efeito sanfona?
5. O que te motiva mais?

## Resultados
- Emocional → oferta com comunidade
- Racional → oferta com protocolo
- Pragmático → checklist rápido
EOF

# ── RECUPERAÇÃO + BACKEND ──
write_md "$PROJ/recuperacao.md" <<'EOF'
# Sequência de Recuperação

## Carrinho abandonado (T+1h)
Assunto: Você esqueceu algo importante

## Cartão recusado (imediato)
WhatsApp: Quer tentar em 2x?

## Boleto (T+3d)
Última chance com bônus extra
EOF

write_md "$PROJ/back-end.md" <<'EOF'
# Back-end — Maximização de Ticket

## Upsell 1 (pós-compra)
Programa Avançado Fase 4 — R$ 197

## OTO (janela 4h)
Consultoria 30min — R$ 297

## Downsell
Pack receitas premium — R$ 47
EOF

# ── HTML (neutro Aula 1 / brand Aula 2+) ──
NEUTRO_CSS='body{font-family:Georgia,serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:40px;line-height:1.6}.wrap{max-width:720px;margin:0 auto}h1{font-size:1.8rem}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #333;padding:8px}th{background:#1a1a22}'
BRAND_CSS='body{font-family:Inter,sans-serif;background:#0A0A0F;color:#F5F0FF;margin:0;padding:40px}.wrap{max-width:720px;margin:0 auto}h1{color:#7C3AED}.card{background:#121218;border:1px solid #27272A;border-radius:12px;padding:16px;margin:12px 0}button{background:#7C3AED;color:#F5F0FF;border:none;padding:12px 24px;border-radius:12px;font-weight:600}'

html_wrap() { local title="$1" css="$2" body="$3" out="$4"
  cat > "$out" <<EOF
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>$title</title><style>$css</style></head><body><div class="wrap">$body<p style="color:#666;font-size:0.8rem;margin-top:32px">Academia Fit · $DATE</p></div></body></html>
EOF
}

html_wrap "Pesquisa de Avatar" "$NEUTRO_CSS" "<h1>Pesquisa de Avatar</h1><p>Mulheres 35+ — PT Online</p><blockquote>Já tentei de tudo, perco 3kg e volto tudo.</blockquote><table><tr><th>Dor</th><th>Score</th></tr><tr><td>Efeito sanfona</td><td>9/10</td></tr></table>" "$PROJ/relatorio-avatar.html"

html_wrap "Dossiê FitFlow" "$NEUTRO_CSS" "<h1>FitFlow Academy</h1><p>Hook: Descobri o erro que 9 em 10 mulheres cometem na dieta</p><p><strong>Brecha:</strong> não fala de manutenção</p>" "$PROJ/espiao/dossie-fitflow.html"

html_wrap "Trends Jul/2026" "$NEUTRO_CSS" "<h1>Tendências Jul/2026</h1><p>Carrossel antes/depois honesto (+220% engajamento)</p>" "$PROJ/trends-2026-07.html"

html_wrap "Variações de Hook" "$NEUTRO_CSS" "<h1>Variações de Hook</h1><p>A: O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo</p>" "$PROJ/variacoes-hooks.html"

html_wrap "Swipe File" "$NEUTRO_CSS" "<h1>Briefing Swipe — 34 criativos</h1><table><tr><th>Tipo</th><th>Score</th></tr><tr><td>Confissão</td><td>8.1</td></tr></table>" "$PROJ/swipe/briefing-swipe-file.html"

html_wrap "Swipe Index" "$NEUTRO_CSS" "<h1>Índice Swipe File</h1><p>34 criativos categorizados</p>" "$PROJ/swipe-file-index.html"

html_wrap "Offerbook" "$NEUTRO_CSS" "<h1>Método Consistência 90</h1><p>Mecanismo: Ciclo de 3 Fases</p><p><strong>Preço:</strong> R$ 497</p>" "$PROJ/offerbook.html"

html_wrap "Brand Preview" "$BRAND_CSS" "<h1>Academia Fit</h1><div class=\"card\"><button>CTA primário</button></div>" "$PROJ/preview.html"

html_wrap "Mapa de Execução" "$BRAND_CSS" "<h1>Diagnóstico Nível 4</h1><div class=\"card\"><strong>Próximo:</strong> /quiz-funil</div>" "$PROJ/funil.html"

html_wrap "Quiz" "$BRAND_CSS" "<h1>Qual seu perfil de emagrecimento?</h1><div class=\"card\"><p>Pergunta 1/5: Quantas dietas você já tentou?</p></div><button>Continuar</button>" "$PROJ/pagina/quiz.html"

html_wrap "Resultado Emocional" "$BRAND_CSS" "<h1>Seu perfil: Emocional</h1><div class=\"card\"><p>Oferta com comunidade de apoio</p></div><button>Ver oferta</button>" "$PROJ/pagina/resultado-emocional.html"

html_wrap "E-mail Nutrição" "$BRAND_CSS" "<h1>Maria, você não falhou. A dieta falhou.</h1><p>Nos próximos 5 dias vou te mostrar por quê...</p>" "$PROJ/emails/nutricao.html"

html_wrap "E-mail Venda" "$BRAND_CSS" "<h1>Últimas 12 vagas — Método Consistência 90</h1><p>R$ 497 · Garantia 30 dias</p><button>GARANTIR MINHA VAGA</button>" "$PROJ/emails/venda.html"

html_wrap "Recuperação" "$BRAND_CSS" "<h1>Cascata de Recuperação</h1><table><tr><th>Trigger</th><th>Canal</th></tr><tr><td>Carrinho</td><td>E-mail T+1h</td></tr></table>" "$PROJ/recuperacao.html"

# ── PDFs ──
for html in relatorio-avatar espiao/dossie-fitflow trends-2026-07 variacoes-hooks swipe/briefing-swipe-file offerbook funil recuperacao; do
  f="$PROJ/${html}.html"
  [ -f "$f" ] && bash "$PDF_SH" "$f" || true
done

echo "✓ Bootstrap completo: $PROJ"
find "$PROJ" -type f | wc -l | xargs echo "  arquivos:"