# Lendár[IA] Design System — v2 "Editorial"

> "Unir e potencializar pessoas lendárias com IA para construírem soluções e negócios que imortalizam seu legado."

Design system for **Academia Lendária** (Lendár[IA] / Lendár[IA]OS — app.lendario.ai), a Brazilian AI-first education platform. The product is an internal "operating system" of studios surrounding a consumer learning experience:

- **Biblioteca** — AI-condensed book summaries, audiobooks, collections, reading streaks. The flagship consumer surface.
- **Academia / Área do Aluno (LMS)** — courses, tracks ("trilhas"), live sessions, certificates, gamification.
- **Comunidade** — feed, members, ranking, events.
- **Mentes Sintéticas** — cognitive clones of great thinkers.
- **Team studios** (admin-only): Criação & Conteúdo, Tráfego & Conversão, Vendas & Clientes, Equipe & Cultura, Operações, PRD Studio, Course Creator.

**v2 is an evolution, not a mirror of the production app.** Direction: **"livraria de luxo" editorial** (serif-led, hairlines douradas, papel escuro quente) com sinais de precisão herdados de um segundo estudo ("Obsidiana"): mono para dados/status e ouro como sinal de estado. The v1 mannerisms are dead by decree: **no shimmer sweeps, no gold glows/auras, no PNG textures, no generic rounded-card shadcn look, no `active:scale` press.**

Language: **pt-BR** throughout. Dark mode is the default experience.

---

## CONTENT FUNDAMENTALS

**Language & voice**
- All product copy is **Brazilian Portuguese**. English only in tech/branding flourishes ("Secured by Aurora").
- Voice is **aspirational, premium, imperative**: "Expanda sua Consciência.", "Continuar Leitura".
- Taglines short, declarative, almost mystical: "Sabedoria secular potencializada por IA."
- The brand name plays with `[IA]` brackets: **Lendár[IA]**, **Lendár[IA]OS**, **Curador[IA]**. The bracketed `[IA]` is always rendered in gold (`--primary`).

**Casing system (very deliberate)**
- **Micro-labels:** ALL CAPS, 10px, weight 700, tracking `0.22em` (`.al-label`). Hero eyebrows go to `0.34em` (`.al-eyebrow`).
- **Dados/status/métricas:** JetBrains Mono, 9–11px, tracking `0.12em`, caps (`.al-data`) — "64% · 12 MIN RESTANTES", "LENDO", "SEQ 12D".
- **Headings:** Newsreader serif 300/400, tight tracking, with one word set in *italic gold* as contrast: "Expanda sua *Consciência.*" (`<em>` inside `h1–h3` styles itself).
- **Buttons:** ALL caps tracked 0.18em — all of them. `link` variant is the exception: serif italic sentence.
- No emoji in product UI.

---

## VISUAL FOUNDATIONS

**Color**
- **Dark-first, neutral black ("Noite").** Page `hsl(0 0% 4%)` (#0A0A0A), cards `hsl(0 0% 7%)`, borders `hsl(0 0% 14%)`, texto `hsl(0 0% 93%)` e cinza `hsl(0 0% 55%)` — neutros 100%, **nunca tons de marrom**. O calor da marca vive exclusivamente no ouro. Light theme = warm paper (`.light`).
- **Gold `#C9B298` is THE brand color**, governed by the **Regra dos 8%**: it lives in (1) **hairlines** — `--hairline` (gold/16%) and `--hairline-strong` (gold/45%); (2) *italic accent words*; (3) **sinais de estado** (active nav rule, key metric, status chip "LENDO"); (4) the `[IA]` in wordmarks; (5) the one filled-gold CTA per screen.
- Status colors are Apple-ish: red `#FF453A`, green `#30D158`, amber `#FF9F0A`, blue `#0A84FF` — used as ink (mono chips, tinted alerts), never blocks.
- Static brand palette for studios unchanged (petróleo `#538096`, teal, indigo…).
- **No gradients** except book-cover fallback panels.

**Typography**
- **Newsreader** (serif) — display headings (300, line-height ~1.0), reading body, author lines, the signature italic accents. `--font-serif` / `--font-display`.
- **Hanken Grotesk** (sans) — UI, buttons, navigation, labels. `--font-sans`.
- **JetBrains Mono** — dados, métricas, status, código. `--font-mono`.
- Scale: Minor Third (1.2×) from 16px, up to `--font-size-6xl` (~57px) for serif heroes.

**Spacing & layout**
- 4px base unit. Generous padding (heroes `48px 40px`). Content max-widths 680/900/1200px.
- App shell: fixed left sidebar (256px, `bg-card`, hairline right border), content scrolls. Active nav item: gold text + `inset 2px 0 0 var(--primary)` rule + gold/6% bg.
- **Canonical topbar lockup (Jun 2026 shell unification):** the three product areas (Cursos · Livros · Comunidade) share one horizontal topbar anatomy, left→right: wordmark `Lendár[IA]` (mixed-case, `[IA]` gold) + **área-suffix** in mono caps after a hairline (`CURSOS` / `LIVROS` / `COMUNIDADE`) → área nav → cross-area links → search → actions. One nav layer per screen (Comunidade's old icon-rail was removed). The marketing `site/` is a separate register (logged-out), not part of this shell.
- **Global search:** `app-search.js` (root) — one `⌘K` command palette with a multi-area index, reached via each area's shared chrome (Cursos `CourseTopbar`, Comunidade `CmTopbar` `.cm-search`, Livros via `quick-search.js` → loads it; triggers: `.mast-search` / `.ct-search` / `[data-app-search]`). Replaced the old books-only quick search.
- Section headers: caps eyebrow + serif title + **hairline dourada fading right** + optional serif-italic action ("ver coleção →").

**Corner radii (flat editorial)**
- Controles (botões, inputs, chips) `2px` · cards/capas `4px` · painéis `6px` · modais `8px` · máximo absoluto `12px` · pills/avatares `full` (badges only).

**Borders, shadows**
- A hairline dourada de 1px é A textura da marca: `--hairline` para divisores/cards, `--hairline-strong` para outline buttons e foco.
- Shadows são raras: `--shadow-base` (capas em repouso), `--shadow-levitate` (capas em hover, −4 a −6px), `--shadow-modal` (modais). **No glows. Ever.**

**Backgrounds**
- Flat warm near-black. **No textures, no radial gold tints, no blurred auras.** Ambience comes from the warmth of the neutrals and the hairlines.
- Imagery = book covers and avatars only; fallback covers are dark gradient panels with serif titles.

**Motion**
- Calmo e cerimonial: 150–400ms ease-out. Entradas: `al-fade-in-up` (8px). Hover muda **cor** (borda/texto), não posição — exceto capas de livro, que levitam −4px com sombra funda.
- **No shimmer, no pulse loops, no scale on press.** Respects `prefers-reduced-motion`.

---

## ICONOGRAPHY

- **Iconoir** exclusively (CDN webfont `https://cdn.jsdelivr.net/npm/iconoir@7.11.0/css/iconoir.css`), via the bundled `Icon` component. Stroke icons, sized 12–36px. Same kebab-case names as the app: `book`, `play-circle`, `users`, `brain`, `search`, `settings`…
- No emoji. Logos: `assets/logo-academialendaria.svg` (gold laurel), `assets/favicon.png`. Wordmark in sans bold: `Lendár[IA]OS` with `[IA]` in gold.

---

## SUPERFÍCIES — DS vs Produto (a fronteira)

Este projeto é **design system _e_ produto no mesmo lugar**. A separação é por **contrato**, não por pasta: o compilador isola a superfície vinculável pelas tags (`@dsCard`, `<Name>.d.ts`+`.jsx` → namespace). Tudo sem tag é produto e **não entra no manifesto**. Três tiers, fronteira explícita:

| Tier | O que é | Onde vive | Outro produto vincularia? |
|---|---|---|---|
| **① DS — vinculável** | Tokens (`styles.css` + `tokens/*`), componentes no namespace (`components/**` com `.d.ts`+`.jsx`), specimens `@dsCard` | raiz + `components/` | **Sim.** É o que sai num binding `_ds/`. |
| **② App-shell — produto compartilhado** | Cascas reusadas entre telas mas **específicas do app Lendária**: `comunidade/chrome.jsx` (`CmTopbar`/`CmSpacesSidebar`), `cursos/CourseTopbar.jsx`, `notif-panel.jsx`, `TutorPanel`, `AuroraPanel`, `theme.js`, `app-nav.js`, `app-search.js` | dentro de cada área | **Não.** Reuso interno; ficam fora do namespace **por decisão**. |
| **③ Tela — entregável** | Componentes de uma página só (`Feed`, `OnboardingFlow`, `CourseDetail`, `ExplorarCursos`…) e o tooling starter (`tweaks-panel`, `ios-frame`, `image-slot`) | nas pastas de produto | **Não.** São consumidores do DS. |

**Regras de fronteira**
- Um primitivo só sobe pro tier ① (par `.d.ts`+`.jsx` + `@dsCard`) quando for **genérico** — reusável fora do app Lendária. Topbar/painel com wordmark/área-suffix é tier ②, não ①.
- Não dividir em dois projetos agora: no Claude Design um DS vinculado é **snapshot**, não link vivo — split mataria a iteração DS↔produto. **Gatilho para separar de fato:** o DS estabilizar **e** surgir um segundo produto independente que o consuma.
- Editar token/primitivo = mexe no tier ①, reflete em todo o produto na hora (mesmo projeto). Editar casca = tier ②, escopo da área. Editar uma página = tier ③.

## INDEX

| Path | What |
|---|---|
| `styles.css` | Global CSS entry (imports everything below) |
| `tokens/colors.css` | Semantic colors (warm dark default + `.light`), hairlines, brand palette |
| `tokens/typography.css` | Newsreader/Hanken Grotesk/JetBrains Mono, minor-third scale, trackings |
| `tokens/spacing.css` | 4px spacing scale, flat radii |
| `tokens/effects.css` | Rare shadows, calm motion tokens, entry keyframes |
| `tokens/fonts.css` | Google Fonts loading |
| `tokens/base.css` | Body defaults, `.al-label`, `.al-eyebrow`, `.al-data`, `.al-hairline`, serif headings |
| `tokens/components.css` | CSS recipes backing the React components |
| `guidelines/` | Foundation specimen cards (Design System tab) |
| `components/` | Core / forms / display / brand React primitives |
| `ui_kits/lendaria_app/` | Click-through app recreation (Login → Biblioteca → Player) in v2 |
| `explorations/` | The three-direction study that produced v2 (A·Editorial won) |
| `SKILL.md` | Agent-skill entry point |

**Components** (namespace: see `check_design_system`): `Button`, `Badge`, `Card` (+ header/title/description/content/footer), `Input`, `Textarea`, `Label`, `Switch`, `Checkbox`, `Tabs`, `Avatar`, `Progress`, `Alert`, `Icon`, `SectionHeader`, `StatChip`, `BookCard`.

**Component voice quick-reference**
- `Button`: caps tracked; `default`/`cta` = ouro preenchido (max 1/tela); `outline` = hairline dourada (assinatura); `link` = serif itálica; `destructive` = contornado.
- `Badge`: `brand` = pill hairline dourada; `success/warning/destructive/info` = chips mono com borda fina (estilo Obsidiana).
- `Card`: hairline, raio 4px, sem sombra; título serif, descrição serif itálica.
- `Tabs`: sublinhado editorial — caps tracked sobre hairline, ativo com régua dourada.
- `Progress`: linha de 2px, ouro sobre ouro/18%.
- `BookCard`: sem caixa — capa levita no hover (sombra, sem aura), título serif, autor itálico, status mono.
- `StatChip`: par label/valor em cápsula — mono caps + serif ("MEMBROS · 3.847"); `tone` colore o valor (`success` etc).

**Community page patterns** (`comunidade/`)
- Shared chrome: `comunidade/chrome.css` + `comunidade/chrome.jsx` (`window.CmTopbar`, `window.CmSpacesSidebar`) — every community page consumes the single canonical topbar (wordmark `Lendár[IA]` + área-suffix in mono caps, section nav, cross-links, NotifPanel) and, where a spaces panel is wanted, the shared `CmSpacesSidebar` (self-contained: owns its collapse/expand/active state; `active="<slug>"`). Used by Feed + Eventos. Never copy either inline. The left icon-rail was removed in the shell unification (Onda 1) because it duplicated the topbar's 5 destinations; `CmIconRail` is now a no-op kept for back-compat.
- Presence semantics: `.cm-live` (red, `--destructive`) = live broadcast; `.cm-online-dot` (green, `--success`) = member presence. Never mix.
- Hover underline from `tokens/base.css` is prose-only; community chrome suppresses it (opt back in with `.cm-underline-link`).
- Compact heroes: one band (eyebrow + serif 26px title + StatChips right), content above the fold; return hooks = live banner + "você parou aqui" divider.
- Empty states: centered icon at 20% foreground + serif italic one-liner (see Feed/Mensagens).

**Caveats:** fonts load from Google Fonts; icons load Iconoir from CDN.
