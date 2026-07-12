"""
saturation.py — motor anti-saturacao (o "nunca repetir").

Duas defesas:
  1. Registro de COMBINACOES usadas (mechanism|material|lighting|composition) por
     janela de campanha. sample_diverse consome esse registro como `used`.
  2. Hash perceptual (dHash) entre criativos para bloquear "irmaos demais" mesmo
     quando a combinacao formal difere mas o resultado ficou visualmente igual.

Sem libs externas: dHash via Pillow (gradiente horizontal 9x8).
"""
from __future__ import annotations
import sys, json
from pathlib import Path
from PIL import Image
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

LOG_DIR = alib.OUT_DIR / "_saturation"


# ---------------- registro de combinacoes ---------------- #
def combo_key(mechanism: str, sel: dict) -> str:
    return f"{mechanism}|{sel.get('material')}|{sel.get('lighting')}|{sel.get('composition')}"


def _log_path(window: str) -> Path:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    return LOG_DIR / f"{window}.json"


def load_used(window: str) -> set:
    p = _log_path(window)
    if p.exists():
        d = json.load(open(p))
        return set(d.get("combos", []))
    return set()


def save_used(window: str, combos: set) -> None:
    json.dump({"combos": sorted(combos)}, open(_log_path(window), "w"), indent=2)


# ---------------- hash perceptual (dHash) ---------------- #
def dhash(img_path, size: int = 8) -> int:
    im = Image.open(img_path).convert("L").resize((size + 1, size), Image.LANCZOS)
    arr = np.asarray(im, dtype=np.int16)
    bits_arr = (arr[:, :-1] > arr[:, 1:]).flatten()
    bits = 0
    for bit in bits_arr:
        bits = (bits << 1) | int(bit)
    return bits


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def is_near_duplicate(img_path, existing_paths: list, threshold: int = 10) -> dict:
    """Retorna {duplicate: bool, nearest: path, distance: int}.
    threshold ~10/64: abaixo disso, irmaos visuais demais.
    """
    h = dhash(img_path)
    best, best_d = None, 999
    for p in existing_paths:
        try:
            d = hamming(h, dhash(p))
        except Exception:
            continue
        if d < best_d:
            best, best_d = p, d
    return {"duplicate": best_d <= threshold, "nearest": best, "distance": best_d}


if __name__ == "__main__":
    import glob
    sa = sorted(glob.glob(str(alib.OUT_DIR / "semana-sa" / "*__cand1.png")))
    print("=== matriz de similaridade dHash (semana-sa) ===")
    print("    " + "  ".join(Path(p).name[:3] for p in sa))
    hashes = {p: dhash(p) for p in sa}
    for a in sa:
        row = [f"{hamming(hashes[a], hashes[b]):2d}" for b in sa]
        print(Path(a).name[:3], " ".join(row))
    print("\n(0=identico; <10 = irmaos demais; >20 = bem distintos)")
