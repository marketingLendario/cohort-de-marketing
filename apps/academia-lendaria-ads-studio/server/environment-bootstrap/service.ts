import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { chmod, cp, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export type BootstrapStatus = 'ready' | 'degraded' | 'blocked'

export interface BootstrapCheck {
  id: 'os' | 'git' | 'node' | 'python' | 'codex' | 'apify' | 'skill-mirror'
  label: string
  status: BootstrapStatus
  detail: string
  required: boolean
  recoveryActionId?: 'sync-skill-mirror' | 'git-pull-fast-forward' | 'configure-apify'
}

export interface EnvironmentBootstrapSnapshot {
  schemaVersion: '1.0.0'
  status: BootstrapStatus
  checkedAt: string
  diagnosisHash: string
  checks: BootstrapCheck[]
  starts: Array<{ id: 'aula-1' | 'aula-2'; label: string; nextCommand: '/avatar-funil' | '/design-md' }>
}

export interface EnvironmentBootstrapService {
  diagnose(): Promise<EnvironmentBootstrapSnapshot>
  recover(input: { actionId: string; expectedDiagnosisHash: string; consent: boolean; value?: string }): Promise<EnvironmentBootstrapSnapshot>
}

export interface CommandResult {
  ok: boolean
  stdout: string
  stderr: string
}

export interface EnvironmentBootstrapDeps {
  repoRoot: string
  platform?: NodeJS.Platform
  nodeVersion?: string
  env?: NodeJS.ProcessEnv
  now?: () => string
  run?: (command: string, args: string[], options?: { env?: NodeJS.ProcessEnv }) => Promise<CommandResult>
  mirrorEqual?: () => Promise<boolean>
  syncMirror?: () => Promise<void>
  writeApifyToken?: (token: string) => Promise<void>
}

export class EnvironmentBootstrapError extends Error {
  readonly code: 'consent-required' | 'stale-diagnosis' | 'unknown-action'

  constructor(code: EnvironmentBootstrapError['code'], message: string) {
    super(message)
    this.name = 'EnvironmentBootstrapError'
    this.code = code
  }
}

const SECRET = /(?:apify_api_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|sb_(?:secret|publishable)_[A-Za-z0-9_-]+)/g

function safe(value: string): string {
  return value.replace(SECRET, '[REDACTED]').replace(/\s+/g, ' ').trim().slice(0, 180)
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function aggregate(checks: BootstrapCheck[]): BootstrapStatus {
  if (checks.some((check) => check.required && check.status === 'blocked')) return 'blocked'
  if (checks.some((check) => check.status !== 'ready')) return 'degraded'
  return 'ready'
}

async function defaultRun(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}): Promise<CommandResult> {
  return await new Promise((done) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: options.env ?? process.env })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGTERM'), 15_000)
    child.stdout.on('data', (chunk) => { if (stdout.length < 16_000) stdout += String(chunk) })
    child.stderr.on('data', (chunk) => { if (stderr.length < 16_000) stderr += String(chunk) })
    child.once('error', () => { clearTimeout(timer); done({ ok: false, stdout, stderr }) })
    child.once('close', (code) => { clearTimeout(timer); done({ ok: code === 0, stdout, stderr }) })
  })
}

async function collectTree(root: string, prefix = ''): Promise<Array<[string, string]>> {
  const output: Array<[string, string]> = []
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === '__pycache__' || entry.name === '.DS_Store' || entry.name.endsWith('.pyc')) continue
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolute = resolve(root, entry.name)
    if (entry.isDirectory()) output.push(...await collectTree(absolute, relative))
    else if (entry.isFile()) output.push([relative, createHash('sha256').update(await readFile(absolute)).digest('hex')])
  }
  return output
}

function sanitizedCodexEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const result = { ...env }
  delete result.OPENAI_API_KEY
  delete result.CODEX_API_KEY
  return result
}

export function createEnvironmentBootstrapService(deps: EnvironmentBootstrapDeps): EnvironmentBootstrapService {
  const run = deps.run ?? defaultRun
  const environment = deps.env ?? process.env
  const canonicalRoot = resolve(deps.repoRoot, '.claude/skills')
  const mirrorRoot = resolve(deps.repoRoot, '.agents/skills')
  const mirrorEqual = deps.mirrorEqual ?? (async () => JSON.stringify(await collectTree(canonicalRoot)) === JSON.stringify(await collectTree(mirrorRoot)))
  const syncMirror = deps.syncMirror ?? (async () => cp(canonicalRoot, mirrorRoot, { recursive: true, force: true }))
  const writeApifyToken = deps.writeApifyToken ?? (async (token: string) => {
    const envPath = resolve(deps.repoRoot, '.env')
    const prior = await readFile(envPath, 'utf8').catch(() => '')
    const line = `APIFY_API_TOKEN=${token}`
    const next = /^(?:APIFY_API_TOKEN|APIFY_API_KEY)=.*$/m.test(prior)
      ? prior.replace(/^(?:APIFY_API_TOKEN|APIFY_API_KEY)=.*$/m, line)
      : `${prior.trimEnd()}${prior.trim() ? '\n' : ''}${line}\n`
    const temporary = `${envPath}.bootstrap.tmp`
    await writeFile(temporary, next, { encoding: 'utf8', mode: 0o600 })
    await chmod(temporary, 0o600)
    await rename(temporary, envPath)
  })

  async function diagnose(): Promise<EnvironmentBootstrapSnapshot> {
    const platform = deps.platform ?? process.platform
    const nodeVersion = deps.nodeVersion ?? process.versions.node
    const env = environment
    const [git, python, codex, mirror] = await Promise.all([
      run('git', ['-C', deps.repoRoot, 'status', '--porcelain=v1', '--branch']),
      run(platform === 'win32' ? 'python' : 'python3', ['--version']),
      run('codex', ['login', 'status'], { env: sanitizedCodexEnvironment(env) }),
      mirrorEqual(),
    ])
    const nodeMajor = Number(nodeVersion.split('.')[0])
    const gitLines = git.stdout.split(/\r?\n/).filter(Boolean)
    const gitBranch = gitLines[0] ?? ''
    const gitDirty = git.ok && gitLines.slice(1).length > 0
    const gitBehind = /\[behind \d+\]/.test(gitBranch)
    const checks: BootstrapCheck[] = [
      { id: 'os', label: 'Sistema operacional', status: ['darwin', 'linux', 'win32'].includes(platform) ? 'ready' : 'degraded', detail: safe(platform), required: false },
      {
        id: 'git', label: 'Versionamento do projeto',
        status: !git.ok ? 'blocked' : gitDirty || gitBehind ? 'degraded' : 'ready',
        detail: !git.ok ? 'Git ou repositório não encontrado.' : gitDirty ? 'Alterações locais detectadas e preservadas; nenhum pull foi executado.' : gitBehind ? 'A branch local está atrasada e pode avançar sem merge manual.' : 'Repositório alinhado e sem alterações locais.',
        required: true,
        ...(!gitDirty && gitBehind ? { recoveryActionId: 'git-pull-fast-forward' as const } : {}),
      },
      { id: 'node', label: 'Base do Studio', status: nodeMajor >= 22 ? 'ready' : 'blocked', detail: `Node ${safe(nodeVersion)}`, required: true },
      { id: 'python', label: 'Renderização de documentos', status: python.ok ? 'ready' : 'degraded', detail: python.ok ? safe(python.stdout || python.stderr) : 'Python não encontrado.', required: false },
      { id: 'codex', label: 'Acesso à inteligência artificial', status: codex.ok && /logged in|autenticado/i.test(`${codex.stdout}\n${codex.stderr}`) ? 'ready' : 'blocked', detail: codex.ok ? 'Codex autenticado localmente.' : 'Codex não autenticado.', required: true },
      { id: 'apify', label: 'Pesquisa externa', status: env.APIFY_API_TOKEN || env.APIFY_API_KEY ? 'ready' : 'degraded', detail: env.APIFY_API_TOKEN || env.APIFY_API_KEY ? 'Token configurado e oculto.' : 'Token do Apify ainda não configurado.', required: false, ...(!(env.APIFY_API_TOKEN || env.APIFY_API_KEY) ? { recoveryActionId: 'configure-apify' as const } : {}) },
      { id: 'skill-mirror', label: 'Skills do painel e CLI', status: mirror ? 'ready' : 'blocked', detail: mirror ? 'Espelho canônico alinhado.' : 'O espelho das skills divergiu da fonte canônica.', required: true, ...(!mirror ? { recoveryActionId: 'sync-skill-mirror' as const } : {}) },
    ]
    const starts: EnvironmentBootstrapSnapshot['starts'] = [
      { id: 'aula-1', label: 'Começar pela pesquisa', nextCommand: '/avatar-funil' },
      { id: 'aula-2', label: 'Começar pela identidade', nextCommand: '/design-md' },
    ]
    const stable = { checks, starts }
    return {
      schemaVersion: '1.0.0', status: aggregate(checks), checkedAt: (deps.now ?? (() => new Date().toISOString()))(),
      diagnosisHash: hash(stable), ...stable,
    }
  }

  return {
    diagnose,
    async recover(input) {
      if (!input.consent) throw new EnvironmentBootstrapError('consent-required', 'A recuperação exige consentimento explícito.')
      const current = await diagnose()
      if (current.diagnosisHash !== input.expectedDiagnosisHash) throw new EnvironmentBootstrapError('stale-diagnosis', 'O diagnóstico mudou; verifique novamente antes de corrigir.')
      if (input.actionId === 'sync-skill-mirror') await syncMirror()
      else if (input.actionId === 'git-pull-fast-forward') {
        const pulled = await run('git', ['-C', deps.repoRoot, 'pull', '--ff-only'])
        if (!pulled.ok) throw new Error('O Git não conseguiu avançar em fast-forward; nenhuma resolução automática foi aplicada.')
      } else if (input.actionId === 'configure-apify') {
        const token = input.value?.trim() ?? ''
        if (!/^apify_api_[A-Za-z0-9_-]{16,}$/.test(token)) throw new EnvironmentBootstrapError('unknown-action', 'O token informado não tem o formato esperado do Apify.')
        await writeApifyToken(token)
        environment.APIFY_API_TOKEN = token
      } else throw new EnvironmentBootstrapError('unknown-action', 'Ação de recuperação desconhecida.')
      return await diagnose()
    },
  }
}
