import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProjectStatus } from './project-status';

describe('project status browser client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the no-store shared snapshot used by panel and CLI', async () => {
    const payload = { schemaVersion: '1.0.0', readOnly: true, nextCommand: '/avatar-funil' };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchProjectStatus('project/a')).resolves.toMatchObject(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/local/projects/project%2Fa/status', { signal: undefined, cache: 'no-store' });
  });
});
