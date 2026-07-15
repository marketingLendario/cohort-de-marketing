# Aula 4 — Dados e decisões ao longo do tempo

Este módulo transforma três painéis semanais validados em um histórico
revisável. Tudo roda no checkout local: não acessa Studio, API, checkout,
caixa, Meta ou credencial e não executa decisão na plataforma.

Leia também o [Guia do Aluno da Aula 4](./GUIA-DO-ALUNO.html) e consulte o
[exemplo público](./exemplos/projeto-tres-semanas/README.md).

## Sequência única

### 1. Preparar

Pré-requisitos:

- Node.js 18+;
- npm disponível;
- checkout limpo deste repositório;
- terminal aberto na raiz do checkout.

Instale as dependências congeladas pelo lockfile:

```bash
npm --prefix scripts ci --ignore-scripts
```

Crie um diretório de saída novo e vazio. O exemplo abaixo usa uma pasta de
projeto ignorada pelo Git:

```bash
mkdir -p projetos/exemplo-aula-04/saida-1
```

No Windows PowerShell, use:

```powershell
New-Item -ItemType Directory -Force projetos/exemplo-aula-04/saida-1
```

### 2. Executar

Na raiz do checkout, execute uma única vez:

```bash
node scripts/run-aula-04-walkthrough.mjs \
  aula-04/exemplos/projeto-tres-semanas \
  projetos/exemplo-aula-04/saida-1
```

O diretório precisa estar vazio. Para repetir, escolha outro diretório vazio;
o runner nunca sobrescreve uma execução anterior.

### 3. Revisar

O runner gera exatamente estes arquivos:

1. `weekly-ledger.json` — ledger `1.1.0` com três semanas e digests verificáveis;
2. `historical-reading.json` — leitura `1.0.0` sem derivar métricas;
3. `source-reconciliation.json` — gaps entre fontes, sem eleger uma verdade;
4. `decision-outcome-request.json` — bundle fechado com a decisão anterior;
5. `decision-outcome-diagnosis.json` — resultado `inconclusivo` e zero alavancas;
6. `walkthrough-summary.json` — resumo determinístico da execução.

Pare e revise se o terminal não responder com `WALKTHROUGH_COMPLETE`, se a
decisão não estiver `pending` ou se o diagnóstico não estiver `inconclusivo`.

### 4. Registrar a decisão humana

O diagnóstico não decide por você. Abra os arquivos gerados, confira as três
fontes e registre manualmente a próxima decisão estruturada para o ciclo
seguinte. Use
[`previous-decision.json`](./exemplos/projeto-tres-semanas/previous-decision.json)
como referência de campos e gere IDs opacos novos; não edite nem apague a
decisão histórica. Uma divergência mantém zero alavancas até a decisão humana.

## Templates públicos

- [WeeklyLedger](./templates/weekly-ledger.yaml)
- [Leitura histórica](./templates/leitura-historica.yaml)
- [Reconciliação de fontes](./templates/reconciliacao-fontes.yaml)
- [Diagnóstico longitudinal](./templates/diagnostico-longitudinal.yaml)

Os YAMLs são mapas didáticos. Os artefatos executáveis são JSON/JSONL gerados
ou validados pelos CLIs; não preencha hashes, digests, gaps ou resultados à mão.

## Como abrir o guia HTML

O runner não abre navegador. Use o caminho local
`aula-04/GUIA-DO-ALUNO.html` manualmente:

- macOS: `open aula-04/GUIA-DO-ALUNO.html`
- Windows PowerShell: `Start-Process aula-04/GUIA-DO-ALUNO.html`
- Linux: `xdg-open aula-04/GUIA-DO-ALUNO.html`

## Critérios de parada

- Não prossiga se uma métrica não tiver fonte, janela ou confirmação explícita.
- Não converta gap em causa nem escolha plataforma, checkout ou caixa como
  verdade automática.
- Não cole PII, credenciais ou payload de comprador nos exemplos ou outputs.
- Não publique, pause ou escale campanha a partir deste módulo.
