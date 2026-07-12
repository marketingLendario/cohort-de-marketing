"""
generate.py — geracao via GPT Image (Codex image_gen).

Cobre:
  - alavanca 1: style anchors (imagens de referencia passadas como -i)
  - alavanca 2: likeness do founder (fotos reais via -i quando o hook exige)
  - alavanca 3: best-of-N (gera N candidatos; o factory/gate seleciona)

Monta o prompt final a partir do brand-pack (header + logo_guard + negative)
+ a receita do mecanismo de hook + a copy especifica do hook.
"""
from __future__ import annotations
import sys, argparse, random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import variation as var_mod


def build_bg_prompt(brand: dict, core: str, sel: dict, backdrop_frag: str,
                    reserve: str, layout_id: str, fmt: str = "feed") -> str:
    """Prompt de FUNDO (sem texto) para o modo híbrido. Inclui backdrop com
    textura (anti-preto-liso), zona reservada por layout, e guarda de NO-TEXT."""
    aspect = brand["formats"][fmt]["aspect"]
    # Every visual value comes from the selected pack.
    palette = brand["palette"]
    surface = palette["surface"]
    accent = palette["gold"]
    parts = [
        f"Premium editorial advertising BACKGROUND image, {aspect} aspect ratio. "
        f"Luxury minimalism, deep near-black surface ({surface}). Warm muted accent "
        f"({accent}) is the only accent color. Cinematic, matte, dark-first, high craft."
    ]
    if layout_id != "hero_type":   # hero tipográfico = sem objeto, só atmosfera
        subj = core.rstrip(". ")
        for ax in ("material", "lighting", "finish"):
            frag = var_mod._fragment(ax, sel.get(ax, ""))
            if frag:
                subj += ", " + frag
        parts.append("SUBJECT: " + subj + ".")
    parts.append("BACKDROP: " + backdrop_frag + ".")
    parts.append("COMPOSITION: " + reserve + ".")
    parts.append("The dark background MUST have rich texture, depth, grain or "
                 "atmosphere — NEVER a flat, dead, uniform black.")
    parts.append("ABSOLUTELY NO text, no letters, no words, no headline, no caption, "
                 "no numeric captions, no logo, no watermark anywhere in the image.")
    return "\n".join(parts)


def build_prompt(brand: dict, hook: dict, fmt: str = "feed") -> str:
    """hook: {mechanism, headline, emphasis_word, eyebrow, cta, visual_recipe, sub?}"""
    header = alib.fill_aspect(brand["prompt_header"], brand, fmt)
    parts = [header]
    parts.append("VISUAL MECHANISM: " + hook.get("visual_recipe", ""))
    layout = []
    if hook.get("eyebrow"):
        layout.append(f'tiny monospace eyebrow reading "{hook["eyebrow"]}"')
    layout.append(f'dominant headline reading "{hook["headline"]}"')
    if hook.get("emphasis_word"):
        layout.append(f'the load-bearing word "{hook["emphasis_word"]}" set in glowing italic gold serif')
    if hook.get("sub"):
        layout.append(f'a supporting line reading "{hook["sub"]}"')
    if hook.get("cta"):
        layout.append(f'a pill-shaped outline CTA button reading "{hook["cta"]}"')
    parts.append("LAYOUT & TEXT: " + "; ".join(layout) + ".")
    parts.append(brand["logo_guard"])
    parts.append("NEGATIVE (do NOT include): " + brand["negative"])
    return "\n\n".join(parts)


def _style_refs(brand: dict, mechanism: str | None = None,
                extra_refs: list[str] | None = None) -> list[str]:
    """Use only references declared by the selected pack or request."""
    refs = list(alib.reference_paths(brand))
    if extra_refs:
        refs += list(extra_refs)
    return [ref for ref in refs if Path(ref).is_file()][:4]


def _likeness_refs(hook: dict, n: int | None = None) -> list[str]:
    """Return likeness refs only when the request carries an explicit persona."""
    persona = hook.get("_persona_data") or {}
    photos = [Path(path) for path in persona.get("photos", [])]
    photos = [path for path in photos if path.is_file()]
    limit = n or int(persona.get("refs_for_gen", 3))
    if len(photos) <= limit:
        return [str(path) for path in photos]
    step = max(1, len(photos) // limit)
    return [str(photos[index * step]) for index in range(limit)]


def generate_one(brand: dict, hook: dict, out_path: str, *, fmt: str = "feed",
                 use_style_anchors: bool = True, extra_refs: list[str] | None = None) -> dict:
    prompt = build_prompt(brand, hook, fmt)
    refs = []
    if hook.get("needs_likeness") and hook.get("_persona_data"):
        refs += _likeness_refs(hook)
    if use_style_anchors:
        refs += _style_refs(brand, hook.get("mechanism"), extra_refs)
    res = alib.codex_image(prompt, out_path, refs=refs)
    res["prompt"] = prompt
    res["refs_used"] = refs
    return res


def generate_best_of(brand: dict, hook: dict, out_base: str, *, n: int = 3,
                     fmt: str = "feed", use_style_anchors: bool = True,
                     extra_refs: list[str] | None = None) -> list[dict]:
    """Gera n candidatos sequenciais. A selecao (via gate) e feita pelo factory."""
    results = []
    for i in range(n):
        out = f"{out_base}__cand{i+1}.png"
        r = generate_one(brand, hook, out, fmt=fmt,
                         use_style_anchors=use_style_anchors, extra_refs=extra_refs)
        r["candidate"] = i + 1
        results.append(r)
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--headline", required=True)
    ap.add_argument("--emphasis", default="")
    ap.add_argument("--eyebrow", default="")
    ap.add_argument("--cta", default="")
    ap.add_argument("--sub", default="")
    ap.add_argument("--mechanism", default="typographic_offer")
    ap.add_argument("--recipe", default="poster tipografico editorial premium")
    ap.add_argument("--likeness", action="store_true")
    ap.add_argument("--fmt", default="feed")
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("-o", "--out", default=str(alib.OUT_DIR / "gen.png"))
    a = ap.parse_args()
    brand = alib.load_brand()
    hook = {"mechanism": a.mechanism, "visual_recipe": a.recipe,
            "headline": a.headline, "emphasis_word": a.emphasis,
            "eyebrow": a.eyebrow, "cta": a.cta, "sub": a.sub,
            "needs_likeness": a.likeness}
    if a.n == 1:
        r = generate_one(brand, hook, a.out, fmt=a.fmt)
        print("ok" if r["ok"] else "FAIL", "->", r["path"])
        print("refs:", r["refs_used"])
    else:
        rs = generate_best_of(brand, hook, a.out.rsplit(".png", 1)[0], n=a.n, fmt=a.fmt)
        for r in rs:
            print(("ok" if r["ok"] else "FAIL"), r["path"])
