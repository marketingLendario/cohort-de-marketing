import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import {
  appRoot,
  createDocumentPackV2Fixture,
  repoRoot,
} from './fixtures/document-pack-v2/fixture.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const controlledCodexPath = resolve(__dirname, 'fixtures/document-pack-v2/controlled-codex.mjs');
const contractsFile = JSON.parse(await readFile(resolve(repoRoot, 'data/document-pack-contracts.json'), 'utf8'));
const excludedV1Skills = new Set(['offerbook', 'copy-funil', 'pagina-vendas-funil']);
const realCodex = process.env.DOCUMENT_PACK_V2_REAL === 'true';
const requestedReasoningEffort = process.env.DOCUMENT_PACK_V2_REASONING_EFFORT ?? 'medium';
assert.ok(['low', 'medium', 'high'].includes(requestedReasoningEffort), 'DOCUMENT_PACK_V2_REASONING_EFFORT inválido.');
const requestedSkills = new Set((process.env.DOCUMENT_PACK_V2_SKILLS ?? '').split(',').map((value) => value.trim()).filter(Boolean));
const designInputMode = process.env.DOCUMENT_PACK_V2_DESIGN_MODE === 'moodboard' ? 'moodboard' : 'url';
const designPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAG0lEQVR4nGMQssn8fzPW8j/D/////4uLi/8HAFCbCWVGYG/AAAAAAElFTkSuQmCC';
if (requestedSkills.has('design-md')) process.env.DOCUMENT_PACK_V2_SKIP_DESIGN_SOURCE = 'true';
const contracts = contractsFile.contracts.filter((contract) =>
  !excludedV1Skills.has(contract.skillId) && (requestedSkills.size === 0 || requestedSkills.has(contract.skillId))
);
const skills = contracts.map((contract) => contract.skillId);
const researchSkills = new Set(['avatar-funil', 'espiao-do-concorrente', 'trend-hunting', 'conteudo-funil']);
const defaultOfflineMaterial = 'Marca Referencia: profissionais relatam falta de um processo consistente, pouco tempo e preferencia por orientacao objetiva. Fonte fornecida pelo operador, sem metricas publicas.';
const contentOfflineMaterial = [
  'Observacao 1 | URL nao obtida | Hook: Pare de recomecar toda segunda-feira | Estrutura: problema-processo | CTA: salve este roteiro | metrica nao obtida.',
  'Observacao 2 | URL nao obtida | Hook: O calendario nao e o problema | Estrutura: quebra de crenca | CTA: compare com sua rotina | metrica nao obtida.',
  'Observacao 3 | URL nao obtida | Hook: Tres sinais de operacao improvisada | Estrutura: lista diagnostica | CTA: marque o sinal atual | metrica nao obtida.',
  'Observacao 4 | URL nao obtida | Hook: Antes de criar mais uma peca | Estrutura: checklist | CTA: use o checklist | metrica nao obtida.',
  'Observacao 5 | URL nao obtida | Hook: Uma semana, um ciclo | Estrutura: passo a passo | CTA: teste por sete dias | metrica nao obtida.',
].join('\n');
const spokenMediaUrl = 'https://raw.githubusercontent.com/openai/whisper/main/tests/jfk.flac';
const trendOfflineMaterial = [
  'Fixture sintética E2E autorizada somente para pack demonstrativo; não representa desempenho nem tendência real.',
  ...Array.from({ length: 15 }, (_, index) => {
    const pattern = Math.floor(index / 3) + 1;
    const item = (index % 3) + 1;
    const day = String(9 - (index % 9)).padStart(2, '0');
    return `Padrão ${pattern} | publicação ${item} | URL: https://example.com/trend/${pattern}-${item} | plataforma: Twitter/X | data: 2026-07-${day} | texto literal: Variação fixture ${item} do padrão demonstrativo ${pattern} sobre processo e execução | métricas públicas: ${150 + index} curtidas, ${20 + item} comentários, ${12 + item} compartilhamentos.`;
  }),
].join('\n');
const offlineMaterialFor = (skillId) => skillId === 'conteudo-funil'
  ? contentOfflineMaterial
  : skillId === 'trend-hunting'
    ? trendOfflineMaterial
    : defaultOfflineMaterial;
assert.equal(contractsFile.schemaVersion, '2.0.0');
if (!realCodex && requestedSkills.size === 0) assert.equal(contracts.length, 18, `Esperava 18 document-packs v2; recebeu ${contracts.length}.`);
assert.ok(contracts.length > 0, 'Nenhum document-pack v2 foi selecionado.');

const OPERATOR_INPUT = Object.freeze({
  'design-md': 'Crie a identidade da Marca Fixture somente a partir da referência visual congelada. Sim, autorizo system-ui em display e body como substituição para esta fixture; registre em Known Gaps que as fontes originais não foram identificadas. Produza DESIGN.md Google-spec cujo frontmatter YAML contenha obrigatoriamente name: Marca Fixture, version: "1.0.0", ao menos quatro cores CSS e typography.display/body. Não invente logo, prova, pessoa ou história da marca.',
  'avatar-funil': 'Use somente o material literal congelado para produzir a pesquisa de avatar completa. Separe verbatims de inferencias, cubra as sete dimensoes e marque lacunas sem inventar.',
  'espiao-do-concorrente': 'Analise somente o concorrente Marca Referencia presente no material congelado. Produza o indice e um dossie completo em MD/HTML; nao atribua metricas, anuncios ou reputacao nao fornecidos.',
  'trend-hunting': 'O relatorio-avatar.md confirmado e o snapshot congelado sao os insumos autorizados. Apify configurado. Autorizo a coleta externa obrigatoria, já concluida pelo adapter e representada no snapshot; nao execute nova coleta fora dele. Autorizo explicitamente um pack demonstrativo baseado na fixture sintetica, sem alegações de tendência ou desempenho real. Nao incluir concorrentes especificos. Produza o radar, variacoes de teste e briefing do media buyer.',
  'conteudo-funil': 'Aprovo a pauta e uma amostra de carrossel para Instagram na voz da marca. Autorizo adaptar somente a estrutura retorica de contraste/inversao do transcript, sem atribuir a frase ou a fala a Marca Fixture. Autorizo fundo #FFFFFF, texto #000000, destaque #0B1F3A e fonte Arial somente para esta fixture. Produza os roteiros e um lote HTML autocontido com tres slides 1080x1350 marcados data-carousel-slide; o BFF renderizara PNG, galeria e ZIP. Nao invente metricas ou provas.',
  'metodo-funil': 'Aprovo quiz seguido de pagina de vendas e checkout como funil principal. Use o mecanismo Ciclo de Planejamento, Execucao e Revisao, publico frio e ticket de R$ 497. Produza o mapa completo para revisao; nao invente provas.',
  'vsl-funil': 'Aprovo uma VSL curta, direta e orientada ao checkout. Sim, autorizo reenquadrar a comunicação desta fixture para público Nível 5, ainda inconsciente do problema. Use a oferta, o mecanismo e os insumos confirmados. Produza documento, pagina e roteiro completos; marque provas ausentes como pendentes.',
  'advertorial-funil': 'Aprovo um segmento distinto Nível 5 e um advertorial de historia de descoberta para publico frio. Fato observável autorizado da fixture: “Eu termino o dia com tarefas importantes ainda abertas, mesmo tendo trabalhado o dia inteiro.” O CTA Conhecer o programa aponta para pagina/index.html; o checkout permanece destino final da página intermediária. Nao invente personagem, depoimento, pesquisa ou resultado factual.',
  'lancamento-funil': 'Aprovo lancamento semente com tres PLCs, abertura em 15/09/2026 e fechamento real do carrinho em 20/09/2026 às 23:59, fuso America/Sao_Paulo. Produza os roteiros completos e mantenha provas não confirmadas como pendentes; use apenas a janela real informada.',
  'webinario-funil': 'Sim, seguir com webinario apesar da prescricao atual. Segredos: Diagnostico, Plano e Rotina. Evento em 10/09/2026 às 20h, America/Sao_Paulo; inscricoes encerram nesse horario. A oferta fecha em 15/09/2026 às 23:59, America/Sao_Paulo. Nao haverá replay. Politica de privacidade: https://fixture.invalid/privacidade. Use copy.md e DESIGN.md confirmados. Destino final checkout. Produza registro, obrigado, roteiro e pagina de oferta; nao invente provas.',
  'quiz-funil': 'Aprovo quiz de maturidade operacional com captura antes do resultado e recomendacao do Programa Fixture. Produza o app autocontido com resultado persistido localmente e CTA de checkout.',
  'email-funil': 'Aprovo uma trilha minima completa de convite, nutricao e venda, incluindo assuntos, textos e CTA. {{first_name}} é o merge tag confirmado. Mencione apenas garantia de 30 dias conforme termos fornecidos; termos completos não foram fornecidos e a publicação fica bloqueada. O índice HTML deve conter <main> e links relativos somente para os arquivos HTML gerados. Use links confirmados da fixture, voz da marca e nenhuma prova ou urgencia inventada.',
  'whatsapp-funil': 'Aprovo uma sequencia minima por WhatsApp, em mensagens separadas e copiaveis, somente para os momentos detectados: confirmacao imediata do lead e recuperacao 30 minutos apos checkout_iniciado sem compra. O disparo e manual, o contato vem de trafego frio e a voz e da marca. Nao ha deteccao confirmada de evento, carrinho abandonado, cartao recusado ou boleto/pix; nao crie mensagens para esses momentos. Use somente o checkout https://fixture.invalid/checkout e fatos confirmados.',
  'recuperacao-funil': 'Aprovo recuperacao manual de checkout_iniciado sem compra, com uma sequencia minima e sem desconto ou escassez inventados. O sistema identifica somente checkout_iniciado e compra; nao distingue carrinho abandonado, cartao recusado, Pix ou boleto. Nao tenho canal de atendimento humano ou IA confirmado; nao invente link de atendimento. Confirmo o downsell Plano essencial autoguiado por R$ 197, mas a URL ainda nao foi definida: mantenha-o apenas como plano futuro, fora da cascata ativa. Nenhuma ferramenta de e-mail, WhatsApp ou automacao esta configurada; a operacao e manual.',
  'backend-funil': 'Aprovo upsell de Acompanhamento de implementacao por R$ 997 e downsell Plano essencial autoguiado por R$ 197. O downsell inclui o programa principal e o Checklist de execucao, em formato autoguiado, sem acompanhamento. Nao haverá order bump. As URLs de checkout e os IDs de tracking de upsell/downsell ainda nao existem: use [URL_CHECKOUT_UPSELL], [URL_CHECKOUT_DOWNSELL], [TRACKING_ID_UPSELL] e [TRACKING_ID_DOWNSELL]. Produza a arquitetura e as paginas sem inventar outros produtos, precos ou identificadores.',
  'cro-funil': 'Aprovo um plano de CRO pre-lancamento baseado em hipoteses, sem alegar metricas inexistentes. Priorize um teste por vez e inclua criterios de decisao.',
  'swipe-file': 'Aprovo catalogar uma única referência pública inicial a partir de dossie-alan-nicolas.md. A URL direta do LinkedIn foi verificada em 11/07/2026, a plataforma exibia aproximadamente 1 ano e 10 comentários. Classifique como promissor / referência observada, nunca como winner comprovado, pois não há conversão, investimento ou receita públicos. Extraia apenas o padrão de lista prática por benefício, sem copiar o texto e sem fingir coleta externa.',
  'bonus-funil': 'Aprovo a pauta e a amostra do bonus Checklist de execucao, unico bonus confirmado. Gere o checklist completo como amostra nos formatos fonte e HTML; nao crie outros bonus.',
});

function answerQuestion(skillId, question) {
  const normalized = question.toLowerCase();
  if (/responda (?:somente|apenas).*sim.*n[aã]o/.test(normalized)) return 'sim';
  if (/sim ou n[aã]o.*autoriza|autoriza.*sim ou n[aã]o/.test(normalized)) return 'sim';
  if (skillId === 'avatar-funil' && /trecho|frase literal|review|coment[aá]rio|20 a 50/.test(normalized)) {
    return Array.from({ length: 20 }, (_, index) => `Trecho fixture ${index + 1}: "Preciso de um processo claro para executar sem recomecar." Origem: material sintético do E2E.`).join('\n');
  }
  if (skillId === 'trend-hunting' && /sem relat[oó]rio de avatar|continuar.*avatar/.test(normalized)) return 's';
  if (skillId === 'trend-hunting' && /estado do apify|apify (?:configurado|n[aã]o configurado)|usando exatamente/.test(normalized)) return 'Apify configurado';
  if (skillId === 'trend-hunting' && /coleta obrigat[oó]ria|apify|twitter\/x/.test(normalized)) return 's';
  if (skillId === 'trend-hunting' && /concorrentes espec[ií]ficos/.test(normalized)) return 'não';
  if (skillId === 'trend-hunting' && /snapshot.*publica[cç][oõ]es|url, plataforma, data|anexar ou colar|amostra verific[aá]vel|5 a 10 padr[oõ]es/.test(normalized)) return `A) Autorizo um pack demonstrativo, sem alegações de tendência real.\n${trendOfflineMaterial}`;
  if (skillId === 'design-md' && /tipograf|font|system-ui|display|body/.test(normalized)) return 'Sim, autorizo system-ui em display e body como substituição para esta fixture; registre em Known Gaps que as fontes originais não foram identificadas.';
  if (skillId === 'design-md') return 'Aprovo explicitamente esta direção editorial funcional como identidade ativa da Marca Fixture. Mantenha a consolidação nesta única referência. Gere agora o DESIGN.md com name: Marca Fixture, version: "1.0.0", quatro ou mais cores e a substituição tipográfica já autorizada; não invente logo nem fatos da marca.';
  if (skillId === 'conteudo-funil' && /[uú]nica (?:transcri[cç][aã]o|observa[cç][aã]o)/.test(normalized)) return 'Autorizo uma única observação literal para este piloto.';
  if (skillId === 'conteudo-funil' && /estrutura ret[oó]rica|transcript.*escolha/.test(normalized)) return 'A) Autorizo adaptar somente a estrutura retórica de contraste/inversão, sem atribuir a frase ou a fala à Marca Fixture.';
  if (skillId === 'conteudo-funil' && /dire[cç][aã]o visual|fundo #?f{3,6}|cor de fundo/.test(normalized)) return 'A) Autorizo fundo #FFFFFF, texto #000000, destaque #0B1F3A e fonte Arial somente para esta fixture.';
  if (skillId === 'conteudo-funil' && /paleta neutra|tokens efetivos|tokens visuais/.test(normalized)) return 'Autorizo a paleta neutra proposta somente para esta fixture de revisão.';
  if (skillId === 'conteudo-funil') return 'Substituição formal aprovada para este piloto: um único carrossel de três slides 1080x1350 e os roteiros correspondentes. Use apenas as observações literais disponíveis, com métrica não obtida, e a direção visual explicitamente autorizada. Não exigir lote de nove nem inventar URL, métrica ou prova.';
  if (skillId === 'advertorial-funil' && /termino o dia|frase factual|fato observ[aá]vel/.test(normalized)) return 'Eu termino o dia com tarefas importantes ainda abertas, mesmo tendo trabalhado o dia inteiro.';
  if (skillId === 'advertorial-funil' && /destino editorial intermedi[aá]rio|p[aá]gina intermedi[aá]ria|cta.*checkout/.test(normalized)) return 'pagina/index.html';
  if (skillId === 'lancamento-funil' && /fechamento.*carrinho|carrinho fechar|data e hor[aá]rio.*carrinho/.test(normalized)) return '20/09/2026 às 23:59, fuso America/Sao_Paulo.';
  if (skillId === 'email-funil' && /merge tag|first_name/.test(normalized)) return 'sim, {{first_name}} é o merge tag confirmado.';
  if (skillId === 'email-funil' && /termos completos.*garantia|garantia.*antes da publica[cç][aã]o/.test(normalized)) return 'não; mantenha somente “garantia de 30 dias conforme termos fornecidos” e bloqueie publicação até os termos completos existirem.';
  if (skillId === 'whatsapp-funil' && /momento|detect|evento|carrinho|cart[aã]o|boleto|pix/.test(normalized)) return 'Somente lead e checkout_iniciado sem compra estão confirmados. Não há evento, carrinho abandonado, cartão recusado ou boleto/pix detectável nesta fixture.';
  if (skillId === 'whatsapp-funil' && /automa[cç][aã]o|ferramenta|disparo/.test(normalized)) return 'Disparo manual; a skill apenas prepara a copy e não envia mensagens.';
  if (skillId === 'whatsapp-funil' && /timing|quando|prazo|minuto/.test(normalized)) return 'Confirmação do lead imediatamente; recuperação 30 minutos após checkout_iniciado sem compra.';
  if (skillId === 'whatsapp-funil' && /temperatura|quente|frio|origem do contato/.test(normalized)) return 'Contato de tráfego frio; usar voz da marca objetiva e acolhedora.';
  if (skillId === 'recuperacao-funil' && /downsell|plano essencial autoguiado/.test(normalized)) return 'Confirmo o Plano essencial autoguiado por R$ 197, sem desconto adicional. A URL ainda não foi definida; mantenha-o somente como plano futuro e fora da cascata ativa.';
  if (skillId === 'recuperacao-funil' && /ferramenta|e-mail|email|whatsapp|automa[cç][aã]o/.test(normalized)) return 'Nenhuma ferramenta de e-mail, WhatsApp ou automação está configurada. A operação é manual e nenhum disparo será executado.';
  if (skillId === 'recuperacao-funil' && /comportamento|checkout|crm|carrinho abandonado|cart[aã]o recusado|pix|boleto/.test(normalized)) return 'O sistema identifica somente checkout_iniciado e compra. Não distingue carrinho abandonado, cartão recusado, Pix ou boleto.';
  if (skillId === 'recuperacao-funil' && /canal de atendimento|atendimento humano|atendimento.*ia/.test(normalized)) return 'Não tenho canal de atendimento humano ou IA confirmado; não inclua nem invente link de atendimento.';
  if (skillId === 'backend-funil' && /entreg[aá]ve|limite.*plano essencial|plano essencial.*limite/.test(normalized)) return 'O Plano essencial autoguiado inclui o programa principal e o Checklist de execução, sem acompanhamento, sessões ou suporte individual.';
  if (skillId === 'backend-funil' && /order bump/.test(normalized)) return 'Não haverá order bump nesta fixture.';
  if (skillId === 'backend-funil' && /url.*checkout|checkout.*url/.test(normalized)) return 'As URLs reais ainda não existem. Use [URL_CHECKOUT_UPSELL] e [URL_CHECKOUT_DOWNSELL] como placeholders explícitos.';
  if (skillId === 'backend-funil' && /tracking|pixel|identificador|\bids?\b/.test(normalized)) return 'Os IDs reais ainda não existem. Use [TRACKING_ID_UPSELL] e [TRACKING_ID_DOWNSELL] como placeholders explícitos.';
  if (skillId === 'swipe-file' && /captura manual|continuar.*manual|modo manual/.test(normalized)) return 's';
  if (skillId === 'swipe-file' && /url p[uú]blica|dias.*veicula[cç][aã]o|m[ií]nimo de 7 dias|fonte.*url/.test(normalized)) return 'URL: https://pt.linkedin.com/posts/oalanicolas_o-claude-%C3%A9-a-melhor-intelig%C3%AAncia-artificial-activity-7309906900622491648-m088. A plataforma exibia aproximadamente 1 ano em 11/07/2026 e 10 comentários. Classifique como promissor / referência observada, não como winner comprovado.';
  if (skillId === 'bonus-funil' && /pauta|amostra|lote|b[oô]nus/.test(normalized)) return 'Aprovo somente o Checklist de execucao como pauta e amostra. Nao gerar outros bonus.';
  if (skillId === 'webinario-funil' && /seguir com (?:o )?webin[aá]rio|funil recomendado/.test(normalized)) return 'sim, seguir com webinário';
  if (skillId === 'webinario-funil' && /exce[cç][aã]o|prescri[cç][aã]o atual/.test(normalized)) return 'confirmo a exceção';
  if (skillId === 'webinario-funil' && /o que expira|escassez real|inscri[cç][oõ]es/.test(normalized)) return 'inscrições; não substitui 15/09/2026 como fechamento da oferta.';
  if (skillId === 'webinario-funil' && /funda[cç][oõ]es|copy\.md|design\.md|big idea/.test(normalized)) return 'Use copy.md e DESIGN.md confirmados desta fixture; ambos contêm Big Idea, voz, headlines, objeções, paleta e tipografia aprovadas.';
  if (skillId === 'webinario-funil' && /data e.*hor[aá]rio finais|oferta fecha|fechamento.*apresenta[cç][aã]o/.test(normalized)) return '15/09/2026 às 23:59, fuso America/Sao_Paulo.';
  if (skillId === 'webinario-funil' && /replay/.test(normalized)) return 'não haverá replay';
  if (skillId === 'webinario-funil' && /pol[ií]tica de privacidade/.test(normalized)) return 'https://fixture.invalid/privacidade';
  if (skillId === 'webinario-funil' && /data|hor[aá]rio|fuso|webin[aá]rio ao vivo/.test(normalized)) return '10/09/2026, 20h, fuso America/Sao_Paulo.';
  if (skillId === 'webinario-funil' && /encerramento|fechamento|deadline/.test(normalized)) return 'Sem deadline ou escassez; o checkout permanece aberto.';
  if (skillId === 'webinario-funil' && /fixture|url|sala|destino do formul[aá]rio/.test(normalized)) return 'Confirmo que as URLs fixture são intencionais e válidas somente para este E2E isolado.';
  if (/upsell|oto|oferta de backend|back-end/.test(normalized)) return 'Upsell: Acompanhamento de implementacao por R$ 997, apresentado uma vez apos a compra.';
  if (/downsell/.test(normalized)) return 'Downsell: Plano essencial autoguiado por R$ 197, sem inventar desconto adicional.';
  if (/janela|4 horas|prazo de oferta/.test(normalized)) return 'Janela de 4 horas apos a compra, conforme decisao explicita da fixture.';
  if (/prova|depoimento|resultado|case|evid[eê]ncia/.test(normalized)) return 'Nao ha prova verificavel. Marque como pendente e nao use alegacao factual.';
  if (/pre[cç]o|ticket|investimento/.test(normalized)) return 'R$ 497 a vista; nao inventar parcelamento nem preco de upsell.';
  if (/garantia/.test(normalized)) return '30 dias conforme os termos fornecidos, sem acrescentar condicoes.';
  if (/url|link|checkout|cta|destino/.test(normalized)) return 'CTA Conhecer o programa para https://fixture.invalid/checkout.';
  if (/tom|voz|linguagem/.test(normalized)) return 'Voz da marca, objetiva, acolhedora e sem promessas de resultado.';
  if (/aprova|aprova[cç][aã]o|confirm/.test(normalized)) return 'Aprovo a direcao descrita na entrada, mantendo fatos ausentes como pendentes.';
  return `${OPERATOR_INPUT[skillId]} Se a informacao nao estiver nos artefatos confirmados, registre a lacuna em vez de inventar.`;
}

function continuationText(skillId, result) {
  return [
    `CONTINUACAO DE ELICITACAO DA SKILL ${skillId}.`,
    `Resumo do checkpoint anterior: ${result.proposal.summary || 'sem resumo'}.`,
    'Use as respostas abaixo como decisoes explicitas do operador. Nao repita perguntas respondidas.',
    ...result.proposal.questions.map((question, index) => `${index + 1}. ${question}\nResposta: ${answerQuestion(skillId, question)}`),
    'Se faltar decisao indispensavel, retorne somente novas perguntas. Caso contrario, produza o pack final completo.',
  ].join('\n\n');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function contractPattern(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**', '__DOUBLE_STAR__')
    .replaceAll('*', '[^/]+')
    .replaceAll('__DOUBLE_STAR__', '.+');
  return new RegExp(`^${escaped}$`);
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

function startProcess(command, args, options) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  const logs = [];
  const collect = (prefix) => (chunk) => {
    const line = `${prefix}${chunk.toString()}`;
    logs.push(line);
    if (logs.length > 80) logs.shift();
  };
  child.stdout.on('data', collect('stdout: '));
  child.stderr.on('data', collect('stderr: '));
  return { child, logs };
}

async function stopProcess(processState) {
  if (!processState?.child || processState.child.exitCode !== null) return;
  processState.child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => processState.child.once('exit', resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000)),
  ]);
  if (processState.child.exitCode === null) processState.child.kill('SIGKILL');
}

async function waitForUrl(url, processState, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processState.child.exitCode !== null) {
      throw new Error(`Processo encerrou antes de ${url}.\n${processState.logs.join('')}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // O servidor ainda esta subindo.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timeout aguardando ${url}.\n${processState.logs.join('')}`);
}

async function runCli(args, env, allowNeedsInput = false) {
  try {
    return await execFileAsync('npx', ['tsx', 'server/skill-cli.ts', ...args], {
      cwd: appRoot,
      env,
      maxBuffer: 30_000_000,
      timeout: realCodex ? 20 * 60_000 : 5 * 60_000,
    });
  } catch (error) {
    if (allowNeedsInput && error?.code === 3) return error;
    throw error;
  }
}

async function runCliProposalWithRetry(fixture, skillId, args, outputPath, env) {
  try {
    await runCli(args, env, true);
    return;
  } catch (originalError) {
    const run = await fixture.latestRun('cli', skillId).catch(() => null);
    const jobId = run?.input_snapshot?.jobId;
    if (run?.status !== 'failed' || typeof jobId !== 'string') throw originalError;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await runCli([
          '--retry-run', run.id,
          '--job', jobId,
          '--workspace', fixture.workspaceId,
          '--output', outputPath,
        ], env, true);
        return;
      } catch (retryError) {
        if (attempt === 2) throw retryError;
      }
    }
  }
}

async function runCliSkill(fixture, skillId, workDir, env) {
  const inputPath = resolve(workDir, `${skillId}-input.json`);
  const proposalPath = resolve(workDir, `${skillId}-proposal.json`);
  const approvalPath = resolve(workDir, `${skillId}-approval.json`);
  let payload = {
    workspaceId: fixture.workspaceId,
    projectId: fixture.surfaces.cli.projectId,
    brief: fixture.briefFor('cli'),
    context: {
      artifacts: await fixture.contextArtifacts('cli'),
      ...(researchSkills.has(skillId) ? {
        externalResearch: {
          mode: 'offline',
          query: `${skillId} fixture literal`,
          pastedMaterial: offlineMaterialFor(skillId),
          pastedSourceLabel: 'Material literal da fixture',
          sources: [],
          maxBillableCalls: 0,
        },
      } : {}),
      ...(skillId === 'conteudo-funil' ? {
        mediaIntake: {
          items: [{
            id: 'spoken-reference',
            role: 'reference-content',
            source: { origin: 'url', url: spokenMediaUrl },
            language: 'en',
          }],
        },
      } : {}),
      ...(skillId === 'design-md' ? {
        brandDesign: designInputMode === 'url'
          ? { mode: 'url', url: 'https://example.com/', maxBytes: 1_000_000 }
          : { mode: 'moodboard', images: [{ kind: 'base64', data: designPngBase64 }], maxImageBytes: 2 * 1024 * 1024 },
      } : {}),
    },
    operatorInput: realCodex ? OPERATOR_INPUT[skillId] : 'Executar a lane controlada do contrato v2 e submeter o pack para revisao humana.',
  };
  await writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await runCliProposalWithRetry(fixture, skillId, ['--skill', skillId, '--input', inputPath, '--output', proposalPath], proposalPath, env);
  let proposal = JSON.parse(await readFile(proposalPath, 'utf8'));
  for (let round = 1; proposal.status === 'needs_input' && round <= 12; round += 1) {
    payload = {
      ...payload,
      context: {
        ...payload.context,
        artifacts: await fixture.contextArtifacts('cli'),
      },
      operatorInput: continuationText(skillId, proposal),
      elicitationParentRunId: proposal.skillRunId,
    };
    const continuationInput = resolve(workDir, `${skillId}-continuation-${round}.json`);
    await writeFile(continuationInput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await runCliProposalWithRetry(fixture, skillId, ['--skill', skillId, '--input', continuationInput, '--output', proposalPath], proposalPath, env);
    proposal = JSON.parse(await readFile(proposalPath, 'utf8'));
  }
  assert.equal(
    proposal.status,
    'needs_review',
    `${skillId}/CLI nao chegou a needs_review. Perguntas pendentes: ${JSON.stringify(proposal.proposal?.questions ?? [])}`,
  );
  await runCli(['--approve-run', proposal.skillRunId, '--proposal', proposalPath, '--output', approvalPath], env);
  const approval = JSON.parse(await readFile(approvalPath, 'utf8'));
  assert.equal(approval.status, 'done', `${skillId}/CLI nao concluiu.`);
  assert.equal(approval.approval?.state, 'done', `${skillId}/CLI sem saga concluida.`);
  return fixture.latestRun('cli', skillId);
}

async function selectSkill(page, skillId) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.getByRole('button', { name: new RegExp(`^${skillId}`, 'i') }).click();
    await page.waitForTimeout(450);
    const heading = await page.getByRole('heading', { name: skillId, exact: true }).isVisible().catch(() => false);
    const selected = await page.locator('.cms-skill-node.is-selected').filter({ hasText: skillId }).isVisible().catch(() => false);
    if (heading && selected) return;
  }
  throw new Error(`Selecao de ${skillId} nao estabilizou.`);
}

async function panelStatus(page) {
  const status = page.locator('.cms-run-status strong');
  if (!await status.count()) return '';
  return (await status.first().innerText({ timeout: 1_000 }).catch(() => '')).trim();
}

async function waitForDurablePanelRun(fixture, skillId, predicate, timeoutMs = realCodex ? 20 * 60_000 : 5 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const runs = await fixture.runsFor('panel', skillId);
    const match = [...runs].reverse().find(predicate);
    if (match) return match;
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  }
  throw new Error(`${skillId}/painel não atingiu o estado durável esperado.`);
}

async function runPanelSkill(fixture, page, skillId) {
  await selectSkill(page, skillId);
  const readiness = (await page.locator('.cms-skill-detail__status').innerText()).trim();
  if (skillId !== 'design-md') assert.match(readiness, /PRONTA/, `${skillId}/painel nao esta pronta: ${readiness}`);
  if (researchSkills.has(skillId)) {
    const research = page.locator('section.cms-research-input');
    await research.getByRole('button', { name: 'Material colado', exact: true }).click();
    await research.getByLabel('Origem do material').fill('Material literal da fixture');
    await research.getByLabel('Material literal').fill(offlineMaterialFor(skillId));
  }
  if (skillId === 'conteudo-funil') {
    const media = page.getByRole('region', { name: 'Mídia de referência' });
    await media.getByLabel('URL pública do áudio ou vídeo').fill(spokenMediaUrl);
    await media.getByLabel('Idioma da mídia').selectOption('en');
  }
  if (skillId === 'design-md') {
    const brand = page.getByRole('region', { name: 'Referência da marca' });
    if (designInputMode === 'url') {
      await brand.getByRole('button', { name: 'URL pública', exact: true }).click();
      await brand.getByLabel('URL pública da marca').fill('https://example.com/');
    } else {
      await brand.getByRole('button', { name: 'Moodboard', exact: true }).click();
      await brand.getByLabel('Imagens do moodboard (até 5)').setInputFiles({
        name: 'marca-fixture.png',
        mimeType: 'image/png',
        buffer: Buffer.from(designPngBase64, 'base64'),
      });
      await brand.getByText(/1 imagem\(ns\) pronta\(s\)/).waitFor();
    }
  }
  await page.locator('label.cms-operator-input textarea').waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator('label.cms-operator-input textarea').fill(realCodex ? OPERATOR_INPUT[skillId] : 'Executar a lane controlada do contrato v2 e submeter o pack para revisao humana.');
  const existingRunIds = new Set((await fixture.runsFor('panel', skillId)).map((run) => run.id));
  await page.locator('.cms-skill-detail__actions')
    .getByRole('button', { name: /Executar etapa guiada|Executar skill|Gerar proposta|Preparar proposta/i })
    .click();
  let currentRun = await waitForDurablePanelRun(fixture, skillId, (run) => !existingRunIds.has(run.id));
  let retries = 0;
  for (let round = 0; round <= 12; round += 1) {
    currentRun = await waitForDurablePanelRun(
      fixture,
      skillId,
      (run) => run.id === currentRun.id && ['needs_review', 'failed', 'cancelled', 'done'].includes(run.status),
    );
    if (currentRun.status === 'failed') {
      const diagnostic = (await page.locator('.cms-inline-error').last().innerText().catch(() => 'falha sem diagnostico')).trim();
      if (retries >= 2) throw new Error(`${skillId}/painel falhou apos duas repeticoes: ${diagnostic}`);
      retries += 1;
      await selectSkill(page, skillId);
      let retryButton = page.getByRole('button', { name: 'Repetir', exact: true });
      if (!await retryButton.isVisible().catch(() => false)) {
        await page.reload({ waitUntil: 'networkidle' });
        await selectSkill(page, skillId);
        retryButton = page.getByRole('button', { name: 'Repetir', exact: true });
      }
      await retryButton.click();
      await waitForDurablePanelRun(fixture, skillId, (run) => run.id === currentRun.id && run.status !== 'failed', 60_000);
      continue;
    }
    if (currentRun.status !== 'needs_review') throw new Error(`${skillId}/painel terminou em ${currentRun.status}.`);
    const reviewSurfaceDeadline = Date.now() + 30_000;
    const elicitation = page.locator('section.cms-elicitation');
    const artifactReview = page.getByTestId('artifact-approval-review');
    while (Date.now() < reviewSurfaceDeadline
      && !await elicitation.isVisible().catch(() => false)
      && !await artifactReview.isVisible().catch(() => false)) {
      await page.waitForTimeout(200);
    }
    if (!await elicitation.isVisible().catch(() => false) && !await artifactReview.isVisible().catch(() => false)) {
      const runs = await fixture.runsFor('panel', skillId);
      const active = [...runs].reverse().find((run) => ['queued', 'running'].includes(run.status));
      if (active) {
        currentRun = active;
        continue;
      }
      await page.reload({ waitUntil: 'networkidle' });
      await selectSkill(page, skillId);
      const hydrationDeadline = Date.now() + 60_000;
      while (Date.now() < hydrationDeadline
        && !await elicitation.isVisible().catch(() => false)
        && !await artifactReview.isVisible().catch(() => false)) {
        await page.waitForTimeout(250);
      }
    }
    if (!await elicitation.isVisible().catch(() => false)) {
      if (await artifactReview.isVisible().catch(() => false)) break;
      const detail = (await page.locator('.cms-skill-detail').innerText().catch(() => '')).trim().slice(0, 2_000);
      throw new Error(`${skillId}/painel não hidratou revisão nem elicitação.\n${detail}`);
    }
    await page.waitForTimeout(400);
    const labels = elicitation.locator('label');
    for (let index = 0; index < await labels.count(); index += 1) {
      const label = labels.nth(index);
      const question = await label.locator('span').innerText();
      await label.locator('textarea').fill(answerQuestion(skillId, question));
    }
    await page.waitForTimeout(250);
    const checkpoint = currentRun;
    const continuationResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes(`/api/local/skills/${skillId}/run`),
    { timeout: 15_000 }).catch(() => null);
    await elicitation.getByRole('button', { name: 'Continuar com respostas', exact: true }).click();
    const continuationResponse = await continuationResponsePromise;
    if (!continuationResponse) {
      const detail = (await page.locator('.cms-skill-detail').innerText().catch(() => '')).trim().slice(0, 2_000);
      throw new Error(`${skillId}/painel não emitiu o POST de continuação.\n${detail}`);
    }
    if (!continuationResponse.ok()) {
      throw new Error(`${skillId}/painel recebeu ${continuationResponse.status()} na continuação: ${(await continuationResponse.text()).slice(0, 1_000)}`);
    }
    const continuationDeadline = Date.now() + 60_000;
    let successor = null;
    while (Date.now() < continuationDeadline) {
      const runs = await fixture.runsFor('panel', skillId).catch(() => []);
      successor = runs.find((run) => run.id !== checkpoint.id && run.input_snapshot?.elicitationParentRunId === checkpoint.id) ?? null;
      if (successor) break;
      await page.waitForTimeout(250);
    }
    if (!successor) {
      const diagnostic = (await page.locator('.cms-inline-error').last().innerText().catch(() => '')).trim();
      const detail = (await page.locator('.cms-skill-detail').innerText().catch(() => '')).trim().slice(0, 2_000);
      throw new Error(`${skillId}/painel não persistiu a continuação: ${diagnostic || 'sem diagnóstico'}\n${detail}`);
    }
    currentRun = successor;
    await page.waitForTimeout(250);
  }
  if (await page.locator('section.cms-elicitation').isVisible().catch(() => false)) {
    throw new Error(`${skillId}/painel excedeu o limite de checkpoints de elicitação.`);
  }
  let review = page.getByTestId('artifact-approval-review');
  for (let hydrationAttempt = 0; hydrationAttempt < 4 && !await review.isVisible().catch(() => false); hydrationAttempt += 1) {
    const runs = await fixture.runsFor('panel', skillId);
    const superseded = new Set(runs.map((run) => run.input_snapshot?.elicitationParentRunId).filter(Boolean));
    const latest = [...runs].reverse().find((run) => !superseded.has(run.id));
    if (latest && ['queued', 'running'].includes(latest.status)) {
      currentRun = await waitForDurablePanelRun(
        fixture,
        skillId,
        (run) => run.id === latest.id && ['needs_review', 'failed', 'cancelled', 'done'].includes(run.status),
        realCodex ? 20 * 60_000 : 60_000,
      );
    } else if (latest) {
      currentRun = latest;
    }
    await page.reload({ waitUntil: 'networkidle' });
    await selectSkill(page, skillId);
    review = page.getByTestId('artifact-approval-review');
    await review.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
  }
  await review.waitFor({ state: 'visible', timeout: 5_000 }).catch(async (error) => {
    const status = await panelStatus(page);
    const diagnostic = (await page.locator('.cms-inline-error').last().innerText().catch(() => '')).trim();
    const runs = await fixture.runsFor('panel', skillId).catch(() => []);
    const latest = [...runs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const proposalShape = latest?.proposal ? {
      status: latest.status,
      summary: typeof latest.proposal.summary,
      artifacts: Array.isArray(latest.proposal.artifacts) ? latest.proposal.artifacts.length : typeof latest.proposal.artifacts,
      questions: Array.isArray(latest.proposal.questions) ? latest.proposal.questions : typeof latest.proposal.questions,
      warnings: Array.isArray(latest.proposal.warnings) ? latest.proposal.warnings : typeof latest.proposal.warnings,
      artifactTypes: Array.isArray(latest.proposal.artifacts) ? latest.proposal.artifacts.map((artifact) => artifact.artifactType) : [],
    } : null;
    throw new Error(`${skillId}/painel sem revisão após status ${status}: ${diagnostic || (error instanceof Error ? error.message : 'sem detalhe')}. Proposta: ${JSON.stringify(proposalShape)}`);
  });
  const approve = review.getByRole('button', { name: 'Aprovar', exact: true });
  await approve.waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === 'Aprovar');
    return Boolean(button && !button.disabled);
  });
  await approve.click();
  const approvedRunId = currentRun.id;
  if (!approvedRunId) throw new Error(`${skillId}/painel não encontrou run em revisão antes de aprovar.`);
  const approvalDeadline = Date.now() + 120_000;
  let approvedRun = null;
  while (Date.now() < approvalDeadline) {
    const runs = await fixture.runsFor('panel', skillId);
    approvedRun = runs.find((run) => run.id === approvedRunId) ?? null;
    if (approvedRun?.status === 'done') break;
    const approvalError = page.locator('.cms-approval-error');
    if (await approvalError.isVisible().catch(() => false)) throw new Error(`Aprovação do painel falhou: ${(await approvalError.innerText()).trim()}`);
    await page.waitForTimeout(250);
  }
  if (approvedRun?.status !== 'done') throw new Error(`${skillId}/painel não persistiu aprovação done.`);
  await page.reload({ waitUntil: 'networkidle' });
  await selectSkill(page, skillId);
  const lifecycle = (await page.locator('.cms-skill-detail__status').innerText()).trim();
  assert.match(lifecycle, /CONCLUÍDA/, `${skillId}/painel não reidratou como concluída: ${lifecycle}`);
  return approvedRun;
}

function expectedCanonicalPaths(contract, sourcePaths) {
  const paths = new Set([
    ...contract.requiredTextOutputs.map((output) => output.path),
    ...(contract.optionalTextOutputs ?? [])
      .filter((output) => sourcePaths.includes(output.path))
      .map((output) => output.path),
    ...contract.derivedOutputs.map((output) => output.path),
    'book-do-funil.json',
    'index.html',
  ]);
  for (const group of contract.requiredAnyOf ?? []) {
    assert.ok(group.some((path) => sourcePaths.includes(path)), `${contract.skillId} nao satisfez requiredAnyOf.`);
  }
  for (const collection of contract.requiredCollections ?? []) {
    const matching = sourcePaths.filter((path) => contractPattern(collection.pathPattern).test(path));
    assert.ok(matching.length >= collection.minItems, `${contract.skillId} nao satisfez ${collection.pathPattern}.`);
    matching.forEach((path) => paths.add(path));
  }
  for (const collection of contract.derivedCollectionOutputs ?? []) {
    const pattern = contractPattern(collection.sourcePattern);
    sourcePaths.filter((path) => pattern.test(path)).forEach((path) => {
      paths.add(path.replace(extname(path), collection.outputExtension));
    });
  }
  return [...paths].sort();
}

async function verifyRun(fixture, surface, contract, run) {
  assert.equal(run.status, 'done', `${contract.skillId}/${surface} nao esta done.`);
  const [artifacts, approval] = await Promise.all([
    fixture.artifactsForRun(run.id),
    fixture.approvalForRun(run.id),
  ]);
  assert.equal(approval.decision, 'approve');
  assert.equal(approval.state, 'done');
  assert.ok(['written', 'unchanged'].includes(approval.outcome));
  const planByPath = new Map(approval.plan.map((entry) => [entry.path, entry]));
  const files = [];
  for (const artifact of artifacts) {
    assert.ok(artifact.path, `${contract.skillId}/${surface} produziu path nulo.`);
    const bytes = await readFile(resolve(fixture.projectRoot(surface), artifact.path));
    const fileHash = sha256(bytes);
    assert.equal(artifact.content_hash, fileHash, `DB/filesystem divergiram em ${surface}/${artifact.path}.`);
    const plan = planByPath.get(artifact.path);
    assert.ok(plan, `Plano de aprovacao nao contem ${artifact.path}.`);
    files.push({
      path: artifact.path,
      format: artifact.format,
      bytes: (await stat(resolve(fixture.projectRoot(surface), artifact.path))).size,
      sha256: fileHash,
      kind: plan.derivedFrom ? 'derived' : 'approved-source',
      derivedFrom: plan.derivedFrom ?? null,
      binary: plan.contentEncoding === 'base64',
      dbFilesystemMatch: true,
    });
  }
  const sourcePaths = files.filter((file) => file.kind === 'approved-source').map((file) => file.path);
  const expected = expectedCanonicalPaths(contract, sourcePaths);
  const actual = files.map((file) => file.path);
  const missing = expected.filter((path) => !actual.includes(path));
  assert.deepEqual(missing, [], `${contract.skillId}/${surface} sem paths canonicos.`);
  return {
    approval: { decision: approval.decision, state: approval.state, outcome: approval.outcome },
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    expectedCanonicalPaths: expected,
  };
}

function sourceManifest(result) {
  return result.files
    .filter((file) => file.kind === 'approved-source' && !file.path.startsWith('research/') && !file.path.startsWith('media/'))
    .map(({ path, format, sha256: hash }) => ({ path, format, hash }));
}

function normalizedContractPath(contract, path) {
  for (const collection of contract.requiredCollections ?? []) {
    if (contractPattern(collection.pathPattern).test(path)) return collection.pathPattern;
  }
  for (const collection of contract.derivedCollectionOutputs ?? []) {
    const outputPattern = collection.sourcePattern.replace(extname(collection.sourcePattern), collection.outputExtension);
    if (contractPattern(outputPattern).test(path)) return outputPattern;
  }
  return path.replace(/^(media\/[^/]+\/snapshot-)[a-f0-9]{16}(\.json)$/, '$1{content-hash}$2');
}

function canonicalPathManifest(contract, paths) {
  return [...new Set(paths.map((path) => normalizedContractPath(contract, path)))].sort();
}

function topologyManifest(contract, result) {
  const entries = result.files
    .filter((file) => !file.path.startsWith('research/'))
    .map((file) => {
      const dynamicSource = (contract.requiredCollections ?? [])
        .find((collection) => file.derivedFrom && contractPattern(collection.pathPattern).test(file.derivedFrom));
      return {
        path: dynamicSource
          ? `derived-from:${dynamicSource.pathPattern}:${file.format}`
          : normalizedContractPath(contract, file.path),
        format: file.format,
        kind: file.kind,
        binary: file.binary,
      };
    });
  return [...new Map(entries.map((entry) => [
    `${entry.path}:${entry.format}:${entry.kind}:${entry.binary}`,
    entry,
  ])).values()]
    .sort((a, b) => `${a.path}:${a.format}:${a.kind}`.localeCompare(`${b.path}:${b.format}:${b.kind}`));
}

function normalizedBook(book) {
  return {
    schemaVersion: book.schemaVersion,
    cards: [...book.cards]
      .map((card) => ({
        id: card.id,
        title: card.title,
        phase: card.phase,
        status: card.status,
        link: card.link,
        versions: [...card.versions].sort((a, b) => a.revision - b.revision),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    current: book.current,
  };
}

function safeSurfaceEvidence(result) {
  return {
    approval: result.approval,
    expectedCanonicalPaths: result.expectedCanonicalPaths,
    files: result.files.map(({ path, format, bytes, sha256: hash, kind, binary, dbFilesystemMatch }) => ({
      path,
      format,
      bytes,
      hash,
      kind,
      binary,
      dbFilesystemMatch,
    })),
  };
}

function verifiedMediaEvidence(run, skillId) {
  const artifact = run.proposal?.artifacts?.find((candidate) => candidate.artifactType === 'mediaSnapshot');
  assert.ok(artifact, `${skillId}: snapshot de mídia ausente.`);
  const snapshot = JSON.parse(artifact.content);
  const item = snapshot.items?.[0];
  assert.equal(item?.media?.origin, 'url', `${skillId}: origem de mídia divergente.`);
  assert.equal(item?.media?.mimeType, 'audio/flac', `${skillId}: mime de mídia divergente.`);
  assert.match(item?.media?.sha256 ?? '', /^[a-f0-9]{64}$/);
  assert.ok(item.media.byteSize > 0, `${skillId}: mídia vazia.`);
  assert.equal(item?.transcription?.status, 'transcribed', `${skillId}: transcrição local não concluída.`);
  assert.equal(item?.transcription?.engine, 'openai-whisper', `${skillId}: motor local divergente.`);
  assert.ok(item.transcription.charCount >= 20, `${skillId}: transcrição local vazia.`);
  assert.equal(item.transcription.mediaSha256, item.media.sha256, `${skillId}: mídia e transcript não estão vinculados.`);
  return {
    origin: item.media.origin,
    mimeType: item.media.mimeType,
    byteSize: item.media.byteSize,
    sha256: item.media.sha256,
    transcriptionStatus: item.transcription.status,
    transcriptionEngine: item.transcription.engine,
    transcriptCharCount: item.transcription.charCount,
  };
}

function assertPrivacySafe(evidence) {
  const serialized = JSON.stringify(evidence);
  const forbidden = [
    /\/Users\//,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    /OPENAI_API_KEY|CODEX_API_KEY|APIFY_API_TOKEN|SERVICE_ROLE_KEY|LOCAL_SKILL_RUNNER_TOKEN/i,
    /document-pack-v2-[a-z0-9]+@fixture\.local/i,
  ];
  for (const pattern of forbidden) assert.equal(pattern.test(serialized), false, `Evidencia reprovada por ${pattern}.`);
}

const bffPort = await freePort();
const webPort = await freePort();
const bffUrl = `http://127.0.0.1:${bffPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;
const runnerToken = `dpv2-${randomUUID()}`;
const workDir = await mkdtemp(resolve(tmpdir(), 'document-pack-v2-work-'));
const evidenceDir = process.env.DOCUMENT_PACK_V2_EVIDENCE_DIR
  ? resolve(process.env.DOCUMENT_PACK_V2_EVIDENCE_DIR)
  : await mkdtemp(resolve(tmpdir(), 'document-pack-v2-evidence-'));
await mkdir(evidenceDir, { recursive: true });
await chmod(controlledCodexPath, 0o755);

let fixture = null;
let browser = null;
let context = null;
let bffProcess = null;
let viteProcess = null;
let failure = null;
const evidence = {
  schemaVersion: '1.0.0',
  epic: '11',
  story: '11.W3.1',
  generatedAt: new Date().toISOString(),
  lane: {
    type: realCodex ? 'real-codex' : 'controlled-contract',
    runner: realCodex ? 'codex-cli-chatgpt-session' : 'deterministic-local-fixture',
    codexRealEquivalent: realCodex,
    reasoningEffort: realCodex ? requestedReasoningEffort : 'controlled',
    validates: ['panel-runtime', 'cli-runtime', 'approval-saga', 'database-filesystem', 'derived-rendering', 'book-reconciliation'],
    limitation: realCodex ? 'Saidas generativas independentes podem ter hashes diferentes; contrato, topologia, decisoes e hashes por superficie sao comparados.' : 'A geracao textual e controlada e nao substitui a lane separada com Codex CLI real.',
  },
  contractCatalog: {
    schemaVersion: contractsFile.schemaVersion,
    contractCount: contracts.length,
    contractIds: skills,
    catalogHash: sha256(`${JSON.stringify(contracts)}\n`),
  },
  surfaces: {
    panel: 'Playwright no painel real sobre BFF isolado',
    cli: 'skill-cli real sobre o mesmo BFF isolado',
  },
  skills: [],
  cleanup: { attempted: false, verified: false },
  privacy: { checked: false, findings: null },
};

try {
  const configProbe = await createDocumentPackV2Fixture({ webUrl, bffUrl });
  fixture = configProbe;
  const sharedEnv = {
    ...process.env,
    OPENAI_API_KEY: '',
    CODEX_API_KEY: '',
    VITE_SUPABASE_URL: fixture.config.url,
    VITE_SUPABASE_ANON_KEY: fixture.config.anonKey,
    VITE_DEMO_AUTH: 'false',
  };
  bffProcess = startProcess('npx', ['tsx', 'server/start.ts'], {
    cwd: appRoot,
    env: {
      ...sharedEnv,
      PORT: String(bffPort),
      HOST: '127.0.0.1',
      CORS_ORIGIN: webUrl,
      LOCAL_SKILL_RUNNER_ENABLED: 'true',
      LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
      ...(realCodex ? {} : { CODEX_CLI_PATH: controlledCodexPath, CODEX_SKILL_MODEL: 'controlled-document-pack-v2' }),
      COHORT_REPO_ROOT: repoRoot,
      SUPABASE_URL: fixture.config.url,
      SUPABASE_SERVICE_ROLE_KEY: fixture.config.serviceRoleKey,
      CODEX_SKILL_TIMEOUT_MS: realCodex ? String(20 * 60_000) : String(5 * 60_000),
      CODEX_SKILL_REASONING_EFFORT: realCodex ? requestedReasoningEffort : 'low',
      LOG_LEVEL: 'warn',
    },
  });
  await waitForUrl(`${bffUrl}/healthz`, bffProcess);
  viteProcess = startProcess('npx', ['vite', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], {
    cwd: appRoot,
    env: {
      ...sharedEnv,
      LOCAL_BFF_URL: bffUrl,
      LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
    },
  });
  await waitForUrl(webUrl, viteProcess);

  const cliEnv = {
    ...sharedEnv,
    MARKETING_STUDIO_BFF_URL: bffUrl,
    LOCAL_SKILL_RUNNER_TOKEN: runnerToken,
    MARKETING_STUDIO_EMAIL: fixture.email,
    MARKETING_STUDIO_PASSWORD: fixture.password,
  };
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) failedRequests.push(new URL(request.url()).pathname);
  });
  await page.goto(webUrl, { waitUntil: 'domcontentloaded' });
  const login = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await login.getByLabel('E-mail').fill(fixture.email);
  await login.getByLabel('Senha').fill(fixture.password);
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await Promise.race([
    page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))),
    page.locator('[role="alert"]').waitFor({ state: 'visible' }).then(async () => {
      throw new Error(`Login da fixture falhou: ${(await page.locator('[role="alert"]').innerText()).trim()}`);
    }),
  ]);
  await page.goto(`${webUrl}/projects/${fixture.surfaces.panel.projectId}/journey`, { waitUntil: 'networkidle' });

  for (const contract of contracts) {
    process.stdout.write(`[document-pack-v2] ${contract.skillId}: painel\n`);
    const panelRun = await runPanelSkill(fixture, page, contract.skillId);
    process.stdout.write(`[document-pack-v2] ${contract.skillId}: CLI\n`);
    const cliRun = await runCliSkill(fixture, contract.skillId, workDir, cliEnv);
    const panelResult = await verifyRun(fixture, 'panel', contract, panelRun);
    const cliResult = await verifyRun(fixture, 'cli', contract, cliRun);
    assert.deepEqual(
      canonicalPathManifest(contract, panelResult.expectedCanonicalPaths),
      canonicalPathManifest(contract, cliResult.expectedCanonicalPaths),
      `${contract.skillId}: paths canônicos divergentes.`,
    );
    assert.deepEqual(topologyManifest(contract, panelResult), topologyManifest(contract, cliResult), `${contract.skillId}: topologia divergente.`);
    const panelSources = sourceManifest(panelResult);
    const cliSources = sourceManifest(cliResult);
    const sourceHashesEqual = JSON.stringify(panelSources) === JSON.stringify(cliSources);
    if (!realCodex) assert.deepEqual(panelSources, cliSources, `${contract.skillId}: fontes divergentes.`);
    const panelBook = normalizedBook(await fixture.readBook('panel'));
    const cliBook = normalizedBook(await fixture.readBook('cli'));
    assert.deepEqual(panelBook, cliBook, `${contract.skillId}: Book divergente.`);
    assert.ok(panelBook.cards.some((card) => card.id === contract.skillId), `${contract.skillId}: card ausente no Book.`);
    const media = contract.skillId === 'conteudo-funil'
      ? {
          panel: verifiedMediaEvidence(panelRun, contract.skillId),
          cli: verifiedMediaEvidence(cliRun, contract.skillId),
        }
      : undefined;
    if (media) assert.deepEqual(media.panel, media.cli, `${contract.skillId}: mídia divergiu entre painel e CLI.`);
    evidence.skills.push({
      skillId: contract.skillId,
      contractGroup: contract.contractGroup,
      contractHash: sha256(`${JSON.stringify(contract)}\n`),
      panel: safeSurfaceEvidence(panelResult),
      cli: safeSurfaceEvidence(cliResult),
      parity: {
        canonicalPathsEqual: true,
        artifactTopologyEqual: true,
        approvedSourceHashesEqual: sourceHashesEqual,
        approvedSourceHashesCompared: true,
        semanticContractEqual: true,
        databaseFilesystemHashesVerified: true,
        bookSemanticStateEqual: true,
        binaryHashesComparedAcrossSurfaces: false,
        binaryComparisonReason: 'PDFs derivados podem carregar metadados de renderizacao; cada hash foi validado entre DB e filesystem na propria superficie.',
      },
      ...(media ? { media } : {}),
    });
    process.stdout.write(`[document-pack-v2] ${contract.skillId}: aprovado e verificado\n`);
  }

  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(failedRequests, []);
  await page.screenshot({ path: resolve(evidenceDir, 'panel-final.png'), fullPage: true });
  evidence.browser = {
    screenshot: 'panel-final.png',
    consoleErrors: 0,
    failedRequests: 0,
  };
} catch (error) {
  failure = error;
} finally {
  await context?.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
  await stopProcess(viteProcess);
  await stopProcess(bffProcess);
  evidence.cleanup.attempted = Boolean(fixture);
  if (fixture) {
    try {
      await fixture.cleanup();
      evidence.cleanup.verified = true;
    } catch (cleanupError) {
      failure ??= cleanupError;
    }
  }
  await rm(workDir, { recursive: true, force: true });
}

if (failure) throw failure;
assert.equal(evidence.skills.length, contracts.length);
assert.ok(evidence.skills.every((skill) => skill.parity.databaseFilesystemHashesVerified));
evidence.privacy.checked = true;
evidence.privacy.findings = 0;
assertPrivacySafe(evidence);
await writeFile(resolve(evidenceDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  status: 'passed',
  lane: evidence.lane.type,
  codexRealEquivalent: realCodex,
  skills: evidence.skills.length,
  cleanupVerified: evidence.cleanup.verified,
  privacyFindings: evidence.privacy.findings,
  evidence: resolve(evidenceDir, 'evidence.json'),
}, null, 2)}\n`);
