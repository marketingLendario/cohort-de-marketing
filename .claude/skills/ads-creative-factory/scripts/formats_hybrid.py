"""
formats_hybrid.py — multi-formato para o modo hibrido.

Larguras sao iguais (1080) em todos os formatos da marca; so a altura muda. Logo:
  - re-enquadra o FUNDO para 1080 x H (crop se mais baixo; extensao de borda se
    mais alto — fundo escuro atmosferico estende sem costura visivel),
  - RE-COMPOE o texto vetorial naquela altura (typeset), preservando tipografia
    perfeita em cada proporcao (feed 4:5 / story 9:16 / square 1:1).

Muito melhor que letterboxar uma imagem com texto embutido.
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import typeset as typeset_mod
import compose as compose_mod
import finish as finish_mod


def reframe_bg(bg_path: str, target_w: int, target_h: int) -> Image.Image:
    """Reenquadra o fundo para target_w x target_h. Largura escala; altura: crop
    central se sobra, extensao de borda se falta."""
    im = Image.open(bg_path).convert("RGB")
    scale = target_w / im.width
    h2 = max(1, int(im.height * scale))
    im = im.resize((target_w, h2), Image.LANCZOS)
    if h2 == target_h:
        return im
    if h2 > target_h:                       # mais alto que o alvo → crop central
        top = (h2 - target_h) // 2
        return im.crop((0, top, target_w, top + target_h))
    # mais baixo que o alvo → estende topo e base replicando as bordas
    canvas = Image.new("RGB", (target_w, target_h))
    off = (target_h - h2) // 2
    canvas.paste(im, (0, off))
    top_strip = im.crop((0, 0, target_w, 1)).resize((target_w, off + 1), Image.LANCZOS)
    bot_h = target_h - (off + h2)
    bot_strip = im.crop((0, h2 - 1, target_w, h2)).resize((target_w, bot_h + 1), Image.LANCZOS)
    canvas.paste(top_strip, (0, 0))
    canvas.paste(bot_strip, (0, off + h2 - 1))
    canvas.paste(im, (0, off))              # re-cola o bg por cima das faixas
    return canvas


def make_hybrid_formats(bg_path: str, copy: dict, brand: dict, targets: list[str],
                        out_base: str, *, layout: str = "editorial_top",
                        logo_variant: str = "icon", surface: str = "dark",
                        do_finish: bool = True) -> list[dict]:
    results = []
    tmp_dir = Path(out_base).parent
    for t in targets:
        spec = brand["formats"][t]
        w, h = spec["w"], spec["h"]
        framed = reframe_bg(bg_path, w, h)
        framed_path = f"{out_base}__{t}__bg.png"
        framed.save(framed_path)
        ts = f"{out_base}__{t}__typeset.png"
        typeset_mod.render_creative(framed_path, copy, ts, layout=layout, H=h, brand=brand)
        logoed = f"{out_base}__{t}__logo.png"
        if alib.has_logo_assets(brand):
            compose_mod.compose_logo(ts, logoed, variant=logo_variant, surface=surface)
        else:
            Image.open(ts).save(logoed)
        final = f"{out_base}__{t}.png"
        if do_finish:
            finish_mod.finish(logoed, final, target_w=w)
        else:
            Image.open(logoed).save(final)
        results.append({"target": t, "path": final, "w": w, "h": h})
    return results


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("bg")
    ap.add_argument("--targets", default="feed,story,square")
    ap.add_argument("--layout", default="editorial_top")
    ap.add_argument("--out", default="out/hybrid-fmt/demo")
    a = ap.parse_args()
    brand = alib.load_brand()
    copy = {"eyebrow": "SEMANA DE MARKETING COM CLAUDE CODE",
            "headline": "Não é falta de tráfego. É falta de número.",
            "emphasis_word": "número",
            "sub": "O problema não é o anúncio. É não saber se dá lucro.",
            "cta": "Quero entrar grátis"}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    for r in make_hybrid_formats(a.bg, copy, brand, a.targets.split(","), a.out, layout=a.layout):
        print(r["target"], r["w"], "x", r["h"], "->", r["path"])
