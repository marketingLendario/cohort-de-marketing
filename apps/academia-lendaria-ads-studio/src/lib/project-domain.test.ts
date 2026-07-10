import { describe, expect, it } from 'vitest';
import { getPath, migrateLegacyBrief, setPath, slugifyProjectName, validateLegacyBrief } from '@/lib/project-domain';

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

  it('preserves zero, false, unknown and not_applicable values during migration', () => {
    const result = migrateLegacyBrief(
      {
        schemaVersion: '0.1.0',
        project: { slug: 'preserve-values' },
        data: { visitors: 0 },
        brand: { approvedDirection: false },
        integrations: { apifyStatus: 'unknown' },
        fieldMeta: { 'integrations.apifyStatus': { source: 'not_applicable' } },
      },
      { id: 'brief-2', workspaceId: 'workspace-1', projectId: 'project-2', now: '2026-07-09T00:00:00.000Z' },
    );
    expect(result.document.data.data).toEqual({ visitors: 0 });
    expect(result.document.data.brand).toEqual({ approvedDirection: false });
    expect(result.document.data.integrations).toEqual({ apifyStatus: 'unknown' });
    expect(result.document.fieldSources['integrations.apifyStatus']?.confirmation).toBe('not_applicable');
  });

  it('returns every invalid field path without changing the source document', () => {
    const source = { schemaVersion: '0.1.0', project: { slug: 'Bad Slug' }, artifacts: { offerbook: 'yes' } };
    expect(validateLegacyBrief(source)).toEqual([
      { path: 'project.slug', message: 'não corresponde ao formato esperado.' },
      { path: 'artifacts.offerbook', message: 'deve ser booleano.' },
    ]);
    expect(source).toEqual({ schemaVersion: '0.1.0', project: { slug: 'Bad Slug' }, artifacts: { offerbook: 'yes' } });
  });

  it('rejects malformed nested project and field metadata values', () => {
    expect(validateLegacyBrief({
      schemaVersion: '0.1.0',
      project: { slug: 'valido', name: {}, unknownField: 'x' },
      fieldMeta: { 'project.slug': { source: 'invalid', updatedAt: 42, extra: true } },
    })).toEqual(expect.arrayContaining([
      { path: 'project.name', message: 'deve ser texto.' },
      { path: 'project.unknownField', message: 'campo não permitido.' },
      { path: 'fieldMeta.project.slug.source', message: expect.stringContaining('deve ser um de:') },
      { path: 'fieldMeta.project.slug.updatedAt', message: 'deve ser texto.' },
      { path: 'fieldMeta.project.slug.extra', message: 'campo não permitido.' },
    ]));
  });

  it('rejects a document without the required legacy schemaVersion', () => {
    expect(validateLegacyBrief({ project: { slug: 'sem-versao' } })).toContainEqual({
      path: 'schemaVersion',
      message: 'é obrigatório.',
    });
  });
});
