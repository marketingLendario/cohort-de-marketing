import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PROJECT_ID, useProjectStore } from '@/stores/project-store';
import { getPath } from '@/lib/project-domain';

describe('project store', () => {
  beforeEach(() => useProjectStore.getState().resetDemo());

  it('persists an explicit false with confirmed provenance', () => {
    useProjectStore.getState().updateBriefField(DEMO_PROJECT_ID, 'brand.approvedDirection', false);
    const brief = useProjectStore.getState().briefRevisions.find((candidate) => candidate.projectId === DEMO_PROJECT_ID);
    expect(getPath(brief?.data, 'brand.approvedDirection').value).toBe(false);
    expect(brief?.fieldSources['brand.approvedDirection']?.confirmation).toBe('confirmed');
  });

  it('imports declared artifacts as pending instead of completed', () => {
    const projectId = useProjectStore.getState().importLegacyBrief('workspace-import', {
      schemaVersion: '0.1.0',
      project: { slug: 'importado', name: 'Importado' },
      artifacts: { offerbook: true },
    });
    const artifact = useProjectStore.getState().artifacts.find((candidate) => candidate.projectId === projectId);
    expect(artifact?.artifactType).toBe('offerbook');
    expect(artifact?.verification).toBe('pending');
    expect(artifact?.state).toBe('proposal');
  });

  it('creates isolated project and brief records', () => {
    const projectId = useProjectStore.getState().createProject('workspace-2', 'Projeto Novo');
    const project = useProjectStore.getState().projects.find((candidate) => candidate.id === projectId);
    const brief = useProjectStore.getState().briefRevisions.find((candidate) => candidate.projectId === projectId);
    expect(project?.slug).toBe('projeto-novo');
    expect(brief?.workspaceId).toBe('workspace-2');
  });
});

