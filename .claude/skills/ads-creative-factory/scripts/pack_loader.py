"""Fail-closed loader for versioned, self-contained creative packs.

The loader deliberately has no default pack, process-global cache, or implicit
rights. A caller chooses the pack directory explicitly; every declared asset is
then checked against that directory before the immutable contract is returned.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any


SCHEMA_DIR = Path(__file__).resolve().parents[1] / "schemas"
SUPPORTED_SCHEMA_VERSION = "1.0.0"
SCHEMA_FILES = {
    "brand": SCHEMA_DIR / "brand-pack.v1.schema.json",
    "persona": SCHEMA_DIR / "persona-pack.v1.schema.json",
    "creative-extension": SCHEMA_DIR / "creative-extension-pack.v1.schema.json",
}
MANIFEST_NAMES = ("pack.json", "brand-pack.json", "persona-pack.json", "creative-extension-pack.json")
_WINDOWS_ABSOLUTE = re.compile(r"^[A-Za-z]:[\\/]")
_SEMVER = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
_EXTENSION_ENTITY_GROUPS = (
    "archetypes", "mechanisms", "ugc_scenes", "variations", "references", "gate_profiles",
)
_RENDERER_MODES = {"hybrid", "person", "mockup", "ugc", "didactic"}


class PackLoadError(ValueError):
    """Actionable error raised for every invalid or unsafe pack."""


class FrozenList(tuple):
    """Tuple with list-like equality for convenient read-only assertions."""

    def __eq__(self, other: object) -> bool:
        if isinstance(other, (list, tuple, FrozenList)):
            return tuple(self) == tuple(other)
        return NotImplemented


def _freeze(value: Any) -> Any:
    if isinstance(value, dict):
        return MappingProxyType({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return FrozenList(_freeze(item) for item in value)
    return value


def _thaw(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: _thaw(item) for key, item in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_thaw(item) for item in value]
    return value


@dataclass(frozen=True)
class LoadedPack(Mapping[str, Any]):
    """Immutable pack data plus paths resolved during validation."""

    data: Mapping[str, Any]
    root: Path
    schema_path: Path
    asset_paths: Mapping[str, Path]

    def __getitem__(self, key: str) -> Any:
        return self.data[key]

    def __iter__(self) -> Iterator[str]:
        return iter(self.data)

    def __len__(self) -> int:
        return len(self.data)

    def to_dict(self) -> dict[str, Any]:
        """Return a detached mutable copy for an explicit caller-owned edit."""
        return _thaw(self.data)


def _error(location: str, message: str) -> PackLoadError:
    return PackLoadError(f"Invalid pack at {location}: {message}. Fix the pack and retry.")


def _read_json(path: Path) -> dict[str, Any]:
    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate key {key!r}")
            result[key] = value
        return result

    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle, object_pairs_hook=reject_duplicates)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        raise _error(str(path), f"manifest is not valid UTF-8 JSON ({exc})") from exc
    if not isinstance(value, dict):
        raise _error(str(path), "manifest root must be a JSON object")
    return value


def _resolve_ref(root_schema: dict[str, Any], ref: str) -> dict[str, Any]:
    if not ref.startswith("#/"):
        raise PackLoadError(f"Unsupported schema reference {ref!r}; use a local schema reference.")
    value: Any = root_schema
    for part in ref[2:].split("/"):
        value = value[part.replace("~1", "/").replace("~0", "~")]
    if not isinstance(value, dict):
        raise PackLoadError(f"Schema reference {ref!r} does not point to an object.")
    return value


def _json_type(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    return False


def _validate_schema(value: Any, schema: dict[str, Any], root_schema: dict[str, Any], location: str) -> None:
    if "$ref" in schema:
        _validate_schema(value, _resolve_ref(root_schema, schema["$ref"]), root_schema, location)
        return

    if "const" in schema and value != schema["const"]:
        raise _error(location, f"must equal {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        raise _error(location, f"must be one of {schema['enum']!r}")

    expected = schema.get("type")
    if expected and not _json_type(value, expected):
        raise _error(location, f"must be a {expected}")

    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            raise _error(location, "must not be empty")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            raise _error(location, f"must contain at most {schema['maxLength']} characters")
        pattern = schema.get("pattern")
        if pattern and not re.search(pattern, value):
            raise _error(location, "has an invalid format")

    if isinstance(value, (int, float)) and "minimum" in schema and value < schema["minimum"]:
        raise _error(location, f"must be at least {schema['minimum']}")
    if isinstance(value, (int, float)) and "maximum" in schema and value > schema["maximum"]:
        raise _error(location, f"must be at most {schema['maximum']}")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            raise _error(location, f"must contain at least {schema['minItems']} item(s)")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            raise _error(location, f"must contain at most {schema['maxItems']} item(s)")
        if schema.get("uniqueItems") and len({json.dumps(item, sort_keys=True) for item in value}) != len(value):
            raise _error(location, "must not contain duplicate items")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                _validate_schema(item, item_schema, root_schema, f"{location}[{index}]")

    if isinstance(value, dict):
        properties = schema.get("properties", {})
        for required in schema.get("required", []):
            if required not in value:
                raise _error(f"{location}.{required}", "required field is missing")
        if schema.get("additionalProperties") is False:
            unknown = sorted(set(value) - set(properties))
            if unknown:
                raise _error(location, f"unknown field(s): {', '.join(unknown)}")
        for key, child_schema in properties.items():
            if key in value:
                _validate_schema(value[key], child_schema, root_schema, f"{location}.{key}")


def _load_schema(pack_type: str) -> tuple[dict[str, Any], Path]:
    schema_path = SCHEMA_FILES[pack_type]
    try:
        schema = _read_json(schema_path)
    except PackLoadError as exc:
        raise PackLoadError(f"Cannot load {pack_type} pack contract: {exc}") from exc
    return schema, schema_path


def _pack_manifest(pack_path: str | Path) -> tuple[Path, Path]:
    supplied = Path(pack_path).expanduser()
    if not supplied.exists():
        raise _error(str(supplied), "pack directory or manifest does not exist")

    if supplied.is_file():
        manifest = supplied
        root = supplied.parent
    elif supplied.is_dir():
        root = supplied
        candidates = [root / name for name in MANIFEST_NAMES if (root / name).is_file()]
        if not candidates:
            raise _error(str(root), "no pack manifest found; add pack.json")
        manifest = candidates[0]
    else:
        raise _error(str(supplied), "pack path must be a directory or regular manifest file")

    root = root.resolve()
    try:
        manifest.resolve(strict=True).relative_to(root)
    except ValueError as exc:
        raise _error(str(manifest), "manifest escapes its pack root through a symlink") from exc
    except OSError as exc:
        raise _error(str(manifest), f"manifest cannot be resolved ({exc})") from exc
    return root, manifest


def _resolve_asset_path(root: Path, raw_path: str, location: str) -> Path:
    normalized = raw_path.replace("\\", "/")
    if normalized.startswith("/") or _WINDOWS_ABSOLUTE.match(normalized):
        raise _error(location, "asset path must be relative to the pack root")
    if any(part == ".." for part in normalized.split("/")):
        raise _error(location, "asset path traversal is not allowed")

    try:
        candidate = (root / Path(*normalized.split("/"))).resolve(strict=True)
    except OSError as exc:
        raise _error(location, f"asset path cannot be resolved ({exc})") from exc
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise _error(location, "asset path escapes the pack root through a symlink") from exc
    except OSError as exc:
        raise _error(location, f"asset path cannot be resolved ({exc})") from exc
    if not candidate.is_file():
        raise _error(location, "asset path must resolve to a regular file")
    return candidate


def _reject_obvious_path_issues(pack: dict[str, Any], location: str) -> None:
    """Keep traversal errors actionable even before structural schema checks."""
    assets = pack.get("assets")
    files = assets.get("files") if isinstance(assets, dict) else None
    if not isinstance(files, list):
        return
    for index, asset in enumerate(files):
        if not isinstance(asset, dict) or not isinstance(asset.get("path"), str):
            continue
        raw_path = asset["path"]
        normalized = raw_path.replace("\\", "/")
        asset_location = f"{location}.assets.files[{index}].path"
        if normalized.startswith("/") or _WINDOWS_ABSOLUTE.match(normalized):
            raise _error(asset_location, "asset path must be relative to the pack root")
        if any(part == ".." for part in normalized.split("/")):
            raise _error(asset_location, "asset path traversal is not allowed")


def _validate_rights_and_assets(pack: dict[str, Any], root: Path, location: str) -> dict[str, Path]:
    rights = pack["rights"]
    licenses = {license_data["id"]: license_data for license_data in rights["licenses"]}
    if len(licenses) != len(rights["licenses"]):
        raise _error(f"{location}.rights.licenses", "license ids must be unique")

    asset_paths: dict[str, Path] = {}
    for index, asset in enumerate(pack["assets"]["files"]):
        asset_location = f"{location}.assets.files[{index}]"
        if asset["id"] in asset_paths:
            raise _error(asset_location, f"duplicate asset id {asset['id']!r}")
        if asset["rights_id"] not in licenses:
            raise _error(
                f"{asset_location}.rights_id",
                f"unknown rights id {asset['rights_id']!r}; declare it in rights.licenses",
            )
        license_data = licenses[asset["rights_id"]]
        if rights["redistributable"] and not license_data["redistributable"]:
            raise _error(
                f"{asset_location}.rights_id",
                "pack cannot be marked redistributable while an asset license is not redistributable",
            )
        resolved = _resolve_asset_path(root, asset["path"], f"{asset_location}.path")
        declared_sha = asset.get("sha256")
        if declared_sha:
            actual_sha = hashlib.sha256(resolved.read_bytes()).hexdigest()
            if actual_sha != declared_sha:
                raise _error(f"{asset_location}.sha256", "declared SHA-256 does not match the asset")
        asset_paths[asset["id"]] = resolved
    return asset_paths


def _validate_extension_semantics(pack: dict[str, Any], location: str) -> None:
    namespace = pack["namespace"]
    if namespace == "builtin":
        raise _error(f"{location}.namespace", "namespace 'builtin' is reserved by the factory")
    if not _SEMVER.fullmatch(pack["version"]) or not _SEMVER.fullmatch(pack["min_factory_version"]):
        raise _error(location, "version and min_factory_version must use MAJOR.MINOR.PATCH")

    entities = pack["entities"]
    seen: dict[str, str] = {}
    for group in _EXTENSION_ENTITY_GROUPS:
        for index, entity in enumerate(entities[group]):
            entity_id = entity["id"]
            entity_location = f"{location}.entities.{group}[{index}]"
            if not entity_id.startswith(namespace + "."):
                raise _error(f"{entity_location}.id", f"must use the declared namespace {namespace!r}")
            if entity_id in seen:
                raise _error(f"{entity_location}.id", f"duplicates entity declared at {seen[entity_id]}")
            seen[entity_id] = entity_location

            if group == "archetypes" and entity["renderer_mode"] not in _RENDERER_MODES:
                raise _error(f"{entity_location}.renderer_mode", "renderer mode is not allowlisted")
            if group == "mechanisms":
                kind = entity["kind"]
                if kind in {"visual", "hybrid"} and not str(entity.get("core", "")).strip():
                    raise _error(f"{entity_location}.core", f"core is required for mechanism kind {kind!r}")
                copy_fields = ("belief_shift", "hook_structure", "proof_type", "objection")
                if kind in {"copy", "hybrid"}:
                    missing = [field for field in copy_fields if not str(entity.get(field, "")).strip()]
                    if missing:
                        raise _error(entity_location, f"copy mechanism is missing: {', '.join(missing)}")
            if group == "gate_profiles":
                thresholds = entity["thresholds"]
                for key, value in thresholds.items():
                    limit = 100.0 if key.endswith("_pct") or key == "ai_slop_fail_threshold" else None
                    if limit is not None and float(value) > limit:
                        raise _error(f"{entity_location}.thresholds.{key}", "percentage threshold cannot exceed 100")
                minimum = thresholds.get("accent_min_coverage_pct")
                maximum = thresholds.get("accent_max_coverage_pct")
                if minimum is not None and maximum is not None and minimum > maximum:
                    raise _error(f"{entity_location}.thresholds", "accent minimum cannot exceed maximum")

    assets = {asset["id"]: asset for asset in pack["assets"]["files"]}
    licenses = {item["id"] for item in pack["rights"]["licenses"]}
    for index, reference in enumerate(entities["references"]):
        ref_location = f"{location}.entities.references[{index}]"
        asset = assets.get(reference["asset_id"])
        if asset is None:
            raise _error(f"{ref_location}.asset_id", "reference points to an unknown asset")
        if reference["rights_id"] not in licenses or reference["rights_id"] != asset["rights_id"]:
            raise _error(f"{ref_location}.rights_id", "reference rights must match its asset license")


def load_pack(pack_path: str | Path, expected_type: str | None = None) -> LoadedPack:
    """Load one explicit versioned pack and return an immutable contract."""
    root, manifest = _pack_manifest(pack_path)
    pack = _read_json(manifest)
    location = str(manifest)

    pack_type = pack.get("pack_type")
    if pack_type not in SCHEMA_FILES:
        supported = ", ".join(sorted(SCHEMA_FILES))
        raise _error(f"{location}.pack_type", f"unknown pack type; supported values are {supported}")
    if expected_type is not None and pack_type != expected_type:
        raise _error(f"{location}.pack_type", f"expected {expected_type!r}, received {pack_type!r}")
    if pack.get("schema_version") != SUPPORTED_SCHEMA_VERSION:
        raise _error(
            f"{location}.schema_version",
            f"unsupported schema version; supported value is {SUPPORTED_SCHEMA_VERSION!r}",
        )

    schema, schema_path = _load_schema(pack_type)
    _reject_obvious_path_issues(pack, location)
    _validate_schema(pack, schema, schema, location)
    if pack_type == "creative-extension":
        _validate_extension_semantics(pack, location)
    asset_paths = _validate_rights_and_assets(pack, root, location)

    return LoadedPack(
        data=_freeze(pack),
        root=root,
        schema_path=schema_path,
        asset_paths=MappingProxyType(asset_paths),
    )


def load_brand_pack(pack_path: str | Path) -> LoadedPack:
    return load_pack(pack_path, expected_type="brand")


def load_persona_pack(pack_path: str | Path) -> LoadedPack:
    return load_pack(pack_path, expected_type="persona")


def load_extension_pack(pack_path: str | Path) -> LoadedPack:
    return load_pack(pack_path, expected_type="creative-extension")


def load_packs(pack_paths: Sequence[str | Path], max_workers: int = 1) -> tuple[LoadedPack, ...]:
    """Load packs independently, preserving input order in sequential/parallel mode."""
    paths = tuple(pack_paths)
    if max_workers < 1:
        raise ValueError("max_workers must be at least 1")
    if max_workers == 1 or len(paths) < 2:
        return tuple(load_pack(path) for path in paths)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        return tuple(executor.map(load_pack, paths))


def resolve_asset(pack: LoadedPack, asset_id: str) -> Path:
    """Return a path already proven to stay inside the loaded pack root."""
    try:
        return pack.asset_paths[asset_id]
    except KeyError as exc:
        raise PackLoadError(f"Unknown asset {asset_id!r}; use an id declared in assets.files.") from exc


__all__ = [
    "LoadedPack",
    "PackLoadError",
    "load_brand_pack",
    "load_extension_pack",
    "load_pack",
    "load_packs",
    "load_persona_pack",
    "resolve_asset",
]
