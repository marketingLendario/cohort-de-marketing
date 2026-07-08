# Fontes self-hosted

| Família | Origem | Licença |
|---------|--------|---------|
| JetBrains Mono | JetBrains | SIL OFL 1.1 |
| Newsreader | Google Fonts / Fontsource | SIL OFL 1.1 |
| Hanken Grotesk | Google Fonts / Fontsource | SIL OFL 1.1 |

Arquivos `.woff2` em `assets/al/fonts/` podem ser regenerados com:

```bash
node scripts/vendor-al-fonts.mjs
```

Validação: `node scripts/validate-al-fonts.mjs`