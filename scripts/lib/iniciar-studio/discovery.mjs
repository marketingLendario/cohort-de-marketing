import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const COHORT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function resolveCohortRoot() {
  return COHORT_ROOT;
}

export function loadDistribution() {
  const path = resolve(COHORT_ROOT, 'data/studio-distribution.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function platformTarget(platform = process.platform, arch = process.arch) {
  if (!['win32', 'darwin', 'linux'].includes(platform)) return null;
  if (!['x64', 'arm64'].includes(arch)) return null;
  if (platform === 'win32' && arch !== 'x64') return null;
  return `${platform}-${arch}`;
}

export function validateDistribution(distribution = loadDistribution()) {
  if (distribution?.schemaVersion !== '1.0.0') return { ok: false, code: 'DISTRIBUTION_SCHEMA_INVALID' };
  if (distribution.distributionStatus !== 'ready') {
    return { ok: false, code: 'STUDIO_DISTRIBUTION_UNAVAILABLE', status: distribution.distributionStatus };
  }
  const required = ['win32-x64', 'darwin-x64', 'darwin-arm64', 'linux-x64'];
  for (const key of required) {
    const artifact = distribution.artifacts?.[key];
    if (!artifact) return { ok: false, code: 'DISTRIBUTION_ARTIFACT_MISSING', target: key };
    if (`${artifact.platform}-${artifact.arch}` !== key) return { ok: false, code: 'DISTRIBUTION_ARCH_MISMATCH', target: key };
    if (!/^https:\/\//.test(artifact.url) || !/^\d+\.\d+\.\d+/.test(artifact.version)
      || !Number.isInteger(artifact.sizeBytes) || artifact.sizeBytes < 1
      || !/^[a-f0-9]{64}$/.test(artifact.sha256)
      || !['zip', 'tar.gz'].includes(artifact.format)) {
      return { ok: false, code: 'DISTRIBUTION_ARTIFACT_INVALID', target: key };
    }
  }
  return { ok: true };
}

export function resolveStudioRoot({ requireExisting = true } = {}) {
  const env = process.env.AIOX_STUDIO_ROOT || process.env.MARKETING_STUDIO_ROOT;
  if (env && existsSync(env)) return resolve(env);
  const dist = loadDistribution();
  const candidate = resolve(COHORT_ROOT, dist.defaultRelativePath || '../academia-lendaria-ads-studio');
  if (existsSync(candidate)) return candidate;
  if (!requireExisting) return candidate;
  throw new Error('Studio nao encontrado — defina AIOX_STUDIO_ROOT');
}

export function detectPlatform() {
  return process.platform;
}

export async function detectStudio() {
  const root = resolveStudioRoot({ requireExisting: false });
  const target = platformTarget();
  if (!target) return { ok: false, code: 'STUDIO_PLATFORM_INCOMPATIBLE', platform: process.platform, arch: process.arch };
  if (!existsSync(root)) {
    const distribution = loadDistribution();
    const validation = validateDistribution(distribution);
    return {
      ok: false,
      code: validation.ok ? 'STUDIO_NOT_INSTALLED' : validation.code,
      root,
      target,
      artifact: validation.ok ? distribution.artifacts[target] : null,
    };
  }
  const launcher = resolve(root, 'scripts/marketing-studio.mjs');
  if (!existsSync(launcher)) {
    return { ok: false, code: 'STUDIO_CORRUPTED', root, target };
  }
  const packagePath = resolve(root, 'apps/academia-lendaria-ads-studio/package.json');
  if (!existsSync(packagePath)) return { ok: false, code: 'STUDIO_CORRUPTED', root, target };
  const installedVersion = JSON.parse(readFileSync(packagePath, 'utf8')).version;
  const dist = loadDistribution();
  const expectedVersion = dist.artifacts?.[target]?.version ?? null;
  if (dist.distributionStatus === 'ready' && expectedVersion && installedVersion !== expectedVersion) {
    return { ok: false, code: 'STUDIO_OUTDATED', root, launcher, target, installedVersion, expectedVersion, artifact: dist.artifacts[target] };
  }
  return { ok: true, status: 'installed', root, launcher, target, installedVersion, source: 'local-repository' };
}

export function detectDockerState() {
  const version = spawnSync('docker', ['--version'], { encoding: 'utf8', windowsHide: true });
  if (version.error?.code === 'ENOENT') return { ok: false, code: 'DOCKER_NOT_INSTALLED' };
  const info = spawnSync('docker', ['info'], { encoding: 'utf8', windowsHide: true, timeout: 15_000 });
  if (info.status === 0) return { ok: true, code: 'DOCKER_READY' };
  const detail = `${info.stderr ?? ''}\n${info.stdout ?? ''}`;
  if (/permission denied|access is denied/i.test(detail)) return { ok: false, code: 'DOCKER_PERMISSION_DENIED' };
  return { ok: false, code: 'DOCKER_STOPPED' };
}
