"""
collect_finals.py — separa SÓ as versões finais numa pasta limpa de entrega.

A pasta out/{campaign}/ acumula intermediários (__bg/__ts/__logo/__edit/__photo/.last).
Este passo lê o manifest e copia apenas os finais aprovados para:

  out/{campaign}/final/
    ├── feed/   {id}.png          (só status OK)
    ├── story/  {id}.png
    ├── square/ {id}.png
    ├── legendas.md               (headline + caption + link_description por peça)
    ├── manifest.json             (cópia)
    └── _sheet.png                (cópia, se existir)

Idempotente: recria final/ do zero a cada chamada.
"""
from __future__ import annotations
import json, shutil
from pathlib import Path


def _ordered_slides(slides: list[dict]) -> list[dict]:
    return sorted(slides, key=lambda slide: int(slide.get("index", 0)))


def _copy_carousel(h: dict, final: Path) -> int:
    copied = 0
    hid = h.get("id", "?")
    for slide in _ordered_slides(h.get("slides") or []):
        index = int(slide.get("index", 0))
        if index <= 0:
            continue
        for fmt, spec in (slide.get("formats") or {}).items():
            raw_path = (spec or {}).get("path")
            if not raw_path:
                continue
            src = Path(raw_path)
            if not src.exists():
                continue
            dst_dir = final / "carousel" / hid / fmt
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_dir / f"{index:02d}.png")
            copied += 1
    return copied


def _append_single_legenda(lines: list[str], h: dict) -> None:
    lines.append(f"## {h['id']}")
    if h.get("headline"):
        lines.append(f"**Headline (na imagem):** {h['headline']}")
    if h.get("caption"):
        lines.append(f"\n**Legenda (primary text):**\n\n{h['caption']}\n")
    if h.get("link_description"):
        lines.append(f"**Link description:** {h['link_description']}")
    lines.append("\n---\n")


def _append_carousel_legenda(lines: list[str], h: dict) -> None:
    lines.append(f"## {h['id']} — Carrossel")
    if h.get("caption"):
        lines.append(f"\n**Legenda (primary text):**\n\n{h['caption']}\n")
    if h.get("link_description"):
        lines.append(f"**Link description:** {h['link_description']}")
    lines.append("")
    lines.append("**Slides (ordem):**")
    for slide in _ordered_slides(h.get("slides") or []):
        role = slide.get("role", "?")
        headline = slide.get("headline") or ""
        lines.append(f"{int(slide.get('index', 0)):02d}. {role} — {headline}")
    lines.append("\n---\n")


def collect(campaign_dir) -> dict:
    work = Path(campaign_dir)
    man_path = work / "manifest.json"
    if not man_path.exists():
        return {"ok": False, "error": f"manifest ausente em {work}"}
    man = json.loads(man_path.read_text())

    final = work / "final"
    if final.exists():
        shutil.rmtree(final)
    final.mkdir(parents=True)

    copied, skipped, legendas = 0, [], []
    for h in man.get("hooks", []):
        hid = h.get("id", "?")
        if h.get("status") != "OK":                 # só a SELEÇÃO final aprovada
            skipped.append(hid)
            continue
        if h.get("slides"):
            copied += _copy_carousel(h, final)
            legendas.append(h)
            continue
        fmts = h.get("formats") or {}
        for fmt in fmts:
            sp = work / f"{hid}__{fmt}.png"          # convenção de nomes (robusto)
            if not sp.exists():
                continue
            dst_dir = final / fmt
            dst_dir.mkdir(exist_ok=True)
            shutil.copy2(sp, dst_dir / f"{hid}.png")
            copied += 1
        legendas.append(h)

    # legendas.md — copy de anúncio por peça, pronta pra colar no Meta
    lines = [f"# Legendas — {man.get('campaign', work.name)}", ""]
    for h in legendas:
        if h.get("slides"):
            _append_carousel_legenda(lines, h)
        else:
            _append_single_legenda(lines, h)
    (final / "legendas.md").write_text("\n".join(lines))

    shutil.copy2(man_path, final / "manifest.json")
    sheet = work / "_sheet.png"
    if sheet.exists():
        shutil.copy2(sheet, final / "_sheet.png")

    return {"ok": True, "final_dir": str(final), "copied": copied,
            "selected": len(legendas), "skipped": skipped}


if __name__ == "__main__":
    import sys
    d = sys.argv[1] if len(sys.argv) > 1 else "out"
    r = collect(d)
    print(json.dumps(r, ensure_ascii=False, indent=2))
