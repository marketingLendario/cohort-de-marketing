"""
review.py — Fase 7: REVISAO DA PECA FINAL (a etapa que faltava).

O gate (Fase 4) roda no candidato ANTES do logo. Esta revisao roda na peca
ENTREGAVEL (pos logo + finish), em duas camadas:

  1. Programatica (barata, sempre): re-roda o gate na final + guard de proporcao
     do logo (le o sidecar .logo.json) + checa sangria de conteudo nas bordas.
  2. Visual (olho de diretor de arte): NAO e feita aqui — e delegada a um agente
     de visao (review_brief() monta o prompt). Programatico nao pega "grosseiro".

Nenhuma peca deve ser ENTREGUE sem passar pela camada 1 e (idealmente) pela 2.
"""
from __future__ import annotations
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import gate as gate_mod

# proporcao maxima do logo (% da area do frame) por variante — discreto
LOGO_MAX_AREA_PCT = {"icon": 2.8, "full": 9.0}


def _logo_footprint(final_path: str) -> dict | None:
    side = Path(final_path + ".logo.json")
    if not side.exists():
        # tenta o sidecar do arquivo __logo.png (antes do finish)
        alt = Path(str(final_path).replace("__final.png", "__logo.png") + ".logo.json")
        side = alt if alt.exists() else side
    if side.exists():
        return json.load(open(side))
    return None


def _edge_bleed(img_path: str, band: int = 6, thr: int = 70) -> dict:
    """Detecta conteudo claro encostando nas bordas (texto/elemento cortado)."""
    arr = np.asarray(Image.open(img_path).convert("L"), dtype=np.int16)
    edges = {
        "top": arr[:band, :], "bottom": arr[-band:, :],
        "left": arr[:, :band], "right": arr[:, -band:],
    }
    hits = {k: float((v > thr).mean() * 100) for k, v in edges.items()}
    worst = max(hits.values())
    return {"per_edge_pct": {k: round(v, 1) for k, v in hits.items()},
            "bleed": worst > 3.0}   # >3% de pixels claros colados na borda = suspeita


def review_final(final_path: str, brand: dict, logo_variant: str = "icon",
                 text_margin_safe: bool = False, theme: str = "dark",
                 gate_result: dict | None = None) -> dict:
    """text_margin_safe=True (modo hibrido): o texto e composto dentro de margens
    fixas, entao 'sangria nas bordas' so pode ser o FUNDO (atmosfera intencional).
    theme: passado ao gate (archetype-aware).
    gate_result: resultado ja computado para esta final; evita reavaliar o gate."""
    g = gate_result if gate_result is not None else gate_mod.evaluate(
        final_path, brand, theme=theme)
    fp = _logo_footprint(final_path)
    cap = LOGO_MAX_AREA_PCT.get(logo_variant, 9.0)
    logo_ok = True
    logo_note = "sem sidecar de logo"
    if fp:
        logo_ok = fp["area_pct"] <= cap
        logo_note = f"logo {fp['area_pct']}% da area (max {cap}%) — {'ok' if logo_ok else 'GRANDE DEMAIS'}"
    bleed = _edge_bleed(final_path)
    # hibrido (margens fixas) e UGC nativo (foto full-bleed) sangram POR DESIGN
    flag_bleed = bleed["bleed"] and not text_margin_safe and theme != "native"
    reasons = []
    if g["verdict"] == "fail":
        reasons.append("gate na final: fail")
    if not logo_ok:
        reasons.append(logo_note)
    if flag_bleed:
        reasons.append(f"possivel sangria de conteudo nas bordas: {bleed['per_edge_pct']}")
    verdict = "fail" if (g["verdict"] == "fail" or not logo_ok) else (
              "review" if flag_bleed else "pass")
    return {"final": final_path, "gate_final": g["verdict"],
            "logo": logo_note, "logo_ok": logo_ok, "edge_bleed": bleed["bleed"],
            "verdict": verdict, "reasons": reasons,
            "needs_human_eye": True}   # camada 2 (visao) sempre recomendada


def review_brief(final_path: str) -> str:
    """Prompt para um agente de visao revisar a peca final (camada 2)."""
    return (
        "Revise esta peça de anúncio FINAL como diretor de arte. Está publicável? "
        "Cheque: (a) o logo/símbolo está discreto e bem posicionado (não gigante, "
        "não grosseiro)? (b) o texto está legível, sem corte nas bordas, sem erro? "
        "(c) a composição é forte e on-brand (dark premium, gold como acento)? "
        "(d) há algum elemento estranho/artefato? Responda: verdict (pass|revise), "
        "e se revise, o que corrigir. Arquivo: " + final_path)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("finals", nargs="+")
    ap.add_argument("--variant", default="icon")
    a = ap.parse_args()
    brand = alib.load_brand()
    for f in a.finals:
        r = review_final(f, brand, logo_variant=a.variant)
        print(f"{Path(f).name}: {r['verdict']:6s} | {r['logo']} | bleed={r['edge_bleed']}")
        for rs in r["reasons"]:
            print("   -", rs)
