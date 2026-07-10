import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PROJECT_ID, useProjectStore } from '@/stores/project-store';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
}));

import { ProjectOverview } from '@/components/project-overview';

describe('ProjectOverview', () => {
  beforeEach(() => {
    useProjectStore.getState().resetDemo();
  });

  it('renders the unified project snapshot without an unstable Zustand selector loop', () => {
    render(<ProjectOverview projectId={DEMO_PROJECT_ID} />);

    expect(screen.getByRole('heading', { name: /Próximo passo do projeto/i })).toBeInTheDocument();
    expect(screen.getByText('etapas concluídas')).toBeInTheDocument();
    expect(screen.getByText(/Vamos conferir o que já está pronto/)).toBeInTheDocument();
    expect(screen.queryByText(/Git|Apify|Node|primeiro comando/i)).not.toBeInTheDocument();
    expect(screen.getByText('campanhas')).toBeInTheDocument();
  });
});
