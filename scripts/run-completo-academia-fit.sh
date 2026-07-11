#!/usr/bin/env bash
# Gera entregáveis completos academia-fit + PDFs + PNGs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PDF="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"
PNG="$ROOT/.claude/skills/criativos-funil/scripts/gerar_png.sh"
PROJ="$ROOT/projetos/academia-fit"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "== coleta-apify-academia-fit =="
bash "$ROOT/scripts/coleta-apify-academia-fit.sh" || echo "  (coleta falhou — usando dados existentes)"

echo ""
echo "== gerar-completo-academia-fit =="
node "$ROOT/scripts/gerar-completo-academia-fit.mjs"

echo ""
echo "== PDFs =="
while IFS= read -r html; do
  bash "$PDF" "$html" >/dev/null 2>&1 && echo "  ✓ ${html#$PROJ/}" || echo "  ✗ ${html#$PROJ/}"
done < <(find "$PROJ" -name '*.html' -type f | sort)

echo ""
echo "== PNGs criativos =="
if [ -d "$PROJ/criativos/banners" ]; then
  bash "$PNG" "$PROJ/criativos/banners" 1080 1350 feed 2>/dev/null || true
  bash "$PNG" "$PROJ/criativos/banners" 1080 1920 story 2>/dev/null || true
  bash "$PNG" "$PROJ/criativos/banners" 1080 1080 quadrado 2>/dev/null || true
  ls "$PROJ/criativos/banners"/*.png 2>/dev/null | wc -l | xargs echo "  PNGs:"
fi

echo ""
echo "✓ Completo: $(find "$PROJ" -type f | wc -l | tr -d ' ') arquivos"