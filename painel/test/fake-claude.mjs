const args = process.argv.slice(2);
const prompt = args[args.indexOf('-p') + 1] ?? '';
const iResume = args.indexOf('--resume');
const resume = iResume >= 0 ? args[iResume + 1] : null;
const modo = prompt.match(/\[(lento|erro|pergunta)\]/)?.[1] ?? 'ok';
const sessionId = resume ?? 'sess-123';
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');

if (modo === 'erro') {
  process.stderr.write('falha simulada\n');
  process.exit(1);
}

out({ type: 'system', subtype: 'hook_started' });
out({ type: 'system', subtype: 'init', session_id: sessionId });

if (modo === 'lento') {
  setInterval(() => {}, 1000);
} else {
  const texto = resume ? `retomado ${resume}: ${prompt}` : `rodando ${prompt}`;
  out({ type: 'assistant', session_id: sessionId, message: { content: [{ type: 'text', text: texto }] } });
  out({ type: 'assistant', session_id: sessionId, message: { content: [
    { type: 'tool_use', name: 'Write', input: { file_path: 'x.md' } }] } });
  if (modo === 'pergunta' && !resume) {
    out({ type: 'assistant', session_id: sessionId, message: { content: [
      { type: 'tool_use', name: 'AskUserQuestion', input: { questions: [{
        question: 'Qual nicho?', header: 'Nicho', multiSelect: false,
        options: [{ label: 'A', description: 'a' }, { label: 'B', description: 'b' }] }] } }] } });
  }
  out({ type: 'result', subtype: 'success', is_error: false, result: 'feito',
    session_id: sessionId, total_cost_usd: 0.01 });
}
