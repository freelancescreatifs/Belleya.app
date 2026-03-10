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

const PLATFORM_MAP: Record<string, string> = {
  instagram: "instagram",
  tiktok: "tiktok",
  facebook: "facebook",
  youtube: "youtube",
  linkedin: "linkedin",
  twitter: "x",
  x: "x",
  threads: "threads",
  pinterest: "pinterest",
};

function mapPlatforms(platforms: string[]): string[] {
  return platforms
    .map((p) => PLATFORM_MAP[p.toLowerCase()])
    .filter(Boolean);
}

function isVideoContent(contentType: string, mediaUrls: string[]): boolean {
  if (["reel", "video", "live"].includes(contentType)) return true;
  if (mediaUrls.length === 1) {
    const url = mediaUrls[0].toLowerCase();
    return (
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm") ||
      url.endsWith(".avi")
    );
  }
  return false;
}

async function publishContent(userId: string, body: Record<string, unknown>) {
  const db = supabaseAdmin();
  const contentId = body.content_id as string;

  if (!contentId) return errorResponse("content_id is required");

  const { data: profile } = await db
    .from("upload_post_profiles")
    .select("up_username, instagram_connected, tiktok_connected")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.up_username) {
    return errorResponse(
      "No Upload&Post profile found. Connect your social accounts first.",
      404,
    );
  }

  const { data: content, error: contentErr } = await db
    .from("content_calendar")
    .select("*")
    .eq("id", contentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (contentErr || !content) {
    return errorResponse("Content not found or access denied", 404);
  }

  let targetPlatforms: string[] = [];
  if (body.platforms && Array.isArray(body.platforms)) {
    targetPlatforms = mapPlatforms(body.platforms as string[]);
  } else if (content.platform) {
    const raw = Array.isArray(content.platform)
      ? content.platform
      : typeof content.platform === "string"
        ? content.platform.split(",").map((s: string) => s.trim())
        : [];
    targetPlatforms = mapPlatforms(raw);
  }

  if (!targetPlatforms.length) {
    return errorResponse("No valid target platforms specified");
  }

  let mediaUrls: string[] = [];
  if (content.media_urls) {
    mediaUrls =
      typeof content.media_urls === "string"
        ? JSON.parse(content.media_urls)
        : content.media_urls;
  } else if (content.image_url) {
    mediaUrls = [content.image_url];
  }

  const caption = content.caption || content.description || content.title || "";
  const isVideo = isVideoContent(content.content_type || "", mediaUrls);
  const isScheduled =
    body.schedule === true &&
    content.publication_date &&
    new Date(`${content.publication_date}T${content.publication_time || "12:00"}:00`) > new Date();

  let uploadResult: Response;

  if (isVideo && mediaUrls.length > 0) {
    const formData = new FormData();
    formData.append("user", profile.up_username);
    targetPlatforms.forEach((p) => formData.append("platform[]", p));
    formData.append("title", caption);
    formData.append("video", mediaUrls[0]);
    formData.append("async_upload", "true");
    if (isScheduled) {
      const schedDate = new Date(
        `${content.publication_date}T${content.publication_time || "12:00"}:00`,
      );
      formData.append("scheduled_date", schedDate.toISOString());
    }

    uploadResult = await fetch(`${UP_BASE}/upload`, {
      method: "POST",
      headers: { Authorization: `Apikey ${Deno.env.get("UPLOAD_POST_API_KEY")}` },
      body: formData,
    });
  } else if (mediaUrls.length > 0) {
    const formData = new FormData();
    formData.append("user", profile.up_username);
    targetPlatforms.forEach((p) => formData.append("platform[]", p));
    formData.append("title", caption);
    mediaUrls.forEach((url) => formData.append("photos[]", url));
    formData.append("async_upload", "true");
    if (isScheduled) {
      const schedDate = new Date(
        `${content.publication_date}T${content.publication_time || "12:00"}:00`,
      );
      formData.append("scheduled_date", schedDate.toISOString());
    }

    uploadResult = await fetch(`${UP_BASE}/upload_photos`, {
      method: "POST",
      headers: { Authorization: `Apikey ${Deno.env.get("UPLOAD_POST_API_KEY")}` },
      body: formData,
    });
  } else {
    uploadResult = await fetch(`${UP_BASE}/upload_text`, {
      method: "POST",
      headers: upHeaders(),
      body: JSON.stringify({
        user: profile.up_username,
        platform: targetPlatforms,
        title: caption,
        async_upload: true,
        ...(isScheduled
          ? {
              scheduled_date: new Date(
                `${content.publication_date}T${content.publication_time || "12:00"}:00`,
              ).toISOString(),
            }
          : {}),
      }),
    });
  }

  if (!uploadResult.ok) {
    const err = await uploadResult.text();
    return errorResponse(`Upload&Post publish error: ${err}`, 502);
  }

  const result = await uploadResult.json();
  const requestId = result.request_id || result.job_id || null;

  await db
    .from("content_calendar")
    .update({
      upload_post_request_id: requestId,
      is_published_status: isScheduled ? "scheduled" : "pending",
      published_platforms: targetPlatforms,
      status: isScheduled ? "scheduled" : "published",
      is_published: !isScheduled,
    })
    .eq("id", contentId);

  return jsonResponse({
    success: true,
    request_id: requestId,
    platforms: targetPlatforms,
    scheduled: !!isScheduled,
  });
}

async function checkPublishStatus(userId: string, body: Record<string, unknown>) {
  const db = supabaseAdmin();
  const contentId = body.content_id as string;

  if (!contentId) return errorResponse("content_id is required");

  const { data: content } = await db
    .from("content_calendar")
    .select("upload_post_request_id, is_published_status")
    .eq("id", contentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!content?.upload_post_request_id) {
    return jsonResponse({ status: content?.is_published_status || "none" });
  }

  const res = await fetch(
    `${UP_BASE}/uploadposts/status?request_id=${content.upload_post_request_id}`,
    { headers: upHeaders() },
  );

  if (!res.ok) {
    return jsonResponse({ status: content.is_published_status || "unknown" });
  }

  const data = await res.json();
  let newStatus = content.is_published_status;

  if (data.status === "completed") {
    newStatus = "success";
  } else if (data.status === "error" || data.status === "failed") {
    newStatus = "error";
  } else if (data.status === "in_progress" || data.status === "pending") {
    newStatus = "pending";
  }

  if (newStatus !== content.is_published_status) {
    await db
      .from("content_calendar")
      .update({ is_published_status: newStatus })
      .eq("id", contentId);
  }

  return jsonResponse({
    status: newStatus,
    details: data.results || null,
  });
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
      case "publish":
        return await publishContent(userId, body);
      case "check-status":
        return await checkPublishStatus(userId, body);
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
