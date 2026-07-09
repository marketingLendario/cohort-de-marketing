export type CreativeView = 'config' | 'gallery';
export type CreativeFormat = 'feed' | 'story' | 'square';
export type CreativeArchetype = 'dark' | 'light' | 'pessoa' | 'mockup' | 'didatico';
export type CreativePersona = 'ana' | 'rafael' | 'livia' | 'marcos';
export type CreativeStatus = 'generated' | 'approved' | 'regenerating' | 'discarded';

export interface CreativeItem {
  id: string;
  hook: string;
  hookIndex: number;
  archetype: CreativeArchetype;
  format: CreativeFormat;
  image: string;
  gate: boolean;
  approved: boolean;
  status: CreativeStatus;
}

export interface CreativeSlot {
  id: string;
  label: string;
  sub: string;
  format: CreativeFormat;
  filled: string | null;
}

export interface CreativeFactoryState {
  view: CreativeView;
  formats: Record<CreativeFormat, boolean>;
  archetypes: Record<CreativeArchetype, boolean>;
  personas: Record<CreativePersona, boolean>;
  variants: number;
  copySource: 'will-binder' | 'inline';
  generation: 'idle' | 'generating' | 'done';
  progress: number;
  creatives: CreativeItem[];
  slots: CreativeSlot[];
}

interface CatalogItem {
  hook: string;
  hookIndex: number;
  archetype: CreativeArchetype;
  image: string;
}

const ASSET_ROOT = '/creative-samples';

export const CREATIVE_FORMAT_META: Record<CreativeFormat, { label: string; ratio: string }> = {
  feed: { label: 'Feed', ratio: '4:5' },
  story: { label: 'Story', ratio: '9:16' },
  square: { label: 'Square', ratio: '1:1' },
};

export const CREATIVE_ARCHETYPE_META: Record<CreativeArchetype, string> = {
  dark: 'Dark',
  light: 'Light',
  pessoa: 'Pessoa',
  mockup: 'Mockup',
  didatico: 'Comparativo',
};

export const CREATIVE_PERSONAS: Array<{
  key: CreativePersona;
  name: string;
  role: string;
  color: string;
}> = [
  { key: 'ana', name: 'Ana Prado', role: 'Copy', color: '#C9B298' },
  { key: 'rafael', name: 'Rafael Lima', role: 'Mídia', color: '#538096' },
  { key: 'livia', name: 'Lívia Sá', role: 'Host', color: '#AC8E68' },
  { key: 'marcos', name: 'Marcos Reis', role: 'Founder', color: '#7E9B5B' },
];

const CATALOG: CatalogItem[] = [
  { hook: 'Isso não é marketing. É aposta.', hookIndex: 0, archetype: 'dark', image: `${ASSET_ROOT}/A_dark.jpg` },
  { hook: 'Isso não é marketing. É aposta.', hookIndex: 0, archetype: 'light', image: `${ASSET_ROOT}/A_light.jpg` },
  { hook: 'Isso não é marketing. É aposta.', hookIndex: 0, archetype: 'pessoa', image: `${ASSET_ROOT}/A_person.jpg` },
  { hook: 'Achismo ou número?', hookIndex: 1, archetype: 'didatico', image: `${ASSET_ROOT}/B_didatico.jpg` },
  { hook: 'Não é falta de tráfego. É falta de número.', hookIndex: 1, archetype: 'mockup', image: `${ASSET_ROOT}/B_mockup.jpg` },
  { hook: 'Pare de depender de agência.', hookIndex: 2, archetype: 'dark', image: `${ASSET_ROOT}/C_dark.jpg` },
  { hook: 'Pare de depender de agência.', hookIndex: 2, archetype: 'light', image: `${ASSET_ROOT}/C_light.jpg` },
  { hook: 'Pare de depender de agência.', hookIndex: 2, archetype: 'pessoa', image: `${ASSET_ROOT}/C_person.jpg` },
  { hook: 'Apostar ou medir?', hookIndex: 3, archetype: 'didatico', image: `${ASSET_ROOT}/D_didatico.jpg` },
  { hook: 'Você sabe seu CAC de cabeça?', hookIndex: 3, archetype: 'mockup', image: `${ASSET_ROOT}/D_mockup.jpg` },
  { hook: 'Opere como um squad de agentes.', hookIndex: 4, archetype: 'dark', image: `${ASSET_ROOT}/E_dark.jpg` },
  { hook: 'Opere como um squad de agentes.', hookIndex: 4, archetype: 'light', image: `${ASSET_ROOT}/E_light.jpg` },
  { hook: 'Opere como um squad de agentes.', hookIndex: 4, archetype: 'pessoa', image: `${ASSET_ROOT}/E_person.jpg` },
  { hook: 'Vaidade ou receita?', hookIndex: 5, archetype: 'didatico', image: `${ASSET_ROOT}/F_didatico.jpg` },
  { hook: '4 números que decidem se você dá lucro.', hookIndex: 5, archetype: 'mockup', image: `${ASSET_ROOT}/F_mockup.jpg` },
];

export function defaultCreativeFactoryState(): CreativeFactoryState {
  return {
    view: 'config',
    formats: { feed: true, story: true, square: false },
    archetypes: { dark: true, light: true, pessoa: true, mockup: true, didatico: true },
    personas: { ana: true, rafael: false, livia: true, marcos: false },
    variants: 2,
    copySource: 'will-binder',
    generation: 'idle',
    progress: 0,
    creatives: [],
    slots: [
      { id: 's1', label: 'AD · LAL 1% · Feed', sub: '4:5 · Conjunto A', format: 'feed', filled: null },
      { id: 's2', label: 'AD · Interesse · Story', sub: '9:16 · Conjunto A', format: 'story', filled: null },
      { id: 's3', label: 'AD · Broad · Feed', sub: '4:5 · Conjunto B', format: 'feed', filled: null },
      { id: 's4', label: 'AD · LAL 3% · Square', sub: '1:1 · Conjunto B', format: 'square', filled: null },
      { id: 's5', label: 'AD · Interesse · Story', sub: '9:16 · Conjunto C', format: 'story', filled: null },
      { id: 's6', label: 'AD · Broad · Feed', sub: '4:5 · Conjunto C', format: 'feed', filled: null },
    ],
  };
}

export function selectedCreativeFormats(state: CreativeFactoryState): CreativeFormat[] {
  return (Object.keys(state.formats) as CreativeFormat[]).filter((key) => state.formats[key]);
}

export function selectedCreativeArchetypes(state: CreativeFactoryState): CreativeArchetype[] {
  return (Object.keys(state.archetypes) as CreativeArchetype[]).filter((key) => state.archetypes[key]);
}

export function creativeBatchTotal(state: CreativeFactoryState): number {
  const catalogCount = CATALOG.filter((item) => state.archetypes[item.archetype]).length;
  return Math.min(15, catalogCount * Math.max(1, selectedCreativeFormats(state).length));
}

export function buildCreativeBatch(state: CreativeFactoryState): CreativeItem[] {
  const formats = selectedCreativeFormats(state);
  const archetypes = selectedCreativeArchetypes(state);
  const output: CreativeItem[] = [];
  for (const item of CATALOG.filter((entry) => archetypes.includes(entry.archetype))) {
    for (const format of formats) {
      const index = output.length;
      output.push({
        id: `creative-${index + 1}`,
        hook: item.hook,
        hookIndex: item.hookIndex,
        archetype: item.archetype,
        format,
        image: item.image,
        gate: index % 6 !== 4,
        approved: false,
        status: 'generated',
      });
      if (output.length >= 15) return output;
    }
  }
  return output;
}

export function updateCreative(
  state: CreativeFactoryState,
  creativeId: string,
  patch: Partial<CreativeItem>,
): CreativeFactoryState {
  return {
    ...state,
    creatives: state.creatives.map((creative) =>
      creative.id === creativeId ? { ...creative, ...patch } : creative,
    ),
  };
}

export function assignCreativeToSlot(
  state: CreativeFactoryState,
  creativeId: string,
  slotId: string,
): CreativeFactoryState {
  const creative = state.creatives.find((item) => item.id === creativeId);
  if (!creative?.approved) return state;
  return {
    ...state,
    slots: state.slots.map((slot) => (slot.id === slotId ? { ...slot, filled: creativeId } : slot)),
  };
}

export function clearCreativeSlot(state: CreativeFactoryState, slotId: string): CreativeFactoryState {
  return {
    ...state,
    slots: state.slots.map((slot) => (slot.id === slotId ? { ...slot, filled: null } : slot)),
  };
}

export function summarizeCreativeFactory(state: CreativeFactoryState) {
  return {
    total: creativeBatchTotal(state),
    approved: state.creatives.filter((creative) => creative.approved).length,
    generated: state.creatives.filter((creative) => creative.status !== 'discarded').length,
    filled: state.slots.filter((slot) => slot.filled).length,
    slots: state.slots.length,
  };
}
