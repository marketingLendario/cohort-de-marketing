/* @ds-bundle: {"format":3,"namespace":"LendRIADesignSystem_096da5","components":[{"name":"BookCard","sourcePath":"components/brand/BookCard.jsx"},{"name":"SectionHeader","sourcePath":"components/brand/SectionHeader.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardDescription","sourcePath":"components/core/Card.jsx"},{"name":"CardContent","sourcePath":"components/core/Card.jsx"},{"name":"CardFooter","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Alert","sourcePath":"components/display/Alert.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Progress","sourcePath":"components/display/Progress.jsx"},{"name":"StatChip","sourcePath":"components/display/StatChip.jsx"},{"name":"Tabs","sourcePath":"components/display/Tabs.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Label","sourcePath":"components/forms/Label.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"}],"sourceHashes":{"app-nav.js":"3bc9af444ea8","app-search.js":"a91b0ab036ad","components/brand/BookCard.jsx":"4289f9166adb","components/brand/SectionHeader.jsx":"d6b1cd4fe66d","components/core/Badge.jsx":"bf35a1f55ab6","components/core/Button.jsx":"dbc87fbe31b7","components/core/Card.jsx":"7ce8832ad3e0","components/core/Icon.jsx":"1b13afaa9a09","components/display/Alert.jsx":"86d15a7e2ed5","components/display/Avatar.jsx":"3a6ae4446d60","components/display/Progress.jsx":"6b82fb6dc017","components/display/StatChip.jsx":"fa1034c53895","components/display/Tabs.jsx":"31765056a7f1","components/forms/Checkbox.jsx":"14a60f5c2c2f","components/forms/Input.jsx":"ed335ba816f4","components/forms/Label.jsx":"d7560e849211","components/forms/Switch.jsx":"7a88a6aaecb9","components/forms/Textarea.jsx":"fb455252f866","comunidade/chrome.jsx":"e1abd9d18c8d","comunidade/image-slot.js":"9309434cb09c","comunidade/mensagens-data.js":"b4321fe5dec2","comunidade/notif-panel.jsx":"b3a45b70cc13","cursos/AuroraPanel.jsx":"277d3735d694","cursos/CourseDetail.jsx":"cab3aee26d92","cursos/CourseTopbar.jsx":"49544d9f598e","cursos/ExplorarAIFirst.jsx":"1d4f6a69461e","cursos/ExplorarCursos.jsx":"9d7ce3b60c8f","cursos/ExplorarEssencial.jsx":"b2c1c910288c","cursos/LessonPlayer.jsx":"d8c7b48cb93d","cursos/LessonTabs.jsx":"37b054ba7d67","cursos/OnboardingFlow.jsx":"9860cb238dbc","cursos/OnboardingScreens.jsx":"8bddf5f7ffca","cursos/ProjetoDetalhe.jsx":"5da4527424d1","cursos/ProjetoPersonalizado.jsx":"621b8a858324","cursos/ProjetosCatalogo.jsx":"f84ce2c811fa","cursos/ProntoSocorro.jsx":"8067a37226af","cursos/TrilhaDetalhe.jsx":"87e8611d2fed","cursos/TrilhasCatalogo.jsx":"11d48beae96c","cursos/TutorPanel.jsx":"19c76e0aee23","cursos/aurora-data.js":"d1cc49296407","cursos/curso-data.js":"062b8aab039f","cursos/explorar-data.js":"15978d7a401a","cursos/image-slot.js":"9309434cb09c","cursos/onboarding-data.js":"fc6e892fd7b0","cursos/projetos-data.js":"dc841d57ba7d","cursos/trilhas-data.js":"7ac012d84280","cursos/tweaks-panel.jsx":"6591467622ed","estrategia/estrategia-nav.js":"d35dd5dd19c3","explorations/design-canvas.jsx":"bd8746af6e58","explorations/dir-editorial.jsx":"6c3d8a354ce7","explorations/dir-galeria.jsx":"a0ea6da905d7","explorations/dir-obsidiana.jsx":"e7cdaa633f76","explorations/dir-shared.jsx":"10180a879446","livros/ios-frame.jsx":"be3343be4b51","livros/livro-app.jsx":"48db39387855","livros/livro-data.js":"4c2d903b8740","livros/livro-detail.jsx":"9087a703c985","livros/livro-player.jsx":"453263f82747","livros/livro-reader.jsx":"37be676041a9","livros/livro-review.jsx":"2175226a154b","livros/livro-ui.jsx":"bdee7930874d","livros/tweaks-panel.jsx":"6591467622ed","quick-search.js":"22f324e15238","site/arvore-data.js":"788b3c25b81c","site/espelho.js":"99304b4a9639","site/site-fx.js":"0c41620201e1","theme.js":"dc24bca3eb17","ui_kits/lendaria_app/AppSidebar.jsx":"8fc74aba6b4b","ui_kits/lendaria_app/LibraryScreen.jsx":"2ca9b390f564","ui_kits/lendaria_app/LoginScreen.jsx":"16da2a0ec503","ui_kits/lendaria_app/PlayerScreen.jsx":"d60be80b958b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LendRIADesignSystem_096da5 = window.LendRIADesignSystem_096da5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app-nav.js
try { (() => {
/* =============================================================================
   LENDÁR[IA] — navegação compartilhada entre as seções do produto
   -----------------------------------------------------------------------------
   FONTE ÚNICA dos destinos canônicos de cada seção (Livros · Cursos · Comunidade).
   Carregue este arquivo em TODAS as páginas do app para manter os links
   consistentes — basta usar `data-nav="<chave>"` em qualquer <a>:

       <a data-nav="cursos">Cursos</a>
       <a data-nav="comunidade">Comunidade</a>
       <a data-nav="livros">Livros</a>

   O script resolve o href relativo correto (independente da pasta atual),
   marca a seção atual como ativa (classe .on + aria-current) e re-aplica em
   conteúdo renderizado dinamicamente (React) via MutationObserver.

   Componentes JS podem ler o destino direto:  window.LendariaNav.href('cursos')
   ============================================================================= */
(function () {
  'use strict';

  /* Destino canônico de cada seção. Mude AQUI e todo o app acompanha. */
  var SECTIONS = {
    livros: {
      dir: 'livros',
      file: 'Explorar - Alternativa Editorial.html',
      label: 'Livros'
    },
    cursos: {
      dir: 'cursos',
      file: 'Explorar - Cursos.html',
      label: 'Cursos'
    },
    comunidade: {
      dir: 'comunidade',
      file: 'Feed.html',
      label: 'Comunidade'
    }
  };

  /* Pasta da página atual, ex.: ".../livros/Foo.html" -> "livros" */
  var segs = location.pathname.split('/').filter(Boolean);
  var currentDir = segs.length >= 2 ? decodeURIComponent(segs[segs.length - 2]) : '';

  /* Resolve o href de uma seção a partir da página atual.
     Todas as seções vivem um nível abaixo da raiz do projeto. */
  function href(key) {
    var s = SECTIONS[key];
    if (!s) return '#';
    var path = (s.dir === currentDir ? '' : '../' + s.dir + '/') + s.file;
    return path.split('/').map(encodeURIComponent).join('/');
  }
  function isActive(key) {
    var s = SECTIONS[key];
    return s && s.dir === currentDir;
  }

  /* Aplica href + estado ativo a um <a data-nav="chave">. */
  function wire(a) {
    var key = a.getAttribute('data-nav');
    if (!key || !SECTIONS[key]) return;
    if (a.getAttribute('data-nav-done') === '1') return;
    a.href = href(key);
    if (isActive(key)) {
      a.classList.add('on');
      a.setAttribute('aria-current', 'page');
    }
    a.setAttribute('data-nav-done', '1');
  }
  function wireAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var list = scope.querySelectorAll('a[data-nav]');
    for (var i = 0; i < list.length; i++) wire(list[i]);
  }

  /* API pública para componentes que montam links via JS. */
  window.LendariaNav = {
    sections: SECTIONS,
    currentDir: currentDir,
    href: href,
    label: function (key) {
      return SECTIONS[key] ? SECTIONS[key].label : '';
    },
    isActive: isActive,
    wire: wire,
    wireAll: wireAll
  };

  /* Aplica agora e quando o DOM estiver pronto. */
  wireAll(document);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireAll(document);
    });
  }

  /* React e afins: re-aplica em nós inseridos depois. */
  if (window.MutationObserver) {
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches('a[data-nav]')) wire(n);
          if (n.querySelectorAll) wireAll(n);
        }
      }
    });
    var start = function () {
      if (document.body) obs.observe(document.body, {
        childList: true,
        subtree: true
      });
    };
    if (document.body) start();else document.addEventListener('DOMContentLoaded', start);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app-nav.js", error: String((e && e.message) || e) }); }

// app-search.js
try { (() => {
/* =============================================================================
   Lendár[IA] — Busca global unificada (command palette)
   -----------------------------------------------------------------------------
   UMA busca para as três áreas (Cursos · Livros · Comunidade). Substitui a
   antiga busca só-de-livros. Abre por ⌘K / Ctrl+K ou clicando em qualquer
   gatilho conhecido: .mast-search (Livros) · .ct-search (Cursos) ·
   [data-app-search] (Comunidade e outros).

   Idempotente: pode ser injetada por mais de um chrome sem duplicar.
   Exposto: window.AppSearch.open() / .close() / .toggle()
   ============================================================================= */
(function () {
  if (window.AppSearch) return;

  /* Índice curado, multiárea. href resolvido relativo à raiz a partir de
     qualquer página de área (todas vivem um nível abaixo da raiz). */
  var INDEX = [
  // Cursos
  {
    area: 'cursos',
    icon: 'play-solid',
    title: 'PS AIOX Fundamentals',
    sub: 'Curso · Fundamentos',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'brain',
    title: 'Introdução à IA',
    sub: 'Curso · Fundamentos',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'chat-bubble',
    title: 'Engenharia de Prompt Lendária',
    sub: 'Curso · Fundamentos',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'cpu',
    title: 'Agentes Autônomos na Prática',
    sub: 'Curso · Agentes',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'user',
    title: 'Mentes Sintéticas',
    sub: 'Curso · Agentes',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'code',
    title: 'Vibecoding — apps sem código',
    sub: 'Curso · Programação',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'magnet',
    title: 'Vendas Magnéticas',
    sub: 'Curso · Negócios',
    file: 'Curso - PS AIOX Fundamentals.html'
  }, {
    area: 'cursos',
    icon: 'pathfinder',
    title: 'Trilha · Operador de IA',
    sub: 'Trilha · do prompt ao agente',
    file: 'Trilha - Operador de IA.html'
  }, {
    area: 'cursos',
    icon: 'collage',
    title: 'Projetos PBL',
    sub: 'Catálogo · entregas com prova',
    file: 'Projetos.html'
  }, {
    area: 'cursos',
    icon: 'building',
    title: 'Projeto · Central de Operações',
    sub: 'Projeto guiado',
    file: 'Projeto - Central de Operações.html'
  }, {
    area: 'cursos',
    icon: 'sparks',
    title: 'Mentor[IA] · Pronto-Socorro',
    sub: 'Tutor contextual ao vivo',
    file: 'Pronto Socorro.html'
  }, {
    area: 'cursos',
    icon: 'book-stack',
    title: 'Explorar cursos',
    sub: 'Catálogo completo',
    file: 'Explorar - Cursos.html'
  },
  // Livros
  {
    area: 'livros',
    icon: 'book',
    title: 'Trabalhe 4 Horas por Semana',
    sub: 'Tim Ferriss · resumo',
    file: 'Leitor - Trabalhe 4 Horas por Semana.html'
  }, {
    area: 'livros',
    icon: 'book',
    title: 'A Arte da Guerra',
    sub: 'Sun Tzu · audiolivro',
    file: 'Player - A Arte da Guerra.html'
  }, {
    area: 'livros',
    icon: 'book',
    title: 'Disciplina Positiva',
    sub: 'Jane Nelsen',
    file: 'Livro - Disciplina Positiva.html'
  }, {
    area: 'livros',
    icon: 'book',
    title: 'Como Fazer Amigos e Influenciar',
    sub: 'Dale Carnegie',
    file: 'Avaliação - Como Fazer Amigos.html'
  }, {
    area: 'livros',
    icon: 'bookmark-book',
    title: 'O Almanaque de Naval Ravikant',
    sub: 'Eric Jorgenson',
    file: 'Autor - Naval Ravikant.html'
  }, {
    area: 'livros',
    icon: 'bookmark-book',
    title: 'Biblioteca de Naval',
    sub: 'Coleção curada',
    file: 'Coleção - Biblioteca de Naval.html'
  }, {
    area: 'livros',
    icon: 'user',
    title: 'Naval Ravikant',
    sub: 'Autor · Filosofia & Riqueza',
    file: 'Autor - Naval Ravikant.html'
  }, {
    area: 'livros',
    icon: 'group',
    title: 'Autores & Mentores',
    sub: 'Naval, Carnegie, Sun Tzu…',
    file: 'Autores.html'
  }, {
    area: 'livros',
    icon: 'bookmark',
    title: 'Minha Biblioteca',
    sub: 'Sua estante',
    file: 'Meus Livros - Minha Biblioteca.html'
  }, {
    area: 'livros',
    icon: 'book-stack',
    title: 'Explorar acervo',
    sub: 'Curadoria editorial',
    file: 'Explorar - Alternativa Editorial.html'
  },
  // Comunidade
  {
    area: 'comunidade',
    icon: 'home-simple',
    title: 'Feed da Comunidade',
    sub: 'O que está rodando agora',
    file: 'Feed.html'
  }, {
    area: 'comunidade',
    icon: 'calendar',
    title: 'Plantão AIOX · ao vivo',
    sub: 'Eventos & gravações',
    file: 'Eventos.html'
  }, {
    area: 'comunidade',
    icon: 'trophy',
    title: 'Ranking da Season',
    sub: 'Lendários da temporada',
    file: 'Ranking.html'
  }, {
    area: 'comunidade',
    icon: 'group',
    title: 'Lendários',
    sub: 'Membros da comunidade',
    file: 'Lendarios.html'
  }, {
    area: 'comunidade',
    icon: 'chat-bubble',
    title: 'Mensagens',
    sub: 'Conversas diretas e squads',
    file: 'Mensagens.html'
  }, {
    area: 'comunidade',
    icon: 'user',
    title: 'Meu perfil',
    sub: 'Sua jornada lendária',
    file: 'Perfil.html'
  }];
  var AREA_LABEL = {
    cursos: 'Cursos',
    livros: 'Livros',
    comunidade: 'Comunidade'
  };
  function href(item) {
    return '../' + item.area + '/' + encodeURI(item.file);
  }

  /* ---- estilos ---- */
  var css = '' + '.as-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:flex-start;justify-content:center;padding-top:14vh;background:hsl(0 0% 0% / 0.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}' + '.as-overlay.open{display:flex;}' + '.as-panel{width:min(580px,92vw);background:var(--popover);border:1px solid var(--hairline-strong);border-radius:var(--radius-xl);box-shadow:var(--shadow-modal);overflow:hidden;}' + '@media (prefers-reduced-motion:no-preference){.as-overlay.open .as-panel{animation:as-pop .16s var(--ease-out) both;}}' + '@keyframes as-pop{from{transform:translateY(-6px)}to{transform:none}}' + '.as-field{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--hairline);}' + '.as-field i{font-size:18px;color:var(--primary);}' + '.as-field input{flex:1;background:transparent;border:none;outline:none;color:var(--foreground);font-family:var(--font-sans);font-size:15px;}' + '.as-field input::placeholder{color:var(--muted-foreground);}' + '.as-field kbd{font-family:var(--font-mono);font-size:9px;color:var(--muted-foreground);border:1px solid var(--hairline);border-radius:3px;padding:2px 6px;letter-spacing:.04em;}' + '.as-list{max-height:48vh;overflow-y:auto;padding:8px;}' + '.as-sec{font-family:var(--font-mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-foreground);padding:12px 12px 6px;}' + '.as-item{display:flex;align-items:center;gap:13px;padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;text-decoration:none;color:inherit;}' + '.as-item.sel,.as-item:hover{background:hsl(var(--primary-hsl) / 0.08);}' + '.as-item>i{font-size:17px;color:var(--muted-foreground);width:22px;text-align:center;flex-shrink:0;}' + '.as-item.sel>i,.as-item:hover>i{color:var(--primary);}' + '.as-meta{min-width:0;flex:1;}' + '.as-t{display:block;font-family:var(--font-sans);font-size:14px;color:var(--foreground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' + '.as-s{display:block;font-family:var(--font-serif);font-style:italic;font-size:12px;color:var(--muted-foreground);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' + '.as-badge{font-family:var(--font-mono);font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted-foreground);border:1px solid var(--hairline);border-radius:var(--radius-full);padding:2px 8px;flex-shrink:0;}' + '.as-empty{padding:22px 14px;text-align:center;font-family:var(--font-serif);font-style:italic;font-size:14px;color:var(--muted-foreground);}' + '.as-cue{font-family:var(--font-mono);font-size:9px;letter-spacing:.08em;color:var(--muted-foreground);border:1px solid var(--hairline);border-radius:4px;padding:2px 6px;flex-shrink:0;}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---- DOM ---- */
  var overlay = document.createElement('div');
  overlay.className = 'as-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Busca global');
  overlay.innerHTML = '<div class="as-panel">' + '<div class="as-field"><i class="iconoir-search"></i>' + '<input type="text" placeholder="Buscar cursos, livros, eventos, pessoas…" aria-label="Buscar" autocomplete="off" spellcheck="false">' + '<kbd>ESC</kbd></div>' + '<div class="as-list"></div></div>';
  function mount() {
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', mount, {
        once: true
      });
    }
  }
  mount();
  var input = overlay.querySelector('input');
  var list = overlay.querySelector('.as-list');
  var sel = 0;
  var flat = [];
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function render(q) {
    var term = (q || '').trim().toLowerCase();
    var hits = INDEX.filter(function (it) {
      return !term || (it.title + ' ' + it.sub + ' ' + AREA_LABEL[it.area]).toLowerCase().indexOf(term) !== -1;
    });
    flat = hits;
    sel = 0;
    if (hits.length === 0) {
      list.innerHTML = '<div class="as-empty">Nada encontrado para “' + esc(q.trim()) + '”.</div>';
      return;
    }
    var html = '';
    var lastArea = null;
    hits.forEach(function (it, i) {
      if (it.area !== lastArea) {
        html += '<div class="as-sec">' + AREA_LABEL[it.area] + '</div>';
        lastArea = it.area;
      }
      html += '<a class="as-item' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '" href="' + href(it) + '">' + '<i class="iconoir-' + it.icon + '"></i>' + '<span class="as-meta"><span class="as-t">' + esc(it.title) + '</span><span class="as-s">' + esc(it.sub) + '</span></span>' + '<span class="as-badge">' + AREA_LABEL[it.area] + '</span></a>';
    });
    list.innerHTML = html;
  }
  function syncSel() {
    var items = list.querySelectorAll('.as-item');
    items.forEach(function (el, i) {
      el.classList.toggle('sel', i === sel);
      if (i === sel) {
        el.scrollIntoView({
          block: 'nearest'
        });
      }
    });
  }
  function open() {
    overlay.classList.add('open');
    render('');
    setTimeout(function () {
      input.focus();
      input.select();
    }, 20);
  }
  function close() {
    overlay.classList.remove('open');
    input.value = '';
  }
  function toggle() {
    overlay.classList.contains('open') ? close() : open();
  }
  input.addEventListener('input', function () {
    render(input.value);
  });
  input.addEventListener('keydown', function (e) {
    var items = list.querySelectorAll('.as-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length) {
        sel = (sel + 1) % items.length;
        syncSel();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) {
        sel = (sel - 1 + items.length) % items.length;
        syncSel();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[sel]) {
        window.location.href = href(flat[sel]);
      }
    }
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      toggle();
    } else if (e.key === 'Escape' && overlay.classList.contains('open')) {
      close();
    }
  });

  /* ---- liga gatilhos existentes ---- */
  function wireTriggers(root) {
    var nodes = (root || document).querySelectorAll('.mast-search, .ct-search, [data-app-search]');
    nodes.forEach(function (el) {
      if (el.getAttribute('data-as-wired')) return;
      el.setAttribute('data-as-wired', '1');
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });
  }
  wireTriggers();
  // chrome React pode montar a barra após este script — religa em alguns passos.
  [0, 200, 600, 1500].forEach(function (t) {
    setTimeout(function () {
      wireTriggers();
    }, t);
  });
  document.addEventListener('DOMContentLoaded', function () {
    wireTriggers();
  });
  window.AppSearch = {
    open: open,
    close: close,
    toggle: toggle
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app-search.js", error: String((e && e.message) || e) }); }

// components/brand/BookCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Inline iconoir glyph (avoids cross-directory import) */
function BkIcon({
  name,
  size = 16,
  color
}) {
  return /*#__PURE__*/React.createElement("i", {
    className: `iconoir-${name}`,
    "aria-hidden": "true",
    style: {
      fontSize: size,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color
    }
  });
}

/* Deterministic gradient per slug — mirrors getSimpleGradient in the app */
const gradients = [['#3f2d23', '#1d1410'], ['#23303f', '#10161d'], ['#2d233f', '#14101d'], ['#233f2d', '#101d14'], ['#3f2338', '#1d1018'], ['#3f3923', '#1d1a10']];
function pickGradient(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return gradients[h % gradients.length];
}

/**
 * Item de estante editorial — sem caixa: capa que sobe levemente no hover
 * (sombra funda, sem aura), título serif, autor serif itálico, status em mono.
 */
function BookCard({
  title,
  author,
  category = 'Livro',
  coverUrl,
  status,
  bookmarked = false,
  onClick,
  className = '',
  ...props
}) {
  const [g1, g2] = pickGradient(title);
  const statusConfig = {
    read: {
      label: 'LIDO',
      icon: 'check',
      cls: 'al-bookcard__status--read'
    },
    reading: {
      label: 'LENDO',
      icon: 'book',
      cls: 'al-bookcard__status--reading'
    }
  }[status];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-bookcard ${className}`,
    onClick: onClick
  }, props), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__topbar"
  }, /*#__PURE__*/React.createElement("span", null, statusConfig && /*#__PURE__*/React.createElement("span", {
    className: `al-bookcard__status ${statusConfig.cls}`
  }, /*#__PURE__*/React.createElement(BkIcon, {
    name: statusConfig.icon,
    size: 12
  }), statusConfig.label)), /*#__PURE__*/React.createElement("button", {
    className: "al-bookcard__fav",
    "aria-label": "Favoritar"
  }, /*#__PURE__*/React.createElement(BkIcon, {
    name: "star",
    size: 14,
    color: bookmarked ? 'var(--primary)' : undefined
  }))), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__aura"
  }), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__cover"
  }, coverUrl ? /*#__PURE__*/React.createElement("img", {
    src: coverUrl,
    alt: title,
    loading: "lazy",
    decoding: "async"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__fallback",
    style: {
      background: `linear-gradient(135deg, ${g1}, ${g2})`
    }
  }, /*#__PURE__*/React.createElement(BkIcon, {
    name: "book",
    size: 16,
    color: "rgba(255,255,255,0.5)"
  }), /*#__PURE__*/React.createElement("span", null, title)), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__spine"
  })), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__shadow"
  })), /*#__PURE__*/React.createElement("div", {
    className: "al-bookcard__info"
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-bookcard__category"
  }, category), /*#__PURE__*/React.createElement("h4", {
    className: "al-bookcard__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "al-bookcard__author"
  }, author)));
}
Object.assign(__ds_scope, { BookCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/BookCard.jsx", error: String((e && e.message) || e) }); }

// components/brand/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Section header — eyebrow + big title + hairline rule fading right.
 * The signature rhythm of every list section in the app.
 */
function SectionHeader({
  eyebrow,
  title,
  action,
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-section-header ${className}`
  }, props), /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("p", {
    className: "al-section-header__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "al-section-header__title"
  }, title)), /*#__PURE__*/React.createElement("div", {
    className: "al-hairline"
  }), action && /*#__PURE__*/React.createElement("div", {
    className: "al-section-header__action"
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge / pill — mirrors app/components/ui/badge.tsx.
 */
function Badge({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) {
  const sizeClass = size !== 'default' ? ` al-badge--size-${size}` : '';
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `al-badge al-badge--${variant}${sizeClass} ${className}`
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Lendár[IA] Button — caps tracked, cantos de 2px, zero efeito.
 * Variants: default (ouro preenchido — o CTA raro), outline (hairline dourada,
 * a assinatura editorial), secondary, ghost, destructive (contornado),
 * link (serif itálica), cta (default em tamanho cerimonial).
 * 'glowing' é legado e renderiza como outline quieto.
 */
function Button({
  variant = 'default',
  size = 'default',
  type = 'button',
  // default to 'button' so Buttons inside <form> never submit by accident
  className = '',
  children,
  ...props
}) {
  const sizeClass = size !== 'default' ? ` al-btn--size-${size}` : '';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: `al-btn al-btn--${variant}${sizeClass} ${className}`
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card family — mirrors app/components/ui/card.tsx.
 */
function Card({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-card ${className}`
  }, props), children);
}
function CardHeader({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-card__header ${className}`
  }, props), children);
}
function CardTitle({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("h3", _extends({
    className: `al-card__title ${className}`
  }, props), children);
}
function CardDescription({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    className: `al-card__description ${className}`
  }, props), children);
}
function CardContent({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-card__content ${className}`
  }, props), children);
}
function CardFooter({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-card__footer ${className}`
  }, props), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Pinned npm release (immutable) — the @main git branch is mutable and a supply-chain risk.
const ICONOIR_CSS = 'https://cdn.jsdelivr.net/npm/iconoir@7.11.0/css/iconoir.css';

/** Inject the Iconoir webfont stylesheet once. */
function ensureIconoir() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-al-iconoir]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = ICONOIR_CSS;
  link.setAttribute('data-al-iconoir', 'true');
  document.head.appendChild(link);
}
const sizeMap = {
  'size-3': 12,
  'size-4': 14,
  'size-5': 16,
  'size-6': 18,
  'size-7': 20,
  'size-8': 24,
  'size-9': 30,
  'size-10': 36
};

/**
 * Iconoir icon — same glyph names (kebab-case) as the production app:
 * book, play-circle, users, brain, search, settings, arrow-left, star, …
 */
function Icon({
  name,
  size = 'size-5',
  color,
  className = '',
  style = {},
  ...props
}) {
  ensureIconoir();
  const px = typeof size === 'number' ? size : sizeMap[size] || 16;
  return /*#__PURE__*/React.createElement("i", _extends({
    className: `iconoir-${name} ${className}`,
    "aria-hidden": "true",
    style: {
      fontSize: px,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      ...style
    }
  }, props));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/display/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Inline alert — tinted border + 5% tinted background, light-weight text. */
function Alert({
  variant = 'info',
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-alert al-alert--${variant} ${className}`,
    role: "alert"
  }, props), children);
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Alert.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const avatarSizes = {
  sm: 32,
  default: 40,
  lg: 56,
  xl: 80
};

/** Avatar — image or initials fallback. */
function Avatar({
  src,
  name = '',
  size = 'default',
  className = '',
  style = {},
  ...props
}) {
  const px = typeof size === 'number' ? size : avatarSizes[size] || 40;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `al-avatar ${className}`,
    style: {
      width: px,
      height: px,
      fontSize: px * 0.38,
      ...style
    }
  }, props), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    loading: "lazy",
    decoding: "async"
  }) : /*#__PURE__*/React.createElement("span", null, initials || '•'));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Progress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Progress bar — gold fill on secondary track. */
function Progress({
  value = 0,
  max = 100,
  className = '',
  ...props
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-progress ${className}`,
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": max
  }, props), /*#__PURE__*/React.createElement("div", {
    className: "al-progress__bar",
    style: {
      width: `${pct}%`
    }
  }));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Progress.jsx", error: String((e && e.message) || e) }); }

// components/display/StatChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatChip — par label/valor em cápsula: mono caps + serif.
 * The single source for the "MEMBROS · 3.847" pattern (community heroes,
 * dashboards, podium stats) — replaces per-page reimplementations.
 */
function StatChip({
  label,
  value,
  tone,
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `al-stat ${className}`
  }, props), /*#__PURE__*/React.createElement("span", {
    className: "al-stat__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "al-stat__value",
    style: tone ? {
      color: `var(--${tone})`
    } : undefined
  }, value));
}
Object.assign(__ds_scope, { StatChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatChip.jsx", error: String((e && e.message) || e) }); }

// components/display/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useRef
} = React;
/**
 * Tabs — sublinhado editorial: lista sobre hairline, ativo ganha régua dourada.
 * items: [{ value, label }]
 *
 * Keyboard interaction follows the WAI-ARIA Tabs pattern with automatic
 * activation: roving tabindex (only the active tab is in the tab order),
 * ArrowLeft/ArrowRight move with wrap-around, Home/End jump to the edges.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onValueChange,
  className = '',
  ...props
}) {
  const [internal, setInternal] = useState(defaultValue || items[0] && items[0].value);
  const active = value !== undefined ? value : internal;
  const triggerRefs = useRef([]);
  const select = v => {
    if (value === undefined) setInternal(v);
    if (onValueChange) onValueChange(v);
  };

  // Move focus to the target trigger and activate it (automatic activation).
  const focusAndSelect = index => {
    const item = items[index];
    if (!item) return;
    select(item.value);
    const el = triggerRefs.current[index];
    if (el) el.focus();
  };
  const handleKeyDown = (event, index) => {
    let target = null;
    switch (event.key) {
      case 'ArrowRight':
        target = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
        target = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    focusAndSelect(target);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-tabs__list ${className}`,
    role: "tablist"
  }, props), items.map((item, index) => {
    const isActive = active === item.value;
    return /*#__PURE__*/React.createElement("button", {
      key: item.value,
      ref: el => {
        triggerRefs.current[index] = el;
      },
      type: "button",
      role: "tab",
      "aria-selected": isActive,
      tabIndex: isActive ? 0 : -1,
      "data-active": isActive ? 'true' : 'false',
      className: "al-tabs__trigger",
      onClick: () => select(item.value),
      onKeyDown: event => handleKeyDown(event, index)
    }, item.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Checkbox — gold fill + dark check when checked. */
function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className = '',
  ...props
}) {
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    if (onCheckedChange) onCheckedChange(next);
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "checkbox",
    "aria-checked": isOn,
    "data-checked": isOn ? 'true' : 'false',
    className: `al-checkbox ${className}`,
    onClick: toggle
  }, props), isOn && /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 10 10",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1.5 5.5L4 8L8.5 2.5",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input — mirrors app/components/ui/input.tsx (semibold value text). */
function Input({
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: `al-input ${className}`
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Label.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Form field label. */
function Label({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    className: `al-field-label ${className}`
  }, props), children);
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Label.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Toggle switch — gold when on. Controlled (checked/onCheckedChange) or uncontrolled. */
function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className = '',
  ...props
}) {
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    if (onCheckedChange) onCheckedChange(next);
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": isOn,
    "data-checked": isOn ? 'true' : 'false',
    className: `al-switch ${className}`,
    onClick: toggle
  }, props), /*#__PURE__*/React.createElement("span", {
    className: "al-switch__thumb"
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multiline input sharing the Input recipe. */
function Textarea({
  className = '',
  rows = 4,
  ...props
}) {
  return /*#__PURE__*/React.createElement("textarea", _extends({
    className: `al-input ${className}`,
    rows: rows
  }, props));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// comunidade/chrome.jsx
try { (() => {
/* chrome.jsx — shared community chrome components.
 * Exports window.CmIconRail and window.CmTopbar so every page renders the
 * exact same navigation (no per-page copy drift, no dead "#" links).
 * Load AFTER notif-panel.jsx (CmTopbar renders window.NotifPanel).
 */
const {
  Icon: ChromeIcon,
  Avatar: ChromeAvatar
} = window.LendRIADesignSystem_096da5;
const CM_PAGES = [{
  key: 'feed',
  icon: 'home',
  label: 'Feed',
  href: 'Feed.html'
}, {
  key: 'membros',
  icon: 'user-badge-check',
  label: 'Lendários',
  href: 'Lendarios.html'
}, {
  key: 'ranking',
  icon: 'trophy',
  label: 'Rank',
  href: 'Ranking.html'
}, {
  key: 'eventos',
  icon: 'calendar',
  label: 'Eventos',
  href: 'Eventos.html'
}, {
  key: 'mensagens',
  icon: 'chat-bubble',
  label: 'Mensagens',
  href: 'Mensagens.html'
}];

/* destinos cruzados — fonte única em app-nav.js (window.LendariaNav) */
const CM_LN = window.LendariaNav;
const CM_EXTERNAL = [{
  label: 'Cursos',
  href: CM_LN ? CM_LN.href('cursos') : '../cursos/Explorar - Cursos.html'
}, {
  label: 'Livros',
  href: CM_LN ? CM_LN.href('livros') : '../livros/Explorar - Alternativa Editorial.html'
}];

/* Rail removido na unificação do shell (Onda 1): duplicava exatamente os 5
   destinos da topbar. Mantido como no-op para as páginas que ainda o invocam. */
function CmIconRail() {
  return null;
}

/* tema do conteúdo — topbar e rail são sempre escuros (classe .dark) */
function CmThemeToggle() {
  const [theme, setTheme] = React.useState(() => window.AlTheme ? window.AlTheme.get() : 'dark');
  const [hover, setHover] = React.useState(false);
  const toggle = () => {
    const next = window.AlTheme ? window.AlTheme.toggle() : theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: toggle,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    "aria-label": theme === 'light' ? 'Mudar para modo noite' : 'Mudar para modo claro',
    title: theme === 'light' ? 'Modo noite' : 'Modo claro',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      flexShrink: 0,
      background: 'none',
      border: 'none',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(ChromeIcon, {
    name: theme === 'light' ? 'half-moon' : 'sun-light',
    size: 16,
    color: hover ? 'var(--foreground)' : 'var(--muted-foreground)'
  }));
}
function CmTopbar({
  active,
  rightExtra
}) {
  React.useEffect(() => {
    if (window.AppSearch || document.querySelector('script[data-app-search-src]')) return;
    var s = document.createElement('script');
    s.src = '../app-search.js?v=2';
    s.setAttribute('data-app-search-src', '1');
    document.body.appendChild(s);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    className: "cm-top dark"
  }, /*#__PURE__*/React.createElement("a", {
    className: "cm-wordmark",
    href: "Feed.html"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 22,
      height: 22
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wm-name"
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("em", null, "[IA]")), /*#__PURE__*/React.createElement("span", {
    className: "cm-area-suffix"
  }, "Comunidade")), /*#__PURE__*/React.createElement("nav", {
    className: "cm-nav"
  }, CM_PAGES.map(({
    key,
    label,
    href
  }) => /*#__PURE__*/React.createElement("a", {
    key: key,
    href: href,
    className: `cm-nav-item${active === key ? ' active' : ''}`,
    style: {
      textDecoration: 'none'
    }
  }, label)), /*#__PURE__*/React.createElement("span", {
    className: "cm-nav-sep"
  }), CM_EXTERNAL.map(({
    label,
    href
  }) => /*#__PURE__*/React.createElement("a", {
    key: label,
    href: href,
    className: "cm-nav-item",
    style: {
      textDecoration: 'none'
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "cm-top-right"
  }, rightExtra || null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cm-search",
    "data-app-search": true,
    "aria-label": "Buscar (atalho \u2318K)",
    title: "Buscar \u2014 \u2318K"
  }, /*#__PURE__*/React.createElement(ChromeIcon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("kbd", null, "\u2318K")), /*#__PURE__*/React.createElement(CmThemeToggle, null), /*#__PURE__*/React.createElement(window.NotifPanel, null)));
}

/* ── Espaços (taxonomia de canais, estilo Circle) — fonte única compartilhada.
   Componente autocontido: gere seu próprio estado de recolher/expandir/ativo.
   Consumido por Feed e Eventos (e qualquer página de comunidade). ───────────── */
const CM_SPACE_GROUPS = [{
  label: null,
  items: [{
    slug: 'feed',
    name: 'Feed',
    icon: 'home',
    count: null,
    href: 'Feed.html'
  }]
}, {
  label: 'Bem Vindo',
  items: [{
    slug: 'agenda',
    name: 'Agenda',
    icon: 'calendar',
    count: null,
    href: 'Eventos.html'
  }, {
    slug: 'avisos',
    name: 'Avisos e Lançamentos',
    icon: 'megaphone',
    count: '17'
  }, {
    slug: 'alan',
    name: '[AI]an Nicolas',
    icon: 'page',
    count: null
  }, {
    slug: 'jornada',
    name: 'Jornada Lendária | Quiz',
    icon: 'map',
    count: null
  }]
}, {
  label: 'Comunidade Free',
  items: [{
    slug: 'apresente',
    name: 'Apresente-se',
    icon: 'user',
    count: '99+'
  }, {
    slug: 'primeiros',
    name: 'Primeiros Passos',
    icon: 'rocket',
    count: null
  }, {
    slug: 'conexoes',
    name: 'Conexões Lendárias',
    icon: 'chat-bubble',
    count: null
  }, {
    slug: 'celebracao',
    name: 'Celebração Lendária',
    icon: 'star',
    count: '18'
  }, {
    slug: 'news',
    name: 'News Diár[IA]',
    icon: 'page',
    count: '37'
  }, {
    slug: 'biblioteca',
    name: 'Biblioteca Lendária',
    icon: 'book',
    count: null,
    href: '../livros/Explorar - Alternativa Editorial.html'
  }, {
    slug: 'album',
    name: 'Álbum Lendário',
    icon: 'media-image',
    count: null
  }]
}, {
  label: 'Cursos Free',
  items: [{
    slug: 'aiox-squad',
    name: 'AIOX Squad',
    icon: 'group',
    count: null
  }, {
    slug: 'zona-gen',
    name: 'Zona de Gen[IA]lidade',
    icon: 'magic-wand',
    count: null
  }, {
    slug: 'ao-vivo',
    name: 'Aulas ao Vivo | Workshops',
    icon: 'video-camera',
    count: null,
    href: 'Eventos.html'
  }]
}, {
  label: 'Cursos Pro',
  items: [{
    slug: 'segundo-cerebro',
    name: 'Segundo Cérebro com IA',
    icon: 'brain',
    count: null
  }, {
    slug: 'mente',
    name: 'Mente Lendária',
    icon: 'puzzle',
    count: null
  }, {
    slug: 'fluencia',
    name: 'Fluência em IA',
    icon: 'language',
    count: null
  }, {
    slug: 'vibe-coding',
    name: 'Vibe Coding',
    icon: 'code',
    count: null
  }, {
    slug: 'claude-code',
    name: 'Claude Code',
    icon: 'terminal',
    count: null
  }, {
    slug: 'clone-ia',
    name: 'Clone IA Express',
    icon: 'copy',
    count: null
  }, {
    slug: 'vendas',
    name: 'Vendas Magnéticas',
    icon: 'wallet',
    count: null
  }]
}, {
  label: 'Comunidade Pro',
  items: [{
    slug: 'pergunte',
    name: 'Pergunte à Comunidade',
    icon: 'help-circle',
    count: '99+'
  }, {
    slug: 'laboratorio',
    name: 'Laboratório de IA',
    icon: 'flask',
    count: '99+'
  }, {
    slug: 'clube-livro',
    name: 'Clube do Livro Lendário',
    icon: 'book',
    count: '37'
  }, {
    slug: 'encontre',
    name: 'Encontre ou Promova',
    icon: 'hand-card',
    count: '99+'
  }, {
    slug: 'hubs',
    name: 'Hubs Lendários',
    icon: 'community',
    count: '12'
  }, {
    slug: 'desafio',
    name: 'Desafio AIOX',
    icon: 'trophy',
    count: '16'
  }]
}, {
  label: 'Embaixadores Lendários',
  items: [{
    slug: 'embaixadores',
    name: 'Programa de Embaixadores',
    icon: 'crown',
    count: null
  }]
}];
const CM_ONLINE = [{
  id: '1',
  name: 'Marina C',
  avatar: 'https://i.pravatar.cc/40?u=mc1'
}, {
  id: '2',
  name: 'Rodrigo F',
  avatar: 'https://i.pravatar.cc/40?u=rf2'
}, {
  id: '3',
  name: 'Bia T',
  avatar: 'https://i.pravatar.cc/40?u=bt3'
}, {
  id: '4',
  name: 'Lucas S',
  avatar: 'https://i.pravatar.cc/40?u=ls4'
}, {
  id: '5',
  name: 'Ana P',
  avatar: 'https://i.pravatar.cc/40?u=ap5'
}, {
  id: '6',
  name: 'Carlos M',
  avatar: 'https://i.pravatar.cc/40?u=cm6'
}, {
  id: '7',
  name: 'Feli N',
  avatar: 'https://i.pravatar.cc/40?u=fn7'
}, {
  id: '8',
  name: 'Paulo R',
  avatar: 'https://i.pravatar.cc/40?u=pr8'
}, {
  id: '9',
  name: 'Sara L',
  avatar: 'https://i.pravatar.cc/40?u=sl9'
}, {
  id: '10',
  name: 'Diego V',
  avatar: 'https://i.pravatar.cc/40?u=dv10'
}];
window.CmOnline = CM_ONLINE;
function CmSpacesSidebar({
  active
}) {
  const [open, setOpen] = React.useState(() => typeof window === 'undefined' || window.innerWidth > 1100);
  const [expanded, setExpanded] = React.useState(true);
  const [activeSpace, setActiveSpace] = React.useState(active || 'feed');
  const [closedGroups, setClosedGroups] = React.useState({
    'Cursos Free': true,
    'Cursos Pro': true,
    'Embaixadores Lendários': true
  });
  const toggleGroup = label => setClosedGroups(prev => ({
    ...prev,
    [label]: !prev[label]
  }));
  if (!open) {
    return /*#__PURE__*/React.createElement("button", {
      className: "cm-sidebar-reopen",
      onClick: () => setOpen(true),
      title: "Mostrar painel",
      "aria-label": "Mostrar painel"
    }, /*#__PURE__*/React.createElement(ChromeIcon, {
      name: "nav-arrow-left",
      size: 16
    }));
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "cm-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-sidebar-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "cm-sidebar-collapse",
    onClick: () => setOpen(false),
    title: "Recolher painel",
    "aria-label": "Recolher painel"
  }, /*#__PURE__*/React.createElement(ChromeIcon, {
    name: "nav-arrow-right",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "cm-sidebar-inner al-scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-hd",
    onClick: () => setExpanded(e => !e)
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-hd-left"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16,
      color: 'var(--primary)',
      lineHeight: 1
    }
  }, "\u221E"), /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Espa\xE7os")), /*#__PURE__*/React.createElement(ChromeIcon, {
    name: expanded ? 'nav-arrow-up' : 'nav-arrow-down',
    size: 14,
    color: "var(--muted-foreground)"
  })), expanded && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, CM_SPACE_GROUPS.map(group => {
    const isOpen = group.label ? !closedGroups[group.label] : true;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: group.label || 'root'
    }, group.label && /*#__PURE__*/React.createElement("button", {
      className: "cm-sb-group-hd",
      onClick: () => toggleGroup(group.label)
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sb-group-label"
    }, group.label), /*#__PURE__*/React.createElement(ChromeIcon, {
      name: isOpen ? 'nav-arrow-down' : 'nav-arrow-right',
      size: 11,
      color: "hsl(var(--foreground-hsl) / 0.4)"
    })), isOpen && group.items.map(sp => {
      const isActive = activeSpace === sp.slug;
      const inner = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "cm-space-left"
      }, /*#__PURE__*/React.createElement(ChromeIcon, {
        name: sp.icon,
        size: 13,
        color: isActive ? 'var(--primary)' : 'var(--muted-foreground)'
      }), /*#__PURE__*/React.createElement("span", {
        className: "cm-space-name",
        style: {
          color: isActive ? 'var(--primary)' : undefined
        }
      }, sp.name)), sp.count && /*#__PURE__*/React.createElement("span", {
        className: "cm-space-count"
      }, sp.count));
      return sp.href ? /*#__PURE__*/React.createElement("a", {
        key: sp.slug,
        className: "cm-space-row",
        href: sp.href
      }, inner) : /*#__PURE__*/React.createElement("div", {
        key: sp.slug,
        className: `cm-space-row${isActive ? ' active' : ''}`,
        onClick: () => setActiveSpace(sp.slug)
      }, inner);
    }));
  }))), /*#__PURE__*/React.createElement("button", {
    className: "cm-golive"
  }, /*#__PURE__*/React.createElement(ChromeIcon, {
    name: "video-camera",
    size: 14
  }), "Go Live"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-sep"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-honor"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cm-honor-label"
  }, /*#__PURE__*/React.createElement(ChromeIcon, {
    name: "shield-check",
    size: 14,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--primary)'
    }
  }, "C\xF3digo de Honra")), /*#__PURE__*/React.createElement("p", {
    className: "cm-honor-quote"
  }, "Aqui, o valor \xE9 medido pela densidade do insight e pelo ", /*#__PURE__*/React.createElement("em", null, "skin in the game"), "."), /*#__PURE__*/React.createElement("button", {
    className: "cm-honor-link"
  }, "Ler Manifesto"))), /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-sep"
  }), /*#__PURE__*/React.createElement("div", {
    className: "cm-sb-section"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Mentes Ativas"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cm-online-dot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--success)'
    }
  }, CM_ONLINE.length, " online"))), /*#__PURE__*/React.createElement("div", {
    className: "cm-online-grid"
  }, CM_ONLINE.map(m => /*#__PURE__*/React.createElement("a", {
    key: m.id,
    className: "cm-online-av",
    title: m.name,
    href: "Perfil.html"
  }, /*#__PURE__*/React.createElement("img", {
    src: m.avatar,
    alt: m.name
  })))))));
}
Object.assign(window, {
  CmIconRail,
  CmTopbar,
  CmSpacesSidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "comunidade/chrome.jsx", error: String((e && e.message) || e) }); }

// comunidade/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "comunidade/image-slot.js", error: String((e && e.message) || e) }); }

// comunidade/mensagens-data.js
try { (() => {
// ── Dados das conversas, threads e perfis — Mensagens ────────────────────────
// Carregado como script normal; expõe tudo em window.*

window.MSG_MEMBERS = [{
  id: 'mb1',
  name: 'Camila Duarte',
  avatar: 'https://i.pravatar.cc/80?u=camila-d',
  tag: 'Lendário I',
  online: true
}, {
  id: 'mb2',
  name: 'Rafael Albuquerque',
  avatar: 'https://i.pravatar.cc/80?u=rafael-a',
  tag: 'Membro',
  online: false
}, {
  id: 'mb3',
  name: 'Juliana Paes Leme',
  avatar: 'https://i.pravatar.cc/80?u=juliana-pl',
  tag: 'Lendário II',
  online: true
}, {
  id: 'mb4',
  name: 'Otávio Bernardes',
  avatar: null,
  tag: 'Membro',
  online: false
}, {
  id: 'mb5',
  name: 'Helena Cardoso',
  avatar: 'https://i.pravatar.cc/80?u=helena-c',
  tag: 'Hub SP',
  online: true
}, {
  id: 'mb6',
  name: 'Pedro Vasconcelos',
  avatar: 'https://i.pravatar.cc/80?u=pedro-v',
  tag: 'Membro',
  online: false
}];
window.MSG_CONVS = {
  dm: [{
    id: 'c1',
    name: 'Alan Nicolas',
    sub: 'Online agora',
    time: '2m',
    unread: true,
    online: true,
    avatar: 'https://i.pravatar.cc/80?u=alan-n'
  }, {
    id: 'c2',
    name: 'Sidney Fernandes',
    sub: 'Visto há 1h',
    time: '1h',
    unread: true,
    online: false,
    avatar: 'https://i.pravatar.cc/80?u=sidney-f'
  }, {
    id: 'c3',
    name: 'Adávio Tittoni',
    sub: 'Visto há 3h',
    time: '3h',
    unread: false,
    online: false,
    avatar: 'https://i.pravatar.cc/80?u=adavio-t'
  }, {
    id: 'c4',
    name: 'Elizabeth Bonaparte',
    sub: 'Visto há 1d',
    time: '1d',
    unread: false,
    online: false,
    avatar: 'https://i.pravatar.cc/80?u=elizabeth-b'
  }, {
    id: 'c5',
    name: 'Adriano de Marqui',
    sub: 'Visto há 2d',
    time: '2d',
    unread: false,
    online: false,
    avatar: null
  }],
  group: [{
    id: 'g1',
    name: 'Grupo AIOX Turma 5',
    sub: '12 membros',
    time: '15m',
    unread: true,
    online: false,
    avatar: null,
    isGroup: true
  }, {
    id: 'g2',
    name: 'Clube do Livro',
    sub: '8 membros',
    time: '2h',
    unread: false,
    online: false,
    avatar: null,
    isGroup: true
  }],
  agent: [{
    id: 'a1',
    name: 'Assistente Lendário',
    sub: 'Agente IA · responde na hora',
    time: 'agr',
    unread: false,
    online: true,
    avatar: null,
    isAgent: true
  }]
};
window.MSG_THREADS = {
  c1: [{
    id: 'm1',
    sender_name: 'Alan Nicolas',
    sender_avatar: 'https://i.pravatar.cc/80?u=alan-n',
    content: 'Oi! Tudo bem? Vi sua dúvida sobre o webhook Hotmart no feed.',
    created_at: '2026-06-10T09:00:00Z',
    is_own: false
  }, {
    id: 'm2',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Oi Alan! Sim, estou travado há 2 dias nisso. O token gera corretamente mas as requisições retornam 401.',
    created_at: '2026-06-10T09:02:00Z',
    is_own: true
  }, {
    id: 'm3',
    sender_name: 'Alan Nicolas',
    sender_avatar: 'https://i.pravatar.cc/80?u=alan-n',
    content: 'Isso é clássico de escopo errado. Vai no painel de credenciais da Hotmart e confere se você marcou "leitura de assinaturas" e "leitura de produtos".',
    created_at: '2026-06-10T09:03:00Z',
    is_own: false,
    reactions: [{
      emoji: '💡',
      count: 1,
      mine: true
    }]
  }, {
    id: 'm4',
    sender_name: 'Alan Nicolas',
    sender_avatar: 'https://i.pravatar.cc/80?u=alan-n',
    content: 'Sem esse escopo o token gera mas não autoriza chamadas de produto. O Sidney cobre isso em detalhe na aula 06.',
    created_at: '2026-06-10T09:03:30Z',
    is_own: false
  }, {
    id: 'm5',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Cara, era exatamente isso! Acabei de testar — agora retornou 200. Muito obrigado!',
    created_at: '2026-06-10T09:08:00Z',
    is_own: true,
    reactions: [{
      emoji: '🔥',
      count: 1,
      mine: false
    }]
  }, {
    id: 'm6',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Boa, vamos agendar para semana que vem uma revisão do meu fluxo completo?',
    created_at: '2026-06-10T09:09:00Z',
    is_own: true
  }, {
    id: 'm7',
    sender_name: 'Alan Nicolas',
    sender_avatar: 'https://i.pravatar.cc/80?u=alan-n',
    content: 'Com certeza! Me manda uma DM com os detalhes do fluxo para eu preparar. Vai ser produtivo.',
    created_at: '2026-06-10T09:10:00Z',
    is_own: false
  }],
  c2: [{
    id: 's1',
    sender_name: 'Sidney Fernandes',
    sender_avatar: 'https://i.pravatar.cc/80?u=sidney-f',
    content: 'Vi que você finalizou a aula de webhooks. Como foi a integração com o ClickUp?',
    created_at: '2026-06-10T07:40:00Z',
    is_own: false
  }, {
    id: 's2',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Funcionou de primeira! Agora cada venda aprovada vira card automaticamente na esteira de onboarding.',
    created_at: '2026-06-10T07:52:00Z',
    is_own: true,
    reactions: [{
      emoji: '👏',
      count: 1,
      mine: false
    }]
  }, {
    id: 's3',
    sender_name: 'Sidney Fernandes',
    sender_avatar: 'https://i.pravatar.cc/80?u=sidney-f',
    content: 'Excelente. Manda o link do agente quando publicar no Laboratório — quero destacar no plantão de quinta.',
    created_at: '2026-06-10T08:05:00Z',
    is_own: false
  }],
  c3: [{
    id: 't1',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Adávio, consegui vaga no plantão de amanhã?',
    created_at: '2026-06-09T16:00:00Z',
    is_own: true
  }, {
    id: 't2',
    sender_name: 'Adávio Tittoni',
    sender_avatar: 'https://i.pravatar.cc/80?u=adavio-t',
    content: 'Consegui sim, te coloquei no slot das 14h30. Leva o fluxo aberto que a gente depura junto.',
    created_at: '2026-06-09T16:20:00Z',
    is_own: false
  }, {
    id: 't3',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Fechado, obrigado!',
    created_at: '2026-06-09T16:22:00Z',
    is_own: true
  }, {
    id: 't4',
    sender_name: 'Adávio Tittoni',
    sender_avatar: 'https://i.pravatar.cc/80?u=adavio-t',
    content: 'Perfeito, vejo na sessão de amanhã então.',
    created_at: '2026-06-09T16:25:00Z',
    is_own: false
  }],
  c4: [{
    id: 'e1',
    sender_name: 'Elizabeth Bonaparte',
    sender_avatar: 'https://i.pravatar.cc/80?u=elizabeth-b',
    content: 'Adorei seu post sobre o fluxo de cobrança. Posso adaptar para meu e-commerce?',
    created_at: '2026-06-09T11:00:00Z',
    is_own: false
  }, {
    id: 'e2',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Claro! O blueprint está anexado no post, é só importar. Qualquer dúvida me chama.',
    created_at: '2026-06-09T11:30:00Z',
    is_own: true
  }, {
    id: 'e3',
    sender_name: 'Elizabeth Bonaparte',
    sender_avatar: 'https://i.pravatar.cc/80?u=elizabeth-b',
    content: 'Obrigada pelo feedback!',
    created_at: '2026-06-09T12:00:00Z',
    is_own: false,
    reactions: [{
      emoji: '❤️',
      count: 1,
      mine: true
    }]
  }],
  c5: [{
    id: 'd1',
    sender_name: 'Adriano de Marqui',
    sender_avatar: null,
    content: 'Consegui implementar o webhook que você sugeriu. Reduziu o tempo de resposta do funil pela metade.',
    created_at: '2026-06-08T15:00:00Z',
    is_own: false
  }],
  g1: [{
    id: 'gm1',
    sender_name: 'Alan Nicolas',
    sender_avatar: 'https://i.pravatar.cc/80?u=alan-n',
    content: 'Pessoal, amanhã tem plantão extra do Pronto Socorro às 19h. Foco em depuração de agentes em produção.',
    created_at: '2026-06-10T08:30:00Z',
    is_own: false,
    reactions: [{
      emoji: '🔥',
      count: 5,
      mine: true
    }, {
      emoji: '👏',
      count: 2,
      mine: false
    }]
  }, {
    id: 'gm2',
    sender_name: 'Elizabeth Bonaparte',
    sender_avatar: 'https://i.pravatar.cc/80?u=elizabeth-b',
    content: 'Vou levar meu caso do classificador de tickets — está marcando tudo como urgente 😅',
    created_at: '2026-06-10T08:34:00Z',
    is_own: false
  }, {
    id: 'gm3',
    sender_name: 'Sidney Fernandes',
    sender_avatar: 'https://i.pravatar.cc/80?u=sidney-f',
    content: 'Boa, Elizabeth. Esse caso é ótimo para demonstrar few-shot na classificação. Traz uns 10 exemplos reais.',
    created_at: '2026-06-10T08:40:00Z',
    is_own: false
  }, {
    id: 'gm4',
    sender_name: 'Você',
    sender_avatar: null,
    content: 'Estarei lá! Quero mostrar a esteira nova de onboarding também.',
    created_at: '2026-06-10T08:45:00Z',
    is_own: true,
    reactions: [{
      emoji: '👏',
      count: 1,
      mine: false
    }]
  }],
  g2: [{
    id: 'cl1',
    sender_name: 'Sidney Fernandes',
    sender_avatar: 'https://i.pravatar.cc/80?u=sidney-f',
    content: 'Leitura desta semana é "Disciplina Positiva" — capítulos 3 e 4. Discussão no domingo.',
    created_at: '2026-06-10T07:00:00Z',
    is_own: false
  }, {
    id: 'cl2',
    sender_name: 'Helena Cardoso',
    sender_avatar: 'https://i.pravatar.cc/80?u=helena-c',
    content: 'Capítulo 3 tem uma analogia perfeita com como a gente escreve system prompts. Vou trazer no domingo.',
    created_at: '2026-06-10T07:45:00Z',
    is_own: false,
    reactions: [{
      emoji: '💡',
      count: 3,
      mine: false
    }]
  }],
  a1: [{
    id: 'ag1',
    sender_name: 'Assistente Lendário',
    sender_avatar: null,
    content: 'Olá! Sou o Assistente Lendário. Posso te ajudar com automações, dúvidas das aulas, ou encontrar conteúdo na plataforma. O que você precisa hoje?',
    created_at: '2026-06-10T09:30:00Z',
    is_own: false
  }]
};
window.MSG_AGENT_REPLIES = ['Boa pergunta! Encontrei 3 aulas relacionadas: "Webhooks na prática" (PS AIOX, aula 06), "Integrações Hotmart" (aula 09) e o plantão gravado de 02/06. Quer que eu resuma alguma?', 'Entendi. Para esse caso, recomendo começar pelo blueprint da comunidade "Esteira de onboarding automática" — 14 membros já validaram em produção. Posso te mandar o link do post.', 'Anotado! Criei um lembrete para você. Algo mais em que eu possa ajudar — aulas, eventos ou conexões na comunidade?'];
window.MSG_PROFILES = {
  c1: {
    name: 'Alan Nicolas',
    avatar: 'https://i.pravatar.cc/160?u=alan-n',
    bio: 'Fundador da Academia Lendária. Estrategista, investidor e criador de sistemas de IA aplicados a negócios.',
    memberSince: 'Fev 2024',
    lastSeen: 'Online agora',
    score: 9840,
    tags: ['Lendário IMORTAL', 'Fundador'],
    posts: [{
      title: 'O playbook completo do agente de vendas que fechou R$ 120k',
      meta: '2d · 214 curtidas · 67 comentários'
    }, {
      title: 'Por que 90% dos agentes morrem na semana 2 (e como evitar)',
      meta: '1sem · 188 curtidas · 54 comentários'
    }],
    comments: [{
      text: '"Métrica de agente sem baseline humano é vaidade. Mede o antes primeiro."',
      meta: 'ontem · 31 curtidas'
    }, {
      text: '"Esse fluxo está ótimo — só adiciona retry com backoff no webhook."',
      meta: '3d · 12 curtidas'
    }]
  },
  c2: {
    name: 'Sidney Fernandes',
    avatar: 'https://i.pravatar.cc/160?u=sidney-f',
    bio: 'Gestor de automação da Academia. Especialista em integrações com Hotmart, ClickUp e stack de IA.',
    memberSince: 'Mar 2024',
    lastSeen: '1h atrás',
    score: 6420,
    tags: ['Instrutor', 'AIOX Expert'],
    posts: [{
      title: 'Checklist de produção: 12 itens antes de soltar seu agente no mundo',
      meta: '4d · 156 curtidas · 43 comentários'
    }],
    comments: [{
      text: '"O erro 401 com token válido é quase sempre escopo. Confere as permissões."',
      meta: '2d · 18 curtidas'
    }]
  },
  c3: {
    name: 'Adávio Tittoni',
    avatar: 'https://i.pravatar.cc/160?u=adavio-t',
    bio: 'Host dos plantões do Pronto Socorro. Especialista em automações e agentes operacionais.',
    memberSince: 'Jan 2024',
    lastSeen: '3h atrás',
    score: 4180,
    tags: ['Host', 'Iniciante'],
    posts: [{
      title: 'Resumo do plantão: os 5 bugs mais comuns desta semana',
      meta: '1d · 87 curtidas · 22 comentários'
    }],
    comments: [{
      text: '"Traz o fluxo aberto no plantão que a gente depura ao vivo."',
      meta: 'ontem · 9 curtidas'
    }]
  },
  c4: {
    name: 'Elizabeth Bonaparte',
    avatar: 'https://i.pravatar.cc/160?u=elizabeth-b',
    bio: 'Empreendedora digital focada em automações para e-commerce.',
    memberSince: 'Abr 2024',
    lastSeen: '1d atrás',
    score: 820,
    tags: ['Membro'],
    posts: [{
      title: 'Adaptei o fluxo de cobrança para e-commerce — resultados em 7 dias',
      meta: '3d · 44 curtidas · 16 comentários'
    }],
    comments: []
  },
  c5: {
    name: 'Adriano de Marqui',
    avatar: null,
    bio: 'Gestor de marketing digital com foco em funis automáticos.',
    memberSince: 'Mai 2024',
    lastSeen: '2d atrás',
    score: 540,
    tags: ['Membro'],
    posts: [],
    comments: []
  },
  g1: {
    name: 'Grupo AIOX Turma 5',
    avatar: null,
    bio: '12 membros · Turma ativa do módulo AIOX Fundamentals.',
    memberSince: 'Jun 2026',
    lastSeen: '15m atrás',
    score: null,
    tags: ['Grupo'],
    posts: [],
    comments: [],
    members: ['Alan Nicolas', 'Sidney Fernandes', 'Elizabeth Bonaparte', 'Você', '+8']
  },
  g2: {
    name: 'Clube do Livro',
    avatar: null,
    bio: '8 membros · Discussão semanal das leituras lendárias.',
    memberSince: 'Mai 2026',
    lastSeen: '2h atrás',
    score: null,
    tags: ['Grupo'],
    posts: [],
    comments: [],
    members: ['Sidney Fernandes', 'Helena Cardoso', 'Você', '+5']
  },
  a1: {
    name: 'Assistente Lendário',
    avatar: null,
    bio: 'Agente IA oficial da Academia. Responde dúvidas sobre aulas, eventos, automações e encontra conteúdo na plataforma.',
    memberSince: 'Jan 2026',
    lastSeen: 'Sempre online',
    score: null,
    tags: ['Agente IA'],
    posts: [],
    comments: []
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "comunidade/mensagens-data.js", error: String((e && e.message) || e) }); }

// comunidade/notif-panel.jsx
try { (() => {
/* notif-panel.jsx — barra de notificações + dropdown de DMs para as páginas da Comunidade.
 * Exporta window.NotifPanel para ser usado nos topbars.
 * App route: parte do CommunityTopbar (UserDropdownMenu + notificações)
 */
const {
  Icon: NpIcon,
  Avatar: NpAvatar
} = window.LendRIADesignSystem_096da5;
const NP_CONVS = [{
  id: 'c1',
  name: 'Alan Nicolas',
  time: '2m',
  unread: true,
  avatar: 'https://i.pravatar.cc/80?u=alan-n',
  last: 'Boa, vamos agendar para semana...',
  isAgent: false
}, {
  id: 'c2',
  name: 'Rodrigo Feldman',
  time: 'Mai 16',
  unread: false,
  avatar: 'https://i.pravatar.cc/80?u=rodrigo-f',
  last: 'Domingo às 18h tem Zoom Exclusivo...',
  isAgent: false
}, {
  id: 'c3',
  name: 'Sidney Fernandes',
  time: '1h',
  unread: true,
  avatar: 'https://i.pravatar.cc/80?u=sidney-f',
  last: 'Manda o link do agente quando...',
  isAgent: false
}, {
  id: 'c4',
  name: 'Helena R Garozzi',
  time: 'Mar 17',
  unread: true,
  avatar: 'https://i.pravatar.cc/80?u=helena-g',
  last: 'Feliz ano inteiro! Excelente...',
  isAgent: false
}, {
  id: 'c5',
  name: 'Victor Matheus',
  time: 'Mar 2',
  unread: true,
  avatar: 'https://i.pravatar.cc/80?u=victor-m',
  last: 'Fala, beleza? Gostaria de saber...',
  isAgent: false
}, {
  id: 'a1',
  name: 'Agente da Comunidade',
  time: 'Jan 18',
  unread: true,
  avatar: null,
  last: 'Tava testando mestre? O q achou?',
  isAgent: true
}];
function npInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function NpBadge({
  count
}) {
  if (!count) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -6,
      right: -7,
      minWidth: 17,
      height: 17,
      borderRadius: 999,
      background: 'hsl(var(--primary-hsl))',
      color: 'var(--primary-foreground)',
      fontSize: 9,
      fontWeight: 900,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px',
      border: '2px solid var(--background)',
      letterSpacing: 0
    }
  }, count > 99 ? '99+' : count);
}
function NpIconBtn({
  icon,
  badge,
  onClick,
  active
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      position: 'relative',
      width: 36,
      height: 36,
      display: 'grid',
      placeItems: 'center',
      border: active ? '1px solid var(--hairline-strong)' : '1px solid transparent',
      borderRadius: 'var(--radius-base)',
      background: active ? 'hsl(var(--foreground-hsl) / 0.06)' : 'transparent',
      color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
      cursor: 'pointer',
      transition: 'all 180ms var(--ease-out)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(NpIcon, {
    name: icon,
    size: 17
  }), /*#__PURE__*/React.createElement(NpBadge, {
    count: badge
  }));
}
function NpConvRow({
  conv
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      borderBottom: '1px solid hsl(var(--foreground-hsl) / 0.04)',
      cursor: 'pointer',
      transition: 'background 150ms'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'hsl(var(--foreground-hsl) / 0.04)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'hsl(var(--foreground-hsl) / 0.1)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, conv.avatar ? /*#__PURE__*/React.createElement("img", {
    src: conv.avatar,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)'
    }
  }, npInitials(conv.name))), conv.isAgent && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'hsl(var(--primary-hsl) / 0.15)',
      border: '1px solid var(--primary)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(NpIcon, {
    name: "magic-wand",
    size: 8,
    color: "var(--primary)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: conv.unread ? 700 : 500,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, conv.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--muted-foreground)',
      flexShrink: 0
    }
  }, conv.time)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--muted-foreground)',
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, conv.last)), conv.unread && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--primary)',
      flexShrink: 0
    }
  }));
}
function DmDropdown({
  onClose
}) {
  const [tab, setTab] = React.useState('inbox');
  const unreadCount = NP_CONVS.filter(c => c.unread && !c.isAgent).length;
  const agentCount = NP_CONVS.filter(c => c.isAgent).length;
  const list = tab === 'inbox' ? NP_CONVS : tab === 'unread' ? NP_CONVS.filter(c => c.unread) : NP_CONVS.filter(c => c.isAgent);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: 420,
      maxHeight: 560,
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-levitate)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 12px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: '-0.01em'
    }
  }, "Mensagens Diretas"), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 30,
      height: 30,
      display: 'grid',
      placeItems: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--muted-foreground)',
      borderRadius: 'var(--radius-sm)'
    },
    title: "Marcar todas como lidas"
  }, /*#__PURE__*/React.createElement(NpIcon, {
    name: "check-circle",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 30,
      height: 30,
      display: 'grid',
      placeItems: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--muted-foreground)',
      borderRadius: 'var(--radius-sm)'
    },
    title: "Nova mensagem"
  }, /*#__PURE__*/React.createElement(NpIcon, {
    name: "plus",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: '0 12px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, [{
    key: 'inbox',
    label: 'Caixa de Entrada',
    count: 0
  }, {
    key: 'unread',
    label: 'Não Lidas',
    count: unreadCount
  }, {
    key: 'agents',
    label: 'Agentes',
    count: agentCount
  }].map(({
    key,
    label,
    count
  }) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => setTab(key),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      height: 40,
      padding: '0 12px',
      background: 'none',
      border: 'none',
      borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
      cursor: 'pointer',
      transition: 'color 150ms',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: tab === key ? 'var(--foreground)' : 'var(--muted-foreground)'
    }
  }, label, count > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      background: 'hsl(var(--foreground-hsl) / 0.1)',
      border: '1px solid var(--border)',
      borderRadius: 999,
      padding: '1px 6px',
      color: 'var(--foreground)'
    }
  }, count)))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      flex: 1
    }
  }, list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '32px 16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Nenhuma mensagem aqui.")) : list.map(conv => /*#__PURE__*/React.createElement(NpConvRow, {
    key: conv.id,
    conv: conv
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 16px',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "Mensagens.html",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--primary)',
      textDecoration: 'none'
    }
  }, "Ver todas as mensagens")));
}
function NotifPanel() {
  const [open, setOpen] = React.useState(null); // 'dm' | 'notif' | null

  React.useEffect(() => {
    function close(e) {
      if (!e.target.closest('.np-wrap')) setOpen(null);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const BTNS = [{
    key: 'notif',
    icon: 'bell',
    badge: 12
  }, {
    key: 'dm',
    icon: 'chat-bubble',
    badge: 3
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "np-wrap",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      position: 'relative'
    }
  }, BTNS.map(({
    key,
    icon,
    badge
  }) => /*#__PURE__*/React.createElement(NpIconBtn, {
    key: key,
    icon: icon,
    badge: badge,
    active: open === key,
    onClick: () => setOpen(open === key ? null : key)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 20,
      background: 'var(--border)',
      margin: '0 4px'
    }
  }), /*#__PURE__*/React.createElement(NpAvatar, {
    name: "Aluno Lend\xE1rio",
    size: "sm",
    style: {
      cursor: 'pointer'
    }
  }), open === 'dm' && /*#__PURE__*/React.createElement(DmDropdown, {
    onClose: () => setOpen(null)
  }), open === 'notif' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: 360,
      padding: '20px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-levitate)',
      zIndex: 100,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(NpIcon, {
    name: "bell",
    size: 32,
    color: "hsl(var(--foreground-hsl) / 0.2)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Notifica\xE7\xF5es em breve.")));
}
window.NotifPanel = NotifPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "comunidade/notif-panel.jsx", error: String((e && e.message) || e) }); }

// cursos/AuroraPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* AuroraPanel.jsx — Aurora, a guia da plataforma.
 * Ícone fixo na barra lateral esquerda. Abre um painel com a CURADORIA de tudo
 * que ajuda o aluno a encontrar conteúdo (aulas, mentorias, gravações,
 * materiais, prompts) + um chat com a Aurora.
 *
 * Uso: <window.AuroraPanel />   (lê window.AuroraData)
 * Abrir por evento: window.dispatchEvent(new CustomEvent('aurora:open'))
 */
const {
  Icon: AurIcon
} = window.LendRIADesignSystem_096da5;
function AurStyle() {
  return /*#__PURE__*/React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: `
      @keyframes aur-fade { from { opacity: 0; } to { opacity: 1; } }
      .aur-scrim { animation: aur-fade 200ms ease-out; }
      .aur-row { transition: background 150ms var(--ease-out), border-color 150ms var(--ease-out); }
      .aur-row:hover { background: hsl(var(--foreground-hsl) / 0.04); }
      .aur-row:hover .aur-row-title { color: var(--primary); }
      .aur-row:hover .aur-row-act { color: var(--foreground); border-color: var(--hairline-strong); }
      .aur-launch { transition: transform 200ms var(--ease-out), background 200ms var(--ease-out), box-shadow 200ms var(--ease-out); }
      .aur-launch:hover { background: hsl(var(--primary-hsl) / 0.16); transform: translateY(-2px); }
      .aur-dots span { animation: aur-blink 1.2s infinite; }
      .aur-dots span:nth-child(2){ animation-delay: 0.2s; }
      .aur-dots span:nth-child(3){ animation-delay: 0.4s; }
      @keyframes aur-blink { 0%,60%,100%{ opacity: 0.25; } 30%{ opacity: 1; } }
    `
    }
  });
}
function AurRow({
  item
}) {
  const [copied, setCopied] = React.useState(false);
  const onClick = e => {
    if (item.action === 'Copiar') {
      e.preventDefault();
      try {
        navigator.clipboard && navigator.clipboard.writeText('[' + item.title + ']');
      } catch (err) {}
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };
  const Tag = item.href ? 'a' : 'button';
  const tagProps = item.href ? {
    href: item.href
  } : {
    type: 'button'
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({}, tagProps, {
    onClick: onClick,
    className: "aur-row",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      textAlign: 'left',
      padding: '13px 14px',
      background: 'none',
      border: 'none',
      borderRadius: 'var(--radius-base)',
      textDecoration: 'none',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 38,
      height: 38,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-base)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: item.icon,
    size: 16,
    color: "var(--muted-foreground)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "aur-row-title",
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--foreground)',
      transition: 'color 150ms',
      textWrap: 'pretty'
    }
  }, item.title), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      display: 'block',
      marginTop: 3,
      color: 'var(--muted-foreground)'
    }
  }, item.meta)), /*#__PURE__*/React.createElement("span", {
    className: "aur-row-act",
    style: {
      flexShrink: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: copied ? 'var(--primary)' : 'var(--muted-foreground)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      padding: '5px 11px',
      transition: 'color 150ms, border-color 150ms',
      whiteSpace: 'nowrap'
    }
  }, copied ? 'Copiado' : item.action));
}
function AurChip({
  active,
  label,
  icon,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '7px 13px',
      cursor: 'pointer',
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border)'),
      background: active ? 'hsl(var(--primary-hsl) / 0.10)' : 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      color: active ? 'var(--primary)' : hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'color 150ms, border-color 150ms, background 150ms'
    }
  }, icon && /*#__PURE__*/React.createElement(AurIcon, {
    name: icon,
    size: 13,
    color: active ? 'var(--primary)' : 'currentColor'
  }), label);
}
function AurMsg({
  who,
  text
}) {
  if (who === 'me') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        alignSelf: 'flex-end',
        maxWidth: '85%',
        padding: '10px 14px',
        background: 'hsl(var(--foreground-hsl) / 0.06)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'var(--foreground)'
      }
    }, text);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start',
      maxWidth: '94%',
      fontFamily: 'var(--font-serif)',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--foreground)'
    }
  }, text);
}
function AuroraPanel() {
  const D = window.AuroraData || {
    items: [],
    categories: [],
    suggestions: []
  };
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState('explorar'); // explorar | conversar
  const [cat, setCat] = React.useState('tudo');
  const [query, setQuery] = React.useState('');
  const [msgs, setMsgs] = React.useState([]);
  const [asked, setAsked] = React.useState([]);
  const [text, setText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const threadRef = React.useRef(null);
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('aurora:open', onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('aurora:open', onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, thinking, mode]);
  const q = query.trim().toLowerCase();
  const items = D.items.filter(it => (cat === 'tudo' || it.cat === cat) && (!q || it.title.toLowerCase().includes(q) || it.meta.toLowerCase().includes(q)));
  // vista padrão (Tudo, sem busca) = últimos acessados, 3 por categoria
  const isRecent = cat === 'tudo' && !q;
  // agrupa por categoria quando "tudo"
  const groups = cat === 'tudo' ? D.categories.map(c => ({
    c,
    list: items.filter(it => it.cat === c.key)
  })).filter(g => g.list.length) : [{
    c: D.categories.find(c => c.key === cat),
    list: items
  }];
  const ask = question => {
    const found = D.suggestions.find(s => s.q === question);
    const answer = found && found.a || D.fallback || 'Deixa eu procurar pra você.';
    setMsgs(m => [...m, {
      who: 'me',
      text: question
    }]);
    if (found) setAsked(a => [...a, question]);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMsgs(m => [...m, {
        who: 'ai',
        text: answer
      }]);
    }, 750);
  };
  const send = () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    ask(v);
  };
  const chips = D.suggestions.filter(s => !asked.includes(s.q));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AurStyle, null), !open && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(true),
    "aria-label": "Abrir Aurora",
    className: "aur-launch",
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 55,
      display: 'grid',
      placeItems: 'center',
      width: 58,
      height: 58,
      border: '1px solid hsl(var(--primary-hsl) / 0.45)',
      borderRadius: 'var(--radius-full)',
      background: 'hsl(var(--popover-hsl) / 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'var(--shadow-modal)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "sparks",
    size: 23,
    color: "var(--primary)"
  })), open && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "aur-scrim",
    onClick: () => setOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 59,
      background: 'hsl(0 0% 0% / 0.32)'
    }
  }), /*#__PURE__*/React.createElement("aside", {
    className: "aur-panel",
    role: "dialog",
    "aria-label": "Aurora",
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(432px, 100vw)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-modal)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '18px 20px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-full)',
      border: '1px solid hsl(var(--primary-hsl) / 0.4)',
      background: 'hsl(var(--primary-hsl) / 0.08)'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "sparks",
    size: 17,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--foreground)'
    }
  }, "Aurora"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "Sua guia na plataforma")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    "aria-label": "Fechar",
    style: {
      display: 'flex',
      padding: 8,
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "xmark",
    size: 16,
    color: "var(--muted-foreground)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: '12px 20px 0',
      flexShrink: 0
    }
  }, [{
    k: 'explorar',
    l: 'Explorar acervo'
  }, {
    k: 'conversar',
    l: 'Conversar'
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    type: "button",
    onClick: () => setMode(t.k),
    style: {
      flex: 1,
      height: 34,
      cursor: 'pointer',
      borderRadius: 'var(--radius-base)',
      border: '1px solid ' + (mode === t.k ? 'var(--hairline-strong)' : 'transparent'),
      background: mode === t.k ? 'hsl(var(--foreground-hsl) / 0.05)' : 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: mode === t.k ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'color 150ms, background 150ms'
    }
  }, t.l))), mode === 'explorar' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 10px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 42,
      padding: '0 14px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "search",
    size: 15,
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "Buscar aula, mentoria, prompt\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      background: 'none',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      color: 'var(--foreground)'
    }
  }), query && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setQuery(''),
    "aria-label": "Limpar",
    style: {
      display: 'flex',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "xmark",
    size: 14,
    color: "var(--muted-foreground)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      marginTop: 12,
      overflowX: 'auto',
      paddingBottom: 2
    },
    className: "al-scroll"
  }, /*#__PURE__*/React.createElement(AurChip, {
    active: cat === 'tudo',
    label: "Tudo",
    onClick: () => setCat('tudo')
  }), D.categories.map(c => /*#__PURE__*/React.createElement(AurChip, {
    key: c.key,
    active: cat === c.key,
    label: c.label,
    icon: c.icon,
    onClick: () => setCat(c.key)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "al-scroll",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 14px 20px'
    }
  }, isRecent && groups.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px 2px'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "clock-rotate-right",
    size: 13,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--primary)'
    }
  }, "Acessados recentemente")), groups.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '32px 16px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--muted-foreground)',
      textAlign: 'center'
    }
  }, "Nada encontrado para \u201C", query, "\u201D. Tente outro termo \u2014 ou me pergunte na aba Conversar."), groups.map(g => {
    const show = isRecent ? g.list.slice(0, 3) : g.list;
    return /*#__PURE__*/React.createElement("div", {
      key: g.c.key,
      style: {
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px 6px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "al-label",
      style: {
        color: 'var(--muted-foreground)'
      }
    }, g.c.label), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border)'
      }
    }), isRecent && g.list.length > 3 ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setCat(g.c.key),
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--primary)'
      }
    }, "Ver todos \xB7 ", g.list.length) : /*#__PURE__*/React.createElement("span", {
      className: "al-data",
      style: {
        color: 'var(--muted-foreground)'
      }
    }, g.list.length)), show.map((it, i) => /*#__PURE__*/React.createElement(AurRow, {
      key: i,
      item: it
    })));
  }))), mode === 'conversar' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    ref: threadRef,
    className: "al-scroll",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '18px 20px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 15
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '15px 18px',
      border: '1px solid hsl(var(--primary-hsl) / 0.35)',
      borderRadius: 'var(--radius-md)',
      background: 'hsl(var(--primary-hsl) / 0.05)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 7px',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--primary)'
    }
  }, "Aurora"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, D.greeting)), msgs.map((m, i) => /*#__PURE__*/React.createElement(AurMsg, {
    key: i,
    who: m.who,
    text: m.text
  })), thinking && /*#__PURE__*/React.createElement("div", {
    className: "aur-dots",
    "aria-hidden": "true",
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 20,
      color: 'var(--muted-foreground)',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\xB7"))), chips.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '10px 20px',
      flexShrink: 0
    }
  }, chips.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.q,
    type: "button",
    onClick: () => ask(s.q),
    style: {
      display: 'inline-flex',
      padding: '7px 13px',
      cursor: 'pointer',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      background: 'none',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      textAlign: 'left',
      color: 'var(--muted-foreground)'
    }
  }, s.q))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 20px 18px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 46,
      padding: '0 6px 0 16px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') send();
    },
    placeholder: "Pergunte \xE0 Aurora\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      background: 'none',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      color: 'var(--foreground)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: send,
    "aria-label": "Enviar",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 34,
      height: 34,
      background: 'hsl(var(--primary-hsl) / 0.12)',
      border: 'none',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(AurIcon, {
    name: "arrow-up",
    size: 15,
    color: "var(--primary)"
  }))))))));
}
window.AuroraPanel = AuroraPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/AuroraPanel.jsx", error: String((e && e.message) || e) }); }

// cursos/CourseDetail.jsx
try { (() => {
/* CourseDetail — the redesigned course presentation page.
 * App route : /cursos/:slug  ←→  LmsCourseDetailTemplate.tsx
 * Data      : window.CursoData.course  (curso-data.js, bate com Course type)
 */
const {
  Icon: CdIcon,
  Button: CdButton,
  Badge: CdBadge,
  Avatar: CdAvatar,
  Progress: CdProgress
} = window.LendRIADesignSystem_096da5;
const PLAYER_URL = 'Player - PS AIOX Fundamentals.html';
const D = window.CursoData;

// ---- small primitives ------------------------------------------------------
function MonoChip({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, icon && /*#__PURE__*/React.createElement(CdIcon, {
    name: icon,
    size: 14,
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, children));
}
function Panel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      ...style
    }
  }, children);
}
function EyebrowLabel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: 0,
      color: 'var(--muted-foreground)',
      ...style
    }
  }, children);
}

// ---- lesson row ------------------------------------------------------------
function LessonRow({
  lesson,
  last
}) {
  const [hover, setHover] = React.useState(false);
  const locked = lesson.status === 'locked';
  const current = lesson.status === 'current';
  const done = lesson.status === 'completed';
  const go = () => {
    if (!locked) window.location.href = PLAYER_URL;
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: go,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      width: '100%',
      textAlign: 'left',
      padding: '21px 24px',
      border: 'none',
      cursor: locked ? 'default' : 'pointer',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      background: current ? 'hsl(var(--primary-hsl) / 0.05)' : hover && !locked ? 'hsl(var(--foreground-hsl) / 0.03)' : 'transparent',
      boxShadow: current ? 'inset 2px 0 0 var(--primary)' : 'none',
      fontFamily: 'var(--font-sans)',
      transition: 'background 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: done ? 'check-circle' : current ? 'play' : 'lock',
    size: 18,
    color: done ? 'var(--success)' : current ? 'var(--primary)' : 'var(--muted-foreground)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      flexShrink: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, String(lesson._n).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 15,
      fontWeight: current ? 700 : 500,
      color: current ? 'var(--primary)' : done ? 'var(--muted-foreground)' : 'var(--foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, lesson.title), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)',
      marginTop: 7,
      display: 'block'
    }
  }, "Sess\xE3o ao vivo \xB7 ", lesson._date)), current && /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--primary)',
      flexShrink: 0
    }
  }, "Continuar"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--muted-foreground)',
      flexShrink: 0,
      minWidth: 52,
      textAlign: 'right'
    }
  }, lesson.duration));
}
function ModuleBlock({
  mod,
  index
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cd-modhead",
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      padding: '0 4px 16px'
    }
  }, /*#__PURE__*/React.createElement(EyebrowLabel, {
    style: {
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }
  }, "M\xF3dulo ", String(index + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 21,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, mod.title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, hsl(var(--foreground-hsl) / 0.14), transparent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)',
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }
  }, mod.lessons.length, " aulas \xB7 ", mod.duration)), /*#__PURE__*/React.createElement(Panel, {
    style: {
      overflow: 'hidden'
    }
  }, mod.lessons.map((l, i) => /*#__PURE__*/React.createElement(LessonRow, {
    key: l.id,
    lesson: l,
    last: i === mod.lessons.length - 1
  }))));
}

// ---- rail cards ------------------------------------------------------------
function RailSection({
  eyebrow,
  children
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: 22
    }
  }, /*#__PURE__*/React.createElement(EyebrowLabel, {
    style: {
      marginBottom: 16
    }
  }, eyebrow), children);
}
function CourseDetail() {
  const c = D.course;
  const start = () => {
    window.location.href = PLAYER_URL;
  };
  const [fav, setFav] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "explorar"
  }), /*#__PURE__*/React.createElement("main", {
    className: "cd-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      textDecoration: 'none',
      color: 'var(--muted-foreground)',
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "arrow-left",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-label"
  }, "Voltar para Meus Cursos")), /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 48,
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(CdBadge, {
    variant: "brand"
  }, c._category), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 14,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement(MonoChip, {
    icon: "code"
  }, c._level)), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 'clamp(44px, 6vw, 68px)',
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, c.title.replace(c._titleAccent, '').trim(), " ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, c._titleAccent)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '22px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontWeight: 300,
      fontSize: 22,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      maxWidth: 640
    }
  }, c._tagline), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      marginTop: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(CdAvatar, {
    src: c.instructorAvatar,
    name: c.author,
    size: "default"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap'
    }
  }, c.author), /*#__PURE__*/React.createElement("p", {
    className: "al-data",
    style: {
      margin: '4px 0 0',
      color: 'var(--muted-foreground)'
    }
  }, "Instrutor"))), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 30,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(MonoChip, {
    icon: "list"
  }, c.totalLessons, " aulas"), /*#__PURE__*/React.createElement(MonoChip, {
    icon: "clock"
  }, c._totalDuration), /*#__PURE__*/React.createElement(MonoChip, {
    icon: "refresh-double"
  }, "Atualizado ", c.lastUpdated), /*#__PURE__*/React.createElement(MonoChip, {
    icon: "medal"
  }, "Certificado incluso")))), /*#__PURE__*/React.createElement("div", {
    className: "cd-cols",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 360px',
      gap: 56,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: 28,
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(EyebrowLabel, {
    style: {
      marginBottom: 10
    }
  }, "Comece sua jornada"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 27,
      fontWeight: 300,
      lineHeight: 1.15,
      color: 'var(--foreground)'
    }
  }, c.totalLessons, " aulas esperando por voc\xEA."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16,
      lineHeight: 1.4,
      color: 'var(--muted-foreground)'
    }
  }, "Voc\xEA ainda n\xE3o iniciou este curso \u2014 comece pela aula de abertura."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      marginTop: 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Seu progresso"), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, c.completedLessons, "/", c.totalLessons, " aulas")), /*#__PURE__*/React.createElement(CdProgress, {
    value: c.progress
  })), /*#__PURE__*/React.createElement("div", {
    className: "cd-ctas",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(CdButton, {
    variant: "ghost",
    onClick: () => setFav(!fav)
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "heart",
    size: 16,
    color: fav ? 'var(--primary)' : 'currentColor'
  }), "Favoritar"), /*#__PURE__*/React.createElement(CdButton, {
    variant: "cta",
    onClick: start
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "play",
    size: 15
  }), "Come\xE7ar agora")))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 28,
      letterSpacing: '-0.01em'
    }
  }, "O que voc\xEA vai aprender"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, hsl(var(--foreground-hsl) / 0.14), transparent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "cd-outcomes",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px 32px'
    }
  }, c._outcomes.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "check",
    size: 16,
    color: "var(--muted-foreground)",
    style: {
      marginTop: 3,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, o))))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 28,
      letterSpacing: '-0.01em'
    }
  }, "Conte\xFAdo do curso"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, hsl(var(--foreground-hsl) / 0.14), transparent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, c.modules.length, " m\xF3dulos \xB7 ", c.totalLessons, " aulas")), c.modules.map((m, i) => /*#__PURE__*/React.createElement(ModuleBlock, {
    key: m.id,
    mod: m,
    index: i
  }))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 28,
      letterSpacing: '-0.01em'
    }
  }, "Avalia\xE7\xF5es"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, hsl(var(--foreground-hsl) / 0.14), transparent)'
    }
  })), /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: 36,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "star",
    size: 28,
    color: "hsl(var(--foreground-hsl) / 0.3)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 18,
      color: 'var(--muted-foreground)'
    }
  }, "Ainda sem avalia\xE7\xF5es \u2014 seja o primeiro a contar como foi."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(CdButton, {
    variant: "outline"
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "star",
    size: 15
  }), "Avaliar curso"))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'sticky',
      top: 88,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 320,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'radial-gradient(120% 85% at 50% -8%, rgba(99,230,226,0.12), transparent 58%), linear-gradient(158deg, #1f3a45 0%, #1b2742 48%, #0c0d12 100%)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 132,
      height: 132,
      transform: 'translate(-50%, -54%)',
      opacity: 0.16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(CdBadge, {
    variant: "brand"
  }, c._level), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'rgba(255,255,255,0.5)'
    }
  }, c.totalLessons, " aulas"))), /*#__PURE__*/React.createElement(RailSection, {
    eyebrow: "Conhe\xE7a seu professor"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(CdAvatar, {
    src: c.instructorAvatar,
    name: c.author,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--foreground)'
    }
  }, c.author), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, c._instructorRole))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      fontFamily: 'var(--font-serif)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--muted-foreground)'
    }
  }, c.instructorBio), /*#__PURE__*/React.createElement(CdButton, {
    variant: "outline",
    size: "sm",
    style: {
      width: '100%'
    }
  }, "Ver perfil completo", /*#__PURE__*/React.createElement(CdIcon, {
    name: "arrow-right",
    size: 14
  }))), /*#__PURE__*/React.createElement(RailSection, {
    eyebrow: "Certificado"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-base)'
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "medal",
    size: 22,
    color: "var(--muted-foreground)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--foreground)'
    }
  }, "Certificado de Conclus\xE3o"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, "Complete 100% do curso para emitir"))), /*#__PURE__*/React.createElement(CdProgress, {
    value: c.progress
  })), /*#__PURE__*/React.createElement(RailSection, {
    eyebrow: "Comunidade"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      fontFamily: 'var(--font-serif)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--muted-foreground)'
    }
  }, "Tire d\xFAvidas e fa\xE7a networking com outros alunos no espa\xE7o UX Pro."), /*#__PURE__*/React.createElement(CdButton, {
    variant: "outline",
    size: "sm",
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(CdIcon, {
    name: "group",
    size: 15
  }), "Acessar comunidade"))))), /*#__PURE__*/React.createElement(window.AuroraPanel, null));
}
window.CourseDetail = CourseDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/CourseDetail.jsx", error: String((e && e.message) || e) }); }

// cursos/CourseTopbar.jsx
try { (() => {
/* CourseTopbar — barra de navegação horizontal do LMS.
 * Equivalente : app/components/lms/ui/LmsTopbar.tsx
 * Usado em    : CourseDetail.jsx, ProntoSocorro.jsx
 */
const {
  Icon: TbIcon,
  Button: TbButton,
  Avatar: TbAvatar
} = window.LendRIADesignSystem_096da5;
const TB_NAV = [{
  key: 'explorar',
  label: 'Explorar',
  href: 'Explorar - Cursos.html'
}, {
  key: 'trilhas',
  label: 'Trilhas',
  href: 'Trilhas.html'
}, {
  key: 'projetos',
  label: 'Projetos',
  href: 'Projetos.html'
}, {
  key: 'ps',
  label: 'Mentor[IA]',
  href: 'Pronto Socorro.html'
}];

/* usuária logada — favoritos vivem aqui, não na navegação */
const TB_USER = {
  name: 'Camila Duarte',
  tag: 'Lendário I',
  avatar: 'https://i.pravatar.cc/80?u=camila-d'
};
const TB_ACCOUNT_MENU = [{
  icon: 'user',
  label: 'Meu perfil',
  href: '#'
}, {
  icon: 'star',
  label: 'Favoritos',
  href: '#'
}];
/* destinos de outras seções — fonte única em app-nav.js (window.LendariaNav) */
const TB_LN = window.LendariaNav;
const TB_NAV2 = [{
  key: 'livros',
  label: 'Livros',
  href: TB_LN ? TB_LN.href('livros') : '../livros/Explorar - Alternativa Editorial.html'
}, {
  key: 'comunidade',
  label: 'Comunidade',
  href: TB_LN ? TB_LN.href('comunidade') : '../comunidade/Feed.html'
}];

/* tema do conteúdo (dark/light) — chave única do app (al-theme), compartilhada
 * com Comunidade e Livros, para o tema seguir o usuário. O topbar é sempre
 * preto via classe .dark. */
const TB_THEME_KEY = 'al-theme';
function tbApplyTheme(t) {
  document.documentElement.classList.toggle('light', t === 'light');
}
const TB_INITIAL_THEME = (() => {
  try {
    return localStorage.getItem(TB_THEME_KEY) || localStorage.getItem('al-cursos-theme') || 'dark';
  } catch (e) {
    return 'dark';
  }
})();
tbApplyTheme(TB_INITIAL_THEME);
function TbThemeToggle() {
  const [theme, setTheme] = React.useState(TB_INITIAL_THEME);
  const [hover, setHover] = React.useState(false);
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    tbApplyTheme(next);
    try {
      localStorage.setItem(TB_THEME_KEY, next);
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: toggle,
    "aria-label": theme === 'light' ? 'Mudar para modo noite' : 'Mudar para modo claro',
    title: theme === 'light' ? 'Modo noite' : 'Modo claro',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      flexShrink: 0,
      background: 'none',
      border: 'none',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(TbIcon, {
    name: theme === 'light' ? 'half-moon' : 'sun-light',
    size: 16,
    color: hover ? 'var(--foreground)' : 'var(--muted-foreground)'
  }));
}

/* avisos (notificações + mensagens) — levam à Comunidade */
function TbAlertBtn({
  icon,
  badge,
  href,
  label
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    title: label,
    "aria-label": label,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      flexShrink: 0,
      borderRadius: 'var(--radius-base)',
      textDecoration: 'none',
      background: hover ? 'hsl(var(--foreground-hsl) / 0.06)' : 'transparent',
      transition: 'background 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(TbIcon, {
    name: icon,
    size: 17,
    color: hover ? 'var(--foreground)' : 'var(--muted-foreground)'
  }), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      right: 3,
      minWidth: 15,
      height: 15,
      padding: '0 4px',
      boxSizing: 'border-box',
      borderRadius: 999,
      background: 'hsl(var(--primary-hsl))',
      color: 'var(--primary-foreground)',
      fontFamily: 'var(--font-mono)',
      fontSize: 8.5,
      fontWeight: 900,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--background)'
    }
  }, badge) : null);
}
function TbItem({
  label,
  active,
  href
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href || '#',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      height: 64,
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: active ? 'var(--foreground)' : hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'color 200ms var(--ease-out)'
    }
  }, label, active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 14,
      height: 1,
      background: 'var(--primary)'
    }
  }));
}
function CourseTopbar({
  active
}) {
  React.useEffect(() => {
    if (window.AppSearch || document.querySelector('script[data-app-search-src]')) return;
    var s = document.createElement('script');
    s.src = '../app-search.js?v=2';
    s.setAttribute('data-app-search-src', '1');
    document.body.appendChild(s);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    className: "dark",
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
      background: 'hsl(var(--background-hsl) / 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-inner",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '0 48px',
      height: 64,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos.html",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      textDecoration: 'none',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 26,
      height: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.02em'
    }
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary)'
    }
  }, "[IA]")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)',
      paddingLeft: 11,
      borderLeft: '1px solid var(--border)',
      lineHeight: 1
    }
  }, "Cursos")), /*#__PURE__*/React.createElement("nav", {
    className: "ct-nav",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      marginLeft: 48
    }
  }, TB_NAV.map(i => /*#__PURE__*/React.createElement(TbItem, {
    key: i.key,
    label: i.label,
    href: i.href,
    active: active === i.key
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: 'var(--border)'
    }
  }), TB_NAV2.map(i => /*#__PURE__*/React.createElement(TbItem, {
    key: i.key,
    label: i.label,
    href: i.href,
    active: active === i.key
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ct-search",
    "data-app-search": true,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: 230,
      height: 38,
      padding: '0 14px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-base)',
      background: 'transparent'
    }
  }, /*#__PURE__*/React.createElement(TbIcon, {
    name: "search",
    size: 15,
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: 'var(--muted-foreground)'
    }
  }, "Buscar\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.04em',
      color: 'var(--muted-foreground)',
      border: '1px solid var(--hairline)',
      borderRadius: 3,
      padding: '1px 5px'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: 12
    }
  }, /*#__PURE__*/React.createElement(TbAlertBtn, {
    icon: "bell",
    badge: "12",
    href: "../comunidade/Feed.html",
    label: "Notifica\xE7\xF5es"
  }), /*#__PURE__*/React.createElement(TbAlertBtn, {
    icon: "chat-bubble",
    badge: "3",
    href: "../comunidade/Mensagens.html",
    label: "Mensagens"
  }), /*#__PURE__*/React.createElement(TbThemeToggle, null), /*#__PURE__*/React.createElement(TbAccount, null))));
}

/* ---------- conta: avatar + submenu (perfil, favoritos, sair) ---------- */
function TbMenuItem({
  icon,
  label,
  href,
  muted,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href || '#',
    role: "menuitem",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      textDecoration: 'none',
      borderRadius: 'var(--radius-sm, 4px)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: '0.01em',
      color: muted ? 'var(--muted-foreground)' : hover ? 'var(--foreground)' : 'var(--foreground)',
      background: hover ? 'hsl(var(--foreground-hsl) / 0.05)' : 'transparent',
      transition: 'background 160ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(TbIcon, {
    name: icon,
    size: 16,
    color: "var(--muted-foreground)"
  }), label);
}
function TbAccount() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-label": 'Conta de ' + TB_USER.name,
    onClick: () => setOpen(o => !o),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      padding: 0,
      background: 'none',
      cursor: 'pointer',
      border: 'none',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      borderRadius: 'var(--radius-full)',
      boxShadow: open ? '0 0 0 2px var(--primary)' : '0 0 0 1px var(--border)',
      transition: 'box-shadow 160ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(TbAvatar, {
    src: TB_USER.avatar,
    name: TB_USER.name,
    size: 34
  }))), open && /*#__PURE__*/React.createElement("div", {
    role: "menu",
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      minWidth: 224,
      zIndex: 50,
      padding: 6,
      background: 'var(--popover)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-base)',
      boxShadow: 'var(--shadow-modal)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px 12px',
      borderBottom: '1px solid var(--border)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, TB_USER.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'var(--primary)'
    }
  }, TB_USER.tag)), TB_ACCOUNT_MENU.map(i => /*#__PURE__*/React.createElement(TbMenuItem, {
    key: i.label,
    icon: i.icon,
    label: i.label,
    href: i.href,
    onClick: e => {
      e.preventDefault();
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border)',
      margin: '6px 0'
    }
  }), /*#__PURE__*/React.createElement(TbMenuItem, {
    icon: "log-out",
    label: "Sair",
    muted: true,
    onClick: e => {
      e.preventDefault();
    }
  })));
}
window.CourseTopbar = CourseTopbar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/CourseTopbar.jsx", error: String((e && e.message) || e) }); }

// cursos/ExplorarAIFirst.jsx
try { (() => {
/* ExplorarAIFirst — versão AI-first do Explorar: o chat é a tela.
 * Fluxo: pergunta inicial → anamnese (nível → contexto → tempo) → só então
 * o Curador[IA] monta a trilha personalizada e a apresenta no chat.
 * Visual estilo ChatGPT: thread rolável + input fixo na base.
 * Respostas mockadas (máquina de estados) — trocar por chamada real no app.
 */
const {
  Icon: AfIcon,
  Button: AfButton
} = window.LendRIADesignSystem_096da5;
const {
  CATEGORIES,
  COURSES,
  TRACKS,
  RESUME
} = window.ExplorarData;
const AF_CAT = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const AF_BY_ID = Object.fromEntries(COURSES.map(c => [c.id, c]));

/* ---------- intenções (detectadas na primeira mensagem) ---------- */
const AF_INTENTS = [{
  match: /atendimento|whatsapp|cliente|suporte/i,
  label: 'automatizar seu atendimento',
  courses: ['whatsapp-ia', 'funis-auto', 'agentes-pratica'],
  track: '01'
}, {
  match: /app|aplicativo|site|c[óo]digo|programar|backend|software/i,
  label: 'tirar seu app do papel',
  courses: ['vibecoding', 'supabase', 'apis-integracoes'],
  track: '02'
}, {
  match: /vender|vendas|funil|copy|faturar/i,
  label: 'vender mais com IA',
  courses: ['copy-ia', 'vendas-magneticas', 'equipe-vendas'],
  track: '03'
}, {
  match: /automa|processo|opera|planilha|dados|integra/i,
  label: 'automatizar sua operação',
  courses: ['manip-dados', 'funis-auto', 'aiox-fund'],
  track: '01'
}, {
  match: /agente|aut[ôo]nomo|rag|mente/i,
  label: 'construir agentes autônomos',
  courses: ['agentes-pratica', 'rag-zero', 'mentes-sinteticas'],
  track: '01'
}];
const AF_DEFAULT_INTENT = {
  label: 'dominar a IA na prática',
  courses: ['intro-ia', 'prompt-lendario', 'aiox-fund'],
  track: '01'
};

/* ---------- anamnese ---------- */
const AF_Q1 = {
  key: 'level',
  options: ['Nunca usei IA de verdade', 'Uso no dia a dia, mas sem método', 'Já construo automações']
};
const AF_Q2 = {
  key: 'context',
  options: ['Tenho um negócio próprio', 'Trabalho em uma empresa', 'Estou começando um projeto do zero']
};
const AF_Q3 = {
  key: 'time',
  options: ['Até 2h por semana', 'Cerca de 5h por semana', '10h ou mais']
};
const AF_SUGGESTIONS = ['Quero automatizar o atendimento do meu negócio', 'Quero criar um app sem escrever código', 'Quero vender mais usando IA', 'Estou começando do zero'];
function afWeeksPerCourse(time) {
  if (/2h/.test(time)) return 3;
  if (/5h/.test(time)) return 2;
  return 1;
}
function afBuildPlan(intent, profile) {
  let ids = [...intent.courses];
  if (/nunca/i.test(profile.level || '') && !ids.includes('intro-ia')) ids = ['intro-ia', ...ids];
  ids = ids.filter(id => AF_BY_ID[id]).slice(0, 4);
  const wpc = afWeeksPerCourse(profile.time || '');
  return {
    ids,
    trackN: intent.track,
    weeks: ids.length * wpc,
    wpc
  };
}

/* ---------- histórico de conversas (localStorage) ---------- */
const AF_STORE_KEY = 'lendaria-curador-conversas-v1';
function afSeedConvs() {
  const d = days => {
    const x = new Date();
    x.setDate(x.getDate() - days);
    return x.toISOString();
  };
  const it0 = AF_INTENTS[0];
  const prof0 = {
    goal: 'Quero automatizar o atendimento do meu negócio',
    level: 'Uso no dia a dia, mas sem método',
    context: 'Tenho um negócio próprio',
    time: 'Cerca de 5h por semana'
  };
  return [{
    id: 'seed-atendimento',
    title: prof0.goal,
    date: d(3),
    stage: 'done',
    intentIdx: 0,
    profile: prof0,
    msgs: [{
      role: 'user',
      text: prof0.goal
    }, {
      role: 'ai',
      text: `Entendi — você quer ${it0.label}. Antes de desenhar o caminho, preciso te conhecer um pouco. Qual é o seu nível com IA hoje?`,
      options: AF_Q1.options
    }, {
      role: 'user',
      text: prof0.level
    }, {
      role: 'ai',
      text: 'Boa. E qual destes é o seu contexto — onde esse aprendizado vai virar resultado?',
      options: AF_Q2.options
    }, {
      role: 'user',
      text: prof0.context
    }, {
      role: 'ai',
      text: 'Última pergunta: quanto tempo por semana você consegue dedicar, de verdade?',
      options: AF_Q3.options
    }, {
      role: 'user',
      text: prof0.time
    }, {
      role: 'ai',
      text: 'Perfeito. Com o que você me contou, este é o caminho que eu desenharia — na ordem certa, no seu ritmo:',
      plan: afBuildPlan(it0, prof0),
      options: ['Ajustar o ritmo', 'Prefiro outro foco', 'Ver catálogo completo']
    }]
  }, {
    id: 'seed-zero',
    title: 'Estou começando do zero',
    date: d(1),
    stage: 'q2',
    intentIdx: -1,
    profile: {
      goal: 'Estou começando do zero',
      level: 'Nunca usei IA de verdade'
    },
    msgs: [{
      role: 'user',
      text: 'Estou começando do zero'
    }, {
      role: 'ai',
      text: `Entendi — você quer ${AF_DEFAULT_INTENT.label}. Antes de desenhar o caminho, preciso te conhecer um pouco. Qual é o seu nível com IA hoje?`,
      options: AF_Q1.options
    }, {
      role: 'user',
      text: 'Nunca usei IA de verdade'
    }, {
      role: 'ai',
      text: 'Boa. E qual destes é o seu contexto — onde esse aprendizado vai virar resultado?',
      options: AF_Q2.options
    }]
  }];
}
function afLoadConvs() {
  try {
    const raw = localStorage.getItem(AF_STORE_KEY);
    if (raw) return JSON.parse(raw).list || [];
  } catch (e) {/* corrompido — recomeça */}
  const seed = afSeedConvs();
  try {
    localStorage.setItem(AF_STORE_KEY, JSON.stringify({
      v: 1,
      list: seed
    }));
  } catch (e) {}
  return seed;
}
function afSaveConvs(list) {
  try {
    localStorage.setItem(AF_STORE_KEY, JSON.stringify({
      v: 1,
      list
    }));
  } catch (e) {}
}
function afWhen(iso) {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'HOJE';
  if (days === 1) return 'ONTEM';
  if (days < 7) return `HÁ ${days} DIAS`;
  return then.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).toUpperCase();
}
function AfMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}

/* ---------- linha de curso (recomendação) ---------- */
function AfCourseRow({
  course,
  n
}) {
  const [hover, setHover] = React.useState(false);
  const cat = AF_CAT[course.cat];
  const soon = course.status === 'embreve';
  return /*#__PURE__*/React.createElement("a", {
    href: soon ? undefined : course.href || '#',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 16px',
      textDecoration: 'none',
      border: hover && !soon ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-base)',
      background: 'var(--card)',
      cursor: soon ? 'default' : 'pointer',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, n != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.1em',
      color: 'var(--primary)',
      width: 24,
      flexShrink: 0
    }
  }, String(n).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${cat.color}12`,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-base)'
    }
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: course.icon,
    size: 17,
    color: cat.color
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-serif)',
      fontSize: 16,
      lineHeight: 1.25,
      color: soon ? 'var(--muted-foreground)' : 'var(--foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, course.title), /*#__PURE__*/React.createElement(AfMono, {
    size: 9
  }, cat.label.toUpperCase(), " \xB7 ", course.lessons, " AULAS \xB7 ", course.duration.toUpperCase(), soon ? ' · EM BREVE' : '')), /*#__PURE__*/React.createElement(AfIcon, {
    name: "nav-arrow-right",
    size: 15,
    color: hover && !soon ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.25)',
    style: {
      flexShrink: 0
    }
  }));
}

/* ---------- painel da trilha montada ---------- */
function AfPlan({
  plan
}) {
  const courses = plan.ids.map(id => AF_BY_ID[id]).filter(Boolean);
  const track = TRACKS.find(t => t.n === plan.trackN) || TRACKS[0];
  const parts = track.title.split(track.accent);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--card)',
      padding: '26px 28px 24px',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--primary)'
    }
  }, "Sua trilha personalizada"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 27,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, parts[0], /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, track.accent), parts[1]), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 20px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, "Desenhada para o seu ritmo: ~", plan.wpc, " ", plan.wpc === 1 ? 'semana' : 'semanas', " por curso, com pr\xE1tica entre as aulas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, courses.map((c, i) => /*#__PURE__*/React.createElement(AfCourseRow, {
    key: c.id,
    course: c,
    n: i + 1
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 20,
      paddingTop: 16,
      borderTop: '1px solid var(--border)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(AfMono, {
    size: 9
  }, courses.length, " CURSOS \xB7 ~", plan.weeks, " SEMANAS NO SEU RITMO"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(AfButton, {
    variant: "cta",
    size: "sm",
    onClick: () => {
      window.location.href = courses[0].href || '#';
    }
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: "play",
    size: 14
  }), "Come\xE7ar pela Aula 01")));
}

/* ---------- mensagens ---------- */
function AfUserMsg({
  text
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "al-fade-in-up",
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: '78%',
      padding: '12px 18px',
      background: 'hsl(var(--foreground-hsl) / 0.05)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-serif)',
      fontSize: 16,
      lineHeight: 1.45,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, text));
}
function AfAiMsg({
  msg,
  onReply,
  last,
  profile
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "al-fade-in-up",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      maxWidth: '92%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 16,
      height: 16
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Curador", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary)'
    }
  }, "[IA]"))), msg.text && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 17,
      lineHeight: 1.55,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, msg.text), msg.plan && /*#__PURE__*/React.createElement(AfPlan, {
    plan: msg.plan
  }), last && msg.options && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2
    }
  }, msg.options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    className: "af-follow",
    onClick: () => onReply(o)
  }, o))));
}
function AfThinking() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 16,
      height: 16,
      opacity: 0.6
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)'
    }
  }, "Curador[IA] est\xE1 pensando", /*#__PURE__*/React.createElement("span", {
    className: "af-dots"
  }, /*#__PURE__*/React.createElement("span", null, "."), /*#__PURE__*/React.createElement("span", null, "."), /*#__PURE__*/React.createElement("span", null, "."))));
}

/* ---------- input ---------- */
function AfInput({
  onSend,
  autoFocus,
  big,
  disabled
}) {
  const [v, setV] = React.useState('');
  const [hov, setHov] = React.useState(false);
  const send = () => {
    if (v.trim() && !disabled) {
      onSend(v.trim());
      setV('');
    }
  };
  if (big) {
    // versão hero — limpa: só o campo e uma seta fantasma
    return /*#__PURE__*/React.createElement("div", {
      className: "af-input",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px 4px 26px',
        border: '1px solid var(--hairline-strong)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--card)'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: v,
      autoFocus: autoFocus,
      onChange: e => setV(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Enter') send();
      },
      placeholder: "Descreva o que voc\xEA quer aprender ou criar\u2026",
      style: {
        flex: 1,
        minWidth: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: 'var(--font-serif)',
        fontSize: 18,
        color: 'var(--foreground)',
        padding: '19px 0'
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: send,
      "aria-label": "Perguntar",
      onMouseEnter: () => setHov(true),
      onMouseLeave: () => setHov(false),
      style: {
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-base)',
        color: hov || v.trim() ? 'var(--primary)' : 'var(--muted-foreground)',
        transition: 'color 160ms var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(AfIcon, {
      name: "arrow-up",
      size: 18
    })));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "af-input",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '4px 6px 4px 18px',
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: "sparks",
    size: 17,
    color: "var(--primary)",
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: v,
    onChange: e => setV(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') send();
    },
    placeholder: "Responda aqui\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-serif)',
      fontSize: 15,
      color: 'var(--foreground)',
      padding: '12px 0'
    }
  }), /*#__PURE__*/React.createElement(AfButton, {
    variant: "cta",
    size: "sm",
    onClick: send,
    "aria-label": "Enviar"
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: "arrow-up",
    size: 15
  })));
}

/* ---------- linha de conversa anterior ---------- */
function AfConvRow({
  conv,
  onOpen
}) {
  const [hover, setHover] = React.useState(false);
  const done = conv.stage === 'done';
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpen(conv),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      width: '100%',
      textAlign: 'left',
      padding: '13px 4px',
      background: 'none',
      border: 'none',
      borderBottom: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'border-color 160ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: "chat-bubble",
    size: 14,
    color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
    style: {
      flexShrink: 0,
      transition: 'color 160ms var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 15,
      lineHeight: 1.3,
      color: hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      minWidth: 0,
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transition: 'color 160ms var(--ease-out)'
    }
  }, conv.title), /*#__PURE__*/React.createElement(AfMono, {
    size: 8,
    color: done ? 'var(--primary)' : undefined
  }, done ? 'TRILHA PRONTA' : 'EM ANDAMENTO'), /*#__PURE__*/React.createElement(AfMono, {
    size: 8
  }, afWhen(conv.date)), /*#__PURE__*/React.createElement(AfIcon, {
    name: "nav-arrow-right",
    size: 13,
    color: hover ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.25)',
    style: {
      flexShrink: 0
    }
  }));
}

/* ---------- página ---------- */
function ExplorarAIFirst() {
  const [msgs, setMsgs] = React.useState([]);
  const [stage, setStage] = React.useState('start'); // start → q1 → q2 → q3 → done
  const [intent, setIntent] = React.useState(null);
  const [profile, setProfile] = React.useState({});
  const [thinking, setThinking] = React.useState(false);
  const [convs, setConvs] = React.useState(afLoadConvs);
  const [activeId, setActiveId] = React.useState(null);
  const threadRef = React.useRef(null);
  const empty = msgs.length === 0;
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });
  }, [msgs, thinking]);

  // persiste a conversa ativa a cada mudança
  React.useEffect(() => {
    if (!activeId || msgs.length === 0) return;
    setConvs(list => {
      const intentIdx = intent ? AF_INTENTS.indexOf(intent) : -1;
      const entry = {
        id: activeId,
        title: msgs[0] && msgs[0].text || 'Conversa',
        date: new Date().toISOString(),
        stage,
        intentIdx,
        profile,
        msgs
      };
      const next = [entry, ...list.filter(c => c.id !== activeId)];
      afSaveConvs(next);
      return next;
    });
  }, [msgs, stage]);
  const openConv = conv => {
    setActiveId(conv.id);
    setMsgs(conv.msgs);
    setStage(conv.stage);
    setProfile(conv.profile || {});
    setIntent(conv.intentIdx >= 0 ? AF_INTENTS[conv.intentIdx] : conv.stage === 'start' ? null : AF_DEFAULT_INTENT);
  };
  const newConv = () => {
    setActiveId(null);
    setMsgs([]);
    setStage('start');
    setProfile({});
    setIntent(null);
    setThinking(false);
  };
  const pushAI = (msg, delay) => {
    setThinking(true);
    setTimeout(() => {
      setMsgs(m => [...m, {
        role: 'ai',
        ...msg
      }]);
      setThinking(false);
    }, delay || 1000);
  };
  const ask = text => {
    setMsgs(m => [...m, {
      role: 'user',
      text
    }]);
    if (!activeId) setActiveId('c-' + Date.now());
    if (stage === 'start') {
      const it = AF_INTENTS.find(i => i.match.test(text)) || AF_DEFAULT_INTENT;
      setIntent(it);
      setProfile({
        goal: text
      });
      setStage('q1');
      pushAI({
        text: `Entendi — você quer ${it.label}. Antes de desenhar o caminho, preciso te conhecer um pouco. Qual é o seu nível com IA hoje?`,
        options: AF_Q1.options
      });
    } else if (stage === 'q1') {
      setProfile(p => ({
        ...p,
        level: text
      }));
      setStage('q2');
      pushAI({
        text: 'Boa. E qual destes é o seu contexto — onde esse aprendizado vai virar resultado?',
        options: AF_Q2.options
      });
    } else if (stage === 'q2') {
      setProfile(p => ({
        ...p,
        context: text
      }));
      setStage('q3');
      pushAI({
        text: 'Última pergunta: quanto tempo por semana você consegue dedicar, de verdade?',
        options: AF_Q3.options
      });
    } else if (stage === 'q3') {
      const prof = {
        ...profile,
        time: text
      };
      setProfile(prof);
      setStage('done');
      const plan = afBuildPlan(intent || AF_DEFAULT_INTENT, prof);
      pushAI({
        text: 'Perfeito. Com o que você me contou, este é o caminho que eu desenharia — na ordem certa, no seu ritmo:',
        plan,
        options: ['Ajustar o ritmo', 'Prefiro outro foco', 'Ver catálogo completo']
      }, 1600);
    } else {
      // pós-plano — mock de refinamento
      if (/cat[áa]logo/i.test(text)) {
        window.location.href = 'Explorar - Cursos (Essencial).html';
        return;
      }
      if (/ritmo|tempo/i.test(text)) {
        setStage('q3');
        pushAI({
          text: 'Claro — me diz o novo tempo disponível por semana que eu redistribuo as fases.',
          options: AF_Q3.options
        });
      } else {
        setStage('start');
        pushAI({
          text: 'Sem problema, vamos recomeçar do objetivo: o que você quer aprender ou criar?',
          options: AF_SUGGESTIONS.slice(0, 3)
        });
      }
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100vh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "explorar"
  }), empty ? /*#__PURE__*/React.createElement("main", {
    className: "ex-main af-main",
    style: {
      width: '100%',
      maxWidth: 880,
      margin: '0 auto',
      padding: '40px 48px 36px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "AI First \u2014 pergunta",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      paddingBottom: 24
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "AI First \u2014 hero",
    style: {
      textAlign: 'center',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-eyebrow",
    style: {
      margin: '0 0 16px',
      color: 'var(--muted-foreground)'
    }
  }, "Curador[IA] \xB7 \xC1rea do Aluno"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 46,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "O que voc\xEA quer aprender ou ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "criar?")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '18px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--muted-foreground)'
    }
  }, "Conte o objetivo. Eu fa\xE7o algumas perguntas e desenho sua trilha.")), /*#__PURE__*/React.createElement(AfInput, {
    onSend: ask,
    autoFocus: true,
    big: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20
    }
  }, AF_SUGGESTIONS.slice(0, 3).map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "af-follow quiet",
    onClick: () => ask(s)
  }, s)))), convs.length > 0 && /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "AI First \u2014 conversas anteriores",
    style: {
      maxWidth: 620,
      width: '100%',
      margin: '0 auto 26px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: 0,
      color: 'var(--muted-foreground)'
    }
  }, "Conversas anteriores"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  })), convs.slice(0, 2).map(c => /*#__PURE__*/React.createElement(AfConvRow, {
    key: c.id,
    conv: c,
    onOpen: openConv
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 22,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)'
    }
  }, "Prefere navegar?"), /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos (Essencial).html",
    className: "af-link"
  }, "cat\xE1logo essencial \u2192"), /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos.html",
    className: "af-link"
  }, "cat\xE1logo completo \u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 14,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: RESUME.href,
    className: "af-link",
    style: {
      color: 'var(--foreground)'
    }
  }, "retomar ", RESUME.course, " \u2192"))) : /*#__PURE__*/React.createElement("main", {
    "data-screen-label": "AI First \u2014 conversa",
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "af-col",
    style: {
      maxWidth: 800,
      margin: '0 auto',
      padding: '10px 48px',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: newConv,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: 'var(--muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement(AfIcon, {
    name: "arrow-left",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data"
  }, "In\xEDcio")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '55%'
    }
  }, msgs[0] && msgs[0].text || ''))), /*#__PURE__*/React.createElement("div", {
    ref: threadRef,
    className: "af-thread",
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "af-col",
    style: {
      maxWidth: 800,
      margin: '0 auto',
      padding: '36px 48px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 30
    }
  }, msgs.map((m, i) => m.role === 'user' ? /*#__PURE__*/React.createElement(AfUserMsg, {
    key: i,
    text: m.text
  }) : /*#__PURE__*/React.createElement(AfAiMsg, {
    key: i,
    msg: m,
    onReply: ask,
    last: i === msgs.length - 1,
    profile: profile
  })), thinking && /*#__PURE__*/React.createElement(AfThinking, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'hsl(var(--background-hsl) / 0.92)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "af-col",
    style: {
      maxWidth: 800,
      margin: '0 auto',
      padding: '16px 48px 14px'
    }
  }, /*#__PURE__*/React.createElement(AfInput, {
    onSend: ask,
    disabled: thinking
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '9px 4px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(AfMono, {
    size: 8
  }, "CURADOR[IA] RECOMENDA A PARTIR DO CAT\xC1LOGO \xB7 CONFIRA AS EMENTAS"))))));
}
window.ExplorarAIFirst = ExplorarAIFirst;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ExplorarAIFirst.jsx", error: String((e && e.message) || e) }); }

// cursos/ExplorarCursos.jsx
try { (() => {
/* ExplorarCursos — catálogo de cursos por categoria.
 * App route : /cursos (LmsExploreTemplate)
 * Data      : explorar-data.js (window.ExplorarData)
 *
 * Estrutura: header editorial → retomar → trilhas recomendadas →
 * catálogo (índice numerado à esquerda + seções por categoria à direita).
 */
const {
  Icon: ExIcon,
  Button: ExButton,
  Avatar: ExAvatar
} = window.LendRIADesignSystem_096da5;
const {
  CATEGORIES,
  LEVELS,
  COURSES,
  TRACKS,
  RESUME,
  GAME
} = window.ExplorarData;
const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const EX_STATUS = {
  disponivel: {
    label: 'Disponível',
    color: 'var(--primary)'
  },
  embreve: {
    label: 'Em breve',
    color: '#FF9F0A'
  },
  aovivo: {
    label: 'Ao vivo',
    color: '#FF453A',
    dot: true
  }
};
function ExMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}
function ExStatusChip({
  status
}) {
  const s = EX_STATUS[status];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      padding: '3px 9px',
      border: `1px solid ${s.color}55`,
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: s.color,
      whiteSpace: 'nowrap'
    }
  }, s.dot && /*#__PURE__*/React.createElement("span", {
    className: "ps-live-dot",
    style: {
      width: 6,
      height: 6
    }
  }), s.label);
}
function ExLevelSquares({
  level,
  showLabel
}) {
  return /*#__PURE__*/React.createElement("span", {
    title: LEVELS[level - 1],
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 3
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 5,
      height: 5,
      background: i < level ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.16)'
    }
  }))), showLabel && /*#__PURE__*/React.createElement(ExMono, null, LEVELS[level - 1]));
}

/* ---------- card de curso ---------- */
function CourseCard({
  course
}) {
  const [hover, setHover] = React.useState(false);
  const cat = CAT_BY_KEY[course.cat];
  const soon = course.status === 'embreve';
  const Tag = soon ? 'div' : 'a';
  return /*#__PURE__*/React.createElement(Tag, {
    href: soon ? undefined : course.href || '#',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      textDecoration: 'none',
      background: 'var(--card)',
      overflow: 'hidden',
      border: hover && !soon ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      cursor: soon ? 'default' : 'pointer',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 54,
      flexShrink: 0,
      padding: '0 18px',
      background: `${cat.color}14`,
      borderBottom: `1px solid ${cat.color}22`
    }
  }, /*#__PURE__*/React.createElement(ExIcon, {
    name: course.icon,
    size: 22,
    color: cat.color,
    style: {
      opacity: soon ? 0.5 : 1,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: cat.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: cat.color,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, cat.label), /*#__PURE__*/React.createElement(ExStatusChip, {
    status: course.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      padding: '18px 22px 18px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 19,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      textWrap: 'pretty',
      color: soon ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, course.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, course.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 14,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ExAvatar, {
    name: course.instructor,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      flex: 1
    }
  }, course.instructor), /*#__PURE__*/React.createElement(ExMono, {
    size: 9
  }, course.lessons, " aulas \xB7 ", course.duration), /*#__PURE__*/React.createElement(ExLevelSquares, {
    level: course.level
  }))));
}

/* ---------- trilha recomendada ---------- */
function TrackCard({
  track
}) {
  const [hover, setHover] = React.useState(false);
  const parts = track.title.split(track.accent);
  return /*#__PURE__*/React.createElement("a", {
    href: track.href || 'Trilhas.html',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      minWidth: 0,
      textDecoration: 'none',
      padding: '24px 26px 22px',
      background: 'var(--card)',
      border: hover ? '1px solid var(--hairline-strong)' : '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.14em',
      color: 'var(--primary)'
    }
  }, "TRILHA ", track.n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement(ExMono, {
    size: 9
  }, track.courses, " cursos \xB7 ", track.duration)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '16px 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 24,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, parts[0], /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, track.accent), parts[1]), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 18px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, track.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ExMono, {
    size: 9
  }, track.range.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
      transition: 'color 180ms var(--ease-out)'
    }
  }, "come\xE7ar trilha \u2192")));
}

/* ---------- retomar + gamificação ---------- */
function ResumeCard() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 26px 24px',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 14px',
      color: 'var(--muted-foreground)'
    }
  }, "Voc\xEA parou aqui"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 24,
      lineHeight: 1.15,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, RESUME.course), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.06em',
      color: 'var(--muted-foreground)'
    }
  }, RESUME.lesson), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.18)',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '6%',
      height: '100%',
      background: 'var(--primary)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(ExMono, {
    color: "var(--primary)"
  }, RESUME.progress), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(ExButton, {
    variant: "cta",
    size: "sm",
    onClick: () => {
      window.location.href = RESUME.href;
    }
  }, /*#__PURE__*/React.createElement(ExIcon, {
    name: "play",
    size: 14
  }), "Retomar"))));
}
function GameRow({
  icon,
  value,
  label,
  meta,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(ExIcon, {
    name: icon,
    size: 20,
    color: "var(--primary)",
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 20,
      lineHeight: 1.1,
      color: 'var(--foreground)'
    }
  }, value), /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '4px 0 0',
      color: 'var(--muted-foreground)'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }
  }, meta));
}
function GamePanel() {
  return /*#__PURE__*/React.createElement("div", {
    className: "ex-game",
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 26px 10px',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement(GameRow, {
    icon: "flash",
    value: `${GAME.streak} dias`,
    label: "Sequ\xEAncia",
    meta: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 7,
        alignItems: 'flex-end'
      }
    }, GAME.week.map((w, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        letterSpacing: '0.05em',
        color: w.today ? 'var(--primary)' : 'var(--muted-foreground)',
        opacity: w.today ? 1 : 0.6
      }
    }, w.d), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        background: w.done ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.14)',
        outline: w.today ? '1px solid var(--hairline-strong)' : 'none',
        outlineOffset: 2
      }
    }))))
  }), /*#__PURE__*/React.createElement(GameRow, {
    icon: "star",
    value: `${GAME.xp} XP`,
    label: "Pontos",
    meta: /*#__PURE__*/React.createElement(ExMono, {
      size: 9
    }, GAME.xpWeek.toUpperCase())
  }), /*#__PURE__*/React.createElement(GameRow, {
    icon: "trophy",
    value: GAME.rank,
    label: "Ranking",
    last: true,
    meta: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(ExMono, {
      size: 9,
      color: "var(--primary)"
    }, GAME.division.toUpperCase()), /*#__PURE__*/React.createElement("a", {
      href: GAME.rankHref,
      style: {
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--muted-foreground)',
        textDecoration: 'none',
        whiteSpace: 'nowrap'
      }
    }, "ver ranking \u2192"))
  }));
}
function ResumeBanner() {
  return /*#__PURE__*/React.createElement("div", {
    className: "ex-band",
    "data-screen-label": "Explorar \u2014 retomar e gamifica\xE7\xE3o",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 360px',
      gap: 16,
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(ResumeCard, null), /*#__PURE__*/React.createElement(GamePanel, null));
}

/* ---------- índice lateral ---------- */
function RailItem({
  n,
  label,
  count,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      padding: '9px 14px',
      background: active ? 'hsl(var(--primary-hsl) / 0.06)' : 'transparent',
      border: 'none',
      borderRadius: 0,
      cursor: 'pointer',
      boxShadow: active ? 'inset 2px 0 0 var(--primary)' : 'none',
      transition: 'all 160ms var(--ease-out)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.08em',
      color: active ? 'var(--primary)' : 'var(--muted-foreground)',
      width: 18,
      flexShrink: 0
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      color: active || hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
      flex: 1,
      transition: 'color 160ms var(--ease-out)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--muted-foreground)',
      opacity: 0.7
    }
  }, count));
}
function LevelItem({
  level,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      padding: '7px 14px',
      background: active ? 'hsl(var(--primary-hsl) / 0.06)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
      boxShadow: active ? 'inset 2px 0 0 var(--primary)' : 'none',
      transition: 'all 160ms var(--ease-out)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 3,
      width: 29,
      flexShrink: 0
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 5,
      height: 5,
      background: i < level ? active ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.55)' : 'hsl(var(--foreground-hsl) / 0.14)'
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: active || hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'color 160ms var(--ease-out)'
    }
  }, LEVELS[level - 1]));
}

/* ---------- seção de categoria ---------- */
function CategorySection({
  cat,
  courses
}) {
  return /*#__PURE__*/React.createElement("section", {
    "data-screen-label": `Explorar — ${cat.label}`,
    style: {
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: 'var(--primary)',
      flexShrink: 0
    }
  }, cat.n), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 26,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, cat.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }), /*#__PURE__*/React.createElement(ExMono, null, courses.length, " ", courses.length === 1 ? 'curso' : 'cursos')), /*#__PURE__*/React.createElement("div", {
    className: "ex-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
      gap: 16
    }
  }, courses.map(c => /*#__PURE__*/React.createElement(CourseCard, {
    key: c.id,
    course: c
  }))));
}

/* ---------- página ---------- */
function ExplorarCursos() {
  const [cat, setCat] = React.useState(null); // null = todas
  const [level, setLevel] = React.useState(null); // null = todos

  const byLevel = level ? COURSES.filter(c => c.level === level) : COURSES;
  const sections = CATEGORIES.filter(c => !cat || c.key === cat).map(c => ({
    cat: c,
    courses: byLevel.filter(x => x.cat === c.key)
  })).filter(s => s.courses.length > 0);
  const filtered = cat || level;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "explorar"
  }), /*#__PURE__*/React.createElement("main", {
    className: "ex-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "Explorar \u2014 header",
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 32,
      flexWrap: 'wrap',
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--muted-foreground)'
    }
  }, "\xC1rea do Aluno \xB7 Cat\xE1logo"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 42,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "Explorar ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "Cursos")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--muted-foreground)'
    }
  }, "Trilhas, aulas e encontros ao vivo \u2014 do iniciante ao lend\xE1rio.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      flexWrap: 'wrap',
      alignItems: 'flex-end'
    }
  }, [['Cursos', COURSES.length], ['Trilhas', TRACKS.length], ['Categorias', CATEGORIES.length], ['Atualizado', 'jun 2026']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 6px',
      color: 'var(--muted-foreground)'
    }
  }, k), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'var(--foreground)'
    }
  }, v))), /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos (Essencial).html",
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none',
      marginLeft: 8
    }
  }, "ver vers\xE3o essencial \u2192"))), /*#__PURE__*/React.createElement(ResumeBanner, null), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Explorar \u2014 trilhas",
    style: {
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 30,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Trilhas ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "recomendadas")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "Trilhas.html",
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none',
      flexShrink: 0
    }
  }, "ver todas \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "ex-trilhas",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16
    }
  }, TRACKS.map(t => /*#__PURE__*/React.createElement(TrackCard, {
    key: t.n,
    track: t
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ex-layout",
    "data-screen-label": "Explorar \u2014 cat\xE1logo",
    style: {
      display: 'grid',
      gridTemplateColumns: '224px minmax(0, 1fr)',
      gap: 48,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    className: "ex-rail",
    style: {
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 10px',
      padding: '0 14px',
      color: 'var(--muted-foreground)'
    }
  }, "Cat\xE1logo"), /*#__PURE__*/React.createElement("nav", {
    className: "ex-rail-list",
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(RailItem, {
    n: "\u2014",
    label: "Todos os cursos",
    count: byLevel.length,
    active: !cat,
    onClick: () => setCat(null)
  }), CATEGORIES.map(c => /*#__PURE__*/React.createElement(RailItem, {
    key: c.key,
    n: c.n,
    label: c.label,
    count: byLevel.filter(x => x.cat === c.key).length,
    active: cat === c.key,
    onClick: () => setCat(cat === c.key ? null : c.key)
  }))), /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '28px 0 10px',
      padding: '0 14px',
      color: 'var(--muted-foreground)'
    }
  }, "N\xEDveis"), /*#__PURE__*/React.createElement("nav", {
    className: "ex-rail-list",
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border)'
    }
  }, [1, 2, 3, 4].map(l => /*#__PURE__*/React.createElement(LevelItem, {
    key: l,
    level: l,
    active: level === l,
    onClick: () => setLevel(level === l ? null : l)
  }))), filtered && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCat(null);
      setLevel(null);
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      margin: '24px 0 0 14px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--muted-foreground)',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(ExIcon, {
    name: "xmark",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data"
  }, "Limpar filtros"))), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, sections.map(s => /*#__PURE__*/React.createElement(CategorySection, {
    key: s.cat.key,
    cat: s.cat,
    courses: s.courses
  })), sections.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '96px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(ExIcon, {
    name: "search",
    size: 28,
    color: "var(--foreground)",
    style: {
      opacity: 0.2
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '16px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16,
      color: 'var(--muted-foreground)'
    }
  }, "Nenhum curso neste n\xEDvel ainda \u2014 em breve."))))));
}
window.ExplorarCursos = ExplorarCursos;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ExplorarCursos.jsx", error: String((e && e.message) || e) }); }

// cursos/ExplorarEssencial.jsx
try { (() => {
/* ExplorarEssencial — versão "reduzida ao essencial" do Explorar Cursos.
 * Exercício de clareza: a tela responde só a duas perguntas —
 *   1) o que vim fazer aqui?  → retomar / achar o próximo curso
 *   2) o que me faz voltar amanhã? → a sequência (uma linha, não um painel)
 * Compare com ExplorarCursos.jsx (versão completa).
 */
const {
  Icon: EsIcon,
  Button: EsButton,
  Avatar: EsAvatar
} = window.LendRIADesignSystem_096da5;
const {
  CATEGORIES,
  LEVELS,
  COURSES,
  TRACKS,
  RESUME,
  GAME
} = window.ExplorarData;
const ES_CAT = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const ES_STATUS = {
  disponivel: null,
  // disponível é o normal — não precisa de selo
  embreve: {
    label: 'Em breve',
    color: '#FF9F0A'
  },
  aovivo: {
    label: 'Ao vivo',
    color: '#FF453A',
    dot: true
  }
};
function EsMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}
function EsChip({
  status
}) {
  const s = ES_STATUS[status];
  if (!s) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      padding: '3px 9px',
      border: `1px solid ${s.color}55`,
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: s.color,
      whiteSpace: 'nowrap'
    }
  }, s.dot && /*#__PURE__*/React.createElement("span", {
    className: "ps-live-dot",
    style: {
      width: 6,
      height: 6
    }
  }), s.label);
}

/* ---------- card: capa-ícone, título, instrutor, meta ---------- */
function EsCard({
  course
}) {
  const [hover, setHover] = React.useState(false);
  const cat = ES_CAT[course.cat];
  const soon = course.status === 'embreve';
  const Tag = soon ? 'div' : 'a';
  return /*#__PURE__*/React.createElement(Tag, {
    href: soon ? undefined : course.href || '#',
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      textDecoration: 'none',
      background: 'var(--card)',
      overflow: 'hidden',
      border: hover && !soon ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      cursor: soon ? 'default' : 'pointer',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 80,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${cat.color}10`,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(EsIcon, {
    name: course.icon,
    size: 28,
    color: cat.color,
    style: {
      opacity: soon ? 0.4 : 0.9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      right: 10
    }
  }, /*#__PURE__*/React.createElement(EsChip, {
    status: course.status
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      padding: '16px 20px 16px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 18,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      textWrap: 'pretty',
      color: soon ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, course.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(EsAvatar, {
    name: course.instructor,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      flex: 1
    }
  }, course.instructor), /*#__PURE__*/React.createElement(EsMono, {
    size: 9
  }, course.lessons, " aulas \xB7 ", course.duration))));
}

/* ---------- retomar: uma faixa, com a sequência como linha discreta ---------- */
function EsResume() {
  return /*#__PURE__*/React.createElement("div", {
    className: "es-resume",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '18px 24px',
      marginBottom: 48,
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 7px',
      color: 'var(--muted-foreground)'
    }
  }, "Voc\xEA parou aqui"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 18,
      lineHeight: 1.3,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, RESUME.course, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "\u2014 ", RESUME.lesson))), /*#__PURE__*/React.createElement("div", {
    className: "es-streak",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(EsIcon, {
    name: "flash",
    size: 15,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement(EsMono, {
    color: "var(--primary)"
  }, "SEQ ", GAME.streak, " DIAS")), /*#__PURE__*/React.createElement(EsButton, {
    variant: "cta",
    size: "sm",
    onClick: () => {
      window.location.href = RESUME.href;
    },
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(EsIcon, {
    name: "play",
    size: 14
  }), "Retomar"));
}

/* ---------- trilhas: uma linha, não uma seção ---------- */
function EsTracks() {
  return /*#__PURE__*/React.createElement("div", {
    className: "es-tracks",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '13px 24px',
      marginBottom: 56,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-label",
    style: {
      color: 'var(--muted-foreground)',
      flexShrink: 0
    }
  }, "Trilhas"), TRACKS.map((t, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: t.n
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 14,
      background: 'var(--border)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: t.href || 'Trilhas.html',
    className: "es-track-link",
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14.5,
      color: 'var(--foreground)',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, t.title, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "\xB7 ", t.courses, " cursos"), " \u2192"))));
}

/* ---------- página ---------- */
function ExplorarEssencial() {
  const [cat, setCat] = React.useState(null);
  const sections = CATEGORIES.filter(c => !cat || c.key === cat).map(c => ({
    cat: c,
    courses: COURSES.filter(x => x.cat === c.key)
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "explorar"
  }), /*#__PURE__*/React.createElement("main", {
    className: "ex-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "Essencial \u2014 header",
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap',
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--muted-foreground)'
    }
  }, "\xC1rea do Aluno \xB7 Cat\xE1logo"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 42,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "Explorar ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "Cursos"))), /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos.html",
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none'
    }
  }, "ver vers\xE3o completa \u2192"), /*#__PURE__*/React.createElement("a", {
    href: "Explorar - Cursos (AI First).html",
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none'
    }
  }, "ver vers\xE3o AI-first \u2192")), /*#__PURE__*/React.createElement(EsResume, null), /*#__PURE__*/React.createElement(EsTracks, null), /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Essencial \u2014 cat\xE1logo"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("button", {
    className: 'chip' + (!cat ? ' on' : ''),
    onClick: () => setCat(null)
  }, "Todos ", /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, COURSES.length)), CATEGORIES.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.key,
    className: 'chip' + (cat === c.key ? ' on' : ''),
    onClick: () => setCat(cat === c.key ? null : c.key)
  }, c.label, " ", /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, COURSES.filter(x => x.cat === c.key).length)))), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, sections.map(s => /*#__PURE__*/React.createElement("section", {
    key: s.cat.key,
    "data-screen-label": `Essencial — ${s.cat.label}`,
    style: {
      marginBottom: 52
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 26,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, s.cat.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }), /*#__PURE__*/React.createElement(EsMono, null, s.courses.length, " ", s.courses.length === 1 ? 'curso' : 'cursos')), /*#__PURE__*/React.createElement("div", {
    className: "ex-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16
    }
  }, s.courses.map(c => /*#__PURE__*/React.createElement(EsCard, {
    key: c.id,
    course: c
  })))))))));
}

/* (versão essencial usa chips de categoria — sem rail lateral) */
window.ExplorarEssencial = ExplorarEssencial;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ExplorarEssencial.jsx", error: String((e && e.message) || e) }); }

// cursos/LessonPlayer.jsx
try { (() => {
/* LessonPlayer — the redesigned in-course video player page.
 * App route : /cursos/:slug/aula/:lessonId  ←→  LmsStudentTemplate.tsx
 * Data      : window.CursoData.course  (curso-data.js, bate com Course type)
 */
const {
  Icon: LpIcon,
  Button: LpButton,
  Tabs: LpTabs,
  Avatar: LpAvatar
} = window.LendRIADesignSystem_096da5;
const DETAIL_URL = 'Curso - PS AIOX Fundamentals.html';
const LP = window.CursoData;

// flatten lessons, mark current
const LP_COURSE = LP.course;
const LP_FLAT = LP_COURSE.modules.flatMap(m => m.lessons);
const LP_CURRENT = LP_FLAT.find(l => l.status === 'current') || LP_FLAT[0];
const LP_REMAIN = LP_FLAT.filter(l => l.status !== 'completed').reduce((a, l) => a + l._durSec, 0);

// ---- icon rail -------------------------------------------------------------
const RAIL_ICONS = [{
  name: 'book',
  key: 'biblioteca'
}, {
  name: 'graduation-cap',
  key: 'aluno',
  active: true
}, {
  name: 'video-camera',
  key: 'ps'
}, {
  name: 'group',
  key: 'comunidade'
}, {
  name: 'book-stack',
  key: 'cursos'
}, {
  name: 'brain',
  key: 'minds'
}];
function RailButton({
  icon,
  active
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-base)',
      cursor: 'pointer',
      background: active ? 'hsl(var(--primary-hsl) / 0.08)' : hover ? 'hsl(var(--foreground-hsl) / 0.05)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--muted-foreground)',
      boxShadow: active ? 'inset 2px 0 0 var(--primary)' : 'none',
      transition: 'all 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: icon,
    size: 18
  }));
}
function IconRail() {
  return /*#__PURE__*/React.createElement("aside", {
    className: "lp-iconrail",
    style: {
      width: 60,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '14px 0',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: DETAIL_URL,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 28,
      height: 28
    }
  })), RAIL_ICONS.map(i => /*#__PURE__*/React.createElement(RailButton, {
    key: i.key,
    icon: i.name,
    active: i.active
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(RailButton, {
    icon: "settings"
  }), /*#__PURE__*/React.createElement(LpAvatar, {
    name: "Aluno Lend\xE1rio",
    size: "sm"
  }));
}

// ---- progress ring ---------------------------------------------------------
function ProgressRing({
  value,
  size = 46
}) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: 'rotate(-90deg)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "hsl(var(--primary-hsl) / 0.18)",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--primary)",
    strokeWidth: "3",
    strokeDasharray: c,
    strokeDashoffset: off,
    strokeLinecap: "round"
  }));
}

// ---- rail lesson row -------------------------------------------------------
function RailLessonRow({
  lesson
}) {
  const [hover, setHover] = React.useState(false);
  const locked = lesson.status === 'locked';
  const current = lesson.status === 'current';
  const done = lesson.status === 'completed';
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      padding: '11px 14px',
      border: 'none',
      cursor: locked ? 'default' : 'pointer',
      borderRadius: 'var(--radius-base)',
      background: current ? 'hsl(var(--primary-hsl) / 0.06)' : hover && !locked ? 'hsl(var(--foreground-hsl) / 0.04)' : 'transparent',
      boxShadow: current ? 'inset 2px 0 0 var(--primary)' : 'none',
      transition: 'background 180ms var(--ease-out)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: done ? 'check-circle' : current ? 'play' : 'lock',
    size: 16,
    color: done ? 'var(--success)' : current ? 'var(--primary)' : 'var(--muted-foreground)',
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: current ? 700 : 500,
      lineHeight: 1.3,
      color: current ? 'var(--primary)' : done ? 'var(--muted-foreground)' : 'var(--foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, lesson.title), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)',
      marginTop: 3,
      display: 'block'
    }
  }, "Aula ", String(lesson._n).padStart(2, '0'))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--muted-foreground)',
      flexShrink: 0
    }
  }, lesson.duration));
}

// ---- video ----------------------------------------------------------------
function VideoStage() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: 'var(--radius-lg)',
      background: 'radial-gradient(120% 140% at 50% 0%, #17181b 0%, #0B0B0B 70%)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 84,
      height: 84,
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 6,
      background: 'hsl(var(--foreground-hsl) / 0.08)',
      border: '1px solid hsl(var(--foreground-hsl) / 0.22)',
      transition: 'transform 200ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "play",
    size: 30,
    color: "var(--foreground)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 46,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: 'linear-gradient(to top, hsl(0 0% 0% / 0.6), transparent)'
    }
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "play",
    size: 15,
    color: "rgba(255,255,255,0.85)"
  }), /*#__PURE__*/React.createElement(LpIcon, {
    name: "sound-high",
    size: 15,
    color: "rgba(255,255,255,0.7)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)'
    }
  }, "00:00 / ", LP_CURRENT.duration), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 3,
      background: 'rgba(255,255,255,0.18)',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '0%',
      height: '100%',
      background: 'var(--primary)',
      borderRadius: 2
    }
  })), /*#__PURE__*/React.createElement(LpIcon, {
    name: "settings",
    size: 15,
    color: "rgba(255,255,255,0.7)"
  }), /*#__PURE__*/React.createElement(LpIcon, {
    name: "expand",
    size: 15,
    color: "rgba(255,255,255,0.7)"
  })));
}
function StarRow() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Avalie:"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 3
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(LpIcon, {
    key: i,
    name: "star",
    size: 16,
    color: "var(--hairline-strong)"
  }))));
}
function LessonPlayer() {
  const [tab, setTab] = React.useState('overview');
  const [done, setDone] = React.useState(false);
  const [fav, setFav] = React.useState(false);
  const s = LP_COURSE._lessonSummary;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(IconRail, null), /*#__PURE__*/React.createElement("div", {
    className: "lp-main",
    style: {
      flex: 1,
      display: 'flex',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "lp-head",
    style: {
      height: 64,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 28px',
      background: 'hsl(var(--background-hsl) / 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(LpButton, {
    variant: "ghost",
    size: "icon",
    onClick: () => {
      window.location.href = DETAIL_URL;
    },
    "aria-label": "Voltar"
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "arrow-left",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: 0,
      color: 'var(--muted-foreground)'
    }
  }, LP_COURSE.title), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '3px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, LP_CURRENT.title, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--muted-foreground)'
    }
  }, " \xB7 M\xF3dulo 1"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(LpButton, {
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "expand",
    size: 15
  }), "Modo Foco")), /*#__PURE__*/React.createElement("div", {
    className: "al-scrollbar lp-body",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '28px 36px 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 880,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(VideoStage, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(LpButton, {
    variant: "outline",
    size: "sm",
    disabled: true
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "nav-arrow-left",
    size: 15
  }), "Anterior"), /*#__PURE__*/React.createElement(LpButton, {
    variant: "outline",
    size: "sm"
  }, "Pr\xF3xima", /*#__PURE__*/React.createElement(LpIcon, {
    name: "nav-arrow-right",
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(StarRow, null), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 22,
      background: 'var(--border)'
    }
  }), /*#__PURE__*/React.createElement(LpButton, {
    variant: "ghost",
    size: "sm",
    onClick: () => setFav(!fav)
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: "heart",
    size: 15,
    color: fav ? 'var(--primary)' : 'currentColor'
  }), "Favoritar"), /*#__PURE__*/React.createElement(LpButton, {
    variant: done ? 'outline' : 'cta',
    size: "sm",
    onClick: () => setDone(!done)
  }, /*#__PURE__*/React.createElement(LpIcon, {
    name: done ? 'check-circle' : 'check',
    size: 15
  }), done ? 'Concluída' : 'Marcar concluída')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(LpTabs, {
    items: [{
      value: 'overview',
      label: 'Visão Geral'
    }, {
      value: 'comments',
      label: `Comentários (${window.LT_COMMENT_COUNT || 0})`
    }, {
      value: 'materials',
      label: `Materiais (${window.LT_MATERIAL_COUNT || 0})`
    }, {
      value: 'transcript',
      label: 'Transcrição'
    }],
    value: tab,
    onValueChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(window.LessonTabsContent, {
    tab: tab
  }))))), /*#__PURE__*/React.createElement("aside", {
    className: "al-scrollbar lp-rail",
    style: {
      width: 360,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      borderLeft: '1px solid var(--border)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 22px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 46,
      height: 46
    }
  }, /*#__PURE__*/React.createElement(ProgressRing, {
    value: LP_COURSE.progress
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--primary)'
    }
  }, LP_COURSE.progress, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: 0,
      color: 'var(--muted-foreground)'
    }
  }, "Seu progresso"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, LP_COURSE.completedLessons, "/", LP_COURSE.totalLessons, " aulas conclu\xEDdas"), /*#__PURE__*/React.createElement("p", {
    className: "al-data",
    style: {
      margin: 0,
      color: 'var(--muted-foreground)'
    }
  }, LP.humanTotal(LP_REMAIN), " restantes"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 10px 24px'
    }
  }, LP_COURSE.modules.map((m, mi) => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    style: {
      marginTop: mi === 0 ? 8 : 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      padding: '0 14px 8px',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)',
      flexShrink: 0
    }
  }, "M\xF3dulo ", String(mi + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 15,
      color: 'var(--foreground)',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, m.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, m.lessons.map(l => /*#__PURE__*/React.createElement(RailLessonRow, {
    key: l.id,
    lesson: l
  })))))))));
}
window.LessonPlayer = LessonPlayer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/LessonPlayer.jsx", error: String((e && e.message) || e) }); }

// cursos/LessonTabs.jsx
try { (() => {
/* LessonTabs — conteúdo rico para as abas de contexto do player.
 * Equivalente : app/components/lms/views/LessonContextTabs.tsx
 * Usado em    : LessonPlayer.jsx
 */
const {
  Icon: LtIcon,
  Button: LtButton,
  Avatar: LtAvatar,
  Textarea: LtTextarea,
  Switch: LtSwitch
} = window.LendRIADesignSystem_096da5;
const LT_COMMENTS = [{
  name: 'Mariana Costa',
  role: 'Aluna · Turma 5',
  time: 'há 2 h',
  avatar: 'https://i.pravatar.cc/120?u=mariana-aiox',
  text: 'A parte sobre supervisão humana foi um divisor de águas pra mim. Já tinha deixado a IA criar tarefas no ClickUp sem revisar e deu o maior nó. Agora entendi onde colocar o checkpoint.',
  likes: 12,
  public: true
}, {
  name: 'João Pedro',
  role: 'Aluno · Turma 5',
  time: 'há 5 h',
  avatar: 'https://i.pravatar.cc/120?u=joao-aiox',
  text: 'Alguém conseguiu conectar a API da Hotmart com conta sandbox? Travei na geração do token — o endpoint de auth retorna 401 mesmo com as credenciais certas.',
  likes: 3,
  public: true
}, {
  name: 'Sidney Fernandes',
  role: 'Instrutor',
  time: 'há 4 h',
  avatar: 'https://i.pravatar.cc/120?u=sidney-aiox',
  text: 'João, o 401 quase sempre é o escopo do app. Confere se você marcou “leitura de assinaturas” no painel de credenciais — sem esse escopo o token gera mas não autoriza. Vejo isso na aula 06 em detalhe.',
  likes: 7,
  public: true,
  instructor: true
}];
const LT_TRANSCRIPT = [{
  t: '00:00',
  s: 'Bem-vindo à abertura do AIOX Fundamentals. Hoje a gente não vai falar de teoria — vamos abrir o sistema rodando e ver um agente operando de verdade.'
}, {
  t: '01:24',
  s: 'A primeira coisa que você precisa entender é que o AIOX não é um chatbot. É um operador. Ele lê o estado do seu negócio, decide e age — sempre com você aprovando os pontos críticos.'
}, {
  t: '03:48',
  s: 'Vou mostrar o produto que integramos com a API da Hotmart. Repara que ele gerencia detalhes de produto, campos de cancelamento e dispara fluxos de marketing automaticamente.'
}, {
  t: '07:12',
  s: 'E aqui está o ponto que mais quero que vocês levem: a IA propõe o texto, mas quem aprova é o humano. Esse botão de aprovação não é decoração.'
}, {
  t: '11:36',
  s: 'Na auditoria que fizemos no ClickUp, descobrimos que a IA tinha inventado três tarefas e marcado as pessoas erradas. Sem supervisão, isso vira caos operacional em uma semana.'
}, {
  t: '15:02',
  s: 'Por último, o Rodrigo vai falar do UX Pro, o novo espaço de Q&A da comunidade, e da biblioteca de Squads & Skills com lançamentos semanais.'
}];

// ---------- Visão Geral (markdown rico, estilo leitor de livro) ----------
function LessonOverview() {
  return /*#__PURE__*/React.createElement("div", {
    className: "al-md",
    style: {
      maxWidth: '72ch',
      '--reading-size': '17px'
    }
  }, /*#__PURE__*/React.createElement("h6", null, "Resumo da aula \xB7 PSF-29/05/2026"), /*#__PURE__*/React.createElement("p", null, "Nesta sess\xE3o de abertura, Sidney apresenta o sistema ", /*#__PURE__*/React.createElement("strong", null, "AIOX"), " em opera\xE7\xE3o: como um agente conecta a API da Hotmart, gerencia detalhes de produto e cria fluxos de marketing \u2014 sempre com a IA propondo e o humano aprovando."), /*#__PURE__*/React.createElement("h2", null, "O que vimos rodando"), /*#__PURE__*/React.createElement("p", null, "A demonstra\xE7\xE3o partiu de um produto real e percorreu o ciclo completo de uma automa\xE7\xE3o confi\xE1vel. Os destaques:"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Integra\xE7\xE3o com a ", /*#__PURE__*/React.createElement("strong", null, "API da Hotmart"), " para detalhes de produto e campos de cancelamento."), /*#__PURE__*/React.createElement("li", null, "Fluxos de marketing com a IA ", /*#__PURE__*/React.createElement("em", null, "propondo"), " textos e o operador aprovando."), /*#__PURE__*/React.createElement("li", null, "Atualiza\xE7\xE3o autom\xE1tica de chamados a partir do estado do funil.")), /*#__PURE__*/React.createElement("blockquote", null, /*#__PURE__*/React.createElement("p", null, "A IA prop\xF5e. O humano aprova. ", /*#__PURE__*/React.createElement("em", null, "Esse bot\xE3o de aprova\xE7\xE3o n\xE3o \xE9 decora\xE7\xE3o.")), /*#__PURE__*/React.createElement("cite", null, "Sidney Fernandes \xB7 Gestor de Automa\xE7\xE3o")), /*#__PURE__*/React.createElement("h3", null, "Ferramentas conectadas"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Ferramenta"), /*#__PURE__*/React.createElement("th", null, "Papel na opera\xE7\xE3o"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Hotmart API"), /*#__PURE__*/React.createElement("td", null, "Produtos, assinaturas e cancelamento"), /*#__PURE__*/React.createElement("td", null, "Conectado")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "ClickUp"), /*#__PURE__*/React.createElement("td", null, "C\xE9rebro operacional \u2014 tarefas e squads"), /*#__PURE__*/React.createElement("td", null, "Conectado")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "OpenAI"), /*#__PURE__*/React.createElement("td", null, "Gera\xE7\xE3o e revis\xE3o de textos"), /*#__PURE__*/React.createElement("td", null, "Conectado")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Webhooks"), /*#__PURE__*/React.createElement("td", null, "Gatilhos de eventos do funil"), /*#__PURE__*/React.createElement("td", null, "Em teste")))), /*#__PURE__*/React.createElement("h3", null, "Prompt usado na demonstra\xE7\xE3o"), /*#__PURE__*/React.createElement("p", null, "O prompt-base que aprova um texto de marketing antes de publicar:"), /*#__PURE__*/React.createElement("pre", null, /*#__PURE__*/React.createElement("code", null, `Você é o revisor de marketing da Academia.
Avalie o texto abaixo segundo:
  1. Clareza da promessa (0–10)
  2. Aderência à voz da marca (0–10)
  3. Risco de promessa exagerada (baixo/médio/alto)

Responda em JSON:
{ "aprovado": bool, "notas": {...}, "ajustes": ["..."] }

Texto: """{{conteudo}}"""`)), /*#__PURE__*/React.createElement("figure", null, /*#__PURE__*/React.createElement("image-slot", {
    id: "aiox-overview-shot",
    style: {
      width: '100%',
      height: 300,
      display: 'block'
    },
    shape: "rounded",
    radius: "3",
    placeholder: "Arraste um print da demonstra\xE7\xE3o"
  }), /*#__PURE__*/React.createElement("figcaption", null, "Painel do agente aprovando um texto antes da publica\xE7\xE3o")), /*#__PURE__*/React.createElement("h3", null, "Pr\xF3ximos passos"), /*#__PURE__*/React.createElement("ol", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Prepare suas contas"), /*#__PURE__*/React.createElement("br", null), "Tenha acesso de admin \xE0 Hotmart e ao ClickUp antes da aula 05."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Liste 3 processos repetitivos"), /*#__PURE__*/React.createElement("br", null), "Escolha tarefas que voc\xEA faz toda semana \u2014 ser\xE3o seus primeiros candidatos a automa\xE7\xE3o."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Defina o ponto de aprova\xE7\xE3o"), /*#__PURE__*/React.createElement("br", null), "Em cada processo, marque onde o humano precisa dizer \u201Cpode publicar\u201D.")));
}

// ---------- Comentários ----------
function CommentBox() {
  const [val, setVal] = React.useState('');
  const [pub, setPub] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement(LtAvatar, {
    name: "Aluno Lend\xE1rio",
    size: "default"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(LtTextarea, {
    rows: 3,
    placeholder: "Adicione um coment\xE1rio ou d\xFAvida sobre a aula\u2026",
    value: val,
    onChange: e => setVal(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(LtSwitch, {
    checked: pub,
    onCheckedChange: setPub
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Coment\xE1rio p\xFAblico")), /*#__PURE__*/React.createElement(LtButton, {
    variant: val.trim() ? 'cta' : 'outline',
    size: "sm",
    disabled: !val.trim()
  }, "Comentar"))));
}
function CommentItem({
  c
}) {
  const [liked, setLiked] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      padding: '20px 0',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(LtAvatar, {
    src: c.avatar,
    name: c.name,
    size: "default"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap'
    }
  }, c.name), c.instructor && /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--primary)',
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--radius-full)',
      padding: '1px 8px'
    }
  }, "Instrutor")), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      display: 'block',
      marginTop: 4,
      color: 'var(--muted-foreground)'
    }
  }, c.role, " \xB7 ", c.time), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, c.text), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLiked(!liked),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: liked ? 'var(--primary)' : 'var(--muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: "heart",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data"
  }, c.likes + (liked ? 1 : 0))), /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: 'var(--muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: "reply",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "al-data"
  }, "Responder")))));
}
function LessonComments() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '72ch'
    }
  }, /*#__PURE__*/React.createElement(CommentBox, null), /*#__PURE__*/React.createElement("div", null, LT_COMMENTS.map((c, i) => /*#__PURE__*/React.createElement(CommentItem, {
    key: i,
    c: c
  }))));
}

// ---------- Transcrição ----------
function LessonTranscript() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '74ch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Transcri\xE7\xE3o autom\xE1tica \xB7 PT-BR"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: 240,
      height: 36,
      padding: '0 12px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-base)'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: "search",
    size: 14,
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Buscar na transcri\xE7\xE3o\u2026"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, LT_TRANSCRIPT.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 20,
      padding: '14px 0',
      borderTop: i === 0 ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      flexShrink: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-foreground)',
      alignSelf: 'flex-start',
      marginTop: 3
    }
  }, r.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.65,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, r.s)))));
}

// ---------- Materiais ----------
const LT_MATERIALS = [{
  icon: 'presentation',
  title: 'Slides — AIOX Fundamentals',
  meta: 'PDF · 4,2 MB',
  action: 'download'
}, {
  icon: 'code',
  title: 'Prompt-base de revisão de marketing',
  meta: 'TXT · usado na demonstração',
  action: 'copy'
}, {
  icon: 'check-circle',
  title: 'Checklist — Preparar contas (Hotmart + ClickUp)',
  meta: 'PDF · 1 página',
  action: 'download'
}, {
  icon: 'table-2-columns',
  title: 'Mapa de 3 processos repetitivos',
  meta: 'Planilha · modelo editável',
  action: 'download'
}];
const LT_LINKS = [{
  title: 'Documentação da API Hotmart',
  meta: 'developers.hotmart.com'
}, {
  title: 'ClickUp — Guia de automações',
  meta: 'help.clickup.com'
}];
function MaterialRow({
  m,
  i
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      width: '100%',
      textAlign: 'left',
      padding: '16px 4px',
      background: 'none',
      cursor: 'pointer',
      border: 'none',
      borderTop: i === 0 ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 42,
      height: 42,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-base)',
      border: '1px solid var(--border)',
      background: hover ? 'hsl(var(--primary-hsl) / 0.06)' : 'transparent',
      transition: 'background 160ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: m.icon,
    size: 18,
    color: hover ? 'var(--primary)' : 'var(--muted-foreground)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 15,
      fontWeight: 600,
      color: hover ? 'var(--primary)' : 'var(--foreground)',
      transition: 'color 160ms',
      textWrap: 'pretty'
    }
  }, m.title), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      display: 'block',
      marginTop: 3,
      color: 'var(--muted-foreground)'
    }
  }, m.meta)), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'color 160ms'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: m.action === 'copy' ? 'copy' : 'download',
    size: 14
  }), m.action === 'copy' ? 'Copiar' : 'Baixar'));
}
function LessonMaterials() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '72ch'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-data",
    style: {
      margin: '0 0 8px',
      color: 'var(--muted-foreground)'
    }
  }, "Para baixar"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, LT_MATERIALS.map((m, i) => /*#__PURE__*/React.createElement(MaterialRow, {
    key: i,
    m: m,
    i: i
  }))), /*#__PURE__*/React.createElement("p", {
    className: "al-data",
    style: {
      margin: '36px 0 8px',
      color: 'var(--muted-foreground)'
    }
  }, "Links de refer\xEAncia"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, LT_LINKS.map((l, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    target: "_blank",
    rel: "noopener",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 4px',
      textDecoration: 'none',
      borderTop: i === 0 ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 42,
      height: 42,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-base)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(LtIcon, {
    name: "link",
    size: 18,
    color: "var(--muted-foreground)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, l.title), /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      display: 'block',
      marginTop: 3,
      color: 'var(--muted-foreground)'
    }
  }, l.meta)), /*#__PURE__*/React.createElement(LtIcon, {
    name: "arrow-up-right",
    size: 16,
    color: "var(--muted-foreground)"
  })))));
}
function LessonTabsContent({
  tab
}) {
  if (tab === 'comments') return /*#__PURE__*/React.createElement(LessonComments, null);
  if (tab === 'transcript') return /*#__PURE__*/React.createElement(LessonTranscript, null);
  if (tab === 'materials') return /*#__PURE__*/React.createElement(LessonMaterials, null);
  return /*#__PURE__*/React.createElement(LessonOverview, null);
}
window.LessonTabsContent = LessonTabsContent;
window.LT_COMMENT_COUNT = LT_COMMENTS.length;
window.LT_MATERIAL_COUNT = LT_MATERIALS.length + LT_LINKS.length;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/LessonTabs.jsx", error: String((e && e.message) || e) }); }

// cursos/OnboardingFlow.jsx
try { (() => {
/* OnboardingFlow — shell do onboarding inteligente (porta de entrada obrigatória).
 * Tela cheia imersiva, sem topbar. Passos:
 *   0 Acolher · 1–4 Diagnóstico · 5 Perfil · 6 Comunidade · 7 Trilha
 * Híbrido: passos guiados + TutorPanel ao lado.
 * Persistência: al-onboarding-v1 (posição + respostas) · al-onboarding-perfil (resultado).
 */
const ObFlowData = window.OnboardingData;
const OB_STORE_KEY = 'al-onboarding-v1';
const OB_TOTAL_STEPS = 8;
const OB_STAGES = [{
  n: '01',
  label: 'Acolher'
}, {
  n: '02',
  label: 'Diagnóstico'
}, {
  n: '03',
  label: 'Perfil'
}, {
  n: '04',
  label: 'Comunidade'
}, {
  n: '05',
  label: 'Trilha'
}];
function obStageOf(step) {
  if (step === 0) return 0;
  if (step <= 4) return 1;
  return step - 3; // 5→2, 6→3, 7→4
}

/* tom fixo: acolhedor · XP discreto sempre visível · diagnóstico avança ao tocar */

const OB_TUTOR_SUGGESTIONS = [{
  q: 'Não sei qual é o meu nível',
  a: 'Sem estresse — escolhe o que parece mais perto. Se você usa o ChatGPT mas nunca conectou uma ferramenta nele, é Intermediário. Se já montou alguma automação, Avançado. E dá para ajustar depois, no Perfil.'
}, {
  q: 'Posso mudar as respostas depois?',
  a: 'Pode. O diagnóstico fica salvo no seu Perfil e é editável a qualquer momento — o match dos Projetos e o ponto de partida das Trilhas se reorganizam sozinhos.'
}, {
  q: 'O que é uma trilha?',
  a: 'Uma jornada guiada com começo, meio e certificação — mistura aulas, cursos e projetos reais na ordem certa para o seu objetivo. Você sempre sabe qual é o próximo passo.'
}, {
  q: 'Para que serve esse diagnóstico?',
  a: 'Quatro sinais — nicho, objetivo, nível e tempo — viram o match dos Projetos, o ponto de partida da sua trilha e o contexto que eu uso para te ajudar em todas as telas.'
}, {
  q: 'Quero criar uma trilha personalizada do zero',
  a: 'Perfeito. Me descreve o problema ou o resultado que você quer — eu monto uma trilha com marcos, entregáveis, rubrica e cursos de apoio, como a Central de Operações no Notion. Você revisa antes de começar.'
}];
function obLoad() {
  try {
    const raw = localStorage.getItem(OB_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function OnboardingFlow() {
  const saved = React.useMemo(obLoad, []);
  const [step, setStep] = React.useState(saved && saved.step || 0);
  const [answers, setAnswers] = React.useState(saved && saved.answers || {});
  const [name, setName] = React.useState(saved && saved.name || ObFlowData.USER.name);
  const [posted, setPosted] = React.useState(saved && saved.posted || false);
  const [draft, setDraft] = React.useState(saved && saved.draft || null);
  const advancing = React.useRef(false);

  // persistir posição + respostas — refresh não perde o lugar
  React.useEffect(() => {
    try {
      localStorage.setItem(OB_STORE_KEY, JSON.stringify({
        step,
        answers,
        name,
        posted,
        draft
      }));
    } catch (e) {}
  }, [step, answers, name, posted, draft]);
  const go = s => {
    advancing.current = false;
    setStep(Math.max(0, Math.min(OB_TOTAL_STEPS - 1, s)));
  };
  const pick = (key, v) => {
    setAnswers(a => Object.assign({}, a, {
      [key]: v
    }));
    if (!advancing.current) {
      advancing.current = true;
      window.setTimeout(() => go(step + 1), 380);
    }
  };
  const publish = () => {
    setPosted(true);
    window.setTimeout(() => go(7), 900);
  };

  // saída: grava o perfil que alimenta Trilhas, Projetos e Tutor — e entra na trilha
  window.OnboardingFinish = href => {
    try {
      localStorage.setItem('al-onboarding-perfil', JSON.stringify(Object.assign({
        name,
        posted
      }, answers)));
      localStorage.setItem('al-onboarding-done', '1');
    } catch (e) {}
    window.location.href = href;
  };
  const stage = obStageOf(step);
  const qIdx = step >= 1 && step <= 4 ? step : null;
  const reco = step === 7 ? ObFlowData.recommend(answers) : null;
  const draftValue = draft !== null ? draft : step === 6 ? ObFlowData.draftPost(answers, name) : '';
  const progress = step / (OB_TOTAL_STEPS - 1) * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--border)',
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: progress + '%',
      background: 'var(--primary)',
      transition: 'width 420ms var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("header", {
    className: "ob-header",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      height: 72,
      padding: '0 44px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 24,
      height: 24
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.02em',
      color: 'var(--foreground)'
    }
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary)'
    }
  }, "[IA]"))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, OB_STAGES[stage].n, " / 05 \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--foreground)'
    }
  }, OB_STAGES[stage].label), qIdx ? ' — ' + qIdx + ' de 4' : '')), /*#__PURE__*/React.createElement("main", {
    className: "ob-main",
    style: {
      flex: 1,
      display: 'grid',
      alignItems: 'center',
      justifyItems: 'center',
      padding: '24px 32px 88px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: step,
    className: "ob-enter",
    style: {
      width: 'min(680px, 100%)'
    }
  }, step === 0 && /*#__PURE__*/React.createElement(window.ObAcolher, {
    name: name,
    onStart: () => go(1)
  }), qIdx && /*#__PURE__*/React.createElement(window.ObPergunta, {
    q: ObFlowData.QUESTIONS[qIdx - 1],
    idx: qIdx,
    total: 4,
    value: answers[ObFlowData.QUESTIONS[qIdx - 1].key],
    answers: answers,
    autoAvancar: true,
    onPick: v => pick(ObFlowData.QUESTIONS[qIdx - 1].key, v),
    onNext: () => go(step + 1),
    onBack: () => go(step - 1)
  }), step === 5 && /*#__PURE__*/React.createElement(window.ObPerfil, {
    answers: answers,
    name: name,
    onName: setName,
    xpOn: true,
    onEdit: key => go(1 + ObFlowData.QUESTIONS.findIndex(q => q.key === key)),
    onSave: () => go(6)
  }), step === 6 && /*#__PURE__*/React.createElement(window.ObComunidade, {
    name: name,
    draft: draftValue,
    onDraft: setDraft,
    posted: posted,
    onPublish: publish,
    onLater: () => go(7),
    xpOn: true
  }), step === 7 && reco && /*#__PURE__*/React.createElement(window.ObTrilha, {
    name: name,
    answers: answers,
    reco: reco,
    posted: posted,
    xpOn: true,
    onCreateOwn: () => window.dispatchEvent(new CustomEvent('tutor:open', {
      detail: {
        ask: 'Quero criar uma trilha personalizada do zero'
      }
    }))
  }))), /*#__PURE__*/React.createElement(window.TutorPanel, {
    context: 'Onboarding · ' + OB_STAGES[stage].label,
    intro: "Estou aqui do lado durante o onboarding inteiro. Se travar em alguma pergunta, me chama \u2014 o que voc\xEA responder vira o contexto que eu uso para te ajudar depois.",
    suggestions: OB_TUTOR_SUGGESTIONS,
    fallback: "Boa pergunta \u2014 durante o onboarding eu foco em te ajudar com o diagn\xF3stico, mas l\xE1 dentro converso com voc\xEA sobre qualquer tela."
  }));
}
window.OnboardingFlow = OnboardingFlow;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/OnboardingFlow.jsx", error: String((e && e.message) || e) }); }

// cursos/OnboardingScreens.jsx
try { (() => {
/* OnboardingScreens — as 5 telas do onboarding (EAD do Futuro).
 * Acolher → Diagnosticar (4 micro-passos) → Perfil (refletir) → Comunidade → Trilha.
 * Shell, progresso e máquina de passos vivem em OnboardingFlow.jsx.
 */
const {
  Icon: ObIcon,
  Button: ObButton,
  Avatar: ObAvatar
} = window.LendRIADesignSystem_096da5;
const ObData = window.OnboardingData;

/* ---------- átomos ---------- */
function ObCap({
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: color || 'var(--primary)'
    }
  }, children);
}
function ObXpLine({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--primary)',
      flexShrink: 0
    }
  }), children);
}
function ObQuiet({
  label,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      borderBottom: '1px solid var(--hairline)',
      transition: 'color 160ms var(--ease-out)'
    }
  }, label);
}

/* ---------- 01 · Acolher ---------- */
function ObAcolher({
  name,
  onStart
}) {
  const first = name.trim().split(' ')[0];
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Onboarding \u2014 Acolher",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement(ObCap, {
    color: "var(--muted-foreground)"
  }, "Academia Lend\xE1r[IA] \xB7 Primeiro acesso"), /*#__PURE__*/React.createElement("h1", {
    className: "ob-h1",
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 58,
      lineHeight: 1.04,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)',
      margin: '22px 0 0'
    }
  }, "Bem-vinda, ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "Lend\xE1ria"), ".", /*#__PURE__*/React.createElement("br", null), "Vamos come\xE7ar pelo seu neg\xF3cio."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 19,
      lineHeight: 1.55,
      color: 'var(--muted-foreground)',
      maxWidth: '44ch',
      margin: '24px 0 0',
      textWrap: 'pretty'
    }
  }, first, ", vou te fazer 4 perguntas r\xE1pidas e j\xE1 te coloco para construir algo seu \u2014 a trilha, os projetos e o Tutor se ajustam ao que voc\xEA responder."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(ObButton, {
    variant: "cta",
    onClick: onStart
  }, "Come\xE7ar")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '20px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "4 perguntas \xB7 menos de 5 minutos \xB7 voc\xEA s\xF3 faz isso uma vez"));
}

/* ---------- 02 · Diagnosticar — opção tocável ---------- */
function ObOption({
  opt,
  selected,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 5,
      textAlign: 'left',
      padding: '17px 20px',
      cursor: 'pointer',
      minHeight: 44,
      background: selected ? 'hsl(var(--primary-hsl) / 0.06)' : hover ? 'hsl(var(--foreground-hsl) / 0.03)' : 'var(--card)',
      border: '1px solid',
      borderColor: selected ? 'hsl(var(--primary-hsl) / 0.55)' : hover ? 'var(--hairline-strong)' : 'var(--hairline)',
      borderRadius: 'var(--radius-md)',
      transition: 'background 160ms var(--ease-out), border-color 160ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      flexShrink: 0,
      borderRadius: '50%',
      boxSizing: 'border-box',
      background: selected ? 'var(--primary)' : 'transparent',
      border: selected ? 'none' : '1px solid var(--hairline-strong)',
      transition: 'background 160ms var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, opt.label)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      color: 'var(--muted-foreground)',
      paddingLeft: 18
    }
  }, opt.desc));
}
function ObPergunta({
  q,
  idx,
  total,
  value,
  answers,
  autoAvancar,
  onPick,
  onNext,
  onBack
}) {
  const learned = ObData.QUESTIONS.filter(x => x.key !== q.key && answers[x.key]).map(x => ObData.labelOf(x.key, answers[x.key]));
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": 'Onboarding — Diagnóstico ' + q.key,
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(ObCap, null, "Diagn\xF3stico \xB7 ", idx, " de ", total), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "\u2190 Voltar")), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 33,
      letterSpacing: '-0.01em',
      lineHeight: 1.15,
      color: 'var(--foreground)',
      margin: '16px 0 0',
      textWrap: 'pretty'
    }
  }, q.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--muted-foreground)',
      margin: '10px 0 0'
    }
  }, q.sub), /*#__PURE__*/React.createElement("div", {
    className: "ob-grid",
    style: {
      marginTop: 28
    }
  }, q.options.map(opt => /*#__PURE__*/React.createElement(ObOption, {
    key: opt.v,
    opt: opt,
    selected: value === opt.v,
    onClick: () => onPick(opt.v)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 26,
      minHeight: 38
    }
  }, !autoAvancar && value ? /*#__PURE__*/React.createElement(ObButton, {
    variant: "cta",
    size: "sm",
    onClick: onNext
  }, "Continuar") : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), learned.length > 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "Entendi at\xE9 agora \u2014 ", learned.join(' · '))));
}

/* ---------- 03 · Refletir + personalizar o perfil ---------- */
function ObPerfil({
  answers,
  name,
  onName,
  onEdit,
  onSave,
  xpOn
}) {
  const parts = ObData.sentence(answers);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Onboarding \u2014 Perfil",
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(ObCap, null, "Quick win 1 de 3 \xB7 Seu perfil"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 33,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)',
      margin: '16px 0 0'
    }
  }, "Foi isso que eu entendi de voc\xEA."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 22,
      lineHeight: 1.6,
      color: 'var(--foreground)',
      margin: '24px 0 0',
      textWrap: 'pretty'
    }
  }, parts.map((p, i) => p.k ? /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    onClick: () => onEdit(p.k),
    title: "Ajustar esta resposta",
    style: {
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      display: 'inline',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 22,
      lineHeight: 1.6,
      color: 'var(--primary)',
      borderBottom: '1px dotted hsl(var(--primary-hsl) / 0.5)'
    }
  }, p.t) : /*#__PURE__*/React.createElement("span", {
    key: i
  }, p.t))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)',
      margin: '12px 0 0'
    }
  }, "Toque em qualquer parte destacada para ajustar"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      marginTop: 34,
      padding: '22px 24px',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement(ObAvatar, {
    src: ObData.USER.avatar,
    name: name,
    size: 54
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "ob-nome",
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "Como te chamamos"), /*#__PURE__*/React.createElement("input", {
    id: "ob-nome",
    className: "ob-input",
    value: name,
    onChange: e => onName(e.target.value),
    style: {
      background: 'none',
      border: 'none',
      borderBottom: '1px solid var(--hairline)',
      outline: 'none',
      padding: '2px 0 7px',
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--foreground)',
      width: '100%'
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--muted-foreground)',
      margin: '18px 0 0',
      textWrap: 'pretty'
    }
  }, "Esse diagn\xF3stico vira o seu perfil \u2014 edit\xE1vel quando quiser. \xC9 ele que calcula o match dos Projetos e o ponto de partida das Trilhas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(ObButton, {
    variant: "cta",
    onClick: onSave
  }, "Salvar meu perfil"), xpOn && /*#__PURE__*/React.createElement(ObXpLine, null, "+", ObData.XP.perfil, " XP ao salvar")));
}

/* ---------- 04 · Comunidade — a apresentação ---------- */
function ObComunidade({
  name,
  draft,
  onDraft,
  posted,
  onPublish,
  onLater,
  xpOn
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Onboarding \u2014 Comunidade",
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, xpOn && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(ObXpLine, null, "Perfil salvo \xB7 +", ObData.XP.perfil, " XP")), /*#__PURE__*/React.createElement(ObCap, null, "Quick win 2 de 3 \xB7 Comunidade"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 33,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)',
      margin: '16px 0 0'
    }
  }, "Agora, diga um oi aos Lend\xE1rios."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--muted-foreground)',
      margin: '10px 0 0',
      maxWidth: '52ch',
      textWrap: 'pretty'
    }
  }, "Quem se apresenta no primeiro dia volta no segundo. Eu deixei um rascunho pronto a partir do seu diagn\xF3stico \u2014 edite do seu jeito."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(ObAvatar, {
    src: ObData.USER.avatar,
    name: name,
    size: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "Agora \xB7 #apresenta\xE7\xF5es")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--primary)'
    }
  }, "Rascunho do Tutor")), /*#__PURE__*/React.createElement("textarea", {
    className: "ob-input",
    value: draft,
    onChange: e => onDraft(e.target.value),
    rows: 4,
    "aria-label": "Texto da sua apresenta\xE7\xE3o",
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      resize: 'vertical',
      background: 'none',
      border: 'none',
      outline: 'none',
      padding: '18px 20px',
      fontFamily: 'var(--font-serif)',
      fontSize: 16.5,
      lineHeight: 1.6,
      color: 'var(--foreground)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      marginTop: 26,
      minHeight: 40
    }
  }, posted ? /*#__PURE__*/React.createElement(ObXpLine, null, "Publicado no feed da comunidade", xpOn ? ' · +' + ObData.XP.post + ' XP' : '') : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ObButton, {
    variant: "cta",
    onClick: onPublish
  }, "Publicar no feed"), xpOn && /*#__PURE__*/React.createElement(ObXpLine, null, "+", ObData.XP.post, " XP"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(ObQuiet, {
    label: "deixar para depois",
    onClick: onLater
  }))));
}

/* ---------- 05 · Trilha — recomendar + escolher ou criar ---------- */
function ObAccentTitle({
  title,
  accent,
  size
}) {
  const i = accent ? title.lastIndexOf(accent) : -1;
  return /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: size || 28,
      letterSpacing: '-0.01em',
      lineHeight: 1.15,
      color: 'var(--foreground)'
    }
  }, i >= 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, title.slice(0, i), /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, title.slice(i))) : title);
}
function ObTrilha({
  name,
  answers,
  reco,
  posted,
  xpOn,
  onCreateOwn
}) {
  const first = name.trim().split(' ')[0];
  const t = reco.trilha;
  const p = reco.projeto;
  const totalXp = ObData.XP.perfil + (posted ? ObData.XP.post : 0) + ObData.XP.trilha;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "Onboarding \u2014 Trilha",
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(ObCap, null, "Quick win 3 de 3 \xB7 Sua trilha"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 33,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)',
      margin: '16px 0 0'
    }
  }, "Pronto, ", first, ". Este \xE9 o seu caminho de ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "Lend\xE1ria"), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      padding: '26px 28px',
      border: '1px solid hsl(var(--primary-hsl) / 0.4)',
      borderRadius: 'var(--radius-md)',
      background: 'hsl(var(--primary-hsl) / 0.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: 'var(--primary)'
    }
  }, "Trilha ", t.n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9.5,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, t.itens, " itens \xB7 ", t.duration)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(ObAccentTitle, {
    title: t.title,
    accent: t.accent,
    size: 30
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 15.5,
      lineHeight: 1.55,
      color: 'var(--muted-foreground)',
      margin: '8px 0 0'
    }
  }, t.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: '2px solid var(--primary)',
      padding: '2px 0 2px 16px',
      margin: '18px 0 0'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, reco.why)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(ObXpLine, null, reco.startNote), /*#__PURE__*/React.createElement(ObXpLine, null, reco.ritmo, " \xB7 ", t.compose))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: '20px 24px',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--card)',
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 6px',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "Seu primeiro projeto \xB7 match calculado de nicho + objetivo + tempo"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 15.5,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '5px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      color: 'var(--muted-foreground)'
    }
  }, p.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 32,
      lineHeight: 1,
      color: 'var(--primary)'
    }
  }, p.match, "%"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, "match \xB7 ", p.weeks))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 20,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(ObButton, {
    variant: "cta",
    onClick: () => window.OnboardingFinish(t.href || 'Trilhas.html')
  }, "Come\xE7ar agora"), /*#__PURE__*/React.createElement(ObQuiet, {
    label: "criar a minha pr\xF3pria trilha",
    onClick: onCreateOwn
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), xpOn && /*#__PURE__*/React.createElement(ObXpLine, null, "Onboarding completo \xB7 +", totalXp, " XP")));
}
Object.assign(window, {
  ObAcolher,
  ObPergunta,
  ObPerfil,
  ObComunidade,
  ObTrilha
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/OnboardingScreens.jsx", error: String((e && e.message) || e) }); }

// cursos/ProjetoDetalhe.jsx
try { (() => {
/* ProjetoDetalhe — detalhe de um projeto PBL em andamento.
 * EAD do Futuro §3: etapas claras com entregáveis, rubrica transparente,
 * prazo realista, reflexão obrigatória na entrega.
 * Data: projetos-data.js (window.ProjetosData.DETAIL).
 */
const {
  Icon: PdIcon,
  Button: PdButton,
  Avatar: PdAvatar
} = window.LendRIADesignSystem_096da5;
const {
  CATEGORIES: PD_CATS,
  LEVELS: PD_LEVELS
} = window.ExplorarData;
const PD = window.ProjetosData.DETAIL;
const PD_CAT = PD_CATS.find(c => c.key === PD.cat);
const PD_TUTOR = {
  context: 'Esteira de Onboarding · Etapa 2',
  intro: 'Notei que seu webhook ainda não recebeu nenhum evento de teste. A Hotmart tem um modo sandbox que simula vendas — quer o passo a passo?',
  suggestions: [{
    q: 'Meu webhook retorna 401',
    a: 'Clássico de escopo errado: confere no painel de credenciais da Hotmart se o token tem o escopo de leitura de vendas. Sem ele o token gera, mas não autoriza as chamadas.'
  }, {
    q: 'O que precisa ter no entregável?',
    a: 'Para a etapa 2: o webhook recebendo eventos de venda — um print do log com 3 eventos de teste basta. A rubrica só avalia robustez a partir da etapa 3.'
  }, {
    q: 'Estou sem tempo essa semana',
    a: 'Sem problema — sua entrega prevista é 21 jun e dá para mover 3 dias sem comprometer o prazo. Quer que eu reorganize as etapas 3 e 4?'
  }],
  fallback: 'Você está na etapa 2 — configurar o webhook. O material de apoio é a aula 07 do AIOX Fundamentals; posso resumir os passos aqui.'
};
function PdMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}
function PdSectionHead({
  n,
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: 'var(--primary)',
      flexShrink: 0
    }
  }, n), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 26,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }));
}

/* ---------- etapa com entregável ---------- */
function PdStepGlyph({
  s
}) {
  const done = s.state === 'done';
  const active = s.state === 'active';
  if (done) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        flexShrink: 0,
        paddingTop: 5
      }
    }, /*#__PURE__*/React.createElement(PdIcon, {
      name: "check",
      size: 14,
      color: "var(--primary)"
    }));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      flexShrink: 0,
      paddingTop: 5,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.08em',
      color: active ? 'var(--primary)' : 'var(--muted-foreground)'
    }
  }, "0", s.n);
}
function PdStep({
  s,
  last
}) {
  const done = s.state === 'done';
  const active = s.state === 'active';
  return /*#__PURE__*/React.createElement("div", {
    id: `etapa-${s.n}`,
    style: active ? {
      display: 'flex',
      gap: 20,
      padding: '24px 24px',
      margin: '0 -24px',
      background: 'var(--card)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)'
    } : {
      display: 'flex',
      gap: 20,
      padding: '24px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      opacity: done ? 0.92 : 1
    }
  }, /*#__PURE__*/React.createElement(PdStepGlyph, {
    s: s
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 19,
      letterSpacing: '-0.01em',
      color: done ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, s.title), s.required && /*#__PURE__*/React.createElement(PdMono, {
    size: 9,
    color: "var(--primary)"
  }, "OBRIGAT\xD3RIA"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PdMono, {
    size: 9
  }, s.est.toUpperCase())), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Entreg\xE1vel \u2014 "), /*#__PURE__*/React.createElement("span", {
    style: {
      color: done ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, s.deliv)), done && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0'
    }
  }, /*#__PURE__*/React.createElement(PdMono, {
    size: 9,
    color: "var(--primary)"
  }, "CONCLU\xCDDA \xB7 ", s.doneAt.toUpperCase())), active && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(PdButton, {
    variant: "cta",
    size: "sm"
  }, "Enviar entreg\xE1vel"), /*#__PURE__*/React.createElement(PdMono, {
    size: 9
  }, "ENTREGA PREVISTA \xB7 ", PD.due.toUpperCase()))));
}

/* ---------- rubrica transparente ---------- */
function PdRubric() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 8px',
      color: 'var(--muted-foreground)'
    }
  }, "Rubrica"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 21,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Como sua entrega \xE9 avaliada"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 14px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Vis\xEDvel desde o in\xEDcio \u2014 sem surpresas na nota."), PD.rubric.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      padding: '14px 0',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, r.name), /*#__PURE__*/React.createElement(PdMono, {
    size: 10,
    color: "var(--primary)"
  }, r.weight)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '5px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, r.desc))));
}

/* ---------- página ---------- */
function ProjetoDetalhe() {
  const activeStep = PD.steps.find(s => s.state === 'active');
  const goActive = () => {
    const el = document.getElementById(`etapa-${activeStep.n}`);
    if (el) window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 96,
      behavior: 'smooth'
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "projetos"
  }), /*#__PURE__*/React.createElement("main", {
    className: "pd-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '32px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "Projetos.html",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 28,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(PdIcon, {
    name: "arrow-left",
    size: 14
  }), "Projetos"), /*#__PURE__*/React.createElement("header", {
    className: "pd-head",
    "data-screen-label": "Projeto \u2014 header",
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 48,
      flexWrap: 'wrap',
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: PD_CAT.color
    }
  }), /*#__PURE__*/React.createElement(PdMono, null, PD_CAT.label)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      padding: '3px 9px',
      border: '1px solid hsl(var(--primary-hsl) / 0.4)',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--primary)',
      whiteSpace: 'nowrap'
    }
  }, PD.status)), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 38,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, PD.titleParts[0], /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, PD.titleParts[1])), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, PD.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 264,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 10px',
      color: 'var(--muted-foreground)'
    }
  }, "Seu match"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 38,
      lineHeight: 1,
      color: 'var(--foreground)'
    }
  }, PD.match, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.18)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: `${PD.match}%`,
      height: '100%',
      background: 'var(--primary)'
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 12.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, PD.why))), /*#__PURE__*/React.createElement("div", {
    className: "pd-meta",
    "data-screen-label": "Projeto \u2014 meta",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(PdMono, {
    size: 10
  }, PD.weeks.toUpperCase(), " \xB7 ENTREGA ", PD.due.toUpperCase(), " \xB7 ", PD_LEVELS[PD.level - 1].toUpperCase(), " \xB7 ", PD.xp, " AO CONCLUIR"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PdButton, {
    variant: "cta",
    onClick: goActive
  }, "Continuar etapa ", activeStep.n)), /*#__PURE__*/React.createElement("div", {
    className: "pd-layout",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px',
      gap: 64,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projeto \u2014 problema",
    style: {
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(PdSectionHead, {
    n: "01",
    title: "O problema real"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 16,
      lineHeight: 1.65,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, PD.problem)), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projeto \u2014 etapas"
  }, /*#__PURE__*/React.createElement(PdSectionHead, {
    n: "02",
    title: "Etapas & entreg\xE1veis"
  }), PD.steps.map((s, i) => /*#__PURE__*/React.createElement(PdStep, {
    key: s.n,
    s: s,
    last: i === PD.steps.length - 1
  })))), /*#__PURE__*/React.createElement("aside", {
    className: "pd-rail",
    "data-screen-label": "Projeto \u2014 rubrica",
    style: {
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement(PdRubric, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '18px 6px 0'
    }
  }, /*#__PURE__*/React.createElement(PdAvatar, {
    src: PD.evaluator.avatar,
    name: PD.evaluator.name,
    size: 30
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, PD.evaluator.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, PD.evaluator.note)))))), /*#__PURE__*/React.createElement(window.TutorPanel, {
    context: PD_TUTOR.context,
    intro: PD_TUTOR.intro,
    suggestions: PD_TUTOR.suggestions,
    fallback: PD_TUTOR.fallback
  }));
}
window.ProjetoDetalhe = ProjetoDetalhe;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ProjetoDetalhe.jsx", error: String((e && e.message) || e) }); }

// cursos/ProjetoPersonalizado.jsx
try { (() => {
/* ProjetoPersonalizado — tela interna de um projeto personalizado.
 * A aluna descreveu o problema; o sistema gerou a trilha: marcos,
 * entregáveis, cursos de apoio e rubrica — tudo ajustável com o Tutor.
 * Data: projetos-data.js (window.ProjetosData.DETAIL_CUSTOM).
 */
const {
  Icon: PpIcon,
  Button: PpButton,
  Avatar: PpAvatar
} = window.LendRIADesignSystem_096da5;
const PP = window.ProjetosData.DETAIL_CUSTOM;
const PP_TUTOR = {
  context: 'Central de Operações · Trilha pronta',
  intro: 'Sua trilha está pronta. No seu ritmo de 4h por semana, o marco 1 fecha em uns 10 dias. Quer ajustar algo antes de começar?',
  suggestions: [{
    q: 'Quero ajustar a trilha',
    a: 'Claro — me diz o que muda: o prazo, um marco, um entregável? Eu regenero só essa parte e o resto da trilha se reajusta.'
  }, {
    q: 'Por que esses cursos de apoio?',
    a: 'Cada marco puxa só as aulas que destravam aquela entrega: bases e relações para estruturar o Notion, webhooks para as automações. Nada de curso inteiro — só o pedaço que você precisa.'
  }, {
    q: 'A trilha cabe em 4 semanas?',
    a: 'Cabe, se você dedicar ~6h por semana em vez de 4. Outra opção: simplificar o marco 3 começando só com um formulário. Quer que eu aplique uma das duas?'
  }],
  fallback: 'Essa trilha foi gerada do problema que você descreveu — posso mudar marcos, prazos, entregáveis ou os cursos de apoio. É só me dizer o quê.'
};
function PpMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}
function PpSectionHead({
  n,
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.1em',
      color: 'var(--primary)',
      flexShrink: 0
    }
  }, n), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 26,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }));
}

/* ---------- marco da trilha ---------- */
function PpMarco({
  m,
  last
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    id: `marco-${m.n}`,
    style: {
      display: 'flex',
      gap: 20,
      padding: '24px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      flexShrink: 0,
      paddingTop: 5,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.08em',
      color: 'var(--muted-foreground)'
    }
  }, "0", m.n), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 19,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, m.title), m.required && /*#__PURE__*/React.createElement(PpMono, {
    size: 9,
    color: "var(--primary)"
  }, "REFLEX\xC3O OBRIGAT\xD3RIA"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PpMono, {
    size: 9
  }, m.est.toUpperCase())), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Entreg\xE1vel \u2014 "), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--foreground)'
    }
  }, m.deliv)), m.support && /*#__PURE__*/React.createElement("a", {
    href: "Curso - PS AIOX Fundamentals.html",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      marginTop: 12,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(PpIcon, {
    name: "play-circle",
    size: 15,
    color: hover ? 'var(--primary)' : 'var(--muted-foreground)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
      transition: 'color 160ms var(--ease-out)'
    }
  }, "Aula de apoio \u2014 ", m.support.label, " \xB7 ", m.support.course, " \xB7 ", m.support.time))));
}

/* ---------- rubrica gerada ---------- */
function PpRubric() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 8px',
      color: 'var(--muted-foreground)'
    }
  }, "Rubrica"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 21,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Como sua entrega \xE9 avaliada"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 14px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Gerada a partir do seu problema \u2014 ajuste com o tutor."), PP.rubric.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      padding: '14px 0',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, r.name), /*#__PURE__*/React.createElement(PpMono, {
    size: 10,
    color: "var(--primary)"
  }, r.weight)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '5px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, r.desc))));
}

/* ---------- página ---------- */
function ProjetoPersonalizado() {
  const adjust = () => {
    window.dispatchEvent(new CustomEvent('tutor:open', {
      detail: {
        ask: 'Quero ajustar a trilha'
      }
    }));
  };
  const goFirst = () => {
    const el = document.getElementById('marco-1');
    if (el) window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 96,
      behavior: 'smooth'
    });
  };
  const deliverables = PP.marcos.length + 1; // marco 4 tem demo + reflexão

  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "projetos"
  }), /*#__PURE__*/React.createElement("main", {
    className: "pd-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '32px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "Projetos.html",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 28,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(PpIcon, {
    name: "arrow-left",
    size: 14
  }), "Projetos"), /*#__PURE__*/React.createElement("header", {
    className: "pd-head",
    "data-screen-label": "Projeto personalizado \u2014 header",
    style: {
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(PpMono, null, "Personalizado"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      padding: '3px 9px',
      border: '1px solid hsl(var(--primary-hsl) / 0.4)',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--primary)',
      whiteSpace: 'nowrap'
    }
  }, PP.status)), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 38,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, PP.titleParts[0], /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, PP.titleParts[1])), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, PP.desc), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      color: 'var(--muted-foreground)'
    }
  }, "Trilha gerada pela IA a partir do seu problema, em ", PP.created, " \xB7", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      adjust();
    },
    style: {
      color: 'var(--primary)',
      textDecoration: 'none'
    }
  }, "ajustar com o tutor \u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "pd-meta",
    "data-screen-label": "Projeto personalizado \u2014 meta",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(PpMono, {
    size: 10
  }, PP.weeks.toUpperCase(), " \xB7 ", PP.marcos.length, " MARCOS \xB7 ", deliverables, " ENTREG\xC1VEIS \xB7 ", PP.xp, " AO CONCLUIR"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PpButton, {
    variant: "cta",
    onClick: goFirst
  }, "Come\xE7ar projeto")), /*#__PURE__*/React.createElement("div", {
    className: "pd-layout",
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px',
      gap: 64,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projeto personalizado \u2014 problema",
    style: {
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(PpSectionHead, {
    n: "01",
    title: "O problema, nas suas palavras"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 17,
      lineHeight: 1.65,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, PP.problem), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, PP.problemNote)), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projeto personalizado \u2014 trilha"
  }, /*#__PURE__*/React.createElement(PpSectionHead, {
    n: "02",
    title: "Trilha de aprendizado"
  }), PP.marcos.map((m, i) => /*#__PURE__*/React.createElement(PpMarco, {
    key: m.n,
    m: m,
    last: i === PP.marcos.length - 1
  })))), /*#__PURE__*/React.createElement("aside", {
    className: "pd-rail",
    "data-screen-label": "Projeto personalizado \u2014 rubrica",
    style: {
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement(PpRubric, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '18px 6px 0'
    }
  }, /*#__PURE__*/React.createElement(PpAvatar, {
    src: PP.evaluator.avatar,
    name: PP.evaluator.name,
    size: 30
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, PP.evaluator.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)'
    }
  }, PP.evaluator.note)))))), /*#__PURE__*/React.createElement(window.TutorPanel, {
    context: PP_TUTOR.context,
    intro: PP_TUTOR.intro,
    suggestions: PP_TUTOR.suggestions,
    fallback: PP_TUTOR.fallback
  }));
}
window.ProjetoPersonalizado = ProjetoPersonalizado;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ProjetoPersonalizado.jsx", error: String((e && e.message) || e) }); }

// cursos/ProjetosCatalogo.jsx
try { (() => {
/* ProjetosCatalogo — catálogo de Projetos PBL com match do diagnóstico.
 * EAD do Futuro §3: match %, etapas/entregáveis, prazo realista, propor projeto (SDL).
 * Data: projetos-data.js (window.ProjetosData) + explorar-data.js (categorias/níveis).
 */
const {
  Icon: PjIcon,
  Button: PjButton
} = window.LendRIADesignSystem_096da5;
const {
  CATEGORIES,
  LEVELS
} = window.ExplorarData;
const {
  PROFILE,
  PROJECTS,
  ONGOING,
  MY_CUSTOM
} = window.ProjetosData;
const PJ_CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const PJ_TWEAKS = /*EDITMODE-BEGIN*/{
  "matchDisplay": "número",
  "tutorProativo": true
} /*EDITMODE-END*/;
const PJ_TUTOR = {
  context: 'Catálogo de projetos',
  intro: 'Pelo seu diagnóstico, a Esteira de Onboarding é o melhor próximo passo — ela usa o webhook que você está estudando no AIOX Fundamentals. Quer que eu monte um plano de 2 semanas?',
  suggestions: [{
    q: 'Por que 92% de match?',
    a: 'Três fatores do seu perfil: seu nicho (infoprodutos) usa a Hotmart, seu objetivo é automatizar a operação, e a etapa de webhooks retoma exatamente onde você parou no AIOX Fundamentals.'
  }, {
    q: 'Tenho 4h por semana. Dá tempo?',
    a: 'Dá — o prazo de 2–3 semanas já foi calculado com as suas 4h semanais. Se uma semana apertar, a etapa 3 pode ser dividida em duas entregas menores.'
  }, {
    q: 'Quero criar um projeto personalizado',
    a: 'Ótimo. Me conta qual problema do seu negócio você quer resolver — com isso eu monto sua trilha de aprendizado: marcos, entregáveis, rubrica e os cursos de apoio. Você revisa tudo antes de começar.'
  }],
  fallback: 'Pelo seu perfil, eu começaria pela Esteira de Onboarding — é o maior match e você já tem metade do caminho feito no AIOX Fundamentals.'
};
function PjMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}
function PjLevelSquares({
  level
}) {
  return /*#__PURE__*/React.createElement("span", {
    title: LEVELS[level - 1],
    style: {
      display: 'inline-flex',
      gap: 3,
      flexShrink: 0
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 5,
      height: 5,
      background: i < level ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.16)'
    }
  })));
}

/* match — número (% + barra fina) ou rótulo qualitativo */
function PjMatch({
  match,
  mode
}) {
  if (mode === 'rótulo') {
    const [label, color] = match >= 85 ? ['Match alto', 'var(--primary)'] : match >= 65 ? ['Match médio', 'var(--muted-foreground)'] : ['Match baixo', 'var(--muted-foreground)'];
    return /*#__PURE__*/React.createElement(PjMono, {
      size: 9,
      color: color
    }, label.toUpperCase());
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.18)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: `${match}%`,
      height: '100%',
      background: 'var(--primary)'
    }
  })), /*#__PURE__*/React.createElement(PjMono, {
    size: 10,
    color: "var(--primary)"
  }, match, "%"));
}

/* ---------- meus projetos: cards na mesma anatomia dos recomendados ---------- */
const MP_CARD = (hover, dashed) => ({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  textDecoration: 'none',
  padding: '22px 24px 20px',
  background: dashed ? 'transparent' : 'var(--card)',
  border: dashed ? '1px dashed var(--hairline-strong)' : `1px solid ${hover ? 'var(--hairline-strong)' : 'var(--border)'}`,
  borderRadius: 'var(--radius-md)',
  transition: 'border-color 180ms var(--ease-out)',
  cursor: 'pointer'
});
function MpFootLink({
  hover,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      whiteSpace: 'nowrap',
      color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
      transition: 'color 180ms var(--ease-out)'
    }
  }, children);
}
function MpTitle({
  children
}) {
  return /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '16px 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 19,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      textWrap: 'pretty',
      color: 'var(--foreground)'
    }
  }, children);
}
function MpDesc({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 20px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, children);
}
function OngoingCard() {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: ONGOING.href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: MP_CARD(hover)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--primary)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement(PjMono, {
    color: "var(--primary)"
  }, "Em andamento"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PjMono, {
    size: 9
  }, ONGOING.stepLabel.toUpperCase())), /*#__PURE__*/React.createElement(MpTitle, null, ONGOING.title), /*#__PURE__*/React.createElement(MpDesc, null, "Pr\xF3xima etapa \u2014 ", ONGOING.next.charAt(0).toLowerCase() + ONGOING.next.slice(1), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.18)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${ONGOING.progress * 100}%`,
      height: '100%',
      background: 'var(--primary)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 12,
      display: 'flex',
      alignItems: 'baseline',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(PjMono, {
    size: 9
  }, "ENTREGA ", ONGOING.due.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(MpFootLink, {
    hover: hover
  }, "continuar \u2192"))));
}
function CustomCard({
  c
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: c.href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: MP_CARD(hover)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PjMono, null, "Personalizado"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PjMono, {
    size: 9,
    color: "var(--primary)"
  }, c.state.toUpperCase())), /*#__PURE__*/React.createElement(MpTitle, null, c.title), /*#__PURE__*/React.createElement(MpDesc, null, "Trilha gerada para voc\xEA \u2014 4 marcos, 5 entreg\xE1veis e 2 cursos de apoio."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 14,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'baseline',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(PjMono, {
    size: 9
  }, c.created.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(MpFootLink, {
    hover: hover
  }, "come\xE7ar \u2192")));
}
function CreateCard() {
  const [hover, setHover] = React.useState(false);
  const create = () => {
    window.dispatchEvent(new CustomEvent('tutor:open', {
      detail: {
        ask: 'Quero criar um projeto personalizado'
      }
    }));
  };
  return /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      create();
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: MP_CARD(hover, true)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PjIcon, {
    name: "sparks",
    size: 14,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement(PjMono, null, "Novo")), /*#__PURE__*/React.createElement(MpTitle, null, "Criar projeto personalizado"), /*#__PURE__*/React.createElement(MpDesc, null, "Descreva um problema real do seu neg\xF3cio \u2014 a IA monta sua trilha: marcos, entreg\xE1veis e rubrica."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 14,
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(MpFootLink, {
    hover: hover
  }, "criar com o tutor \u2192")));
}
function MeusProjetos() {
  return /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projetos \u2014 meus projetos",
    style: {
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 30,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Meus ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "projetos")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "pj-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(OngoingCard, null), MY_CUSTOM.map(c => /*#__PURE__*/React.createElement(CustomCard, {
    key: c.id,
    c: c
  })), /*#__PURE__*/React.createElement(CreateCard, null)));
}

/* ---------- card de projeto ---------- */
function ProjectCard({
  project,
  matchMode
}) {
  const [hover, setHover] = React.useState(false);
  const cat = PJ_CAT_BY_KEY[project.cat];
  return /*#__PURE__*/React.createElement("a", {
    href: project.href || '#',
    onClick: e => {
      if (!project.href) e.preventDefault();
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      textDecoration: 'none',
      padding: '22px 24px 20px',
      background: 'var(--card)',
      border: hover ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: cat.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement(PjMono, null, cat.label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PjMatch, {
    match: project.match,
    mode: matchMode
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '16px 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 19,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      textWrap: 'pretty',
      color: 'var(--foreground)'
    }
  }, project.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 20px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, project.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 14,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(PjMono, {
    size: 9
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, project.weeks.toUpperCase(), " \xB7 ", project.steps, " ETAPAS")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PjLevelSquares, {
    level: project.level
  })));
}

/* ---------- filtro por categoria: uma camada só ---------- */
function PjChip({
  label,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      padding: '6px 14px',
      background: active ? 'hsl(var(--primary-hsl) / 0.08)' : 'none',
      cursor: 'pointer',
      border: `1px solid ${active ? 'var(--primary)' : hover ? 'var(--hairline-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: active ? 'var(--primary)' : hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      transition: 'all 160ms var(--ease-out)'
    }
  }, label);
}

/* ---------- página ---------- */
function ProjetosCatalogo() {
  const [t, setTweak] = window.useTweaks(PJ_TWEAKS);
  const [cat, setCat] = React.useState(null);
  const cats = CATEGORIES.filter(c => PROJECTS.some(p => p.cat === c.key));
  const list = PROJECTS.filter(p => p.id !== ONGOING.id).filter(p => !cat || p.cat === cat).sort((a, b) => b.match - a.match);
  const {
    TweaksPanel,
    TweakSection,
    TweakRadio,
    TweakToggle
  } = window;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "projetos"
  }), /*#__PURE__*/React.createElement("main", {
    className: "pj-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "Projetos \u2014 header",
    style: {
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--muted-foreground)'
    }
  }, "\xC1rea do Aluno \xB7 Projetos"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 42,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "Projetos ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "reais")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--muted-foreground)'
    }
  }, "Resolva um problema do seu neg\xF3cio \u2014 com etapas, entreg\xE1veis e rubrica transparente.")), /*#__PURE__*/React.createElement(MeusProjetos, null), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Projetos \u2014 cat\xE1logo"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 30,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Recomendados ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "para voc\xEA")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none',
      flexShrink: 0
    }
  }, "ajustar meu perfil \u2192")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 24px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)'
    }
  }, "Ordenado pelo match do seu diagn\xF3stico \u2014 ", PROFILE.nicho, " \xB7 ", PROFILE.objetivo, " \xB7 ", PROFILE.tempo, "."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(PjChip, {
    label: "Todos",
    active: !cat,
    onClick: () => setCat(null)
  }), cats.map(c => /*#__PURE__*/React.createElement(PjChip, {
    key: c.key,
    label: c.label,
    active: cat === c.key,
    onClick: () => setCat(cat === c.key ? null : c.key)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pj-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16
    }
  }, list.map(p => /*#__PURE__*/React.createElement(ProjectCard, {
    key: p.id,
    project: p,
    matchMode: t.matchDisplay
  }))))), /*#__PURE__*/React.createElement(window.TutorPanel, {
    context: PJ_TUTOR.context,
    intro: PJ_TUTOR.intro,
    suggestions: PJ_TUTOR.suggestions,
    fallback: PJ_TUTOR.fallback,
    proactive: t.tutorProativo
  }), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Cat\xE1logo"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Match",
    value: t.matchDisplay,
    options: ['número', 'rótulo'],
    onChange: v => setTweak('matchDisplay', v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Tutor IA"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Sugest\xE3o proativa",
    value: t.tutorProativo,
    onChange: v => setTweak('tutorProativo', v)
  })));
}
window.ProjetosCatalogo = ProjetosCatalogo;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ProjetosCatalogo.jsx", error: String((e && e.message) || e) }); }

// cursos/ProntoSocorro.jsx
try { (() => {
/* ProntoSocorro — salas ao vivo, professores, grade e calendário.
 * App route : /cursos/pronto-socorro  (rota dedicada ao Pronto Socorro)
 * Data      : PROFESSORS / SCHEDULE / LIVE_ROOMS definidos localmente neste arquivo
 */
const {
  Icon: PsIcon,
  Button: PsButton,
  Avatar: PsAvatar
} = window.LendRIADesignSystem_096da5;
const PLAYER_URL = 'Player - PS AIOX Fundamentals.html';
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ---- categorias (badges coloridos, como no produto real) ----
const CAT = {
  tecnico: {
    label: 'Técnico',
    color: '#30D158',
    icon: 'code'
  },
  cyber: {
    label: 'Cyber Security',
    color: '#FF5A4D',
    icon: 'shield'
  },
  sales: {
    label: 'Sales',
    color: '#D9A441',
    icon: 'dollar'
  },
  business: {
    label: 'Business',
    color: '#8B89FF',
    icon: 'suitcase'
  },
  mentalidade: {
    label: 'Mentalidade',
    color: '#FF8A3D',
    icon: 'brain'
  }
};
const PROFESSORS = [{
  id: 'klaus',
  name: 'Klaus Deor',
  cat: 'tecnico',
  photo: 'professores/prof-1.png'
}, {
  id: 'day',
  name: 'Day Cavalcanti',
  cat: 'tecnico',
  photo: 'professores/prof-3.png'
}, {
  id: 'adavio',
  name: 'Adávio Tittoni',
  cat: 'tecnico',
  host: true
}, {
  id: 'fran',
  name: 'Fran Martins',
  cat: 'sales'
}, {
  id: 'sidney',
  name: 'Sidney Fernandes',
  cat: 'cyber',
  photo: 'professores/prof-2.png'
}, {
  id: 'bruno',
  name: 'Bruno Gentil',
  cat: 'business'
}, {
  id: 'adriano',
  name: 'Adriano De Marqui',
  cat: 'mentalidade'
}, {
  id: 'lucas',
  name: 'Lucas Charão',
  cat: 'tecnico',
  host: true
}];
const PROF = Object.fromEntries(PROFESSORS.map(p => [p.id, p]));

// Grade semanal — Seg a Sex, 10:00–11:30 e 18:30–20:00
const SCHEDULE = [{
  weekday: 'Segunda',
  wd: 1,
  slots: [{
    time: '10:00 – 11:30',
    prof: 'klaus'
  }, {
    time: '18:30 – 20:00',
    prof: 'day'
  }]
}, {
  weekday: 'Terça',
  wd: 2,
  slots: [{
    time: '10:00 – 11:30',
    prof: 'adavio'
  }, {
    time: '18:30 – 20:00',
    prof: 'fran'
  }]
}, {
  weekday: 'Quarta',
  wd: 3,
  slots: [{
    time: '10:00 – 11:30',
    prof: 'sidney'
  }, {
    time: '18:30 – 20:00',
    prof: 'day'
  }]
}, {
  weekday: 'Quinta',
  wd: 4,
  slots: [{
    time: '10:00 – 11:30',
    prof: 'adavio'
  }, {
    time: '18:30 – 20:00',
    prof: 'bruno'
  }]
}, {
  weekday: 'Sexta',
  wd: 5,
  slots: [{
    time: '10:00 – 11:30',
    prof: 'day'
  }, {
    time: '18:30 – 20:00',
    prof: 'adriano'
  }]
}];
const SCHED_BY_WD = Object.fromEntries(SCHEDULE.map(d => [d.wd, d.slots]));

// salas ao vivo agora (concorrentes)
const LIVE_ROOMS = [{
  prof: 'sidney',
  topic: 'Plantão Cyber — tokens, escopos e segurança de integrações',
  watching: 34,
  ago: '12 min'
}, {
  prof: 'adriano',
  topic: 'Mentalidade — destrave a execução e a constância',
  watching: 21,
  ago: '9 min'
}, {
  prof: 'day',
  topic: 'Técnico — debugando seu primeiro agente ao vivo',
  watching: 18,
  ago: '15 min'
}];
const WEEKDAY_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const BASE_SUNDAY = new Date(2026, 5, 7); // 7 jun 2026 (domingo)
const TODAY = new Date(2026, 5, 10); // quarta 10 jun
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function MonoData({
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)'
    }
  }, children);
}
function CategoryBadge({
  cat,
  size
}) {
  const c = CAT[cat];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      borderRadius: 'var(--radius-full)',
      border: `1px solid ${c.color}55`,
      background: `${c.color}1A`,
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 9 : 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: c.color,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(PsIcon, {
    name: c.icon,
    size: size === 'sm' ? 11 : 12,
    color: c.color
  }), c.label);
}

// ---------- professores: sessões de cada um ----------
function profSessions(id) {
  const out = [];
  SCHEDULE.forEach(d => d.slots.forEach(s => {
    if (s.prof === id) out.push({
      wd: d.weekday.slice(0, 3),
      time: s.time.slice(0, 5)
    });
  }));
  return out;
}

// ---------- live room card ----------
function LiveRoomCard({
  room
}) {
  const p = PROF[room.prof];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '16 / 9',
      background: 'radial-gradient(120% 90% at 50% 0%, #20323a 0%, #141c26 55%, #0c0d12 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 4,
      background: 'hsl(var(--foreground-hsl) / 0.1)',
      border: '1px solid hsl(var(--foreground-hsl) / 0.25)'
    }
  }, /*#__PURE__*/React.createElement(PsIcon, {
    name: "play",
    size: 22,
    color: "var(--foreground)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      background: 'hsl(0 0% 0% / 0.55)',
      border: '1px solid hsl(4 100% 62% / 0.5)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ps-live-dot"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#fff'
    }
  }, "Ao vivo")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 12,
      right: 12
    }
  }, /*#__PURE__*/React.createElement(MonoData, {
    color: "rgba(255,255,255,0.65)"
  }, room.watching, " assistindo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(PsAvatar, {
    src: p.photo,
    name: p.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap'
    }
  }, p.name), /*#__PURE__*/React.createElement(MonoData, null, "Come\xE7ou h\xE1 ", room.ago)), /*#__PURE__*/React.createElement(CategoryBadge, {
    cat: p.cat,
    size: "sm"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 16,
      lineHeight: 1.4,
      color: 'var(--foreground)',
      flex: 1,
      textWrap: 'pretty'
    }
  }, room.topic), /*#__PURE__*/React.createElement(PsButton, {
    variant: "cta",
    size: "sm",
    onClick: () => {
      window.location.href = PLAYER_URL;
    },
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(PsIcon, {
    name: "video-camera",
    size: 15
  }), "Entrar na sala")));
}

// ---------- portrait (foto real ou iniciais) ----------
function Portrait({
  p,
  size = 80
}) {
  const initials = p.name.split(' ').slice(0, 2).map(w => w[0]).join('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 'var(--radius-base)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'hsl(var(--foreground-hsl) / 0.05)'
    }
  }, p.photo ? /*#__PURE__*/React.createElement("img", {
    src: p.photo,
    alt: p.name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center top'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-serif)',
      fontWeight: 300,
      fontSize: size * 0.34,
      color: 'var(--muted-foreground)'
    }
  }, initials));
}

// ---------- professor card (rico: categoria + plantões) ----------
function ProfessorCard({
  p,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const sessions = profSessions(p.id);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: 16,
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      padding: 16,
      borderRadius: 'var(--radius-lg)',
      background: active ? 'hsl(var(--foreground-hsl) / 0.04)' : 'var(--card)',
      border: active ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
      boxShadow: active ? 'inset 2px 0 0 var(--primary)' : 'none',
      transition: 'all 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(Portrait, {
    p: p,
    size: 84
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--foreground)',
      whiteSpace: 'nowrap'
    }
  }, p.name), p.host && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--primary)',
      border: '1px solid hsl(var(--primary-hsl) / 0.4)',
      borderRadius: 'var(--radius-full)',
      padding: '2px 8px'
    }
  }, "Host"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PsIcon, {
    name: active ? 'calendar' : 'arrow-right',
    size: 16,
    color: active || hover ? 'var(--primary)' : 'var(--muted-foreground)',
    style: {
      flexShrink: 0
    }
  })), /*#__PURE__*/React.createElement(CategoryBadge, {
    cat: p.cat,
    size: "sm"
  }), sessions.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 'auto'
    }
  }, sessions.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      color: 'var(--muted-foreground)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '3px 8px'
    }
  }, s.wd, " \xB7 ", s.time))) : /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: 'var(--muted-foreground)',
      marginTop: 'auto'
    }
  }, "Anfitri\xE3o dos plant\xF5es")));
}

// ---------- Grade de Horários (matriz dias × horários) ----------
function GradeMatrix({
  profFilter
}) {
  const times = ['10:00 – 11:30', '18:30 – 20:00'];
  const headerCell = {
    padding: '16px 14px',
    textAlign: 'center',
    borderBottom: '1px solid var(--border)'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ps-agenda-card",
    style: {
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ps-agenda",
    style: {
      display: 'grid',
      gridTemplateColumns: '132px repeat(5, 1fr)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...headerCell
    }
  }), SCHEDULE.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.wd,
    style: {
      ...headerCell,
      borderLeft: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 17,
      color: 'var(--foreground)'
    }
  }, d.weekday))), times.map((t, ti) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: ti
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 16px',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: '0.04em',
      color: 'var(--muted-foreground)',
      textAlign: 'right'
    }
  }, t)), SCHEDULE.map(d => {
    const slot = d.slots[ti];
    const p = PROF[slot.prof];
    const dim = profFilter && slot.prof !== profFilter;
    return /*#__PURE__*/React.createElement("div", {
      key: d.wd,
      style: {
        padding: '16px 14px',
        borderTop: '1px solid var(--border)',
        borderLeft: '1px solid var(--border)',
        minHeight: 104,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 11,
        opacity: dim ? 0.22 : 1,
        transition: 'opacity 180ms var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(CategoryBadge, {
      cat: p.cat,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(PsAvatar, {
      src: p.photo,
      name: p.name,
      size: "sm"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--foreground)',
        lineHeight: 1.25
      }
    }, p.name)));
  })))));
}

// ---------- Calendário (semana navegável) ----------
function CalendarWeek({
  profFilter
}) {
  const [offset, setOffset] = React.useState(0);
  const sunday = addDays(BASE_SUNDAY, offset * 7);
  const days = Array.from({
    length: 7
  }, (_, i) => addDays(sunday, i));
  const start = days[0],
    end = days[6];
  const rangeLabel = `${start.getDate()} de ${MON[start.getMonth()]} – ${end.getDate()} de ${MON[end.getMonth()]} de ${end.getFullYear()}`;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 24,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, rangeLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOffset(offset - 1),
    "aria-label": "Semana anterior",
    style: navBtn()
  }, /*#__PURE__*/React.createElement(PsIcon, {
    name: "nav-arrow-left",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOffset(0),
    style: {
      ...navBtn(),
      width: 'auto',
      padding: '0 16px',
      background: offset === 0 ? 'var(--primary)' : 'transparent',
      color: offset === 0 ? 'var(--primary-foreground)' : 'var(--foreground)',
      borderColor: offset === 0 ? 'var(--primary)' : 'var(--border)',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.16em'
    }
  }, "Hoje"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOffset(offset + 1),
    "aria-label": "Pr\xF3xima semana",
    style: navBtn()
  }, /*#__PURE__*/React.createElement(PsIcon, {
    name: "nav-arrow-right",
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ps-week",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 12
    }
  }, days.map((d, i) => {
    const wd = d.getDay();
    let slots = SCHED_BY_WD[wd] || [];
    if (profFilter) slots = slots.filter(s => s.prof === profFilter);
    const isToday = sameDay(d, TODAY);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        border: isToday ? '1px solid var(--hairline-strong)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--card)',
        padding: '16px 12px 14px',
        minHeight: 180,
        boxShadow: isToday ? 'inset 0 0 0 1px var(--hairline)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted-foreground)'
      }
    }, WEEKDAY_FULL[wd]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-serif)',
        fontWeight: 300,
        fontSize: 30,
        lineHeight: 1.1,
        marginTop: 4,
        color: isToday ? 'var(--primary)' : 'var(--foreground)'
      }
    }, d.getDate()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.12em',
        color: 'var(--muted-foreground)'
      }
    }, MON[d.getMonth()])), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, slots.length === 0 && /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        textAlign: 'center',
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 12,
        color: 'var(--muted-foreground)'
      }
    }, "Sem eventos"), slots.map((s, j) => {
      const p = PROF[s.prof];
      return /*#__PURE__*/React.createElement("div", {
        key: j,
        style: {
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-base)',
          padding: '8px 9px',
          background: 'hsl(var(--foreground-hsl) / 0.02)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted-foreground)'
        }
      }, s.time.slice(0, 5)), /*#__PURE__*/React.createElement("span", {
        style: {
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: CAT[p.cat].color,
          flexShrink: 0
        }
      })), /*#__PURE__*/React.createElement("p", {
        style: {
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--foreground)',
          lineHeight: 1.3
        }
      }, p.name));
    })));
  })));
}
function navBtn() {
  return {
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-base)',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--foreground)'
  };
}
function SectionTitle({
  children,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 30,
      letterSpacing: '-0.01em'
    }
  }, children), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, hsl(var(--foreground-hsl) / 0.14), transparent)'
    }
  }), action);
}
function ProntoSocorro() {
  const [prof, setProf] = React.useState(null);
  const selected = prof ? PROF[prof] : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "ps"
  }), /*#__PURE__*/React.createElement("main", {
    className: "ps-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 32,
      flexWrap: 'wrap',
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--muted-foreground)'
    }
  }, "Mentoria Lend\xE1ria"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 42,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "Mentor", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "ia")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--muted-foreground)'
    }
  }, "Plant\xF5es ao vivo com especialistas para destravar suas d\xFAvidas \u2014 toda semana.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      flexWrap: 'wrap'
    }
  }, [['Frequência', 'Seg – Sex'], ['Sessões', '10h & 18h30'], ['Especialistas', PROFESSORS.length], ['Hosts', 'Lucas · Adávio']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 6px',
      color: 'var(--muted-foreground)'
    }
  }, k), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'var(--foreground)'
    }
  }, v))))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ps-live-dot"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      color: 'var(--foreground)'
    }
  }, "Ao vivo agora"), /*#__PURE__*/React.createElement(MonoData, null, LIVE_ROOMS.length, " salas simult\xE2neas")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 20
    }
  }, LIVE_ROOMS.map((r, i) => /*#__PURE__*/React.createElement(LiveRoomCard, {
    key: i,
    room: r
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    action: selected ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setProf(null),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--muted-foreground)',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(PsIcon, {
      name: "xmark",
      size: 14
    }), /*#__PURE__*/React.createElement("span", {
      className: "al-data"
    }, "Limpar filtro")) : /*#__PURE__*/React.createElement(MonoData, null, PROFESSORS.length, " especialistas")
  }, "Professores"), selected && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '-14px 0 22px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16,
      color: 'var(--muted-foreground)'
    }
  }, "Mostrando os plant\xF5es de ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary)'
    }
  }, selected.name), " na grade e no calend\xE1rio."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
      gap: 16
    }
  }, PROFESSORS.map(p => /*#__PURE__*/React.createElement(ProfessorCard, {
    key: p.id,
    p: p,
    active: prof === p.id,
    onClick: () => setProf(prof === p.id ? null : p.id)
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    action: /*#__PURE__*/React.createElement(MonoData, null, "2 sess\xF5es/dia")
  }, "Grade de ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--primary)'
    }
  }, "Hor\xE1rios")), /*#__PURE__*/React.createElement(GradeMatrix, {
    profFilter: prof
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '18px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "* Programa\xE7\xE3o sujeita a altera\xE7\xE3o sem aviso pr\xE9vio.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(SectionTitle, null, "Calend\xE1rio"), /*#__PURE__*/React.createElement(CalendarWeek, {
    profFilter: prof
  }))));
}
window.ProntoSocorro = ProntoSocorro;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/ProntoSocorro.jsx", error: String((e && e.message) || e) }); }

// cursos/TrilhaDetalhe.jsx
try { (() => {
/* TrilhaDetalhe — a trilha aberta como uma "trilha" de verdade.
 * Espinha vertical que se preenche de ouro com o progresso; nós alternados
 * esquerda/direita com estado (concluído / você está aqui / bloqueado);
 * marco no meio e certificação no fim. Gamificado, mas dentro do DS.
 * Data: trilhas-data.js (window.TrilhasData.DETAIL).
 */
const {
  Icon: TdIcon,
  Button: TdButton
} = window.LendRIADesignSystem_096da5;
const {
  LEVELS: TD_LEVELS
} = window.ExplorarData;
const TD = window.TrilhasData.DETAIL;

/* tipos de item que uma trilha pode misturar */
const TD_KIND = {
  aula: {
    label: 'Aula',
    icon: 'play',
    square: false,
    cta: 'Assistir aula'
  },
  modulo: {
    label: 'Módulo',
    icon: 'multiple-pages',
    square: false,
    cta: 'Continuar módulo'
  },
  curso: {
    label: 'Curso',
    icon: 'book',
    square: false,
    cta: 'Continuar curso'
  },
  projeto: {
    label: 'Projeto',
    icon: 'tools',
    square: true,
    cta: 'Abrir projeto'
  }
};
function tdMeta(m) {
  if (m.kind === 'aula') return m.duration.toUpperCase();
  if (m.kind === 'modulo') return `${m.lessons} AULAS · ${m.duration.toUpperCase()}`;
  if (m.kind === 'curso') return `${m.lessons} AULAS · ${m.duration.toUpperCase()} · ${TD_LEVELS[m.level - 1].toUpperCase()}`;
  if (m.kind === 'projeto') return `${m.steps} ETAPAS · ${m.weeks.toUpperCase()}`;
  return '';
}
function TdMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}

/* nó na espinha — estado vira forma; tipo 'projeto' vira quadrado (construir) */
function TdNode({
  state,
  kind
}) {
  const square = TD_KIND[kind] && TD_KIND[kind].square;
  const radius = square ? 'var(--radius-sm)' : '50%';
  if (state === 'done') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: radius,
        background: 'var(--primary)',
        flexShrink: 0,
        zIndex: 2
      }
    }, /*#__PURE__*/React.createElement(TdIcon, {
      name: "check",
      size: 20,
      color: "var(--primary-foreground)"
    }));
  }
  if (state === 'active') {
    return /*#__PURE__*/React.createElement("span", {
      className: square ? 'td-node-active' : 'td-pulse td-node-active',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 54,
        height: 54,
        borderRadius: radius,
        background: 'var(--background)',
        border: '2px solid var(--primary)',
        flexShrink: 0,
        zIndex: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 15,
        height: 15,
        borderRadius: square ? '2px' : '50%',
        background: 'var(--primary)'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: radius,
      background: 'var(--background)',
      border: '1px solid var(--border)',
      flexShrink: 0,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: square ? 'tools' : 'lock',
    size: 16,
    color: "var(--muted-foreground)"
  }));
}

/* meia-linha do conector (alinha sempre, independente da altura do card) */
function TdHalf({
  on,
  hidden
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      width: 2,
      background: hidden ? 'transparent' : on ? 'linear-gradient(180deg, hsl(var(--primary-hsl) / 0.4), hsl(var(--primary-hsl) / 0.95))' : 'var(--border)'
    }
  });
}

/* card do módulo */
function TdCard({
  m,
  side
}) {
  const [hover, setHover] = React.useState(false);
  const done = m.state === 'done';
  const active = m.state === 'active';
  const locked = m.state === 'locked';
  const right = side === 'right';
  const kind = TD_KIND[m.kind] || TD_KIND.curso;
  const stateLabel = done ? 'Concluído' : active ? 'Você está aqui' : 'Bloqueado';
  const stateColor = done || active ? 'var(--primary)' : 'var(--muted-foreground)';
  const inner = /*#__PURE__*/React.createElement("div", {
    className: active ? 'td-card td-card-active' : 'td-card',
    onMouseEnter: () => !locked && setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: done ? () => {
      window.location.href = m.href;
    } : undefined,
    style: {
      padding: active ? '24px 26px' : '20px 24px',
      borderRadius: 'var(--radius-md)',
      background: active ? 'hsl(var(--primary-hsl) / 0.05)' : 'transparent',
      border: active ? '1px solid hsl(var(--primary-hsl) / 0.5)' : `1px solid ${hover ? 'var(--hairline-strong)' : done ? 'var(--border)' : 'transparent'}`,
      opacity: locked ? 0.62 : 1,
      cursor: done ? 'pointer' : 'default',
      transform: hover && done ? 'translateY(-2px)' : 'none',
      transition: 'border-color 180ms var(--ease-out), transform 220ms var(--ease-out)',
      textAlign: right ? 'left' : 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: right ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: kind.square ? 'var(--radius-sm)' : 'var(--radius-full)',
      background: 'hsl(var(--primary-hsl) / 0.08)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: kind.icon,
    size: 15,
    color: locked ? 'var(--muted-foreground)' : 'var(--primary)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(TdMono, {
    size: 9
  }, kind.label.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 2,
      height: 2,
      borderRadius: '50%',
      background: 'var(--muted-foreground)',
      opacity: 0.6
    }
  }), /*#__PURE__*/React.createElement(TdMono, {
    size: 9,
    color: stateColor
  }, stateLabel.toUpperCase()))), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '14px 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 20,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: done ? 'var(--muted-foreground)' : 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, m.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 14px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, m.desc), m.skills && /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: '2px 0 16px',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, m.skills.map((s, k) => /*#__PURE__*/React.createElement("li", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: right ? 'row' : 'row-reverse',
      justifyContent: right ? 'flex-start' : 'flex-end',
      alignItems: 'center',
      gap: 10,
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      flexShrink: 0,
      borderRadius: '50%',
      background: done || active ? 'var(--primary)' : 'transparent',
      border: done || active ? 'none' : '1px solid var(--muted-foreground)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12.5,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      color: locked ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, s)))), m.deliverable && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: right ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: 10,
      margin: '2px 0 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexShrink: 0,
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: "flag",
    size: 13,
    color: locked ? 'var(--muted-foreground)' : 'var(--primary)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12.5,
      lineHeight: 1.4,
      color: locked ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted-foreground)'
    }
  }, "Entreg\xE1vel \u2014 "), m.deliverable)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: right ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(TdMono, {
    size: 9
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, tdMeta(m))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(TdMono, {
    size: 9,
    color: done ? 'var(--muted-foreground)' : 'var(--primary)'
  }, "+", m.xp, " XP")), (active || done) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      flexDirection: right ? 'row' : 'row-reverse'
    }
  }, active ? /*#__PURE__*/React.createElement(TdButton, {
    variant: "cta",
    size: "sm",
    onClick: () => {
      window.location.href = m.href;
    }
  }, kind.cta) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
      textDecoration: 'none',
      transition: 'color 160ms var(--ease-out)'
    }
  }, "rever \u2192")));
  return active || locked ? active ? /*#__PURE__*/React.createElement("a", {
    href: m.href,
    style: {
      textDecoration: 'none',
      display: 'block'
    },
    onClick: e => {
      e.preventDefault();
      window.location.href = m.href;
    }
  }, inner) : inner : inner;
}

/* ordinal fantasma — preenche o lado vazio com ritmo editorial (referências) */
function TdGhost({
  n,
  align,
  state
}) {
  const done = state === 'done';
  const active = state === 'active';
  return /*#__PURE__*/React.createElement("div", {
    className: "td-ghost",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      padding: '0 28px',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 128,
      lineHeight: 0.8,
      letterSpacing: '-0.05em',
      userSelect: 'none',
      color: active ? 'hsl(var(--primary-hsl) / 0.16)' : done ? 'hsl(var(--primary-hsl) / 0.10)' : 'hsl(var(--foreground-hsl) / 0.05)'
    }
  }, String(n).padStart(2, '0')));
}

/* uma linha da trilha: card | nó+conector | ordinal fantasma — alternando */
function TdRow({
  m,
  i,
  first,
  last,
  activeIdx
}) {
  const side = i % 2 === 0 ? 'left' : 'right';
  const topOn = i <= activeIdx;
  const botOn = i < activeIdx;
  const card = /*#__PURE__*/React.createElement(TdCard, {
    m: m,
    side: side
  });
  const ghost = /*#__PURE__*/React.createElement(TdGhost, {
    n: i + 1,
    align: side === 'left' ? 'left' : 'right',
    state: m.state
  });
  const spine = /*#__PURE__*/React.createElement("div", {
    className: "td-spine",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(TdHalf, {
    on: topOn,
    hidden: first
  }), /*#__PURE__*/React.createElement(TdNode, {
    state: m.state,
    kind: m.kind
  }), /*#__PURE__*/React.createElement(TdHalf, {
    on: botOn,
    hidden: last
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "td-row",
    "data-side": side,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 64px 1fr',
      alignItems: 'center',
      columnGap: 8
    }
  }, side === 'left' ? card : ghost, spine, side === 'right' ? card : ghost);
}

/* marco — divisor cerimonial no meio da trilha */
function TdMarker({
  label,
  on
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "td-row td-markerrow",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 64px 1fr',
      alignItems: 'center',
      columnGap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    className: "td-spine",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(TdHalf, {
    on: on
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      flexShrink: 0,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: "flag",
    size: 16,
    color: on ? 'var(--primary)' : 'var(--muted-foreground)'
  })), /*#__PURE__*/React.createElement(TdHalf, {
    on: on
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: 4
    }
  }, /*#__PURE__*/React.createElement(TdMono, {
    size: 10,
    color: on ? 'var(--primary)' : 'var(--muted-foreground)'
  }, label.toUpperCase())));
}

/* certificação — destino da trilha */
function TdCertificate({
  cert,
  reached
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "td-row td-certrow",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 64px 1fr',
      alignItems: 'center',
      columnGap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    className: "td-spine",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(TdHalf, {
    on: reached
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 52,
      height: 52,
      borderRadius: '50%',
      flexShrink: 0,
      zIndex: 2,
      background: reached ? 'var(--primary)' : 'var(--background)',
      border: reached ? 'none' : '1px dashed var(--hairline-strong)'
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: "trophy",
    size: 22,
    color: reached ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      width: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "td-cert-card",
    style: {
      padding: '20px 24px',
      border: '1px dashed var(--hairline-strong)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement(TdMono, {
    size: 9,
    color: "var(--primary)"
  }, "CERTIFICA\xC7\xC3O"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '12px 0 6px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 21,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, cert.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, cert.desc)));
}

/* ---------- página ---------- */
function TrilhaDetalhe() {
  const total = TD.modules.length;
  const pct = Math.round(TD.activeIdx / total * 100);
  const markerAfter = TD.modules.findIndex(m => m.marker);
  const [fillW, setFillW] = React.useState(0);

  // espinha + progresso "se desenham" ao carregar; linhas surgem ao rolar
  React.useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raf = requestAnimationFrame(() => setFillW(pct));
    const els = document.querySelectorAll('.td-reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('is-in'));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -6% 0px'
    });
    els.forEach(e => io.observe(e));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pct]);
  const goActive = () => {
    const el = document.getElementById('modulo-ativo');
    if (el) window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 120,
      behavior: 'smooth'
    });
  };
  const rows = [];
  TD.modules.forEach((m, i) => {
    rows.push(/*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: "td-reveal",
      id: m.state === 'active' ? 'modulo-ativo' : undefined
    }, /*#__PURE__*/React.createElement(TdRow, {
      m: m,
      i: i,
      first: i === 0,
      last: false,
      activeIdx: TD.activeIdx
    })));
    if (i === markerAfter) {
      rows.push(/*#__PURE__*/React.createElement("div", {
        key: `marker-${i}`,
        className: "td-reveal"
      }, /*#__PURE__*/React.createElement(TdMarker, {
        label: m.marker,
        on: i < TD.activeIdx
      })));
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "trilhas"
  }), /*#__PURE__*/React.createElement("main", {
    className: "td-main",
    style: {
      maxWidth: 1180,
      margin: '0 auto',
      padding: '32px 48px 110px'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "Trilhas.html",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 28,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--muted-foreground)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(TdIcon, {
    name: "arrow-left",
    size: 14
  }), "Trilhas"), /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "Trilha \u2014 header",
    className: "td-hero",
    style: {
      textAlign: 'center',
      maxWidth: 680,
      margin: '0 auto',
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 16px',
      color: 'var(--muted-foreground)'
    }
  }, "Trilha \xB7 ", TD.range), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 48,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, TD.titleParts[0], /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, TD.titleParts[1])), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '16px auto 0',
      maxWidth: 560,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16.5,
      lineHeight: 1.55,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, TD.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      margin: '26px auto 0',
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement(TdMono, {
    size: 10,
    color: "var(--primary)"
  }, TD.activeIdx, "/", total), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: 1,
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.16)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${fillW}%`,
      background: 'var(--primary)',
      transition: 'width 1100ms var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '50%',
      left: `${fillW}%`,
      width: 9,
      height: 9,
      marginLeft: -4,
      borderRadius: '50%',
      background: 'var(--primary)',
      boxShadow: '0 0 10px hsl(var(--primary-hsl) / 0.7)',
      transform: 'translateY(-50%)',
      transition: 'left 1100ms var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement(TdMono, {
    size: 10
  }, TD.xpDone, "/", TD.xpTotal, " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(TdButton, {
    variant: "cta",
    onClick: goActive
  }, "Ir para o m\xF3dulo atual"))), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Trilha \u2014 jornada",
    className: "td-trail",
    style: {
      marginTop: 8
    }
  }, rows, /*#__PURE__*/React.createElement(TdCertificate, {
    cert: TD.certificate,
    reached: false
  }))));
}
window.TrilhaDetalhe = TrilhaDetalhe;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/TrilhaDetalhe.jsx", error: String((e && e.message) || e) }); }

// cursos/TrilhasCatalogo.jsx
try { (() => {
/* TrilhasCatalogo — listagem das trilhas (jornadas de aprendizado).
 * Mesma anatomia limpa dos Projetos: continue + grid de cards.
 * Data: trilhas-data.js (window.TrilhasData).
 */
const {
  Icon: TrIcon,
  Button: TrButton
} = window.LendRIADesignSystem_096da5;
const {
  TRILHAS,
  ONGOING
} = window.TrilhasData;
function TrMono({
  children,
  color,
  size
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "al-data",
    style: {
      color: color || 'var(--muted-foreground)',
      fontSize: size
    }
  }, children);
}

/* progresso fino — a "trilha" em miniatura */
function TrProgress({
  done,
  total
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, Array.from({
    length: total
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 14,
      height: 3,
      background: i < done ? 'var(--primary)' : 'hsl(var(--foreground-hsl) / 0.14)'
    }
  }))), /*#__PURE__*/React.createElement(TrMono, {
    size: 9,
    color: done ? 'var(--primary)' : 'var(--muted-foreground)'
  }, done, "/", total));
}

/* ---------- continue na trilha (gancho de retorno) ---------- */
function TrContinue() {
  const [hover, setHover] = React.useState(false);
  const pct = Math.round(ONGOING.done / ONGOING.total * 100);
  return /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Trilhas \u2014 continuar",
    style: {
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: ONGOING.href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      padding: '24px 28px',
      textDecoration: 'none',
      background: 'var(--card)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${hover ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 10px',
      color: 'var(--muted-foreground)'
    }
  }, "Continue na trilha"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 24,
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Operador de ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, ONGOING.accent)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.06em',
      color: 'var(--muted-foreground)'
    }
  }, "Pr\xF3ximo m\xF3dulo \xB7 ", ONGOING.nextModule)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2,
      background: 'hsl(var(--primary-hsl) / 0.18)',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: 'var(--primary)'
    }
  })), /*#__PURE__*/React.createElement(TrMono, {
    size: 9,
    color: "var(--primary)"
  }, ONGOING.done, " DE ", ONGOING.total, " M\xD3DULOS")), /*#__PURE__*/React.createElement(TrButton, {
    variant: "cta",
    size: "sm",
    onClick: e => {
      e.preventDefault();
      window.location.href = ONGOING.href;
    }
  }, "Retomar")));
}

/* ---------- card de trilha ---------- */
const TR_STATUS = {
  andamento: {
    label: 'Em andamento',
    color: 'var(--primary)'
  },
  novo: {
    label: 'Novo',
    color: 'var(--primary)'
  },
  disponivel: null
};
function TrilhaCard({
  t
}) {
  const [hover, setHover] = React.useState(false);
  const started = t.done > 0;
  const status = TR_STATUS[t.status];
  return /*#__PURE__*/React.createElement("a", {
    href: t.href || '#',
    onClick: e => {
      if (!t.href) e.preventDefault();
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      textDecoration: 'none',
      padding: '24px 26px 22px',
      background: 'var(--card)',
      border: `1px solid ${hover ? 'var(--hairline-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      transition: 'border-color 180ms var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 22,
      color: 'var(--muted-foreground)',
      lineHeight: 1
    }
  }, t.n), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), status && /*#__PURE__*/React.createElement(TrMono, {
    size: 9,
    color: status.color
  }, status.label.toUpperCase())), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '18px 0 8px',
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 23,
      lineHeight: 1.15,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, t.title.replace(t.accent, ''), /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, t.accent)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 14px',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)',
      textWrap: 'pretty'
    }
  }, t.desc), t.compose && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 22px',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.06em',
      color: 'var(--muted-foreground)'
    }
  }, t.compose), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      paddingTop: 16,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(TrMono, {
    size: 9
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, t.itens, " ITENS \xB7 ", t.duration.toUpperCase())), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), started ? /*#__PURE__*/React.createElement(TrProgress, {
    done: t.done,
    total: t.itens
  }) : /*#__PURE__*/React.createElement(TrMono, {
    size: 9
  }, t.range.toUpperCase()))));
}

/* ---------- página ---------- */
function TrilhasCatalogo() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement(window.CourseTopbar, {
    active: "trilhas"
  }), /*#__PURE__*/React.createElement("main", {
    className: "tr-main",
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '40px 48px 96px'
    }
  }, /*#__PURE__*/React.createElement("header", {
    "data-screen-label": "Trilhas \u2014 header",
    style: {
      paddingBottom: 28,
      borderBottom: '1px solid var(--border)',
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "al-label",
    style: {
      margin: '0 0 12px',
      color: 'var(--muted-foreground)'
    }
  }, "\xC1rea do Aluno \xB7 Trilhas"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 42,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      color: 'var(--foreground)'
    }
  }, "Trilhas de ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "aprendizado")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--muted-foreground)'
    }
  }, "Sequ\xEAncias guiadas, do primeiro m\xF3dulo \xE0 certifica\xE7\xE3o \u2014 sem decidir o que vem depois.")), /*#__PURE__*/React.createElement(TrContinue, null), /*#__PURE__*/React.createElement("section", {
    "data-screen-label": "Trilhas \u2014 cat\xE1logo"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      flexShrink: 0,
      fontFamily: 'var(--font-serif)',
      fontWeight: 400,
      fontSize: 30,
      letterSpacing: '-0.01em',
      color: 'var(--foreground)'
    }
  }, "Todas as ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      color: 'var(--primary)'
    }
  }, "trilhas")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--hairline), transparent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "tr-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 16
    }
  }, TRILHAS.map(t => /*#__PURE__*/React.createElement(TrilhaCard, {
    key: t.id,
    t: t
  }))))));
}
window.TrilhasCatalogo = TrilhasCatalogo;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/TrilhasCatalogo.jsx", error: String((e && e.message) || e) }); }

// cursos/TutorPanel.jsx
try { (() => {
/* TutorPanel — Tutor IA contextual (EAD do Futuro §4).
 * Acessível de qualquer tela, sabe onde o aluno está, sugere proativamente.
 *
 * Uso: <window.TutorPanel context="Catálogo de projetos" intro="…"
 *        suggestions={[{ q, a }]} fallback="…" proactive />
 */
const {
  Icon: TpIcon
} = window.LendRIADesignSystem_096da5;
function TpMsg({
  who,
  text
}) {
  if (who === 'me') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        alignSelf: 'flex-end',
        maxWidth: '85%',
        padding: '10px 14px',
        background: 'hsl(var(--foreground-hsl) / 0.06)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'var(--foreground)'
      }
    }, text);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start',
      maxWidth: '94%',
      fontFamily: 'var(--font-serif)',
      fontSize: 14.5,
      lineHeight: 1.6,
      color: 'var(--foreground)'
    }
  }, text);
}
function TpChip({
  label,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 14px',
      cursor: 'pointer',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      background: 'none',
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 13,
      textAlign: 'left',
      color: hover ? 'var(--primary)' : 'var(--muted-foreground)',
      borderColor: hover ? 'var(--hairline-strong)' : 'var(--border)',
      transition: 'color 160ms var(--ease-out), border-color 160ms var(--ease-out)'
    }
  }, label);
}
function TutorPanel({
  context,
  intro,
  suggestions = [],
  fallback,
  proactive = true
}) {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState([]);
  const [asked, setAsked] = React.useState([]);
  const [text, setText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // outras partes da tela podem abrir o tutor (ex.: criar projeto personalizado)
  React.useEffect(() => {
    const onOpen = e => {
      setOpen(true);
      const q = e.detail && e.detail.ask;
      if (q) window.setTimeout(() => askRef.current(q), 350);
    };
    window.addEventListener('tutor:open', onOpen);
    return () => window.removeEventListener('tutor:open', onOpen);
  }, []);
  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, thinking, open]);
  const ask = q => {
    const found = suggestions.find(s => s.q === q);
    const answer = found && found.a || fallback || 'Deixa eu olhar o contexto da sua tela e te respondo.';
    setMsgs(m => [...m, {
      who: 'me',
      text: q
    }]);
    if (found) setAsked(a => [...a, q]);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMsgs(m => [...m, {
        who: 'ai',
        text: answer
      }]);
    }, 800);
  };
  const askRef = React.useRef(ask);
  askRef.current = ask;
  const send = () => {
    const q = text.trim();
    if (!q) return;
    setText('');
    ask(q);
  };
  const chips = suggestions.filter(s => !asked.includes(s.q));
  return /*#__PURE__*/React.createElement(React.Fragment, null, !open && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(true),
    "aria-label": "Abrir Tutor IA",
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 55,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 42,
      padding: '0 18px',
      background: 'hsl(var(--popover-hsl) / 0.92)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-base)'
    }
  }, /*#__PURE__*/React.createElement(TpIcon, {
    name: "sparks",
    size: 15,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--foreground)'
    }
  }, "Tutor")), open && /*#__PURE__*/React.createElement("aside", {
    className: "tutor-in",
    role: "dialog",
    "aria-label": "Tutor IA",
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(392px, 100vw)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-modal)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(TpIcon, {
    name: "sparks",
    size: 16,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--foreground)'
    }
  }, "Tutor"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '3px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Contexto \xB7 ", context)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    "aria-label": "Fechar tutor",
    style: {
      display: 'flex',
      padding: 8,
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(TpIcon, {
    name: "xmark",
    size: 16,
    color: "var(--muted-foreground)"
  }))), /*#__PURE__*/React.createElement("div", {
    ref: bodyRef,
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 20px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, proactive && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '15px 18px',
      border: '1px solid hsl(var(--primary-hsl) / 0.35)',
      borderRadius: 'var(--radius-md)',
      background: 'hsl(var(--primary-hsl) / 0.05)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 7px',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--primary)'
    }
  }, "Sugest\xE3o proativa"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--foreground)',
      textWrap: 'pretty'
    }
  }, intro)), msgs.map((m, i) => /*#__PURE__*/React.createElement(TpMsg, {
    key: i,
    who: m.who,
    text: m.text
  })), thinking && /*#__PURE__*/React.createElement("div", {
    className: "af-dots",
    "aria-hidden": "true",
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 18,
      color: 'var(--muted-foreground)',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\xB7"))), chips.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '12px 20px',
      flexShrink: 0
    }
  }, chips.map(s => /*#__PURE__*/React.createElement(TpChip, {
    key: s.q,
    label: s.q,
    onClick: () => ask(s.q)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px 18px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 46,
      padding: '0 6px 0 16px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') send();
    },
    placeholder: "Pergunte sobre esta tela\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      background: 'none',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      color: 'var(--foreground)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: send,
    "aria-label": "Enviar",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 34,
      height: 34,
      background: 'hsl(var(--primary-hsl) / 0.12)',
      border: 'none',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(TpIcon, {
    name: "arrow-up",
    size: 15,
    color: "var(--primary)"
  }))))));
}
window.TutorPanel = TutorPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/TutorPanel.jsx", error: String((e && e.message) || e) }); }

// cursos/aurora-data.js
try { (() => {
/* aurora-data.js — curadoria que a Aurora usa para guiar o aluno.
 * Tudo que pode ser encontrado na plataforma: aulas, mentorias, gravações,
 * materiais e prompts. Fonte única do catálogo do assistente.
 */
window.AuroraData = {
  greeting: 'Oi, eu sou a Aurora — sua guia na Academia Lendár[IA]. Me diz o que você quer aprender ou resolver e eu te levo direto à aula, mentoria, gravação, material ou prompt certo.',
  suggestions: [{
    q: 'Como integro a API da Hotmart?',
    a: 'A aula "Conectando Hotmart via API" cobre isso passo a passo — e tem o prompt "Gerador de token Hotmart" pra acelerar. Procure por "Hotmart" no acervo aqui ao lado.'
  }, {
    q: 'Tem mentoria sobre vendas?',
    a: 'Tem sim: a "Mentoria de Vendas Magnéticas" acontece a cada quinzena, e a última gravação já está no acervo. Filtre por Mentorias pra ver a agenda.'
  }, {
    q: 'Onde estão as gravações ao vivo?',
    a: 'Todas as gravações dos plantões e workshops ficam no acervo de Gravações — filtrei as mais recentes pra você no painel ao lado.'
  }, {
    q: 'Quero um prompt pra revisar texto',
    a: 'O prompt "Revisor de marketing" faz exatamente isso: avalia clareza, aderência à voz da marca e risco de promessa exagerada. Filtre por Prompts e é só copiar.'
  }],
  fallback: 'Boa. Deixa eu vasculhar o acervo — use os filtros (aulas, mentorias, gravações, materiais, prompts) ou me dê mais um detalhe que eu encontro o caminho mais curto pra você.',
  categories: [{
    key: 'aulas',
    label: 'Aulas',
    icon: 'play'
  }, {
    key: 'mentorias',
    label: 'Mentorias',
    icon: 'group'
  }, {
    key: 'gravacoes',
    label: 'Gravações',
    icon: 'video-camera'
  }, {
    key: 'materiais',
    label: 'Materiais',
    icon: 'page'
  }, {
    key: 'prompts',
    label: 'Prompts',
    icon: 'sparks'
  }],
  items: [
  // ── Aulas ────────────────────────────────────────────────
  {
    cat: 'aulas',
    icon: 'play',
    title: 'Abertura — O que é um Operador de IA',
    meta: 'Aula · 18 min',
    action: 'Assistir',
    href: 'Player - PS AIOX Fundamentals.html'
  }, {
    cat: 'aulas',
    icon: 'play',
    title: 'Mapa mental: do prompt ao processo',
    meta: 'Aula · 21 min',
    action: 'Assistir',
    href: 'Player - PS AIOX Fundamentals.html'
  }, {
    cat: 'aulas',
    icon: 'play',
    title: 'Conectando Hotmart via API',
    meta: 'Aula · 20 min',
    action: 'Assistir',
    href: 'Player - PS AIOX Fundamentals.html'
  }, {
    cat: 'aulas',
    icon: 'play',
    title: 'Anatomia de uma automação confiável',
    meta: 'Aula · 19 min',
    action: 'Assistir',
    href: 'Player - PS AIOX Fundamentals.html'
  },
  // ── Mentorias ────────────────────────────────────────────
  {
    cat: 'mentorias',
    icon: 'group',
    title: 'Estratégia 1:1 com Alan Nicolas',
    meta: 'Mentoria · sob agendamento',
    action: 'Agendar',
    href: '../comunidade/Eventos.html'
  }, {
    cat: 'mentorias',
    icon: 'group',
    title: 'Plantão AIOX — debugging de agentes',
    meta: 'Mentoria · toda semana',
    action: 'Ver agenda',
    href: '../comunidade/Eventos.html'
  }, {
    cat: 'mentorias',
    icon: 'group',
    title: 'Vendas Magnéticas',
    meta: 'Mentoria · quinzenal',
    action: 'Ver agenda',
    href: '../comunidade/Eventos.html'
  },
  // ── Gravações ────────────────────────────────────────────
  {
    cat: 'gravacoes',
    icon: 'video-camera',
    title: 'Plantão AIOX · Semana 23',
    meta: 'Gravação · 1h12',
    action: 'Assistir',
    href: '../comunidade/Eventos.html'
  }, {
    cat: 'gravacoes',
    icon: 'video-camera',
    title: 'Workshop: Vibe Coding ao vivo',
    meta: 'Gravação · 58 min',
    action: 'Assistir',
    href: '../comunidade/Eventos.html'
  }, {
    cat: 'gravacoes',
    icon: 'video-camera',
    title: 'Clube do Livro · Disciplina Positiva',
    meta: 'Gravação · 47 min',
    action: 'Assistir',
    href: '../comunidade/Eventos.html'
  },
  // ── Materiais ────────────────────────────────────────────
  {
    cat: 'materiais',
    icon: 'page',
    title: 'Slides — AIOX Fundamentals',
    meta: 'PDF · 4,2 MB',
    action: 'Baixar',
    href: 'Player - PS AIOX Fundamentals.html'
  }, {
    cat: 'materiais',
    icon: 'page',
    title: 'Checklist — Preparar contas (Hotmart + ClickUp)',
    meta: 'PDF · 1 página',
    action: 'Baixar',
    href: 'Player - PS AIOX Fundamentals.html'
  }, {
    cat: 'materiais',
    icon: 'table-2-columns',
    title: 'Mapa de 3 processos repetitivos',
    meta: 'Planilha · modelo',
    action: 'Baixar',
    href: 'Player - PS AIOX Fundamentals.html'
  },
  // ── Prompts ──────────────────────────────────────────────
  {
    cat: 'prompts',
    icon: 'sparks',
    title: 'Revisor de marketing (aprovar texto)',
    meta: 'Prompt · copiar',
    action: 'Copiar'
  }, {
    cat: 'prompts',
    icon: 'sparks',
    title: 'Gerador de tarefas no ClickUp',
    meta: 'Prompt · copiar',
    action: 'Copiar'
  }, {
    cat: 'prompts',
    icon: 'sparks',
    title: 'Auditor de agentes — checagem de ações',
    meta: 'Prompt · copiar',
    action: 'Copiar'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/aurora-data.js", error: String((e && e.message) || e) }); }

// cursos/curso-data.js
try { (() => {
/* curso-data.js — Mock data para as páginas de curso do Design System.
 *
 * O shape do objeto `course` bate exatamente com a interface Course em:
 *   app/components/lms/course-detail/types.ts
 *
 * Campos prefixados com _ são DS-only (não existem no tipo do app).
 * Campos sem _ podem ser copiados diretamente para o fallback-data.ts do app.
 *
 * Mapeamento de páginas → rotas do app:
 *   CourseDetail.jsx   →  /cursos/:slug           (LmsCourseDetailTemplate)
 *   LessonPlayer.jsx   →  /cursos/:slug/aula/:id   (LmsStudentTemplate)
 *   ProntoSocorro.jsx  →  /cursos/pronto-socorro   (rota dedicada)
 *   CourseTopbar.jsx   →  LmsTopbar.tsx            (componente compartilhado)
 */
(function () {
  // ── utilidades (mantidas para compatibilidade) ──────────────────────────
  function fmt(sec) {
    if (sec == null) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = sec % 60;
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
  }
  function humanTotal(sec) {
    let m = Math.round(sec / 60);
    const h = Math.floor(m / 60);
    m = m % 60;
    if (h > 0) return m > 0 ? h + 'h ' + m + 'min' : h + 'h';
    return m + 'min';
  }

  // ── módulos + aulas ──────────────────────────────────────────────────────
  // Campos core (id, title, duration, status) batem com Module e Lesson types.
  // Campos _accent, _n, _date, _durSec são DS-only.

  const modules = [{
    id: 'm1',
    title: 'Fundamentos do AIOX',
    duration: '1h 22min',
    _accent: '#C9B298',
    lessons: [{
      id: 'l1',
      title: 'Abertura — o que é o sistema AIOX',
      duration: '18:48',
      status: 'current',
      _n: 1,
      _date: '29 mai 2026',
      _durSec: 1128
    }, {
      id: 'l2',
      title: 'Os quatro pilares de um agente operacional',
      duration: '23:12',
      status: 'locked',
      _n: 2,
      _date: '02 jun 2026',
      _durSec: 1392
    }, {
      id: 'l3',
      title: 'Mapa mental: do prompt ao processo',
      duration: '21:00',
      status: 'locked',
      _n: 3,
      _date: '05 jun 2026',
      _durSec: 1260
    }, {
      id: 'l4',
      title: 'Anatomia de uma automação confiável',
      duration: '19:06',
      status: 'locked',
      _n: 4,
      _date: '15 mai 2026',
      _durSec: 1146
    }]
  }, {
    id: 'm2',
    title: 'Instalação & Ambiente',
    duration: '1h 23min',
    _accent: '#538096',
    lessons: [{
      id: 'l5',
      title: 'Preparando a stack: contas e chaves',
      duration: '23:22',
      status: 'locked',
      _n: 5,
      _date: '19 mai 2026',
      _durSec: 1402
    }, {
      id: 'l6',
      title: 'Conectando Hotmart via API',
      duration: '20:54',
      status: 'locked',
      _n: 6,
      _date: '26 mai 2026',
      _durSec: 1254
    }, {
      id: 'l7',
      title: 'ClickUp como cérebro operacional',
      duration: '21:27',
      status: 'locked',
      _n: 7,
      _date: '06 mar 2026',
      _durSec: 1287
    }, {
      id: 'l8',
      title: 'Webhooks sem mistério',
      duration: '17:12',
      status: 'locked',
      _n: 8,
      _date: '10 mar 2026',
      _durSec: 1032
    }]
  }, {
    id: 'm3',
    title: 'Negócios & Estratégia',
    duration: '1h 50min',
    _accent: '#40C8E0',
    lessons: [{
      id: 'l9',
      title: 'Desenhando o produto antes do fluxo',
      duration: '13:48',
      status: 'locked',
      _n: 9,
      _date: '13 mar 2026',
      _durSec: 828
    }, {
      id: 'l10',
      title: 'Campos de cancelamento e retenção',
      duration: '22:46',
      status: 'locked',
      _n: 10,
      _date: '17 fev 2026',
      _durSec: 1366
    }, {
      id: 'l11',
      title: 'IA que aprova textos de marketing',
      duration: '24:23',
      status: 'locked',
      _n: 11,
      _date: '20 fev 2026',
      _durSec: 1463
    }, {
      id: 'l12',
      title: 'Quando a IA inventa — supervisão humana',
      duration: '23:25',
      status: 'locked',
      _n: 12,
      _date: '24 fev 2026',
      _durSec: 1405
    }, {
      id: 'l13',
      title: 'Métricas que importam para o operador',
      duration: '25:59',
      status: 'locked',
      _n: 13,
      _date: '27 fev 2026',
      _durSec: 1559
    }]
  }, {
    id: 'm4',
    title: 'Projetos & Comunidade',
    duration: '1h 24min',
    _accent: '#5E5CE6',
    lessons: [{
      id: 'l14',
      title: 'UX Pro: o novo espaço de Q&A',
      duration: '28:09',
      status: 'locked',
      _n: 14,
      _date: '03 mar 2026',
      _durSec: 1689
    }, {
      id: 'l15',
      title: 'Squads & Skills: biblioteca de fluxos',
      duration: '27:04',
      status: 'locked',
      _n: 15,
      _date: '06 mar 2026',
      _durSec: 1624
    }, {
      id: 'l16',
      title: 'Projeto final — automatize seu próprio funil',
      duration: '29:08',
      status: 'locked',
      _n: 16,
      _date: '10 mar 2026',
      _durSec: 1748
    }]
  }];

  // ── course ───────────────────────────────────────────────────────────────
  // Campos core batem 1:1 com a interface Course em course-detail/types.ts.
  // Copie esses campos direto para fallback-data.ts no app.

  window.CursoData = {
    fmt,
    humanTotal,
    course: {
      // ── CORE — matches Course type ──────────────────────────────────────
      id: 'ps-aiox-fundamentals',
      title: 'PS AIOX Fundamentals',
      // Instructor (flat, como o app espera)
      author: 'Sidney Fernandes de Sousa',
      instructorAvatar: 'https://i.pravatar.cc/160?u=sidney-aiox',
      instructorSlug: 'sidney-fernandes',
      instructorBio: 'Lidera a operação de automação da Academia, desenhando agentes que conectam Hotmart, ClickUp e a stack de IA do time. Já treinou centenas de operadores no método AIOX.',
      description: 'Construa agentes de IA que executam processos operacionais ponta a ponta — integrando Hotmart, ClickUp e LLMs com supervisão humana nos pontos críticos.',
      progress: 0,
      completedLessons: 0,
      totalLessons: 16,
      rating: null,
      students: 1240,
      lastUpdated: 'jun. de 2026',
      cover: null,
      modules,
      // ── DS-ONLY — não existem em Course type, usados apenas nas páginas DS ──
      _titleAccent: 'Fundamentals',
      _tagline: 'Do prompt ao processo: construa agentes que operam seu negócio.',
      _category: 'Fundamentos',
      _level: 'Dev No-Code',
      _instructorRole: 'Gestor de Automação · Academia Lendár[IA]',
      _totalDuration: '6h',
      _outcomes: ['Construir agentes de IA que executam processos operacionais ponta a ponta', 'Integrar Hotmart e ClickUp via API e webhooks com segurança', 'Desenhar o produto antes do fluxo para evitar retrabalho', 'Aprovar textos de marketing com IA mantendo supervisão humana', 'Definir as métricas que realmente guiam a operação', 'Lançar seu primeiro funil automatizado na comunidade'],
      _lessonSummary: {
        lede: 'Nesta sessão de abertura, Sidney apresenta o sistema AIOX em operação: como um agente conecta a API da Hotmart, gerencia detalhes de produto e cria fluxos de marketing — sempre com a IA propondo e o humano aprovando.',
        points: ['Um novo produto integra a API da Hotmart para gerenciar detalhes, campos de cancelamento e criar fluxos de marketing, com a IA aprovando textos e atualizando chamados.', 'A auditoria no ClickUp revelou que a IA inventou tarefas e marcou pessoas erradas — reforçando a necessidade de supervisão humana em cada etapa.', 'Rodrigo Feldman anunciou o espaço "UX Pro" na comunidade para Q&A, squads/testes e uma biblioteca de "Squads & Skills" com lançamentos semanais.']
      }
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/curso-data.js", error: String((e && e.message) || e) }); }

// cursos/explorar-data.js
try { (() => {
/* explorar-data.js — Mock data da tela Explorar Cursos.
 *
 * Shape pensado para mapear no catálogo real do LMS:
 *   category.key   → slug de categoria
 *   course.level   → 1 INICIANTE · 2 INTERMEDIÁRIO · 3 AVANÇADO · 4 LENDÁRIO
 *   course.status  → 'disponivel' | 'embreve' | 'aovivo'
 */
(function () {
  const CATEGORIES = [{
    key: 'fundamentos',
    n: '01',
    label: 'Fundamentos',
    color: '#C9B298'
  }, {
    key: 'agentes',
    n: '02',
    label: 'Agentes',
    color: '#5E5CE6'
  }, {
    key: 'automacao',
    n: '03',
    label: 'Automação',
    color: '#40C8E0'
  }, {
    key: 'programacao',
    n: '04',
    label: 'Programação',
    color: '#30D158'
  }, {
    key: 'negocios',
    n: '05',
    label: 'Negócios & Vendas',
    color: '#D9A441'
  }, {
    key: 'mentalidade',
    n: '06',
    label: 'Mentalidade',
    color: '#FF8A3D'
  }];
  const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Lendário'];
  const DETAIL_URL = 'Curso - PS AIOX Fundamentals.html';
  const COURSES = [
  // ── Fundamentos ──
  {
    id: 'intro-ia',
    icon: 'brain',
    cat: 'fundamentos',
    title: 'Introdução à IA',
    desc: 'O vocabulário e os modelos mentais para começar com o pé direito.',
    instructor: 'Alan Nicolas',
    lessons: 8,
    duration: '2h',
    level: 1,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'aiox-fund',
    icon: 'magic-wand',
    cat: 'fundamentos',
    title: 'PS AIOX Fundamentals',
    desc: 'Do prompt ao processo: construa agentes que operam seu negócio.',
    instructor: 'Sidney Fernandes',
    lessons: 16,
    duration: '6h',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'prompt-lendario',
    icon: 'chat-bubble',
    cat: 'fundamentos',
    title: 'Engenharia de Prompt Lendária',
    desc: 'Instruções que transformam modelos em especialistas.',
    instructor: 'Alan Nicolas',
    lessons: 10,
    duration: '3h',
    level: 1,
    status: 'disponivel',
    href: DETAIL_URL
  },
  // ── Agentes ──
  {
    id: 'agentes-pratica',
    icon: 'cpu',
    cat: 'agentes',
    title: 'Agentes Autônomos na Prática',
    desc: 'Desenhe, instrumente e supervisione agentes que executam de verdade.',
    instructor: 'Adávio Tittoni',
    lessons: 12,
    duration: '4h 30min',
    level: 3,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'rag-zero',
    icon: 'book',
    cat: 'agentes',
    title: 'RAG do Zero',
    desc: 'Bases de conhecimento que respondem com a sua verdade.',
    instructor: 'Day Cavalcanti',
    lessons: 9,
    duration: '3h',
    level: 3,
    status: 'embreve'
  }, {
    id: 'mentes-sinteticas',
    icon: 'user',
    cat: 'agentes',
    title: 'Mentes Sintéticas',
    desc: 'Clones cognitivos: construa e converse com grandes pensadores.',
    instructor: 'Day Cavalcanti',
    lessons: 11,
    duration: '4h',
    level: 4,
    status: 'disponivel',
    href: DETAIL_URL
  },
  // ── Automação ──
  {
    id: 'manip-dados',
    icon: 'graph-up',
    cat: 'automacao',
    title: 'Descomplicando a Manipulação de Dados',
    desc: 'Planilhas, APIs e webhooks sem mistério.',
    instructor: 'Alan Nicolas',
    lessons: 40,
    duration: '9h',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'funis-auto',
    icon: 'filter',
    cat: 'automacao',
    title: 'Funis no Piloto Automático',
    desc: 'Hotmart, ClickUp e IA: a esteira operacional completa.',
    instructor: 'Sidney Fernandes',
    lessons: 14,
    duration: '5h',
    level: 2,
    status: 'embreve'
  }, {
    id: 'whatsapp-ia',
    icon: 'send-diagonal',
    cat: 'automacao',
    title: 'Atendimento com IA no WhatsApp',
    desc: 'Do primeiro oi ao pós-venda, sem fila de espera.',
    instructor: 'Sidney Fernandes',
    lessons: 13,
    duration: '4h 30min',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  },
  // ── Programação ──
  {
    id: 'supabase',
    icon: 'server',
    cat: 'programacao',
    title: 'Supabase do Zero: Backend Completo sem Escrever Backend',
    desc: 'Banco, auth e API prontos para seus apps de IA.',
    instructor: 'Klaus Deor',
    lessons: 59,
    duration: '12h',
    level: 3,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'vibecoding',
    icon: 'code',
    cat: 'programacao',
    title: 'Vibecoding — Criação de Apps sem Código com IA',
    desc: 'Da ideia ao app publicado, conversando com a IA.',
    instructor: 'Lucas Charão',
    lessons: 7,
    duration: '2h 30min',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'apis-integracoes',
    icon: 'terminal',
    cat: 'programacao',
    title: 'APIs & Integrações na Prática',
    desc: 'Conecte qualquer ferramenta com confiança.',
    instructor: 'Klaus Deor',
    lessons: 18,
    duration: '6h',
    level: 3,
    status: 'disponivel',
    href: DETAIL_URL
  },
  // ── Negócios ──
  {
    id: 'copy-ia',
    icon: 'edit-pencil',
    cat: 'negocios',
    title: 'Copy com IA',
    desc: 'Textos que vendem, aprovados com supervisão humana.',
    instructor: 'Gabriel Fofonka',
    lessons: 12,
    duration: '4h',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'business-ia',
    icon: 'suitcase',
    cat: 'negocios',
    title: 'Business IA',
    desc: 'Modelos de negócio nativos de IA, do zero ao recorrente.',
    instructor: 'Alan Nicolas',
    lessons: 8,
    duration: '3h',
    level: 4,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'precificacao-ia',
    icon: 'dollar',
    cat: 'negocios',
    title: 'Precificação Inteligente',
    desc: 'Quanto cobrar por soluções de IA — e como justificar.',
    instructor: 'Bruno Gentil',
    lessons: 6,
    duration: '2h',
    level: 2,
    status: 'embreve'
  },
  // ── Vendas ──
  {
    id: 'equipe-vendas',
    icon: 'group',
    cat: 'negocios',
    title: 'Como Formar Equipe de Vendas',
    desc: 'Recrute, treine e escale um time comercial.',
    instructor: 'Alan Nicolas',
    lessons: 22,
    duration: '7h',
    level: 3,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'ciencia-vendas',
    icon: 'flask',
    cat: 'negocios',
    title: 'Ciência das Vendas do Vale do Silício',
    desc: 'Playbooks de SaaS adaptados à realidade brasileira.',
    instructor: 'Fran Martins',
    lessons: 14,
    duration: '5h',
    level: 4,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'vendas-magneticas',
    icon: 'magnet',
    cat: 'negocios',
    title: 'Vendas Magnéticas',
    desc: 'Atraia em vez de perseguir: o funil magnético.',
    instructor: 'Alan Nicolas',
    lessons: 22,
    duration: '6h',
    level: 2,
    status: 'disponivel',
    href: DETAIL_URL
  },
  // ── Mentalidade ──
  {
    id: 'zero-to-one',
    icon: 'rocket',
    cat: 'mentalidade',
    title: 'Método Zero To One',
    desc: 'A mentalidade de quem constrói o que ainda não existe.',
    instructor: 'Alan Nicolas',
    lessons: 7,
    duration: '2h',
    level: 1,
    status: 'disponivel',
    href: DETAIL_URL
  }, {
    id: 'foco-lendario',
    icon: 'eye',
    cat: 'mentalidade',
    title: 'Foco Lendário',
    desc: 'Atenção profunda numa era de distração infinita.',
    instructor: 'Adriano De Marqui',
    lessons: 9,
    duration: '2h 30min',
    level: 1,
    status: 'disponivel',
    href: DETAIL_URL
  }];
  const TRACKS = [{
    n: '01',
    title: 'Operador de IA',
    accent: 'IA',
    desc: 'Do primeiro prompt ao agente que opera seu negócio sozinho.',
    courses: 3,
    duration: '14h',
    range: 'Iniciante → Avançado',
    href: 'Trilha - Operador de IA.html'
  }, {
    n: '02',
    title: 'Construtor No-Code',
    accent: 'No-Code',
    desc: 'Tire apps do papel sem escrever uma linha de backend.',
    courses: 3,
    duration: '18h',
    range: 'Intermediário → Avançado',
    href: 'Trilhas.html'
  }, {
    n: '03',
    title: 'Vendas Lendárias',
    accent: 'Lendárias',
    desc: 'Monte e escale uma máquina de vendas potencializada por IA.',
    courses: 4,
    duration: '11h',
    range: 'Intermediário → Lendário',
    href: 'Trilhas.html'
  }];

  // Gamificação — espelha o ranking da Comunidade (Season 04)
  const GAME = {
    streak: 12,
    record: 21,
    week: [{
      d: 'S',
      done: true
    }, {
      d: 'T',
      done: true
    }, {
      d: 'Q',
      done: true
    }, {
      d: 'Q',
      done: false
    }, {
      d: 'S',
      done: true,
      today: true
    }, {
      d: 'S',
      done: false
    }, {
      d: 'D',
      done: false
    }],
    xp: '1.240',
    xpWeek: '+120 esta semana',
    rank: '#37',
    division: 'Divisão Ouro',
    rankHref: '../comunidade/Ranking.html'
  };
  const RESUME = {
    course: 'PS AIOX Fundamentals',
    lesson: 'Aula 01 · Abertura — o que é o sistema AIOX',
    progress: '6% · 18 MIN RESTANTES',
    href: 'Player - PS AIOX Fundamentals.html'
  };
  window.ExplorarData = {
    CATEGORIES,
    LEVELS,
    COURSES,
    TRACKS,
    RESUME,
    GAME
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/explorar-data.js", error: String((e && e.message) || e) }); }

// cursos/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/image-slot.js", error: String((e && e.message) || e) }); }

// cursos/onboarding-data.js
try { (() => {
/* onboarding-data.js — Onboarding inteligente (porta de entrada da EAD do Futuro).
 *
 * Captura 4 sinais (nicho · objetivo · nível · tempo) e converte em:
 *   recommend(answers)            → trilha + projeto + match + porquê + ritmo + ponto de partida
 *   draftPost(answers, name, tom) → rascunho da apresentação na comunidade
 *   sentence(answers)             → partes da frase "foi isso que entendi" (valores clicáveis)
 *
 * Depende (em runtime) de window.TrilhasData e window.ProjetosData.
 * O resultado alimenta: match dos Projetos, "Continue" das Trilhas, contexto do Tutor, Perfil.
 */
(function () {
  const USER = {
    name: 'Camila Duarte',
    avatar: 'https://i.pravatar.cc/80?u=camila-d'
  };

  // valores discretos — "+XP em uma linha, sem fanfarra"
  const XP = {
    perfil: 20,
    post: 30,
    trilha: 40
  };
  const QUESTIONS = [{
    key: 'nicho',
    cap: 'Seu contexto',
    title: 'Em que negócio você atua?',
    sub: 'Define quais projetos fazem sentido para você.',
    options: [{
      v: 'infoprodutos',
      label: 'Infoprodutos',
      desc: 'Cursos, mentorias, lançamentos',
      phrase: 'atua com infoprodutos',
      short: 'infoprodutos'
    }, {
      v: 'servicos',
      label: 'Serviços & consultoria',
      desc: 'Clientes, projetos, entregas',
      phrase: 'vive de serviços e consultoria',
      short: 'serviços'
    }, {
      v: 'ecommerce',
      label: 'E-commerce',
      desc: 'Loja, marketplace, logística',
      phrase: 'toca um e-commerce',
      short: 'e-commerce'
    }, {
      v: 'conteudo',
      label: 'Conteúdo & audiência',
      desc: 'Creator, newsletter, comunidade',
      phrase: 'constrói audiência com conteúdo',
      short: 'conteúdo'
    }, {
      v: 'empresa',
      label: 'Empresa / time',
      desc: 'Você opera dentro de uma empresa',
      phrase: 'opera dentro de uma empresa',
      short: 'empresas'
    }, {
      v: 'comecando',
      label: 'Ainda não tenho negócio',
      desc: 'Quer começar com IA do jeito certo',
      phrase: 'está começando do zero',
      short: 'quem está começando'
    }]
  }, {
    key: 'objetivo',
    cap: 'Seu objetivo',
    title: 'O que você quer destravar primeiro?',
    sub: 'Define qual trilha eu recomendo no final.',
    options: [{
      v: 'automatizar',
      label: 'Automatizar a operação',
      desc: 'Menos trabalho manual, mais esteira rodando',
      phrase: 'automatizar a operação'
    }, {
      v: 'vender',
      label: 'Vender mais',
      desc: 'Funil, leads e copy com IA',
      phrase: 'vender mais'
    }, {
      v: 'produto',
      label: 'Criar um produto com IA',
      desc: 'Do zero ao app ou agente publicado',
      phrase: 'criar um produto com IA'
    }, {
      v: 'dados',
      label: 'Decidir com dados',
      desc: 'Os números do negócio, lidos pela IA',
      phrase: 'decidir com dados'
    }]
  }, {
    key: 'nivel',
    cap: 'Seu ponto de partida',
    title: 'Quanto você já sabe de IA?',
    sub: 'Define onde a sua trilha começa — sem revisão desnecessária.',
    options: [{
      v: 'iniciante',
      label: 'Iniciante',
      desc: 'Pouco ou nenhum contato com IA',
      phrase: 'está dando os primeiros passos em IA'
    }, {
      v: 'intermediario',
      label: 'Intermediário',
      desc: 'Usa no dia a dia, quer ir além do chat',
      phrase: 'já usa IA no dia a dia'
    }, {
      v: 'avancado',
      label: 'Avançado',
      desc: 'Já constrói automações e agentes',
      phrase: 'já constrói automações e agentes'
    }, {
      v: 'lendario',
      label: 'Lendário',
      desc: 'IA é o centro do seu trabalho',
      phrase: 'vive de IA'
    }]
  }, {
    key: 'tempo',
    cap: 'Seu ritmo',
    title: 'Quanto tempo você tem por semana?',
    sub: 'Seja realista — o prazo dos projetos se ajusta a isso.',
    options: [{
      v: 't2',
      label: '2h por semana',
      desc: 'Um encontro curto por dia',
      phrase: '2 horas por semana',
      hours: 2
    }, {
      v: 't4',
      label: '4h por semana',
      desc: 'O ritmo da maioria',
      phrase: '4 horas por semana',
      hours: 4
    }, {
      v: 't6',
      label: '6h por semana',
      desc: 'Para quem quer acelerar',
      phrase: '6 horas por semana',
      hours: 6
    }, {
      v: 't10',
      label: '10h+ por semana',
      desc: 'Imersão total',
      phrase: '10 ou mais horas por semana',
      hours: 10
    }]
  }];
  function optionOf(key, v) {
    const q = QUESTIONS.find(x => x.key === key);
    return q && q.options.find(o => o.v === v) || null;
  }
  function labelOf(key, v) {
    const o = optionOf(key, v);
    return o ? o.label : '';
  }
  function phraseOf(key, v) {
    const o = optionOf(key, v);
    return o ? o.phrase : '';
  }

  // frase do Refletir — partes; as que têm `k` são clicáveis (voltar à pergunta)
  function sentence(a) {
    return [{
      t: 'Você '
    }, {
      k: 'nicho',
      t: phraseOf('nicho', a.nicho)
    }, {
      t: ', quer '
    }, {
      k: 'objetivo',
      t: phraseOf('objetivo', a.objetivo)
    }, {
      t: ', '
    }, {
      k: 'nivel',
      t: phraseOf('nivel', a.nivel)
    }, {
      t: ' e tem '
    }, {
      k: 'tempo',
      t: phraseOf('tempo', a.tempo)
    }, {
      t: ' para isso.'
    }];
  }
  const TRILHA_BY_OBJETIVO = {
    automatizar: 'operador-ia',
    vender: 'vendas-lendarias',
    produto: 'construtor-nocode',
    dados: 'dados-inteligentes'
  };
  const PROJETO_BY_OBJETIVO = {
    automatizar: 'esteira-onboarding',
    vender: 'qualifica-whatsapp',
    produto: 'app-orcamentos',
    dados: 'dashboard-operacao'
  };
  const NICHO_BONUS = {
    infoprodutos: 14,
    servicos: 10,
    ecommerce: 9,
    conteudo: 9,
    empresa: 8,
    comecando: 6
  };
  const TEMPO_BONUS = {
    t2: 2,
    t4: 8,
    t6: 8,
    t10: 6
  };
  const START_BY_NIVEL = {
    iniciante: 'Você começa do item 01 — os fundamentos, sem pressa.',
    intermediario: 'Você começa do item 02 — os fundamentos viram revisão rápida.',
    avancado: 'Você pula os fundamentos — começa direto na prática, no item 03.',
    lendario: 'Pouca aula, muito projeto — você começa pelos itens de entrega.'
  };
  function recommend(a) {
    const T = window.TrilhasData && window.TrilhasData.TRILHAS || [];
    const P = window.ProjetosData && window.ProjetosData.PROJECTS || [];
    const trilha = T.find(t => t.id === (TRILHA_BY_OBJETIVO[a.objetivo] || 'operador-ia')) || T[0];
    const projetoBase = P.find(p => p.id === PROJETO_BY_OBJETIVO[a.objetivo]) || P[0];

    // match transparente: nicho + objetivo + tempo (mesma conta exibida nos Projetos)
    const match = Math.min(96, 70 + (NICHO_BONUS[a.nicho] || 6) + (TEMPO_BONUS[a.tempo] || 6));
    const hours = parseInt(trilha.duration, 10) || 14;
    const tempoOpt = optionOf('tempo', a.tempo);
    const tempoH = tempoOpt && tempoOpt.hours || 4;
    const weeks = Math.max(2, Math.ceil(hours / tempoH));
    const nicho = optionOf('nicho', a.nicho);
    return {
      trilha,
      projeto: Object.assign({}, projetoBase, {
        match
      }),
      why: 'Seu objetivo — ' + phraseOf('objetivo', a.objetivo) + ' — é o destino desta trilha. E os projetos dela falam a língua de ' + (nicho && nicho.short || 'quem constrói') + '.',
      ritmo: '~' + weeks + ' semanas no seu ritmo de ' + tempoH + 'h/semana',
      startNote: START_BY_NIVEL[a.nivel] || START_BY_NIVEL.iniciante
    };
  }
  function draftPost(a, name) {
    const first = (name || USER.name).trim().split(' ')[0];
    const reco = recommend(a);
    const trilhaTitle = reco.trilha ? reco.trilha.title : 'Operador de IA';
    return 'Oi, Lendários! Eu sou a ' + first + '. Eu ' + phraseOf('nicho', a.nicho) + ' e cheguei aqui com um objetivo claro: ' + phraseOf('objetivo', a.objetivo) + '. Estou começando pela trilha ' + trilhaTitle + ' — quem mais está nesse caminho?';
  }
  window.OnboardingData = {
    USER,
    XP,
    QUESTIONS,
    optionOf,
    labelOf,
    phraseOf,
    sentence,
    recommend,
    draftPost
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/onboarding-data.js", error: String((e && e.message) || e) }); }

// cursos/projetos-data.js
try { (() => {
/* projetos-data.js — Mock data de Projetos PBL (EAD do Futuro §3).
 *
 * O match % vem do diagnóstico do onboarding (nicho, objetivo, tempo, nível) —
 * princípio central: o sistema aprende sobre o aluno e adapta tudo.
 * Categorias e níveis são compartilhados com explorar-data.js.
 */
(function () {
  // perfil capturado no onboarding — base transparente do match
  const PROFILE = {
    nicho: 'Infoprodutos',
    objetivo: 'Automatizar a operação',
    tempo: '4h/semana'
  };
  const DETAIL_URL = 'Projeto - Esteira de Onboarding.html';

  // gancho de retorno: um (1) projeto em andamento
  const ONGOING = {
    id: 'esteira-onboarding',
    title: 'Esteira de Onboarding Hotmart → ClickUp',
    stepLabel: 'Etapa 2 de 5',
    due: '21 jun',
    progress: 0.3,
    next: 'Configurar o webhook da Hotmart',
    href: DETAIL_URL
  };

  // projetos personalizados — a aluna descreve o problema, o sistema gera a
  // trilha de aprendizado: marcos, entregáveis, rubrica e cursos de apoio
  const MY_CUSTOM = [{
    id: 'central-notion',
    title: 'Central de Operações no Notion + IA',
    state: 'Trilha pronta',
    trail: 'Trilha gerada · 4 marcos · 5 entregáveis · 2 cursos de apoio',
    created: 'Criado por você · 08 jun',
    href: 'Projeto - Central de Operações.html'
  }];
  const PROJECTS = [{
    id: 'esteira-onboarding',
    cat: 'automacao',
    title: 'Esteira de Onboarding Hotmart → ClickUp',
    desc: 'Cada venda aprovada vira um card de onboarding no ClickUp — sem ninguém tocar em nada.',
    match: 92,
    weeks: '2–3 sem',
    steps: 5,
    level: 2,
    href: DETAIL_URL
  }, {
    id: 'qualifica-whatsapp',
    cat: 'automacao',
    title: 'Agente de Qualificação no WhatsApp',
    desc: 'Um agente que conversa com cada lead, qualifica e agenda só quem está pronto para comprar.',
    match: 87,
    weeks: '3 sem',
    steps: 5,
    level: 2
  }, {
    id: 'rag-conhecimento',
    cat: 'agentes',
    title: 'RAG da Sua Base de Conhecimento',
    desc: 'Seu material respondendo dúvidas de clientes com a sua verdade — não a da internet.',
    match: 81,
    weeks: '2–3 sem',
    steps: 4,
    level: 3
  }, {
    id: 'copy-lancamento',
    cat: 'negocios',
    title: 'Copy de Lançamento Supervisionada',
    desc: 'A sequência completa de um lançamento real, escrita com IA e aprovada por você.',
    match: 74,
    weeks: '2 sem',
    steps: 4,
    level: 2
  }, {
    id: 'app-orcamentos',
    cat: 'programacao',
    title: 'App de Orçamentos sem Código',
    desc: 'Da planilha ao app publicado: orçamentos gerados e enviados em um clique.',
    match: 69,
    weeks: '3 sem',
    steps: 5,
    level: 2
  }, {
    id: 'dashboard-operacao',
    cat: 'programacao',
    title: 'Dashboard da Operação com IA',
    desc: 'Os números do seu negócio, lidos e resumidos por um agente toda manhã.',
    match: 61,
    weeks: '2 sem',
    steps: 4,
    level: 3
  }, {
    id: 'clone-atendimento',
    cat: 'agentes',
    title: 'Clone Cognitivo de Atendimento',
    desc: 'Um clone treinado no seu tom de voz para o primeiro atendimento do funil.',
    match: 55,
    weeks: '3 sem',
    steps: 5,
    level: 4
  }, {
    id: 'funil-magnetico',
    cat: 'negocios',
    title: 'Funil Magnético Instrumentado',
    desc: 'Monte o funil, instrumente cada etapa e descubra onde os leads escapam.',
    match: 48,
    weeks: '2–3 sem',
    steps: 4,
    level: 3
  }];

  // detalhe do projeto em andamento — etapas, rubrica e avaliação transparentes
  const DETAIL = {
    id: 'esteira-onboarding',
    cat: 'automacao',
    titleParts: ['Esteira de Onboarding ', 'Hotmart → ClickUp'],
    status: 'Em andamento',
    desc: 'Cada venda aprovada na Hotmart vira, sozinha, um card de onboarding no ClickUp — boas-vindas enviadas, acesso liberado, time avisado.',
    match: 92,
    why: 'Calculado do seu diagnóstico: Hotmart no seu nicho, objetivo de automatizar a operação e a aula de webhooks que você está cursando no AIOX Fundamentals.',
    weeks: '2–3 semanas',
    due: '21 jun',
    xp: '+180 XP',
    level: 2,
    problem: 'Hoje, toda venda aprovada vira trabalho manual: criar o card, enviar as boas-vindas, liberar o acesso, avisar o time. São uns quinze minutos por venda — e qualquer esquecimento vira reclamação no suporte. Neste projeto você constrói a esteira que elimina esse trabalho, e a entrega final é uma venda real atravessando o fluxo de ponta a ponta.',
    steps: [{
      n: 1,
      title: 'Mapear o fluxo de onboarding',
      deliv: 'Blueprint do fluxo em 1 página',
      est: '~2h',
      state: 'done',
      doneAt: '02 jun'
    }, {
      n: 2,
      title: 'Configurar o webhook da Hotmart',
      deliv: 'Webhook recebendo eventos de venda — log com 3 testes',
      est: '~3h',
      state: 'active'
    }, {
      n: 3,
      title: 'Criar os cards no ClickUp via API',
      deliv: 'Esteira criando cards automaticamente',
      est: '~4h',
      state: 'todo'
    }, {
      n: 4,
      title: 'Testar com venda real e documentar',
      deliv: 'Demo em vídeo de até 3 minutos',
      est: '~2h',
      state: 'todo'
    }, {
      n: 5,
      title: 'Reflexão de entrega',
      deliv: 'O que funcionou, o que você faria diferente',
      est: '~30min',
      state: 'todo',
      required: true
    }],
    rubric: [{
      name: 'Funcionamento',
      weight: '40%',
      desc: 'A esteira roda de ponta a ponta com uma venda real, sem intervenção manual.'
    }, {
      name: 'Robustez',
      weight: '25%',
      desc: 'Trata retries do webhook e eventos duplicados sem criar cards repetidos.'
    }, {
      name: 'Clareza',
      weight: '20%',
      desc: 'Outra pessoa replica o fluxo só com a sua documentação.'
    }, {
      name: 'Reflexão',
      weight: '15%',
      desc: 'Análise honesta das decisões, dos erros e do que faria diferente.'
    }],
    evaluator: {
      name: 'Sidney Fernandes',
      avatar: 'https://i.pravatar.cc/80?u=sidney-f',
      note: 'Avalia este projeto · feedback em até 48h'
    }
  };

  // tela interna do projeto personalizado — trilha gerada pela IA
  const DETAIL_CUSTOM = {
    id: 'central-notion',
    titleParts: ['Central de Operações no ', 'Notion + IA'],
    status: 'Trilha pronta',
    created: '08 jun',
    desc: 'Uma central única no Notion onde tarefas, clientes e conteúdo se organizam sozinhos — alimentada por formulários e automações com IA.',
    problem: '“Minha operação vive espalhada: tarefas no WhatsApp, clientes numa planilha, conteúdo no Drive. Perco tempo procurando as coisas e nada conversa com nada. Queria uma central no Notion que se organizasse sozinha.”',
    problemNote: 'Descrito por você · 08 jun — a trilha abaixo foi gerada a partir disso.',
    weeks: '4–6 semanas',
    xp: '+220 XP',
    marcos: [{
      n: 1,
      title: 'Mapear a operação e desenhar a central',
      deliv: 'Blueprint da central em 1 página',
      est: '~3h',
      support: {
        label: 'Bases e relações no Notion',
        course: 'Descomplicando a Manipulação de Dados',
        time: '40 min'
      }
    }, {
      n: 2,
      title: 'Estruturar as bases no Notion',
      deliv: 'Workspace com tarefas, clientes e conteúdo relacionados',
      est: '~4h',
      support: {
        label: 'Modelagem de dados sem mistério',
        course: 'Descomplicando a Manipulação de Dados',
        time: '35 min'
      }
    }, {
      n: 3,
      title: 'Conectar formulários e automações com IA',
      deliv: 'Fluxo criando e classificando registros sozinho',
      est: '~5h',
      support: {
        label: 'Webhooks e APIs na prática',
        course: 'APIs & Integrações na Prática',
        time: '50 min'
      }
    }, {
      n: 4,
      title: 'Operar por uma semana e documentar',
      deliv: 'Demo em vídeo de até 3 minutos + reflexão de entrega',
      est: '~3h',
      required: true
    }],
    rubric: [{
      name: 'Centralização',
      weight: '35%',
      desc: 'Tarefas, clientes e conteúdo vivem na central — sem planilhas paralelas.'
    }, {
      name: 'Automação',
      weight: '30%',
      desc: 'Registros entram e se classificam sem trabalho manual.'
    }, {
      name: 'Adoção real',
      weight: '20%',
      desc: 'Uma semana de uso de verdade, com os dados do seu negócio.'
    }, {
      name: 'Reflexão',
      weight: '15%',
      desc: 'Análise honesta das decisões e do que faria diferente.'
    }],
    evaluator: {
      name: 'Sidney Fernandes',
      avatar: 'https://i.pravatar.cc/80?u=sidney-f',
      note: 'Rubrica aplicada pelo Tutor IA · revisão humana'
    }
  };
  window.ProjetosData = {
    PROFILE,
    PROJECTS,
    ONGOING,
    MY_CUSTOM,
    DETAIL,
    DETAIL_CUSTOM
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/projetos-data.js", error: String((e && e.message) || e) }); }

// cursos/trilhas-data.js
try { (() => {
/* trilhas-data.js — Mock data das Trilhas (jornada de aprendizado ordenada).
 *
 * Uma trilha é uma sequência de cursos com começo, meio e certificação.
 * A interna é desenhada como uma "trilha" de verdade: espinha + nós de estado.
 *   module.state : 'done' | 'active' | 'locked'
 * Ícones/níveis/categorias vêm de explorar-data.js.
 */
(function () {
  const DETAIL_URL = 'Trilha - Operador de IA.html';

  // gancho de retorno: a trilha em que a aluna está
  const ONGOING = {
    id: 'operador-ia',
    title: 'Operador de IA',
    accent: 'IA',
    done: 2,
    total: 6,
    nextModule: 'PS AIOX Fundamentals',
    href: DETAIL_URL
  };
  const TRILHAS = [{
    id: 'operador-ia',
    n: '01',
    title: 'Operador de IA',
    accent: 'IA',
    desc: 'Do primeiro prompt ao agente que opera seu negócio sozinho.',
    itens: 6,
    compose: '2 cursos · 2 projetos · 1 módulo · 1 aula',
    duration: '14h',
    range: 'Iniciante → Avançado',
    done: 2,
    status: 'andamento',
    href: DETAIL_URL
  }, {
    id: 'construtor-nocode',
    n: '02',
    title: 'Construtor No-Code',
    accent: 'No-Code',
    desc: 'Tire apps do papel sem escrever uma linha de backend.',
    itens: 7,
    compose: '3 cursos · 2 projetos · 2 aulas',
    duration: '18h',
    range: 'Intermediário → Avançado',
    done: 0,
    status: 'novo'
  }, {
    id: 'vendas-lendarias',
    n: '03',
    title: 'Vendas Lendárias',
    accent: 'Lendárias',
    desc: 'Monte e escale uma máquina de vendas potencializada por IA.',
    itens: 5,
    compose: '4 cursos · 1 projeto',
    duration: '11h',
    range: 'Intermediário → Lendário',
    done: 0,
    status: 'disponivel'
  }, {
    id: 'dados-inteligentes',
    n: '04',
    title: 'Dados Inteligentes',
    accent: 'Inteligentes',
    desc: 'Colete, conecte e leia os números do seu negócio com IA.',
    itens: 6,
    compose: '3 cursos · 1 módulo · 2 projetos',
    duration: '16h',
    range: 'Iniciante → Avançado',
    done: 0,
    status: 'disponivel'
  }, {
    id: 'mente-lendaria',
    n: '05',
    title: 'Mente Lendária',
    accent: 'Lendária',
    desc: 'Foco, método e mentalidade de quem constrói o que não existe.',
    itens: 4,
    compose: '3 cursos · 1 aula',
    duration: '7h',
    range: 'Iniciante',
    done: 0,
    status: 'disponivel'
  }];

  // trilha aberta — a jornada como uma trilha de verdade
  const DETAIL = {
    id: 'operador-ia',
    titleParts: ['Operador de ', 'IA'],
    desc: 'Uma jornada do zero ao agente em produção. Cada módulo abre o próximo — e termina com a sua certificação de Operador de IA.',
    range: 'Iniciante → Avançado',
    duration: '14h',
    activeIdx: 2,
    xpDone: '160',
    xpTotal: '890',
    // itens heterogêneos: aula | modulo | curso | projeto
    modules: [{
      kind: 'aula',
      id: 'boas-vindas',
      title: 'Boas-vindas: como pensar em IA',
      desc: 'O mapa da jornada e a mentalidade certa antes do primeiro clique.',
      skills: ['O mapa da sua trilha'],
      duration: '12 min',
      xp: '40',
      state: 'done',
      href: 'Player - PS AIOX Fundamentals.html'
    }, {
      kind: 'curso',
      id: 'intro-ia',
      title: 'Introdução à IA',
      desc: 'O curso que dá o vocabulário e os modelos mentais para começar bem.',
      skills: ['Modelos mentais de IA', 'Onde a IA cabe no negócio'],
      lessons: 8,
      duration: '2h',
      level: 1,
      xp: '120',
      state: 'done',
      href: 'Curso - PS AIOX Fundamentals.html'
    }, {
      kind: 'modulo',
      id: 'prompt-mod',
      title: 'Prompts que viram especialistas',
      desc: 'Um módulo focado: instruções que transformam o modelo num especialista seu.',
      skills: ['Prompts de especialista', 'Padrões reutilizáveis'],
      lessons: 4,
      duration: '1h20',
      xp: '90',
      state: 'active',
      href: 'Curso - PS AIOX Fundamentals.html'
    }, {
      kind: 'projeto',
      id: 'esteira-onboarding',
      title: 'Esteira de Onboarding Hotmart → ClickUp',
      desc: 'Aplique o que aprendeu: cada venda aprovada vira um onboarding automático.',
      deliverable: 'Uma venda real atravessando o fluxo de ponta a ponta',
      steps: 5,
      weeks: '2–3 sem',
      xp: '220',
      state: 'locked',
      marker: 'Marco · sua primeira entrega real',
      href: 'Projeto - Esteira de Onboarding.html'
    }, {
      kind: 'curso',
      id: 'apis-integracoes',
      title: 'APIs & Integrações na Prática',
      desc: 'O curso que conecta seu agente a qualquer ferramenta com confiança.',
      skills: ['Conectar qualquer ferramenta', 'Autenticação sem dor'],
      lessons: 18,
      duration: '6h',
      level: 3,
      xp: '180',
      state: 'locked',
      href: 'Curso - PS AIOX Fundamentals.html'
    }, {
      kind: 'projeto',
      id: 'qualifica-whatsapp',
      title: 'Agente de Qualificação no WhatsApp',
      desc: 'O projeto final: um agente que conversa, qualifica e agenda sozinho.',
      deliverable: 'Agente qualificando leads de verdade',
      steps: 5,
      weeks: '3 sem',
      xp: '240',
      state: 'locked',
      href: 'Projetos.html'
    }],
    certificate: {
      title: 'Certificação Operador de IA',
      desc: 'Conclua os 6 módulos para receber o selo e subir de Lendário I para Lendário II.'
    }
  };
  window.TrilhasData = {
    TRILHAS,
    ONGOING,
    DETAIL
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/trilhas-data.js", error: String((e && e.message) || e) }); }

// cursos/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "cursos/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// estrategia/estrategia-nav.js
try { (() => {
/* =============================================================================
   ESTRATÉG[IA] — menu compartilhado das páginas de estratégia
   Injetado em todas as páginas de estrategia/ via <script defer>.
   Ordem = ordem de leitura do trabalho. Página atual marcada em ouro.
   ============================================================================= */
(function () {
  var PAGES = [{
    file: 'sobre-plataforma-lendaria.html',
    label: 'A Plataforma'
  }, {
    file: 'voz-lendaria.html',
    label: 'Voz Lendária'
  }, {
    file: 'Análise Octalysis - EAD do Futuro.html',
    label: 'Análise Octalysis'
  }, {
    file: 'Auditoria Octalysis Level III - EAD AI-First.html',
    label: 'Auditoria L3'
  }, {
    file: 'Calibração Octalysis × Offerbook.html',
    label: 'Calibração'
  }, {
    file: 'Plano de Evolução - Octalysis v2.html',
    label: 'Plano v2'
  }, {
    file: 'Onboarding - Plano & Jornada.html',
    label: 'Onboarding'
  }, {
    file: 'Auditoria de Consistência - Jun 2026.html',
    label: 'Consistência'
  }, {
    file: 'Auditoria de Layout - Jun 2026.html',
    label: 'Layout'
  }, {
    file: 'Handoff - Próxima sessão.html',
    label: 'Handoff'
  }];
  var here = '';
  try {
    here = decodeURIComponent(location.pathname.split('/').pop() || '');
  } catch (e) {}
  var css = '.es-nav { position: sticky; top: 0; z-index: 60; background: hsl(var(--background-hsl) / 0.88); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-bottom: 1px solid var(--hairline); }' + '.es-nav__in { max-width: 1060px; margin: 0 auto; padding: 0 28px; height: 47px; display: flex; align-items: stretch; gap: 22px; overflow-x: auto; scrollbar-width: none; }' + '.es-nav__in::-webkit-scrollbar { display: none; }' + '.es-nav__brand { display: inline-flex; align-items: center; flex-shrink: 0; font-family: var(--font-sans); font-size: 10px; font-weight: 700; letter-spacing: var(--letter-spacing-label); text-transform: uppercase; color: var(--foreground); white-space: nowrap; }' + '.es-nav__brand b { color: var(--primary); font-weight: 700; }' + '.es-nav__sep { align-self: center; width: 1px; height: 14px; background: var(--hairline); flex-shrink: 0; }' + '.es-nav a.es-nav__link { display: inline-flex; align-items: center; flex-shrink: 0; padding: 0 1px; border-bottom: 1px solid transparent; margin-bottom: -1px; font-family: var(--font-mono); font-size: 9.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; color: var(--muted-foreground); text-decoration: none; transition: color var(--transition-fast), border-color var(--transition-fast); }' + '.es-nav a.es-nav__link:hover { color: var(--foreground); text-decoration: none; }' + '.es-nav a.es-nav__link[aria-current="page"] { color: var(--primary); border-bottom-color: var(--primary); }' + '@media print { .es-nav { display: none; } }';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
  var nav = document.createElement('nav');
  nav.className = 'es-nav';
  nav.setAttribute('aria-label', 'Páginas de estratégia');
  var inner = document.createElement('div');
  inner.className = 'es-nav__in';
  var brand = document.createElement('span');
  brand.className = 'es-nav__brand';
  brand.innerHTML = 'Estratég<b>[IA]</b>';
  inner.appendChild(brand);
  var sep = document.createElement('span');
  sep.className = 'es-nav__sep';
  inner.appendChild(sep);
  PAGES.forEach(function (p) {
    var a = document.createElement('a');
    a.className = 'es-nav__link';
    a.href = encodeURI(p.file);
    a.textContent = p.label;
    if (p.file === here) {
      a.setAttribute('aria-current', 'page');
    }
    inner.appendChild(a);
  });
  nav.appendChild(inner);
  document.body.insertBefore(nav, document.body.firstChild);
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "estrategia/estrategia-nav.js", error: String((e && e.message) || e) }); }

// explorations/design-canvas.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Exports (to window): DesignCanvas, DCSection, DCArtboard, DCPostIt.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>
//
// Artboards are static design frames, not scroll regions — never use
// height: 100% + overflow: auto/scroll on inner elements; size each artboard
// to fit its content (explicit pixel height, or let it grow).
/* END USAGE */

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    "data-omelette-chrome": "",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/design-canvas.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-editorial.jsx
try { (() => {
// DIREÇÃO A — EDITORIAL · "livraria de luxo"
// Serif-led (Newsreader), hairlines douradas, papel escuro quente.
const {
  BOOKS: A_BOOKS,
  Cover: ACover
} = window;
function EditorialScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "screen dirA"
  }, /*#__PURE__*/React.createElement("header", {
    className: "masthead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wordmark"
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("span", {
    className: "ia"
  }, "[IA]")), /*#__PURE__*/React.createElement("nav", null, /*#__PURE__*/React.createElement("a", {
    className: "on"
  }, "Biblioteca"), /*#__PURE__*/React.createElement("a", null, "Academia"), /*#__PURE__*/React.createElement("a", null, "Comunidade"), /*#__PURE__*/React.createElement("a", null, "Mentes")), /*#__PURE__*/React.createElement("div", {
    className: "mast-right"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-search"
  }), /*#__PURE__*/React.createElement("i", {
    className: "iconoir-bell"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      border: '1px solid rgba(201,178,152,0.4)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 10,
      fontWeight: 700,
      color: '#C9B298'
    }
  }, "AL"))), /*#__PURE__*/React.createElement("section", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Curadoria Exclusiva \xB7 247 obras"), /*#__PURE__*/React.createElement("h1", null, "Expanda sua ", /*#__PURE__*/React.createElement("em", null, "Consci\xEAncia.")), /*#__PURE__*/React.createElement("p", null, "Aprenda em minutos o que levou anos para ser escrito."), /*#__PURE__*/React.createElement("div", {
    className: "hero-stats"
  }, "247 obras \xB7 38 lidas \xB7 sequ\xEAncia de ", /*#__PURE__*/React.createElement("b", null, "12 dias"))), /*#__PURE__*/React.createElement("div", {
    className: "section-rule"
  }, /*#__PURE__*/React.createElement("span", null, "Continuar Leitura"), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("div", {
    className: "reading"
  }, /*#__PURE__*/React.createElement(ACover, {
    b: A_BOOKS[0],
    tSize: 11,
    style: {
      width: 64,
      height: 92,
      padding: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "r-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "r-t"
  }, "H\xE1bitos At\xF4micos"), /*#__PURE__*/React.createElement("div", {
    className: "r-a"
  }, "James Clear"), /*#__PURE__*/React.createElement("div", {
    className: "progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: '64%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "r-pct"
  }, "64% \xB7 12 min restantes")), /*#__PURE__*/React.createElement("div", {
    className: "btn"
  }, "Continuar Leitura")), /*#__PURE__*/React.createElement("div", {
    className: "section-rule"
  }, /*#__PURE__*/React.createElement("span", null, "Tend\xEAncias"), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("b", null, "ver cole\xE7\xE3o \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "shelf"
  }, A_BOOKS.slice(1, 7).map((b, i) => /*#__PURE__*/React.createElement("div", {
    className: "item",
    key: i
  }, /*#__PURE__*/React.createElement(ACover, {
    b: b,
    tSize: 14
  }), /*#__PURE__*/React.createElement("div", {
    className: "s-t"
  }, b.t), /*#__PURE__*/React.createElement("div", {
    className: "s-a"
  }, b.a), /*#__PURE__*/React.createElement("div", {
    className: "s-m"
  }, 9 + i, " min")))));
}
function EditorialDNA() {
  return /*#__PURE__*/React.createElement("div", {
    className: "dna dnaA"
  }, /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Tipografia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Newsreader, serif',
      fontWeight: 300,
      fontSize: 34,
      lineHeight: 1.05,
      letterSpacing: '-0.02em'
    }
  }, "Newsreader ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: '#C9B298'
    }
  }, "Light & It\xE1lica")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginTop: 10,
      fontWeight: 500
    }
  }, "Hanken Grotesk \u2014 UI, bot\xF5es, navega\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      color: '#8E8378',
      marginTop: 10
    }
  }, "Micro-labels em caps largas")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Cor \u2014 ouro sobre papel escuro"), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#100D0B',
      border: '1px solid rgba(201,178,152,0.2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#8E8378'
    }
  }, "#100D0B")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#1A1512'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#8E8378'
    }
  }, "#1A1512")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#C9B298'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#3A2F22'
    }
  }, "#C9B298")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#EDE6DC'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#5C544B'
    }
  }, "#EDE6DC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#8E8378',
      marginTop: 12,
      lineHeight: 1.5,
      fontFamily: 'Newsreader, serif',
      fontStyle: 'italic'
    }
  }, "Preto aquecido. O ouro vive em hairlines de 1px e palavras it\xE1licas \u2014 nunca em blocos.")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Componentes"), /*#__PURE__*/React.createElement("div", {
    className: "comps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "btn",
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: '#C9B298',
      border: '1px solid rgba(201,178,152,0.45)',
      padding: '11px 20px',
      borderRadius: 2
    }
  }, "Continuar Leitura"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: '#EDE6DC',
      padding: '11px 4px',
      borderBottom: '1px solid rgba(201,178,152,0.45)'
    }
  }, "Explorar")), /*#__PURE__*/React.createElement("div", {
    className: "crow"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#C9B298',
      border: '1px solid rgba(201,178,152,0.3)',
      borderRadius: 999,
      padding: '5px 12px'
    }
  }, "Curadoria"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#8E8378',
      border: '1px solid rgba(201,178,152,0.16)',
      borderRadius: 999,
      padding: '5px 12px'
    }
  }, "247 obras"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Newsreader, serif',
      fontStyle: 'italic',
      fontSize: 13,
      color: '#C9B298'
    }
  }, "Lido \u2713")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid rgba(201,178,152,0.16)',
      borderRadius: 4,
      padding: '16px 18px',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Newsreader, serif',
      fontSize: 18
    }
  }, "Card silencioso"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Newsreader, serif',
      fontStyle: 'italic',
      fontSize: 12,
      color: '#8E8378',
      marginTop: 4
    }
  }, "Hairline, sem sombra, sem brilho.")))), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "O que morre aqui"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#8E8378',
      lineHeight: 1.7
    }
  }, "Shimmer no hover \xB7 glow dourado \xB7 texturas PNG \xB7 cantos 1rem gen\xE9ricos.", /*#__PURE__*/React.createElement("br", null), "Hierarquia vem do serif e do espa\xE7o \u2014 n\xE3o de efeito.")));
}
Object.assign(window, {
  EditorialScreen,
  EditorialDNA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-editorial.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-galeria.jsx
try { (() => {
// DIREÇÃO C — GALERIA · museu
// Espaço vazio extremo, obra no centro, ouro raríssimo (placa + [IA]).
const {
  BOOKS: C_BOOKS,
  Cover: CCover
} = window;
function GaleriaScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "screen dirC"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topnav"
  }, /*#__PURE__*/React.createElement("a", null, "Academia"), /*#__PURE__*/React.createElement("a", null, "Comunidade"), /*#__PURE__*/React.createElement("div", {
    className: "wd"
  }, "LEND\xC1R", /*#__PURE__*/React.createElement("span", {
    className: "ia"
  }, "[IA]")), /*#__PURE__*/React.createElement("a", {
    className: "on"
  }, "Biblioteca"), /*#__PURE__*/React.createElement("a", null, "Mentes"), /*#__PURE__*/React.createElement("a", null, "Buscar")), /*#__PURE__*/React.createElement("h1", null, "Expanda sua", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "Consci\xEAncia.")), /*#__PURE__*/React.createElement("div", {
    className: "feature"
  }, /*#__PURE__*/React.createElement(CCover, {
    b: C_BOOKS[0],
    tSize: 17
  }), /*#__PURE__*/React.createElement("div", {
    className: "plaque"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pt"
  }, "H\xE1bitos At\xF4micos"), /*#__PURE__*/React.createElement("div", {
    className: "pa"
  }, "James Clear, 2018"), /*#__PURE__*/React.createElement("div", {
    className: "pm"
  }, "Obra n\xBA 12 \xB7 12 min \xB7 em leitura \u2014 64%")), /*#__PURE__*/React.createElement("div", {
    className: "btnline"
  }, "Continuar Leitura")), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, C_BOOKS.slice(1, 7).map((b, i) => /*#__PURE__*/React.createElement(CCover, {
    key: i,
    b: b,
    showAuthor: false
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pager"
  }, /*#__PURE__*/React.createElement("i", {
    className: "on"
  }), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("div", {
    className: "seq"
  }, "Sequ\xEAncia \xB7 ", /*#__PURE__*/React.createElement("b", null, "12 dias")));
}
function GaleriaDNA() {
  return /*#__PURE__*/React.createElement("div", {
    className: "dna dnaC"
  }, /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Tipografia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond, serif',
      fontWeight: 300,
      fontSize: 38,
      lineHeight: 1,
      letterSpacing: '-0.01em'
    }
  }, "Cormorant ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: '#C9B298'
    }
  }, "Garamond")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      marginTop: 12,
      letterSpacing: '0.02em'
    }
  }, "Jost \u2014 navega\xE7\xE3o e UI, leve e geom\xE9trica"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      color: '#7A756D',
      marginTop: 12
    }
  }, "Placas de museu em caps espa\xE7adas")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Cor \u2014 quase nada"), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#060606',
      border: '1px solid #1E1C19'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#7A756D'
    }
  }, "#060606")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#121110'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#7A756D'
    }
  }, "#121110")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#C9B298'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#3A2F22'
    }
  }, "#C9B298")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#F2EFEA'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#5C544B'
    }
  }, "#F2EFEA"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: 'italic',
      fontSize: 14,
      color: '#7A756D',
      marginTop: 12,
      lineHeight: 1.5
    }
  }, "A Regra dos 8% vira Regra do 1%: o ouro aparece tr\xEAs vezes por tela, no m\xE1ximo.")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Componentes"), /*#__PURE__*/React.createElement("div", {
    className: "comps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crow",
    style: {
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      borderBottom: '1px solid #C9B298',
      paddingBottom: 5
    }
  }, "Continuar"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      color: '#7A756D',
      borderBottom: '1px solid #2E2B27',
      paddingBottom: 5
    }
  }, "Explorar")), /*#__PURE__*/React.createElement("div", {
    className: "crow",
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: '#7A756D'
    }
  }, "\u2014 sem badges. Estado vira texto de placa: \u201Cem leitura, 64%\u201D")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 0 0',
      width: '100%',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      borderTop: '1px solid #C9B298',
      margin: '0 auto 12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: '0.3em',
      textTransform: 'uppercase'
    }
  }, "Card = pedestal"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: 'italic',
      fontSize: 13,
      color: '#7A756D',
      marginTop: 5
    }
  }, "sem borda, sem fundo \u2014 s\xF3 sombra profunda e espa\xE7o")))), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "O que morre aqui"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#7A756D',
      lineHeight: 1.7,
      letterSpacing: '0.02em'
    }
  }, "Cards, bordas, badges, grids densos \u2014 o chrome inteiro.", /*#__PURE__*/React.createElement("br", null), "Sobra a obra, a placa e o sil\xEAncio.")));
}
Object.assign(window, {
  GaleriaScreen,
  GaleriaDNA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-galeria.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-obsidiana.jsx
try { (() => {
// DIREÇÃO B — OBSIDIANA · tech premium
// Hairlines neutras, mono micro-labels, densidade de console. Ouro = sinal, não decoração.
const {
  BOOKS: B_BOOKS,
  Cover: BCover
} = window;
function ObsidianaScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "screen dirB"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, "L"), /*#__PURE__*/React.createElement("div", {
    className: "ric on"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-book"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ric"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-graduation-cap"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ric"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-community"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ric"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-brain"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ric"
  }, /*#__PURE__*/React.createElement("i", {
    className: "iconoir-settings"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, "LENDAR", /*#__PURE__*/React.createElement("b", null, "[IA]"), "OS\xA0\xA0/\xA0\xA0BIBLIOTECA"), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, /*#__PURE__*/React.createElement("span", null, "SEQ 12D"), /*#__PURE__*/React.createElement("span", null, "v4.2.0"))), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "colL"
  }, /*#__PURE__*/React.createElement("h1", null, "Expanda sua consci\xEAncia."), /*#__PURE__*/React.createElement("p", {
    className: "sub"
  }, "Sabedoria secular potencializada por IA. Resumos densos, leitura em minutos."), /*#__PURE__*/React.createElement("div", {
    className: "stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "OBRAS"), /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "247")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "LIDAS"), /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "38")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "SEQU\xCANCIA"), /*#__PURE__*/React.createElement("div", {
    className: "v",
    style: {
      color: '#C9B298'
    }
  }, "12 ", /*#__PURE__*/React.createElement("small", null, "dias"))), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, "TEMPO M\xC9DIO"), /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "11 ", /*#__PURE__*/React.createElement("small", null, "min")))), /*#__PURE__*/React.createElement("div", {
    className: "modlabel"
  }, /*#__PURE__*/React.createElement("span", null, "TEND\xCANCIAS"), /*#__PURE__*/React.createElement("a", null, "VER TUDO \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "grid"
  }, B_BOOKS.slice(1, 7).map((b, i) => /*#__PURE__*/React.createElement("div", {
    className: "bcell",
    key: i
  }, /*#__PURE__*/React.createElement(BCover, {
    b: b,
    tSize: 11
  }), /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, b.t), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, b.a.toUpperCase(), " \xB7 ", 9 + i, " MIN"))))), /*#__PURE__*/React.createElement("div", {
    className: "colR"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rmod"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modlabel"
  }, /*#__PURE__*/React.createElement("span", null, "EM LEITURA")), [{
    b: B_BOOKS[0],
    p: 64
  }].map(({
    b,
    p
  }, i) => /*#__PURE__*/React.createElement("div", {
    className: "ritem",
    key: i
  }, /*#__PURE__*/React.createElement(BCover, {
    b: b,
    tSize: 6,
    showAuthor: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, b.t), /*#__PURE__*/React.createElement("div", {
    className: "rm"
  }, p, "% \xB7 ", Math.round((100 - p) * 0.18), " MIN REST"), /*#__PURE__*/React.createElement("div", {
    className: "meter"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: p + '%'
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "btn",
    style: {
      marginTop: 14
    }
  }, "CONTINUAR LEITURA")), /*#__PURE__*/React.createElement("div", {
    className: "streak"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modlabel",
    style: {
      margin: 0
    }
  }, "SEQU\xCANCIA"), /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "12", /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: 12,
      color: '#6E6E76'
    }
  }, " dias"))), /*#__PURE__*/React.createElement("div", {
    className: "days"
  }, [1, 1, 1, 1, 1, 0, 0].map((on, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: 'd' + (on ? ' on' : '')
  })))), /*#__PURE__*/React.createElement("div", {
    className: "btn ghost"
  }, "EXPLORAR BIBLIOTECA")))));
}
function ObsidianaDNA() {
  return /*#__PURE__*/React.createElement("div", {
    className: "dna dnaB"
  }, /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Tipografia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 500,
      fontSize: 32,
      letterSpacing: '-0.03em',
      lineHeight: 1.05
    }
  }, "Space Grotesk 500"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      marginTop: 10
    }
  }, "Instrument Sans \u2014 corpo e UI"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10,
      letterSpacing: '0.16em',
      color: '#6E6E76',
      marginTop: 10
    }
  }, "JETBRAINS MONO \u2014 LABELS, DADOS, STATUS")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Cor \u2014 sinal sobre obsidiana"), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#09090B',
      border: '1px solid #1C1C21'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#6E6E76'
    }
  }, "#09090B")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#0E0E11',
      border: '1px solid #1C1C21'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#6E6E76'
    }
  }, "#0E0E11")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#1C1C21'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#9A9AA2'
    }
  }, "#1C1C21")), /*#__PURE__*/React.createElement("div", {
    className: "chip",
    style: {
      background: '#C9B298'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#3A2F22'
    }
  }, "#C9B298"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#6E6E76',
      marginTop: 12,
      lineHeight: 1.5
    }
  }, "Neutros frios, sem tom. O ouro funciona como LED de estado: indicador ativo, m\xE9trica-chave, [IA].")), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "Componentes"), /*#__PURE__*/React.createElement("div", {
    className: "comps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "btn"
  }, "CONTINUAR LEITURA"), /*#__PURE__*/React.createElement("div", {
    className: "btn ghost"
  }, "CANCELAR")), /*#__PURE__*/React.createElement("div", {
    className: "crow"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 8.5,
      letterSpacing: '0.14em',
      color: '#C9B298',
      border: '1px solid rgba(201,178,152,0.35)',
      borderRadius: 3,
      padding: '4px 8px'
    }
  }, "LENDO"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 8.5,
      letterSpacing: '0.14em',
      color: '#30D158',
      border: '1px solid rgba(48,209,88,0.3)',
      borderRadius: 3,
      padding: '4px 8px'
    }
  }, "LIDO"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 8.5,
      letterSpacing: '0.14em',
      color: '#6E6E76',
      border: '1px solid #2A2A30',
      borderRadius: 3,
      padding: '4px 8px'
    }
  }, "247 OBRAS")), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid #1C1C21',
      background: '#0E0E11',
      borderRadius: 6,
      padding: '14px 16px',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '-0.01em'
    }
  }, "Card-m\xF3dulo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 9,
      letterSpacing: '0.1em',
      color: '#6E6E76',
      marginTop: 5
    }
  }, "RAIO 6PX \xB7 HAIRLINE \xB7 ZERO SOMBRA")))), /*#__PURE__*/React.createElement("div", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lab"
  }, "O que morre aqui"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#6E6E76',
      lineHeight: 1.7
    }
  }, "Glow, gradiente e textura \xB7 cantos grandes \xB7 caps espalhadas em todo lado.", /*#__PURE__*/React.createElement("br", null), "O premium vem de precis\xE3o: grade de 1px, dados em mono, ouro racionado.")));
}
Object.assign(window, {
  ObsidianaScreen,
  ObsidianaDNA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-obsidiana.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-shared.jsx
try { (() => {
// Shared: book data + Cover component (fallback-cover style: gradient panel + serif title)
const BOOKS = [{
  t: 'Hábitos Atômicos',
  a: 'James Clear',
  c1: '#23404A',
  c2: '#101D22',
  ink: '#D8E5EA'
}, {
  t: 'Essencialismo',
  a: 'Greg McKeown',
  c1: '#472322',
  c2: '#221010',
  ink: '#EFDCDA'
}, {
  t: 'A Psicologia Financeira',
  a: 'Morgan Housel',
  c1: '#23402F',
  c2: '#0F2016',
  ink: '#D9E8DE'
}, {
  t: 'Rápido e Devagar',
  a: 'Daniel Kahneman',
  c1: '#2E3344',
  c2: '#15171F',
  ink: '#DCDFE9'
}, {
  t: 'Antifrágil',
  a: 'Nassim Taleb',
  c1: '#463623',
  c2: '#231A0F',
  ink: '#EAE0D1'
}, {
  t: 'Mindset',
  a: 'Carol Dweck',
  c1: '#3D2A42',
  c2: '#1D1220',
  ink: '#E6DAEA'
}, {
  t: 'O Poder do Hábito',
  a: 'Charles Duhigg',
  c1: '#1F3A3D',
  c2: '#0E1C1E',
  ink: '#D6E6E7'
}, {
  t: 'Deep Work',
  a: 'Cal Newport',
  c1: '#33312B',
  c2: '#171613',
  ink: '#E5E2D8'
}];
function Cover({
  b,
  tSize = 13,
  showAuthor = true,
  className = '',
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'cover ' + className,
    style: {
      background: 'linear-gradient(165deg, ' + b.c1 + ' 0%, ' + b.c2 + ' 100%)',
      color: b.ink,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cv-t",
    style: {
      fontSize: tSize
    }
  }, b.t), showAuthor ? /*#__PURE__*/React.createElement("div", {
    className: "cv-a"
  }, b.a) : null);
}
Object.assign(window, {
  BOOKS,
  Cover
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-shared.jsx", error: String((e && e.message) || e) }); }

// livros/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/ios-frame.jsx", error: String((e && e.message) || e) }); }

// livros/livro-app.jsx
try { (() => {
// App raiz — protótipo mobile /livro
const LM_STORE_KEY = 'lendaria-m-livro-v1';
const LIVRO_TWEAKS = /*EDITMODE-BEGIN*/{
  "actionBar": "Fixa",
  "miniPlayer": true,
  "autoStatus": true
} /*EDITMODE-END*/;
function lmLoad() {
  try {
    return JSON.parse(localStorage.getItem(LM_STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function LivroApp() {
  const book = window.LIVRO_DATA;
  const [t, setTweak] = useTweaks(LIVRO_TWEAKS);
  const saved = React.useRef(lmLoad()).current;

  /* estado do livro */
  const [status, setStatus] = React.useState(saved.status || 'none');
  const [favorite, setFavorite] = React.useState(!!saved.favorite);
  const [review, setReview] = React.useState(saved.review || null);
  const [readPct, setReadPct] = React.useState(saved.readPct || 0);

  /* navegação + sheets */
  const [readerOpen, setReaderOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  /* leitor */
  const [mode, setMode] = React.useState(saved.mode || 'noite');
  const [fontSize, setFontSize] = React.useState(saved.fontSize || 18);

  /* player */
  const total = book.duration;
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [audioStarted, setAudioStarted] = React.useState(!!saved.audioStarted);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(saved.audioTime || 0);
  const [speedIdx, setSpeedIdx] = React.useState(saved.speedIdx || 0);

  /* toast */
  const [toast, setToast] = React.useState(null);
  const toastId = React.useRef(0);
  const showToast = msg => {
    toastId.current += 1;
    setToast({
      msg: msg,
      id: toastId.current
    });
  };
  React.useEffect(() => {
    if (!toast) return;
    const tm = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(tm);
  }, [toast]);

  /* persistência */
  React.useEffect(() => {
    try {
      localStorage.setItem(LM_STORE_KEY, JSON.stringify({
        status,
        favorite,
        review,
        readPct,
        mode,
        fontSize,
        audioTime: time,
        audioStarted,
        speedIdx
      }));
    } catch (e) {}
  }, [status, favorite, review, readPct, mode, fontSize, time, audioStarted, speedIdx]);

  /* tique do áudio simulado */
  React.useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setTime(prev => {
        const next = prev + 0.25 * LM_SPEEDS[speedIdx];
        if (next >= total) {
          clearInterval(iv);
          setPlaying(false);
          setStatus('read');
          showToast('Áudio concluído');
          setTimeout(() => {
            setPlayerOpen(false);
            if (!review) setReviewOpen(true);
          }, 900);
          return total;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(iv);
  }, [playing, speedIdx, total, review]);

  /* ações */
  const openReader = () => {
    setReaderOpen(true);
    if (t.autoStatus && status === 'none') {
      setStatus('reading');
      setTimeout(() => showToast('Movido para "Lendo"'), 600);
    }
  };
  const toggleFav = () => {
    setFavorite(f => {
      showToast(!f ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      return !f;
    });
  };
  const changeStatus = s => {
    setStatus(s);
    setStatusOpen(false);
    if (s === 'read') {
      showToast('Marcado como lido');
      if (!review) setTimeout(() => setReviewOpen(true), 450);
    } else if (s === 'none') showToast('Removido da estante');else showToast(s === 'reading' ? 'Movido para "Lendo"' : 'Salvo em "Quero ler"');
  };
  const toggleRead = () => {
    if (status === 'read') {
      showToast('Este livro já está marcado como lido');
      return;
    }
    setStatus('read');
    if (!review) setTimeout(() => setReviewOpen(true), 450);else showToast('Marcado como lido');
  };
  const openPlayer = () => {
    setPlayerOpen(true);
    if (!audioStarted) {
      setAudioStarted(true);
      setPlaying(true);
    }
  };
  const submitReview = r => {
    setReview(r);
    setReviewOpen(false);
    showToast('Avaliação enviada — obrigado!');
  };
  const miniVisible = t.miniPlayer && audioStarted && !playerOpen && !readerOpen;

  /* escala para caber na viewport */
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / 874, (window.innerWidth - 32) / 402));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const statusBarDark = !(readerOpen && mode !== 'noite');
  return /*#__PURE__*/React.createElement("div", {
    className: "lm-stage"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 402 * scale,
      height: 874 * scale
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: 'scale(' + scale + ')',
      transformOrigin: 'top left'
    }
  }, /*#__PURE__*/React.createElement(IOSDevice, {
    dark: statusBarDark
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-app"
  }, /*#__PURE__*/React.createElement(LivroDetail, {
    book: book,
    status: status,
    favorite: favorite,
    review: review,
    readPct: readPct,
    onOpenReader: openReader,
    onOpenPlayer: openPlayer,
    onOpenStatus: () => setStatusOpen(true),
    onToggleFav: toggleFav,
    onToast: showToast
  }), miniVisible && /*#__PURE__*/React.createElement(LivroMiniPlayer, {
    book: book,
    playing: playing,
    time: time,
    raised: t.actionBar === 'Flutuante',
    onTogglePlay: () => setPlaying(!playing),
    onExpand: () => setPlayerOpen(true),
    onDismiss: () => {
      setPlaying(false);
      setAudioStarted(false);
    }
  }), /*#__PURE__*/React.createElement(LivroActionBar, {
    floating: t.actionBar === 'Flutuante',
    status: status,
    favorite: favorite,
    readPct: readPct,
    onOpenReader: openReader,
    onOpenPlayer: openPlayer,
    onOpenStatus: () => setStatusOpen(true),
    onToggleFav: toggleFav
  }), /*#__PURE__*/React.createElement(LivroReader, {
    book: book,
    open: readerOpen,
    mode: mode,
    fontSize: fontSize,
    favorite: favorite,
    isRead: status === 'read',
    onClose: () => setReaderOpen(false),
    onModeChange: setMode,
    onFontChange: setFontSize,
    onToggleFav: toggleFav,
    onToggleRead: toggleRead,
    onToast: showToast,
    onProgress: setReadPct
  }), /*#__PURE__*/React.createElement(LivroStatusSheet, {
    open: statusOpen,
    status: status,
    onClose: () => setStatusOpen(false),
    onChange: changeStatus
  }), /*#__PURE__*/React.createElement(LivroPlayer, {
    book: book,
    open: playerOpen,
    playing: playing,
    time: time,
    speed: LM_SPEEDS[speedIdx],
    onClose: () => setPlayerOpen(false),
    onTogglePlay: () => setPlaying(!playing),
    onSeek: v => setTime(Math.max(0, Math.min(total, v))),
    onSpeed: () => setSpeedIdx((speedIdx + 1) % LM_SPEEDS.length),
    onToast: showToast
  }), /*#__PURE__*/React.createElement(LivroReview, {
    book: book,
    open: reviewOpen,
    onClose: () => setReviewOpen(false),
    onSubmit: submitReview,
    onSkip: () => {
      setReviewOpen(false);
      showToast('Você pode avaliar depois na ficha do livro');
    }
  }), toast && /*#__PURE__*/React.createElement("div", {
    className: "lm-toast",
    key: toast.id
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "check"
  }), " ", toast.msg))))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Layout"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Barra de a\xE7\xF5es",
    value: t.actionBar,
    options: ['Fixa', 'Flutuante'],
    onChange: v => setTweak('actionBar', v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Comportamento"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Mini-player de \xE1udio",
    value: t.miniPlayer,
    onChange: v => setTweak('miniPlayer', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Auto-status \"Lendo\"",
    value: t.autoStatus,
    onChange: v => setTweak('autoStatus', v)
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(LivroApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-app.jsx", error: String((e && e.message) || e) }); }

// livros/livro-data.js
try { (() => {
/* livro-data.js — Mock data para as páginas de livro do Design System.
 *
 * window.LIVRO_DATA  → shape bate com BookData   (app/features/books/data/types.ts)
 * window.LIVRO_AUTHOR → shape bate com Author    (app/features/books/data/types.ts)
 *
 * Campos prefixados com _ são DS-only (não existem nos tipos do app).
 * Os campos sem _ podem ser copiados direto para o app.
 *
 * Mapeamento de páginas → rotas do app:
 *   livro-detail.jsx  →  /livros/:slug          (BookDetailTemplate)
 *   livro-reader.jsx  →  /livros/:slug/ler       (BookReaderTemplate)
 *   livro-player.jsx  →  player de áudio inline  (sem rota dedicada ainda)
 *   livro-review.jsx  →  modal de avaliação      (BookRatingModal)
 */

window.LIVRO_DATA = {
  // ── CORE — matches BookData type ──────────────────────────────────────────
  id: 'disciplina-positiva',
  slug: 'disciplina-positiva',
  title: 'Disciplina Positiva para Crianças de 0 a 3 Anos',
  author: 'Jane Nelsen, Cheryl Erwin & Roslyn Ann Duffy',
  authorSlug: 'jane-nelsen',
  coverUrl: null,
  summary: 'Firmeza e gentileza ao mesmo tempo: o clássico da parentalidade aplicado aos primeiros três anos de vida — como guiar o comportamento sem castigos, sem permissividade e sem quebrar a conexão com a criança.',
  // content: markdown armazenado no DB — parseable por reading-utils.ts
  // extractTLDR  → primeiro blockquote (>)
  // extractChapters → headings ##
  // calculateReadingTime → wordcount / 200 wpm
  content: `> Disciplina, entre 0 e 3 anos, é ensino — não punição. Seja firme e gentil na mesma frase, leia o comportamento como comunicação, conecte antes de corrigir, ajuste as expectativas ao cérebro em formação, deixe o ambiente e as rotinas trabalharem por você, e trate cada erro — seu ou da criança — como matéria-prima de aprendizado.

Nos três primeiros anos de vida, nenhuma criança "se comporta mal" no sentido que os adultos imaginam. Ela explora, testa, sente — com um cérebro que ainda está literalmente em construção. É por isso que os métodos tradicionais de disciplina, herdados de gerações que confundiam educar com punir, fracassam justamente na fase em que mais importam. Este resumo percorre as seis ideias centrais do clássico de Jane Nelsen aplicado à primeira infância: como ser firme e gentil ao mesmo tempo, e por que a conexão — não o medo — é o que ensina.

## Firme e gentil não são opostos

A maioria dos pais oscila entre dois polos: o controle excessivo — castigos, gritos, ameaças — e a permissividade — ceder para evitar o conflito. A Disciplina Positiva propõe um terceiro caminho, que parece paradoxal até ser praticado: firmeza e gentileza não são extremos de uma régua, mas duas qualidades presentes na mesma atitude. Firmeza comunica respeito pela situação e pelos limites; gentileza comunica respeito pela criança.

Na prática, isso soa como "Eu sei que você quer continuar no parquinho — e está na hora de ir". A primeira metade valida o sentimento; a segunda sustenta o limite. Nenhuma das duas, sozinha, educa. Juntas, ensinam a lição mais importante dos primeiros anos: sentimentos são sempre aceitos, nem todo comportamento é.

## Comportamento é comunicação

Uma birra aos dois anos não é manipulação — é transbordamento. A criança pequena não possui ainda o vocabulário nem a maturidade neurológica para dizer "estou cansada, com fome e sobrecarregada de estímulos". Então ela mostra. As autoras insistem que todo comportamento desafiador é um código a ser decifrado, não um crime a ser julgado.

A pergunta que transforma a rotina da família não é "como faço isso parar?", mas "o que isso está tentando me dizer?". Sono, fome, transições bruscas, necessidade de atenção ou de autonomia: quase toda "má-criação" entre 0 e 3 anos se resolve na causa, não no sintoma.

> "Onde foi que tiramos a ideia absurda de que, para fazer uma criança agir melhor, primeiro precisamos fazê-la se sentir pior?" — Jane Nelsen

## Conexão antes da correção

O princípio adleriano que sustenta todo o livro: uma criança que se sente pertencente coopera; uma criança que se sente rejeitada resiste. Antes de corrigir qualquer comportamento, é preciso restabelecer a conexão — descer à altura dos olhos, tocar, nomear o sentimento. Só então a orientação encontra um cérebro capaz de recebê-la.

Isso não significa negociar tudo, nem ceder. Significa reconhecer que a relação é o canal por onde a disciplina passa. Quando o canal está rompido — pela raiva, pelo medo, pela distância — nenhuma técnica funciona, por mais correta que seja.

## O cérebro de 0 a 3

O córtex pré-frontal — sede do autocontrole, do planejamento e da empatia — é a última região do cérebro a amadurecer, e nos primeiros três anos está apenas começando a se formar. Esperar que um bebê de dezoito meses "saiba que não pode" é esperar de um órgão uma função que ele ainda não tem.

Esse dado muda tudo: o papel dos pais nessa fase não é exigir autocontrole, e sim emprestá-lo. Cada vez que o adulto regula a própria emoção diante do caos — respira, abaixa o tom, acolhe — ele está literalmente modelando os circuitos que a criança usará pelo resto da vida.

## Rotinas que disciplinam sozinhas

Grande parte dos conflitos diários não precisa de conversa nenhuma — precisa de ambiente. Tomadas protegidas, objetos frágeis fora do alcance, uma rotina previsível de sono e refeições: o entorno bem desenhado elimina dezenas de "nãos" por dia e poupa a autoridade dos pais para o que realmente importa.

As autoras sugerem transformar as rotinas no "chefe" da casa: não é a mãe quem manda escovar os dentes, é a rotina do sono que chegou. A previsibilidade dá à criança a sensação de controle que ela busca — e retira o cabo de guerra da relação.

## Erros como oportunidade

O capítulo final desarma a maior fonte de culpa parental: a expectativa de perfeição. Pais erram — gritam, cedem, perdem a paciência — e isso não destrói a criança. O que ensina é o reparo: voltar, assumir, recomeçar. "Eu gritei e não foi justo. Vamos tentar de novo?"

Erros, da criança e dos adultos, são tratados como dados de aprendizado, nunca como provas de fracasso. Uma família que repara está ensinando a habilidade emocional mais rara e valiosa que existe: a coragem de ser imperfeito.`,
  category: 'Educação',
  categorySlug: 'educacao',
  tags: [{
    slug: 'educacao',
    name: 'Educação'
  }, {
    slug: 'parentalidade',
    name: 'Parentalidade'
  }, {
    slug: 'psicologia',
    name: 'Psicologia'
  }],
  hasAudio: true,
  duration: 1080,
  // 18 min × 60s — era audioMin
  pageCount: null,
  publishedYear: 1998,
  // era year
  readingTime: 12,
  // legacy, em minutos — era readMin

  status: 'published',
  qualityScore: 4.8,
  qualityTier: 'legendary',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
  // ── DS-ONLY — não existem em BookData, usados apenas nas páginas DS ────────
  _badge: 'Resumo Lendár[IA]',
  _titleHtml: 'Disciplina <em>Positiva</em> para Crianças de 0 a 3 Anos',
  _authorShort: 'Jane Nelsen et al.',
  _coverBg: 'linear-gradient(160deg, #233f2d, #101d14)',
  _coverFg: '#D9E8DE',
  _coverLetter: 'D',
  _quote: 'Onde foi que tiramos a ideia absurda de que, para fazer uma criança agir melhor, primeiro precisamos fazê-la se sentir pior?',
  _quoteBy: 'Jane Nelsen',
  _authorBio: 'Doutora em Educação, terapeuta familiar e criadora da série Disciplina Positiva, traduzida para mais de 25 idiomas. Seu trabalho parte da psicologia de Alfred Adler e Rudolf Dreikurs para uma abordagem de criação sem punições nem recompensas.',
  _ideas: [{
    t: 'Firme e gentil não são opostos',
    p: 'Disciplina é ensino, não punição — as duas posturas coexistem em cada interação.'
  }, {
    t: 'Comportamento é comunicação',
    p: 'Birras e desafios nos primeiros anos são linguagem de desenvolvimento, não má-criação.'
  }, {
    t: 'Conexão antes da correção',
    p: 'A criança coopera quando se sente pertencente — a relação vem antes da regra.'
  }, {
    t: 'O cérebro de 0 a 3',
    p: 'O que a neurociência do desenvolvimento muda nas expectativas sobre autocontrole.'
  }, {
    t: 'Rotinas que disciplinam sozinhas',
    p: 'Ambiente e previsibilidade fazem o trabalho que o sermão não faz.'
  }, {
    t: 'Erros como oportunidade',
    p: 'Como transformar os tropeços — da criança e dos pais — em aprendizado conjunto.'
  }],
  _lead: 'Nos três primeiros anos de vida, nenhuma criança "se comporta mal" no sentido que os adultos imaginam. Ela explora, testa, sente — com um cérebro que ainda está literalmente em construção. É por isso que os métodos tradicionais de disciplina, herdados de gerações que confundiam educar com punir, fracassam justamente na fase em que mais importam. Este resumo percorre as seis ideias centrais do clássico de Jane Nelsen aplicado à primeira infância: como ser firme e gentil ao mesmo tempo, e por que a conexão — não o medo — é o que ensina.',
  _chapters: [{
    id: 'cap-1',
    title: 'Firme e gentil não são opostos',
    titleHtml: 'Firme e gentil <em>não são opostos</em>',
    paras: ['A maioria dos pais oscila entre dois polos: o controle excessivo — castigos, gritos, ameaças — e a permissividade — ceder para evitar o conflito. A Disciplina Positiva propõe um terceiro caminho, que parece paradoxal até ser praticado: <mark class="hl">firmeza e gentileza não são extremos de uma régua, mas duas qualidades presentes na mesma atitude</mark>. Firmeza comunica respeito pela situação e pelos limites; gentileza comunica respeito pela criança.', 'Na prática, isso soa como "Eu sei que você quer continuar no parquinho — e está na hora de ir". A primeira metade valida o sentimento; a segunda sustenta o limite. Nenhuma das duas, sozinha, educa. Juntas, ensinam a lição mais importante dos primeiros anos: sentimentos são sempre aceitos, nem todo comportamento é.']
  }, {
    id: 'cap-2',
    title: 'Comportamento é comunicação',
    titleHtml: 'Comportamento é <em>comunicação</em>',
    paras: ['Uma birra aos dois anos não é manipulação — é transbordamento. A criança pequena não possui ainda o vocabulário nem a maturidade neurológica para dizer "estou cansada, com fome e sobrecarregada de estímulos". Então ela mostra. As autoras insistem que todo comportamento desafiador é um código a ser decifrado, não um crime a ser julgado.', 'A pergunta que transforma a rotina da família não é "como faço isso parar?", mas "o que isso está tentando me dizer?". Sono, fome, transições bruscas, necessidade de atenção ou de autonomia: quase toda "má-criação" entre 0 e 3 anos se resolve na causa, não no sintoma.'],
    pull: true
  }, {
    id: 'cap-3',
    title: 'Conexão antes da correção',
    titleHtml: 'Conexão antes da <em>correção</em>',
    paras: ['O princípio adleriano que sustenta todo o livro: uma criança que se sente pertencente coopera; uma criança que se sente rejeitada resiste. Antes de corrigir qualquer comportamento, é preciso restabelecer a conexão — descer à altura dos olhos, tocar, nomear o sentimento. Só então a orientação encontra um cérebro capaz de recebê-la.', 'Isso não significa negociar tudo, nem ceder. Significa reconhecer que a relação é o canal por onde a disciplina passa. Quando o canal está rompido — pela raiva, pelo medo, pela distância — nenhuma técnica funciona, por mais correta que seja.']
  }, {
    id: 'cap-4',
    title: 'O cérebro de 0 a 3',
    titleHtml: 'O cérebro de <em>0 a 3</em>',
    paras: ['O córtex pré-frontal — sede do autocontrole, do planejamento e da empatia — é a última região do cérebro a amadurecer, e nos primeiros três anos está apenas começando a se formar. Esperar que um bebê de dezoito meses "saiba que não pode" é esperar de um órgão uma função que ele ainda não tem.', 'Esse dado muda tudo: o papel dos pais nessa fase não é exigir autocontrole, e sim emprestá-lo. Cada vez que o adulto regula a própria emoção diante do caos — respira, abaixa o tom, acolhe — ele está literalmente modelando os circuitos que a criança usará pelo resto da vida.']
  }, {
    id: 'cap-5',
    title: 'Rotinas que disciplinam sozinhas',
    titleHtml: 'Rotinas que disciplinam <em>sozinhas</em>',
    paras: ['Grande parte dos conflitos diários não precisa de conversa nenhuma — precisa de ambiente. Tomadas protegidas, objetos frágeis fora do alcance, uma rotina previsível de sono e refeições: o entorno bem desenhado elimina dezenas de "nãos" por dia e poupa a autoridade dos pais para o que realmente importa.', 'As autoras sugerem transformar as rotinas no "chefe" da casa: não é a mãe quem manda escovar os dentes, é a rotina do sono que chegou. A previsibilidade dá à criança a sensação de controle que ela busca — e retira o cabo de guerra da relação.']
  }, {
    id: 'cap-6',
    title: 'Erros como oportunidade',
    titleHtml: 'Erros como <em>oportunidade</em>',
    paras: ['O capítulo final desarma a maior fonte de culpa parental: a expectativa de perfeição. Pais erram — gritam, cedem, perdem a paciência — e isso não destrói a criança. O que ensina é o reparo: voltar, assumir, recomeçar. "Eu gritei e não foi justo. Vamos tentar de novo?"', 'Erros, da criança e dos adultos, são tratados como dados de aprendizado, nunca como provas de fracasso. Uma família que repara está ensinando a habilidade emocional mais rara e valiosa que existe: a coragem de ser imperfeito.']
  }],
  _tldr: 'Disciplina, entre 0 e 3 anos, é ensino — não punição. Seja firme e gentil na mesma frase, leia o comportamento como comunicação, conecte antes de corrigir, ajuste as expectativas ao cérebro em formação, deixe o ambiente e as rotinas trabalharem por você, e trate cada erro — seu ou da criança — como matéria-prima de aprendizado.',
  _related: [{
    t: 'Inteligência Emocional e a Arte de Educar Nossos Filhos',
    by: 'John Gottman',
    cat: 'Relacionamentos',
    bg: 'linear-gradient(160deg, #3d2a42, #1d1220)',
    fg: '#E6DAEA',
    l: 'I'
  }, {
    t: 'O Livro que Você Gostaria que Seus Pais Tivessem Lido',
    by: 'Philippa Perry',
    cat: 'Relacionamentos',
    bg: 'linear-gradient(160deg, #472322, #221010)',
    fg: '#EFDCDA',
    l: 'L'
  }, {
    t: 'Parentalidade Consciente',
    by: 'Shefali Tsabary',
    cat: 'Educação',
    bg: 'linear-gradient(160deg, #23404a, #101d22)',
    fg: '#D8E5EA',
    l: 'P'
  }, {
    t: 'A Criança Montessori',
    by: 'Simone Davies',
    cat: 'Educação',
    bg: 'linear-gradient(160deg, #46382a, #231a0f)',
    fg: '#EAE0D1',
    l: 'C'
  }]
};

// ── AUTHOR — matches Author type ─────────────────────────────────────────────
window.LIVRO_AUTHOR = {
  id: 'jane-nelsen',
  slug: 'jane-nelsen',
  name: 'Jane Nelsen',
  avatarUrl: null,
  shortBio: 'Doutora em Educação, terapeuta familiar e criadora da série Disciplina Positiva, traduzida para mais de 25 idiomas. Seu trabalho parte da psicologia de Alfred Adler e Rudolf Dreikurs para uma abordagem de criação sem punições nem recompensas.',
  nationality: 'Americana',
  birthYear: null,
  deathYear: null,
  website: null,
  twitter: null,
  linkedin: null,
  wikipedia: 'https://en.wikipedia.org/wiki/Jane_Nelsen',
  occupation: ['Psicóloga', 'Terapeuta familiar', 'Escritora'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// ── RATING TAGS — do BookRatingModal do app ───────────────────────────────────
window.LIVRO_RATING = {
  labels: ['Péssimo', 'Ruim', 'Ok', 'Bom', 'Incrível'],
  negative: ['Muito curto', 'Chato / Perdi interesse', 'Difícil de acompanhar', 'Visões tendenciosas', 'Não reflete o livro', 'Narração ruim', 'Pontos-chave confusos', 'Outro'],
  positive: ['Nível de detalhe ideal', 'Parece confiável', 'Interessante / Envolvente', 'Fácil de acompanhar', 'Alinhado com minhas visões', 'Boa narração', 'Pontos-chave claros', 'Outro']
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-data.js", error: String((e && e.message) || e) }); }

// livros/livro-detail.jsx
try { (() => {
// Tela: Ficha do livro (mobile)
const LM_STATUS = {
  none: {
    icon: 'bookmark',
    label: 'Adicionar à estante',
    cls: ''
  },
  want_to_read: {
    icon: 'bookmark-solid',
    label: 'Quero ler',
    cls: 'st-want'
  },
  reading: {
    icon: 'open-book',
    label: 'Lendo',
    cls: 'st-reading'
  },
  read: {
    icon: 'check-circle',
    label: 'Lido',
    cls: 'st-read'
  }
};
function LivroDetail({
  book,
  status,
  favorite,
  review,
  readPct,
  onOpenReader,
  onOpenPlayer,
  onOpenStatus,
  onToggleFav,
  onToast
}) {
  const st = LM_STATUS[status] || LM_STATUS.none;
  return /*#__PURE__*/React.createElement("div", {
    className: "lm-screen lm-detail-scroll",
    "data-screen-label": "Ficha do livro"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-dhead"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lm-hbtn",
    onClick: () => onToast('Voltar à biblioteca'),
    "aria-label": "Voltar"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "arrow-left"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lm-hbrand"
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("em", null, "[IA]"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 8.5,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground)',
      marginLeft: 8,
      paddingLeft: 8,
      borderLeft: '1px solid var(--hairline)'
    }
  }, "Livros")), /*#__PURE__*/React.createElement("button", {
    className: "lm-hbtn",
    onClick: () => onToast('Link do livro copiado'),
    "aria-label": "Compartilhar"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "share-ios"
  }))), /*#__PURE__*/React.createElement(LmCover, {
    bg: book._coverBg,
    fg: book._coverFg,
    letter: book._coverLetter,
    width: 148,
    height: 212,
    fontSize: 54
  }), /*#__PURE__*/React.createElement("p", {
    className: "lm-cat"
  }, book.category, " \xB7 ", book._badge), /*#__PURE__*/React.createElement("h1", {
    className: "lm-title"
  }, book.title), /*#__PURE__*/React.createElement("p", {
    className: "lm-by"
  }, book.author), review && /*#__PURE__*/React.createElement("div", {
    className: "lm-rated"
  }, /*#__PURE__*/React.createElement(LmStars, {
    value: review.rating,
    readOnly: true,
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "Sua avalia\xE7\xE3o \xB7 ", LIVRO_RATING.labels[review.rating - 1])), /*#__PURE__*/React.createElement("div", {
    className: "lm-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Resumo"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, book.readingTime, " min")), /*#__PURE__*/React.createElement("div", {
    className: "sep"
  }), /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\xC1udio"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, Math.round(book.duration / 60), " min")), /*#__PURE__*/React.createElement("div", {
    className: "sep"
  }), /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Ideias"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, book._ideas.length)), /*#__PURE__*/React.createElement("div", {
    className: "sep"
  }), /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Ano"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, book.publishedYear))), /*#__PURE__*/React.createElement("p", {
    className: "lm-syn"
  }, book.summary), /*#__PURE__*/React.createElement("button", {
    className: 'lm-shelf ' + st.cls,
    onClick: onOpenStatus
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: st.icon
  }), /*#__PURE__*/React.createElement("span", null, st.label), /*#__PURE__*/React.createElement(LmIcon, {
    n: "nav-arrow-down",
    className: "lm-shelf-chev"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lm-quote"
  }, /*#__PURE__*/React.createElement("div", {
    className: "q-rule"
  }), /*#__PURE__*/React.createElement("blockquote", null, book._quote), /*#__PURE__*/React.createElement("cite", null, book._quoteBy)), /*#__PURE__*/React.createElement("section", {
    className: "lm-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-rule"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eb"
  }, "O que voc\xEA vai aprender"), /*#__PURE__*/React.createElement("h2", null, "Ideias centrais")), /*#__PURE__*/React.createElement("div", {
    className: "line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lm-ideas"
  }, book._ideas.map((idea, i) => /*#__PURE__*/React.createElement("div", {
    className: "lm-idea",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, idea.t), /*#__PURE__*/React.createElement("p", null, idea.p)))))), /*#__PURE__*/React.createElement("section", {
    className: "lm-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-rule"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eb"
  }, "Quem escreveu"), /*#__PURE__*/React.createElement("h2", null, "Sobre a autora")), /*#__PURE__*/React.createElement("div", {
    className: "line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lm-author"
  }, /*#__PURE__*/React.createElement("div", {
    className: "av"
  }, "JN"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Jane Nelsen"), /*#__PURE__*/React.createElement("p", null, book._authorBio)))), /*#__PURE__*/React.createElement("section", {
    className: "lm-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-rule"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eb"
  }, "Quem leu, leu tamb\xE9m"), /*#__PURE__*/React.createElement("h2", null, "Relacionados")), /*#__PURE__*/React.createElement("div", {
    className: "line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "lm-rel"
  }, book._related.map((r, i) => /*#__PURE__*/React.createElement("button", {
    className: "lm-rbook",
    key: i,
    onClick: () => onToast('Protótipo · abriria "' + r.t + '"')
  }, /*#__PURE__*/React.createElement(LmCover, {
    bg: r.bg,
    fg: r.fg,
    letter: r.l,
    width: 108,
    height: 154,
    fontSize: 38
  }), /*#__PURE__*/React.createElement("span", {
    className: "b-cat"
  }, r.cat), /*#__PURE__*/React.createElement("h3", null, r.t), /*#__PURE__*/React.createElement("p", {
    className: "b-by"
  }, r.by))))), /*#__PURE__*/React.createElement("a", {
    className: "lm-amz",
    href: "https://www.amazon.com.br/s?k=disciplina+positiva+de+0+a+3+anos",
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "cart"
  }), " Comprar o livro completo na Amazon")));
}

/* Barra de ações fixa (BookActionsMobile) */
function LivroActionBar({
  floating,
  status,
  favorite,
  readPct,
  onOpenReader,
  onOpenPlayer,
  onOpenStatus,
  onToggleFav
}) {
  const st = LM_STATUS[status] || LM_STATUS.none;
  const readLabel = status === 'read' ? 'Reler resumo' : readPct > 2 ? 'Continuar · ' + Math.round(readPct) + '%' : 'Ler resumo';
  return /*#__PURE__*/React.createElement("div", {
    className: 'lm-actionbar' + (floating ? ' floating' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "lm-btn-primary",
    onClick: onOpenReader
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "open-book"
  }), " ", readLabel), /*#__PURE__*/React.createElement("button", {
    className: "lm-btn-ico",
    onClick: onOpenPlayer,
    "aria-label": "Ouvir \xE1udio"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "headset"
  })), /*#__PURE__*/React.createElement("button", {
    className: 'lm-btn-ico ' + st.cls,
    onClick: onOpenStatus,
    "aria-label": "Status de leitura"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: st.icon
  })), /*#__PURE__*/React.createElement("button", {
    className: 'lm-btn-ico' + (favorite ? ' fav-on' : ''),
    onClick: onToggleFav,
    "aria-label": "Favoritar"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: favorite ? 'star-solid' : 'star'
  })));
}

/* Sheet de status de leitura */
function LivroStatusSheet({
  open,
  status,
  onClose,
  onChange
}) {
  const opts = [{
    id: 'want_to_read',
    icon: 'bookmark',
    label: 'Quero ler',
    hint: 'Salvar para depois',
    cls: 'st-want'
  }, {
    id: 'reading',
    icon: 'open-book',
    label: 'Lendo',
    hint: 'Estou no meio do resumo',
    cls: 'st-reading'
  }, {
    id: 'read',
    icon: 'check-circle',
    label: 'Lido',
    hint: 'Terminei este livro',
    cls: 'st-read'
  }];
  return /*#__PURE__*/React.createElement(LmSheet, {
    open: open,
    onClose: onClose,
    label: "Status de leitura"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-sheet-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eb"
  }, "Minha estante"), /*#__PURE__*/React.createElement("h2", null, "Status de leitura")), /*#__PURE__*/React.createElement("div", {
    className: "lm-status-list"
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    className: 'lm-status-row' + (status === o.id ? ' on ' + o.cls : ''),
    onClick: () => onChange(o.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: 'ic ' + o.cls
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: o.icon
  })), /*#__PURE__*/React.createElement("span", {
    className: "tx"
  }, /*#__PURE__*/React.createElement("b", null, o.label), /*#__PURE__*/React.createElement("small", null, o.hint)), status === o.id && /*#__PURE__*/React.createElement(LmIcon, {
    n: "check",
    className: "chk"
  }))), status !== 'none' && /*#__PURE__*/React.createElement("button", {
    className: "lm-status-row remove",
    onClick: () => onChange('none')
  }, /*#__PURE__*/React.createElement("span", {
    className: "ic"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "xmark"
  })), /*#__PURE__*/React.createElement("span", {
    className: "tx"
  }, /*#__PURE__*/React.createElement("b", null, "Remover da estante")))));
}
Object.assign(window, {
  LivroDetail,
  LivroActionBar,
  LivroStatusSheet,
  LM_STATUS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-detail.jsx", error: String((e && e.message) || e) }); }

// livros/livro-player.jsx
try { (() => {
// Player de áudio (sheet expandido + mini-player)
function lmFmt(s) {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60),
    r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}
const LM_SPEEDS = [1, 1.25, 1.5, 2];
function LivroPlayer({
  book,
  open,
  playing,
  time,
  speed,
  onClose,
  onTogglePlay,
  onSeek,
  onSpeed,
  onToast
}) {
  const total = book.duration;
  const chIdx = Math.min(book._chapters.length - 1, Math.floor(time / total * book._chapters.length));
  const chapter = book._chapters[chIdx];
  return /*#__PURE__*/React.createElement(LmSheet, {
    open: open,
    onClose: onClose,
    label: "Player de \xE1udio",
    className: "lm-player-sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-player",
    "data-screen-label": "Player de \xE1udio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lm-player-eb"
  }, "\xC1udio \xB7 Narra\xE7\xE3o Lend\xE1r[IA]"), /*#__PURE__*/React.createElement("div", {
    className: 'lm-player-cover' + (playing ? ' playing' : '')
  }, /*#__PURE__*/React.createElement(LmCover, {
    bg: book._coverBg,
    fg: book._coverFg,
    letter: book._coverLetter,
    width: 168,
    height: 240,
    fontSize: 60
  })), /*#__PURE__*/React.createElement("h2", {
    className: "lm-player-title"
  }, book.title), /*#__PURE__*/React.createElement("p", {
    className: "lm-player-ch"
  }, "Cap\xEDtulo ", String(chIdx + 1).padStart(2, '0'), " \u2014 ", chapter.title), /*#__PURE__*/React.createElement("div", {
    className: "lm-scrub"
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: total,
    step: "1",
    value: Math.round(time),
    style: {
      '--p': time / total * 100 + '%'
    },
    onChange: e => onSeek(parseInt(e.target.value, 10)),
    "aria-label": "Posi\xE7\xE3o do \xE1udio"
  }), /*#__PURE__*/React.createElement("div", {
    className: "times"
  }, /*#__PURE__*/React.createElement("span", null, lmFmt(time)), /*#__PURE__*/React.createElement("span", null, "\u2212", lmFmt(total - time)))), /*#__PURE__*/React.createElement("div", {
    className: "lm-player-ctl"
  }, /*#__PURE__*/React.createElement("button", {
    className: "spd",
    onClick: onSpeed
  }, speed, "\xD7"), /*#__PURE__*/React.createElement("button", {
    className: "skip",
    onClick: () => onSeek(Math.max(0, time - 15)),
    "aria-label": "Voltar 15s"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "undo"
  }), /*#__PURE__*/React.createElement("small", null, "15")), /*#__PURE__*/React.createElement("button", {
    className: "play",
    onClick: onTogglePlay,
    "aria-label": playing ? 'Pausar' : 'Reproduzir'
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: playing ? 'pause-solid' : 'play-solid'
  })), /*#__PURE__*/React.createElement("button", {
    className: "skip",
    onClick: () => onSeek(Math.min(total, time + 15)),
    "aria-label": "Avan\xE7ar 15s"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "redo"
  }), /*#__PURE__*/React.createElement("small", null, "15")), /*#__PURE__*/React.createElement("button", {
    className: "spd",
    onClick: () => onToast('Timer de sono — em breve'),
    "aria-label": "Timer"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "clock"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lm-player-chs"
  }, book._chapters.map((ch, i) => /*#__PURE__*/React.createElement("button", {
    key: ch.id,
    className: 'row' + (i === chIdx ? ' on' : ''),
    onClick: () => onSeek(i / book._chapters.length * total + 1)
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, ch.title), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, lmFmt(total / book._chapters.length)))))));
}
function LivroMiniPlayer({
  book,
  playing,
  time,
  onTogglePlay,
  onExpand,
  onDismiss,
  raised
}) {
  const total = book.duration;
  return /*#__PURE__*/React.createElement("div", {
    className: 'lm-mini' + (raised ? ' raised' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fill",
    style: {
      width: time / total * 100 + '%'
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "body",
    onClick: onExpand
  }, /*#__PURE__*/React.createElement(LmCover, {
    bg: book._coverBg,
    fg: book._coverFg,
    letter: book._coverLetter,
    width: 34,
    height: 48,
    fontSize: 15
  }), /*#__PURE__*/React.createElement("span", {
    className: "tx"
  }, /*#__PURE__*/React.createElement("b", null, book.title), /*#__PURE__*/React.createElement("small", null, playing ? 'Reproduzindo' : 'Pausado', " \xB7 ", lmFmt(time), " / ", lmFmt(total)))), /*#__PURE__*/React.createElement("button", {
    className: "pp",
    onClick: onTogglePlay,
    "aria-label": playing ? 'Pausar' : 'Reproduzir'
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: playing ? 'pause-solid' : 'play-solid'
  })), /*#__PURE__*/React.createElement("button", {
    className: "x",
    onClick: onDismiss,
    "aria-label": "Fechar player"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "xmark"
  })));
}
Object.assign(window, {
  LivroPlayer,
  LivroMiniPlayer,
  lmFmt,
  LM_SPEEDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-player.jsx", error: String((e && e.message) || e) }); }

// livros/livro-reader.jsx
try { (() => {
// Tela: Leitor mobile (modos de leitura, fonte, capítulos, destaques)
const LM_MODES = ['noite', 'papel', 'sepia'];
const LM_FS_MIN = 15,
  LM_FS_MAX = 25;
function LivroReader({
  book,
  open,
  mode,
  fontSize,
  favorite,
  isRead,
  onClose,
  onModeChange,
  onFontChange,
  onToggleFav,
  onToggleRead,
  onToast,
  onProgress
}) {
  const scrollRef = React.useRef(null);
  const articleRef = React.useRef(null);
  const [pct, setPct] = React.useState(0);
  const [focusMode, setFocusMode] = React.useState(false);
  const [fontOpen, setFontOpen] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const [curChapter, setCurChapter] = React.useState(null);
  const [selPop, setSelPop] = React.useState(null); // {x, y}
  const savedRange = React.useRef(null);
  const lastY = React.useRef(0);

  /* ---- progresso + modo foco + scrollspy ---- */
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const y = el.scrollTop;
    const p = max > 0 ? Math.min(100, Math.max(0, y / max * 100)) : 0;
    setPct(p);
    onProgress(p);
    if (y > 220 && y > lastY.current + 4) {
      setFocusMode(true);
      setFontOpen(false);
    } else if (y < lastY.current - 4 || y <= 220) setFocusMode(false);
    lastY.current = y;
    setSelPop(null);
    let cur = null;
    el.querySelectorAll('.lm-chapter').forEach(ch => {
      if (ch.getBoundingClientRect().top - el.getBoundingClientRect().top - 140 <= 0) cur = ch.dataset.id;
    });
    setCurChapter(cur);
    try {
      localStorage.setItem('lendaria-m-reader-scroll', String(y));
    } catch (e) {}
  };

  /* restaurar posição ao abrir */
  React.useEffect(() => {
    if (open && scrollRef.current) {
      let y = 0;
      try {
        y = parseInt(localStorage.getItem('lendaria-m-reader-scroll'), 10) || 0;
      } catch (e) {}
      scrollRef.current.scrollTop = y;
    }
  }, [open]);

  /* ---- seleção de texto → popover destacar/copiar ---- */
  const handleMouseUp = e => {
    if (e.target.closest && e.target.closest('.lm-selpop')) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelPop(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const art = articleRef.current;
      if (!art || !art.contains(range.commonAncestorContainer)) {
        setSelPop(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width < 2) {
        setSelPop(null);
        return;
      }
      const host = scrollRef.current.getBoundingClientRect();
      savedRange.current = range.cloneRange();
      setSelPop({
        x: rect.left + rect.width / 2 - host.left,
        y: rect.top - host.top + scrollRef.current.scrollTop
      });
    }, 10);
  };
  const doHighlight = () => {
    if (savedRange.current) {
      try {
        const mark = document.createElement('mark');
        mark.className = 'hl';
        savedRange.current.surroundContents(mark);
        onToast('Trecho destacado');
      } catch (err) {
        onToast('Selecione dentro de um parágrafo');
      }
    }
    window.getSelection().removeAllRanges();
    setSelPop(null);
  };
  const doCopy = () => {
    if (savedRange.current) {
      try {
        navigator.clipboard.writeText(savedRange.current.toString());
      } catch (e) {}
      onToast('Trecho copiado');
    }
    window.getSelection().removeAllRanges();
    setSelPop(null);
  };

  /* remover destaque ao tocar nele */
  const handleArticleClick = e => {
    const m = e.target.closest && e.target.closest('mark.hl');
    if (m) {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
      onToast('Destaque removido');
    }
  };
  const goToChapter = id => {
    const el = scrollRef.current;
    const ch = el && el.querySelector('[data-id="' + id + '"]');
    if (ch) {
      const top = ch.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 86;
      el.scrollTo({
        top: top,
        behavior: 'smooth'
      });
    }
    setTocOpen(false);
  };
  const cycleMode = () => {
    const next = LM_MODES[(LM_MODES.indexOf(mode) + 1) % LM_MODES.length];
    onModeChange(next);
    onToast('Modo ' + (next === 'noite' ? 'Noite' : next === 'papel' ? 'Papel' : 'Sépia'));
  };
  const restMin = Math.max(0, Math.ceil(book.readingTime * (1 - pct / 100)));
  return /*#__PURE__*/React.createElement("div", {
    className: 'lm-reader rd-' + mode + (open ? ' open' : ''),
    "data-screen-label": "Leitor",
    style: {
      '--lm-reading-size': fontSize + 'px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-rd-rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fill",
    style: {
      width: pct.toFixed(1) + '%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: 'lm-rd-bar' + (focusMode ? ' hide' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "lm-hbtn",
    onClick: onClose,
    "aria-label": "Voltar \xE0 ficha"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "arrow-left"
  })), /*#__PURE__*/React.createElement("div", {
    className: "tt"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cat"
  }, book.category, " \xB7 ", book._badge), /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, book.title)), /*#__PURE__*/React.createElement("span", {
    className: "pr"
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    className: "lm-rd-scroll",
    ref: scrollRef,
    onScroll: handleScroll,
    onMouseUp: handleMouseUp
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-splash"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cat"
  }, book.category, " \xB7 ", book._badge), /*#__PURE__*/React.createElement("h1", {
    dangerouslySetInnerHTML: {
      __html: book._titleHtml
    }
  }), /*#__PURE__*/React.createElement("p", {
    className: "by"
  }, book.author), /*#__PURE__*/React.createElement("p", {
    className: "meta"
  }, book.readingTime, " min de leitura \xB7 ", book._chapters.length, " cap\xEDtulos"), /*#__PURE__*/React.createElement("div", {
    className: "s-rule"
  })), /*#__PURE__*/React.createElement("article", {
    className: "lm-article",
    ref: articleRef,
    onClick: handleArticleClick
  }, /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, book._lead), book._chapters.map((ch, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: ch.id
  }, /*#__PURE__*/React.createElement("section", {
    className: "lm-chapter",
    "data-id": ch.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "ch-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Cap\xEDtulo ", String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("h2", {
    dangerouslySetInnerHTML: {
      __html: ch.titleHtml
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "line"
  })), ch.paras.map((p, j) => /*#__PURE__*/React.createElement("p", {
    key: j,
    dangerouslySetInnerHTML: {
      __html: p
    }
  }))), ch.pull && /*#__PURE__*/React.createElement("div", {
    className: "lm-pull"
  }, /*#__PURE__*/React.createElement("blockquote", null, book._quote), /*#__PURE__*/React.createElement("cite", null, book._quoteBy)))), /*#__PURE__*/React.createElement("div", {
    className: "lm-tldr"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "flash"
  }), " Em resumo"), /*#__PURE__*/React.createElement("p", null, book._tldr)), /*#__PURE__*/React.createElement("div", {
    className: "lm-end"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fim"
  }, "\xB7 Fim do resumo \xB7"), /*#__PURE__*/React.createElement("button", {
    className: 'lm-btn-primary done' + (isRead ? ' is-read' : ''),
    onClick: onToggleRead
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: isRead ? 'check-circle' : 'check'
  }), " ", isRead ? 'Lido' : 'Marcar como lido'), /*#__PURE__*/React.createElement("button", {
    className: "lib",
    onClick: onClose
  }, "voltar \xE0 ficha do livro \u2192"))), selPop && /*#__PURE__*/React.createElement("div", {
    className: "lm-selpop",
    style: {
      left: selPop.x,
      top: selPop.y
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: doHighlight
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "edit-pencil"
  }), " Destacar"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: doCopy
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "copy"
  }), " Copiar"))), fontOpen && /*#__PURE__*/React.createElement("div", {
    className: 'lm-fontpop' + (focusMode ? ' hide' : '')
  }, /*#__PURE__*/React.createElement("button", {
    disabled: fontSize <= LM_FS_MIN,
    onClick: () => onFontChange(Math.max(LM_FS_MIN, fontSize - 2))
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, "A\u2212")), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, fontSize, "px"), /*#__PURE__*/React.createElement("button", {
    disabled: fontSize >= LM_FS_MAX,
    onClick: () => onFontChange(Math.min(LM_FS_MAX, fontSize + 2))
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 21
    }
  }, "A+"))), /*#__PURE__*/React.createElement("div", {
    className: 'lm-rd-toolbar' + (focusMode ? ' hide' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: fontOpen ? 'on' : '',
    onClick: () => setFontOpen(!fontOpen),
    "aria-label": "Tamanho da fonte"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aa"
  }, "A")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setFontOpen(false);
      setTocOpen(true);
    },
    "aria-label": "Cap\xEDtulos"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "list"
  })), /*#__PURE__*/React.createElement("button", {
    className: favorite ? 'on' : '',
    onClick: () => {
      setFontOpen(false);
      onToggleFav();
    },
    "aria-label": "Favoritar"
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: favorite ? 'star-solid' : 'star'
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setFontOpen(false);
      cycleMode();
    },
    "aria-label": "Modo de leitura"
  }, /*#__PURE__*/React.createElement("span", {
    className: 'sw sw-' + mode
  }))), /*#__PURE__*/React.createElement(LmSheet, {
    open: tocOpen,
    onClose: () => setTocOpen(false),
    label: "Cap\xEDtulos",
    className: "lm-toc-sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-toc-head"
  }, /*#__PURE__*/React.createElement(LmCover, {
    bg: book._coverBg,
    fg: book._coverFg,
    letter: book._coverLetter,
    width: 48,
    height: 68,
    fontSize: 22
  }), /*#__PURE__*/React.createElement("div", {
    className: "bk"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, book.category), /*#__PURE__*/React.createElement("h3", null, book.title), /*#__PURE__*/React.createElement("p", {
    className: "a"
  }, book._authorShort))), /*#__PURE__*/React.createElement("div", {
    className: "lm-toc-list"
  }, book._chapters.map((ch, i) => /*#__PURE__*/React.createElement("button", {
    key: ch.id,
    className: 'lm-toc-item' + (curChapter === ch.id ? ' on' : ''),
    onClick: () => goToChapter(ch.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, ch.title))))));
}
Object.assign(window, {
  LivroReader
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-reader.jsx", error: String((e && e.message) || e) }); }

// livros/livro-review.jsx
try { (() => {
// Sheet de avaliação do livro (BookRatingModal → mobile)
function LivroReview({
  book,
  open,
  onClose,
  onSubmit,
  onSkip
}) {
  const [rating, setRating] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  const [tags, setTags] = React.useState([]);
  const [learned, setLearned] = React.useState(null);
  const [comment, setComment] = React.useState('');
  React.useEffect(() => {
    if (open) {
      setRating(null);
      setHover(null);
      setTags([]);
      setLearned(null);
      setComment('');
    }
  }, [open]);
  const toggleTag = t => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.concat(t));
  const display = hover != null ? hover : rating;
  const showTags = rating != null && (rating <= 2 || rating >= 4);
  const tagList = rating != null && rating <= 2 ? LIVRO_RATING.negative : LIVRO_RATING.positive;
  return /*#__PURE__*/React.createElement(LmSheet, {
    open: open,
    onClose: onClose,
    label: "Avaliar livro",
    className: "lm-review-sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-review",
    "data-screen-label": "Avalia\xE7\xE3o"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lm-sheet-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eb"
  }, "Sua opini\xE3o treina a Lend\xE1r[IA]"), /*#__PURE__*/React.createElement("h2", null, "O que voc\xEA achou de ", /*#__PURE__*/React.createElement("em", null, book.title), "?")), /*#__PURE__*/React.createElement("div", {
    className: "lm-rate-row"
  }, /*#__PURE__*/React.createElement(LmStars, {
    value: rating,
    hover: hover,
    onPick: setRating,
    onHover: setHover,
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    className: 'lbl' + (display ? ' on' : '')
  }, display ? LIVRO_RATING.labels[display - 1] : 'Toque para avaliar')), showTags && /*#__PURE__*/React.createElement("div", {
    className: "lm-review-sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, rating <= 2 ? 'O que não funcionou?' : 'O que funcionou bem?'), /*#__PURE__*/React.createElement("div", {
    className: "lm-chips"
  }, tagList.map(t => /*#__PURE__*/React.createElement(LmChip, {
    key: t,
    label: t,
    on: tags.includes(t),
    onClick: () => toggleTag(t)
  })))), rating != null && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "lm-review-sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Voc\xEA aprendeu algo novo?"), /*#__PURE__*/React.createElement("div", {
    className: "lm-chips"
  }, /*#__PURE__*/React.createElement(LmChip, {
    label: "Sim, aprendi",
    on: learned === true,
    onClick: () => setLearned(true)
  }), /*#__PURE__*/React.createElement(LmChip, {
    label: "N\xE3o muito",
    on: learned === false,
    onClick: () => setLearned(false)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lm-review-sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Coment\xE1rio ", /*#__PURE__*/React.createElement("i", null, "(opcional)")), /*#__PURE__*/React.createElement("textarea", {
    className: "lm-textarea",
    rows: "3",
    placeholder: "O que mais marcou voc\xEA neste resumo?",
    value: comment,
    onChange: e => setComment(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lm-review-acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "lm-btn-primary",
    disabled: rating == null,
    onClick: () => onSubmit({
      rating: rating,
      tags: tags,
      learned: learned,
      comment: comment
    })
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: "check"
  }), " Enviar avalia\xE7\xE3o"), /*#__PURE__*/React.createElement("button", {
    className: "lm-skip",
    onClick: onSkip
  }, "Pular por enquanto"))));
}
Object.assign(window, {
  LivroReview
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-review.jsx", error: String((e && e.message) || e) }); }

// livros/livro-ui.jsx
try { (() => {
// Componentes compartilhados do protótipo mobile /livro
// Exporta para window: LmIcon, LmSheet, LmStars, LmChip, LmCover
// Ícones em SVG inline (stroke 1.7, 24×24) — sem dependência de fonte externa.

const LM_ICONS = {
  'arrow-left': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 18l-6-6 6-6"
  })),
  'share-ios': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 15V3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 7l4-4 4 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"
  })),
  'nav-arrow-down': /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }),
  'check': /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7"
  }),
  'check-circle': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 12.5l2.7 2.7L16 9"
  })),
  'xmark': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 6L6 18"
  })),
  'list': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 12h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 18h10"
  })),
  'star': /*#__PURE__*/React.createElement("path", {
    d: "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8l-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2z"
  }),
  'star-solid': /*#__PURE__*/React.createElement("path", {
    d: "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8l-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2z",
    fill: "currentColor",
    stroke: "none"
  }),
  'bookmark': /*#__PURE__*/React.createElement("path", {
    d: "M6 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4-6 4z"
  }),
  'bookmark-solid': /*#__PURE__*/React.createElement("path", {
    d: "M6 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4-6 4z",
    fill: "currentColor",
    stroke: "none"
  }),
  'open-book': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M12 6.5C10 5 7.5 4.5 4 4.5V18c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4.5c-3.5 0-6 .5-8 2z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6.5V20"
  })),
  'headset': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M4 15v-2a8 8 0 0 1 16 0v2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3.5",
    y: "14",
    width: "4",
    height: "6.5",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "16.5",
    y: "14",
    width: "4",
    height: "6.5",
    rx: "1.5"
  })),
  'cart': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "19.5",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16.8",
    cy: "19.5",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 4.5h2l2.4 10.5h10L20.8 7H6"
  })),
  'flash': /*#__PURE__*/React.createElement("path", {
    d: "M13 2.8L5 14h6l-1 7.2L18 10h-6l1-7.2z"
  }),
  'edit-pencil': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M14.4 4.8l4.8 4.8L8 20.8H3.2V16L14.4 4.8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12.6 6.6l4.8 4.8"
  })),
  'copy': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: "8.5",
    y: "8.5",
    width: "12",
    height: "12",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"
  })),
  'play-solid': /*#__PURE__*/React.createElement("path", {
    d: "M8 5.3v13.4c0 .8.9 1.3 1.6.9l10.4-6.7c.6-.4.6-1.4 0-1.8L9.6 4.4c-.7-.4-1.6.1-1.6.9z",
    fill: "currentColor",
    stroke: "none"
  }),
  'pause-solid': /*#__PURE__*/React.createElement("g", {
    fill: "currentColor",
    stroke: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "6.5",
    y: "4.5",
    width: "4",
    height: "15",
    rx: "1.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13.5",
    y: "4.5",
    width: "4",
    height: "15",
    rx: "1.2"
  })),
  'undo': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 4.5v5.5H8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4.2 14.5a8.2 8.2 0 1 0 .6-7L2.5 10"
  })),
  'redo': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M21.5 4.5v5.5H16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.8 14.5a8.2 8.2 0 1 1-.6-7L21.5 10"
  })),
  'clock': /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7.5V12l3 2"
  }))
};
function LmIcon({
  n,
  style,
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    className: 'lm-i' + (className ? ' ' + className : ''),
    style: style,
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, LM_ICONS[n] || null);
}

/* Capa do livro (fallback tipográfico, igual ao desktop) */
function LmCover({
  bg,
  fg,
  letter,
  width,
  height,
  fontSize
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lm-cover",
    style: {
      background: bg,
      color: fg,
      width: width,
      height: height
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "cv-i",
    style: {
      fontSize: fontSize
    }
  }, letter));
}

/* Bottom sheet com scrim — posicionado dentro do device */
function LmSheet({
  open,
  onClose,
  children,
  className,
  label
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: 'lm-scrim' + (open ? ' open' : ''),
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: 'lm-sheet' + (open ? ' open' : '') + (className ? ' ' + className : ''),
    role: "dialog",
    "aria-label": label
  }, /*#__PURE__*/React.createElement("button", {
    className: "lm-grab",
    onClick: onClose,
    "aria-label": "Fechar"
  }, /*#__PURE__*/React.createElement("span", null)), children));
}

/* Estrelas de avaliação */
function LmStars({
  value,
  hover,
  onPick,
  onHover,
  size,
  readOnly
}) {
  const v = (hover != null ? hover : value) || 0;
  return /*#__PURE__*/React.createElement("div", {
    className: 'lm-stars' + (readOnly ? ' ro' : ''),
    onMouseLeave: onHover ? () => onHover(null) : undefined
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: 'lm-star' + (i <= v ? ' on' : ''),
    style: size ? {
      fontSize: size
    } : undefined,
    disabled: readOnly,
    onClick: onPick ? () => onPick(i) : undefined,
    onMouseEnter: onHover ? () => onHover(i) : undefined,
    "aria-label": i + ' de 5'
  }, /*#__PURE__*/React.createElement(LmIcon, {
    n: i <= v ? 'star-solid' : 'star'
  }))));
}

/* Chip selecionável (tags da avaliação) */
function LmChip({
  label,
  on,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: 'lm-chip' + (on ? ' on' : ''),
    onClick: onClick
  }, label);
}
Object.assign(window, {
  LmIcon,
  LmSheet,
  LmStars,
  LmChip,
  LmCover
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/livro-ui.jsx", error: String((e && e.message) || e) }); }

// livros/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "livros/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// quick-search.js
try { (() => {
/* quick-search.js — busca do masthead de Livros.
   Agora delega para a busca GLOBAL unificada (app-search.js), que cobre
   Cursos · Livros · Comunidade. Mantido porque toda página de Livros já o
   carrega: assim a unificação chega sem editar cada página.
   Carrega app-search.js (mesma raiz) que liga o gatilho .mast-search. */
(function () {
  if (window.AppSearch) return; // já ativa (ex.: via _ds_bundle.js)
  if (document.querySelector('script[data-app-search-src]')) return;
  var me = document.currentScript;
  var src = me ? me.src.replace(/quick-search\.js[^/]*$/, 'app-search.js?v=2') : '../app-search.js?v=2';
  var s = document.createElement('script');
  s.src = src;
  s.setAttribute('data-app-search-src', '1');
  document.head.appendChild(s);
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "quick-search.js", error: String((e && e.message) || e) }); }

// site/arvore-data.js
try { (() => {
/* =============================================================================
   A ÁRVORE DA FORJA — DADOS DOS NOVE EIXOS
   Fonte única da Árvore. Os nomes de grau por eixo e os 45 ícones canônicos
   vivem em forja-icons.js no projeto de origem — quando esse arquivo chegar,
   basta enriquecer cada eixo com { graus: [...], icones: [...] }.
   ============================================================================= */

window.ARVORE_GRAUS = ["Sombra Absoluta", "Sombra Ativa", "Equilíbrio", "Luz Emergente", "Luz Integrada"];
window.ARVORE_EIXOS = [{
  nome: "Presença"
}, {
  nome: "Foco"
}, {
  nome: "Sentido"
}, {
  nome: "Coragem"
}, {
  nome: "Reação"
}, {
  nome: "Realização"
}, {
  nome: "Profundidade"
}, {
  nome: "Aceitação"
}, {
  nome: "Avareza"
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "site/arvore-data.js", error: String((e && e.message) || e) }); }

// site/espelho.js
try { (() => {
/* =============================================================================
   O ESPELHO DA FORJA — interações
   embers · ciclos · régua · matriz (modal) · 39 linhas · autoexame · chrome
   ============================================================================= */
(function () {
  'use strict';

  var GOLD = '#f6c324',
    RED = '#e63946',
    EMBER = '#8b0000',
    INK = '#e8dcc4',
    MUTE = '#82765f',
    VOID = '#080503';
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function E(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function ready(fn) {
    if (document.readyState !== 'loading') fn();else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ───────── brasas (embers) ───────── */
  function embers() {
    var canvas = document.getElementById('embers');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w,
      h,
      parts = [];
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    var N = Math.min(40, Math.round(w / 42));
    for (var i = 0; i < N; i++) parts.push(spark(true));
    function spark(init) {
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.15 + Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.12 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        gold: Math.random() > 0.42
      };
    }
    var raf,
      running = false;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += 0.04;
        if (p.y < -10) parts[i] = spark(false);
        var fl = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = (p.gold ? 'rgba(246,195,36,' : 'rgba(230,90,40,') + fl.toFixed(3) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (!running && !reduceMotion) {
        running = true;
        tick();
      }
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    if (!reduceMotion) start();else {
      /* static dusting */for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = (p.gold ? 'rgba(246,195,36,' : 'rgba(230,90,40,') + p.a.toFixed(3) + ')';
        ctx.fill();
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();else start();
    });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        stop();
        resize();
        parts = [];
        for (var i = 0; i < N; i++) parts.push(spark(true));
        start();
      }, 200);
    });
  }

  /* ───────── chrome: topbar scroll, toc spy, reveal ───────── */
  function chrome() {
    var topbar = document.querySelector('.topbar');
    function onScroll() {
      if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    if (!reduceMotion) {
      document.body.classList.add('rv-init');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -5% 0px'
      });
      document.querySelectorAll('.rv').forEach(function (el) {
        io.observe(el);
      });
    }
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    var map = {};
    links.forEach(function (a) {
      map[a.getAttribute('href').slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) {
            l.classList.remove('active');
          });
          if (map[e.target.id]) map[e.target.id].classList.add('active');
        }
      });
    }, {
      rootMargin: '-28% 0px -64% 0px'
    });
    ['ciclos', 'pilares', 'espelho', 'matriz', 'regua', 'autoexame'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    document.querySelectorAll('.ft-form').forEach(function (f) {
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        f.classList.add('sent');
      });
    });
  }

  /* ───────── O MAPA DOS DOIS CICLOS ───────── */
  function multiline(parent, label, x, y, fill, fs, ls) {
    var lines = label.indexOf(' & ') > -1 ? label.split(' & ').map(function (s, i) {
      return i === 0 ? s + ' &' : s;
    }) : label.length > 14 ? wrap2(label) : [label];
    var t = E('text', {
      x: x,
      'text-anchor': 'middle',
      fill: fill,
      'font-family': 'Cinzel, serif',
      'font-size': fs,
      'letter-spacing': ls || '0.08em'
    });
    var y0 = y - (lines.length - 1) * (fs * 0.62);
    lines.forEach(function (ln, i) {
      var ts = E('tspan', {
        x: x,
        y: (y0 + i * fs * 1.24).toFixed(1)
      });
      ts.textContent = ln.toUpperCase();
      t.appendChild(ts);
    });
    parent.appendChild(t);
  }
  function wrap2(s) {
    var words = s.split(' ');
    if (words.length < 2) return [s];
    var mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  function renderCiclo(svg, cfg) {
    var W = 480,
      H = 452,
      cx = 240,
      cy = 212,
      rx = 176,
      ry = 150,
      col = cfg.color,
      dim = cfg.side === 'm' ? 0.78 : 1;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var defs = E('defs', {});
    defs.innerHTML = '<marker id="arr-' + cfg.side + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="' + 0.85 * dim + '"/></marker>';
    svg.appendChild(defs);
    function pos(angDeg, RX, RY) {
      var a = angDeg * Math.PI / 180;
      return {
        x: cx + Math.cos(a) * RX,
        y: cy + Math.sin(a) * RY
      };
    }

    // outer guide ellipse
    svg.appendChild(E('ellipse', {
      cx: cx,
      cy: cy,
      rx: rx,
      ry: ry,
      fill: 'none',
      stroke: col,
      'stroke-width': 1,
      'stroke-dasharray': '1 7',
      'stroke-linecap': 'round',
      opacity: 0.32 * dim
    }));

    // outer flow arcs between consecutive nodes (with arrowheads)
    var angs = cfg.outer.map(function (o) {
      return o.ang;
    });
    var order = angs.slice().sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < order.length; i++) {
      var a1 = order[i],
        a2 = order[(i + 1) % order.length];
      var span = (a2 - a1 + 360) % 360;
      var startA = cfg.dir > 0 ? a1 : a2;
      var sweepA = cfg.dir > 0 ? span : -span;
      // sub-arc trimmed so it doesn't touch labels
      var pad = 16 * (cfg.dir > 0 ? 1 : -1);
      var pA = pos(startA + pad / 2, rx, ry),
        pB = pos(startA + sweepA - pad / 2, rx, ry);
      var laf = Math.abs(sweepA) > 180 ? 1 : 0;
      var swf = cfg.dir > 0 ? 1 : 0;
      var path = E('path', {
        d: 'M' + pA.x.toFixed(1) + ',' + pA.y.toFixed(1) + ' A' + rx + ',' + ry + ' 0 ' + laf + ' ' + swf + ' ' + pB.x.toFixed(1) + ',' + pB.y.toFixed(1),
        fill: 'none',
        stroke: col,
        'stroke-width': 1.4,
        'stroke-dasharray': '2 6',
        'stroke-linecap': 'round',
        opacity: 0.5 * dim,
        'marker-end': 'url(#arr-' + cfg.side + ')'
      });
      svg.appendChild(path);
    }

    // outer node markers + labels
    cfg.outer.forEach(function (o) {
      var p = pos(o.ang, rx, ry);
      svg.appendChild(E('circle', {
        cx: p.x,
        cy: p.y,
        r: 3,
        fill: col,
        opacity: 0.9 * dim
      }));
      // label offset outward
      var a = o.ang * Math.PI / 180;
      var lx = cx + Math.cos(a) * (rx + 30),
        ly = cy + Math.sin(a) * (ry + 26) + 4;
      multiline(svg, o.label, lx, ly, INK, 12.5, '0.06em');
    });

    // inner triangle (3 nodes) + central sigla
    var ir = 64;
    var ip = cfg.inner.map(function (n) {
      return pos(n.ang, ir, ir * 0.92);
    });
    var tri = E('path', {
      d: 'M' + ip[0].x.toFixed(1) + ',' + ip[0].y.toFixed(1) + ' L' + ip[1].x.toFixed(1) + ',' + ip[1].y.toFixed(1) + ' L' + ip[2].x.toFixed(1) + ',' + ip[2].y.toFixed(1) + ' Z',
      fill: 'none',
      stroke: col,
      'stroke-width': 1,
      'stroke-dasharray': '2 5',
      'stroke-linecap': 'round',
      opacity: 0.45 * dim
    });
    svg.appendChild(tri);
    // sigla
    var sig = E('text', {
      x: cx,
      y: cy + 9,
      'text-anchor': 'middle',
      fill: col,
      'font-family': 'Archivo Black, sans-serif',
      'font-size': 30,
      opacity: 0.9 * dim,
      'letter-spacing': '0.04em'
    });
    sig.textContent = cfg.sigla;
    svg.appendChild(sig);
    var glow = E('circle', {
      cx: cx,
      cy: cy,
      r: 46,
      fill: cfg.side === 'm' ? 'rgba(139,0,0,0.18)' : 'rgba(246,195,36,0.10)'
    });
    svg.insertBefore(glow, svg.firstChild.nextSibling);
    // inner labels (small)
    cfg.inner.forEach(function (n, k) {
      var p = ip[k];
      var a = n.ang * Math.PI / 180;
      var lx = cx + Math.cos(a) * (ir + 8),
        ly = cy + Math.sin(a) * (ir * 0.92 + 6);
      // push top label up, bottom labels down/out
      var oy = n.ang < -60 ? -10 : 14;
      multiline(svg, n.label, lx, ly + oy, MUTE, 9.5, '0.08em');
    });
  }
  function ciclos() {
    var mSvg = document.getElementById('cicloM'),
      lSvg = document.getElementById('cicloL');
    if (mSvg) renderCiclo(mSvg, {
      side: 'm',
      color: RED,
      dir: -1,
      sigla: 'AI',
      outer: [{
        label: 'Confusão',
        ang: -90
      }, {
        label: 'Ser',
        ang: -30
      }, {
        label: 'Corrida de Ratos',
        ang: 30
      }, {
        label: 'Fazer',
        ang: 90
      }, {
        label: 'Frustração',
        ang: 150
      }, {
        label: 'Ter',
        ang: 210
      }],
      inner: [{
        label: 'Alienação & Ignorância',
        ang: -90
      }, {
        label: 'Ação Imediatista',
        ang: 150
      }, {
        label: 'Automático & Insignif.',
        ang: 30
      }]
    });
    if (lSvg) renderCiclo(lSvg, {
      side: 'l',
      color: GOLD,
      dir: 1,
      sigla: 'IA',
      outer: [{
        label: 'Clareza',
        ang: -90
      }, {
        label: 'Fazer',
        ang: -30
      }, {
        label: 'Realização & Propósito',
        ang: 30
      }, {
        label: 'Ter',
        ang: 90
      }, {
        label: 'Liberdade',
        ang: 150
      }, {
        label: 'Ser',
        ang: 210
      }],
      inner: [{
        label: 'Inteligência & Autoconhec.',
        ang: -90
      }, {
        label: 'Inteligência Artificial',
        ang: 150
      }, {
        label: 'Impacto & Arte',
        ang: 30
      }]
    });
  }

  /* ───────── 39 linhas: expandir ───────── */
  function tabela() {
    var table = document.getElementById('espTable'),
      btn = document.getElementById('espToggle'),
      label = document.getElementById('espToggleLabel');
    if (!table || !btn) return;
    btn.addEventListener('click', function () {
      var open = table.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      label.innerHTML = open ? 'Recolher o espelho ↑' : 'Ver as <span class="esp-count">39 linhas</span> completas ↓';
    });
  }

  /* ───────── ícones (matriz + régua) ───────── */
  var ICO_M = {
    1: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="7"></circle></svg>',
    2: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="6"></circle><path class="ico" d="M-8,-8 A11,11 0 0 0 -8,8"></path><path class="ico" d="M8,-8 A11,11 0 0 1 8,8"></path></svg>',
    3: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="6"></circle><circle class="ico" cx="-13" cy="-7" r="3"></circle><circle class="ico" cx="13" cy="-7" r="3"></circle><circle class="ico" cx="-13" cy="9" r="3"></circle><circle class="ico" cx="13" cy="9" r="3"></circle><path class="ico" d="M-5,-3 L-11,-6 M5,-3 L11,-6 M-5,4 L-11,8 M5,4 L11,8"></path></svg>'
  };
  var ICO_L = {
    1: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="5"></circle><path class="ico" d="M0,-13 L0,-10 M9,-9 L7,-7 M13,0 L10,0 M9,9 L7,7 M0,13 L0,10 M-9,9 L-7,7 M-13,0 L-10,0 M-9,-9 L-7,-7"></path></svg>',
    2: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="6"></circle><path class="ico" d="M-8,-8 A11,11 0 0 0 -8,8"></path><path class="ico" d="M8,-8 A11,11 0 0 1 8,8"></path></svg>',
    3: '<svg width="30" height="30" viewBox="-19 -19 38 38"><circle class="ico fill" cx="0" cy="0" r="6"></circle><circle class="ico" cx="-13" cy="-7" r="3"></circle><circle class="ico" cx="13" cy="-7" r="3"></circle><circle class="ico" cx="-13" cy="9" r="3"></circle><circle class="ico" cx="13" cy="9" r="3"></circle><path class="ico" d="M-5,-3 L-11,-6 M5,-3 L11,-6 M-5,4 L-11,8 M5,4 L11,8"></path></svg>'
  };

  /* ───────── A MATRIZ: diálogo dos gêmeos (modal) ───────── */
  var openMatriz = null;
  function matriz() {
    var DATA = {
      1: {
        grau: 'Grau I · Pessoal',
        titulo: 'A força contida em <em>uma vida.</em>',
        sub: 'A escala mais íntima: o que você faz consigo quando ninguém vê. O dano — ou o ouro — não sai de você.',
        m: {
          nome: 'Medíocre Interno',
          verb: 'destrói só a si',
          txt: 'A Sombra venceu dentro de si. Adia o que importa, terceiriza a culpa, entrega o mínimo — e chama isso de prudência. O estrago fica contido numa única vida: a sua.'
        },
        l: {
          nome: 'Lendário Interno',
          verb: 'forjou a si mesmo',
          txt: 'Atravessou o próprio fogo e manteve o ouro puro. Disciplina sem plateia, critério sem aplauso. Ainda não acende ninguém — mas já não mente para si.'
        }
      },
      2: {
        grau: 'Grau II · Relacional',
        titulo: 'A força que <em>contamina ou contagia.</em>',
        sub: 'A escala dos próximos: o time, a casa, o círculo. Aqui a sua direção deixa de ser só sua e vira clima ao redor.',
        m: {
          nome: 'Medíocre Propagador',
          verb: 'apaga a chama dos próximos',
          txt: 'Não afunda sozinho: contamina. Ridiculariza o esforço alheio, desencoraja quem tenta, normaliza o mínimo no grupo. Ao seu redor, a mediocridade vira cultura.'
        },
        l: {
          nome: 'Lendário Propagador',
          verb: 'estende a chama aos próximos',
          txt: 'O que forjou em si, acende no outro. Puxa o time para cima, cobra com generosidade, transforma presença em exemplo. A excelência deixa de ser solo.'
        }
      },
      3: {
        grau: 'Grau III · Coletivo',
        titulo: 'A força que <em>molda multidões.</em>',
        sub: 'A escala máxima: sistemas, métodos, instituições. O que você constrói aqui se reproduz mesmo sem você.',
        m: {
          nome: 'Forjador de Medíocres',
          verb: 'multiplica a sombra',
          txt: 'No topo da escala da sombra: ergue sistemas que produzem conformismo em série. Ensina o atalho, vende a fórmula que derrete no fogo real, institucionaliza a desculpa.'
        },
        l: {
          nome: 'Forjador de Lendários',
          verb: 'multiplica a luz',
          txt: 'O ofício no grau máximo: constrói o que forja outros forjadores. Não entrega o peixe nem a vara — ensina a temperar o próprio aço. Legado que se reproduz sem depender dele.'
        }
      }
    };
    var modal = document.getElementById('mxModal');
    if (!modal) return;
    var lastFocus = null;
    var g = {
      grau: document.getElementById('mxGrau'),
      title: document.getElementById('mxTitle'),
      sub: document.getElementById('mxSub'),
      icoM: document.getElementById('mxIcoM'),
      nomeM: document.getElementById('mxNomeM'),
      txtM: document.getElementById('mxTxtM'),
      verbM: document.getElementById('mxVerbM'),
      icoL: document.getElementById('mxIcoL'),
      nomeL: document.getElementById('mxNomeL'),
      txtL: document.getElementById('mxTxtL'),
      verbL: document.getElementById('mxVerbL')
    };
    openMatriz = function (k) {
      k = String(k);
      var d = DATA[k];
      if (!d) return;
      g.grau.textContent = d.grau;
      g.title.innerHTML = d.titulo;
      g.sub.textContent = d.sub;
      g.icoM.innerHTML = ICO_M[k];
      g.nomeM.textContent = d.m.nome;
      g.txtM.textContent = d.m.txt;
      g.verbM.textContent = '“' + d.m.verb + '”';
      g.icoL.innerHTML = ICO_L[k];
      g.nomeL.textContent = d.l.nome;
      g.txtL.textContent = d.l.txt;
      g.verbL.textContent = '“' + d.l.verb + '”';
      lastFocus = document.activeElement;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var x = modal.querySelector('.x');
      if (x) x.focus();
    };
    function close() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll('.caixa').forEach(function (c) {
      c.addEventListener('click', function () {
        openMatriz(c.getAttribute('data-grau'));
      });
    });
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  /* ───────── A RÉGUA DO ESPECTRO ───────── */
  function regua() {
    var svg = document.getElementById('reguaSvg');
    if (!svg) return;
    var cx = 520,
      baseY = 200;
    var defs = E('defs', {});
    defs.innerHTML = '<radialGradient id="rgL"><stop offset="0%" stop-color="' + GOLD + '" stop-opacity="0.42"/><stop offset="100%" stop-color="' + GOLD + '" stop-opacity="0"/></radialGradient>' + '<radialGradient id="rgV"><stop offset="0%" stop-color="' + EMBER + '" stop-opacity="0.5"/><stop offset="100%" stop-color="' + EMBER + '" stop-opacity="0"/></radialGradient>' + '<linearGradient id="rgD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + GOLD + '" stop-opacity="0"/><stop offset="20%" stop-color="' + GOLD + '"/><stop offset="55%" stop-color="' + RED + '"/><stop offset="100%" stop-color="' + EMBER + '" stop-opacity="0.2"/></linearGradient>';
    svg.appendChild(defs);
    svg.appendChild(E('line', {
      x1: cx,
      y1: 28,
      x2: cx,
      y2: baseY + 18,
      stroke: 'url(#rgD)',
      'stroke-width': 3,
      opacity: 0.85
    }));
    svg.appendChild(E('rect', {
      x: cx - 9,
      y: 28,
      width: 18,
      height: baseY - 10,
      fill: 'url(#rgD)',
      opacity: 0.1
    }));
    var dv = E('text', {
      x: cx,
      y: 20,
      'text-anchor': 'middle',
      fill: MUTE,
      'font-family': 'Cinzel, serif',
      'font-size': 10,
      'letter-spacing': '0.22em'
    });
    dv.textContent = 'A DIVISA';
    svg.appendChild(dv);
    function simbolo(r, col, tipo, dim) {
      var sw = (r * 0.1).toFixed(2);
      function gg(inner) {
        return '<g fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + dim + '">' + inner + '</g>';
      }
      var s;
      switch (tipo) {
        case 'li':
          return gg('<path d="M0,' + -r + ' C' + r * 0.62 + ',' + -r * 0.3 + ' ' + r * 0.7 + ',' + r * 0.1 + ' ' + r * 0.34 + ',' + r * 0.55 + ' C' + r * 0.18 + ',' + r * 0.85 + ' ' + -r * 0.18 + ',' + r * 0.85 + ' ' + -r * 0.34 + ',' + r * 0.55 + ' C' + -r * 0.7 + ',' + r * 0.1 + ' ' + -r * 0.62 + ',' + -r * 0.3 + ' 0,' + -r + ' Z"/>') + '<path d="M0,' + -r * 0.32 + ' C' + r * 0.26 + ',0 ' + r * 0.3 + ',' + r * 0.2 + ' ' + r * 0.14 + ',' + r * 0.48 + ' C' + r * 0.07 + ',' + r * 0.62 + ' ' + -r * 0.07 + ',' + r * 0.62 + ' ' + -r * 0.14 + ',' + r * 0.48 + ' C' + -r * 0.3 + ',' + r * 0.2 + ' ' + -r * 0.26 + ',0 0,' + -r * 0.32 + ' Z" fill="' + col + '" fill-opacity="' + 0.5 * dim + '" stroke="none"/>';
        case 'lp':
          s = gg('<path d="M0,' + -r * 0.7 + ' C' + r * 0.45 + ',' + -r * 0.2 + ' ' + r * 0.5 + ',' + r * 0.05 + ' ' + r * 0.24 + ',' + r * 0.4 + ' C' + r * 0.12 + ',' + r * 0.6 + ' ' + -r * 0.12 + ',' + r * 0.6 + ' ' + -r * 0.24 + ',' + r * 0.4 + ' C' + -r * 0.5 + ',' + r * 0.05 + ' ' + -r * 0.45 + ',' + -r * 0.2 + ' 0,' + -r * 0.7 + ' Z"/>');
          [-2.2, -Math.PI / 2, -0.94].forEach(function (ang) {
            var xs = Math.cos(ang) * r * 0.9,
              ys = Math.sin(ang) * r * 0.9;
            s += '<g transform="translate(' + xs.toFixed(1) + ',' + ys.toFixed(1) + ')" fill="none" stroke="' + col + '" stroke-width="' + (r * 0.07).toFixed(2) + '" opacity="' + 0.8 * dim + '"><path d="M0,' + -r * 0.28 + ' C' + r * 0.18 + ',' + -r * 0.06 + ' ' + r * 0.2 + ',' + r * 0.04 + ' ' + r * 0.1 + ',' + r * 0.18 + ' C' + r * 0.05 + ',' + r * 0.26 + ' ' + -r * 0.05 + ',' + r * 0.26 + ' ' + -r * 0.1 + ',' + r * 0.18 + ' C' + -r * 0.2 + ',' + r * 0.04 + ' ' + -r * 0.18 + ',' + -r * 0.06 + ' 0,' + -r * 0.28 + ' Z"/></g>';
          });
          return s;
        case 'lf':
          s = gg('<path d="M' + -r * 0.55 + ',' + -r * 0.1 + ' L' + r * 0.55 + ',' + -r * 0.1 + ' L' + r * 0.4 + ',' + r * 0.2 + ' L' + -r * 0.35 + ',' + r * 0.2 + ' Z"/><path d="M' + -r * 0.55 + ',' + -r * 0.1 + ' Q' + -r * 0.78 + ',' + -r * 0.28 + ' ' + -r * 0.6 + ',' + -r * 0.45 + '"/><path d="M0,' + r * 0.2 + ' L0,' + r * 0.55 + ' M' + -r * 0.3 + ',' + r * 0.55 + ' L' + r * 0.3 + ',' + r * 0.55 + '"/>');
          [-2.4, -Math.PI / 2, -0.74].forEach(function (ang) {
            var x2 = Math.cos(ang) * r * 0.95,
              y2 = Math.sin(ang) * r * 0.95 - r * 0.2;
            s += '<line x1="0" y1="' + (-r * 0.2).toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (r * 0.05).toFixed(2) + '" opacity="' + 0.6 * dim + '"/>';
          });
          return s;
        case 'vi':
          return gg('<path d="M0,' + r * 0.55 + ' C' + -r * 0.3 + ',' + r * 0.2 + ' ' + -r * 0.28 + ',' + -r * 0.1 + ' 0,' + -r * 0.3 + ' C' + r * 0.28 + ',' + -r * 0.1 + ' ' + r * 0.3 + ',' + r * 0.2 + ' 0,' + r * 0.55 + '" opacity="' + 0.5 * dim + '"/>') + gg('<path d="M' + -r * 0.12 + ',' + -r * 0.4 + ' Q' + -r * 0.3 + ',' + -r * 0.6 + ' ' + -r * 0.12 + ',' + -r * 0.8 + ' Q' + r * 0.05 + ',' + -r * 0.95 + ' ' + -r * 0.06 + ',' + -r * 1.05 + '"/><path d="M' + r * 0.14 + ',' + -r * 0.45 + ' Q' + r * 0.3 + ',' + -r * 0.62 + ' ' + r * 0.14 + ',' + -r * 0.82 + '"/>');
        case 'vp':
          s = gg('<path d="M0,' + r * 0.45 + ' C' + -r * 0.26 + ',' + r * 0.12 + ' ' + -r * 0.24 + ',' + -r * 0.16 + ' 0,' + -r * 0.34 + ' C' + r * 0.24 + ',' + -r * 0.16 + ' ' + r * 0.26 + ',' + r * 0.12 + ' 0,' + r * 0.45 + '" opacity="' + 0.55 * dim + '"/>');
          [-2.2, -Math.PI / 2, -0.94].forEach(function (ang) {
            var xs = Math.cos(ang) * r * 0.9,
              ys = Math.sin(ang) * r * 0.9;
            s += '<g transform="translate(' + xs.toFixed(1) + ',' + ys.toFixed(1) + ')" fill="none" stroke="' + col + '" stroke-width="' + (r * 0.06).toFixed(2) + '" opacity="' + 0.55 * dim + '"><path d="M0,' + r * 0.18 + ' C' + -r * 0.12 + ',0 ' + -r * 0.1 + ',' + -r * 0.14 + ' 0,' + -r * 0.2 + ' C' + r * 0.1 + ',' + -r * 0.14 + ' ' + r * 0.12 + ',0 0,' + r * 0.18 + '"/></g>';
          });
          return s;
        case 'vf':
          s = gg('<path d="M' + -r * 0.55 + ',0 L' + r * 0.55 + ',0 L' + r * 0.4 + ',' + r * 0.3 + ' L' + -r * 0.4 + ',' + r * 0.3 + ' Z" opacity="' + 0.55 * dim + '"/>');
          s += gg('<path d="M' + -r * 0.3 + ',' + -r * 0.05 + ' Q' + -r * 0.45 + ',' + -r * 0.3 + ' ' + -r * 0.28 + ',' + -r * 0.55 + '"/><path d="M0,' + -r * 0.1 + ' Q' + -r * 0.12 + ',' + -r * 0.4 + ' ' + r * 0.04 + ',' + -r * 0.7 + '"/><path d="M' + r * 0.3 + ',' + -r * 0.05 + ' Q' + r * 0.45 + ',' + -r * 0.3 + ' ' + r * 0.28 + ',' + -r * 0.55 + '"/>');
          return s;
      }
      return '';
    }
    function selo(R, col, tipo) {
      var dim = col === RED ? 0.62 : 1;
      var p = '<g fill="none" stroke="' + col + '" stroke-linecap="round" stroke-linejoin="round">';
      p += '<circle cx="0" cy="0" r="' + R + '" stroke-width="' + (R * 0.07).toFixed(2) + '" opacity="' + 0.9 * dim + '"/>';
      p += '<circle cx="0" cy="0" r="' + R * 0.82 + '" stroke-width="' + (R * 0.022).toFixed(2) + '" opacity="' + 0.5 * dim + '"/>';
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2;
        p += '<line x1="' + (Math.cos(a) * R).toFixed(1) + '" y1="' + (Math.sin(a) * R).toFixed(1) + '" x2="' + (Math.cos(a) * R * 1.1).toFixed(1) + '" y2="' + (Math.sin(a) * R * 1.1).toFixed(1) + '" stroke-width="' + (R * 0.03).toFixed(2) + '" opacity="' + 0.55 * dim + '"/>';
      }
      p += '<circle cx="0" cy="0" r="' + R * 0.78 + '" fill="' + VOID + '" fill-opacity="0.6" stroke="none"/></g>';
      p += simbolo(R * 0.6, col, tipo, dim);
      return p;
    }
    var figs = [{
      key: 'vf',
      lado: -1,
      grau: 3,
      titulo: 'Forjador de Medíocres',
      sub: 'multiplica a sombra'
    }, {
      key: 'vp',
      lado: -1,
      grau: 2,
      titulo: 'Medíocre Propagador',
      sub: 'apaga a chama dos próximos'
    }, {
      key: 'vi',
      lado: -1,
      grau: 1,
      titulo: 'Medíocre Interno',
      sub: 'destrói só a si'
    }, {
      key: 'li',
      lado: 1,
      grau: 1,
      titulo: 'Lendário Interno',
      sub: 'forjou a si mesmo'
    }, {
      key: 'lp',
      lado: 1,
      grau: 2,
      titulo: 'Lendário Propagador',
      sub: 'estende a chama aos próximos'
    }, {
      key: 'lf',
      lado: 1,
      grau: 3,
      titulo: 'Forjador de Lendários',
      sub: 'multiplica a luz'
    }];
    var dist = {
        1: 130,
        2: 265,
        3: 410
      },
      raio = {
        1: 34,
        2: 48,
        3: 64
      };
    figs.forEach(function (f) {
      var x = cx + f.lado * dist[f.grau],
        col = f.lado > 0 ? GOLD : RED,
        R = raio[f.grau],
        cyMed = baseY - 48;
      svg.appendChild(E('circle', {
        cx: x,
        cy: cyMed,
        r: R * 1.5,
        fill: f.lado > 0 ? 'url(#rgL)' : 'url(#rgV)'
      }));
      var g = E('g', {
        transform: 'translate(' + x + ',' + cyMed + ')',
        class: 'mtz-seal',
        tabindex: '0',
        role: 'button',
        'aria-label': f.titulo + ' — abrir grau na Matriz'
      });
      g.innerHTML = '<circle class="seal-hit" r="' + (R * 1.3).toFixed(1) + '"/><circle class="seal-ring" r="' + (R * 1.16).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="1.5"/>' + selo(R, col, f.key);
      g.addEventListener('click', function () {
        if (openMatriz) openMatriz(f.grau);
      });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (openMatriz) openMatriz(f.grau);
        }
      });
      svg.appendChild(g);
      var ty = baseY + (f.grau === 3 ? 40 : 28);
      var t1 = E('text', {
        x: x,
        y: ty,
        'text-anchor': 'middle',
        fill: INK,
        'font-family': 'EB Garamond, serif',
        'font-size': 14
      });
      t1.textContent = f.titulo;
      svg.appendChild(t1);
      var t2 = E('text', {
        x: x,
        y: ty + 18,
        'text-anchor': 'middle',
        fill: col,
        'font-family': 'EB Garamond, serif',
        'font-size': 12,
        'font-style': 'italic',
        opacity: 0.88
      });
      t2.textContent = f.sub;
      svg.appendChild(t2);
      var t3 = E('text', {
        x: x,
        y: ty + 35,
        'text-anchor': 'middle',
        fill: MUTE,
        'font-family': 'Cinzel, serif',
        'font-size': 9,
        'letter-spacing': '0.16em'
      });
      t3.textContent = 'GRAU ' + ['', 'I', 'II', 'III'][f.grau];
      svg.appendChild(t3);
    });
    var pv = E('text', {
      x: 70,
      y: 56,
      'text-anchor': 'start',
      fill: RED,
      'font-family': 'Cinzel, serif',
      'font-size': 11.5,
      'letter-spacing': '0.16em'
    });
    pv.textContent = '← A CHAMA APAGADA';
    svg.appendChild(pv);
    var pl = E('text', {
      x: 970,
      y: 56,
      'text-anchor': 'end',
      fill: GOLD,
      'font-family': 'Cinzel, serif',
      'font-size': 11.5,
      'letter-spacing': '0.16em'
    });
    pl.textContent = 'A CHAMA ACESA →';
    svg.appendChild(pl);
  }

  /* ───────── AUTOEXAME ───────── */
  function autoexame() {
    var exam = document.getElementById('loboExam');
    if (!exam) return;
    var KEY = 'lendaria.espelho.autoexame';
    var qs = exam.querySelectorAll('.diag-q'),
      total = qs.length;
    var marker = document.getElementById('lmMarker'),
      heads = document.getElementById('loboHeads'),
      txt = document.getElementById('loboTxt'),
      sub = document.getElementById('loboSub');
    function persist() {
      var st = [];
      qs.forEach(function (q) {
        st.push(q.classList.contains('checked') ? 1 : 0);
      });
      try {
        localStorage.setItem(KEY, JSON.stringify(st));
      } catch (e) {}
    }
    function restore() {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return;
        var st = JSON.parse(raw);
        qs.forEach(function (q, i) {
          if (st[i]) {
            q.classList.add('checked');
            q.setAttribute('aria-checked', 'true');
          }
        });
      } catch (e) {}
    }
    function update() {
      var checked = exam.querySelectorAll('.diag-q.checked').length;
      heads.textContent = checked;
      marker.style.setProperty('--lm-marker-pos', (100 * (1 - checked / total)).toFixed(1));
      var t, s, color;
      if (checked === 0) {
        t = 'deslizes hoje';
        s = 'Marque acima para ver de que lado você pendeu hoje.';
        color = GOLD;
      } else if (checked <= 2) {
        t = 'Quase lendário';
        s = 'Um ou outro deslize. Corrija antes que vire hábito — o lobo certo ainda está na frente.';
        color = GOLD;
      } else if (checked <= 4) {
        t = 'Em cima da divisa';
        s = 'Você oscilou entre os dois lobos hoje. A escolha é diária: decida agora qual vai alimentar.';
        color = '#d9943a';
      } else {
        t = 'O lobo medíocre comeu';
        s = 'Não é destino, é estado. Escolha um padrão acima e inverta-o ainda hoje.';
        color = RED;
      }
      txt.textContent = t;
      sub.textContent = s;
      heads.style.color = color;
    }
    qs.forEach(function (q) {
      q.setAttribute('role', 'checkbox');
      q.setAttribute('tabindex', '0');
      q.setAttribute('aria-checked', 'false');
      function toggle() {
        q.classList.toggle('checked');
        q.setAttribute('aria-checked', q.classList.contains('checked') ? 'true' : 'false');
        update();
        persist();
      }
      q.addEventListener('click', toggle);
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
    restore();
    update();
  }
  ready(function () {
    embers();
    chrome();
    ciclos();
    tabela();
    matriz();
    regua();
    autoexame();
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "site/espelho.js", error: String((e && e.message) || e) }); }

// site/site-fx.js
try { (() => {
/* =============================================================================
   LENDÁR[IA] — SITE FX
   Efeitos cerimoniais para as páginas do site (Manifesto, Fundador).
   Parallax em camadas · barra de progresso em ouro · contadores · réguas que
   acendem · linha do tempo em cascata. Calmo, nunca neon. Respeita reduced-motion.
   ============================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------------
     1 · BARRA DE PROGRESSO DE LEITURA — fio de ouro no topo
     --------------------------------------------------------------------------- */
  var rail = document.createElement('div');
  rail.className = 'fx-rail';
  rail.setAttribute('aria-hidden', 'true');
  var bar = document.createElement('span');
  rail.appendChild(bar);
  document.body.appendChild(rail);

  /* ---------------------------------------------------------------------------
     2 · PARALLAX — elementos com [data-parallax="velocidade"]
     velocidade típica 0.04–0.18; sinal positivo = move mais devagar que o scroll
     --------------------------------------------------------------------------- */
  var pxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));

  /* ---------------------------------------------------------------------------
     3 · CONTADORES — .ln (números display) sobem de 0 ao valor quando entram
     --------------------------------------------------------------------------- */
  function parseNum(txt) {
    var m = txt.match(/^\s*([\d.,]+)(.*)$/);
    if (!m) return null;
    var num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return null;
    return {
      value: num,
      suffix: m[2],
      pad: m[1].replace(/[^\d]/g, '').length
    };
  }
  function animateCount(el) {
    var parsed = el.__count;
    var dur = 1100,
      t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = Math.round(parsed.value * eased);
      var s = String(cur);
      while (s.length < parsed.pad) s = '0' + s;
      el.textContent = s + parsed.suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = [].slice.call(document.querySelectorAll('.ln')).filter(function (el) {
    var parsed = parseNum(el.textContent.trim());
    if (!parsed) return false;
    el.__count = parsed;
    if (!reduce) el.textContent = (parsed.pad > 1 ? '0'.repeat(parsed.pad) : '0') + parsed.suffix;
    return true;
  });

  /* ---------------------------------------------------------------------------
     4 · RÉGUAS DAS SEÇÕES — .sec-head .rule cresce da esquerda quando revela
        (CSS faz o resto via .rv.in .rule)
     --------------------------------------------------------------------------- */

  /* ---------------------------------------------------------------------------
     OBSERVERS
     --------------------------------------------------------------------------- */
  if (!reduce && 'IntersectionObserver' in window) {
    // contadores
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCount(e.target);
          cio.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.6
    });
    counters.forEach(function (el) {
      cio.observe(el);
    });

    // eras em cascata (Fundador)
    var eras = [].slice.call(document.querySelectorAll('.era'));
    if (eras.length) {
      eras.forEach(function (el) {
        el.classList.add('era-fx');
      });
      var eio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var idx = eras.indexOf(e.target) % 4;
            e.target.style.transitionDelay = idx * 80 + 'ms';
            e.target.classList.add('era-in');
            eio.unobserve(e.target);
          }
        });
      }, {
        threshold: 0.25
      });
      eras.forEach(function (el) {
        eio.observe(el);
      });
    }
  } else {
    // sem motion: garante valores finais
    counters.forEach(function (el) {
      var p = el.__count;
      var s = String(Math.round(p.value));
      while (s.length < p.pad) s = '0' + s;
      el.textContent = s + p.suffix;
    });
  }

  /* ---------------------------------------------------------------------------
     LOOP DE SCROLL (rAF) — progresso + parallax
     --------------------------------------------------------------------------- */
  var vh = window.innerHeight;
  var ticking = false;
  function render() {
    ticking = false;
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (docH > 0 ? Math.min(st / docH, 1) : 0) + ')';
    if (reduce) return;
    for (var i = 0; i < pxEls.length; i++) {
      var el = pxEls[i];
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var rect = el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var offset = (center - vh / 2) * speed * -1;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    }
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }
  window.addEventListener('scroll', onScroll, {
    passive: true
  });
  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    render();
  }, {
    passive: true
  });
  render();

  /* ---------------------------------------------------------------------------
     5 · BOTÕES MAGNÉTICOS — atração sutil do cursor (cerimonial, leve)
     --------------------------------------------------------------------------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    var mags = document.querySelectorAll('.btn-solid, .cta, .ft-btn, .btn-line');
    mags.forEach(function (b) {
      b.style.transition = (b.style.transition ? b.style.transition + ', ' : '') + 'transform 200ms var(--ease-out)';
      b.addEventListener('mousemove', function (ev) {
        var r = b.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (ev.clientY - (r.top + r.height / 2)) / r.height;
        b.style.transform = 'translate(' + (dx * 7).toFixed(1) + 'px,' + (dy * 5).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () {
        b.style.transform = '';
      });
    });
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "site/site-fx.js", error: String((e && e.message) || e) }); }

// theme.js
try { (() => {
/* theme.js — alternância global light/dark do app Lendár[IA].
 * Mecanismo idêntico ao dos Cursos: alterna a classe `.light` no <html>.
 * Default = dark (Noite). A preferência é única para todo o app (chave al-theme),
 * então o tema escolhido segue o usuário entre Cursos, Comunidade e Livros.
 *
 * Carregar como <script src> normal (NÃO babel) no <head>, o mais cedo possível,
 * para aplicar o tema antes da primeira pintura (sem flash).
 *
 * Menus de navegação (topbar, rail esquerdo, masthead) devem manter a classe
 * `.dark` no markup — assim permanecem escuros mesmo no modo claro.
 *
 * API: window.AlTheme = { get(), set(t), toggle(), subscribe(fn), wire() }
 * Botões DOM estáticos: marque com [data-theme-toggle] e um <i> dentro;
 * o ícone (iconoir-sun-light / iconoir-half-moon) é sincronizado automaticamente.
 */
(function () {
  var KEY = 'al-theme';
  var LEGACY = 'al-cursos-theme';
  var docEl = document.documentElement;
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark') return v;
      var legacy = localStorage.getItem(LEGACY);
      if (legacy === 'light' || legacy === 'dark') return legacy;
    } catch (e) {}
    return 'dark';
  }
  function apply(t) {
    docEl.classList.toggle('light', t === 'light');
  }
  var current = read();
  apply(current); // aplica imediatamente (head) — evita flash

  var subs = [];
  function syncButtons() {
    var iconCls = current === 'light' ? 'iconoir-half-moon' : 'iconoir-sun-light';
    var aria = current === 'light' ? 'Mudar para modo noite' : 'Mudar para modo claro';
    var title = current === 'light' ? 'Modo noite' : 'Modo claro';
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var ic = b.querySelector('i');
      if (ic) ic.className = iconCls;
      b.setAttribute('aria-label', aria);
      b.setAttribute('title', title);
    }
  }
  function set(t) {
    t = t === 'light' ? 'light' : 'dark';
    current = t;
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
    apply(t);
    syncButtons();
    for (var i = 0; i < subs.length; i++) {
      try {
        subs[i](current);
      } catch (e) {}
    }
    return current;
  }
  function toggle() {
    return set(current === 'light' ? 'dark' : 'light');
  }
  function wire() {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        if (b.__alThemeWired) return;
        b.__alThemeWired = true;
        b.addEventListener('click', function (e) {
          e.preventDefault();
          toggle();
        });
      })(btns[i]);
    }
    syncButtons();
  }

  // estilo do botão de toggle estático (livros / mastheads dark)
  function injectStyle() {
    if (document.getElementById('al-theme-style')) return;
    var css = '.al-theme-toggle{display:inline-flex;align-items:center;justify-content:center;' + 'width:36px;height:36px;flex-shrink:0;background:none;border:none;' + 'border-radius:var(--radius-full,999px);color:var(--muted-foreground);' + 'cursor:pointer;transition:color .18s ease;padding:0;}' + '.al-theme-toggle:hover{color:var(--foreground);}' + '.al-theme-toggle i{font-size:16px;line-height:1;}' + /* indicadores de aviso (sino + mensagens) para mastheads */
    '.al-alert-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;' + 'width:36px;height:36px;flex-shrink:0;border-radius:var(--radius-base);' + 'color:var(--muted-foreground);text-decoration:none;cursor:pointer;' + 'transition:color .18s ease,background .18s ease;}' + '.al-alert-btn:hover{color:var(--foreground);background:hsl(var(--foreground-hsl)/0.06);text-decoration:none;}' + '.al-alert-btn i{font-size:17px;line-height:1;}' + '.al-alert-btn[data-badge]::after{content:attr(data-badge);position:absolute;top:1px;right:1px;' + 'min-width:15px;height:15px;padding:0 4px;border-radius:999px;box-sizing:border-box;' + 'background:hsl(var(--primary-hsl));color:var(--primary-foreground);' + 'font-family:var(--font-mono);font-size:8.5px;font-weight:900;letter-spacing:0;' + 'display:flex;align-items:center;justify-content:center;border:2px solid var(--background);}' + /* mastheads/navs marcados .dark mantêm fundo escuro mesmo no modo claro */
    '.masthead.dark{background:var(--background);}';
    var s = document.createElement('style');
    s.id = 'al-theme-style';
    s.textContent = css;
    (document.head || docEl).appendChild(s);
  }
  injectStyle();
  window.AlTheme = {
    get: function () {
      return current;
    },
    set: set,
    toggle: toggle,
    subscribe: function (fn) {
      if (typeof fn === 'function') subs.push(fn);
      return current;
    },
    wire: wire
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "theme.js", error: String((e && e.message) || e) }); }

// ui_kits/lendaria_app/AppSidebar.jsx
try { (() => {
/* AppSidebar — mirrors shared/components/layout/sidebar */
const {
  Icon: ALIcon,
  Avatar: ALAvatar
} = window.LendRIADesignSystem_096da5;
const NAV_USER = [{
  key: 'library',
  label: 'Biblioteca',
  icon: 'book'
}, {
  key: 'player',
  label: 'Área do Aluno',
  icon: 'play-circle'
}, {
  key: 'ps',
  label: 'Pronto Socorro',
  icon: 'video'
}, {
  key: 'community',
  label: 'Comunidade',
  icon: 'group'
}];
const NAV_TEAM = [{
  key: 'courses',
  label: 'Cursos',
  icon: 'book-stack'
}, {
  key: 'minds',
  label: 'Mentes Sintéticas',
  icon: 'brain'
}, {
  key: 'settings',
  label: 'Configurações',
  icon: 'settings'
}];
function NavItem({
  item,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onClick(item.key),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      height: 40,
      padding: '0 12px',
      border: 'none',
      borderRadius: 'var(--radius-base)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'left',
      transition: 'all 200ms var(--ease-out)',
      background: active ? 'hsl(var(--primary-hsl) / 0.06)' : hover ? 'hsl(var(--foreground-hsl) / 0.04)' : 'transparent',
      color: active ? 'var(--primary)' : hover ? 'var(--foreground)' : 'var(--muted-foreground)',
      boxShadow: active ? 'inset 2px 0 0 var(--primary)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(ALIcon, {
    name: item.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, item.label));
}
function AppSidebar({
  screen,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 256,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--card)',
      borderRight: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-academialendaria.svg",
    alt: "",
    style: {
      width: 32,
      height: 32
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap'
    }
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary)'
    }
  }, "[IA]"), "OS")), /*#__PURE__*/React.createElement("nav", {
    className: "al-scrollbar",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, NAV_USER.map(item => /*#__PURE__*/React.createElement(NavItem, {
    key: item.key,
    item: item,
    active: screen === item.key,
    onClick: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '16px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "al-hairline--solid"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--muted-foreground)'
    }
  }, "Team"), /*#__PURE__*/React.createElement("div", {
    className: "al-hairline--solid"
  })), NAV_TEAM.map(item => /*#__PURE__*/React.createElement(NavItem, {
    key: item.key,
    item: item,
    active: screen === item.key,
    onClick: onNavigate
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: '1px solid var(--border)',
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ALAvatar, {
    name: "Alan Nicolas",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Alan Nicolas"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      color: 'var(--muted-foreground)'
    }
  }, "Lend\xE1rio")), /*#__PURE__*/React.createElement(ALIcon, {
    name: "log-out",
    size: 14,
    color: "var(--muted-foreground)"
  })));
}
window.AppSidebar = AppSidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lendaria_app/AppSidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lendaria_app/LibraryScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* LibraryScreen — mirrors features/books/components/books-library */
const {
  Button: LibButton,
  Badge: LibBadge,
  Icon: LibIcon,
  SectionHeader: LibSectionHeader,
  BookCard: LibBookCard,
  Input: LibInput
} = window.LendRIADesignSystem_096da5;
const POPULAR_BOOKS = [{
  title: 'Hábitos Atômicos',
  author: 'James Clear',
  category: 'Produtividade',
  status: 'reading',
  bookmarked: true
}, {
  title: 'Meditações',
  author: 'Marco Aurélio',
  category: 'Filosofia',
  status: 'read'
}, {
  title: 'O Poder do Agora',
  author: 'Eckhart Tolle',
  category: 'Consciência'
}, {
  title: 'Rápido e Devagar',
  author: 'Daniel Kahneman',
  category: 'Psicologia'
}, {
  title: 'A Arte da Guerra',
  author: 'Sun Tzu',
  category: 'Estratégia',
  bookmarked: true
}];
const CATEGORIES = ['Todos', 'Filosofia', 'Produtividade', 'Psicologia', 'Negócios', 'Consciência', 'Estratégia', 'Biografias'];
function CategoryPill({
  label,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      height: 32,
      padding: '0 16px',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 10,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.16em',
      transition: 'color 240ms var(--ease-out), border-color 240ms var(--ease-out), background 240ms var(--ease-out)',
      border: `1px solid ${active ? 'var(--hairline-strong)' : 'var(--border)'}`,
      background: active ? 'hsl(var(--primary-hsl) / 0.07)' : 'transparent',
      color: active ? 'var(--primary)' : hover ? 'var(--foreground)' : 'var(--muted-foreground)'
    }
  }, label);
}
function LibraryScreen({
  onOpenBook
}) {
  const [category, setCategory] = React.useState('Todos');
  return /*#__PURE__*/React.createElement("div", {
    className: "al-scrollbar",
    style: {
      flex: 1,
      height: '100vh',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 32px',
      background: 'hsl(var(--background-hsl) / 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--muted-foreground)'
    }
  }, "Biblioteca"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 320
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--muted-foreground)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(LibIcon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement(LibInput, {
    placeholder: "Buscar livros, autores\u2026",
    style: {
      paddingLeft: 36,
      height: 38
    }
  })), /*#__PURE__*/React.createElement(LibIcon, {
    name: "bell",
    size: 18,
    color: "var(--muted-foreground)"
  })), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '32px 32px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--hairline)',
      background: 'var(--card)',
      padding: '48px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(LibBadge, {
    variant: "brand"
  }, "Curadoria Exclusiva"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--muted-foreground)'
    }
  }, "247 obras")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 52,
      fontWeight: 300,
      lineHeight: 1.0,
      letterSpacing: '-0.02em',
      margin: 0
    }
  }, "Expanda sua ", /*#__PURE__*/React.createElement("em", null, "Consci\xEAncia.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 420,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.5,
      color: 'var(--muted-foreground)'
    }
  }, "Sabedoria secular potencializada por IA.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(LibButton, {
    variant: "cta",
    onClick: onOpenBook
  }, "Continuar Leitura"), /*#__PURE__*/React.createElement(LibButton, {
    variant: "outline",
    size: "lg"
  }, "Minha Lista")))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(LibSectionHeader, {
    eyebrow: "Tend\xEAncias",
    title: "Mais Populares",
    action: "ver cole\xE7\xE3o \u2192"
  }), /*#__PURE__*/React.createElement("div", {
    className: "al-scrollbar",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, minmax(190px, 1fr))',
      gap: 20
    }
  }, POPULAR_BOOKS.map(b => /*#__PURE__*/React.createElement(LibBookCard, _extends({
    key: b.title
  }, b, {
    onClick: onOpenBook
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(LibSectionHeader, {
    eyebrow: "Explorar",
    title: "Categorias"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryPill, {
    key: c,
    label: c,
    active: category === c,
    onClick: () => setCategory(c)
  }))))));
}
window.LibraryScreen = LibraryScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lendaria_app/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lendaria_app/LoginScreen.jsx
try { (() => {
/* LoginScreen — mirrors features/auth standalone-login */
const {
  Button,
  Input,
  Label,
  Icon
} = window.LendRIADesignSystem_096da5;
function LoginScreen({
  onLogin
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      maxWidth: 448,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-academialendaria.svg",
    alt: "Academia Lend\xE1ria",
    style: {
      width: 56,
      height: 56,
      marginBottom: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--hairline)',
      background: 'var(--card)',
      boxShadow: 'var(--shadow-modal)',
      padding: '40px 32px'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 28px',
      textAlign: 'center',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.34em',
      color: 'var(--muted-foreground)'
    }
  }, "Lendar[IA] OS"), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onLogin();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "login-email"
  }, "E-mail"), /*#__PURE__*/React.createElement(Input, {
    id: "login-email",
    type: "email",
    placeholder: "seu@email.com"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "login-pwd"
  }, "Senha"), /*#__PURE__*/React.createElement(Input, {
    id: "login-pwd",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    style: {
      width: '100%',
      height: 48,
      marginTop: 8
    }
  }, "Entrar"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      marginTop: 4,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--muted-foreground)'
    }
  }, "Esqueceu a senha?"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontSize: 9,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.3em',
      color: 'hsl(var(--muted-foreground-hsl) / 0.6)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 14,
    color: "hsl(var(--muted-foreground-hsl) / 0.6)"
  }), /*#__PURE__*/React.createElement("span", null, "Secured by Aurora"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 3,
      height: 3,
      borderRadius: '50%',
      background: 'hsl(var(--muted-foreground-hsl) / 0.4)',
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.7
    }
  }, "v5.0.0"))));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lendaria_app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lendaria_app/PlayerScreen.jsx
try { (() => {
/* PlayerScreen — mirrors features/lms/components/templates/lms-student */
const {
  Icon: PlIcon,
  Tabs: PlTabs,
  Progress: PlProgress,
  Button: PlButton
} = window.LendRIADesignSystem_096da5;
const MODULES = [{
  title: 'Módulo 1 — Fundamentos',
  lessons: [{
    title: 'Boas-vindas à jornada',
    duration: '4:12',
    done: true
  }, {
    title: 'O que é um agente de IA',
    duration: '12:30',
    done: true
  }, {
    title: 'Configurando seu ambiente',
    duration: '18:45',
    done: false,
    active: true
  }]
}, {
  title: 'Módulo 2 — Primeiro Agente',
  lessons: [{
    title: 'Prompt como sistema',
    duration: '15:02',
    done: false
  }, {
    title: 'Ferramentas e memória',
    duration: '21:18',
    done: false
  }, {
    title: 'Projeto: clone seu fluxo',
    duration: '09:40',
    done: false
  }]
}];
function LessonRow({
  lesson
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '10px 12px',
      border: 'none',
      borderRadius: 'var(--radius-base)',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'var(--font-sans)',
      transition: 'background 200ms var(--ease-out)',
      background: lesson.active ? 'hsl(var(--primary-hsl) / 0.06)' : hover ? 'hsl(var(--foreground-hsl) / 0.04)' : 'transparent',
      boxShadow: lesson.active ? 'inset 2px 0 0 var(--primary)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(PlIcon, {
    name: lesson.done ? 'check-circle' : lesson.active ? 'play-circle' : 'circle',
    size: 16,
    color: lesson.done ? 'var(--success)' : lesson.active ? 'var(--primary)' : 'var(--muted-foreground)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13,
      fontWeight: lesson.active ? 700 : 500,
      color: lesson.active ? 'var(--primary)' : lesson.done ? 'var(--muted-foreground)' : 'var(--foreground)'
    }
  }, lesson.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--muted-foreground)',
      fontFamily: 'var(--font-mono)'
    }
  }, lesson.duration));
}
function PlayerScreen({
  onBack
}) {
  const [tab, setTab] = React.useState('overview');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: 'var(--background)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 64,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 24px',
      background: 'hsl(var(--background-hsl) / 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(PlButton, {
    variant: "ghost",
    size: "icon",
    onClick: onBack,
    "aria-label": "Voltar"
  }, /*#__PURE__*/React.createElement(PlIcon, {
    name: "arrow-left",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--muted-foreground)'
    }
  }, "Agentes de IA do Zero"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Configurando seu ambiente", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--muted-foreground)'
    }
  }, " \xB7 M\xF3dulo 1"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(PlButton, {
    variant: "ghost",
    size: "icon",
    "aria-label": "Favoritar"
  }, /*#__PURE__*/React.createElement(PlIcon, {
    name: "star",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    className: "al-scrollbar",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(150deg, #161616, #0B0B0B)',
      border: '1px solid var(--hairline)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(var(--primary-hsl) / 0.08)',
      border: '1px solid var(--hairline-strong)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(PlIcon, {
    name: "play-solid",
    size: 28,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 16,
      bottom: 12,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, "18:45")), /*#__PURE__*/React.createElement(PlTabs, {
    items: [{
      value: 'overview',
      label: 'Visão Geral'
    }, {
      value: 'notes',
      label: 'Anotações'
    }, {
      value: 'transcript',
      label: 'Transcrição'
    }],
    value: tab,
    onValueChange: setTab
  }), tab === 'overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '65ch'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 16,
      lineHeight: 1.625,
      color: 'var(--foreground)'
    }
  }, "Nesta aula voc\xEA prepara o ambiente completo para construir seu primeiro agente: chaves de API, editor e o playground da Academia. Ao final, voc\xEA ter\xE1 executado seu primeiro prompt program\xE1tico.")), tab === 'notes' && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Suas anota\xE7\xF5es aparecem aqui."), tab === 'transcript' && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: 'var(--muted-foreground)'
    }
  }, "Transcri\xE7\xE3o dispon\xEDvel ap\xF3s o processamento."))), /*#__PURE__*/React.createElement("aside", {
    className: "al-scrollbar",
    style: {
      width: 340,
      flexShrink: 0,
      height: '100%',
      overflowY: 'auto',
      borderLeft: '1px solid var(--border)',
      background: 'var(--card)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 8px',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.22em',
      color: 'var(--muted-foreground)'
    }
  }, "Progresso do curso \xB7 33%"), /*#__PURE__*/React.createElement(PlProgress, {
    value: 33
  })), MODULES.map(mod => /*#__PURE__*/React.createElement("div", {
    key: mod.title
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 6px',
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--foreground)'
    }
  }, mod.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, mod.lessons.map(l => /*#__PURE__*/React.createElement(LessonRow, {
    key: l.title,
    lesson: l
  })))))));
}
window.PlayerScreen = PlayerScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lendaria_app/PlayerScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BookCard = __ds_scope.BookCard;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardDescription = __ds_scope.CardDescription;

__ds_ns.CardContent = __ds_scope.CardContent;

__ds_ns.CardFooter = __ds_scope.CardFooter;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.StatChip = __ds_scope.StatChip;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

})();
