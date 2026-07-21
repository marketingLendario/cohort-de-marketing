import { describe, expect, it } from 'vitest'
import { mediaIntakeRequestSchema } from './media-orchestrator.js'

describe('media intake request contract', () => {
  it('accepts a public media URL with an explicit operator transcript', () => {
    expect(mediaIntakeRequestSchema.parse({ items: [{
      id: 'reference-1', role: 'reference-content', language: 'pt',
      source: { origin: 'url', url: 'https://cdn.example.com/reel.mp4' },
      pastedTranscript: 'Fala literal fornecida pelo operador.',
    }] }).items).toHaveLength(1)
  })

  it('rejects unknown fields and unsupported roles', () => {
    expect(() => mediaIntakeRequestSchema.parse({ items: [{
      id: 'x', role: 'invented', source: { origin: 'url', url: 'https://example.com/a.mp4' },
    }] })).toThrow()
  })
})
