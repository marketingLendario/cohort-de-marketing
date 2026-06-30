#!/bin/bash
# ===================================================================
# gerar_pdf.sh - Gera PDF a partir do HTML do relatorio
# ===================================================================
#
# Uso: ./gerar_pdf.sh relatorio-avatar.html
# Saida: relatorio-avatar.pdf no mesmo diretorio
#
# Tenta na ordem:
# 1. Chrome headless (mais bonito, mantem fontes web)
# 2. Safari -> Print to PDF via AppleScript (Mac)
# 3. wkhtmltopdf (fallback Linux/CI)
# 4. Se nada funcionar, instrui o usuario a fazer Cmd+P manualmente
#
# ===================================================================

set -e

HTML_FILE="${1:-}"

if [ -z "$HTML_FILE" ]; then
  echo "Uso: $0 caminho/para/diagnostico.html"
  exit 1
fi

if [ ! -f "$HTML_FILE" ]; then
  echo "ERRO: arquivo nao encontrado: $HTML_FILE"
  exit 1
fi

PDF_FILE="${HTML_FILE%.html}.pdf"
HTML_ABS="$(cd "$(dirname "$HTML_FILE")" && pwd)/$(basename "$HTML_FILE")"

echo "Gerando PDF a partir de: $HTML_FILE"
echo "Saida: $PDF_FILE"
echo ""

# ---------- Tentativa 1: Chrome headless ----------
CHROME=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser "Google Chrome"; do
  if command -v "$cmd" &> /dev/null; then
    CHROME="$cmd"
    break
  fi
done

# Mac: caminhos padrao do Chrome
if [ -z "$CHROME" ] && [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

if [ -n "$CHROME" ]; then
  echo "[1/3] Usando Chrome headless..."
  "$CHROME" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --print-to-pdf="$PDF_FILE" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    --virtual-time-budget=10000 \
    "file://$HTML_ABS" 2>/dev/null

  if [ -f "$PDF_FILE" ]; then
    echo "PDF gerado: $PDF_FILE"
    exit 0
  fi
fi

# ---------- Tentativa 2: wkhtmltopdf ----------
if command -v wkhtmltopdf &> /dev/null; then
  echo "[2/3] Usando wkhtmltopdf..."
  wkhtmltopdf --enable-local-file-access "$HTML_FILE" "$PDF_FILE"
  if [ -f "$PDF_FILE" ]; then
    echo "PDF gerado: $PDF_FILE"
    exit 0
  fi
fi

# ---------- Fallback: instrucao manual ----------
echo "[3/3] Nenhuma ferramenta de PDF disponivel automaticamente."
echo ""
echo "Para gerar o PDF manualmente:"
echo "  1. Abra o arquivo: $HTML_FILE no navegador"
echo "  2. Pressione Cmd+P (Mac) ou Ctrl+P (Win)"
echo "  3. Em 'Destino', escolha 'Salvar como PDF'"
echo "  4. Salve como: $PDF_FILE"
echo ""
echo "Ou instale o Chrome (recomendado) ou wkhtmltopdf:"
echo "  brew install --cask google-chrome"
echo "  brew install wkhtmltopdf"

# Abre o HTML no navegador padrao pra facilitar
if [ "$(uname)" = "Darwin" ]; then
  open "$HTML_FILE"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$HTML_FILE"
fi

exit 1
