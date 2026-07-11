# Dependências do mapa-skills.html

O `mapa-skills.html` foi copiado para `aula-03/materiais/` junto com suas dependências locais necessárias para abrir os previews relativos.

## Dependências locais incluídas

| Caminho | Função |
|---|---|
| `materiais/mapa-skills-artifacts.js` | catálogo de artefatos e URLs de amostras |
| `materiais/assets/al/` | CSS de marca, ícones e silhueta da Academia Lendária |
| `materiais/mapa-skills-samples/` | arquivos de exemplo consumidos por `sampleUrl` |
| `materiais/briefing.html` | tela ligada pelo botão de briefing |
| `materiais/data/project-brief.schema.json` | schema carregado pelo briefing |
| `materiais/data/skill-unlock-rules.json` | regras carregadas pelo briefing |

## Dependências externas

O mapa continua usando CDN para:

- Iconoir 7.11.0;
- Marked;
- PDF.js 3.11.174;
- Mermaid 10;
- Tailwind CSS;
- Font Awesome 6.5.1.

Isso significa que o pacote abre localmente com conexão à internet. Não foram vendorizadas bibliotecas de terceiros para evitar duplicação e problemas de licença.

## Validação

Os caminhos relativos foram preservados. O mapa deve ser aberto a partir de `aula-03/materiais/mapa-skills.html`, e não movido sozinho para outro diretório sem transportar o pacote local acima.
