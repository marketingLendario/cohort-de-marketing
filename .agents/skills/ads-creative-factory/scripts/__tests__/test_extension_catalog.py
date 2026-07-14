from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import catalog_cli  # noqa: E402
from catalog_loader import CatalogError, resolve_catalog  # noqa: E402
from pack_loader import PackLoadError, load_extension_pack  # noqa: E402


def extension_manifest(namespace: str = "acme", pack_id: str = "acme-extension") -> dict:
    archetype_id = f"{namespace}.editorial"
    mechanism_id = f"{namespace}.proof"
    gate_id = f"{namespace}.default"
    return {
        "schema_version": "1.0.0",
        "pack_type": "creative-extension",
        "id": pack_id,
        "version": "1.0.0",
        "namespace": namespace,
        "min_factory_version": "2.2.0",
        "entities": {
            "archetypes": [{
                "id": archetype_id, "label": "Editorial Acme", "renderer_mode": "hybrid",
                "theme": "dark", "formats": ["feed"], "required_fields": ["headline"],
                "compatible_mechanisms": [mechanism_id], "internal_variants": ["material"],
                "gate_profile": gate_id, "needs_persona": False,
            }],
            "mechanisms": [{
                "id": mechanism_id, "kind": "visual", "label": "Prova", "psych": "evidência",
                "core": "One clear proof object", "required_fields": [], "prohibited_claims": [],
                "compatible_archetypes": [archetype_id], "formats": ["feed"],
                "needs_likeness": False,
            }],
            "ugc_scenes": [{
                "id": f"{namespace}.ugc-desk", "label": "Desk", "setting": "a real desk",
                "shot": "phone snapshot", "lighting": "window light", "props": ["laptop"],
                "authenticity_guards": ["unposed"], "negative_guards": ["studio ad"],
                "formats": ["story"], "needs_persona": False,
            }],
            "variations": [{
                "id": f"{namespace}.metal", "axis": "material", "fragment": "brushed metal",
                "compatible_archetypes": [archetype_id], "locks": [],
            }],
            "references": [],
            "gate_profiles": [{
                "id": gate_id, "label": "Default", "thresholds": {"min_contrast": 4.5},
                "human_review_required": True, "likeness_gate_required": True,
            }],
        },
        "assets": {"files": []},
        "rights": {
            "redistributable": False,
            "notice": "Synthetic test pack",
            "licenses": [{
                "id": "project-use", "name": "Project use", "spdx": "LicenseRef-Test",
                "redistributable": False, "notice": "Synthetic test only",
            }],
        },
    }


class ExtensionCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write_pack(self, manifest: dict, name: str = "pack") -> Path:
        root = self.root / name
        root.mkdir()
        (root / "pack.json").write_text(json.dumps(manifest), encoding="utf-8")
        return root

    def test_loads_valid_extension_as_immutable_contract(self) -> None:
        pack = load_extension_pack(self.write_pack(extension_manifest()))
        self.assertEqual(pack["pack_type"], "creative-extension")
        self.assertEqual(pack["entities"]["archetypes"][0]["renderer_mode"], "hybrid")
        with self.assertRaises(TypeError):
            pack.data["id"] = "changed"  # type: ignore[index]

    def test_requires_entity_namespace(self) -> None:
        manifest = extension_manifest()
        manifest["entities"]["mechanisms"][0]["id"] = "other.proof"
        with self.assertRaisesRegex(PackLoadError, "declared namespace"):
            load_extension_pack(self.write_pack(manifest))

    def test_rejects_unknown_renderer_mode(self) -> None:
        manifest = extension_manifest()
        manifest["entities"]["archetypes"][0]["renderer_mode"] = "python-plugin"
        with self.assertRaisesRegex(PackLoadError, "must be one of"):
            load_extension_pack(self.write_pack(manifest))

    def test_rejects_incomplete_copy_mechanism(self) -> None:
        manifest = extension_manifest()
        mechanism = manifest["entities"]["mechanisms"][0]
        mechanism["kind"] = "copy"
        mechanism.pop("core")
        with self.assertRaisesRegex(PackLoadError, "copy mechanism is missing"):
            load_extension_pack(self.write_pack(manifest))

    def test_catalog_hash_is_deterministic_across_pack_order(self) -> None:
        first = self.write_pack(extension_manifest("acme", "acme-extension"), "first")
        second = self.write_pack(extension_manifest("beta", "beta-extension"), "second")
        left = resolve_catalog([first, second])
        right = resolve_catalog([second, first])
        self.assertEqual(left.catalog_hash, right.catalog_hash)
        self.assertEqual(left.to_dict(), right.to_dict())

    def test_catalog_hash_changes_with_entity_content(self) -> None:
        first = self.write_pack(extension_manifest(), "first")
        changed = extension_manifest("beta", "beta-extension")
        changed["entities"]["mechanisms"][0]["core"] = "A materially different proof object"
        second = self.write_pack(changed, "second")
        self.assertNotEqual(resolve_catalog([first]).catalog_hash, resolve_catalog([second]).catalog_hash)

    def test_duplicate_entity_across_packs_fails_closed(self) -> None:
        first = self.write_pack(extension_manifest("acme", "acme-one"), "first")
        second = self.write_pack(extension_manifest("acme", "acme-two"), "second")
        with self.assertRaisesRegex(CatalogError, "Duplicate archetypes id"):
            resolve_catalog([first, second])

    def test_unknown_link_fails_before_generation(self) -> None:
        manifest = extension_manifest()
        manifest["entities"]["archetypes"][0]["reference_ids"] = ["acme.missing"]
        pack = self.write_pack(manifest)
        with self.assertRaisesRegex(CatalogError, "reference_ids references unknown entity"):
            resolve_catalog([pack])

    def test_cli_list_is_read_only_and_json_stable(self) -> None:
        pack = self.write_pack(extension_manifest())
        manifest_path = pack / "pack.json"
        before = (manifest_path.stat().st_mtime_ns, manifest_path.read_bytes())
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            code = catalog_cli.main(["--json", "catalog", "list", "--pack", str(pack), "--type", "archetypes"])
        payload = json.loads(stdout.getvalue())
        after = (manifest_path.stat().st_mtime_ns, manifest_path.read_bytes())
        self.assertEqual(code, 0)
        self.assertEqual(payload["status"], "ready")
        self.assertIn("acme.editorial", [item["id"] for item in payload["items"]])
        self.assertEqual(before, after)

    def test_cli_validation_blocks_invalid_pack_without_absolute_path(self) -> None:
        pack = self.write_pack(extension_manifest())
        manifest = json.loads((pack / "pack.json").read_text(encoding="utf-8"))
        manifest["schema_version"] = "9.0.0"
        (pack / "pack.json").write_text(json.dumps(manifest), encoding="utf-8")
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            code = catalog_cli.main(["--json", "catalog", "validate", str(pack)])
        payload = json.loads(stdout.getvalue())
        self.assertEqual(code, 1)
        self.assertEqual(payload["status"], "blocked")
        self.assertNotIn(str(self.root), payload["message"])

    def test_cli_filters_availability_without_persona_context(self) -> None:
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            code = catalog_cli.main([
                "--json", "catalog", "list", "--type", "archetypes",
                "--availability", "requires_authorization",
            ])
        payload = json.loads(stdout.getvalue())
        self.assertEqual(code, 0)
        self.assertEqual([item["id"] for item in payload["items"]], ["person_authority"])
        self.assertEqual(payload["items"][0]["availability"], "requires_authorization")


if __name__ == "__main__":
    unittest.main()
