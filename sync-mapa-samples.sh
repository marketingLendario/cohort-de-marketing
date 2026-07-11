#!/usr/bin/env bash
# Copia entregáveis de projetos/academia-fit → mapa-skills-samples/academia-fit
# Regenera PDFs a partir dos HTML copiados.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/projetos/academia-fit"
DST="$ROOT/mapa-skills-samples/academia-fit"
PDF_SH="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"

if [ ! -d "$SRC" ]; then
  echo "ERRO: $SRC não existe. Rode: bash scripts/run-nucleo-cohort.sh"
  exit 1
fi

echo "== sync-mapa-samples =="
echo "Origem: $SRC"
echo "Destino: $DST"
echo ""

mkdir -p "$DST"
rsync -a --delete \
  --include='*.md' --include='*.html' --include='*.pdf' --include='*.json' --include='*.png' \
  --include='*/' --exclude='*' \
  "$SRC/" "$DST/"

echo "Copiados:"
find "$DST" -type f \( -name '*.md' -o -name '*.html' -o -name '*.pdf' -o -name '*.json' -o -name '*.png' \) | sort

echo ""
echo "Regenerando PDFs..."
REGEN=0
while IFS= read -r html; do
  pdf="${html%.html}.pdf"
  if bash "$PDF_SH" "$html" >/dev/null 2>&1; then
    echo "  ✓ PDF: ${html#$DST/}"
    REGEN=$((REGEN + 1))
  else
    echo "  ✗ falhou: ${html#$DST/}"
  fi
done < <(find "$DST" -name '*.html' -type f | sort)

echo ""
echo "Resumo: $(find "$DST" -type f | wc -l | tr -d ' ') arquivos em amostras · $REGEN PDFs regenerados"
echo "Próximo: abra mapa-skills.html via servidor HTTP (python3 -m http.server 8765)"