const token = document.querySelector('meta[name="painel-token"]').content;

export function urlApi(caminho, params = {}) {
  const u = new URL(caminho, location.origin);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set('token', token);
  return u.pathname + u.search;
}

export async function api(caminho, { metodo = 'GET', corpo, params } = {}) {
  const headers = { 'x-painel-token': token };
  if (corpo !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(urlApi(caminho, params), {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro ?? `Não foi possível concluir a operação (${r.status})`);
  return dados;
}
