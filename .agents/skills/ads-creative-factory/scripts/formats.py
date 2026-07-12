"""
formats.py — geracao multi-formato com safe-zones do Meta (alavanca 7).

Divisao de caminhos (ADR-ACF D5):
  - **formats_hybrid** (factory text_mode=hybrid): fundo sem texto embutido → reframe
    + re-typeset vetorial por formato; caminho principal do pipeline.
  - **formats.py** (este modulo): letterbox/fit para imagens com **texto embutido na
    difusao** (text_mode=diffusion / branch legado em factory.py) — o texto nao e
    re-typesetavel, entao redimensiona a peca inteira dentro das safe-zones.

Dada UMA imagem criativa base (gerada num aspect, ex 4:5), produz versoes nos
formatos alvo (feed 4:5 / story 9:16 / square 1:1) SEM cortar texto, respeitando
as safe-zones do brand-pack.

Estrategia (fit, nunca crop que perca conteudo):
  - canvas do tamanho exato do formato (w x h), preenchido com a cor surface.
  - a imagem base e redimensionada (fit) para caber DENTRO da area util, que e a
    area total menos as faixas top/bottom da safe-zone daquele formato.
  - centralizada horizontalmente; verticalmente centralizada dentro da faixa
    segura (entre top_pct e bottom_pct), nunca invadindo as safe-zones.
  - fundo solido surface (dark-first) suaviza a emenda do letterbox.

CLI:
  python formats.py <img> --targets feed,story,square --out <dir>
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# garante que alib (no mesmo dir) seja importavel
sys.path.insert(0, str(Path(__file__).resolve().parent))

import alib  # noqa: E402
from PIL import Image  # noqa: E402

DEFAULT_TARGETS = ["feed", "story", "square"]
def _surface_rgb(brand: dict) -> tuple[int, int, int]:
    return alib.hex_to_rgb(brand["palette"]["surface"])


def _safe_zone(brand: dict, target: str) -> tuple[float, float]:
    """Retorna (top_pct, bottom_pct) da safe-zone do formato (0 se ausente)."""
    sz = brand["formats"].get("safe_zone", {}).get(target, {})
    return float(sz.get("top_pct", 0)), float(sz.get("bottom_pct", 0))


def _fit_size(src_w: int, src_h: int, box_w: int, box_h: int) -> tuple[int, int]:
    """Maior tamanho que cabe em (box_w x box_h) preservando aspect ratio."""
    if src_w <= 0 or src_h <= 0:
        return box_w, box_h
    scale = min(box_w / src_w, box_h / src_h)
    w = max(1, int(round(src_w * scale)))
    h = max(1, int(round(src_h * scale)))
    return w, h


def make_formats(img_path: str, brand: dict, targets: list[str],
                 out_dir: str) -> list[dict]:
    """Gera versoes multi-formato (fit + safe-zone) da imagem base.

    Para cada target produz {out_dir}/{stem}__{target}.png e retorna uma lista
    de dicts {"target", "path", "w", "h"}.
    """
    out_dir_p = Path(out_dir)
    out_dir_p.mkdir(parents=True, exist_ok=True)

    stem = Path(img_path).stem
    surface = _surface_rgb(brand)

    base = Image.open(img_path).convert("RGB")
    base_w, base_h = base.size

    results: list[dict] = []
    for target in targets:
        spec = brand["formats"][target]
        cw, ch = int(spec["w"]), int(spec["h"])

        top_pct, bottom_pct = _safe_zone(brand, target)
        top_px = int(round(ch * top_pct / 100.0))
        bottom_px = int(round(ch * bottom_pct / 100.0))

        # area util vertical (faixa segura) e horizontal (largura cheia)
        usable_w = cw
        usable_h = max(1, ch - top_px - bottom_px)

        fit_w, fit_h = _fit_size(base_w, base_h, usable_w, usable_h)
        resized = base.resize((fit_w, fit_h), Image.LANCZOS)

        canvas = Image.new("RGB", (cw, ch), surface)

        # centraliza horizontalmente; verticalmente centraliza na faixa segura
        x = (cw - fit_w) // 2
        y = top_px + (usable_h - fit_h) // 2
        # clamp defensivo: nunca invadir as safe-zones
        y = max(top_px, min(y, ch - bottom_px - fit_h))

        canvas.paste(resized, (x, y))

        out = str(out_dir_p / f"{stem}__{target}.png")
        canvas.save(out, "PNG")
        results.append({"target": target, "path": out, "w": cw, "h": ch})

    return results


def _parse_targets(raw: str | None) -> list[str]:
    if not raw:
        return list(DEFAULT_TARGETS)
    return [t.strip() for t in raw.split(",") if t.strip()]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Geracao multi-formato com safe-zones do Meta.")
    ap.add_argument("img", help="imagem criativa base (ex H1.png)")
    ap.add_argument("--targets", default=None,
                    help="lista separada por virgula (default: feed,story,square)")
    ap.add_argument("--out", default=None,
                    help="dir de saida (default: mesma pasta da img)")
    args = ap.parse_args(argv)

    img_path = args.img
    if not os.path.isfile(img_path):
        print(f"ERRO: imagem nao encontrada: {img_path}", file=sys.stderr)
        return 2

    targets = _parse_targets(args.targets)
    out_dir = args.out or str(Path(img_path).resolve().parent)

    brand = alib.load_brand()

    # valida targets contra o brand-pack
    valid = set(brand["formats"].keys()) - {"safe_zone"}
    unknown = [t for t in targets if t not in valid]
    if unknown:
        print(f"ERRO: targets desconhecidos {unknown}; validos: {sorted(valid)}",
              file=sys.stderr)
        return 2

    results = make_formats(img_path, brand, targets, out_dir)
    for r in results:
        print(f"{r['target']:>6}  {r['w']}x{r['h']}  {r['path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
