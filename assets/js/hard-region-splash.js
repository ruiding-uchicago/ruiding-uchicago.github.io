/* hard-region-splash.js — the map's fullscreen mode. On first entry per
   session it auto-takes the whole viewport (splash); the avatar button or Esc
   drops the visitor into the page. Afterwards the map's corner button toggles
   back into fullscreen at any time. No-JS / capture pages / any failure →
   the map simply sits in its normal slot. */
(function () {
  'use strict';
  var splash = document.getElementById('hr-splash');
  var fig = document.getElementById('hard-region');
  var btn = document.getElementById('hr-splash-enter');
  var full = document.getElementById('hr-fullscreen');
  if (!splash || !fig || !btn) return;
  if (window.__HR_NO_PROBE || window.__HR_DIM) return;   /* GIF/export pages */

  var parent = fig.parentNode, next = fig.nextSibling, open = false, sy = 0;

  function lock(on) {
    document.documentElement.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  }
  function show() {
    if (open) return;
    open = true;
    sy = window.pageYOffset || 0;
    document.documentElement.classList.add('hr-splashing');   /* sidebar + mascot wait outside */
    document.body.appendChild(splash);       /* out of the article: no ancestor transform/animation
                                                may turn our fixed inset into an article-sized box */
    splash.insertBefore(fig, splash.firstChild);
    splash.hidden = false;
    lock(true);
    window.dispatchEvent(new Event('resize'));   /* both canvases re-fit */
    try { btn.focus({ preventScroll: true }); } catch (e) {}
  }
  function dismiss() {
    if (!open) return;
    open = false;
    try { sessionStorage.setItem('hr-splash-seen', '1'); } catch (e) {}
    document.documentElement.classList.remove('hr-splashing');   /* sidebar + mascot return */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {   /* PRM: simple fade */
      splash.classList.add('out');
      setTimeout(function () {
        parent.insertBefore(fig, next);      /* map back to its slot in the flow */
        splash.hidden = true;
        splash.classList.remove('out');
        lock(false);
        window.dispatchEvent(new Event('resize'));
        window.scrollTo(0, sy);
        if (full) try { full.focus({ preventScroll: true }); } catch (e) {}
      }, 380);
      return;
    }
    /* FLIP morph: the map visibly docks into its page slot. Transform-only —
       top/left/width/height would thrash the 3D module's ResizeObserver. */
    lock(false);
    parent.insertBefore(fig, next);          /* Last: back in flow… */
    window.scrollTo(0, sy);
    var r = fig.getBoundingClientRect();     /* …measured in the restored viewport */
    fig.classList.add('hr-morph');           /* First: fixed fullscreen again */
    splash.hidden = true;                    /* page chrome already visible behind */
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      fig.removeEventListener('transitionend', onEnd);
      fig.classList.remove('hr-morph');
      fig.style.transform = fig.style.borderRadius = '';
      window.dispatchEvent(new Event('resize'));   /* ONE re-fit for both canvases */
      if (full) try { full.focus({ preventScroll: true }); } catch (e) {}
    }
    function onEnd(e) { if (e.target === fig && e.propertyName === 'transform') finish(); }
    fig.addEventListener('transitionend', onEnd);
    requestAnimationFrame(function () { requestAnimationFrame(function () {   /* Invert → Play */
      fig.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px) scale(' +
        (r.width / innerWidth) + ',' + (r.height / innerHeight) + ')';
      fig.style.borderRadius = '0.75rem';    /* $radius-lg */
      setTimeout(finish, 600);               /* transitionend fallback */
    }); });
  }

  btn.addEventListener('click', dismiss);
  addEventListener('keydown', function (e) { if (open && e.key === 'Escape') dismiss(); });

  /* wheel leaves the splash. Accumulated (trackpads emit tiny deltas):
     not engaged → any decisive scroll, either direction, enters the site;
     wheel-zoom engaged → zooming keeps the wheel, but a sustained downward
     roll past the dolly clamp pushes through into the page. */
  var acc = 0, accT = 0;
  splash.addEventListener('wheel', function (e) {
    if (!open) return;
    var t = Date.now();
    if (t - accT > 500) acc = 0;
    accT = t;
    var d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (fig.classList.contains('hr3d-engaged')) {
      acc = d > 0 ? acc + d : 0;          /* only sustained down-rolls count */
      if (acc > 520) dismiss();
    } else {
      acc += Math.abs(d);
      if (acc > 50) dismiss();
    }
  }, { passive: true });
  var ty0 = -1;
  splash.addEventListener('touchstart', function (e) { ty0 = e.touches[0].clientY; }, { passive: true });
  splash.addEventListener('touchmove', function (e) {
    if (open && ty0 >= 0 && ty0 - e.touches[0].clientY >= 40) { ty0 = -1; dismiss(); }
  }, { passive: true });
  if (full) {
    full.hidden = false;
    /* keep the 2D map's own fig-level pointerdown sampler out of this click */
    full.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    full.addEventListener('click', function (e) { e.stopPropagation(); show(); });
  }

  var seen = false;
  try { seen = !!sessionStorage.getItem('hr-splash-seen'); } catch (e) { seen = true; }
  if (!seen) show();
})();
