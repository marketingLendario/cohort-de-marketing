export type LocalBootstrapStatus = 'empty' | 'closed'

export interface LocalBootstrapResult {
  status: LocalBootstrapStatus
}

export interface LocalBootstrapInput {
  email: string
  password: string
  workspaceName: string
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown }
    return typeof body.message === 'string' ? body.message : 'Não foi possível concluir o primeiro acesso.'
  } catch {
    return 'Não foi possível concluir o primeiro acesso.'
  }
}

export async function getLocalBootstrapStatus(): Promise<LocalBootstrapResult | null> {
  const response = await fetch('/api/local/bootstrap/status', { headers: { accept: 'application/json' } })
  if (!response.ok) return null
  const body = (await response.json()) as Partial<LocalBootstrapResult>
  return body.status === 'empty' || body.status === 'closed' ? { status: body.status } : null
}

export async function createLocalBootstrap(input: LocalBootstrapInput): Promise<void> {
  const response = await fetch('/api/local/bootstrap', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(await readError(response))
}
