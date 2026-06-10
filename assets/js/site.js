/* site.js — Crimson Lab runtime
   [1] ambient fluid layer (dark scheme, fine pointers, WebGL, motion-OK only)
   Later sections: scroll reveals, command palette, console card. */
(function () {
  'use strict';

  var PRM = matchMedia('(prefers-reduced-motion: reduce)');
  var DARK = matchMedia('(prefers-color-scheme: dark)');
  var COARSE = matchMedia('(pointer: coarse)');

  /* ---------- [1] ambient fluid ---------- */
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
    /* guards: reduced motion, light scheme, touch devices, no WebGL */
    if (PRM.matches || !DARK.matches || COARSE.matches || !webglOK()) return;
    fluidStarted = true;

    var accent = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');

    window.WebGLFluid(canvas, {
      TRIGGER: 'hover',
      IMMEDIATE: false,
      AUTO: false,
      TRANSPARENT: true,
      BLOOM: false,
      SUNRAYS: false,
      COLORFUL: false,
      SPLAT_COLOR: dimColor(accent, 0.22),
      SPLAT_RADIUS: 0.12,
      SPLAT_FORCE: 2200,
      DENSITY_DISSIPATION: 2.2,
      VELOCITY_DISSIPATION: 1.1,
      PRESSURE_ITERATIONS: 14,
      CURL: 12,
      SIM_RESOLUTION: 96,
      DYE_RESOLUTION: 512
    });

    /* canvas stays pointer-events:none — forward window movement, rAF-throttled */
    var pending = false;
    addEventListener('pointermove', function (e) {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        canvas.dispatchEvent(new MouseEvent('mousemove', {
          clientX: e.clientX, clientY: e.clientY
        }));
      });
    }, { passive: true });
    /* tab hidden → rAF auto-throttles to zero; idle → dye fully dissipates */
  }

  function bootFluid() {
    (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startFluid);
  }

  if (document.readyState === 'complete') bootFluid();
  else addEventListener('load', bootFluid);
  if (DARK.addEventListener) {
    DARK.addEventListener('change', function (e) { if (e.matches) bootFluid(); });
  }
})();
