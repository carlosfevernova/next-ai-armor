import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is missing");
    client = new Stripe(key, {
      // Pin the API version for reproducible builds. Update deliberately.
      apiVersion: "2025-02-24.acacia",
    });
  }
  return client;
}

/**
 * Verify a webhook signature and return the parsed event. Throws with a
 * useful message if the signature is bad — let it bubble up to the route
 * handler so Stripe retries.
 */
export function verifyStripeWebhook(payload: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error("stripe_signature_missing");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is missing");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
