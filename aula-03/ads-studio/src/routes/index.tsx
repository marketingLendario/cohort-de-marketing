import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Raiz (`/`) → seletor de projetos do produto unificado.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/projects' })
  },
})
