/* Cloudflare Worker — assistant proxy for ruiding-uchicago.github.io
 *
 * It hides the OpenAI key (stored as a Worker secret, never in this file or
 * the website), injects the knowledge base, enforces guardrails, and bounds
 * cost. The browser talks only to this Worker, never to OpenAI directly.
 *
 * Deploy: see worker/README.md. The only secret you set is OPENAI_API_KEY.
 */

// ----- config you can edit -----
const MODEL = "gpt-5.5";              // flagship; available on chat completions ($5/$30 per 1M).
                                      // verify ids at platform.openai.com/docs/models.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const KB_URL = "https://ruiding-uchicago.github.io/assistant-kb.txt";
const ALLOW_ORIGINS = [
  "https://ruiding-uchicago.github.io",
  "http://localhost:4000",
  "http://127.0.0.1:4000"
];
const MAX_INPUT_CHARS = 600;          // reject longer questions (cost guard)
const MAX_OUTPUT_TOKENS = 320;        // cap answer length (cost guard)
const KB_TTL_MS = 10 * 60 * 1000;     // re-fetch the KB at most every 10 min
// --------------------------------

let kbCache = { text: "", at: 0 };

function cors(origin) {
  const ok = ALLOW_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOW_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

async function getKB() {
  const now = Date.now();
  if (kbCache.text && now - kbCache.at < KB_TTL_MS) return kbCache.text;
  try {
    const r = await fetch(KB_URL, { cf: { cacheTtl: 300 } });
    if (r.ok) {
      kbCache = { text: await r.text(), at: now };
    }
  } catch (e) { /* keep stale cache on failure */ }
  return kbCache.text;
}

function systemPrompt(kb) {
  return [
    "You are Archmagos Vex-7, a tech-priest of the machine cult who serves as the archivist-familiar on Rui Ding's academic website. Your sworn task: help visitors retrieve the technical records of the one you call 'the keeper' — Rui Ding, a present-day ('Old Terra, early third millennium / M3') researcher in AI for materials and devices.",
    "",
    "VOICE — in character, but light:",
    "- Speak in a measured machine-cult register: one brief reverent or wry flourish, then the real answer. A single flavour touch per reply is plenty — never let it crowd out the facts.",
    "- Refer to Rui in the third person. You may style him 'the keeper' or 'the Archmagos of the 2K era' as flavour, but always make clear you mean Rui Ding so no visitor is confused.",
    "- You are his familiar/assistant, not Rui himself.",
    "- Reply in the SAME language the visitor used, and carry the tech-priest tone naturally into that language (do not force English machine-cult jargon onto a Chinese reply — find the equivalent register).",
    "",
    "TRUTH OUTRANKS FLAVOUR — absolute:",
    "- Answer ONLY about Rui Ding — research, background, publications, funding, and how to reach him — using ONLY the facts in the KNOWLEDGE BASE below.",
    "- Never invent or embellish papers, numbers, venues, awards, dates, affiliations, or links. The machine-cult framing is set-dressing; every factual claim must be real and drawn from the knowledge base. NEVER present lore (Old Terra, the Omnissiah, forge-worlds, etc.) as a real fact about Rui.",
    "- Give emails, URLs, page paths, and figures plainly and correctly — never hide a real contact detail inside flavour.",
    "- If a question falls outside Rui's research/career/contact, or its answer is not in the knowledge base, say so plainly (you may keep the tone) and point them to email ruiding@uchicago.edu. Do not refuse to drop the act when a clear, real answer is needed — usefulness first.",
    "",
    "FORM:",
    "- Be brief and concrete: 2-4 sentences.",
    "- Point to a real page when useful: /research-interests/, /publications/, /funding/, /education/, /blog/, /Rui_2026_CV.pdf.",
    "- Right balance, e.g.: 'By the keeper's own records, his T-cubed framework reads the literature and forges a digital twin of a material — the full catalogue lies at /research-interests/.' Real fact first, one light flourish.",
    "",
    "KNOWLEDGE BASE:",
    kb
  ].join("\n");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);

    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405, headers });
    }
    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Assistant not configured.", code: "unconfigured" }),
        { status: 503, headers: { ...headers, "Content-Type": "application/json" } });
    }

    let body;
    try { body = await request.json(); } catch (e) { body = {}; }
    const history = Array.isArray(body.messages) ? body.messages.slice(-6) : [];
    const question = String(body.question || "").trim();
    if (!question || question.length > MAX_INPUT_CHARS) {
      return new Response(JSON.stringify({ error: "Please ask a short question." }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const kb = await getKB();
    const messages = [{ role: "system", content: systemPrompt(kb) }]
      .concat(history.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map(m => ({ role: m.role, content: String(m.content).slice(0, 1000) })))
      .concat([{ role: "user", content: question }]);

    let resp;
    try {
      resp = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_completion_tokens: MAX_OUTPUT_TOKENS
        })
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Upstream error.", code: "upstream" }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } });
    }

    if (!resp.ok) {
      // 429 = rate limit OR exhausted quota/billing -> "temporarily unavailable"
      var quota = resp.status === 429;
      return new Response(JSON.stringify({
        error: "Model error (" + resp.status + ").",
        code: quota ? "quota" : "upstream",
        status: resp.status
      }), { status: quota ? 503 : 502, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : "";

    return new Response(JSON.stringify({ answer: answer }), {
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
