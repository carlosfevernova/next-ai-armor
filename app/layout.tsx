import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "next-ai-armor — Next.js 16 + Claude SaaS starter",
  description:
    "Next.js 16 boilerplate with Claude SSE streaming (resumable), Supabase multi-tenant RLS, Stripe subscriptions, Better Auth passkeys. The hard parts are solved.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
