#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverProjects } from './lib/iniciar-trafego/project-discovery.mjs';

const temp = mkdtempSync(join(tmpdir(), 'traffic-topology-'));
function write(path, content = '# fixture sintética\n') {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

try {
  write(
    join(temp, 'data/iniciar-trafego/project-discovery.json'),
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      scanRoots: ['projetos', '.'],
      excludeDirNames: ['.git', '.aiox', '_interno', 'node_modules', 'fixtures', 'templates', 'examples'],
      excludePathSegments: ['aula-03/materiais/mapa-skills-samples'],
      maxDepth: 3,
      sampleRoots: ['mapa-skills-samples'],
    }, null, 2)}\n`,
  );
  write(join(temp, 'forja/copy.md'));
  write(join(temp, 'forja/funil.md'));
  write(join(temp, 'espalhados/no-azul/offerbook.md'));
  write(join(temp, 'espalhados/no-azul/pagina/index.html'), '<html>fixture</html>');
  write(join(temp, 'aula-03/materiais/mapa-skills-samples/academia-fit/copy.md'));

  const result = discoverProjects({ cohortRoot: temp });
  const active = result.candidates.filter((candidate) => !candidate.excluded);
  assert.equal(active.length, 2, JSON.stringify(result.candidates, null, 2));
  assert.deepEqual(active.map((candidate) => candidate.slug).sort(), ['forja', 'no-azul']);
  assert.equal(
    result.candidates.some((candidate) => candidate.root.includes('mapa-skills-samples') && !candidate.excluded),
    false,
  );
  assert.notEqual(active[0].candidateId, active[1].candidateId);
  console.log('validate-iniciar-trafego-synthetic-topology: PASS (Forja + No Azul; sample excluded)');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
