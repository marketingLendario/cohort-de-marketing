#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const schemaPath = join(ROOT, 'data/contracts/iniciar-trafego/studio-readback.v1.schema.json');
const contractPath = join(ROOT, 'scripts/lib/iniciar-trafego/contract-validate.mjs');

function fail(msg) {
  console.error(`validate-iniciar-trafego-schema-qa4: FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(schemaPath)) fail('studio-readback.v1.schema.json ausente');
if (!readFileSync(schemaPath, 'utf8').includes('"deepLink"')) fail('schema readback deve exigir deepLink');
const contract = readFileSync(contractPath, 'utf8');
if (!contract.includes('validateStudioReadback')) fail('contract-validate deve exportar validateStudioReadback');

console.log('validate-iniciar-trafego-schema-qa4: PASS');
