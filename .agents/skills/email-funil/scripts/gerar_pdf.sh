#!/bin/bash
# ===================================================================
# gerar_pdf.sh - Gera PDF a partir do HTML do relatorio
# ===================================================================
#
# Uso: ./gerar_pdf.sh relatorio-avatar.html
# Saida: relatorio-avatar.pdf no mesmo diretorio
#
# Funciona em macOS, Windows (Git Bash) e Linux. Tenta na ordem:
# 1. Chrome headless (mais bonito, mantem fontes web)
# 2. Edge headless (fallback Windows - ja vem instalado)
# 3. wkhtmltopdf (fallback Linux/CI)
# 4. Se nada funcionar, instrui o usuario a imprimir manualmente
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

# ---------- Tentativa 1: Chrome/Edge headless ----------
CHROME=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser "Google Chrome" chrome msedge; do
  if command -v "$cmd" &> /dev/null; then
    CHROME="$cmd"
    break
  fi
done

# Mac: caminhos padrao do Chrome
if [ -z "$CHROME" ] && [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

# Windows (Git Bash): caminhos padrao do Chrome e do Edge (o Edge ja vem no Windows)
if [ -z "$CHROME" ]; then
  for p in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe"; do
    if [ -f "$p" ]; then
      CHROME="$p"
      break
    fi
  done
fi

if [ -n "$CHROME" ]; then
  echo "[1/3] Usando Chrome/Edge headless..."
  # No Windows o navegador exige file:///C:/... — cygpath -m converte /c/Users/... nesse formato.
  # Fora do Git Bash (Mac/Linux) o cygpath nao existe: cai no caminho absoluto normal.
  HTML_URL="file://$(cygpath -m "$HTML_ABS" 2>/dev/null || echo "$HTML_ABS")"
  # set -e esta ativo: se o Chrome sair com codigo != 0, o || true evita matar o script
  # antes dos fallbacks. O sucesso e checado pela EXISTENCIA do PDF logo abaixo.
  "$CHROME" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --print-to-pdf="$PDF_FILE" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    --virtual-time-budget=10000 \
    "$HTML_URL" 2>/dev/null || true

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
echo "  2. Pressione Cmd+P (Mac) ou Ctrl+P (Windows/Linux)"
echo "  3. Em 'Destino', escolha 'Salvar como PDF'"
echo "  4. Salve como: $PDF_FILE"
echo ""
echo "Ou instale o Chrome (recomendado) ou wkhtmltopdf:"
echo "  macOS:   brew install --cask google-chrome"
echo "  Windows: winget install Google.Chrome"
echo "  Linux:   apt/dnf install chromium (ou wkhtmltopdf)"

# Abre o HTML no navegador padrao pra facilitar
if [ "$(uname)" = "Darwin" ]; then
  open "$HTML_FILE"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$HTML_FILE"
elif command -v cmd.exe &> /dev/null; then
  cmd.exe /c start "" "$(cygpath -w "$HTML_FILE" 2>/dev/null || echo "$HTML_FILE")"
fi

exit 1
