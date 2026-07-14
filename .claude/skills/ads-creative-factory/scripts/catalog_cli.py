#!/usr/bin/env python3
"""CLI-first catalog and governed authoring surface for Creative Factory."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from build_brand_pack import BrandPackBuildError, build_brand_pack
from build_persona_pack import PersonaPackBuildError, build_persona_pack
from catalog_authoring import (
    AuthoringError,
    add_entity,
    add_reference,
    build_extension_pack,
    install_pack,
)
from catalog_loader import FACTORY_VERSION, CatalogError, ENTITY_GROUPS, resolve_catalog
from pack_loader import PackLoadError, load_pack


AXES = (
    "material", "lighting", "composition", "density", "finish", "backdrop",
    "layout", "mockup_device", "didactic_style",
)
RENDERER_MODES = ("hybrid", "person", "mockup", "ugc", "didactic")
THEMES = ("dark", "light", "native")
THRESHOLDS = {
    "accent_min_coverage_pct", "accent_max_coverage_pct", "dark_first_min_pct",
    "neon_max_pct", "richness_min_edge_var", "min_contrast", "ai_slop_fail_threshold",
}


def _sanitize(message: str, explicit_paths: list[str] | None = None) -> str:
    sanitized = str(message)
    candidates = {str(Path.cwd().resolve()), str(Path.home().resolve())}
    for value in explicit_paths or []:
        try:
            supplied = Path(value).expanduser().absolute()
            path = supplied.resolve()
        except (OSError, RuntimeError):
            continue
        candidates.update({str(supplied), str(supplied.parent), str(path), str(path.parent)})
    for raw in sorted(candidates, key=len, reverse=True):
        if raw:
            sanitized = sanitized.replace(raw, "<path>")
    return sanitized


def _emit(payload: dict[str, Any], *, as_json: bool) -> None:
    if as_json:
        print(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2))
        return
    print(f"Creative Factory: {payload.get('status', 'ok')}")
    if payload.get("message"):
        print(payload["message"])
    for item in payload.get("items", []):
        print(
            f"- {item['entity_type']}/{item['id']} "
            f"[{item.get('pack_id', item.get('origin', '-'))}@{item.get('pack_version', '-')}]"
        )
    item = payload.get("item")
    if item:
        print(json.dumps(item, ensure_ascii=False, sort_keys=True, indent=2))
    if payload.get("output"):
        print(f"output: {payload['output']}")
    if payload.get("catalog_hash"):
        print(f"catalog_hash: {payload['catalog_hash']}")


def _confined_output(project_root: str, pack_id: str, output: str | None) -> Path:
    project = Path(project_root).expanduser().resolve()
    if project.is_symlink() or not project.is_dir():
        raise AuthoringError("project_root precisa ser um diretório regular existente.")
    root = (project / "creative-factory" / "packs").resolve()
    target = Path(output).expanduser().resolve() if output else root / pack_id
    try:
        target.relative_to(root)
    except ValueError as exc:
        raise AuthoringError("O destino precisa ficar em creative-factory/packs dentro do projeto.") from exc
    if target.is_symlink():
        raise AuthoringError("O destino do pack não pode ser symlink.")
    return target


def _thresholds(values: list[str]) -> dict[str, float]:
    result: dict[str, float] = {}
    for raw in values:
        key, separator, value = raw.partition("=")
        if not separator or key not in THRESHOLDS:
            raise AuthoringError(
                "Threshold inválido. Use uma métrica allowlisted no formato nome=valor."
            )
        try:
            result[key] = float(value)
        except ValueError as exc:
            raise AuthoringError(f"Threshold {key} precisa ser numérico.") from exc
    return result


def _catalog(paths: list[str]) -> Any:
    return resolve_catalog(paths)


def _with_availability(item: dict[str, Any]) -> dict[str, Any]:
    requires_authorization = bool(item.get("needs_persona") or item.get("needs_likeness"))
    return {
        **item,
        "availability": "requires_authorization" if requires_authorization else "available",
        **({"blocked_reason": "Exige Persona Pack e autorização verificável."}
           if requires_authorization else {}),
    }


def _cmd_list(args: argparse.Namespace) -> dict[str, Any]:
    catalog = _catalog(args.pack)
    items = [_with_availability(item) for item in catalog.list_entities(args.entity_type)]
    if args.origin:
        items = [item for item in items if item.get("origin") == args.origin or item.get("pack_id") == args.origin]
    if args.availability:
        items = [item for item in items if item["availability"] == args.availability]
    return {
        "schema_version": "1.0.0", "status": "ready",
        "factory_version": FACTORY_VERSION,
        "catalog_hash": catalog.catalog_hash, "count": len(items), "items": items,
    }


def _cmd_show(args: argparse.Namespace) -> dict[str, Any]:
    catalog = _catalog(args.pack)
    item = dict(catalog.get_entity(args.entity_type, args.entity_id))
    item["entity_type"] = args.entity_type
    return {
        "schema_version": "1.0.0", "status": "ready",
        "factory_version": FACTORY_VERSION,
        "catalog_hash": catalog.catalog_hash, "item": item,
    }


def _cmd_validate(args: argparse.Namespace) -> dict[str, Any]:
    loaded = load_pack(args.target)
    payload: dict[str, Any] = {
        "schema_version": "1.0.0", "status": "valid", "pack": {
            "id": loaded["id"], "pack_type": loaded["pack_type"],
            "schema_version": loaded["schema_version"],
            "asset_count": len(loaded.asset_paths),
            "redistributable": loaded["rights"]["redistributable"],
        },
    }
    if loaded["pack_type"] == "creative-extension":
        catalog = resolve_catalog([args.target, *args.with_pack])
        payload["catalog_hash"] = catalog.catalog_hash
        payload["entity_counts"] = {
            group: len(loaded["entities"][group]) for group in ENTITY_GROUPS
        }
    return payload


def _cmd_pack_build(args: argparse.Namespace) -> dict[str, Any]:
    return build_extension_pack(
        args.project_root, pack_id=args.pack_id, namespace=args.namespace,
        version=args.version, rights_notice=args.rights_notice,
        force=args.force, dry_run=args.dry_run,
    )


def _cmd_pack_install(args: argparse.Namespace) -> dict[str, Any]:
    return install_pack(args.project_root, args.pack, dry_run=args.dry_run)


def _cmd_brand_create(args: argparse.Namespace) -> dict[str, Any]:
    output = _confined_output(args.project_root, args.pack_id, args.output)
    return build_brand_pack(
        args.design, output, args.rights_notice, pack_id=args.pack_id,
        display_name=args.display_name, assets=args.asset, force=args.force,
        dry_run=args.dry_run,
    )


def _cmd_persona_create(args: argparse.Namespace) -> dict[str, Any]:
    output = _confined_output(args.project_root, args.pack_id, args.output)
    return build_persona_pack(
        output, pack_id=args.pack_id, display_name=args.display_name,
        role=args.role, description=args.description, tone=args.tone,
        topics=args.topic, avoid=args.avoid, photos=args.photo,
        rights_notice=args.rights_notice, consent_reference=args.consent_reference,
        force=args.force, dry_run=args.dry_run,
    )


def _entity_base(args: argparse.Namespace) -> dict[str, Any]:
    return {"id": args.entity_id, "label": args.label}


def _cmd_mechanism_add(args: argparse.Namespace) -> dict[str, Any]:
    entity = {
        **_entity_base(args), "kind": args.kind, "psych": args.psych,
        "required_fields": args.required_field, "prohibited_claims": args.prohibited_claim,
        "compatible_archetypes": args.archetype, "formats": args.format,
        "needs_likeness": args.needs_likeness,
    }
    for target, source in (
        ("core", "core"), ("belief_shift", "belief_shift"),
        ("hook_structure", "hook_structure"), ("proof_type", "proof_type"),
        ("objection", "objection"),
    ):
        if value := getattr(args, source):
            entity[target] = value
    return add_entity(args.pack, "mechanisms", entity, dry_run=args.dry_run)


def _cmd_ugc_scene_add(args: argparse.Namespace) -> dict[str, Any]:
    entity = {
        **_entity_base(args), "setting": args.setting, "shot": args.shot,
        "lighting": args.lighting, "props": args.prop,
        "authenticity_guards": args.authenticity_guard,
        "negative_guards": args.negative_guard, "formats": args.format,
        "needs_persona": args.needs_persona,
    }
    return add_entity(args.pack, "ugc_scenes", entity, dry_run=args.dry_run)


def _cmd_variation_add(args: argparse.Namespace) -> dict[str, Any]:
    entity = {
        "id": args.entity_id, "axis": args.axis, "fragment": args.fragment,
        "compatible_archetypes": args.archetype, "locks": args.lock,
    }
    return add_entity(args.pack, "variations", entity, dry_run=args.dry_run)


def _cmd_gate_profile_add(args: argparse.Namespace) -> dict[str, Any]:
    entity = {
        **_entity_base(args), "thresholds": _thresholds(args.threshold),
        "human_review_required": True, "likeness_gate_required": True,
    }
    return add_entity(args.pack, "gate_profiles", entity, dry_run=args.dry_run)


def _cmd_archetype_add(args: argparse.Namespace) -> dict[str, Any]:
    entity = {
        **_entity_base(args), "renderer_mode": args.renderer_mode, "theme": args.theme,
        "formats": args.format, "required_fields": args.required_field,
        "compatible_mechanisms": args.mechanism,
        "internal_variants": args.internal_variant,
        "gate_profile": args.gate_profile, "needs_persona": args.needs_persona,
    }
    for field, values in (
        ("compatible_ugc_scenes", args.ugc_scene),
        ("compatible_variations", args.variation),
        ("reference_ids", args.reference),
    ):
        if values:
            entity[field] = values
    return add_entity(args.pack, "archetypes", entity, dry_run=args.dry_run)


def _cmd_reference_add(args: argparse.Namespace) -> dict[str, Any]:
    return add_reference(
        args.pack, entity_id=args.entity_id, source_file=args.file,
        source_label=args.source, tags=args.tag, rights_id=args.rights_id,
        dry_run=args.dry_run,
    )


def _cmd_preview(args: argparse.Namespace) -> dict[str, Any]:
    catalog = resolve_catalog(args.pack)
    archetype = dict(catalog.get_entity("archetypes", args.entity_id))
    plan = {
        "archetype_id": archetype["id"], "renderer_mode": archetype["renderer_mode"],
        "theme": archetype["theme"], "formats": archetype["formats"],
        "required_fields": archetype["required_fields"],
        "compatible_mechanisms": archetype["compatible_mechanisms"],
        "compatible_ugc_scenes": archetype.get("compatible_ugc_scenes", []),
        "compatible_variations": archetype.get("compatible_variations", []),
        "reference_ids": archetype.get("reference_ids", []),
        "gate_profile": archetype["gate_profile"],
        "prompt": (
            f"Renderer {archetype['renderer_mode']} com tema {archetype['theme']}; "
            f"preservar campos {', '.join(archetype['required_fields'])}."
        ),
    }
    return {
        "schema_version": "1.0.0", "status": "preview-ready",
        "catalog_hash": catalog.catalog_hash, "item": plan,
    }


def _add_write_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dry-run", action="store_true", help="valida e planeja sem escrever")


def _add_pack_entity(parser: argparse.ArgumentParser, *, label: bool = True) -> None:
    parser.add_argument("--pack", required=True, help="Extension Pack explícito")
    parser.add_argument("--id", required=True, dest="entity_id", help="ID namespaced, ex.: acme.proof")
    if label:
        parser.add_argument("--label", required=True)
    _add_write_flags(parser)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="catalog_cli.py",
        description="Inspeciona e estende a Ads Creative Factory por contratos declarativos.",
        epilog=(
            "Exemplos: catalog list --type archetypes; pack build --project-root PROJETO "
            "--id acme-extension --namespace acme --version 1.0.0 --rights-notice AUTORIZADO."
        ),
    )
    parser.add_argument("--json", action="store_true", help="emite resposta JSON estável")
    top = parser.add_subparsers(dest="domain", required=True)

    catalog = top.add_parser("catalog", help="operações read-only do catálogo")
    actions = catalog.add_subparsers(dest="action", required=True)
    list_parser = actions.add_parser("list", help="lista entidades resolvidas")
    list_parser.add_argument("--pack", action="append", default=[])
    list_parser.add_argument("--type", dest="entity_type", choices=ENTITY_GROUPS)
    list_parser.add_argument("--origin")
    list_parser.add_argument("--availability", choices=("available", "requires_authorization"))
    show = actions.add_parser("show", help="exibe entidade e compatibilidades")
    show.add_argument("entity_type", choices=ENTITY_GROUPS)
    show.add_argument("entity_id")
    show.add_argument("--pack", action="append", default=[])
    validate = actions.add_parser("validate", help="valida pack sem escrever")
    validate.add_argument("target")
    validate.add_argument("--with-pack", action="append", default=[])

    pack = top.add_parser("pack", help="cria ou instala Extension Packs")
    pack_actions = pack.add_subparsers(dest="action", required=True)
    pack_build = pack_actions.add_parser("build")
    pack_build.add_argument("--project-root", required=True)
    pack_build.add_argument("--id", required=True, dest="pack_id")
    pack_build.add_argument("--namespace", required=True)
    pack_build.add_argument("--version", required=True)
    pack_build.add_argument("--rights-notice", required=True)
    pack_build.add_argument("--force", action="store_true")
    _add_write_flags(pack_build)
    pack_install = pack_actions.add_parser("install")
    pack_install.add_argument("--project-root", required=True)
    pack_install.add_argument("--pack", required=True)
    _add_write_flags(pack_install)

    brand = top.add_parser("brand", help="cria Brand Pack a partir de DESIGN.md")
    brand_create = brand.add_subparsers(dest="action", required=True).add_parser("create")
    brand_create.add_argument("--project-root", required=True)
    brand_create.add_argument("--design", required=True)
    brand_create.add_argument("--id", required=True, dest="pack_id")
    brand_create.add_argument("--name", dest="display_name")
    brand_create.add_argument("--rights-notice", required=True)
    brand_create.add_argument("--asset", action="append", default=[])
    brand_create.add_argument("--output")
    brand_create.add_argument("--force", action="store_true")
    _add_write_flags(brand_create)

    persona = top.add_parser("persona", help="cria Persona Pack consentido")
    persona_create = persona.add_subparsers(dest="action", required=True).add_parser("create")
    persona_create.add_argument("--project-root", required=True)
    persona_create.add_argument("--output")
    persona_create.add_argument("--id", required=True, dest="pack_id")
    persona_create.add_argument("--name", required=True, dest="display_name")
    persona_create.add_argument("--role", required=True)
    persona_create.add_argument("--description", required=True)
    persona_create.add_argument("--tone", required=True)
    persona_create.add_argument("--topic", action="append", required=True)
    persona_create.add_argument("--avoid", action="append", required=True)
    persona_create.add_argument("--photo", action="append", required=True)
    persona_create.add_argument("--rights-notice", required=True)
    persona_create.add_argument("--consent-reference", required=True)
    persona_create.add_argument("--force", action="store_true")
    _add_write_flags(persona_create)

    mechanism = top.add_parser("mechanism")
    mechanism_add = mechanism.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(mechanism_add)
    mechanism_add.add_argument("--kind", choices=("copy", "visual", "hybrid"), required=True)
    mechanism_add.add_argument("--psych", required=True)
    mechanism_add.add_argument("--core")
    mechanism_add.add_argument("--belief-shift")
    mechanism_add.add_argument("--hook-structure")
    mechanism_add.add_argument("--proof-type")
    mechanism_add.add_argument("--objection")
    mechanism_add.add_argument("--required-field", action="append", default=[])
    mechanism_add.add_argument("--prohibited-claim", action="append", default=[])
    mechanism_add.add_argument("--archetype", action="append", default=[])
    mechanism_add.add_argument("--format", action="append", required=True)
    mechanism_add.add_argument("--needs-likeness", action="store_true")

    ugc = top.add_parser("ugc-scene")
    ugc_add = ugc.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(ugc_add)
    ugc_add.add_argument("--setting", required=True)
    ugc_add.add_argument("--shot", required=True)
    ugc_add.add_argument("--lighting", required=True)
    ugc_add.add_argument("--prop", action="append", required=True)
    ugc_add.add_argument("--authenticity-guard", action="append", required=True)
    ugc_add.add_argument("--negative-guard", action="append", required=True)
    ugc_add.add_argument("--format", action="append", required=True)
    ugc_add.add_argument("--needs-persona", action="store_true")

    variation = top.add_parser("variation")
    variation_add = variation.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(variation_add, label=False)
    variation_add.add_argument("--axis", choices=AXES, required=True)
    variation_add.add_argument("--fragment", required=True)
    variation_add.add_argument("--archetype", action="append", default=[])
    variation_add.add_argument("--lock", action="append", default=[])

    reference = top.add_parser("reference")
    reference_add = reference.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(reference_add, label=False)
    reference_add.add_argument("--file", required=True)
    reference_add.add_argument("--source", required=True)
    reference_add.add_argument("--tag", action="append", required=True)
    reference_add.add_argument("--rights-id", default="project-use")

    gate = top.add_parser("gate-profile")
    gate_add = gate.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(gate_add)
    gate_add.add_argument("--threshold", action="append", required=True)

    archetype = top.add_parser("archetype")
    archetype_add = archetype.add_subparsers(dest="action", required=True).add_parser("add")
    _add_pack_entity(archetype_add)
    archetype_add.add_argument("--renderer-mode", choices=RENDERER_MODES, required=True)
    archetype_add.add_argument("--theme", choices=THEMES, required=True)
    archetype_add.add_argument("--format", action="append", required=True)
    archetype_add.add_argument("--required-field", action="append", required=True)
    archetype_add.add_argument("--mechanism", action="append", required=True)
    archetype_add.add_argument("--ugc-scene", action="append", default=[])
    archetype_add.add_argument("--variation", action="append", default=[])
    archetype_add.add_argument("--reference", action="append", default=[])
    archetype_add.add_argument("--internal-variant", action="append", required=True)
    archetype_add.add_argument("--gate-profile", required=True)
    archetype_add.add_argument("--needs-persona", action="store_true")

    preview = top.add_parser("preview", help="gera plano sanitizado sem imagem")
    preview.add_argument("entity_type", choices=("archetype",))
    preview.add_argument("entity_id")
    preview.add_argument("--pack", action="append", default=[])
    return parser


COMMANDS = {
    ("catalog", "list"): _cmd_list,
    ("catalog", "show"): _cmd_show,
    ("catalog", "validate"): _cmd_validate,
    ("pack", "build"): _cmd_pack_build,
    ("pack", "install"): _cmd_pack_install,
    ("brand", "create"): _cmd_brand_create,
    ("persona", "create"): _cmd_persona_create,
    ("mechanism", "add"): _cmd_mechanism_add,
    ("ugc-scene", "add"): _cmd_ugc_scene_add,
    ("variation", "add"): _cmd_variation_add,
    ("reference", "add"): _cmd_reference_add,
    ("gate-profile", "add"): _cmd_gate_profile_add,
    ("archetype", "add"): _cmd_archetype_add,
    ("preview", None): _cmd_preview,
}


def main(argv: list[str] | None = None) -> int:
    parser = _parser()
    args = parser.parse_args(argv)
    try:
        handler = COMMANDS.get((args.domain, getattr(args, "action", None)))
        if handler is None:
            parser.error("comando desconhecido")
            return 2
        payload = handler(args)
    except (
        PackLoadError, CatalogError, AuthoringError, BrandPackBuildError,
        PersonaPackBuildError, OSError, ValueError,
    ) as exc:
        explicit_paths: list[str] = []
        for name in ("target", "pack", "with_pack", "project_root", "output", "design", "file", "photo"):
            value = getattr(args, name, None)
            explicit_paths.extend(value if isinstance(value, list) else ([value] if value else []))
        payload = {
            "schema_version": "1.0.0", "status": "blocked",
            "message": _sanitize(str(exc), explicit_paths),
        }
        _emit(payload, as_json=args.json)
        return 1
    _emit(payload, as_json=args.json)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
