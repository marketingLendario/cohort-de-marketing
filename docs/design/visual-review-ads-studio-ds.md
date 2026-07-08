# Revisão visual — Hub cohort vs Ads Studio DS v2

**Data:** 2026-07-08  
**SOT:** `sinkra-hub/docs/design/mocks/academia-lendaria-ads-studio/ads-studio.dc.html`

## Checklist (forma, não densidade de produto)

| Critério | Hub cohort (pós P3) | Esperado DS |
|----------|----------------------|-------------|
| Radius controles | 2px (`--radius-sm`) | 2px |
| Radius cards | 4px (`--radius-base`) | 4px |
| Radius painéis | 6–8px (`--radius-lg` / `xl`) | 6–8px |
| Acento estrutural | `--hairline` / `--hairline-strong` | Gold @16% / @45% |
| Glow / blur decorativo | Removido | Ausente |
| Tipografia | Newsreader + Hanken | Igual |
| Pills 999px | Removidos (segment 2px) | Ausente |
| Barras laterais coloridas (guia) | Removidas (hairline full) | Editorial flat |
| Mermaid | `themeVariables` Noite + ouro | Dark + hairline edges |

## Gaps aceitáveis

- **Densidade:** o mapa é canvas de exploração (25 nós, tour); o Ads Studio é painel operacional — não exigir paridade de layout.
- **Fontes:** hub usa `fonts-local.css` + woff2 em `assets/al/fonts/` (rodar `vendor-al-fonts.mjs` no clone).

## Como reproduzir

```bash
cd cohort-de-marketing
python3 -m http.server 8765
# mapa: http://127.0.0.1:8765/mapa-skills.html
# guia: http://127.0.0.1:8765/GUIA-DO-ALUNO.html
```

Comparar lado a lado com `ads-studio.dc.html` no sinkra-hub (abrir via file:// ou servidor local).