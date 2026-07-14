"""Deterministic catalog resolver for built-ins and explicit extension packs."""
from __future__ import annotations

import hashlib
import json
from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any

import yaml

from pack_loader import LoadedPack, PackLoadError, load_extension_pack


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
FACTORY_VERSION = "2.2.0"
ENTITY_GROUPS = ("archetypes", "mechanisms", "ugc_scenes", "variations", "references", "gate_profiles")
FORMATS = {"feed", "story", "square"}


class CatalogError(ValueError):
    """Fail-closed catalog resolution error."""


def _freeze(value: Any) -> Any:
    if isinstance(value, dict):
        return MappingProxyType({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value


def _thaw(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _thaw(item) for key, item in value.items()}
    if isinstance(value, tuple):
        return [_thaw(item) for item in value]
    return value


def _canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _semver(value: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part) for part in value.split("."))
    except (TypeError, ValueError) as exc:
        raise CatalogError(f"Invalid semantic version {value!r}.") from exc
    if len(parts) != 3:
        raise CatalogError(f"Invalid semantic version {value!r}.")
    return parts  # type: ignore[return-value]


def _yaml(name: str) -> dict[str, Any]:
    path = DATA_DIR / name
    try:
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, yaml.YAMLError) as exc:
        raise CatalogError(f"Cannot load built-in catalog {name}: {exc}") from exc
    if not isinstance(value, dict):
        raise CatalogError(f"Built-in catalog {name} must contain an object.")
    return value


def _builtin_archetypes() -> list[dict[str, Any]]:
    variants = {
        "hybrid": ["material", "lighting", "composition", "density", "finish", "backdrop", "layout"],
        "person": ["layout"],
        "mockup": ["mockup_device", "layout"],
        "ugc": ["ugc_scene"],
        "didactic": ["didactic_style"],
    }
    required = {
        "hybrid": ["headline"], "person": ["headline"], "mockup": ["headline"],
        "ugc": ["native_text"], "didactic": ["compare"],
    }
    out: list[dict[str, Any]] = []
    for item in _yaml("archetypes.yaml").get("archetypes", []):
        mode = item["mode"]
        theme = item.get("theme", "native" if mode == "ugc" else "dark")
        formats = [item["format"]] if item.get("format") else ["feed", "story", "square"]
        out.append({
            "id": item["id"],
            "label": item["label"],
            "renderer_mode": mode,
            "theme": theme,
            "formats": formats,
            "required_fields": required[mode],
            "compatible_mechanisms": ["*"],
            "internal_variants": variants[mode],
            "gate_profile": f"builtin.default-{theme}",
            "needs_persona": bool(item.get("needs_persona", False)),
        })
    return out


def _builtin_mechanisms() -> list[dict[str, Any]]:
    out = []
    for item in _yaml("hooks-library.yaml").get("mechanisms", []):
        out.append({
            "id": item["id"], "kind": "visual", "label": item["label"],
            "psych": item["psych"], "core": item["core"], "required_fields": [],
            "prohibited_claims": [], "compatible_archetypes": ["*"],
            "formats": ["feed", "story", "square"],
            "needs_likeness": bool(item.get("needs_likeness", False)),
        })
    return out


def _builtin_variations() -> list[dict[str, Any]]:
    raw = _yaml("variation-axes.yaml")
    out: list[dict[str, Any]] = []
    for axis, values in raw.get("axes", {}).items():
        for item in values:
            out.append({
                "id": f"builtin.{axis}.{item['id']}", "axis": axis,
                "value_id": item["id"], "fragment": item["fragment"],
                "compatible_archetypes": ["*"], "locks": [],
            })
    for item in raw.get("layouts", []):
        out.append({
            "id": f"builtin.layout.{item['id']}", "axis": "layout",
            "value_id": item["id"], "fragment": item["reserve"],
            "compatible_archetypes": ["*"], "locks": [],
        })
    return out


def _builtins() -> dict[str, list[dict[str, Any]]]:
    return {
        "archetypes": _builtin_archetypes(),
        "mechanisms": _builtin_mechanisms(),
        "ugc_scenes": list(_yaml("ugc-scenes.yaml").get("ugc_scenes", [])),
        "variations": _builtin_variations(),
        "references": [],
        "gate_profiles": list(_yaml("gate-profiles.yaml").get("gate_profiles", [])),
    }


@dataclass(frozen=True)
class ResolvedCatalog(Mapping[str, Mapping[str, Any]]):
    entities: Mapping[str, Mapping[str, Any]]
    packs: tuple[Mapping[str, Any], ...]
    catalog_hash: str

    def __getitem__(self, key: str) -> Mapping[str, Any]:
        return self.entities[key]

    def __iter__(self) -> Iterator[str]:
        return iter(self.entities)

    def __len__(self) -> int:
        return len(self.entities)

    def get_entity(self, group: str, entity_id: str) -> Mapping[str, Any]:
        if group not in self.entities:
            raise CatalogError(f"Unknown entity group {group!r}.")
        try:
            return self.entities[group][entity_id]
        except KeyError as exc:
            raise CatalogError(f"Unknown {group} id {entity_id!r}.") from exc

    def list_entities(self, group: str | None = None) -> list[dict[str, Any]]:
        groups = (group,) if group else ENTITY_GROUPS
        out: list[dict[str, Any]] = []
        for name in groups:
            if name not in self.entities:
                raise CatalogError(f"Unknown entity group {name!r}.")
            for entity_id in sorted(self.entities[name]):
                item = _thaw(self.entities[name][entity_id])
                item["entity_type"] = name
                out.append(item)
        return out

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": "1.0.0",
            "factory_version": FACTORY_VERSION,
            "catalog_hash": self.catalog_hash,
            "packs": [_thaw(pack) for pack in self.packs],
            "entities": {
                group: [_thaw(self.entities[group][key]) for key in sorted(self.entities[group])]
                for group in ENTITY_GROUPS
            },
        }


def _entry(item: Mapping[str, Any], *, origin: str, pack_id: str, pack_version: str) -> dict[str, Any]:
    return {**dict(item), "origin": origin, "pack_id": pack_id, "pack_version": pack_version}


def _register(target: dict[str, dict[str, Any]], group: str, item: Mapping[str, Any],
              *, origin: str, pack_id: str, pack_version: str) -> None:
    entity_id = str(item["id"])
    if entity_id in target[group]:
        previous = target[group][entity_id]
        raise CatalogError(
            f"Duplicate {group} id {entity_id!r}: {previous['pack_id']} and {pack_id}. "
            "Rename the external entity; built-ins cannot be overridden."
        )
    target[group][entity_id] = _entry(item, origin=origin, pack_id=pack_id, pack_version=pack_version)


def _validate_links(entities: dict[str, dict[str, Any]]) -> None:
    archetypes = set(entities["archetypes"])
    mechanisms = set(entities["mechanisms"])
    gates = set(entities["gate_profiles"])
    ugc_scenes = set(entities["ugc_scenes"])
    variations = set(entities["variations"])
    references = set(entities["references"])

    for item in entities["archetypes"].values():
        if item["gate_profile"] not in gates:
            raise CatalogError(f"Archetype {item['id']!r} references unknown gate profile {item['gate_profile']!r}.")
        for mechanism in item.get("compatible_mechanisms", []):
            if mechanism != "*" and mechanism not in mechanisms:
                raise CatalogError(f"Archetype {item['id']!r} references unknown mechanism {mechanism!r}.")
        for field, known in (
            ("compatible_ugc_scenes", ugc_scenes),
            ("compatible_variations", variations),
            ("reference_ids", references),
        ):
            for entity_id in item.get(field, []):
                if entity_id != "*" and entity_id not in known:
                    raise CatalogError(
                        f"Archetype {item['id']!r} {field} references unknown entity {entity_id!r}."
                    )
        unknown_formats = set(item.get("formats", [])) - FORMATS
        if unknown_formats:
            raise CatalogError(f"Archetype {item['id']!r} has unsupported formats {sorted(unknown_formats)!r}.")

    for group in ("mechanisms", "variations"):
        for item in entities[group].values():
            for archetype in item.get("compatible_archetypes", []):
                if archetype != "*" and archetype not in archetypes:
                    raise CatalogError(f"{group} entity {item['id']!r} references unknown archetype {archetype!r}.")

    for item in entities["ugc_scenes"].values():
        unknown_formats = set(item.get("formats", [])) - FORMATS
        if unknown_formats:
            raise CatalogError(f"UGC scene {item['id']!r} has unsupported formats {sorted(unknown_formats)!r}.")


def resolve_catalog(extension_paths: Sequence[str | Path] = ()) -> ResolvedCatalog:
    entities: dict[str, dict[str, Any]] = {group: {} for group in ENTITY_GROUPS}
    for group, items in _builtins().items():
        for item in items:
            _register(entities, group, item, origin="builtin", pack_id="builtin", pack_version=FACTORY_VERSION)

    loaded: list[LoadedPack] = []
    for path in extension_paths:
        pack = load_extension_pack(path)
        if _semver(pack["min_factory_version"]) > _semver(FACTORY_VERSION):
            raise CatalogError(
                f"Extension pack {pack['id']!r} requires factory {pack['min_factory_version']} or newer; "
                f"current version is {FACTORY_VERSION}."
            )
        loaded.append(pack)

    loaded.sort(key=lambda pack: (str(pack["id"]), _semver(str(pack["version"]))))
    pack_metadata: list[dict[str, Any]] = []
    seen_pack_ids: set[str] = set()
    for pack in loaded:
        pack_id = str(pack["id"])
        if pack_id in seen_pack_ids:
            raise CatalogError(f"Extension pack id {pack_id!r} was selected more than once.")
        seen_pack_ids.add(pack_id)
        pack_metadata.append({
            "id": pack_id, "version": str(pack["version"]),
            "namespace": str(pack["namespace"]),
            "min_factory_version": str(pack["min_factory_version"]),
        })
        raw = pack.to_dict()
        for group in ENTITY_GROUPS:
            for item in raw["entities"][group]:
                _register(
                    entities, group, item, origin="extension",
                    pack_id=pack_id, pack_version=str(pack["version"]),
                )

    _validate_links(entities)
    hash_payload = {
        "factory_version": FACTORY_VERSION,
        "packs": pack_metadata,
        "entities": {
            group: [entities[group][key] for key in sorted(entities[group])]
            for group in ENTITY_GROUPS
        },
    }
    catalog_hash = hashlib.sha256(_canonical(hash_payload).encode("utf-8")).hexdigest()
    frozen_entities = MappingProxyType({
        group: MappingProxyType({key: _freeze(value) for key, value in items.items()})
        for group, items in entities.items()
    })
    return ResolvedCatalog(
        entities=frozen_entities,
        packs=tuple(_freeze(item) for item in pack_metadata),
        catalog_hash=catalog_hash,
    )


__all__ = ["CatalogError", "ENTITY_GROUPS", "FACTORY_VERSION", "ResolvedCatalog", "resolve_catalog"]
