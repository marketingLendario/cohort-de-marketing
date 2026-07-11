import { describe, expect, it } from 'vitest'
import { enrichDesignProposal, parseDesignTokens, renderDesignPreview } from './preview.js'
import type { SkillProposal } from '../local-skill-runner.js'

const design = `---
name: Academia Lendaria
version: 1.0.0
colors:
  primary: "#121212"
  secondary: "#e63b2e"
  surface: "#ffffff"
  text: "#171717"
typography:
  display: Archivo
  body: Inter
---

# Identidade
`

describe('brand design preview', () => {
  it('valida tokens e gera preview responsivo autocontido', () => {
    const tokens = parseDesignTokens(design)
    const preview = renderDesignPreview(tokens)

    expect(tokens.colors).toHaveProperty('primary', '#121212')
    expect(preview).toContain('<!doctype html>')
    expect(preview).toContain('@media(max-width:600px)')
    expect(preview).toContain('Academia Lendaria')
    expect(preview).not.toContain('<script')
  })

  it('anexa tokens e preview à proposta canônica', () => {
    const proposal: SkillProposal = {
      summary: 'Identidade pronta',
      resultMarkdown: '# Resultado',
      artifacts: [{ artifactType: 'design', title: 'DESIGN.md', path: 'DESIGN.md', format: 'markdown', content: design }],
      fields: [], questions: [], warnings: [],
    }

    enrichDesignProposal(proposal)

    expect(proposal.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'tokens.json', format: 'json' }),
      expect.objectContaining({ path: 'preview.html', format: 'html' }),
    ]))
    expect(proposal.fields).toContainEqual({ key: 'designPreviewValidated', value: 'true' })
  })

  it('falha fechado quando DESIGN.md não tem contrato visual verificável', () => {
    expect(() => parseDesignTokens('# Sem frontmatter')).toThrow('frontmatter YAML')
    expect(() => parseDesignTokens(design.replace('  text: "#171717"\n', ''))).toThrow('quatro cores')
  })

  it('normaliza o frontmatter Google-spec com cores alpha e famílias estruturadas', () => {
    const rich = design
      .replace('  primary: "#121212"', '  primary: "#121212dd"')
      .replace('  secondary: "#e63b2e"', '  secondary: "rgba(230, 59, 46, 0.9)"')
      .replace('  display: Archivo\n  body: Inter', '  heading:\n    family: Archivo\n    weight: 700\n  body:\n    family: Inter\n    weight: 400')
    const tokens = parseDesignTokens(rich)

    expect(tokens.typography).toMatchObject({ display: 'Archivo', body: 'Inter' })
    expect(tokens.colors.secondary).toBe('rgba(230, 59, 46, 0.9)')
  })
})
