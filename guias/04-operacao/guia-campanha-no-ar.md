# GUIA — Colocar a campanha NO AR

> **Estou perdido em:** "tenho os criativos, e agora? Como isso vira uma campanha rodando na Meta?"
> **O caminho simples deste guia:** zelador → estruturador → subir no Gerenciador pelo default sagrado → publicar pausado → revisar → ativar. Sem API é 100% possível (Modo Manual); com API o estruturador faz por você em 3 gates.
> **O que você vai ter no final:** a campanha do default sagrado criada no Gerenciador — revisada PAUSADA (custo R$0) e ativada só por decisão sua — com a subida registrada no `PAINEL-DA-SEMANA.yaml`.
> **Fontes cruzadas:** `scripts/estruturador-publish.mjs` + SKILL.md do `/zelador` e do `/estruturador` (código real) · super-guia Parte D (repo) · referências de mercado reescritas (o default sagrado sai CONFIRMADO: objetivo Vendas, lance automático, estrutura simples) · pesquisa web 22/07 (análise travada, conta restrita — Central de Ajuda da Meta e blogs de tráfego BR).

## Pré-requisitos (confira ANTES)

| Tipo | Pré-requisito | Não tem? Faça isso |
|---|---|---|
| 📖 Conhecimento | Você conhece o Gerenciador (status, colunas, toggle) e os termos do tráfego | leia [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md) e [guia-conceitos](../02-conhecimento-minimo/guia-conceitos-trafego.md) |
| 🔑 Conta | Fundação Meta pronta: BM + Página + conta de anúncios + **pagamento sem aviso vermelho** | siga [guia-meta-fundacao](../03-conexoes-e-apis/guia-meta-fundacao.md) |
| 🔑 Conta | Pixel criado e disparando, CAPI ligada via Hotmart | siga [guia-pixel-capi.md](../03-conexoes-e-apis/guia-pixel-capi.md) |
| 📄 Artefato | 2–3 criativos aprovados em `projetos/{slug}/criativos/banners/` | rode `/briefista` + `/criativos-funil` ([guia-criativos.md](guia-criativos.md)) |
| 📄 Artefato | Ângulos com **nível de consciência** carimbado (o briefista/estruturador recusam sem) | rode `/metodo-funil` (Aula 2) |
| 📄 Artefato | Link de destino COM rastreio (checkout com `?sck=meta-c1-frio` ou página com UTM) e página PUBLICADA na internet | página local não vale; publique antes |

## Passo 1 — `/zelador` (o porteiro; não pule)

Rode `/zelador`. Ele audita: conta ativa, pixel disparando, CAPI, deduplicação, pagamento, domínio.
- **Com** `META_ACCESS_TOKEN` no `.env` → audita quase tudo sozinho pela API; **deduplicação e domínio verificado ele confirma com você na tela** (a API não enxerga esses dois).
- **Sem** → checklist manual: ele pergunta, você confirma olhando a tela do Gerenciador (só marque "sim" com evidência).
- Deu **CRÍTICO** → conserte o item apontado antes de seguir (o estruturador bloqueia de propósito).
- **Vai publicar via API no passo 2?** Rode o zelador com `--testar-escrita` — é isso que libera o Modo API do estruturador (`api_escrita_habilitada: true`).

## Passo 2 — `/estruturador` (monta a campanha)

Rode `/estruturador`. Ele pergunta a temperatura (responda **frio**, o caminho simples) e monta no **default sagrado**:

| Campo | Valor (não mude na 1ª campanha) |
|---|---|
| Estrutura | 1 campanha → 1 conjunto → seus 2–3 criativos |
| Objetivo | **Vendas** (ou Cadastro) — nunca "Impulsionar" |
| Otimização | Conversão → evento **Comprar** (ou Lead) do SEU pixel |
| Público | amplo/frio + Advantage+ · no máx. 1 interesse |
| Posicionamento | Advantage+ automático |
| Verba | **R$ 30/dia × 7 dias** (com fim programado) |

- **Com API**: ele publica em 3 gates — você aprova a estrutura → ele cria TUDO PAUSADO → só ativa com sua ordem explícita. Confira no Gerenciador entre o gate 2 e o 3.
- **Sem API**: ele te entrega a configuração campo a campo → você replica no Gerenciador (passo 3).

> Duas ansiedades comuns que você pode soltar: (1) produto de gênero/idade muito específicos? O Advantage+ pode abrir o público além do seu nicho — mesmo assim, na 1ª campanha fique no default e deixe essa discussão pro `/diagnosticador` COM dados; (2) "sobreposição de público" é irrelevante em verba de teste (R$30/dia) — referência de mercado.

## Passo 3 — Subir no Gerenciador (Modo Manual, clique a clique)

O tela-a-tela completo (23 passos: campanha → conjunto → anúncio → publicar) está no **[super-guia, Parte D.3](../03-conexoes-e-apis/super-guia-apis-e-ads.md)**. O resumo dos pontos onde todo mundo erra:

1. `adsmanager.facebook.com` → **+ Criar** → objetivo **Vendas** → configuração **manual**.
2. Orçamento **no conjunto** (R$ 30/dia) — com 1 conjunto só, tanto faz na prática, mas é assim que o Modo API do estruturador cria; se o Gerenciador te empurrar o "orçamento da campanha (Advantage/CBO)", desligue e defina no conjunto. Término em 7 dias.
3. No conjunto: Conversão → Site → SEU pixel → evento **Comprar**. ⚠️ Evento cinza = pixel nunca registrou → volte ao trackeamento.
4. Público: aceite o Advantage+. Brasil, idade no padrão (deixe amplo — o default sagrado não restringe idade). **Não empilhe interesses.**
5. Anúncio: sua Página + Instagram → "Imagem ou vídeo único" → suba o PNG → texto = copy do finalista → CTA → **URL com rastreio**.
6. Duplique o anúncio para o 2º e 3º criativos (troque só mídia/copy).
7. **Publicar** → e **PAUSE imediatamente** (toggle azul ao lado do nome).

## Passo 4 — Revisão final e ativação

Com tudo criado e PAUSADO, confira esta lista (2 min):
- [ ] Objetivo Vendas/Cadastro (não Impulsionar)
- [ ] Evento de conversão = o do SEU pixel
- [ ] 1 conjunto só, 2–3 anúncios dentro
- [ ] R$ 30/dia com término em 7 dias
- [ ] URL de destino **abre**, é a página/checkout **certo** e tem o `sck`/UTM — revise o link caractere a caractere: link de checkout errado é o jeito mais caro de errar (referência de mercado: "perdemos 5 dígitos por não revisar")
- [ ] Preview ok em Feed, Story e Reels

Tudo ✅ → **ative** (toggle azul). A campanha entra "Em análise" (minutos a ~24 h; a Meta revisa também a página de destino) e começa a rodar. Travou "Em análise" por mais de ~2 dias úteis, ou a conta foi **restrita** ao publicar? → G5/G9 do [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md).

## Teste de sucesso

Abra `adsmanager.facebook.com` → aba Campanhas: a sua campanha aparece com **1 conjunto e 2–3 anúncios** dentro, status **Pausado** (antes da ativação) ou **Em análise/Ativo** (depois) — e o checklist do Passo 4 está 100% ✅. Não aparece? Erro G1 do [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md) (conta errada, filtro ou período).

## Registre (1 min — é o que a Aula 4 vai usar)

No `PAINEL-DA-SEMANA.yaml` do seu projeto: data da subida, verba, criativos, **critério de sucesso** (ex.: ≥1 venda ou CPA ≤ R$X em 7 dias) e **critério de reversão** (ex.: R$210 gastos sem venda = pausa).

## Pronto. Próximos passos

| Agora | O quê |
|---|---|
| ▶️ Fazer | registre no `PAINEL-DA-SEMANA.yaml` (seção acima) — 1 min agora poupa a semana inteira; e anote no calendário o DIA 7 (o ritual) |
| 📖 Ler | **[guia-e-depois.md](guia-e-depois.md)** (spoiler: o próximo passo é NÃO mexer por 7 dias) |
| 🚑 Se travar | anúncio rejeitado / "em análise" eterno / conta restrita / pagamento → catálogo G1–G9 do [guia-gerenciador](../02-conhecimento-minimo/guia-gerenciador-de-anuncios.md) |
