"""
prepare_assets.py — alavanca 4 (brand-asset library de overlay).

Gera variantes de superficie (cream p/ dark, black p/ light) do logo completo,
do icone (Silhueta-AL) e dos simbolos (lemniscata, oito, lentes), preservando
forma/fonte/icone — apenas a cor adapta. Saida em out/brand_assets/.

Os SVGs de simbolos sao rasterizados via rsvg-convert (ou magick) antes do recolor.
"""
from __future__ import annotations
import sys, subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

ASSETS_OUT = alib.OUT_DIR / "brand_assets"

# cor por superficie
def _rasterize_svg(svg: Path, dst: Path, width: int = 512) -> bool:
    if shutil_which("rsvg-convert"):
        r = subprocess.run(["rsvg-convert", "-w", str(width), str(svg), "-o", str(dst)],
                           capture_output=True, text=True)
        return r.returncode == 0 and dst.exists()
    # fallback magick
    r = alib._magick("-background", "none", "-density", "300", svg,
                     "-resize", f"{width}x", dst)
    return r.returncode == 0 and dst.exists()


def shutil_which(name: str):
    from shutil import which
    return which(name)


def prepare(brand: dict | None = None) -> dict:
    brand = brand or alib.load_brand()
    palette = brand["palette"]
    surface_color = {
        "dark": "#{:02x}{:02x}{:02x}".format(*alib.hex_to_rgb(palette["foreground"])),
        "light": "#{:02x}{:02x}{:02x}".format(*alib.hex_to_rgb(palette["primary"])),
        "gold": "#{:02x}{:02x}{:02x}".format(*alib.hex_to_rgb(palette["accent"])),
    }
    ASSETS_OUT.mkdir(parents=True, exist_ok=True)
    made = {}

    # Logo/simbolos sao OPCIONAIS: marcas de DESIGN.md podem nao empacotar assets.
    # Sem source_dir ou sem a chave do asset, pulamos sem quebrar (compose_logo entao
    # so roda quando a marca de fato entrega um logo).
    assets_cfg = brand.get("assets") or {}
    if "source_dir" not in assets_cfg:
        return made

    # --- logo completo + icone (PNG preto+alpha) ---
    png_specs = {
        "logo_full": "logo_full_src",
        "logo_icon": "logo_icon_src",
    }
    for name, key in png_specs.items():
        if key not in assets_cfg:
            continue
        src = alib.asset_path(brand, key)
        if not src.exists():
            print(f"  ! ausente: {src}"); continue
        for surf, color in surface_color.items():
            dst = ASSETS_OUT / f"{name}-{surf}.png"
            if alib.recolor_asset(src, color, dst):
                made[f"{name}-{surf}"] = str(dst)

    # --- simbolos (SVG) ---
    sym_specs = {
        "lemniscata": "symbol_lemniscata_src",
        "oito": "symbol_oito_src",
        "lentes": "symbol_lentes_src",
    }
    for name, key in sym_specs.items():
        if key not in assets_cfg:
            continue
        src = alib.asset_path(brand, key)
        if not src.exists():
            print(f"  ! ausente: {src}"); continue
        raster = ASSETS_OUT / f"_{name}-raw.png"
        if not _rasterize_svg(src, raster):
            print(f"  ! falha rasterizar {src}"); continue
        for surf, color in (("dark", surface_color["dark"]), ("gold", surface_color["gold"])):
            dst = ASSETS_OUT / f"sym-{name}-{surf}.png"
            if alib.recolor_asset(raster, color, dst):
                made[f"sym-{name}-{surf}"] = str(dst)

    return made


if __name__ == "__main__":
    made = prepare()
    print(f"\n{len(made)} variantes de asset geradas em {ASSETS_OUT}:")
    for k, v in made.items():
        print(f"  {k:24s} -> {Path(v).name}")
