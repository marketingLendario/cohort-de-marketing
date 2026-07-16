# Plano — Estruturador v2: públicos mornos/quentes + matriz de funil por consciência

> Continuação de `plans/squad-trafego-master-plan.md` (fases A–G concluídas em 2026-07-15).
> **Gap confirmado** (leitura do SKILL.md + `estruturador-publish.mjs` em 2026-07-15): o Estruturador v1 só monta o
> "default sagrado" — público **amplo/frio + Advantage+** com no máx. 1 interesse. O targeting no script é só
> `targeting_automation: {advantage_audience: 1}` + `flexible_spec` de 1 interesse. **Não existe** `custom_audiences`,
> `lookalike_spec` nem leitura de `/act_X/customaudiences`. Também não há escolha de funil: é 1 estrutura fixa
> (validação de topo, Vendas/Cadastro, R$30/dia × 7d). A lógica "qual funil para qual público" mora em `metodo-funil`
> (níveis de consciência 1–5) e não está integrada.

## Viabilidade confirmada por teste ao vivo (2026-07-15, read-only)

`GET /act_X/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,time_updated`
com o System User token atual → ✅ **331 públicos retornados** na conta real. Amostra:

| Subtype | Exemplo real | Tamanho (bounds) | Status | Lição |
|---|---|---|---|---|
| ENGAGEMENT | "Vídeo View 3s - Distribuição de Conteúdo" | ~215.600–253.700 | delivery 200 / op 200 | público morno grande e saudável — caso ideal |
| CUSTOM (lista) | "Lista_Alunos_...Jun26.csv" | ~1.000–1.000 | 200/200 | listas de clientes existem e estão prontas |
| LOOKALIKE | "Semelhante (1%) - Lista_Alunos..." | ~1.000–1.000 | 200/200 | lookalikes já existem na conta |
| WEBSITE | "[SA] InitiateCheckout 30D (-) Purchase 30D" | ~20–20 | 200/200 | **bound 20 = contagem oculta pela Meta (público pequeno)** — risco de entrega |
| ENGAGEMENT | "Vídeo View 3s" | ~3.800–4.400 | 200 / **op 441** | públicos com `operation_status` ≠ 200 existem — o guardrail precisa filtrar |

Conclusões que moldam o plano:
1. Leitura de públicos funciona com o token atual — a Fase A (auditoria) é zero-risco.
2. `approximate_count_lower_bound = 20` é o placeholder da Meta para público pequeno/oculto — **não dá para confiar em contagem exata**; o guardrail usa o lower bound como piso conservador.
3. `operation_status.code ≠ 200` acontece na prática — elegibilidade precisa checar op + delivery + frescor (`time_updated`).

## Princípios (herdados do squad, inegociáveis)

1. **Extensão por allowlist, nunca afrouxamento.** O default sagrado frio continua intacto e continua sendo o ÚNICO caminho da primeira campanha. Morno/quente são **kits novos com guardrails próprios**, não exceções ao kit frio.
2. **Temperatura nunca se mistura**: 1 campanha = 1 conjunto = 1 temperatura (frio | morno | quente). Misturar público quente com frio no mesmo conjunto suja o sinal dos dois.
3. **O aluno decide; a API executa.** Mesmos 3 gates (aprovar → criar PAUSED → ativar com confirmação). Nenhum novo modo cria nada sem `aprovado_pelo_aluno_em`.
4. **Nível de consciência é decisão humana registrada** (regra que o Briefista já pratica): o Estruturador não chuta temperatura — consome `nivel_consciencia` do Painel ou pergunta e registra a resposta do aluno.
5. **Selo de fonte em tudo**: inventário de públicos vem com `fonte: api` + data; tamanho é `aproximado (bounds da Meta)`.
6. **Pedagogia**: remarketing/escala é matéria da **Aula 4**. Gate pedagógico: kit morno/quente só é oferecido se (a) já existe campanha fria validada no Painel, OU (b) a conta tem histórico real (públicos maduros pré-existentes — caso da conta testada).

## A matriz de decisão (o "melhor funil" — Fase B)

Destilada da tabela do `metodo-funil` (níveis 1–5) para o contexto Meta Ads do squad:

| Temperatura | Nível (metodo-funil) | Público na conta | Destino/funil | Criativo permitido | Kit de verba |
|---|---|---|---|---|---|
| **Frio** | 5–4 | amplo + Advantage+ (v1, inalterado) | VSL / advertorial / captação | hook de dor/curiosidade (**nunca depoimento**) | R$30/dia × 7d |
| **Morno** | 3–2 | ENGAGEMENT (vídeo/IG) · WEBSITE topo (PageView 30–180d) | estudo de caso / webinário / página | estudo de caso; depoimento só se nível 2 | R$20–30/dia × 7d |
| **Quente** | 2–1 | WEBSITE fundo (IC − Purchase) · CUSTOM listas · visitantes de checkout | página simplificada / **checkout direto** | depoimento, remarketing de oferta, vídeo 2min | R$20/dia × 5–7d |

Regras de ouro codificadas na SKILL (herdo do metodo-funil): *depoimento só converte no nível 2* · *estudo de caso no 3+* · *"anúncio de depoimento pra público frio? Burrice total"*. O casamento criativo↔nível é guardrail de SKILL (a IA não detecta "depoimento" na copy com confiabilidade — o script não bloqueia isso, a skill orienta e o aluno decide).

---

## Fase A — Zelador: auditoria de públicos (read-only, menor risco)

**Novo check no `zelador-audit.mjs`** (flag `--publicos`, opt-in para não pesar a auditoria padrão):

- `GET /act_X/customaudiences` paginado (a conta real tem 331 — `graphGetAll` já pagina).
- Classifica cada público: subtype → temperatura sugerida (ENGAGEMENT/WEBSITE-topo → morno; WEBSITE-fundo/CUSTOM-lista → quente; LOOKALIKE → frio-expandido, fora do escopo v2).
- **Elegibilidade** (tudo precisa passar): `operation_status.code == 200` E `delivery_status.code == 200` E `approximate_count_lower_bound ≥ 1.000` E `time_updated` ≤ 90 dias (listas CSV estáticas: avisar que envelhecem).
- Escreve no Painel:

```yaml
zelador:
  publicos:
    auditados_em: "<data>"          # fonte: api
    total_na_conta: 331
    elegiveis_morno:                 # id, nome, subtype, tamanho_min, atualizado_em
      - {id: "...", nome: "Vídeo View 3s - Distribuição", subtype: "ENGAGEMENT", tamanho_min: 215600}
    elegiveis_quente: [...]
    inelegiveis: [{id: "...", motivo: "operation_status 441"}, {id: "...", motivo: "tamanho oculto (bound 20)"}]
```

**Sem escrita nenhuma.** Compatível com o boundary read-only do zelador (`plans/004-enforce-meta-read-only-boundary.md`).

## Fase B — Matriz funil×temperatura na SKILL.md do Estruturador

Só documentação/prompt — sem código:

- Nova seção "Passo 0.5 — temperatura e funil": o Estruturador pergunta a origem do público, cruza com `zelador.publicos` e com `nivel_consciencia` dos ângulos do Briefista, e prescreve o kit pela matriz acima. Registra a decisão do aluno no Painel (`publico_tipo` + justificativa).
- Handoff explícito com `metodo-funil`: se o aluno não sabe o nível, o Estruturador manda rodar o gate de diagnóstico de lá ANTES de montar (mesmo padrão do "rode o zelador primeiro").
- "Não fazer" ganha: *não misture temperaturas no mesmo conjunto* · *não use depoimento em frio* · *não monte quente sem exclusão de compradores* · *não monte morno/quente com público inelegível na auditoria do Zelador*.
- Espelho `.agents/` sincronizado byte a byte (convenção do repo).

## Fase C — `estruturador-publish.mjs` v2 (o código de verdade)

**Schema do `campanha.json` ganha o bloco `publico`** (ausente = frio, 100% retrocompatível):

```jsonc
"publico": {
  "tipo": "quente",                          // "frio" (default) | "morno" | "quente"
  "custom_audiences": [{"id": "...", "name": "..."}],   // 1-3 públicos, obrigatório se tipo != frio
  "exclusoes": [{"id": "...", "name": "Compradores 180d"}]  // obrigatório se tipo == "quente"
}
```

**Targeting gerado por temperatura:**

| Campo | frio (inalterado) | morno / quente |
|---|---|---|
| `targeting_automation.advantage_audience` | `1` | **`0`** — com Advantage+ ligado a Meta trata custom audience como *sugestão* e expande além dela, o que fura o retargeting. Hard audience é o ponto do kit. |
| `custom_audiences` | — | `[{id}, ...]` (1–3) |
| `excluded_custom_audiences` | — | exclusões (quente: obrigatório ≥1 — tipicamente compradores) |
| `flexible_spec` (interesse) | máx. 1 | **proibido** (interesse em cima de retargeting só encolhe público já pequeno) |
| resto (`geo`, `promoted_object`, `optimization_goal`, PAUSED-first, end_time, rollback) | idêntico | idêntico |

**Guardrails novos (recusa, não aviso — mesmo padrão v1):**

1. `tipo != frio` sem `custom_audiences` → recusa. `custom_audiences` com `tipo == frio` → recusa (não deixa "temperar" o kit frio por fora).
2. **Validação ao vivo de cada público** no `--dry-run` e no `--criar`: `GET <audience_id>?fields=name,subtype,operation_status,delivery_status,approximate_count_lower_bound,time_updated` — recusa se não existir na conta, op/delivery ≠ 200, `lower_bound < 1.000` (com a mensagem pedagógica: "bound 20 = a Meta esconde a contagem de público pequeno; entrega vai estagnar") ou lista sem atualização há > 90d (warning, não bloqueio).
3. `tipo == quente` sem exclusão de compradores → recusa com mensagem pedagógica ("pagar de novo por quem já comprou é o desperdício nº1 do remarketing").
4. Máx. 3 públicos incluídos e 3 excluídos por conjunto (acumular público não é estratégia).
5. Piso R$20/dia mantido para todas as temperaturas. **Teto de morno/quente: R$100/dia** (público finito satura rápido; acima disso frequência explode em dias).
6. Continua: 1 campanha → 1 conjunto → 2–3 criativos; objetivo Vendas/Cadastro; nome rastreável — agora com sufixo de temperatura (`[COHORT1]_[slug]_[quente]_[data]`) para o Leitor separar as réguas.

**Novo comando de apoio:** `--listar-publicos` — imprime o inventário elegível (mesma lógica da Fase A, direto no terminal) para o aluno escolher IDs sem sair do fluxo. Read-only.

**Fixtures/testes:** casos de recusa novos (público inexistente, op 441, bound 20, quente sem exclusão, frio com custom_audiences, interesse+retargeting, teto R$100) + E2E real: criar campanha quente PAUSED com público real elegível, conferir targeting no gerenciador, apagar (mesmo protocolo do E2E v1).

## Fase D — Leitor de Métricas + Diagnosticador: réguas por temperatura

O bloco `estruturador.publico_tipo` no Painel permite ao Leitor escolher a régua certa:

- **Frequência**: frio alerta em > 3,0/semana (regra atual do Briefista); morno/quente **espera-se** frequência maior — alerta passa a > 6,0/semana e fadiga de criativo em dias, não semanas.
- **CPM**: quente tem CPM naturalmente mais alto — o Leitor sela como "esperado para retargeting" em vez de sinal vermelho.
- **Circuit-breaker**: para quente, gatilho adicional de saturação — `frequência ≥ 8 em 7d` OU entrega estagnada (impressões diárias caindo > 50% com verba constante) → sinaliza o Diagnosticador antes do prazo, mesmo sem estourar CPA.
- **Diagnosticador**: alavanca nova "público saturado → pausar quente e renovar exclusões/criativos" no cardápio de alavancas (execução continua gated como hoje).

## Fase E (v2.1, opcional) — criar públicos que faltam

Se o Zelador apontar lacuna (ex.: não existe "Compradores 180d" para excluir), criar via
`POST /act_X/customaudiences` com `rule` de pixel (WEBSITE: PageView/IC/Purchase, 30–180d). É escrita **zero-gasto**,
mas ainda assim gated (aprovação do aluno + log em `log-publicacoes.jsonl`). Pré-requisito: pixel saudável no Zelador
(volume de eventos suficiente — público de pixel sem evento é público vazio).
**Fora do escopo:** criação de LOOKALIKE (Advantage+ cobre expansão no kit frio; seed pequeno gera lookalike ruim) e
upload de listas de clientes (LGPD/hashing — decisão de produto, não técnica).

## Ordem de implementação (dependência → risco crescente)

| Fase | Entrega | Risco | Status |
|---|---|---|---|
| A | `zelador-audit.mjs --publicos` + bloco `zelador.publicos` no Painel | leitura pura | ☐ |
| B | Matriz funil×temperatura na SKILL.md (+ espelho `.agents/`) + handoff metodo-funil | só prompt | ☐ |
| C | `estruturador-publish.mjs` v2: schema `publico`, guardrails, `--listar-publicos`, fixtures + E2E PAUSED real | escrita PAUSED | ☐ |
| D | Réguas por temperatura no leitor + circuit-breaker de saturação + alavanca nova no diagnosticador | leitura + regra | ☐ |
| E | (v2.1) `--criar-publico` WEBSITE via rule de pixel | escrita zero-gasto | ☐ opcional |

Pré-requisito herdado que continua aberto: **`--ativar` do v1 nunca foi validado com verba real** — validar o fluxo frio
supervisionado (R$20–30/dia, 24–48h) ANTES de ativar qualquer campanha quente. Criar PAUSED (Fase C) não depende disso.

## Riscos

- **Advantage+ × hard audience**: se `advantage_audience: 0` for rejeitado em alguma conta/versão (a Meta vem forçando Advantage+ progressivamente), fallback documentado: aceitar expansão no morno (com aviso) e manter hard só no quente. Verificar no E2E da Fase C.
- **Público pequeno = entrega estagnada**: mitigado pelo piso de 1.000 (lower bound) e pelo circuit-breaker de saturação. Os públicos WEBSITE "[SA] ..." da conta real (~bound 20) são exatamente o caso que o guardrail deve recusar hoje.
- **Contagens aproximadas**: bounds da Meta têm placeholders (20 / 1.000) — nunca reportar como exatos; selo `aproximado` no Painel.
- **Sobreposição frio×quente**: campanha fria pode alcançar quem já está no público quente (leilão interno). v2 não exclui quentes do kit frio (complexidade > ganho com R$30/dia); documentar como limitação conhecida e assunto de escala (Aula 4).
- **Special ad categories**: contas em categoria especial não podem usar certas segmentações — o erro da Meta na criação já é reportado com `ERROR_HINTS`; adicionar hint específico.
- **331 públicos = paginação e ruído**: `--listar-publicos` mostra só elegíveis, ordenados por tamanho, máx. 20 linhas.

## O que NÃO muda (contrato com o v1)

- Default sagrado frio: byte a byte o mesmo comportamento com `campanha.json` sem bloco `publico`.
- 3 gates, PAUSED-first, rollback, kill-switch, log de auditoria, piso R$20, Impulsionar inexistente.
- Zelador como pré-requisito bloqueante; decisão de gastar é sempre humana.
- Motor do Briefista e do ads-creative-factory intocados.
