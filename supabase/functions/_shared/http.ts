import { createClient, type User } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase function secrets are not configured.");
}

export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function corsHeaders(request: Request) {
  const configuredOrigin = Deno.env.get("APP_URL");
  const allowedOrigin = configuredOrigin ? new URL(configuredOrigin).origin : "http://localhost:5173";
  const origin = request.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Cache-Control": "no-store", "Content-Type": "application/json" },
  });
}

export function handleOptions(request: Request) {
  return request.method === "OPTIONS"
    ? new Response("ok", { headers: corsHeaders(request) })
    : null;
}

export async function requireUser(request: Request): Promise<User> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }
  const userClient = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Your session is invalid or expired.");
  return user;
}

export function appUrl() {
  const value = Deno.env.get("APP_URL");
  if (!value) throw new Error("APP_URL function secret is required.");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("APP_URL must use HTTPS outside local development.");
  }
  return parsed.origin;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
