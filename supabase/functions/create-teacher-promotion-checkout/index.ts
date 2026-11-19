import { admin, appUrl, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

const PROMOTION_AMOUNT_CENTS = 2499;

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  let promotionId: string | null = null;
  let checkoutSessionId: string | null = null;
  try {
    const user = await requireUser(request);
    const { data: profile, error: profileError } = await admin.from("profiles")
      .select("id, role, full_name, subject, is_public")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.role !== "docente" || !profile.full_name || !profile.subject || !profile.is_public) {
      return json(request, { error: "Completa un perfil público de docente antes de promocionarlo." }, 403);
    }

    const { data: existingPromotion, error: existingError } = await admin.from("teacher_promotions")
      .select("id")
      .eq("teacher_id", user.id)
      .eq("status", "pending_payment")
      .gt("created_at", new Date(Date.now() - 30 * 60_000).toISOString())
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingPromotion) {
      return json(request, { error: "Ya tienes un pago de promoción pendiente. Espera a que caduque antes de intentarlo de nuevo." }, 409);
    }

    const { data: promotion, error: promotionError } = await admin.from("teacher_promotions")
      .insert({ teacher_id: user.id, amount_cents: PROMOTION_AMOUNT_CENTS })
      .select("id")
      .single();
    if (promotionError) throw promotionError;
    promotionId = promotion.id;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PROMOTION_AMOUNT_CENTS,
          product_data: {
            name: "LinkedU · Docente destacado",
            description: "15 días hábiles entre los primeros resultados de docentes para ti. Pago único, sin renovación.",
          },
        },
      }],
      metadata: { promotion_id: promotionId, teacher_id: user.id },
      success_url: `${appUrl()}/?promotion=success&promotion_id=${promotionId}`,
      cancel_url: `${appUrl()}/?promotion=cancelled`,
    });
    checkoutSessionId = checkout.id;
    const { error: updateError } = await admin.from("teacher_promotions")
      .update({ stripe_checkout_session_id: checkout.id })
      .eq("id", promotionId)
      .eq("teacher_id", user.id)
      .eq("status", "pending_payment");
    if (updateError) throw updateError;

    const checkoutUrl = new URL(checkout.url!);
    if (checkoutUrl.protocol !== "https:" || !(checkoutUrl.hostname === "stripe.com" || checkoutUrl.hostname.endsWith(".stripe.com"))) {
      throw new Error("Stripe returned an invalid checkout URL.");
    }
    return json(request, { url: checkoutUrl.href });
  } catch (error) {
    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
      } catch (expireError) {
        console.error("Could not expire checkout after promotion setup failed.", expireError);
      }
    }
    if (promotionId) {
      const { error: cleanupError } = await admin.from("teacher_promotions")
        .update({ status: "cancelled" })
        .eq("id", promotionId)
        .eq("status", "pending_payment");
      if (cleanupError) console.error("Could not cancel pending teacher promotion.", cleanupError);
    }
    return json(request, { error: errorMessage(error) }, 400);
  }
});
