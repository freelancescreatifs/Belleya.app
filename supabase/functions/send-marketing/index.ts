import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MarketingSend {
  send_id: string;
  client_id: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  subject?: string;
  content: string;
}

interface MarketingPayload {
  channel: "sms" | "email";
  sends: MarketingSend[];
  provider_name: string;
}

interface SendResult {
  send_id: string;
  client_id: string;
  status: "sent" | "failed";
  error?: string;
}

function normalizePhoneToE164(phone: string): string {
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+33" + cleaned.substring(1);
  } else if (cleaned.startsWith("33") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+33" + cleaned;
  }
  return cleaned;
}

function buildMarketingEmailHtml(
  firstName: string,
  providerName: string,
  content: string
): string {
  const paragraphs = content
    .split("\n")
    .filter((line) => line.trim())
    .map(
      (line) =>
        `<p style="margin:0 0 16px;color:#4b5563;font-size:16px;line-height:1.7;">${line}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#fdf2f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fdf2f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#e84c8a,#d63a78);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Belaya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Un message de ${providerName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 24px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${firstName},</h2>
              ${paragraphs}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; par <strong>${providerName}</strong> via Belaya.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fdf2f8;padding:20px 40px;text-align:center;border-top:1px solid #fce7f3;">
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

async function sendEmail(
  resendApiKey: string,
  send: MarketingSend,
  providerName: string
): Promise<SendResult> {
  if (!send.email) {
    return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: "No email address" };
  }

  const html = buildMarketingEmailHtml(send.first_name, providerName, send.content);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Belaya <support@belaya.app>`,
        to: [send.email],
        subject: send.subject || `Un message pour vous de ${providerName}`,
        html,
      }),
    });

    if (res.ok) {
      return { send_id: send.send_id, client_id: send.client_id, status: "sent" };
    } else {
      const errBody = await res.text();
      console.error("Resend error for", send.email, ":", errBody);
      return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: errBody };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: message };
  }
}

async function sendSms(
  twilioSid: string,
  twilioToken: string,
  twilioPhone: string,
  send: MarketingSend
): Promise<SendResult> {
  if (!send.phone) {
    return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: "No phone number" };
  }

  const normalizedPhone = normalizePhoneToE164(send.phone);
  const credentials = btoa(`${twilioSid}:${twilioToken}`);

  let smsBody = send.content;
  if (smsBody.length > 160) {
    smsBody = smsBody.substring(0, 157) + "...";
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: normalizedPhone,
          From: twilioPhone,
          Body: smsBody,
        }),
      }
    );

    if (res.ok) {
      return { send_id: send.send_id, client_id: send.client_id, status: "sent" };
    } else {
      const errBody = await res.text();
      console.error("Twilio error for", normalizedPhone, ":", errBody);
      return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: errBody };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { send_id: send.send_id, client_id: send.client_id, status: "failed", error: message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: MarketingPayload = await req.json();
    const { channel, sends, provider_name } = payload;

    if (!channel || !sends || sends.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: channel, sends" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: SendResult[] = [];

    if (channel === "email") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ error: "RESEND_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const send of sends) {
        const result = await sendEmail(resendApiKey, send, provider_name || "votre prestataire");
        results.push(result);
        if (sends.length > 5) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } else if (channel === "sms") {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioSid || !twilioToken || !twilioPhone) {
        return new Response(
          JSON.stringify({ error: "Twilio credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const send of sends) {
        const result = await sendSms(twilioSid, twilioToken, twilioPhone, send);
        results.push(result);
        if (sends.length > 5) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid channel. Must be 'sms' or 'email'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { sent: sentCount, failed: failedCount, total: results.length },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-marketing error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process marketing sends",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
