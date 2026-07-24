import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadDistribution, platformTarget, resolveStudioRoot, validateDistribution } from './discovery.mjs';

export async function installOrUpdateStudio(input = {}) {
  const distribution = input.distribution ?? loadDistribution();
  const validation = validateDistribution(distribution);
  if (!validation.ok) {
    const error = new Error(validation.code);
    error.code = validation.code;
    throw error;
  }
  const target = platformTarget(input.platform, input.arch);
  const artifact = distribution.artifacts[target];
  if (!artifact || `${artifact.platform}-${artifact.arch}` !== target) {
    const error = new Error(`STUDIO_PACKAGE_UNAVAILABLE:${target}`);
    error.code = 'STUDIO_PACKAGE_UNAVAILABLE';
    throw error;
  }
  const destination = resolve(input.destination ?? resolveStudioRoot({ requireExisting: false }));
  const staging = `${destination}.staging-${process.pid}`;
  const archive = join(dirname(destination), `.studio-${target}-${artifact.version}.${artifact.format === 'zip' ? 'zip' : 'tar.gz'}`);
  mkdirSync(dirname(destination), { recursive: true });
  const response = await (input.fetch ?? fetch)(artifact.url);
  if (!response.ok || !response.body) throw new Error(`STUDIO_DOWNLOAD_FAILED:HTTP_${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
  if (statSync(archive).size !== artifact.sizeBytes) throw new Error('STUDIO_PACKAGE_SIZE_MISMATCH');
  const bytes = await import('node:fs/promises').then((fs) => fs.readFile(archive));
  if (createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) throw new Error('STUDIO_PACKAGE_CHECKSUM_MISMATCH');
  if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  const extraction = artifact.format === 'zip'
    ? spawnSync('powershell', ['-NoProfile', '-Command', 'Expand-Archive', '-LiteralPath', archive, '-DestinationPath', staging, '-Force'], { encoding: 'utf8', windowsHide: true })
    : spawnSync('tar', ['-xzf', archive, '-C', staging], { encoding: 'utf8' });
  if (extraction.status !== 0) throw new Error(`STUDIO_PACKAGE_EXTRACT_FAILED:${extraction.stderr || extraction.stdout}`);
  if (!existsSync(join(staging, 'scripts/marketing-studio.mjs'))) throw new Error('STUDIO_PACKAGE_CORRUPTED');
  if (existsSync(destination)) {
    const backup = `${destination}.previous`;
    if (existsSync(backup)) rmSync(backup, { recursive: true, force: true });
    renameSync(destination, backup);
  }
  renameSync(staging, destination);
  rmSync(archive, { force: true });
  return { ok: true, target, version: artifact.version, destination, sha256: artifact.sha256 };
}
