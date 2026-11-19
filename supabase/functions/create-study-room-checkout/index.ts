import { admin, appUrl, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  let roomId: string | null = null;
  let checkoutSessionId: string | null = null;
  try {
    const user = await requireUser(request);
    const { title, starts_at: startsAt, duration_minutes: durationMinutes, capacity } = await request.json();
    if (typeof title !== "string" || typeof startsAt !== "string") {
      return json(request, { error: "Provide a study room title and start time." }, 400);
    }
    const duration = Number(durationMinutes);
    const maxParticipants = Number(capacity);
    if (!Number.isInteger(duration) || ![60, 120, 180].includes(duration)
      || !Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 10) {
      return json(request, { error: "Choose a room duration of 1–3 hours and 2–10 participants." }, 400);
    }
    const parsedStartsAt = Date.parse(startsAt);
    if (!Number.isFinite(parsedStartsAt) || parsedStartsAt < Date.now() + 15 * 60_000
      || parsedStartsAt > Date.now() + 90 * 24 * 60 * 60_000) {
      return json(request, { error: "Choose a start time at least 15 minutes from now and within 90 days." }, 400);
    }

    const { data: room, error: roomError } = await admin.from("study_rooms").insert({
      host_id: user.id,
      title: title.trim().slice(0, 100),
      starts_at: startsAt,
      duration_minutes: duration,
      capacity: maxParticipants,
    }).select("id").single();
    if (roomError) throw roomError;
    roomId = room.id;

    const { error: reservationError } = await admin.rpc("reserve_study_room_seat", {
      p_room_id: room.id,
      p_user_id: user.id,
    }).single();
    if (reservationError) throw reservationError;

    const amountCents = 200 * duration / 60;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: `Sala de estudio: ${title.trim()}`,
            description: `${duration / 60} h · 2 € por participante y hora`,
          },
        },
      }],
      metadata: { study_room_id: room.id, member_id: user.id },
      success_url: `${appUrl()}/?room_payment=success&room_id=${room.id}`,
      cancel_url: `${appUrl()}/?room_payment=cancelled`,
    });
    checkoutSessionId = checkout.id;

    const { error: memberError } = await admin.from("study_room_members")
      .update({ stripe_checkout_session_id: checkout.id })
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .eq("status", "pending_payment");
    if (memberError) throw memberError;
    return json(request, { url: checkout.url, room_id: room.id });
  } catch (error) {
    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
      } catch (expireError) {
        console.error("Could not expire checkout after a study room setup failure.", expireError);
      }
    }
    if (roomId) {
      const { error: cleanupError } = await admin.from("study_rooms").update({ status: "cancelled" }).eq("id", roomId);
      if (cleanupError) console.error("Could not cancel a study room after checkout setup failed.", cleanupError);
    }
    return json(request, { error: errorMessage(error) }, 400);
  }
});
