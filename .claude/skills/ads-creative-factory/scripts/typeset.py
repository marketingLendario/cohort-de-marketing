"""
typeset.py — composicao TIPOGRAFICA VETORIAL (modo hibrido).

O GPT Image gera so o FUNDO/cena (sem texto). Este modulo compoe o texto por
cima em vetor, com as FONTES REAIS da marca, leading/kerning/posicao sob controle
total e baseline-alignment entre a sans (corpo) e a serif italica (palavra de
carga). Resolve de vez a inconsistencia de leading da difusao + da fidelidade de
fonte da marca.

Layout editorial: eyebrow (mono) / headline (Inter Tight + palavra de carga em
Instrument Serif Italic gold) / sub (sans dim) / CTA (pilula outline). Ancorado
no terco superior; a cena fica na zona reservada (rodape/lateral).
"""
from __future__ import annotations
import sys, re, math, contextvars
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

FONTS = alib.ROOT / "fonts"
_BRAND_CONTEXT: contextvars.ContextVar[dict | None] = contextvars.ContextVar(
    "acf_typeset_brand", default=None
)
# Paletas por TEMA — o mesmo typeset serve dark e light (arquétipos distintos).
THEMES = {
    "dark": {                      # texto claro sobre fundo escuro
        "ink":  (237, 235, 230),   # #edebe6 cream = texto primário
        "dim":  (190, 184, 172),   # sub
        "gold": (201, 178, 152),   # #c9b298 palavra de carga
        "mono": (160, 138, 104),   # eyebrow
        "cta":  (237, 235, 230),
        "line": (62, 54, 45),
        "track": (42, 38, 32),
        "surface": (18, 18, 22),
    },
    "light": {                     # texto escuro sobre fundo claro/branco
        "ink":  (26, 23, 18),      # #1a1712 quase-preto = texto primário
        "dim":  (96, 86, 70),      # sub
        "gold": (104, 84, 58),     # gold-ink profundo para texto AA no tema claro
        "mono": (104, 84, 58),
        "cta":  (26, 23, 18),
        "line": (194, 180, 158),
        "track": (220, 210, 194),
        "surface": (244, 239, 230),
    },
}
PAL = THEMES["dark"]   # retrocompat
GHOST_NUMBER_ALPHA = 12
GHOST_NUMBER_TEXT_CLEAR_RATIO = 0.62
ITEM_DUO_NUMBER_CLEARANCE = 12
CODE_PUNCTUATION = ".,;:!?"


def _font(path: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    brand = _BRAND_CONTEXT.get()
    if brand is not None:
        role = ("emphasis" if "Italic" in path else
                "heading" if "Instrument" in path else
                "mono" if "Mono" in path else "body")
        font_file = alib.font_path(brand, role)
    else:
        font_file = FONTS / path
    f = ImageFont.truetype(str(font_file), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def _w(draw, text, font) -> float:
    return draw.textlength(text, font=font)


def _emphasis_style(copy: dict) -> str:
    return "box" if str(copy.get("emphasis_style") or "").strip().lower() == "box" else "serif"


def _type_voice(copy: dict) -> str:
    return "serif" if str(copy.get("type_voice") or "").strip().lower() == "serif" else "sans"


def _has_top_visual_object(copy: dict) -> bool:
    if not str(copy.get("visual_metaphor") or "").strip():
        return False
    return str(copy.get("object_position") or "top").strip().lower() != "side"


def _object_text_floor(H: int) -> int:
    return int(math.ceil(H * 0.48))


def _display_font(size: int, type_voice: str, weight: int = 730):
    if type_voice == "serif":
        return _font("InstrumentSerif-Regular.ttf", size)
    return _font("InterTight.ttf", size, weight)


def _emphasis_font(size: int, type_voice: str):
    if type_voice == "serif":
        return _font("InstrumentSerif-Regular.ttf", int(size * 1.04))
    return _font("InstrumentSerif-Italic.ttf", int(size * 1.2))


def _highlight_box_text_color(fill: tuple[int, int, int]) -> tuple[int, int, int]:
    luminance = 0.2126 * fill[0] + 0.7152 * fill[1] + 0.0722 * fill[2]
    return THEMES["light"]["ink"] if luminance >= 150 else THEMES["dark"]["ink"]


def _is_light_theme(P: dict) -> bool:
    return alib.luminance(P["ink"]) < alib.luminance(P["surface"])


def _veil_fill(P: dict, *, alpha_dark: int = 156,
               alpha_light: int = 214) -> tuple[int, int, int, int]:
    alpha = alpha_light if _is_light_theme(P) else alpha_dark
    return (*P["surface"], alpha)


def _text_safe_surface(fill: tuple[int, int, int], P: dict) -> tuple[int, int, int]:
    if alib.contrast_ratio(P["ink"], fill) >= 4.5:
        return fill
    return P["surface"]


def _highlight_box_padding(font) -> tuple[int, int]:
    size = int(getattr(font, "size", 40))
    return max(8, int(size * 0.18)), max(5, int(size * 0.10))


def _is_box_item(item: tuple) -> bool:
    return len(item) >= 4 and item[3] == "box"


def _mixed_item_width(draw, item: tuple) -> float:
    text, font = item[0], item[1]
    width = _w(draw, text, font)
    if _is_box_item(item):
        pad_x, _pad_y = _highlight_box_padding(font)
        width += 2 * pad_x
    return width


def _wrap_mixed(draw, words, max_w):
    """Greedy wrap para tokens mistos; tokens podem incluir metadata de box."""
    lines, cur, cur_w = [], [], 0.0
    for item in words:
        _t, font = item[0], item[1]
        wt = _mixed_item_width(draw, item)
        sp = _w(draw, " ", font)
        add = wt if not cur else wt + sp
        if cur and cur_w + add > max_w:
            lines.append(cur)
            cur, cur_w = [item], wt
        else:
            cur.append(item)
            cur_w += add
    if cur:
        lines.append(cur)
    return lines


# LAYOUTS — variam a estrutura. tw=largura do texto, valign, head=multiplicador
# do tamanho da headline, scrim=banda escura atras do texto.
LAYOUTS = {
    "editorial_top":    {"tx": 86, "tw": 908, "valign": "top",    "head": 1.0,  "scrim": False},
    "editorial_bottom": {"tx": 86, "tw": 908, "valign": "bottom", "head": 1.0,  "scrim": False},
    "editorial_left":   {"tx": 86, "tw": 500, "valign": "center", "head": 0.86, "scrim": False},
    "hero_type":        {"tx": 86, "tw": 940, "valign": "center", "head": 1.28, "scrim": False},
    "full_scene":       {"tx": 86, "tw": 908, "valign": "bottom", "head": 1.0,  "scrim": True},
    "slide":            {"tx": 86, "tw": 908, "valign": "top",    "head": 0.86, "scrim": True},
}


def render_creative(bg_path: str, copy: dict, out_path: str, *,
                    emphasis_color=None, layout: str = "editorial_top",
                    H: int = 1350, theme: str = "dark", photo_scrim: bool = False,
                    slide_index: int | None = None, slide_total: int | None = None,
                    slide_role: str | None = None, safe_zone: dict | None = None,
                    brand: dict | None = None) -> str:
    token = _BRAND_CONTEXT.set(brand)
    try:
        return _render_creative_impl(
            bg_path, copy, out_path, emphasis_color=emphasis_color, layout=layout,
            H=H, theme=theme, photo_scrim=photo_scrim, slide_index=slide_index,
            slide_total=slide_total, slide_role=slide_role, safe_zone=safe_zone,
        )
    finally:
        _BRAND_CONTEXT.reset(token)


def _render_creative_impl(bg_path: str, copy: dict, out_path: str, *,
                          emphasis_color=None, layout: str = "editorial_top",
                          H: int = 1350, theme: str = "dark", photo_scrim: bool = False,
                          slide_index: int | None = None, slide_total: int | None = None,
                          slide_role: str | None = None, safe_zone: dict | None = None) -> str:
    """copy: {eyebrow, headline, emphasis_word, sub, cta}. layout: chave de LAYOUTS.
    theme: 'dark' (texto claro) ou 'light' (texto escuro). Largura fixa 1080;
    altura H varia por formato. Espera bg 1080xH (use formats_hybrid.reframe_bg)."""
    if layout == "slide":
        return _render_slide_creative(
            bg_path, copy, out_path, emphasis_color=emphasis_color,
            H=H, theme=theme, slide_index=slide_index, slide_total=slide_total,
            slide_role=slide_role or copy.get("role") or "body",
            safe_zone=safe_zone or {},
        )

    W = 1080
    brand = _BRAND_CONTEXT.get()
    P = alib.style_palette(brand, theme) if brand is not None else THEMES.get(theme, THEMES["dark"])
    if emphasis_color is None:
        emphasis_color = P["gold"]
    lay = LAYOUTS.get(layout, LAYOUTS["editorial_top"])
    img = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(img)
    MX = lay["tx"]
    maxw = lay["tw"]

    # fontes (head escala por layout)
    HEAD_SZ = int(88 * lay["head"])
    f_eyebrow = _font("JetBrainsMono.ttf", 22, 500)
    type_voice = _type_voice(copy)
    emphasis_style = _emphasis_style(copy)
    f_head = _display_font(HEAD_SZ, type_voice, 700)
    f_emph = _emphasis_font(HEAD_SZ, type_voice)  # serif italica maior (otica)
    f_sub = _font("InterTight.ttf", 30, 400)
    f_cta = _font("InterTight.ttf", 27, 600)

    # --- montar headline com fontes/cores mistas (palavra de carga = serif gold) ---
    emph = (copy.get("emphasis_word") or "").strip().lower()
    words = []
    for raw in copy["headline"].split():
        core = re.sub(r"[^\wáàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]", "", raw).lower()
        if emph and core == emph:
            if emphasis_style == "box":
                words.append((
                    raw,
                    f_head,
                    _highlight_box_text_color(P["gold"]),
                    "box",
                    P["gold"],
                ))
            else:
                words.append((raw, f_emph, emphasis_color))
        else:
            words.append((raw, f_head, P["ink"]))
    lines = _wrap_mixed(d, words, maxw)

    # leading EXATO (controle total): line_height = 1.05 * tamanho da sans
    line_h = int(HEAD_SZ * 1.05)
    head_block_h = line_h * len(lines)

    # alturas dos blocos
    eyebrow_h = 30
    gap1 = 44          # eyebrow -> headline
    gap2 = 38          # headline -> sub
    sub_lines = _wrap_text(d, copy.get("sub", ""), f_sub, maxw)
    sub_h = int(29 * 1.4) * len(sub_lines)
    gap3 = 40          # sub -> cta
    cta_h = 64
    total = eyebrow_h + gap1 + head_block_h + gap2 + sub_h + gap3 + cta_h

    valign = lay["valign"]
    if valign == "top":
        y = 100
    elif valign == "bottom":
        y = H - total - 130
    else:  # center
        y = (H - total) // 2

    # scrim para cena cheia (legibilidade sobre fundo movimentado)
    if lay["scrim"]:
        band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(band)
        bd.rectangle([0, y - 56, W, y + total + 56], fill=(7, 7, 9, 135))
        img = Image.alpha_composite(img.convert("RGBA"), band).convert("RGB")
        d = ImageDraw.Draw(img)

    # scrim de FOTO (arquetipo Pessoa): gradiente escuro na zona do texto p/
    # garantir legibilidade sobre partes claras da foto.
    if photo_scrim:
        y0, y1 = max(0, y - 70), min(H, y + total + 70)
        grad = Image.new("L", (1, H), 0)
        peak = 170 if theme == "dark" else 40
        for yy in range(H):
            if y0 <= yy <= y1:
                # mais escuro perto da borda ancorada
                t = 1 - abs((yy - (y0 + y1) / 2)) / max(1, (y1 - y0) / 2)
                grad.putpixel((0, yy), int(peak * max(0.35, t)))
        grad = grad.resize((W, H))
        overlay = Image.new("RGB", (W, H), (0, 0, 0) if theme == "dark" else (243, 238, 230))
        img = Image.composite(overlay, img, grad)
        d = ImageDraw.Draw(img)

    # eyebrow (mono, tracking manual)
    _draw_tracked(d, (MX, y), copy.get("eyebrow", "").upper(), f_eyebrow, P["mono"], tracking=4)
    y += eyebrow_h + gap1

    # headline com baseline-alignment entre fontes
    y = _draw_mixed_lines(d, lines, MX, y, line_h)
    y += gap2

    # sub
    for ln in sub_lines:
        d.text((MX, y), ln, font=f_sub, fill=P["dim"])
        y += int(29 * 1.4)
    y += gap3

    # CTA pilula outline
    cta = copy.get("cta", "")
    if cta:
        tw = _w(d, cta, f_cta)
        pad_x, pad_y = 30, 17
        x0, y0 = MX, y
        x1, y1 = MX + tw + 2 * pad_x, y + cta_h
        d.rounded_rectangle([x0, y0, x1, y1], radius=cta_h // 2,
                            outline=P["cta"], width=2)
        d.text((x0 + pad_x, y0 + (cta_h - 27) // 2 - 4), cta, font=f_cta, fill=P["cta"])

    img.save(out_path, "PNG")
    return out_path


def _slide_headline_lines(d, headline: str, emphasis: str, maxw: int, role: str,
                          P: dict, emphasis_color):
    base = {"hook": 82, "body": 68, "cta": 74}.get(role, 68)
    max_lines = {"hook": 4, "body": 5, "cta": 4}.get(role, 5)
    size = base
    lines, f_head, f_emph = [], None, None
    while size >= 46:
        f_head = _font("InterTight.ttf", size, 720)
        f_emph = _font("InstrumentSerif-Italic.ttf", int(size * 1.22))
        words = []
        emph = (emphasis or "").strip().lower()
        for raw in headline.split():
            core = re.sub(r"[^\wáàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]", "", raw).lower()
            if emph and core == emph:
                words.append((raw, f_emph, emphasis_color))
            else:
                words.append((raw, f_head, P["ink"]))
        lines = _wrap_mixed(d, words, maxw)
        if len(lines) <= max_lines:
            break
        size -= 4
    return lines, f_head, f_emph, size


def _as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in value if str(item).strip()]
    if isinstance(value, tuple):
        return [item for item in value if str(item).strip()]
    if str(value).strip():
        return [str(value).strip()]
    return []


def _core_word(value: str) -> str:
    return re.sub(r"[^\wáàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]", "", value).lower()


def _headline_token(raw: str, emphasis_words: set[str], f_head, f_emph, P: dict,
                    emphasis_color, *, emphasis_style: str) -> tuple:
    if emphasis_words and _core_word(raw) in emphasis_words:
        if emphasis_style == "box":
            return (
                raw,
                f_head,
                _highlight_box_text_color(P["gold"]),
                "box",
                P["gold"],
            )
        return (raw, f_emph, emphasis_color)
    return (raw, f_head, P["ink"])


def _headline_lines_at_size(d, headline: str, emphasis, maxw: int, P: dict,
                            emphasis_color, *, start_size: int,
                            min_size: int = 42, max_lines: int = 5,
                            emphasis_style: str = "serif",
                            type_voice: str = "sans"):
    emphasis_words = {_core_word(str(item)) for item in _as_list(emphasis)}
    size = start_size
    lines, f_head, f_emph = [], None, None
    while size >= min_size:
        f_head = _display_font(size, type_voice, 730)
        f_emph = _emphasis_font(size, type_voice)
        words = [
            _headline_token(
                raw, emphasis_words, f_head, f_emph, P, emphasis_color,
                emphasis_style=emphasis_style
            )
            for raw in headline.split()
        ]
        lines = _wrap_mixed(d, words, maxw)
        if len(lines) <= max_lines:
            break
        size -= 4
    return lines, f_head, f_emph, size


def _headline_lines_fit_height(d, headline: str, emphasis, maxw: int, P: dict,
                               emphasis_color, *, start_size: int,
                               min_size: int = 42, max_lines: int = 5,
                               max_height: int,
                               leading: float = 1.08,
                               emphasis_style: str = "serif",
                               type_voice: str = "sans"):
    best = None
    for candidate in range(start_size, min_size - 1, -4):
        lines, f_head, f_emph, size = _headline_lines_at_size(
            d, headline, emphasis, maxw, P, emphasis_color,
            start_size=candidate, min_size=min_size, max_lines=max_lines,
            emphasis_style=emphasis_style, type_voice=type_voice
        )
        line_h = int(size * leading)
        block_h = _mixed_block_height(lines, line_h)
        best = (lines, f_head, f_emph, size, line_h, block_h)
        if block_h <= max_height:
            return best
    return best


def _mixed_line_box(line) -> tuple[int, int]:
    if not line:
        return 0, 0
    metrics = [item[1].getmetrics() for item in line]
    return max(asc for asc, _desc in metrics), max(desc for _asc, desc in metrics)


def _mixed_line_advance(line, min_line_h: int, leading: float = 1.08) -> int:
    ascent, descent = _mixed_line_box(line)
    metric_h = ascent + descent
    if metric_h <= 0:
        return min_line_h
    return max(min_line_h, int(math.ceil(metric_h * leading)))


def _mixed_block_height(lines, min_line_h: int) -> int:
    if not lines:
        return 0
    total = 0
    for idx, line in enumerate(lines):
        if idx == len(lines) - 1:
            total += sum(_mixed_line_box(line))
        else:
            total += _mixed_line_advance(line, min_line_h)
    return total


def _draw_mixed_lines(d, lines, x: int, y: int, line_h: int) -> int:
    for line in lines:
        xx = x
        base, _descent = _mixed_line_box(line)
        if not base:
            base = line_h
        for item in line:
            text, fnt, color = item[0], item[1], item[2]
            asc = fnt.getmetrics()[0]
            text_y = y + (base - asc)
            if _is_box_item(item):
                fill = item[4] if len(item) >= 5 else color
                pad_x, pad_y = _highlight_box_padding(fnt)
                text_w = _w(d, text, fnt)
                bbox = fnt.getbbox(text)
                rect = [
                    xx,
                    text_y + bbox[1] - pad_y,
                    xx + text_w + 2 * pad_x,
                    text_y + bbox[3] + pad_y,
                ]
                d.rounded_rectangle(rect, radius=12, fill=fill)
                d.text((xx + pad_x, text_y), text, font=fnt, fill=color)
                xx += text_w + 2 * pad_x + _w(d, " ", fnt)
            else:
                d.text((xx, text_y), text, font=fnt, fill=color)
                xx += _w(d, text, fnt) + _w(d, " ", fnt)
        y += _mixed_line_advance(line, line_h)
    return y


def _surface_fill(img: Image.Image, rect, fallback: tuple[int, int, int],
                  lift: float = 0.07) -> tuple[int, int, int]:
    W, H = img.size
    x0, y0, x1, y1 = [int(v) for v in rect]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0:
        base = fallback
    else:
        try:
            base = tuple(int(v) for v in ImageStat.Stat(img.crop((x0, y0, x1, y1))).median[:3])
        except Exception:
            base = fallback
    return tuple(max(0, min(255, int(c + (255 - c) * lift))) for c in base)


def _draw_surface(d, img: Image.Image, rect, P: dict, *, radius: int = 24,
                  highlight: bool = False, bar: bool = False) -> None:
    fill = _text_safe_surface(_surface_fill(img, rect, P["surface"]), P)
    outline = P["gold"] if highlight else P["line"]
    width = 2 if highlight else 1
    d.rounded_rectangle(rect, radius=radius, fill=fill, outline=outline, width=width)
    if bar:
        x0, y0, _x1, y1 = rect
        d.rounded_rectangle([x0 + 18, y0 + 18, x0 + 21, y1 - 18],
                            radius=2, fill=P["gold"])


def _draw_starburst(d, cx: int, cy: int, r: int, P: dict) -> None:
    for i in range(12):
        if i % 3 == 0:
            length = r
        else:
            length = int(r * 0.58)
        # 12 raios manuais: leve o bastante para parecer editorial, não decorativo.
        a = (2 * math.pi * i) / 12
        x = cx + int(math.cos(a) * length)
        y = cy + int(math.sin(a) * length)
        d.line([cx, cy, x, y], fill=P["gold"], width=2)
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=P["gold"])


def _ghost_number(img: Image.Image, d, W: int, H: int, number: str, P: dict, *,
                  top: int) -> tuple[int, int, int, int]:
    f_ghost = _font("InstrumentSerif-Regular.ttf", int(H * 0.62))
    bbox = f_ghost.getbbox(number)
    glyph_w = max(1, bbox[2] - bbox[0])
    visible_left = max(int(W * 0.64), int(W - glyph_w * 0.44))
    x = int(visible_left - bbox[0])
    y = int(top)
    rd = ImageDraw.Draw(img, "RGBA")
    rd.text((x, y), number, font=f_ghost, fill=(*P["gold"], GHOST_NUMBER_ALPHA))
    return (visible_left, y + bbox[1], visible_left + glyph_w, y + bbox[3])


def _slide_number(copy: dict, slide_index: int | None) -> str:
    source = str(copy.get("kicker") or "")
    match = re.search(r"\d+", source)
    if match:
        return match.group(0).zfill(2)
    if slide_index:
        return f"{slide_index:02d}"
    return "01"


def _rich_segments(text: str, *, bold=None, code=None, emphasis=None) -> list[tuple[str, str]]:
    terms = {
        "code": [str(item) for item in _as_list(code)],
        "emphasis": [str(item) for item in _as_list(emphasis)],
        "bold": [str(item) for item in _as_list(bold)],
    }
    pos = 0
    segments: list[tuple[str, str]] = []
    lower = text.lower()
    while pos < len(text):
        found = None
        for style in ("code", "emphasis", "bold"):
            for term in terms[style]:
                if term and lower.startswith(term.lower(), pos):
                    found = (term, style)
                    break
            if found:
                break
        if found:
            term, style = found
            segments.append((text[pos:pos + len(term)], style))
            pos += len(term)
            continue
        next_pos = len(text)
        for style_terms in terms.values():
            for term in style_terms:
                if not term:
                    continue
                idx = lower.find(term.lower(), pos + 1)
                if idx != -1:
                    next_pos = min(next_pos, idx)
        segments.append((text[pos:next_pos], "body"))
        pos = next_pos
    return segments


def _attach_punctuation(units: list[tuple], punct: str) -> bool:
    if not units or not punct or any(ch not in CODE_PUNCTUATION for ch in punct):
        return False
    last = units[-1]
    suffix = last[2] if len(last) > 2 else ""
    units[-1] = (last[0], last[1], suffix + punct)
    return True


def _attach_code_punctuation(units: list[tuple], punct: str) -> bool:
    return _attach_punctuation(units, punct)


def _rich_units(text: str, *, bold=None, code=None, emphasis=None) -> list[tuple]:
    units: list[tuple] = []
    for chunk, style in _rich_segments(text, bold=bold, code=code, emphasis=emphasis):
        if style == "code":
            stripped = chunk.strip()
            if stripped:
                units.append((stripped, style))
            continue
        for word in re.findall(r"\S+", chunk):
            if _attach_punctuation(units, word):
                continue
            units.append((word, style))
    return units


def _unit_parts(unit: tuple) -> tuple[str, str, str]:
    text = unit[0]
    style = unit[1]
    punct = unit[2] if len(unit) > 2 else ""
    return text, style, punct


def _rects_intersect(a, b) -> bool:
    return a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1]


def _draw_rich_units(d, img: Image.Image, units: list[tuple], x: int, y: int,
                     maxw: int, P: dict, *, line_h: int = 42,
                     contrast_guard=None) -> int:
    f_body = _font("InterTight.ttf", 29, 420)
    f_bold = _font("InterTight.ttf", 29, 730)
    f_code = _font("JetBrainsMono.ttf", 22, 500)
    space = _w(d, " ", f_body)

    def unit_width(unit):
        text, style, punct = _unit_parts(unit)
        if style == "code":
            return _w(d, text, f_code) + 28 + _w(d, punct, f_body)
        font = f_bold if style == "bold" else f_body
        return _w(d, text, font) + _w(d, punct, f_body)

    def line_width(line):
        width = 0.0
        for idx, unit in enumerate(line):
            width += unit_width(unit)
            if idx < len(line) - 1:
                width += space
        return width

    lines, cur, cur_w = [], [], 0.0
    for unit in units:
        uw = unit_width(unit)
        add = uw if not cur else uw + space
        if cur and cur_w + add > maxw:
            lines.append(cur)
            cur, cur_w = [unit], uw
        else:
            cur.append(unit)
            cur_w += add
    if cur:
        lines.append(cur)

    for line in lines:
        xx = x
        if contrast_guard:
            line_rect = [x - 12, y - 5, x + line_width(line) + 12, y + line_h + 3]
            if _rects_intersect(line_rect, contrast_guard):
                rd = ImageDraw.Draw(img, "RGBA")
                rd.rounded_rectangle(line_rect, radius=10, fill=_veil_fill(P, alpha_dark=72, alpha_light=188))
        for idx, unit in enumerate(line):
            text, style, punct = _unit_parts(unit)
            if style == "code":
                tw = _w(d, text, f_code)
                h = line_h - 7
                rect = [xx, y + 3, xx + tw + 28, y + 3 + h]
                _draw_surface(d, img, rect, P, radius=12)
                d.text((xx + 14, y + 9), text, font=f_code, fill=P["gold"])
                xx += tw + 28
                if punct:
                    d.text((xx, y), punct, font=f_body, fill=P["ink"])
                    xx += _w(d, punct, f_body)
            else:
                font = f_bold if style == "bold" else f_body
                color = P["gold"] if style == "emphasis" else P["ink"]
                d.text((xx, y), text, font=font, fill=color)
                xx += _w(d, text, font)
                if punct:
                    d.text((xx, y), punct, font=f_body, fill=P["ink"])
                    xx += _w(d, punct, f_body)
            if idx < len(line) - 1:
                xx += space
        y += line_h
    return y


def _bullet_payload(raw) -> dict:
    if isinstance(raw, dict):
        return raw
    return {"text": str(raw)}


def _draw_callout(d, img: Image.Image, callout, rect, P: dict) -> None:
    if not callout:
        return
    data = callout if isinstance(callout, dict) else {"text": str(callout)}
    text = str(data.get("text") or "").strip()
    if not text:
        return
    _draw_surface(d, img, rect, P, radius=24, bar=True)
    x0, y0, x1, _y1 = rect
    units = _rich_units(text, emphasis=data.get("emphasis"))
    _draw_rich_units(d, img, units, x0 + 44, y0 + 26, int(x1 - x0 - 70), P, line_h=38)


def _listicle_items(copy: dict) -> list[dict]:
    items = copy.get("items") or []
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict)]


def _listicle_surface(W: int, H: int, P: dict) -> Image.Image:
    img = Image.new("RGB", (W, H), P["surface"])
    rd = ImageDraw.Draw(img, "RGBA")
    for y in range(92, H, 136):
        rd.line([54, y, W - 54, y + 18], fill=(*P["line"], 34), width=1)
    for x in range(118, W, 176):
        rd.line([x, 68, x - 28, H - 72], fill=(*P["line"], 18), width=1)
    for y in range(54, H, 74):
        for x in range(42 + (y % 5) * 11, W, 97):
            if (x + y) % 3 == 0:
                rd.point((x, y), fill=(*P["gold"], 26))
    return img


def _scene_offset_grid(travel: int, steps: int = 5) -> list[tuple[int, float]]:
    if travel <= 0:
        return [(0, 0.5)]
    points = []
    for i in range(max(2, steps)):
        ratio = i / max(1, steps - 1)
        pos = int(round(travel * ratio))
        item = (pos, round(ratio, 4))
        if item not in points:
            points.append(item)
    return points


def _salient_scene_crop(resized: Image.Image, rw: int, rh: int, *,
                        anchor_x: float, anchor_y: float) -> Image.Image:
    travel_x = max(0, resized.width - rw)
    travel_y = max(0, resized.height - rh)
    if travel_x == 0 and travel_y == 0:
        return resized.crop((0, 0, rw, rh))
    arr = np.asarray(resized.convert("RGB"))
    candidates = []
    for left, x_ratio in _scene_offset_grid(travel_x):
        for top, y_ratio in _scene_offset_grid(travel_y):
            left = max(0, min(left, resized.width - rw))
            top = max(0, min(top, resized.height - rh))
            window = arr[top:top + rh, left:left + rw]
            score = (
                alib.edge_variance_from_rgb(window)
                + alib.gold_coverage_from_rgb(window)
            )
            anchor_distance = abs(x_ratio - anchor_x) + abs(y_ratio - anchor_y)
            candidates.append((score, -anchor_distance, left, top))
    _score, _distance, left, top = max(candidates)
    return resized.crop((left, top, left + rw, top + rh))


def _fit_scene(scene: Image.Image, rw: int, rh: int, *, anchor_x: float = 0.5,
               anchor_y: float = 0.5, salience: bool = False) -> Image.Image:
    scale = max(rw / max(1, scene.width), rh / max(1, scene.height))
    resized = scene.resize(
        (max(rw, int(scene.width * scale)), max(rh, int(scene.height * scale))),
        Image.LANCZOS,
    )
    if salience:
        return _salient_scene_crop(
            resized, rw, rh, anchor_x=anchor_x, anchor_y=anchor_y
        )
    travel_x = max(0, resized.width - rw)
    travel_y = max(0, resized.height - rh)
    left = int(round(travel_x * max(0.0, min(1.0, anchor_x))))
    top = int(round(travel_y * max(0.0, min(1.0, anchor_y))))
    return resized.crop((left, top, left + rw, top + rh))


def _paste_scene_card(base: Image.Image, scene: Image.Image, rect, P: dict, *,
                      radius: int = 32, anchor_x: float = 0.5,
                      salience: bool = False) -> None:
    x0, y0, x1, y1 = [int(v) for v in rect]
    rw, rh = max(1, x1 - x0), max(1, y1 - y0)
    crop = _fit_scene(scene, rw, rh, anchor_x=anchor_x, salience=salience)
    mask = Image.new("L", (rw, rh), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, rw, rh], radius=radius, fill=255)
    base.paste(crop, (x0, y0), mask)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=P["line"], width=1)
    d.rounded_rectangle([x0 + 1, y0 + 1, x1 - 1, y1 - 1],
                        radius=max(1, radius - 1), outline=(*P["gold"],), width=1)


def _mixed_line_width(draw, line) -> float:
    width = 0.0
    for idx, item in enumerate(line):
        width += _mixed_item_width(draw, item)
        if idx < len(line) - 1:
            width += _w(draw, " ", item[1])
    return width


def _draw_mixed_lines_aligned(d, lines, x: int, y: int, line_h: int, *,
                              maxw: int, align: str = "left") -> int:
    for line in lines:
        line_x = x
        if align == "right":
            line_x = int(x + maxw - _mixed_line_width(d, line))
        elif align == "center":
            line_x = int(x + (maxw - _mixed_line_width(d, line)) / 2)
        y = _draw_mixed_lines(d, [line], line_x, y, line_h)
    return y


def _item_number_text(item: dict) -> str:
    try:
        return f"{int(str(item.get('number')).strip()):02d}"
    except Exception:
        return str(item.get("number") or "01").zfill(2)


def _draw_item_number(d, W: int, H: int, item: dict, P: dict, *,
                      corner: str, type_voice: str) -> None:
    text = _item_number_text(item)
    size = int(H * 0.118)
    font = _font("InstrumentSerif-Regular.ttf", size) if type_voice == "serif" else _font(
        "JetBrainsMono.ttf", int(size * 0.72), 500
    )
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 82, 92
    x = pad_x if "left" in corner else W - pad_x - tw
    y = pad_y if "top" in corner else H - pad_y - th
    _draw_item_number_at(d, item, P, x=x, y=y, H=H, type_voice=type_voice)


def _draw_item_number_at(d, item: dict, P: dict, *, x: int, y: int, H: int,
                         type_voice: str, align: str = "left",
                         scale: float = 1.0) -> list[int]:
    size = int(H * 0.118 * scale)
    font = _font("InstrumentSerif-Regular.ttf", size) if type_voice == "serif" else _font(
        "JetBrainsMono.ttf", int(size * 0.72), 500
    )
    text = _item_number_text(item)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = int(x - tw) if align == "right" else int(x)
    ty = int(y)
    d.text((tx, ty), text, font=font, fill=P["gold"])
    return [tx, ty, tx + tw, ty + th]


def _item_emphasis(item: dict, copy: dict):
    return item.get("emphasis_word") or copy.get("emphasis_word", "")


def _draw_item_title(d, item: dict, copy: dict, P: dict, emphasis_color, *,
                     x: int, y: int, maxw: int, size: int = 60,
                     max_lines: int = 2, align: str = "left") -> int:
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d,
        str(item.get("title") or "").strip(),
        _item_emphasis(item, copy),
        maxw,
        P,
        emphasis_color,
        start_size=size,
        min_size=34,
        max_lines=max_lines,
        emphasis_style=_emphasis_style(copy),
        type_voice=_type_voice(copy),
    )
    return _draw_mixed_lines_aligned(
        d, lines, x, y, int(head_sz * 1.08), maxw=maxw, align=align
    )


def _draw_wrapped_text(d, text: str, font, x: int, y: int, maxw: int, fill, *,
                       line_h: int, max_lines: int = 4,
                       align: str = "left") -> int:
    for ln in _wrap_text(d, text, font, maxw)[:max_lines]:
        tx = x
        if align == "right":
            tx = int(x + maxw - _w(d, ln, font))
        elif align == "center":
            tx = int(x + (maxw - _w(d, ln, font)) / 2)
        d.text((tx, y), ln, font=font, fill=fill)
        y += line_h
    return y


def _draw_item_body(d, item: dict, x: int, y: int, maxw: int, P: dict, *,
                    align: str = "left", desc_lines: int = 4) -> int:
    tagline = str(item.get("tagline") or "").strip()
    if tagline:
        f_tag = _font("JetBrainsMono.ttf", 18, 500)
        y = _draw_wrapped_text(
            d, tagline.upper(), f_tag, x, y, maxw, P["mono"],
            line_h=28, max_lines=2, align=align
        )
        y += 12
    f_desc = _font("InterTight.ttf", 29, 420)
    return _draw_wrapped_text(
        d, str(item.get("desc") or "").strip(), f_desc, x, y, maxw, P["dim"],
        line_h=41, max_lines=desc_lines, align=align
    )


def _draw_item_link(d, item: dict, x: int, y: int, maxw: int, P: dict, *,
                    align: str = "left") -> int:
    link = str(item.get("link") or "").strip()
    if not link:
        return y
    label = f"→ {link}"
    f_link = _font("JetBrainsMono.ttf", 23, 500)
    tw = _w(d, label, f_link)
    tx = x
    if align == "right":
        tx = int(x + maxw - tw)
    elif align == "center":
        tx = int(x + (maxw - tw) / 2)
    d.text((tx, y), label, font=f_link, fill=P["gold"])
    d.line([tx, y + 34, tx + tw, y + 34], fill=P["gold"], width=2)
    return y + 48


def _draw_scene_title_scrim(d, rect, *, align: str, P: dict) -> list[int]:
    x0, y0, x1, y1 = rect
    if align == "right":
        return [int(x0 + (x1 - x0) * 0.32), y1 - 118, x1 - 30, y1 - 30]
    return [x0 + 30, y1 - 118, int(x0 + (x1 - x0) * 0.72), y1 - 30]


def _draw_item_banner(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                      top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    items = _listicle_items(copy)
    if not items:
        return _draw_statement(d, img, copy, P, emphasis_color,
                               top_pad=top_pad, bottom_pad=bottom_pad,
                               slide_index=slide_index)
    item = items[0]
    scene = copy.get("_scene_img") or img
    W, H = img.size
    MX = 86
    band_h = int(H * 0.32)
    band_y = top_pad + 72
    band = [MX, band_y, W - MX, band_y + band_h]
    _paste_scene_card(img, scene, band, P, radius=34, anchor_x=0.38, salience=True)
    scrim = _draw_scene_title_scrim(d, band, align="left", P=P)
    rd = ImageDraw.Draw(img, "RGBA")
    rd.rounded_rectangle(scrim, radius=20, fill=_veil_fill(P))
    _draw_item_title(
        d, item, copy, P, emphasis_color,
        x=scrim[0] + 24, y=scrim[1] + 20, maxw=scrim[2] - scrim[0] - 48,
        size=60, max_lines=1,
    )
    _draw_item_number(d, W, H, item, P, corner="bottom_right", type_voice=_type_voice(copy))

    y = band[3] + 50
    y = _draw_item_body(d, item, MX, y, W - 2 * MX, P, desc_lines=4)
    _draw_item_link(d, item, MX, y + 18, W - 2 * MX, P)


def _draw_item_card(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                    top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    items = _listicle_items(copy)
    if not items:
        return _draw_statement(d, img, copy, P, emphasis_color,
                               top_pad=top_pad, bottom_pad=bottom_pad,
                               slide_index=slide_index)
    item = items[0]
    scene = copy.get("_scene_img") or img
    W, H = img.size
    MX = 86
    _draw_item_number(d, W, H, item, P, corner="top_right", type_voice=_type_voice(copy))
    y = top_pad + 64
    maxw = int(W * 0.67)
    y = _draw_item_title(
        d, item, copy, P, emphasis_color, x=MX, y=y, maxw=maxw,
        size=66, max_lines=2,
    ) + 18
    y = _draw_item_body(d, item, MX, y, maxw, P, desc_lines=3)

    card_h = int(H * 0.40)
    card_y = min(H - bottom_pad - card_h - 72, max(y + 42, int(H * 0.42)))
    card = [MX, card_y, W - MX, card_y + card_h]
    _paste_scene_card(img, scene, card, P, radius=42, anchor_x=0.58, salience=True)
    _draw_item_link(d, item, MX, card[3] + 16, W - 2 * MX, P, align="center")


def _draw_item_duo(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                   top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    items = _listicle_items(copy)
    if len(items) < 2:
        return _draw_item_card(d, img, copy, P, emphasis_color,
                               top_pad=top_pad, bottom_pad=bottom_pad,
                               slide_index=slide_index)
    left_item, right_item = items[0], items[1]
    scene = copy.get("_scene_img") or img
    W, H = img.size
    MX = 86
    left_w = int(W * 0.56)
    right_w = int(W * 0.58)
    type_voice = _type_voice(copy)
    _draw_item_number(d, W, H, left_item, P, corner="top_right", type_voice=type_voice)

    y = top_pad + 58
    y = _draw_item_title(
        d, left_item, copy, P, emphasis_color, x=MX, y=y, maxw=left_w,
        size=54, max_lines=2,
    ) + 12
    y = _draw_item_body(d, left_item, MX, y, left_w, P, desc_lines=2)
    _draw_item_link(d, left_item, MX, y + 10, left_w, P)

    band_h = int(H * 0.26)
    band_y = int(H * 0.38)
    band = [MX, band_y, W - MX, band_y + band_h]
    _paste_scene_card(img, scene, band, P, radius=34, anchor_x=0.64, salience=True)
    scrim = _draw_scene_title_scrim(d, band, align="right", P=P)
    rd = ImageDraw.Draw(img, "RGBA")
    rd.rounded_rectangle(scrim, radius=20, fill=_veil_fill(P))
    _draw_item_title(
        d, right_item, copy, P, emphasis_color,
        x=scrim[0] + 24, y=scrim[1] + 20, maxw=scrim[2] - scrim[0] - 48,
        size=56, max_lines=1, align="right",
    )

    right_x = W - MX - right_w
    number_bbox = _draw_item_number_at(
        d, right_item, P,
        x=W - MX, y=band[3] + 30, H=H, type_voice=type_voice,
        align="right", scale=0.92,
    )
    y = number_bbox[3] + ITEM_DUO_NUMBER_CLEARANCE
    y = _draw_item_body(d, right_item, right_x, y, right_w, P,
                        align="right", desc_lines=2)
    _draw_item_link(d, right_item, right_x, y + 10, right_w, P, align="right")


def _draw_shared_chrome(img: Image.Image, P: dict, *, slide_index: int | None,
                        slide_total: int | None, footer: str, is_last: bool,
                        top_pad: int, bottom_pad: int,
                        footer_style: str = "corners",
                        identity: dict | None = None) -> None:
    d = ImageDraw.Draw(img)
    W, H = img.size
    MX = 86
    inset = 30
    f_mono = _font("JetBrainsMono.ttf", 19, 500)
    f_footer = _font("JetBrainsMono.ttf", 16, 500)
    identity = identity or {}

    if identity:
        f_identity = _font("JetBrainsMono.ttf", 16, 500)
        site = str(identity.get("site") or "").upper()
        handle = str(identity.get("handle") or "").upper()
        header_y = max(34, top_pad - 64)
        if site:
            d.text((MX, header_y), site, font=f_identity, fill=P["mono"])
        if handle:
            hx = W - MX - _w(d, handle, f_identity)
            d.text((hx, header_y), handle, font=f_identity, fill=P["mono"])

    prog_y = max(48 if identity else 36, top_pad - 26 if identity else top_pad - 38)
    d.rounded_rectangle([MX, prog_y, W - MX, prog_y + 4], radius=2, fill=P["track"])
    if slide_index and slide_total:
        fill_w = int((W - 2 * MX) * slide_index / max(1, slide_total))
        d.rounded_rectangle([MX, prog_y, MX + fill_w, prog_y + 4], radius=2, fill=P["gold"])
        num = f"{slide_index:02d}/{slide_total:02d}"
        nx = W - MX - _w(d, num, f_mono)
        d.text((nx, prog_y + 17), num, font=f_mono, fill=P["mono"])

    d.rectangle([inset, inset, W - inset, H - inset], outline=P["line"], width=1)
    mark = 48
    for sx, sy in ((inset, inset), (W - inset, inset), (inset, H - inset), (W - inset, H - inset)):
        hx = mark if sx == inset else -mark
        vy = mark if sy == inset else -mark
        d.line([sx, sy, sx + hx, sy], fill=P["line"], width=1)
        d.line([sx, sy, sx, sy + vy], fill=P["line"], width=1)

    fy = H - max(44, int(bottom_pad * 0.56))
    if footer_style == "bracketed_center":
        if is_last:
            return
        label = "[ ARRASTE → ]"
        x = int((W - _w(d, label, f_footer)) / 2)
        d.text((x, fy), label, font=f_footer, fill=P["mono"])
        return

    left = (footer or "").upper()
    right = "" if is_last else "ARRASTE →"
    right_w = _w(d, right, f_footer) if right else 0
    left_max = W - 2 * MX - right_w - 44
    while left and _w(d, left, f_footer) > left_max:
        left = left[:-4].rstrip() + "..."
    if left:
        d.text((MX, fy), left, font=f_footer, fill=P["mono"])
    if right:
        rx = W - MX - _w(d, right, f_footer)
        d.text((rx, fy), right, font=f_footer, fill=P["mono"])


def _slide_scrim(img: Image.Image, top_pad: int, bottom_pad: int, role: str,
                 P: dict) -> Image.Image:
    W, H = img.size
    grad = Image.new("L", (1, H), 0)
    center = top_pad + (H - top_pad - bottom_pad) * (0.42 if role != "cta" else 0.5)
    peak = 170 if _is_light_theme(P) else 135
    for yy in range(H):
        dist = abs(yy - center)
        strength = max(0, peak - int(dist * 0.20))
        grad.putpixel((0, yy), strength)
    grad = grad.resize((W, H))
    overlay = Image.new("RGB", (W, H), P["surface"])
    return Image.composite(overlay, img, grad)


def _draw_cover(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 880
    f_kicker = _font("JetBrainsMono.ttf", 21, 500)
    has_top_object = _has_top_visual_object(copy)
    y = top_pad + 56
    if has_top_object:
        y = max(y, _object_text_floor(H))
    kicker = (copy.get("kicker") or copy.get("eyebrow") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 88

    _draw_starburst(d, W - MX - 90, y + 18, 42, P)
    chips = [str(chip).upper() for chip in _as_list(copy.get("chips"))]
    if has_top_object:
        chips_h = 36 if chips else 0
        budget = max(58, H - bottom_pad - 92 - y - 42 - chips_h)
        fit = _headline_lines_fit_height(
            d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
            start_size=82, min_size=46, max_lines=4, max_height=budget,
            leading=1.05, emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
        )
        lines, _f_head, _f_emph, head_sz, line_h, _block_h = fit
    else:
        lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
            d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
            start_size=96, min_size=58, max_lines=4,
            emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
        )
        line_h = int(head_sz * 1.05)
    y = _draw_mixed_lines(d, lines, MX, y, line_h)
    y += 42

    if chips:
        f_chip = _font("JetBrainsMono.ttf", 20, 500)
        chip_line = " · ".join(chips)
        _draw_tracked(d, (MX, min(y, H - bottom_pad - 120)), chip_line, f_chip,
                      P["gold"], tracking=3)


def _draw_steps(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 860
    ghost_bbox = _ghost_number(img, d, W, H, _slide_number(copy, slide_index), P,
                               top=top_pad + 100)
    f_kicker = _font("JetBrainsMono.ttf", 22, 500)
    y = top_pad + 72
    kicker = (copy.get("kicker") or f"STEP {slide_index or 1:02d}").upper()
    _draw_tracked(d, (MX, y), kicker, f_kicker, P["gold"], tracking=4)
    y += 62

    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=66, min_size=46, max_lines=3,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.08))
    y += 38

    bullets = _as_list(copy.get("bullets"))
    if not bullets and copy.get("sub"):
        bullets = [{"text": copy.get("sub", "")}]
    bullets = bullets[:4]
    for raw in bullets:
        bullet = _bullet_payload(raw)
        text = str(bullet.get("text") or "").strip()
        if not text:
            continue
        d.ellipse([MX, y + 15, MX + 8, y + 23], fill=P["gold"])
        units = _rich_units(text, bold=bullet.get("bold"), code=bullet.get("code"),
                            emphasis=bullet.get("emphasis"))
        y = _draw_rich_units(d, img, units, MX + 30, y, maxw - 30, P, line_h=42,
                             contrast_guard=ghost_bbox)
        y += 10

    if copy.get("callout"):
        rect = [MX, H - bottom_pad - 142, W - MX, H - bottom_pad - 34]
        _draw_callout(d, img, copy.get("callout"), rect, P)


def _draw_cards_grid(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                     top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 21, 500)
    y = top_pad + 64
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 54

    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=58, min_size=42, max_lines=2,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.1)) + 36

    cards = [card for card in _as_list(copy.get("cards")) if isinstance(card, dict)]
    if not cards:
        cards = [{"title": "Ideia central", "description": copy.get("sub", "")}]
    cards = cards[:4]
    cols = 2 if len(cards) > 1 else 1
    rows = 2 if len(cards) > 2 else 1
    gap = 22
    card_w = int((maxw - gap * (cols - 1)) / cols)
    card_h = min(238, max(154, int((H - y - bottom_pad - 96 - gap * (rows - 1)) / rows)))
    f_card_kicker = _font("JetBrainsMono.ttf", 17, 500)
    f_title = _font("InterTight.ttf", 28, 730)
    f_desc = _font("InterTight.ttf", 23, 420)
    f_glyph = _font("InterTight.ttf", 32, 730)

    for idx, card in enumerate(cards):
        col = idx % cols
        row = idx // cols
        x0 = MX + col * (card_w + gap)
        y0 = y + row * (card_h + gap)
        rect = [x0, y0, x0 + card_w, y0 + card_h]
        highlight = bool(card.get("highlight"))
        _draw_surface(d, img, rect, P, radius=24, highlight=highlight)
        kicker_color = P["gold"] if highlight else P["mono"]
        ck = str(card.get("kicker") or f"{idx + 1:02d}").upper()
        d.text((x0 + 24, y0 + 22), ck, font=f_card_kicker, fill=kicker_color)
        if card.get("glyph"):
            glyph = str(card["glyph"])
            gx = x0 + card_w - 28 - _w(d, glyph, f_glyph)
            d.text((gx, y0 + 18), glyph, font=f_glyph, fill=P["gold"])
        title = str(card.get("title") or "").strip()
        ty = y0 + 62
        for ln in _wrap_text(d, title, f_title, card_w - 48)[:2]:
            d.text((x0 + 24, ty), ln, font=f_title, fill=P["ink"])
            ty += 32
        desc = str(card.get("description") or card.get("sub") or "").strip()
        ty += 10
        for ln in _wrap_text(d, desc, f_desc, card_w - 48)[:3]:
            d.text((x0 + 24, ty), ln, font=f_desc, fill=P["dim"])
            ty += 30

    if copy.get("callout"):
        rect = [MX, H - bottom_pad - 124, W - MX, H - bottom_pad - 34]
        _draw_callout(d, img, copy.get("callout"), rect, P)


def _draw_statement(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                    top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    _ghost_number(img, d, W, H, _slide_number(copy, slide_index), P, top=top_pad + 116)
    f_kicker = _font("JetBrainsMono.ttf", 22, 500)
    y = top_pad + int((H - top_pad - bottom_pad) * 0.18)
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 62
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=72, min_size=46, max_lines=4,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.08)) + 36
    f_sub = _font("InterTight.ttf", 29, 420)
    for ln in _wrap_text(d, copy.get("sub", ""), f_sub, maxw)[:4]:
        d.text((MX, y), ln, font=f_sub, fill=P["dim"])
        y += 42
    if copy.get("callout"):
        rect = [MX, H - bottom_pad - 136, W - MX, H - bottom_pad - 34]
        _draw_callout(d, img, copy.get("callout"), rect, P)


def _draw_quote_callout(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                        top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX = 86
    rect = [MX, top_pad + 146, W - MX, H - bottom_pad - 116]
    _draw_surface(d, img, rect, P, radius=24, bar=True)
    rd = ImageDraw.Draw(img, "RGBA")
    f_quote = _font("InstrumentSerif-Regular.ttf", 230)
    rd.text((rect[0] + 42, rect[1] - 24), "“", font=f_quote, fill=(*P["gold"], 24))

    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), int(rect[2] - rect[0] - 120),
        P, emphasis_color, start_size=62, min_size=42, max_lines=4,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    line_h = int(head_sz * 1.08)
    block_h = _mixed_block_height(lines, line_h)
    y = int(rect[1] + (rect[3] - rect[1] - block_h) / 2)
    _draw_mixed_lines(d, lines, rect[0] + 70, y, line_h)


def _paragraphs(copy: dict) -> list[str]:
    paragraphs = _as_list(copy.get("paragraphs"))
    if paragraphs:
        return [str(item).strip() for item in paragraphs if str(item).strip()]
    sub = str(copy.get("sub") or "").strip()
    if not sub:
        return []
    lines = [line.strip() for line in sub.splitlines() if line.strip()]
    return lines or [sub]


def _draw_paragraph_stack(d, paragraphs: list[str], x: int, y: int, maxw: int,
                          P: dict, *, max_y: int, size: int = 29) -> int:
    f_para = _font("InterTight.ttf", size, 420)
    line_h = int(size * 1.52)
    gap = int(size * 0.62)
    for paragraph in paragraphs[:4]:
        lines = _wrap_text(d, paragraph, f_para, maxw)[:4]
        for ln in lines:
            if y + line_h > max_y:
                return y
            d.text((x, y), ln, font=f_para, fill=P["dim"])
            y += line_h
        y += gap
    return y


def _draw_object_hero(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                      top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    _W, H = img.size
    MX, maxw = 86, 908
    y = max(top_pad + int(H * 0.46), top_pad + 520)
    max_y = H - bottom_pad - 64
    f_kicker = _font("JetBrainsMono.ttf", 20, 500)
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 54

    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=72, min_size=46, max_lines=3,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.1)) + 40
    _draw_paragraph_stack(d, _paragraphs(copy), MX, y, maxw, P, max_y=max_y, size=30)


def _draw_object_side(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                      top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, int(W * 0.53)
    y = top_pad + int((H - top_pad - bottom_pad) * 0.16)
    max_y = H - bottom_pad - 64
    f_kicker = _font("JetBrainsMono.ttf", 20, 500)
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 58

    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=66, min_size=42, max_lines=4,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.1)) + 38
    _draw_paragraph_stack(d, _paragraphs(copy), MX, y, maxw, P, max_y=max_y, size=29)


def _draw_cta(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
              top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 22, 500)
    has_top_object = _has_top_visual_object(copy)
    y = top_pad + int((H - top_pad - bottom_pad) * 0.16)
    if has_top_object:
        y = max(y, _object_text_floor(H))
    kicker = (copy.get("kicker") or copy.get("eyebrow") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["gold"], tracking=4)
        y += 68
    f_sub = _font("InterTight.ttf", 30, 420)
    sub_lines = _wrap_text(d, copy.get("sub", ""), f_sub, maxw)[:4]
    cta = copy.get("cta", "")
    if has_top_object:
        cta_block_h = 102 if cta else 0
        text_bottom = H - bottom_pad - 34
        min_head_h = int(42 * 1.08)
        while sub_lines and y + min_head_h + 36 + len(sub_lines) * 44 + cta_block_h > text_bottom:
            sub_lines.pop()
        budget = max(42, text_bottom - y - 36 - len(sub_lines) * 44 - cta_block_h)
        fit = _headline_lines_fit_height(
            d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
            start_size=70, min_size=42, max_lines=3, max_height=budget,
            leading=1.08, emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
        )
        lines, _f_head, _f_emph, head_sz, line_h, _block_h = fit
    else:
        lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
            d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
            start_size=78, min_size=50, max_lines=4,
            emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
        )
        line_h = int(head_sz * 1.08)
    y = _draw_mixed_lines(d, lines, MX, y, line_h) + 36
    engagement = copy.get("engagement_cta") if isinstance(copy.get("engagement_cta"), dict) else None
    if engagement:
        action = str(engagement.get("action") or "").strip()
        reward = str(engagement.get("reward") or "").strip()
        if action and reward:
            box_h = 188
            y0 = min(y + 6, H - bottom_pad - box_h - 92)
            rect = [MX, y0, W - MX, y0 + box_h]
            _draw_surface(d, img, rect, P, radius=28, highlight=True, bar=True)
            f_action = _font("InterTight.ttf", 46, 760)
            f_reward = _font("InterTight.ttf", 30, 520)
            ay = y0 + 34
            for ln in _wrap_text(d, action.upper(), f_action, maxw - 92)[:2]:
                d.text((MX + 48, ay), ln, font=f_action, fill=P["gold"])
                ay += 50
            ay += 12
            for ln in _wrap_text(d, reward, f_reward, maxw - 92)[:2]:
                d.text((MX + 48, ay), ln, font=f_reward, fill=P["ink"])
                ay += 40
            y = rect[3] + 34
    for ln in sub_lines:
        d.text((MX, y), ln, font=f_sub, fill=P["dim"])
        y += 44
    if cta:
        y += 34
        f_cta = _font("InterTight.ttf", 30, 730)
        tw = _w(d, cta, f_cta)
        pad_x, cta_h = 34, 68
        x1 = min(W - MX, MX + tw + 2 * pad_x)
        y0 = min(y, H - bottom_pad - cta_h - 34)
        d.rounded_rectangle([MX, y0, x1, y0 + cta_h], radius=cta_h // 2,
                            fill=P["gold"], outline=P["gold"], width=2)
        d.text((MX + pad_x, y0 + 17), cta, font=f_cta,
               fill=_highlight_box_text_color(P["gold"]))


def _identity(copy: dict) -> dict:
    value = copy.get("brand_carousel") or {}
    return value if isinstance(value, dict) else {}


def _draw_avatar_pill(d, img: Image.Image, P: dict, identity: dict, *,
                      x: int, y: int, label: str | None = None) -> int:
    if not identity:
        return y
    text = str(label or identity.get("handle") or identity.get("site") or "").strip()
    sub = str(identity.get("site") or identity.get("tagline") or "").strip()
    if not text and not sub:
        return y
    f_label = _font("JetBrainsMono.ttf", 20, 600)
    f_sub = _font("InterTight.ttf", 19, 500)
    avatar_d = 46
    text_w = max(_w(d, text, f_label), _w(d, sub, f_sub) if sub else 0)
    pill_w = int(avatar_d + 30 + text_w + 30)
    pill_h = 66
    rect = [x, y, x + pill_w, y + pill_h]
    _draw_surface(d, img, rect, P, radius=pill_h // 2, highlight=True)

    cx, cy = x + 14, y + 10
    avatar_path = str(identity.get("avatar") or "").strip()
    pasted = False
    if avatar_path:
        path = Path(alib.resolve_path(avatar_path))
        if path.exists():
            avatar = Image.open(path).convert("RGB").resize((avatar_d, avatar_d), Image.LANCZOS)
            mask = Image.new("L", (avatar_d, avatar_d), 0)
            md = ImageDraw.Draw(mask)
            md.ellipse([0, 0, avatar_d - 1, avatar_d - 1], fill=255)
            img.paste(avatar, (cx, cy), mask)
            pasted = True
    if not pasted:
        d.ellipse([cx, cy, cx + avatar_d, cy + avatar_d], fill=P["gold"])
        initials = "AL"
        d.text((cx + 9, cy + 12), initials, font=_font("JetBrainsMono.ttf", 17, 700),
               fill=_highlight_box_text_color(P["gold"]))
    d.ellipse([cx, cy, cx + avatar_d, cy + avatar_d], outline=P["line"], width=1)

    tx = cx + avatar_d + 16
    if text:
        d.text((tx, y + 12), text.upper(), font=f_label, fill=P["ink"])
    if sub:
        d.text((tx, y + 38), sub[:42], font=f_sub, fill=P["dim"])
    return y + pill_h


def _fit_rgba(im: Image.Image, max_w: int, max_h: int) -> Image.Image:
    scale = min(max_w / max(1, im.width), max_h / max(1, im.height))
    scale = min(scale, 1.8)
    return im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                     Image.LANCZOS)


def _person_collage_headline_overlap_limit(line_h: int) -> int:
    return int(max(1, round(line_h * 0.15)))


def _person_collage_layout(W: int, H: int, *, headline_bottom: int,
                           line_h: int, bottom_pad: int,
                           source_w: int, source_h: int) -> tuple[int, int, int, int]:
    overlap = _person_collage_headline_overlap_limit(line_h)
    reserved_top = headline_bottom - overlap
    floor = H - bottom_pad - 18
    available_h = max(80, floor - reserved_top)
    max_w = int(W * 0.62)
    max_h = min(int(H * 0.66), available_h)
    scale = min(max_w / max(1, source_w), max_h / max(1, source_h))
    scale = min(scale, 1.8)
    width = max(1, int(source_w * scale))
    height = max(1, int(source_h * scale))
    px = int((W - width) / 2)
    py = max(reserved_top, floor - height)
    return px, py, width, height


def _prepare_person_cutout(cutout: Image.Image, *, top_padding: int = 28,
                           feather_px: float = 2.0) -> Image.Image:
    rgba = cutout.convert("RGBA")
    if top_padding > 0:
        padded = Image.new("RGBA", (rgba.width, rgba.height + top_padding), (0, 0, 0, 0))
        padded.alpha_composite(rgba, (0, top_padding))
        rgba = padded
    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(radius=feather_px))
    rgba.putalpha(alpha)
    return rgba


def _draw_person_contact_shadow(base: Image.Image, person: Image.Image,
                                x: int, y: int) -> None:
    alpha = person.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return
    lx0, _ly0, lx1, ly1 = bbox
    width = max(18, int((lx1 - lx0) * 0.78))
    height = max(10, int(width * 0.13))
    cx = x + int((lx0 + lx1) / 2)
    cy = y + ly1 - int(height * 0.12)
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    sd.ellipse(
        [cx - width // 2, cy - height // 2, cx + width // 2, cy + height // 2],
        fill=(0, 0, 0, 46),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=22))
    base.alpha_composite(shadow)


def _add_person_photo_candidate(candidates: list[Path], seen: set[str], raw) -> None:
    if not raw:
        return
    path = Path(alib.resolve_path(str(raw)))
    key = str(path)
    if key not in seen:
        candidates.append(path)
        seen.add(key)


def _person_photo_candidates(persona_id: str, explicit_photo: str, person_mod) -> list[Path]:
    candidates: list[Path] = []
    seen: set[str] = set()

    _add_person_photo_candidate(candidates, seen, explicit_photo)

    local_dir = alib.ROOT / "personas" / persona_id
    if local_dir.exists():
        for path in sorted(local_dir.glob("foto-*.png")):
            _add_person_photo_candidate(candidates, seen, path)

    persona = person_mod.get(persona_id)
    photos = person_mod._photos(persona)
    preferred = str(persona.get("preferred_photo") or "").strip()
    if preferred:
        for path in photos:
            if path.name == preferred:
                _add_person_photo_candidate(candidates, seen, path)
                break
    for path in photos:
        _add_person_photo_candidate(candidates, seen, path)
    return candidates


def _is_readable_person_photo(path: Path, persona_id: str) -> bool:
    try:
        with Image.open(path) as im:
            im.verify()
        return True
    except Exception as exc:
        print(
            f"[person_collage] warning: foto ilegível ignorada para {persona_id}: {path} ({exc})",
            file=sys.stderr,
        )
        return False


def _resolve_person_photo(copy: dict, person_mod) -> str:
    persona_id = str(copy.get("persona") or "").strip()
    if not persona_id:
        raise ValueError("person_collage requer persona")

    explicit_photo = str(copy.get("photo") or copy.get("persona_photo") or "").strip()
    candidates = _person_photo_candidates(
        persona_id,
        explicit_photo,
        person_mod,
    )
    for path in candidates:
        if _is_readable_person_photo(path, persona_id):
            return str(path)

    tested = ", ".join(str(path) for path in candidates) or "nenhum candidato encontrado"
    raise ValueError(
        f"nenhuma foto legível para persona {persona_id}; candidatos testados: {tested}"
    )


def _person_cutout_for_copy(copy: dict) -> Image.Image:
    import person as person_mod
    photo = _resolve_person_photo(copy, person_mod)
    return person_mod._cutout(photo)


def _draw_floating_card(base: Image.Image, card: dict, P: dict, *,
                        x: int, y: int, w: int, h: int, angle: float) -> None:
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([2, 2, w - 3, h - 3], radius=22,
                         fill=(*P["surface"], 244), outline=(*P["line"], 255), width=1)
    kind = str(card.get("type") or "chip").strip().lower()
    if kind == "testimonial":
        f_quote = _font("InstrumentSerif-Regular.ttf", 30)
        f_author = _font("JetBrainsMono.ttf", 15, 500)
        text = str(card.get("quote") or "").strip()
        yy = 24
        for ln in _wrap_text(ld, text, f_quote, w - 44)[:3]:
            ld.text((22, yy), ln, font=f_quote, fill=P["ink"])
            yy += 34
        ld.text((22, h - 34), ("- " + str(card.get("author") or "")).upper(),
                font=f_author, fill=P["mono"])
    elif kind == "stat":
        f_value = _font("InterTight.ttf", 42, 760)
        f_label = _font("InterTight.ttf", 20, 520)
        ld.text((24, 24), str(card.get("value") or ""), font=f_value, fill=P["gold"])
        yy = 76
        for ln in _wrap_text(ld, str(card.get("label") or ""), f_label, w - 48)[:2]:
            ld.text((24, yy), ln, font=f_label, fill=P["ink"])
            yy += 25
    else:
        f_chip = _font("JetBrainsMono.ttf", 18, 600)
        label = str(card.get("label") or card.get("text") or "").upper()
        ld.ellipse([22, 24, 50, 52], fill=P["gold"])
        ld.line([29, 38, 36, 45, 47, 31], fill=_highlight_box_text_color(P["gold"]), width=3)
        for ln in _wrap_text(ld, label, f_chip, w - 72)[:2]:
            ld.text((62, 26), ln, font=f_chip, fill=P["ink"])
            break
    layer = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(layer, (x, y))


def _draw_person_collage(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                         top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 20, 500)
    y = top_pad + 42
    kicker = (copy.get("kicker") or copy.get("eyebrow") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 56
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=86, min_size=52, max_lines=3,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    line_h = int(head_sz * 1.04)
    headline_bottom = _draw_mixed_lines_aligned(
        d, lines, MX, y, line_h, maxw=maxw, align="center"
    )
    y = headline_bottom
    identity = _identity(copy)
    identity_bottom = y
    if identity:
        identity_bottom = _draw_avatar_pill(d, img, P, identity, x=MX, y=y + 18)

    rgba = img.convert("RGBA")
    cards = [card for card in _as_list(copy.get("floating_cards")) if isinstance(card, dict)][:4]
    card_slots = [
        (68, int(H * 0.44), 322, 136, -5.5),
        (W - 374, int(H * 0.34), 306, 126, 4.5),
        (76, int(H * 0.68), 286, 112, 3.5),
        (W - 354, int(H * 0.64), 288, 118, -4.5),
    ]
    for card, slot in zip(cards, card_slots):
        _draw_floating_card(rgba, card, P, x=slot[0], y=slot[1],
                            w=slot[2], h=slot[3], angle=slot[4])

    person_source = _prepare_person_cutout(_person_cutout_for_copy(copy))
    px, py, pw, ph = _person_collage_layout(
        W, H,
        headline_bottom=max(headline_bottom, identity_bottom),
        line_h=line_h,
        bottom_pad=bottom_pad,
        source_w=person_source.width,
        source_h=person_source.height,
    )
    person_rgba = person_source.resize((pw, ph), Image.LANCZOS)
    _draw_person_contact_shadow(rgba, person_rgba, px, py)
    rgba.alpha_composite(person_rgba, (px, py))
    img.paste(rgba.convert("RGB"), (0, 0))


def _pct(value) -> float:
    return float(str(value).strip().rstrip("%"))


def _annotation_rect(annotation: dict, card_rect) -> list[int]:
    region = annotation.get("region")
    if not isinstance(region, list) or len(region) != 4:
        raise ValueError("annotation.region deve conter [x%, y%, w%, h%]")
    x, y, w, h = [_pct(item) for item in region]
    if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 100 or y + h > 100:
        raise ValueError("annotation.region fora de [0,100]")
    x0, y0, x1, y1 = card_rect
    cw, ch = x1 - x0, y1 - y0
    return [
        int(x0 + cw * x / 100.0),
        int(y0 + ch * y / 100.0),
        int(x0 + cw * (x + w) / 100.0),
        int(y0 + ch * (y + h) / 100.0),
    ]


def _draw_dotted_rect(d, rect, fill, *, width: int = 3, dash: int = 12) -> None:
    x0, y0, x1, y1 = rect
    for x in range(x0, x1, dash * 2):
        d.line([x, y0, min(x + dash, x1), y0], fill=fill, width=width)
        d.line([x, y1, min(x + dash, x1), y1], fill=fill, width=width)
    for y in range(y0, y1, dash * 2):
        d.line([x0, y, x0, min(y + dash, y1)], fill=fill, width=width)
        d.line([x1, y, x1, min(y + dash, y1)], fill=fill, width=width)


def _draw_arrow(d, start: tuple[int, int], end: tuple[int, int], fill, *, width: int = 3) -> None:
    d.line([start, end], fill=fill, width=width)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    for delta in (2.55, -2.55):
        x = end[0] + int(math.cos(angle + delta) * 18)
        y = end[1] + int(math.sin(angle + delta) * 18)
        d.line([end, (x, y)], fill=fill, width=width)


def _draw_annotated_mockup(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                           top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 19, 500)
    y = top_pad + 44
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 48
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=56, min_size=40, max_lines=2,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.08)) + 34

    card = [MX, max(y, top_pad + 178), W - MX, H - bottom_pad - 134]
    media_path = str(copy.get("media") or "").strip()
    if media_path:
        path = Path(alib.resolve_path(media_path))
        if not path.exists():
            raise FileNotFoundError(f"media ausente: {media_path}")
        scene = Image.open(path).convert("RGB")
    else:
        scene = (copy.get("_scene_img") or img).convert("RGB")
    _paste_scene_card(img, scene, card, P, radius=34, anchor_x=0.5, salience=not media_path)

    annotation = copy.get("annotation") if isinstance(copy.get("annotation"), dict) else {}
    box = _annotation_rect(annotation, card)
    _draw_dotted_rect(d, box, P["gold"], width=3)
    label = str(annotation.get("label") or "").strip()
    f_label = _font("JetBrainsMono.ttf", 18, 600)
    tw = _w(d, label.upper(), f_label)
    lx = max(card[0] + 22, min(box[0], card[2] - int(tw) - 44))
    ly = max(card[1] + 22, box[1] - 58)
    label_rect = [lx, ly, lx + int(tw) + 34, ly + 38]
    rd = ImageDraw.Draw(img, "RGBA")
    rd.rounded_rectangle(label_rect, radius=16, fill=_veil_fill(P))
    d.text((lx + 17, ly + 10), label.upper(), font=f_label, fill=P["ink"])
    if annotation.get("arrow", True):
        _draw_arrow(d, (label_rect[0] + 22, label_rect[3] + 4),
                    (box[0] + 16, box[1] + 16), P["gold"], width=3)


def _draw_glyph_icon(d, cx: int, cy: int, r: int, glyph: str, P: dict) -> None:
    glyph = str(glyph or "check").strip().lower()
    glyph = {"alert": "alerta", "bolt": "raio", "target": "alvo",
             "gear": "engrenagem", "chart": "grafico", "gráfico": "grafico"}.get(glyph, glyph)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=P["gold"])
    ink = _highlight_box_text_color(P["gold"])
    if glyph == "check":
        d.line([cx - 15, cy, cx - 4, cy + 12, cx + 18, cy - 14], fill=ink, width=5)
    elif glyph == "alerta":
        d.polygon([(cx, cy - 20), (cx - 22, cy + 18), (cx + 22, cy + 18)], outline=ink)
        d.line([cx, cy - 7, cx, cy + 7], fill=ink, width=4)
        d.ellipse([cx - 2, cy + 12, cx + 2, cy + 16], fill=ink)
    elif glyph == "raio":
        d.polygon([(cx + 2, cy - 24), (cx - 17, cy + 3), (cx - 2, cy + 3),
                   (cx - 8, cy + 24), (cx + 17, cy - 6), (cx + 2, cy - 6)], fill=ink)
    elif glyph == "alvo":
        for rr in (20, 12, 4):
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=ink, width=3)
        d.line([cx - 24, cy, cx + 24, cy], fill=ink, width=2)
        d.line([cx, cy - 24, cx, cy + 24], fill=ink, width=2)
    elif glyph == "engrenagem":
        for i in range(8):
            a = i * math.pi / 4
            d.line([cx + int(math.cos(a) * 15), cy + int(math.sin(a) * 15),
                    cx + int(math.cos(a) * 25), cy + int(math.sin(a) * 25)],
                   fill=ink, width=4)
        d.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], outline=ink, width=4)
        d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=ink)
    else:
        pts = [(cx - 22, cy + 15), (cx - 8, cy + 2), (cx + 4, cy + 8), (cx + 20, cy - 18)]
        d.line(pts, fill=ink, width=5, joint="curve")
        for x, y in pts:
            d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=ink)


def _draw_framework_cards(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                          top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 19, 500)
    y = top_pad + 48
    kicker = (copy.get("kicker") or "").upper()
    if kicker:
        _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)
        y += 50
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), maxw, P, emphasis_color,
        start_size=56, min_size=40, max_lines=2,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    y = _draw_mixed_lines(d, lines, MX, y, int(head_sz * 1.08)) + 34

    cards = [card for card in _as_list(copy.get("cards")) if isinstance(card, dict)]
    if not cards:
        cards = [{"title": "Framework", "description": copy.get("sub", ""), "icon": "check"}]
    cards = cards[:4]
    cols = 2 if len(cards) > 1 else 1
    rows = 2 if len(cards) > 2 else 1
    gap = 22
    card_w = int((maxw - gap * (cols - 1)) / cols)
    card_h = min(260, max(176, int((H - y - bottom_pad - 96 - gap * (rows - 1)) / rows)))
    f_title = _font("InterTight.ttf", 29, 730)
    f_desc = _font("InterTight.ttf", 23, 420)
    f_k = _font("JetBrainsMono.ttf", 15, 500)
    for idx, card in enumerate(cards):
        col = idx % cols
        row = idx // cols
        x0 = MX + col * (card_w + gap)
        y0 = y + row * (card_h + gap)
        rect = [x0, y0, x0 + card_w, y0 + card_h]
        _draw_surface(d, img, rect, P, radius=26, highlight=bool(card.get("highlight")))
        _draw_glyph_icon(d, x0 + 52, y0 + 54, 28, card.get("icon") or card.get("glyph"), P)
        d.text((x0 + 94, y0 + 38), str(card.get("kicker") or f"{idx + 1:02d}").upper(),
               font=f_k, fill=P["mono"])
        ty = y0 + 82
        for ln in _wrap_text(d, str(card.get("title") or ""), f_title, card_w - 48)[:2]:
            d.text((x0 + 24, ty), ln, font=f_title, fill=P["ink"])
            ty += 32
        ty += 8
        for ln in _wrap_text(d, str(card.get("description") or card.get("sub") or ""), f_desc, card_w - 48)[:3]:
            d.text((x0 + 24, ty), ln, font=f_desc, fill=P["dim"])
            ty += 30


def _draw_bookmark(d, rect, P: dict) -> None:
    x0, y0, x1, y1 = rect
    mid = int((x0 + x1) / 2)
    notch = int((x1 - x0) * 0.26)
    d.rounded_rectangle([x0, y0, x1, y1], radius=28, fill=P["gold"], outline=P["gold"], width=2)
    d.polygon([(x0, y1 - notch), (mid, y1 - notch * 2), (x1, y1 - notch),
               (x1, y1), (x0, y1)], fill=P["surface"])
    d.line([x0 + 38, y0 + 48, x1 - 38, y0 + 48], fill=_highlight_box_text_color(P["gold"]), width=4)


def _draw_curve_arrow(d, start: tuple[int, int], end: tuple[int, int], P: dict) -> None:
    sx, sy = start
    ex, ey = end
    pts = []
    for i in range(24):
        t = i / 23
        cx = sx + (ex - sx) * t
        cy = sy + (ey - sy) * t - math.sin(t * math.pi) * 54
        pts.append((int(cx), int(cy)))
    d.line(pts, fill=P["gold"], width=4)
    _draw_arrow(d, pts[-3], pts[-1], P["gold"], width=4)


def _draw_save_close(d, img: Image.Image, copy: dict, P: dict, emphasis_color, *,
                     top_pad: int, bottom_pad: int, slide_index: int | None) -> None:
    W, H = img.size
    MX, maxw = 86, 908
    f_kicker = _font("JetBrainsMono.ttf", 20, 500)
    y = top_pad + 58
    kicker = (copy.get("kicker") or copy.get("eyebrow") or "SALVE").upper()
    _draw_tracked(d, (MX, y), kicker, f_kicker, P["mono"], tracking=4)

    bookmark = [MX, top_pad + 170, MX + 250, top_pad + 500]
    _draw_bookmark(d, bookmark, P)
    _draw_curve_arrow(d, (MX + 330, top_pad + 224), (bookmark[2] - 30, bookmark[1] + 52), P)

    text_x = MX + 330
    text_y = top_pad + 282
    lines, _f_head, _f_emph, head_sz = _headline_lines_at_size(
        d, copy["headline"], copy.get("emphasis_word", ""), W - text_x - MX,
        P, emphasis_color, start_size=72, min_size=46, max_lines=3,
        emphasis_style=_emphasis_style(copy), type_voice=_type_voice(copy)
    )
    text_y = _draw_mixed_lines(d, lines, text_x, text_y, int(head_sz * 1.06)) + 36

    engagement = copy.get("engagement_cta") if isinstance(copy.get("engagement_cta"), dict) else None
    if engagement:
        action = str(engagement.get("action") or "").strip()
        reward = str(engagement.get("reward") or "").strip()
        if action and reward:
            rect = [MX, min(text_y + 30, H - bottom_pad - 210), W - MX, min(text_y + 196, H - bottom_pad - 44)]
            _draw_surface(d, img, rect, P, radius=28, highlight=True, bar=True)
            f_action = _font("InterTight.ttf", 44, 760)
            f_reward = _font("InterTight.ttf", 29, 520)
            yy = rect[1] + 32
            d.text((rect[0] + 48, yy), action.upper(), font=f_action, fill=P["gold"])
            yy += 58
            for ln in _wrap_text(d, reward, f_reward, rect[2] - rect[0] - 96)[:2]:
                d.text((rect[0] + 48, yy), ln, font=f_reward, fill=P["ink"])
                yy += 38
    elif copy.get("cta"):
        f_cta = _font("InterTight.ttf", 30, 730)
        cta = str(copy.get("cta"))
        tw = _w(d, cta, f_cta)
        y0 = min(text_y + 18, H - bottom_pad - 100)
        d.rounded_rectangle([text_x, y0, text_x + tw + 68, y0 + 68],
                            radius=34, fill=P["gold"], outline=P["gold"], width=2)
        d.text((text_x + 34, y0 + 17), cta, font=f_cta,
               fill=_highlight_box_text_color(P["gold"]))


def _render_slide_creative(bg_path: str, copy: dict, out_path: str, *,
                           emphasis_color=None, H: int = 1350, theme: str = "dark",
                           slide_index: int | None = None, slide_total: int | None = None,
                           slide_role: str = "body", safe_zone: dict | None = None) -> str:
    W = 1080
    brand = _BRAND_CONTEXT.get()
    P = alib.style_palette(brand, theme) if brand is not None else THEMES.get(theme, THEMES["dark"])
    if emphasis_color is None:
        emphasis_color = P["gold"]
    safe_zone = safe_zone or {}
    top_pad = max(72, int(H * float(safe_zone.get("top_pct", 6)) / 100.0))
    bottom_pad = max(78, int(H * float(safe_zone.get("bottom_pct", 6)) / 100.0))

    role = slide_role or "body"
    template = copy.get("template") or {"hook": "cover", "cta": "cta"}.get(role, "statement")
    raw_img = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
    copy = dict(copy)
    if template == "annotated_mockup":
        copy["_scene_img"] = raw_img
    if template in {"item_banner", "item_card", "item_duo"}:
        img = _listicle_surface(W, H, P)
        copy["_scene_img"] = raw_img
    else:
        img = raw_img
    if template not in {"object_hero", "object_side", "item_banner", "item_card", "item_duo"}:
        img = _slide_scrim(img, top_pad, bottom_pad, role, P)
    d = ImageDraw.Draw(img)

    renderers = {
        "cover": _draw_cover,
        "person_collage": _draw_person_collage,
        "steps_bullets": _draw_steps,
        "cards_grid": _draw_cards_grid,
        "framework_cards": _draw_framework_cards,
        "statement": _draw_statement,
        "quote_callout": _draw_quote_callout,
        "annotated_mockup": _draw_annotated_mockup,
        "object_hero": _draw_object_hero,
        "object_side": _draw_object_side,
        "item_banner": _draw_item_banner,
        "item_card": _draw_item_card,
        "item_duo": _draw_item_duo,
        "cta": _draw_cta,
        "save_close": _draw_save_close,
    }
    renderer = renderers.get(template, _draw_statement)
    renderer(d, img, copy, P, emphasis_color, top_pad=top_pad,
             bottom_pad=bottom_pad, slide_index=slide_index)

    _draw_shared_chrome(
        img, P, slide_index=slide_index, slide_total=slide_total,
        footer=copy.get("footer") or copy.get("eyebrow") or "",
        is_last=bool(slide_total and slide_index == slide_total),
        top_pad=top_pad, bottom_pad=bottom_pad,
        footer_style=copy.get("footer_style", "corners"),
        identity=_identity(copy),
    )

    img.save(out_path, "PNG")
    return out_path


def _wrap_text(draw, text, font, max_w):
    if not text:
        return []
    out, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if cur and draw.textlength(trial, font=font) > max_w:
            out.append(cur); cur = word
        else:
            cur = trial
    if cur:
        out.append(cur)
    return out


def _draw_tracked(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("bg")
    ap.add_argument("-o", "--out", default="out/typeset_demo.png")
    a = ap.parse_args()
    copy = {"eyebrow": "MARKETING NO ESCURO",
            "headline": "Você lê seus números ou aposta?",
            "emphasis_word": "números",
            "sub": "CAC, ROAS, LTV. Quem não lê, opera no escuro.",
            "cta": "Quero acompanhar grátis"}
    print(render_creative(a.bg, copy, a.out))
