"""
refine.py — alavanca 6 (loop de auto-refino).

Gera -> avalia no gate -> se abaixo do threshold, deriva instrucoes corretivas
do que o gate reclamou, injeta no prompt e regenera. Repete ate pass ou max_iter.
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import generate as gen
import gate as gate_mod


# mapeia falha do gate -> instrucao corretiva injetada no prompt
def _corrections(gate_res: dict) -> list[str]:
    fixes = []
    checks = gate_res.get("checks", {})
    if not checks.get("gold_coverage", {}).get("pass", True):
        v = checks["gold_coverage"]["value_pct"]
        if v < checks["gold_coverage"]["min"]:
            fixes.append("Make the single gold accent noticeably MORE present and "
                         "luminous (a confident glowing gold element), while still "
                         "keeping gold under 8% of the frame.")
        else:
            fixes.append("REDUCE the amount of gold — use it only as ONE small "
                         "accent, well under 8% of the frame.")
    if not checks.get("dark_first", {}).get("pass", True):
        fixes.append("Make the background darker and more dominant (deep near-black, dark-first).")
    if not checks.get("neon_violation", {}).get("pass", True):
        fixes.append("Absolutely remove any purple or blue neon/saturated colors. "
                     "Only black, cream and muted gold are allowed.")
    if not checks.get("richness", {}).get("pass", True):
        fixes.append("Use a more asymmetric, editorial composition with stronger "
                     "visual tension and a clear focal element — avoid a flat, "
                     "dead-centered layout.")
    if not checks.get("contrast_proxy", {}).get("pass", True):
        fixes.append("Increase text contrast — cream text must read crisply on the dark background.")
    return fixes


def refine(brand: dict, hook: dict, out_path: str, *, fmt: str = "feed",
           max_iter: int = 3, target_verdict: str = "pass",
           use_style_anchors: bool = True) -> dict:
    history = []
    base_hook = dict(hook)
    for it in range(1, max_iter + 1):
        cand = f"{out_path.rsplit('.png',1)[0]}__it{it}.png"
        res = gen.generate_one(brand, base_hook, cand, fmt=fmt,
                               use_style_anchors=use_style_anchors)
        if not res["ok"]:
            history.append({"iter": it, "ok": False, "log": res.get("log_tail")})
            continue
        gr = gate_mod.evaluate(cand, brand)
        history.append({"iter": it, "path": cand, "verdict": gr["verdict"],
                        "slop": gr["ai_slop_score"], "brand": gr["brand_adherence_pct"]})
        rank = {"pass": 2, "warn": 1, "fail": 0}
        if rank[gr["verdict"]] >= rank[target_verdict]:
            return {"final": cand, "gate": gr, "iters": it, "history": history}
        # injeta correcoes na receita visual para a proxima iteracao
        fixes = _corrections(gr)
        base_hook = dict(hook)
        base_hook["visual_recipe"] = hook.get("visual_recipe", "") + " " + " ".join(fixes)
    # nenhum atingiu o alvo: devolve o melhor por brand_adherence
    best = max((h for h in history if h.get("path")),
               key=lambda h: h.get("brand", 0), default=None)
    return {"final": best["path"] if best else None, "gate": None,
            "iters": max_iter, "history": history, "note": "target nao atingido; melhor candidato"}


if __name__ == "__main__":
    import json, argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--headline", required=True)
    ap.add_argument("--emphasis", default="")
    ap.add_argument("--eyebrow", default="")
    ap.add_argument("--cta", default="")
    ap.add_argument("--recipe", default="poster editorial premium dark")
    ap.add_argument("--max-iter", type=int, default=3)
    ap.add_argument("-o", "--out", default=str(alib.OUT_DIR / "refined.png"))
    a = ap.parse_args()
    brand = alib.load_brand()
    hook = {"headline": a.headline, "emphasis_word": a.emphasis,
            "eyebrow": a.eyebrow, "cta": a.cta, "visual_recipe": a.recipe}
    out = refine(brand, hook, a.out, max_iter=a.max_iter)
    print(json.dumps(out, indent=2, ensure_ascii=False))
