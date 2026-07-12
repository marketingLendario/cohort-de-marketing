"""
carousel.py — renderização sequencial do modo carrossel.

Contrato: 1 carrossel = 1 job. O caminho default gera um único fundo mestre
sem texto e reusa esse ativo para todos os slides, que recebem typeset vetorial,
logo real e finishing por formato. Quando `carousel_scene: per_slide` está ativo,
o custo sobe para aproximadamente 1 chamada de imagem POR SLIDE; o operador
escolhe esse trade-off por campanha.
"""
from __future__ import annotations

import sys
import hashlib
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, PngImagePlugin

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import compose as compose_mod
import finish as finish_mod
import formats_hybrid as fhyb
import gate as gate_mod
import typeset as typeset_mod


ALLOWED_ROLES = {"hook", "body", "cta"}
ALLOWED_TARGETS = {"feed", "square"}
ALLOWED_TEMPLATES = {
    "cover",
    "person_collage",
    "steps_bullets",
    "cards_grid",
    "framework_cards",
    "statement",
    "quote_callout",
    "annotated_mockup",
    "object_hero",
    "object_side",
    "item_banner",
    "item_card",
    "item_duo",
    "cta",
    "save_close",
}
ALLOWED_CAROUSEL_FORMATS = {"narrative", "listicle"}
ALLOWED_LISTICLE_TEMPLATES = {"item_banner", "item_card", "item_duo"}
ALLOWED_THEMES = {"dark", "light"}
ALLOWED_OBJECT_POSITIONS = {"top", "side"}
ALLOWED_EMPHASIS_STYLES = {"serif", "box"}
ALLOWED_TYPE_VOICES = {"sans", "serif"}
ALLOWED_FOOTER_STYLES = {"corners", "bracketed_center"}
PALETTE_MEDIAN_DISTANCE_THRESHOLD = 28.0
_SLIDE_MARKER_RE = re.compile(r"slide(\d{2})", re.IGNORECASE)
SALIENCE_GRID_STEPS = 5
SALIENCE_ZOOM = 1.08


def is_carousel_hook(hook: dict, params: dict | None = None) -> bool:
    params = params or {}
    return (
        bool(hook.get("slides"))
        or hook.get("mode") == "carousel"
        or params.get("mode") == "carousel"
    )


def validate_carousel_hook(hook: dict) -> None:
    slides = hook.get("slides")
    if not isinstance(slides, list):
        raise ValueError(f"carousel hook {hook.get('id', '<sem-id>')}: slides deve ser uma lista")
    if len(slides) < 3 or len(slides) > 10:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: slides deve ter entre 3 e 10 itens"
        )

    carousel_format = _carousel_format(hook)
    if carousel_format not in ALLOWED_CAROUSEL_FORMATS:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: carousel_format inválido {carousel_format!r}"
        )
    emphasis_style = hook.get("emphasis_style")
    if emphasis_style and emphasis_style not in ALLOWED_EMPHASIS_STYLES:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: emphasis_style inválido {emphasis_style!r}"
        )
    type_voice = hook.get("type_voice")
    if type_voice and type_voice not in ALLOWED_TYPE_VOICES:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: type_voice inválido {type_voice!r}"
        )
    footer_style = hook.get("footer_style")
    if footer_style and footer_style not in ALLOWED_FOOTER_STYLES:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: footer_style inválido {footer_style!r}"
        )
    theme = str(hook.get("theme") or (hook.get("params") or {}).get("theme") or "").strip().lower()
    if theme and theme not in ALLOWED_THEMES:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: theme inválido {theme!r}"
        )

    item_numbers: list[int] = []
    seen_numbers: set[int] = set()
    for i, slide in enumerate(slides, start=1):
        role = slide.get("role")
        if role not in ALLOWED_ROLES:
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}: role inválido {role!r}"
            )
        has_items = bool(slide.get("items"))
        headline_required = carousel_format != "listicle" or role in {"hook", "cta"} or not has_items
        if headline_required and not str(slide.get("headline", "")).strip():
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}: headline obrigatório"
            )
        template = slide.get("template")
        if template and template not in ALLOWED_TEMPLATES:
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}: template inválido {template!r}"
            )
        if template == "annotated_mockup" or slide.get("annotation"):
            _validate_annotation(
                slide.get("annotation"),
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}",
            )
        if template == "person_collage" or (role == "hook" and slide.get("persona")):
            _validate_person_collage(
                slide,
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}",
            )
        object_position = slide.get("object_position")
        if object_position and object_position not in ALLOWED_OBJECT_POSITIONS:
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}: object_position inválido {object_position!r}"
            )
        slide_emphasis_style = slide.get("emphasis_style")
        if slide_emphasis_style and slide_emphasis_style not in ALLOWED_EMPHASIS_STYLES:
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')} slide {i}: emphasis_style inválido {slide_emphasis_style!r}"
            )
        if carousel_format == "listicle":
            _validate_listicle_slide(
                hook, slide, i, item_numbers=item_numbers, seen_numbers=seen_numbers
            )

    if carousel_format == "listicle" and not item_numbers:
        raise ValueError(
            f"carousel hook {hook.get('id', '<sem-id>')}: listicle requer ao menos 1 item"
        )
    if slides[0].get("role") != "hook":
        raise ValueError(f"carousel hook {hook.get('id', '<sem-id>')}: primeiro slide deve ter role=hook")
    if slides[-1].get("role") != "cta":
        raise ValueError(f"carousel hook {hook.get('id', '<sem-id>')}: último slide deve ter role=cta")
    _validate_engagement_cta(hook.get("engagement_cta"), f"carousel hook {hook.get('id', '<sem-id>')}")
    final_engagement = slides[-1].get("engagement_cta") or hook.get("engagement_cta")
    _validate_engagement_cta(
        slides[-1].get("engagement_cta"),
        f"carousel hook {hook.get('id', '<sem-id>')} slide {len(slides)}",
    )
    if carousel_format == "listicle":
        if not str(slides[-1].get("cta", "")).strip() and not final_engagement:
            raise ValueError(
                f"carousel hook {hook.get('id', '<sem-id>')}: último slide deve conter cta ou engagement_cta"
            )
    elif not str(slides[-1].get("cta", "")).strip() and slides[-1].get("template") != "save_close":
        raise ValueError(f"carousel hook {hook.get('id', '<sem-id>')}: último slide deve conter cta")


def filter_carousel_targets(targets: list[str] | tuple[str, ...] | None) -> tuple[list[str], list[str]]:
    raw = list(targets or ["feed"])
    valid: list[str] = []
    warnings: list[str] = []
    for target in raw:
        if target in ALLOWED_TARGETS:
            if target not in valid:
                valid.append(target)
            continue
        warnings.append(f"target {target!r} ignorado no modo carousel; use apenas feed/square")
    return valid, warnings


def _highest_target(targets: list[str], brand: dict) -> str:
    return max(targets, key=lambda t: brand["formats"][t]["h"])


def _params(hook: dict) -> dict:
    merged = {}
    merged.update(hook.get("_carousel_params", {}) or {})
    merged.update(hook.get("params", {}) or {})
    hook_theme = str(hook.get("theme") or "").strip().lower()
    if hook_theme:
        merged["theme"] = hook_theme
    return merged


def _brand_carousel(brand: dict | None) -> dict:
    value = (brand or {}).get("carousel") or {}
    return value if isinstance(value, dict) else {}


def _carousel_theme(hook: dict, brand: dict | None = None,
                    params: dict | None = None) -> str:
    params = params or _params(hook)
    raw = (
        hook.get("theme")
        or params.get("theme")
        or _brand_carousel(brand).get("default_theme")
        or "dark"
    )
    theme = str(raw).strip().lower() or "dark"
    return theme if theme in ALLOWED_THEMES else "dark"


def _theme_emphasis_color(brand: dict, theme: str):
    identity = _brand_carousel(brand)
    key = f"emphasis_color_{theme}"
    raw = str(identity.get(key) or "").strip()
    if not raw:
        return None
    try:
        return alib.hex_to_rgb(raw)
    except Exception:
        return None


def _carousel_format(hook: dict) -> str:
    raw = str(hook.get("carousel_format") or "narrative").strip().lower()
    return raw or "narrative"


def _item_number_value(value, *, label: str) -> int:
    try:
        number = int(str(value).strip())
    except Exception as exc:
        raise ValueError(f"{label}: number deve ser inteiro") from exc
    if number < 1:
        raise ValueError(f"{label}: number deve ser positivo")
    return number


def _validate_engagement_cta(value, label: str) -> None:
    if value in (None, ""):
        return
    if not isinstance(value, dict):
        raise ValueError(f"{label}: engagement_cta deve ser objeto com action e reward")
    if not str(value.get("action", "")).strip() or not str(value.get("reward", "")).strip():
        raise ValueError(f"{label}: engagement_cta requer action e reward")


def _validate_listicle_slide(hook: dict, slide: dict, index: int, *,
                             item_numbers: list[int], seen_numbers: set[int]) -> None:
    role = slide.get("role")
    hook_id = hook.get("id", "<sem-id>")
    items = slide.get("items")
    template = slide.get("template")
    if role != "body":
        if items:
            raise ValueError(
                f"carousel hook {hook_id} slide {index}: items só é aceito em slide body"
            )
        return
    if not isinstance(items, list) or not (1 <= len(items) <= 2):
        raise ValueError(
            f"carousel hook {hook_id} slide {index}: listicle body requer 1 ou 2 items"
        )
    if template:
        if template not in ALLOWED_LISTICLE_TEMPLATES:
            raise ValueError(
                f"carousel hook {hook_id} slide {index}: template listicle inválido {template!r}"
            )
        if len(items) == 2 and template != "item_duo":
            raise ValueError(
                f"carousel hook {hook_id} slide {index}: 2 items exigem template item_duo"
            )
        if len(items) == 1 and template == "item_duo":
            raise ValueError(
                f"carousel hook {hook_id} slide {index}: item_duo exige 2 items"
            )
    for item_pos, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            raise ValueError(
                f"carousel hook {hook_id} slide {index} item {item_pos}: esperado objeto"
            )
        label = f"carousel hook {hook_id} slide {index} item {item_pos}"
        number = _item_number_value(item.get("number"), label=label)
        if number in seen_numbers:
            raise ValueError(f"{label}: number repetido {number}")
        if item_numbers and number <= item_numbers[-1]:
            raise ValueError(
                f"{label}: numbers devem ser crescentes; {number} veio após {item_numbers[-1]}"
            )
        if not str(item.get("title", "")).strip():
            raise ValueError(f"{label}: title obrigatório")
        if not str(item.get("desc", "")).strip():
            raise ValueError(f"{label}: desc obrigatório")
        seen_numbers.add(number)
        item_numbers.append(number)


def _validate_annotation(annotation, label: str) -> None:
    if not isinstance(annotation, dict):
        raise ValueError(f"{label}: annotation deve ser objeto")
    region = annotation.get("region")
    if not isinstance(region, list) or len(region) != 4:
        raise ValueError(f"{label}: annotation.region deve conter [x%, y%, w%, h%]")
    try:
        x, y, w, h = [float(str(item).strip().rstrip("%")) for item in region]
    except Exception as exc:
        raise ValueError(f"{label}: annotation.region deve conter números") from exc
    if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 100 or y + h > 100:
        raise ValueError(f"{label}: annotation.region fora de [0,100]")
    if not str(annotation.get("label") or "").strip():
        raise ValueError(f"{label}: annotation.label obrigatório")


def _validate_person_collage(slide: dict, label: str) -> None:
    if not str(slide.get("persona") or "").strip():
        raise ValueError(f"{label}: person_collage requer persona")
    cards = slide.get("floating_cards")
    if not isinstance(cards, list) or not (2 <= len(cards) <= 4):
        raise ValueError(f"{label}: person_collage requer 2 a 4 floating_cards")
    for idx, card in enumerate(cards, start=1):
        if not isinstance(card, dict):
            raise ValueError(f"{label} floating_card {idx}: esperado objeto")
        kind = str(card.get("type") or "chip").strip().lower()
        if kind == "testimonial":
            if not str(card.get("quote") or "").strip() or not str(card.get("author") or "").strip():
                raise ValueError(f"{label} floating_card {idx}: testimonial requer quote e author")
        elif kind == "stat":
            if not str(card.get("value") or "").strip() or not str(card.get("label") or "").strip():
                raise ValueError(f"{label} floating_card {idx}: stat requer value e label")
        elif kind == "chip":
            if not str(card.get("label") or card.get("text") or "").strip():
                raise ValueError(f"{label} floating_card {idx}: chip requer label")
        else:
            raise ValueError(f"{label} floating_card {idx}: type inválido {kind!r}")


def _listicle_headline(slide: dict) -> str:
    titles = [str(item.get("title", "")).strip()
              for item in (slide.get("items") or []) if isinstance(item, dict)]
    return " + ".join(title for title in titles if title) or str(slide.get("headline", "")).strip()


def _slide_engagement_cta(hook: dict, slide: dict) -> dict | None:
    value = slide.get("engagement_cta") or hook.get("engagement_cta")
    return value if isinstance(value, dict) else None


def _slide_visual_metaphor(slide: dict | None) -> str:
    if not slide:
        return ""
    direct = str(slide.get("visual_metaphor") or "").strip()
    if direct:
        return direct
    metaphors = [
        str(item.get("visual_metaphor") or "").strip()
        for item in (slide.get("items") or [])
        if isinstance(item, dict) and str(item.get("visual_metaphor") or "").strip()
    ]
    return "; ".join(metaphors)


def _scene_core(hook: dict) -> str:
    parts = [
        hook.get("visual_recipe"),
        hook.get("mechanism"),
        hook.get("headline"),
    ]
    for part in parts:
        if str(part or "").strip():
            return str(part).strip()
    return "one precise hero object with quiet editorial texture"


def _material_family(hook: dict) -> str:
    value = str(hook.get("material_family") or "").strip()
    return value or "the material requested by the campaign"


def _object_position(slide: dict | None) -> str:
    raw = str((slide or {}).get("object_position") or "").strip().lower()
    return "side" if raw == "side" else "top"


def _object_zone_instruction(position: str) -> str:
    if position == "side":
        return (
            "Reserve roughly the right 40% of the frame for the object; keep the left 60% "
            "clean and quiet for vector typography."
        )
    return (
        "Reserve roughly the upper 45% of the frame for the object; keep the lower 55% "
        "clean and quiet for vector typography."
    )


def _scene_prompt_block(brand: dict, fmt: str, theme: str) -> str:
    scene_prompts = _brand_carousel(brand).get("scene_prompt") or {}
    if isinstance(scene_prompts, dict):
        block = str(scene_prompts.get(theme) or "").strip()
        if block:
            return alib.fill_aspect(block, brand, fmt)
    fallback = []
    if brand.get("prompt_header"):
        fallback.append(alib.fill_aspect(str(brand["prompt_header"]), brand, fmt))
    else:
        fallback.append(
            f"BACKGROUND image, {brand['formats'][fmt]['aspect']} aspect ratio."
        )
    if brand.get("logo_guard"):
        fallback.append(str(brand["logo_guard"]))
    if brand.get("negative"):
        fallback.append("NEGATIVE (do NOT include): " + str(brand["negative"]))
    return "\n".join(part for part in fallback if part.strip())


def _build_bg_prompt(hook: dict, brand: dict, fmt: str, *, slide: dict | None = None,
                     index: int | None = None, total: int | None = None,
                     anchored: bool = False) -> str:
    theme = _carousel_theme(hook, brand)
    core = _scene_core(hook)
    if slide and slide.get("headline"):
        core += f". Narrative beat {index}/{total}: {slide['headline']}"
    visual_metaphor = _slide_visual_metaphor(slide)
    material_family = _material_family(hook)

    parts = [
        _scene_prompt_block(brand, fmt, theme),
        "Create a coherent master scene for a multi-slide carousel; it must feel consistent across the full sequence.",
        "Compose with roughly 15% extra horizontal overscan beyond the final crop so each slide can pan across the same master scene.",
    ]
    if visual_metaphor:
        parts.extend([
            "Create one precise object-metaphor background for this slide; the object must be the visual subject.",
            "SUBJECT: " + visual_metaphor.rstrip(". ") + ".",
            "MATERIAL FAMILY: " + material_family.rstrip(". ") + ".",
            "CONTEXT: " + core.rstrip(". ") + ".",
            _object_zone_instruction(_object_position(slide)),
        ])
    else:
        parts.extend([
            "SUBJECT: " + core.rstrip(". ") + ".",
            "Reserve generous clean negative space for vector typography inside Meta feed/square safe zones.",
        ])
    if slide and (slide.get("template") == "person_collage" or slide.get("persona")):
        parts.append(
            "Do not include any person, face, body, silhouette or portrait; a real persona photo will be composited locally."
        )
    parts.extend([
        "MATERIAL FAMILY: " + material_family.rstrip(". ") + ".",
        "Keep all text, UI, logos, numbers and captions out of the generated image; typography is added later as vectors.",
    ])
    if anchored:
        if visual_metaphor:
            parts.append(
                "Use the referenced first background as a visual anchor: keep palette, lighting, material family and scene grammar."
            )
        else:
            parts.append(
                "Use the referenced first background as a visual anchor: keep palette, lighting, object identity and scene grammar."
            )
    return "\n".join(parts)


def _body_template_options(slide: dict) -> list[str]:
    """Heurística determinística: conteúdo rico ganha template rico; v1 cai em statement."""
    options: list[str] = []
    if slide.get("bullets"):
        options.append("steps_bullets")
    if slide.get("cards"):
        options.append("cards_grid")

    headline_only = (
        not slide.get("sub")
        and not slide.get("callout")
        and not slide.get("bullets")
        and not slide.get("cards")
    )
    if headline_only:
        options.append("quote_callout")
    if "statement" not in options:
        options.append("statement")
    return options


def _assign_slide_templates(slides: list[dict], *, scene: str = "single_bg",
                            carousel_format: str = "narrative") -> list[dict]:
    """Resolve templates sem mutar o hook original.

    Regras:
    - template explícito vence;
    - hook/cta mapeiam para cover/cta;
    - bodies usam conteúdo disponível e evitam repetir o body anterior quando
      existe uma alternativa viável para aquele conteúdo.
    """
    assigned: list[dict] = []
    previous_body_template: str | None = None
    single_item_count = 0
    for slide in slides:
        item = dict(slide)
        explicit = item.get("template")
        role = item.get("role")
        if carousel_format == "listicle" and role == "body":
            item_count = len(item.get("items") or [])
            if explicit:
                template = explicit
                options = [explicit]
            elif item_count == 2:
                template = "item_duo"
                options = ["item_duo"]
            else:
                template = "item_card" if single_item_count % 2 == 0 else "item_banner"
                options = ["item_card", "item_banner"]
            if item_count == 1:
                single_item_count += 1
        elif explicit:
            template = explicit
            options = [explicit]
        elif role == "hook" and item.get("persona"):
            template = "person_collage"
            options = ["person_collage"]
        elif role == "hook":
            template = "cover"
            options = ["cover"]
        elif role == "cta":
            template = "cta"
            options = ["cta"]
        elif scene == "per_slide" and str(item.get("visual_metaphor") or "").strip():
            template = "object_side" if _object_position(item) == "side" else "object_hero"
            options = [template]
        else:
            options = _body_template_options(item)
            template = options[0]
            if template == previous_body_template and len(options) > 1:
                template = next((candidate for candidate in options
                                 if candidate != previous_body_template), template)
        item["template"] = template
        item["_template_options"] = options
        if role == "body":
            previous_body_template = template
        assigned.append(item)
    return assigned


def _slide_copy(hook: dict, slide: dict, brand: dict | None = None,
                theme: str = "dark") -> dict:
    identity = _brand_carousel(brand)
    footer = (
        slide.get("footer")
        or hook.get("footer")
        or identity.get("tagline")
        or identity.get("site")
        or hook.get("eyebrow", "")
    )
    return {
        "eyebrow": slide.get("kicker") or hook.get("eyebrow", ""),
        "kicker": slide.get("kicker") or hook.get("eyebrow", ""),
        "headline": slide.get("headline") or _listicle_headline(slide),
        "emphasis_word": slide.get("emphasis_word", ""),
        "sub": slide.get("sub", ""),
        "cta": slide.get("cta", ""),
        "template": slide.get("template"),
        "carousel_format": _carousel_format(hook),
        "items": slide.get("items", []),
        "engagement_cta": _slide_engagement_cta(hook, slide),
        "chips": slide.get("chips", []),
        "bullets": slide.get("bullets", []),
        "paragraphs": slide.get("paragraphs", []),
        "cards": slide.get("cards", []),
        "callout": slide.get("callout"),
        "footer": footer,
        "emphasis_style": slide.get("emphasis_style") or hook.get("emphasis_style", "serif"),
        "type_voice": hook.get("type_voice", "sans"),
        "footer_style": hook.get("footer_style", "corners"),
        "object_position": slide.get("object_position", "top"),
        "visual_metaphor": _slide_visual_metaphor(slide),
        "floating_cards": slide.get("floating_cards", []),
        "persona": slide.get("persona") or hook.get("persona"),
        "photo": slide.get("photo"),
        "persona_photo": slide.get("photo") or slide.get("persona_photo") or hook.get("persona_photo"),
        "media": slide.get("media"),
        "annotation": slide.get("annotation"),
        "brand_carousel": identity,
        "theme": slide.get("theme") or theme,
    }


def _safe_zone(brand: dict, target: str) -> dict:
    return brand.get("formats", {}).get("safe_zone", {}).get(target, {})


def _save_final(logoed: str, final: str, *, do_finish: bool, target_w: int) -> str:
    if do_finish:
        return finish_mod.finish(logoed, final, target_w=target_w)
    Image.open(logoed).save(final, "PNG")
    return final


def _sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _pan_for_slide(index: int, total: int) -> dict:
    progress = 0.5 if total <= 1 else (index - 1) / max(1, total - 1)
    return {
        "x": round(progress, 4),
        "y": round(0.5 + 0.08 * math.sin(progress * math.pi), 4),
        "zoom": round(1.0 + 0.06 * progress, 4),
    }


def _crop_size_for_aspect(width: int, height: int, target_w: int, target_h: int,
                          *, zoom: float = 1.0) -> tuple[int, int]:
    aspect = target_w / target_h
    if width / height >= aspect:
        max_crop_h = height
        max_crop_w = int(max_crop_h * aspect)
    else:
        max_crop_w = width
        max_crop_h = int(max_crop_w / aspect)
    crop_w = max(1, min(width, int(max_crop_w / max(1.0, zoom))))
    crop_h = max(1, min(height, int(max_crop_h / max(1.0, zoom))))
    return crop_w, crop_h


def _offset_grid(travel: int, steps: int = SALIENCE_GRID_STEPS) -> list[tuple[int, float]]:
    if travel <= 0:
        return [(0, 0.5)]
    points = []
    for i in range(max(2, steps)):
        ratio = i / max(1, steps - 1)
        pos = int(round(travel * ratio))
        item = (pos, round(ratio, 4))
        if item not in points:
            points.append(item)
    return points


def _salient_window_candidates(im: Image.Image, target_w: int, target_h: int) -> list[dict]:
    """Rank candidate crops by visual interest for listicle scene cards/bands."""
    crop_w, crop_h = _crop_size_for_aspect(
        im.width, im.height, target_w, target_h, zoom=SALIENCE_ZOOM
    )
    travel_x = max(0, im.width - crop_w)
    travel_y = max(0, im.height - crop_h)
    arr = np.asarray(im.convert("RGB"))
    candidates = []
    for left, x_ratio in _offset_grid(travel_x):
        for top, y_ratio in _offset_grid(travel_y):
            left = max(0, min(left, im.width - crop_w))
            top = max(0, min(top, im.height - crop_h))
            window = arr[top:top + crop_h, left:left + crop_w]
            edge = alib.edge_variance_from_rgb(window)
            gold = alib.gold_coverage_from_rgb(window)
            candidates.append({
                "left": left,
                "top": top,
                "crop_w": crop_w,
                "crop_h": crop_h,
                "x": x_ratio,
                "y": y_ratio,
                "zoom": SALIENCE_ZOOM,
                "edge": edge,
                "gold": gold,
                "score": edge + gold,
            })
    candidates.sort(
        key=lambda item: (
            -float(item["score"]),
            abs(float(item["x"]) - 0.5) + abs(float(item["y"]) - 0.5),
            float(item["x"]),
            float(item["y"]),
        )
    )
    return candidates


def _select_salient_windows(im: Image.Image, target_w: int, target_h: int,
                            total: int) -> list[dict]:
    candidates = _salient_window_candidates(im, target_w, target_h)
    if not candidates:
        return []
    selected: list[dict] = []
    min_distance = 0.22 if total > 1 else 0.0
    for candidate in candidates:
        if all(
            math.hypot(
                float(candidate["x"]) - float(prev["x"]),
                float(candidate["y"]) - float(prev["y"]),
            ) >= min_distance
            for prev in selected
        ):
            selected.append(candidate)
        if len(selected) >= total:
            break
    if len(selected) < total:
        seen = {(item["left"], item["top"], item["crop_w"], item["crop_h"])
                for item in selected}
        for candidate in candidates:
            key = (
                candidate["left"], candidate["top"],
                candidate["crop_w"], candidate["crop_h"],
            )
            if key not in seen:
                selected.append(candidate)
                seen.add(key)
            if len(selected) >= total:
                break
    return selected[:max(1, total)]


def _reframe_bg_with_salience(bg_path: str, target_w: int, target_h: int, *,
                              index: int, total: int, master_hash: str,
                              out_path: str) -> tuple[str, dict]:
    """Recorta o fundo mestre pelo ponto de maior interesse visual."""
    im = Image.open(bg_path).convert("RGB")
    windows = _select_salient_windows(im, target_w, target_h, max(1, total))
    window = windows[min(max(1, index), len(windows)) - 1]
    left = int(window["left"])
    top = int(window["top"])
    crop_w = int(window["crop_w"])
    crop_h = int(window["crop_h"])
    framed = im.crop((left, top, left + crop_w, top + crop_h)).resize(
        (target_w, target_h), Image.LANCZOS
    )
    salience = {
        "mode": "salience",
        "x": round(float(window["x"]), 4),
        "y": round(float(window["y"]), 4),
        "zoom": round(float(window["zoom"]), 4),
        "score": round(float(window["score"]), 4),
        "edge": round(float(window["edge"]), 4),
        "gold": round(float(window["gold"]), 4),
        "crop": [left, top, crop_w, crop_h],
    }
    meta = PngImagePlugin.PngInfo()
    meta.add_text("acf.master_hash", master_hash)
    meta.add_text("acf.pan", json.dumps(salience, sort_keys=True))
    meta.add_text("acf.salience", json.dumps(salience, sort_keys=True))
    framed.save(out_path, "PNG", pnginfo=meta)
    return out_path, salience


def _reframe_bg_with_pan(bg_path: str, target_w: int, target_h: int, *,
                         index: int, total: int, master_hash: str,
                         out_path: str) -> tuple[str, dict]:
    """Recorta uma janela determinística do fundo mestre para um slide.

    O crop usa âncora horizontal progressiva esquerda→direita e zoom máximo de
    6%. O metadata PNG registra o hash do mestre e o pan para o gate de sequência.
    """
    pan = _pan_for_slide(index, total)
    im = Image.open(bg_path).convert("RGB")
    aspect = target_w / target_h
    if im.width / im.height >= aspect:
        max_crop_h = im.height
        max_crop_w = int(max_crop_h * aspect)
    else:
        max_crop_w = im.width
        max_crop_h = int(max_crop_w / aspect)

    zoom = float(pan["zoom"])
    crop_w = max(1, min(im.width, int(max_crop_w / zoom)))
    crop_h = max(1, min(im.height, int(max_crop_h / zoom)))
    travel_x = max(0, im.width - crop_w)
    travel_y = max(0, im.height - crop_h)
    left = int(round(travel_x * float(pan["x"])))
    top = int(round(travel_y * float(pan["y"])))
    left = max(0, min(left, im.width - crop_w))
    top = max(0, min(top, im.height - crop_h))

    framed = im.crop((left, top, left + crop_w, top + crop_h)).resize(
        (target_w, target_h), Image.LANCZOS
    )
    meta = PngImagePlugin.PngInfo()
    meta.add_text("acf.master_hash", master_hash)
    meta.add_text("acf.pan", json.dumps(pan, sort_keys=True))
    framed.save(out_path, "PNG", pnginfo=meta)
    return out_path, pan


def _slide_bg_paths(rendered: dict, slides: list[dict]) -> list[str]:
    bgs = rendered.get("bgs") or []
    if bgs:
        return [str(bg) for bg in bgs]
    return [str(slide.get("bg", "")) for slide in slides]


def _mean_pairwise_distance(values: list[np.ndarray]) -> float:
    if len(values) < 2:
        return 0.0
    dists = []
    for i, left in enumerate(values):
        for right in values[i + 1:]:
            dists.append(float(np.linalg.norm(left - right)))
    return float(np.mean(dists)) if dists else 0.0


def _background_check(rendered: dict, slides: list[dict]) -> dict:
    scene = rendered.get("scene", "single_bg")
    bg_paths = _slide_bg_paths(rendered, slides)
    reasons = []
    if len(bg_paths) != len(slides):
        reasons.append(
            f"background_count mismatch: {len(bg_paths)} bg(s) para {len(slides)} slide(s)"
        )

    existing = []
    for i, bg in enumerate(bg_paths, start=1):
        if not bg or not Path(bg).exists():
            reasons.append(f"slide {i}: bg ausente em {bg or '<vazio>'}")
            continue
        existing.append(bg)

    if reasons:
        return {"pass": False, "scene": scene, "reasons": reasons}

    if scene == "single_bg":
        hashes = [_sha256_file(bg) for bg in bg_paths]
        unique_hashes = sorted(set(hashes))
        master_hash = rendered.get("bg_master_hash")
        pans = [slide.get("pan") for slide in slides]
        has_pan_contract = bool(master_hash) and all(isinstance(pan, dict) for pan in pans)
        if has_pan_contract:
            pan_keys = [
                (pan.get("x"), pan.get("y"), pan.get("zoom"))
                for pan in pans
            ]
            unique_pans = sorted(set(pan_keys))
            ok = len(unique_pans) == len(slides) and len(unique_hashes) == len(slides)
            if not ok:
                reasons.append(
                    "single_bg com pan exige offsets e crops distintos derivados do mestre"
                )
            return {
                "pass": ok,
                "scene": scene,
                "master_hash": master_hash,
                "hashes": hashes,
                "unique_hashes": unique_hashes,
                "pan": pans,
                "unique_pan": [list(item) for item in unique_pans],
                "reasons": reasons,
            }

        ok = len(unique_hashes) == 1
        if not ok:
            reasons.append("single_bg exige o mesmo hash de fundo em todos os slides ou pan derivado do mestre")
        return {
            "pass": ok,
            "scene": scene,
            "hashes": hashes,
            "unique_hashes": unique_hashes,
            "reasons": reasons,
        }

    if scene == "per_slide":
        medians = []
        for bg in bg_paths:
            arr = alib.load_rgb_array(bg)
            medians.append(np.median(arr.reshape(-1, 3), axis=0))
        mean_distance = _mean_pairwise_distance(medians)
        ok = mean_distance <= PALETTE_MEDIAN_DISTANCE_THRESHOLD
        if not ok:
            reasons.append(
                "per_slide excedeu a distância média das medianas RGB "
                f"({mean_distance:.2f} > {PALETTE_MEDIAN_DISTANCE_THRESHOLD:.2f})"
            )
        return {
            "pass": ok,
            "scene": scene,
            "median_rgb": [[round(float(c), 2) for c in median] for median in medians],
            "mean_median_distance": round(mean_distance, 3),
            "threshold": PALETTE_MEDIAN_DISTANCE_THRESHOLD,
            "reasons": reasons,
        }

    return {
        "pass": False,
        "scene": scene,
        "reasons": [f"carousel_scene inválido no gate: {scene!r}"],
    }


def _template_sequence_check(slides: list[dict], *, required: bool = False) -> dict:
    reasons = []
    if required:
        missing = [slide.get("index") for slide in slides if not slide.get("template")]
        for index in missing:
            reasons.append(f"slide {index}: template ausente no manifest")

    for left, right in zip(slides, slides[1:]):
        if left.get("role") != "body" or right.get("role") != "body":
            continue
        if left.get("template") != right.get("template"):
            continue
        left_options = left.get("template_options") or []
        right_options = right.get("template_options") or []
        if len(left_options) > 1 or len(right_options) > 1:
            reasons.append(
                "bodies adjacentes repetiram template apesar de haver alternativa viável"
            )

    return {"pass": not reasons, "reasons": reasons}


def _listicle_item_sequence_check(slides: list[dict]) -> dict:
    reasons = []
    numbers: list[int] = []
    seen: set[int] = set()
    for slide in slides:
        for item_pos, item in enumerate(slide.get("items") or [], start=1):
            if not isinstance(item, dict):
                reasons.append(f"slide {slide.get('index')} item {item_pos}: esperado objeto")
                continue
            try:
                number = _item_number_value(
                    item.get("number"),
                    label=f"slide {slide.get('index')} item {item_pos}",
                )
            except ValueError as exc:
                reasons.append(str(exc))
                continue
            if number in seen:
                reasons.append(f"slide {slide.get('index')} item {item_pos}: number repetido {number}")
            if numbers and number <= numbers[-1]:
                reasons.append(
                    f"slide {slide.get('index')} item {item_pos}: numbers devem crescer; "
                    f"{number} veio após {numbers[-1]}"
                )
            seen.add(number)
            numbers.append(number)
    return {"pass": not reasons, "numbers": numbers, "reasons": reasons}


def _numbering_check(slides: list[dict]) -> dict:
    reasons = []
    expected = list(range(1, len(slides) + 1))
    actual = [slide.get("index") for slide in slides]
    if actual != expected:
        reasons.append(f"indices esperados {expected}, recebidos {actual}")

    for expected_index, slide in zip(expected, slides):
        paths = [slide.get("path")]
        paths.extend((fmt or {}).get("path") for fmt in (slide.get("formats") or {}).values())
        for raw_path in paths:
            path = str(raw_path or "")
            if not path:
                reasons.append(f"slide {expected_index}: path vazio")
                continue
            if not Path(path).exists():
                reasons.append(f"slide {expected_index}: arquivo ausente {path}")
                continue
            marker = _SLIDE_MARKER_RE.search(Path(path).name)
            if not marker:
                reasons.append(f"slide {expected_index}: marcador slideXX ausente em {path}")
                continue
            found_index = int(marker.group(1))
            if found_index != expected_index:
                reasons.append(
                    f"slide {expected_index}: arquivo marcado como slide{found_index:02d}"
                )

    return {"pass": not reasons, "expected": expected, "actual": actual, "reasons": reasons}


def _dimensions_check(slides: list[dict]) -> dict:
    reasons = []
    by_target: dict[str, dict] = {}
    targets = sorted({target for slide in slides for target in (slide.get("formats") or {})})
    if not targets:
        reasons.append("nenhum formato encontrado nos slides")

    for target in targets:
        expected_size: tuple[int, int] | None = None
        sizes = []
        for slide in slides:
            fmt = (slide.get("formats") or {}).get(target)
            if not fmt:
                reasons.append(f"slide {slide.get('index')}: formato {target!r} ausente")
                continue
            path = fmt.get("path")
            if not path or not Path(path).exists():
                reasons.append(f"slide {slide.get('index')}: arquivo {target!r} ausente")
                continue
            with Image.open(path) as im:
                actual_size = im.size
            meta_size = (fmt.get("w"), fmt.get("h"))
            if all(meta_size):
                meta_size = (int(meta_size[0]), int(meta_size[1]))
                if meta_size != actual_size:
                    reasons.append(
                        f"slide {slide.get('index')} {target}: metadata {meta_size} != imagem {actual_size}"
                    )
            sizes.append({"slide": slide.get("index"), "size": list(actual_size)})
            if expected_size is None:
                expected_size = actual_size
            elif actual_size != expected_size:
                reasons.append(
                    f"slide {slide.get('index')} {target}: dimensão {actual_size} != {expected_size}"
                )
        by_target[target] = {"expected": list(expected_size) if expected_size else None, "sizes": sizes}

    return {"pass": not reasons, "targets": by_target, "reasons": reasons}


def evaluate_sequence(rendered: dict, brand: dict, theme: str = "dark") -> dict:
    """Avalia um carrossel renderizado: gate por slide + consistência estrutural.

    O threshold de paleta em `per_slide` é a distância euclidiana média entre as
    medianas RGB dos fundos. 28/255 tolera variação leve de luz/acento sem aceitar
    uma mudança perceptível de paleta entre slides.
    """
    slides = rendered.get("slides") or []
    reasons = []
    if not slides:
        return {
            "verdict": "fail",
            "slide_gates": [],
            "checks": {},
            "reasons": ["carrossel sem slides renderizados"],
        }

    slide_gates = []
    for slide in slides:
        slide_theme = slide.get("theme") or theme
        gate = gate_mod.evaluate(slide["path"], brand, theme=slide_theme)
        slide["gate"] = gate
        slide_gates.append({
            "index": slide.get("index"),
            "role": slide.get("role"),
            "path": slide.get("path"),
            "theme": slide_theme,
            "verdict": gate.get("verdict"),
            "gate": gate,
        })

    checks = {
        "numbering": _numbering_check(slides),
        "dimensions": _dimensions_check(slides),
        "backgrounds": _background_check(rendered, slides),
        "templates": _template_sequence_check(
            slides, required=bool(rendered.get("templates_required"))
        ),
    }
    if rendered.get("carousel_format") == "listicle" or any(slide.get("items") for slide in slides):
        checks["listicle_items"] = _listicle_item_sequence_check(slides)
    structural_fail = False
    for name, check in checks.items():
        if not check.get("pass"):
            structural_fail = True
            for reason in check.get("reasons", []):
                reasons.append(f"{name}: {reason}")

    verdicts = [g.get("verdict") for g in (sg["gate"] for sg in slide_gates)]
    if any(verdict == "fail" for verdict in verdicts) or structural_fail:
        verdict = "fail"
    elif any(verdict == "warn" for verdict in verdicts):
        verdict = "warn"
    else:
        verdict = "pass"

    if verdict == "pass":
        reasons.append("OK: sequência consistente e todos os slides passaram no gate")

    return {
        "verdict": verdict,
        "slide_gates": slide_gates,
        "checks": checks,
        "reasons": reasons,
    }


def _render_slide_format(bg_path: str, hook: dict, slide: dict, brand: dict,
                         target: str, out_base: str, index: int, total: int,
                         params: dict, *, scene: str, master_hash: str,
                         salience_index: int | None = None,
                         salience_total: int | None = None) -> dict:
    spec = brand["formats"][target]
    w, h = spec["w"], spec["h"]
    framed_path = f"{out_base}__slide{index:02d}__{target}__bg.png"
    pan = None
    if scene == "single_bg":
        if salience_index is not None and salience_total:
            _, pan = _reframe_bg_with_salience(
                bg_path, w, h, index=salience_index, total=salience_total,
                master_hash=master_hash, out_path=framed_path
            )
        else:
            _, pan = _reframe_bg_with_pan(
                bg_path, w, h, index=index, total=total,
                master_hash=master_hash, out_path=framed_path
            )
    else:
        framed = fhyb.reframe_bg(bg_path, w, h)
        framed.save(framed_path)

    typeset_path = f"{out_base}__slide{index:02d}__{target}__typeset.png"
    slide_theme = str(slide.get("theme") or params.get("theme") or "dark").strip().lower()
    if slide_theme not in ALLOWED_THEMES:
        slide_theme = "dark"
    typeset_mod.render_creative(
        framed_path,
        _slide_copy(hook, slide, brand, slide_theme),
        typeset_path,
        layout="slide",
        H=h,
        theme=slide_theme,
        emphasis_color=_theme_emphasis_color(brand, slide_theme),
        brand=brand,
        slide_index=index,
        slide_total=total,
        slide_role=slide.get("role", "body"),
        safe_zone=_safe_zone(brand, target),
    )

    logoed = f"{out_base}__slide{index:02d}__{target}__logo.png"
    logo_variant = params.get("logo_variant", "icon")
    logo_surface = params.get("logo_surface") or ("light" if slide_theme == "light" else "dark")
    compose_mod.compose_logo(
        typeset_path,
        logoed,
        variant=logo_variant,
        surface=logo_surface,
        width_pct=5.0 if logo_variant == "icon" else 14.0,
        margin_pct=7.0,
        opacity=0.82,
    )

    final = f"{out_base}__slide{index:02d}__{target}.png"
    _save_final(logoed, final, do_finish=params.get("finish", True), target_w=w)
    result = {"target": target, "path": final, "w": w, "h": h, "bg": framed_path,
              "theme": slide_theme}
    if pan:
        result["pan"] = pan
    return result


def _generate_backgrounds(hook: dict, brand: dict, base: str, targets: list[str],
                          params: dict) -> tuple[str, list[str], str]:
    slides = hook["slides"]
    scene = params.get("carousel_scene", hook.get("carousel_scene", "single_bg"))
    if scene not in {"single_bg", "per_slide"}:
        raise ValueError(f"carousel_scene inválido: {scene!r}")

    gen_fmt = _highest_target(targets, brand)
    master_bg = f"{base}__carousel_bg.png"
    first_slide = None
    if scene == "per_slide" and slides and _slide_visual_metaphor(slides[0]):
        first_slide = slides[0]
    res = alib.codex_image(
        _build_bg_prompt(
            hook, brand, gen_fmt, slide=first_slide, index=1, total=len(slides)
        ),
        master_bg,
    )
    if not res.get("ok"):
        raise RuntimeError(f"falha ao gerar fundo do carrossel: {res.get('log_tail', '')}")

    if scene == "single_bg":
        return master_bg, [master_bg] * len(slides), scene

    bgs = [master_bg]
    for i, slide in enumerate(slides[1:], start=2):
        slide_bg = f"{base}__slide{i:02d}__carousel_bg.png"
        prompt = _build_bg_prompt(hook, brand, gen_fmt, slide=slide, index=i,
                                  total=len(slides), anchored=True)
        res = alib.codex_image(prompt, slide_bg, refs=[master_bg])
        if not res.get("ok"):
            raise RuntimeError(
                f"falha ao gerar fundo do slide {i}: {res.get('log_tail', '')}"
            )
        bgs.append(slide_bg)
    return master_bg, bgs, scene


def render_carousel(hook: dict, brand: dict, base: str, targets: list[str]) -> dict:
    validate_carousel_hook(hook)
    valid_targets, warnings = filter_carousel_targets(targets)
    if not valid_targets:
        raise ValueError("carousel requer ao menos um target válido: feed ou square")

    Path(base).parent.mkdir(parents=True, exist_ok=True)
    params = _params(hook)
    params["theme"] = _carousel_theme(hook, brand, params)
    master_bg, slide_bgs, scene = _generate_backgrounds(hook, brand, base, valid_targets, params)
    master_hash = _sha256_file(master_bg)
    primary_target = "feed" if "feed" in valid_targets else valid_targets[0]
    carousel_format = _carousel_format(hook)
    slides = _assign_slide_templates(
        hook["slides"], scene=scene, carousel_format=carousel_format
    )
    total = len(slides)
    salience_order: dict[int, int] = {}
    if carousel_format == "listicle" and scene == "single_bg":
        salience_slides = [
            i for i, slide in enumerate(slides, start=1)
            if slide.get("template") in ALLOWED_LISTICLE_TEMPLATES
        ]
        salience_order = {slide_index: rank for rank, slide_index in enumerate(salience_slides, start=1)}

    rendered_slides = []
    primary_bgs = []
    for i, slide in enumerate(slides, start=1):
        formats = {}
        salience_index = salience_order.get(i)
        salience_total = len(salience_order) if salience_index is not None else None
        for target in valid_targets:
            fmt = _render_slide_format(slide_bgs[i - 1], hook, slide, brand, target,
                                       base, i, total, params,
                                       scene=scene, master_hash=master_hash,
                                       salience_index=salience_index,
                                       salience_total=salience_total)
            formats[target] = fmt
        primary_fmt = formats[primary_target]
        slide_theme = primary_fmt.get("theme") or params.get("theme", "dark")
        primary_bgs.append(primary_fmt["bg"])
        rendered_slide = {
            "index": i,
            "role": slide["role"],
            "template": slide["template"],
            "template_options": slide.get("_template_options", []),
            "headline": slide.get("headline") or _listicle_headline(slide),
            "sub": slide.get("sub", ""),
            "cta": slide.get("cta", ""),
            "source_slide": slide.get("source_slide"),
            "path": primary_fmt["path"],
            "formats": formats,
            "bg": primary_fmt["bg"],
            "pan": primary_fmt.get("pan"),
            "theme": slide_theme,
        }
        if carousel_format == "listicle":
            rendered_slide["items"] = [dict(item) for item in slide.get("items", [])]
            engagement = _slide_engagement_cta(hook, slide)
            if engagement:
                rendered_slide["engagement_cta"] = dict(engagement)
        rendered_slides.append(rendered_slide)

    return {
        "slides": rendered_slides,
        "bg": master_bg,
        "bg_master_hash": master_hash,
        "bgs": primary_bgs,
        "scene": scene,
        "theme": params.get("theme", "dark"),
        "carousel_format": carousel_format,
        "templates_required": True,
        "warnings": warnings,
    }
