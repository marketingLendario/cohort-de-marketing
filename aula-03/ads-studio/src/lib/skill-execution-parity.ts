import { skillExecutionMatrix } from '@/generated/skill-catalog';

export type SkillParity = (typeof skillExecutionMatrix.skills)[number]['parity'];
export type SkillPanelMode = (typeof skillExecutionMatrix.skills)[number]['panelMode'];
export type SkillAdapter = (typeof skillExecutionMatrix.skills)[number]['adapter'];

export const SKILL_PARITY_LABELS: Record<SkillParity, string> = {
  full_e2e: 'Painel e CLI validados',
  partial: 'Cobertura nativa parcial',
  proposal_only: 'Proposta guiada pelo painel',
};

export const SKILL_PARITY_DESCRIPTIONS: Record<SkillParity, string> = {
  full_e2e: 'Este fluxo possui adapter dedicado e evidência ponta a ponta.',
  partial: 'O painel cobre parte da jornada, mas ainda não reproduz toda a skill do CLI.',
  proposal_only: 'O painel gera uma proposta revisável; entregáveis avançados ainda dependem do CLI.',
};

export const SKILL_ADAPTER_GAP_LABELS: Record<SkillAdapter, string> = {
  'environment-bootstrap': 'Diagnóstico do computador e consentimento guiado para instalações.',
  'external-research': 'Coleta externa segura, credenciais isoladas e retomada da pesquisa.',
  'document-pack': 'Pacote versionado com HTML/PDF, arquivos derivados e atualização do Book do Funil.',
  'brand-design': 'Importação visual, enriquecimento de tokens e validação do preview da marca.',
  'visual-production': 'Geração de imagens, galeria binária, variantes e seleção visual humana.',
  'project-status': 'Reconciliação integral com o Book do Funil e indicação do próximo comando.',
  'traffic-workflow': 'Fluxo especializado do Squad de Tráfego.',
  'creative-factory': 'Motor especializado de imagens e legendas.',
};

const CAPABILITY_GAP_LABELS: Record<string, string> = {
  'host remediation from the panel': 'Correções no computador iniciadas pelo painel.',
  'interactive installation consent': 'Consentimento guiado antes de instalar dependências.',
  'multi-turn elicitation': 'Elicitação em múltiplas etapas no painel.',
  'Book reconciliation': 'Atualização atômica do Book do Funil.',
  'panel and CLI document-pack E2E': 'Validação do mesmo pack no painel e no CLI.',
  'production page validation': 'Validação visual e funcional da página de produção.',
  'complete Book reconciliation': 'Reconciliação completa com o Book do Funil.',
  'actionable next command': 'Próximo comando acionável diretamente pelo painel.',
};

export function capabilityGapLabel(capability: string): string {
  return CAPABILITY_GAP_LABELS[capability] ?? capability;
}

export function executionParityForSkill(skillId: string) {
  const entry = skillExecutionMatrix.skills.find((candidate) => candidate.id === skillId);
  if (!entry) throw new Error(`Skill sem contrato de paridade: ${skillId}`);
  return entry;
}

export function panelActionLabel(parity: SkillParity): string {
  if (parity === 'full_e2e') return 'Executar skill';
  if (parity === 'partial') return 'Executar etapa guiada';
  return 'Gerar proposta';
}
