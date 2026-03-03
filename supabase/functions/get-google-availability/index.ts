import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { proUserId, timeMin, timeMax } = await req.json();

    if (!proUserId || !timeMin || !timeMax) {
      return new Response(
        JSON.stringify({ busySlots: [], error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: integration, error: dbError } = await supabase
      .from("calendar_integrations")
      .select("*")
      .eq("user_id", proUserId)
      .eq("provider", "google")
      .eq("is_active", true)
      .maybeSingle();

    if (dbError || !integration) {
      return new Response(
        JSON.stringify({ busySlots: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = integration.access_token_encrypted;
    const refreshToken = integration.refresh_token_encrypted;

    const isExpired =
      integration.token_expires_at &&
      new Date(integration.token_expires_at) <= new Date();

    if (isExpired && refreshToken) {
      const refreshed = await refreshGoogleToken(
        refreshToken,
        googleClientId,
        googleClientSecret
      );

      if (refreshed) {
        accessToken = refreshed.access_token;
        const newExpiry = new Date(
          Date.now() + refreshed.expires_in * 1000
        ).toISOString();

        await supabase
          .from("calendar_integrations")
          .update({
            access_token_encrypted: refreshed.access_token,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);
      } else {
        await supabase
          .from("calendar_integrations")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", integration.id);

        return new Response(
          JSON.stringify({ busySlots: [], error: "token_expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ busySlots: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const freeBusyResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          timeZone: "Europe/Paris",
          items: [{ id: "primary" }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      const errText = await freeBusyResponse.text();
      console.error("Google FreeBusy API error:", errText);

      if (freeBusyResponse.status === 401 && refreshToken) {
        const refreshed = await refreshGoogleToken(
          refreshToken,
          googleClientId,
          googleClientSecret
        );

        if (refreshed) {
          await supabase
            .from("calendar_integrations")
            .update({
              access_token_encrypted: refreshed.access_token,
              token_expires_at: new Date(
                Date.now() + refreshed.expires_in * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", integration.id);

          const retryResponse = await fetch(
            "https://www.googleapis.com/calendar/v3/freeBusy",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${refreshed.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                timeMin,
                timeMax,
                timeZone: "Europe/Paris",
                items: [{ id: "primary" }],
              }),
            }
          );

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const busySlots = (
              retryData.calendars?.primary?.busy || []
            ).map((slot: { start: string; end: string }) => ({
              start_at: slot.start,
              end_at: slot.end,
              type: "google",
            }));

            await supabase
              .from("calendar_integrations")
              .update({
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", integration.id);

            return new Response(
              JSON.stringify({ busySlots }),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ busySlots: [], error: "google_api_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const freeBusyData = await freeBusyResponse.json();
    const busySlots = (
      freeBusyData.calendars?.primary?.busy || []
    ).map((slot: { start: string; end: string }) => ({
      start_at: slot.start,
      end_at: slot.end,
      type: "google",
    }));

    await supabase
      .from("calendar_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({ busySlots }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-google-availability error:", err);
    return new Response(
      JSON.stringify({ busySlots: [], error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
