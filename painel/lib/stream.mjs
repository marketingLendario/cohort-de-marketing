export function parseLinha(linha) {
  let o;
  try {
    o = JSON.parse(linha);
  } catch {
    return [];
  }
  if (!o || typeof o !== 'object') return [];

  if (o.type === 'system' && o.subtype === 'init') {
    return [{ tipo: 'init', sessionId: o.session_id }];
  }

  if (o.type === 'assistant' && Array.isArray(o.message?.content)) {
    const saida = [];
    for (const b of o.message.content) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'text' && b.text) {
        saida.push({ tipo: 'texto', texto: b.text });
      } else if (b.type === 'tool_use') {
        if (b.name === 'AskUserQuestion') {
          saida.push({ tipo: 'pergunta', perguntas: b.input?.questions ?? [] });
        } else {
          saida.push({ tipo: 'ferramenta', nome: b.name, entrada: b.input });
        }
      }
    }
    return saida;
  }

  if (o.type === 'result') {
    return [{
      tipo: 'resultado',
      ok: o.subtype === 'success' && !o.is_error,
      texto: o.result ?? '',
      sessionId: o.session_id,
      custoUsd: o.total_cost_usd ?? null,
      negacoes: o.permission_denials ?? [],
    }];
  }

  return [];
}
