import Link from "next/link";

export default function Landing() {
  return (
    <main className="container">
      <header style={{ marginBottom: 40 }}>
        <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 600 }}>v0.1.0 · MIT</span>
        <h1 style={{ fontSize: 42, margin: "12px 0 8px", letterSpacing: "-0.02em" }}>
          next-ai-armor
        </h1>
        <p style={{ fontSize: 18, color: "#bbb", margin: 0 }}>
          Next.js 16 + Claude API SaaS starter. Ship faster because the hard parts are done.
        </p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2>What&apos;s included</h2>
        <ul>
          <li><strong>Claude SSE streaming that actually resumes</strong> — <code>/api/chat</code> handles reconnects, backpressure, and clean cancellation.</li>
          <li><strong>Supabase multi-tenant RLS</strong> — server &amp; browser clients with cookie-bound sessions; service-role for webhooks only.</li>
          <li><strong>Stripe subscriptions</strong> — <code>/api/webhook/stripe</code> with signature verification wired to a Supabase update.</li>
          <li><strong>In-memory rate limiter</strong> — swap for Upstash Redis when you outgrow one instance.</li>
          <li><strong>vercel-armor built-in</strong> — every external fetch gets a circuit breaker + retry.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Try the demo</h2>
        <p>Talk to Claude with resumable SSE — refresh the page mid-stream and see what happens.</p>
        <Link className="btn" href="/demo">Open /demo →</Link>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Setup (5 minutes)</h2>
        <pre><code>{`git clone https://github.com/carlosfevernova/next-ai-armor.git my-saas
cd my-saas
npm install
cp .env.example .env.local        # fill in your keys
npm run dev`}</code></pre>
      </section>

      <footer style={{ borderTop: "1px solid #222", paddingTop: 24, marginTop: 48, color: "#666", fontSize: 13 }}>
        MIT · <a href="https://github.com/carlosfevernova/next-ai-armor">github.com/carlosfevernova/next-ai-armor</a>
      </footer>
    </main>
  );
}
