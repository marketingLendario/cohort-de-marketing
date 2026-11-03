// Barra de escrita fixa: escolhe a skill (botão Skills ou "/" no início do texto)
// e envia. Com skill escolhida, inicia uma execução nova; sem skill, responde à
// conversa aberta. As skills aparecem em blocos de uso (blocos.js).
import { agruparSkills } from './blocos.js';

export function criarComposer({ form, campo, botaoSkill, chip, chipNome, tirarSkill, popover, busca, lista, enviar, aoEnviar }) {
  let skills = [];
  let sugeridas = [];
  let skill = null;
  let marcado = 0;
  let filtradas = [];
  let estado = { temCliente: false, podeResponder: false };
  let enviando = false;

  function ajustarAltura() {
    campo.style.height = 'auto';
    campo.style.height = `${Math.min(campo.scrollHeight, 220)}px`;
  }

  function atualizar() {
    chip.hidden = !skill;
    chipNome.textContent = skill ? `/${skill}` : '';
    let dica;
    if (!estado.temCliente) dica = 'Cadastre ou escolha um cliente para começar';
    else if (skill) dica = `Diga o que a /${skill} deve fazer (opcional) e envie`;
    else if (estado.podeResponder) dica = 'Responda ou peça um ajuste';
    else dica = 'Escolha uma skill para começar';
    campo.placeholder = dica;
    const temTexto = campo.value.trim().length > 0;
    enviar.disabled = enviando || !estado.temCliente || !(skill || (estado.podeResponder && temTexto));
  }

  function filtro() {
    if (!popover.hidden && document.activeElement === busca) return busca.value;
    const m = campo.value.match(/^\/(\S*)$/);
    return m ? m[1] : busca.value;
  }

  function desenharLista() {
    const grupos = agruparSkills(skills, { filtro: filtro(), sugeridas });
    filtradas = grupos.flatMap((g) => g.itens);
    marcado = Math.min(marcado, Math.max(filtradas.length - 1, 0));
    lista.replaceChildren();
    if (filtradas.length === 0) {
      const li = document.createElement('li');
      li.className = 'desc';
      li.textContent = 'Nenhuma skill com esse nome.';
      lista.append(li);
      return;
    }
    let i = 0;
    let marcadoLi = null;
    for (const g of grupos) {
      const cab = document.createElement('li');
      cab.className = 'grupo';
      cab.setAttribute('role', 'presentation');
      cab.textContent = g.titulo;
      lista.append(cab);
      for (const s of g.itens) {
        const indice = i++;
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(indice === marcado));
        const nome = document.createElement('span');
        nome.className = 'nome';
        nome.textContent = `/${s.name}`;
        const desc = document.createElement('span');
        desc.className = 'desc';
        desc.textContent = s.description;
        li.title = s.description;
        li.append(nome, desc);
        li.addEventListener('mousedown', (e) => { e.preventDefault(); escolher(s.name); });
        li.addEventListener('mousemove', () => {
          if (marcado === indice) return;
          marcado = indice;
          for (const o of lista.querySelectorAll('[role="option"]')) o.setAttribute('aria-selected', 'false');
          li.setAttribute('aria-selected', 'true');
        });
        if (indice === marcado) marcadoLi = li;
        lista.append(li);
      }
    }
    marcadoLi?.scrollIntoView({ block: 'nearest' });
  }

  function abrirPopover(focarBusca) {
    popover.hidden = false;
    botaoSkill.setAttribute('aria-expanded', 'true');
    marcado = 0;
    desenharLista();
    if (focarBusca) { busca.value = ''; busca.focus(); desenharLista(); }
  }

  function fecharPopover() {
    popover.hidden = true;
    botaoSkill.setAttribute('aria-expanded', 'false');
  }

  function escolher(nome) {
    skill = nome;
    if (/^\/\S*$/.test(campo.value)) campo.value = '';
    fecharPopover();
    atualizar();
    campo.focus();
  }

  function navegar(e) {
    if (popover.hidden) return false;
    if (e.key === 'ArrowDown') { marcado = Math.min(marcado + 1, filtradas.length - 1); desenharLista(); return true; }
    if (e.key === 'ArrowUp') { marcado = Math.max(marcado - 1, 0); desenharLista(); return true; }
    if (e.key === 'Enter' && filtradas[marcado]) { escolher(filtradas[marcado].name); return true; }
    if (e.key === 'Escape') { fecharPopover(); campo.focus(); return true; }
    return false;
  }

  async function submeter() {
    if (enviar.disabled) return;
    const texto = campo.value.trim();
    enviando = true;
    atualizar();
    try {
      await aoEnviar({ skill, texto });
      campo.value = '';
      skill = null;
      ajustarAltura();
    } catch (e) {
      alert(e.message);
    } finally {
      enviando = false;
      atualizar();
    }
  }

  campo.addEventListener('input', () => {
    ajustarAltura();
    if (/^\/\S*$/.test(campo.value) && !skill) {
      if (popover.hidden) abrirPopover(false); else desenharLista();
    } else if (!popover.hidden && document.activeElement === campo) {
      fecharPopover();
    }
    atualizar();
  });
  campo.addEventListener('keydown', (e) => {
    if (navegar(e)) { e.preventDefault(); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submeter(); }
    if (e.key === 'Backspace' && !campo.value && skill) { skill = null; atualizar(); }
  });
  busca.addEventListener('input', () => { marcado = 0; desenharLista(); });
  busca.addEventListener('keydown', (e) => { if (navegar(e)) e.preventDefault(); });
  botaoSkill.addEventListener('click', () => (popover.hidden ? abrirPopover(true) : fecharPopover()));
  tirarSkill.addEventListener('click', () => { skill = null; atualizar(); campo.focus(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); submeter(); });
  document.addEventListener('mousedown', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && e.target !== botaoSkill && !botaoSkill.contains(e.target)) fecharPopover();
  });

  return {
    definirSkills(lista) { skills = lista; },
    definirSugestoes(lista) { sugeridas = lista; },
    escolher(nome) { escolher(nome); },
    abrirSkills() { abrirPopover(true); },
    definirEstado(novo) { estado = { ...estado, ...novo }; atualizar(); },
    focar() { campo.focus(); },
  };
}
