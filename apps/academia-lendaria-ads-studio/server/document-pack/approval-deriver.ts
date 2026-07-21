import type { ApprovalArtifactInput, ArtifactApprovalServiceDeps } from '../artifact-approval.js';
import { readSafeArtifactFile } from '../artifact-materializer.js';
import { parseBookDoFunilState, reconcileBookDoFunil, renderBookDoFunil } from './book-reconciler.js';
import { assertDocumentPackProposal, documentPackPattern, documentPackSourceOutputs, loadDocumentPackContract } from './contracts.js';
import { renderDocumentPackOutput, type DocumentPackRendererOptions } from './renderers.js';
import { validateSalesPageHtml } from './sales-page-validator.js';
import { assertSafeHtmlActiveContent, assertSemanticDocument } from './semantic-validators.js';
import { renderCarouselBatch, type CarouselRenderResult } from '../carousel-production/index.js';

const MAX_DERIVED_FILE_BYTES = 15 * 1024 * 1024;
const MAX_DERIVED_PACK_BYTES = 30 * 1024 * 1024;

export interface DocumentPackApprovalDeriverOptions {
  repoRoot: string;
  projectsRoot?: string;
  rendererOptions?: DocumentPackRendererOptions;
  render?: typeof renderDocumentPackOutput;
  renderCarousel?: (input: { html: string; batchSlug: string }) => Promise<CarouselRenderResult>;
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
  const renderCarousel = options.renderCarousel ?? ((input) => renderCarouselBatch(input));
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
      if (source.format === 'html') assertSafeHtmlActiveContent(source.content);
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

    for (const output of contract.carouselOutputs ?? []) {
      const source = approvedSources.get(output.sourcePath);
      if (!source?.content.trim()) throw new Error(`${skillId} não possui a fonte de carrossel ${output.sourcePath}.`);
      const batchSlug = `conteudo-v${proposalRevision}`;
      const result = await renderCarousel({ html: source.content, batchSlug });
      const versionRoot = `${output.versionRoot}/v${proposalRevision}`;
      for (const file of result.files) {
        const path = `${versionRoot}/${file.path}`;
        const format = file.path.endsWith('.png') ? 'image' as const : file.path.endsWith('.zip') ? 'zip' as const : 'html' as const;
        totalBytes += file.content.byteLength;
        if (file.content.byteLength > MAX_DERIVED_FILE_BYTES || totalBytes > MAX_DERIVED_PACK_BYTES) {
          throw new Error(`O carrossel derivado de ${skillId} excedeu o limite permitido.`);
        }
        derived.push({
          artifactType: 'carousel-document', title: `${skillId}: ${path}`, path, format,
          content: file.content, derivedFrom: output.sourcePath,
        });
        if (file.path === 'index.html') {
          derived.push({
            artifactType: 'carousel-gallery', title: 'Galeria de carrosséis', path: output.galleryPath,
            format: 'html', content: file.content, derivedFrom: output.sourcePath,
          });
        }
      }
      const manifestContent = Buffer.from(`${JSON.stringify(result.manifest, null, 2)}\n`, 'utf8');
      derived.push({
        artifactType: 'carousel-manifest', title: `${skillId}: manifesto do carrossel`,
        path: `${versionRoot}/manifest.json`, format: 'json', content: manifestContent, derivedFrom: output.sourcePath,
      });
    }

    if (contract.reconcileBook) {
      const htmlSource = contract.bookEntry;
      const derivedBookEntry = derived.find((artifact) => artifact.path === htmlSource.path);
      if (!approvedSources.get(htmlSource.path)?.content.trim() && !derivedBookEntry) throw new Error(`${skillId} exige Book do Funil, mas não produziu ${htmlSource.path}.`);
      const bookDerivedFrom = approvedSources.has(htmlSource.path)
        ? htmlSource.path
        : derivedBookEntry?.derivedFrom ?? htmlSource.path;
      const carouselBook = contract.carouselOutputs?.find((output) => output.galleryPath === htmlSource.path);
      const immutableHtmlPath = carouselBook
        ? `${carouselBook.versionRoot}/v${proposalRevision}/index.html`
        : immutableRevisionPath(htmlSource.path, proposalRevision, contract.versioning);
      const prior = parseBookDoFunilState(await readArtifact(projectSlug, 'book-do-funil.json'), projectSlug);
      const state = reconcileBookDoFunil({
        prior,
        skillId,
        title: htmlSource.title,
        phase: htmlSource.phase,
        revision: proposalRevision,
        canonicalHtmlPath: htmlSource.path,
        immutableHtmlPath,
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
        derivedFrom: bookDerivedFrom,
      }, {
        artifactType: 'book-do-funil',
        title: 'Book do Funil',
        path: 'index.html',
        format: 'html',
        content: bookHtml,
        derivedFrom: bookDerivedFrom,
      });
    }

    return derived;
  };
}
