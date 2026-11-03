import { realpathSync, lstatSync } from 'node:fs';
import { resolve, sep, isAbsolute, dirname, join } from 'node:path';

export class CaminhoInvalido extends Error {}

function resolverReal(alvo) {
  const restantes = [];
  let atual = alvo;
  for (;;) {
    try {
      const real = realpathSync(atual);
      return restantes.length ? join(real, ...restantes.reverse()) : real;
    } catch (e) {
      if (e.code === 'ENOTDIR') throw new CaminhoInvalido('caminho inválido');
      if (e.code !== 'ENOENT') throw e;
    }
    // realpath falhou com ENOENT: se o componente existe via lstat, e um symlink quebrado
    try {
      lstatSync(atual);
      throw new CaminhoInvalido('symlink quebrado');
    } catch (e) {
      if (e instanceof CaminhoInvalido) throw e;
      if (e.code === 'ENOTDIR') throw new CaminhoInvalido('caminho inválido');
      if (e.code !== 'ENOENT') throw e;
    }
    const pai = dirname(atual);
    if (pai === atual) throw new CaminhoInvalido('caminho inválido');
    restantes.push(atual.slice(pai.length).replace(/^[\\/]+/, ''));
    atual = pai;
  }
}

export function resolveInside(base, rel) {
  if (typeof rel !== 'string' || rel.includes('\0') || isAbsolute(rel)) {
    throw new CaminhoInvalido('caminho inválido');
  }
  const baseReal = realpathSync(base);
  const alvo = resolve(baseReal, rel);
  const real = resolverReal(alvo);
  if (real !== baseReal && !real.startsWith(baseReal + sep)) {
    throw new CaminhoInvalido('fora do diretório permitido');
  }
  return real;
}
