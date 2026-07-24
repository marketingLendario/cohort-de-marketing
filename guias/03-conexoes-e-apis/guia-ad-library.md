# GUIA AD LIBRARY — o espião automático (opcional; o manual dá o MESMO resultado)

> **Estou perdido em:** "quero o `/espiao-do-concorrente` puxando anúncios sozinho — mas a Meta pede verificação de identidade e não sei se vale".
> **O que você vai ter no final:** ou o `META_AD_LIBRARY_TOKEN` funcionando (espião 100% automático), ou a decisão consciente de usar o fallback manual — que dá o MESMO resultado analítico sem nenhum pré-requisito.
> **Fontes cruzadas:** super-guia B.5 (repo) · SKILL.md do `/espiao-do-concorrente` (código real — o fallback manual é oficial) · página oficial da Ad Library API (`facebook.com/ads/library/api`) e fórum de devs da Meta (verificação em ~24–48 h, dois processos de verificação distintos — consultados 22/07) · aviso da própria skill (recoleta a cada 14 dias).
> **Recomendação didática honesta:** deixe este guia POR ÚLTIMO. O caminho manual (abrir `facebook.com/ads/library`, filtrar, colar os textos no chat) resolve igual.

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 🔑 Conta | Perfil do Facebook real (o mesmo do BM) | [guia-meta-fundacao](guia-meta-fundacao.md) |
| 🔑 Conta | App da Meta criado (o `Cohort Trafego` serve — não crie outro) | [guia-meta-api](guia-meta-api.md), passo 3 |
| 🧰 Item | Documento oficial com foto (RG/CNH/passaporte) válido e legível — a verificação é a mesma exigida de quem anuncia política | separe antes; foto nítida, sem corte nem reflexo |
| 📖 Conhecimento | O prazo: a identidade leva **1–3 dias úteis** — este guia NÃO conclui no mesmo dia | planeje; use o manual enquanto espera |

## Passo a passo

1. **Confirmar a identidade (1× na vida; 1–3 dias úteis):** abra `facebook.com/ID` logado → país de residência → **upload do documento** → envie. A resposta chega por notificação/e-mail (tipicamente 24–48 h; atrasa se o documento estiver vencido/cortado ou os dados não baterem com o perfil).
2. **Aceitar os termos da Ad Library API:** aprovada a identidade → `facebook.com/ads/library/api` → **"Get Started"** → aceite os termos. *(São DOIS processos de verificação distintos — a de desenvolvedor e esta; concluir só uma não libera.)*
3. **Gerar o token** — dois caminhos equivalentes: pela seção **Tools** da própria página da API, ou pelo **Graph API Explorer** (`developers.facebook.com/tools/explorer` → selecione o app → "Generate Access Token" → login/confirmar). Não precisa de escopo especial.
4. Cole no `.env`: `META_AD_LIBRARY_TOKEN=...`.
5. Token de usuário **expira em horas**: estenda no **Access Token Debugger** (`developers.facebook.com/tools/debug/accesstoken` → colar → "Estender") → vira ~60 dias. Anote no calendário pra renovar.

## Ritmo de uso (a linha que a própria skill avisa)

Anúncio de concorrente muda rápido: **recolete a cada ~14 dias** — o `/espiao-do-concorrente` avisa quando o material está velho. Espionagem é rotina, não evento único.

## Teste de sucesso (30 s)

No Graph API Explorer, com o token selecionado, rode a consulta `ads_archive?search_terms='emagrecimento'&ad_reached_countries=['BR']` → **Enviar**. Voltou uma lista JSON = funcionando. Erro de permissão = identidade ainda em análise ou termos não aceitos (erro AL1).

## POSSÍVEIS ERROS — catálogo

| # | Sintoma | Causa | O que fazer (em ordem) |
|---|---|---|---|
| AL1 | **"Application does not have permission"** no teste | identidade ainda em análise, termos não aceitos com ESTE perfil, ou você fez só UMA das duas verificações | 1) confira o status em `facebook.com/ID`; 2) refaça o passo 2 logado no perfil certo; 3) enquanto isso: fallback manual |
| AL2 | **Documento recusado** | vencido, cortado, com reflexo, ou nome divergente do perfil | refaça a foto (documento inteiro, luz uniforme); os dados do perfil precisam bater com o documento |
| AL3 | Verificação **"em análise" há dias** | prazo normal é 1–3 dias úteis; fila acontece | espere; não reenvie em loop (reenvio zera a fila); passou de 1 semana → suporte da Meta com print |
| AL4 | **Token morreu rápido** | token de usuário dura horas por padrão | estenda no Debugger (passo 5); e anote a renovação de ~60 dias |
| AL5 | "Preciso disso pra Aula 1?" | não — ansiedade de completude | o espião funciona 100% no manual: abra `facebook.com/ads/library`, filtre país/anunciante e cole os textos no chat; mesma análise, zero burocracia |

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | rode `/espiao-do-concorrente` — com token ele coleta sozinho; sem, ele te guia no manual |
| 📖 Ler | de volta à cadeia principal: [roteador](../README.md); a outra chave opcional da Aula 4 é o [guia-organico-tokens](guia-organico-tokens.md) |
| 🚑 Se travar | o catálogo AL1–AL5 acima (permissão negada, documento recusado, token curto...) |
