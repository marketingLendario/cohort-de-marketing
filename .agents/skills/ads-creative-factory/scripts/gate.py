"""
gate.py — deterministic quality gate for pack-driven creative output.

Avalia UMA imagem PNG com medidas objetivas (sem OCR / typo-check, que e feito
por visao/LLM fora deste script) e devolve checks + score + verdict.

Checagens:
  - gold_coverage   : gold dentro da faixa do brand-pack (teto tipico 35% no brand)
  - dark_first      : canvas escuro dominante (dark-first)
  - neon_violation  : anti-Lila — sem roxo/azul neon saturado
  - richness        : anti-flat/template — variancia de bordas suficiente
  - contrast_proxy  : contraste do texto vs fundo real da zona segura (WCAG)

Uso:
  python gate.py <img1> [img2 ...] [--json-out <path>]
"""
from __future__ import annotations

import os
import sys
import json

# Importa a lib compartilhada de forma robusta (independente do cwd).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alib  # noqa: E402

import numpy as np  # noqa: E402


# --------------------------------------------------------------------------- #
# Thresholds do gate (determinísticos)
# --------------------------------------------------------------------------- #
DARK_FIRST_MIN_PCT = 45.0       # dark_pct >= 45 para passar dark-first
NEON_MAX_PCT = 2.0              # purple/blue saturado: fail se > 2%
RICHNESS_MIN_EDGE_VAR = 1.8     # calibrado p/ luxury minimalism (muito espaco negativo)
AI_SLOP_FAIL_THRESHOLD = 60.0   # ai_slop_score > 60 => fail


def _load_rgb(img_path) -> np.ndarray:
    return alib.load_rgb_array(img_path)


def _purple_blue_sat_pct(arr_rgb: np.ndarray) -> float:
    """% de pixels roxo/azul saturados (sinal de AI-slop / paleta proibida).

    Pixel conta se: saturacao > 0.45 E valor > 0.25 E hue na faixa
    aproximada roxo/azul (200-290 graus em HSV).
    """
    hue, sat, value = alib.hsv_components(arr_rgb)
    purple_blue = (hue >= 200.0) & (hue <= 290.0)
    saturated = sat > 0.45
    bright = value > 0.25
    mask = purple_blue & saturated & bright
    return float(mask.mean() * 100.0)


def purple_blue_sat_pct(img_path) -> float:
    return _purple_blue_sat_pct(_load_rgb(img_path))


def _contrast_proxy(arr_rgb: np.ndarray, text_hex: str) -> float:
    h, w = arr_rgb.shape[:2]
    y0, y1 = int(h * 0.12), max(int(h * 0.42), 1)
    x0, x1 = int(w * 0.16), max(int(w * 0.84), 1)
    zone = arr_rgb[y0:y1, x0:x1]
    if zone.size == 0:
        zone = arr_rgb

    # ADR-ACF D4: mede contraste contra o fundo real da zona segura de texto,
    # em vez de comparar palette.text e palette.surface constantes.
    bg_rgb = np.median(zone.reshape(-1, 3), axis=0)
    return alib.contrast_ratio(
        alib.hex_to_rgb(text_hex),
        tuple(float(c) for c in bg_rgb),
    )


def _theme_text_hex(brand: dict, theme: str) -> str:
    ink = alib.style_palette(brand, theme=theme)["ink"]
    return "#{:02x}{:02x}{:02x}".format(*ink)


# --------------------------------------------------------------------------- #
# Gate principal
# --------------------------------------------------------------------------- #
def evaluate(img_path: str, brand: dict, theme: str = "dark",
             profile: dict | None = None) -> dict:
    """theme: 'dark' (dark-first), 'light' (arquetipo claro: fundo claro domina),
    'native' (UGC — nao segue o brand tone; so checa neon/legibilidade)."""
    theme = str(theme or "dark").strip().lower()
    rules = brand.get("rules", {})
    palette = brand.get("palette", {})
    thresholds = (profile or {}).get("thresholds", {})

    gold_min = float(thresholds.get("accent_min_coverage_pct", rules.get("gold_min_coverage_pct", 0.0)))
    gold_max = float(thresholds.get("accent_max_coverage_pct", rules.get("gold_max_coverage_pct", 100.0)))
    min_contrast = float(thresholds.get("min_contrast", rules.get("min_text_contrast", 4.5)))
    dark_first_min = float(thresholds.get("dark_first_min_pct", DARK_FIRST_MIN_PCT))
    neon_max = float(thresholds.get("neon_max_pct", NEON_MAX_PCT))
    richness_min = float(thresholds.get("richness_min_edge_var", RICHNESS_MIN_EDGE_VAR))
    slop_fail = float(thresholds.get("ai_slop_fail_threshold", AI_SLOP_FAIL_THRESHOLD))

    # --- Medidas programaticas (decode unico) --- #
    arr_rgb = _load_rgb(img_path)
    accent_hex = palette["accent"] if palette.get("accent") else palette["gold"]
    gold_pct = alib.accent_coverage_from_rgb(arr_rgb, accent_hex)
    dark_pct = alib.dark_pixel_pct_from_rgb(arr_rgb)
    edge_var = alib.edge_variance_from_rgb(arr_rgb)
    neon_pct = _purple_blue_sat_pct(arr_rgb)
    contrast = _contrast_proxy(arr_rgb, _theme_text_hex(brand, theme))

    # --- Checks (archetype-aware) --- #
    if theme == "light":
        dark_ok = dark_pct <= 55.0          # arquetipo claro: fundo claro domina
    elif theme == "native":
        dark_ok = True                      # UGC nativo nao segue o brand tone
    else:
        dark_ok = dark_pct >= dark_first_min
    gold_ok = True if theme == "native" else (gold_min <= gold_pct <= gold_max)
    neon_ok = neon_pct <= neon_max
    richness_ok = edge_var >= richness_min
    contrast_ok = contrast >= min_contrast

    checks = {
        "gold_coverage": {
            "value_pct": round(gold_pct, 3),
            "min": gold_min,
            "max": gold_max,
            "pass": gold_ok,
        },
        "dark_first": {
            "dark_pct": round(dark_pct, 3),
            "pass": dark_ok,
        },
        "neon_violation": {
            "purple_blue_sat_pct": round(neon_pct, 3),
            "pass": neon_ok,
        },
        "richness": {
            "edge_variance": round(edge_var, 3),
            "pass": richness_ok,
        },
        "contrast_proxy": {
            "value": round(contrast, 3),
            "pass": contrast_ok,
        },
    }

    # --- ai_slop_score (0 limpo .. 100 slop) --- #
    slop = 0.0
    if not neon_ok:
        slop += 40.0
    if not richness_ok:
        slop += 8.0   # minimalismo nao e slop — peso leve, warn-only
    if not gold_ok:
        slop += 15.0
    if not dark_ok:
        slop += 15.0
    if not contrast_ok:
        slop += 10.0
    slop = min(slop, 100.0)

    # --- brand_adherence_pct (0..100) --- #
    # Quatro pilares do brand-pack, peso igual.
    adherence = 0.0
    if gold_ok:
        adherence += 25.0
    if dark_ok:
        adherence += 25.0
    if neon_ok:
        adherence += 25.0
    if contrast_ok:
        adherence += 25.0

    # --- Verdict + reasons --- #
    reasons: list[str] = []
    if not neon_ok:
        reasons.append(
            f"FAIL neon_violation: {neon_pct:.2f}% pixels roxo/azul saturados "
            f"(max {neon_max}%) — paleta proibida / AI-slop"
        )
    if not gold_ok:
        reasons.append(
            f"gold_coverage fora da faixa: {gold_pct:.2f}% "
            f"(esperado {gold_min}-{gold_max}%)"
        )
    if not dark_ok:
        reasons.append(
            f"dark-first insuficiente: {dark_pct:.2f}% pixels escuros "
            f"(min {dark_first_min}%)"
        )
    if not richness_ok:
        reasons.append(
            f"richness baixa (flat/template): edge_variance {edge_var:.2f} "
            f"(min {richness_min})"
        )
    if not contrast_ok:
        reasons.append(
            f"contraste texto/superficie baixo: {contrast:.2f} "
            f"(min {min_contrast})"
        )

    if not neon_ok or not contrast_ok or slop > slop_fail:
        verdict = "fail"
    elif reasons:
        verdict = "warn"
    else:
        verdict = "pass"

    if verdict == "pass":
        reasons.append("OK: respeita o brand-pack em todas as checagens objetivas")

    return {
        "img": img_path,
        "checks": checks,
        "ai_slop_score": round(slop, 1),
        "brand_adherence_pct": round(adherence, 1),
        "gate_profile_id": (profile or {}).get("id"),
        "verdict": verdict,
        "reasons": reasons,
    }


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def _parse_args(argv: list[str]) -> tuple[list[str], str | None]:
    imgs: list[str] = []
    json_out: str | None = None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--json-out":
            if i + 1 >= len(argv):
                print("erro: --json-out requer um caminho", file=sys.stderr)
                sys.exit(2)
            json_out = argv[i + 1]
            i += 2
        else:
            imgs.append(a)
            i += 1
    return imgs, json_out


def main(argv: list[str]) -> int:
    imgs, json_out = _parse_args(argv)
    if not imgs:
        print("uso: python gate.py <img1> [img2 ...] [--json-out <path>]",
              file=sys.stderr)
        return 2

    brand = alib.load_brand()
    results = []
    for img in imgs:
        res = evaluate(img, brand)
        results.append(res)
        print(json.dumps(res, indent=2, ensure_ascii=False))

    if json_out:
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n[gate] {len(results)} resultado(s) salvos em {json_out}",
              file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
