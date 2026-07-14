#!/usr/bin/env python3
"""Build a consent-bound Persona Pack v1 from explicit real photos."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any, Iterable

from pack_loader import PackLoadError, load_persona_pack


SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{1,63}$")
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


class PersonaPackBuildError(ValueError):
    """Actionable persona input or materialization failure."""


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-._")[:64]
    if len(normalized) < 2 or not SAFE_ID.fullmatch(normalized):
        raise PersonaPackBuildError("Informe um id seguro com 2–64 caracteres.")
    return normalized


def _photo(path: str | Path) -> Path:
    candidate = Path(path).expanduser()
    if candidate.is_symlink() or not candidate.is_file():
        raise PersonaPackBuildError(f"Foto inválida ou symlink: {candidate}")
    if candidate.suffix.lower() not in IMAGE_SUFFIXES:
        raise PersonaPackBuildError(f"Formato de foto não suportado: {candidate.suffix}")
    return candidate.resolve()


def _preview(pack: dict[str, Any]) -> str:
    identity = pack["identity"]
    rows = "".join(
        f"<li>{html.escape(asset['id'])} · {html.escape(asset['sha256'][:12])}</li>"
        for asset in pack["assets"]["files"]
    )
    return (
        "<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\">"
        f"<title>Persona Pack · {html.escape(identity['display_name'])}</title>"
        "<style>body{font:16px system-ui;max-width:760px;margin:48px auto;padding:0 24px}"
        "code{background:#eee;padding:2px 6px;border-radius:4px}</style>"
        f"<h1>{html.escape(identity['display_name'])}</h1>"
        f"<p><strong>Papel:</strong> {html.escape(identity['role'])}</p>"
        f"<p>{html.escape(identity['description'])}</p><h2>Fotos autorizadas</h2><ul>{rows}</ul>"
        f"<p>Consentimento: <code>{html.escape(pack['consent']['reference'])}</code></p></html>"
    )


def build_persona_pack(
    output_path: str | Path,
    *,
    pack_id: str,
    display_name: str,
    role: str,
    description: str,
    tone: str,
    topics: Iterable[str],
    avoid: Iterable[str],
    photos: Iterable[str | Path],
    rights_notice: str,
    consent_reference: str,
    force: bool = False,
    dry_run: bool = False,
) -> dict[str, Any]:
    values = {
        "display_name": display_name.strip(), "role": role.strip(),
        "description": description.strip(), "tone": tone.strip(),
        "rights_notice": rights_notice.strip(), "consent_reference": consent_reference.strip(),
    }
    missing = [key for key, value in values.items() if not value]
    if missing:
        raise PersonaPackBuildError(f"Campos obrigatórios ausentes: {', '.join(missing)}")
    if len(values["consent_reference"]) < 8:
        raise PersonaPackBuildError("A referência de consentimento precisa ter ao menos 8 caracteres.")
    identifier = _slug(pack_id)
    topic_values = [value.strip() for value in topics if value.strip()]
    avoid_values = [value.strip() for value in avoid if value.strip()]
    photo_values = [_photo(value) for value in photos]
    if not topic_values or not avoid_values or not photo_values:
        raise PersonaPackBuildError("Informe ao menos um tópico, um guard de voz e uma foto real.")
    if len(set(photo_values)) != len(photo_values):
        raise PersonaPackBuildError("A mesma foto foi informada mais de uma vez.")

    output = Path(output_path).expanduser().absolute()
    summary = {
        "schemaVersion": "1.0.0", "status": "planned" if dry_run else "valid",
        "id": identifier, "displayName": values["display_name"],
        "photoCount": len(photo_values), "redistributable": False,
        "output": str(output), "dryRun": dry_run,
    }
    if dry_run:
        return summary
    if output.exists() and any(output.iterdir()) and not force:
        raise PersonaPackBuildError(f"Destino {output} não está vazio. Use --force após revisar o pack existente.")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{identifier}-", dir=output.parent))
    try:
        asset_dir = temporary / "assets"
        asset_dir.mkdir()
        asset_entries = []
        for index, source in enumerate(photo_values, start=1):
            filename = f"photo-{index}{source.suffix.lower()}"
            target = asset_dir / filename
            shutil.copyfile(source, target)
            asset_entries.append({
                "id": f"photo-{index}", "path": f"assets/{filename}", "kind": "photo",
                "rights_id": "project-use", "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            })
        pack = {
            "schema_version": "1.0.0", "pack_type": "persona", "id": identifier,
            "identity": {
                "display_name": values["display_name"], "role": values["role"],
                "description": values["description"],
            },
            "voice": {"tone": values["tone"], "topics": topic_values, "avoid": avoid_values},
            "consent": {"granted": True, "reference": values["consent_reference"]},
            "assets": {"files": asset_entries},
            "rights": {
                "redistributable": False, "notice": values["rights_notice"],
                "licenses": [{
                    "id": "project-use", "name": "Project likeness authorization",
                    "spdx": "LicenseRef-Project-Likeness", "redistributable": False,
                    "notice": values["rights_notice"],
                }],
            },
        }
        (temporary / "pack.json").write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (temporary / "preview.html").write_text(_preview(pack), encoding="utf-8")
        loaded = load_persona_pack(temporary)
        summary["photoHashes"] = [asset["sha256"] for asset in loaded["assets"]["files"]]
        (temporary / "build-report.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if output.exists():
            shutil.rmtree(output)
        os.replace(temporary, output)
        return summary
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Cria Persona Pack v1 com consentimento explícito.")
    parser.add_argument("--output", required=True)
    parser.add_argument("--id", required=True, dest="pack_id")
    parser.add_argument("--name", required=True, dest="display_name")
    parser.add_argument("--role", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--tone", required=True)
    parser.add_argument("--topic", action="append", default=[], required=True)
    parser.add_argument("--avoid", action="append", default=[], required=True)
    parser.add_argument("--photo", action="append", default=[], required=True)
    parser.add_argument("--rights-notice", required=True)
    parser.add_argument("--consent-reference", required=True)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        result = build_persona_pack(
            args.output, pack_id=args.pack_id, display_name=args.display_name,
            role=args.role, description=args.description, tone=args.tone,
            topics=args.topic, avoid=args.avoid, photos=args.photo,
            rights_notice=args.rights_notice, consent_reference=args.consent_reference,
            force=args.force, dry_run=args.dry_run,
        )
    except (PersonaPackBuildError, PackLoadError, OSError, ValueError) as exc:
        if args.json:
            print(json.dumps({"status": "invalid", "message": str(exc)}, ensure_ascii=False))
        else:
            print(f"Persona Pack recusado: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(f"Persona Pack {result['id']}: {result['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
