import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const workerPath = fileURLToPath(new URL('./url-worker.mjs', import.meta.url))

interface WorkerResult {
  ok: boolean
  summary?: {
    finalUrl: string
    title: string | null
    byteSize: number
    truncated: boolean
    redirectCount: number
    textSample: string
    cssSample: string
    rawColors: string[]
    rawFontFamilies: string[]
  }
  error?: string
}

function runWorker(request: unknown): Promise<WorkerResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [workerPath], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`worker exit ${code}: ${stderr}`))
      try {
        resolvePromise(JSON.parse(stdout) as WorkerResult)
      } catch (error) {
        reject(error)
      }
    })
    child.stdin.end(JSON.stringify(request))
  })
}

const referenceHtml = `<!doctype html>
<html><head>
<title>  Marca &amp; Cia  </title>
<style>
  :root { --brand: #FF0000; }
  body { background: rgb(18, 18, 18); font-family: "Inter", Arial, sans-serif; }
  h1 { color: hsl(210, 50%, 40%); font-family: Archivo, serif; }
  /* comentário some */
  @import url(https://malicioso.example/evil.css);
</style>
<script>alert('xss'); document.cookie='roubado'</script>
</head><body style="color:#00ff00">
<h1>Fale conosco</h1>
<p>Contato: vendas@marca.com ou +55 11 91234-5678</p>
</body></html>`

describe('url-worker extract action (sanitização determinística)', () => {
  it('remove scripts, redige PII e extrai tokens de design', async () => {
    const result = await runWorker({ action: 'extract', html: referenceHtml, finalUrl: 'https://marca.com/sobre?token=abc#x' })
    expect(result.ok).toBe(true)
    const summary = result.summary!

    // URL sanitizada: sem query/fragment.
    expect(summary.finalUrl).toBe('https://marca.com/sobre')
    expect(summary.title).toBe('Marca & Cia')

    // Sem script; PII redigida.
    expect(summary.textSample).not.toContain('alert(')
    expect(summary.textSample).not.toContain('document.cookie')
    expect(summary.textSample).toContain('[email]')
    expect(summary.textSample).toContain('[telefone]')
    expect(summary.textSample).not.toContain('vendas@marca.com')
    expect(summary.textSample).not.toContain('91234')

    // CSS sanitizado: sem @import externo.
    expect(summary.cssSample).not.toContain('@import')
    expect(summary.cssSample).not.toContain('malicioso')

    // Tokens crus de cor e fonte (a normalização é do adapter).
    expect(summary.rawColors).toContain('#FF0000')
    expect(summary.rawColors.some((color) => color.startsWith('rgb('))).toBe(true)
    expect(summary.rawColors).toContain('#00ff00')
    expect(summary.rawFontFamilies).toContain('Inter')
    expect(summary.rawFontFamilies).toContain('Archivo')
  })
})

describe('url-worker fetch action (SSRF fail-closed)', () => {
  it('recusa esquema não-HTTPS antes de qualquer rede', async () => {
    const result = await runWorker({ action: 'fetch', url: 'http://marca.com/', maxBytes: 1000 })
    expect(result.ok).toBe(false)
    expect(result.error).toContain('HTTPS')
  })

  it('recusa host de loopback (127.0.0.1) fail-closed', async () => {
    const result = await runWorker({ action: 'fetch', url: 'https://127.0.0.1/admin', maxBytes: 1000 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/privado|interno/)
  })

  it('recusa localhost fail-closed', async () => {
    const result = await runWorker({ action: 'fetch', url: 'https://localhost:8080/', maxBytes: 1000 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/privado|interno/)
  })

  it('recusa URL com credenciais embutidas', async () => {
    const result = await runWorker({ action: 'fetch', url: 'https://user:pass@marca.com/', maxBytes: 1000 })
    expect(result.ok).toBe(false)
    expect(result.error).toContain('credenciais')
  })
})
