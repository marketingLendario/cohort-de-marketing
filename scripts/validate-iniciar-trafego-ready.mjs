#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  TEMPLATE_REL,
  PANEL_REL,
  assessProject,
  buildProposal,
  detectCheckout,
  detectPixel,
  hashTree,
  maybeCopyTemplate,
  parseApprovalText,
  parseLocaleNumber,
  parseTicketAndMargin,
  readPanelBlocks,
  stripHtmlComments,
  validateBriefistaInsumos,
  writeApprovedPanel,
} from './lib/iniciar-trafego-gates.mjs';

const ROOT = process.cwd();

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function writeFixture(root, variant) {
  mkdirSync(join(root, 'pagina'), { recursive: true });
  writeFileSync(join(root, 'avatar.md'), '# Avatar\n', 'utf8');
  writeFileSync(join(root, 'offerbook.md'), 'ticket: 297\nmargem_pct: 0.55\n', 'utf8');
  writeFileSync(join(root, 'copy.md'), '# Dor principal\nHeadline de teste\n# Desejo principal\nSegunda headline\n', 'utf8');
  writeFileSync(
    join(root, 'funil.md'),
    `nivel_consciencia: consciente_do_problema
${variant === 't2' ? 'conversao: venda direta com checkout\n' : ''}`,
    'utf8',
  );
  writeFileSync(join(root, 'DESIGN.md'), '# Design\n', 'utf8');

  if (variant === 't1') {
    writeFileSync(join(root, 'pagina/index.html'), '<html><body>local</body></html>', 'utf8');
    return;
  }

  const html = `<html><body>
<script>fbq('init','123');</script>
<a href="https://pay.hotmart.com/X?sck=abc123">Comprar</a>
<p>Landing em https://demo.netlify.app/vendas</p>
</body></html>`;
  writeFileSync(join(root, 'pagina/index.html'), html, 'utf8');
  writeFileSync(join(root, 'copy.md'), '# Dor principal\nhttps://demo.netlify.app/vendas\n# Desejo principal\nSegunda headline\n', 'utf8');
  writeFileSync(
    join(root, 'pagina/deployment.json'),
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      environment: 'production',
      url: 'https://demo.netlify.app/vendas',
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
        destination: 'https://pay.hotmart.com/X?sck=abc123',
        event: null,
        reason: null,
      },
    }, null, 2)}\n`,
    'utf8',
  );
}

function runUnitGates() {
  const { ticket: t1 } = parseTicketAndMargin('ticket: 297.50\nmargem_pct: 0.55');
  if (Math.abs(t1 - 297.5) > 0.001) fail(`parseTicket US decimal: esperado 297.5, got ${t1}`);
  const { ticket: t2 } = parseTicketAndMargin('ticket: 297,50\nmargem_pct: 0.55');
  if (Math.abs(t2 - 297.5) > 0.001) fail(`parseTicket BR decimal: esperado 297.5, got ${t2}`);
  if (parseLocaleNumber('297.50') !== 297.5) fail('parseLocaleNumber 297.50');
  const commented = stripHtmlComments(
    '<!-- fbq("init","00000") -->'
    + '<script src="https://connect.facebook.net/en_US/fbevents.js"></script>'
    + '<script>fbq("init","123456789");fbq("track","PageView");</script>',
  );
  if (!detectPixel(commented)) fail('pixel em script deve passar');
  if (detectPixel(stripHtmlComments('<!-- fbq( init ) -->'))) fail('pixel so em comentario deve falhar');
  if (detectCheckout(null, '', 'https://pay.hotmart.com/a\nsck=foo')) fail('checkout separado deve falhar');
  if (!detectCheckout(null, '', '<a href="https://pay.hotmart.com/a?sck=foo">')) fail('checkout na mesma URL deve passar');
  if (!parseApprovalText('aprovo, pode gravar').approved) fail('parseApprovalText aprovo');
  if (parseApprovalText('nao aprovo ainda').approved) fail('parseApprovalText rejeicao');
  ok('unit gates (parsing, pixel, checkout, aprovacao)');
}

function runT1() {
  const dir = mkdtempSync(join(tmpdir(), 'it-t1-'));
  try {
    writeFixture(dir, 't1');
    const before = hashTree(dir);
    const a = assessProject(dir, ROOT);
    if (!a.blocksProposal) fail('T1 deveria bloquear proposta');
    if (!a.critical.some((c) => c.id === 'guia-publicar-pagina')) fail('T1 deveria apontar guia-publicar-pagina');
    try {
      maybeCopyTemplate(dir, ROOT, a);
      fail('T1 nao deveria copiar template com pendencia critica');
    } catch {
      /* esperado spec: nao grava nada */
    }
    try {
      writeApprovedPanel(dir, ROOT, { insumosYaml: 'insumos_a2:\n  angulos: []\n' }, 'aprovo');
      fail('T1 nao deveria gravar painel');
    } catch {
      /* esperado */
    }
    if (existsSync(join(dir, PANEL_REL))) fail('T1 nao deveria criar PAINEL-DA-SEMANA.yaml');
    if (existsSync(join(dir, 'trafego'))) fail('T1 nao deveria criar pasta trafego/');
    const after = hashTree(dir);
    if (before !== after) fail('T1 deveria manter arvore identica (zero writes)');
    ok('T1 pagina ausente: guia correto, zero gravacao (spec literal)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runT2() {
  const dir = mkdtempSync(join(tmpdir(), 'it-t2-'));
  try {
    writeFixture(dir, 't2');
    const a = assessProject(dir, ROOT);
    if (a.blocksProposal) fail('T2 deveria permitir proposta');
    const proposal = buildProposal(a);
    writeApprovedPanel(dir, ROOT, proposal, 'aprovo a proposta completa, pode gravar');
    const panel = join(dir, PANEL_REL);
    const briefista = validateBriefistaInsumos(panel);
    if (!briefista.ok) fail(`T2 briefista recusaria: ${briefista.errors.join('; ')}`);
    const blocks = readPanelBlocks(panel);
    if (!blocks.insumos.includes('angulos:')) fail('T2 insumos_a2 incompleto');
    if (!blocks.projecao.includes('roas_break_even')) fail('T2 projecao incompleta');
    ok('T2 projeto completo: painel aceito pelo criterio briefista (spec §92)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runT3() {
  const dir = mkdtempSync(join(tmpdir(), 'it-t3-'));
  try {
    writeFixture(dir, 't2');
    maybeCopyTemplate(dir, ROOT, assessProject(dir, ROOT));
    const panel = join(dir, PANEL_REL);
    const before = readPanelBlocks(panel);
    const a = assessProject(dir, ROOT);
    const proposal = buildProposal(a);
    try {
      writeApprovedPanel(dir, ROOT, proposal, 'nao aprovo ainda, preciso revisar');
      fail('T3 nao deveria gravar sem aprovacao textual');
    } catch {
      /* esperado */
    }
    try {
      writeApprovedPanel(dir, ROOT, proposal, false);
      fail('T3 nao deveria gravar com boolean true sem texto');
    } catch {
      /* esperado */
    }
    const after = readPanelBlocks(panel);
    if (before.insumos !== after.insumos || before.projecao !== after.projecao) {
      fail('T3 alterou insumos_a2 ou projecao sem aprovacao');
    }
    ok('T3 sem aprovacao textual nao altera insumos_a2 nem projecao');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (!readFileSync(join(ROOT, TEMPLATE_REL), 'utf8').includes('insumos_a2')) {
    fail('Template canonico ausente ou invalido');
  }
  runUnitGates();
  runT1();
  runT2();
  runT3();
  console.log('validate-iniciar-trafego-ready: 4/4 suites PASS (unit + T1 T2 T3 spec v2)');
}

main();
