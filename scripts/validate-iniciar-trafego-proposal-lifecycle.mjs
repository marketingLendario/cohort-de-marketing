#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  PANEL_REL,
  assessProject,
  buildProposal,
  buildStagedPanelContent,
  hashPanelContent,
} from './lib/iniciar-trafego-gates.mjs';
import {
  assessmentHash,
  loadLatestProposal,
  persistApproval,
  persistProposal,
  proposalHash,
} from './lib/iniciar-trafego/proposal-store.mjs';
import { ensureManifest } from './lib/iniciar-trafego/project-context.mjs';
import { buildResumeHint, ensureRunState } from './lib/iniciar-trafego/run-state.mjs';
import { assertPreservedSections, validatePanelYamlStructure } from './lib/iniciar-trafego/panel-yaml-merge.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'aiox-proposal-lifecycle-'));

function createProject(root, slug) {
  mkdirSync(join(root, 'pagina'), { recursive: true });
  writeFileSync(join(root, 'avatar.md'), `# Avatar ${slug}\n`);
  writeFileSync(join(root, 'offerbook.md'), '# Oferta\nticket: 997\nmargem_pct: 0.4\n');
  writeFileSync(join(root, 'copy.md'), `# Dor ${slug}\nTexto\n# Desejo ${slug}\nTexto\n`);
  writeFileSync(join(root, 'funil.md'), '# Funil\nnivel_consciencia: consciente_do_problema\nvenda direta checkout\n');
  writeFileSync(join(root, 'DESIGN.md'), `# Design ${slug}\n`);
  writeFileSync(
    join(root, 'pagina/index.html'),
    `<html><title>${slug}</title><h1>${slug}</h1><script src="https://connect.facebook.net/en_US/fbevents.js"></script><script>fbq('init','123456789');fbq('track','PageView')</script><a href="https://pay.hotmart.com/X?sck=${slug}">Comprar</a></html>`,
  );
  writeFileSync(
    join(root, 'pagina/deployment.json'),
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      environment: 'production',
      url: `https://${slug}.example.com`,
      status: 'verified',
      origin: 'set-page-url',
      verifiedAt: '2026-07-23T00:00:00.000Z',
      remotePixelOk: true,
      remoteCheckoutOk: true,
      remoteConversionOk: true,
      conversionMode: 'direct_checkout',
      conversionEvidence: {
        mode: 'direct_checkout',
        result: 'pass',
        ok: true,
        destination: `https://pay.hotmart.com/X?sck=${slug}`,
        event: null,
        reason: null,
      },
    }, null, 2)}\n`,
  );
  const manifest = ensureManifest(root, slug);
  ensureRunState(root, manifest.projectId);
  return manifest;
}

try {
  const roots = [join(temp, 'forja'), join(temp, 'no-azul')];
  const manifests = roots.map((root, index) => createProject(root, index === 0 ? 'forja' : 'no-azul'));
  assert.notEqual(manifests[0].projectId, manifests[1].projectId);

  for (const [index, root] of roots.entries()) {
    const assessment = assessProject(root, ROOT);
    assert.equal(
      assessment.blocksProposal,
      false,
      JSON.stringify({
        missing: assessment.missingArtifacts,
        critical: assessment.critical,
        funilNivel: assessment.funilNivel,
        economics: assessment.economics,
        conversionMode: assessment.conversionMode,
        copyBinding: assessment.bindings.copy,
        copyAngles: assessment.canonical?.fields?.copyAngles,
        proposalDryRun: assessment.proposalDryRun,
      }),
    );
    const built = buildProposal(assessment);
    assert.equal(built.angles.length, 2);
    for (const angle of built.angles) {
      assert.ok(angle.locator.startsWith('copy.md#heading-'));
      assert.equal(angle.sourceHash, assessment.bindings.copy.sha256);
    }

    const beforeEntries = readdirSync(root);
    const staged = buildStagedPanelContent(root, ROOT, built);
    assert.equal(existsSync(join(root, PANEL_REL)), false);
    assert.deepEqual(readdirSync(root), beforeEntries);
    assert.equal(validatePanelYamlStructure(staged.content).ok, true);
    const template = readFileSync(join(ROOT, '.claude/skills/_shared/squad-trafego/painel-da-semana-tmpl.yaml'), 'utf8');
    assert.equal(assertPreservedSections(template, staged.content).ok, true);
    assert.equal(hashPanelContent(staged.content).length, 64);

    const proposalIds = [];
    for (let run = 0; run < 3; run += 1) {
      const persisted = persistProposal(root, assessment, built).record;
      proposalIds.push(persisted.proposalId);
      assert.equal(persisted.projectId, manifests[index].projectId);
      assert.equal(persisted.canonicalInput.canonicalHash, assessment.canonical.canonicalHash);
      assert.equal(persisted.conversionMode, assessment.conversionMode);
      assert.equal(persisted.proposalHash, proposalHash(persisted));
      const approval = persistApproval(root, persisted, 'Aprovo, pode gravar').approval;
      assert.equal(approval.parserResult.approved, true);
      assert.equal(approval.proposalHash, persisted.proposalHash);
    }
    assert.equal(new Set(proposalIds).size, 3);
    assert.ok(loadLatestProposal(root)?.createdAt);
    assert.equal(existsSync(join(root, '.aiox/iniciar-trafego/proposals')), true);
    assert.equal(existsSync(join(root, '.aiox/iniciar-trafego/approvals')), true);
    assert.equal(buildResumeHint(root, 'start').includes(resolve(root)), true);
  }

  const forjaProposals = new Set(readdirSync(join(roots[0], '.aiox/iniciar-trafego/proposals')));
  const noAzulProposals = new Set(readdirSync(join(roots[1], '.aiox/iniciar-trafego/proposals')));
  assert.equal([...forjaProposals].some((file) => noAzulProposals.has(file)), false);

  const before = assessProject(roots[0], ROOT);
  const oldBuilt = buildProposal(before);
  const oldRecord = persistProposal(roots[0], before, oldBuilt).record;
  writeFileSync(join(roots[0], 'DESIGN.md'), '# Design alterado\n');
  const after = assessProject(roots[0], ROOT);
  assert.notEqual(assessmentHash(before), assessmentHash(after));
  assert.notEqual(oldRecord.assessmentHash, assessmentHash(after));

  console.log('validate-iniciar-trafego-proposal-lifecycle: PASS (10 requisitos P5)');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
