import { useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { projectBriefSchema } from '@/generated/project-brief-schema';
import { skillCatalog } from '@/generated/skill-catalog';
import {
  briefFieldValue,
  enumLabel,
  flattenBriefSection,
  sectionProgress,
  validateBriefField,
  type BriefFieldDefinition,
  type BriefJsonSchema,
} from '@/lib/briefing-fields';
import { evaluateProjectSkills } from '@/lib/readiness';
import { DEMO_AUTH_ENABLED } from '@/lib/demo-mode';
import { useOptionalProjectWorkspaceActions } from '@/components/project-hydration-boundary';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import { validateLegacyBrief, type ProjectBriefData } from '@/lib/project-domain';

const SCHEMA = projectBriefSchema as unknown as BriefJsonSchema & {
  ['x-steps']: ReadonlyArray<{ id: string; title: string; description?: string }>;
};

// eslint-disable-next-line react-refresh/only-export-components -- helper puro testável do parser de importação
export function formatBriefValidationIssues(issues: ReadonlyArray<{ path: string; message: string }>): string {
  return `Briefing inválido: ${issues.map((issue) => `${issue.path} (${issue.message})`).join('; ')}`;
}

function sourceLabel(source?: string, confirmation?: string) {
  if (confirmation === 'not_applicable') return 'Não se aplica';
  if (source === 'artifact') return 'Extraído de artefato';
  if (source === 'inferred') return 'Inferido, confirme';
  if (source === 'migration') return 'Importado';
  return 'Preenchido por você';
}

function FieldControl({
  definition,
  value,
  disabled,
  onChange,
}: {
  definition: BriefFieldDefinition;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  const schema = definition.schema;

  if (schema.type === 'boolean') {
    return (
      <label className="cms-boolean-control">
        <input type="checkbox" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span>{value === true ? 'Sim' : 'Não'}</span>
      </label>
    );
  }

  if (schema.enum) {
    return (
      <select className="al-input" value={value == null ? '' : String(value)} disabled={disabled} onChange={(event) => onChange(event.target.value || undefined)}>
        <option value="">Selecione</option>
        {schema.enum.map((option) => <option key={String(option)} value={String(option)}>{enumLabel(option)}</option>)}
      </select>
    );
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <div className="cms-number-control">
        {schema['x-unit'] === 'BRL' ? <span>R$</span> : null}
        <input
          className="al-input"
          type="number"
          step={schema.type === 'integer' ? 1 : 'any'}
          min={schema.minimum}
          max={schema.maximum}
          value={typeof value === 'number' ? value : ''}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        />
      </div>
    );
  }

  if (schema.type === 'array' && schema.items?.type === 'object') {
    const rows = Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
    return (
      <div className="cms-array-object">
        {rows.map((row, index) => (
          <div key={index} className="cms-array-object__row">
            <div className="cms-array-object__fields">
              {Object.entries(schema.items?.properties ?? {}).map(([key, child]) => (
                <label key={key}>
                  <span>{child.title ?? enumLabel(key)}</span>
                  {child.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={row[key] === true}
                      disabled={disabled}
                      onChange={(event) => {
                        const next = rows.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: event.target.checked } : item);
                        onChange(next);
                      }}
                    />
                  ) : child.enum ? (
                    <select
                      className="al-input"
                      value={String(row[key] ?? '')}
                      disabled={disabled}
                      onChange={(event) => {
                        const next = rows.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: event.target.value } : item);
                        onChange(next);
                      }}
                    >
                      <option value="">Selecione</option>
                      {child.enum.map((option) => <option key={String(option)} value={String(option)}>{enumLabel(option)}</option>)}
                    </select>
                  ) : (
                    <input
                      className="al-input"
                      type={child.type === 'number' || child.type === 'integer' ? 'number' : 'text'}
                      value={String(row[key] ?? '')}
                      disabled={disabled}
                      onChange={(event) => {
                        const nextValue = child.type === 'number' || child.type === 'integer'
                          ? event.target.value === '' ? undefined : Number(event.target.value)
                          : event.target.value;
                        const next = rows.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: nextValue } : item);
                        onChange(next);
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
            <button type="button" className="asx-square-action" title="Remover item" aria-label="Remover item" disabled={disabled} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...rows, {}])}>
          <Icon name="plus" size={13} /> Adicionar
        </Button>
      </div>
    );
  }

  if (schema.type === 'array') {
    const text = Array.isArray(value) ? value.join('\n') : '';
    return (
      <textarea
        className="al-input cms-brief-textarea"
        value={text}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
        rows={4}
      />
    );
  }

  const useTextarea = schema['x-control'] === 'textarea' || (schema.maxLength ?? 0) > 180;
  if (useTextarea) {
    return (
      <textarea className="al-input cms-brief-textarea" value={String(value ?? '')} disabled={disabled} onChange={(event) => onChange(event.target.value)} rows={4} />
    );
  }

  return (
    <input
      className="al-input"
      type={schema.format === 'uri' ? 'url' : schema.format === 'date' ? 'date' : 'text'}
      value={String(value ?? '')}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function ProjectBriefing({ projectId, sectionId }: { projectId: string; sectionId: string }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const projects = useProjectStore((state) => state.projects);
  const revisions = useProjectStore((state) => state.briefRevisions);
  const project = projects.find((candidate) => candidate.id === projectId);
  const brief = activeBriefFor(projectId, revisions);
  const allArtifacts = useProjectStore((state) => state.artifacts);
  const allRuns = useProjectStore((state) => state.skillRuns);
  const artifacts = allArtifacts.filter((artifact) => artifact.projectId === projectId);
  const runs = allRuns.filter((run) => run.projectId === projectId);
  const updateField = useProjectStore((state) => state.updateBriefField);
  const markNotApplicable = useProjectStore((state) => state.markFieldNotApplicable);
  const importLegacyBrief = useProjectStore((state) => state.importLegacyBrief);
  const workspaceActions = useOptionalProjectWorkspaceActions();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [importError, setImportError] = useState<string | null>(null);

  const sections = SCHEMA['x-steps'].filter((section) => section.id !== 'review');
  const currentSection = sections.find((section) => section.id === sectionId) ?? sections[0];
  const fields = flattenBriefSection(SCHEMA, currentSection?.id ?? 'project');

  if (!project || !brief || !currentSection) return null;
  const projectSlug = project.slug;
  const workspaceId = project.workspaceId;

  const evaluations = evaluateProjectSkills(brief, artifacts, runs);
  const relevantSkills = evaluations
    .filter((evaluation) => evaluation.missingFields.some((path) => path.startsWith(`${currentSection.id}.`)))
    .slice(0, 4);
  const currentProgress = sectionProgress(fields, brief.data);
  const sectionIndex = sections.findIndex((section) => section.id === currentSection.id);

  function changeField(path: string, value: unknown) {
    updateField(projectId, path, value);
    setTouched((current) => ({ ...current, [path]: true }));
  }

  function exportBrief() {
    const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectSlug}-project-brief-v1.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    setImportError(null);
    try {
      const raw: unknown = JSON.parse(await file.text());
      const issues = validateLegacyBrief(raw);
      if (issues.length) throw new Error(formatBriefValidationIssues(issues));
      const parsed = raw as ProjectBriefData;
      if (workspaceActions?.importProjectBrief) {
        const importedProjectId = await workspaceActions.importProjectBrief(parsed);
        navigate({ to: '/projects/$projectId/overview', params: { projectId: importedProjectId } });
        return;
      }
      if (!DEMO_AUTH_ENABLED) throw new Error('Importação indisponível fora do workspace persistente.');
      const importedProjectId = importLegacyBrief(workspaceId, parsed);
      navigate({ to: '/projects/$projectId/overview', params: { projectId: importedProjectId } });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Arquivo inválido.');
    }
  }

  return (
    <div className="asx-page cms-page cms-brief-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">Briefing · Etapa {sectionIndex + 1} de {sections.length}</div>
          <h1 className="asx-page-head__title">{currentSection.title} do <em>projeto</em></h1>
        </div>
        <div className="cms-page-actions">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.currentTarget.value = '';
            }}
          />
          <button className="asx-iconbtn" type="button" onClick={() => inputRef.current?.click()} title="Importar briefing legado" aria-label="Importar briefing legado">
            <Icon name="upload" size={15} />
          </button>
          <button className="asx-iconbtn" type="button" onClick={exportBrief} title="Exportar briefing" aria-label="Exportar briefing">
            <Icon name="download" size={15} />
          </button>
          <span className="cms-live-status"><span /> Salvo</span>
        </div>
      </div>

      {importError ? <div className="cms-inline-error">{importError}</div> : null}

      <div className="cms-brief-layout">
        <nav className="cms-brief-steps" aria-label="Etapas do briefing">
          {sections.map((section, index) => {
            const progress = sectionProgress(flattenBriefSection(SCHEMA, section.id), brief.data);
            const percent = progress.total ? Math.round((progress.filled / progress.total) * 100) : 0;
            return (
              <Link
                key={section.id}
                to="/projects/$projectId/briefing/$sectionId"
                params={{ projectId, sectionId: section.id }}
                className={`cms-brief-step ${section.id === currentSection.id ? 'is-active' : ''}`}
              >
                <span>{index + 1}</span>
                <div><strong>{section.title}</strong><small>{percent}%</small></div>
              </Link>
            );
          })}
        </nav>

        <section className="cms-brief-form">
          <div className="cms-brief-section-head">
            <div>
              <p>{currentSection.description}</p>
              <span>{currentProgress.filled} de {currentProgress.total} campos preenchidos</span>
            </div>
            <div className="cms-progress-track" aria-label={`${currentProgress.filled} de ${currentProgress.total}`}>
              <span style={{ width: `${currentProgress.total ? (currentProgress.filled / currentProgress.total) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="cms-brief-fields">
            {fields.map((definition, index) => {
              const value = briefFieldValue(brief.data, definition.path);
              const meta = brief.fieldSources[definition.path];
              const notApplicable = meta?.confirmation === 'not_applicable';
              const error = touched[definition.path] ? validateBriefField(definition, value) : null;
              const previousGroup = fields[index - 1]?.group;
              return (
                <div key={definition.path}>
                  {definition.group && definition.group !== previousGroup ? <h2 className="cms-field-group-title">{definition.group}</h2> : null}
                  <div className={`cms-brief-field ${error ? 'has-error' : ''}`}>
                    <div className="cms-brief-field__label">
                      <label htmlFor={`field-${definition.path}`}>{definition.schema.title ?? enumLabel(definition.path.split('.').at(-1) ?? definition.path)}{definition.required ? ' *' : ''}</label>
                      {!definition.required ? (
                        <label className="cms-na-control">
                          <input
                            type="checkbox"
                            checked={notApplicable}
                            onChange={(event) => {
                              if (event.target.checked) markNotApplicable(projectId, definition.path);
                              else updateField(projectId, definition.path, value);
                            }}
                          />
                          Não se aplica
                        </label>
                      ) : null}
                    </div>
                    <div id={`field-${definition.path}`}>
                      <FieldControl definition={definition} value={value} disabled={notApplicable} onChange={(next) => changeField(definition.path, next)} />
                    </div>
                    <div className="cms-field-meta">
                      <span>{sourceLabel(meta?.source, meta?.confirmation)}</span>
                      {error ? <strong>{error}</strong> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cms-form-nav">
            {sectionIndex > 0 ? (
              <Link to="/projects/$projectId/briefing/$sectionId" params={{ projectId, sectionId: sections[sectionIndex - 1]!.id }} className="al-btn al-btn--outline">
                <Icon name="nav-arrow-left" size={13} /> Anterior
              </Link>
            ) : <span />}
            {sectionIndex < sections.length - 1 ? (
              <Link to="/projects/$projectId/briefing/$sectionId" params={{ projectId, sectionId: sections[sectionIndex + 1]!.id }} className="al-btn al-btn--primary">
                Próxima etapa <Icon name="nav-arrow-right" size={13} />
              </Link>
            ) : (
              <Link to="/projects/$projectId/journey" params={{ projectId }} className="al-btn al-btn--primary">
                Ver jornada <Icon name="nav-arrow-right" size={13} />
              </Link>
            )}
          </div>
        </section>

        <aside className="cms-brief-context">
          <span className="cms-kicker">Impacto nesta etapa</span>
          <h2>Skills com lacunas</h2>
          {relevantSkills.length ? (
            <div className="cms-context-list">
              {relevantSkills.map((evaluation) => {
                const skill = skillCatalog.skills.find((candidate) => candidate.id === evaluation.skillId);
                const count = evaluation.missingFields.filter((path) => path.startsWith(`${currentSection.id}.`)).length;
                return (
                  <div key={evaluation.skillId}>
                    <span className={`cms-state-dot is-${evaluation.readiness}`} />
                    <div><strong>{skill?.title}</strong><span>{count} {count === 1 ? 'campo pendente' : 'campos pendentes'}</span></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="cms-muted-copy">Nenhuma skill bloqueada por esta etapa.</p>}
        </aside>
      </div>
    </div>
  );
}
