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


def variation_entities(axis: str, catalog=None, archetype_id: str | None = None) -> list[dict]:
    if catalog is None:
        return [
            {"id": value["id"], "value_id": value["id"], "axis": axis,
             "fragment": value["fragment"], "compatible_archetypes": ["*"]}
            for value in load_axes().get(axis, [])
        ]
    items = []
    for raw_item in catalog["variations"].values():
        item = dict(raw_item)
        if item.get("axis") != axis:
            continue
        compatible = item.get("compatible_archetypes", ["*"])
        if archetype_id and "*" not in compatible and archetype_id not in compatible:
            continue
        items.append(item)
    return items


def _value_id(item: dict) -> str:
    return str(item.get("value_id") or item["id"])


def _fragment(axis: str, value_id: str, catalog=None, archetype_id: str | None = None) -> str:
    if catalog is not None:
        for item in variation_entities(axis, catalog, archetype_id):
            if value_id in {str(item["id"]), str(item.get("value_id", ""))}:
                return str(item["fragment"])
    for v in load_axes().get(axis, []):
        if v["id"] == value_id:
            return v["fragment"]
    return ""


def compose_recipe(mechanism_core: str, sel: dict, catalog=None,
                   archetype_id: str | None = None) -> str:
    """sel: {material, lighting, composition, density, finish} (qualquer subconjunto)."""
    order = ["material", "lighting", "composition", "density", "finish"]
    frags = [
        _fragment(ax, sel[ax], catalog, archetype_id)
        for ax in order if ax in sel and sel[ax]
    ]
    tail = ("near-black #070709 background, warm muted gold (#c9b298) as the only "
            "accent color, no people, no text, no logo, generous space reserved for "
            "a headline, premium luxury editorial mood, 4:5 vertical")
    return ", ".join([mechanism_core.rstrip(". ")] + [f for f in frags if f] + [tail])


def axis_values(axis: str, catalog=None, archetype_id: str | None = None) -> list[str]:
    return [_value_id(item) for item in variation_entities(axis, catalog, archetype_id)]


def load_layouts(catalog=None, archetype_id: str | None = None) -> list[dict]:
    if catalog is not None:
        return [
            {"id": _value_id(item), "reserve": item["fragment"]}
            for item in variation_entities("layout", catalog, archetype_id)
        ]
    import yaml
    with open(alib.DATA_DIR / "variation-axes.yaml") as f:
        return yaml.safe_load(f).get("layouts", [])


def backdrop_fragment(value_id: str, catalog=None, archetype_id: str | None = None) -> str:
    return _fragment("backdrop", value_id, catalog, archetype_id)


def mechanism_core(mechanism: str, catalog=None) -> str:
    """Busca o `core` conceitual de um mecanismo na hooks-library."""
    if catalog is not None and mechanism:
        try:
            return str(catalog.get_entity("mechanisms", mechanism).get("core", ""))
        except Exception:
            return ""
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


def sample_diverse(n: int, used: set | None = None, seed_offset: int = 0,
                   catalog=None, archetype_id: str | None = None) -> list[dict]:
    """Gera n selecoes de eixos diversas, evitando chaves ja em `used`.

    Deterministico (sem random): percorre o produto cartesiano dos 5 eixos via
    indice misto (material, lighting, composition, density e finish como variaveis
    livres). `used` contem chaves 'material|lighting|composition' (anti-saturacao).
    """
    used = set() if used is None else used   # set() vazio e falsy: nao recriar
    mats = axis_values("material", catalog, archetype_id)
    lights = axis_values("lighting", catalog, archetype_id)
    comps = axis_values("composition", catalog, archetype_id)
    dens = axis_values("density", catalog, archetype_id)
    fins = axis_values("finish", catalog, archetype_id)
    if not all((mats, lights, comps, dens, fins)):
        raise ValueError("catalogo de variacoes incompleto para gerar combinacoes")
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
