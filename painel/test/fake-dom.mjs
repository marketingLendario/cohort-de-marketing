// DOM mínimo para testar os módulos de web/ sem navegador.
export class No {
  constructor(tag) {
    this.tag = tag; this.children = []; this.className = ''; this.hidden = false;
    this._texto = ''; this.scrollTop = 0; this.scrollHeight = 0; this.ouvintes = {}; this.style = {};
  }
  set textContent(v) { this._texto = String(v); this.children = []; }
  get textContent() { return this._texto + this.children.map((c) => c.textContent).join(''); }
  append(...nos) {
    for (const n of nos) {
      if (n.tag === '#fragmento') { n.children.forEach((c) => { c.parent = this; }); this.children.push(...n.children); }
      else { n.parent?.children && n.parent !== this && n.remove(); n.parent = this; this.children.push(n); }
    }
  }
  replaceChildren(...nos) { this.children = []; this._texto = ''; this.append(...nos); }
  querySelector() { return this.campo ?? (this.campo = new No('textarea')); }
  addEventListener(t, f) { this.ouvintes[t] = f; }
  setAttribute(k, v) { (this.atributos ??= {})[k] = String(v); }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
}

export function instalarAmbiente() {
  const fontes = [];
  const pedidos = [];
  class EventSource {
    constructor(url) { this.url = url; this.fechada = false; fontes.push(this); }
    close() { this.fechada = true; }
    emitir(ev) { if (!this.fechada) this.onmessage?.({ data: JSON.stringify(ev) }); }
  }
  globalThis.EventSource = EventSource;
  globalThis.document = {
    querySelector: () => ({ content: 'tok' }),
    createElement: (t) => new No(t),
    createDocumentFragment: () => new No('#fragmento'),
    createTextNode: (t) => { const n = new No('#texto'); n.textContent = t; return n; },
  };
  globalThis.location = { origin: 'http://127.0.0.1:1' };
  globalThis.alert = () => {};
  // fetch controlado: cada chamada devolve uma promessa que o teste resolve à mão.
  globalThis.fetch = (url, opcoes = {}) => new Promise((resolve, reject) => {
    pedidos.push({
      url, metodo: opcoes.method ?? 'GET',
      responder: (dados) => resolve({ ok: true, json: async () => dados }),
      falhar: (e) => reject(e),
    });
  });
  return { fontes, pedidos };
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
export const tick = () => new Promise((r) => setImmediate(r));
