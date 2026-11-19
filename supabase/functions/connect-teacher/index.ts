import { admin, appUrl, errorMessage, handleOptions, json, requireUser } from "../_shared/http.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  try {
    const user = await requireUser(request);
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.role !== "docente") {
      return json(request, { error: "Solo los perfiles docentes pueden configurar cobros." }, 403);
    }

    const { data: existing, error: accountError } = await admin
      .from("teacher_payout_accounts")
      .select("stripe_account_id")
      .eq("teacher_id", user.id)
      .maybeSingle();
    if (accountError) throw accountError;

    let accountId = existing?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        email: user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
        metadata: { linkedu_user_id: user.id },
      }, { idempotencyKey: `linkedu-account-${user.id}` });
      accountId = account.id;
      const { error: insertError } = await admin.from("teacher_payout_accounts").insert({
        teacher_id: user.id,
        stripe_account_id: accountId,
      });
      if (insertError) throw insertError;
    }

    const baseUrl = appUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/?payout_setup=refresh`,
      return_url: `${baseUrl}/?payout_setup=complete`,
      type: "account_onboarding",
    });
    return json(request, { url: link.url });
  } catch (error) {
    return json(request, { error: errorMessage(error) }, 400);
  }
});
