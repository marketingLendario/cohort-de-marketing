#!/usr/bin/env node
/**
 * One-shot migration: violet/Tailwind/FA → Lendár[IA] hub brand.
 * Run: node scripts/migrate-mapa-brand.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(ROOT, 'mapa-skills.html');
let html = readFileSync(path, 'utf8');

const FA_TO_ICONOIR = [
  ['fa-solid fa-diagram-project', 'iconoir-network-right'],
  ['fa-solid fa-grip', 'iconoir-view-grid'],
  ['fa-solid fa-sitemap', 'iconoir-network'],
  ['fa-solid fa-undo', 'iconoir-undo'],
  ['fa-solid fa-search', 'iconoir-search'],
  ['fa-solid fa-info-circle', 'iconoir-info-circle'],
  ['fa-solid fa-play', 'iconoir-play'],
  ['fa-solid fa-pause', 'iconoir-pause'],
  ['fa-solid fa-chevron-left', 'iconoir-nav-arrow-left'],
  ['fa-solid fa-chevron-right', 'iconoir-nav-arrow-right'],
  ['fa-solid fa-hand', 'iconoir-hand-drag'],
  ['fa-solid fa-plus', 'iconoir-plus'],
  ['fa-solid fa-minus', 'iconoir-minus'],
  ['fa-solid fa-expand', 'iconoir-expand'],
  ['fa-solid fa-rotate-left', 'iconoir-refresh'],
  ['fa-solid fa-times', 'iconoir-xmark'],
  ['fa-solid fa-crosshairs', 'iconoir-target'],
  ['fa-solid fa-copy', 'iconoir-copy'],
  ['fa-solid fa-link', 'iconoir-link'],
  ['fa-solid fa-folder-open', 'iconoir-folder'],
  ['fa-solid fa-share-nodes', 'iconoir-share-android'],
  ['fa-solid fa-shield-halved', 'iconoir-shield'],
  ['fa-solid fa-arrow-right-to-bracket', 'iconoir-arrow-right'],
  ['fa-solid fa-file-word', 'iconoir-page'],
  ['fa-solid fa-file-pdf', 'iconoir-page'],
  ['fa-solid fa-eye', 'iconoir-eye'],
  ['fa-solid fa-arrow-up-right-from-square', 'iconoir-open-new-window'],
  ['fa-solid fa-file-lines', 'iconoir-page'],
  ['fa-solid fa-code', 'iconoir-code'],
  ['fa-solid fa-folder', 'iconoir-folder'],
  ['fa-solid fa-file', 'iconoir-page'],
];

for (const [from, to] of FA_TO_ICONOIR) {
  html = html.split(from).join(to);
}

html = html.replace(/fa-solid fa-(\w+)/g, (_, name) => {
  const map = {
    cog: 'iconoir-settings',
    search: 'iconoir-search',
    lightbulb: 'iconoir-bright-star',
    'layer-group': 'iconoir-layers',
    'funnel-dollar': 'iconoir-funnel',
    bullseye: 'iconoir-target',
    envelope: 'iconoir-mail',
    cogs: 'iconoir-settings',
    'chart-line': 'iconoir-stats-up-square',
    image: 'iconoir-media-image',
    star: 'iconoir-star',
  };
  return map[name] || 'iconoir-star';
});

html = html.replace(/#a78bfa/gi, 'var(--gold)');
html = html.replace(/#22c7b1/gi, 'var(--mint)');
html = html.replace(/rgba\(167,139,250/g, 'rgba(201,178,152');
html = html.replace(/rgba\(34,199,178/g, 'rgba(48,176,199');

const newHead = `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mapa de Skills • Lendár[IA] · Cohort de Marketing</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iconoir@7.11.0/css/iconoir.css">
  <link rel="stylesheet" href="assets/al/hub-brand.css">
  <link rel="stylesheet" href="assets/al/mapa-skills.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script src="mapa-skills-artifacts.js"></script>
</head>
`;

html = html.replace(/<!DOCTYPE html>[\s\S]*?<\/head>\s*/i, newHead);

const newBodyStart = `<body>

  <header class="hub-header">
    <div class="hub-header__inner">
      <div class="hub-brand">
        <div class="hub-lockup">
          <img class="hub-lockup__mark" src="assets/al/logo/silhueta-al.svg" alt="Academia Lendária" width="42" height="42">
          <div>
            <div class="hub-lockup__wordmark">Lendár<em>[IA]</em></div>
            <div class="hub-lockup__subtitle">Mapa de Skills · Cohort de Marketing</div>
          </div>
        </div>
        <div class="hub-status-pill">
          <span class="hub-status-pill__dot"></span>
          <span>25 skills · exemplos em todas · N12</span>
        </div>
      </div>

      <div class="hub-toolbar">
        <div class="hub-segment">
          <button type="button" onclick="setViewMode('flow')" id="view-flow" class="hub-segment__btn view-btn view-active">
            <i class="iconoir-network-right"></i>
            <span class="label-sm">Fluxo</span>
          </button>
          <button type="button" onclick="setViewMode('grid')" id="view-grid" class="hub-segment__btn view-btn">
            <i class="iconoir-view-grid"></i>
            <span class="label-sm">Grid</span>
          </button>
          <button type="button" onclick="setViewMode('mermaid')" id="view-mermaid" class="hub-segment__btn view-btn">
            <i class="iconoir-network"></i>
            <span class="label-sm">Mermaid</span>
          </button>
        </div>
        <button type="button" onclick="resetFilters()" class="hub-btn">
          <i class="iconoir-undo"></i>
          <span class="label-sm">Reset</span>
        </button>
      </div>
    </div>
  </header>

  <main class="hub-shell">
`;

html = html.replace(/<body[^>]*>[\s\S]*?<div class="max-w-\[1500px\] mx-auto px-6 pt-6">\s*/i, newBodyStart);

// Controls row
html = html.replace(
  /<!-- Controls -->[\s\S]*?<!-- FLOW CANVAS/,
  `    <div class="hub-filters">
      <div class="hub-search">
        <input id="search-input" onkeyup="filterNodes()" type="search"
               placeholder="Buscar skill, artefato ou fase..."
               class="hub-search__input" autocomplete="off">
        <i class="iconoir-search hub-search__icon"></i>
      </div>

      <div class="hub-chip-group">
        <span class="hub-chip-group__label">Camadas:</span>
        <label class="hub-chip">
          <input type="checkbox" id="toggle-connections" checked onchange="applyFilters()">
          <span>Conexões</span>
        </label>
        <label class="hub-chip">
          <input type="checkbox" id="toggle-guards" checked onchange="applyFilters()">
          <span>Guards</span>
        </label>
        <label class="hub-chip">
          <input type="checkbox" id="toggle-hubs" checked onchange="applyFilters()">
          <span>Hubs</span>
        </label>
      </div>

      <button type="button" onclick="showLegend()" class="hub-link-btn">
        <i class="iconoir-info-circle"></i> Legenda
      </button>
    </div>

    <!-- FLOW CANVAS`
);

// Tour bar
html = html.replace(
  /<div id="tour-bar">[\s\S]*?<\/div>\s*<div id="flow-viewport">/,
  `<div id="tour-bar">
        <button type="button" onclick="toggleTour()" id="tour-btn" class="hub-btn hub-btn--ghost">
          <i class="iconoir-play" id="tour-icon"></i>
          <span id="tour-label">Tour N12</span>
        </button>
        <button type="button" onclick="tourPrev()" class="hub-btn hub-btn--ghost" title="Anterior">
          <i class="iconoir-nav-arrow-left"></i>
        </button>
        <button type="button" onclick="tourNext()" class="hub-btn hub-btn--ghost" title="Próximo">
          <i class="iconoir-nav-arrow-right"></i>
        </button>
        <div class="flex-1 min-w-0">
          <div id="tour-progress">Percorra a sequência canônica N12 nó a nó</div>
        </div>
        <div id="tour-step">—</div>
      </div>
      <div id="flow-viewport">`
);

// Mermaid container
html = html.replace(
  /<div id="mermaid-container" class="hidden[^"]*">/,
  `<div id="mermaid-container" class="hidden">`
);

// Detail panel
html = html.replace(
  /<div id="detail-panel" class="hidden[^"]*">[\s\S]*?<\/div>\s*<\/div>\s*\n\n    <!-- Artifact/,
  `<div id="detail-panel" class="hub-panel hidden">
      <div class="hub-panel__head">
        <div class="flex items-center gap-x-3 min-w-0">
          <div id="detail-icon" class="hub-panel__icon"></div>
          <div class="min-w-0">
            <div id="detail-name" class="truncate" style="font-weight:650;font-size:18px"></div>
            <div id="detail-phase" class="muted" style="font-size:12px"></div>
          </div>
        </div>
        <button type="button" onclick="closeDetail()" class="hub-icon-btn" aria-label="Fechar">
          <i class="iconoir-xmark"></i>
        </button>
      </div>
      <div class="hub-panel__body" id="detail-content"></div>
      <div class="hub-panel__foot">
        <div class="hub-panel__actions">
          <button type="button" onclick="highlightInMap()" class="hub-btn hub-btn--primary">
            <i class="iconoir-target"></i> Destacar
          </button>
          <button type="button" onclick="copySkillCommand()" class="hub-btn">
            <i class="iconoir-copy"></i> /comando
          </button>
        </div>
      </div>
    </div>

    <!-- Artifact`
);

// Artifact modal
html = html.replace(
  /<div id="artifact-modal" class="hidden[^"]*">[\s\S]*?<\/div>\s*<\/div>\s*\n\n    <!-- Stats/,
  `<div id="artifact-modal" class="hub-modal-backdrop hidden">
      <div class="hub-modal">
        <div class="hub-modal__head">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span id="am-label" class="font-mono truncate" style="font-weight:650"></span>
              <span id="am-badge" class="hub-badge">exemplo ilustrativo</span>
            </div>
            <div id="am-path" class="muted font-mono truncate" style="font-size:12px;margin-top:4px"></div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="copyArtifactPath()" class="hub-btn hub-btn--ghost">
              <i class="iconoir-copy"></i> Caminho
            </button>
            <button type="button" onclick="closeArtifactModal()" class="hub-icon-btn" aria-label="Fechar">
              <i class="iconoir-xmark"></i>
            </button>
          </div>
        </div>
        <div class="hub-modal__tabs" id="am-tabs"></div>
        <div class="hub-modal__body" id="am-body">
          <div id="am-preview-md" class="md-preview hidden"></div>
          <iframe id="am-preview-html" class="hidden preview-frame preview-frame--md" title="Preview HTML"></iframe>
          <div id="am-preview-pdf-wrap" class="hidden">
            <div id="am-pdf-banner" class="pdf-banner"></div>
            <canvas id="am-preview-pdf-canvas" class="hidden preview-frame" style="max-width:100%"></canvas>
            <iframe id="am-preview-pdf" class="preview-frame preview-frame--tall hidden" title="PDF fallback"></iframe>
            <div id="am-preview-pdf-fallback" class="hidden"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats`
);

// Stats grid
html = html.replace(
  /<!-- Stats -->[\s\S]*?<div class="h-10"><\/div>\s*<\/div>/,
  `<!-- Stats -->
    <div class="hub-stat-grid">
      <div class="hub-stat">
        <div class="hub-stat__label">Skills totais</div>
        <div class="hub-stat__value">25</div>
      </div>
      <div class="hub-stat">
        <div class="hub-stat__label">Ordem canônica</div>
        <div class="hub-stat__value">N12</div>
      </div>
      <div class="hub-stat">
        <div class="hub-stat__label">Entrega padrão</div>
        <div class="hub-stat__value hub-stat__value--sm">.md + .html + .pdf</div>
      </div>
      <div class="hub-stat">
        <div class="hub-stat__label">Fonte da verdade</div>
        <div class="hub-stat__value hub-stat__value--sm">/status-funil + funil.md</div>
      </div>
    </div>
  </main>`
);

// JS patches
html = html.replace(
  /if \(icon\) icon\.className = tourState\.active \? '[^']+' : '[^']+';/,
  `if (icon) icon.className = tourState.active ? 'iconoir-pause' : 'iconoir-play';`
);

html = html.replace(
  /function renderSkillChip\(label, variant\) \{[\s\S]*?\n\}/,
  `function renderSkillChip(label, variant) {
  const targetId = resolveSkillRef(label);
  const base = 'skill-chip';
  if (!targetId) {
    return \`<span class="\${base} skill-chip-static">\${label}</span>\`;
  }
  const variantClass = variant === 'prereq' ? 'skill-chip--prereq' : 'skill-chip--feed';
  return \`<span onclick="navigateToSkill('\${targetId}')" class="\${base} \${variantClass}" title="Ir para \${targetId}">
    <i class="iconoir-arrow-right" style="font-size:9px;opacity:0.6"></i>\${label}
  </span>\`;
}`
);

html = html.replace(
  /function getFormatIcon\(format\) \{[\s\S]*?\n\}/,
  `function getFormatIcon(format) {
  const m = { md:'iconoir-page', html:'iconoir-code', pdf:'iconoir-page', docx:'iconoir-page', folder:'iconoir-folder' };
  return m[format] || 'iconoir-page';
}`
);

html = html.replace(
  /function getIconForSkill\(skill\) \{[\s\S]*?\n\}/,
  `function getIconForSkill(skill) {
  const map = {
    utility:'iconoir-settings', research:'iconoir-search', strategy:'iconoir-bright-star',
    foundation:'iconoir-layers', funnel:'iconoir-funnel', acquisition:'iconoir-target',
    communication:'iconoir-mail', backend:'iconoir-settings', optimization:'iconoir-stats-up-square',
    support:'iconoir-media-image'
  };
  return map[skill.type] || 'iconoir-star';
}`
);

html = html.replace(
  /iconEl\.innerHTML = `<i class="[^"]+ fa-\$\{getIconForSkill\(skill\)\}"><\/i>`;/,
  `iconEl.innerHTML = \`<i class="\${getIconForSkill(skill)}"></i>\`;`
);

html = html.replace(
  /let content = `<div><div class="section-title mb-1 text-zinc-400">Descrição<\/div><p class="leading-snug">\$\{skill\.description\}<\/p><\/div>`;/,
  `let content = \`<div><div class="section-title">Descrição</div><p style="line-height:1.45;margin-top:4px">\${skill.description}</p></div>\`;`
);

html = html.replace(
  /content \+= `<div><div class="section-title mb-1 text-teal-300"><i class="[^"]+"><\/i> Pré-requisitos <span class="text-zinc-500 font-normal normal-case">\(clique para ir\)<\/span><\/div><div class="flex flex-wrap gap-1\.5">\$\{skill\.prerequisites\.map\(p => renderSkillChip\(p, 'prereq'\)\)\.join\(''\)\}<\/div><\/div>`;/,
  `content += \`<div><div class="section-title section-title--mint"><i class="iconoir-link"></i> Pré-requisitos <span class="muted" style="text-transform:none;font-weight:400">(clique para ir)</span></div><div class="chip-row" style="margin-top:6px">\${skill.prerequisites.map(p => renderSkillChip(p, 'prereq')).join('')}</div></div>\`;`
);

html = html.replace(
  /content \+= `<div><div class="section-title mb-2 text-emerald-300"><i class="[^"]+"><\/i> Artefatos gerados <span class="text-zinc-500 font-normal normal-case">\(clique para ver\)<\/span><\/div><div class="space-y-1\.5">`;/,
  `content += \`<div><div class="section-title section-title--green"><i class="iconoir-folder"></i> Artefatos gerados <span class="muted" style="text-transform:none;font-weight:400">(clique para ver)</span></div><div class="artifact-list" style="margin-top:8px">\`;`
);

html = html.replace(
  /content \+= `<button onclick="openArtifactById\('\$\{art\.id\}'\)" class="artifact-btn flex items-center gap-2\.5 px-3 py-2 rounded-xl \$\{hasPreview \? '' : 'opacity-70'\}">\s*<i class="fa-solid \$\{icon\} ab-icon text-sm w-4"><\/i>\s*<div class="flex-1 min-w-0">\s*<div class="font-mono truncate">\$\{art\.label\}<\/div>\s*<div class="text-\[10px\] text-zinc-500 truncate">\$\{art\.path\}<\/div>\s*<\/div>\s*<i class="fa-solid fa-\$\{hasPreview \? 'eye' : 'arrow-up-right-from-square'\} text-\[10px\] text-zinc-600"><\/i>\s*<\/button>`;/,
  `content += \`<button type="button" onclick="openArtifactById('\${art.id}')" class="artifact-btn\${hasPreview ? '' : '" style="opacity:0.7'}">
        <i class="\${icon} ab-icon"></i>
        <div class="flex-1 min-w-0">
          <div class="font-mono truncate">\${art.label}</div>
          <div class="muted truncate" style="font-size:10px">\${art.path}</div>
        </div>
        <i class="\${hasPreview ? 'iconoir-eye' : 'iconoir-open-new-window'}" style="font-size:10px;opacity:0.5"></i>
      </button>\`;`
);

html = html.replace(
  /content \+= `<div><div class="section-title mb-1 text-emerald-300">Artefatos gerados<\/div><div class="space-y-1">\$\{skill\.outputs\.map\(o => `<div class="text-xs font-mono px-3 py-1\.5 bg-zinc-900 border border-zinc-800 rounded-xl">\$\{o\}<\/div>`\)\.join\(''\)\}<\/div><\/div>`;/,
  `content += \`<div><div class="section-title section-title--green">Artefatos gerados</div><div class="artifact-list" style="margin-top:6px">\${skill.outputs.map(o => \`<div class="output-line">\${o}</div>\`).join('')}</div></div>\`;`
);

html = html.replace(
  /content \+= `<div><div class="section-title mb-1 text-violet-300"><i class="[^"]+"><\/i> Alimenta <span class="text-zinc-500 font-normal normal-case">\(clique para ir\)<\/span><\/div><div class="flex flex-wrap gap-1\.5">\$\{skill\.feeds\.map\(f => renderSkillChip\(f, 'feed'\)\)\.join\(''\)\}<\/div><\/div>`;/,
  `content += \`<div><div class="section-title section-title--gold"><i class="iconoir-share-android"></i> Alimenta <span class="muted" style="text-transform:none;font-weight:400">(clique para ir)</span></div><div class="chip-row" style="margin-top:6px">\${skill.feeds.map(f => renderSkillChip(f, 'feed')).join('')}</div></div>\`;`
);

html = html.replace(
  /content \+= `<div class="p-3 bg-amber-950\/30 border border-amber-900\/50 rounded-2xl"><div class="section-title text-amber-400 mb-1"><i class="[^"]+"><\/i> Guards<\/div><p class="text-xs text-amber-200">\$\{skill\.guards\}<\/p><\/div>`;/,
  `content += \`<div class="guards-box"><div class="section-title"><i class="iconoir-shield"></i> Guards</div><p>\${skill.guards}</p></div>\`;`
);

html = html.replace(
  /content \+= `<div class="text-\[10px\] text-zinc-500 pt-2 border-t border-zinc-800">Ordem N12: <span class="font-mono">\$\{skill\.order\}<\/span> · Tipo: \$\{skill\.type\}<\/div>`;/,
  `content += \`<div class="detail-meta">Ordem N12: <span class="font-mono">\${skill.order}</span> · Tipo: \${skill.type}</div>\`;`
);

html = html.replace(
  /panel\.classList\.remove\('hidden'\);\s*panel\.classList\.add\('flex'\);/,
  `panel.classList.remove('hidden');`
);

html = html.replace(
  /document\.getElementById\('detail-panel'\)\.classList\.remove\('flex'\);\s*document\.getElementById\('detail-panel'\)\.classList\.add\('hidden'\);/,
  `document.getElementById('detail-panel').classList.add('hidden');`
);

html = html.replace(
  /function showLegend\(\) \{[\s\S]*?document\.body\.appendChild\(legend\);\s*\}/,
  `function showLegend() {
  const legend = document.createElement('div');
  legend.className = 'legend-backdrop';
  legend.innerHTML = \`<div class="legend-card">
    <div class="flex justify-between items-center">
      <h3>Legenda</h3>
      <button type="button" class="hub-icon-btn" onclick="this.closest('.legend-backdrop').remove()" aria-label="Fechar">×</button>
    </div>
    <div class="legend-card__body">
      <div><strong class="gold">Fluxo</strong> — Canvas estilo n8n. Ao clicar num nó, conexões animam e nós vizinhos destacam.</div>
      <div><strong class="mint">Verde-água</strong> = entradas (upstream) · <strong class="gold">Ouro</strong> = saídas (downstream)</div>
      <div><strong class="mint">Pré-requisitos</strong> — Clique para ir ao nó (como em Alimenta).</div>
      <div><strong class="amber">Tour N12</strong> — Percorre a sequência canônica automaticamente.</div>
      <div><strong class="gold">Minimap</strong> — Canto inferior direito; clique para saltar no canvas.</div>
      <div class="legend-card__foot">Teclas: / buscar · Esc fechar · setas no tour (anterior/próximo)</div>
    </div>
  </div>\`;
  document.body.appendChild(legend);
}`
);

html = html.replace(
  /let html = `<div class="flex items-center gap-x-3 mb-3"><div class="w-3 h-3 rounded-full" style="background:\$\{color\}"><\/div><div class="font-semibold text-lg">\$\{phaseName\}<\/div><\/div><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">`;/,
  `let html = \`<div class="cluster__head"><div class="cluster__dot" style="background:\${color}"></div><div class="cluster__title">\${phaseName}</div></div><div class="cluster__grid">\`;`
);

html = html.replace(
  /html \+= `<div onclick="selectSkill\('\$\{skill\.id\}', this\)" class="node skill-bubble rounded-2xl p-3\.5 border border-zinc-800" data-id="\$\{skill\.id\}" data-name="\$\{skill\.name\}">\s*<div class="font-semibold text-sm">\$\{skill\.name\}<\/div>\s*<div class="text-xs text-zinc-400 mt-1 line-clamp-2">\$\{skill\.description\}<\/div>\s*<\/div>`;/,
  `html += \`<div onclick="selectSkill('\${skill.id}', this)" class="node skill-bubble" data-id="\${skill.id}" data-name="\${skill.name}">
        <div style="font-weight:650;font-size:14px">\${skill.name}</div>
        <div class="cluster__card-desc">\${skill.description}</div>
      </div>\`;`
);

html = html.replace(
  /progress\.innerHTML = tourState\.active\s*\?\s*`<span class="text-amber-400">\$\{skill\.name\}<\/span> — \$\{skill\.phase\}`/,
  `progress.innerHTML = tourState.active
      ? \`<span class="amber">\${skill.name}</span> — \${skill.phase}\``
);

html = html.replace(/ctx\.strokeStyle = 'var\(--gold\)';/, `ctx.strokeStyle = '#C9B298';`);

writeFileSync(path, html);
console.log('mapa-skills.html migrated');