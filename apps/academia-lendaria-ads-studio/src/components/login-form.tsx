import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Label, Alert } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, DEMO_EMAIL, DEMO_PASSWORD, signInDemo } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { LocalFirstRun } from '@/components/local-first-run';

/**
 * Login (AC1 — STORY-AL-ADS-1.2).
 *
 * Email/senha via Supabase Auth (mais simples para o MVP que magic link, que
 * exige SMTP). Após o sucesso, `onAuthStateChange` (em use-auth) reage e o app
 * troca para a superfície autenticada — não navegamos manualmente.
 *
 * Estilo herda do DS Lendária (dark-first). Risco WCAG do spike 1.0: ouro NUNCA
 * como texto sobre fundo claro — aqui usamos só primitivos do DS (Button ouro é
 * preenchido sobre dark; sem texto ouro em superfície clara).
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    if (DEMO_AUTH_ENABLED) {
      if (!signInDemo(email, password)) {
        setError('Credenciais demo inválidas.');
        setSubmitting(false);
      }
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setSubmitting(false);
    }
    // Sucesso: use-auth reage via onAuthStateChange; não precisa setSubmitting(false).
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <Card style={{ width: '100%', maxWidth: '24rem' }}>
        <CardHeader>
          <CardTitle>Academia Lendária Ads Studio</CardTitle>
          <CardDescription>Entre para continuar seu projeto de marketing.</CardDescription>
        </CardHeader>
        <CardContent>
          <LocalFirstRun />
          {DEMO_AUTH_ENABLED ? (
            <Alert variant="info" style={{ marginBottom: '1rem' }}>
              Demo local: {DEMO_EMAIL} / {DEMO_PASSWORD}
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : null}
            <Button type="submit" variant="default" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
