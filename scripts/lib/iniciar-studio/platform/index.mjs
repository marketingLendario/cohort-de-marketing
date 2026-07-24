export function getPlatformAdapter() {
  if (process.platform === 'win32') return import('./win32.mjs');
  if (process.platform === 'darwin') return import('./darwin.mjs');
  return import('./linux.mjs');
}

export async function registerResumeIntent(_projectRoot, _lease) {
  const adapter = await getPlatformAdapter();
  return adapter.registerResumeIntent?.(_projectRoot, _lease) ?? { ok: true, skipped: true };
}

export async function removeResumeIntent(_projectRoot, _lease) {
  const adapter = await getPlatformAdapter();
  return adapter.removeResumeIntent?.(_projectRoot, _lease) ?? { ok: true, skipped: true };
}

export async function openDeepLink(url) {
  const adapter = await getPlatformAdapter();
  return adapter.openDeepLink(url);
}
