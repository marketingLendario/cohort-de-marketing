#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertPreservedSections,
  mergePanelYamlPreserving,
} from './lib/iniciar-trafego/panel-yaml-merge.mjs';
import { TEMPLATE_REL } from './lib/iniciar-trafego-gates.mjs';

const ROOT = process.cwd();

function fail(msg) {
  console.error(`validate-iniciar-trafego-yaml-ast: FAIL — ${msg}`);
  process.exit(1);
}

const gatesSrc = readFileSync(new URL('./lib/iniciar-trafego-gates.mjs', import.meta.url), 'utf8');
if (/replaceSection/.test(gatesSrc)) fail('iniciar-trafego-gates.mjs ainda referencia replaceSection');
if (!/mergePanelYamlPreserving/.test(gatesSrc)) fail('writeApprovedPanel nao usa mergePanelYamlPreserving');

const template = readFileSync(join(ROOT, TEMPLATE_REL), 'utf8');
const zeladorBefore = template.match(/zelador:[\s\S]*?(?=\n# ═|\nbriefista:)/)?.[0];
if (!zeladorBefore) fail('template sem secao zelador');

const merged = mergePanelYamlPreserving(template, {
  insumos_a2: `insumos_a2:
  angulos:
    - nome: "angulo-1"
      nivel_consciencia: "consciente_do_problema"
      dor: "Dor teste"
  pagina_url: "https://demo.example/vendas"
  ticket: 297
  margem_pct: 0.55`,
  projecao: `projecao:
  ticket: 297
  margem_pct: 0.55
  roas_break_even: 1.8182
  cac_break_even: 163.35
  conta_mostrada: "teste"`,
});

const preserved = assertPreservedSections(template, merged);
if (!preserved.ok) fail(`preservacao falhou: ${preserved.errors.join(', ')}`);
if (!merged.includes('zelador:')) fail('merge removeu zelador');
if (!merged.includes('briefista:')) fail('merge removeu briefista');
if (!merged.includes('angulo-1')) fail('merge nao aplicou insumos_a2');
if (!merged.includes('roas_break_even: 1.8182')) fail('merge nao aplicou projecao');

console.log('validate-iniciar-trafego-yaml-ast: PASS (merge preservador + sem replaceSection)');
process.exit(0);
