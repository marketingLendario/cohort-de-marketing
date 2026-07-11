import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SkillProposal } from '../local-skill-runner.js';
import { validateSalesPageHtml } from './sales-page-validator.js';
import { assertSemanticDocument, type SemanticValidationProfileId } from './semantic-validators.js';

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
  const optional = (contract.optionalTextOutputs ?? []).map((output) => `${output.path} (${output.format})`).join(', ');
  const collections = (contract.requiredCollections ?? []).map((output) => `${output.pathPattern} (${output.format}, mínimo ${output.minItems})`).join(', ');
  const anyOf = (contract.requiredAnyOf ?? []).map((group) => `um de [${group.join(', ')}]`).join('; ');
  const validation = contract.requiredTextOutputs.some((output) => output.validationProfile === 'sales-page-v1')
    ? 'A página HTML deve usar data-page-contract="sales-page-v1" e data-section na ordem: hero, vsl, primary-cta, mechanism, offer, pricing, proof, benefits, bonuses, guarantee, urgency, faq, checkout, final-cta, footer. Inclua formulário name/email/phone, CTA funcional, roteiro do vídeo e tracking PageView/ViewContent/Lead/chegou_na_oferta com Pixel/GTM comentados.'
    : '';
  return [
    `CONTRATO DO PACK: produza todos os arquivos-fonte textuais a seguir: ${textOutputs}.`,
    `Não gere nem transporte binário no JSON. Após aprovação, o BFF derivará: ${derived}.`,
    derivedCollections ? `O BFF também derivará cada item das coleções: ${derivedCollections}.` : '',
    optional ? `Arquivos condicionais permitidos quando aplicáveis ao Perfil: ${optional}.` : '',
    collections ? `Coleções obrigatórias: ${collections}.` : '',
    anyOf ? `Alternativas condicionais obrigatórias: ${anyOf}.` : '',
    'Use exatamente os paths relativos declarados; não prefixe com generated/ nem com o slug do projeto.',
    validation,
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
}
