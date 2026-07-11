#!/usr/bin/env bash
# Coleta Apify real — Instagram + TikTok — academia-fit
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRAPER="$ROOT/.claude/skills/conteudo-funil/scripts/apify_scraper.py"
OUT="$ROOT/projetos/academia-fit/coleta-apify-2026-07"
mkdir -p "$OUT"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

run() {
  local label="$1"
  shift
  echo "== $label =="
  if python3 "$SCRAPER" "$@" >"$OUT/.tmp.json" 2>"$OUT/.err"; then
    local n
    n=$(python3 -c "import json; d=json.load(open('$OUT/.tmp.json')); print(len(d) if isinstance(d,list) else 0)" 2>/dev/null || echo 0)
    echo "  ✓ $n itens"
    echo "$n"
  else
    echo "  ✗ falhou (ver $OUT/.err)"
    echo "[]" >"$OUT/.tmp.json"
    echo 0
  fi
}

IG=$(run "Instagram @emagrecerdevez,nutricaoemmovimento" instagram-posts "emagrecerdevez,nutricaoemmovimento" --limit 15)
mv "$OUT/.tmp.json" "$OUT/instagram-posts.json"

TT_P=$(run "TikTok perfis" tiktok-profile "emagrecerdevez" --limit 20)
mv "$OUT/.tmp.json" "$OUT/tiktok-perfis.json"

TT_H=$(run "TikTok #menopausa" tiktok-hashtag "menopausa" --limit 20)
mv "$OUT/.tmp.json" "$OUT/tiktok-hashtags.json"

cat >"$OUT/relatorio-coleta.md" <<EOF
# Coleta Apify — academia-fit

Data: $(date '+%d/%m/%Y %H:%M')
Actor Instagram: apify~instagram-post-scraper (username[])
Actor TikTok: clockworks~free-tiktok-scraper

| Fonte | Itens |
|-------|-------|
| instagram-posts.json | $IG |
| tiktok-perfis.json | $TT_P |
| tiktok-hashtags.json | $TT_H |

## Comando

\`\`\`bash
bash scripts/coleta-apify-academia-fit.sh
\`\`\`
EOF

rm -f "$OUT/.err"
echo ""
echo "✓ Coleta salva em $OUT"