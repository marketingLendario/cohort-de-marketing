# Squad de Tráfego Lendár[IA] — Aula 3 (Tráfego)

Cinco skills do Claude Code que, juntas, formam o seu squad de agentes de tráfego pago. Você não pede uma coisa por vez num chat — você orquestra um time com papéis, sobre os SEUS números, e fica no comando das decisões.

## Os 5 papéis

| Ordem | Skill | O que faz |
|---|---|---|
| 1º | `zelador` | Checa a saúde da sua conta/tracking (roda **primeiro**, sempre) |
| 2º | `briefista` | Gera a bateria de criativos a partir dos ângulos da Aula 2 |
| 3º | `estruturador` | Monta a campanha no "default sagrado" (Vendas, não Impulsionar) |
| 4º | `leitor-de-metricas` | Traduz o que o gerenciador realmente diz (com dados reais colados por você) |
| 5º | `diagnosticador` | Aponta 1 alavanca por vez pra você decidir |

## A regra de ouro (não muda, em nenhuma das 5)

**O squad prepara e recomenda. Quem aprova, decide e sobe é sempre você.** Nenhum agente publica campanha, sobe verba ou muda público sozinho — o gatilho é sempre seu.

## Como instalar (Claude Code)

1. Instale o [Claude Code](https://claude.com/claude-code) se ainda não tiver.
2. Copie as 5 pastas (`briefista/`, `estruturador/`, `leitor-de-metricas/`, `diagnosticador/`, `zelador/`) para dentro de `.claude/skills/` no seu projeto — ou em `~/.claude/skills/` se quiser usar em qualquer projeto.
3. Copie `painel-da-semana-tmpl.yaml` para a raiz do seu projeto de tráfego e renomeie para `PAINEL-DA-SEMANA.yaml`. Esse arquivo é a memória compartilhada do squad — cada skill lê e escreve nele.
4. No Claude Code, invoque cada skill digitando `/zelador`, `/briefista`, `/estruturador`, `/leitor-de-metricas` ou `/diagnosticador`.

## Contrato dos artefatos

- Cada caminho representa um único arquivo relativo à raiz do projeto. A interface aceita caminhos antigos prefixados por `projetos/{slug}/` e os normaliza antes de gravar.
- Quando uma skill preencher várias seções do `PAINEL-DA-SEMANA.yaml`, devolva um único artefato para esse caminho, com todas as seções no mesmo conteúdo. A interface também consolida blocos repetidos do mesmo caminho e formato como proteção de compatibilidade.
- O mesmo caminho em formatos diferentes é ambíguo e deve ser corrigido antes da aprovação; a revisão rejeita esse caso.

## A ordem de uso na Aula 3 (ao vivo)

```
1. /zelador                → confirma saúde da conta antes de tudo
2. /briefista               → gera e você cura os criativos
3. /estruturador             → monta a campanha pronta pra você publicar
4. (você publica manualmente no Gerenciador de Anúncios da Meta)
```

## A rotina semanal (o que fica depois da aula)

```
SEG  /briefista       → gera novo lote de criativos
TER  /estruturador     → prepara ajuste → você aprova e sobe
QUI  /leitor-de-metricas → você cola os dados do gerenciador, ele traduz
SEX  /diagnosticador    → aponta 1 alavanca → você decide
```

Cada toque lê e escreve no `PAINEL-DA-SEMANA.yaml` — é o que faz isso ser um squad com memória, não 5 prompts soltos.

## Estado de validação

O piloto E2E local de 10/07/2026 passou com as cinco skills pela interface, Supabase real, revisão humana, reload, retry, reconciliação DB/filesystem e verificação visual desktop/mobile. A campanha permaneceu `draft` e nenhuma publicação, pausa ou alteração foi enviada à Meta. Isso valida o runtime local do squad; não substitui um teste com credenciais e uma conta Meta real.

## Amostra pequena na primeira semana

Com R$30/dia × 7 dias você terá poucas conversões (3-7). Isso é normal — o Leitor vai te dizer "amostra insuficiente para CPA" e focar em sinais de topo (CTR, CPM). Não julgue a campanha pelo CPA ainda.

---

*Squad de Tráfego Lendár[IA] · Aula 3 (Tráfego) · Cohort 1 — Marketing de Receita com IA · Academia Lendária.*
*Construído a partir de `squads/aiox-ads/` (Sinkra Hub, AIOX) — piloto local E2E validado; publicação real na Meta permanece fora do escopo.*
