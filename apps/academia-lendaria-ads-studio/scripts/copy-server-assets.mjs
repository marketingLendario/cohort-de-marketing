import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(appRoot, 'server/external-research/collector-worker.mjs');
const destination = resolve(appRoot, 'dist/server/external-research/collector-worker.mjs');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
