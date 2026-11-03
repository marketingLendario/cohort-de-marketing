import { randomBytes, timingSafeEqual } from 'node:crypto';

export function criarToken() {
  return randomBytes(24).toString('hex');
}

export function tokenValido(esperado, recebido) {
  if (typeof recebido !== 'string') return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hostPermitido(host, porta) {
  return host === `127.0.0.1:${porta}` || host === `localhost:${porta}`;
}
