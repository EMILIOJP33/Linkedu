import { admin, appUrl, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  let bookingId: string | null = null;
  let checkoutSessionId: string | null = null;
  try {
    const user = await requireUser(request);
    const { teacher_id: teacherId, starts_at: startsAt } = await request.json();
    if (typeof teacherId !== "string" || typeof startsAt !== "string") {
      return json(request, { error: "Select a teacher and a class time." }, 400);
    }

    const { data: teacher, error: teacherError } = await admin
      .from("profiles")
      .select("id, full_name, hourly_rate")
      .eq("id", teacherId)
      .single();
    if (teacherError) throw teacherError;
    const { data: account, error: accountError } = await admin
      .from("teacher_payout_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("teacher_id", teacherId)
      .single();
    if (accountError) throw accountError;
    if (!account.charges_enabled) {
      return json(request, { error: "Este docente aún no ha terminado la configuración de cobros." }, 409);
    }

    const { data: booking, error: bookingError } = await admin.rpc("reserve_paid_booking", {
      p_student_id: user.id,
      p_teacher_id: teacherId,
      p_starts_at: startsAt,
    }).single();
    if (bookingError) throw bookingError;
    bookingId = booking.booking_id as string;

    const { data: savedBooking, error: savedBookingError } = await admin
      .from("bookings")
      .select("amount_cents, platform_fee_cents, starts_at")
      .eq("id", bookingId)
      .single();
    if (savedBookingError) throw savedBookingError;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: savedBooking.amount_cents,
          product_data: {
            name: `Clase online con ${teacher.full_name}`,
            description: new Date(savedBooking.starts_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }),
          },
        },
      }],
      payment_intent_data: {
        application_fee_amount: savedBooking.platform_fee_cents,
        transfer_data: { destination: account.stripe_account_id },
        metadata: { booking_id: bookingId },
      },
      metadata: { booking_id: bookingId, student_id: user.id },
      success_url: `${appUrl()}/?payment=success&booking_id=${bookingId}`,
      cancel_url: `${appUrl()}/?payment=cancelled`,
    });
    checkoutSessionId = checkout.id;

    const { error: updateError } = await admin.from("bookings")
      .update({ stripe_checkout_session_id: checkout.id, updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("status", "pending_payment");
    if (updateError) throw updateError;
    return json(request, { url: checkout.url });
  } catch (error) {
    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
      } catch (expireError) {
        console.error("Could not expire checkout after a booking setup failure.", expireError);
      }
    }
    if (bookingId) {
      const { error: cleanupError } = await admin.from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .eq("status", "pending_payment");
      if (cleanupError) console.error("Could not release a failed booking reservation.", cleanupError);
    }
    return json(request, { error: errorMessage(error) }, 400);
  }
});
