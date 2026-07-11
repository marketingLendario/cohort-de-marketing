# Cohort de Marketing — Aula 03

> **Academia Lendária · Squad de Tráfego**
>
> Tráfego pago, leitura de métricas e decisão semanal com evidência

Bem-vinda ao material da **Aula 03 do Cohort de Marketing**. Esta aula transforma a fundação da Aula 02 em uma operação de mídia paga que prepara campanhas, lê sinais observados e recomenda uma próxima alavanca sem publicar ou alterar campanhas automaticamente.

## Comece por aqui

1. Confira o handoff da [Aula 02](./docs/conexao-aula-02.md).
2. Abra o [guia visual da Aula 03](./aula-trafego-GUIA-ALUNO.html).
3. Consulte os [manuais e mapas navegáveis](./materiais/README.md).
4. Leia o [fluxo da aula](./docs/fluxo-da-aula-03.md).
5. Preencha o [briefing de tráfego](./templates/briefing-trafego.md).
6. Use o [Painel da Semana](./templates/PAINEL-DA-SEMANA.yaml) como registro operacional.

## O que você ganha na Aula 03

O squad principal tem cinco etapas, nesta ordem:

| Etapa | Skill | Entrega |
|---|---|---|
| 1 | `/zelador` | Auditoria de tracking, CAPI, deduplicação, domínio e pagamento |
| 2 | `/briefista` | Bateria de criativos e curadoria pendente de aprovação |
| 3 | `/estruturador` | Plano de campanha recommend-only |
| 4 | `/leitor-de-metricas` | Leitura literal dos números confirmados |
| 5 | `/diagnosticador` | Uma alavanca com hipótese, sucesso, reversão e circuit breaker |

`/ads-creative-factory` é uma capacidade de apoio para produzir os assets. Ela não substitui a curadoria humana nem muda a ordem do squad principal.

## Regra central

O squad prepara e recomenda. O operador humano confirma, aprova, decide e publica.

Nenhuma etapa desta aula deve publicar, pausar, escalar ou alterar uma campanha na Meta. Toda métrica precisa carregar sua origem e seu selo:

- `Real`: valor literal confirmado na fonte indicada;
- `Estimado`: valor da plataforma ou projeção com premissa explícita;
- `não fornecido`: campo ausente, que não pode ser inventado nem derivado.

## Como rodar localmente

Para abrir o Marketing Studio:

```bash
node scripts/marketing-studio.mjs start
```

Para usar o adapter Meta em modo de leitura, consulte [`services/meta-ads/README.md`](../services/meta-ads/README.md). As credenciais ficam fora do repositório, em arquivos `.env.{spoke}` locais.

## Onde ficam as fontes canônicas

Esta pasta organiza o material didático. O runtime permanece separado:

- skills: [`.claude/skills/`](../.claude/skills/);
- espelho para Codex: [`.agents/skills/`](../.agents/skills/);
- painel: [`apps/academia-lendaria-ads-studio/`](../apps/academia-lendaria-ads-studio/);
- adapter Meta: [`services/meta-ads/`](../services/meta-ads/);
- evidências técnicas: [`docs/qa/`](../docs/qa/);
- histórias e gates: [`docs/stories/`](../docs/stories/).

## Materiais complementares

Os manuais, o mapa de skills e o pacote navegável de briefing ficam em [`materiais/`](./materiais/). O Ads Studio está disponível em [`ads-studio/`](./ads-studio/) como snapshot local sem dependências instaladas nem evidências geradas; a fonte canônica continua em [`apps/academia-lendaria-ads-studio/`](../apps/academia-lendaria-ads-studio/).

As dependências desses dois pacotes estão descritas em [`docs/mapa-skills-dependencias.md`](./docs/mapa-skills-dependencias.md) e [`docs/ads-studio-dependencias.md`](./docs/ads-studio-dependencias.md).

## Próxima aula

O handoff para a Aula 04 está descrito em [`docs/conexao-aula-04.md`](./docs/conexao-aula-04.md). A Aula 04 parte do histórico semanal, dos eventos de tracking e das decisões registradas, não de uma reinterpretação informal dos anúncios.
