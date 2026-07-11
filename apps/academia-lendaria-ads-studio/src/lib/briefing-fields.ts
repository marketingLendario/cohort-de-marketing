import { getPath, type ProjectBriefData } from '@/lib/project-domain';

export interface BriefJsonSchema {
  type?: string | readonly string[];
  title?: string;
  description?: string;
  enum?: readonly (string | number)[];
  properties?: Readonly<Record<string, BriefJsonSchema>>;
  items?: BriefJsonSchema;
  required?: readonly string[];
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  ['x-step']?: string;
  ['x-control']?: string;
  ['x-unit']?: string;
}

export interface BriefFieldDefinition {
  path: string;
  sectionId: string;
  schema: BriefJsonSchema;
  required: boolean;
  group?: string;
}

export function flattenBriefSection(root: BriefJsonSchema, sectionId: string): BriefFieldDefinition[] {
  const section = root.properties?.[sectionId];
  if (!section?.properties) return [];
  const fields: BriefFieldDefinition[] = [];

  function walk(properties: Readonly<Record<string, BriefJsonSchema>>, prefix: string, required: readonly string[] = [], group?: string) {
    for (const [key, definition] of Object.entries(properties)) {
      const path = `${prefix}.${key}`;
      const isObject = definition.type === 'object' && definition.properties;
      if (isObject) {
        walk(definition.properties ?? {}, path, definition.required ?? [], definition.title ?? key);
        continue;
      }
      fields.push({
        path,
        sectionId,
        schema: definition,
        required: required.includes(key),
        group,
      });
    }
  }

  walk(section.properties, sectionId, section.required ?? []);
  return fields;
}

export function enumLabel(value: string | number): string {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function briefFieldValue(data: ProjectBriefData, path: string): unknown {
  return getPath(data, path).value;
}

export function validateBriefField(definition: BriefFieldDefinition, value: unknown): string | null {
  const { schema, required } = definition;
  const missing = value == null || value === '' || (Array.isArray(value) && value.length === 0);
  if (missing) return required ? 'Campo obrigatório.' : null;
  if (schema.type === 'string' && typeof value !== 'string') return 'Valor inválido.';
  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) return `Use pelo menos ${schema.minLength} caracteres.`;
    if (schema.maxLength != null && value.length > schema.maxLength) return `Use no máximo ${schema.maxLength} caracteres.`;
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) return 'Formato inválido.';
    if (schema.format === 'uri') {
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return 'Use uma URL http ou https.';
      } catch {
        return 'URL inválida.';
      }
    }
  }
  if ((schema.type === 'number' || schema.type === 'integer') && typeof value !== 'number') return 'Use apenas números.';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'Número inválido.';
    if (schema.type === 'integer' && !Number.isInteger(value)) return 'Use um número inteiro.';
    if (schema.minimum != null && value < schema.minimum) return `Valor mínimo: ${schema.minimum}.`;
    if (schema.maximum != null && value > schema.maximum) return `Valor máximo: ${schema.maximum}.`;
  }
  if (schema.enum && !schema.enum.includes(value as never)) return 'Escolha uma opção válida.';
  return null;
}

export function sectionProgress(fields: BriefFieldDefinition[], data: ProjectBriefData): { filled: number; total: number } {
  const filled = fields.filter((field) => {
    const value = briefFieldValue(data, field.path);
    if (value == null || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;
  return { filled, total: fields.length };
}

