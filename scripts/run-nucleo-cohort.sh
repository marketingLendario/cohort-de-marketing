#!/usr/bin/env bash
# Orquestração cohort: coletores → nucleo-from-coleta.mjs → gerar_pdf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="academia-fit"
PROJ="$ROOT/projetos/$SLUG"
NICHO="emagrecimento sustentável mulheres 35+"
DATE="$(date +%d/%m/%Y)"
MANIFEST="$PROJ/.cohort-run.json"
PDF_SH="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"
NUCLEO="node $ROOT/scripts/lib/nucleo-from-coleta.mjs"

log_step() { echo ""; echo "== $1 =="; }
append_manifest() {
  node -e "
const fs=require('fs'); const p=process.argv[1]; const row=JSON.parse(process.argv[2]);
let data={slug:'academia-fit',started_at:new Date().toISOString(),steps:[]};
if(fs.existsSync(p)) data=JSON.parse(fs.readFileSync(p,'utf8'));
data.steps.push(row); data.updated_at=new Date().toISOString();
fs.mkdirSync(require('path').dirname(p),{recursive:true});
fs.writeFileSync(p, JSON.stringify(data,null,2));
" "$MANIFEST" "$1"
}

run_coleta() {
  local skill="$1" script="$2" out="$3"
  shift 3
  log_step "$skill — $(basename "$script")"
  mkdir -p "$(dirname "$PROJ/$out")"
  "$@" > "$PROJ/$out" 2>&1 || true
  append_manifest "{\"skill\":\"$skill\",\"script\":\"$(basename "$script")\",\"coleta\":\"$out\",\"at\":\"$(date -Iseconds)\"}"
}

build_skill() {
  local skill="$1"
  log_step "$skill — nucleo-from-coleta"
  $NUCLEO --skill "$skill" --proj "projetos/$SLUG" --nicho "$NICHO" --date "$DATE"
  append_manifest "{\"skill\":\"$skill\",\"script\":\"nucleo-from-coleta.mjs\",\"at\":\"$(date -Iseconds)\"}"
}

pdf_for() {
  local html="$1"
  [ -f "$PROJ/$html" ] && bash "$PDF_SH" "$PROJ/$html" || true
}

mkdir -p "$PROJ"/{espiao,swipe,pesquisa-avatar-2026-07,pagina,emails}
: > "$PROJ/.cohort-run.log"
echo "{\"slug\":\"$SLUG\",\"started_at\":\"$(date -Iseconds)\",\"steps\":[]}" > "$MANIFEST"

# /comecar
log_step "comecar"
[ ! -f "$ROOT/.env" ] && cp "$ROOT/.env.example" "$ROOT/.env"
append_manifest "{\"skill\":\"comecar\",\"action\":\"env_setup\",\"at\":\"$(date -Iseconds)\"}"
cat > "$PROJ/SETUP.md" <<EOF
# Ambiente — $SLUG
Fluxo: bash scripts/run-nucleo-cohort.sh
Nicho: $NICHO
Data: $DATE
EOF

# N12 ordem
run_coleta avatar-funil "$ROOT/.claude/skills/avatar-funil/scripts/coletor_dor.py" \
  pesquisa-avatar-2026-07/coleta-roteiro.txt \
  python3 "$ROOT/.claude/skills/avatar-funil/scripts/coletor_dor.py" todas "$NICHO"
build_skill avatar-funil
pdf_for relatorio-avatar.html

run_coleta espiao-do-concorrente "$ROOT/.claude/skills/espiao-do-concorrente/scripts/coletor_web.py" \
  espiao/coleta-roteiro.txt \
  python3 "$ROOT/.claude/skills/espiao-do-concorrente/scripts/coletor_web.py" todas "FitFlow Academy"
build_skill espiao-do-concorrente
pdf_for espiao/dossie-fitflow.html

build_skill trend-hunting
pdf_for trends-2026-07.html
pdf_for variacoes-hooks.html

build_skill swipe-file
pdf_for swipe/briefing-swipe-file.html
pdf_for swipe-file-index.html

build_skill offerbook
python3 "$ROOT/.claude/skills/offerbook/scripts/gerar_html.py" "$PROJ/offerbook.md" --output "$PROJ/offerbook.html"
append_manifest "{\"skill\":\"offerbook\",\"script\":\"gerar_html.py\",\"at\":\"$(date -Iseconds)\"}"
pdf_for offerbook.html

build_skill design-md
pdf_for preview.html

build_skill metodo-funil
pdf_for funil.html

build_skill copy-funil
build_skill quiz-funil
pdf_for pagina/quiz.html
pdf_for pagina/resultado-emocional.html

build_skill email-funil
pdf_for emails/nutricao.html
pdf_for emails/venda.html

build_skill recuperacao-funil
pdf_for recuperacao.html

build_skill backend-funil

log_step "concluído"
echo "✓ $PROJ ($(find "$PROJ" -type f ! -name '.cohort-run.log' | wc -l | tr -d ' ') arquivos)"