/* Cloudflare Worker — assistant proxy for ruiding-uchicago.github.io
 *
 * It hides the OpenAI key (stored as a Worker secret, never in this file or
 * the website), injects the knowledge base, enforces guardrails, and bounds
 * cost. The browser talks only to this Worker, never to OpenAI directly.
 *
 * Deploy: see worker/README.md. The only secret you set is OPENAI_API_KEY.
 */

// ----- config you can edit -----
const MODEL = "gpt-4o-mini";          // change to your preferred model; verify the exact id at
                                      // platform.openai.com/docs/models (e.g. a newer GPT).
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
    "You are the assistant on Rui Ding's academic website.",
    "Answer ONLY questions about Rui Ding — his research, background, publications, funding, and how to contact him — using the facts in the KNOWLEDGE BASE below.",
    "Rules:",
    "- Use only facts from the knowledge base. Never invent papers, numbers, venues, awards, dates, or affiliations.",
    "- If a question is outside Rui's research/career/contact, or the answer is not in the knowledge base, say you don't have that information and suggest emailing ruiding@uchicago.edu.",
    "- Be brief and concrete: 2-4 sentences. Point to a page when useful (/research-interests/, /publications/, /funding/, /education/, /blog/, /Rui_2026_CV.pdf).",
    "- You are a helpful assistant, not Rui himself; refer to him in the third person.",
    "- Reply in the same language the visitor used.",
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
      return new Response(JSON.stringify({ error: "Assistant not configured." }),
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
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.3
        })
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Upstream error." }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } });
    }

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Model error (" + resp.status + ")." }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : "";

    return new Response(JSON.stringify({ answer: answer }), {
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
