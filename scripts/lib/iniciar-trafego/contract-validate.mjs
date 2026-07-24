import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const handoffSchema = JSON.parse(readFileSync(join(ROOT, 'data/contracts/iniciar-trafego/studio-handoff.v1.schema.json'), 'utf8'));
const readbackSchema = JSON.parse(readFileSync(join(ROOT, 'data/contracts/iniciar-trafego/studio-readback.v1.schema.json'), 'utf8'));
const validateHandoffSchema = ajv.compile(handoffSchema);
const validateReadbackSchema = ajv.compile(readbackSchema);

export function validateStudioHandoff(handoff) {
  if (!validateHandoffSchema(handoff)) {
    const detail = validateHandoffSchema.errors?.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ') || 'handoff invalido';
    const err = new Error(`Handoff rejeitado pelo schema: ${detail}`);
    err.code = 'INVALID_HANDOFF';
    throw err;
  }
}

export function validateStudioReadback(readback) {
  if (!validateReadbackSchema(readback)) {
    const detail = validateReadbackSchema.errors?.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ') || 'readback invalido';
    const err = new Error(`Readback rejeitado pelo schema: ${detail}`);
    err.code = 'INVALID_READBACK';
    throw err;
  }
}
