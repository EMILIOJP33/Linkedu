import { AccessToken } from "npm:livekit-server-sdk@2";
import { admin, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";

const liveKitUrl = Deno.env.get("LIVEKIT_URL");
const liveKitApiKey = Deno.env.get("LIVEKIT_API_KEY");
const liveKitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
  throw new Error("LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET function secrets are required.");
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  try {
    const user = await requireUser(request);
    const { booking_id: bookingId, room_id: roomId } = await request.json();
    let roomName: string;
    let startsAt: string;
    let durationMinutes: number;
    let authorized = false;

    if (typeof bookingId === "string") {
      const { data: booking, error } = await admin.from("bookings")
        .select("id, student_id, teacher_id, starts_at, ends_at, status")
        .eq("id", bookingId)
        .eq("status", "confirmed")
        .single();
      if (error) throw error;
      authorized = booking.student_id === user.id || booking.teacher_id === user.id;
      roomName = `linkedu-booking-${booking.id}`;
      startsAt = booking.starts_at;
      durationMinutes = Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000);
    } else if (typeof roomId === "string") {
      const { data: membership, error } = await admin.from("study_room_members")
        .select("room_id, status")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .eq("status", "joined")
        .single();
      if (error) throw error;
      const { data: studyRoom, error: roomError } = await admin.from("study_rooms")
        .select("id, starts_at, duration_minutes, status")
        .eq("id", membership.room_id)
        .single();
      if (roomError) throw roomError;
      if (studyRoom.status !== "scheduled") throw new Error("This study room is not active.");
      authorized = true;
      roomName = `linkedu-study-${studyRoom.id}`;
      startsAt = studyRoom.starts_at;
      durationMinutes = studyRoom.duration_minutes;
    } else {
      return json(request, { error: "A booking or study room id is required." }, 400);
    }

    if (!authorized) return json(request, { error: "You are not a participant in this session." }, 403);
    const starts = new Date(startsAt).getTime();
    const ends = starts + durationMinutes * 60_000;
    const now = Date.now();
    if (now < starts - 15 * 60_000 || now > ends + 30 * 60_000) {
      return json(request, { error: "The video room is available from 15 minutes before until 30 minutes after the scheduled session." }, 403);
    }

    const identity = user.id;
    const token = new AccessToken(liveKitApiKey, liveKitApiSecret, {
      identity,
      name: String(user.user_metadata?.full_name ?? user.email ?? "LinkedU user").slice(0, 80),
      ttl: `${Math.min(durationMinutes + 45, 240)}m`,
    });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return json(request, { server_url: liveKitUrl, token: await token.toJwt() });
  } catch (error) {
    return json(request, { error: errorMessage(error) }, 400);
  }
});
