#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const NEXUS = resolve(process.env.AIOX_NEXUS_ROOT || 'D:/Documentos/Codigo/Nexus-OS');
const read = (path) => readFileSync(resolve(ROOT, path), 'utf8');
const json = (path) => JSON.parse(read(path));

const trafficClaude = read('.claude/skills/iniciar-trafego/SKILL.md');
const trafficAgents = read('.agents/skills/iniciar-trafego/SKILL.md');
assert.equal(trafficClaude, trafficAgents, 'espelho iniciar-trafego divergiu');
for (const command of ['discover --json', 'select --project=', 'start --project=', 'propose --project=', 'approve --project=', 'resume --project=', 'open --project=']) {
  assert.match(trafficClaude, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(trafficClaude, /Pergunte exatamente: \*\*Quer abrir\?\*\*/);
assert.doesNotMatch(trafficClaude, /liste `projetos\/`|Checklist humano|Quer abrir o Studio agora/);

const studioClaude = read('.claude/skills/iniciar-studio/SKILL.md');
const studioAgents = read('.agents/skills/iniciar-studio/SKILL.md');
assert.equal(studioClaude, studioAgents, 'espelho iniciar-studio divergiu');
for (const command of ['ensure --purpose=traffic-sync', 'open --project=', 'release --project=']) {
  assert.ok(studioClaude.includes(command), `iniciar-studio não documenta ${command}`);
}

assert.equal(read('AGENTS.md').replace(/\r\n/g, '\n'), read('CLAUDE.md').replace(/\r\n/g, '\n'));
for (const document of ['_interno/README.md', '_interno/manual-ponte-e-criativos.md', '_interno/decisoes-e-nao-fazer.md']) {
  const content = read(document);
  assert.ok(content.includes('Quer abrir?'), `${document} sem pergunta canônica`);
}

const catalog = json('data/skill-catalog.json');
const traffic = catalog.skills.find((skill) => skill.id === 'iniciar-trafego');
assert.ok(traffic);
assert.deepEqual(traffic.prerequisites, [
  'binding:avatar',
  'binding:offerbook',
  'binding:copy',
  'binding:funnel',
  'binding:design',
  'binding:salesPage',
]);
const rootRules = json('data/skill-unlock-rules.json');
const lessonRules = json('aula-03/materiais/data/skill-unlock-rules.json');
for (const key of ['avatar', 'offerbook', 'copy', 'funnel', 'design', 'salesPage']) {
  assert.deepEqual(lessonRules.artifactGlobs[key], rootRules.artifactGlobs[key], `Aula 3 divergiu em binding ${key}`);
}
assert.deepEqual(lessonRules.skills['iniciar-trafego'], rootRules.skills['iniciar-trafego']);
assert.deepEqual(lessonRules.skills['iniciar-studio'], rootRules.skills['iniciar-studio']);
assert.ok(rootRules.artifactGlobs.avatar.includes('pesquisa-avatar-*/relatorio-avatar.md'));
assert.ok(rootRules.artifactGlobs.offerbook.includes('offerbook-*.md'));
assert.ok(!rootRules.artifactGlobs.offerbook.includes('briefing-offerbook.md'));

for (const artifact of ['skill', 'script', 'code-module']) {
  const result = spawnSync(
    process.execPath,
    ['squads/squad-creator/scripts/route-coupling.cjs', `--artifact=${artifact}`],
    { cwd: NEXUS, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, `coupling consult falhou para ${artifact}: ${result.stderr}`);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.coupled.length > 0 && payload.checks.length > 0);
}

console.log('validate-iniciar-trafego-surfaces: PASS (skills + mirrors + catalog + Aula 3 + docs + coupling)');
