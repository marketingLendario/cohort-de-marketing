"""
factory.py — orquestrador end-to-end do ads-creative-factory.

Consome um campaign.yaml (brand_id + lista de hooks ja ideados + params) e roda,
por hook:
  1. generate_best_of(N)        (alavancas 1,2,3 — style anchors, likeness, best-of-N)
  2. gate.evaluate em cada      (alavanca 5 — validacao programatica)
  3. seleciona o melhor candidato (menor slop / maior brand_adherence)
  4. [opcional] refine se abaixo do threshold (alavanca 6)
  5. compose_logo               (alavanca 4 — logo real na safe-zone)
  6. finish                     (alavanca 8 — upscale/sharpen/grain)
  7. make_formats               (alavanca 7 — 4:5/9:16/1:1 com safe-zones)
Salva manifest.json com prompts, scores, refs e paths de cada peca.

A IDEACAO (Fase 1) dos hooks e feita por um agente/LLM e entregue no campaign.yaml.
"""
from __future__ import annotations
import sys, json, argparse, time, os, re
import yaml
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import alib
import generate as gen
import gate as gate_mod
import compose as compose_mod
import refine as refine_mod
import formats as formats_mod
import finish as finish_mod
import variation as var_mod
import saturation as sat_mod
import review as review_mod
import typeset as typeset_mod
import formats_hybrid as fhyb
import archetype_render as arch_mod
import carousel as carousel_mod
from catalog_loader import FACTORY_VERSION, CatalogError, resolve_catalog


SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$")


def _validate_segment(value: object, label: str) -> str:
    normalized = str(value or "")
    if not SAFE_SEGMENT.fullmatch(normalized):
        raise ValueError(f"{label} invalido: use apenas letras, numeros, hifen e underscore")
    return normalized


def _resolve_campaign_catalog(campaign_path: str, cfg: dict, params: dict):
    raw_paths = cfg.get("extension_packs", params.get("extension_packs", [])) or []
    if not isinstance(raw_paths, list) or not all(isinstance(item, str) for item in raw_paths):
        raise ValueError("extension_packs precisa ser uma lista de paths relativos ao projeto")
    project_root = Path(campaign_path).expanduser().resolve().parent
    resolved = []
    for raw in raw_paths:
        relative = Path(raw)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("extension_packs aceita somente paths relativos confinados ao projeto")
        try:
            candidate = (project_root / relative).resolve(strict=True)
            candidate.relative_to(project_root)
        except (OSError, ValueError) as exc:
            raise ValueError("extension pack inexistente ou fora da raiz autorizada do projeto") from exc
        resolved.append(candidate)
    return resolve_catalog(resolved), resolved


def _normalize_hook_mechanisms(hooks: list[dict], catalog) -> tuple[list[dict], list[str]]:
    normalized, warnings = [], []
    for original in hooks:
        hook = dict(original)
        visual_id = hook.get("visual_mechanism_id")
        legacy_id = hook.get("mechanism")
        if not visual_id and legacy_id:
            visual_id = legacy_id
            hook["_mechanism_was_legacy"] = True
            warnings.append(
                f"hook {hook.get('id', '<unknown>')}: mechanism legado adaptado para visual_mechanism_id"
            )
        if visual_id:
            try:
                visual = catalog.get_entity("mechanisms", str(visual_id))
            except CatalogError:
                if not hook.get("_mechanism_was_legacy"):
                    raise
                visual = next(
                    item for item in catalog.list_entities("mechanisms")
                    if item["kind"] in {"visual", "hybrid"} and not item.get("needs_likeness")
                )
                warnings.append(
                    f"hook {hook.get('id', '<unknown>')}: mechanism legado {visual_id!r} "
                    f"nao existe no catalogo; usando {visual['id']!r}"
                )
                visual_id = visual["id"]
            if visual["kind"] not in {"visual", "hybrid"}:
                raise ValueError(f"visual_mechanism_id {visual_id!r} nao e visual nem hybrid")
            hook["visual_mechanism_id"] = str(visual_id)
        copy_id = hook.get("copy_mechanism_id")
        if copy_id:
            copy = catalog.get_entity("mechanisms", str(copy_id))
            if copy["kind"] not in {"copy", "hybrid"}:
                raise ValueError(f"copy_mechanism_id {copy_id!r} nao e copy nem hybrid")
        normalized.append(hook)
    return normalized, warnings


def _assert_catalog_snapshot(work: Path, catalog, has_extensions: bool) -> None:
    manifest_path = work / "manifest.json"
    if not manifest_path.is_file():
        return
    try:
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("manifesto anterior invalido; nao e seguro retomar o lote") from exc
    previous_hash = previous.get("catalog_hash")
    if previous_hash and previous_hash != catalog.catalog_hash:
        raise ValueError("catalog_hash divergiu do lote existente; crie uma nova versao da campanha")
    if has_extensions and not previous_hash:
        raise ValueError("lote anterior nao registra catalog_hash; crie uma nova versao da campanha")


def _gate_profile(catalog, archetype: dict | None = None, theme: str = "dark") -> dict:
    catalog = catalog or resolve_catalog()
    profile_id = (archetype or {}).get("gate_profile") or f"builtin.default-{theme}"
    return dict(catalog.get_entity("gate_profiles", profile_id))


def _select_best(candidates: list[dict], brand: dict, profile: dict | None = None) -> dict:
    """candidates: [{path, ...}]. Avalia no gate e devolve o melhor + scores."""
    scored = []
    for c in candidates:
        if not c.get("ok"):
            continue
        gr = gate_mod.evaluate(c["path"], brand, profile=profile)
        scored.append({**c, "gate": gr})
    if not scored:
        return {}
    # ordena: verdict (pass>warn>fail), depois maior brand_adherence, depois menor slop
    rank = {"pass": 2, "warn": 1, "fail": 0}
    scored.sort(key=lambda s: (rank[s["gate"]["verdict"]],
                               s["gate"]["brand_adherence_pct"],
                               -s["gate"]["ai_slop_score"]), reverse=True)
    return scored[0]


def _campaign_concurrency(params: dict) -> int:
    raw = os.environ.get("ACF_CONCURRENCY", params.get("concurrency", 3))
    try:
        return max(1, int(raw))
    except (TypeError, ValueError):
        return 3


def _unique_job_id(base_id: str, used_ids: set[str]) -> str:
    job_id = str(base_id)
    if job_id not in used_ids:
        used_ids.add(job_id)
        return job_id

    suffix = 2
    while f"{job_id}-{suffix}" in used_ids:
        suffix += 1
    unique = f"{job_id}-{suffix}"
    used_ids.add(unique)
    return unique


def _job_token(value: object) -> str:
    """Converte IDs namespaced em segmentos de arquivo seguros e determinísticos."""
    token = re.sub(r"[^A-Za-z0-9_-]+", "-", str(value or "")).strip("-_")
    return _validate_segment(token, "job token")


def render_job(hk: dict, brand: dict, params: dict, work: Path, catalog=None) -> dict:
    """Renderiza um job isolado: todos os writes ficam sob work / id."""
    catalog = catalog or params.get("_resolved_catalog") or resolve_catalog()
    n = params.get("best_of", 2)
    fmt = params.get("base_format", "feed")
    do_refine = params.get("refine", False)
    do_finish = params.get("finish", True)
    targets = params.get("formats", ["feed"])
    surface = params.get("logo_surface", "dark")
    logo_variant = params.get("logo_variant", "full")
    text_mode = params.get("text_mode", "hybrid")

    hid = _validate_segment(hk["id"], "hook.id")
    base = str(work / hid)
    entry = {"id": hid, "mechanism": hk.get("mechanism"),
             "copy_mechanism_id": hk.get("copy_mechanism_id"),
             "visual_mechanism_id": hk.get("visual_mechanism_id"),
             "headline": hk.get("headline"),
             "axes": hk.get("_axes"),
             # copy de ANÚNCIO (Meta), não vai na imagem — viaja no manifest p/ ad-midas
             "caption": hk.get("caption"),
             "link_description": hk.get("link_description")}

    if carousel_mod.is_carousel_hook(hk, params):
        targets, warnings = carousel_mod.filter_carousel_targets(hk.get("formats") or targets)
        for warning in warnings:
            print(f"[carousel] {hid}: {warning}", file=sys.stderr)
        if not targets:
            entry.update({"mode": "carousel", "status": "SKIPPED_NO_VALID_FORMATS",
                          "warnings": warnings})
            return entry
        carousel_hook = dict(hk)
        carousel_hook["_carousel_params"] = params
        res = carousel_mod.render_carousel(carousel_hook, brand, base, targets)
        warnings = warnings + res.get("warnings", [])
        sequence_gate = carousel_mod.evaluate_sequence(
            res, brand, theme=res.get("theme", "dark")
        )
        gate_res = sequence_gate["slide_gates"][0]["gate"]
        entry.update({"mode": "carousel", "bg": res.get("bg"), "scene": res.get("scene"),
                      "slides": res.get("slides", []), "gate": gate_res,
                      "carousel_gate": sequence_gate.get("verdict"),
                      "carousel_sequence": sequence_gate,
                      "warnings": warnings})
        entry["status"] = (
            "OK" if sequence_gate.get("verdict") == "pass" else "FLAGGED_REVIEW"
        )
        return entry

    if hk.get("_archetype"):
        # EIXO PRIMÁRIO: roteia a geração pelo arquétipo (a espécie da peça)
        arch = hk["_archetype"]
        arch_mode = arch.get("renderer_mode") or arch.get("mode")
        res = arch_mod.render_archetype(
            arch, hk, brand, base, fmt=fmt, formats=targets,
            persona=hk.get("_persona_data"), arch_index=hk.get("_arch_index", 0),
            catalog=catalog,
        )
        final = res.get("final")
        if not final:
            entry.update({"archetype": arch["id"], "status": "FAILED_GENERATION",
                          "error": res.get("error")})
            return entry
        arch_theme = "native" if arch_mode == "ugc" else arch.get("theme", "dark")
        profile = _gate_profile(catalog, arch, arch_theme)
        gate_res = gate_mod.evaluate(final, brand, theme=arch_theme, profile=profile)
        rv = review_mod.review_final(final, brand, logo_variant=logo_variant,
                                     text_margin_safe=True, theme=arch_theme,
                                     gate_result=gate_res)
        entry.update({"archetype": arch["id"], "persona": hk.get("_persona"),
                      "selected_entities": {
                          "archetype_id": arch["id"],
                          "copy_mechanism_id": hk.get("copy_mechanism_id"),
                          "visual_mechanism_id": hk.get("visual_mechanism_id"),
                          "ugc_scene_id": hk.get("_ugc_scene_id"),
                          "mockup_device_id": hk.get("_mockup_device_id"),
                          "didactic_style_id": hk.get("_didactic_style_id"),
                          "gate_profile_id": profile["id"],
                      },
                      "formats": res.get("formats", {}), "gate": gate_res, "final": final,
                      "review": rv, "status": "OK" if rv["verdict"] == "pass" else "FLAGGED_REVIEW"})
        return entry

    if text_mode == "hybrid":
        # FUNDO sem texto (backdrop texturizado + zona reservada), gerado no
        # formato MAIS ALTO para o reframe so cortar; depois re-typeset por formato.
        layout_id = hk.get("_layout", "editorial_top")
        gen_fmt = max(targets, key=lambda t: brand["formats"][t]["h"])
        bg = base + "__bg.png"
        bgp = gen.build_bg_prompt(brand, hk.get("_core", ""), hk.get("_axes", {}),
                                  var_mod.backdrop_fragment(hk.get("_backdrop", "")),
                                  hk.get("_reserve", ""), layout_id, gen_fmt)
        r = alib.codex_image(bgp, bg)
        if not r["ok"]:
            entry["status"] = "FAILED_GENERATION"
            return entry
        fmts = fhyb.make_hybrid_formats(bg, hk, brand, targets, base, layout=layout_id,
                                        logo_variant=logo_variant, surface=surface, do_finish=do_finish)
        base_final = next((f["path"] for f in fmts if f["target"] == fmt), fmts[0]["path"])
        gate_res = gate_mod.evaluate(base_final, brand, profile=_gate_profile(catalog))
        rv = review_mod.review_final(base_final, brand, logo_variant=logo_variant,
                                     text_margin_safe=True, gate_result=gate_res)
        entry.update({"bg": bg, "layout": layout_id, "backdrop": hk.get("_backdrop"),
                      "gate": gate_res, "final": base_final, "formats": fmts, "review": rv,
                      "status": "OK" if rv["verdict"] == "pass" else "FLAGGED_REVIEW"})
        return entry

    if do_refine:
        rf = refine_mod.refine(brand, hk, base + ".png", fmt=fmt,
                               max_iter=params.get("max_iter", 3))
        chosen_path = rf["final"]; entry["refine"] = rf["history"]
        gate_res = rf.get("gate") or (gate_mod.evaluate(chosen_path, brand) if chosen_path else None)
    else:
        cands = gen.generate_best_of(brand, hk, base, n=n, fmt=fmt)
        best = _select_best(cands, brand, _gate_profile(catalog))
        chosen_path = best.get("path"); gate_res = best.get("gate")
        entry["candidates"] = [{"path": c.get("path"), "ok": c.get("ok")} for c in cands]
        entry["prompt"] = cands[0].get("prompt") if cands else None
        entry["refs_used"] = cands[0].get("refs_used") if cands else None

    if not chosen_path:
        entry["status"] = "FAILED_GENERATION"
        return entry

    entry["gate"] = gate_res
    # 5. logo real (opcional para marcas sem asset confirmado)
    logoed = base + "__logo.png"
    if alib.has_logo_assets(brand):
        compose_mod.compose_logo(chosen_path, logoed, variant=logo_variant, surface=surface)
    else:
        Image.open(chosen_path).save(logoed)
    entry["with_logo"] = logoed
    # 6. finish
    final = logoed
    if do_finish:
        final = base + "__final.png"
        finish_mod.finish(logoed, final, target_w=brand["formats"][fmt]["w"])
    entry["final"] = final
    # Fase 7: REVISAO DA PECA FINAL (programatica — logo/bleed/gate-na-final)
    rv = review_mod.review_final(final, brand, logo_variant=logo_variant,
                                 text_margin_safe=(text_mode == "hybrid"))
    entry["review"] = rv
    # 8. multi-formato
    fmts = formats_mod.make_formats(final, brand, targets, str(work))
    entry["formats"] = fmts
    # peca so e "OK" se passou na revisao final; senao fica sinalizada p/ olho humano
    entry["status"] = "OK" if rv["verdict"] == "pass" else "FLAGGED_REVIEW"
    return entry


def _render_jobs_ordered(jobs: list[dict], brand: dict, params: dict, work: Path,
                         concurrency: int, catalog=None) -> list[dict]:
    render_params = params if catalog is None else {**params, "_resolved_catalog": catalog}

    def failed_entry(i: int, error: Exception) -> dict:
        return {"id": jobs[i]["id"],
                "status": "FAILED_GENERATION",
                "error": f"{type(error).__name__}: {error}"}

    if concurrency == 1:
        entries = []
        for i, hk in enumerate(jobs):
            try:
                entries.append(render_job(hk, brand, render_params, work))
            except Exception as exc:
                entries.append(failed_entry(i, exc))
        return entries

    entries = [None] * len(jobs)
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = {pool.submit(render_job, hk, brand, render_params, work): i
                   for i, hk in enumerate(jobs)}
        for fut in as_completed(futures):
            i = futures[fut]
            try:
                entries[i] = fut.result()
            except Exception as exc:
                entries[i] = failed_entry(i, exc)
    return entries


def run_campaign(campaign_path: str) -> dict:
    with open(campaign_path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    if not isinstance(cfg, dict):
        raise ValueError("campaign.yaml precisa conter um objeto")
    params = cfg.get("params", {})
    if not isinstance(params, dict):
        raise ValueError("params precisa ser um objeto")
    catalog, extension_paths = _resolve_campaign_catalog(campaign_path, cfg, params)
    expected_catalog_hash = params.get("catalog_hash_expected")
    if expected_catalog_hash and expected_catalog_hash != catalog.catalog_hash:
        raise ValueError("catalog_hash esperado diverge do catalogo resolvido; crie uma nova versao do lote")
    hooks, compatibility_warnings = _normalize_hook_mechanisms(cfg.get("hooks", []), catalog)
    cfg = {**cfg, "hooks": hooks}
    # The campaign identifier is descriptive only; identity is loaded solely
    # from the explicitly selected pack.
    brand = alib.load_brand(cfg.get("brand_id"))

    # self-bootstrap somente quando o pack declara logo; DESIGN.md pode nao ter asset.
    if alib.has_logo_assets(brand) and not (alib.OUT_DIR / "brand_assets" / "logo_icon-dark.png").exists():
        import prepare_assets
        prepare_assets.prepare(brand)

    slug = _validate_segment(cfg.get("campaign", "campaign"), "campaign")
    for hook in cfg.get("hooks", []):
        _validate_segment(hook.get("id"), "hook.id")
    work = alib.OUT_DIR / slug
    _assert_catalog_snapshot(work, catalog, bool(extension_paths))
    work.mkdir(parents=True, exist_ok=True)

    catalog_contract = catalog.to_dict()
    manifest = {
        "campaign": slug, "brand": brand["name"], "params": params,
        "factory_version": FACTORY_VERSION, "catalog_hash": catalog.catalog_hash,
        "extension_packs": catalog_contract["packs"],
        "compatibility_warnings": compatibility_warnings,
        "hooks": [], "ts": int(time.time()),
    }

    # --- amarração B: expande cada hook em jobs concretos via eixos + anti-saturação ---
    variants = params.get("variants_per_hook", 1)
    text_mode = params.get("text_mode", "hybrid")   # 'hybrid' (vetor) | 'diffusion'
    primary_axis = params.get("primary_axis", "mechanism")   # 'archetype' | 'mechanism'
    window = _validate_segment(params.get("saturation_window", slug), "saturation_window")
    used = sat_mod.load_used(window)
    layouts = var_mod.load_layouts(catalog)
    backdrops = var_mod.axis_values("backdrop", catalog)
    archs = arch_mod.load_archetypes(catalog)
    selected_archetypes = params.get("archetypes") or []
    if selected_archetypes:
        selected = set(selected_archetypes)
        archs = [arch for arch in archs if arch.get("id") in selected]
        if not archs:
            raise ValueError("params.archetypes nao corresponde a nenhum arquetipo conhecido")
    persona_pool = params.get("personas") or []
    if not isinstance(persona_pool, list):
        raise ValueError("params.personas precisa ser uma lista de packs ou ids explicitamente declarados")
    jobs, jobi, arch_count, job_ids = [], 0, {}, set()
    for hk in cfg["hooks"]:
        if carousel_mod.is_carousel_hook(hk, params):
            carousel_mod.validate_carousel_hook(hk)
            job = dict(hk)
            job["id"] = _unique_job_id(hk["id"], job_ids)
            jobs.append(job)
            continue
        if hk.get("visual_recipe") and variants <= 1 and text_mode != "hybrid" and primary_axis != "archetype":
            job = dict(hk)
            job["id"] = _unique_job_id(hk["id"], job_ids)
            jobs.append(job); continue            # modo manual (recipe explícito, difusão)
        mech = hk.get("visual_mechanism_id") or hk.get("mechanism", "")
        core = (var_mod.mechanism_core(mech, catalog) or
                hk.get("visual_recipe", "") or "A single hero element")
        used_axes = {"|".join(c.split("|")[1:]) for c in used if c.startswith(mech + "|")}
        sels = var_mod.sample_diverse(variants, used=used_axes, catalog=catalog)
        for sel in sels:
            job = dict(hk)
            if hk.get("layout"):
                lay = next((l for l in layouts if l["id"] == hk["layout"]), layouts[jobi % len(layouts)])
            else:
                lay = layouts[jobi % len(layouts)]
            job["_layout"] = lay["id"]; job["_reserve"] = lay["reserve"]
            job["_backdrop"] = hk.get("backdrop") or backdrops[jobi % len(backdrops)]
            job["_core"] = core
            job["visual_recipe"] = var_mod.compose_recipe(core, sel, catalog)
            job["_axes"] = sel
            if primary_axis == "archetype":
                # EIXO PRIMÁRIO: arquétipo distinto por job (a "espécie" da peça)
                arch = archs[jobi % len(archs)]
                compatible = arch.get("compatible_mechanisms", ["*"])
                if mech and "*" not in compatible and mech not in compatible:
                    if not hk.get("_mechanism_was_legacy") or not compatible:
                        raise ValueError(f"arquetipo {arch['id']} nao e compativel com mecanismo {mech}")
                    adapted_mechanism = compatible[0]
                    job["visual_mechanism_id"] = adapted_mechanism
                    job["_core"] = var_mod.mechanism_core(adapted_mechanism, catalog) or core
                    job["visual_recipe"] = var_mod.compose_recipe(job["_core"], sel, catalog, arch["id"])
                job["_archetype"] = arch
                selected_persona = persona_pool[jobi % len(persona_pool)] if persona_pool else None
                job["_persona"] = selected_persona
                if selected_persona is not None:
                    try:
                        job["_persona_data"] = alib.load_persona(selected_persona, brand)
                    except (KeyError, OSError, ValueError, alib.PackLoadError) as exc:
                        raise ValueError(f"persona explicita invalida: {selected_persona} ({exc})") from exc
                ai = arch_count.get(arch["id"], 0)          # variacao INTERNA do arquetipo
                job["_arch_index"] = ai
                internal = arch_mod.resolve_internal_selection(
                    arch, catalog, ai, job.get("_persona_data")
                )
                explicit_internal = {
                    "ugc_scene_id": ("ugc_scenes", None, "ugc"),
                    "mockup_device_id": ("variations", "mockup_device", "mockup"),
                    "didactic_style_id": ("variations", "didactic_style", "didactic"),
                }
                arch_mode = arch.get("renderer_mode") or arch.get("mode")
                for selector, (group, expected_axis, expected_mode) in explicit_internal.items():
                    requested = job.get(selector)
                    if not requested or arch_mode != expected_mode:
                        continue
                    entity = catalog.get_entity(group, str(requested))
                    if expected_axis and entity.get("axis") != expected_axis:
                        raise ValueError(f"{selector} {requested!r} nao pertence ao eixo {expected_axis}")
                    internal[selector] = str(requested)
                for key, value in internal.items():
                    job[f"_{key}"] = value
                arch_count[arch["id"]] = ai + 1
                job["id"] = _unique_job_id(
                    f"{hk['id']}-{_job_token(arch['id'])}-{ai}", job_ids
                )
                used.add(f"{arch['id']}|{mech}|{sel['material']}")
            else:
                raw_id = hk["id"] if variants <= 1 else f"{hk['id']}-{sel['material']}"
                job["id"] = _unique_job_id(raw_id, job_ids)
                used.add(sat_mod.combo_key(mech, sel))
            jobs.append(job); jobi += 1
    sat_mod.save_used(window, used)

    manifest["hooks"].extend(_render_jobs_ordered(
        jobs, brand, params, work, _campaign_concurrency(params), catalog))

    man_path = work / "manifest.json"
    with open(man_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    if params.get("promote_anchors", False):
        try:
            import anchors as _anchor_lib
            manifest["anchors_promoted"] = _anchor_lib.promote_from_manifest(str(man_path))
        except Exception as e:
            manifest["anchors_promoted_error"] = str(e)
    manifest["_manifest_path"] = str(man_path)
    # entrega: separa SÓ os finais aprovados numa pasta limpa (evita subir intermediário)
    try:
        import collect_finals
        manifest["delivery"] = collect_finals.collect(str(work))
    except Exception as e:
        manifest["delivery_error"] = str(e)
    return manifest


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("campaign", help="caminho do campaign.yaml")
    a = ap.parse_args()
    alib._resolve_out_dir(require_explicit=True)
    m = run_campaign(a.campaign)
    ok = sum(1 for h in m["hooks"] if h.get("status") == "OK")
    print(f"\n=== {m['campaign']} — {ok}/{len(m['hooks'])} hooks OK ===")
    for h in m["hooks"]:
        g = h.get("gate") or {}
        print(f"  {h['id']:6s} {h.get('status'):20s} "
              f"verdict={g.get('verdict','-'):5s} slop={g.get('ai_slop_score','-')} "
              f"brand={g.get('brand_adherence_pct','-')}")
    print("manifest:", m["_manifest_path"])
