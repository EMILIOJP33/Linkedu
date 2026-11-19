import Stripe from "npm:stripe@17";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY function secret is required.");
if (!stripeSecretKey.startsWith("sk_test_") && !stripeSecretKey.startsWith("sk_live_")) {
  throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
}
if (stripeSecretKey.startsWith("sk_live_") && Deno.env.get("ENABLE_LIVE_PAYMENTS") !== "true") {
  throw new Error("Live payments are disabled. Set ENABLE_LIVE_PAYMENTS=true only after production checks.");
}

export const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
});
