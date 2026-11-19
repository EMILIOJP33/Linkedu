import { admin, appUrl, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  let checkoutSessionId: string | null = null;
  let roomIdForCleanup: string | null = null;
  let userIdForCleanup: string | null = null;
  try {
    const user = await requireUser(request);
    userIdForCleanup = user.id;
    const { room_id: roomId } = await request.json();
    if (typeof roomId !== "string") return json(request, { error: "Study room id is required." }, 400);
    roomIdForCleanup = roomId;
    const { data: room, error: roomError } = await admin.rpc("reserve_study_room_seat", {
      p_room_id: roomId,
      p_user_id: user.id,
    }).single();
    if (roomError) throw roomError;
    const duration = Number(room.room_duration_minutes);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: 200 * duration / 60,
          product_data: {
            name: `Sala de estudio: ${room.room_title}`,
            description: `${duration / 60} h · 2 € por participante y hora`,
          },
        },
      }],
      metadata: { study_room_id: roomId, member_id: user.id },
      success_url: `${appUrl()}/?room_payment=success&room_id=${roomId}`,
      cancel_url: `${appUrl()}/?room_payment=cancelled`,
    });
    checkoutSessionId = checkout.id;

    const { error: memberError } = await admin.from("study_room_members")
      .update({ stripe_checkout_session_id: checkout.id })
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .eq("status", "pending_payment");
    if (memberError) throw memberError;
    return json(request, { url: checkout.url, room_id: roomId });
  } catch (error) {
    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
      } catch (expireError) {
        console.error("Could not expire checkout after a study room seat setup failure.", expireError);
      }
    }
    if (roomIdForCleanup && userIdForCleanup) {
      const { error: cleanupError } = await admin.from("study_room_members")
        .update({ status: "cancelled" })
        .eq("room_id", roomIdForCleanup)
        .eq("user_id", userIdForCleanup)
        .eq("status", "pending_payment");
      if (cleanupError) console.error("Could not release a failed study room seat.", cleanupError);
    }
    return json(request, { error: errorMessage(error) }, 400);
  }
});
