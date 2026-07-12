"""
variation.py — biblioteca de eixos de variacao (anti-saturacao).

Compoe um visual_recipe a partir de:
  - mechanism_core: o esqueleto conceitual (1 frase, vem do mecanismo de hook)
  - axes_selection: 1 valor por eixo (material, lighting, composition, density, finish)
Cada valor injeta um fragment on-brand. Mesma copy + eixos diferentes = looks
radicalmente distintos, sempre dentro da marca (dark-first, gold unico acento).

Tambem oferece amostragem DIVERSA (sample_diverse) que evita repetir combinacoes
ja usadas — base do motor anti-saturacao (fase C).
"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib

_AXES = None


def load_axes() -> dict:
    global _AXES
    if _AXES is None:
        import yaml
        with open(alib.DATA_DIR / "variation-axes.yaml") as f:
            _AXES = yaml.safe_load(f)["axes"]
    return _AXES


def _fragment(axis: str, value_id: str) -> str:
    for v in load_axes().get(axis, []):
        if v["id"] == value_id:
            return v["fragment"]
    return ""


def compose_recipe(mechanism_core: str, sel: dict) -> str:
    """sel: {material, lighting, composition, density, finish} (qualquer subconjunto)."""
    order = ["material", "lighting", "composition", "density", "finish"]
    frags = [_fragment(ax, sel[ax]) for ax in order if ax in sel and sel[ax]]
    tail = ("near-black #070709 background, warm muted gold (#c9b298) as the only "
            "accent color, no people, no text, no logo, generous space reserved for "
            "a headline, premium luxury editorial mood, 4:5 vertical")
    return ", ".join([mechanism_core.rstrip(". ")] + [f for f in frags if f] + [tail])


def axis_values(axis: str) -> list[str]:
    return [v["id"] for v in load_axes().get(axis, [])]


def load_layouts() -> list[dict]:
    import yaml
    with open(alib.DATA_DIR / "variation-axes.yaml") as f:
        return yaml.safe_load(f).get("layouts", [])


def backdrop_fragment(value_id: str) -> str:
    return _fragment("backdrop", value_id)


def mechanism_core(mechanism: str) -> str:
    """Busca o `core` conceitual de um mecanismo na hooks-library."""
    import yaml
    with open(alib.DATA_DIR / "hooks-library.yaml") as f:
        lib = yaml.safe_load(f)
    for m in lib.get("mechanisms", []):
        if m["id"] == mechanism:
            return m.get("core", "")
    return ""


def _axis_combo_at_index(i: int, mats: list, lights: list, comps: list,
                         dens: list, fins: list) -> dict:
    """Indice misto (mixed-radix): cada eixo avanca de forma independente no produto."""
    lm, ll, lc, ld, lf = len(mats), len(lights), len(comps), len(dens), len(fins)
    mi = i % lm
    t = i // lm
    li = t % ll
    t //= ll
    ci = t % lc
    t //= lc
    di = t % ld
    t //= ld
    fi = t % lf
    return {
        "material": mats[mi],
        "lighting": lights[li],
        "composition": comps[ci],
        "density": dens[di],
        "finish": fins[fi],
    }


def sample_diverse(n: int, used: set | None = None, seed_offset: int = 0) -> list[dict]:
    """Gera n selecoes de eixos diversas, evitando chaves ja em `used`.

    Deterministico (sem random): percorre o produto cartesiano dos 5 eixos via
    indice misto (material, lighting, composition, density e finish como variaveis
    livres). `used` contem chaves 'material|lighting|composition' (anti-saturacao).
    """
    used = set() if used is None else used   # set() vazio e falsy: nao recriar
    mats = axis_values("material")
    lights = axis_values("lighting")
    comps = axis_values("composition")
    dens = axis_values("density")
    fins = axis_values("finish")
    out, i = [], seed_offset
    guard = 0
    while len(out) < n and guard < 10000:
        sel = _axis_combo_at_index(i, mats, lights, comps, dens, fins)
        key = f"{sel['material']}|{sel['lighting']}|{sel['composition']}"
        if key not in used:
            used.add(key)
            out.append(sel)
        i += 1
        guard += 1
    return out


if __name__ == "__main__":
    core = "A single dominant form representing a missing key metric, emerging from darkness"
    for sel in sample_diverse(4):
        print("·", {k: sel[k] for k in ("material", "lighting", "composition")})
        print("   ", compose_recipe(core, sel)[:160], "...")
