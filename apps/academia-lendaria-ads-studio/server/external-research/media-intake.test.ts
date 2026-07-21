import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_ALLOWED_MEDIA_MIME_TYPES,
  MediaIntakeLimitError,
  MediaIntakeMimeError,
  MediaIntakeSecurityError,
  assertPublicHttpsUrl,
  intakeMedia,
  isPrivateHostname,
  sanitizeUrlForManifest,
  type MediaDnsLookup,
} from './media-intake.js'

const dirs: string[] = []

async function runtimeRoot(prefix = 'media-intake-test-'): Promise<string> {
  const dir = await mkdtemp(resolve(tmpdir(), prefix))
  dirs.push(dir)
  return dir
}

const publicDns: MediaDnsLookup = async () => [{ address: '93.184.216.34', family: 4 }]

function mediaResponse(bytes: Uint8Array, headers: Record<string, string>): Response {
  return new Response(bytes, { status: 200, headers })
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('isPrivateHostname / SSRF surface', () => {
  it.each([
    'localhost',
    'foo.local',
    'service.internal',
    '127.0.0.1',
    '10.1.2.3',
    '172.16.5.9',
    '192.168.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '::1',
    'fd00::1',
    'fe80::1',
  ])('marks %s as private', (host) => {
    expect(isPrivateHostname(host)).toBe(true)
  })

  it.each(['example.com', '93.184.216.34', '8.8.8.8', 'cdn.mux.com'])('marks %s as public', (host) => {
    expect(isPrivateHostname(host)).toBe(false)
  })
})

describe('assertPublicHttpsUrl', () => {
  it('rejects non-https schemes', async () => {
    await expect(assertPublicHttpsUrl('http://example.com/a.mp3', publicDns)).rejects.toBeInstanceOf(MediaIntakeSecurityError)
  })

  it('rejects embedded credentials', async () => {
    await expect(assertPublicHttpsUrl('https://user:pass@example.com/a.mp3', publicDns)).rejects.toThrow(/credenciais/)
  })

  it('rejects a private literal host without touching DNS', async () => {
    const dns = vi.fn()
    await expect(assertPublicHttpsUrl('https://127.0.0.1/a.mp3', dns)).rejects.toThrow(/host privado/)
    expect(dns).not.toHaveBeenCalled()
  })

  it('rejects a public host that resolves to a private address (DNS rebinding)', async () => {
    const dns: MediaDnsLookup = async () => [{ address: '10.0.0.5', family: 4 }]
    await expect(assertPublicHttpsUrl('https://evil.example.com/a.mp3', dns)).rejects.toThrow(/rede privada/)
  })
})

describe('sanitizeUrlForManifest / redaction', () => {
  it('drops query, fragment and userinfo', () => {
    expect(sanitizeUrlForManifest('https://user:secret@cdn.example.com/v.mp4?token=abc123&sig=xyz#frag')).toBe(
      'https://cdn.example.com/v.mp4',
    )
  })
})

describe('intakeMedia — url origin', () => {
  it('downloads a public audio url and returns a sanitized manifest with sha256/bytes', async () => {
    const bytes = new TextEncoder().encode('conteudo-de-audio-falso')
    const fetchImpl = vi.fn(async () =>
      mediaResponse(bytes, { 'content-type': 'audio/mpeg', 'content-length': String(bytes.length) }),
    )
    const result = await intakeMedia(
      { origin: 'url', url: 'https://cdn.example.com/reels/audio.mp3?token=SUPERSECRET&sig=zzz' },
      { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns, now: () => new Date('2026-07-11T10:00:00Z') },
    )

    expect(result.manifest.origin).toBe('url')
    expect(result.manifest.mediaKind).toBe('audio')
    expect(result.manifest.mimeType).toBe('audio/mpeg')
    expect(result.manifest.byteSize).toBe(bytes.length)
    expect(result.manifest.sha256).toMatch(/^[a-f0-9]{64}$/)
    // redação: nenhuma query sensível nem caminho absoluto no manifesto público
    expect(result.manifest.sourceLabel).toBe('https://cdn.example.com/reels/audio.mp3')
    const serialized = JSON.stringify(result.manifest)
    expect(serialized).not.toContain('SUPERSECRET')
    expect(serialized).not.toContain('token=')
    expect(serialized).not.toContain(result.localPath)
    // arquivo materializado é content-addressed dentro do runtime
    expect(result.localPath).toContain(result.manifest.sha256)
  })

  it('follows a public https redirect but re-validates each hop', async () => {
    const bytes = new TextEncoder().encode('video-bytes')
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://cdn2.example.com/final.mp4' } }))
      .mockResolvedValueOnce(mediaResponse(bytes, { 'content-type': 'video/mp4' }))
    const result = await intakeMedia(
      { origin: 'url', url: 'https://cdn.example.com/go' },
      { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns },
    )
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(result.manifest.sourceLabel).toBe('https://cdn2.example.com/final.mp4')
    expect(result.manifest.mediaKind).toBe('video')
  })

  it('blocks a redirect that targets a private/non-https host (SSRF via redirect)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } }))
    await expect(
      intakeMedia(
        { origin: 'url', url: 'https://cdn.example.com/go' },
        { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns },
      ),
    ).rejects.toBeInstanceOf(MediaIntakeSecurityError)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('rejects a mime outside the audio/video allowlist', async () => {
    const bytes = new TextEncoder().encode('<html>not media</html>')
    const fetchImpl = vi.fn(async () => mediaResponse(bytes, { 'content-type': 'text/html' }))
    await expect(
      intakeMedia(
        { origin: 'url', url: 'https://cdn.example.com/page' },
        { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns },
      ),
    ).rejects.toBeInstanceOf(MediaIntakeMimeError)
  })

  it('rejects up-front when content-length exceeds the byte cap', async () => {
    const fetchImpl = vi.fn(async () =>
      mediaResponse(new Uint8Array(4), { 'content-type': 'audio/mpeg', 'content-length': '999999' }),
    )
    await expect(
      intakeMedia(
        { origin: 'url', url: 'https://cdn.example.com/big.mp3' },
        { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns, maxBytes: 8 },
      ),
    ).rejects.toBeInstanceOf(MediaIntakeLimitError)
  })

  it('enforces the byte cap during streaming even when content-length lies', async () => {
    const bytes = new Uint8Array(64).fill(7)
    const fetchImpl = vi.fn(async () => mediaResponse(bytes, { 'content-type': 'audio/mpeg' }))
    await expect(
      intakeMedia(
        { origin: 'url', url: 'https://cdn.example.com/sneaky.mp3' },
        { runtimeRoot: await runtimeRoot(), fetchImpl, dnsLookup: publicDns, maxBytes: 16 },
      ),
    ).rejects.toBeInstanceOf(MediaIntakeLimitError)
  })
})

describe('intakeMedia — file origin', () => {
  it('ingests a confined file and labels it by basename only (no absolute path)', async () => {
    const root = await runtimeRoot('media-intake-confined-')
    const stagedRoot = await runtimeRoot('media-intake-staged-')
    const media = resolve(root, 'entrevista.wav')
    await writeFile(media, Buffer.from('RIFFxxxxWAVE-fake'))
    const result = await intakeMedia(
      { origin: 'file', path: media, confinementRoot: root },
      { runtimeRoot: stagedRoot },
    )
    expect(result.manifest.origin).toBe('file')
    expect(result.manifest.sourceLabel).toBe('entrevista.wav')
    expect(result.manifest.mimeType).toBe('audio/wav')
    expect(result.manifest.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(result.manifest)).not.toContain(root)
    expect(result.localPath).toBe(resolve(stagedRoot, result.manifest.sha256))
    expect(result.localPath).not.toBe(media)
  })

  it('rejects a path that escapes the confinement root', async () => {
    const root = await runtimeRoot('media-intake-root-')
    const outside = await runtimeRoot('media-intake-outside-')
    const media = resolve(outside, 'secret.mp3')
    await writeFile(media, Buffer.from('fake'))
    await expect(
      intakeMedia({ origin: 'file', path: media, confinementRoot: root }, { runtimeRoot: await runtimeRoot() }),
    ).rejects.toBeInstanceOf(MediaIntakeSecurityError)
  })

  it('rejects a symlink inside the root that points outside it', async () => {
    const root = await runtimeRoot('media-intake-symroot-')
    const outside = await runtimeRoot('media-intake-symout-')
    const target = resolve(outside, 'passwd.mp3')
    await writeFile(target, Buffer.from('sensitive'))
    const link = resolve(root, 'link.mp3')
    await symlink(target, link)
    await expect(
      intakeMedia({ origin: 'file', path: link, confinementRoot: root }, { runtimeRoot: await runtimeRoot() }),
    ).rejects.toBeInstanceOf(MediaIntakeSecurityError)
  })

  it('rejects a confined file whose mime is not allowed', async () => {
    const root = await runtimeRoot('media-intake-mime-')
    const media = resolve(root, 'notes.txt')
    await writeFile(media, Buffer.from('apenas texto'))
    await expect(
      intakeMedia({ origin: 'file', path: media, confinementRoot: root }, { runtimeRoot: await runtimeRoot() }),
    ).rejects.toBeInstanceOf(MediaIntakeMimeError)
  })

  it('rejects a confined file larger than the byte cap', async () => {
    const root = await runtimeRoot('media-intake-size-')
    await mkdir(root, { recursive: true })
    const media = resolve(root, 'grande.mp4')
    await writeFile(media, Buffer.alloc(4096, 1))
    await expect(
      intakeMedia({ origin: 'file', path: media, confinementRoot: root }, { runtimeRoot: await runtimeRoot(), maxBytes: 1024 }),
    ).rejects.toBeInstanceOf(MediaIntakeLimitError)
  })

  it('exposes an audio/video allowlist that excludes generic binary types', () => {
    expect(DEFAULT_ALLOWED_MEDIA_MIME_TYPES).not.toContain('application/octet-stream')
    expect(DEFAULT_ALLOWED_MEDIA_MIME_TYPES).toContain('audio/mpeg')
    expect(DEFAULT_ALLOWED_MEDIA_MIME_TYPES).toContain('video/mp4')
  })
})
