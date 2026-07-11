# Relatório de piloto E2E — Squad de Tráfego

Story: **8.W3.1**

Base: `4f05847f6d172cadf2e83befe69fed0d74d55f6c`

Execução: 2026-07-10T18:04:18.579Z → 2026-07-10T18:08:40.719Z

Fixture: `story-8-w3-1-traffic-pilot` (workspace `81000000-0000-0000-0000-000000000031`, projeto `82000000-0000-0000-0000-000000000031`, campanha `84000000-0000-0000-0000-000000000031`)

## Resultado executivo

- Fixture Supabase real, sem demo auth: **PASS**.
- Meta não mutada: **PASS**; campanha permaneceu `draft`, etapa 1.
- Cinco skills executadas pela interface e materializadas após revisão humana: **PASS**.
- Retomada após reload: **PASS**.
- Evidência visual desktop/mobile no mesmo estado: **PASS**.

## Tempos, jobs, decisões e hashes

| Skill | Run DB | Tempo | Status | Decisões outbox | Artefatos / hash DB |
|---|---|---:|---|---|---|
| zelador | 864a3099-708c-44dc-adb6-cda26aadc26d | 38721 ms | done | approve/done | trafficTrackingAudit.yaml: ce971ef13845f4d8783b736150203f6f6f37468538d0d1cec8aa5adcd9794810 |
| briefista | 0e416a17-f9d5-423e-bd40-9703ce10efe4 | 60422 ms | done | approve/done | briefista.bateria_gerada.yaml: 3830bb5306dfa0ece57ba0dfaa6a580bc95039d94fd037012a407a22c035871f<br>briefista.curadoria_pendente.yaml: 4440257257e34066984935914da0e0d2148548101c7da3381e4455dd462833a9 |
| estruturador | 02bcdfae-39b6-448e-bd9c-7447da52bcec | 27054 ms | done | approve/done | generated/estruturador/02bcdfae-39b6-448e-bd9c-7447da52bcec.yaml: 63b3f7995c2f192b917a3cb8c3a3c6285c1e2b7fd66855e472e9bbaf45fe3a42 |
| leitor-de-metricas | ede3a322-d190-4f10-8b50-da45d732c34a | 45175 ms | done | approve/done | generated/leitor-de-metricas/trafficMetricReading.yaml: 12945a3ff809dc4d28506a0f583847e5a2f26381290052aa915df5a414b1522e |
| diagnosticador | 6d3bdfa2-b61e-4cb4-97e1-9a5cd4a3529a | 38813 ms | done | approve/done | generated/diagnosticador/trafficDiagnosis.yaml: e954571e1a05afa1f12f67114fb57cd2a3d4576f9f3c4e2a1dda81ba4906cc9e |

O hash de proposta é o agregado canônico gravado no run/outbox. Os hashes de arquivo acima são reconciliados durante o E2E com o SHA-256 do conteúdo materializado no filesystem. O JSON preserva os paths e os jobs duráveis, incluindo tentativas, steps e logs.

## Retomada, retry e recusas

| Checkpoint | Momento | Hidratação |
|---|---|---|
| Zelador crítico pronto para revisão | 2026-07-10T18:04:54.439Z | sim |
| recusa do Zelador persistida | 2026-07-10T18:04:56.861Z | sim |
| após recusa e retry do Zelador | 2026-07-10T18:05:00.513Z | sim |
| Zelador pronto para revisão | 2026-07-10T18:05:36.581Z | sim |
| Zelador materializado | 2026-07-10T18:05:41.570Z | sim |
| Briefista pronto para revisão | 2026-07-10T18:06:39.651Z | sim |
| Briefista materializado | 2026-07-10T18:06:43.695Z | sim |
| Estruturador pronto para revisão | 2026-07-10T18:07:09.005Z | sim |
| Estruturador materializado | 2026-07-10T18:07:12.319Z | sim |
| Leitor de Metricas pronto para revisão | 2026-07-10T18:07:55.045Z | sim |
| Leitor materializado | 2026-07-10T18:07:59.127Z | sim |
| Diagnosticador pronto para revisão | 2026-07-10T18:08:36.228Z | sim |

- Recusa honesta: registrada — o Zelador foi recusado quando CAPI/deduplicação não estavam confirmadas; nenhum arquivo foi materializado para essa decisão.
- Retry: registrado para o job 10358cb1-c60a-4d5f-a87b-672a64e223ec, tentativa 2, seguido de cancelamento controlado.
- Guardas: token no BFF, Codex em `read-only`, revisão humana obrigatória e campanha recommend-only.

## Métricas e diagnóstico

O operador forneceu ao Leitor apenas valores nomeados: gasto, impressões, cliques, conversões, CPA do gerenciador e ROAS do gerenciador. Métricas marcadas como **Não fornecido** no artefato: **CTR, Alcance, Frequência, CPM**; a janela de atribuição também ficou ausente e o ROAS sem venda confirmada ficou **Estimado** com premissa. O E2E rejeita qualquer valor calculado para essas métricas e confirmou **zero derivações** no Diagnosticador. A saída final trouxe uma única alavanca, hipótese, critério de sucesso, critério de reversão e decisão humana de aprovação via outbox.

## Evidência visual

- Desktop: [traffic-pilot-desktop.png](../../apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-desktop.png) — 1280×900, estado final do Diagnosticador.
- Mobile: [traffic-pilot-mobile.png](../../apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-mobile.png) — 390×844, mesma revisão reidratada.
- Overlaps detectados: 0.
- Erros de console: 0.
- Falhas de rede: 0.

## Lacunas e limites honestos

- A campanha fixture é um registro local real em Supabase e permaneceu em `draft`; o E2E não acessa credenciais Meta nem simula publicação.
- Os arquivos de evidência são regeneráveis executando a spec e este script; o workspace e o projeto fixture são removidos no teardown.
- IDs de runs/jobs, timestamps e hashes mudam por execução; tenant, projeto, campanha e conteúdo de entrada são determinísticos.

## Paths observados

- Projeto filesystem: `/Users/rafaelcosta/Projects/cohort-de-marketing/projetos/story-8-w3-1-traffic-pilot` (temporário, removido no teardown).
- Evidência JSON: `/Users/rafaelcosta/Projects/cohort-de-marketing/apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/run.json`.
- Screenshots: `/Users/rafaelcosta/Projects/cohort-de-marketing/apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-desktop.png` e `/Users/rafaelcosta/Projects/cohort-de-marketing/apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/traffic-pilot-mobile.png`.

Gerado por `scripts/traffic-pilot-report.mjs`; sem commit nesta execução.
