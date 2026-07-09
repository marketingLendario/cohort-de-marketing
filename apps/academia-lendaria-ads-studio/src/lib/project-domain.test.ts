import { describe, expect, it } from 'vitest';
import { getPath, migrateLegacyBrief, setPath, slugifyProjectName } from '@/lib/project-domain';

describe('project domain', () => {
  it('gets and sets nested paths without mutating the source', () => {
    const source = { project: { name: 'Antes' } };
    const next = setPath(source, 'project.name', 'Depois');
    expect(getPath(next, 'project.name')).toEqual({ exists: true, value: 'Depois' });
    expect(source.project.name).toBe('Antes');
  });

  it('creates stable ASCII slugs', () => {
    expect(slugifyProjectName('Máquina de Receita com IA')).toBe('maquina-de-receita-com-ia');
  });

  it('migrates artifacts as pending declarations outside the brief', () => {
    const result = migrateLegacyBrief(
      {
        schemaVersion: '0.1.0',
        project: { slug: 'demo' },
        artifacts: { offerbook: true, design: false },
        fieldMeta: {
          'project.slug': { source: 'user', updatedAt: '2026-07-09T00:00:00.000Z' },
        },
      },
      {
        id: 'brief-1',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        now: '2026-07-09T00:00:00.000Z',
      },
    );
    expect(result.document.schemaVersion).toBe('1.0.0');
    expect('artifacts' in result.document.data).toBe(false);
    expect(result.declaredArtifactTypes).toEqual(['offerbook']);
    expect(result.document.fieldSources['project.slug']?.source).toBe('migration');
  });
});

