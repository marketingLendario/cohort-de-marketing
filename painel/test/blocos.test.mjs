import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOCOS, OCULTAS, agruparSkills } from '../web/blocos.js';

const sk = (name, description = '') => ({ name, description });
const nomes = (grupos) => grupos.map((g) => [g.titulo, g.itens.map((s) => s.name)]);

test('agrupa na ordem dos blocos e manda o desconhecido para Outras', () => {
  const grupos = agruparSkills([sk('copy-funil'), sk('avatar-funil'), sk('nova-skill'), sk('comecar')]);
  assert.deepEqual(nomes(grupos), [
    ['Começar e acompanhar', ['comecar']],
    ['Pesquisa de mercado', ['avatar-funil']],
    ['Copy e páginas', ['copy-funil']],
    ['Outras', ['nova-skill']],
  ]);
});

test('a sugestão do cliente vem primeiro, e some quando há filtro', () => {
  const skills = [sk('avatar-funil'), sk('offerbook', 'Livro da oferta')];
  assert.equal(agruparSkills(skills, { sugeridas: ['offerbook'] })[0].titulo, 'Próximo passo deste cliente');
  assert.deepEqual(nomes(agruparSkills(skills, { filtro: 'oferta', sugeridas: ['offerbook'] })), [
    ['Oferta e identidade', ['offerbook']],
  ]);
});

test('workers internos não aparecem no seletor', () => {
  const grupos = agruparSkills([sk('iniciar-studio'), sk('iniciar-trafego')]);
  assert.deepEqual(nomes(grupos), [['Criativos e tráfego', ['iniciar-trafego']]]);
});

test('toda skill do repositório cai num bloco nomeado ou é oculta de propósito', () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.claude', 'skills');
  const reais = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name);
  const mapeadas = new Set([...BLOCOS.flatMap((b) => b.skills), ...OCULTAS]);
  assert.deepEqual(reais.filter((n) => !mapeadas.has(n)), []);
});
