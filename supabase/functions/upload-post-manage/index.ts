import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UP_BASE = "https://api.upload-post.com/api";

function upHeaders() {
  return {
    Authorization: `Apikey ${Deno.env.get("UPLOAD_POST_API_KEY")}`,
    "Content-Type": "application/json",
  };
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function handleCreateProfile(userId: string) {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("upload_post_profiles")
    .select("up_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.up_username) {
    return jsonResponse({
      success: true,
      up_username: existing.up_username,
      message: "Profile already exists",
    });
  }

  const username = `belleya_${userId.replace(/-/g, "").slice(0, 16)}`;

  const res = await fetch(`${UP_BASE}/uploadposts/users`, {
    method: "POST",
    headers: upHeaders(),
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (err.includes("already exists")) {
      await db.from("upload_post_profiles").upsert(
        { user_id: userId, up_username: username },
        { onConflict: "user_id" },
      );
      return jsonResponse({ success: true, up_username: username });
    }
    return errorResponse(`Upload&Post error: ${err}`, 502);
  }

  await db.from("upload_post_profiles").upsert(
    { user_id: userId, up_username: username },
    { onConflict: "user_id" },
  );

  return jsonResponse({ success: true, up_username: username });
}

async function handleGetLinkUrl(
  userId: string,
  platforms?: string[],
  redirectUrl?: string,
) {
  const db = supabaseAdmin();

  const { data: profile } = await db
    .from("upload_post_profiles")
    .select("up_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.up_username) {
    return errorResponse("No Upload&Post profile. Create one first.", 404);
  }

  const body: Record<string, unknown> = {
    username: profile.up_username,
  };
  if (platforms?.length) body.platforms = platforms;
  if (redirectUrl) body.redirect_url = redirectUrl;

  const res = await fetch(`${UP_BASE}/uploadposts/users/generate-jwt`, {
    method: "POST",
    headers: upHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return errorResponse(`Upload&Post error: ${err}`, 502);
  }

  const data = await res.json();
  return jsonResponse({ success: true, access_url: data.access_url });
}

async function handleCheckStatus(userId: string) {
  const db = supabaseAdmin();

  const { data: profile } = await db
    .from("upload_post_profiles")
    .select("up_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.up_username) {
    return jsonResponse({
      instagram_connected: false,
      tiktok_connected: false,
      has_profile: false,
    });
  }

  const res = await fetch(
    `${UP_BASE}/uploadposts/users/${profile.up_username}`,
    { headers: upHeaders() },
  );

  if (!res.ok) {
    const err = await res.text();
    return errorResponse(`Upload&Post error: ${err}`, 502);
  }

  const data = await res.json();

  const connectedPlatforms: string[] = data.platforms || data.connected_platforms || [];
  const igConnected = connectedPlatforms.some(
    (p: string) => p.toLowerCase() === "instagram",
  );
  const tkConnected = connectedPlatforms.some(
    (p: string) => p.toLowerCase() === "tiktok",
  );

  await db
    .from("upload_post_profiles")
    .update({
      instagram_connected: igConnected,
      tiktok_connected: tkConnected,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return jsonResponse({
    instagram_connected: igConnected,
    tiktok_connected: tkConnected,
    connected_platforms: connectedPlatforms,
    has_profile: true,
  });
}

async function handleDeleteProfile(userId: string) {
  const db = supabaseAdmin();

  const { data: profile } = await db
    .from("upload_post_profiles")
    .select("up_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.up_username) {
    return jsonResponse({ success: true, message: "No profile to delete" });
  }

  const res = await fetch(`${UP_BASE}/uploadposts/users`, {
    method: "DELETE",
    headers: upHeaders(),
    body: JSON.stringify({ username: profile.up_username }),
  });

  if (!res.ok) {
    const err = await res.text();
    return errorResponse(`Upload&Post error: ${err}`, 502);
  }

  await db.from("upload_post_profiles").delete().eq("user_id", userId);

  return jsonResponse({ success: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    switch (action) {
      case "create-profile":
        return await handleCreateProfile(userId);
      case "get-link-url":
        return await handleGetLinkUrl(
          userId,
          body.platforms,
          body.redirect_url,
        );
      case "check-status":
        return await handleCheckStatus(userId);
      case "delete-profile":
        return await handleDeleteProfile(userId);
      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message === "Unauthorized" || message === "Missing Authorization header") {
      return errorResponse(message, 401);
    }
    return errorResponse(message, 500);
  }
});
