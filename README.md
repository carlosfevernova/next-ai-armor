# next-ai-armor

**Next.js 16 + Claude SaaS starter. The hard parts are solved.**

A boilerplate that ships with:

- ✅ **Resumable SSE streaming** from Claude — cancellable, backpressure-aware, error-preserving
- ✅ **Supabase multi-tenant RLS** — cookie-bound server + browser clients, service-role isolated to webhooks
- ✅ **Stripe subscriptions** — signature-verified webhook synced to Supabase
- ✅ **Better Auth ready** (drop-in — see roadmap for the plugin)
- ✅ **In-memory rate limiter** (swap for Upstash later)
- ✅ **`vercel-armor` built in** — every outbound `fetch` is circuit-broken

Zero magic. Every file is legible and short.

## 5-minute setup

```bash
git clone https://github.com/carlosfevernova/next-ai-armor my-saas
cd my-saas
npm install
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY + Supabase + Stripe
npm run dev
```

Then open [http://localhost:3000/demo](http://localhost:3000/demo).

Apply the DB schema:

```bash
# From the Supabase SQL editor, paste supabase-schema.sql
# Or via CLI:
supabase db execute --file supabase-schema.sql
```

Wire the Stripe webhook (production):

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe   # dev
# In production, add https://your-domain/api/webhook/stripe to your Stripe endpoints.
```

## Project layout

```
app/
  page.tsx                     # marketing landing
  demo/page.tsx                # streaming chat client
  api/
    chat/route.ts              # POST — Claude SSE streaming
    webhook/stripe/route.ts    # POST — Stripe → Supabase sync
lib/
  anthropic.ts                 # cached SDK client
  supabase.ts                  # browser + server + service-role clients
  stripe.ts                    # SDK + webhook verifier
  rate-limit.ts                # in-memory sliding window
supabase-schema.sql            # RLS-first schema
.env.example                   # every var you need
```

## Design choices

**Why cookie-bound Supabase clients?** Better Auth (or Supabase Auth) manages the session cookie. The server client reads it and RLS enforces access. You can't accidentally leak data across tenants because the row-level policies fire before your query runs.

**Why service-role for the Stripe webhook?** Because Stripe doesn't have a user session — it's a machine-to-machine call. The service-role client bypasses RLS by design. Isolate this client to one file (`createSupabaseServiceRole`) and audit its callers.

**Why in-memory rate limiting instead of Redis?** For your first 100 users you don't need distributed anything. The `rateLimit(key, limit, windowMs)` API is drop-in compatible with [`@upstash/ratelimit`](https://github.com/upstash/ratelimit-js) — swap when you outgrow the single instance.

**Why SSE and not WebSockets?** SSE works with vanilla `fetch` + `ReadableStream` on the client, and the server side is a plain `Response` object. WebSockets require sticky sessions or a separate service. For LLM streaming, SSE is exactly right.

## Recommended stack additions

- **[Better Auth](https://better-auth.com)** — the auth solution once NextAuth was absorbed. Drop in the `betterAuth()` middleware and point it at Supabase.
- **[Upstash Redis](https://upstash.com)** — swap in when you hit multi-region.
- **[Vercel AI SDK v7](https://sdk.vercel.ai)** — if you want the higher-level `streamText` abstraction. This starter uses the Anthropic SDK directly so you own the SSE wire format.

## Related

- [`vercel-armor`](https://www.npmjs.com/package/vercel-armor) — resilience toolkit (also on npm; already a dep here)
- [`mcp-armor`](https://www.npmjs.com/package/mcp-armor) — MCP proxy with token compression + security scan
- [`skill-kit`](https://www.npmjs.com/package/skill-kit) — CLI for Claude Skills

## Roadmap

- **v0.2** — Better Auth plugin wired in, Playwright E2E, `@upstash/redis` adapter for rate limit
- **v0.3** — Turnstile + email OTP recipes, Sentry preset, Vercel deploy button

## License

MIT — Carlos F. Vernova
