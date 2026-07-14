from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import yaml
from PIL import Image


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import archetype_render  # noqa: E402
import doctor  # noqa: E402
import factory  # noqa: E402
import gate  # noqa: E402
from catalog_loader import resolve_catalog  # noqa: E402


def manifest() -> dict:
    return {
        "schema_version": "1.0.0", "pack_type": "creative-extension",
        "id": "acme-extension", "version": "1.0.0", "namespace": "acme",
        "min_factory_version": "2.2.0",
        "entities": {
            "archetypes": [{
                "id": "acme.editorial", "label": "Editorial Acme",
                "renderer_mode": "hybrid", "theme": "dark", "formats": ["feed"],
                "required_fields": ["headline"], "compatible_mechanisms": ["acme.proof"],
                "internal_variants": ["material"], "gate_profile": "acme.default",
                "needs_persona": False,
            }],
            "mechanisms": [{
                "id": "acme.proof", "kind": "visual", "label": "Prova Acme",
                "psych": "evidência", "core": "um objeto claro de prova",
                "required_fields": [], "prohibited_claims": [],
                "compatible_archetypes": ["acme.editorial"], "formats": ["feed"],
                "needs_likeness": False,
            }],
            "ugc_scenes": [{
                "id": "acme.desk", "label": "Mesa real", "setting": "mesa doméstica",
                "shot": "foto vertical de celular", "lighting": "luz de janela",
                "props": ["notebook"], "authenticity_guards": ["espontâneo"],
                "negative_guards": ["estúdio"], "formats": ["story"],
                "needs_persona": False,
            }],
            "variations": [
                {"id": "acme.mockup", "axis": "mockup_device", "fragment": "tablet em uma mesa real",
                 "compatible_archetypes": ["mockup_product"], "locks": []},
                {"id": "acme.didactic", "axis": "didactic_style", "fragment": "comparação editorial",
                 "compatible_archetypes": ["didactic_compare"], "locks": []},
            ],
            "references": [],
            "gate_profiles": [{
                "id": "acme.default", "label": "Gate Acme",
                "thresholds": {"min_contrast": 4.5},
                "human_review_required": True, "likeness_gate_required": True,
            }],
        },
        "assets": {"files": []},
        "rights": {
            "redistributable": False, "notice": "Fixture sintética",
            "licenses": [{
                "id": "project-use", "name": "Project use", "spdx": "LicenseRef-Test",
                "redistributable": False, "notice": "Fixture sintética",
            }],
        },
    }


class FactoryCatalogRuntimeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.pack = self.root / "creative-factory" / "packs" / "acme-extension"
        self.pack.mkdir(parents=True)
        (self.pack / "pack.json").write_text(json.dumps(manifest()), encoding="utf-8")
        self.out = self.root / "out"
        self.campaign = self.root / "campaign.yaml"
        self.campaign.write_text(yaml.safe_dump({
            "campaign": "catalog-smoke",
            "brand_id": "synthetic-brand",
            "extension_packs": ["creative-factory/packs/acme-extension"],
            "params": {
                "primary_axis": "archetype", "archetypes": ["acme.editorial"],
                "variants_per_hook": 1, "formats": ["feed"], "base_format": "feed",
                "concurrency": 1,
            },
            "hooks": [{"id": "h1", "mechanism": "visual_metaphor_object", "headline": "Prova clara"}],
        }, sort_keys=False), encoding="utf-8")
        self.brand = {
            "name": "Synthetic Brand", "formats": {"feed": {"w": 1080, "h": 1350, "aspect": "4:5"}},
            "assets": {"files": []}, "palette": {"accent": "#C9B298"},
        }

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_campaign_persists_catalog_contract_and_legacy_adapter(self) -> None:
        captured: dict = {}

        def fake_render(jobs, _brand, _params, _work, _concurrency, catalog):
            captured["jobs"] = jobs
            captured["hash"] = catalog.catalog_hash
            return [{"id": jobs[0]["id"], "status": "OK", "selected_entities": {
                "archetype_id": jobs[0]["_archetype"]["id"],
                "visual_mechanism_id": jobs[0]["visual_mechanism_id"],
            }}]

        with (
            mock.patch.object(factory.alib, "OUT_DIR", self.out),
            mock.patch.object(factory.alib, "load_brand", return_value=self.brand),
            mock.patch.object(factory.alib, "has_logo_assets", return_value=False),
            mock.patch.object(factory.sat_mod, "load_used", return_value=set()),
            mock.patch.object(factory.sat_mod, "save_used"),
            mock.patch.object(factory, "_render_jobs_ordered", side_effect=fake_render),
        ):
            result = factory.run_campaign(str(self.campaign))

        self.assertEqual(result["factory_version"], "2.2.0")
        self.assertEqual(result["catalog_hash"], captured["hash"])
        self.assertEqual(result["extension_packs"][0]["id"], "acme-extension")
        self.assertIn("mechanism legado", result["compatibility_warnings"][0])
        self.assertEqual(captured["jobs"][0]["visual_mechanism_id"], "acme.proof")
        self.assertEqual(captured["jobs"][0]["_archetype"]["id"], "acme.editorial")
        self.assertNotIn(".", captured["jobs"][0]["id"])
        self.assertIn("acme-editorial", captured["jobs"][0]["id"])
        persisted = json.loads((self.out / "catalog-smoke" / "manifest.json").read_text())
        self.assertEqual(persisted["catalog_hash"], result["catalog_hash"])

    def test_retry_refuses_catalog_hash_drift_before_render(self) -> None:
        first_catalog = resolve_catalog([self.pack])
        work = self.out / "catalog-smoke"
        work.mkdir(parents=True)
        (work / "manifest.json").write_text(json.dumps({
            "campaign": "catalog-smoke", "catalog_hash": first_catalog.catalog_hash,
        }), encoding="utf-8")
        changed = manifest()
        changed["entities"]["mechanisms"][0]["core"] = "uma prova materialmente diferente"
        (self.pack / "pack.json").write_text(json.dumps(changed), encoding="utf-8")
        with (
            mock.patch.object(factory.alib, "OUT_DIR", self.out),
            mock.patch.object(factory.alib, "load_brand", return_value=self.brand),
            mock.patch.object(factory.alib, "has_logo_assets", return_value=False),
            mock.patch.object(factory, "_render_jobs_ordered") as render,
        ):
            with self.assertRaisesRegex(ValueError, "catalog_hash divergiu"):
                factory.run_campaign(str(self.campaign))
        render.assert_not_called()

    def test_extension_path_must_be_relative_and_confined(self) -> None:
        config = yaml.safe_load(self.campaign.read_text())
        config["extension_packs"] = [str(self.pack)]
        self.campaign.write_text(yaml.safe_dump(config), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "paths relativos"):
            factory.run_campaign(str(self.campaign))

    def test_dispatcher_covers_all_allowlisted_renderer_modes_with_fake_outputs(self) -> None:
        catalog = resolve_catalog([self.pack])
        implementations = {
            "hybrid": "_hybrid", "person": "_person", "mockup": "_mockup",
            "ugc": "_ugc", "didactic": "_didactic",
        }
        for mode, function_name in implementations.items():
            arch = {"id": f"test-{mode}", "mode": mode, "theme": "dark"}
            with mock.patch.object(archetype_render, function_name, return_value={"feed": f"{mode}.png"}) as renderer:
                result = archetype_render.render_archetype(
                    arch, {"headline": "Teste"}, self.brand, "unused",
                    formats=["feed"], catalog=catalog,
                )
            self.assertEqual(result["final"], f"{mode}.png")
            renderer.assert_called_once()

    def test_catalog_drives_internal_ugc_mockup_and_didactic_selections(self) -> None:
        catalog = resolve_catalog([self.pack])
        arches = {item["mode"]: item for item in archetype_render.load_archetypes(catalog)}
        self.assertIn("ugc_scene_id", archetype_render.resolve_internal_selection(arches["ugc"], catalog))
        self.assertIn("mockup_device_id", archetype_render.resolve_internal_selection(arches["mockup"], catalog))
        self.assertIn("didactic_style_id", archetype_render.resolve_internal_selection(arches["didactic"], catalog))

    def test_campaign_honors_explicit_namespaced_ugc_scene(self) -> None:
        config = yaml.safe_load(self.campaign.read_text())
        config["params"]["archetypes"] = ["light_clean", "ugc_native"]
        config["params"]["variants_per_hook"] = 2
        config["hooks"][0]["ugc_scene_id"] = "acme.desk"
        self.campaign.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
        captured: dict = {}

        def fake_render(jobs, _brand, _params, _work, _concurrency, _catalog):
            captured["jobs"] = jobs
            return [{"id": job["id"], "status": "OK"} for job in jobs]

        with (
            mock.patch.object(factory.alib, "OUT_DIR", self.out),
            mock.patch.object(factory.alib, "load_brand", return_value=self.brand),
            mock.patch.object(factory.alib, "has_logo_assets", return_value=False),
            mock.patch.object(factory.sat_mod, "load_used", return_value=set()),
            mock.patch.object(factory.sat_mod, "save_used"),
            mock.patch.object(factory, "_render_jobs_ordered", side_effect=fake_render),
        ):
            factory.run_campaign(str(self.campaign))

        jobs = {job["_archetype"]["id"]: job for job in captured["jobs"]}
        self.assertEqual(jobs["ugc_native"]["_ugc_scene_id"], "acme.desk")
        self.assertNotIn("_ugc_scene_id", jobs["light_clean"])

    def test_doctor_resolves_explicit_extension_catalog(self) -> None:
        result = doctor.diagnose(pack_only=True, extension_packs=[str(self.pack)])
        self.assertEqual(result["status"], "ready")
        check = next(item for item in result["checks"] if item["id"] == "extension-catalog")
        self.assertIn("catalog_hash=", check["detail"])

    def test_gate_profile_thresholds_are_applied_and_traced(self) -> None:
        image = self.root / "gate.png"
        Image.new("RGB", (20, 20), "#111111").save(image)
        brand = {
            "palette": {
                "accent": "#C9B298", "primary": "#F9FAFB", "secondary": "#6B7280",
                "background": "#111111", "foreground": "#F9FAFB",
            },
            "rules": {"gold_min_coverage_pct": 0, "gold_max_coverage_pct": 100, "min_text_contrast": 1},
        }
        profile = {
            "id": "acme.strict", "thresholds": {"dark_first_min_pct": 99, "min_contrast": 1},
        }
        result = gate.evaluate(str(image), brand, profile=profile)
        self.assertEqual(result["gate_profile_id"], "acme.strict")
        self.assertEqual(result["checks"]["dark_first"]["pass"], True)


if __name__ == "__main__":
    unittest.main()
