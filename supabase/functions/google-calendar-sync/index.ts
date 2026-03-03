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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: integration } = await supabase
      .from("calendar_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .maybeSingle();

    if (!integration) {
      return new Response(
        JSON.stringify({ events: [], message: "No Google Calendar connected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = integration.access_token_encrypted;
    const refreshToken = integration.refresh_token_encrypted;

    const isExpired =
      integration.token_expires_at &&
      new Date(integration.token_expires_at) <= new Date();

    if (isExpired && refreshToken) {
      const refreshed = await refreshGoogleToken(refreshToken, googleClientId, googleClientSecret);
      if (refreshed) {
        accessToken = refreshed.access_token;
        await supabase
          .from("calendar_integrations")
          .update({
            access_token_encrypted: refreshed.access_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);
      } else {
        return new Response(
          JSON.stringify({ events: [], error: "token_refresh_failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const now = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: threeMonths.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const calResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calResponse.ok) {
      console.error("Google Calendar API error:", await calResponse.text());
      return new Response(
        JSON.stringify({ events: [], error: "google_api_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calData = await calResponse.json();

    const events = (calData.items || [])
      .filter((item: any) => item.start?.dateTime && item.end?.dateTime)
      .map((item: any) => ({
        start_at: item.start.dateTime,
        end_at: item.end.dateTime,
        type: "google",
        title: item.summary || "Google Calendar",
      }));

    await supabase
      .from("calendar_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({ events, count: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("google-calendar-sync error:", err);
    return new Response(
      JSON.stringify({ events: [], error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
