#!/bin/bash
# ===================================================================
# gerar_png.sh - Captura cada slide-*.html de um diretorio como PNG
# ===================================================================
#
# Uso: ./gerar_png.sh caminho/para/pasta-do-carrossel/
# Saida: slide-01.png, slide-02.png, ... no mesmo diretorio
#
# Cada slide e capturado em 1080x1350 (formato carrossel Instagram)
# via Chrome headless (--screenshot).
#
# Detecta o Chrome nos mesmos caminhos do gerar_pdf.sh (avatar-funil).
# Se nao encontrar, instrui instalacao manual.
# ===================================================================

set -e

DIR="${1:-}"

if [ -z "$DIR" ]; then
  echo "Uso: $0 caminho/para/pasta-do-carrossel/"
  exit 1
fi

if [ ! -d "$DIR" ]; then
  echo "ERRO: diretorio nao encontrado: $DIR"
  exit 1
fi

DIR_ABS="$(cd "$DIR" && pwd)"

# ---------- Detecta o Chrome (mesmos caminhos do gerar_pdf.sh) ----------
CHROME=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser "Google Chrome"; do
  if command -v "$cmd" &> /dev/null; then
    CHROME="$cmd"
    break
  fi
done

# Mac: caminho padrao do Chrome
if [ -z "$CHROME" ] && [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

if [ -z "$CHROME" ]; then
  echo "Nenhum Chrome/Chromium encontrado automaticamente."
  echo ""
  echo "Para gerar os PNGs, instale o Chrome:"
  echo "  brew install --cask google-chrome"
  echo ""
  echo "Ou abra cada slide-*.html no navegador e capture manualmente em 1080x1350."
  exit 1
fi

echo "Chrome: $CHROME"
echo "Pasta:  $DIR_ABS"
echo ""

# ---------- Captura cada slide-*.html ----------
shopt -s nullglob
SLIDES=("$DIR_ABS"/slide-*.html)

if [ ${#SLIDES[@]} -eq 0 ]; then
  echo "ERRO: nenhum slide-*.html encontrado em $DIR_ABS"
  exit 1
fi

COUNT=0
for HTML in "${SLIDES[@]}"; do
  BASENAME="$(basename "$HTML" .html)"
  OUT="$DIR_ABS/$BASENAME.png"
  echo "[$((COUNT+1))/${#SLIDES[@]}] $BASENAME.html -> $BASENAME.png"
  "$CHROME" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --default-background-color=00000000 \
    --force-device-scale-factor=1 \
    --window-size=1080,1350 \
    --screenshot="$OUT" \
    "file://$HTML" 2>/dev/null || true
  if [ -f "$OUT" ]; then
    COUNT=$((COUNT+1))
  else
    echo "  ! falhou: $BASENAME"
  fi
done

echo ""
echo "PNGs gerados: $COUNT de ${#SLIDES[@]}"
