/** Templates HTML/PDF — Lendár[IA] (Academia Lendária DS) */

export const BRAND = {
  primary: '#C9B298',
  secondary: '#30B0C7',
  surface: '#0A0A0C',
  elevated: '#131316',
  border: '#292929',
  text: '#FAFAFA',
  muted: '#A3A3A3',
  warm: '#FF9500',
  inkOnGold: '#1E170F',
};

const FONT_BASE = '../../assets/al/fonts';

const FONTS = `
<style>
@font-face {
  font-family: "Inter";
  src: url("${FONT_BASE}/inter.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Source Serif 4";
  src: url("${FONT_BASE}/source-serif-4.woff2") format("woff2");
  font-weight: 200 900;
  font-display: swap;
}
@font-face {
  font-family: "Source Serif 4";
  src: url("${FONT_BASE}/source-serif-4-italic.woff2") format("woff2");
  font-style: italic;
  font-weight: 200 900;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("${FONT_BASE}/jetbrains-mono.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
</style>`;

const BASE_CSS = `
:root {
  --primary: ${BRAND.primary};
  --secondary: ${BRAND.secondary};
  --surface: ${BRAND.surface};
  --elevated: ${BRAND.elevated};
  --border: ${BRAND.border};
  --text: ${BRAND.text};
  --muted: ${BRAND.muted};
  --warm: ${BRAND.warm};
  --gold-soft: #c9b2981a;
  --gold-border: #c9b29840;
  --glow-gold: 0 0 15px rgba(201, 178, 152, 0.35);
  --font-ui: Inter, system-ui, sans-serif;
  --font-reading: "Source Serif 4", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: linear-gradient(180deg, #0A0A0C 0%, #0D0D0F 44%, #0A0A0C 100%);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 760px; margin: 0 auto; padding: 48px 32px 64px; }
.wrap-wide { max-width: 960px; margin: 0 auto; padding: 48px 32px 64px; }
.kicker {
  display: inline-block;
  font: 600 0.68rem/1 var(--font-ui);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  border: 1px solid var(--gold-border);
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
  background: var(--gold-soft);
}
h1, h2, h3 {
  font-family: var(--font-reading);
  line-height: 1.2;
  margin: 0 0 12px;
}
h1 { font-size: 2rem; color: var(--text); }
h2 { font-size: 1.25rem; color: var(--primary); margin-top: 32px; }
h3 { font-size: 1.05rem; color: var(--secondary); margin-top: 24px; }
p { margin: 0 0 14px; color: var(--text); }
.lead { font-size: 1.1rem; color: var(--muted); margin-bottom: 24px; font-family: var(--font-reading); }
.card {
  background: var(--elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  margin: 14px 0;
  box-shadow: inset 0 0 0 1px #ffffff08;
}
.card-accent { border-color: var(--gold-border); }
blockquote {
  margin: 18px 0;
  padding: 14px 18px;
  border-left: 3px solid var(--primary);
  background: var(--elevated);
  border-radius: 0 12px 12px 0;
  color: #DCCBB6;
  font-style: italic;
  font-family: var(--font-reading);
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  font-size: 0.9rem;
}
th, td {
  border: 1px solid var(--border);
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--elevated);
  color: var(--primary);
  font-weight: 600;
}
tr:nth-child(even) td { background: color-mix(in srgb, var(--elevated) 80%, transparent); }
ul, ol { margin: 0 0 16px; padding-left: 1.4rem; }
li { margin: 6px 0; }
li.check { list-style: none; position: relative; padding-left: 4px; }
li.check::before { content: '☐'; color: var(--primary); margin-right: 8px; }
code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--elevated);
  padding: 2px 6px;
  border-radius: 4px;
}
a { color: var(--secondary); }
.btn {
  display: inline-block;
  background: var(--primary);
  color: ${BRAND.inkOnGold};
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font: 600 1rem/1 var(--font-ui);
  text-decoration: none;
  cursor: pointer;
  margin: 8px 0;
  box-shadow: var(--glow-gold);
}
.btn-block { display: block; text-align: center; width: 100%; }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
}
.price-old { color: var(--muted); text-decoration: line-through; margin-right: 8px; }
.price-now { color: var(--warm); font-size: 1.6rem; font-weight: 700; }
.badge-warm {
  display: inline-block;
  background: color-mix(in srgb, var(--warm) 18%, transparent);
  color: var(--warm);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.hero {
  padding: 40px 0 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.stack-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.stack-row:last-child { border-bottom: none; font-weight: 700; }
.email-shell { max-width: 560px; margin: 0 auto; background: var(--elevated); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
.email-head { background: var(--primary); color: ${BRAND.inkOnGold}; padding: 22px; text-align: center; font-weight: 700; }
.email-body { padding: 28px 32px 36px; }
.input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #0d0d12;
  color: var(--text);
  font-size: 1rem;
  margin: 8px 0 16px;
}
.vsl-slot {
  aspect-ratio: 16/9;
  background: linear-gradient(145deg, #0d0d12, #1a1035);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 0.9rem;
  margin: 20px 0;
}
.foot {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.78rem;
}
@media print {
  @page { margin: 1.4cm; size: A4; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap, .wrap-wide { max-width: 100%; padding: 0; }
  .btn, .input { display: none; }
  h2 { break-after: avoid; }
  .card, table, blockquote { break-inside: avoid; }
}
@media (max-width: 640px) {
  .wrap, .wrap-wide { padding: 32px 20px 48px; }
  h1 { font-size: 1.6rem; }
  .grid-2 { grid-template-columns: 1fr; }
}
`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMd(text) {
  let t = esc(text);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

/** Markdown → HTML (tabelas, listas, headings, blockquotes) */
export function mdToHtml(md) {
  const lines = String(md).split('\n');
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      i++;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeLists();
      out.push('<hr style="border:none;border-top:1px solid var(--border);margin:28px 0">');
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      closeLists();
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quote.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote>${inlineMd(quote.join(' '))}</blockquote>`);
      continue;
    }

    const hm = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      closeLists();
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${inlineMd(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeLists();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        if (!/^\|[-:| ]+\|$/.test(row)) {
          rows.push(row.split('|').slice(1, -1).map((c) => c.trim()));
        }
        i++;
      }
      if (rows.length) {
        out.push('<table><thead><tr>');
        rows[0].forEach((c) => out.push(`<th>${inlineMd(c)}</th>`));
        out.push('</tr></thead><tbody>');
        rows.slice(1).forEach((r) => {
          out.push('<tr>');
          r.forEach((c) => out.push(`<td>${inlineMd(c)}</td>`));
          out.push('</tr>');
        });
        out.push('</tbody></table>');
      }
      continue;
    }

    const ulm = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulm) {
      if (!inUl) { closeLists(); out.push('<ul>'); inUl = true; }
      const isCheck = ulm[1].startsWith('[ ]') || ulm[1].startsWith('[x]');
      const content = ulm[1].replace(/^\[[ x]\]\s*/, '');
      out.push(`<li${isCheck ? ' class="check"' : ''}>${inlineMd(content)}</li>`);
      i++;
      continue;
    }

    const olm = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olm) {
      if (!inOl) { closeLists(); out.push('<ol>'); inOl = true; }
      out.push(`<li>${inlineMd(olm[1])}</li>`);
      i++;
      continue;
    }

    closeLists();
    out.push(`<p>${inlineMd(trimmed)}</p>`);
    i++;
  }
  closeLists();
  return out.join('\n');
}

function pageShell({ title, body, wide = false }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
${FONTS}
<style>${BASE_CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
}

/** Documento longo (relatórios, offerbook, funil) — MD renderizado */
export function documentHtml(title, kicker, md, { accent, wide = false } = {}) {
  const accentColor = accent || BRAND.primary;
  const content = mdToHtml(md);
  const body = `
<div class="${wide ? 'wrap-wide' : 'wrap'}">
  <header class="hero">
    <span class="kicker" style="color:${accentColor};border-color:${accentColor}59">${esc(kicker)}</span>
    <p class="lead">Lendár<em style="font-style:italic;color:var(--primary)">[IA]</em> · Academia Fit (exemplo do cohort)</p>
  </header>
  <main>${content}</main>
  <p class="foot">Academia Lendária · Cohort de Marketing · Gerado para mapa de skills</p>
</div>`;
  return pageShell({ title, body });
}

/** Página de funil (vendas, quiz, vsl, upsell) */
export function landingHtml(title, sections) {
  const body = `<div class="wrap-wide">${sections}</div>`;
  return pageShell({ title, body, wide: true });
}

export function emailHtml(subject, inner) {
  const body = `
<div style="background:var(--surface);padding:32px 16px;min-height:100vh">
  <div class="email-shell">
    <div class="email-head">Lendár[IA]</div>
    <div class="email-body">
      <h1 style="font-size:1.35rem;margin-bottom:16px">${esc(subject)}</h1>
      ${inner}
    </div>
  </div>
</div>`;
  return pageShell({ title: subject, body });
}

/** Compat — substitui simpleHtml legado */
export function simpleHtml(title, bodyOrMd) {
  const isMd = typeof bodyOrMd === 'string' && bodyOrMd.includes('\n#');
  const inner = isMd ? mdToHtml(bodyOrMd) : bodyOrMd;
  return documentHtml(title, title, isMd ? bodyOrMd : `# ${title}\n\n${bodyOrMd.replace(/<[^>]+>/g, ' ')}`, {});
}

/** Compat — substitui brandHtml legado */
export function brandHtml(title, body) {
  return landingHtml(title, `<div class="wrap">${body}</div>`);
}

export function salesPageHtml({ headline, sub, bullets, priceOld, priceNow, faq }) {
  const bulletHtml = bullets.map((b) => `<li>${esc(b)}</li>`).join('');
  const faqHtml = faq.map((f) => `<div class="card"><strong>${esc(f.q)}</strong><p style="margin:8px 0 0;color:var(--muted)">${esc(f.a)}</p></div>`).join('');
  return landingHtml('Método Consistência 90', `
<section class="hero">
  <span class="kicker">Programa · Mulheres 35+</span>
  <h1>${esc(headline)}</h1>
  <p class="lead">${esc(sub)}</p>
</section>
<div class="vsl-slot">Assista ao vídeo de apresentação (VSL)</div>
<div class="card card-accent"><strong>Mecanismo único:</strong> Ciclo de 3 Fases — Desinflamar, Reprogramar, Manter</div>
<div class="card">
  <div class="stack-row"><span>Programa 90 dias</span><span>R$ 1.997</span></div>
  <div class="stack-row"><span>Comunidade + 3 bônus</span><span>R$ 938</span></div>
  <div class="stack-row"><span>Total ancorado</span><span style="text-decoration:line-through;color:var(--muted)">R$ ${priceOld}</span></div>
  <div class="stack-row"><span>Investimento hoje</span><span class="price-now">R$ ${priceNow}</span></div>
</div>
<ul>${bulletHtml}</ul>
<a class="btn btn-block" href="#">QUERO COMEÇAR AGORA</a>
<h2>FAQ</h2>
${faqHtml}
<a class="btn btn-block" href="#">QUERO COMEÇAR AGORA</a>
<p class="foot">Garantia 30 dias · Turma limitada jul/2026</p>
`);
}

export function quizPageHtml(quizJs) {
  return landingHtml('Quiz — Perfil de emagrecimento', `
<div class="wrap" style="padding:0">
  <span class="kicker">Diagnóstico gratuito</span>
  <h1>Qual seu perfil de emagrecimento?</h1>
  <p class="lead">5 perguntas · resultado personalizado</p>
  <div class="card" id="q1"><strong>1/5</strong> Quantas dietas você já tentou?<br><br>
  <label><input type="radio" name="q1" onclick="sel(1,'e')"> Nenhuma</label><br>
  <label><input type="radio" name="q1" onclick="sel(1,'r')"> 1 a 3</label><br>
  <label><input type="radio" name="q1" onclick="sel(1,'p')"> Mais de 3</label></div>
  <div class="card" id="q2"><strong>2/5</strong> O que mais te frustra?<br><br>
  <label><input type="radio" onclick="sel(2,'e')"> Efeito sanfona</label><br>
  <label><input type="radio" onclick="sel(2,'r')"> Falta de método claro</label><br>
  <label><input type="radio" onclick="sel(2,'p')"> Falta de tempo</label></div>
  <div class="card" id="q3"><strong>3/5</strong> Tempo por dia?<br><br>
  <label><input type="radio" onclick="sel(3,'p')"> 10–15 min</label><br>
  <label><input type="radio" onclick="sel(3,'r')"> 30 min</label><br>
  <label><input type="radio" onclick="sel(3,'e')"> 1h+</label></div>
  <div class="card" id="q4"><strong>4/5</strong> Já teve efeito sanfona?<br><br>
  <label><input type="radio" onclick="sel(4,'e')"> Sim, várias vezes</label><br>
  <label><input type="radio" onclick="sel(4,'r')"> Uma vez</label><br>
  <label><input type="radio" onclick="sel(4,'p')"> Não</label></div>
  <div class="card" id="q5"><strong>5/5</strong> O que te motiva mais?<br><br>
  <label><input type="radio" onclick="sel(5,'e')"> Autoestima</label><br>
  <label><input type="radio" onclick="sel(5,'r')"> Saúde e exames</label><br>
  <label><input type="radio" onclick="sel(5,'p')"> Praticidade</label></div>
  <button class="btn btn-block" onclick="finish()">VER MEU RESULTADO</button>
  <script>${quizJs}</script>
</div>`);
}

export function previewHtml() {
  return landingHtml('Preview — Lendár[IA]', `
<div class="wrap">
  <span class="kicker">Design System</span>
  <h1>Lendár<em style="font-style:italic;color:var(--primary)">[IA]</em></h1>
  <p class="lead">Livraria de luxo à noite · ouro como sinal escasso</p>
  <div class="grid-2">
    <div class="card"><p style="color:var(--muted);margin:0 0 8px">Primary (ouro)</p><span class="badge-warm" style="background:var(--gold-soft);color:var(--primary)">#C9B298</span></div>
    <div class="card"><p style="color:var(--muted);margin:0 0 8px">Secondary (água)</p><span class="badge-warm" style="background:color-mix(in srgb,var(--secondary) 20%,transparent);color:var(--secondary)">#30B0C7</span></div>
  </div>
  <button class="btn">CTA primário</button>
  <button class="btn btn-ghost">CTA secundário</button>
  <div class="card"><strong>Source Serif 4</strong> títulos · <strong>Inter</strong> UI</div>
</div>`);
}