export interface BookVersion {
  revision: number;
  link: string;
}

export interface BookCard {
  id: string;
  title: string;
  phase: 'Pesquisa' | 'Oferta e Fundação' | 'Peças do funil' | 'Próximas peças';
  status: 'feito' | 'em revisão' | 'ação do dono' | 'fila';
  link: string;
  versions: BookVersion[];
}

export interface BookDoFunilState {
  schemaVersion: '1.0.0';
  projectSlug: string;
  cards: BookCard[];
  current: { completedSkillId: string; nextCommand: string };
}

const PHASE_BY_SKILL: Record<string, BookCard['phase']> = {
  'avatar-funil': 'Pesquisa',
  'espiao-do-concorrente': 'Pesquisa',
  'trend-hunting': 'Pesquisa',
  'swipe-file': 'Pesquisa',
  offerbook: 'Oferta e Fundação',
  'design-md': 'Oferta e Fundação',
  'metodo-funil': 'Oferta e Fundação',
  'copy-funil': 'Oferta e Fundação',
  'pagina-vendas-funil': 'Peças do funil',
};

const NEXT_COMMAND_BY_SKILL: Record<string, string> = {
  offerbook: '/design-md',
  'copy-funil': '/pagina-vendas-funil',
  'pagina-vendas-funil': '/email-funil',
};

function assertSafeHtmlLink(link: string): void {
  if (!link.endsWith('.html') || link.startsWith('/') || link.includes('..') || link.includes('\\')) {
    throw new Error(`Link inválido para o Book do Funil: ${JSON.stringify(link)}.`);
  }
}

export function parseBookDoFunilState(content: string | null, projectSlug: string): BookDoFunilState {
  if (!content) {
    return {
      schemaVersion: '1.0.0',
      projectSlug,
      cards: [],
      current: { completedSkillId: '', nextCommand: '' },
    };
  }
  const parsed = JSON.parse(content) as Partial<BookDoFunilState>;
  if (parsed.schemaVersion !== '1.0.0' || parsed.projectSlug !== projectSlug || !Array.isArray(parsed.cards)) {
    throw new Error('Estado existente do Book do Funil é incompatível; nenhuma atualização foi aplicada.');
  }
  for (const card of parsed.cards) {
    assertSafeHtmlLink(card.link);
    if (!Array.isArray(card.versions)) throw new Error(`Card ${card.id} sem versões válidas.`);
    for (const version of card.versions) assertSafeHtmlLink(version.link);
  }
  return parsed as BookDoFunilState;
}

export function reconcileBookDoFunil(input: {
  prior: BookDoFunilState;
  skillId: string;
  title: string;
  revision: number;
  canonicalHtmlPath: string;
  immutableHtmlPath: string;
  phase?: BookCard['phase'];
}): BookDoFunilState {
  assertSafeHtmlLink(input.canonicalHtmlPath);
  assertSafeHtmlLink(input.immutableHtmlPath);
  const priorCard = input.prior.cards.find((card) => card.id === input.skillId);
  const versions = [
    { revision: input.revision, link: input.immutableHtmlPath },
    ...(priorCard?.versions ?? []).filter((version) => version.revision !== input.revision),
  ].sort((a, b) => b.revision - a.revision);
  const card: BookCard = {
    id: input.skillId,
    title: input.title,
    phase: input.phase ?? PHASE_BY_SKILL[input.skillId] ?? 'Próximas peças',
    status: 'feito',
    link: input.canonicalHtmlPath,
    versions,
  };
  return {
    ...input.prior,
    cards: [...input.prior.cards.filter((candidate) => candidate.id !== input.skillId), card]
      .sort((a, b) => a.phase.localeCompare(b.phase, 'pt-BR') || a.title.localeCompare(b.title, 'pt-BR')),
    current: {
      completedSkillId: input.skillId,
      nextCommand: NEXT_COMMAND_BY_SKILL[input.skillId] ?? '/status-funil',
    },
  };
}

function embeddedJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function renderBookDoFunil(state: BookDoFunilState): string {
  const phases: BookCard['phase'][] = ['Pesquisa', 'Oferta e Fundação', 'Peças do funil', 'Próximas peças'];
  const sections = phases.map((phase) => {
    const cards = state.cards.filter((card) => card.phase === phase).map((card) => `
      <article class="card" data-card="${card.id}">
        <div><span class="badge">${card.status}</span><h2>${card.title}</h2></div>
        <a class="open" href="${card.link}">Abrir peça</a>
        <div class="versions" data-versions="${card.id}"></div>
      </article>`).join('');
    return cards ? `<section><h1>${phase}</h1><div class="grid">${cards}</div></section>` : '';
  }).join('');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Book do Funil</title><style>
:root{color-scheme:dark;font-family:Inter,Arial,sans-serif;background:#0a0a0a;color:#f4f1ed}*{box-sizing:border-box}body{margin:0}main{max-width:1120px;margin:auto;padding:48px 24px 72px}header{padding-bottom:28px;border-bottom:1px solid #302d2a}header p,.meta{color:#aaa39c}h1{font:400 26px Georgia,serif}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.card{padding:16px;border:1px solid #34312e;border-radius:6px;background:#121212}.card h2{margin:8px 0 16px;font:400 22px Georgia,serif}.badge{font-size:10px;text-transform:uppercase;color:#d7b36a}.open,.version a{color:#f4f1ed}.versions{display:grid;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid #2d2a28}.version{display:flex;align-items:center;justify-content:space-between;font-size:12px}.version button{border:0;background:transparent;color:#aaa39c;cursor:pointer}.progress{margin-top:44px;padding:18px;border-left:2px solid #d7b36a;background:#121212}.hidden-toggle{margin-top:24px;border:0;background:transparent;color:#aaa39c;cursor:pointer}@media(max-width:520px){main{padding:32px 16px}.grid{grid-template-columns:1fr}}
</style></head><body><main><header><p>ACADEMIA LENDÁRIA</p><h1>Book do Funil</h1><p>O hub das peças aprovadas deste projeto.</p></header>${sections}
<div class="progress"><strong>VOCÊ ESTÁ AQUI:</strong><p><code>${state.current.completedSkillId}</code> concluída. Próximo comando: <code>${state.current.nextCommand}</code></p></div>
<button class="hidden-toggle" type="button" hidden></button></main>
<script id="book-data" type="application/json">${embeddedJson(state)}</script><script>
const state=JSON.parse(document.getElementById('book-data').textContent);const key='book-do-funil:hidden:'+state.projectSlug;const hidden=new Set(JSON.parse(localStorage.getItem(key)||'[]'));const toggle=document.querySelector('.hidden-toggle');
function persist(){localStorage.setItem(key,JSON.stringify([...hidden]));render()}
function render(){let count=0;for(const card of state.cards){const root=document.querySelector('[data-versions="'+card.id+'"]');if(!root)continue;root.textContent='';for(const version of card.versions){const id=card.id+':'+version.revision;if(hidden.has(id)){count++;continue}const row=document.createElement('div');row.className='version';const link=document.createElement('a');link.href=version.link;link.textContent='Revisão '+version.revision;const button=document.createElement('button');button.type='button';button.textContent='✕ Excluir esta versão';button.onclick=()=>{if(confirm('Tem certeza que quer excluir esta versão do Book do Funil? Os arquivos continuam no disco.')){hidden.add(id);persist()}};row.append(link,button);root.append(row)}}toggle.hidden=count===0;toggle.textContent='Mostrar versões ocultas ('+count+')';toggle.onclick=()=>{hidden.clear();persist()}}
render();</script></body></html>\n`;
}
