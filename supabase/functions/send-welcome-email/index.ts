// RESEND TEST MODE LIMITATION:
// In Resend test mode, emails can ONLY be delivered to the email address
// that owns the Resend account. Sending to any other address will return
// a 403 or validation error. To send to real clients, either:
//   1. Verify the domain "belaya.app" in Resend and use a production API key
//   2. Or test with the Resend account owner's email as the recipient

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ClientPayload {
  email: string;
  firstName: string;
}

interface WelcomeEmailPayload {
  clients: ClientPayload[];
  providerName: string;
  bookingSlug?: string | null;
}

function buildEmailHtml(firstName: string, providerName: string, bookingSlug?: string | null): string {
  const bookingUrl = bookingSlug
    ? `https://belaya.app/book/${bookingSlug}`
    : "https://belaya.app/";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e84c8a,#d63a78);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Belaya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Votre espace beaute en ligne</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${firstName},</h2>
              <p style="margin:0 0 16px;color:#4b5563;font-size:16px;line-height:1.6;">
                <strong>${providerName}</strong> vous a ajout&eacute;(e) sur <strong>Belaya</strong>, votre plateforme beaut&eacute; en ligne.
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.6;">
                Vous pouvez d&eacute;sormais prendre rendez-vous en ligne, consulter l'historique de vos prestations et profiter d'avantages exclusifs.
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${bookingUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#e84c8a,#d63a78);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      Prendre rendez-vous
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; car <strong>${providerName}</strong> utilise Belaya pour g&eacute;rer ses rendez-vous. Si vous pensez avoir re&ccedil;u ce message par erreur, vous pouvez l'ignorer.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Belaya. Tous droits r&eacute;serv&eacute;s.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-welcome-email] RESEND_API_KEY is not set in Edge Function secrets");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: WelcomeEmailPayload = await req.json();
    const { clients, providerName, bookingSlug } = payload;

    console.log(`[send-welcome-email] Invoked: ${clients?.length || 0} client(s), provider="${providerName}", slug="${bookingSlug || 'none'}"`);

    if (!clients || !Array.isArray(clients) || clients.length === 0 || !providerName) {
      console.warn("[send-welcome-email] Missing required fields in payload");
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "clients (non-empty array) and providerName are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: { email: string; success: boolean; error?: string }[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      if (!client.email || !client.email.includes("@")) {
        console.warn(`[send-welcome-email] Skipping invalid email: "${client.email}"`);
        continue;
      }

      const maskedEmail = client.email.replace(/(.{2}).*(@.*)/, "$1***$2");
      console.log(`[send-welcome-email] Sending to ${maskedEmail}...`);

      try {
        const html = buildEmailHtml(
          client.firstName || "cher(e) client(e)",
          providerName,
          bookingSlug
        );

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Belaya <support@send.belaya.app>",
            to: [client.email],
            subject: "Bienvenue sur Belaya !",
            html,
          }),
        });

        if (res.ok) {
          const resBody = await res.json();
          sent++;
          results.push({ email: client.email, success: true });
          console.log(`[send-welcome-email] OK for ${maskedEmail}, id=${resBody?.id || 'unknown'}`);
        } else {
          const errBody = await res.text();
          failed++;
          results.push({ email: client.email, success: false, error: errBody });
          console.error(`[send-welcome-email] FAILED for ${maskedEmail}: HTTP ${res.status} - ${errBody}`);
        }
      } catch (err) {
        failed++;
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        results.push({ email: client.email, success: false, error: errMsg });
        console.error(`[send-welcome-email] EXCEPTION for ${maskedEmail}: ${errMsg}`);
      }

      if (clients.length > 5 && i < clients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`[send-welcome-email] Done: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[send-welcome-email] Unhandled error: ${errMsg}`);

    return new Response(
      JSON.stringify({
        error: "Failed to process welcome emails",
        details: errMsg,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
