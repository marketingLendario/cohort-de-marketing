# Handoff — Cohort Mapa de Skills · Brand Lendár[IA] → Ads Studio DS v2

```yaml
artifact:
  id: "2026-07-08-cohort-mapa-skills-ads-studio-handoff"
  template: handoff-template-lite v3.2 (extended)
  status: approved
  ttl: P30D
  created: "2026-07-08"
```

**From:** Agent:Grok-session-2026-07-08
**To:** Agent:next-session
**Date:** 2026-07-08
**Type:** session
**Scope:** self_continuation
**Priority:** P2
**Parent Handoff:** null
**Consumed:** null

---

## CRITICAL CONTEXT

O repositório **`cohort-de-marketing`** (repo separado do Sinkra Hub) hospeda o hub do aluno do Cohort de Marketing — principalmente `mapa-skills.html` (25 skills, tour N12, previews de amostras). Identidade **Lendár[IA]** em ondas 1–2 (brand + Ads Studio DS v2 flat). **Onda 3 (P3):** `guia-aluno.css`, tema Mermaid AL, remoção de fontes legado. Branch sincronizada com `origin` após push do operador.

---

## REPOSITÓRIO E BRANCH (LER PRIMEIRO)

| Campo | Valor |
|-------|-------|
| **Repo de trabalho** | `/Users/rafaelcosta/Projects/cohort-de-marketing` |
| **Branch** | `feat/mapa-skills-preview-validation` |
| **Commits desta sessão** | `c5bfd60` (onda 1 brand) · `f9e6508` (onda 2 DS flat) |
| **Commit anterior** | `1a40288` (fix Playwright preview validation) |
| **Working tree** | Limpo exceto `?? .codegraph/` (ignorar) |
| **Repo de referência DS** | `/Users/rafaelcosta/Projects/AIOX/sinkra-hub` (somente leitura) |

---

## O QUE FOI FEITO

### Onda 1 — Brand base (`c5bfd60`)
- Criado `assets/al/` com tokens, fontes (JetBrains local), logo, `hub-brand.css`, `mapa-skills.css`
- `mapa-skills.html`: removidos Tailwind CDN + Font Awesome; header Lendár[IA]; Iconoir
- `GUIA-DO-ALUNO.html` + `README.md`: link para mapa, `hub-brand.css`
- `scripts/lib/html-templates.mjs` + geradores academia-fit alinhados
- Amostras `mapa-skills-samples/academia-fit/` regeneradas e sincronizadas
- Validadores: `validate-mapa-wiring.mjs` + `validate-mapa-preview.mjs` passando

### Onda 2 — Ads Studio DS v2 editorial flat (`f9e6508`)
- **`assets/al/tokens.css`**: escala radius 2/4/6/8/12px, `--hairline`, sem `--glow-gold`
- **`hub-brand.css`**: Newsreader + Hanken (Google Fonts), controles 2px, segment flat, tabs por underline
- **`mapa-skills.css`**: flow nodes 4px flat, edges sem drop-shadow/glow, sem backdrop-blur
- **Guia + templates + banners**: removidos pills/glow/radius SaaS
- Amostras HTML regeneradas; PDFs parcialmente re-syncados

### Decisão fechada pelo operador
- **SOT visual definitivo:** Ads Studio DS (`sinkra-hub/docs/design/mocks/academia-lendaria-ads-studio/`), **não** approval-panel (que tinha radius 14px + glow)
- **Upstream/downstream no mapa:** ouro = downstream/ativo; verde-água (`--mint`) = upstream
- **Escopo brand:** mapa + guia + templates + amostras (tudo)

---

## ESTADO ATUAL vs DESEJADO

```
ATUAL (pós f9e6508)                    PRÓXIMO (P3 backlog)
─────────────────────                  ─────────────────────
✓ Tokens DS radius/hairline            □ Guia inline CSS → classes hub
✓ Hub/mapa flat, sem glow              □ Tema Mermaid AL
✓ Newsreader/Hanken via CDN           □ Vendorar Newsreader/Hanken woff2
✓ Validators OK                       □ Side-by-side formal vs ads-studio.dc.html
✓ Push remoto (operador)              □ Commit PDFs se sync terminou depois
✓ P3 guia CSS + Mermaid + fonts       ✓ Self-host Newsreader/Hanken (vendor-al-fonts)
```

---

## O QUE FALTA (priorizado)

- **[URGENT]** Push da branch para origin (só `@devops` / operador):
  ```bash
  cd /Users/rafaelcosta/Projects/cohort-de-marketing
  AIOX_ACTIVE_AGENT=devops git push origin feat/mapa-skills-preview-validation
  ```
- **[NEXT]** Revisão visual lado a lado:
  - Abrir `cohort-de-marketing/mapa-skills.html` (servidor HTTP)
  - Comparar com `sinkra-hub/docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`
  - Anotar gaps residuais (densidade do canvas ≠ painel operacional é esperado; radius/glow/hairline não)
- **[NEXT]** Confirmar PDFs pós-sync: se `bash sync-mapa-samples.sh` terminou após `f9e6508`, commitar PDFs alterados
- **[BACKLOG]** P3 — `GUIA-DO-ALUNO.html` ~150 linhas CSS inline (`.step`, `.skill-card` com `border-left` colorido)
- **[BACKLOG]** P3 — Tema Mermaid customizado para dark + hairline
- **[BACKLOG]** P3 — Self-host Newsreader/Hanken em `assets/al/fonts/` (offline/PDF)
- **[BACKLOG]** Limpar `assets/al/fonts/inter.woff2` e `source-serif-4*.woff2` (não usados pós onda 2)

---

## ARQUIVOS-CHAVE (ler ANTES de executar)

| Prioridade | Arquivo | Por quê |
|------------|---------|---------|
| P0 | `cohort-de-marketing/mapa-skills.html` | Hub principal |
| P0 | `cohort-de-marketing/assets/al/tokens.css` | SOT tokens do hub |
| P0 | `cohort-de-marketing/assets/al/hub-brand.css` | UI compartilhada |
| P0 | `cohort-de-marketing/assets/al/mapa-skills.css` | Canvas/flow |
| P1 | `cohort-de-marketing/GUIA-DO-ALUNO.html` | Guia aluno (CSS inline residual) |
| P1 | `cohort-de-marketing/scripts/lib/html-templates.mjs` | Templates amostras |
| P1 | `sinkra-hub/docs/design/mocks/academia-lendaria-ads-studio/_ds/.../readme.md` | SOT visual foundations |
| P1 | `sinkra-hub/docs/design/mocks/academia-lendaria-ads-studio/_ds/.../tokens/spacing.css` | SOT radius |
| P2 | `cohort-de-marketing/scripts/validate-mapa-wiring.mjs` | Gate wiring |
| P2 | `cohort-de-marketing/scripts/validate-mapa-preview.mjs` | Gate Playwright preview |

---

## COMANDOS DE RETOMADA (copiar/colar)

```bash
# 1. Ir ao repo certo
cd /Users/rafaelcosta/Projects/cohort-de-marketing
git checkout feat/mapa-skills-preview-validation
git log --oneline -3

# 2. Servidor local (obrigatório para mapa + PDF preview)
python3 -m http.server 8765
# Abrir: http://localhost:8765/mapa-skills.html

# 3. Validar antes de qualquer mudança
node scripts/validate-mapa-wiring.mjs
node scripts/validate-mapa-preview.mjs

# 4. Regenerar amostras (se mexer em templates)
node scripts/gerar-completo-academia-fit.mjs
bash sync-mapa-samples.sh   # ~3 min (PDFs)

# 5. Push (após review)
AIOX_ACTIVE_AGENT=devops git push origin feat/mapa-skills-preview-validation
```

---

## GLOSSÁRIO (mínimo para zero contexto)

| Termo | Significado |
|-------|-------------|
| **cohort-de-marketing** | Repo do material do aluno do Cohort de Marketing (separado do monorepo sinkra-hub) |
| **mapa-skills.html** | Hub interativo: 25 skills em fluxo/grid/mermaid + painel de detalhe + previews |
| **mapa-skills-samples/** | Amostras reais (academia-fit) linkadas no mapa para preview HTML/PDF |
| **Ads Studio DS v2** | Design System canônico AL: editorial flat, hairlines, radius 2/4/6px, sem glow |
| **approval-panel** | Mock antigo usado na onda 1 — **SUPERSEDED** como referência (tinha pills/glow) |
| **hairline** | Borda ouro @ 16% (`--hairline`) — assinatura visual do DS |
| **Regra dos 8%** | Ouro só como sinal (~8% da UI), não preenchimento em massa |
| **onda 1 / onda 2** | Brand cores (1) → forma DS flat (2) |
| **N12** | Tour guiado de 12 passos no mapa de skills |
| **Iconoir** | Biblioteca de ícones outline usada no hub |
| **validate-mapa-wiring** | CLI: checa links sampleUrl, coleta, artefatos |
| **validate-mapa-preview** | Playwright: canvas render + PDF preview screenshot |
| **sync-mapa-samples.sh** | Copia `projetos/academia-fit` → `mapa-skills-samples/` + regen PDFs |

---

## DECISÕES

| Decisão | Rationale |
|---------|-----------|
| SOT = Ads Studio DS, não approval-panel | Operador confirmou: painel Ads tem cantos retos; approval-panel divergia |
| Newsreader + Hanken via Google Fonts | Paridade com DS; JetBrains permanece local |
| Manter mint para upstream no mapa | Decisão de sessão anterior (ouro=downstream) |
| Dois commits separados (onda 1 + 2) | Facilita review e revert parcial |
| Não commitar `.codegraph/` | Artefato local de indexação, não do produto |

---

## BLOCKERS

1. **Push remoto** — agente não conseguiu `git push` (policy). Operador ou `@devops` deve executar.
2. **sync-mapa-samples.sh** — pode ter ficado em "Regenerando PDFs..." longo; HTML já syncado no commit `f9e6508`. Verificar `git status` por PDFs novos.

---

## CRITÉRIOS DE SUCESSO (próxima sessão)

- [ ] `git push` da branch `feat/mapa-skills-preview-validation` concluído
- [ ] `validate-mapa-wiring` + `validate-mapa-preview` = OK após qualquer mudança
- [ ] Revisão visual: segment control, busca, flow nodes com cantos ~2–4px, zero glow visível
- [ ] (Opcional P3) Guia sem radius legado (`0.75rem`, `9999px`) no CSS inline

---

## BOOTSTRAP (próxima IA — executar nesta ordem)

1. Ler este arquivo inteiro.
2. `cd /Users/rafaelcosta/Projects/cohort-de-marketing && git status && git log --oneline -3`
3. Confirmar commits `c5bfd60` e `f9e6508` presentes.
4. Rodar validadores (comandos acima).
5. Se operador pedir continuidade visual → atacar itens P3 do backlog.
6. Se operador pedir publicar → push via devops.

**Auto-verificação:**
- Repo correto? → `cohort-de-marketing`, não `sinkra-hub` para edits
- Branch? → `feat/mapa-skills-preview-validation`
- SOT radius? → 2px controles, 4px cards (`spacing.css` do Ads Studio)

---

## SUGGESTED SKILLS

- `/commit` — push via `@devops` após validação
- `impeccable` — se próxima sessão for polish visual fino do hub
- `design-md` — só se precisar re-extrair tokens de URL (não necessário agora; DS já vendorado)

---

```yaml
quality:
  score: "6"
  gate: PASS
  word_count: "~1450"
  template: lite-extended
```

**Artifact Status:** approved
**Next AI:** Push remoto → revisão visual P3 → commit PDFs se houver drift.