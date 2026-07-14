#!/usr/bin/env python3
"""Fail-closed dependency and pack diagnostic for the Creative Factory.

The command is intentionally read-only. It never installs packages and never
uses an API key. A non-zero exit means the operator has an actionable repair to
make before starting a creative run.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PACK_LOADER = ROOT / "scripts" / "pack_loader.py"
if str(PACK_LOADER.parent) not in sys.path:
    sys.path.insert(0, str(PACK_LOADER.parent))


def _command_version(command: str, args: list[str] | None = None) -> tuple[bool, str]:
    executable = shutil.which(command)
    if not executable:
        return False, f"{command} não encontrado no PATH"
    try:
        result = subprocess.run(
            [executable, *(args or ["--version"])],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return False, f"não foi possível executar {command}: {exc}"
    output = (result.stdout or result.stderr).strip().splitlines()
    detail = output[0][:240] if output else f"exit {result.returncode}"
    return result.returncode == 0, detail


def _module_check(module: str, package: str, instruction: str) -> dict[str, Any]:
    available = importlib.util.find_spec(module) is not None
    return {
        "id": package.lower(),
        "label": package,
        "required": True,
        "status": "ready" if available else "blocked",
        "detail": f"{package} disponível" if available else f"{package} não está instalado",
        "action": None if available else instruction,
    }


def _check_pack(path: str | None, expected_type: str | None) -> dict[str, Any] | None:
    if not path:
        return None
    try:
        from pack_loader import load_pack  # type: ignore[import-not-found]

        loaded = load_pack(path, expected_type=expected_type)
        return {
            "id": "pack",
            "label": f"Pack {loaded['id']}",
            "required": True,
            "status": "ready",
            "detail": f"Contrato {loaded['pack_type']} v{loaded['schema_version']} válido; {len(loaded.asset_paths)} asset(s) confinados.",
            "action": None,
        }
    except Exception as exc:  # loader errors are deliberately actionable
        return {
            "id": "pack",
            "label": "Pack selecionado",
            "required": True,
            "status": "blocked",
            "detail": str(exc),
            "action": "Corrija schema_version, pack_type, direitos e paths relativos ao root do pack; rode o doctor novamente.",
        }


def _check_extension_catalog(paths: list[str]) -> dict[str, Any] | None:
    if not paths:
        return None
    try:
        from catalog_loader import resolve_catalog  # type: ignore[import-not-found]

        catalog = resolve_catalog(paths)
        return {
            "id": "extension-catalog",
            "label": "Catálogo de extensões",
            "required": True,
            "status": "ready",
            "detail": (
                f"{len(catalog.packs)} pack(s) explícito(s) resolvido(s); "
                f"catalog_hash={catalog.catalog_hash}."
            ),
            "action": None,
        }
    except Exception as exc:
        detail = str(exc)
        for value in [*paths, str(Path.cwd()), str(Path.home())]:
            try:
                detail = detail.replace(str(Path(value).expanduser().resolve()), "<path>")
            except (OSError, RuntimeError):
                pass
        return {
            "id": "extension-catalog",
            "label": "Catálogo de extensões",
            "required": True,
            "status": "blocked",
            "detail": detail,
            "action": "Corrija o Extension Pack ou suas compatibilidades e rode o doctor novamente.",
        }


def diagnose(pack: str | None = None, pack_type: str | None = None,
             pack_only: bool = False,
             extension_packs: list[str] | None = None) -> dict[str, Any]:
    extension_packs = extension_packs or []
    checks: list[dict[str, Any]] = [
        {
            "id": "python",
            "label": "Python",
            "required": True,
            "status": "ready",
            "detail": sys.version.split()[0],
            "action": None,
        },
    ]

    if not pack_only:
        checks.extend([
            _module_check("PIL", "Pillow", "Instale com: python3 -m pip install Pillow"),
            _module_check("yaml", "PyYAML", "Instale com: python3 -m pip install PyYAML"),
            _module_check("numpy", "NumPy", "Instale com: python3 -m pip install numpy"),
        ])

        magick_ok, magick_detail = _command_version("magick")
        if not magick_ok:
            magick_ok, magick_detail = _command_version("convert")
        checks.append({
            "id": "imagemagick",
            "label": "ImageMagick",
            "required": True,
            "status": "ready" if magick_ok else "blocked",
            "detail": magick_detail,
            "action": None if magick_ok else "Instale ImageMagick e confirme que magick (ou convert) está no PATH.",
        })

        codex_ok, codex_detail = _command_version("codex")
        checks.append({
            "id": "codex",
            "label": "Codex CLI local",
            "required": True,
            "status": "ready" if codex_ok else "blocked",
            "detail": codex_detail if codex_ok else "Não encontrado; a geração textual/visual não pode iniciar.",
            "action": None if codex_ok else "Instale o Codex CLI, rode codex login e repita o doctor. Nenhuma OPENAI_API_KEY é necessária.",
        })

    pack_check = _check_pack(pack, pack_type)
    extension_check = _check_extension_catalog(extension_packs)
    if pack_only and not pack_check and not extension_check:
        pack_check = {
            "id": "pack",
            "label": "Pack selecionado",
            "required": True,
            "status": "blocked",
            "detail": "Nenhum pack explícito foi informado.",
            "action": "Informe --pack /caminho/para/pack.json e rode o doctor novamente.",
        }
    if pack_check:
        checks.append(pack_check)
    if extension_check:
        checks.append(extension_check)

    required_blockers = [check for check in checks if check["required"] and check["status"] != "ready"]
    return {
        "schema_version": "1.0.0",
        "status": "blocked" if required_blockers else "ready",
        "checks": checks,
        "required_blockers": len(required_blockers),
        "api_key_required": False,
        "api_key_environment_present": bool(os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY")),
        "instructions": (
            "Pack validado; execute o doctor sem --pack-only antes de gerar."
            if pack_only and not required_blockers
            else "Corrija os checks blocked. O runner usa a sessão autenticada do Codex CLI local; não configure chave da OpenAI."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Diagnostica dependências e packs da Creative Factory")
    parser.add_argument("--json", action="store_true", help="emite somente JSON")
    parser.add_argument("--pack", help="diretório ou pack.json explícito para validar")
    parser.add_argument("--type", choices=("brand", "persona", "creative-extension"), help="tipo esperado do pack")
    parser.add_argument(
        "--extension-pack", action="append", default=[],
        help="Extension Pack explícito para resolver no catálogo; repetível",
    )
    parser.add_argument("--pack-only", action="store_true", help="valida somente o contrato do pack")
    args = parser.parse_args(argv)
    result = diagnose(
        args.pack, args.type, pack_only=args.pack_only,
        extension_packs=args.extension_pack,
    )
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Creative Factory doctor: {result['status'].upper()}")
        for check in result["checks"]:
            print(f"- {check['label']}: {check['status']} — {check['detail']}")
            if check.get("action"):
                print(f"  ação: {check['action']}")
        print(result["instructions"])
    return 1 if result["status"] == "blocked" else 0


if __name__ == "__main__":
    raise SystemExit(main())
