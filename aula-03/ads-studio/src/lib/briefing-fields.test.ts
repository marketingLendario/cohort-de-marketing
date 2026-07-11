import { describe, expect, it } from 'vitest';
import { flattenBriefSection, sectionProgress, validateBriefField, type BriefJsonSchema } from '@/lib/briefing-fields';

const schema: BriefJsonSchema = {
  properties: {
    project: {
      required: ['slug'],
      properties: {
        slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
        approved: { type: 'boolean' },
        profile: {
          type: 'object',
          title: 'Perfil',
          properties: { score: { type: 'number', minimum: 0 } },
        },
      },
    },
  },
};

describe('briefing fields', () => {
  it('flattens nested object fields while preserving groups', () => {
    const fields = flattenBriefSection(schema, 'project');
    expect(fields.map((field) => field.path)).toEqual(['project.slug', 'project.approved', 'project.profile.score']);
    expect(fields[2]?.group).toBe('Perfil');
  });

  it('validates required patterns and accepts zero', () => {
    const fields = flattenBriefSection(schema, 'project');
    expect(validateBriefField(fields[0]!, '')).toBe('Campo obrigatório.');
    expect(validateBriefField(fields[0]!, 'Slug Inválido')).toBe('Formato inválido.');
    expect(validateBriefField(fields[2]!, 0)).toBeNull();
  });

  it('counts explicit false and zero in progress', () => {
    const fields = flattenBriefSection(schema, 'project');
    const progress = sectionProgress(fields, {
      schemaVersion: '0.1.0',
      project: { slug: 'demo', approved: false, profile: { score: 0 } },
    });
    expect(progress).toEqual({ filled: 3, total: 3 });
  });
});
