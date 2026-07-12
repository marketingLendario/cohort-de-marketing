"""
carousel_copy_adapter.py — converte copy Will Binder em hooks[] de carrossel.

Uso:
  python3 carousel_copy_adapter.py copy.yaml -o hooks.yaml
  python3 carousel_copy_adapter.py copy.md

O caminho primário é YAML com `carousel_output`, conforme
`squads/copy/tasks/create-carousel.md`. Markdown é aceito apenas quando há
headings explícitos de slide; se a estrutura não for reconhecida, falha alto e
pede o YAML estruturado.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

import yaml


ROLE_MAP = {
    "cover": "hook",
    "capa": "hook",
    "hook": "hook",
    "capa/hook": "hook",
    "body": "body",
    "corpo": "body",
    "close": "cta",
    "closing": "cta",
    "fechamento": "cta",
    "fechamento/cta": "cta",
    "cta": "cta",
}
SLIDE_HEADING_RE = re.compile(
    r"^\s{0,3}#{1,6}\s*slide\s+(\d+)\s*(?:[—:-]\s*(.+?))?\s*$",
    re.IGNORECASE,
)
SECTION_HEADING_RE = re.compile(
    r"^\s{0,3}#{1,6}\s*(legenda|caption|link description|primeiro comentário|"
    r"primeiro comentario|first comment)\s*$",
    re.IGNORECASE,
)
YAML_BLOCK_RE = re.compile(r"```ya?ml\s*(.*?)```", re.IGNORECASE | re.DOTALL)
NUMBERED_ITEM_RE = re.compile(r"^\s*(\d{1,3})[\).\:-]?\s+(.+?)\s*$")
LISTICLE_ITEM_KEYS = ("items", "numbered_items", "list", "points", "bullets")
LISTICLE_TEMPLATES = {"item_banner", "item_card", "item_duo"}


def _slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "carousel"


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "\n".join(_text(item) for item in value if _text(item)).strip()
    if isinstance(value, dict):
        parts = []
        for key in ("hook_line", "body", "cta", "hashtags", "text"):
            if value.get(key):
                parts.append(_text(value[key]))
        return "\n\n".join(parts).strip()
    return str(value).strip()


def _list_text(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [_text(item) for item in value if _text(item)]
    if isinstance(value, tuple):
        return [_text(item) for item in value if _text(item)]
    text = _text(value)
    return [text] if text else []


def _normalize_role(raw_role: Any, index: int, total: int) -> str:
    role = str(raw_role or "").strip().lower()
    role = ROLE_MAP.get(role, role)
    if role in {"hook", "body", "cta"}:
        return role
    if index == 1:
        return "hook"
    if index == total:
        return "cta"
    raise ValueError(
        f"slide {index}: role {raw_role!r} não reconhecido; use cover/body/close no YAML"
    )


def _split_copy(copy_value: Any) -> tuple[str, str]:
    if isinstance(copy_value, dict):
        headline = _text(
            copy_value.get("headline")
            or copy_value.get("title")
            or copy_value.get("copy")
        )
        sub = _text(copy_value.get("sub") or copy_value.get("body"))
        if headline:
            return headline, sub
    text = _text(copy_value)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return "", ""
    return lines[0], "\n".join(lines[1:]).strip()


def _adapt_bullets(value: Any) -> list[dict]:
    if value is None:
        return []
    raw_items = value if isinstance(value, list) else [value]
    bullets = []
    for item in raw_items:
        if isinstance(item, dict):
            text = _text(item.get("text") or item.get("copy") or item.get("body"))
            if not text:
                continue
            bullet = {"text": text}
            for key in ("bold", "code", "emphasis"):
                vals = _list_text(item.get(key))
                if vals:
                    bullet[key] = vals
            bullets.append(bullet)
        else:
            text = _text(item)
            if text:
                bullets.append({"text": text})
    return bullets


def _card_from_dict(item: dict, index: int) -> dict | None:
    title = _text(item.get("title") or item.get("headline") or item.get("label"))
    description = _text(item.get("description") or item.get("body") or item.get("sub"))
    if not title and not description:
        return None
    card = {
        "kicker": _text(item.get("kicker")) or f"{index:02d}",
        "title": title or description,
    }
    if description and description != card["title"]:
        card["description"] = description
    if item.get("glyph"):
        card["glyph"] = _text(item.get("glyph"))
    if bool(item.get("highlight")):
        card["highlight"] = True
    return card


def _adapt_cards(value: Any) -> list[dict]:
    if value is None:
        return []

    if isinstance(value, dict):
        if isinstance(value.get("cards"), list):
            return _adapt_cards(value["cards"])
        pairs = []
        for key in ("before", "after", "antes", "depois", "left", "right", "com", "sem"):
            if value.get(key):
                pairs.append({"kicker": key, "title": key.upper(), "description": value[key]})
        if pairs:
            cards = []
            for idx, item in enumerate(pairs, start=1):
                card = _card_from_dict(item, idx)
                if card:
                    cards.append(card)
            return cards
        maybe = _card_from_dict(value, 1)
        return [maybe] if maybe else []

    raw_items = value if isinstance(value, list) else [value]
    cards = []
    for idx, item in enumerate(raw_items, start=1):
        if isinstance(item, dict):
            card = _card_from_dict(item, idx)
        else:
            text = _text(item)
            card = {"kicker": f"{idx:02d}", "title": text} if text else None
        if card:
            cards.append(card)
    return cards


def _adapt_callout(value: Any) -> dict | None:
    if not value:
        return None
    if isinstance(value, dict):
        text = _text(value.get("text") or value.get("body") or value.get("copy"))
        if not text:
            return None
        out = {"text": text}
        emphasis = _text(value.get("emphasis"))
        if emphasis:
            out["emphasis"] = emphasis
        return out
    text = _text(value)
    return {"text": text} if text else None


def _raw_listicle_items(slide: dict) -> tuple[str, Any] | None:
    for key in LISTICLE_ITEM_KEYS:
        value = slide.get(key)
        if value:
            return key, value
    return None


def _is_numbered_item(value: Any) -> bool:
    if isinstance(value, dict):
        return bool(value.get("number") or value.get("n"))
    return bool(NUMBERED_ITEM_RE.match(_text(value)))


def _has_listicle_shape(slides: list[dict]) -> bool:
    found = False
    total = len(slides)
    for pos, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            continue
        role = _normalize_role(slide.get("role"), pos, total)
        if role != "body":
            continue
        raw = _raw_listicle_items(slide)
        if not raw:
            continue
        key, value = raw
        raw_items = value if isinstance(value, list) else [value]
        numbered = [_is_numbered_item(item) for item in raw_items]
        if any(numbered):
            found = True
        else:
            continue
        if any(numbered) and not all(numbered):
            raise ValueError(
                f"slide {pos}: lista numerada ambígua; todos os itens precisam ter number"
            )
        rich_keys = {"cards", "comparison", "comparisons", "callout"}
        if key != "bullets":
            rich_keys.add("bullets")
        if any(slide.get(rich_key) for rich_key in rich_keys):
            raise ValueError(
                f"slide {pos}: listicle ambíguo; não misture items numerados com cards/bullets/callout"
            )
        template = _text(slide.get("template"))
        if template and template not in LISTICLE_TEMPLATES:
            raise ValueError(
                f"slide {pos}: template {template!r} não é compatível com listicle"
            )
    return found


def _split_item_link(text: str) -> tuple[str, str]:
    match = re.search(r"\s(?:→|->)\s*(\S+)\s*$", text)
    if not match:
        return text.strip(), ""
    return text[:match.start()].strip(), match.group(1).strip()


def _split_item_title_desc(text: str, *, slide_pos: int) -> tuple[str, str]:
    for sep in (" — ", " – ", " - ", ": "):
        if sep in text:
            title, desc = text.split(sep, 1)
            title = title.strip()
            desc = desc.strip()
            if title and desc:
                return title, desc
    raise ValueError(
        f"slide {slide_pos}: item numerado ambíguo; use `1. Título — descrição`"
    )


def _adapt_listicle_item(raw: Any, *, slide_pos: int) -> dict:
    if isinstance(raw, dict):
        number = _text(raw.get("number") or raw.get("n"))
        if not number:
            raise ValueError(f"slide {slide_pos}: item listicle sem number")
        title = _text(raw.get("title") or raw.get("headline") or raw.get("name"))
        desc = _text(
            raw.get("desc")
            or raw.get("description")
            or raw.get("body")
            or raw.get("copy")
        )
        if not title or not desc:
            raise ValueError(f"slide {slide_pos}: item listicle requer title e desc")
        item = {"number": int(number), "title": title, "desc": desc}
        for key in ("tagline", "link", "visual_metaphor", "emphasis_word"):
            raw_value = raw.get(key)
            if key == "link" and not raw_value:
                raw_value = raw.get("url")
            value = _text(raw_value)
            if value:
                item[key] = value
        return item

    match = NUMBERED_ITEM_RE.match(_text(raw))
    if not match:
        raise ValueError(f"slide {slide_pos}: item listicle precisa começar com número")
    number = int(match.group(1))
    body, link = _split_item_link(match.group(2))
    title, desc = _split_item_title_desc(body, slide_pos=slide_pos)
    item = {"number": number, "title": title, "desc": desc}
    if link:
        item["link"] = link
    return item


def _adapt_slide_shell(slide: dict, pos: int, total: int, next_action: str) -> dict:
    source_slide = int(slide.get("n") or slide.get("source_slide") or pos)
    role = _normalize_role(slide.get("role"), pos, total)
    headline, sub = _split_copy(
        slide.get("copy") or slide.get("headline") or slide.get("title")
    )
    if not sub and slide.get("sub"):
        sub = _text(slide.get("sub"))
    if not headline:
        raise ValueError(f"slide {pos}: copy/headline obrigatório")
    visual_slide = {
        "role": role,
        "headline": headline,
        "source_slide": source_slide,
    }
    if slide.get("kicker"):
        visual_slide["kicker"] = _text(slide.get("kicker"))
    if slide.get("emphasis_word"):
        visual_slide["emphasis_word"] = _text(slide.get("emphasis_word"))
    for key in ("template", "footer", "visual_metaphor", "object_position", "emphasis_style"):
        if slide.get(key):
            visual_slide[key] = _text(slide.get(key))
    paragraphs = _list_text(slide.get("paragraphs"))
    if paragraphs:
        visual_slide["paragraphs"] = paragraphs
    chips = _list_text(slide.get("chips") or slide.get("specs"))
    if chips:
        visual_slide["chips"] = chips
    if sub:
        visual_slide["sub"] = sub
    if role == "cta":
        cta = _text(slide.get("cta")) or next_action or headline
        visual_slide["cta"] = cta
    return visual_slide


def _adapt_engagement_cta(value: Any) -> dict | None:
    if not value:
        return None
    if not isinstance(value, dict):
        raise ValueError("engagement_cta deve ser objeto com action e reward")
    action = _text(value.get("action"))
    reward = _text(value.get("reward"))
    if not action or not reward:
        raise ValueError("engagement_cta requer action e reward")
    return {"action": action, "reward": reward}


def _listicle_slide_headline(items: list[dict]) -> str:
    if len(items) == 1:
        return items[0]["title"]
    return " + ".join(item["title"] for item in items)


def _chunk_items(items: list[dict], size: int = 2) -> list[list[dict]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def _adapt_listicle_slides(slides: list[dict], *, next_action: str,
                           engagement_cta: dict | None) -> list[dict]:
    total = len(slides)
    out_slides: list[dict] = []
    previous_number = 0
    seen_numbers: set[int] = set()
    for pos, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            raise ValueError(f"slide {pos}: esperado objeto YAML")
        shell = _adapt_slide_shell(slide, pos, total, next_action)
        if shell["role"] != "body":
            if shell["role"] == "cta":
                slide_engagement = _adapt_engagement_cta(slide.get("engagement_cta"))
                final_engagement = slide_engagement or engagement_cta
                if final_engagement:
                    shell["engagement_cta"] = final_engagement
            out_slides.append(shell)
            continue

        raw = _raw_listicle_items(slide)
        if not raw:
            raise ValueError(f"slide {pos}: listicle body precisa de lista numerada")
        _key, value = raw
        raw_items = value if isinstance(value, list) else [value]
        items = [_adapt_listicle_item(item, slide_pos=pos) for item in raw_items]
        for item in items:
            number = int(item["number"])
            if number in seen_numbers:
                raise ValueError(f"slide {pos}: number repetido {number}")
            if number <= previous_number:
                raise ValueError(
                    f"slide {pos}: numbers devem crescer; {number} veio após {previous_number}"
                )
            seen_numbers.add(number)
            previous_number = number
        for chunk in _chunk_items(items):
            body = dict(shell)
            if len(chunk) > 1:
                body.pop("template", None)
            body["headline"] = _listicle_slide_headline(chunk)
            body["items"] = chunk
            out_slides.append(body)
    if not seen_numbers:
        raise ValueError("listicle requer ao menos 1 item numerado")
    return out_slides


def _hook_id(source: dict, fallback: str) -> str:
    metadata = source.get("metadata") or {}
    formula = source.get("formula") or {}
    for value in (
        source.get("id"),
        metadata.get("id"),
        metadata.get("slug"),
        source.get("title"),
        fallback,
        formula.get("name"),
    ):
        if _text(value):
            return _slugify(_text(value))
    return "carousel"


def _adapt_structured(data: dict, *, hook_id: str | None = None,
                      fallback_id: str = "carousel") -> dict:
    source = data.get("carousel_output", data)
    if not isinstance(source, dict):
        raise ValueError("YAML inválido: esperado objeto `carousel_output`")
    slides = source.get("slides")
    if not isinstance(slides, list) or not slides:
        raise ValueError("YAML inválido: `carousel_output.slides` deve ser uma lista")
    if len(slides) < 3 or len(slides) > 10:
        raise ValueError("carrossel visual requer entre 3 e 10 slides")

    metadata = source.get("metadata") or {}
    caption_data = source.get("caption")
    caption = _text(caption_data)
    first_comment = _text(source.get("first_comment"))
    link_description = _text(source.get("link_description")) or first_comment
    next_action = _text(metadata.get("next_action")) or _text(
        caption_data.get("cta") if isinstance(caption_data, dict) else ""
    )
    raw_format = _text(source.get("carousel_format") or metadata.get("carousel_format")).lower()
    if raw_format and raw_format not in {"narrative", "listicle"}:
        raise ValueError(f"carousel_format inválido: {raw_format!r}")
    listicle_mode = raw_format == "listicle" or _has_listicle_shape(slides)
    engagement_cta = None
    if listicle_mode:
        engagement_cta = _adapt_engagement_cta(
            source.get("engagement_cta") or metadata.get("engagement_cta")
        )

    if listicle_mode:
        out_slides = _adapt_listicle_slides(
            slides, next_action=next_action, engagement_cta=engagement_cta
        )
    else:
        out_slides = []
        total = len(slides)
        for pos, slide in enumerate(slides, start=1):
            if not isinstance(slide, dict):
                raise ValueError(f"slide {pos}: esperado objeto YAML")
            visual_slide = _adapt_slide_shell(slide, pos, total, next_action)
            bullets = _adapt_bullets(
                slide.get("bullets") or slide.get("list") or slide.get("items") or slide.get("points")
            )
            if bullets:
                visual_slide["bullets"] = bullets
            cards = _adapt_cards(slide.get("cards") or slide.get("comparison") or slide.get("comparisons"))
            if cards:
                visual_slide["cards"] = cards
            callout = _adapt_callout(slide.get("callout"))
            if callout:
                visual_slide["callout"] = callout
            out_slides.append(visual_slide)

    hook = {
        "id": hook_id or _hook_id(source, fallback_id),
        "mode": "carousel",
        "headline": out_slides[0]["headline"],
        "caption": caption,
        "link_description": link_description,
        "slides": out_slides,
    }
    if listicle_mode:
        hook["carousel_format"] = "listicle"
    if first_comment:
        hook["first_comment"] = first_comment
    footer = _text(source.get("footer") or metadata.get("footer"))
    if footer:
        hook["footer"] = footer
    for key in ("material_family", "emphasis_style", "type_voice", "footer_style", "carousel_scene"):
        value = _text(source.get(key) or metadata.get(key))
        if value:
            hook[key] = value
    return {"hooks": [hook]}


def _extract_yaml_from_markdown(text: str) -> dict | None:
    for match in YAML_BLOCK_RE.finditer(text):
        block = match.group(1)
        try:
            data = yaml.safe_load(block)
        except yaml.YAMLError:
            continue
        if isinstance(data, dict) and ("carousel_output" in data or "slides" in data):
            return data
    return None


def _role_from_heading(raw: str, index: int, total: int | None = None) -> str:
    heading = (raw or "").strip().lower()
    for key, role in ROLE_MAP.items():
        if key in heading:
            return role
    if index == 1:
        return "hook"
    if total is not None and index == total:
        return "cta"
    return "body"


def _section_key(raw: str) -> str:
    raw = raw.lower()
    if raw in {"legenda", "caption"}:
        return "caption"
    if raw == "link description":
        return "link_description"
    return "first_comment"


def _parse_markdown_headings(text: str, *, hook_id: str | None = None,
                             fallback_id: str = "carousel") -> dict:
    sections = []
    current: dict | None = None
    for line in text.splitlines():
        slide_match = SLIDE_HEADING_RE.match(line)
        section_match = SECTION_HEADING_RE.match(line)
        if slide_match:
            current = {
                "kind": "slide",
                "n": int(slide_match.group(1)),
                "heading": slide_match.group(2) or "",
                "lines": [],
            }
            sections.append(current)
            continue
        if section_match:
            current = {
                "kind": _section_key(section_match.group(1)),
                "lines": [],
            }
            sections.append(current)
            continue
        if current is not None:
            current["lines"].append(line)

    slide_sections = [section for section in sections if section["kind"] == "slide"]
    if not slide_sections:
        raise ValueError(
            "Markdown não reconhecido: use headings `## Slide 1 — CAPA/HOOK` "
            "ou entregue o YAML `carousel_output` do create-carousel."
        )

    total = len(slide_sections)
    slides = []
    for pos, section in enumerate(sorted(slide_sections, key=lambda item: item["n"]), start=1):
        copy = _text("\n".join(section["lines"]))
        if not copy:
            raise ValueError(f"Markdown inválido: Slide {section['n']} está sem copy")
        slides.append({
            "n": section["n"],
            "role": _role_from_heading(section["heading"], pos, total),
            "copy": copy,
        })

    data = {"carousel_output": {"slides": slides}}
    for section in sections:
        if section["kind"] in {"caption", "link_description", "first_comment"}:
            data["carousel_output"][section["kind"]] = _text("\n".join(section["lines"]))

    return _adapt_structured(data, hook_id=hook_id, fallback_id=fallback_id)


def convert_copy_to_hooks(text: str, *, source_name: str = "carousel",
                          hook_id: str | None = None,
                          input_format: str | None = None) -> dict:
    fmt = (input_format or "").lower()
    fallback_id = Path(source_name).stem if source_name else "carousel"

    if fmt in {"yaml", "yml"}:
        data = yaml.safe_load(text)
        if not isinstance(data, dict):
            raise ValueError("YAML inválido: esperado objeto com `carousel_output`")
        return _adapt_structured(data, hook_id=hook_id, fallback_id=fallback_id)

    yaml_data = _extract_yaml_from_markdown(text)
    if yaml_data is not None:
        return _adapt_structured(yaml_data, hook_id=hook_id, fallback_id=fallback_id)

    if fmt in {"md", "markdown", ""}:
        return _parse_markdown_headings(text, hook_id=hook_id, fallback_id=fallback_id)

    raise ValueError(f"formato não suportado: {input_format!r}")


def convert_file(path: str, *, output_path: str | None = None) -> dict:
    src = Path(path)
    fmt = src.suffix.lower().lstrip(".")
    result = convert_copy_to_hooks(
        src.read_text(encoding="utf-8"),
        source_name=src.name,
        input_format=fmt,
    )
    rendered = yaml.safe_dump(result, sort_keys=False, allow_unicode=True)
    if output_path:
        Path(output_path).write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return result


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("copy", help="copy.md ou copy.yaml gerado pelo create-carousel")
    ap.add_argument("-o", "--output", help="arquivo hooks.yaml de saída")
    args = ap.parse_args(argv)

    try:
        convert_file(args.copy, output_path=args.output)
    except Exception as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
