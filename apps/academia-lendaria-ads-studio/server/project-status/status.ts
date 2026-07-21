import type { BookDoFunilState } from '../document-pack/book-reconciler.js'

export interface ProjectStatusArtifact {
  artifactType: string
  path: string
  verification: string
}

export interface ProjectStatusPiece {
  id: string
  title: string
  path: string
  skillId: string
  filesystem: boolean
  database: boolean
  book: boolean
  converged: boolean
  applicable: boolean
}

export interface ProjectStatusSnapshot {
  schemaVersion: '1.0.0'
  projectSlug: string
  pieces: ProjectStatusPiece[]
  alternatives: Array<{ id: string; path: string; skillId: string }>
  pending: { open: number; resolved: number; decisions: Array<{ key: string; resolved: boolean }> }
  completed: number
  total: number
  nextCommand: string
  divergences: Array<{ pieceId: string; missing: Array<'filesystem' | 'database' | 'book'> }>
  profile: { offerType: string | null; destination: string | null; voice: string | null; affiliate: boolean }
  guidance: string | null
}

const PIECES = [
  { id: 'avatar', title: 'Avatar', skillId: 'avatar-funil', path: 'avatar.md', artifactTypes: ['avatar'] },
  { id: 'offerbook', title: 'Offerbook', skillId: 'offerbook', path: 'offerbook.md', artifactTypes: ['offerbook'] },
  { id: 'design', title: 'Identidade visual', skillId: 'design-md', path: 'DESIGN.md', artifactTypes: ['design'] },
  { id: 'funnel', title: 'Diagnóstico do funil', skillId: 'metodo-funil', path: 'funil.md', artifactTypes: ['funnel'] },
  { id: 'copy', title: 'Copy', skillId: 'copy-funil', path: 'copy.md', artifactTypes: ['copy'] },
  { id: 'sales-page', title: 'Página de vendas', skillId: 'pagina-vendas-funil', path: 'pagina/', artifactTypes: ['salesPage'] },
  { id: 'emails', title: 'E-mails', skillId: 'email-funil', path: 'emails/', artifactTypes: ['emails'] },
  { id: 'content', title: 'Conteúdo', skillId: 'conteudo-funil', path: 'conteudo/', artifactTypes: ['content'] },
  { id: 'recovery', title: 'Recuperação', skillId: 'recuperacao-funil', path: 'recuperacao.md', artifactTypes: ['recovery'] },
  { id: 'backend', title: 'Back-end', skillId: 'backend-funil', path: 'backend-funil.md', artifactTypes: ['backend'] },
  { id: 'cro', title: 'CRO', skillId: 'cro-funil', path: 'cro.md', artifactTypes: ['cro'] },
] as const

const ALTERNATIVES = [
  ['vsl', 'vsl.md', 'vsl-funil'],
  ['advertorial', 'advertorial.md', 'advertorial-funil'],
  ['quiz', 'quiz.md', 'quiz-funil'],
  ['webinar', 'webinario.md', 'webinario-funil'],
  ['launch', 'lancamento.md', 'lancamento-funil'],
  ['whatsapp', 'whatsapp.md', 'whatsapp-funil'],
  ['creatives', 'criativos/', 'criativos-funil'],
  ['mockups', 'mockups/', 'mockup-produto-funil'],
] as const

function normalizedPaths(paths: string[]): Set<string> {
  return new Set(paths.map((path) => path.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/')))
}

function pathExists(paths: Set<string>, expected: string): boolean {
  return expected.endsWith('/')
    ? [...paths].some((path) => path.startsWith(expected) && path.length > expected.length)
    : paths.has(expected)
}

function normalizedText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function parseProjectProfile(content: string | null | undefined): ProjectStatusSnapshot['profile'] {
  function field(labels: string[]): string | null {
    if (!content) return null
    for (const line of content.split(/\r?\n/)) {
      const plain = line.replaceAll('**', '').replace(/^\s*[-#>]+\s*/, '').trim()
      const separator = plain.indexOf(':')
      if (separator < 0) continue
      const key = normalizedText(plain.slice(0, separator).trim())
      if (labels.some((label) => key === normalizedText(label))) return plain.slice(separator + 1).trim() || null
    }
    return null
  }
  const offerType = field(['Tipo', 'Tipo de oferta'])
  const destination = field(['Destino', 'Destino do fechamento'])
  const voice = field(['Voz'])
  const situation = field(['Situação de partida', 'Situacao de partida'])
  return { offerType, destination, voice, affiliate: normalizedText(`${offerType ?? ''} ${situation ?? ''}`).includes('afiliad') }
}

function prescribedNextSkill(content: string | null | undefined): string | null {
  const line = content?.split(/\r?\n/).find((candidate) => /(?:←\s*)?PR[ÓO]XIMO/i.test(candidate))
  if (!line) return null
  const value = normalizedText(line)
  const options: Array<[RegExp, string]> = [
    [/avatar/, 'avatar-funil'], [/offerbook|oferta/, 'offerbook'], [/design|identidade/, 'design-md'],
    [/diagnostico|mapa do funil/, 'metodo-funil'], [/copy/, 'copy-funil'], [/vsl/, 'vsl-funil'],
    [/advertorial/, 'advertorial-funil'], [/quiz/, 'quiz-funil'], [/webinario/, 'webinario-funil'],
    [/lancamento/, 'lancamento-funil'], [/pagina|checkout|reuniao/, 'pagina-vendas-funil'],
    [/e-?mail/, 'email-funil'], [/whatsapp/, 'whatsapp-funil'], [/conteudo/, 'conteudo-funil'],
    [/recuperacao/, 'recuperacao-funil'], [/back-?end|upsell|downsell/, 'backend-funil'], [/cro|otimizacao/, 'cro-funil'],
  ]
  return options.find(([pattern]) => pattern.test(value))?.[1] ?? null
}

export function parseProjectPendings(content: string | null | undefined): Array<{ key: string; resolved: boolean }> {
  if (!content) return []
  const decisions = new Map<string, boolean>()
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const match = line.match(/<!--\s*key:\s*([a-z0-9-]+)\s*-->/i)
    if (!match) continue
    const checkboxLine = /\[[ xX]\]/.test(line) ? line : (lines[index - 1] ?? '')
    const resolved = /\[[xX]\]/.test(checkboxLine)
    const key = match[1]!.toLowerCase()
    decisions.set(key, (decisions.get(key) ?? true) && resolved)
  }
  return [...decisions]
    .map(([key, resolved]) => ({ key, resolved }))
    .sort((left, right) => left.key.localeCompare(right.key))
}

export function evaluateProjectStatus(input: {
  projectSlug: string
  filesystemPaths: string[]
  artifacts: ProjectStatusArtifact[]
  book: BookDoFunilState | null
  pendingMarkdown?: string | null
  profileMarkdown?: string | null
  funnelMarkdown?: string | null
}): ProjectStatusSnapshot {
  const paths = normalizedPaths(input.filesystemPaths)
  const cards = new Set(input.book?.cards.map((card) => card.id) ?? [])
  const profile = parseProjectProfile(input.profileMarkdown)
  const pieces = PIECES.map<ProjectStatusPiece>((piece) => {
    const applicable = !(piece.id === 'backend' && profile.affiliate)
    const filesystem = pathExists(paths, piece.path)
    const database = input.artifacts.some((artifact) => artifact.verification === 'confirmed' && (
      artifact.path === piece.path.replace(/\/$/, '')
      || (piece.path.endsWith('/') && artifact.path.startsWith(piece.path))
      || (piece.artifactTypes as readonly string[]).includes(artifact.artifactType)
    ))
    const book = cards.has(piece.skillId)
    return { id: piece.id, title: piece.title, path: piece.path, skillId: piece.skillId, filesystem, database, book, applicable, converged: !applicable || (filesystem && database && book) }
  })
  const pending = parseProjectPendings(input.pendingMarkdown)
  const prescribedSkillId = prescribedNextSkill(input.funnelMarkdown)
  const prescribedPiece = pieces.find((piece) => piece.skillId === prescribedSkillId && piece.applicable && !piece.filesystem)
  const prescribedAlternative = ALTERNATIVES.find(([, , skillId]) => skillId === prescribedSkillId)
  const prescribedAlternativeMissing = prescribedAlternative ? !pathExists(paths, prescribedAlternative[1]) : false
  const firstMissing = prescribedPiece ?? pieces.find((piece) => piece.applicable && !piece.filesystem)
  const divergences = pieces.filter((piece) => piece.applicable && (piece.filesystem || piece.database || piece.book)).flatMap((piece) => {
    const missing: Array<'filesystem' | 'database' | 'book'> = []
    if (!piece.filesystem) missing.push('filesystem')
    if (!piece.database) missing.push('database')
    if (!piece.book) missing.push('book')
    return missing.length ? [{ pieceId: piece.id, missing }] : []
  })
  return {
    schemaVersion: '1.0.0',
    projectSlug: input.projectSlug,
    pieces,
    alternatives: ALTERNATIVES.filter(([, path]) => pathExists(paths, path)).map(([id, path, skillId]) => ({ id, path, skillId })),
    pending: {
      open: pending.filter((decision) => !decision.resolved).length,
      resolved: pending.filter((decision) => decision.resolved).length,
      decisions: pending,
    },
    completed: pieces.filter((piece) => piece.applicable && piece.filesystem).length,
    total: pieces.filter((piece) => piece.applicable).length,
    nextCommand: prescribedSkillId && prescribedAlternativeMissing
      ? `/${prescribedSkillId}`
      : firstMissing ? `/${firstMissing.skillId}` : '/cro-funil',
    divergences,
    profile,
    guidance: profile.affiliate
      ? 'Afiliado: use a oferta do produtor e não presuma um back-end próprio.'
      : normalizedText(profile.destination ?? '').includes('reuniao')
        ? 'Fechamento por reunião: qualifique e agende; não presuma checkout.'
        : profile.offerType && /fisico|varejo-local/.test(normalizedText(profile.offerType))
          ? 'Oferta local: priorize presença regional, WhatsApp e oferta no ponto.'
          : null,
  }
}

export function renderProjectStatusMarkdown(status: ProjectStatusSnapshot): string {
  const rows = status.pieces.map((piece, index) => `${!piece.applicable ? '[-]' : piece.filesystem ? '[x]' : '[ ]'} ${index + 1}. ${piece.title.padEnd(20)} ${piece.path}${!piece.applicable ? ' (não se aplica)' : !piece.filesystem && status.nextCommand === `/${piece.skillId}` ? ' <- você está aqui' : ''}`)
  const alternatives = status.alternatives.length ? `\n\nPeças alternativas: ${status.alternatives.map((piece) => piece.path).join(', ')}` : ''
  const drift = status.divergences.length ? `\n\nDivergências de reconciliação: ${status.divergences.map((entry) => `${entry.pieceId} sem ${entry.missing.join('/')}`).join('; ')}` : ''
  const guidance = status.guidance ? `\n\nContexto: ${status.guidance}` : ''
  return `Funil: ${status.projectSlug} (${status.completed}/${status.total} peças)\n\n${rows.join('\n')}${alternatives}\n\nPendências do dono: ${status.pending.open} abertas · ${status.pending.resolved} resolvidas${drift}${guidance}\n\nPróximo passo: rode ${status.nextCommand}.\n`
}
