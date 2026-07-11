# Amostras do mapa de skills — academia-fit

Espelho de `projetos/academia-fit/` para previews reais no `mapa-skills.html`.

## Comandos

```bash
# 1. Criar/atualizar projeto canônico (fluxo cohort real)
bash scripts/run-nucleo-cohort.sh

# 2. Sincronizar para amostras + regenerar PDFs
bash sync-mapa-samples.sh

# 3. Validar (wiring + preview pdf.js canvas)
node scripts/lib/nucleo-from-coleta.test.mjs
node scripts/verify-skill-contracts.mjs
cd scripts && npm install && cd ..
node scripts/validate-mapa-wiring.mjs
node scripts/validate-mapa-preview.mjs

# 4. Abrir mapa (HTTP obrigatório para PDF em iframe)
python3 -m http.server 8765
# → http://127.0.0.1:8765/mapa-skills.html
```

## Checklist manual (`mapa-validacao.md` no scratch do goal)

- [ ] Tour N12 percorre 13 passos (núcleo com amostras reais) sem erro
- [ ] Pré-requisitos clicáveis navegam ao nó correto
- [ ] Alimenta clicável navega ao nó correto
- [ ] `avatar-funil` → `relatorio-avatar.pdf` abre PDF no modal
- [ ] `espiao-do-concorrente` → `dossie-fitflow.pdf` abre PDF
- [ ] `offerbook` → `offerbook.html` carrega conteúdo real
- [ ] `copy-funil` → `copy.md` renderiza markdown do arquivo real
- [ ] `quiz-funil` → `pagina/quiz.html` preview
- [ ] `recuperacao-funil` → `recuperacao.pdf` preview

## Skills sincronizadas (núcleo)

comecar · avatar · espiao · trend · swipe · offerbook · design-md · metodo-funil · copy-funil · quiz-funil · email-funil · recuperacao-funil · backend-funil

## Após rodar skills reais

Copie novos entregáveis de `projetos/academia-fit/` e rode `sync-mapa-samples.sh` de novo.