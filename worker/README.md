# Website assistant — deploy guide (≈10 minutes, one time)

The website talks to a tiny Cloudflare Worker. The Worker holds your OpenAI
key (as a secret) and forwards questions to OpenAI. **The key never lives in
this repo or in the website.** You do this part; everything else is already built.

## What you need
- A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- A **fresh** OpenAI API key (revoke any key you have pasted anywhere before):
  https://platform.openai.com/api-keys
- Node.js installed (you already have it).

## Step 1 — set a spending cap on OpenAI (do this first)
platform.openai.com → Settings → **Limits** → set a low monthly hard cap
(e.g. $5). This is your real safety net against surprises.

## Step 2 — deploy the Worker
From this `worker/` folder, in a terminal:

```
cd worker
npx wrangler login          # opens the browser, approve once
npx wrangler deploy         # uploads worker.js, prints your Worker URL
```

The printed URL looks like `https://rui-assistant.<your-subdomain>.workers.dev`.
Copy it.

## Step 3 — add your OpenAI key as a secret
```
npx wrangler secret put OPENAI_API_KEY
```
It will prompt `Enter a secret value:` — **paste your fresh OpenAI key and press
Enter**. That is the one and only place the key goes. (Dashboard alternative:
Workers & Pages → rui-assistant → Settings → Variables and Secrets → Add →
type `OPENAI_API_KEY`, paste the key, Encrypt, Save.)

## Step 4 — switch the bot on
Open `_config.yml` at the repo root, set:

```
assistant_endpoint: "https://rui-assistant.<your-subdomain>.workers.dev"
```

Commit and push. After the site rebuilds, clicking the pixel pet opens the chat.

## Updating the bot's knowledge later
Edit `assistant-kb.md` at the repo root, commit, push. The Worker re-reads it
within ~10 minutes. No Worker redeploy needed.

## Changing the model later
Edit `MODEL` near the top of `worker.js`, then `npx wrangler deploy` again.
Verify the exact model id at https://platform.openai.com/docs/models.
(Note: some newer models use the `/v1/responses` endpoint instead of
`/v1/chat/completions` — if you switch to one of those, update `OPENAI_URL`
and the request body accordingly.)

## Notes
- Allowed origins are pinned in `worker.js` (ALLOW_ORIGINS) so only your site
  can call it from a browser.
- Cost guards: input capped at 600 chars, output at 320 tokens, last 6 turns
  only. For per-visitor rate limiting, add a Cloudflare KV namespace and a
  counter — ask and it can be wired in.
