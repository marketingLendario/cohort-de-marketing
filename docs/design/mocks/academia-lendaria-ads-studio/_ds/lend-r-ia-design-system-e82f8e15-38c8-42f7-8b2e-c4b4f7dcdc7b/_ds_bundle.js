/* @ds-bundle: {"format":3,"namespace":"LendRIADesignSystem_e82f8e","components":[{"name":"BookCard","sourcePath":"components/brand/BookCard.jsx"},{"name":"Milestone","sourcePath":"components/brand/Milestone.jsx"},{"name":"SectionHeader","sourcePath":"components/brand/SectionHeader.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardDescription","sourcePath":"components/core/Card.jsx"},{"name":"CardContent","sourcePath":"components/core/Card.jsx"},{"name":"CardFooter","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Alert","sourcePath":"components/display/Alert.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Progress","sourcePath":"components/display/Progress.jsx"},{"name":"StatChip","sourcePath":"components/display/StatChip.jsx"},{"name":"Tabs","sourcePath":"components/display/Tabs.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Label","sourcePath":"components/forms/Label.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"}],"sourceHashes":{"components/brand/BookCard.jsx":"4289f9166adb","components/brand/Milestone.jsx":"5866d123d0a8","components/brand/SectionHeader.jsx":"d6b1cd4fe66d","components/core/Badge.jsx":"bf35a1f55ab6","components/core/Button.jsx":"dbc87fbe31b7","components/core/Card.jsx":"7ce8832ad3e0","components/core/Icon.jsx":"1b13afaa9a09","components/display/Alert.jsx":"86d15a7e2ed5","components/display/Avatar.jsx":"3a6ae4446d60","components/display/Progress.jsx":"6b82fb6dc017","components/display/StatChip.jsx":"fa1034c53895","components/display/Tabs.jsx":"31765056a7f1","components/forms/Checkbox.jsx":"14a60f5c2c2f","components/forms/Input.jsx":"ed335ba816f4","components/forms/Label.jsx":"d7560e849211","components/forms/Switch.jsx":"7a88a6aaecb9","components/forms/Textarea.jsx":"fb455252f866","ui_kits/comunidade/ComunidadeFeed.jsx":"e4d0c0939b0d","ui_kits/cursos/CoursePlayer.jsx":"764c3ab93f02","ui_kits/livros/LivrosBiblioteca.jsx":"e37a226ec6cc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LendRIADesignSystem_e82f8e = window.LendRIADesignSystem_e82f8e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

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

// components/brand/Milestone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Milestone — realce editorial para um único momento de conquista.
 *
 * A resposta da casa ao "sparkle text": em vez de faíscas em loop, uma
 * revelação única e cerimonial — losango, eyebrow, título e régua dourada
 * entram em cascata uma vez. Só ouro, sem brilho/loop, respeita
 * prefers-reduced-motion (estado final é a base; a animação só roda quando
 * o usuário aceita movimento). Para selos, certificações e aprovações.
 */
function Milestone({
  eyebrow,
  title,
  note,
  mark = true,
  align = 'center',
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `al-milestone${align === 'start' ? ' al-milestone--start' : ''}${className ? ' ' + className : ''}`
  }, props), mark && /*#__PURE__*/React.createElement("span", {
    className: "al-milestone__mark",
    "aria-hidden": "true"
  }), eyebrow && /*#__PURE__*/React.createElement("p", {
    className: "al-milestone__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "al-milestone__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "al-milestone__rule",
    "aria-hidden": "true"
  }), note && /*#__PURE__*/React.createElement("p", {
    className: "al-milestone__note"
  }, note));
}
Object.assign(__ds_scope, { Milestone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Milestone.jsx", error: String((e && e.message) || e) }); }

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

// ui_kits/comunidade/ComunidadeFeed.jsx
try { (() => {
/* Comunidade — Feed: composer, banda AO VIVO, abas, cards de post. */
const {
  Avatar,
  Badge,
  Button,
  Icon,
  Tabs
} = window.LendRIADesignSystem_e82f8e;
const NAV = ['Feed', 'Lendários', 'Rank', 'Eventos', 'Mensagens', 'Cursos', 'Livros'];
const SEED = [{
  id: 1,
  live: true,
  time: '4d atrás',
  cat: 'Laboratório de IA',
  title: 'Plantão AIOX Semana 23 — debugando agentes de ponta a ponta ao vivo',
  body: 'Nesta semana o plantão foca em debugging de agentes com ferramentas reais. Traga seu código, seu problema e sua disposição para aprender em público.',
  author: 'Sidney',
  reacts: 47,
  comments: 12
}, {
  id: 2,
  cat: 'Vitória da semana',
  title: 'Coloquei minha primeira esteira de onboarding rodando em produção',
  body: 'Saí do "assistindo aula" para "coisa rodando no negócio": um webhook, três testes, e o primeiro cliente já passou pela esteira. Ser antes de ter, na prática.',
  author: 'Marina',
  reacts: 128,
  comments: 34
}, {
  id: 3,
  cat: 'Discussão',
  title: 'Como vocês denominam progresso quando o projeto trava?',
  body: 'Pergunta honesta para a tribo: nas semanas em que a execução emperra, o que vocês registram como avanço sem cair na cilada de celebrar consumo?',
  author: 'Téo',
  reacts: 39,
  comments: 21
}];
const FILTERS = {
  todos: () => true,
  ['ao-vivo']: p => p.live,
  discussoes: p => p.cat === 'Discussão'
};
function ComunidadeFeed() {
  const [posts, setPosts] = React.useState(SEED);
  const [draft, setDraft] = React.useState('');
  const [tab, setTab] = React.useState('todos');
  const [liked, setLiked] = React.useState(() => new Set());
  const publish = () => {
    if (!draft.trim()) return;
    setPosts(p => [{
      id: Date.now(),
      cat: 'Insight',
      title: draft.trim(),
      body: '',
      author: 'Alan Lendário',
      reacts: 0,
      comments: 0,
      mine: true
    }, ...p]);
    setDraft('');
  };
  const toggleLike = id => setLiked(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const shown = posts.filter(FILTERS[tab]);
  const counts = {
    todos: posts.length,
    ['ao-vivo']: posts.filter(FILTERS['ao-vivo']).length,
    discussoes: posts.filter(FILTERS.discussoes).length
  };
  return /*#__PURE__*/React.createElement("div", {
    style: cfS.page
  }, /*#__PURE__*/React.createElement("header", {
    style: cfS.top
  }, /*#__PURE__*/React.createElement("div", {
    style: cfS.brand
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("em", {
    style: cfS.brandEm
  }, "[IA]")), /*#__PURE__*/React.createElement("nav", {
    style: cfS.nav
  }, NAV.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      ...cfS.navItem,
      ...(i === 0 ? cfS.navItemOn : {})
    }
  }, t, i === 0 && /*#__PURE__*/React.createElement("span", {
    style: cfS.navUnderline
  })))), /*#__PURE__*/React.createElement("div", {
    style: cfS.topRight
  }, /*#__PURE__*/React.createElement("div", {
    style: cfS.notif
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: "size-5",
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement("span", {
    style: cfS.dot
  }, "3")), /*#__PURE__*/React.createElement(Avatar, {
    name: "Alan Lend\xE1rio",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("main", {
    style: cfS.main
  }, /*#__PURE__*/React.createElement("div", {
    style: cfS.hero
  }, /*#__PURE__*/React.createElement("h1", {
    style: cfS.heroTitle
  }, "Feed da ", /*#__PURE__*/React.createElement("em", {
    style: cfS.heroEm
  }, "Comunidade.")), /*#__PURE__*/React.createElement("div", {
    style: cfS.heroMeta
  }, /*#__PURE__*/React.createElement("span", null, "3.847 MEMBROS"), /*#__PURE__*/React.createElement("span", {
    style: cfS.heroSep
  }, "|"), /*#__PURE__*/React.createElement("span", {
    style: cfS.online
  }, /*#__PURE__*/React.createElement("span", {
    style: cfS.onlineDot
  }), "10 ONLINE"))), /*#__PURE__*/React.createElement("div", {
    style: cfS.composer
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Alan Lend\xE1rio"
  }), /*#__PURE__*/React.createElement("input", {
    style: cfS.composerInput,
    placeholder: "Compartilhe um insight com a comunidade\u2026",
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === 'Enter' && publish()
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: publish
  }, "Criar post")), /*#__PURE__*/React.createElement("div", {
    style: cfS.liveBand
  }, /*#__PURE__*/React.createElement("span", {
    style: cfS.liveTag
  }, /*#__PURE__*/React.createElement("span", {
    style: cfS.liveDot
  }), "Ao vivo"), /*#__PURE__*/React.createElement("span", {
    style: cfS.liveTitle
  }, "Plant\xE3o AIOX Semana 23 \u2014 debugando agentes com o Sidney"), /*#__PURE__*/React.createElement("span", {
    style: cfS.liveCount
  }, "47 assistindo"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, "Entrar na sala")), /*#__PURE__*/React.createElement("div", {
    style: cfS.tabs
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onValueChange: setTab,
    items: [{
      value: 'todos',
      label: /*#__PURE__*/React.createElement("span", null, "Todos ", /*#__PURE__*/React.createElement("span", {
        style: cfS.tabCount
      }, counts.todos))
    }, {
      value: 'ao-vivo',
      label: /*#__PURE__*/React.createElement("span", null, "Aulas ao vivo ", /*#__PURE__*/React.createElement("span", {
        style: cfS.tabCount
      }, counts['ao-vivo']))
    }, {
      value: 'discussoes',
      label: /*#__PURE__*/React.createElement("span", null, "Discuss\xF5es ", /*#__PURE__*/React.createElement("span", {
        style: cfS.tabCount
      }, counts.discussoes))
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: cfS.posts
  }, shown.map(p => /*#__PURE__*/React.createElement("article", {
    key: p.id,
    style: cfS.post
  }, /*#__PURE__*/React.createElement("div", {
    style: cfS.postHead
  }, p.live && /*#__PURE__*/React.createElement("span", {
    style: cfS.liveTag
  }, /*#__PURE__*/React.createElement("span", {
    style: cfS.liveDot
  }), "Ao vivo"), /*#__PURE__*/React.createElement("span", {
    style: cfS.postTime
  }, p.time || 'agora'), /*#__PURE__*/React.createElement("span", {
    style: cfS.postCat
  }, p.cat)), /*#__PURE__*/React.createElement("h3", {
    style: cfS.postTitle
  }, p.title), p.body && /*#__PURE__*/React.createElement("p", {
    style: cfS.postBody
  }, p.body), /*#__PURE__*/React.createElement("div", {
    style: cfS.postFoot
  }, /*#__PURE__*/React.createElement("div", {
    style: cfS.author
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.author,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: cfS.authorK
  }, "Autor"), /*#__PURE__*/React.createElement("div", {
    style: cfS.authorN
  }, p.author))), /*#__PURE__*/React.createElement("div", {
    style: cfS.reacts
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...cfS.react,
      ...(liked.has(p.id) ? cfS.reactOn : {})
    },
    onClick: () => toggleLike(p.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "spark",
    size: "size-4"
  }), p.reacts + (liked.has(p.id) ? 1 : 0)), /*#__PURE__*/React.createElement("span", {
    style: cfS.react
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chat-bubble",
    size: "size-4"
  }), p.comments))))))));
}
const cfS = {
  page: {
    minHeight: '100vh',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)'
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
    padding: '0 30px',
    height: 60,
    borderBottom: '1px solid var(--hairline)',
    position: 'sticky',
    top: 0,
    background: 'hsl(var(--background-hsl) / 0.92)',
    backdropFilter: 'blur(10px)',
    zIndex: 5
  },
  brand: {
    fontFamily: 'var(--font-serif)',
    fontSize: 22
  },
  brandEm: {
    fontStyle: 'italic',
    color: 'var(--primary)'
  },
  nav: {
    display: 'flex',
    gap: 22
  },
  navItem: {
    position: 'relative',
    fontFamily: 'var(--font-sans)',
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    paddingBottom: 4
  },
  navItemOn: {
    color: 'var(--foreground)'
  },
  navUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -19,
    height: 1,
    background: 'var(--primary)'
  },
  topRight: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 18,
    alignItems: 'center'
  },
  notif: {
    position: 'relative',
    display: 'flex'
  },
  dot: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 15,
    height: 15,
    padding: '0 3px',
    borderRadius: 9,
    background: 'var(--destructive)',
    color: '#fff',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  main: {
    maxWidth: 880,
    margin: '0 auto',
    padding: '40px 28px 80px'
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 300,
    fontSize: 50,
    letterSpacing: '-0.025em',
    margin: 0,
    lineHeight: 1.05
  },
  heroEm: {
    fontStyle: 'italic',
    color: 'var(--primary)',
    fontWeight: 300
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    letterSpacing: '0.12em',
    color: 'var(--muted-foreground)'
  },
  heroSep: {
    opacity: 0.4
  },
  online: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'var(--success)'
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--success)'
  },
  composer: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    paddingLeft: 14,
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--radius-base)',
    background: 'var(--card)',
    marginBottom: 16
  },
  composerInput: {
    flex: 1,
    height: 40,
    border: 'none',
    background: 'transparent',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    fontStyle: 'italic',
    outline: 'none'
  },
  liveBand: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 18px',
    border: '1px solid hsl(var(--destructive-hsl) / 0.3)',
    borderRadius: 'var(--radius-base)',
    background: 'hsl(var(--destructive-hsl) / 0.04)',
    marginBottom: 30
  },
  liveTitle: {
    flex: 1,
    fontFamily: 'var(--font-serif)',
    fontSize: 15
  },
  liveCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  tabs: {
    marginBottom: 22
  },
  tabCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--primary)',
    marginLeft: 6
  },
  posts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  post: {
    padding: '24px 28px',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--radius-base)',
    background: 'var(--card)'
  },
  postHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },
  liveTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--destructive)'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--destructive)'
  },
  postTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  postCat: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
    marginLeft: 'auto'
  },
  postTitle: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    margin: 0
  },
  postBody: {
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    fontSize: 15.5,
    lineHeight: 1.55,
    color: 'var(--muted-foreground)',
    margin: '12px 0 0'
  },
  postFoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingTop: 18,
    borderTop: '1px solid var(--hairline)'
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: 11
  },
  authorK: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  authorN: {
    fontFamily: 'var(--font-serif)',
    fontSize: 15,
    marginTop: 1
  },
  reacts: {
    display: 'flex',
    gap: 16
  },
  react: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    border: 'none',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    cursor: 'pointer',
    letterSpacing: '0.04em'
  },
  reactOn: {
    color: 'var(--primary)'
  }
};
window.ComunidadeFeed = ComunidadeFeed;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/comunidade/ComunidadeFeed.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cursos/CoursePlayer.jsx
try { (() => {
/* Cursos — Capa & Currículo do player de curso (recreação fiel do LMS AI-First). */
const {
  Icon,
  Progress,
  Badge,
  Button,
  Avatar
} = window.LendRIADesignSystem_e82f8e;
const COURSE = {
  eyebrow: 'Curso · Stack & Ofício',
  version: 'v2.4 · jun 2026',
  read: '1h30 de leitura',
  lede: 'Humano como diretor de arte, IA como executor rápido. Nunca o contrário.',
  modules: [{
    n: '01',
    name: 'Mentalidade & Base',
    lessons: [{
      t: 'Princípio zero — o piso e o teto',
      a: 'Aula 01',
      s: '§0',
      min: 5
    }, {
      t: 'Framework base — escolha por fricção',
      a: 'Aula 02',
      s: '§1',
      min: 7
    }, {
      t: 'Skills de design — escolha uma, vá fundo',
      a: 'Aula 03',
      s: '§2',
      min: 6
    }]
  }, {
    n: '02',
    name: 'Motion & Efeito',
    lessons: [{
      t: 'Animação e motion — o gate inegociável',
      a: 'Aula 04',
      s: '§3',
      min: 8
    }, {
      t: 'Bibliotecas de efeito — tempero, não prato',
      a: 'Aula 05',
      s: '§4',
      min: 5
    }, {
      t: 'O hand-off — do mock à coisa rodando',
      a: 'Aula 06',
      s: '§5',
      min: 9
    }]
  }, {
    n: '03',
    name: 'Entrega & Prova',
    lessons: [{
      t: 'A demo que convence em 60 segundos',
      a: 'Aula 07',
      s: '§6',
      min: 6
    }, {
      t: 'Vitória da semana — denominar em execução',
      a: 'Aula 08',
      s: '§7',
      min: 4
    }]
  }]
};
const RAIL = ['home', 'book', 'play-circle', 'community', 'bookmark-book', 'brain'];
function CoursePlayer() {
  const all = COURSE.modules.flatMap(m => m.lessons);
  const total = all.length;
  const [done, setDone] = React.useState(() => new Set());
  const [active, setActive] = React.useState('m0l0');
  const toggle = key => setDone(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const pct = Math.round(done.size / total * 100);
  return /*#__PURE__*/React.createElement("div", {
    style: cpS.shell
  }, /*#__PURE__*/React.createElement("nav", {
    style: cpS.rail
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.railLogo
  }, "\u221E"), /*#__PURE__*/React.createElement("div", {
    style: cpS.railIcons
  }, RAIL.map((n, i) => /*#__PURE__*/React.createElement("button", {
    key: n,
    style: {
      ...cpS.railBtn,
      ...(i === 4 ? cpS.railBtnOn : {})
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n,
    size: "size-5"
  })))), /*#__PURE__*/React.createElement("button", {
    style: cpS.railBtn
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings",
    size: "size-5"
  })), /*#__PURE__*/React.createElement("div", {
    style: cpS.railAvatar
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Alan Lend\xE1rio",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("section", {
    style: cpS.cover
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.coverTop
  }, /*#__PURE__*/React.createElement("button", {
    style: cpS.back
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: "size-4"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: cpS.coverKicker
  }, "Layouts Premium com IA \xB7 ", COURSE.version.split(' · ')[0].toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: cpS.coverCrumb
  }, "Capa & curr\xEDculo")), /*#__PURE__*/React.createElement("div", {
    style: cpS.coverRead
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book",
    size: "size-4"
  }), COURSE.read)), /*#__PURE__*/React.createElement("div", {
    style: cpS.coverBody
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.coverMetaRow
  }, /*#__PURE__*/React.createElement("span", {
    style: cpS.eyebrow
  }, COURSE.eyebrow), /*#__PURE__*/React.createElement("span", {
    style: cpS.coverHair
  }), /*#__PURE__*/React.createElement("span", {
    style: cpS.version
  }, COURSE.version)), /*#__PURE__*/React.createElement("h1", {
    style: cpS.title
  }, "Layouts ", /*#__PURE__*/React.createElement("em", {
    style: cpS.titleEm
  }, "Premium"), " com IA"), /*#__PURE__*/React.createElement("p", {
    style: cpS.lede
  }, "Humano como diretor de arte, IA como executor r\xE1pido. ", /*#__PURE__*/React.createElement("strong", {
    style: cpS.ledeStrong
  }, "Nunca o contr\xE1rio.")), /*#__PURE__*/React.createElement("div", {
    style: cpS.coverCta
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cta"
  }, done.size ? 'Continuar' : 'Começar', " curso"), /*#__PURE__*/React.createElement(Button, {
    variant: "link"
  }, "ver ementa completa")))), /*#__PURE__*/React.createElement("aside", {
    style: cpS.curriculum
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.progHead
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.ring
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 64 64",
    style: {
      width: 64,
      height: 64
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "28",
    fill: "none",
    stroke: "hsl(var(--primary-hsl) / 0.16)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "28",
    fill: "none",
    stroke: "var(--primary)",
    strokeWidth: "2",
    strokeDasharray: 2 * Math.PI * 28,
    strokeDashoffset: 2 * Math.PI * 28 * (1 - pct / 100),
    strokeLinecap: "round",
    transform: "rotate(-90 32 32)",
    style: {
      transition: 'stroke-dashoffset 600ms var(--ease-smooth)'
    }
  }), /*#__PURE__*/React.createElement("text", {
    x: "32",
    y: "36",
    textAnchor: "middle",
    style: cpS.ringTxt
  }, pct, "%"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: cpS.progLabel
  }, "Seu progresso"), /*#__PURE__*/React.createElement("div", {
    style: cpS.progValue
  }, done.size, "/", total, " aulas lidas"), /*#__PURE__*/React.createElement("div", {
    style: cpS.progMeta
  }, total, " AULAS \xB7 ", COURSE.modules.length, " M\xD3DULOS"))), /*#__PURE__*/React.createElement("button", {
    style: {
      ...cpS.lesson,
      ...cpS.lessonHero,
      ...(active === 'cover' ? cpS.lessonActive : {})
    },
    onClick: () => setActive('cover')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark",
    size: "size-5",
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: cpS.lessonMain
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.lessonHeroT
  }, "Capa & curr\xEDculo"), /*#__PURE__*/React.createElement("div", {
    style: cpS.lessonSub
  }, "Vis\xE3o geral \xB7 comece aqui"))), /*#__PURE__*/React.createElement("div", {
    style: cpS.list
  }, COURSE.modules.map((m, mi) => /*#__PURE__*/React.createElement("div", {
    key: m.n
  }, /*#__PURE__*/React.createElement("div", {
    style: cpS.modHead
  }, /*#__PURE__*/React.createElement("span", {
    style: cpS.modN
  }, "M\xF3dulo ", m.n), /*#__PURE__*/React.createElement("span", {
    style: cpS.modName
  }, m.name)), m.lessons.map((l, li) => {
    const key = `m${mi}l${li}`;
    const isDone = done.has(key);
    const isActive = active === key;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      style: {
        ...cpS.lesson,
        ...(isActive ? cpS.lessonActive : {})
      },
      onClick: () => {
        setActive(key);
        toggle(key);
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...cpS.radio,
        ...(isDone ? cpS.radioDone : {})
      }
    }, isDone && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: "size-3"
    })), /*#__PURE__*/React.createElement("div", {
      style: cpS.lessonMain
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...cpS.lessonT,
        ...(isDone ? cpS.lessonTDone : {})
      }
    }, l.t), /*#__PURE__*/React.createElement("div", {
      style: cpS.lessonMeta
    }, l.a, " \xB7 ", l.s)), /*#__PURE__*/React.createElement("span", {
      style: cpS.lessonMin
    }, l.min, " min"));
  }))))));
}
const cpS = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr 372px',
    height: '100vh',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)'
  },
  rail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    padding: '18px 0',
    borderRight: '1px solid var(--hairline)'
  },
  railLogo: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 300,
    fontSize: 26,
    color: 'var(--primary)',
    lineHeight: 1,
    marginBottom: 26
  },
  railIcons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1
  },
  railBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    border: 'none',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)'
  },
  railBtnOn: {
    color: 'var(--primary)',
    background: 'hsl(var(--primary-hsl) / 0.08)'
  },
  railAvatar: {
    marginTop: 14
  },
  cover: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--hairline)',
    overflow: 'hidden'
  },
  coverTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '20px 30px',
    borderBottom: '1px solid var(--hairline)'
  },
  back: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    border: '1px solid var(--hairline)',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0
  },
  coverKicker: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  coverCrumb: {
    fontFamily: 'var(--font-serif)',
    fontSize: 17,
    marginTop: 3
  },
  coverRead: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  coverBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 56px',
    maxWidth: 620
  },
  coverMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
    whiteSpace: 'nowrap'
  },
  coverHair: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(to right, var(--hairline), transparent)'
  },
  version: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    color: 'var(--muted-foreground)'
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 300,
    fontSize: 76,
    lineHeight: 0.98,
    letterSpacing: '-0.03em',
    margin: 0
  },
  titleEm: {
    fontStyle: 'italic',
    color: 'var(--primary)',
    fontWeight: 300
  },
  lede: {
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 1.45,
    color: 'var(--muted-foreground)',
    margin: '30px 0 0',
    maxWidth: '24ch'
  },
  ledeStrong: {
    fontStyle: 'italic',
    fontWeight: 400,
    color: 'var(--foreground)'
  },
  coverCta: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginTop: 38
  },
  curriculum: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: 'var(--card)'
  },
  progHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '24px 26px',
    borderBottom: '1px solid var(--hairline)'
  },
  ring: {
    flexShrink: 0
  },
  ringTxt: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fill: 'var(--primary)'
  },
  progLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  progValue: {
    fontFamily: 'var(--font-serif)',
    fontSize: 21,
    marginTop: 4
  },
  progMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--muted-foreground)',
    marginTop: 5
  },
  lessonHero: {
    background: 'hsl(var(--primary-hsl) / 0.05)',
    borderLeft: '2px solid var(--primary)'
  },
  lessonHeroT: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 30
  },
  modHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    padding: '22px 26px 12px'
  },
  modN: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  modName: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16
  },
  lesson: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    width: '100%',
    textAlign: 'left',
    padding: '13px 26px',
    border: 'none',
    borderLeft: '2px solid transparent',
    background: 'transparent',
    color: 'var(--foreground)',
    cursor: 'pointer',
    borderTop: '1px solid var(--hairline)'
  },
  lessonActive: {
    background: 'hsl(var(--foreground-hsl) / 0.03)'
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '1px solid var(--hairline-strong)',
    flexShrink: 0,
    color: 'var(--primary-foreground)'
  },
  radioDone: {
    background: 'var(--primary)',
    borderColor: 'var(--primary)'
  },
  lessonMain: {
    flex: 1,
    minWidth: 0
  },
  lessonT: {
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  lessonTDone: {
    color: 'var(--muted-foreground)'
  },
  lessonSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
    marginTop: 3
  },
  lessonMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)',
    marginTop: 3
  },
  lessonMin: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    color: 'var(--muted-foreground)',
    flexShrink: 0
  }
};
window.CoursePlayer = CoursePlayer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cursos/CoursePlayer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/livros/LivrosBiblioteca.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Livros — A Biblioteca: estante editorial + leitor de resumo (.al-md). */
const {
  BookCard,
  SectionHeader,
  Badge,
  Button,
  Icon,
  StatChip
} = window.LendRIADesignSystem_e82f8e;
const SHELF = [{
  title: 'Hábitos Atômicos',
  author: 'James Clear',
  category: 'Produtividade',
  status: 'reading'
}, {
  title: 'Trabalhe 4 Horas por Semana',
  author: 'Tim Ferriss',
  category: 'Negócios',
  status: 'reading'
}, {
  title: 'A Arte da Guerra',
  author: 'Sun Tzu',
  category: 'Estratégia',
  status: 'read'
}, {
  title: 'Como Fazer Amigos e Influenciar Pessoas',
  author: 'Dale Carnegie',
  category: 'Relações',
  status: 'read'
}, {
  title: 'Disciplina Positiva',
  author: 'Jane Nelsen',
  category: 'Educação'
}, {
  title: 'O Almanaque de Naval Ravikant',
  author: 'Eric Jorgenson',
  category: 'Filosofia'
}];
const EXPLORE = [{
  title: 'Antifrágil',
  author: 'Nassim Taleb',
  category: 'Incerteza'
}, {
  title: 'Pensar Rápido e Devagar',
  author: 'Daniel Kahneman',
  category: 'Cognição'
}, {
  title: 'O Poder do Hábito',
  author: 'Charles Duhigg',
  category: 'Comportamento'
}, {
  title: 'Essencialismo',
  author: 'Greg McKeown',
  category: 'Foco'
}, {
  title: 'Mindset',
  author: 'Carol Dweck',
  category: 'Psicologia'
}, {
  title: 'Comece pelo Porquê',
  author: 'Simon Sinek',
  category: 'Liderança'
}];
const READER_MD = `
# Hábitos Atômicos

###### James Clear · 12 min de leitura

A premissa central: você não sobe ao nível dos seus objetivos, você cai ao nível dos seus sistemas. Pequenas mudanças, repetidas com consistência, compõem resultados extraordinários: **1% melhor a cada dia** é o juro composto da execução.

> Você não precisa de mais motivação. Você precisa de um sistema que torne o comportamento *inevitável*.

## As quatro leis da mudança

1. **Torne óbvio** — desenhe o ambiente para que o sinal certo esteja sempre à vista.
2. **Torne atraente** — agrupe o hábito difícil com algo que você já deseja.
3. **Torne fácil** — reduza a fricção a quase zero: a regra dos dois minutos.
4. **Torne satisfatório** — feche o laço com uma recompensa imediata e visível.

## A régua da casa

Conhecimento sem execução é obesidade intelectual. Este resumo termina onde todo conteúdo deveria terminar: num passo executável. Escolha **uma** lei e aplique nas próximas 48h.
`.trim();
function mdToHtml(md) {
  const lines = md.split('\n');
  let html = '',
    inList = null;
  const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  const closeList = () => {
    if (inList) {
      html += `</${inList}>`;
      inList = null;
    }
  };
  for (let raw of lines) {
    const l = raw.trim();
    if (!l) {
      closeList();
      continue;
    }
    let m;
    if (m = l.match(/^######\s+(.*)/)) {
      closeList();
      html += `<h6>${inline(m[1])}</h6>`;
    } else if (m = l.match(/^##\s+(.*)/)) {
      closeList();
      html += `<h2>${inline(m[1])}</h2>`;
    } else if (m = l.match(/^#\s+(.*)/)) {
      closeList();
      html += `<h1>${inline(m[1])}</h1>`;
    } else if (m = l.match(/^>\s+(.*)/)) {
      closeList();
      html += `<blockquote><p>${inline(m[1])}</p></blockquote>`;
    } else if (m = l.match(/^\d+\.\s+(.*)/)) {
      if (inList !== 'ol') {
        closeList();
        html += '<ol>';
        inList = 'ol';
      }
      html += `<li>${inline(m[1])}</li>`;
    } else if (m = l.match(/^[-*]\s+(.*)/)) {
      if (inList !== 'ul') {
        closeList();
        html += '<ul>';
        inList = 'ul';
      }
      html += `<li>${inline(m[1])}</li>`;
    } else {
      closeList();
      html += `<p>${inline(l)}</p>`;
    }
  }
  closeList();
  return html;
}
function TopBar() {
  return /*#__PURE__*/React.createElement("header", {
    style: lbS.top
  }, /*#__PURE__*/React.createElement("div", {
    style: lbS.brand
  }, "Lend\xE1r", /*#__PURE__*/React.createElement("em", {
    style: lbS.brandEm
  }, "[IA]")), /*#__PURE__*/React.createElement("nav", {
    style: lbS.nav
  }, ['Visão geral', 'Minha biblioteca', 'Explorar', 'Coleções', 'Autores'].map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      ...lbS.navItem,
      ...(i === 1 ? lbS.navItemOn : {})
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: lbS.topRight
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: "size-5",
    color: "var(--muted-foreground)"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: "size-5",
    color: "var(--muted-foreground)"
  })));
}
function LivrosBiblioteca() {
  const [reading, setReading] = React.useState(null);
  const [marks, setMarks] = React.useState(() => new Set([1]));
  const toggleMark = k => setMarks(p => {
    const n = new Set(p);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: lbS.page
  }, /*#__PURE__*/React.createElement(TopBar, null), /*#__PURE__*/React.createElement("main", {
    style: lbS.main
  }, /*#__PURE__*/React.createElement("div", {
    style: lbS.hero
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: lbS.heroEyebrow
  }, "A Biblioteca \xB7 curadoria Lend\xE1ria"), /*#__PURE__*/React.createElement("h1", {
    style: lbS.heroTitle
  }, "Minha ", /*#__PURE__*/React.createElement("em", {
    style: lbS.heroEm
  }, "biblioteca"))), /*#__PURE__*/React.createElement("div", {
    style: lbS.heroStats
  }, /*#__PURE__*/React.createElement(StatChip, {
    label: "No estante",
    value: "247"
  }), /*#__PURE__*/React.createElement(StatChip, {
    label: "Lidos",
    value: "38"
  }), /*#__PURE__*/React.createElement(StatChip, {
    label: "Esta semana",
    value: "2"
  }))), /*#__PURE__*/React.createElement("section", {
    style: lbS.section
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Continue lendo",
    title: "Onde voc\xEA parou",
    action: "ver tudo"
  }), /*#__PURE__*/React.createElement("div", {
    style: lbS.shelf
  }, SHELF.map((b, i) => /*#__PURE__*/React.createElement(BookCard, _extends({
    key: b.title
  }, b, {
    bookmarked: marks.has(i),
    onClick: () => setReading(b)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: lbS.section
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Curadoria",
    title: "Explorar a estante",
    action: "cat\xE1logo completo"
  }), /*#__PURE__*/React.createElement("div", {
    style: lbS.shelf
  }, EXPLORE.map((b, i) => /*#__PURE__*/React.createElement(BookCard, _extends({
    key: b.title
  }, b, {
    bookmarked: marks.has(i + 100),
    onClick: () => setReading(b)
  })))))), reading && /*#__PURE__*/React.createElement("div", {
    style: lbS.overlay,
    onClick: () => setReading(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: lbS.reader,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: lbS.readerBar
  }, /*#__PURE__*/React.createElement("div", {
    style: lbS.readerCrumb
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book",
    size: "size-4",
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("span", null, "Resumo \xB7 ", reading.category)), /*#__PURE__*/React.createElement("div", {
    style: lbS.readerActions
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "brand"
  }, "Lendo"), /*#__PURE__*/React.createElement("button", {
    style: lbS.readerClose,
    onClick: () => setReading(null)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "xmark",
    size: "size-5"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "al-md al-md--dropcap al-scrollbar",
    style: lbS.readerBody,
    dangerouslySetInnerHTML: {
      __html: mdToHtml(READER_MD)
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: lbS.readerFoot
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "link"
  }, "\u2190 voltar \xE0 estante"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline"
  }, "Marcar como lido")))));
}
const lbS = {
  page: {
    minHeight: '100vh',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)'
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    gap: 36,
    padding: '0 36px',
    height: 64,
    borderBottom: '1px solid var(--hairline)',
    position: 'sticky',
    top: 0,
    background: 'hsl(var(--background-hsl) / 0.9)',
    backdropFilter: 'blur(10px)',
    zIndex: 5
  },
  brand: {
    fontFamily: 'var(--font-serif)',
    fontSize: 24,
    fontWeight: 400
  },
  brandEm: {
    fontStyle: 'italic',
    color: 'var(--primary)'
  },
  nav: {
    display: 'flex',
    gap: 26
  },
  navItem: {
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--muted-foreground)',
    cursor: 'pointer'
  },
  navItemOn: {
    color: 'var(--foreground)'
  },
  topRight: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 18,
    alignItems: 'center'
  },
  main: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '44px 36px 80px'
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 30,
    marginBottom: 56
  },
  heroEyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--primary)',
    margin: 0
  },
  heroTitle: {
    fontFamily: 'var(--font-serif)',
    fontWeight: 300,
    fontSize: 58,
    letterSpacing: '-0.025em',
    margin: '14px 0 0',
    lineHeight: 1
  },
  heroEm: {
    fontStyle: 'italic',
    color: 'var(--primary)',
    fontWeight: 300
  },
  heroStats: {
    display: 'flex',
    gap: 10,
    flexShrink: 0
  },
  section: {
    marginBottom: 56
  },
  shelf: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 28,
    marginTop: 30
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'hsl(0 0% 0% / 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 20,
    animation: 'al-fade-in 240ms var(--ease-out)'
  },
  reader: {
    width: 'min(620px, 92vw)',
    height: '100%',
    background: 'var(--background)',
    borderLeft: '1px solid var(--hairline-strong)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-modal)'
  },
  readerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 28px',
    borderBottom: '1px solid var(--hairline)',
    flexShrink: 0
  },
  readerCrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--muted-foreground)'
  },
  readerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  readerClose: {
    display: 'flex',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    cursor: 'pointer'
  },
  readerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '40px 56px',
    '--reading-size': '18px'
  },
  readerFoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 28px',
    borderTop: '1px solid var(--hairline)',
    flexShrink: 0
  }
};
window.LivrosBiblioteca = LivrosBiblioteca;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/livros/LivrosBiblioteca.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BookCard = __ds_scope.BookCard;

__ds_ns.Milestone = __ds_scope.Milestone;

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
