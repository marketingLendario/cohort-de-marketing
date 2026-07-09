# Lendár[IA] Design System

The design system of **Academia Lendár[IA]** — a Brazilian AI‑First education movement (EAD / *ensino a distância*). The product turns *consumo* (consumed content) into *execução* (things actually running in the student's business). Everything here is in **Brazilian Portuguese** and styled as an **editorial luxury bookstore lit at night** — Newsreader serif, gold as a rare signal, near‑flat surfaces, hairline rules.

> Régua de toda decisão: **isto converte consumo em execução?** Se não converte, corta. Mil nãos para cada sim.

---

## Sources

This system was ported from the production Academia Lendár[IA] codebase (read‑only, mounted as `Academia DS/`). Key source documents (paths relative to that codebase, kept here for the reader who has access):

- `styles.css` + `tokens/*.css` — the canonical token + component‑class layer (ported verbatim).
- `components/{core,brand,display,forms}/` — the React primitives (ported verbatim).
- `estrategia/voz-lendaria.html` — **FIVU**, the verbal‑identity framework (voice, archetypes, vocabulary, anti‑vocabulary). The single source of truth for copy.
- `estrategia/sobre-plataforma-lendaria.html` — platform vision and the five product pillars.
- `mentes/README.md` — the "Mentes Sintéticas" product spec.
- `assets/` — logo, favicon, founder photography.

No Figma file or live URL was provided. Fonts are Google Fonts (no local binaries) — no substitution was needed.

---

## The products

Academia Lendár[IA] is one platform with several surfaces. They share this design system and the dark "Noite" shell.

| Pillar | What it is | UI kit here |
|---|---|---|
| **Cursos** | The AI‑First LMS: courses, *trilhas* (guided tracks), *projetos* (PBL), lesson player, onboarding diagnostic. The flagship. | `ui_kits/cursos/` |
| **Livros** | The Biblioteca: curated book summaries, a markdown reader, reviews, collections. Editorial bookstore feel. | `ui_kits/livros/` |
| **Comunidade** | Feed, *Lendários* (members), Rank, Eventos, Mensagens, live rooms ("AO VIVO"). | `ui_kits/comunidade/` |
| **Mentes** | "Mentes Sintéticas": access to the *mental models* that legendary minds use. The model is the product; the mind is the provenance. *Conselho de Modelos*, Arena, Matriz. | covered in readme + components |
| **Admin** | Operator dashboards: Ensino, Comunidade, Biblioteca, Formulários, Dashboards. Dark sidebar shell. | reference only |

---

## CONTENT FUNDAMENTALS

The voice is codified in **FIVU** (`estrategia/voz-lendaria.html`). The rule: **the voice is constant; the tone is contextual.**

### Archetypes
- **O Mago** (primary) — alchemist of knowledge. Promises a *crossing*, not a tip. Turns the ordinary into the extraordinary.
- **O Rebelde** (secondary) — the call to the *inconformados*. Provokes systems and ideas (conformity, mediocrity, "the matrix"), **never the student**.
- **O Cuidador** (platform modifier) — active in the Tutor and on‑screen. Validates the journey before asking for action; never blames.

Mixing rule: the Mago gives the *para quê* (why), the Rebelde the *contra quê* (against what), the Cuidador the *como* (how). On stage: Mago + Rebelde. In the hallway / in the product: **Mago + Cuidador.**

### Voice calibration (4 dials, each holds steady; only context shifts within ±1)
- Funny ↔ Serious: **7** (serious, with surgical irony)
- Casual ↔ Formal: **3** (bar‑table conversation with gravitas)
- Irreverent ↔ Respectful: **4** (irreverent with ideas, reverent with the journey)
- Enthusiastic ↔ Factual: **4** (every high ends in a number or a demo)

### Person & casing
- **"Você"** throughout; warm and direct ("a trilha te esperou, ela trabalha no seu ritmo").
- Micro‑labels and data are **UPPERCASE, tracked** ("12 AULAS · 4 MÓDULOS", "AO VIVO", "MINHA CONTA").
- Titles are **serif, sentence case**, often with one *italic gold* word as the brand accent ("A plataforma *navegável*").

### The canon (typographic law)
- **No em‑dash.** Use a colon, a comma, or ` · `. The colon is the tool of revelation: *thesis: consequence.*
- **Max one exclamation per piece.**
- **Emoji only in pieces of "light"** (celebration, community warmth) — **never in a *cobrança*** (a nudge / accountability message).

### Vocabulary
- **Ours:** *obesidade intelectual · 8 ou 80 · ser antes de ter · Lendário / Medíocre · Equação Sagrada · lemniscata ∞ · AI First · segundo cérebro · vitória da semana · Construindo o infinito, hoje.*
- **Power words:** construir · destravar · rodando · entrega · prova · clareza · executar · forjar · transformar · legado · foco · congruência · ritmo · tribo.
- **Blacklist (never):** *última chance · só hoje · fórmula secreta · método infalível · renda passiva fácil · você está atrasado · parabéns por assistir · sinergia · videozinho.*

### Always / Never
- **Always:** validate the journey before asking for action; denominate achievement in *things running*, never in attendance; end with an executable next step; honor the declared time (2–4h/week is a valid answer).
- **Never:** fabricate urgency or scarcity; blame or shame; celebrate consumption (hours watched are a symptom, not success); em‑dash, confetti, emotional caps lock.

---

## VISUAL FOUNDATIONS

The direction is **"livraria de luxo à noite"** (luxury bookstore at night) + the dark signals of *Obsidiana*. Editorial, flat, quiet. Gold is a **signal, never decoration** — *A Regra dos 8%*.

### Color
- **Default theme is dark** ("Noite"): near‑black neutral `#0A0A0A` background, `#EDEDED` foreground, `#8C8C8C` muted. `.light` is a warm paper theme `#FBF8F3`.
- **One accent: gold `#C9B298`** ("ouro"). It appears in hairlines, in single *italic serif* words, in status dots, in active states — **never as a fill across large blocks.** The one filled‑gold object is the rare primary CTA.
- Semantic colors are muted, not neon: Vermelho Sinal `#E63946`, Pirita green `#7E9B5B`, forge amber, steel blue. They live as **outlined mono status chips** (LENDO / LIDO / RASCUNHO), not loud banners.

### Type
- **Newsreader** (serif) — display + reading. Weight **300** for heroes, **400** for headings; *italic* is the brand accent. Optical sizing on.
- **Hanken Grotesk** (sans) — all UI: buttons, nav, labels, body chrome.
- **JetBrains Mono** — data, metrics, status, durations ("64% · 12 MIN").
- Scale is a Minor Third (1.2×) off a 16px base. Buttons & micro‑labels are **caps, letter‑spacing 0.18–0.22em**.

### Surfaces, borders, radii
- **Cantos quase retos:** 2px on controls (buttons, inputs, chips), 4px on cards, 6–8px on panels/modals, **12px absolute max**.
- Cards = `var(--card)` fill + a **golden hairline** border (`--hairline`, gold at 16%). No heavy borders, no colored left‑accent stripes.
- Hierarchy comes from **hairlines + typography**, not from boxes.

### Shadows
- Almost everything is flat. **No glows, no shimmer, no texture.** Depth is a deep, rare black shadow only where something truly floats: book covers on hover (`--shadow-levitate`), modals (`--shadow-modal`).

### Backgrounds
- Solid `--background`. Decorative motifs are **oversized ghost glyphs** (`∞`, section numbers `01`) set in gold at 4–6% opacity, and a single faint radial gold glow behind heroes. No gradients‑as‑fill, no stock patterns.
- Imagery: warm, cinematic founder photography (`assets/founder/`). Book covers are the other image source.

### Motion
- Calm and ceremonial. Entrances only — **fade / fade‑up / scale‑in**, gated on `prefers-reduced-motion`. **Zero decorative loops.** Easing `--ease-out` `cubic-bezier(0,0,0.2,1)` and `--ease-smooth`; durations 150 / 240 / 400 / 600ms.
- Reveal‑on‑scroll uses blur+translate; the *end state is the base* so print/PDF/reduced‑motion always show content.

### States
- **Hover:** subtle — primary darkens to ~88% gold; outline gets a faint gold wash (`primary / 0.07`) + stronger hairline; ghost gets a 5% foreground wash; covers lift 6px.
- **Press:** color deepens (gold to ~80%); the milestone mark scales in. No bounce.
- **Focus:** a 2px ring offset from the surface (`box-shadow: 0 0 0 2px var(--background), 0 0 0 3px var(--ring)`).
- **Progress** is a 2px gold line, not a chunky bar.

### Transparency & blur
- Used sparingly: alpha‑composited gold for hairlines/washes (`hsl(var(--primary-hsl) / α)`), faint `foreground / 0.03–0.07` for inset stat tiles. Blur appears mainly in scroll‑reveal, not as a frosted‑glass motif.

---

## ICONOGRAPHY

- **Icon system: [Iconoir](https://iconoir.com) v7.11** — a thin, single‑weight, outline (line) set. Loaded from CDN: `https://cdn.jsdelivr.net/npm/iconoir@7.11.0/css/iconoir.css`. The `Icon` component wraps it (`<Icon name="book" />` → `<i class="iconoir-book">`).
- Stroke weight is light, matching the editorial line‑work. Icons are **monochrome**, inherit `currentColor`, and are used at `size-5`/`size-6` in chrome and `size-7` in showcases. Gold is reserved for the occasional signal icon (`color="var(--primary)"`).
- **Emoji:** only in "light" pieces (community celebration), per the voice canon — never in product chrome or nudges.
- **Unicode as ornament:** the lemniscata `∞` and section numerals are used as oversized ghost glyphs (decorative, `aria-hidden`), not as functional icons.
- **Logo:** `assets/logo-academialendaria.svg`. The wordmark is also typeset directly as **"Lendár[IA]"** — Newsreader, with `[IA]` in italic gold — wherever a lightweight lockup is needed (top nav, sidebars).

If a glyph is missing from Iconoir, substitute the nearest Iconoir name (keep the line style) rather than mixing icon sets.

---

## INDEX / manifest

Root:
- `styles.css` — global entry point (imports only). Consumers link this one file.
- `tokens/` — `fonts · colors · typography · spacing · effects · base · components · markdown`.
- `readme.md` — this guide.
- `SKILL.md` — Agent‑Skill front‑matter wrapper for use in Claude Code.

Components (`window.LendRIADesignSystem_e82f8e`):
- **core/** — `Button`, `Badge`, `Card` (+ `CardHeader/Title/Description/Content`), `Icon`.
- **brand/** — `BookCard`, `Milestone`, `SectionHeader`.
- **display/** — `Alert`, `Avatar`, `Progress`, `StatChip`, `Tabs`.
- **forms/** — `Input`, `Textarea`, `Label`, `Switch`, `Checkbox`.

UI kits (`ui_kits/<product>/index.html`):
- **cursos/** — LMS course cover + lesson player + catalog.
- **livros/** — Biblioteca overview + reader.
- **comunidade/** — community feed + live room.

Foundation specimen cards live next to the tokens and components (`guidelines/`, `components/**/*.card.html`) and populate the **Design System** tab. Tagged `@dsCard`.
