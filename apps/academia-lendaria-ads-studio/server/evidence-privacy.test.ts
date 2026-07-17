import { describe, expect, it } from 'vitest'
import { scanEvidencePrivacy } from './evidence-privacy.js'

describe('evidence privacy gate (STORY-12.W5.1)', () => {
  it('accepts hashes, relative paths, aggregate counts and an empty meta-mutation-requests array', () => {
    expect(scanEvidencePrivacy({ path: 'screens/panel.png', sha256: 'a'.repeat(64), count: 3, 'meta-mutation-requests': [] })).toEqual([])
  })

  it('blocks credentials, PII, absolute paths and raw private fields', () => {
    const findings = scanEvidencePrivacy({
      token: 'secret', email: 'person@example.com', path: '/Users/person/project/file.md', env: 'APIFY_API_TOKEN=hidden',
    })
    expect(new Set(findings.map((finding) => finding.code))).toEqual(new Set(['private-content-key', 'email', 'absolute-path', 'secret']))
  })

  it('blocks a non-empty meta-mutation-requests array (AC4 — zero Meta mutation proof)', () => {
    const findings = scanEvidencePrivacy({
      'meta-mutation-requests': [{ method: 'POST', url: 'https://graph.facebook.com/v24.0/act_123/campaigns' }],
    })
    expect(findings).toEqual([{ code: 'meta-mutation', location: '$.meta-mutation-requests' }])
  })
})
