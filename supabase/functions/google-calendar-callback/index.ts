import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const redirectUri = Deno.env.get("GOOGLE_CALENDAR_REDIRECT_URI")!;

    const appUrl = supabaseUrl.includes("lldznuayrxzvliehywoc")
      ? "https://belleya.app"
      : "http://localhost:5173";

    if (errorParam) {
      console.error("Google OAuth error:", errorParam);
      return Response.redirect(
        `${appUrl}/settings?google_error=${encodeURIComponent(errorParam)}`,
        302
      );
    }

    if (!code || !stateParam) {
      return Response.redirect(
        `${appUrl}/settings?google_error=missing_params`,
        302
      );
    }

    let userId: string;
    try {
      const decoded = JSON.parse(atob(stateParam));
      userId = decoded.user_id;
    } catch {
      return Response.redirect(
        `${appUrl}/settings?google_error=invalid_state`,
        302
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(
        `${appUrl}/settings?google_error=token_exchange_failed`,
        302
      );
    }

    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profileData = await profileResponse.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("calendar_integrations")
      .upsert(
        {
          user_id: userId,
          provider: "google",
          provider_account_id: profileData.id || profileData.email || "unknown",
          access_token_encrypted: tokenData.access_token,
          refresh_token_encrypted:
            tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          google_email: profileData.email || null,
          is_active: true,
          sync_enabled: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);

      const { error: insertError } = await supabase
        .from("calendar_integrations")
        .update({
          access_token_encrypted: tokenData.access_token,
          refresh_token_encrypted: tokenData.refresh_token || undefined,
          token_expires_at: expiresAt,
          google_email: profileData.email || null,
          is_active: true,
          sync_enabled: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "google");

      if (insertError) {
        const { error: freshInsertError } = await supabase
          .from("calendar_integrations")
          .insert({
            user_id: userId,
            provider: "google",
            provider_account_id:
              profileData.id || profileData.email || "unknown",
            access_token_encrypted: tokenData.access_token,
            refresh_token_encrypted: tokenData.refresh_token || null,
            token_expires_at: expiresAt,
            google_email: profileData.email || null,
            is_active: true,
            sync_enabled: true,
            last_sync_at: new Date().toISOString(),
          });

        if (freshInsertError) {
          console.error("All insert attempts failed:", freshInsertError);
          return Response.redirect(
            `${appUrl}/settings?google_error=save_failed`,
            302
          );
        }
      }
    }

    return Response.redirect(
      `${appUrl}/settings?google_connected=true&tab=integrations`,
      302
    );
  } catch (err) {
    console.error("google-calendar-callback error:", err);
    const appUrl = "https://belleya.app";
    return Response.redirect(
      `${appUrl}/settings?google_error=internal_error`,
      302
    );
  }
});
