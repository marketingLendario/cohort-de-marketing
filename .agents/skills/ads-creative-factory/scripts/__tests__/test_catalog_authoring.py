from __future__ import annotations

import contextlib
import hashlib
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
from build_brand_pack import build_brand_pack  # noqa: E402
from build_persona_pack import PersonaPackBuildError, build_persona_pack  # noqa: E402
from catalog_authoring import AuthoringError, add_entity, build_extension_pack  # noqa: E402
from pack_loader import PackLoadError, load_brand_pack, load_extension_pack, load_persona_pack  # noqa: E402


DESIGN = """---
name: Acme Educação
description: Uma marca clara para educação prática.
colors:
  primary: "#FF5A1F"
  secondary: "#6B7280"
  background: "#111827"
  text: "#F9FAFB"
typography:
  heading: Inter
  body: Arial
---
# Acme Educação

Educação prática com evidências claras.
"""


class CatalogAuthoringTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.project = self.root / "project"
        self.project.mkdir()
        self.photo = self.root / "photo.png"
        self.photo.write_bytes(b"synthetic-png-fixture")
        self.reference = self.root / "reference.txt"
        self.reference.write_text("synthetic reference", encoding="utf-8")
        self.design = self.root / "DESIGN.md"
        self.design.write_text(DESIGN, encoding="utf-8")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def cli(self, argv: list[str]) -> tuple[int, dict]:
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            code = catalog_cli.main(["--json", *argv])
        return code, json.loads(stdout.getvalue())

    def test_brand_and_persona_builders_create_valid_self_contained_packs(self) -> None:
        brand_root = self.project / "creative-factory" / "packs" / "acme-brand"
        brand = build_brand_pack(
            self.design, brand_root, "Uso autorizado no projeto sintético.",
            pack_id="acme-brand",
        )
        self.assertEqual(brand["status"], "valid")
        self.assertEqual(load_brand_pack(brand_root)["id"], "acme-brand")
        self.assertTrue((brand_root / "preview.html").is_file())
        self.assertTrue((brand_root / "build-report.json").is_file())

        persona_root = self.project / "creative-factory" / "packs" / "acme-persona"
        persona = build_persona_pack(
            persona_root, pack_id="acme-persona", display_name="Pessoa sintética",
            role="Especialista", description="Fixture sem identidade real.",
            tone="Direto", topics=["métricas"], avoid=["promessas"], photos=[self.photo],
            rights_notice="Fixture autorizada somente para testes.",
            consent_reference="CONSENT-TEST-001",
        )
        loaded = load_persona_pack(persona_root)
        declared = loaded["assets"]["files"][0]["sha256"]
        self.assertEqual(declared, hashlib.sha256(b"synthetic-png-fixture").hexdigest())
        self.assertEqual(persona["photoHashes"], [declared])

    def test_persona_rejects_missing_consent_and_tampered_photo(self) -> None:
        output = self.project / "creative-factory" / "packs" / "persona"
        with self.assertRaisesRegex(PersonaPackBuildError, "consentimento"):
            build_persona_pack(
                output, pack_id="persona", display_name="Fixture", role="Papel",
                description="Descrição", tone="Tom", topics=["tema"], avoid=["guard"],
                photos=[self.photo], rights_notice="Uso de teste", consent_reference="short",
            )
        build_persona_pack(
            output, pack_id="persona", display_name="Fixture", role="Papel",
            description="Descrição", tone="Tom", topics=["tema"], avoid=["guard"],
            photos=[self.photo], rights_notice="Uso de teste", consent_reference="CONSENT-001",
        )
        (output / "assets" / "photo-1.png").write_bytes(b"tampered")
        with self.assertRaisesRegex(PackLoadError, "SHA-256"):
            load_persona_pack(output)

    def test_dry_run_and_output_confinement_do_not_write(self) -> None:
        code, payload = self.cli([
            "pack", "build", "--project-root", str(self.project), "--id", "acme-extension",
            "--namespace", "acme", "--version", "1.0.0",
            "--rights-notice", "Uso autorizado para teste.", "--dry-run",
        ])
        self.assertEqual(code, 0)
        self.assertEqual(payload["status"], "planned")
        self.assertFalse((self.project / "creative-factory").exists())

        outside = self.root / "outside"
        code, payload = self.cli([
            "brand", "create", "--project-root", str(self.project), "--design", str(self.design),
            "--id", "acme-brand", "--rights-notice", "Uso autorizado.",
            "--output", str(outside), "--dry-run",
        ])
        self.assertEqual(code, 1)
        self.assertEqual(payload["status"], "blocked")
        self.assertFalse(outside.exists())

    def test_public_commands_build_populate_install_and_preview_pack(self) -> None:
        build_args = [
            "pack", "build", "--project-root", str(self.project), "--id", "acme-extension",
            "--namespace", "acme", "--version", "1.0.0",
            "--rights-notice", "Uso autorizado para fixture sintética.",
        ]
        self.assertEqual(self.cli(build_args)[0], 0)
        pack = self.project / "creative-factory" / "packs" / "acme-extension"

        commands = [
            ["gate-profile", "add", "--pack", str(pack), "--id", "acme.default",
             "--label", "Gate Acme", "--threshold", "min_contrast=4.5"],
            ["mechanism", "add", "--pack", str(pack), "--id", "acme.proof",
             "--label", "Prova Acme", "--kind", "hybrid", "--psych", "evidência",
             "--core", "objeto de prova", "--belief-shift", "de dúvida para clareza",
             "--hook-structure", "fato e consequência", "--proof-type", "demonstração",
             "--objection", "funciona para mim", "--required-field", "headline",
             "--prohibited-claim", "garantia", "--format", "feed"],
            ["ugc-scene", "add", "--pack", str(pack), "--id", "acme.desk",
             "--label", "Mesa real", "--setting", "mesa doméstica", "--shot", "celular",
             "--lighting", "janela", "--prop", "notebook", "--authenticity-guard", "espontâneo",
             "--negative-guard", "estúdio", "--format", "story"],
            ["variation", "add", "--pack", str(pack), "--id", "acme.metal",
             "--axis", "material", "--fragment", "metal escovado"],
            ["reference", "add", "--pack", str(pack), "--id", "acme.reference",
             "--file", str(self.reference), "--source", "fixture local", "--tag", "proof"],
            ["archetype", "add", "--pack", str(pack), "--id", "acme.editorial",
             "--label", "Editorial Acme", "--renderer-mode", "hybrid", "--theme", "dark",
             "--format", "feed", "--required-field", "headline", "--mechanism", "acme.proof",
             "--internal-variant", "material", "--gate-profile", "acme.default",
             "--ugc-scene", "acme.desk", "--variation", "acme.metal",
             "--reference", "acme.reference"],
        ]
        for command in commands:
            code, payload = self.cli(command)
            self.assertEqual((code, payload["status"]), (0, "valid"), command)

        loaded = load_extension_pack(pack)
        self.assertEqual(len(loaded["entities"]["references"]), 1)
        self.assertEqual(len(loaded.asset_paths), 1)
        before = (pack / "pack.json").read_bytes()
        code, payload = self.cli(commands[-1])
        self.assertEqual(code, 1)
        self.assertEqual(payload["status"], "blocked")
        self.assertEqual((pack / "pack.json").read_bytes(), before)

        code, installed = self.cli([
            "pack", "install", "--project-root", str(self.project), "--pack", str(pack),
        ])
        self.assertEqual((code, installed["status"]), (0, "installed"), installed)
        config = json.loads((self.project / "creative-factory" / "installed-packs.json").read_text())
        self.assertEqual(config["packs"][0]["id"], "acme-extension")

        code, preview = self.cli([
            "preview", "archetype", "acme.editorial", "--pack", str(pack),
        ])
        self.assertEqual((code, preview["status"]), (0, "preview-ready"))
        self.assertEqual(preview["item"]["renderer_mode"], "hybrid")
        self.assertEqual(preview["item"]["reference_ids"], ["acme.reference"])
        self.assertEqual(preview["catalog_hash"], installed["catalog_hash"])

    def test_reserved_namespace_and_unknown_renderer_fail_closed(self) -> None:
        with self.assertRaisesRegex(PackLoadError, "reserved"):
            build_extension_pack(
                self.project, pack_id="builtin-extension", namespace="builtin",
                version="1.0.0", rights_notice="Teste",
            )
        with self.assertRaises(SystemExit) as caught:
            catalog_cli.main([
                "archetype", "add", "--pack", "pack", "--id", "acme.bad",
                "--label", "Bad", "--renderer-mode", "python", "--theme", "dark",
                "--format", "feed", "--required-field", "headline",
                "--mechanism", "acme.proof", "--internal-variant", "material",
                "--gate-profile", "acme.default",
            ])
        self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
