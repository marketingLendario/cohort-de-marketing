"""
chat.py — arquetipo Print de Conversa / Notificacao (especie nativa).

O sinal desta especie e parecer um PRINT real: uma conversa de chat ou uma
pilha de notificacoes de lock screen carregando o hook. 3 ESTILOS visualmente
distintos (variacao interna anti-saturacao, eixo `chat_style`):
  - whatsapp_dark      : conversa em dark mode
  - whatsapp_light     : conversa em light mode (diversidade contra fadiga)
  - notification_stack : lock screen escuro com notificacoes empilhadas

100% programatico (PIL) — NENHUMA chamada de geracao de imagem. O contato da
conversa vem da persona (nome + foto REAL do persona pack; nunca likeness
gerada) ou, sem persona, da identidade do brand pack. A UI de chat e generica
(nenhum asset de terceiros); o "app" das notificacoes e a propria marca
(logo_icon do brand_assets, quando o pack entrega logo).

Copy do hook (campo opcional `chat:`; fallback deriva de headline/sub/cta):
  chat:
    contact: "Nome do Contato"     # default: persona.name > identity.display_name
    time: "09:41"
    messages:
      - { from: them, text: "..." }
      - { from: me,   text: "..." }
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import person as person_mod

ASSETS = alib.OUT_DIR / "brand_assets"
STYLES = ["whatsapp_dark", "whatsapp_light", "notification_stack"]

# paleta de UI de chat generica (dark/light) — nativa por design, nao vem do pack
_UI = {
    "dark": {"wallpaper": (11, 20, 26), "panel": (32, 44, 51), "incoming": (32, 44, 51),
             "outgoing": (0, 92, 75), "text": (233, 237, 239), "muted": (134, 150, 160),
             "tick": (128, 196, 232), "accent": (0, 168, 132)},
    "light": {"wallpaper": (239, 234, 226), "panel": (240, 242, 245), "incoming": (255, 255, 255),
              "outgoing": (217, 253, 211), "text": (17, 27, 33), "muted": (102, 119, 129),
              "tick": (96, 166, 220), "accent": (0, 168, 132)},
}


def style_for_index(index: int) -> str:
    """Map a catalog position to one of the renderer's implemented layouts."""
    return STYLES[index % len(STYLES)]


def _font(role, s, brand, w=None):
    f = ImageFont.truetype(str(alib.font_path(brand, role)), s)
    if w is not None:
        try: f.set_variation_by_axes([w])
        except Exception: pass
    return f


def _clean(s: str) -> str:
    """PIL nao renderiza emoji colorido com fontes neutras — remove p/ evitar tofu."""
    return "".join(c for c in str(s) if ord(c) < 0x1F000).strip()


def _wrap(d, text, font, maxw) -> list[str]:
    words, lines, cur = _clean(text).split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if cur and d.textlength(t, font=font) > maxw:
            lines.append(cur); cur = w
        else:
            cur = t
    if cur: lines.append(cur)
    return lines


def _avatar(photo_path: str | None, size: int, *, initial: str = "A",
            accent: tuple[int, int, int] = (201, 178, 152)) -> Image.Image:
    """Avatar circular da foto REAL da persona (crop central-topo — rosto no topo).
    Sem foto legivel: circulo neutro com inicial (nunca gerar rosto)."""
    im = None
    if photo_path and Path(photo_path).exists():
        try:
            im = Image.open(photo_path).convert("RGB")
        except Exception:
            im = None
    if im is not None:
        s = min(im.width, im.height)
        x = (im.width - s) // 2
        im = im.crop((x, 0, x + s, s)).resize((size, size), Image.LANCZOS)
    else:
        im = Image.new("RGB", (size, size), (58, 52, 44))
        dd = ImageDraw.Draw(im)
        f = ImageFont.load_default(size=int(size * 0.5))
        tw = dd.textlength(initial, font=f)
        dd.text(((size - tw) / 2, size * 0.22), initial, font=f, fill=accent)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4, size * 4], fill=255)
    im.putalpha(mask.resize((size, size), Image.LANCZOS))
    return im


def _messages(copy: dict) -> list[tuple[str, str]]:
    """[(from, text)] do campo chat.messages; fallback: headline/sub (them) + cta (me)."""
    chat = copy.get("chat") or {}
    msgs = chat.get("messages")
    if msgs:
        return [(str(m.get("from", "them")), str(m.get("text", ""))) for m in msgs if m.get("text")]
    out = []
    lead = copy.get("native_text") or copy.get("headline", "")
    if lead: out.append(("them", lead))
    if copy.get("sub"): out.append(("them", copy["sub"]))
    if copy.get("cta"): out.append(("me", copy["cta"]))
    return out


def notification_messages(copy: dict) -> list[tuple[str, str]]:
    """Mensagens elegiveis para o estilo notification_stack (max 3).

    Notificacao e sempre algo que CHEGA do contato — mensagens `from: me`
    (ex: o CTA respondido pelo usuario) NUNCA viram notificacao. Sem nenhuma
    mensagem recebida, degrada para as mensagens disponiveis."""
    msgs = [(w, t) for w, t in _messages(copy) if t and w != "me"][:3]
    if not msgs:
        msgs = [(w, t) for w, t in _messages(copy) if t][:3]
    return msgs


def _resolve_contact(copy: dict, brand: dict, persona: dict | None) -> tuple[str, str | None]:
    """(nome do contato, foto real ou None) — persona > identity do brand pack."""
    chat = copy.get("chat") or {}
    identity = brand.get("identity", {})
    contact = chat.get("contact")
    photo = None
    if persona:
        contact = contact or persona.get("name")
        try:
            photo = person_mod.pick_photo(persona, brand)
        except Exception:
            photo = None
    contact = contact or identity.get("display_name") or identity.get("handle") or "Contato"
    return _clean(str(contact)), photo


def _ticks(d, x, y, col):
    """double-check de mensagem enviada (2 tracinhos)."""
    for dx in (0, 9):
        d.line([(x + dx, y + 6), (x + dx + 4, y + 10)], fill=col, width=2)
        d.line([(x + dx + 4, y + 10), (x + dx + 11, y + 1)], fill=col, width=2)


def _bubbles(d, msgs, ui, W, y0, y1, time_s, brand):
    """Desenha as bolhas centralizadas verticalmente entre y0..y1."""
    f_msg = _font("body", 40, brand, 450)
    f_time = _font("body", 25, brand, 400)
    maxw = int(W * 0.68)
    pad_x, pad_y, lh, gap = 30, 24, 52, 26
    blocks = []
    for who, text in msgs:
        lines = _wrap(d, text, f_msg, maxw - 2 * pad_x)
        bw = max((d.textlength(ln, font=f_msg) for ln in lines), default=0)
        bw = min(maxw, max(bw + 2 * pad_x, 220))
        bh = pad_y * 2 + len(lines) * lh + 30      # +30 p/ hora dentro da bolha
        blocks.append((who, lines, int(bw), int(bh)))
    total = sum(b[3] for b in blocks) + gap * (len(blocks) - 1)
    y = max(y0, y0 + ((y1 - y0) - total) // 2)
    MX = 44
    for who, lines, bw, bh in blocks:
        mine = who == "me"
        x0 = W - MX - bw if mine else MX
        fill = ui["outgoing"] if mine else ui["incoming"]
        d.rounded_rectangle([x0, y, x0 + bw, y + bh], radius=26, fill=fill)
        tail_y = y + 14
        if mine:
            d.polygon([(x0 + bw - 2, tail_y), (x0 + bw + 14, tail_y + 4),
                       (x0 + bw - 2, tail_y + 20)], fill=fill)
        else:
            d.polygon([(x0 + 2, tail_y), (x0 - 14, tail_y + 4), (x0 + 2, tail_y + 20)], fill=fill)
        ty = y + pad_y
        for ln in lines:
            d.text((x0 + pad_x, ty), ln, font=f_msg, fill=ui["text"])
            ty += lh
        meta = time_s
        mw = d.textlength(meta, font=f_time)
        mx = x0 + bw - pad_x - mw - (34 if mine else 0)
        d.text((mx, y + bh - 40), meta, font=f_time, fill=ui["muted"])
        if mine:
            _ticks(d, x0 + bw - pad_x - 24, y + bh - 40, ui["tick"])
        y += bh + gap
    return y


def _render_whatsapp(copy, out_path, *, H, light, contact, avatar_photo, brand):
    W = 1080
    ui = _UI["light" if light else "dark"]
    img = Image.new("RGB", (W, H), ui["wallpaper"])
    d = ImageDraw.Draw(img, "RGBA")
    chat = copy.get("chat") or {}
    time_s = str(chat.get("time", "09:41"))

    # --- header (barra do contato) ---
    hh = 148
    d.rectangle([0, 0, W, hh], fill=ui["panel"])
    d.line([(28, hh // 2), (48, hh // 2 - 16)], fill=ui["text"], width=4)   # chevron voltar
    d.line([(28, hh // 2), (48, hh // 2 + 16)], fill=ui["text"], width=4)
    av = _avatar(avatar_photo, 88, initial=contact[:1].upper() if contact else "A")
    img.paste(av, (76, (hh - 88) // 2), av)
    d.text((188, hh // 2 - 34), contact, font=_font("body", 38, brand, 600), fill=ui["text"])
    d.text((188, hh // 2 + 12), "online", font=_font("body", 27, brand, 400), fill=ui["muted"])
    for i in range(3):                                                       # menu vertical
        d.ellipse([W - 56, hh // 2 - 22 + i * 18, W - 48, hh // 2 - 14 + i * 18], fill=ui["muted"])

    # --- selo de data (chip central, como num print real) ---
    f_chip = _font("body", 25, brand, 500)
    chip = "HOJE"
    cw = d.textlength(chip, font=f_chip)
    d.rounded_rectangle([(W - cw) / 2 - 24, hh + 28, (W + cw) / 2 + 24, hh + 74],
                        radius=12, fill=ui["incoming"])
    d.text(((W - cw) / 2, hh + 38), chip, font=f_chip, fill=ui["muted"])

    # --- input bar (rodape) ---
    by = H - 118
    d.rounded_rectangle([28, by, W - 132, by + 78], radius=39, fill=ui["incoming"])
    d.text((62, by + 20), "Mensagem", font=_font("body", 32, brand, 400), fill=ui["muted"])
    d.ellipse([W - 112, by, W - 34, by + 78], fill=ui["accent"])              # botao mic
    d.rounded_rectangle([W - 80, by + 18, W - 66, by + 46], radius=7, fill=(255, 255, 255))
    d.arc([W - 88, by + 30, W - 58, by + 58], 20, 160, fill=(255, 255, 255), width=3)

    # --- bolhas (centralizadas entre header e input) ---
    _bubbles(d, _messages(copy), ui, W, hh + 110, by - 40, time_s, brand)
    img.save(out_path, "PNG")
    return out_path


def _render_notifications(copy, out_path, *, H, contact, brand):
    """Lock screen escuro com hora grande + notificacoes empilhadas (app = a marca)."""
    W = 1080
    # wallpaper: gradiente radial escuro + grain (nunca liso e morto)
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt(((xx - W * 0.5) / W) ** 2 + ((yy - H * 0.36) / H) ** 2)
    base = np.clip(26 - r * 30, 6, 28)
    grain = np.random.default_rng(11).standard_normal((H, W)) * 2.2
    arr = np.clip(base + grain, 4, 32).astype(np.uint8)
    img = Image.fromarray(np.stack([arr, arr, (arr * 0.96).astype(np.uint8)], 2), "RGB")
    d = ImageDraw.Draw(img, "RGBA")
    chat = copy.get("chat") or {}
    time_s = str(chat.get("time", "09:41"))
    date_s = _clean(chat.get("date", "segunda-feira"))
    identity = brand.get("identity", {})
    app_name = _clean(str(identity.get("display_name") or identity.get("handle") or contact)).upper()

    # hora + data (lock screen)
    f_time = _font("body", 168, brand, 250)
    tw = d.textlength(time_s, font=f_time)
    ty = int(H * 0.075)
    d.text(((W - tw) / 2, ty), time_s, font=f_time, fill=(235, 235, 238))
    f_date = _font("body", 36, brand, 400)
    dw = d.textlength(date_s, font=f_date)
    d.text(((W - dw) / 2, ty + 190), date_s, font=f_date, fill=(200, 200, 205, 220))

    # notificacoes: SO mensagens recebidas (o CTA "me" nunca vira notificacao)
    msgs = notification_messages(copy)
    f_app = _font("body", 26, brand, 550)
    f_title = _font("body", 34, brand, 650)
    f_body = _font("body", 33, brand, 430)
    f_when = _font("body", 26, brand, 400)
    MX, pad = 52, 30
    cw_card = W - 2 * MX
    y = ty + 300
    icon = None
    icon_p = ASSETS / "logo_icon-dark.png"     # icone p/ superficie escura (tile)
    if icon_p.exists() and alib.has_logo_assets(brand):
        icon = Image.open(icon_p).convert("RGBA").resize((44, 44), Image.LANCZOS)
    for i, (_, text) in enumerate(msgs):
        lines = _wrap(d, text, f_body, cw_card - 2 * pad - 20)[:3]
        ch = pad * 2 + 46 + 12 + len(lines) * 44
        d.rounded_rectangle([MX, y, MX + cw_card, y + ch], radius=30, fill=(46, 46, 50, 216))
        d.rounded_rectangle([MX + pad, y + pad, MX + pad + 52, y + pad + 52],
                            radius=13, fill=(12, 12, 14, 255))
        if icon:
            img.paste(icon, (MX + pad + 4, y + pad + 4), icon)
        d.text((MX + pad + 70, y + pad - 2), app_name, font=f_app, fill=(190, 190, 196, 230))
        d.text((MX + pad + 70, y + pad + 26), contact, font=f_title, fill=(240, 240, 244))
        when = "agora" if i == 0 else f"há {7 * i} min"
        ww = d.textlength(when, font=f_when)
        d.text((MX + cw_card - pad - ww, y + pad + 2), when, font=f_when, fill=(170, 170, 176, 220))
        by = y + pad + 46 + 12
        for ln in lines:
            d.text((MX + pad, by), ln, font=f_body, fill=(225, 225, 230))
            by += 44
        y += ch + 18

    # lanterna / camera + home bar (assinatura de lock screen)
    cy = H - 150
    for cx in (W * 0.22, W * 0.78):
        d.ellipse([cx - 44, cy - 44, cx + 44, cy + 44], fill=(44, 44, 48, 210))
    d.rounded_rectangle([W * 0.22 - 8, cy - 20, W * 0.22 + 8, cy + 12], radius=6,
                        fill=(225, 225, 230))
    d.line([(W * 0.22 - 8, cy - 4), (W * 0.22 + 8, cy - 4)], fill=(44, 44, 48), width=3)
    d.rounded_rectangle([W * 0.78 - 26, cy - 18, W * 0.78 + 26, cy + 20], radius=9,
                        outline=(225, 225, 230), width=4)
    d.ellipse([W * 0.78 - 9, cy - 8, W * 0.78 + 9, cy + 10], outline=(225, 225, 230), width=4)
    d.rounded_rectangle([W * 0.5 - 130, H - 34, W * 0.5 + 130, H - 24], radius=5,
                        fill=(235, 235, 238, 200))
    img.save(out_path, "PNG")
    return out_path


def render_chat(copy: dict, out_path: str, *, H: int = 1350,
                style: str = "whatsapp_dark", brand: dict | None = None,
                persona: dict | None = None) -> str:
    if brand is None:
        raise ValueError("print de conversa requer brand pack explicito")
    if style not in STYLES:
        style = style_for_index(0)
    contact, photo = _resolve_contact(copy, brand, persona)
    if style == "notification_stack":
        return _render_notifications(copy, out_path, H=H, contact=contact, brand=brand)
    return _render_whatsapp(copy, out_path, H=H, light=(style == "whatsapp_light"),
                            contact=contact, avatar_photo=photo, brand=brand)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", default="whatsapp_dark", choices=STYLES)
    ap.add_argument("-o", "--out", default="out/archetype-test/chat_demo.png")
    a = ap.parse_args()
    copy = {"headline": "Essa semana eu vou abrir os bastidores da minha operação.",
            "sub": "Ao vivo e de graça. Começa segunda, 20h.",
            "cta": "EU QUERO participar"}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    print(render_chat(copy, a.out, style=a.style, brand=alib.load_brand()))
