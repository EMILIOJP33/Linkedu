import Stripe from "npm:stripe@17";
import { admin } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET function secret is required.");
}
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed.", { status: 405 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature.", error);
    return new Response("Invalid webhook signature.", { status: 400 });
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const { error } = await admin.from("teacher_payout_accounts")
        .update({
          details_submitted: account.details_submitted ?? false,
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", account.id);
      if (error) throw error;
    }

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        const bookingId = session.metadata?.booking_id;
        const roomId = session.metadata?.study_room_id;
        const memberId = session.metadata?.member_id;
        const promotionId = session.metadata?.promotion_id;
        if (bookingId) {
          const { error } = await admin.from("bookings")
            .update({
              status: "confirmed",
              stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .eq("stripe_checkout_session_id", session.id)
            .eq("status", "pending_payment");
          if (error) throw error;
        } else if (roomId && memberId) {
          const { error } = await admin.from("study_room_members")
            .update({
              status: "joined",
              joined_at: new Date().toISOString(),
              stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
            })
            .eq("room_id", roomId)
            .eq("user_id", memberId)
            .eq("stripe_checkout_session_id", session.id)
            .eq("status", "pending_payment");
          if (error) throw error;
        } else if (promotionId) {
          const { error } = await admin.rpc("activate_teacher_promotion", {
            p_promotion_id: promotionId,
            p_checkout_session_id: session.id,
            p_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          });
          if (error) throw error;
        }
      }
    }

    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      const roomId = session.metadata?.study_room_id;
      const memberId = session.metadata?.member_id;
      const promotionId = session.metadata?.promotion_id;
      if (bookingId) {
        const { error } = await admin.from("bookings")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", bookingId)
          .eq("stripe_checkout_session_id", session.id)
          .eq("status", "pending_payment");
        if (error) throw error;
      } else if (roomId && memberId) {
        const { error } = await admin.from("study_room_members")
          .update({ status: "cancelled" })
          .eq("room_id", roomId)
          .eq("user_id", memberId)
          .eq("stripe_checkout_session_id", session.id)
          .eq("status", "pending_payment");
        if (error) throw error;
      } else if (promotionId) {
        const { error } = await admin.from("teacher_promotions")
          .update({ status: "cancelled" })
          .eq("id", promotionId)
          .eq("stripe_checkout_session_id", session.id)
          .eq("status", "pending_payment");
        if (error) throw error;
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (paymentIntentId) {
        const status = charge.amount_refunded >= charge.amount ? "refunded" : "refund_pending";
        const { error: bookingError } = await admin.from("bookings")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", paymentIntentId);
        if (bookingError) throw bookingError;
        const { error: memberError } = await admin.from("study_room_members")
          .update({ status })
          .eq("stripe_payment_intent_id", paymentIntentId);
        if (memberError) throw memberError;
      }
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed.`, error);
    return new Response("Webhook processing failed.", { status: 500 });
  }
});
