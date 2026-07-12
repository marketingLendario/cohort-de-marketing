"""
person.py — arquetipo Pessoa/Autoridade, persona-agnostico.

Usa FOTOS REAIS (nunca likeness gerada) somente de uma persona explicitamente
declarada pelo request e validada pelo pack loader. Escolhe a foto com mais
espaco negativo (ou a preferred),
faz cover-fit, e compoe o texto vetorial com scrim de foto (legibilidade).
Tambem expoe pick_photo p/ o arquetipo UGC reusar a mesma persona.
"""
from __future__ import annotations
import sys
from pathlib import Path
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import typeset as typeset_mod
import compose as compose_mod
import finish as finish_mod

EXT = {".jpg", ".jpeg", ".png", ".webp"}


def get(persona_id: str | dict, brand: dict | None = None) -> dict:
    if isinstance(persona_id, dict):
        return persona_id
    if brand is None:
        raise KeyError(f"persona requer um brand pack e declaracao explicita: {persona_id}")
    return alib.load_persona(persona_id, brand)


def _photos(persona: dict) -> list[Path]:
    declared = persona.get("photos")
    if isinstance(declared, list):
        return sorted(Path(path) for path in declared if Path(path).is_file())
    directory = Path(str(persona.get("photos_dir", "")))
    if not directory.is_absolute():
        root = Path(str(persona.get("_pack_root", "")))
        directory = (root / directory).resolve()
    if not directory.exists():
        return []
    return sorted(path for path in directory.iterdir() if path.suffix.lower() in EXT)


def _negative_space_score(path: Path) -> float:
    """quanto mais area escura (espaco p/ texto), maior — heuristica de selecao."""
    im = Image.open(path).convert("L").resize((64, 80))
    arr = np.asarray(im)
    return float((arr < 60).mean())


def pick_photo(persona_id: str | dict, brand: dict | None = None) -> str | None:
    persona = get(persona_id, brand)
    photos = _photos(persona)
    if not photos:
        return None
    pref = persona.get("preferred_photo")
    if pref:
        for p in photos:
            if p.name == pref:
                return str(p)
    # senao: a foto com mais espaco negativo (melhor p/ texto)
    return str(max(photos, key=_negative_space_score))


def _cover(im, W, H):
    s = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = (im.width - W) // 2
    return im.crop((x, 0, x + W, H))   # mantem topo (rosto costuma estar em cima)


_REMBG = None


def _cutout(photo: str) -> Image.Image:
    """Recorta a pessoa (rembg) → RGBA com alpha. rembg carrega só aqui (lazy)."""
    global _REMBG
    from rembg import remove, new_session
    if _REMBG is None:
        _REMBG = new_session("u2net")
    src = Image.open(photo).convert("RGBA")
    return remove(src, session=_REMBG)


# Prompt de EDIT (image-to-image): preserva a pessoa pixel-fiel, troca só o ambiente.
# Resolve fidelidade (rosto real) + corpo natural integrado (sem recorte/fade).
EDIT_PROMPT = (
    "Use the image_gen tool to EDIT the attached photograph (image-to-image edit; "
    "do NOT generate a new person from scratch). KEEP the person EXACTLY as in the "
    "photo — face, eyes, glasses, hair, expression and skin must stay pixel-faithful "
    "and unchanged; do not regenerate, beautify, slim or age the face. Change ONLY the "
    "environment: replace the background with a dark premium near-black cinematic scene, "
    "warm gold rim light from the right, deep shadows, and faint heavily-blurred gold "
    "marketing-analytics charts far behind; relight the person's edges subtly to match "
    "the dark scene; keep their clothing. Place the person on the RIGHT side of a vertical "
    "4:5 frame, leaving the LEFT side dark and empty for text. Output the edited photo — "
    "the SAME person, same face, recognizable."
)


def edit_to_scene(photo: str, out_edit: str) -> str:
    """EDIT image-to-image: preserva a pessoa, troca o fundo. Retorna o editado
    (ou a foto original se o edit falhar). Faz UMA geração — reusável p/ N formatos."""
    return out_edit if alib.codex_image(EDIT_PROMPT, out_edit, refs=[photo])["ok"] else photo


def compose_person(src: str, copy: dict, out_path: str, H: int, *,
                   layout: str = "editorial_left", logo: bool = True,
                   brand: dict | None = None) -> str:
    base = out_path.rsplit(".png", 1)[0]
    bg = base + "__bg.png"
    _cover(Image.open(src).convert("RGB"), 1080, H).save(bg)
    ts = base + "__ts.png"
    typeset_mod.render_creative(bg, copy, ts, layout=layout, H=H, theme="dark",
                                photo_scrim=True, brand=brand)
    if logo:
        lg = base + "__logo.png"
        compose_mod.compose_logo(ts, lg, variant="icon", surface="dark")
        return finish_mod.finish(lg, out_path, target_w=1080)
    return finish_mod.finish(ts, out_path, target_w=1080)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("persona", help="id ou caminho do pack de persona explicitamente selecionado")
    ap.add_argument("-o", "--out", default="out/archetype-test/person_persona.png")
    ap.add_argument("--cutout", metavar="PHOTO", help="recorte rembg (CLI) → stdout path")
    a = ap.parse_args()
    if a.cutout:
        out = a.cutout.rsplit(".", 1)[0] + "__cutout.png"
        _cutout(a.cutout).save(out)
        print(out)
    else:
        brand = alib.load_brand()
        persona = get(a.persona, brand)
        copy = {"eyebrow": f"{persona['name'].upper()} · AO VIVO",
                "headline": "Vou abrir os bastidores da minha operação.",
                "emphasis_word": "bastidores",
                "sub": "Semana de lives gratuitas. O método de marketing com IA, ao vivo.",
                "cta": "Quero participar grátis"}
        photo = pick_photo(persona, brand)
        if not photo:
            raise SystemExit(f"sem fotos para persona {a.persona}")
        edited = edit_to_scene(photo, a.out.rsplit(".png", 1)[0] + "__edit.png")
        print(compose_person(edited, copy, a.out, H=1350, brand=brand))
