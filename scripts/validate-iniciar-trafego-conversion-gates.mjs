#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  assessProject,
  detectPixel,
  extractPublishedUrl,
  inspectConversionDestination,
  inspectPixel,
} from './lib/iniciar-trafego-gates.mjs';
import {
  analyzeRemoteHtml,
  readDeployment,
  resolvePublishedUrl,
  verifyAndWriteDeployment,
  verifyPublishedPage,
} from './lib/iniciar-trafego/page-verifier.mjs';
import { assertProposalSeedReady } from './lib/iniciar-trafego/proposal-store.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const temp = mkdtempSync(join(tmpdir(), 'aiox-traffic-gates-'));

function operationalPixel(extra = '') {
  return `<script src="https://connect.facebook.net/en_US/fbevents.js"></script>
<script>fbq('init','123456789');fbq('track','PageView');${extra}</script>`;
}

try {
  const placeholder = inspectPixel(`${operationalPixel()}<script>fbq('init','[PLUG: SEU_PIXEL_ID]')</script>`);
  assert.equal(placeholder.prepared, true);
  assert.equal(placeholder.ok, false);
  assert.equal(detectPixel('<!-- fbq("init","123456");fbq("track","PageView") -->'), false);
  assert.equal(detectPixel(operationalPixel()), true);

  const direct = inspectConversionDestination(
    '<a href="https://pay.hotmart.com/ABC?sck=campaign-1">Comprar</a>',
    'direct_checkout',
  );
  assert.equal(direct.ok, true);
  assert.equal(
    inspectConversionDestination('<a href="https://pay.hotmart.com/ABC?sck=[PLUG:SCK]">Comprar</a>').ok,
    false,
  );
  const application = inspectConversionDestination(
    `<form action="https://crm.example.com/apply"></form>${operationalPixel("fbq('track','Lead');")}`,
    'application_call',
  );
  assert.equal(application.ok, true);
  assert.equal(inspectConversionDestination('<form action="#"></form>', 'application_call').ok, false);

  assert.equal(
    extractPublishedUrl(
      'https://instagram.com/perfil https://pay.hotmart.com/x?sck=1',
      '<link href="https://fonts.googleapis.com/x"><script src="https://cdn.example.com/app.js"></script>',
    ),
    '',
  );

  const project = join(temp, 'project');
  mkdirSync(join(project, 'pagina'), { recursive: true });
  const localHtml = `<html><title>Projeto Teste</title><h1>Projeto Teste</h1>${operationalPixel()}</html>`;
  writeFileSync(join(project, 'pagina/index.html'), localHtml);
  writeFileSync(
    join(project, 'pagina/deployment.json'),
    JSON.stringify({ schemaVersion: '1.0.0', environment: 'production', url: 'https://landing.example.com', status: 'unverified' }),
  );
  assert.equal(resolvePublishedUrl(project, { publishedUrl: 'https://fake.example.com', pageOk: false }), '');

  await assert.rejects(
    verifyAndWriteDeployment(project, 'https://landing.example.com', {
      maxAttempts: 1,
      fetch: async () => {
        throw new Error('offline');
      },
    }),
    (error) => error.code === 'BLOCKED_PAGE_UNREACHABLE',
  );
  assert.equal(readDeployment(project).status, 'unverified');
  assert.equal(readDeployment(project).origin, 'set-page-url');

  const applicationHtml = `<html><title>Projeto Teste</title><h1>Projeto Teste</h1>
${operationalPixel("fbq('track','Lead');")}
<form action="https://crm.example.com/apply"></form></html>`;
  const verified = await verifyPublishedPage(project, 'https://landing.example.com', {
    conversionMode: 'application_call',
    fetch: async () => ({
      ok: true,
      status: 200,
      url: 'https://landing.example.com',
      text: async () => applicationHtml,
    }),
  });
  assert.equal(verified.remoteConversionOk, true);
  assert.equal(verified.remoteCheckoutOk, null);
  assert.equal(analyzeRemoteHtml(applicationHtml, 'application_call').conversionOk, true);

  const forja = assessProject(resolve(ROOT, 'projetos/forja'), ROOT);
  const noAzul = assessProject(resolve(ROOT, 'projetos/no-azul'), ROOT);
  assert.equal(forja.conversionMode, 'application_call');
  assert.equal(noAzul.conversionMode, 'direct_checkout');
  assert.equal(forja.blocksProposal, true);
  assert.equal(noAzul.blocksProposal, true);
  assert.equal(
    forja.checks.find((check) => check.id === 'conversion-destination').evidence.checkout,
    'not_applicable',
  );
  for (const assessment of [forja, noAzul]) {
    assert.ok(assessment.pending.length > 0);
    for (const pending of assessment.pending) {
      assert.ok(pending.code);
      assert.ok(pending.artifact?.key);
      assert.ok('evidence' in pending);
      assert.equal(pending.blockingPhase, 'assessment');
      assert.ok(pending.routeCommand);
    }
  }

  const seedAssessment = {
    copy: '# Ângulo operacional\n# Segundo ângulo',
    funil: 'nivel_consciencia: consciente_do_problema',
    funilNivel: 'consciente_do_problema',
    publishedUrl: 'https://landing.example.com',
    economics: { ticket: 997, margem_pct: 0.4, valid: true },
    conversionMode: 'direct_checkout',
    pageOk: true,
    pixelOk: true,
    checkoutOk: true,
    missingArtifacts: [],
    pending: [],
    blocksProposal: false,
    canonical: {
      canonicalHash: 'canonical-seed',
      sourceHashes: { copy: '1234567890abcdef' },
      fields: {
        copyAngles: {
          value: ['Ângulo operacional', 'Segundo ângulo'],
          sourcePath: 'copy.md',
          sourceHash: '1234567890abcdef',
        },
      },
    },
  };
  const seed = assertProposalSeedReady(seedAssessment);
  assert.ok(seed.proposal.sourceHash);
  assert.ok(seed.assessmentHash);

  console.log('validate-iniciar-trafego-conversion-gates: PASS (14 requisitos P4)');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
