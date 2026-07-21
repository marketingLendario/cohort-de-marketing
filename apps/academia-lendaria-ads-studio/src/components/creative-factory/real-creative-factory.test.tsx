import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RealCreativeFactory } from './real-creative-factory';
import type { CampaignPlanRevision, ProjectArtifact } from '@/lib/project-domain';
import { startSkillRun } from '@/lib/skill-runtime';

vi.mock('@/lib/skill-runtime', () => ({
  startSkillRun: vi.fn(async () => ({ jobId: 'job-1', status: 'queued' })),
  observeSkillRun: vi.fn(() => () => undefined),
  cancelSkillRun: vi.fn(),
  retrySkillRun: vi.fn(),
}));

const plan = {
  schemaVersion: '1.0.0', id: 'plan-1', projectId: 'project-1', campaignId: 'campaign-1', revision: 1,
  sourceBrief: { id: 'brief-1', revision: 1 }, platform: 'meta', objective: 'sales',
  budget: { daily: 30, periodDays: 7, currency: 'BRL' }, angles: [],
  finalists: [
    { id: 'f1', angleId: 'a1', hook: 'Hook 1', copy: 'Copy 1', format: 'feed', selectedByHuman: true },
    { id: 'f2', angleId: 'a1', hook: 'Hook 2', copy: 'Copy 2', format: 'feed', selectedByHuman: true },
  ],
  tracking: { status: 'OK', criticalItemsConfirmed: true, checks: {} }, structure: null,
  manualSubmission: { status: 'not_ready' }, overrides: {}, updatedAt: '2026-07-11T12:00:00.000Z',
} as CampaignPlanRevision;

function artifact(overrides: Partial<ProjectArtifact>): ProjectArtifact {
  return {
    id: 'artifact-1', workspaceId: 'workspace-1', projectId: 'project-1', artifactType: 'design',
    title: 'Design', path: 'DESIGN.md', format: 'markdown', state: 'confirmed', verification: 'confirmed',
    source: 'skill_run', content: '# Design', createdAt: '2026-07-11T12:00:00.000Z', updatedAt: '2026-07-11T12:00:00.000Z',
    ...overrides,
  };
}

describe('RealCreativeFactory', () => {
  afterEach(() => vi.clearAllMocks());

  it('bloqueia a geração enquanto a curadoria não tiver dois finalistas', () => {
    render(<RealCreativeFactory
      projectId="project-1"
      workspaceId="workspace-1"
      campaignId="campaign-1"
      brief={{ project: { slug: 'marca-fixture' } }}
      artifacts={[]}
      plan={{ ...plan, finalists: plan.finalists.slice(0, 1) }}
      onSave={vi.fn()}
      onPromoted={vi.fn()}
    />);

    expect(screen.getByRole('button', { name: 'Gerar lote real' })).toBeDisabled();
  });

  it('encaminha o DESIGN confirmado e exclui artefatos pendentes do runner', async () => {
    const onSave = vi.fn();
    render(<RealCreativeFactory
      projectId="project-1"
      workspaceId="workspace-1"
      campaignId="campaign-1"
      brief={{ project: { slug: 'marca-fixture' } }}
      artifacts={[
        artifact({ content: '# Design confirmado' }),
        artifact({ id: 'artifact-2', path: 'rascunho.md', artifactType: 'copy', state: 'proposal', verification: 'pending', content: 'não enviar' }),
      ]}
      plan={plan}
      onSave={onSave}
      onPromoted={vi.fn()}
    />);

    fireEvent.change(screen.getByLabelText('CTA'), { target: { value: 'Quero conhecer' } });
    fireEvent.change(screen.getByLabelText('Descrição do link'), { target: { value: 'Veja os detalhes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gerar lote real' }));

    await waitFor(() => expect(startSkillRun).toHaveBeenCalledOnce());
    expect(vi.mocked(startSkillRun).mock.calls[0]?.[1]).toMatchObject({
      context: {
        artifacts: [{ artifactType: 'design', path: 'DESIGN.md', content: '# Design confirmado' }],
        creativeFactory: {
          campaignId: 'campaign-1',
          finalists: plan.finalists,
          cta: 'Quero conhecer',
          linkDescription: 'Veja os detalhes',
        },
      },
    });
    expect(onSave).toHaveBeenCalledWith({ creativeFactory: { jobId: 'job-1', status: 'queued', selectedItemIds: [] } });
  });
});
