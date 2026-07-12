"""
anchors.py — acervo de style-anchors PROPRIO, auto-curado (a autonomia).

Em vez de depender de referencias externas, o sistema usa os PROPRIOS criativos
aprovados como ancoras de estilo — taggeadas por mecanismo. O acervo cresce
sozinho: ao fim de uma campanha, as pecas que passaram no gate (e nao sao
near-duplicates) viram anchors do seu mecanismo. Bootstrap com refs externas em
refs/, depois migra para acervo proprio.

generate.py consome anchors_for(mechanism) como -i (style anchors).
"""
from __future__ import annotations
import sys, json, shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import saturation

ANCHOR_DIR = alib.ROOT / "refs" / "anchors"
LIB_PATH = alib.DATA_DIR / "anchor-library.json"


def load_lib() -> dict:
    if LIB_PATH.exists():
        return json.load(open(LIB_PATH))
    return {"version": "1.0", "anchors": []}


def save_lib(lib: dict) -> None:
    json.dump(lib, open(LIB_PATH, "w"), indent=2, ensure_ascii=False)


def add_anchor(src: str, mechanism: str, source: str, gate: dict | None = None) -> bool:
    """Copia o criativo para o acervo e registra com tag de mecanismo.
    Rejeita se for near-duplicate de um anchor existente do mesmo mecanismo."""
    ANCHOR_DIR.mkdir(parents=True, exist_ok=True)
    lib = load_lib()
    existing = [a["file"] for a in lib["anchors"] if a["mechanism"] == mechanism]
    existing_abs = [str(alib.ROOT / f) for f in existing]
    if existing_abs:
        dup = saturation.is_near_duplicate(src, existing_abs, threshold=8)
        if dup["duplicate"]:
            return False  # ja temos um irmao desse no acervo — nao satura o acervo
    stem = Path(src).stem
    dst = ANCHOR_DIR / f"{mechanism}__{stem}.png"
    shutil.copy(src, dst)
    rel = str(dst.relative_to(alib.ROOT))
    lib["anchors"].append({"file": rel, "mechanism": mechanism,
                           "source": source, "gate": gate or {}})
    save_lib(lib)
    return True


def anchors_for(mechanism: str, k: int = 3) -> list[str]:
    """k anchors do mecanismo; completa com anchors gerais se faltar."""
    lib = load_lib()
    same = [str(alib.ROOT / a["file"]) for a in lib["anchors"] if a["mechanism"] == mechanism]
    other = [str(alib.ROOT / a["file"]) for a in lib["anchors"] if a["mechanism"] != mechanism]
    picks = same[:k]
    if len(picks) < k:
        picks += other[: k - len(picks)]
    return [p for p in picks if Path(p).exists()]


def promote_from_manifest(manifest_path: str, min_brand: float = 90.0) -> int:
    """Auto-curadoria: adiciona ao acervo as pecas aprovadas de uma campanha."""
    m = json.load(open(manifest_path))
    added = 0
    for h in m.get("hooks", []):
        if h.get("status") != "OK":
            continue
        g = h.get("gate") or {}
        if g.get("verdict") == "pass" and g.get("brand_adherence_pct", 0) >= min_brand:
            # usa o candidato sem logo como anchor (estilo puro)
            cand = h.get("candidates", [{}])
            src = None
            for c in cand:
                if c.get("path") and Path(c["path"]).exists():
                    src = c["path"]; break
            src = src or h.get("with_logo")
            if src and Path(src).exists():
                if add_anchor(src, h.get("mechanism", "generic"),
                              f"campaign:{m.get('campaign')}", g):
                    added += 1
    return added


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--promote", help="manifest.json de uma campanha p/ auto-curar")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    if a.promote:
        n = promote_from_manifest(a.promote)
        print(f"acervo: +{n} anchors")
    lib = load_lib()
    by = {}
    for an in lib["anchors"]:
        by.setdefault(an["mechanism"], 0)
        by[an["mechanism"]] += 1
    print(f"acervo total: {len(lib['anchors'])} anchors")
    for mech, c in sorted(by.items()):
        print(f"  {mech:16s} {c}")
