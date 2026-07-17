import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Privacy gate para evidence JSON de piloto (STORY-12.W5.1).
 *
 * Portado de `aula-03/ads-studio/server/evidence-privacy.ts` (material de
 * aula, mesmo autor/mesma lógica) — não importado de lá porque aquele
 * diretório é um snapshot congelado de material didático, fora do
 * `file_scope` desta story; a lógica de scan é reusada verbatim (sem
 * reinventar uma segunda heurística), com UM finding a mais específico deste
 * epic: `meta-mutation` (AC4 — o evidence precisa provar
 * `meta-mutation-requests: []`; um array não-vazio aqui é tratado como
 * reprovação do gate de privacidade/segurança, não apenas do teste).
 */

export interface EvidencePrivacyFinding {
  code: 'secret' | 'absolute-path' | 'email' | 'private-content-key' | 'meta-mutation'
  location: string
}

const VALUE_PATTERNS: Array<[EvidencePrivacyFinding['code'], RegExp]> = [
  ['secret', /(?:apify_api_|sk-|sb_(?:secret|publishable)_|ghp_)[A-Za-z0-9_-]{8,}/i],
  ['secret', /(?:OPENAI_API_KEY|CODEX_API_KEY|APIFY_API_TOKEN|SERVICE_ROLE_KEY|LOCAL_SKILL_RUNNER_TOKEN)/i],
  ['absolute-path', /(?:\/Users\/[^/\s]+\/|[A-Za-z]:\\Users\\[^\\\s]+\\)/],
  ['email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
]
const PRIVATE_KEYS = new Set(['password', 'token', 'authorization', 'operatorinput', 'rawcontent', 'privatecontent', 'author'])

export function scanEvidencePrivacy(value: unknown): EvidencePrivacyFinding[] {
  const findings: EvidencePrivacyFinding[] = []
  function walk(candidate: unknown, location: string): void {
    if (typeof candidate === 'string') {
      for (const [code, pattern] of VALUE_PATTERNS) if (pattern.test(candidate)) findings.push({ code, location })
      return
    }
    if (Array.isArray(candidate)) {
      if (location === '$.meta-mutation-requests' && candidate.length > 0) {
        findings.push({ code: 'meta-mutation', location })
      }
      candidate.forEach((entry, index) => walk(entry, `${location}[${index}]`))
      return
    }
    if (!candidate || typeof candidate !== 'object') return
    for (const [key, entry] of Object.entries(candidate)) {
      const child = location ? `${location}.${key}` : key
      if (PRIVATE_KEYS.has(key.toLowerCase())) findings.push({ code: 'private-content-key', location: child })
      walk(entry, child)
    }
  }
  walk(value, '$')
  return findings
}

export async function validateEvidencePrivacy(paths: string[]): Promise<void> {
  const failures: string[] = []
  for (const path of paths) {
    const findings = scanEvidencePrivacy(JSON.parse(await readFile(resolve(path), 'utf8')))
    failures.push(...findings.map((finding) => `${path}: ${finding.code} em ${finding.location}`))
  }
  if (failures.length) throw new Error(`Privacy gate reprovado:\n${failures.join('\n')}`)
}

async function main() {
  const paths = process.argv.slice(2)
  if (!paths.length) throw new Error('Uso: npm run evidence:privacy -- <evidence.json> [...]')
  await validateEvidencePrivacy(paths)
  process.stdout.write(`Privacy gate aprovado: ${paths.length} arquivo(s).\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Falha no privacy gate.'}\n`)
    process.exitCode = 1
  })
}
