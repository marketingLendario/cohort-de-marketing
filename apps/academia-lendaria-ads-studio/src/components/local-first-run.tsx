import { useEffect, useState } from 'react'
import { Alert, Button, Input, Label } from '@/lib/lendaria-ds'
import { createLocalBootstrap, getLocalBootstrapStatus } from '@/lib/local-bootstrap'
import { supabase } from '@/lib/supabase'

export function LocalFirstRun() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    getLocalBootstrapStatus().then((result) => {
      if (mounted) setVisible(result?.status === 'empty')
    }).catch(() => undefined)
    return () => { mounted = false }
  }, [])

  if (!visible) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createLocalBootstrap({ email, password, workspaceName })
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error('Acesso criado, mas não foi possível entrar automaticamente.')
    } catch {
      setError('Não foi possível criar seu acesso agora. Os dados preenchidos continuam aqui; tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <section className="local-first-run" aria-labelledby="local-first-run-title">
      <div className="local-first-run__header">
        <h2 id="local-first-run-title">Seu primeiro acesso</h2>
        <p>Preencha seus dados para entrar e criar o primeiro projeto.</p>
      </div>
      <form onSubmit={handleSubmit} className="local-first-run__form">
        <div><Label htmlFor="first-run-email">E-mail</Label><Input id="first-run-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div><Label htmlFor="first-run-password">Senha</Label><Input id="first-run-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div><Label htmlFor="first-run-workspace">Nome do seu negócio</Label><Input id="first-run-workspace" required minLength={2} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></div>
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        <Button type="submit" disabled={submitting}>{submitting ? 'Criando seu acesso…' : error ? 'Tentar novamente' : 'Criar meu acesso'}</Button>
      </form>
    </section>
  )
}
