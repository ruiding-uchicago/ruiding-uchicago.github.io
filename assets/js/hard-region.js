/* hard-region.js v3 — interactive phase-diagram terrain.
   Three point classes (teal: benchmarked / champagne: active discovery /
   crimson: no-database hard region), idle auto-survey probe, click-to-sample,
   click a hard system to read why it is hard. Canvas2D, no dependencies. */
(function () {
  'use strict';

  var fig = document.getElementById('hard-region');
  var canvas = document.getElementById('hr-canvas');
  if (!fig || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var info = document.getElementById('hr-info');

  var PRM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NO_PROBE = !!window.__HR_NO_PROBE;   // GIF/export mode: drop the roaming probe + intro zoom for a clean loop
  var DIM = !!window.__HR_DIM;             // GIF/export mode: fade the non-active zone clusters during the tour

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

  /* ---------- point classes ---------- */
  var pts = [], hardPts = [], benchPts = [], discPts = [];
  function buildPoints() {
    pts = [];
    var s = 99, n = 0, guard = 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    while (n < 150 && guard++ < 4000) {
      var u = rnd(), v = rnd();
      var density = (1 - u) * (1 - v) * 1.25 + 0.015;
      if (rnd() < density) { pts.push([u, v]); n++; }
    }
    /* charted territory: big public databases & benchmarks */
    benchPts = [
      { u: 0.10, v: 0.10,  label: 'QM9' },
      { u: 0.17, v: 0.165, label: 'Materials Project' },
      { u: 0.30, v: 0.085, label: 'OC20' }
    ];
    /* half-charted: active discovery fields with partial data */
    discPts = [
      { u: 0.36, v: 0.36, label: 'perovskites' },
      { u: 0.50, v: 0.30, label: 'MOFs' },
      { u: 0.55, v: 0.44, label: 'high-entropy alloys' }
    ];
    /* the systems I actually work on, and why each is hard */
    hardPts = [
      { u: 0.63, v: 0.74, label: 'fuel cell components', dx: -8, dy: 14, align: 'right',
        why: 'Catalyst, ionomer, membrane and GDL all couple. One data point means building and testing a full assembly.' },
      { u: 0.76, v: 0.92, label: 'electrolyzer components', dx: -10, dy: 4, align: 'right',
        why: 'Same coupling as fuel cells, plus degradation that only shows up after hundreds of hours.' },
      { u: 0.90, v: 0.69, label: 'FET sensors', dx: -10, dy: 4, align: 'right',
        why: 'Response depends on probe, channel, geometry and the water matrix at once. Published curves are rarely comparable.' },
      { u: 0.71, v: 0.59, label: 'PFAS sensing/adsorption materials', dx: -10, dy: 4, align: 'right',
        why: 'ppt-level targets in real matrices full of competing ions. Public datasets: nearly none.' },
      { u: 0.94, v: 0.84, label: 'complex nanomaterials', dx: -10, dy: 14, align: 'right',
        why: 'Long synthesis-structure-property chains, dozens of coupled variables, no standard descriptors.' }
    ];
  }

  /* ---------- state ---------- */
  var W = 0, H = 0, dpr = 1, COL = null;
  var mouse = { x: 0, y: 0, on: false };
  var ripples = [], samples = [];
  var enterT0 = 0, running = false, visible = false, lastFrame = 0;
  var lastUserT = -1e9, tourZone = -1;
  var auto = { x: 0, y: 0, tx: 0, ty: 0, nextMove: 0, nextPing: 0, seed: 7, init: false };

  function arnd() { auto.seed = (auto.seed * 1664525 + 1013904223) >>> 0; return auto.seed / 4294967296; }

  function hexA(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return 'rgba(94,154,154,' + a + ')';
    var n = parseInt(m[1], 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    COL = {
      contour: cs.getPropertyValue('--color-border-strong').trim() || 'rgba(128,128,128,.3)',
      pt: cs.getPropertyValue('--color-text-light').trim() || '#888',
      hard: cs.getPropertyValue('--color-primary').trim() || '#e5484d',
      glow: cs.getPropertyValue('--glow-color').trim() || 'rgba(128,0,0,.12)',
      text: cs.getPropertyValue('--color-text-muted').trim() || '#999',
      teal: cs.getPropertyValue('--color-accent-teal').trim() || '#5e9a9a',
      champ: cs.getPropertyValue('--color-accent').trim() || '#d7c69d'
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

  /* ---------- reticle (shared by user cursor and auto probe) ---------- */
  function reticle(x, y, alpha, tag) {
    ctx.strokeStyle = COL.contour;
    ctx.globalAlpha = 0.6 * alpha;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.moveTo(x, 0); ctx.lineTo(x, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COL.hard;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, 6.2832);
    ctx.stroke();
    var u = x / W, v = 1 - y / H;
    ctx.fillStyle = COL.text;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    var label = (tag ? tag + ' · ' : '') + 'CX ' + u.toFixed(2) + ' · COST ' + v.toFixed(2);
    var lx = x + 16, ly = y - 12;
    if (lx > W - 150) lx = x - 150;
    if (ly < 14) ly = y + 22;
    ctx.fillText(label, lx, ly);
    ctx.globalAlpha = 1;
  }

  function diamond(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- draw ---------- */
  function draw(now, scale, ox, oy) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    /* cool wash over charted territory (bottom-left) */
    var sg2 = ctx.createRadialGradient(0.08 * W, 0.96 * H, 0, 0.08 * W, 0.96 * H, 0.6 * W);
    sg2.addColorStop(0, hexA(COL.teal, 0.09));
    sg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg2;
    ctx.fillRect(0, 0, W, H);

    /* breathing crimson glow over the hard region (top-right) */
    var gx = 0.86 * W, gy = 0.12 * H;
    var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.55 * W);
    g.addColorStop(0, COL.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = PRM ? 1 : 0.75 + 0.25 * Math.sin(now / 1700);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* contours */
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

    /* contour lens near the active probe (user or auto) */
    var probeX = -1, probeY = -1;
    if (mouse.on) { probeX = mouse.x; probeY = mouse.y; }
    else if (autoOn(now)) { probeX = auto.x; probeY = auto.y; }
    if (probeX >= 0) {
      var R2a = 45 * 45, R2b = 80 * 80, R2c = 115 * 115;
      var buckets = [[], [], []];
      for (k = 0; k < segments.length; k++) {
        sg = segments[k];
        var mx = (sg[0] + sg[2]) / 2 * W, my = (1 - (sg[1] + sg[3]) / 2) * H;
        var dx = mx - probeX, dy = my - probeY, d2 = dx * dx + dy * dy;
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

    /* anonymous benchmark dust (grows slightly near the probe) */
    ctx.fillStyle = COL.pt;
    for (k = 0; k < pts.length; k++) {
      var px = pts[k][0] * W, py = (1 - pts[k][1]) * H, r = 1.6;
      if (probeX >= 0) {
        var ddx = px - probeX, ddy = py - probeY;
        var dd = ddx * ddx + ddy * ddy;
        if (dd < 4900) r = 1.6 + 1.6 * (1 - Math.sqrt(dd) / 70);
      }
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    var showLabels = W > 480;
    var aZone = mouse.on ? -1 : tourZone;   // region tour: which point group to emphasise
    var dimOther = (DIM && aZone >= 0) ? 0.14 : 1;
    ctx.font = '500 9.5px "JetBrains Mono", monospace';

    /* teal: charted, benchmarked */
    ctx.textAlign = 'left';
    for (k = 0; k < benchPts.length; k++) {
      var bp = benchPts[k];
      var bx = bp.u * W, by = (1 - bp.v) * H;
      var bAct = aZone === 0;
      ctx.fillStyle = COL.teal;
      ctx.shadowColor = COL.teal;
      ctx.shadowBlur = bAct ? 10 : 0;
      ctx.globalAlpha = 0.95 * (bAct ? 1 : dimOther);
      ctx.beginPath();
      ctx.arc(bx, by, bAct ? 4 : 2.6, 0, 6.2832);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (showLabels || bAct) {
        ctx.globalAlpha = bAct ? 1 : 0.8 * dimOther;
        ctx.fillText(bp.label, bx + 8, by + 3);
      }
    }
    /* champagne diamonds: active discovery */
    for (k = 0; k < discPts.length; k++) {
      var dp = discPts[k];
      var dxx = dp.u * W, dyy = (1 - dp.v) * H;
      var dAct = aZone === 1;
      ctx.fillStyle = COL.champ;
      ctx.shadowColor = COL.champ;
      ctx.shadowBlur = dAct ? 10 : 0;
      ctx.globalAlpha = 0.95 * (dAct ? 1 : dimOther);
      diamond(dxx, dyy, dAct ? 4.8 : 3.4);
      ctx.shadowBlur = 0;
      if (showLabels || dAct) {
        ctx.globalAlpha = dAct ? 1 : 0.8 * dimOther;
        ctx.fillText(dp.label, dxx + 8, dyy + 3);
      }
    }
    ctx.globalAlpha = 1;

    /* crimson: the hard systems, twinkling, named */
    for (k = 0; k < hardPts.length; k++) {
      var hp = hardPts[k];
      var hx = hp.u * W, hy = (1 - hp.v) * H;
      var hAct = aZone === 2;
      var tw = PRM ? 1 : 0.65 + 0.35 * Math.sin(now / 640 + k * 1.7);
      ctx.fillStyle = COL.hard;
      ctx.shadowColor = COL.hard;
      ctx.globalAlpha = hAct ? 1 : tw * dimOther;
      ctx.shadowBlur = (hAct ? 14 : 8) + 6 * tw;
      ctx.beginPath();
      ctx.arc(hx, hy, hAct ? 4 : 2.8, 0, 6.2832);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (showLabels || hAct) {
        ctx.globalAlpha = hAct ? 1 : (0.6 + 0.3 * tw) * dimOther;
        ctx.fillStyle = COL.hard;
        ctx.textAlign = hp.align;
        ctx.fillText(hp.label, hx + hp.dx, hy + hp.dy);
      }
    }
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;

    /* user samples */
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

    /* ripples */
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

    /* probe reticle */
    if (mouse.on) reticle(mouse.x, mouse.y, 1, '');
    else if (autoOn(now)) reticle(auto.x, auto.y, 0.45, 'AUTO');
  }

  /* ---------- auto-survey probe ---------- */
  function autoOn(now) {
    return !PRM && !NO_PROBE && !mouse.on && visible && (now - lastUserT > 4000);
  }
  function advanceAuto(now) {
    if (!autoOn(now)) return;
    if (!auto.init) {
      auto.init = true;
      auto.x = 0.25 * W; auto.y = 0.7 * H;
      auto.tx = auto.x; auto.ty = auto.y;
      auto.nextMove = 0; auto.nextPing = now + 2500;
    }
    if (now > auto.nextMove) {
      if (arnd() < 0.6) { /* bias toward the hard region */
        auto.tx = (0.6 + 0.34 * arnd()) * W;
        auto.ty = (1 - (0.55 + 0.4 * arnd())) * H;
      } else {
        auto.tx = (0.05 + 0.9 * arnd()) * W;
        auto.ty = (0.05 + 0.9 * arnd()) * H;
      }
      auto.nextMove = now + 2600 + 1600 * arnd();
    }
    auto.x += (auto.tx - auto.x) * 0.045;
    auto.y += (auto.ty - auto.y) * 0.045;
    if (now > auto.nextPing) {
      ripples.push({ x: auto.x, y: auto.y, t: now });
      auto.nextPing = now + 3200 + 1800 * arnd();
    }
  }

  /* ---------- loop ---------- */
  function tick(now) {
    if (!visible) { running = false; return; }
    if (now - lastFrame < 30) { requestAnimationFrame(tick); return; }
    lastFrame = now;
    advanceAuto(now);
    /* when the survey resumes, retire the why-card back to initial state */
    if (info && !info.hidden && autoOn(now)) info.hidden = true;
    var dt = now - enterT0, scale = 1, ox = 0, oy = 0;
    if (!NO_PROBE && dt < 1500) {
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
  function hardHit(x, y) {
    for (var k = 0; k < hardPts.length; k++) {
      var hx = hardPts[k].u * W, hy = (1 - hardPts[k].v) * H;
      var dx = x - hx, dy = y - hy;
      if (dx * dx + dy * dy < 196) return hardPts[k];
    }
    return null;
  }
  if (!PRM) {
    fig.addEventListener('pointermove', function (e) {
      var p = localXY(e);
      mouse.x = p.x; mouse.y = p.y; mouse.on = true;
      fig.style.cursor = hardHit(p.x, p.y) ? 'pointer' : 'crosshair';
    }, { passive: true });
    fig.addEventListener('pointerleave', function () {
      mouse.on = false;
      lastUserT = performance.now();
    });
    fig.addEventListener('pointerdown', function (e) {
      var p = localXY(e);
      var hit = hardHit(p.x, p.y);
      if (hit && info) {
        info.hidden = false;
        info.querySelector('strong').textContent = hit.label;
        info.querySelector('p').textContent = hit.why;
        return;
      }
      if (info) info.hidden = true;
      var u = p.x / W, v = 1 - p.y / H;
      ripples.push({ x: p.x, y: p.y, t: performance.now() });
      samples.push({ x: p.x, y: p.y, hard: (u + v) / 2 > 0.6, t: performance.now() });
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
    rt = setTimeout(function () { resize(); auto.init = false; if (PRM) draw(0, 1, 0, 0); }, 150);
  });
  var mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function () { colors(); if (PRM) draw(0, 1, 0, 0); });
  }

  /* idle region tour: light each zone label in turn (benchmark-rich ->
     materials discovery -> the hard region). Pure DOM-class work on the
     HTML labels, independent of the canvas auto-survey probe so the two
     never collide; pauses while the visitor is on the map. */
  if (!PRM) {
    var zones = fig.querySelectorAll('.hr-label');
    var zi = -1;
    setInterval(function () {
      if (!visible) return;
      var z;
      if (mouse.on) { for (z = 0; z < zones.length; z++) zones[z].classList.remove('lit'); tourZone = -1; return; }
      zi = (zi + 1) % zones.length;
      tourZone = zi;
      for (z = 0; z < zones.length; z++) zones[z].classList.toggle('lit', z === zi);
    }, 4000);
  }
})();
