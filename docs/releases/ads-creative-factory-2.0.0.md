# Ads Creative Factory 2.0.0

## Release

Motor agnostico de criativos de performance, publicado como skill canonica em
`.claude/skills/ads-creative-factory/` e espelhado literalmente em
`.agents/skills/ads-creative-factory/`.

## Contrato

- exige brand pack v1 externo e explicito;
- persona pack e likeness sao opcionais e exigem autorizacao;
- usa o Codex CLI local autenticado, sem `OPENAI_API_KEY` ou `CODEX_API_KEY`;
- produz imagens, legendas e manifest para revisao humana;
- nao publica anuncios nem movimenta verba automaticamente.

## Licencas

- codigo: MIT;
- Instrument Serif, Inter Tight e JetBrains Mono: SIL OFL-1.1;
- packs, marcas, pessoas e ativos privados nao fazem parte desta release.

## Verificacao rapida

```bash
python3 .claude/skills/ads-creative-factory/scripts/doctor.py --json
python3 .claude/skills/ads-creative-factory/scripts/doctor.py \
  --json --pack-only --pack /caminho/para/brand-pack --type brand
```

`doctor --pack-only` falha fechado quando nenhum pack e informado. Consulte
`SKILL.md` para o contrato completo de campanha, formatos e outputs.
