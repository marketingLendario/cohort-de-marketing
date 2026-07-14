"""
didactic.py — arquetipo Didatico / Comparativo (design de informacao).

3 ESTILOS visualmente distintos (variacao interna anti-saturacao):
  - dark_columns : duas colunas X/check sobre fundo escuro
  - dark_stacked : dois paineis empilhados (achismo em cima dim / numero embaixo gold)
  - light_check  : checklist sobre fundo CLARO (cream), texto escuro
O factory escolhe um estilo diferente por peca do mesmo arquetipo.
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

ASSETS = alib.OUT_DIR / "brand_assets"


def style_for_index(index: int) -> str:
    """Map a catalog position to one of the renderer's implemented layouts."""
    slot = index % 3
    if slot == 1:
        return "dark_stacked"
    if slot == 2:
        return "light_check"
    return "dark_columns"


def _font(role, s, brand, w=None):
    f = ImageFont.truetype(str(alib.font_path(brand, role)), s)
    if w is not None:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f


def _bg(W, H, brand, light=False):
    palette = alib.style_palette(brand, "light" if light else "dark")
    base_rgb = palette["surface"]
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy = W * 0.5, H * 0.42
    r = np.sqrt(((xx - cx) / W) ** 2 + ((yy - cy) / H) ** 2)
    if light:
        base = np.clip(base_rgb[0] - r * 26, 0, 255)
        arr = base.astype(np.uint8)
        rgb = np.stack([arr, np.clip(arr * base_rgb[1] / max(base_rgb[0], 1), 0, 255).astype(np.uint8),
                        np.clip(arr * base_rgb[2] / max(base_rgb[0], 1), 0, 255).astype(np.uint8)], 2)
    else:
        base = np.clip(base_rgb[0] - r * 26, 0, 255)
        grain = np.random.default_rng(7).standard_normal((H, W)) * 2.0
        arr = np.clip(base + grain, 0, 255).astype(np.uint8)
        rgb = np.stack([arr, np.clip(arr * base_rgb[1] / max(base_rgb[0], 1), 0, 255).astype(np.uint8),
                        np.clip(arr * base_rgb[2] / max(base_rgb[0], 1), 0, 255).astype(np.uint8)], 2)
    return Image.fromarray(rgb, "RGB")


def _logo(img, W, H, brand, light=False):
    icon = ASSETS / ("logo_icon-light.png" if light else "logo_icon-cream.png")
    if icon.exists() and alib.has_logo_assets(brand):
        ic = Image.open(icon).convert("RGBA")
        s = int(W * 0.06); ic = ic.resize((s, int(ic.height * s / ic.width)), Image.LANCZOS)
        img.paste(ic, (W - s - 50, H - ic.height - 50), ic)


def _title(d, MX, y, copy, ink, accent, dim, fh, femph):
    d.text((MX, y), copy.get("title_left", "Achismo"), font=fh, fill=ink)
    x = MX + d.textlength(copy.get("title_left", "Achismo"), font=fh)
    d.text((x, y), copy.get("title_mid", ""), font=fh, fill=dim)
    x += d.textlength(copy.get("title_mid", " ou "), font=fh)
    d.text((x, y - 10), copy.get("title_right", "número?"), font=femph, fill=accent)


def _x_mark(d, x, y, col):
    d.ellipse([x, y + 6, x + 26, y + 32], outline=col, width=3)
    d.line([(x + 7, y + 13), (x + 19, y + 25)], fill=col, width=3)
    d.line([(x + 19, y + 13), (x + 7, y + 25)], fill=col, width=3)


def _check(d, x, y, col):
    d.ellipse([x, y + 6, x + 26, y + 32], outline=col, width=3)
    d.line([(x + 7, y + 19), (x + 13, y + 26)], fill=col, width=3)
    d.line([(x + 13, y + 26), (x + 22, y + 12)], fill=col, width=3)


def render_compare(copy: dict, out_path: str, *, H: int = 1350, style: str = "dark_columns",
                   brand: dict | None = None) -> str:
    if brand is None:
        raise ValueError("comparativo requer brand pack explicito")
    W = 1080
    light = style == "light_check"
    img = _bg(W, H, brand, light)
    d = ImageDraw.Draw(img, "RGBA")
    MX = 72
    P = alib.style_palette(brand, "light" if light else "dark")
    ink, accent = P["ink"], P["gold"]
    sub_ink = P["dim"]
    redx = P["dim"]
    f_eye = _font("mono", 22, brand, 500)
    f_h = _font("body", 78, brand, 700)
    f_emph = _font("emphasis", 96, brand)
    f_col = _font("mono", 26, brand, 600)
    f_item = _font("body", 33, brand, 500)
    f_cta = _font("body", 27, brand, 600)
    left, right = copy.get("left", []), copy.get("right", [])
    n = max(len(left), len(right))

    if style == "dark_stacked":
        # dois paineis empilhados: ACHISMO (dim) em cima, NUMERO (gold) embaixo
        content_h = 54 + 150 + 2 * (50 + n * 70) + 40 + 64
        y = max(80, (H - content_h) // 2)
        d.text((MX, y), copy.get("eyebrow", "").upper(), font=f_eye, fill=accent); y += 54
        _title(d, MX, y, copy, ink, accent, sub_ink, f_h, f_emph); y += 150
        # painel achismo
        d.rounded_rectangle([MX - 20, y - 16, W - MX + 20, y + 40 + len(left) * 70],
                            radius=18, fill=(255, 255, 255, 12))
        d.text((MX, y), copy.get("title_left", "").upper(), font=f_col, fill=redx); iy = y + 50
        for it in left:
            _x_mark(d, MX, iy, redx); d.text((MX + 40, iy + 2), it, font=f_item, fill=sub_ink); iy += 70
        y = iy + 28
        d.rounded_rectangle([MX - 20, y - 16, W - MX + 20, y + 40 + len(right) * 70],
                            radius=18, outline=(201, 178, 152, 70), width=2)
        d.text((MX, y), copy.get("title_right", "").upper().rstrip("?"), font=f_col, fill=accent); iy = y + 50
        for it in right:
            _check(d, MX, iy, accent); d.text((MX + 40, iy + 2), it, font=f_item, fill=ink); iy += 70
        cy = iy + 36
    else:
        # colunas (dark ou light)
        content_h = 54 + 150 + 56 + n * 92 + 50 + 64
        y = max(96, (H - content_h) // 2)
        d.text((MX, y), copy.get("eyebrow", "").upper(), font=f_eye, fill=accent); y += 54
        _title(d, MX, y, copy, ink, accent, sub_ink, f_h, f_emph); y += 150
        colW = (W - 2 * MX - 36) / 2
        xL, xR = MX, MX + colW + 36
        d.text((xL, y), copy.get("title_left", "").upper(), font=f_col, fill=redx)
        d.text((xR, y), copy.get("title_right", "").upper().rstrip("?"), font=f_col, fill=accent)
        line_col = (0, 0, 0, 40) if light else (255, 255, 255, 30)
        d.line([(xR - 18, y - 6), (xR - 18, y + 6 + n * 92)], fill=line_col, width=2)
        iy = y + 56
        for it in left:
            _x_mark(d, xL, iy, redx); d.text((xL + 40, iy + 2), it, font=f_item, fill=sub_ink); iy += 92
        iy = y + 56
        for it in right:
            _check(d, xR, iy, accent); d.text((xR + 40, iy + 2), it, font=f_item, fill=ink); iy += 92
        cy = iy + 50

    cta = copy.get("cta", "")
    if cta:
        tw = d.textlength(cta, font=f_cta)
        d.rounded_rectangle([MX, cy, MX + tw + 60, cy + 64], radius=32, outline=ink, width=2)
        d.text((MX + 30, cy + 16), cta, font=f_cta, fill=ink)
    _logo(img, W, H, brand, light)
    img.convert("RGB").save(out_path, "PNG")
    return out_path


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(); ap.add_argument("--style", default="dark_columns")
    ap.add_argument("-o", "--out", default="out/archetype-test/didactic_demo.png")
    a = ap.parse_args()
    copy = {"eyebrow": "MARKETING DE RECEITA COM IA", "title_left": "Achismo",
            "title_mid": " ou ", "title_right": "número?",
            "left": ["Você acha que dá lucro", "Não sabe seu CAC", "Decide no escuro"],
            "right": ["Você sabe se dá lucro", "Lê CAC, ROAS e LTV", "Decide com dado"],
            "cta": "Quero aprender a ler"}
    print(render_compare(copy, a.out, style=a.style, brand=alib.load_brand()))
