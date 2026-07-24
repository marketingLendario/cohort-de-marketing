# Guias do Marketing Studio

> O Studio é o painel visual do método (`npm run studio` no repositório do Ads Studio).
> **Comece pelo guia completo:** [guia-studio-como-funciona.md](guia-studio-como-funciona.md) — tela por tela, lido direto do código do app: login, projetos, visão geral, artefatos, briefing (7 seções), jornada, campanhas (9 estágios com gates) e semanas (erros ST1–ST7).

## O mapa das telas (resumo — o detalhe está no guia)

| Tela/aba | O que cobre | Equivalente no chat |
|---|---|---|
| Login / Seus projetos | entrar (e-mail/senha ou demo local) e criar/abrir projetos | — |
| Visão geral | próximo passo recomendado, estado da jornada, artefatos recentes, prontidão de campanha | `/status-funil` |
| Artefatos | registro dos arquivos do projeto com verificação (Verificado/Pendente/Ausente) | os arquivos em `projetos/{slug}/` |
| Briefing | as 7 seções (Projeto · Mercado · Oferta · Marca · Funil · Canais · Dados) + Revisão, com validação e progresso | os artefatos das Aulas 1–2 |
| Jornada | rodar as skills etapa a etapa, com proposta → aprovação humana | as skills, na ordem do método |
| Campanhas | os 9 estágios com trava: fundamentos → Zelador → briefista → curadoria → estrutura → criativos → **subida manual** → leitura → alavanca | `/zelador` → `/briefista` → `/estruturador` → `/criativos-funil` |
| Semanas | o Painel da Semana visual: métricas com selo, diagnóstico com alavanca única, histórico append-only, import/export do YAML | `/leitor-de-metricas` + `/diagnosticador` |
