import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Attachment {
  name: string;
  url: string;
}

interface StudentEmailPayload {
  to: string;
  subject: string;
  message: string;
  studentName: string;
  providerName: string;
  attachments?: Attachment[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildStudentEmailHtml(payload: StudentEmailPayload): string {
  const { providerName, message, attachments } = payload;
  const safeProvider = escapeHtml(providerName);

  const messageHtml = message
    .split("\n")
    .map((line: string) =>
      line.trim()
        ? `<p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;">${escapeHtml(line)}</p>`
        : `<br>`
    )
    .join("");

  let attachmentsHtml = "";
  if (attachments && attachments.length > 0) {
    const attachmentRows = attachments
      .map(
        (att: Attachment) =>
          `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;">
              <a href="${escapeHtml(att.url)}" target="_blank" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:500;">
                &#128206; ${escapeHtml(att.name)}
              </a>
            </td>
          </tr>`
      )
      .join("");

    attachmentsHtml = `
      <div style="margin:24px 0;">
        <p style="margin:0 0 12px;color:#374151;font-size:15px;font-weight:600;">Documents joints :</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
          ${attachmentRows}
        </table>
      </div>`;
  }

  return `<!DOCTYPE html>
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Formation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${messageHtml}
              ${attachmentsHtml}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; par <strong>${safeProvider}</strong> via Belaya.
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: StudentEmailPayload = await req.json();
    const { to, subject, studentName, providerName, message } = payload;

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "to, subject, and message are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const html = buildStudentEmailHtml(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Belaya <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (res.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          recipient: to,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const errBody = await res.text();
      console.error("Resend API error:", errBody);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send email via Resend",
          details: errBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending student email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
