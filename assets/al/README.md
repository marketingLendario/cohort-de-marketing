# Lendár[IA] — assets do hub do cohort

Fontes, tokens e CSS compartilhados entre `mapa-skills.html`, `GUIA-DO-ALUNO.html` e os templates HTML em `scripts/lib/html-templates.mjs`.

SOT visual: **Ads Studio DS v2** (editorial flat, cantos quase retos, hairlines, sem glow).

- `fonts/` — JetBrains + Newsreader + Hanken (woff2 self-hosted). Baixar: `node scripts/vendor-al-fonts.mjs`
- `fonts-local.css` — `@font-face` das famílias AL (sem Google CDN no hub)
- `logo/silhueta-al.svg` — marca AL para lockup do header
- `tokens.css` — variáveis Noite + hairlines + escala de radius 2/4/6/8/12px
- `hub-brand.css` — tipografia, header, controles, painéis, modais
- `guia-aluno.css` — layout editorial do `GUIA-DO-ALUNO.html` (hairlines, sem barras laterais coloridas)
- `mapa-skills.css` — canvas de fluxo, tour N12, grid, previews, container Mermaid

Ícones: [Iconoir](https://iconoir.com/) via CDN no HTML do hub.