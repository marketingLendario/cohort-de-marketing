"""
ugc.py — arquetipo UGC / Nativo (parece um story organico do Instagram).

Aqui a marca NAO se impoe como ad polido: o sinal e parecer nativo. Composita
sobre uma foto candid a UI de story (barra de progresso, @handle, link sticker,
barra de resposta) + texto casual estilo story. Furam o radar de "isso e ad".
9:16 por padrao (formato story).
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

ASSETS = alib.OUT_DIR / "brand_assets"


def _font(role, size, brand, weight=None):
    f = ImageFont.truetype(str(alib.font_path(brand, role)), size)
    if weight is not None:
        try: f.set_variation_by_axes([weight])
        except Exception: pass
    return f


def _cover(im, W, H):
    s = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = (im.width - W) // 2; y = (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def render_story(photo_path: str, copy: dict, out_path: str, *,
                 handle: str = "", brand: dict | None = None) -> str:
    if brand is None:
        raise ValueError("UGC requer brand pack explicito")
    spec = brand["formats"]["story"]
    W, H = int(spec["w"]), int(spec["h"])
    identity = brand.get("identity", {})
    handle = handle or str(identity.get("handle") or identity.get("display_name") or "")
    palette = alib.style_palette(brand, "dark")
    img = _cover(Image.open(photo_path).convert("RGB"), W, H)
    # leve gradiente escuro topo+base p/ legibilidade da UI
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        top = max(0, 120 - y) / 120 * 150
        bot = max(0, y - (H - 260)) / 260 * 160
        grad.putpixel((0, y), int(min(160, top + bot)))
    grad = grad.resize((W, H))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    img = Image.composite(dark, img, grad)
    d = ImageDraw.Draw(img, "RGBA")

    # --- barra de progresso (4 segmentos, 2o ativo) ---
    segs, gap, m = 4, 8, 28
    seg_w = (W - 2 * m - (segs - 1) * gap) / segs
    for i in range(segs):
        x0 = m + i * (seg_w + gap)
        col = (255, 255, 255, 235) if i <= 1 else (255, 255, 255, 90)
        d.rounded_rectangle([x0, 26, x0 + seg_w, 30], radius=2, fill=col)

    # --- avatar (icone da marca em anel gold) + handle + tempo ---
    ay = 52
    gold = (*palette["gold"], 255)
    d.ellipse([m, ay, m + 64, ay + 64], outline=gold, width=3)
    icon = ASSETS / "logo_icon-cream.png"
    if icon.exists():
        ic = Image.open(icon).convert("RGBA").resize((40, 40), Image.LANCZOS)
        img.paste(ic, (m + 12, ay + 12), ic)
    f_handle = _font("body", 30, brand, 600)
    f_time = _font("body", 26, brand, 400)
    d.text((m + 80, ay + 6), handle, font=f_handle, fill=(255, 255, 255, 255))
    hw = d.textlength(handle, font=f_handle)
    d.text((m + 80 + hw + 14, ay + 12), "2 h", font=f_time, fill=(255, 255, 255, 170))
    d.text((W - m - 40, ay + 2), "·  ·  ·", font=f_time, fill=(255, 255, 255, 220))

    # --- texto casual estilo story (branco, sombra suave) ---
    f_txt = _font("body", 58, brand, 600)
    text = copy.get("native_text", copy.get("headline", ""))
    words, lines, cur = text.split(), [], ""
    maxw = W - 2 * 56
    for w in words:
        t = (cur + " " + w).strip()
        if cur and d.textlength(t, font=f_txt) > maxw:
            lines.append(cur); cur = w
        else:
            cur = t
    if cur: lines.append(cur)
    # estilo nativo Instagram: highlight preto atras de cada linha (legibilidade
    # garantida sobre qualquer foto, clara ou escura).
    ty = int(H * 0.30)
    pad_x, lh = 18, 76
    for ln in lines:
        tw = d.textlength(ln, font=f_txt)
        d.rounded_rectangle([56 - pad_x, ty - 8, 56 + tw + pad_x, ty + 64],
                            radius=10, fill=(0, 0, 0, 215))
        d.text((56, ty), ln, font=f_txt, fill=(255, 255, 255, 255))
        ty += lh

    # --- link sticker nativo ---
    f_link = _font("body", 30, brand, 700)
    label = str(copy.get("cta", "")).upper()
    lw = d.textlength(label, font=f_link)
    lx, ly = 56, ty + 30
    d.rounded_rectangle([lx, ly, lx + lw + 78, ly + 64], radius=14, fill=(255, 255, 255, 240))
    d.ellipse([lx + 16, ly + 18, lx + 44, ly + 46], outline=(20, 20, 20), width=3)  # link icon
    d.text((lx + 58, ly + 16), label, font=f_link, fill=(20, 20, 20, 255))

    # --- barra de resposta (rodape, autenticidade) ---
    by = H - 96
    d.rounded_rectangle([m, by, W - m - 130, by + 60], radius=30, outline=(255, 255, 255, 150), width=2)
    d.text((m + 28, by + 14), "Envie uma mensagem...", font=_font("body", 28, brand, 400),
           fill=(255, 255, 255, 200))
    d.text((W - m - 110, by + 10), "♡   ⤴", font=_font("body", 34, brand, 500),
           fill=(255, 255, 255, 230))

    img.save(out_path, "PNG")
    return out_path


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("photo")
    ap.add_argument("-o", "--out", default="out/archetype-test/ugc_final.png")
    a = ap.parse_args()
    copy = {"native_text": "", "cta": ""}
    print(render_story(a.photo, copy, a.out, brand=alib.load_brand()))
