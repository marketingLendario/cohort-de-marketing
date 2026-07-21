import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SkillProposal } from '../local-skill-runner.js';
import { validateSalesPageHtml } from './sales-page-validator.js';
import { assertCarouselHtmlDimensions, assertSemanticDocument, normalizeCollectionIndexLinks, type SemanticValidationProfileId } from './semantic-validators.js';

type DocumentValidationProfile = 'sales-page-v1' | SemanticValidationProfileId;

export interface DocumentPackContract {
  skillId: string;
  contractGroup: 'owner-document' | 'funnel-page-pack' | 'interactive-pack' | 'message-collection' | 'dynamic-library';
  requiredTextOutputs: Array<{
    path: string;
    format: 'markdown' | 'html' | 'json' | 'yaml';
    validationProfile?: DocumentValidationProfile;
  }>;
  optionalTextOutputs?: Array<{
    path: string;
    format: 'markdown' | 'html' | 'json' | 'yaml';
    validationProfile?: DocumentValidationProfile;
  }>;
  requiredCollections?: Array<{
    pathPattern: string;
    format: 'markdown' | 'html' | 'json' | 'yaml';
    minItems: number;
    validationProfile?: SemanticValidationProfileId;
  }>;
  requiredAnyOf?: string[][];
  derivedOutputs: Array<{
    path: string;
    format: 'pdf' | 'docx';
    sourcePath: string;
    renderer: 'chromium-pdf' | 'offerbook-docx';
  }>;
  derivedCollectionOutputs?: Array<{
    sourcePattern: string;
    outputExtension: '.pdf';
    renderer: 'chromium-pdf';
  }>;
  carouselOutputs?: Array<{
    sourcePath: string;
    galleryPath: string;
    versionRoot: string;
  }>;
  versioning: 'v-suffix' | 'version-directory';
  reconcileBook: boolean;
  bookEntry: {
    path: string;
    title: string;
    phase: 'Pesquisa' | 'Oferta e Fundação' | 'Peças do funil' | 'Próximas peças';
  };
}

interface DocumentPackFile {
  schemaVersion: '2.0.0';
  contracts: DocumentPackContract[];
}

export async function loadDocumentPackContract(repoRoot: string, skillId: string): Promise<DocumentPackContract | null> {
  const parsed = JSON.parse(await readFile(resolve(repoRoot, 'data/document-pack-contracts.json'), 'utf8')) as DocumentPackFile;
  return parsed.contracts.find((contract) => contract.skillId === skillId) ?? null;
}

export function documentPackPrompt(contract: DocumentPackContract): string {
  const textOutputs = contract.requiredTextOutputs.map((output) => `${output.path} (${output.format})`).join(', ');
  const derived = contract.derivedOutputs.map((output) => `${output.path} via ${output.renderer}`).join(', ');
  const derivedCollections = (contract.derivedCollectionOutputs ?? []).map((output) => `${output.sourcePattern} -> ${output.outputExtension} via ${output.renderer}`).join(', ');
  const carousels = (contract.carouselOutputs ?? []).map((output) => `${output.sourcePath} -> ${output.galleryPath} + PNG/ZIP`).join(', ');
  const optional = (contract.optionalTextOutputs ?? []).map((output) => `${output.path} (${output.format})`).join(', ');
  const collections = (contract.requiredCollections ?? []).map((output) => `${output.pathPattern} (${output.format}, mínimo ${output.minItems})`).join(', ');
  const anyOf = (contract.requiredAnyOf ?? []).map((group) => `um de [${group.join(', ')}]`).join('; ');
  const validation = contract.requiredTextOutputs.some((output) => output.validationProfile === 'sales-page-v1')
    ? 'A página HTML deve usar data-page-contract="sales-page-v1" e data-section na ordem: hero, vsl, primary-cta, mechanism, offer, pricing, proof, benefits, bonuses, guarantee, urgency, faq, checkout, final-cta, footer. Inclua formulário name/email/phone, CTA funcional, roteiro do vídeo e tracking PageView/ViewContent/Lead/chegou_na_oferta com Pixel/GTM comentados.'
    : '';
  const profiles = new Set([
    ...contract.requiredTextOutputs.map((output) => output.validationProfile),
    ...(contract.optionalTextOutputs ?? []).map((output) => output.validationProfile),
    ...(contract.requiredCollections ?? []).map((output) => output.validationProfile),
  ].filter(Boolean));
  const semanticRequirements = [
    profiles.has('owner-document-v1') ? 'Todo owner-document-v1 deve ser HTML completo e conter link visível para o Book do Funil (href="index.html" ou caminho relativo equivalente).' : '',
    profiles.has('collection-index-v1') ? 'Todo collection-index-v1 deve conter links relativos apenas para arquivos HTML gerados no pack; referências a fontes Markdown devem permanecer como texto, sem link.' : '',
    profiles.has('message-copy-v1') ? 'Todo message-copy-v1 deve expor a mensagem e um botão funcional que use navigator.clipboard.writeText.' : '',
    profiles.has('video-script-v1') ? 'Todo video-script-v1 deve conter um bloco [data-video-script] e navegação de volta para a página/Book.' : '',
    profiles.has('quiz-app-v1') ? 'Todo quiz-app-v1 deve ter formulário interativo, output de resultado e persistência localStorage.' : '',
    profiles.has('lead-page-v1') ? 'Todo lead-page-v1 deve ter viewport responsivo, formulário com e-mail e CTA de submissão.' : '',
  ].filter(Boolean).join(' ');
  return [
    `CONTRATO DO PACK: produza todos os arquivos-fonte textuais a seguir: ${textOutputs}.`,
    `Não gere nem transporte binário no JSON. Após aprovação, o BFF derivará: ${derived}.`,
    derivedCollections ? `O BFF também derivará cada item das coleções: ${derivedCollections}.` : '',
    carousels ? `O BFF renderizará os carrosséis aprovados, sem rede: ${carousels}. O HTML-fonte deve conter de 1 a 20 elementos [data-carousel-slide] ou .slide, cada um com dimensões CSS 1080x1350.` : '',
    optional ? `Arquivos condicionais permitidos quando aplicáveis ao Perfil: ${optional}.` : '',
    collections ? `Coleções obrigatórias: ${collections}.` : '',
    anyOf ? `Alternativas condicionais obrigatórias: ${anyOf}.` : '',
    'Use exatamente os paths relativos declarados; não crie arquivos textuais adicionais e não prefixe com generated/ nem com o slug do projeto.',
    validation,
    semanticRequirements,
  ].filter(Boolean).join(' ');
}

export function documentPackPattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('**', '__DOUBLE_STAR__').replaceAll('*', '[^/]+').replaceAll('__DOUBLE_STAR__', '.+')
  return new RegExp(`^${escaped}$`)
}

export function documentPackSourceOutputs(contract: DocumentPackContract, proposal: SkillProposal) {
  const exact = new Set([
    ...contract.requiredTextOutputs.map((output) => output.path),
    ...(contract.optionalTextOutputs ?? []).map((output) => output.path),
  ])
  const patterns = (contract.requiredCollections ?? []).map((collection) => documentPackPattern(collection.pathPattern))
  return proposal.artifacts.filter((artifact) => exact.has(artifact.path) || patterns.some((pattern) => pattern.test(artifact.path)))
}

export function normalizeDocumentPackArtifactTypes(
  contract: DocumentPackContract,
  proposal: SkillProposal,
  primaryArtifactTypes: readonly string[],
): void {
  if (primaryArtifactTypes.length !== 1) return
  const [primaryArtifactType] = primaryArtifactTypes
  for (const artifact of documentPackSourceOutputs(contract, proposal)) {
    artifact.artifactType = primaryArtifactType!
  }
}

export function normalizeDocumentPackDeclaredArtifacts(
  contract: DocumentPackContract,
  proposal: SkillProposal,
): void {
  const declared = new Set(documentPackSourceOutputs(contract, proposal));
  const authoritativeSnapshotTypes = new Set([
    'researchSnapshot',
    'mediaSnapshot',
    'brandDesignSnapshot',
  ]);
  const removed = proposal.artifacts.filter((artifact) => (
    !declared.has(artifact) && !authoritativeSnapshotTypes.has(artifact.artifactType)
  ));
  if (removed.length === 0) return;
  proposal.artifacts = proposal.artifacts.filter((artifact) => !removed.includes(artifact));
  proposal.warnings.push(`Arquivos fora do contrato foram descartados: ${removed.map((artifact) => artifact.path).join(', ')}.`);
}

export function normalizeDocumentPackCollectionIndexes(
  contract: DocumentPackContract,
  proposal: SkillProposal,
): void {
  const outputs = [
    ...contract.requiredTextOutputs,
    ...(contract.optionalTextOutputs ?? []),
  ];
  const sourceArtifacts = documentPackSourceOutputs(contract, proposal);
  const htmlPaths = sourceArtifacts
    .filter((artifact) => artifact.format === 'html')
    .map((artifact) => artifact.path);

  for (const output of outputs.filter((candidate) => candidate.validationProfile === 'collection-index-v1')) {
    const artifact = proposal.artifacts.find((candidate) => candidate.path === output.path);
    if (!artifact) continue;
    const normalized = normalizeCollectionIndexLinks(artifact.content, artifact.path, htmlPaths);
    if (!normalized.changed) continue;
    artifact.content = normalized.html;
    proposal.warnings.push(`Links do índice ${artifact.path} foram normalizados para os HTMLs presentes no pack.`);
  }
}

function validateDocumentOutput(profile: DocumentValidationProfile | undefined, content: string): void {
  if (profile === 'sales-page-v1') validateSalesPageHtml(content)
  else if (profile) assertSemanticDocument(profile, content)
}

export function assertDocumentPackProposal(contract: DocumentPackContract, proposal: SkillProposal): void {
  const artifacts = new Map(proposal.artifacts.map((artifact) => [artifact.path, artifact]));
  const missing = contract.requiredTextOutputs.filter((expected) => {
    const artifact = artifacts.get(expected.path);
    return !artifact || artifact.format !== expected.format || !artifact.content.trim();
  });
  if (missing.length > 0) {
    throw new Error(
      `${contract.skillId} não produziu o pack textual obrigatório: ${missing.map((output) => output.path).join(', ')}.`,
    );
  }
  for (const group of contract.requiredAnyOf ?? []) {
    if (!group.some((path) => artifacts.get(path)?.content.trim())) {
      throw new Error(`${contract.skillId} precisa produzir ao menos um destes arquivos: ${group.join(', ')}.`)
    }
  }
  for (const collection of contract.requiredCollections ?? []) {
    const pattern = documentPackPattern(collection.pathPattern)
    const matching = proposal.artifacts.filter((artifact) => pattern.test(artifact.path) && artifact.format === collection.format && artifact.content.trim())
    if (matching.length < collection.minItems) {
      throw new Error(`${contract.skillId} precisa produzir ao menos ${collection.minItems} item(ns) em ${collection.pathPattern}.`)
    }
  }
  for (const expected of contract.requiredTextOutputs) {
    const artifact = artifacts.get(expected.path);
    if (artifact) validateDocumentOutput(expected.validationProfile, artifact.content);
  }
  for (const optional of contract.optionalTextOutputs ?? []) {
    const artifact = artifacts.get(optional.path)
    if (artifact && (artifact.format !== optional.format || !artifact.content.trim())) {
      throw new Error(`${contract.skillId} produziu o arquivo condicional ${optional.path} em formato inválido.`)
    }
    if (artifact) validateDocumentOutput(optional.validationProfile, artifact.content)
  }
  for (const collection of contract.requiredCollections ?? []) {
    if (!collection.validationProfile) continue
    const pattern = documentPackPattern(collection.pathPattern)
    for (const artifact of proposal.artifacts.filter((candidate) => pattern.test(candidate.path))) {
      validateDocumentOutput(collection.validationProfile, artifact.content)
    }
  }
  for (const carousel of contract.carouselOutputs ?? []) {
    const artifact = artifacts.get(carousel.sourcePath)
    if (artifact) assertCarouselHtmlDimensions(artifact.content)
  }
}
