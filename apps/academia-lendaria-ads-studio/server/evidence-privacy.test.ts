import { describe, expect, it } from 'vitest'
import { scanEvidencePrivacy } from './evidence-privacy.js'

describe('evidence privacy gate', () => {
  it('accepts hashes, relative paths and aggregate counts', () => {
    expect(scanEvidencePrivacy({ path: 'screens/panel.png', sha256: 'a'.repeat(64), count: 3 })).toEqual([])
  })

  it('blocks credentials, PII, absolute paths and raw private fields', () => {
    const findings = scanEvidencePrivacy({
      token: 'secret', email: 'person@example.com', path: '/Users/person/project/file.md', env: 'APIFY_API_TOKEN=hidden',
    })
    expect(new Set(findings.map((finding) => finding.code))).toEqual(new Set(['private-content-key', 'email', 'absolute-path', 'secret']))
  })
})
