import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import type { SkillProposal } from '../local-skill-runner.js'

const cssColor = z.string().trim().min(1).max(140).refine(
  (value) => /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab)\([^;{}<>]{1,120}\)|transparent|currentColor)$/i.test(value),
  'Cor CSS inválida.',
)
const rawDesignTokensSchema = z.object({
  name: z.string().trim().min(1).max(120),
  version: z.union([z.string(), z.number()]).transform(String),
  colors: z.record(z.string(), cssColor).refine((colors) => Object.keys(colors).length >= 4, 'A identidade exige ao menos quatro cores.'),
  typography: z.record(z.string(), z.unknown()),
  radius: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
}).passthrough()

export interface DesignTokens {
  name: string
  version: string
  colors: Record<string, string>
  typography: Record<string, unknown> & { display: string; body: string }
  radius?: Record<string, string | number>
  [key: string]: unknown
}

function fontFamily(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  return [record.family, record.fontFamily, record.name].find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)?.trim()
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function parseDesignTokens(content: string): DesignTokens {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)
  if (!match) throw new Error('DESIGN.md precisa de frontmatter YAML para gerar preview verificável.')
  const parsed = rawDesignTokensSchema.parse(parseYaml(match[1]!))
  const display = ['display', 'heading', 'headings', 'title', 'h1'].map((key) => fontFamily(parsed.typography[key])).find(Boolean)
  const body = ['body', 'text', 'paragraph', 'copy'].map((key) => fontFamily(parsed.typography[key])).find(Boolean)
  if (!display || !body) throw new Error('DESIGN.md precisa declarar famílias de fonte para display e body.')
  return { ...parsed, typography: { ...parsed.typography, display, body } }
}

export function renderDesignPreview(tokens: DesignTokens): string {
  const colors = Object.entries(tokens.colors)
  const primary = tokens.colors.primary ?? colors[0]![1]
  const secondary = tokens.colors.secondary ?? colors[1]![1]
  const surface = tokens.colors.surface ?? tokens.colors.background ?? '#ffffff'
  const text = tokens.colors.text ?? '#111111'
  const elevated = tokens.colors['surface-elevated'] ?? surface
  const safeDisplay = escapeHtml(tokens.typography.display)
  const safeBody = escapeHtml(tokens.typography.body)
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview · ${escapeHtml(tokens.name)}</title><style>
:root{--primary:${primary};--secondary:${secondary};--surface:${surface};--elevated:${elevated};--text:${text}}
*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--text);font-family:${JSON.stringify(safeBody)},Arial,sans-serif;letter-spacing:0}.shell{max-width:1120px;margin:auto;padding:48px 28px}.eyebrow{font-size:12px;text-transform:uppercase;color:var(--secondary)}h1{max-width:760px;margin:12px 0 28px;font-family:${JSON.stringify(safeDisplay)},Georgia,serif;font-size:54px;line-height:1.02;letter-spacing:0}.actions{display:flex;gap:10px;flex-wrap:wrap}.button{display:inline-flex;min-height:44px;align-items:center;padding:0 18px;border:1px solid var(--primary);border-radius:4px;background:var(--primary);color:var(--surface);font-weight:700}.button.alt{background:transparent;color:var(--text)}.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:54px}.swatch{min-height:154px;padding:16px;border:1px solid color-mix(in srgb,var(--text) 18%,transparent);border-radius:6px;background:var(--elevated)}.chip{height:70px;border-radius:4px;border:1px solid color-mix(in srgb,var(--text) 15%,transparent)}.swatch strong,.swatch span{display:block;margin-top:10px}.swatch span{font-size:12px;opacity:.72}@media(max-width:600px){.shell{padding:30px 18px}h1{font-size:38px}.swatches{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style></head><body><main class="shell"><div class="eyebrow">Design System · v${escapeHtml(tokens.version)}</div><h1>${escapeHtml(tokens.name)}</h1><div class="actions"><span class="button">Ação principal</span><span class="button alt">Ação secundária</span></div><section class="swatches" aria-label="Paleta">${colors.map(([name, color]) => `<article class="swatch"><div class="chip" style="background:${color}"></div><strong>${escapeHtml(name)}</strong><span>${color}</span></article>`).join('')}</section></main></body></html>`
}

export function enrichDesignProposal(proposal: SkillProposal): void {
  const source = proposal.artifacts.find((artifact) => artifact.artifactType === 'design' && artifact.format === 'markdown')
  if (!source) throw new Error('design-md não devolveu o DESIGN.md fonte.')
  const tokens = parseDesignTokens(source.content)
  proposal.artifacts.push({
    artifactType: 'design',
    title: 'Tokens da identidade',
    path: 'tokens.json',
    format: 'json',
    content: `${JSON.stringify(tokens, null, 2)}\n`,
  }, {
    artifactType: 'design',
    title: 'Preview da identidade',
    path: 'preview.html',
    format: 'html',
    content: renderDesignPreview(tokens),
  })
  proposal.fields.push({ key: 'designPreviewValidated', value: 'true' })
}
