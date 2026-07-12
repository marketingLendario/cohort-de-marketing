#!/usr/bin/env python3
"""
finish.py — etapa de finishing/upscale (alavanca 8) do pipeline de criativos.

Pega um criativo aprovado e entrega versao "veiculacao-ready":
  - upscale/downscale para largura alvo (filtro Lanczos), preservando aspect
  - sharpen sutil (unsharp)
  - grao de filme MUITO leve (premium, quase imperceptivel)
  - conversao para sRGB + strip de metadados

Estetica: composicao editorial premium. Deterministico.

CLI:
  python finish.py <img> [-o out] [--width 1080] [--grain 0.012] [--no-sharpen]
"""
from __future__ import annotations
import argparse
import os
import sys
import tempfile
from pathlib import Path

# garantir alib importavel (dir do arquivo no sys.path antes do import)
sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib  # noqa: E402

from PIL import Image  # noqa: E402
import numpy as np  # noqa: E402

# semente fixa => grao deterministico
_GRAIN_SEED = 1337


def _add_grain_pillow(img_path: str, out_path: str, grain: float) -> str:
    """Adiciona grao de filme gaussiano sutil via Pillow+numpy.

    grain e a intensidade relativa (ex 0.012 ~ 1.2%). O desvio do ruido
    e escalado por 255*grain e clampeado — quase imperceptivel, NAO granulado.
    """
    im = Image.open(img_path).convert("RGB")
    arr = np.asarray(im, dtype=np.float32)
    rng = np.random.default_rng(_GRAIN_SEED)
    # ruido monocromatico (mesmo offset nos 3 canais) => grao de filme,
    # nao colorido. sigma pequeno escalado pela intensidade.
    sigma = 255.0 * max(0.0, float(grain))
    noise = rng.normal(0.0, sigma, size=arr.shape[:2]).astype(np.float32)
    out = arr + noise[..., None]
    out = np.clip(out, 0.0, 255.0).astype(np.uint8)
    Image.fromarray(out, mode="RGB").save(out_path)
    return out_path


def finish(img_path: str, out_path: str, target_w: int = 1080,
           grain: float = 0.012, sharpen: bool = True) -> str:
    """Finishing/upscale de um criativo aprovado.

    Pipeline (tudo via ImageMagick `magick`, grao via Pillow para controle fino):
      1. resize Lanczos para largura target_w (aspect preservado)
      2. unsharp sutil (se sharpen)
      3. grao de filme gaussiano muito leve (intensidade ~grain)
      4. colorspace sRGB + strip de metadados
    Retorna out_path.
    """
    img_path = str(img_path)
    out_path = str(out_path)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)

    work_fd, work_png = tempfile.mkstemp(suffix=".png", prefix="finish_")
    os.close(work_fd)
    grain_fd, grain_png = tempfile.mkstemp(suffix=".png", prefix="finish_grain_")
    os.close(grain_fd)

    try:
        # 1+2: resize Lanczos (+ unsharp sutil), gravando intermediario
        args = [img_path, "-filter", "Lanczos", "-resize", f"{int(target_w)}x"]
        if sharpen:
            args += ["-unsharp", "0x0.6+0.6+0.01"]
        args += [work_png]
        r = alib._magick(*args)
        if r.returncode != 0 or not Path(work_png).exists():
            raise RuntimeError(f"magick resize falhou: {r.stderr.strip()}")

        # 3: grao de filme sutil (premium) via Pillow+numpy
        if grain and grain > 0:
            _add_grain_pillow(work_png, grain_png, grain)
            grained = grain_png
        else:
            grained = work_png

        # 4: sRGB + strip + salvar final
        r = alib._magick(grained, "-colorspace", "sRGB", "-strip", out_path)
        if r.returncode != 0 or not Path(out_path).exists():
            raise RuntimeError(f"magick finish falhou: {r.stderr.strip()}")

        return out_path
    finally:
        for tmp in (work_png, grain_png):
            try:
                os.remove(tmp)
            except OSError:
                pass


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Finishing/upscale de criativos (alavanca 8) — premium dark.")
    p.add_argument("img", help="imagem de entrada (criativo aprovado)")
    p.add_argument("-o", "--out", default=None,
                   help="caminho de saida (default: <stem>__final.png)")
    p.add_argument("--width", type=int, default=1080,
                   help="largura alvo em px (default: 1080)")
    p.add_argument("--grain", type=float, default=0.012,
                   help="intensidade do grao de filme (default: 0.012)")
    p.add_argument("--no-sharpen", action="store_true",
                   help="desativa o unsharp sutil")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    img = Path(args.img)
    if not img.exists():
        print(f"erro: arquivo nao encontrado: {img}", file=sys.stderr)
        return 1

    out = args.out
    if out is None:
        out = str(img.with_name(f"{img.stem}__final.png"))

    result = finish(str(img), out, target_w=args.width,
                    grain=args.grain, sharpen=not args.no_sharpen)
    w, h = alib.identify_wh(result)
    print(result)
    print(f"{w}x{h}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
