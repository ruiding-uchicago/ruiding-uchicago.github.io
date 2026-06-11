/* assistant.js — chat panel for the website bot.
   Talks ONLY to Rui's own Worker endpoint (set in _config.yml -> rendered
   into <meta name="assistant-endpoint">). When the endpoint is empty the
   chat stays dormant and the pet just shows a friendly speech bubble. */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="assistant-endpoint"]');
  var ENDPOINT = meta ? (meta.getAttribute('content') || '').trim() : '';
  var panel, logEl, inputEl, sendEl, history = [], busy = false, built = false;

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
        '<span class="ask-title">Ask about Rui’s work</span>' +
        '<button class="ask-x" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="ask-log"></div>' +
      '<form class="ask-form">' +
        '<input class="ask-input" type="text" autocomplete="off" ' +
          'placeholder="e.g. What is T³? How to contact?" maxlength="600" aria-label="Your question">' +
        '<button class="ask-send" type="submit">Send</button>' +
      '</form>' +
      '<div class="ask-foot">AI assistant · may be wrong · ' +
        '<a href="mailto:ruiding@uchicago.edu">email Rui</a> for anything that matters</div>';
    document.body.appendChild(panel);
    logEl = panel.querySelector('.ask-log');
    inputEl = panel.querySelector('.ask-input');
    sendEl = panel.querySelector('.ask-send');
    panel.querySelector('.ask-x').addEventListener('click', close);
    panel.querySelector('.ask-form').addEventListener('submit', function (e) {
      e.preventDefault();
      ask(inputEl.value);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    add('bot', "Hi — I can answer questions about Rui’s research, papers, and how to reach him. What would you like to know?");
  }

  function add(who, text) {
    var row = document.createElement('div');
    row.className = 'ask-msg ask-' + who;
    var html = who === 'bot' ? linkify(esc(text)) : esc(text);
    row.innerHTML = '<span>' + html + '</span>';
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
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

  function open() {
    build();
    panel.classList.add('open');
    setTimeout(function () { inputEl.focus(); }, 50);
  }
  function close() { if (panel) panel.classList.remove('open'); }
  function toggle() {
    if (panel && panel.classList.contains('open')) close();
    else open();
  }

  /* the pet (and anything else) opens chat through this */
  window.__askRui = { open: open, toggle: toggle, enabled: !!ENDPOINT };
})();
