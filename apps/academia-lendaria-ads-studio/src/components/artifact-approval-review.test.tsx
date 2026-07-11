import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectArtifact } from '@/lib/project-domain';
import type { ApprovalArtifactInput, ApprovalPlan } from '@/lib/artifact-approval';
import { ArtifactApprovalReview } from '@/components/artifact-approval-review';

const ARTIFACT: ApprovalArtifactInput = {
  artifactType: 'offerbook',
  title: 'Offerbook',
  path: 'offerbook.md',
  format: 'markdown',
  content: '# Offerbook\n\nNova versão.',
};

const PLAN: ApprovalPlan = {
  skillRunId: 'run-1',
  projectSlug: 'demo',
  proposalHash: 'hash-1',
  proposalRevision: 1,
  fresh: true,
  files: [
    {
      path: 'offerbook.md',
      artifactType: 'offerbook',
      format: 'markdown',
      changeType: 'modify',
      hashBefore: 'old',
      hashAfter: 'new',
      addedLines: 2,
      removedLines: 1,
      preview: ['- linha antiga', '+ linha nova'],
    },
  ],
  warnings: ['"offerbook.md" já existe e será sobrescrito (1 linha(s) removida(s), 2 adicionada(s)).'],
};

const INVALIDATION: ProjectArtifact = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  projectId: 'p-1',
  artifactType: 'copy',
  title: 'Fundação de copy',
  path: 'copy.md',
  format: 'markdown',
  state: 'confirmed',
  verification: 'confirmed',
  source: 'skill_run',
  createdAt: '2026-07-10T12:00:00.000Z',
  updatedAt: '2026-07-10T12:00:00.000Z',
};

function renderReview(overrides: Partial<Parameters<typeof ArtifactApprovalReview>[0]> = {}) {
  const onApprove = vi.fn();
  const onReject = vi.fn();
  const onEdit = vi.fn();
  render(
    <ArtifactApprovalReview
      proposalSummary="Proposta pronta"
      artifacts={[ARTIFACT]}
      plan={PLAN}
      proposalWarnings={['Confirme o preço antes de publicar.']}
      invalidations={[INVALIDATION]}
      onApprove={onApprove}
      onReject={onReject}
      onEdit={onEdit}
      {...overrides}
    />,
  );
  return { onApprove, onReject, onEdit };
}

describe('ArtifactApprovalReview', () => {
  it('shows the accurate diff, affected files, warnings and invalidations (AC1)', () => {
    renderReview();
    expect(screen.getByText('offerbook.md')).toBeInTheDocument();
    expect(screen.getByText('atualiza')).toBeInTheDocument();
    expect(screen.getByText('+2 −1')).toBeInTheDocument();
    // Diff preview lines are rendered.
    expect(screen.getByLabelText('Diff de offerbook.md')).toHaveTextContent('- linha antiga');
    // Both the plan warning and the proposal warning surface.
    expect(screen.getByText(/será sobrescrito/)).toBeInTheDocument();
    expect(screen.getByText(/Confirme o preço/)).toBeInTheDocument();
    // Downstream invalidation surfaces.
    expect(screen.getByText('Fundação de copy')).toBeInTheDocument();
  });

  it('emits approve and reject intents', () => {
    const { onApprove, onReject } = renderReview();
    fireEvent.click(screen.getByRole('button', { name: /Aprovar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Rejeitar/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('editing reveals an editor and emits a new proposal (AC5)', () => {
    const { onEdit } = renderReview();
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '# Offerbook editado' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar edição/i }));
    expect(onEdit).toHaveBeenCalledWith([{ ...ARTIFACT, content: '# Offerbook editado' }]);
  });

  it('disables the actions while busy', () => {
    renderReview({ busy: true });
    expect(screen.getByRole('button', { name: /Aprovar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Rejeitar/i })).toBeDisabled();
  });

  it('falls back to a create-only view when no backend plan is available (demo)', () => {
    renderReview({ plan: null });
    expect(screen.getByText('offerbook.md')).toBeInTheDocument();
    expect(screen.getByText('novo')).toBeInTheDocument();
  });
});
