# Plano 004: Fechar o adapter Meta publico em read-only

> **Instrucoes ao executor**: este plano pertence ao repositorio publico `marketingLendario/cohort-de-marketing`. Siga as etapas e pare nas STOP conditions. Ao concluir, atualize `plans/README.md` deste repositorio.
>
> **Drift check**: `git diff --stat d831ea3..HEAD -- services/meta-ads/index.js services/meta-ads/README.md services/meta-ads/index.test.js aula-03/docs/integracao-meta-read-only.md`

## Status

- **Prioridade**: P1
- **Esforco**: M
- **Risco**: HIGH
- **Depende de**: nenhum
- **Categoria**: security
- **Planejado em**: commit `d831ea3`, 2026-07-12

## Por que isso importa

O material da Aula 3 promete que a integracao nao publica, pausa, escala ou altera anuncios. Entretanto, `services/meta-ads/index.js` encaminha qualquer argumento ao binario `meta`. Como nao existe consumidor de codigo desse pass-through no repositorio e `insights-runner.js` ja cobre a leitura controlada, a solucao mais segura e remover o caminho generico em vez de tentar adivinhar uma denylist de comandos mutaveis.

## Estado atual

- `services/meta-ads/index.js:40-50`: usage anuncia `<meta-cli args...>`.
- `services/meta-ads/index.js:56-74`: argumentos desconhecidos viram `passthrough`.
- `services/meta-ads/index.js:140-181`: `cmdPassthrough` chama `spawnSync(META_BIN, args)` sem allowlist.
- `services/meta-ads/index.js:217-236`: main despacha tudo que nao e check/list para pass-through.
- `services/meta-ads/README.md:65-70`: documenta “Pass-through any meta CLI command”.
- `aula-03/docs/integracao-meta-read-only.md:13-18`: contrato explicito de nao mutacao.
- Busca no commit planejado encontra exemplos apenas nos arquivos acima; nao ha caller de runtime.

Contrato alvo do wrapper `index.js`: somente `--list-spokes`, `--check --spoke=<slug>` e help. Consultas de insights permanecem no runner read-only dedicado; qualquer argumento operacional desconhecido falha com exit 2 antes de spawn.

## Comandos

| Objetivo | Comando | Esperado |
|---|---|---|
| Sintaxe | `node --check services/meta-ads/index.js` | exit 0 |
| Testes | `node --test services/meta-ads/index.test.js` | todos passam |
| Help | `node services/meta-ads/index.js --help` | exit 0; nao menciona pass-through |
| Catalogo | `node scripts/validate-skill-catalog.mjs` | exit 0 |

## Escopo

**Pode alterar somente**:

- `services/meta-ads/index.js`
- `services/meta-ads/README.md`
- criar `services/meta-ads/index.test.js`
- `aula-03/docs/integracao-meta-read-only.md`
- `plans/README.md` para status

**Fora de escopo**: `insights-runner.js`, credenciais/spokes, `.env*`, binario externo `meta`, app privado, publicacao Meta, nova allowlist de escrita, pacote da Aula 3 fora da documentacao citada.

## Git

- Branch: `advisor/004-enforce-meta-read-only-boundary`
- Commit: `fix: enforce read-only Meta adapter boundary [Plan 004]`
- Nao fazer push/PR sem instrucao do operador.

## Etapas

### 1. Confirmar que nao existe consumidor

Rode:

```bash
rg -n "services/meta-ads/index\.js|--spoke(?:=| )[^\n]*ads|Pass-through" . -g '!**/.git/**' -g '!**/node_modules/**'
```

Esperado no commit planejado: apenas `services/meta-ads/index.js` e `services/meta-ads/README.md`. Se aparecer script, automacao ou material de aluno que dependa do pass-through, pare e reporte o comando exato sem executa-lo.

### 2. Escrever testes fail-closed

Crie `index.test.js` com `node:test` e `node:assert/strict`. Exporte uma funcao pura de parsing/validacao, sem rodar `main` no import. Cubra:

- help, list-spokes e check aceitos;
- `--check` sem spoke rejeitado;
- argumentos como `ads campaign list` e qualquer token desconhecido rejeitados antes de spawn;
- combinacoes ambiguas (`--check` + comando extra, list + check) rejeitadas;
- scrub de secrets existente permanece caracterizado sem valores reais.

Injete/decore a funcao de spawn somente se necessario para provar que zero chamadas ocorrem nos casos rejeitados; nao invoque o CLI Meta real.

**Verifique**: os casos de pass-through falham no codigo anterior e passam depois.

### 3. Remover pass-through generico

Remova `cmdPassthrough`, o array `passthrough`, exemplos e despacho generico. O parser deve aceitar somente as operacoes nomeadas e retornar erro tratavel para qualquer argumento restante. Preserve masking, resolucao de spoke e `meta auth status` do `--check`.

Nao substitua por denylist de verbos. Nao crie `--force`, escape hatch ou variavel de ambiente que reabilite escrita.

**Verifique**: `rg -n "cmdPassthrough|Pass-through|passthrough" services/meta-ads` retorna zero.

### 4. Alinhar documentacao

Atualize README e guia da Aula 3 para listar os dois entrypoints reais: wrapper de status/lista de spokes e `insights-runner.js` para coleta read-only. Declare explicitamente que comandos arbitrarios do CLI Meta nao sao expostos pelo pacote publico.

Nao documente comandos cuja sintaxe nao esteja implementada.

**Verifique**: help, testes, `node --check` e catalog validator saem 0.

## Plano de testes

- Operacoes permitidas continuam parseando.
- Toda entrada operacional desconhecida falha com exit 2 sem spawn.
- Combinacoes ambiguas falham fechado.
- Scrub de secrets nao regride.
- Documentacao nao promete pass-through.

## Criterios de pronto

- [ ] `index.js` nao possui caminho para argumentos arbitrarios.
- [ ] Testes comprovam zero spawn nos casos proibidos.
- [ ] README e guia descrevem o comportamento real.
- [ ] Sintaxe, testes e catalog validator passam.
- [ ] Nenhum arquivo fora do escopo foi alterado.
- [ ] Linha 004 atualizada.

## STOP conditions

- Encontrar consumidor real do pass-through.
- `insights-runner.js` executar mutacao Meta; reporte como novo achado, nao amplie este plano.
- `--check` precisar de comando alem de `meta auth status`.
- A remocao exigir editar credenciais ou arquivos `.env`.

## Manutencao

Qualquer nova consulta Meta publica deve entrar como operacao nomeada, testada e read-only. Nunca reintroduzir pass-through ou confiar em denylist de verbos mutaveis.

