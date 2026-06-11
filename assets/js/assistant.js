/* assistant.js — chat panel for the website bot.
   Talks ONLY to Rui's own Worker endpoint (set in _config.yml -> rendered
   into <meta name="assistant-endpoint">). When the endpoint is empty the
   chat stays dormant and the pet just shows a friendly speech bubble. */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="assistant-endpoint"]');
  var ENDPOINT = meta ? (meta.getAttribute('content') || '').trim() : '';
  var panel, logEl, inputEl, sendEl, tailEl, history = [], busy = false, built = false;
  var STORE = 'ask-chat';
  var GREETING = "Vex-7 online. I keep the technical archive of the keeper — Rui Ding. Ask about his research, papers, funding, or how to reach him.";

  /* keep the conversation alive across page navigations within the tab */
  function persist() {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({
        h: history.slice(-24),
        open: !!(panel && panel.classList.contains('open'))
      }));
    } catch (e) {}
  }
  function loadSaved() {
    try { return JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (e) { return null; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* turn URLs and known site paths into clickable links (input already escaped).
     External URLs are linkified FIRST; the internal-path pass then skips any
     path that sits inside an href="..." we just created, so no double-wrap. */
  function linkify(s) {
    s = s.replace(/https?:\/\/[^\s<]+/g, function (u) {
      var clean = u.replace(/[.,;:!?)\]]+$/, ''), tail = u.slice(clean.length);
      return '<a href="' + clean + '" target="_blank" rel="noopener">' + clean + '</a>' + tail;
    });
    s = s.replace(/(href="[^"]*"[^>]*>)?(\/(?:research-interests|publications|education|funding|blog|legacy)\/|\/Rui_2026_CV\.pdf)/g,
      function (m, insideTag, p) {
        if (insideTag) return m;                 // already part of a link — leave it
        return '<a href="' + p + '">' + p + '</a>';
      });
    return s;
  }

  function build() {
    if (built) return;
    built = true;
    panel = document.createElement('div');
    panel.className = 'ask-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', "Ask about Rui Ding's work");
    panel.innerHTML =
      '<div class="ask-head">' +
        '<span class="ask-title">Vox-Cogitator · Vex-7</span>' +
        '<button class="ask-x" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="ask-log"></div>' +
      '<form class="ask-form">' +
        '<input class="ask-input" type="text" autocomplete="off" ' +
          'placeholder="Query the archive · e.g. What is T³?" maxlength="600" aria-label="Your question">' +
        '<button class="ask-send" type="submit">Send</button>' +
      '</form>' +
      '<div class="ask-foot">Familiar-cogitator · may err · ' +
        '<a href="mailto:ruiding@uchicago.edu">email Rui</a> for anything that matters</div>' +
      '<span class="ask-tail"></span>';
    document.body.appendChild(panel);
    logEl = panel.querySelector('.ask-log');
    inputEl = panel.querySelector('.ask-input');
    sendEl = panel.querySelector('.ask-send');
    tailEl = panel.querySelector('.ask-tail');
    panel.querySelector('.ask-x').addEventListener('click', close);
    panel.querySelector('.ask-form').addEventListener('submit', function (e) {
      e.preventDefault();
      ask(inputEl.value);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    addEventListener('resize', function () { if (panel.classList.contains('open')) position(); });
    if (window.visualViewport) {                        // keep the panel above the mobile keyboard
      var vvSync = function () { if (panel.classList.contains('open')) position(); };
      visualViewport.addEventListener('resize', vvSync);
      visualViewport.addEventListener('scroll', vvSync);
    }
    add('bot', GREETING);
    var saved = loadSaved();                          // replay this session's conversation across page loads
    if (saved && saved.h && saved.h.length) {
      history = saved.h.slice();
      history.forEach(function (m) { add(m.role === 'user' ? 'user' : 'bot', m.content); });
    }
  }

  function add(who, text) {
    var row = document.createElement('div');
    row.className = 'ask-msg ask-' + who;
    var html = who === 'bot' ? linkify(esc(text)) : esc(text);
    row.innerHTML = '<span>' + html + '</span>';
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
    if (panel && panel.classList.contains('open')) position();   // re-anchor as the chat grows
    return row;
  }

  function ask(q) {
    q = (q || '').trim();
    if (!q || busy) return;
    if (!ENDPOINT) {
      add('bot', "The assistant isn’t switched on yet. In the meantime, email Rui at ruiding@uchicago.edu.");
      return;
    }
    inputEl.value = '';
    add('user', q);
    history.push({ role: 'user', content: q });
    persist();
    busy = true;
    sendEl.disabled = true;
    var typing = add('bot', '…');
    typing.classList.add('ask-typing');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, messages: history.slice(-6) })
    })
      .then(function (r) {
        return r.json().then(
          function (d) { return { ok: r.ok, status: r.status, d: d }; },
          function () { return { ok: r.ok, status: r.status, d: {} }; }
        );
      })
      .then(function (res) {
        typing.remove();
        if (res.ok && res.d && res.d.answer) {
          add('bot', res.d.answer);
          history.push({ role: 'assistant', content: res.d.answer });
          persist();
          return;
        }
        var code = res.d && res.d.code, msg;
        if (code === 'quota' || res.status === 429 || res.status === 503) {
          msg = "The assistant is temporarily unavailable right now (usage limit reached). Please try again later, or email Rui at ruiding@uchicago.edu.";
        } else if (code === 'unconfigured') {
          msg = "The assistant isn’t switched on yet. Email Rui at ruiding@uchicago.edu.";
        } else {
          msg = "Sorry, something went wrong. Please try again, or email ruiding@uchicago.edu.";
        }
        add('bot', msg);
      })
      .catch(function () {
        typing.remove();
        add('bot', "The assistant is temporarily unavailable. Please try again later, or email Rui at ruiding@uchicago.edu.");
      })
      .then(function () {
        busy = false;
        sendEl.disabled = false;
        inputEl.focus();
      });
  }

  /* anchor the panel near the pet, pinning its BOTTOM and growing UPWARD so
     a long conversation never spills past the bottom edge of the window */
  function position() {
    if (!panel) return;
    var vw = innerWidth, vh = innerHeight, gap = 14, pad = 12;
    panel.style.right = 'auto';
    panel.style.maxHeight = '';                         // reset; the no-pet branch may re-cap it
    var pw = panel.offsetWidth, ph = panel.offsetHeight;
    var pr = (window.__pet && window.__pet.rect) ? window.__pet.rect() : null;
    if (!pr || pr.width === 0) {                       // no pet (mobile / dismissed): bottom-right, above the keyboard
      var vv = window.visualViewport;
      var inset = vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
      panel.style.maxHeight = Math.min(540, (vv ? vv.height : vh) - 24) + 'px';
      panel.style.left = Math.max(pad, vw - pw - pad) + 'px';
      panel.style.top = 'auto';
      panel.style.bottom = (inset + pad) + 'px';
      if (tailEl) tailEl.style.display = 'none';
      return;
    }
    var pcx = pr.left + pr.width / 2, pcy = pr.top + pr.height / 2;
    var toRight = pcx <= vw / 2;                        // pet on left half -> open rightward
    var left = toRight ? pr.right + gap : pr.left - pw - gap;
    left = Math.max(pad, Math.min(vw - pw - pad, left));
    panel.style.left = left + 'px';
    // pin the bottom just below the pet's middle, clamped fully on-screen
    var botY = Math.min(vh - pad, pcy + 70);
    botY = Math.max(ph + pad, botY);
    var topY = botY - ph;
    panel.style.top = 'auto';
    panel.style.bottom = (vh - botY) + 'px';
    if (tailEl) {                                       // tail on the edge facing the pet
      tailEl.style.display = 'block';
      tailEl.className = 'ask-tail ask-tail-' + (toRight ? 'left' : 'right');
      tailEl.style.top = Math.max(16, Math.min(ph - 24, pcy - topY)) + 'px';
    }
  }

  function open() {
    build();
    if (window.__pet && window.__pet.park) window.__pet.park(true);   // freeze pet so the panel stays put
    panel.classList.add('open');
    position();
    persist();
    setTimeout(function () { inputEl.focus(); }, 50);
  }
  function close() {
    if (panel) panel.classList.remove('open');
    if (window.__pet && window.__pet.park) window.__pet.park(false);  // let the pet roam again
    persist();
  }
  function toggle() {
    if (panel && panel.classList.contains('open')) close();
    else open();
  }

  /* the pet (and anything else) opens chat through this */
  window.__askRui = { open: open, toggle: toggle, enabled: !!ENDPOINT };

  // if the chat was open on the previous page, reopen it (with its history)
  (function () {
    var s = loadSaved();
    if (s && s.open && ENDPOINT) addEventListener('load', function () { setTimeout(open, 450); });
  })();
})();
