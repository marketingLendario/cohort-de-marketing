"""Atomic authoring helpers for project-local Creative Factory packs."""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any, Callable

from catalog_loader import resolve_catalog
from pack_loader import PackLoadError, load_extension_pack


SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{1,95}$")
NAMESPACE = re.compile(r"^[a-z0-9][a-z0-9-]{1,31}$")
ENTITY_GROUPS = {"archetypes", "mechanisms", "ugc_scenes", "variations", "references", "gate_profiles"}


class AuthoringError(ValueError):
    """Actionable and rollback-safe authoring failure."""


def _regular_dir(path: str | Path, label: str) -> Path:
    value = Path(path).expanduser().absolute()
    if value.is_symlink() or not value.is_dir():
        raise AuthoringError(f"{label} precisa ser um diretório regular existente.")
    return value.resolve()


def _json_write(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _atomic_replace_directory(staged: Path, target: Path) -> None:
    backup = target.with_name(f".{target.name}.backup")
    if backup.exists():
        shutil.rmtree(backup)
    target.rename(backup)
    try:
        os.replace(staged, target)
    except Exception:
        if target.exists():
            shutil.rmtree(target)
        backup.rename(target)
        raise
    shutil.rmtree(backup)


def build_extension_pack(
    project_root: str | Path,
    *,
    pack_id: str,
    namespace: str,
    version: str,
    rights_notice: str,
    force: bool = False,
    dry_run: bool = False,
) -> dict[str, Any]:
    project = _regular_dir(project_root, "project_root")
    if not SAFE_ID.fullmatch(pack_id) or not NAMESPACE.fullmatch(namespace):
        raise AuthoringError("Pack id ou namespace inválido.")
    if not rights_notice.strip():
        raise AuthoringError("A declaração de direitos é obrigatória.")
    target = project / "creative-factory" / "packs" / pack_id
    if target.exists() and (not target.is_dir() or any(target.iterdir())) and not force:
        raise AuthoringError("O pack já existe; use --force somente após revisão.")
    if not dry_run:
        target.parent.mkdir(parents=True, exist_ok=True)
    staged: Path | None = Path(tempfile.mkdtemp(
        prefix=f".{pack_id}-", dir=None if dry_run else target.parent
    ))
    manifest = {
        "schema_version": "1.0.0", "pack_type": "creative-extension",
        "id": pack_id, "version": version, "namespace": namespace,
        "min_factory_version": "2.2.0",
        "entities": {group: [] for group in sorted(ENTITY_GROUPS)},
        "assets": {"files": []},
        "rights": {
            "redistributable": False, "notice": rights_notice.strip(),
            "licenses": [{
                "id": "project-use", "name": "Project asset authorization",
                "spdx": "LicenseRef-Project-Use", "redistributable": False,
                "notice": rights_notice.strip(),
            }],
        },
    }
    try:
        (staged / "assets").mkdir()
        _json_write(staged / "pack.json", manifest)
        loaded = load_extension_pack(staged)
        catalog = resolve_catalog([staged])
        summary = {
            "status": "planned" if dry_run else "valid", "id": loaded["id"],
            "version": loaded["version"], "namespace": loaded["namespace"],
            "catalog_hash": catalog.catalog_hash, "output": str(target), "dry_run": dry_run,
        }
        if dry_run:
            return summary
        if target.exists():
            shutil.rmtree(target)
        os.replace(staged, target)
        staged = None
        return summary
    finally:
        if staged is not None and staged.exists() and staged.is_dir():
            shutil.rmtree(staged, ignore_errors=True)


def mutate_extension_pack(
    pack_path: str | Path,
    mutation: Callable[[dict[str, Any], Path], None],
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    loaded = load_extension_pack(pack_path)
    root = loaded.root
    if root.is_symlink():
        raise AuthoringError("O root do pack não pode ser symlink.")
    staged: Path | None = Path(tempfile.mkdtemp(
        prefix=f".{root.name}-", dir=None if dry_run else root.parent
    ))
    shutil.rmtree(staged)
    shutil.copytree(root, staged)
    try:
        manifest_path = staged / "pack.json"
        if not manifest_path.is_file():
            manifest_path = next(path for path in staged.iterdir() if path.name.endswith("pack.json"))
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        mutation(manifest, staged)
        _json_write(manifest_path, manifest)
        checked = load_extension_pack(staged)
        catalog = resolve_catalog([staged])
        summary = {
            "status": "planned" if dry_run else "valid", "id": checked["id"],
            "version": checked["version"], "catalog_hash": catalog.catalog_hash,
            "output": str(root), "dry_run": dry_run,
        }
        if dry_run:
            return summary
        _atomic_replace_directory(staged, root)
        staged = None
        return summary
    except (OSError, json.JSONDecodeError, StopIteration) as exc:
        raise AuthoringError(f"Não foi possível atualizar o pack: {exc}") from exc
    finally:
        if staged is not None and staged.exists() and staged.is_dir():
            shutil.rmtree(staged, ignore_errors=True)


def add_entity(pack_path: str | Path, group: str, entity: dict[str, Any], *, dry_run: bool = False) -> dict[str, Any]:
    if group not in ENTITY_GROUPS:
        raise AuthoringError(f"Grupo de entidade desconhecido: {group}")

    def mutation(manifest: dict[str, Any], _staged: Path) -> None:
        items = manifest["entities"][group]
        if any(item.get("id") == entity.get("id") for item in items):
            raise AuthoringError(f"A entidade {entity.get('id')!r} já existe no pack.")
        items.append(entity)

    return mutate_extension_pack(pack_path, mutation, dry_run=dry_run)


def add_reference(
    pack_path: str | Path,
    *,
    entity_id: str,
    source_file: str | Path,
    source_label: str,
    tags: list[str],
    rights_id: str = "project-use",
    dry_run: bool = False,
) -> dict[str, Any]:
    source = Path(source_file).expanduser()
    if source.is_symlink() or not source.is_file():
        raise AuthoringError("A referência precisa ser um arquivo regular, não um symlink.")
    suffix = source.suffix.lower() or ".bin"
    asset_id = re.sub(r"[^a-z0-9._-]+", "-", entity_id.lower()).strip("-._")[:56] + "-asset"

    def mutation(manifest: dict[str, Any], staged: Path) -> None:
        if rights_id not in {item["id"] for item in manifest["rights"]["licenses"]}:
            raise AuthoringError(f"Rights id desconhecido: {rights_id}")
        if any(item.get("id") == entity_id for item in manifest["entities"]["references"]):
            raise AuthoringError(f"A referência {entity_id!r} já existe no pack.")
        target = staged / "assets" / f"{asset_id}{suffix}"
        shutil.copyfile(source, target)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        manifest["assets"]["files"].append({
            "id": asset_id, "path": f"assets/{target.name}", "kind": "reference",
            "rights_id": rights_id, "sha256": digest,
        })
        manifest["entities"]["references"].append({
            "id": entity_id, "asset_id": asset_id, "source": source_label,
            "rights_id": rights_id, "redistributable": False, "tags": tags,
        })

    return mutate_extension_pack(pack_path, mutation, dry_run=dry_run)


def install_pack(project_root: str | Path, pack_path: str | Path, *, dry_run: bool = False) -> dict[str, Any]:
    project = _regular_dir(project_root, "project_root")
    loaded = load_extension_pack(pack_path)
    packs_root = (project / "creative-factory" / "packs").resolve()
    try:
        loaded.root.relative_to(packs_root)
        relative = loaded.root.relative_to(project)
    except ValueError as exc:
        raise AuthoringError(
            "O pack instalado precisa estar confinado a creative-factory/packs do projeto."
        ) from exc
    catalog = resolve_catalog([loaded.root])
    config_dir = project / "creative-factory"
    config_path = config_dir / "installed-packs.json"
    payload = {"schema_version": "1.0.0", "packs": []}
    if config_path.is_file():
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    entry = {
        "id": loaded["id"], "version": loaded["version"],
        "path": relative.as_posix(), "catalog_hash": catalog.catalog_hash,
    }
    payload["packs"] = [item for item in payload.get("packs", []) if item.get("id") != loaded["id"]]
    payload["packs"].append(entry)
    payload["packs"].sort(key=lambda item: item["id"])
    if not dry_run:
        config_dir.mkdir(parents=True, exist_ok=True)
        temporary = config_path.with_suffix(".json.tmp")
        _json_write(temporary, payload)
        os.replace(temporary, config_path)
    return {"status": "planned" if dry_run else "installed", **entry, "dry_run": dry_run}


__all__ = [
    "AuthoringError", "add_entity", "add_reference", "build_extension_pack",
    "install_pack", "mutate_extension_pack",
]
