#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  detectStudio,
  loadDistribution,
  platformTarget,
  validateDistribution,
} from './lib/iniciar-studio/discovery.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const studio = await detectStudio();
assert.equal(studio.ok, true);
assert.equal(studio.status, 'installed');
assert.equal(platformTarget('win32', 'x64'), 'win32-x64');
assert.equal(platformTarget('win32', 'arm64'), null);
assert.equal(platformTarget('darwin', 'x64'), 'darwin-x64');
assert.equal(platformTarget('darwin', 'arm64'), 'darwin-arm64');
assert.equal(platformTarget('linux', 'x64'), 'linux-x64');

const unavailable = validateDistribution(loadDistribution());
assert.equal(unavailable.ok, false);
assert.equal(unavailable.code, 'STUDIO_DISTRIBUTION_UNAVAILABLE');

const validFixture = JSON.parse(readFileSync(resolve(ROOT, 'data/contracts/iniciar-studio/fixtures/studio-distribution-manifest.v1/valid.json')));
assert.equal(validateDistribution(validFixture).ok, true);
const armMismatch = structuredClone(validFixture);
armMismatch.artifacts['darwin-arm64'].arch = 'x64';
assert.equal(validateDistribution(armMismatch).code, 'DISTRIBUTION_ARCH_MISMATCH');

const coordinator = readFileSync(resolve(ROOT, 'scripts/lib/iniciar-studio/coordinator.mjs'), 'utf8');
assert.match(coordinator, /installOrUpdateStudio/);
assert.match(coordinator, /ensureDockerAvailable/);
assert.match(coordinator, /runtimePreexisting/);
assert.match(coordinator, /ownsRuntime/);
assert.match(coordinator, /openedOnce/);
assert.match(coordinator, /home genérica proibida/);

const launcher = readFileSync(resolve(ROOT, '../academia-lendaria-ads-studio/scripts/marketing-studio.mjs'), 'utf8');
assert.match(launcher, /options\.profile === 'traffic-sync'/);
assert.match(launcher, /const skipCodex = options\.profile === 'traffic-sync'/);
assert.match(launcher, /\['migration', 'up', '--local'\]/);
assert.match(launcher, /\['info'\]/);
assert.match(launcher, /tryStartDockerDesktop/);
assert.match(launcher, /Docker Desktop/);

const windows = readFileSync(resolve(ROOT, 'scripts/lib/iniciar-studio/platform/win32.mjs'), 'utf8');
const darwin = readFileSync(resolve(ROOT, 'scripts/lib/iniciar-studio/platform/darwin.mjs'), 'utf8');
const linux = readFileSync(resolve(ROOT, 'scripts/lib/iniciar-studio/platform/linux.mjs'), 'utf8');
assert.match(windows, /resume --project="\$\{projectAbsolute\}" --execute/);
assert.match(windows, /if errorlevel 1 exit/);
assert.match(windows, /schtasks/);
assert.match(darwin, /launchctl/);
assert.match(darwin, /function xml/);
assert.match(linux, /systemctl/);
assert.match(linux, /--user/);
assert.match(linux, /resume "--project=/);

const traffic = readFileSync(resolve(ROOT, 'scripts/iniciar-trafego.mjs'), 'utf8');
assert.match(traffic, /openQuestion: 'Quer abrir\?'/);
assert.match(traffic, /synchronized: true/);
assert.doesNotMatch(traffic, /releaseRuntime\(project/);
assert.match(traffic, /deep link verificado do projeto ausente/);
assert.match(traffic, /removeResumeIntent\(project/);

const claudeSkill = readFileSync(resolve(ROOT, '.claude/skills/iniciar-studio/SKILL.md'), 'utf8');
const agentsSkill = readFileSync(resolve(ROOT, '.agents/skills/iniciar-studio/SKILL.md'), 'utf8');
assert.equal(claudeSkill, agentsSkill);

console.log('validate-iniciar-studio-runtime: PASS (runtime + resume + open; distribuição oficial segue indisponível)');
