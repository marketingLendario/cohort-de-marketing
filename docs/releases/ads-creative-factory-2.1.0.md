# Ads Creative Factory 2.1.0

## Release

Atualizacao do motor agnostico que elimina a edicao manual de JSON na criacao
do Brand Pack. Publicada no `main` por `marketingLendario/cohort-de-marketing#5`
(`7376ee13256495a157da4f5ef88b349c068f8b9a`).

## Novidade

O builder CLI-first converte um `DESIGN.md` aprovado em Brand Pack v1, gera
preview e relatorio, preserva a fonte de provenance e valida o resultado com o
mesmo loader usado pelo runtime:

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/ads-creative-factory"
python3 "$SKILL_DIR/scripts/build_brand_pack.py" \
  --design "projetos/meu-projeto/DESIGN.md" \
  --output "projetos/meu-projeto/brand-pack" \
  --rights-notice "Declaro que tenho direito de usar estes ativos neste projeto." \
  --json
```

Um logo opcional pode ser informado com `--asset logo:/caminho/logo.png`.

## Direitos e seguranca

- a declaracao de direitos e obrigatoria;
- packs gerados nascem `redistributable: false`;
- source e ativos sao copiados com paths relativos e rights ids;
- symlinks, destino nao vazio e identidade insuficiente falham fechado;
- nenhum cliente, marca, pessoa ou pack default e inferido;
- nenhuma chave de API da OpenAI e necessaria.

## Verificacao

- manifesto publico: 39 arquivos allow-listed, 39 hashes verificados;
- catalogo: 31 skills, 41 edges, mirror canonico aprovado;
- builder gerou pack valido a partir do `DESIGN.md` de amostra do repositorio;
- doctor: `ready`, zero blockers;
- geracao e publicacao de anuncios continuam sujeitas a revisao humana.

