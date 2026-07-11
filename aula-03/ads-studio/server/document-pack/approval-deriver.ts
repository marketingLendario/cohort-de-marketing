import type { ApprovalArtifactInput, ArtifactApprovalServiceDeps } from '../artifact-approval.js';
import { readSafeArtifactFile } from '../artifact-materializer.js';
import { parseBookDoFunilState, reconcileBookDoFunil, renderBookDoFunil } from './book-reconciler.js';
import { assertDocumentPackProposal, documentPackPattern, documentPackSourceOutputs, loadDocumentPackContract } from './contracts.js';
import { renderDocumentPackOutput, type DocumentPackRendererOptions } from './renderers.js';
import { validateSalesPageHtml } from './sales-page-validator.js';
import { assertSemanticDocument } from './semantic-validators.js';

const MAX_DERIVED_FILE_BYTES = 15 * 1024 * 1024;
const MAX_DERIVED_PACK_BYTES = 30 * 1024 * 1024;

export interface DocumentPackApprovalDeriverOptions {
  repoRoot: string;
  projectsRoot?: string;
  rendererOptions?: DocumentPackRendererOptions;
  render?: typeof renderDocumentPackOutput;
  readArtifact?: (projectSlug: string, relativePath: string) => Promise<string | null>;
}

function sourceByPath(artifacts: ApprovalArtifactInput[]): Map<string, ApprovalArtifactInput> {
  return new Map(artifacts.map((artifact) => [artifact.path, artifact]));
}

export function immutableRevisionPath(path: string, revision: number, strategy: 'v-suffix' | 'version-directory' = 'v-suffix'): string {
  if (strategy === 'version-directory') {
    const slash = path.lastIndexOf('/');
    return slash < 0 ? `v${revision}/${path}` : `${path.slice(0, slash)}/v${revision}/${path.slice(slash + 1)}`;
  }
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  const extensionStartsAt = dot > slash ? dot : path.length;
  return `${path.slice(0, extensionStartsAt)}-v${revision}${path.slice(extensionStartsAt)}`;
}

/**
 * Converts only approved textual sources into deterministic binary artifacts.
 * The returned bytes are journaled by the approval saga before any canonical
 * filesystem write, so repair never needs to execute Chrome or Python again.
 */
export function createDocumentPackApprovalDeriver(
  options: DocumentPackApprovalDeriverOptions,
): NonNullable<ArtifactApprovalServiceDeps['deriveArtifacts']> {
  const render = options.render ?? renderDocumentPackOutput;
  const readArtifact = options.readArtifact ?? (options.projectsRoot
    ? (projectSlug: string, relativePath: string) => readSafeArtifactFile(options.projectsRoot!, projectSlug, relativePath)
    : async () => null);

  return async ({ skillId, projectSlug, proposalRevision, artifacts }) => {
    const contract = await loadDocumentPackContract(options.repoRoot, skillId);
    if (!contract) return [];
    const proposal = { artifacts, summary: '', resultMarkdown: '', fields: [], questions: [], warnings: [] };
    assertDocumentPackProposal(contract, proposal);

    const approvedSources = sourceByPath(artifacts);
    const derived: Awaited<ReturnType<NonNullable<ArtifactApprovalServiceDeps['deriveArtifacts']>>> = [];
    let totalBytes = 0;

    const sourceOutputs = documentPackSourceOutputs(contract, proposal);
    for (const source of sourceOutputs) {
      const declared = [...contract.requiredTextOutputs, ...(contract.optionalTextOutputs ?? [])].find((output) => output.path === source.path);
      if (declared?.validationProfile === 'sales-page-v1') validateSalesPageHtml(source.content);
      else if (declared?.validationProfile) assertSemanticDocument(declared.validationProfile, source.content)
      const collection = (contract.requiredCollections ?? []).find((candidate) => documentPackPattern(candidate.pathPattern).test(source.path))
      if (collection?.validationProfile) assertSemanticDocument(collection.validationProfile, source.content)
      const content = Buffer.from(source.content, 'utf8');
      if (content.byteLength > MAX_DERIVED_FILE_BYTES) {
        throw new Error(`${source.path} excedeu o limite de ${MAX_DERIVED_FILE_BYTES} bytes.`);
      }
      totalBytes += content.byteLength;
      derived.push({
        artifactType: `${skillId}-revision`,
        title: `${skillId}: ${source.path} (revisão ${proposalRevision})`,
        path: immutableRevisionPath(source.path, proposalRevision, contract.versioning),
        format: source.format,
        content,
        derivedFrom: source.path,
      });
    }

    for (const output of contract.derivedOutputs) {
      const source = approvedSources.get(output.sourcePath);
      if (!source?.content.trim()) {
        throw new Error(`${skillId} não possui a fonte aprovada obrigatória ${output.sourcePath}.`);
      }
      const rendered = await render({
        repoRoot: options.repoRoot,
        output,
        sourceContent: source.content,
      }, options.rendererOptions);
      if (rendered.content.byteLength > MAX_DERIVED_FILE_BYTES) {
        throw new Error(`${output.path} excedeu o limite de ${MAX_DERIVED_FILE_BYTES} bytes.`);
      }
      totalBytes += rendered.content.byteLength * 2;
      if (totalBytes > MAX_DERIVED_PACK_BYTES) {
        throw new Error(`O pack derivado de ${skillId} excedeu o limite de ${MAX_DERIVED_PACK_BYTES} bytes.`);
      }
      derived.push({
        artifactType: `${skillId}-document`,
        title: `${skillId}: ${output.path}`,
        path: output.path,
        format: output.format,
        content: rendered.content,
        derivedFrom: output.sourcePath,
      });
      derived.push({
        artifactType: `${skillId}-revision`,
        title: `${skillId}: ${output.path} (revisão ${proposalRevision})`,
        path: immutableRevisionPath(output.path, proposalRevision, contract.versioning),
        format: output.format,
        content: rendered.content,
        derivedFrom: output.sourcePath,
      });
    }

    for (const collection of contract.derivedCollectionOutputs ?? []) {
      const pattern = documentPackPattern(collection.sourcePattern);
      for (const source of sourceOutputs.filter((candidate) => pattern.test(candidate.path))) {
        const outputPath = source.path.replace(/\.[^./]+$/, collection.outputExtension);
        const rendered = await render({
          repoRoot: options.repoRoot,
          output: { path: outputPath, format: 'pdf', sourcePath: source.path, renderer: collection.renderer },
          sourceContent: source.content,
        }, options.rendererOptions);
        totalBytes += rendered.content.byteLength * 2;
        if (rendered.content.byteLength > MAX_DERIVED_FILE_BYTES || totalBytes > MAX_DERIVED_PACK_BYTES) {
          throw new Error(`A coleção derivada de ${skillId} excedeu o limite permitido.`);
        }
        derived.push({
          artifactType: `${skillId}-document`, title: `${skillId}: ${outputPath}`, path: outputPath,
          format: 'pdf', content: rendered.content, derivedFrom: source.path,
        }, {
          artifactType: `${skillId}-revision`, title: `${skillId}: ${outputPath} (revisão ${proposalRevision})`,
          path: immutableRevisionPath(outputPath, proposalRevision, contract.versioning),
          format: 'pdf', content: rendered.content, derivedFrom: source.path,
        });
      }
    }

    if (contract.reconcileBook) {
      const htmlSource = contract.bookEntry;
      if (!approvedSources.get(htmlSource.path)?.content.trim()) throw new Error(`${skillId} exige Book do Funil, mas não produziu ${htmlSource.path}.`);
      const prior = parseBookDoFunilState(await readArtifact(projectSlug, 'book-do-funil.json'), projectSlug);
      const state = reconcileBookDoFunil({
        prior,
        skillId,
        title: htmlSource.title,
        phase: htmlSource.phase,
        revision: proposalRevision,
        canonicalHtmlPath: htmlSource.path,
        immutableHtmlPath: immutableRevisionPath(htmlSource.path, proposalRevision, contract.versioning),
      });
      const bookState = Buffer.from(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
      const bookHtml = Buffer.from(renderBookDoFunil(state), 'utf8');
      totalBytes += bookState.byteLength + bookHtml.byteLength;
      if (totalBytes > MAX_DERIVED_PACK_BYTES) {
        throw new Error(`O pack derivado de ${skillId} excedeu o limite de ${MAX_DERIVED_PACK_BYTES} bytes.`);
      }
      derived.push({
        artifactType: 'book-do-funil-state',
        title: 'Estado do Book do Funil',
        path: 'book-do-funil.json',
        format: 'json',
        content: bookState,
        derivedFrom: htmlSource.path,
      }, {
        artifactType: 'book-do-funil',
        title: 'Book do Funil',
        path: 'index.html',
        format: 'html',
        content: bookHtml,
        derivedFrom: htmlSource.path,
      });
    }

    return derived;
  };
}
