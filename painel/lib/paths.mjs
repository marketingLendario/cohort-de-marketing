import { realpathSync } from 'node:fs';
import { resolve, sep, isAbsolute } from 'node:path';

export class CaminhoInvalido extends Error {}

export function resolveInside(base, rel) {
  if (typeof rel !== 'string' || rel.includes('\0') || isAbsolute(rel)) {
    throw new CaminhoInvalido('caminho invalido');
  }
  const baseReal = realpathSync(base);
  const alvo = resolve(baseReal, rel);
  let real;
  try {
    real = realpathSync(alvo);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    real = alvo;
  }
  if (real !== baseReal && !real.startsWith(baseReal + sep)) {
    throw new CaminhoInvalido('fora do diretorio permitido');
  }
  return real;
}
