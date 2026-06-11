/* site.js — Crimson Lab runtime
   [1] ambient fluid layer   [2] scroll reveals + card spotlight
   [3] ⌘K command palette    [4] console card */

/* ---------- [1] ambient fluid (dark scheme, fine pointers, WebGL, motion-OK) ---------- */
(function () {
  'use strict';

  var PRM = matchMedia('(prefers-reduced-motion: reduce)');
  var DARK = matchMedia('(prefers-color-scheme: dark)');
  var COARSE = matchMedia('(pointer: coarse)');
  var fluidStarted = false;

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }

  function dimColor(hex, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return { r: 0.18, g: 0.05, b: 0.06 };
    var n = parseInt(m[1], 16);
    return {
      r: ((n >> 16) & 255) / 255 * k,
      g: ((n >> 8) & 255) / 255 * k,
      b: (n & 255) / 255 * k
    };
  }

  function startFluid() {
    if (fluidStarted) return;
    var canvas = document.getElementById('fluid-canvas');
    if (!canvas || !window.WebGLFluid) return;
    if (PRM.matches || COARSE.matches || !webglOK()) return;
    fluidStarted = true;

    /* dark: dim crimson dye through screen blend;
       light: maroon ink-wash through multiply blend */
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    var dye = DARK.matches ? dimColor(accent, 0.25) : dimColor('#800000', 0.85);

    window.WebGLFluid(canvas, {
      TRIGGER: 'hover',
      IMMEDIATE: false,
      AUTO: false,
      TRANSPARENT: true,
      BLOOM: false,
      SUNRAYS: false,
      COLORFUL: false,
      SPLAT_COLOR: dye,
      SPLAT_RADIUS: 0.16,
      SPLAT_FORCE: 2600,
      DENSITY_DISSIPATION: 1.6,
      VELOCITY_DISSIPATION: 1.0,
      PRESSURE_ITERATIONS: 14,
      CURL: 14,
      SIM_RESOLUTION: 96,
      DYE_RESOLUTION: 512
    });

    /* canvas stays pointer-events:none — forward window movement, rAF-throttled.
       The lib reads offsetX/offsetY, which Chrome reports as 0 on synthetic
       events (Safari computes them) — so define them explicitly; the canvas
       is full-viewport at (0,0), making offset == client coords. */
    var pending = false;
    addEventListener('pointermove', function (e) {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        var ev = new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY });
        Object.defineProperty(ev, 'offsetX', { value: e.clientX, enumerable: true });
        Object.defineProperty(ev, 'offsetY', { value: e.clientY, enumerable: true });
        canvas.dispatchEvent(ev);
      });
    }, { passive: true });
    /* tab hidden → rAF auto-throttles; idle → dye fully dissipates */
  }

  function bootFluid() {
    (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startFluid);
  }

  if (document.readyState === 'complete') bootFluid();
  else addEventListener('load', bootFluid);
})();

/* ---------- [2] scroll reveals + card spotlight ---------- */
(function () {
  'use strict';
  var PRM = matchMedia('(prefers-reduced-motion: reduce)');

  function init() {
    /* spotlight coordinates for cards */
    document.addEventListener('pointermove', function (e) {
      var t = e.target && e.target.closest && e.target.closest('.feature-card, .card');
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    /* component playback trigger: .anim-onview gets .play on first sight */
    if ('IntersectionObserver' in window) {
      var avEls = document.querySelectorAll('.anim-onview');
      if (avEls.length) {
        var avIO = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add('play'); avIO.unobserve(en.target); }
          });
        }, { threshold: 0.35 });
        [].forEach.call(avEls, function (el) { avIO.observe(el); });
      }
    }

    /* below-the-fold reveals; above-the-fold content is never touched */
    if (PRM.matches || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    var els = document.querySelectorAll(
      '.page-container .section-header, .grid > *, .publication-item, .blog-item, .card, .page-container img, .journey > li'
    );
    [].forEach.call(els, function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
      var p = el.parentElement;
      var i = p.__ri = (p.__ri || 0);
      p.__ri = i + 1;
      el.classList.add('reveal');
      el.style.setProperty('--i', i % 6);
      io.observe(el);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* ---------- [3] ⌘K command palette ---------- */
(function () {
  'use strict';
  if (matchMedia('(pointer: coarse)').matches) return;

  var overlay, listEl, inputEl, countEl, lastFocus;
  var items = [], filtered = [], active = 0, loaded = false;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.innerHTML =
      '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Site search">' +
        '<input class="cmdk-input" type="text" placeholder="Jump to a page, paper, or post…" autocomplete="off" spellcheck="false">' +
        '<ul class="cmdk-list" role="listbox"></ul>' +
        '<div class="cmdk-foot"><span><kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</span><span class="cmdk-count"></span></div>' +
      '</div>';
    document.body.appendChild(overlay);
    inputEl = overlay.querySelector('.cmdk-input');
    listEl = overlay.querySelector('.cmdk-list');
    countEl = overlay.querySelector('.cmdk-count');
    overlay.addEventListener('pointerdown', function (e) { if (e.target === overlay) close(); });
    inputEl.addEventListener('input', function () { filter(inputEl.value); });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
    });
  }

  function load() {
    if (loaded) return Promise.resolve();
    return fetch('/search.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { items = d; loaded = true; })
      .catch(function () { items = []; loaded = true; });
  }

  function filter(q) {
    q = (q || '').trim().toLowerCase();
    filtered = (!q ? items : items.filter(function (it) {
      return (it.t + ' ' + (it.k || '')).toLowerCase().indexOf(q) > -1;
    })).slice(0, 9);
    active = 0;
    render();
  }

  function render() {
    listEl.innerHTML = filtered.map(function (it, i) {
      return '<li class="cmdk-item' + (i === active ? ' active' : '') + '" role="option">' +
        '<span class="cmdk-title">' + esc(it.t) + '</span>' +
        '<span class="cmdk-kind">' + esc(it.d || it.k || '') + '</span></li>';
    }).join('');
    countEl.textContent = items.length ? filtered.length + '/' + items.length : '';
    [].forEach.call(listEl.children, function (li, i) {
      li.addEventListener('pointerenter', function () { active = i; paint(); });
      li.addEventListener('click', go);
    });
  }

  function paint() {
    [].forEach.call(listEl.children, function (li, i) {
      li.classList.toggle('active', i === active);
    });
  }

  function move(d) {
    if (!filtered.length) return;
    active = (active + d + filtered.length) % filtered.length;
    paint();
    if (listEl.children[active]) listEl.children[active].scrollIntoView({ block: 'nearest' });
  }

  function go() {
    var it = filtered[active];
    if (it) location.href = it.u;
  }

  function open() {
    if (!overlay) build();
    lastFocus = document.activeElement;
    load().then(function () {
      overlay.classList.add('open');
      inputEl.value = '';
      filter('');
      inputEl.focus();
    });
  }

  function close() {
    if (overlay && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
  }

  addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
      e.preventDefault();
      (overlay && overlay.classList.contains('open')) ? close() : open();
    } else if (e.key === 'Escape') {
      close();
    }
  });
})();

/* ---------- [4] console card ---------- */
(function () {
  'use strict';
  if (typeof console === 'undefined' || !console.log) return;
  try {
    console.log(
      '%cRui Ding%c  AI × Complex Functional Materials/Devices',
      'color:#e5484d;font-weight:700;font-size:16px',
      'color:#d7c69d;font-size:12px;letter-spacing:.08em'
    );
    console.log(
      '%cDToR proposes → T³ screens → RAPIDS verifies → the wet lab confirms.\n' +
      'You found the easter egg. Say hi: ruiding@uchicago.edu',
      'color:#8a847b'
    );
  } catch (e) { /* no-op */ }
})();
