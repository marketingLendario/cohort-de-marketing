"""
tweet.py — arquetipo Meme / Tweet Card (especie nativa emoldurada pela marca).

Um card estilo post/X carregando o hook como "pensamento publicado", flutuando
sobre um backdrop do brand pack com grain — o genero "print repostado" que fura
o radar de ad polido. 2 ESTILOS (variacao interna, eixo `tweet_style`):
  - dark_card  : card escuro sobre superficie escura do pack, com vinheta
  - light_card : card claro sobre superficie clara do pack

100% programatico (PIL) — NENHUMA chamada de geracao de imagem. O autor do
post vem da persona (nome + avatar REAL do persona pack; nunca likeness
gerada) ou da identidade do brand pack. Sem selo de verificado (nao fabricamos
status) e engajamento com numeros organicos, nunca redondos.

Copy do hook (campo opcional `tweet:`; fallback deriva de native_text/headline):
  tweet:
    text: "..."            # texto do post
    time: "10:24"
    stats: { likes: "2,4 mil", shares: "317" }
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import person as person_mod
import compose as compose_mod
from chat import _avatar, _clean, _wrap   # helpers compartilhados da especie nativa

STYLES = ["dark_card", "light_card"]


def style_for_index(index: int) -> str:
    """Map a catalog position to one of the renderer's implemented layouts."""
    return STYLES[index % len(STYLES)]


def _font(role, s, brand, w=None):
    f = ImageFont.truetype(str(alib.font_path(brand, role)), s)
    if w is not None:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f


def _bg(W, H, brand, light=False):
    """Backdrop do pack com gradiente radial + grain (nunca liso e morto)."""
    palette = alib.style_palette(brand, "light" if light else "dark")
    base_rgb = palette["surface"]
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt(((xx - W * 0.5) / W) ** 2 + ((yy - H * 0.42) / H) ** 2)
    base = np.clip(base_rgb[0] - r * 26, 0, 255)
    if not light:
        grain = np.random.default_rng(7).standard_normal((H, W)) * 2.0
        base = np.clip(base + grain, 0, 255)
    arr = base.astype(np.uint8)
    rgb = np.stack([arr,
                    np.clip(arr * base_rgb[1] / max(base_rgb[0], 1), 0, 255).astype(np.uint8),
                    np.clip(arr * base_rgb[2] / max(base_rgb[0], 1), 0, 255).astype(np.uint8)], 2)
    return Image.fromarray(rgb, "RGB")


def render_tweet(copy: dict, out_path: str, *, H: int = 1350,
                 style: str = "dark_card", brand: dict | None = None,
                 persona: dict | None = None) -> str:
    if brand is None:
        raise ValueError("tweet card requer brand pack explicito")
    if style not in STYLES:
        style = style_for_index(0)
    W = 1080
    light = style == "light_card"
    img = _bg(W, H, brand, light)
    d = ImageDraw.Draw(img, "RGBA")
    tw_cfg = copy.get("tweet") or {}
    identity = brand.get("identity", {})
    P = alib.style_palette(brand, "light" if light else "dark")

    author = tw_cfg.get("author") or (persona or {}).get("name") or \
        identity.get("display_name") or identity.get("handle") or ""
    author = _clean(str(author)) or "Autor"
    handle = str(tw_cfg.get("handle") or identity.get("handle") or "").strip()
    handle = ("@" + handle.lstrip("@")) if handle else ""
    photo = None
    if persona:
        try:
            photo = person_mod.pick_photo(persona, brand)
        except Exception:
            photo = None

    text = tw_cfg.get("text") or copy.get("native_text") or " ".join(
        s for s in (copy.get("headline", ""), copy.get("sub", "")) if s).strip()
    time_s = str(tw_cfg.get("time", "10:24"))
    stats = tw_cfg.get("stats") or {"likes": "2,4 mil", "shares": "317"}

    # card em paleta NATIVA de post (a especie e o print); acentos vem do pack
    ink = (26, 23, 18) if light else (231, 233, 234)
    muted = (110, 104, 94) if light else (113, 118, 123)
    card_fill = (255, 255, 255) if light else (21, 24, 28)
    card_line = (0, 0, 0, 28) if light else (255, 255, 255, 26)
    accent = P["gold"]

    # --- mede o conteudo do card (altura dinamica) ---
    MX = 84
    cw = W - 2 * MX
    pad = 44
    f_name = _font("body", 40, brand, 650)
    f_handle = _font("body", 31, brand, 400)
    f_text = _font("body", 47, brand, 430)
    f_meta = _font("body", 29, brand, 400)
    lh = 62
    lines = _wrap(d, text, f_text, cw - 2 * pad)
    ch = pad + 104 + 26 + len(lines) * lh + 24 + 44 + 20 + 56 + pad

    f_eye = _font("mono", 24, brand, 550)
    eyebrow = _clean(copy.get("eyebrow", "")).upper()
    cta = _clean(copy.get("cta", ""))
    f_cta = _font("body", 29, brand, 600)
    total = (54 if eyebrow else 0) + ch + (104 if cta else 0)
    y0 = max(60, (H - total) // 2)

    if eyebrow:
        ew = d.textlength(eyebrow, font=f_eye)
        d.text(((W - ew) / 2, y0), eyebrow, font=f_eye, fill=accent)
        y0 += 54

    # --- card (sombra dura sutil + borda) ---
    d.rounded_rectangle([MX + 10, y0 + 14, MX + cw + 10, y0 + ch + 14], radius=30,
                        fill=(0, 0, 0, 70) if not light else (0, 0, 0, 40))
    d.rounded_rectangle([MX, y0, MX + cw, y0 + ch], radius=30, fill=card_fill)
    d.rounded_rectangle([MX, y0, MX + cw, y0 + ch], radius=30, outline=card_line, width=2)

    # header: avatar real + nome + handle
    av = _avatar(photo, 96, initial=author[:1].upper(), accent=accent)
    img.paste(av, (MX + pad, y0 + pad), av)
    d.text((MX + pad + 120, y0 + pad + 8), author, font=f_name, fill=ink)
    if handle:
        d.text((MX + pad + 120, y0 + pad + 58), handle, font=f_handle, fill=muted)

    # texto do post
    ty = y0 + pad + 104 + 26
    for ln in lines:
        d.text((MX + pad, ty), ln, font=f_text, fill=ink)
        ty += lh

    # meta (hora) + divisor + stats organicos
    ty += 24
    d.text((MX + pad, ty), time_s, font=f_meta, fill=muted)
    ty += 44 + 20
    d.line([(MX + pad, ty), (MX + cw - pad, ty)], fill=card_line, width=2)
    ty += 22
    f_stat = _font("body", 33, brand, 500)
    d.text((MX + pad, ty), f"♡ {stats.get('likes', '2,4 mil')}", font=f_stat, fill=muted)
    # icone de compartilhar desenhado (fontes neutras nao tem o glifo ⤴ — vira tofu)
    sx = MX + pad + 264
    d.line([(sx + 10, ty + 10), (sx + 10, ty + 34)], fill=muted, width=3)
    d.polygon([(sx + 10, ty + 2), (sx + 2, ty + 14), (sx + 18, ty + 14)], fill=muted)
    d.arc([sx - 2, ty + 22, sx + 22, ty + 40], 30, 150, fill=muted, width=3)
    d.text((sx + 34, ty), str(stats.get("shares", "317")), font=f_stat, fill=muted)

    # CTA pilula (fora do card — a moldura de ad e da marca)
    if cta:
        cy = y0 + ch + 44
        ctw = d.textlength(cta, font=f_cta)
        cx = (W - (ctw + 64)) / 2
        d.rounded_rectangle([cx, cy, cx + ctw + 64, cy + 62], radius=31,
                            outline=accent, width=2)
        d.text((cx + 32, cy + 15), cta, font=f_cta, fill=P["ink"])

    img.save(out_path, "PNG")
    # logo real composto discreto (asset fixo, nunca difundido) + sidecar
    # .logo.json — habilita o guard de proporcao do review.py. Opcional:
    # marcas de DESIGN.md podem nao empacotar logo.
    if alib.has_logo_assets(brand):
        compose_mod.compose_logo(out_path, out_path, variant="icon",
                                 surface="light" if light else "dark")
    return out_path


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", default="dark_card", choices=STYLES)
    ap.add_argument("-o", "--out", default="out/archetype-test/tweet_demo.png")
    a = ap.parse_args()
    copy = {"eyebrow": "PERFORMANCE",
            "native_text": "gastei 3 anos achando que marketing era criativo bonito. era planilha. quem lê os números imprime dinheiro. o resto imprime post.",
            "cta": "Quero aprender a ler"}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    print(render_tweet(copy, a.out, style=a.style, brand=alib.load_brand()))
