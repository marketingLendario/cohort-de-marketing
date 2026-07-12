"""Shared, pack-driven primitives for the creative factory.

The runtime has one deliberately strict boundary: a campaign must provide
``ACF_BRAND_PACK``.  There is no bundled brand, person, reference library or
style fallback.  Versioned JSON packs are validated by :mod:`pack_loader`;
the small YAML adapter exists only to keep the explicitly selected private
pack operational while it migrates to the W1 contract.
"""
from __future__ import annotations

import json
import os
import subprocess
import time
import re
from pathlib import Path
from typing import Any

import numpy as np
import yaml
from PIL import Image

from pack_loader import PackLoadError, load_brand_pack, load_persona_pack

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CODEX_TIMEOUT = int(os.environ.get("ACF_CODEX_TIMEOUT", "600"))
CODEX_RETRY_BASE_SECONDS = 5
_WINDOWS_ABSOLUTE = re.compile(r"^[A-Za-z]:[\\/]")


def _codex_retries() -> int:
    try:
        return max(0, int(os.environ.get("ACF_CODEX_RETRIES", "2")))
    except (TypeError, ValueError):
        return 2


def _image_written(out_path: str) -> bool:
    path = Path(out_path)
    return path.exists() and path.stat().st_size > 0


def _resolve_repo_root() -> str:
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env and Path(env).is_dir():
        return str(Path(env).resolve())
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=str(ROOT), capture_output=True, text=True,
        )
        if result.returncode == 0 and Path(result.stdout.strip()).is_dir():
            return result.stdout.strip()
    except OSError:
        pass
    return str(ROOT)


REPO_ROOT = _resolve_repo_root()


def _resolve_out_dir(require_explicit: bool = False) -> Path:
    """Resolve campaign output without coupling it to a client pack."""
    override = os.environ.get("ACF_OUT_DIR")
    if not override and require_explicit:
        raise RuntimeError("ACF_OUT_DIR e obrigatorio para executar a Creative Factory")
    if override:
        return Path(override).expanduser().resolve()
    return Path(REPO_ROOT) / "outputs" / "design-ops" / "ads-creative-factory"


OUT_DIR = _resolve_out_dir()


def resolve_path(path_value: str | os.PathLike[str]) -> str:
    """Resolve only an existing absolute path or a generic runtime-local path."""
    raw = str(path_value)
    if os.path.isabs(raw) and os.path.exists(raw):
        return raw
    local = ROOT / raw
    if local.exists():
        return str(local)
    return str(Path(REPO_ROOT) / raw)


# --------------------------------------------------------------------------- #
# Pack boundary and explicit compatibility adapter
# --------------------------------------------------------------------------- #
def _brand_pack_override() -> Path:
    raw = os.environ.get("ACF_BRAND_PACK", "").strip()
    if not raw:
        raise RuntimeError(
            "ACF_BRAND_PACK e obrigatorio: selecione um brand pack versionado explicitamente"
        )
    path = Path(raw).expanduser()
    if not path.exists():
        raise RuntimeError("ACF_BRAND_PACK aponta para um pack inexistente")
    return path


def _read_yaml(path: Path) -> dict[str, Any]:
    try:
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, yaml.YAMLError) as exc:
        raise ValueError(f"pack YAML invalido: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("pack YAML invalido: a raiz precisa ser um mapa")
    return value


def _legacy_pack(path: Path) -> tuple[dict[str, Any], Path, dict[str, Path]]:
    """Read an explicitly selected legacy YAML pack for the private adapter."""
    if path.is_dir():
        brand_file = path / "brand.yaml"
        if not brand_file.is_file():
            raise PackLoadError("pack externo sem manifest versionado ou brand.yaml")
    else:
        brand_file = path
        path = path.parent
    data = _read_yaml(brand_file)
    raw_assets = data.get("assets") if isinstance(data.get("assets"), dict) else {}
    source_dir = Path(str(raw_assets.get("source_dir", "")))
    if not source_dir.is_absolute():
        source_dir = path / source_dir
    paths: dict[str, Path] = {}
    for key, value in raw_assets.items():
        if not key.endswith("_src") or not value:
            continue
        candidate = (source_dir / str(value)).resolve()
        if candidate.is_file():
            paths[key] = candidate
    personas_file = path / "personas.yaml"
    if personas_file.is_file():
        personas = _read_yaml(personas_file).get("personas", {})
        if isinstance(personas, dict):
            data["_personas"] = personas
    data["_legacy_root"] = str(path.resolve())
    return data, path.resolve(), paths


def _format_specs(raw: dict[str, Any]) -> dict[str, dict[str, Any]]:
    formats: dict[str, dict[str, Any]] = {}
    for name, spec in raw.items():
        if name == "safe_zone" or not isinstance(spec, dict):
            continue
        width = spec.get("width", spec.get("w"))
        height = spec.get("height", spec.get("h"))
        aspect = spec.get("aspect")
        if not width or not height or not aspect:
            raise ValueError(f"formato incompleto: {name}")
        formats[name] = {"w": int(width), "h": int(height), "width": int(width),
                         "height": int(height), "aspect": str(aspect)}
    if not formats:
        raise ValueError("brand pack precisa declarar ao menos um formato")
    safe_zone = raw.get("safe_zone")
    if isinstance(safe_zone, dict):
        formats["safe_zone"] = safe_zone
    return formats


def _color(value: Any, field: str) -> str:
    value = str(value or "").strip()
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError(f"cor invalida em palette.{field}")
    return value


def _normalize_brand(raw: dict[str, Any], root: Path,
                     asset_paths: dict[str, Path] | None = None) -> dict[str, Any]:
    """Project W1 data into the legacy runtime shape without adding identity."""
    identity = raw.get("identity") or {}
    palette = raw.get("palette") or {}
    if "display_name" in identity:
        name = identity["display_name"]
        colors = {
            "primary": _color(palette["primary"], "primary"),
            "secondary": _color(palette["secondary"], "secondary"),
            "background": _color(palette["background"], "background"),
            "foreground": _color(palette["foreground"], "foreground"),
            "accent": _color(palette["accent"], "accent"),
        }
        typography = raw["typography"]
        voice = raw["voice"]
        formats = _format_specs(raw["formats"])
        prompt_header = (
            "Performance advertising creative, {aspect} aspect ratio. "
            f"Identity: {identity['description']}. "
            f"Palette: background {colors['background']}, foreground {colors['foreground']}, "
            f"accent {colors['accent']}. Typography: heading {typography['heading']}, "
            f"body {typography['body']}. Voice: {voice['tone']}. "
            f"Principles: {', '.join(voice['principles'])}."
        )
        normalized: dict[str, Any] = {
            "id": raw["id"], "name": name, "identity": identity,
            "description": identity["description"], "palette": {
                **colors, "surface": colors["background"], "text": colors["foreground"],
                "gold": colors["accent"], "cream": colors["foreground"],
                "cream_ink": colors["primary"],
            },
            "typography": typography, "voice": voice, "formats": formats,
            "prompt_header": prompt_header,
            "logo_guard": "Do not render a logo, watermark or company name; keep a clean safe zone.",
            "negative": ", ".join(voice["avoid"]),
            "rules": {"gold_min_coverage_pct": 0.0, "gold_max_coverage_pct": 100.0,
                      "min_text_contrast": 4.5},
            "assets": {"files": raw["assets"]["files"], "source_dir": str(root)},
            "rights": raw["rights"],
        }
        if asset_paths is None:
            asset_paths = {}
        normalized["_asset_paths"] = asset_paths
        normalized["_pack_root"] = root
        normalized["_font_paths"] = {
            asset["id"]: asset_paths[asset["id"]]
            for asset in raw["assets"]["files"]
            if asset["kind"] == "font" and asset["id"] in asset_paths
        }
        logo_assets = [asset for asset in raw["assets"]["files"] if asset["kind"] == "logo"]
        if logo_assets:
            normalized["assets"]["logo_icon_src"] = logo_assets[0]["id"]
            normalized["assets"]["logo_full_src"] = logo_assets[0]["id"]
        refs = [asset for asset in raw["assets"]["files"] if asset["kind"] == "reference"]
        normalized["_reference_paths"] = [asset_paths[a["id"]] for a in refs if a["id"] in asset_paths]
    else:
        required = ("name", "formats", "palette", "prompt_header", "logo_guard", "negative")
        missing = [key for key in required if key not in raw]
        if missing:
            raise ValueError(f"brand pack incompleto: faltam {', '.join(missing)}")
        formats = _format_specs(raw["formats"])
        source_palette = raw["palette"]
        background = source_palette.get("background", source_palette.get("surface"))
        foreground = source_palette.get("foreground", source_palette.get("text"))
        accent = source_palette.get("accent", source_palette.get("gold"))
        normalized = dict(raw)
        normalized["id"] = raw.get("id", raw["name"])
        normalized["formats"] = formats
        normalized["palette"] = dict(source_palette)
        normalized["palette"].update({"background": background, "foreground": foreground,
                                       "accent": accent, "surface": background,
                                       "text": foreground, "gold": accent})
        normalized["_pack_root"] = root
        normalized["_asset_paths"] = asset_paths or {}
        normalized["_font_paths"] = {}
        normalized["_reference_paths"] = []
    normalized["_persona_packs"] = normalized.pop("_personas", {})
    return normalized


def load_brand(brand_id: str | None = None) -> dict[str, Any]:
    """Load the explicitly selected brand pack; ``brand_id`` is not a default."""
    selected = _brand_pack_override()
    try:
        if selected.is_dir() or selected.suffix.lower() == ".json":
            loaded = load_brand_pack(selected)
            return _normalize_brand(loaded.to_dict(), loaded.root,
                                    {key: value for key, value in loaded.asset_paths.items()})
        raw, root, paths = _legacy_pack(selected)
        return _normalize_brand(raw, root, paths)
    except (OSError, PackLoadError, KeyError, TypeError, ValueError) as exc:
        if isinstance(exc, PackLoadError):
            raise
        raise ValueError(f"brand pack invalido: {exc}") from exc


def load_persona(persona_id: str | os.PathLike[str], brand: dict[str, Any]) -> dict[str, Any]:
    """Resolve a persona only when the campaign names its pack or id."""
    selected = Path(str(persona_id)).expanduser()
    if selected.exists():
        loaded = load_persona_pack(selected)
        raw = loaded.to_dict()
        asset_paths = {key: value for key, value in loaded.asset_paths.items()}
        photos = [asset_paths[a["id"]] for a in raw["assets"]["files"]
                  if a["kind"] == "photo" and a["id"] in asset_paths]
        return {"id": raw["id"], "name": raw["identity"]["display_name"],
                "role": raw["identity"]["role"], "voice": raw["voice"],
                "photos": photos, "rights": raw["rights"]}
    declared = brand.get("_persona_packs", {}).get(str(persona_id))
    if not isinstance(declared, dict):
        raise KeyError(f"persona desconhecida ou nao declarada: {persona_id}")
    root = Path(str(brand.get("_pack_root", "")))
    photos_dir = Path(str(declared.get("photos_dir", "")))
    if not photos_dir.is_absolute():
        photos_dir = (root / photos_dir).resolve()
    photos = sorted(p for p in photos_dir.glob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    return {**declared, "id": str(persona_id), "photos": photos,
            "name": declared.get("name", str(persona_id))}


def load_hooks() -> dict[str, Any]:
    with (DATA_DIR / "hooks-library.yaml").open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def asset_path(brand: dict[str, Any], rel_key: str) -> Path:
    paths = brand.get("_asset_paths", {})
    if rel_key in paths:
        return Path(paths[rel_key])
    assets = brand.get("assets") or {}
    if rel_key in assets and assets[rel_key]:
        if str(assets[rel_key]) in paths:
            return Path(paths[str(assets[rel_key])])
        source_dir = Path(str(assets.get("source_dir", brand.get("_pack_root", ROOT))))
        if not source_dir.is_absolute():
            source_dir = Path(brand.get("_pack_root", ROOT)) / source_dir
        return (source_dir / str(assets[rel_key])).resolve()
    raise FileNotFoundError(f"asset nao declarado no pack: {rel_key}")


def reference_paths(brand: dict[str, Any]) -> list[str]:
    return [str(path) for path in brand.get("_reference_paths", []) if Path(path).is_file()]


def has_logo_assets(brand: dict[str, Any]) -> bool:
    assets = brand.get("assets") or {}
    return any(key in assets for key in ("logo_icon_src", "logo_full_src")) or any(
        asset.get("kind") == "logo" for asset in assets.get("files", [])
        if isinstance(asset, dict)
    )


def font_path(brand: dict[str, Any], role: str) -> Path:
    """Return a pack-declared font, with a neutral runtime font as last resort."""
    paths = brand.get("_font_paths", {})
    if paths:
        wanted = str((brand.get("typography") or {}).get(role, "")).lower()
        for key, path in paths.items():
            if wanted and (wanted in key.lower() or wanted in path.name.lower()):
                return Path(path)
        return Path(next(iter(paths.values())))
    # These files are neutral implementation dependencies, never identity data.
    candidates = {"heading": "InstrumentSerif-Regular.ttf", "emphasis": "InstrumentSerif-Italic.ttf",
                  "body": "InterTight.ttf", "mono": "JetBrainsMono.ttf"}
    candidate = ROOT / "fonts" / candidates.get(role, candidates["body"])
    if candidate.is_file():
        return candidate
    raise FileNotFoundError(f"font role nao resolvido pelo pack: {role}")


def style_palette(brand: dict[str, Any], theme: str = "dark") -> dict[str, tuple[int, int, int]]:
    palette = brand.get("palette", {})
    def pick(*keys: str) -> str:
        for key in keys:
            value = palette.get(key)
            if value:
                return str(value)
        raise ValueError(f"brand pack nao declara nenhuma das cores: {', '.join(keys)}")

    primary = pick("primary", "cream_ink", "text")
    secondary = pick("secondary", "text_muted", "accent", "gold")
    background = pick("background", "surface")
    foreground = pick("foreground", "text", "cream")
    accent = pick("accent", "gold")
    if theme == "light":
        surface = pick("cream", "foreground", "text")
        return {"ink": hex_to_rgb(primary), "dim": hex_to_rgb(secondary),
                "gold": hex_to_rgb(accent), "mono": hex_to_rgb(accent),
                "cta": hex_to_rgb(primary), "line": hex_to_rgb(secondary),
                "track": hex_to_rgb(secondary), "surface": hex_to_rgb(surface)}
    return {"ink": hex_to_rgb(foreground), "dim": hex_to_rgb(secondary),
            "gold": hex_to_rgb(accent), "mono": hex_to_rgb(accent),
            "cta": hex_to_rgb(foreground), "line": hex_to_rgb(secondary),
            "track": hex_to_rgb(secondary), "surface": hex_to_rgb(background)}


# --------------------------------------------------------------------------- #
# Color and image analysis
# --------------------------------------------------------------------------- #
def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = str(value).lstrip("#")
    if len(value) != 6:
        raise ValueError(f"hex invalido: {value}")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def _lin(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb) -> float:
    r, g, b = rgb
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast_ratio(rgb1, rgb2) -> float:
    l1, l2 = luminance(rgb1), luminance(rgb2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def load_rgb_array(img_path) -> np.ndarray:
    return np.asarray(Image.open(img_path).convert("RGB"), dtype=np.float32)


def _load_rgb(img_path) -> np.ndarray:
    return load_rgb_array(img_path)


def hsv_components(arr_rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    arr = arr_rgb / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx, mn = np.max(arr, axis=2), np.min(arr, axis=2)
    diff = mx - mn
    value = mx
    sat = np.where(mx > 0, diff / np.where(mx == 0, 1.0, mx), 0.0)
    hue = np.zeros_like(mx)
    nz = diff > 1e-6
    mask_r = nz & (mx == r)
    hue[mask_r] = (60.0 * ((g[mask_r] - b[mask_r]) / diff[mask_r]) + 360.0) % 360.0
    mask_g = nz & (mx == g) & ~mask_r
    hue[mask_g] = 60.0 * ((b[mask_g] - r[mask_g]) / diff[mask_g]) + 120.0
    mask_b = nz & (mx == b) & ~mask_r & ~mask_g
    hue[mask_b] = 60.0 * ((r[mask_b] - g[mask_b]) / diff[mask_b]) + 240.0
    return hue, sat, value


def accent_coverage_from_rgb(arr_rgb: np.ndarray, accent_hex: str) -> float:
    accent = np.asarray(hex_to_rgb(accent_hex), dtype=np.float32)
    distance = np.sqrt(np.sum((arr_rgb - accent) ** 2, axis=2))
    threshold = max(24.0, float(np.linalg.norm(accent) * 0.22))
    return float((distance <= threshold).mean() * 100.0)


def gold_coverage_from_rgb(arr_rgb: np.ndarray, gold_hex: str | None = None) -> float:
    """Compatibility name; callers in the runtime supply the pack accent."""
    if not gold_hex:
        return 0.0
    return accent_coverage_from_rgb(arr_rgb, gold_hex)


def gold_coverage_pct(img_path, gold_hex: str | None = None, tol=42.0) -> float:
    return gold_coverage_from_rgb(_load_rgb(img_path), gold_hex)


def dark_pixel_pct_from_rgb(arr_rgb: np.ndarray, thr: int = 40) -> float:
    return float((arr_rgb.mean(axis=2) < thr).mean() * 100.0)


def dark_pixel_pct(img_path, thr=40) -> float:
    return dark_pixel_pct_from_rgb(_load_rgb(img_path), thr=thr)


def edge_variance_from_rgb(arr_rgb: np.ndarray) -> float:
    arr = arr_rgb.mean(axis=2)
    gy, gx = np.gradient(arr)
    return float(np.sqrt(gx ** 2 + gy ** 2).mean())


def edge_variance(img_path) -> float:
    return edge_variance_from_rgb(_load_rgb(img_path))


def _magick(*args) -> subprocess.CompletedProcess:
    return subprocess.run(["magick", *map(str, args)], capture_output=True, text=True)


def recolor_asset(src, hex_color: str, dst) -> bool:
    result = _magick(src, "-channel", "RGB", "-fill", hex_color,
                     "-colorize", "100", "+channel", dst)
    return result.returncode == 0 and Path(dst).exists()


def identify_wh(path) -> tuple[int, int]:
    result = _magick("identify", "-format", "%w %h", path)
    width, height = result.stdout.split()
    return int(width), int(height)


def codex_image(prompt: str, out_path, refs: list | None = None,
                timeout: int | None = None) -> dict[str, Any]:
    """Call the authenticated local Codex CLI; never inherit API keys."""
    out_path = str(out_path)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    timeout = timeout or CODEX_TIMEOUT
    refs = refs or []
    full = (f"Generate ONE advertising image using the image_gen tool, then save the PNG to "
            f"{out_path} and print only the absolute saved path.\n\n{prompt}")
    command = ["codex", "exec", "--ephemeral", "--sandbox", "workspace-write",
               "--skip-git-repo-check", "--cd", str(Path(out_path).parent),
               "-o", out_path + ".last"]
    if refs:
        command += ["-i", *[str(ref) for ref in refs]]
    last = {"ok": False, "path": out_path, "returncode": -1, "log_tail": "", "attempts": 0}
    for attempt in range(1, 2 + _codex_retries()):
        try:
            child_env = os.environ.copy()
            for secret in ("OPENAI_API_KEY", "CODEX_API_KEY", "ANTHROPIC_API_KEY"):
                child_env.pop(secret, None)
            result = subprocess.run(command, input=full, capture_output=True, text=True,
                                    timeout=timeout, env=child_env)
            log = (result.stdout or "") + "\n" + (result.stderr or "")
            last = {"ok": result.returncode == 0 and _image_written(out_path),
                    "path": out_path, "returncode": result.returncode,
                    "log_tail": log[-1500:], "attempts": attempt}
        except subprocess.TimeoutExpired:
            last = {"ok": False, "path": out_path, "returncode": -1,
                    "log_tail": "TIMEOUT", "attempts": attempt}
        if last["ok"]:
            return last
        if attempt < 1 + _codex_retries():
            time.sleep(CODEX_RETRY_BASE_SECONDS * (2 ** (attempt - 1)))
    return last


def fill_aspect(template: str, brand: dict[str, Any], fmt: str) -> str:
    return template.replace("{aspect}", brand["formats"][fmt]["aspect"])


if __name__ == "__main__":
    brand = load_brand()
    print("brand:", brand["name"])
    print("formats:", ", ".join(k for k in brand["formats"] if k != "safe_zone"))
