#!/usr/bin/env bash
# Entregáveis pós-núcleo — skills 14–25 (academia-fit)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/projetos/academia-fit"
PDF_SH="$ROOT/.claude/skills/avatar-funil/scripts/gerar_pdf.sh"
DATE="07/07/2026"
BRAND_CSS='body{font-family:Inter,sans-serif;background:#0A0A0F;color:#F5F0FF;margin:0;padding:40px;line-height:1.6}.wrap{max-width:720px;margin:0 auto}h1{color:#7C3AED}.card{background:#121218;border:1px solid #27272A;border-radius:12px;padding:16px;margin:12px 0}button{background:#7C3AED;color:#F5F0FF;border:none;padding:12px 24px;border-radius:12px;font-weight:600;width:100%;margin-top:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #27272A;padding:8px}th{background:#1a1a22;color:#22C7B1}'

mkdir -p "$PROJ"/{conteudo,criativos/banners,pagina,bonus,mockups}

write_md() { local f="$1"; mkdir -p "$(dirname "$f")"; cat > "$f"; }

html_wrap() {
  local title="$1" body="$2" out="$3"
  cat > "$out" <<EOF
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>$title</title><style>$BRAND_CSS</style></head><body><div class="wrap">$body<p style="color:#666;font-size:0.8rem;margin-top:32px">Academia Fit · $DATE</p></div></body></html>
EOF
}

# ── vsl-funil ──
write_md "$PROJ/vsl.md" <<'EOF'
# Roteiro VSL — Método Consistência 90

## Hook (0:00–0:30)
"Se você já perdeu peso e voltou tudo, o problema não é você. É o ciclo que ninguém te ensinou a quebrar."

## Agitação (0:30–2:00)
Efeito sanfona, culpa, espelho. Ancorado em: "Demorei anos para conseguir lidar com essa relação" (Gshow, Amanda Meirelles, 08/01/2026).

## Mecanismo (2:00–5:00)
Ciclo de 3 Fases: Desinflamar → Reprogramar → Manter.

## Stack + CTA (12:00–15:00)
Método Consistência 90 · R$ 497 · Garantia 30 dias.
EOF

html_wrap "VSL" '<h1>Emagreça sem recomeçar toda segunda</h1><div class="card" style="aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;color:#555">▶ Vídeo VSL</div><button>QUERO COMEÇAR AGORA</button>' "$PROJ/pagina/vsl.html"

# ── advertorial-funil ──
write_md "$PROJ/advertorial.md" <<'EOF'
# Advertorial — Estilo editorial

## Lead
"Nutricionista revela por que 90% das dietas falham após 21 dias"

## Narrativa
Maria, 42 anos, efeito sanfona após menopausa. Descobriu que inflamação e hábito, não força de vontade, explicam a recaída.

## Transição
"Foi quando encontrei o protocolo de 3 fases que mudou tudo..."

## CTA
Assistir apresentação gratuita (VSL).
EOF

html_wrap "Advertorial" '<p style="color:#888;font-size:0.85rem">Saúde & Bem-estar · 5 min</p><h1>Nutricionista revela por que 90% das dietas falham</h1><div class="card">Maria tinha 42 anos quando percebeu que o problema não era falta de força de vontade...</div>' "$PROJ/pagina/advertorial.html"

# ── lancamento-funil ──
write_md "$PROJ/lancamento.md" <<'EOF'
# Lançamento PLF — Método Consistência 90

## Pré-lançamento (7 dias)
- PLC 1: Oportunidade (O ciclo de 3 fases)
- PLC 2: Transformação (Cases reais)
- PLC 3: Propriedade (Por que só nós temos)

## Carrinho
Abre: 14/07 · Fecha: 16/07 · Escassez: 50 vagas
EOF

html_wrap "Lançamento PLF" '<h1>Sequência de Lançamento</h1><table><tr><th>Fase</th><th>Conteúdo</th></tr><tr><td>PLC 1</td><td>Oportunidade</td></tr><tr><td>PLC 2</td><td>Transformação</td></tr><tr><td>Abertura</td><td>14/07 — 50 vagas</td></tr></table>' "$PROJ/lancamento.html"

# ── webinario-funil ──
write_md "$PROJ/webinario.md" <<'EOF'
# Webinário — Roteiro completo

## Abertura (10 min)
Promessa: "Como perder 8kg em 90 dias sem dieta restritiva"

## 3 Segredos
1. Por que contar caloria sabota seu metabolismo
2. O ritual de 12 minutos
3. A fase que 99% das dietas ignoram (manutenção)

## Fechamento
Stack + escassez: vagas limitadas ao vivo
EOF

html_wrap "Registro Webinário" '<h1>Descubra o método de 3 fases</h1><div class="card"><input placeholder="Seu melhor e-mail" style="width:100%;padding:10px;background:#1a1a22;border:1px solid #333;border-radius:8px;color:#fff"></div><button>RESERVAR MINHA VAGA</button>' "$PROJ/pagina/registro.html"

# ── pagina-vendas-funil ──
write_md "$PROJ/pagina/pagina-vendas.md" <<'EOF'
# Página de Vendas — 16 elementos

1. Headline: Como perder 8kg em 90 dias sem contar caloria
2. Sub: Sem dieta restritiva, sem efeito sanfona
3. VSL embed
4. Mecanismo único (3 fases)
5. Stack de valor
6. Ancoragem R$ 2.691 → R$ 497
7. Garantia 30 dias
8. FAQ (7 objeções)
9. CTA repetido (4x)
EOF

html_wrap "Página de Vendas" '<h1>Como perder 8kg em 90 dias sem contar caloria</h1><p style="color:#888">Sem dieta restritiva · Sem efeito sanfona</p><div class="card"><s style="color:#666">R$ 2.691</s> <strong style="color:#F59E0B;font-size:1.3rem">R$ 497</strong></div><button>QUERO COMEÇAR</button>' "$PROJ/pagina/index.html"

# ── conteudo-funil ──
write_md "$PROJ/conteudo/roteiros.md" <<'EOF'
# Roteiros de Conteúdo — Semana 1

## Reel 1 (Nível 5 — problema)
**Hook:** "Você não é preguiçosa. Sua dieta é que está errada."
**Corpo:** 3 sinais de dieta inflamatória
**CTA:** Salva pra assistir depois

## Carrossel 1 (Nível 4)
7 slides: O ciclo da sanfona explicado
EOF

html_wrap "Roteiros" '<h1>Roteiros Semana 1</h1><div class="card"><strong>Reel 1:</strong> Você não é preguiçosa. Sua dieta é que está errada.</div>' "$PROJ/conteudo/roteiros.html"

# ── criativos-funil ──
write_md "$PROJ/criativos/roteiros.md" <<'EOF'
# Criativos — modelados do FitFlow

## Vídeo 1 (feed 4:5)
**Hook:** "Descobri o erro que 9 em 10 mulheres cometem"
**Corpo:** adaptado ao Método Consistência 90
**CTA:** Link na bio

## Banner estático (1:1)
Headline + mockup do produto + CTA
EOF

# ── whatsapp-funil ──
write_md "$PROJ/whatsapp.md" <<'EOF'
# Sequência WhatsApp

## Confirmação de compra (imediato)
Oi {{nome}}! Sua vaga no Método Consistência 90 está confirmada. Acesso em 5 min.

## Carrinho abandonado (T+2h)
{{nome}}, vi que você quase entrou. Ainda dá tempo — 12 vagas restantes.

## Nutrição D+3
Hoje: por que a Fase 1 começa desinflamando (não cortando caloria).
EOF

# ── mockup-produto-funil ──
write_md "$PROJ/mockups/prompts.md" <<'EOF'
# Prompts de Mockup — DESIGN.md

## Capa do programa
Dark premium, roxo #7C3AED, título "Método Consistência 90", mulher 40+ confiante, sem stock genérico.

## Bundle de bônus
Stack de 3 ebooks + checklist, sombra suave, fundo #0A0A0F.
EOF

# ── bonus-funil ──
write_md "$PROJ/bonus/checklist-semanal.md" <<'EOF'
# Checklist Semanal — Bônus

## Segunda
- [ ] 2L água antes do meio-dia
- [ ] Caminhada 20 min

## Quarta
- [ ] Revisar cardápio Fase 1
- [ ] Registrar energia (1–10)

## Sexta
- [ ] Preparar lanche anti-inflamação
EOF

html_wrap "Checklist Semanal" '<h1>Checklist Semanal</h1><div class="card">☐ 2L água · ☐ Caminhada 20 min · ☐ Cardápio Fase 1</div>' "$PROJ/bonus/checklist-semanal.html"

# ── cro-funil ──
write_md "$PROJ/cro.md" <<'EOF'
# CRO — Plano de testes

## KPIs por etapa
| Etapa | Meta |
|-------|------|
| Quiz → Lead | 35% |
| Lead → Checkout | 8% |
| Checkout → Compra | 25% |

## Teste A/B #1 (prioridade)
**Elemento:** Headline da página de vendas
**A:** Como perder 8kg em 90 dias sem contar caloria
**B:** Pare de recomeçar toda segunda-feira
**Mínimo:** 1.000 views únicos por variante
EOF

html_wrap "CRO" '<h1>Plano CRO</h1><table><tr><th>Etapa</th><th>Meta</th></tr><tr><td>Quiz → Lead</td><td>35%</td></tr><tr><td>Checkout → Compra</td><td>25%</td></tr></table>' "$PROJ/cro.html"

# ── status-funil ──
write_md "$PROJ/status.md" <<'EOF'
# Status do Funil — academia-fit

## N12 (núcleo) — completo
- [x] avatar-funil
- [x] espiao-do-concorrente
- [x] trend-hunting
- [x] swipe-file
- [x] offerbook
- [x] design-md
- [x] metodo-funil
- [x] copy-funil
- [x] quiz-funil
- [x] email-funil
- [x] recuperacao-funil
- [x] backend-funil

## Pós-núcleo — completo
- [x] vsl-funil
- [x] advertorial-funil
- [x] lancamento-funil
- [x] webinario-funil
- [x] pagina-vendas-funil
- [x] conteudo-funil
- [x] criativos-funil
- [x] whatsapp-funil
- [x] mockup-produto-funil
- [x] bonus-funil
- [x] cro-funil

## Próximo passo
Rodar tráfego no quiz + teste A/B headline (cro-funil).
EOF

# PDFs
for html in pagina/vsl pagina/advertorial lancamento pagina/registro pagina/index conteudo/roteiros bonus/checklist-semanal cro; do
  f="$PROJ/${html}.html"
  [ -f "$f" ] && bash "$PDF_SH" "$f" || true
done

echo "✓ Pós-núcleo: $(find "$PROJ" -type f | wc -l | tr -d ' ') arquivos"