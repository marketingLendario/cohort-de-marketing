"""
archetype_render.py — roteador de geração por ARQUÉTIPO (eixo primário).

Dado um arquétipo + a copy do hook (+ persona quando aplica), produz a peça final
no modo certo: hybrid(dark/light) / person / mockup / ugc / didactic.
Cada modo reusa os módulos já construídos. Retorna {final, format, archetype}.
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import generate as gen
import typeset as typeset_mod
import compose as compose_mod
import finish as finish_mod
import variation as var_mod
import person as person_mod
import ugc as ugc_mod
import didactic as didactic_mod
import formats_hybrid as fhyb
from PIL import Image


def _tallest(brand, formats):
    return max(formats, key=lambda t: brand["formats"][t]["h"])


def load_archetypes() -> list[dict]:
    import yaml
    with open(alib.DATA_DIR / "archetypes.yaml") as f:
        return yaml.safe_load(f)["archetypes"]


def _emit_bg_formats(bg, hook, brand, formats, out_base, *,
                     layout="editorial_top", theme="dark", surface="dark") -> dict:
    """Reenquadra o MESMO fundo por formato + re-typeset (consistente entre formatos)."""
    out = {}
    for fmt in formats:
        H = brand["formats"][fmt]["h"]
        framed = fhyb.reframe_bg(bg, 1080, H)
        fp = f"{out_base}__{fmt}__bg.png"; framed.save(fp)
        ts = f"{out_base}__{fmt}__ts.png"
        typeset_mod.render_creative(fp, hook, ts, layout=layout, H=H, theme=theme, brand=brand)
        lg = f"{out_base}__{fmt}__logo.png"
        if alib.has_logo_assets(brand):
            compose_mod.compose_logo(ts, lg, variant="icon", surface=surface)
        else:
            Image.open(ts).save(lg)
        out[fmt] = finish_mod.finish(lg, f"{out_base}__{fmt}.png", target_w=1080)
    return out


def _hybrid(brand, hook, arch, out_base, formats):
    """dark/light: fundo gerado UMA vez (formato mais alto) + multi-formato."""
    theme = arch.get("theme", "dark")
    gen_fmt = _tallest(brand, formats)
    core = var_mod.mechanism_core(hook.get("mechanism", "")) or "a single elegant hero object"
    sel = {"material": "metal", "lighting": "chiaroscuro", "finish": "cinematic"}
    if theme == "light":
        palette = brand["palette"]
        bgp = (f"Premium advertising BACKGROUND, {brand['formats'][gen_fmt]['aspect']}. "
               f"Use the pack background {palette['background']} with subtle texture and soft light. "
               f"Use accent {palette['accent']} sparingly. {core}, placed in the LOWER RIGHT. "
               f"Keep the UPPER-LEFT clean for text. NO text, no letters, no logo, no watermark.")
        surface = "light"
    else:
        bgp = gen.build_bg_prompt(brand, core, sel, var_mod.backdrop_fragment("atmospheric_fog"),
                                  "keep the UPPER HALF clear and atmospheric for text, subject lower",
                                  "editorial_top", gen_fmt)
        surface = "dark"
    bg = out_base + "__bg.png"
    if not alib.codex_image(bgp, bg)["ok"]:
        return None
    return _emit_bg_formats(bg, hook, brand, formats, out_base,
                            layout="editorial_top", theme=theme, surface=surface)


_MOCKUP_DEVICES = [
    "a sleek laptop at a slight angle, screen showing a sophisticated marketing-revenue dashboard with glowing warm-gold charts on a dark UI, on a dark premium desk with soft volumetric light, in the LOWER portion",
    "a modern smartphone held upright, screen showing a clean marketing dashboard with a glowing gold revenue line and metrics, floating against a dark premium backdrop, in the LOWER-RIGHT",
    "two dark monitors side by side on a desk showing glowing gold analytics charts and a revenue graph, cinematic studio light, in the LOWER portion",
    "an extreme close-up of a screen showing a single glowing gold revenue curve rising, shallow depth of field, abstract, filling the LOWER half",
]


def _mockup(brand, hook, arch, out_base, formats, idx=0):
    gen_fmt = _tallest(brand, formats)
    device = _MOCKUP_DEVICES[idx % len(_MOCKUP_DEVICES)]
    bgp = (f"Premium product mockup BACKGROUND, {brand['formats'][gen_fmt]['aspect']}. {device}. "
           f"Keep the UPPER HALF dark and clear for text. Cinematic tech product photo, dark-first, "
           f"accent {brand['palette']['accent']} screen glow. On-screen UI abstract and blurred, NOT readable words. "
           f"NO headline text overlay, no caption, no logo, no watermark.")
    bg = out_base + "__bg.png"
    if not alib.codex_image(bgp, bg)["ok"]:
        return None
    return _emit_bg_formats(bg, hook, brand, formats, out_base, layout="editorial_top", theme="dark")


def _person(brand, hook, arch, out_base, formats, persona):
    # A person archetype without a declared persona is intentionally personless.
    if not persona:
        return _hybrid(brand, hook, {**arch, "theme": "dark"}, out_base, formats)
    p = person_mod.get(persona, brand)
    copy = dict(hook)
    copy["eyebrow"] = f"{p['name'].upper()} · AO VIVO"
    photo = person_mod.pick_photo(p, brand)
    if not photo:
        return _hybrid(brand, hook, {**arch, "theme": "dark"}, out_base, formats)
    edited = person_mod.edit_to_scene(photo, out_base + "__edit.png")   # EDIT uma vez
    out = {}
    for fmt in formats:                                                 # compor por formato
        out[fmt] = person_mod.compose_person(edited, copy, f"{out_base}__{fmt}.png",
                                             brand["formats"][fmt]["h"],
                                             logo=alib.has_logo_assets(brand), brand=brand)
    return out


_UGC_PHOTOS = [
    "a cozy desk with an open laptop, coffee mug, warm window light, slightly imperfect and unposed",
    "a hand holding a phone showing a marketing app, casual cafe table in the background, natural light, candid",
    "an over-the-shoulder view of someone working at a laptop late at night, warm desk lamp, screen glowing, candid and real",
    "a messy-but-cozy creator workspace with notes, a laptop and a plant by a sunny window, authentic and lived-in",
]


def _ugc(brand, hook, arch, out_base, formats, idx=0):
    # UGC e nativo 9:16 (story/reels) — formato proprio, independe dos targets
    scene = _UGC_PHOTOS[idx % len(_UGC_PHOTOS)]
    photo_prompt = (f"An authentic candid smartphone photo, vertical 9:16: {scene}. Looks like a real "
                    f"phone photo someone actually took, NOT a studio ad, NOT stylized. Natural everyday "
                    f"tones, a little grain. No text, no UI, no logo, no watermark.")
    photo = out_base + "__photo.png"
    if not alib.codex_image(photo_prompt, photo)["ok"]:
        return None
    nat = hook.get("native_text") or (hook.get("headline", "") + " " + hook.get("sub", "")).strip()
    identity = brand.get("identity", {})
    p = ugc_mod.render_story(
        photo, {"native_text": nat, "cta": hook.get("cta", ""),
                "handle": identity.get("handle") or identity.get("display_name", "")},
        f"{out_base}__story.png", brand=brand,
    )
    return {"story": p}


def _didactic(brand, hook, arch, out_base, formats, idx=0):
    style = didactic_mod.STYLES[idx % len(didactic_mod.STYLES)]   # variacao interna
    cmp = dict(hook.get("compare") or {})
    cmp.setdefault("eyebrow", hook.get("eyebrow", ""))
    cmp.setdefault("title_left", "")
    cmp.setdefault("title_mid", "")
    cmp.setdefault("title_right", hook.get("headline", ""))
    cmp.setdefault("left", [])
    cmp.setdefault("right", [])
    cmp.setdefault("cta", hook.get("cta", ""))
    out = {}
    for fmt in formats:                                          # programatico por formato
        out[fmt] = didactic_mod.render_compare(
            cmp, f"{out_base}__{fmt}.png", H=brand["formats"][fmt]["h"],
            style=style, brand=brand,
        )
    return out


def render_archetype(arch: dict, hook: dict, brand: dict, out_base: str,
                     fmt: str = "feed", formats: list | None = None,
                     persona: dict | None = None, arch_index: int = 0) -> dict:
    """Multi-formato: cada modo gera o ativo pesado UMA vez e emite todos os formatos
    (mesma cena reenquadrada — consistente). arch_index dirige a variacao interna."""
    mode = arch["mode"]
    formats = formats or [fmt]
    try:
        if mode == "hybrid":
            outs = _hybrid(brand, hook, arch, out_base, formats)
        elif mode == "mockup":
            outs = _mockup(brand, hook, arch, out_base, formats, arch_index)
        elif mode == "person":
            outs = _person(brand, hook, arch, out_base, formats, persona)
        elif mode == "ugc":
            outs = _ugc(brand, hook, arch, out_base, formats, arch_index)
        elif mode == "didactic":
            outs = _didactic(brand, hook, arch, out_base, formats, arch_index)
        else:
            outs = None
    except Exception as e:
        return {"final": None, "formats": {}, "archetype": arch["id"], "error": str(e)}
    if not outs:
        return {"final": None, "formats": {}, "archetype": arch["id"], "error": "render falhou"}
    base = outs.get(fmt) or next(iter(outs.values()))   # peca de referencia p/ review
    return {"final": base, "formats": outs, "format": fmt,
            "archetype": arch["id"], "arch_index": arch_index}
