# Perfil do Projeto — regra compartilhada (toda skill lê ANTES de gerar)

> Referenciado por todas as SKILL.md. O Perfil é gravado no topo do `projetos/{slug}/offerbook.md` pela skill `/offerbook`. Se ele existir, LEIA e obedeça; se não existir, use o padrão e siga (nunca trave).

Ao rodar qualquer peça, leia o **Perfil do Projeto** (topo do offerbook) e adapte. NUNCA assuma "infoproduto de especialista" por padrão.

```
## Perfil do Projeto
- Situação de partida: [rodando | do-zero | sem-projeto | afiliado]
- Tipo de oferta: [especialista | físico/varejo-local | saas-app | serviço | b2b]
- Quem opera: [dono | agência]
- Nicho regulado: [não | saúde/médico | jurídico | psico | financeiro]
- Voz: [pessoa | marca]
- Ticket: [baixo | médio | alto(5k+) | premium]
- Destino do fechamento: [venda-direta | reunião]
```

**Como cada campo muda a peça:**

- **Situação = afiliado** → não há offerbook próprio: a peça se apoia na **oferta do produtor** (produto, promessa, comissão, página oficial). Foco em pré-venda/criativo/página-ponte, sem back-end próprio.
- **Situação = sem-projeto** → PARE e aponte `/avatar-funil` (research-first). Não dá pra montar peça sem oferta.
- **Tipo = físico/varejo-local** → marketing **local/regional** (Google Perfil/Maps, WhatsApp, promoção/oferta local, captação no ponto). Não force quiz→checkout online.
- **Tipo = saas-app** → prova = **voz do cliente + caso de uso**; funil de trial/demo. Nunca depoimento de aluno.
- **Tipo = serviço / b2b** → **NÃO force venda emocional de infoproduto**: business case / ROI / autoridade / case; fechamento por **reunião** (não checkout, não e-mail direto pra comprar).
- **Quem opera = agência** → a voz e a oferta são do **CLIENTE**, não do operador; 1 cliente = 1 projeto/pasta; ofereça "versão cliente" (sem bastidor) no fecho. **Agência: rode a Aula 1 de cada cliente já pensando no projeto dele — ao terminar o cliente N, migre o pack pra `projetos/{cliente}/` (o `/metodo-funil` faz essa migração) ANTES de começar a Aula 1 do próximo, senão os arquivos da raiz de um cliente se misturam com os do outro.**
- **Nicho regulado** → linguagem de possibilidade + regras do conselho (CFM/OAB/psico/financeiro); nada de "cura/garantido"; em saúde, triagem de risco antes de captar.
- **Voz = marca** → calibre no `copy.md`/`DESIGN.md` (+ voz do cliente), NUNCA em enquadramento de especialista/rosto. É válido mesmo quando existe um especialista.
- **Ticket** → baixo → venda direta (VSL/quiz/checkout); alto(5k+)/B2B → webinário/quiz → **marcar reunião**.
- **Destino do fechamento** → é onde o funil termina: **venda-direta** (checkout/Pix/cartão) ou **reunião** (agendamento/qualificação). Esse campo é **decidido nas skills de peça** — o `/quiz-funil` e o `/webinario-funil` perguntam e gravam a escolha aqui no offerbook. As skills de `/recuperacao-funil`, `/cro-funil` e `/status-funil` **LEEM daqui** pra não empurrar checkout onde o certo é agendar reunião (nem o contrário).

**Guard (regra dura):** se **Voz = marca** ou **Tipo ∈ {físico, saas-app, serviço, b2b}**, é **PROIBIDO** usar enquadramento de "especialista/curso/mentoria" e "depoimento de aluno" como padrão. Use voz do cliente / prova de uso / case. O default histórico "curso de especialista" só vale quando Tipo = especialista.

**Exceção do guard — autoridade profissional habilitada:** serviço prestado por profissional habilitado (médico, advogado, psicólogo, nutricionista, dentista) USA a credencial dele (nome + registro no conselho — CRM, OAB, CRP etc.). O que o guard proíbe é o **enquadramento** de curso/mentoria/"depoimento-de-aluno"; não a autoridade profissional real. Um médico anunciando o consultório dele cita o CRM — isso é permitido e obrigatório; o proibido é vendê-lo como "professor de um método com alunos".
