---
name: retroalimentacao
description: Etapa 4 do Squad de Dados (Aula 4) — fecha o loop do método O.F.T.R. devolvendo os dados reais para o início do funil. Gera o retroalimentacao.md com quem os anúncios alcançam (idade/gênero/UF), o que vende (produtos/ticket), como o público fala (temas e citações sem autor), objeções reais para a copy e melhores janelas — insumo direto para o /avatar-funil (Aula 1) e o /copy-funil + offerbook (Aula 2). Use quando o aluno pedir para atualizar o avatar/copy com os dados, quiser saber o que os números ensinam sobre o cliente, ou depois de qualquer rodada de coleta+board.
---

# Retroalimentação — Squad de Dados Lendár[IA] (etapa 4)

Você devolve os aprendizados da campanha para onde eles valem dinheiro: o **avatar** (Aula 1) e a **oferta/copy** (Aula 2). Insumo: `bundle.json` (+ `board.json` para a síntese). É INSUMO — você não reescreve avatar nem copy por conta própria; a skill de destino lê o arquivo com o aluno no comando.

## Gerar

```bash
node scripts/retroalimentacao.mjs \
  --dados=projetos/{slug}/dados-trafego/bundle.json \
  --board=projetos/{slug}/dados-trafego/board.json \
  --saida=projetos/{slug}/dados-trafego/retroalimentacao.md
```

O arquivo sai estruturado por destino, cada achado com selo:

- **→ Aula 1 (avatar & nicho):** faixa etária/gênero dominantes, top UFs [Real], como o público fala (temas da leitura por IA) — com o aviso honesto: audiência PAGA ≠ comprador; validar contra a base antes de mudar o avatar.
- **→ Aula 2 (oferta & copy):** ticket médio e produtos que puxam receita [Real, caixa], **prova social real** (citações de comentários, sem autor) e a **objeção real** a endereçar.
- **→ Tráfego (Aulas 3/4):** melhores janelas de CTR [Calculado, amostra ≥500 impr], campanha destaque, teto de ROAS com a % de rastreio (e o empurrão para UTM/SCK).
- **Síntese do board** ao final, quando houver.

## Entregar apontando o uso

Mostre o arquivo e diga o caminho concreto: "leve para o `/avatar-funil` revisar o avatar com a demografia e a linguagem" e/ou "o `/copy-funil`/offerbook usa a prova social e responde a objeção X". Para o ciclo completo realizado×planejado (7/30 dias), o **`/gestor-de-campanhas`** roda este mesmo script ao final — não duplique.

## Não fazer

- Não editar avatar/copy diretamente — insumo, não execução.
- Não incluir PII (o script já não inclui; não adicione à mão).
- Não vestir audiência paga de "perfil do comprador" — o aviso fica no arquivo e na sua fala.

---

*Squad de Dados Lendár[IA] · Aula 4 · Academia Lendária. Script: `scripts/retroalimentacao.mjs`. Fecha o O.F.T.R.: Dados → Oferta/Avatar.*
