/* hard-region.js v2 — interactive phase-diagram terrain.
   x: system complexity, y: data cost. Cursor = exploring probe: crosshair
   reticle with live coordinates, contour lens highlight, click to sample
   the space (sampling in the hard region leaves a permanent crimson point).
   Canvas2D + inline Perlin + marching squares. No dependencies. */
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

  var GX = 96, GY = 56;
  function field(u, v) {
    var hard = smooth(0.18, 0.95, (u + v) / 2);
    return fbm(u * 3.1 + 7, v * 3.1 + 3) * (0.28 + 0.92 * hard);
  }

  /* ---------- contours ---------- */
  var segments = [];
  var LEVELS = [0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86];
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

  /* ---------- data points ---------- */
  var pts = [], hardPts = [], refPts = [];
  function buildPoints() {
    pts = []; hardPts = [];
    var s = 99, n = 0, guard = 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    while (n < 150 && guard++ < 4000) {
      var u = rnd(), v = rnd();
      var density = (1 - u) * (1 - v) * 1.25 + 0.015;
      if (rnd() < density) { pts.push([u, v]); n++; }
    }
    /* the systems I actually work on — all living deep in the hard region */
    hardPts = [
      { u: 0.63, v: 0.74, label: 'fuel cell components',             dx: -8,  dy: 14, align: 'right' },
      { u: 0.76, v: 0.92, label: 'electrolyzer components',          dx: -10, dy: 4,  align: 'right' },
      { u: 0.90, v: 0.69, label: 'FET sensors',                      dx: -10, dy: 4,  align: 'right' },
      { u: 0.71, v: 0.59, label: 'PFAS sensing/adsorption materials', dx: -10, dy: 4,  align: 'right' },
      { u: 0.94, v: 0.84, label: 'complex nanomaterials',            dx: -10, dy: 14, align: 'right' }
    ];
    /* classic landmarks in the charted territory */
    refPts = [
      { u: 0.10, v: 0.10,  label: 'QM9' },
      { u: 0.17, v: 0.165, label: 'Materials Project' },
      { u: 0.30, v: 0.085, label: 'OC20' },
      { u: 0.36, v: 0.36,  label: 'perovskites' },
      { u: 0.50, v: 0.30,  label: 'MOFs' },
      { u: 0.55, v: 0.44,  label: 'high-entropy alloys' }
    ];
  }

  /* ---------- state ---------- */
  var W = 0, H = 0, dpr = 1, COL = null;
  var mouse = { x: 0, y: 0, on: false };
  var ripples = [], samples = [];
  var enterT0 = 0, running = false, visible = false, lastFrame = 0;

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    COL = {
      contour: cs.getPropertyValue('--color-border-strong').trim() || 'rgba(128,128,128,.3)',
      pt: cs.getPropertyValue('--color-text-light').trim() || '#888',
      hard: cs.getPropertyValue('--color-primary').trim() || '#e5484d',
      glow: cs.getPropertyValue('--glow-color').trim() || 'rgba(128,0,0,.12)',
      text: cs.getPropertyValue('--color-text-muted').trim() || '#999'
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
  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  /* ---------- draw ---------- */
  function draw(now, scale, ox, oy) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    /* breathing glow over the hard region */
    var gx = 0.86 * W, gy = 0.12 * H;
    var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.55 * W);
    g.addColorStop(0, COL.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = PRM ? 1 : 0.75 + 0.25 * Math.sin(now / 1700);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* contours, batched per level */
    ctx.lineWidth = 1;
    ctx.strokeStyle = COL.contour;
    var k, sg;
    for (var li = 0; li < LEVELS.length; li++) {
      ctx.globalAlpha = 0.28 + li * 0.1;
      ctx.beginPath();
      for (k = 0; k < segments.length; k++) {
        sg = segments[k];
        if (sg[4] !== li) continue;
        ctx.moveTo(sg[0] * W, (1 - sg[1]) * H);
        ctx.lineTo(sg[2] * W, (1 - sg[3]) * H);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* contour lens: lines near the cursor heat up */
    if (mouse.on) {
      var R2a = 45 * 45, R2b = 80 * 80, R2c = 115 * 115;
      var buckets = [[], [], []];
      for (k = 0; k < segments.length; k++) {
        sg = segments[k];
        var mx = (sg[0] + sg[2]) / 2 * W, my = (1 - (sg[1] + sg[3]) / 2) * H;
        var dx = mx - mouse.x, dy = my - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R2a) buckets[0].push(sg);
        else if (d2 < R2b) buckets[1].push(sg);
        else if (d2 < R2c) buckets[2].push(sg);
      }
      var lensA = [0.9, 0.5, 0.22];
      ctx.strokeStyle = COL.hard;
      ctx.lineWidth = 1.1;
      for (var b = 0; b < 3; b++) {
        if (!buckets[b].length) continue;
        ctx.globalAlpha = lensA[b];
        ctx.beginPath();
        for (k = 0; k < buckets[b].length; k++) {
          sg = buckets[b][k];
          ctx.moveTo(sg[0] * W, (1 - sg[1]) * H);
          ctx.lineTo(sg[2] * W, (1 - sg[3]) * H);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    /* benchmark points (grow slightly near the cursor) */
    ctx.fillStyle = COL.pt;
    for (k = 0; k < pts.length; k++) {
      var px = pts[k][0] * W, py = (1 - pts[k][1]) * H, r = 1.6;
      if (mouse.on) {
        var ddx = px - mouse.x, ddy = py - mouse.y;
        var dd = ddx * ddx + ddy * ddy;
        if (dd < 4900) r = 1.6 + 1.6 * (1 - Math.sqrt(dd) / 70);
      }
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* classic landmarks: quiet gray anchors in charted territory */
    ctx.font = '500 8.5px "JetBrains Mono", monospace';
    if (W > 480) {
      ctx.textAlign = 'left';
      for (k = 0; k < refPts.length; k++) {
        var rf = refPts[k];
        var rx = rf.u * W, ry = (1 - rf.v) * H;
        ctx.fillStyle = COL.pt;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = COL.text;
        ctx.fillText(rf.label, rx + 7, ry + 3);
      }
      ctx.globalAlpha = 1;
    }

    /* hard-won systems twinkle, each carrying its name */
    for (k = 0; k < hardPts.length; k++) {
      var hp = hardPts[k];
      var hx = hp.u * W, hy = (1 - hp.v) * H;
      var tw = PRM ? 1 : 0.65 + 0.35 * Math.sin(now / 640 + k * 1.7);
      ctx.fillStyle = COL.hard;
      ctx.shadowColor = COL.hard;
      ctx.globalAlpha = tw;
      ctx.shadowBlur = 8 + 6 * tw;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.4, 0, 6.2832);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.55 + 0.3 * tw;
      ctx.fillStyle = COL.text;
      ctx.textAlign = hp.align;
      ctx.fillText(hp.label, hx + hp.dx, hy + hp.dy);
    }
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    /* user samples: crimson survivors in the hard region, fading grays elsewhere */
    for (k = samples.length - 1; k >= 0; k--) {
      var sm = samples[k];
      if (sm.hard) {
        ctx.fillStyle = COL.hard;
        ctx.shadowColor = COL.hard;
        ctx.shadowBlur = 9;
        ctx.globalAlpha = 1;
      } else {
        var age = (now - sm.t) / 2600;
        if (age >= 1) { samples.splice(k, 1); continue; }
        ctx.fillStyle = COL.pt;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.6 * (1 - age);
      }
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, 2.6, 0, 6.2832);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    /* sampling ripples */
    for (k = ripples.length - 1; k >= 0; k--) {
      var rp = ripples[k], a = (now - rp.t) / 850;
      if (a >= 1) { ripples.splice(k, 1); continue; }
      ctx.strokeStyle = COL.hard;
      ctx.globalAlpha = 0.7 * (1 - a);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 6 + 64 * easeOutExpo(a), 0, 6.2832);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* reticle + live coordinates */
    if (mouse.on) {
      ctx.strokeStyle = COL.contour;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(0, mouse.y); ctx.lineTo(W, mouse.y);
      ctx.moveTo(mouse.x, 0); ctx.lineTo(mouse.x, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COL.hard;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 11, 0, 6.2832);
      ctx.stroke();
      var u = mouse.x / W, v = 1 - mouse.y / H;
      ctx.fillStyle = COL.text;
      ctx.font = '600 9px "JetBrains Mono", monospace';
      var label = 'CX ' + u.toFixed(2) + ' · COST ' + v.toFixed(2);
      var lx = mouse.x + 16, ly = mouse.y - 12;
      if (lx > W - 110) lx = mouse.x - 110;
      if (ly < 14) ly = mouse.y + 22;
      ctx.fillText(label, lx, ly);
    }
  }

  /* ---------- loop ---------- */
  function tick(now) {
    if (!visible) { running = false; return; }
    if (now - lastFrame < 30) { requestAnimationFrame(tick); return; }
    lastFrame = now;
    var dt = now - enterT0, scale = 1, ox = 0, oy = 0;
    if (dt < 1500) {
      var e = easeOutExpo(dt / 1500);
      scale = 1.3 - 0.3 * e;
      ox = -0.06 * W * (1 - e);
      oy = 0.12 * H * (1 - e);
    }
    draw(now, scale, ox, oy);
    requestAnimationFrame(tick);
  }
  function startLoop() {
    if (running || PRM) return;
    running = true;
    requestAnimationFrame(tick);
  }

  /* ---------- events ---------- */
  function localXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  if (!PRM) {
    fig.addEventListener('pointermove', function (e) {
      var p = localXY(e);
      mouse.x = p.x; mouse.y = p.y; mouse.on = true;
    }, { passive: true });
    fig.addEventListener('pointerleave', function () { mouse.on = false; });
    fig.addEventListener('pointerdown', function (e) {
      var p = localXY(e);
      var u = p.x / W, v = 1 - p.y / H;
      ripples.push({ x: p.x, y: p.y, t: performance.now() });
      var hard = (u + v) / 2 > 0.6;
      samples.push({ x: p.x, y: p.y, hard: hard, t: performance.now() });
      var nHard = 0, k;
      for (k = 0; k < samples.length; k++) if (samples[k].hard) nHard++;
      for (k = 0; nHard > 6 && k < samples.length; k++) {
        if (samples[k].hard) { samples.splice(k, 1); nHard--; k--; }
      }
    });
  }

  /* ---------- boot ---------- */
  buildContours();
  buildPoints();
  colors();
  resize();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) {
        if (!enterT0) enterT0 = performance.now();
        if (PRM) draw(0, 1, 0, 0);
        else startLoop();
      }
    }, { threshold: 0.15 }).observe(fig);
  } else {
    visible = true;
    enterT0 = performance.now();
    if (PRM) draw(0, 1, 0, 0); else startLoop();
  }

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); if (PRM) draw(0, 1, 0, 0); }, 150);
  });
  var mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function () { colors(); if (PRM) draw(0, 1, 0, 0); });
  }
})();
