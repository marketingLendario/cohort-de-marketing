#!/usr/bin/env python3
"""Build a versioned Brand Pack v1 from a Google-spec DESIGN.md.

This is the canonical CLI-first bridge used by both terminal operators and the
Ads Studio BFF. It never invents a client identity or redistributable rights.
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import yaml

from pack_loader import PackLoadError, load_brand_pack


HEX_COLOR = re.compile(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b")
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9._-]{1,63}$")
ASSET_KINDS = {"logo", "font", "reference", "texture", "other"}


class BrandPackBuildError(ValueError):
    """Actionable input or materialization failure."""


@dataclass(frozen=True)
class DesignSource:
    path: Path
    tokens: dict[str, Any]
    body: str


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-._")[:64]
    if len(normalized) < 2 or not SAFE_ID.fullmatch(normalized):
        raise BrandPackBuildError("Não foi possível derivar um id seguro; informe --id com 2–64 caracteres.")
    return normalized


def _read_design(path: str | Path) -> DesignSource:
    source = Path(path).expanduser()
    if source.is_symlink() or not source.is_file():
        raise BrandPackBuildError("DESIGN.md deve ser um arquivo regular, não um symlink.")
    try:
        content = source.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise BrandPackBuildError(f"Não foi possível ler DESIGN.md em UTF-8: {exc}") from exc
    trimmed = content.lstrip()
    if not trimmed.startswith("---\n"):
        raise BrandPackBuildError("DESIGN.md precisa de frontmatter YAML iniciado por ---. Rode /design-md e tente novamente.")
    end = trimmed.find("\n---", 4)
    if end < 0:
        raise BrandPackBuildError("Frontmatter YAML de DESIGN.md não possui delimitador final ---.")
    try:
        tokens = yaml.safe_load(trimmed[4:end])
    except yaml.YAMLError as exc:
        raise BrandPackBuildError(f"Frontmatter YAML inválido: {exc}") from exc
    if not isinstance(tokens, dict):
        raise BrandPackBuildError("Frontmatter de DESIGN.md deve ser um objeto YAML.")
    return DesignSource(path=source.resolve(), tokens=tokens, body=trimmed[end + 4 :].strip())


def _flatten(value: Any, prefix: str = "") -> Iterable[tuple[str, Any]]:
    if isinstance(value, dict):
        for key, child in value.items():
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            yield from _flatten(child, child_prefix)
    else:
        yield prefix.lower().replace("_", "-"), value


def _hex(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    match = HEX_COLOR.search(value)
    if not match:
        return None
    color = match.group(0).lower()
    if len(color) == 4:
        color = "#" + "".join(character * 2 for character in color[1:])
    return color.upper()


def _luminance(color: str) -> float:
    channels = [int(color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4 for channel in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _pick_semantic(entries: list[tuple[str, str]], names: tuple[str, ...]) -> str | None:
    for name in names:
        for key, value in entries:
            leaf = key.split(".")[-1]
            if leaf == name or leaf.endswith(f"-{name}"):
                return value
    return None


def _palette(tokens: dict[str, Any]) -> dict[str, str]:
    raw_colors = tokens.get("colors")
    if not isinstance(raw_colors, dict):
        raise BrandPackBuildError("DESIGN.md precisa de frontmatter colors com ao menos duas cores hex.")
    entries = [(key, color) for key, value in _flatten(raw_colors) if (color := _hex(value))]
    unique = list(dict.fromkeys(color for _, color in entries))
    if len(unique) < 2:
        raise BrandPackBuildError("DESIGN.md precisa de ao menos duas cores hex distintas para fundo e texto.")
    darkest = min(unique, key=_luminance)
    lightest = max(unique, key=_luminance)
    primary = _pick_semantic(entries, ("primary", "brand", "accent")) or unique[0]
    accent = _pick_semantic(entries, ("accent", "highlight", "primary")) or primary
    secondary = _pick_semantic(entries, ("secondary", "muted", "primary-hover")) or next(
        (color for color in unique if color != primary), primary
    )
    background = _pick_semantic(entries, ("background", "canvas", "surface", "bg"))
    foreground = _pick_semantic(entries, ("foreground", "text", "ink", "on-background", "on-surface"))
    if not background:
        background = darkest if _luminance(primary) > 0.45 else lightest
    if not foreground or foreground == background:
        foreground = lightest if _luminance(background) < 0.45 else darkest
    if foreground == background:
        raise BrandPackBuildError("Não foi possível separar fundo e texto; nomeie colors.background e colors.text no DESIGN.md.")
    return {
        "primary": primary,
        "secondary": secondary,
        "background": background,
        "foreground": foreground,
        "accent": accent,
    }


def _font_value(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, dict):
        for key in ("fontFamily", "font-family", "family", "font"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
    return None


def _typography(tokens: dict[str, Any]) -> dict[str, str]:
    raw = tokens.get("typography")
    if not isinstance(raw, dict):
        raise BrandPackBuildError("DESIGN.md precisa de frontmatter typography com heading/display e body.")
    entries = [(key, font) for key, value in _flatten(raw) if (font := _font_value(value))]
    # Nested typography objects are leaves only after flattening their scalar values.
    for key, value in raw.items():
        if font := _font_value(value):
            entries.insert(0, (str(key).lower().replace("_", "-"), font))
    deduped = list(dict.fromkeys(font for _, font in entries))
    if not deduped:
        raise BrandPackBuildError("Nenhuma família tipográfica legível foi encontrada em typography.")
    heading = _pick_semantic(entries, ("heading", "display", "title", "h1")) or deduped[0]
    body = _pick_semantic(entries, ("body", "text", "paragraph", "p")) or (deduped[1] if len(deduped) > 1 else heading)
    return {"heading": heading, "body": body}


def _description(design: DesignSource) -> str:
    candidate = design.tokens.get("description")
    if isinstance(candidate, str) and candidate.strip():
        return candidate.strip()
    for paragraph in re.split(r"\n\s*\n", design.body):
        cleaned = re.sub(r"^#+\s*", "", paragraph.strip())
        if cleaned and not cleaned.startswith(("-", "|")):
            return cleaned[:800]
    raise BrandPackBuildError("DESIGN.md precisa de description no frontmatter ou um parágrafo de visão da marca.")


def _parse_asset(raw: str) -> tuple[str, Path]:
    kind, separator, value = raw.partition(":")
    if not separator or kind not in ASSET_KINDS or not value:
        raise BrandPackBuildError("Ativo inválido. Use --asset kind:/caminho, com kind logo|font|reference|texture|other.")
    path = Path(value).expanduser()
    if path.is_symlink() or not path.is_file():
        raise BrandPackBuildError(f"Ativo {path} deve ser um arquivo regular, não um symlink.")
    return kind, path.resolve()


def _safe_asset_name(path: Path, ordinal: int) -> str:
    stem = re.sub(r"[^a-z0-9._-]+", "-", path.stem.lower()).strip("-._") or f"asset-{ordinal}"
    suffix = re.sub(r"[^a-z0-9.]", "", path.suffix.lower())[:10]
    return f"{ordinal:02d}-{stem[:48]}{suffix}"


def _preview(pack: dict[str, Any]) -> str:
    palette = pack["palette"]
    typography = pack["typography"]
    swatches = "".join(
        f'<li><span style="background:{html.escape(color)}"></span><strong>{html.escape(role)}</strong><code>{html.escape(color)}</code></li>'
        for role, color in palette.items()
    )
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(pack['identity']['display_name'])} - Brand Pack</title>
<style>body{{margin:0;font:16px system-ui;background:{palette['background']};color:{palette['foreground']}}}main{{max-width:920px;margin:auto;padding:48px 24px}}h1{{font-family:{html.escape(typography['heading'])};font-size:clamp(36px,7vw,72px);letter-spacing:0}}p{{max-width:68ch}}ul{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;padding:0;list-style:none}}li{{border:1px solid {palette['secondary']};padding:10px}}li span{{display:block;height:92px;margin-bottom:10px;border:1px solid currentColor}}strong,code{{display:block}}small{{color:{palette['secondary']}}}</style></head>
<body><main><small>Brand Pack v1 validado</small><h1>{html.escape(pack['identity']['display_name'])}</h1><p>{html.escape(pack['identity']['description'])}</p><ul>{swatches}</ul><h2 style="font-family:{html.escape(typography['heading'])}">Tipografia de títulos</h2><p style="font-family:{html.escape(typography['body'])}">Tipografia de corpo. Revise a identidade antes de gerar os criativos.</p></main></body></html>
"""


def build_brand_pack(
    design_path: str | Path,
    output_path: str | Path,
    rights_notice: str,
    *,
    pack_id: str | None = None,
    display_name: str | None = None,
    assets: Iterable[str] = (),
    force: bool = False,
    dry_run: bool = False,
) -> dict[str, Any]:
    if not rights_notice.strip():
        raise BrandPackBuildError("A declaração de direitos é obrigatória; informe --rights-notice.")
    design = _read_design(design_path)
    name = display_name.strip() if display_name and display_name.strip() else str(design.tokens.get("name", "")).strip()
    if not name:
        raise BrandPackBuildError("DESIGN.md precisa de name no frontmatter ou --name explícito.")
    identifier = _slug(pack_id or name)
    parsed_assets = [_parse_asset(raw) for raw in assets]
    output = Path(output_path).expanduser().resolve()
    description = _description(design)
    palette = _palette(design.tokens)
    typography = _typography(design.tokens)
    summary = {
        "schemaVersion": "1.0.0",
        "status": "planned" if dry_run else "valid",
        "id": identifier,
        "displayName": name,
        "description": description,
        "palette": palette,
        "typography": typography,
        "assetCount": len(parsed_assets) + 1,
        "redistributable": False,
        "rightsNotice": rights_notice.strip(),
        "output": str(output),
        "dryRun": dry_run,
    }
    if dry_run:
        return summary
    if output.exists() and any(output.iterdir()) and not force:
        raise BrandPackBuildError(f"Destino {output} não está vazio. Use --force somente após revisar o pack existente.")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{identifier}-", dir=output.parent))
    try:
        asset_dir = temporary / "assets"
        asset_dir.mkdir()
        source_name = "DESIGN.md"
        shutil.copyfile(design.path, asset_dir / source_name)
        asset_entries = [{"id": "design-source", "path": f"assets/{source_name}", "kind": "other", "rights_id": "project-use"}]
        for ordinal, (kind, source) in enumerate(parsed_assets, start=1):
            filename = _safe_asset_name(source, ordinal)
            shutil.copyfile(source, asset_dir / filename)
            asset_entries.append({
                "id": f"{kind}-{ordinal}",
                "path": f"assets/{filename}",
                "kind": kind,
                "rights_id": "project-use",
            })
        pack = {
            "schema_version": "1.0.0",
            "pack_type": "brand",
            "id": identifier,
            "identity": {"display_name": name, "description": description},
            "palette": palette,
            "typography": typography,
            "formats": {
                "feed": {"width": 1080, "height": 1350, "aspect": "4:5"},
                "story": {"width": 1080, "height": 1920, "aspect": "9:16"},
                "square": {"width": 1080, "height": 1080, "aspect": "1:1"},
            },
            "voice": {
                "tone": description,
                "principles": [
                    "Preservar a hierarquia, a paleta e a tipografia declaradas no DESIGN.md.",
                    "Manter legibilidade e contraste em todos os formatos.",
                ],
                "avoid": [
                    "Não inventar logos, pessoas, provas ou cores fora da fonte aprovada.",
                    "Não publicar sem revisão humana do criativo final.",
                ],
            },
            "assets": {"files": asset_entries},
            "rights": {
                "redistributable": False,
                "notice": rights_notice.strip(),
                "licenses": [{
                    "id": "project-use",
                    "name": "Project asset authorization",
                    "spdx": "LicenseRef-Project-Use",
                    "redistributable": False,
                    "notice": rights_notice.strip(),
                }],
            },
        }
        (temporary / "pack.json").write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (temporary / "preview.html").write_text(_preview(pack), encoding="utf-8")
        loaded = load_brand_pack(temporary)
        summary.update({
            "id": loaded["id"],
            "displayName": loaded["identity"]["display_name"],
            "description": loaded["identity"]["description"],
            "palette": loaded.to_dict()["palette"],
            "typography": loaded.to_dict()["typography"],
            "assetCount": len(loaded["assets"]["files"]),
            "redistributable": loaded["rights"]["redistributable"],
            "rightsNotice": loaded["rights"]["notice"],
        })
        (temporary / "build-report.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if output.exists():
            shutil.rmtree(output)
        os.replace(temporary, output)
        return summary
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Converte DESIGN.md em Brand Pack v1 validado.")
    parser.add_argument("--design", required=True, help="Caminho do DESIGN.md aprovado.")
    parser.add_argument("--output", required=True, help="Diretório de saída do brand pack.")
    parser.add_argument("--rights-notice", required=True, help="Declaração explícita de direito de uso dos ativos.")
    parser.add_argument("--id", dest="pack_id", help="Id estável do pack; por padrão deriva de name.")
    parser.add_argument("--name", dest="display_name", help="Nome de exibição; por padrão usa frontmatter name.")
    parser.add_argument("--asset", action="append", default=[], help="Ativo opcional kind:/caminho (repetível).")
    parser.add_argument("--force", action="store_true", help="Substitui um pack existente após validação da nova versão.")
    parser.add_argument("--dry-run", action="store_true", help="Valida entradas sem criar ou alterar o pack.")
    parser.add_argument("--json", action="store_true", help="Emite somente o resumo JSON em stdout.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        summary = build_brand_pack(
            args.design,
            args.output,
            args.rights_notice,
            pack_id=args.pack_id,
            display_name=args.display_name,
            assets=args.asset,
            force=args.force,
            dry_run=args.dry_run,
        )
    except (BrandPackBuildError, PackLoadError, OSError, ValueError) as exc:
        if args.json:
            print(json.dumps({"status": "invalid", "message": str(exc)}, ensure_ascii=False))
        else:
            print(f"Brand Pack recusado: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(summary, ensure_ascii=False))
    else:
        print(f"Brand Pack {summary['id']} validado em {summary['output']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
