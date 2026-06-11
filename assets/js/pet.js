/* pet.js — a tiny pixel lab-bot that lives on the page.
   Chases the cursor, wanders on its own when you stop moving, sleeps when
   ignored. Click: sit / resume. Double-click: hide for this session.
   Pure canvas pixel art, no assets. Skipped on touch devices and PRM. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(pointer: coarse)').matches) return;
  if (sessionStorage.getItem('pet-off')) return;

  var FW = 12, FH = 10, SCALE = 3;
  var PAL = { K: '#26181a', R: '#e5484d', D: '#a83438', C: '#d7c69d', W: '#f6f1ea' };

  var BODY_OPEN = [
    '.....CC.....',
    '......K.....',
    '..KKKKKKKK..',
    '.KRRRRRRRRK.',
    '.KRRRRWWKRK.',
    '.KRRRRWWKRK.',
    '.KRRRRRRRRK.',
    '..KKKKKKKK..'
  ];
  var BODY_BLINK = [
    '.....CC.....',
    '......K.....',
    '..KKKKKKKK..',
    '.KRRRRRRRRK.',
    '.KRRRRDDDRK.',
    '.KRRRRRRRRK.',
    '.KRRRRRRRRK.',
    '..KKKKKKKK..'
  ];
  var LEGS_A = ['..KK....KK..', '.KK......KK.'];
  var LEGS_B = ['...KK..KK...', '...KK..KK...'];

  var pet = document.createElement('div');
  pet.id = 'pixel-pet';
  pet.title = 'lab bot · click: stay/follow · double-click: dismiss';
  var cv = document.createElement('canvas');
  cv.width = FW; cv.height = FH;
  pet.appendChild(cv);
  var zEl = document.createElement('span');
  zEl.className = 'pet-z';
  zEl.textContent = 'z';
  zEl.style.display = 'none';
  pet.appendChild(zEl);
  document.body.appendChild(pet);
  var ctx = cv.getContext('2d');

  function drawFrame(body, legs) {
    ctx.clearRect(0, 0, FW, FH);
    var rows = body.concat(legs);
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < FW; x++) {
        var c = PAL[rows[y][x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  /* ---------- state ---------- */
  var px = 40, py = innerHeight - 80;
  var cur = { x: px, y: py };
  var lastMove = performance.now();
  var wanderT = { x: px, y: py }, nextWander = 0;
  var sitting = false, facing = 1, stepT = 0, stepOn = false;
  var blinkUntil = 0, nextBlink = performance.now() + 2400;
  var lastFrame = 0;

  addEventListener('pointermove', function (e) {
    cur.x = e.clientX; cur.y = e.clientY;
    lastMove = performance.now();
  }, { passive: true });

  pet.addEventListener('click', function () {
    sitting = !sitting;
  });
  pet.addEventListener('dblclick', function () {
    sessionStorage.setItem('pet-off', '1');
    pet.remove();
  });

  function stepToward(tx, ty, speed, now) {
    var dx = tx - px, dy = ty - py;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) return false;
    var s = Math.min(speed, d);
    px += dx / d * s;
    py += dy / d * s;
    if (Math.abs(dx) > 2) facing = dx > 0 ? 1 : -1;
    if (now - stepT > 140) { stepOn = !stepOn; stepT = now; }
    return true;
  }

  function clampToViewport() {
    var w = FW * SCALE, h = FH * SCALE;
    px = Math.max(4, Math.min(innerWidth - w - 4, px));
    py = Math.max(4, Math.min(innerHeight - h - 4, py));
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (now - lastFrame < 33) return;
    lastFrame = now;
    if (document.hidden) return;

    var idleFor = now - lastMove;
    var walking = false;
    var asleep = false;

    if (sitting) {
      /* parked by a click: stay put, doze lightly */
      asleep = idleFor > 4000;
    } else if (idleFor > 16000) {
      asleep = true;
    } else {
      var tx = cur.x - FW * SCALE / 2;
      var ty = cur.y + 14;       /* settle just under the cursor */
      var dx = tx - px, dy = ty - py;
      var far = dx * dx + dy * dy > 52 * 52;
      if (idleFor < 3000 && far) {
        walking = stepToward(tx, ty, 2.6, now);   /* chase */
      } else if (idleFor >= 5000) {
        /* you stopped — the bot goes exploring on its own */
        if (now > nextWander) {
          wanderT.x = 20 + Math.random() * (innerWidth - 60);
          wanderT.y = 20 + Math.random() * (innerHeight - 60);
          nextWander = now + 4200 + Math.random() * 3800;
        }
        var wdx = wanderT.x - px, wdy = wanderT.y - py;
        if (wdx * wdx + wdy * wdy > 36) walking = stepToward(wanderT.x, wanderT.y, 1.1, now);
      }
    }

    clampToViewport();

    /* blink scheduling */
    if (!asleep && now > nextBlink) {
      blinkUntil = now + 160;
      nextBlink = now + 1800 + Math.random() * 3200;
    }

    var body = asleep || now < blinkUntil ? BODY_BLINK : BODY_OPEN;
    var legs = walking ? (stepOn ? LEGS_A : LEGS_B) : LEGS_B;
    drawFrame(body, legs);

    zEl.style.display = asleep && !sitting ? 'block' : 'none';
    pet.style.transform = 'translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px)';
    cv.style.transform = facing === 1 ? 'none' : 'scaleX(-1)';
  }

  drawFrame(BODY_OPEN, LEGS_B);
  requestAnimationFrame(tick);
})();
