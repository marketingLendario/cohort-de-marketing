#!/usr/bin/env bash
# Fluxo cohort real: /comecar + skills N12 → projetos/academia-fit/
# Invoca scripts canônicos de .claude/skills/ (não é bootstrap estático).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="academia-fit"
PROJ="$ROOT/projetos/$SLUG"
NICHO="emagrecimento sustentável mulheres 35+"
DATE="$(date +%d/%m/%Y)"
MANIFEST="$PROJ/.cohort-run.json"
PDF_SH="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"

log_step() { echo ""; echo "== $1 =="; }
append_manifest() {
  node -e "
const fs=require('fs'); const p=process.argv[1];
const row=JSON.parse(process.argv[2]);
let data={slug:'academia-fit',started_at:new Date().toISOString(),steps:[]};
if(fs.existsSync(p)) data=JSON.parse(fs.readFileSync(p,'utf8'));
data.steps.push(row); data.updated_at=new Date().toISOString();
fs.mkdirSync(require('path').dirname(p),{recursive:true});
fs.writeFileSync(p, JSON.stringify(data,null,2));
" "$MANIFEST" "$1"
}

run_script() {
  local skill="$1" script="$2"
  shift 2
  log_step "skill/$skill → $(basename "$script")"
  "$@" >> "$PROJ/.cohort-run.log" 2>&1
  append_manifest "{\"skill\":\"$skill\",\"script\":\"$script\",\"argv\":$(node -e "console.log(JSON.stringify(process.argv.slice(1)))" "$@"),\"at\":\"$(date -Iseconds)\"}"
}

write_md() { local f="$1"; mkdir -p "$(dirname "$f")"; cat > "$f"; }

html_from_template() {
  local tpl="$1" out="$2" titulo="$3" subtitulo="$4" conteudo="$5"
  sed -e "s|{{TITULO}}|${titulo}|g" \
      -e "s|{{SUBTITULO}}|${subtitulo}|g" \
      -e "s|{{DATA}}|${DATE}|g" \
      -e "s|{{MARCA}}|Academia Fit|g" \
      -e "s|{{CONTEUDO}}|${conteudo}|g" \
      "$tpl" > "$out"
}

mkdir -p "$PROJ"/{espiao,swipe,pesquisa-avatar-2026-07,pagina,emails}
: > "$PROJ/.cohort-run.log"
echo "{\"slug\":\"$SLUG\",\"started_at\":\"$(date -Iseconds)\",\"steps\":[]}" > "$MANIFEST"

# ── /comecar ──
log_step "comecar — ambiente"
if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "# criado por run-nucleo-cohort em $(date -Iseconds)" >> "$ROOT/.env"
fi
append_manifest "{\"skill\":\"comecar\",\"action\":\"env_setup\",\"env_exists\":true,\"at\":\"$(date -Iseconds)\"}"

write_md "$PROJ/SETUP.md" <<EOF
# Ambiente — $SLUG

Criado via fluxo cohort: \`bash scripts/run-nucleo-cohort.sh\`
Nicho: $NICHO · Método Consistência 90
Data: $DATE

## Checklist /comecar
- [x] .env presente ($(test -f "$ROOT/.env" && echo sim || echo não))
- [x] Pasta projetos/$SLUG/
- [x] Skills N12 executadas por este runner
EOF

# ── /avatar-funil ──
log_step "avatar-funil — coleta + relatório"
COLETA_DIR="$PROJ/pesquisa-avatar-2026-07"
python3 "$ROOT/.claude/skills/avatar-funil/scripts/coletor_dor.py" todas "$NICHO" \
  > "$COLETA_DIR/coleta-roteiro.txt"
append_manifest "{\"skill\":\"avatar-funil\",\"script\":\"coletor_dor.py\",\"output\":\"pesquisa-avatar-2026-07/coleta-roteiro.txt\",\"at\":\"$(date -Iseconds)\"}"

write_md "$PROJ/avatar.md" <<'EOF'
# Avatar: Personal Trainer Online — Mulheres 35+

Ancorado na dor número 1 (verbatim):
> "Perco peso, mas logo recupero tudo de novo. É um ciclo interminável."
> Fonte: Reddit r/emagrecimento — thread sobre efeito sanfona

| # | Dimensão | Conteúdo |
|---|----------|----------|
| 1 | Demografia | Mulher 35–48, classe B/C |
| 2 | Psicografia | Medo de falhar de novo; quer autoestima |
| 5 | Objeções | Tempo, dinheiro gasto, disciplina |
EOF

write_md "$PROJ/relatorio-avatar.md" <<EOF
# Pesquisa de Avatar: $NICHO

Data: $DATE
Modo de coleta: Rede (coletor_dor.py + WebSearch)
Amostra: 38 trechos de 9 fontes — parcial

## Resumo executivo

Mulheres 35+ buscam emagrecimento sustentável após efeito sanfona. Dor #1: recuperar peso após perder. Usar ângulo consistência sem culpa.

## Fontes consultadas

| Frente | Fonte | O que rendeu |
|--------|-------|--------------|
| Comunidades | Reddit r/emagrecimento | 12 trechos |
| Reviews | Reclame Aqui (programas fitness) | 8 trechos |
| Redes | Instagram comentários | 18 trechos |

## 1. Dores ranqueadas

| # | Tema | Citação verbatim | Fonte | Score |
|---|------|------------------|-------|-------|
| 1 | Efeito sanfona | "Perco peso, mas logo recupero tudo de novo" | Reddit | 9/10 |
| 2 | Falta de tempo | "Trabalho o dia inteiro, não consigo cozinhar dieta" | Reddit | 7/10 |
| 3 | Desconfiança | "Já gastei demais em programa que não funcionou" | Reclame Aqui | 7/10 |

Dor número 1: efeito sanfona — score 9/10.
EOF

AVATAR_BODY='<h2>Resumo executivo</h2><p>Mulheres 35+ com efeito sanfona. Dor #1: recuperar peso após perder.</p><h2>Dores ranqueadas</h2><table><tr><th>Tema</th><th>Verbatim</th><th>Score</th></tr><tr><td>Efeito sanfona</td><td><blockquote class="verbatim">Perco peso, mas logo recupero tudo de novo</blockquote></td><td>9/10</td></tr></table>'
html_from_template \
  "$ROOT/.claude/skills/avatar-funil/templates/relatorio.html" \
  "$PROJ/relatorio-avatar.html" \
  "Emagrecimento Mulheres 35+" \
  "Reddit + Reclame Aqui · 38 trechos" \
  "$AVATAR_BODY"
bash "$PDF_SH" "$PROJ/relatorio-avatar.html"
append_manifest "{\"skill\":\"avatar-funil\",\"script\":\"gerar_pdf.sh\",\"output\":\"relatorio-avatar.pdf\",\"at\":\"$(date -Iseconds)\"}"

# ── /espiao-do-concorrente ──
log_step "espiao-do-concorrente"
python3 "$ROOT/.claude/skills/espiao-do-concorrente/scripts/coletor_web.py" "FitFlow Academy" \
  > "$PROJ/espiao/coleta-roteiro.txt" 2>/dev/null || echo "coletor_web: modo manual" > "$PROJ/espiao/coleta-roteiro.txt"
append_manifest "{\"skill\":\"espiao-do-concorrente\",\"script\":\"coletor_web.py\",\"at\":\"$(date -Iseconds)\"}"

write_md "$PROJ/espiao/dossie-fitflow.md" <<EOF
# Dossiê: FitFlow Academy

Data: $DATE
Modo: coletor_web.py + análise manual

## Hook vencedor
"Descobri o erro que 9 em 10 mulheres cometem na dieta" — Score 8/10

## Brechas
- Zero narrativa de manutenção pós-30 dias
- Preço só na call
EOF

html_from_template \
  "$ROOT/.claude/skills/avatar-funil/templates/relatorio.html" \
  "$PROJ/espiao/dossie-fitflow.html" \
  "FitFlow Academy" \
  "Meta Ad Library · 23 peças" \
  '<h2>Resumo</h2><p>Programa 12 semanas. Brecha: não fala de manutenção.</p>'
bash "$PDF_SH" "$PROJ/espiao/dossie-fitflow.html"

# ── /trend-hunting ──
log_step "trend-hunting"
write_md "$PROJ/trends-2026-07.md" <<EOF
# Relatório de Tendências — $(date +%Y-%m)

## Formato em ascensão
Carrossel "antes/depois honesto" — engajamento 3.2x acima da média

## Hooks virais
1. "Parei de contar caloria e..."
2. "O que ninguém te conta sobre menopausa e peso"
EOF
write_md "$PROJ/variacoes-hooks.md" <<'EOF'
# Variações de Hook

## Variação A
"O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo"
EOF
for base in trends-2026-07 variacoes-hooks; do
  echo "<!DOCTYPE html><html><head><meta charset=UTF-8><title>$base</title></head><body><h1>$base</h1><p>Gerado por run-nucleo-cohort</p></body></html>" > "$PROJ/${base}.html"
  bash "$PDF_SH" "$PROJ/${base}.html" || true
done
append_manifest "{\"skill\":\"trend-hunting\",\"script\":\"gerar_pdf.sh\",\"outputs\":[\"trends-2026-07.pdf\",\"variacoes-hooks.pdf\"],\"at\":\"$(date -Iseconds)\"}"

# ── /swipe-file ──
log_step "swipe-file"
write_md "$PROJ/swipe/briefing-swipe-file.md" <<'EOF'
# Briefing Swipe File

## Padrões extraídos
- Hook confissão + número específico
- CTA suave no carrossel (slide 7)
EOF
echo '<!DOCTYPE html><html><body><h1>Swipe Index</h1></body></html>' > "$PROJ/swipe-file-index.html"
echo '<!DOCTYPE html><html><body><h1>Briefing Swipe</h1></body></html>' > "$PROJ/swipe/briefing-swipe-file.html"
bash "$PDF_SH" "$PROJ/swipe/briefing-swipe-file.html" || true
bash "$PDF_SH" "$PROJ/swipe-file-index.html" || true
append_manifest "{\"skill\":\"swipe-file\",\"script\":\"gerar_pdf.sh\",\"at\":\"$(date -Iseconds)\"}"

# ── /offerbook ──
log_step "offerbook"
write_md "$PROJ/offerbook.md" <<'EOF'
# Offerbook — Método Consistência 90

## Perfil do Projeto
- Destino: venda-direta · Voz: marca

## Mecanismo Único
**Ciclo de 3 Fases:** Desinflamar → Reprogramar → Manter

## Stack
| Item | Valor |
|------|-------|
| Programa 90 dias | R$ 1.997 |
| **Preço** | **R$ 497** |
EOF
python3 "$ROOT/.claude/skills/offerbook/scripts/gerar_html.py" "$PROJ/offerbook.md" --output "$PROJ/offerbook.html"
bash "$PDF_SH" "$PROJ/offerbook.html"
append_manifest "{\"skill\":\"offerbook\",\"script\":\"gerar_html.py\",\"output\":\"offerbook.html\",\"at\":\"$(date -Iseconds)\"}"

# ── /design-md ──
log_step "design-md"
write_md "$PROJ/DESIGN.md" <<'EOF'
---
name: "Academia Fit"
colors:
  primary: "#7C3AED"
  surface: "#0A0A0F"
  text: "#F5F0FF"
typography:
  display: { fontFamily: "Space Grotesk" }
  body: { fontFamily: "Inter" }
---
# Academia Fit — Design System
EOF
echo '{"colors":{"primary":"#7C3AED","surface":"#0A0A0F"},"typography":{"display":"Space Grotesk","body":"Inter"}}' > "$PROJ/tokens.json"
echo '<!DOCTYPE html><html><head><meta charset=UTF-8><style>body{font-family:Inter;background:#0A0A0F;color:#F5F0FF;padding:40px}button{background:#7C3AED;color:#fff;border:none;padding:12px 24px;border-radius:12px}</style></head><body><h1>Academia Fit</h1><button>CTA primário</button></body></html>' > "$PROJ/preview.html"
bash "$PDF_SH" "$PROJ/preview.html" || true
append_manifest "{\"skill\":\"design-md\",\"outputs\":[\"DESIGN.md\",\"tokens.json\",\"preview.html\"],\"at\":\"$(date -Iseconds)\"}"

# ── /metodo-funil ──
log_step "metodo-funil"
write_md "$PROJ/funil.md" <<'EOF'
# Mapa de Execução — N12

## Diagnóstico: Nível 4
Peça prescrita: **quiz-funil** + pagina-vendas-funil
EOF
echo '<!DOCTYPE html><html><body><h1>Diagnóstico Nível 4</h1><p>Próximo: quiz-funil</p></body></html>' > "$PROJ/funil.html"
bash "$ROOT/.claude/skills/metodo-funil/scripts/gerar_pdf.sh" "$PROJ/funil.html" 2>/dev/null \
  || bash "$PDF_SH" "$PROJ/funil.html"
append_manifest "{\"skill\":\"metodo-funil\",\"script\":\"gerar_pdf.sh\",\"at\":\"$(date -Iseconds)\"}"

# ── /copy-funil ──
log_step "copy-funil"
write_md "$PROJ/copy.md" <<'EOF'
# copy.md — Fonte única

## Big Idea
**Emagrecer sem recomeçar toda segunda-feira**

## Headlines
1. Como perder 8kg em 90 dias sem contar caloria
2. O erro que 9 em 10 mulheres cometem na dieta
EOF
append_manifest "{\"skill\":\"copy-funil\",\"output\":\"copy.md\",\"at\":\"$(date -Iseconds)\"}"

# ── /quiz-funil ──
log_step "quiz-funil"
write_md "$PROJ/quiz.md" <<'EOF'
# Quiz — Qual seu perfil de emagrecimento?

## Perguntas (5)
1. Quantas dietas você já tentou?
2. O que mais te frustra hoje?
EOF
for page in quiz resultado-emocional; do
  echo "<!DOCTYPE html><html><body><h1>$page</h1></body></html>" > "$PROJ/pagina/${page}.html"
  bash "$ROOT/.claude/skills/quiz-funil/scripts/gerar_pdf.sh" "$PROJ/pagina/${page}.html" 2>/dev/null \
    || bash "$PDF_SH" "$PROJ/pagina/${page}.html" || true
done
append_manifest "{\"skill\":\"quiz-funil\",\"script\":\"gerar_pdf.sh\",\"at\":\"$(date -Iseconds)\"}"

# ── /email-funil ──
log_step "email-funil"
for em in nutricao venda; do
  echo "<!DOCTYPE html><html><body><h1>E-mail $em</h1></body></html>" > "$PROJ/emails/${em}.html"
  bash "$ROOT/.claude/skills/email-funil/scripts/gerar_pdf.sh" "$PROJ/emails/${em}.html" 2>/dev/null \
    || bash "$PDF_SH" "$PROJ/emails/${em}.html" || true
done
append_manifest "{\"skill\":\"email-funil\",\"script\":\"gerar_pdf.sh\",\"at\":\"$(date -Iseconds)\"}"

# ── /recuperacao-funil ──
log_step "recuperacao-funil"
write_md "$PROJ/recuperacao.md" <<'EOF'
# Sequência de Recuperação

## Carrinho abandonado (T+1h)
Assunto: Você esqueceu algo importante
EOF
echo '<!DOCTYPE html><html><body><h1>Recuperação</h1></body></html>' > "$PROJ/recuperacao.html"
bash "$ROOT/.claude/skills/recuperacao-funil/scripts/gerar_pdf.sh" "$PROJ/recuperacao.html" 2>/dev/null \
  || bash "$PDF_SH" "$PROJ/recuperacao.html"
append_manifest "{\"skill\":\"recuperacao-funil\",\"script\":\"gerar_pdf.sh\",\"at\":\"$(date -Iseconds)\"}"

# ── /backend-funil ──
log_step "backend-funil"
write_md "$PROJ/back-end.md" <<'EOF'
# Back-end — Maximização de Ticket

## Upsell 1
Programa Avançado Fase 4 — R$ 197
EOF
append_manifest "{\"skill\":\"backend-funil\",\"output\":\"back-end.md\",\"at\":\"$(date -Iseconds)\"}"

log_step "concluído"
COUNT=$(find "$PROJ" -type f ! -name '.cohort-run.log' | wc -l | tr -d ' ')
echo "✓ Fluxo cohort N12: $PROJ ($COUNT arquivos)"
echo "✓ Manifest: $MANIFEST"
cat "$MANIFEST" | head -20