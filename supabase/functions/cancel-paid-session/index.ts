import { admin, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";
const REFUND_CUTOFF_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  try {
    const user = await requireUser(request);
    const { booking_id: bookingId, room_id: roomId } = await request.json();
    const now = Date.now();

    if (typeof bookingId === "string" && !roomId) {
      const { data: booking, error } = await admin.from("bookings")
        .select("id, student_id, teacher_id, starts_at, status, stripe_payment_intent_id")
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      if (booking.student_id !== user.id && booking.teacher_id !== user.id) {
        return json(request, { error: "You are not a participant in this booking." }, 403);
      }
      if (booking.status !== "confirmed" || !booking.stripe_payment_intent_id) {
        return json(request, { error: "Only paid, confirmed bookings can be cancelled." }, 409);
      }
      if (Date.parse(booking.starts_at) - now < REFUND_CUTOFF_MS) {
        return json(request, { error: "Full refunds are available until 24 hours before the class." }, 409);
      }

      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: { booking_id: booking.id, cancelled_by: user.id },
      }, { idempotencyKey: `linkedu-booking-refund-${booking.id}` });
      const status = refund.status === "succeeded" ? "refunded" : "refund_pending";
      const { error: updateError } = await admin.from("bookings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", booking.id)
        .eq("status", "confirmed");
      if (updateError) throw updateError;
      return json(request, { status, refund_status: refund.status });
    }

    if (typeof roomId === "string" && !bookingId) {
      const { data: member, error: memberError } = await admin.from("study_room_members")
        .select("room_id, user_id, status, stripe_payment_intent_id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();
      if (memberError) throw memberError;
      const { data: room, error: roomError } = await admin.from("study_rooms")
        .select("starts_at, status")
        .eq("id", roomId)
        .single();
      if (roomError) throw roomError;
      if (member.status !== "joined" || !member.stripe_payment_intent_id) {
        return json(request, { error: "Only paid study room places can be cancelled." }, 409);
      }
      if (room.status !== "scheduled" || Date.parse(room.starts_at) - now < REFUND_CUTOFF_MS) {
        return json(request, { error: "Full refunds are available until 24 hours before the study room." }, 409);
      }

      const refund = await stripe.refunds.create({
        payment_intent: member.stripe_payment_intent_id,
        metadata: { study_room_id: roomId, cancelled_by: user.id },
      }, { idempotencyKey: `linkedu-room-refund-${roomId}-${user.id}` });
      const status = refund.status === "succeeded" ? "refunded" : "refund_pending";
      const { error: updateError } = await admin.from("study_room_members")
        .update({ status })
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .eq("status", "joined");
      if (updateError) throw updateError;
      return json(request, { status, refund_status: refund.status });
    }

    return json(request, { error: "Provide exactly one booking_id or room_id." }, 400);
  } catch (error) {
    return json(request, { error: errorMessage(error) }, 400);
  }
});
