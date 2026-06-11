/* mobile-ask.js — touch-only launcher for the Ask-Vex-7 chat.
   The desktop pet (magos-pet.js) is skipped on coarse pointers, and the
   pet is the only thing that opens the chat — so phones had no way in.
   This adds a small floating pill with a mini Vex-7 avatar that opens it.
   Desktop is untouched (it keeps the full pet). */
(function () {
  'use strict';
  if (!matchMedia('(pointer: coarse)').matches) return;        // touch only; desktop has the pet
  var meta = document.querySelector('meta[name="assistant-endpoint"]');
  if (!meta || !(meta.getAttribute('content') || '').trim()) return;   // no chat configured -> no button

  /* mini Vex-7 head — 16x14, same palette family as the pet sprite:
     gold finial, red hood, dark brow fold, framed face void, a red main
     optic (E) + cyan lens (q), and a rebreather grille (G/g). */
  var PAL = { '.': null, N: '#0D070A', V: '#19090F', D: '#5A0E12', R: '#8F1616',
    r: '#BA2A22', G: '#20202B', g: '#3D3D4C', Y: '#C8941C', y: '#F2C84B',
    E: '#FF2A00', q: '#39E6C9' };
  var HEAD = [
    "......NyyN......",
    "....NNrRRrNN....",
    "...NrRRRRRRrN...",
    "..NrRRDDDDRRrN..",
    "..NrRRRRRRRRrN..",
    "..NrRNVVVVNRrN..",
    "..NrRNEEqqNRrN..",
    "..NrRNEEqqNRrN..",
    "..NrRNVVVVNRrN..",
    "..NrRNGgGgNRrN..",
    "...NrRNggNRrN...",
    "...NrRRRRRRrN...",
    "....NrRRRRrN....",
    "......NNNN......"
  ];
  var W = 16, H = 14;
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  var x = cv.getContext('2d');
  for (var r = 0; r < H; r++) {
    for (var c = 0; c < W; c++) {
      var col = PAL[HEAD[r].charAt(c)];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(c, r, 1, 1);
    }
  }

  var fab = document.createElement('button');
  fab.className = 'ask-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', "Ask Vex-7 about Rui Ding's work");
  fab.appendChild(cv);
  var lab = document.createElement('span');
  lab.textContent = 'Ask Vex-7';
  fab.appendChild(lab);
  document.body.appendChild(fab);

  // hide the pill whenever the chat panel is open, show it when closed —
  // works for both a tap here and an auto-reopen carried across pages
  function watch(p) {
    var sync = function () { fab.style.display = p.classList.contains('open') ? 'none' : ''; };
    new MutationObserver(sync).observe(p, { attributes: true, attributeFilter: ['class'] });
    sync();
  }
  var existing = document.querySelector('.ask-panel');
  if (existing) watch(existing);
  else {
    var bodyObs = new MutationObserver(function () {
      var p = document.querySelector('.ask-panel');
      if (p) { bodyObs.disconnect(); watch(p); }
    });
    bodyObs.observe(document.body, { childList: true });
  }

  fab.addEventListener('click', function () {
    if (window.__askRui) window.__askRui.toggle();
  });
})();
