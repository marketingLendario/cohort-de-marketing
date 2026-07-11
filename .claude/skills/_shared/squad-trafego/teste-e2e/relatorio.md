# Teste E2E simulado — Squad de Tráfego Lendár[IA]

**O que é:** simulação ponta a ponta das 5 skills (Zelador → Briefista → Estruturador → Leitor → Diagnosticador) com um aluno fictício, dados fictícios, e 2 casos de borda propositais. **Não é** teste com conta Meta real — isso continua sendo o P0 bloqueante (RA-1) que só roda com dados verdadeiros antes do ao vivo.

**Aluno fictício:** Marcos, dono de uma clínica de estética a laser (SP), operação enxuta. Produto: pacote "3 Sessões Depigmentação" — ticket R$1.200, margem 55%.
**Insumos A1/A2:** `roas_break_even = 1 ÷ 0,55 = 1,82x` · `cac_break_even = 1.200 × 0,55 = R$660`.

---

## Passo 1 — Zelador (1ª rodada) — teste do bloqueio crítico

Aluno reporta: BM ativo, conta ativa, pixel disparando, **CAPI nunca configurada**, dedup não avaliável, domínio verificado, pagamento ok.

```yaml
zelador:
  capi_ativo: false
  status_geral: "CRITICO"
  observacoes: ["CAPI inativo — bloqueando Estruturador até resolver."]
```

**Resultado:** ✅ PASS — o Estruturador corretamente recusou rodar nesta rodada ("status_geral é CRITICO, rode o Zelador de novo depois de configurar CAPI").

## Passo 2 — Zelador (2ª rodada, após aluno configurar CAPI)

```yaml
zelador:
  capi_ativo: true
  evento_compra_deduplicado: true
  status_geral: "OK"
```

**Resultado:** ✅ PASS — libera o Estruturador.

## Passo 3 — Briefista — teste da recusa por ângulo sem nível

3 ângulos entregues pelo aluno:
1. "Manchas que voltam depois de qualquer creme" — Consciente-do-Problema
2. "3 sessões e esquece o clareador pro resto do ano" — Consciente-da-Solução
3. "O erro que trava sua pele há anos" — **sem nível de consciência declarado**

**Resultado:** ✅ PASS — o Briefista gerou 4 variações pro ângulo 1 (curiosidade, dor, prova social, contrarian) e 3 pro ângulo 2 (benefício, história, prova social), e **recusou** o ângulo 3, devolvendo: *"Esse ângulo não tem nível de consciência declarado. Volta na A2 e completa antes de eu gerar criativo pra ele."* Aluno curou 3 finalistas (2 do ângulo 1, 1 do ângulo 2).

## Passo 4 — Estruturador

Zelador OK + 3 finalistas prontos → monta:

```yaml
estruturador:
  tipo_campanha: "Vendas"
  otimizacao: "Conversao"
  publico: "amplo_frio_advantage_plus"
  criativos_usados: ["finalista-1", "finalista-2", "finalista-3"]
  verba_diaria: 30.0
  periodo_dias: 7
  status: "pronta_para_submit"
```

**Resultado:** ✅ PASS — o Estruturador não tentou publicar sozinho; o campo `submetida_por_humano_em` ficou vazio até o "aluno" preencher depois do clique real.

## Passo 5 — Leitor de Métricas (dia 7) — teste do dado ausente + cálculo determinístico

Aluno cola: gasto R$210, impressões 41.800, cliques no link 334, conversões (Compra) 4, CPA-gerenciador R$52,50, ROAS-gerenciador 3,1x. **Não colou:** alcance (logo, frequência não é calculável) nem a janela de atribuição.

**Achado #1 (corrigido):** na primeira passada, o contrato "não-inferir" como eu tinha escrito bloquearia até o cálculo trivial de CTR = cliques ÷ impressões, porque dizia *"nunca calcula"* sem distinguir cálculo determinístico sobre dado colado de estimativa sobre dado ausente. Isso teria feito o Leitor devolver "não fornecido" pra CTR mesmo com os dois números na mesa — inútil na prática. **Corrigi** o `leitor-de-metricas/SKILL.md` pra permitir aritmética determinística (CTR, CPM, CPA) quando todos os insumos foram colados, e continuar proibindo qualquer coisa que precise de um dado ausente (frequência sem alcance, por exemplo).

Com a correção:

```yaml
leitor:
  sinais:
    - {metrica: "CTR", valor: 0.80, selo: "Real", fonte: "calculado: 334 cliques ÷ 41.800 impressões (colados pelo aluno)"}
    - {metrica: "CPA", valor: 52.50, selo: "Real", fonte: "calculado: R$210 ÷ 4 conversões"}
    - {metrica: "ROAS", valor: 3.10, selo: "Estimado", fonte: "gerenciador — NÃO confirmado com venda no caixa"}
    - {metrica: "frequencia", valor: null, selo: "nao_fornecido", fonte: ""}
  janela_atribuicao: "não fornecido"
  amostra_suficiente_para_cpa: false
  nota_amostra: "amostra insuficiente para CPA (N=4) — leia sinal de topo (CTR) com cautela também"
```

**Resultado:** ✅ PASS (após correção) — CTR/CPA calculados corretamente com fórmula auditável; frequência corretamente marcada "não fornecido" (não dava pra calcular sem alcance); ROAS corretamente rebaixado a Estimado por falta de confirmação de venda, mesmo vindo "pronto" do gerenciador.

## Passo 6 — Diagnosticador — teste do conflito entre sinais

CTR 0,80% está abaixo do benchmark de setor (~1,6-2%) — pela tabela heurística original, isso apontaria "trocar o ângulo". Mas o CPA de R$52,50 está a **7% do teto** (`cac_break_even = R$660`) — um resultado muito bom, só que sobre N=4.

**Achado #2 (corrigido):** a tabela heurística original não tinha uma regra de desempate entre "CTR ruim" e "CPA ótimo" — um Diagnosticador seguindo a tabela ao pé da letra recomendaria trocar o ângulo por reflexo, descartando um resultado econômico saudável por causa de um sinal de atenção fraco com amostra pequena. **Corrigi** o `diagnosticador/SKILL.md` adicionando a regra "o sinal mais perto do dinheiro pesa mais" — CPA dentro do break-even domina CTR fraco, a menos que o CPA também esteja ruim ou a amostra já seja grande.

Com a correção, o diagnóstico do teste ficou:

```yaml
diagnosticador:
  hipotese: "CPA de R$52,50 está muito abaixo do cac_break_even de R$660 (7% do teto) mesmo com CTR de 0,80% abaixo do benchmark do setor — com N=4, o sinal econômico pesa mais que o de atenção. Interromper agora por causa do CTR seria reagir a ruído."
  alavanca_unica: "Não trocar o ângulo — deixar a campanha completar mais 7 dias no mesmo default sagrado, pra amostra crescer o suficiente pra confiar no CTR como preditor."
  criterio_sucesso: "Em 14 dias totais, CPA continua abaixo de R$660 E conversões acumuladas passam de 10."
  criterio_reversao: "Se em 14 dias o CPA ultrapassar R$400 (60% do cac_break_even) OU CTR continuar <1% com conversões estagnadas, aí sim troca o ângulo via Briefista."
  circuit_breaker_acionado: false   # gasto não bateu 2×CPA-alvo com 0 conversões — não se aplica
```

**Resultado:** ✅ PASS (após correção) — contrato hipótese+alavanca+critério de sucesso+critério de reversão respeitado; diagnóstico ponderou os dois sinais em vez de reagir só ao pior deles.

## Passo 7 — Handoff → Painel A4

```yaml
handoff_a4:
  cac: {valor: 52.50, selo: "Real"}          # mas nivel_confianca reflete N baixo
  roas: {valor: 3.10, selo: "Estimado", premissa: "atribuição da plataforma, não confirmado no caixa"}
  roas_break_even: 1.82
  cac_break_even: 660
  gasto_midia_previsto: 210.0
  nivel_confianca: "baixo-médio (N=4, CTR abaixo de benchmark, CAC bem dentro do break-even)"
  invioveis_confirmados: {sem_selo_rejeitado: true, estimado_tem_premissa: true, toda_projecao_tem_janela: true, roas_real_so_com_venda_confirmada: true}
```

**Resultado:** ✅ PASS — nenhum número saiu sem selo; o ROAS ficou corretamente travado em Estimado.

---

## Resumo — achados e correções aplicadas

| # | Achado | Onde | Correção |
|---|---|---|---|
| 1 | "break-even" tinha 2 unidades diferentes (razão vs R$) misturadas num único campo, herdado da ambiguidade do `roteiro-execucao.md` original | `painel-da-semana-tmpl.yaml` | Adicionado campo `cac_break_even` (R$) separado de `roas_break_even` (razão) + nota de uso |
| 2 | Contrato "não-inferir" do Leitor bloquearia até aritmética trivial (CTR = cliques÷impressões) sobre dado que o aluno colou | `leitor-de-metricas/SKILL.md` | Distinguido "cálculo determinístico sobre dado colado" (permitido) de "completar dado ausente" (proibido) |
| 3 | Heurística do Diagnosticador não tinha regra de desempate entre CTR ruim e CPA ótimo — trocaria ângulo por reflexo mesmo com resultado econômico saudável | `diagnosticador/SKILL.md` | Adicionada "ordem de prioridade dos sinais": CPA dentro do break-even domina CTR fraco com amostra pequena |

Nenhum achado bloqueante — os 3 eram ambiguidades de especificação, corrigidas nos próprios arquivos de skill. Zelador bloqueando o Estruturador, Briefista recusando ângulo sem nível, e o contrato de handoff A3→A4 (sem selo = rejeitado) funcionaram como desenhado, sem correção necessária.

---

## Rodada 2 — simulação em primeira pessoa, com atrito real (não relatório limpo)

A rodada 1 (acima) testou lógica com dados idealizados. Esta rodada rodou as skills como uma sessão de verdade — aluno confuso, resposta ambígua, pressão de tempo, pedido de atalho — pra achar o que só aparece na fricção real, não lendo o texto.

| # | Onde quebrou | Correção aplicada |
|---|---|---|
| 4 | Zelador aceitava "acho que sim" como confirmação de item crítico — a instrução original mirava só a IA não assumir sozinha, não cobria resposta humana ambígua | `zelador/SKILL.md`: resposta vaga do aluno → pede confirmação concreta ("que ícone/número aparece"), não registra `true` |
| 5 | Briefista não tinha instrução explícita pra quando o aluno pede pra "chutar" o nível de consciência sob pressão de tempo — na simulação segurou por interpretação razoável, não por regra escrita | `briefista/SKILL.md`: seção nova "se o aluno pedir pra chutar" com resposta padrão que preserva a decisão como humana |
| 6 | **Estruturador não tinha piso mínimo de verba (R$20/dia)** — essa regra existia no `aula3-trafego-estrutura.md` original e não sobreviveu à destilação. Sem correção, configuraria R$15/dia sem questionar | `estruturador/SKILL.md`: piso de R$20/dia adicionado ao default sagrado + regra de "não fazer" |

O contrato "não-inferir" do Leitor e a "ordem de prioridade dos sinais" do Diagnosticador (corrigidos na rodada 1) foram testados sob pressão nesta rodada — pedido explícito de estimar CPA cruzando com outra conta (recusado corretamente) e um caso mais difícil de sinais conflitantes (CTR ruim + CPA ruim simultâneos) — e seguraram sem precisar de ajuste novo.

O achado #6 é qualitativamente diferente dos outros: não é ambiguidade de instrução, é conteúdo do PRD que se perdeu na destilação do agente original pra skill. Vale conferir as outras 4 skills contra os artefatos-fonte (`PRD-A3-trafego-v1.md`, `aula3-trafego-estrutura.md`) procurando por outros números/regras que possam ter ficado pra trás do mesmo jeito.

## O que este teste NÃO valida (continua P0 humano)

- Comportamento real do modelo *executando* a skill dentro do Claude Code (isto foi uma simulação em texto, seguindo as regras escritas — não uma invocação real de `/zelador` etc.)
- Dados de uma conta Meta real, com as inconsistências de UI/API que só aparecem na prática (nomes de coluna, exports em formatos diferentes, fuso horário)
- Reação do squad a um aluno que cola dados em formato bagunçado (não em bloco de campos nomeados como assumido aqui)
- Timing real dentro das 4h da aula (isto testou lógica, não relógio)

Continua valendo o que o roundtable marcou como RA-1: sem rodar contra 1-3 casos reais numa conta Meta de verdade, o "uau" da aula é uma aposta, não um fato.
