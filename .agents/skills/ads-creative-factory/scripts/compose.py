"""
compose.py — alavanca 4 (logo compositing deterministico).

Sobrepoe o LOGO REAL (asset fixo, nunca difundido) na safe-zone do criativo.
Regras de marca: usar sempre logo completo OU icone; nunca alterar forma/fonte/
icone; cor cream para superficie escura. Posicao default: rodape centralizado.

Tambem pode aplicar um selo de simbolo (lemniscata/oito/lentes) como assinatura.
"""
from __future__ import annotations
import sys, argparse
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

ASSETS_OUT = alib.OUT_DIR / "brand_assets"

POSITIONS = {
    "bottom-center", "bottom-left", "bottom-right", "top-left", "top-right",
}


def _load_rgba(p) -> Image.Image:
    return Image.open(p).convert("RGBA")


def compose_logo(img_path: str, out_path: str, *, variant: str = "full",
                 surface: str = "dark", position: str | None = None,
                 width_pct: float | None = None, margin_pct: float = 4.0,
                 opacity: float = 0.92) -> str:
    """Compoe o logo sobre o criativo — DISCRETO por padrao.
    variant: 'full' (lockup) ou 'icon' (Silhueta-AL).
    surface: 'dark' (cream), 'light' (black), 'gold'.
    Defaults por variante: icone pequeno num canto; lockup um pouco maior, rodape.
    """
    # tamanho/posicao default por variante (icone = MUITO menor que o lockup)
    if width_pct is None:
        width_pct = 6.0 if variant == "icon" else 22.0
    if position is None:
        position = "bottom-right" if variant == "icon" else "bottom-center"
    base = Image.open(img_path).convert("RGBA")
    W, H = base.size

    logo_file = ASSETS_OUT / f"logo_{'full' if variant=='full' else 'icon'}-{surface}.png"
    if not logo_file.exists():
        raise FileNotFoundError(f"asset ausente: {logo_file} (rode prepare_assets.py)")
    logo = _load_rgba(logo_file)

    target_w = int(W * width_pct / 100.0)
    scale = target_w / logo.width
    logo = logo.resize((target_w, max(1, int(logo.height * scale))), Image.LANCZOS)

    if opacity < 1.0:
        a = logo.split()[3].point(lambda p: int(p * opacity))
        logo.putalpha(a)

    m = int(min(W, H) * margin_pct / 100.0)
    lw, lh = logo.size
    if position == "bottom-center":
        pos = ((W - lw) // 2, H - lh - m)
    elif position == "bottom-left":
        pos = (m, H - lh - m)
    elif position == "bottom-right":
        pos = (W - lw - m, H - lh - m)
    elif position == "top-left":
        pos = (m, m)
    elif position == "top-right":
        pos = (W - lw - m, m)
    else:
        pos = ((W - lw) // 2, H - lh - m)

    base.alpha_composite(logo, pos)
    out = Path(out_path)
    base.convert("RGB").save(out, "PNG")
    # sidecar: pegada do logo para o guard de revisao final
    import json as _json
    _json.dump({"variant": variant, "width_pct": width_pct, "position": position,
                "logo_w": lw, "logo_h": lh,
                "area_pct": round(100.0 * (lw * lh) / (W * H), 2)},
               open(str(out) + ".logo.json", "w"))
    return str(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("img")
    ap.add_argument("-o", "--out", default=None)
    ap.add_argument("--variant", choices=["full", "icon"], default="full")
    ap.add_argument("--surface", choices=["dark", "light", "gold"], default="dark")
    ap.add_argument("--position", default="bottom-center", choices=sorted(POSITIONS))
    ap.add_argument("--width-pct", type=float, default=26.0)
    ap.add_argument("--margin-pct", type=float, default=5.0)
    a = ap.parse_args()
    out = a.out or str(Path(a.img).with_name(Path(a.img).stem + "__logo.png"))
    r = compose_logo(a.img, out, variant=a.variant, surface=a.surface,
                     position=a.position, width_pct=a.width_pct, margin_pct=a.margin_pct)
    print("composto:", r)
