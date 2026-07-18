# Fluxo da Aula 04 — Central de Dados

Uma skill conduz a aula inteira: `/analista-de-trafego`. Ela roda em quatro passos, sempre fechando no gate **VOCÊ REVISA** (o board recomenda; você decide).

## Passo 0 — Modo e chaves

- **Modo API** (`.env` com `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`): lê a conta real.
- **Modo Exemplo** (sem credenciais): roda sobre a fixture `scripts/fixtures/painel-trafego-exemplo.json` — a demo nunca trava.
- A validação das chaves é **delegada ao `/zelador`** (`node scripts/zelador-audit.mjs --json` / `--gravar-env`). Ver [configurar-chaves-meta.md](./configurar-chaves-meta.md).

## Passo 1 — Dados

```bash
node scripts/painel-trafego-data.mjs --account --saida=projetos/{slug}/dados-trafego/bundle.json
```

Gera o bundle: `series.{dia,mes,quarter}`, `campanhas` (last_30d), `comparacao` (30d vs. 30d anteriores, com deltas) e `perfil` (orgânico/roadmap). Contrato "não-inferir" preservado.

## Passo 2 — Board de especialistas

O Analista assume, em 1ª pessoa, cada um dos 4 clones e lê o bundle pela lente respectiva. Cada clone escreve **1 veredito + 1 alavanca + 1 evidência (com selo)** em `dados-trafego/board.json`; a síntese concilia e ordena as alavancas (uma por vez).

| Clone | Lente | Pergunta que responde |
|---|---|---|
| Media Buyer | Verba / escala | Onde escalar, pausar e realocar? |
| Analista de Dados | Séries / qualidade | O que é tendência vs. ruído? O que é Real vs. Estimado? |
| Diretor de Criativos | Fadiga | Quando rotacionar criativo? |
| CRO / Growth | Conversão | Onde vaza a venda entre página e checkout? |

## Passo 3 — Painel

```bash
node scripts/painel-trafego-render.mjs --dados=... --board=... --tokens=projetos/{slug}/tokens.json \
  --projeto="Sua Marca" --saida=projetos/{slug}/painel-trafego.html
```

HTML self-contained (dados embutidos, gráficos em SVG, identidade da marca via `DESIGN.md`). Abre offline e imprime em PDF.

## Passo 4 — Entrega

Abrir o `.html` (detectar SO: Linux `xdg-open`), gerar o PDF (`gerar_pdf.sh`), registrar o card **"Painel de Tráfego"** no Book do Funil e apontar o próximo passo. Fazer **append** do bloco `analise_a4:` no `PAINEL-DA-SEMANA.yaml` (nunca sobrescrever o histórico).
