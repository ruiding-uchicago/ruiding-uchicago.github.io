/* hard-region-3d-boot.js — synchronous capability gates + lazy import of the
   WebGL2 hololith terrain. Any gate failing, or any import/init error, is a
   silent no-op: the 2D map (hard-region.js) never stops being the default. */
(function () {
  'use strict';
  var fig = document.getElementById('hard-region');
  if (!fig) return;
  if (window.__HR_NO_PROBE || window.__HR_DIM) return;   /* GIF/export pages stay 2D */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(pointer: coarse)').matches) return;
  if (innerWidth < 720) return;
  if (navigator.deviceMemory < 4) return;                /* absent → undefined<4 is false → pass */
  if (navigator.hardwareConcurrency < 4) return;
  if (navigator.connection && navigator.connection.saveData === true) return;
  if (!('IntersectionObserver' in window)) return;
  try {
    var probe = document.createElement('canvas').getContext('webgl2');
    if (!probe) return;
    var lose = probe.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();                        /* release the probe context */
  } catch (e) { return; }

  /* same-session re-entry: the module skips the long entrance ceremony */
  try { if (sessionStorage.getItem('hr3d-played')) window.__HR3D_FAST = true; } catch (e) {}

  /* import well before the figure scrolls into view */
  var io = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    io.disconnect();
    import('/assets/js/hard-region-3d.js')
      .then(function (m) { m.init(fig); })
      .catch(function () { /* 2D stays */ });
  }, { rootMargin: '600px' });
  io.observe(fig);
})();
