import { NextRequest } from "next/server";
import { verifyStripeWebhook } from "@/lib/stripe";
import { createSupabaseServiceRole } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/stripe — receives Stripe events and syncs subscription
 * state to Supabase. Uses the service-role client because RLS would block a
 * webhook from writing on behalf of any user.
 *
 * Handled events (extend as needed):
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event;
  try {
    event = verifyStripeWebhook(payload, signature);
  } catch (e) {
    return new Response(`webhook_verification_failed: ${(e as Error).message}`, { status: 400 });
  }

  const db = createSupabaseServiceRole();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { customer: string; subscription: string; client_reference_id: string | null };
      if (session.client_reference_id) {
        await db.from("subscriptions").upsert({
          user_id: session.client_reference_id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as { id: string; status: string; current_period_end: number };
      await db.from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      // Ignore anything else — return 200 so Stripe doesn't retry.
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
