/* hard-region.js — homepage hero: a phase-diagram terrain.
   x: system complexity, y: data cost. Dense benchmark points bottom-left;
   rugged contours and a crimson glow in the top-right "hard region".
   Canvas2D + inline Perlin noise + marching squares. No dependencies. */
(function () {
  'use strict';

  var fig = document.getElementById('hard-region');
  var canvas = document.getElementById('hr-canvas');
  if (!fig || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var PRM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- seeded Perlin noise ---------- */
  function makeNoise(seed) {
    var p = new Uint8Array(512), s = seed >>> 0 || 1, i, j, t;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { j = (rnd() * (i + 1)) | 0; t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 256; i++) p[256 + i] = p[i];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t, a, b) { return a + t * (b - a); }
    function grad(h, x, y) {
      switch (h & 7) {
        case 0: return x + y; case 1: return x - y;
        case 2: return -x + y; case 3: return -x - y;
        case 4: return x; case 5: return -x;
        case 6: return y; default: return -y;
      }
    }
    return function (x, y) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      var u = fade(x), v = fade(y);
      var a = p[X] + Y, b = p[X + 1] + Y;
      return lerp(v,
        lerp(u, grad(p[a], x, y), grad(p[b], x - 1, y)),
        lerp(u, grad(p[a + 1], x, y - 1), grad(p[b + 1], x - 1, y - 1)));
    };
  }

  var noise = makeNoise(20260610);
  function fbm(x, y) {
    var v = 0, amp = 1, f = 1, n = 0;
    for (var o = 0; o < 4; o++) { v += amp * noise(x * f, y * f); n += amp; amp *= 0.5; f *= 2; }
    return v / n * 0.5 + 0.5;
  }
  function smooth(a, b, x) {
    x = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return x * x * (3 - 2 * x);
  }

  /* ---------- field: flat lowlands bottom-left, rugged top-right ----------
     unit coords: u = complexity (right+), v = data cost (up+) */
  var GX = 96, GY = 56;
  function field(u, v) {
    var hard = smooth(0.18, 0.95, (u + v) / 2);
    return fbm(u * 3.1 + 7, v * 3.1 + 3) * (0.28 + 0.92 * hard);
  }

  /* ---------- marching squares → contour segments in unit space ---------- */
  var segments = [];   // [u1,v1,u2,v2,level]
  var LEVELS = [0.3, 0.42, 0.54, 0.66, 0.78];
  function buildContours() {
    segments = [];
    var vals = [], i, j;
    for (j = 0; j <= GY; j++) {
      vals[j] = [];
      for (i = 0; i <= GX; i++) vals[j][i] = field(i / GX, j / GY);
    }
    function ix(a, b, L) { return (L - a) / (b - a); }
    for (var li = 0; li < LEVELS.length; li++) {
      var L = LEVELS[li];
      for (j = 0; j < GY; j++) {
        for (i = 0; i < GX; i++) {
          var tl = vals[j + 1][i], tr = vals[j + 1][i + 1];
          var br = vals[j][i + 1], bl = vals[j][i];
          var c = (tl > L ? 8 : 0) | (tr > L ? 4 : 0) | (br > L ? 2 : 0) | (bl > L ? 1 : 0);
          if (c === 0 || c === 15) continue;
          var x0 = i / GX, x1 = (i + 1) / GX, y0 = j / GY, y1 = (j + 1) / GY;
          /* edge points: T(top) R B L */
          var T = [x0 + ix(tl, tr, L) / GX, y1];
          var R = [x1, y0 + ix(br, tr, L) / GY];
          var B = [x0 + ix(bl, br, L) / GX, y0];
          var Lt = [x0, y0 + ix(bl, tl, L) / GY];
          var put = function (p, q) { segments.push([p[0], p[1], q[0], q[1], li]); };
          switch (c) {
            case 1: case 14: put(Lt, B); break;
            case 2: case 13: put(B, R); break;
            case 3: case 12: put(Lt, R); break;
            case 4: case 11: put(T, R); break;
            case 6: case 9: put(T, B); break;
            case 7: case 8: put(Lt, T); break;
            case 5: put(Lt, T); put(B, R); break;
            case 10: put(Lt, B); put(T, R); break;
          }
        }
      }
    }
  }

  /* ---------- data points: dense where data is cheap ---------- */
  var pts = [], hardPts = [];
  function buildPoints() {
    pts = []; hardPts = [];
    var s = 99, n = 0, guard = 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    while (n < 150 && guard++ < 4000) {
      var u = rnd(), v = rnd();
      var density = (1 - u) * (1 - v) * 1.25 + 0.015;
      if (rnd() < density) { pts.push([u, v]); n++; }
    }
    hardPts = [[0.74, 0.78], [0.83, 0.86], [0.9, 0.74], [0.87, 0.92]];
  }

  /* ---------- drawing ---------- */
  var W = 0, H = 0, dpr = 1;
  function colors() {
    var cs = getComputedStyle(document.documentElement);
    return {
      contour: cs.getPropertyValue('--color-border-strong').trim() || 'rgba(128,128,128,.3)',
      pt: cs.getPropertyValue('--color-text-light').trim() || '#888',
      hard: cs.getPropertyValue('--color-primary').trim() || '#e5484d',
      glow: cs.getPropertyValue('--glow-color').trim() || 'rgba(128,0,0,.12)'
    };
  }
  function resize() {
    var r = fig.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  function draw(scale, ox, oy) {
    var c = colors();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    /* glow over the hard region */
    var gx = 0.86 * W, gy = 0.12 * H;
    var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.55 * W);
    g.addColorStop(0, c.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* contours (v up → canvas y down) */
    ctx.lineWidth = 1;
    ctx.strokeStyle = c.contour;
    for (var li = 0; li < LEVELS.length; li++) {
      ctx.globalAlpha = 0.35 + li * 0.14;
      ctx.beginPath();
      for (var k = 0; k < segments.length; k++) {
        var sg = segments[k];
        if (sg[4] !== li) continue;
        ctx.moveTo(sg[0] * W, (1 - sg[1]) * H);
        ctx.lineTo(sg[2] * W, (1 - sg[3]) * H);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* benchmark-rich points */
    ctx.fillStyle = c.pt;
    for (k = 0; k < pts.length; k++) {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(pts[k][0] * W, (1 - pts[k][1]) * H, 1.6, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* the few hard-won points out in the wild */
    ctx.fillStyle = c.hard;
    ctx.shadowColor = c.hard;
    ctx.shadowBlur = 10;
    for (k = 0; k < hardPts.length; k++) {
      ctx.beginPath();
      ctx.arc(hardPts[k][0] * W, (1 - hardPts[k][1]) * H, 2.4, 0, 6.2832);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* ---------- entrance: camera pulls back from the lowlands ---------- */
  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function enter() {
    if (PRM) { draw(1, 0, 0); return; }
    var t0 = performance.now(), D = 1500;
    function frame(now) {
      var t = Math.min(1, (now - t0) / D);
      var e = easeOutExpo(t);
      var scale = 1.3 - 0.3 * e;          /* 1.3 → 1 */
      var ox = -0.06 * W * (1 - e);       /* start pushed toward bottom-left */
      var oy = 0.12 * H * (1 - e);
      draw(scale, ox, oy);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function rebuild() { resize(); draw(1, 0, 0); }

  buildContours();
  buildPoints();
  resize();

  /* draw on first visibility */
  if ('IntersectionObserver' in window) {
    var seen = false;
    new IntersectionObserver(function (en, io) {
      if (en[0].isIntersecting && !seen) { seen = true; enter(); io.disconnect(); }
    }).observe(fig);
  } else {
    enter();
  }

  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(rebuild, 150); });
  var mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', function () { draw(1, 0, 0); });
})();
