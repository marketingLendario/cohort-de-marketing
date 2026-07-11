# Nunca travar / nivelamento — regra compartilhada (toda skill obedece)

> Referenciado por todas as SKILL.md. A turma vai do leigo total (zero terminal, zero marketing) ao dev avançado. A skill tem que segurar a mão do leigo SEM atrapalhar o avançado.

**1. Pré-requisito faltando = instrução em português de gente, nunca beco.** Nunca só "rode /offerbook". Diga o que é, por que precisa e o comando exato: *"Você ainda não tem o offerbook (é o Livro da Oferta, última etapa da Aula 1). Rode `/offerbook` e volte."* Sempre um próximo passo claro.

**2. Ferramenta faltando = oferecer instalação em 1 linha (perguntar antes) + fallback.** Nunca falhar em silêncio. Ex.: sem Chrome pro PDF → "entrego md+html, abra o .html e imprima em PDF".

**3. Apify é central (espião/trend/conteúdo/criativos), NÃO opcional.** É **API REST direta** (chave no `.env`), NÃO é MCP — nada de instalar servidor nem reiniciar. O que muda pro leigo é o SETUP: se faltar a chave, pare e ajude a configurar (pegar no console → salvar no `.env` como `APIFY_API_TOKEN`, o nome oficial; `APIFY_API_KEY` também é aceito — o check procura os dois), não siga cego. Fallback (WebSearch/manual) só quando o Apify **realmente falha** (cota mensal estourada): avise "cota do Apify estourou, sigo por [fallback] e retomo quando renovar". Nunca "pular Apify" por padrão.

**4. Nunca prometer que o HTML abre sozinho.** Sempre imprima o **caminho absoluto do arquivo** + como abrir no SO do aluno (macOS `open`, Windows `start ""`, Linux `xdg-open`, ou 2 cliques). Resolve o leigo E o Codex (onde não abre sozinho) de uma vez. Detecte o SO; nunca assuma macOS.

**5. Glossário inline.** Na 1ª vez que usar um termo técnico (verbatim, ICP, gate, stack, arquétipo), explique em 4 palavras entre parênteses. "Zero verbatim" nunca sai como status seco: vira instrução — *"não achei frases exatas do cliente na rede; me manda prints/reviews que eu uso"*.

**6. Não infantilizar o avançado.** As explicações extras são curtas e entre parênteses; quem já sabe passa reto. O leigo lê, o dev ignora.

---

## Custo, modelo e sessão (o aluno nunca paga caro à toa nem perde trabalho)

**A. Roda bem em Sonnet.** As skills são **roteiros determinísticos** — o passo a passo já está escrito, o modelo só executa. Não precisa de Opus pra tudo: **Sonnet dá conta** da grande maioria das skills, mais barato e rápido. (Se uma peça pedir raciocínio mais pesado, a própria skill avisa.) Nunca use Fable pra *rodar* skill — Fable é pra revisão/análise, não pra execução.

**B. Avise antes de rodada pesada.** Antes de disparar coleta + geração nos 3 formatos (md + html + pdf) de vários entregáveis de uma vez, avise o aluno em 1 linha que **isso consome bastante** (tempo e crédito) e **ofereça fazer por partes** (ex.: coletar primeiro, gerar depois; ou um entregável de cada vez). Quem topa o pacote cheio, segue; quem prefere ir devagar, escolhe.

**C. Regra de sessão — o estado são os ARQUIVOS, não o chat.** Toda skill **retoma do que está salvo em `projetos/{slug}/`**, nunca do histórico da conversa. Ou seja: o aluno pode **fechar ou limpar a conversa entre uma skill e outra sem perder nada** — os entregáveis no disco são o estado do funil. Pra voltar depois: abrir o Claude na pasta do projeto e rodar a próxima skill (ou usar `claude --continue` / `claude --resume` se quiser retomar aquela mesma conversa). Nunca diga ao aluno que ele "vai perder o progresso" se fechar o chat — não vai.

**Trocou de projeto/cliente no meio da conversa?** Refaça a descoberta de projeto, RELEIA o Perfil do novo offerbook do zero (nunca reaproveite voz, decisões, tom ou nicho do projeto anterior — cada cliente é outro negócio) e prefira **UMA CONVERSA POR CLIENTE/FUNIL**. Misturar dois clientes na mesma conversa é a receita pra vazar a voz de um no material do outro.
