import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DocumentNotificationPayload {
  clientEmail: string;
  clientFirstName: string;
  providerName: string;
  documentTitle: string;
  clientAreaUrl: string;
}

function buildDocumentEmailHtml(
  firstName: string,
  providerName: string,
  documentTitle: string,
  clientAreaUrl: string
): string {
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
          <tr>
            <td style="background:linear-gradient(135deg,#e84c8a,#d63a78);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Belaya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Votre espace beaute en ligne</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${firstName},</h2>
              <p style="margin:0 0 16px;color:#4b5563;font-size:16px;line-height:1.6;">
                <strong>${providerName}</strong> vous a envoy&eacute; un document &agrave; consulter :
              </p>
              <div style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:12px;padding:20px;margin:0 0 24px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#e84c8a,#d63a78);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="color:white;font-size:18px;">&#128196;</span>
                  </div>
                  <div>
                    <p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">${documentTitle}</p>
                    <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">Document partage par ${providerName}</p>
                  </div>
                </div>
              </div>
              <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.6;">
                Vous pouvez le t&eacute;l&eacute;charger, le remplir, puis nous renvoyer votre version compl&eacute;t&eacute;e directement depuis votre espace client.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${clientAreaUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#e84c8a,#d63a78);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      Voir mon document
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; car <strong>${providerName}</strong> utilise Belaya pour partager des documents avec ses clientes.
              </p>
            </td>
          </tr>
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
      console.error("[send-document-notification] RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: DocumentNotificationPayload = await req.json();
    const { clientEmail, clientFirstName, providerName, documentTitle, clientAreaUrl } = payload;

    if (!clientEmail || !providerName || !documentTitle || !clientAreaUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: clientEmail, providerName, documentTitle, clientAreaUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-document-notification] Sending to ${clientEmail.replace(/(.{2}).*(@.*)/, "$1***$2")}, doc="${documentTitle}"`);

    const html = buildDocumentEmailHtml(
      clientFirstName || "cher(e) client(e)",
      providerName,
      documentTitle,
      clientAreaUrl
    );

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Belaya <support@belaya.app>",
        to: [clientEmail],
        subject: `${providerName} vous a envoyé un document`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[send-document-notification] Resend failed: HTTP ${res.status} - ${errBody}`);
      return new Response(
        JSON.stringify({ success: false, error: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resBody = await res.json();
    console.log(`[send-document-notification] Email sent successfully, id=${resBody?.id || "unknown"}`);

    return new Response(
      JSON.stringify({ success: true, id: resBody?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[send-document-notification] Unhandled error: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: "Failed to send document notification", details: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
