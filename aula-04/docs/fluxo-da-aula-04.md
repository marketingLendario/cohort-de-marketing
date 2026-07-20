# Fluxo da Aula 04 — Central de Dados

A aula é conduzida pelo **Squad de Dados** — uma skill por função, com uma porta de entrada única: `/analista-de-dados` (o hub roda tudo em sequência; cada etapa também funciona sozinha). Sempre fechando no gate **VOCÊ REVISA** (o board recomenda; você decide).

| Etapa | Skill | Função |
|---|---|---|
| 0 | `/analista-de-dados` | Hub: modo/chaves + orquestra as demais |
| 1 | `/coletor-de-dados` | Coleta Meta + Hotmart (bundle, sem PII) |
| 2 | `/board-de-especialistas` | Sentimento + 6 clones + síntese |
| 3 | `/painel-de-dados` | Painel self-contained + PDF |
| 4 | `/retroalimentacao` | Devolve os dados às Aulas 1 e 2 |
| 5 | `/gestor-de-campanhas` | Realizado 7/30d × planejado |

## Passo 0 — Modo e chaves

- **Modo API** (`.env` com `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`): lê a conta real.
- **Modo Exemplo** (sem credenciais): roda sobre a fixture `scripts/fixtures/painel-trafego-exemplo.json` — a demo nunca trava.
- A validação das chaves é **delegada ao `/zelador`** (`node scripts/zelador-audit.mjs --json` / `--gravar-env`). Ver [configurar-chaves-meta.md](./configurar-chaves-meta.md).

## Passo 1 — Dados (`/coletor-de-dados`)

```bash
node scripts/painel-trafego-data.mjs --account --saida=projetos/{slug}/dados-trafego/bundle.json
```

Gera o bundle: `series.{dia,mes,quarter}`, `campanhas` (com metadados), `comparacao` (deltas), `funil` (agregado, por dia e por campanha×dia), `heatmap`, `demografia` (idade/gênero/UF), `perfil` (engajamento) e — com Hotmart conectada — `vendas` + `atribuicao`. Contrato "não-inferir" preservado; sem PII.

## Passo 2 — Board (`/board-de-especialistas`)

A skill assume, em 1ª pessoa, cada um dos **6 clones** e lê o bundle pela lente respectiva (antes, autora o sentimento dos comentários — leitura por IA, rotulada). Cada clone escreve **1 veredito + 1 alavanca + 1 evidência (com selo)** em `dados-trafego/board.json`; a síntese concilia e ordena as alavancas (uma por vez).

| Clone | Lente | Pergunta que responde |
|---|---|---|
| Media Buyer | Verba / escala | Onde escalar, pausar e realocar? |
| Analista de Dados | Séries / qualidade | O que é tendência vs. ruído? O que é Real vs. Estimado? |
| Diretor de Criativos | Fadiga | Quando rotacionar criativo? |
| CRO / Growth | Conversão | Onde vaza a venda entre página e checkout? |
| Estrategista de Audiência | Demografia | A verba vai pra quem responde (idade/gênero/UF × gasto × CTR)? |
| Social / Comunidade | Engajamento | Que conteúdo puxa a comunidade? Que objeção levar pra copy? |

## Passo 3 — Painel (`/painel-de-dados`)

```bash
node scripts/painel-trafego-render.mjs --dados=... --board=... --tokens=projetos/{slug}/tokens.json \
  --projeto="Sua Marca" --saida=projetos/{slug}/painel-trafego.html
```

HTML self-contained (dados embutidos, gráficos em SVG, identidade da marca via `DESIGN.md`). Abre offline e imprime em PDF.

## Passo 4 — Entrega e retroalimentação (`/retroalimentacao`)

Abrir o `.html` (detectar SO: Linux `xdg-open`), gerar o PDF (`gerar_pdf.sh`), registrar o card **"Painel de Tráfego"** no Book do Funil e apontar o próximo passo. Fazer **append** do bloco `analise_a4:` no `PAINEL-DA-SEMANA.yaml` (nunca sobrescrever o histórico). Depois, `/retroalimentacao` grava o `retroalimentacao.md` (dados reais → avatar da Aula 1 e copy da Aula 2) e o `/gestor-de-campanhas` fecha o ciclo comparando realizado 7/30 dias com o planejado.
