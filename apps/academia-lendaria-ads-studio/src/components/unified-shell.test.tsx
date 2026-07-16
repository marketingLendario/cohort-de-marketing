import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@/stores/project-store';
import type { MarketingProject, ProjectBriefRevision } from '@/lib/project-domain';

/**
 * Testes de `UnifiedShell` (STORY-12.W2.1 — AC1): o link "Campanhas" fica
 * `aria-disabled`, não navega ao clicar e mostra a contagem de bloqueadores +
 * CTA de correção quando `campaign.create` está bloqueada — e continua um
 * link normal, navegável, quando não está.
 *
 * Achado F1 do @qa (revisão independente): esta suíte não existia — o gate do
 * shell estava implementado corretamente mas sem cobertura automatizada
 * própria (só coberto indiretamente pela lógica compartilhada testada em
 * `campaign-readiness-panel.test.tsx`/`project-campaigns.test.tsx`, que não
 * exercitam o link do shell em si). Fechada aqui.
 */

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    to,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    to?: string;
    onClick?: (event: React.MouseEvent) => void;
  } & Record<string, unknown>) => (
    <a
      href={typeof to === 'string' ? to : '#'}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) navigateMock(to);
        event.preventDefault();
      }}
      {...rest}
    >
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useRouterState: () => '/projects/project-1/overview',
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

import { UnifiedShell } from '@/components/unified-shell';

const PROJECT_ID = 'project-1';

function project(overrides: Partial<MarketingProject> = {}): MarketingProject {
  return {
    id: PROJECT_ID,
    workspaceId: 'workspace-1',
    slug: 'demo',
    name: 'Projeto Demo',
    status: 'active',
    activeBriefRevisionId: 'brief-1',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

function brief(data: Record<string, unknown>, revision = 1): ProjectBriefRevision {
  return {
    schemaVersion: '1.0.0',
    id: 'brief-1',
    workspaceId: 'workspace-1',
    projectId: PROJECT_ID,
    revision,
    status: 'active',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    data: { schemaVersion: '0.1.0', project: { slug: 'demo' }, ...data },
    fieldSources: {},
  };
}

beforeEach(() => {
  navigateMock.mockReset();
  // Evita qualquer tentativa de rede real do polling do <SystemReadiness />
  // embutido no topbar (mesmo padrão de fallback já coberto por
  // `system-readiness.test.tsx` — aqui só queremos que ele não interfira).
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sem rede no ambiente de teste'));
  useProjectStore.getState().resetDemo();
  useProjectStore.setState({
    projects: [project()],
    briefRevisions: [brief({})],
    artifacts: [],
    skillRuns: [],
    campaignPlans: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UnifiedShell — gate do link "Campanhas" (AC1)', () => {
  it('mantém o link normal, navegável, quando campaign.create está pronta', () => {
    render(<UnifiedShell projectId={PROJECT_ID}><div>conteúdo</div></UnifiedShell>);

    const links = screen.getAllByRole('link', { name: 'Campanhas' });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).not.toHaveAttribute('aria-disabled');
    }

    fireEvent.click(links[0]!);
    expect(navigateMock).toHaveBeenCalled();
  });

  it('desabilita o link, não navega ao clicar e mostra contagem de bloqueadores + CTA quando campaign.create está bloqueada (projeto sem nome válido)', () => {
    useProjectStore.setState({ projects: [project({ name: '' })] });

    render(<UnifiedShell projectId={PROJECT_ID}><div>conteúdo</div></UnifiedShell>);

    const links = screen.getAllByRole('link', { name: /Campanhas/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('title');
      expect(link.getAttribute('title')).toMatch(/bloqueada/i);
    }

    navigateMock.mockClear();
    fireEvent.click(links[0]!);
    expect(navigateMock).not.toHaveBeenCalled();

    // Contagem de bloqueadores (badge) — pelo menos um "1" visível junto ao link.
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    // CTA de correção — link "Corrigir" navegável de verdade, distinto do item de nav desabilitado.
    const fixLinks = screen.getAllByRole('link', { name: /Corrigir/i });
    expect(fixLinks.length).toBeGreaterThan(0);
    for (const fixLink of fixLinks) {
      expect(fixLink).not.toHaveAttribute('aria-disabled');
    }
  });
});
