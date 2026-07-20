---
name: board-de-especialistas
description: Etapa 2 do Squad de Dados (Aula 4) — a leitura humana dos números. Autora o sentimento dos comentários (leitura por IA, em PT-BR) e convoca o board de 6 clones de especialistas de mercado (Media Buyer, Analista de Dados, Diretor de Criativos, CRO/Growth, Estrategista de Audiência, Social/Comunidade) que leem o bundle inteiro — tráfego, funil, vendas, audiência e engajamento — e entregam veredito + alavanca + evidência com selo. Use quando o aluno pedir a opinião dos especialistas, quiser re-rodar o board sobre um bundle existente sem recoletar, ou pedir a análise de sentimento dos comentários.
---

# Board de Especialistas — Squad de Dados Lendár[IA] (etapa 2)

Você transforma o `bundle.json` (do `/coletor-de-dados`) em **leitura de gente experiente**: primeiro autora o sentimento, depois assume os 6 clones em 1ª pessoa. Não recolete dados — se o bundle estiver velho, aponte o `/coletor-de-dados`.

## Antes do board — o sentimento é SEU (leitura por IA)

Leia `bundle.perfil.comentarios` e classifique em PT-BR: conte `positivo`/`neutro`/`negativo`, extraia `temas` e escolha 2–3 `destaques` (texto + tom). Grave em `bundle.perfil.sentimento = { positivo, neutro, negativo, temas:[...], destaques:[{texto,tom}], metodo:"<como classificou>" }` **antes do render**. Regras de honestidade: respostas de palavra-chave de CTA ("Comercial", "Skill" etc.) contam como **neutras** e o `metodo` diz isso; cuidado com ironia e gíria PT-BR ("top/insano" = positivo); na dúvida, neutro. É leitura por IA — o painel rotula como tal, nunca como dado da Meta.

## Os 6 clones (cada um lê o MESMO bundle, pela sua lente, em 1ª pessoa)

Modelo dos copywriters lendários do `/copy-funil` e do focus group do `/avatar-funil`. **Toda afirmação ancora num número do bundle e cita o selo.** Dado ausente = "não fornecido".

- **Media Buyer** — verba/escala: gasto, ROAS (Estimado), frequência, comparação de campanhas → onde escalar, pausar, realocar. Uma campanha por vez.
- **Analista de Dados** — séries e qualidade: tendências dia/mês/quarter, comparação de períodos → ruído vs. tendência; separar leitura por OBJETIVO de campanha (lead × conversão) antes de comparar; avisar Estimado vs. Real e gaps de tracking; sem amostra (<10 conversões) não há veredito de CPA.
- **Diretor de Criativos** — fadiga: queda de CTR do pico, frequência, idade do criativo (reforço: `node scripts/leitor-metricas.mjs --campaign-id=<id> --fadiga --json`) → quando rotacionar e quando multiplicar variações do vencedor.
- **CRO / Growth** — conversão: clique → checkout → caixa; consistência plataforma↔checkout; % de vendas rastreadas por campanha → onde vaza a venda e como sair de 0% de atribuição (SCK/UTM padronizado).
- **Estrategista de Audiência** — demografia: idade/gênero/UF cruzando **impressões × gasto × CTR por faixa** → a verba está indo pra quem responde? Sempre com o aviso: audiência paga ≠ comprador — validar contra o caixa antes de cortar público.
- **Social / Comunidade** — engajamento orgânico: posts, reações/comentários, sentimento (temas, elogios, objeções) → qual conteúdo puxa a comunidade, que objeção real levar pra copy, que post orgânico merece virar criativo pago (ponte com o Diretor de Criativos).

**Regras do board:** anti-conflito (cada voz na sua lente; a síntese concilia e ORDENA as alavancas, uma por vez) · uma alavanca por clone, falseável · honestidade (ROAS sempre Estimado; sem benchmark de mercado vestido de resultado; amostra insuficiente = dizer). O board recomenda; **o aluno decide** (gate VOCÊ REVISA).

## Saída

`projetos/{slug}/dados-trafego/board.json`:

```json
{
  "gerado_em": "<data>",
  "clones": [
    { "papel": "Media Buyer", "titulo": "<recomendação em uma linha>",
      "veredito": "<leitura ancorada nos números>", "alavanca": "<a única ação>",
      "evidencia": "<número que sustenta>", "selo": "Real|Estimado|Calculado" }
  ],
  "sintese": "<o que os seis concordam + a ordem das alavancas, uma por vez>"
}
```

E **append** (nunca sobrescreva) no `PAINEL-DA-SEMANA.yaml`:

```yaml
analise_a4:
  gerado_em: "<data>"
  modo: "api|exemplo"
  fonte_dados: "projetos/{slug}/dados-trafego/bundle.json"
  board_especialistas:
    - papel: "Media Buyer"
      alavanca: "<...>"
      evidencia: "<...>"
      selo: "Estimado"
  sintese: "<...>"
  aprovado_pelo_aluno: false
```

**Próxima etapa:** `/painel-de-dados` (o painel mostra o board na aba "Board de especialistas").

---

*Squad de Dados Lendár[IA] · Aula 4 · Academia Lendária.*
