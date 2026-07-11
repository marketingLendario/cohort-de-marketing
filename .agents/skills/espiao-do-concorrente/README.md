# Espião do Concorrente

Uma skill que vira analista de inteligência competitiva. Você dá o nome de um concorrente e ela varre toda a presença pública dele na internet e devolve um dossiê em português com os ganchos que ele usa, as ofertas e preços, os ângulos de copy, os formatos e, principalmente, as brechas: onde ele é fraco e o que ele não está dizendo.

Ela não olha só os anúncios. Varre quatro frentes:

- **Anúncios pagos:** Meta Ad Library (Facebook e Instagram), Google Ads Transparency Center e TikTok Ads Library.
- **Orgânico e social:** Instagram, YouTube (canal, vídeos, títulos), TikTok e LinkedIn.
- **Propriedades próprias:** site, landing pages, blog, página de oferta e preços.
- **Reputação:** busca no Google, reviews, Reclame Aqui e menções públicas.

Funciona de dois jeitos:
- **Com acesso à internet:** ela mesma vai atrás do material nas várias fontes e cruza tudo.
- **Sem internet:** você cola o que tiver (de qualquer fonte) e ela faz a mesma análise.

No dossiê, cada achado vem com a fonte de onde saiu.

---

## Instalar em 3 passos

### No Claude (claude.ai — planos Pro, Max ou Team)

1. Baixe o arquivo `espiao-do-concorrente.zip`.
2. No Claude, abra **Settings > Capabilities > Skills** e clique em **Upload skill**. Selecione o .zip.
3. Volte para uma conversa e escreva: **"espião, analisa o concorrente [nome ou @ dele]"**. Pronto.

### No Claude Code (terminal)

1. Descompacte a pasta `espiao-do-concorrente`.
2. Coloque ela dentro de `~/.claude/skills/` (uso pessoal; no Windows, `C:\Users\SeuNome\.claude\skills\`) ou de `.claude/skills/` (dentro de um projeto).
3. Abra o Claude Code e peça: **"espião, analisa o concorrente [nome]"**. A skill carrega sozinha quando o assunto bate.

> Dica: o nome da pasta tem que continuar com o `SKILL.md` dentro dela. Não renomeie o arquivo `SKILL.md`.

---

## Como usar

Depois de instalada, é só falar naturalmente. Exemplos:

- "espião, analisa o concorrente @marcaqualquer"
- "monta um dossiê de anúncios e presença da [nome da empresa]"
- "quero achar as brechas da oferta do [concorrente]"

Se você não tiver acesso à rede, ela vai te pedir para colar o material. Quanto mais você colar (5 ou mais peças é o ideal), mais funda a análise.

### Onde achar o material para colar (modo manual)

- **Anúncios da Meta:** https://www.facebook.com/ads/library — escolha o país (Brasil), busque pelo nome ou @ do concorrente, copie o texto dos anúncios ativos. É pública, não precisa login.
- **Anúncios do Google:** https://adstransparency.google.com — busque pelo anunciante.
- **Anúncios do TikTok:** https://library.tiktok.com/ads
- **Orgânico:** abra o perfil dele no Instagram, YouTube, TikTok ou LinkedIn e copie bio, títulos de vídeo e primeiras linhas dos posts.
- **Páginas próprias:** copie a headline do site, a oferta e o preço da página de checkout.
- **Reputação:** busque no Google por "[nome] reclame aqui" e "[nome] reviews".

Cole tudo no Claude e diga de onde veio cada parte. Quanto mais fontes, mais brechas aparecem.

---

## Não consegue instalar? Use o prompt colável

Se você está num plano que não roda skills, ou só quer testar rápido, abra o arquivo `PROMPT-COLAVEL.md`, copie o texto inteiro e cole numa conversa nova do Claude ou de qualquer IA de chat. Ele faz a mesma análise, sem instalar nada.

---

## O que tem dentro

```
espiao-do-concorrente/
  SKILL.md              instruções principais (o cérebro da skill)
  REFERENCE.md          frameworks de análise em detalhe
  README.md             este guia
  PROMPT-COLAVEL.md     versão colável para quem não instala
  templates/
    dossie.md           o formato do relatório final
  scripts/
    meta_ad_library.py  coletor da Meta Ad Library (com fallback)
    coletor_web.py      coletor genérico multi-fonte (Google Ads, TikTok Ads, social, site)
```

---

Feito pela Academia Lendária. Só usa dado público. Sem login alheio, sem invadir nada: as bibliotecas de anúncios da Meta, do Google e do TikTok são públicas por design.
