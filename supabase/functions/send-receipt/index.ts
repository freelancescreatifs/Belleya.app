import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReceiptPayload {
  eventId: string;
  sendEmail: boolean;
  sendSms: boolean;
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeFr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function buildReceiptHtml(
  clientName: string,
  companyName: string,
  serviceName: string,
  date: string,
  time: string,
  price: string
): string {
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Votre re&ccedil;u de visite</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${clientName},</h2>
              <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.6;">
                Merci pour votre visite chez <strong>${companyName}</strong>. Voici le r&eacute;capitulatif de votre rendez-vous :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:8px 0;color:#6b7280;font-size:14px;">Prestation</td>
                        <td style="padding:8px 0;color:#1f2937;font-size:16px;font-weight:600;text-align:right;">${serviceName}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#6b7280;font-size:14px;">Date</td>
                        <td style="padding:8px 0;color:#1f2937;font-size:16px;font-weight:600;text-align:right;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#6b7280;font-size:14px;">Heure</td>
                        <td style="padding:8px 0;color:#1f2937;font-size:16px;font-weight:600;text-align:right;">${time}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:12px 0 0;border-top:1px solid #bbf7d0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#1f2937;font-size:16px;font-weight:700;">Total</td>
                        <td style="padding:8px 0;color:#059669;font-size:20px;font-weight:700;text-align:right;">${price}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;">
                &Agrave; tr&egrave;s bient&ocirc;t !
              </p>
              <p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">${companyName}</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; par <strong>${companyName}</strong> via Belaya.
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: ReceiptPayload = await req.json();
    const { eventId, sendEmail, sendSms } = payload;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "eventId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!sendEmail && !sendSms) {
      return new Response(
        JSON.stringify({ error: "At least one channel (email or sms) must be selected" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        id, user_id, title, start_at, end_at, type, status,
        client:clients(id, first_name, last_name, email, phone),
        service:services(id, name, price, duration)
      `
      )
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({
          error: "Event not found",
          details: eventError?.message || "No event with this ID",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!event.client) {
      return new Response(
        JSON.stringify({ error: "No client associated with this event" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: company } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", event.user_id)
      .maybeSingle();

    const companyName = company?.company_name || "Votre prestataire";
    const clientName = `${event.client.first_name || ""} ${event.client.last_name || ""}`.trim() || "Client(e)";
    const serviceName = event.service?.name || event.title || "Prestation";
    const servicePrice = event.service?.price ? `${Number(event.service.price).toFixed(2)}\u20AC` : "N/A";
    const dateFormatted = formatDateFr(event.start_at);
    const timeFormatted = formatTimeFr(event.start_at);

    const results: { channel: string; success: boolean; error?: string }[] = [];

    if (sendEmail) {
      const clientEmail = event.client.email;
      if (!clientEmail) {
        results.push({
          channel: "email",
          success: false,
          error: "Client has no email address",
        });
      } else {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
          results.push({
            channel: "email",
            success: false,
            error: "RESEND_API_KEY not configured",
          });
        } else {
          try {
            const html = buildReceiptHtml(
              clientName,
              companyName,
              serviceName,
              dateFormatted,
              timeFormatted,
              servicePrice
            );

            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `Belaya <support@belaya.app>`,
                to: [clientEmail],
                subject: `Votre recu - ${companyName}`,
                html,
              }),
            });

            if (res.ok) {
              results.push({ channel: "email", success: true });
            } else {
              const errBody = await res.text();
              results.push({
                channel: "email",
                success: false,
                error: errBody,
              });
            }
          } catch (err) {
            results.push({
              channel: "email",
              success: false,
              error: err instanceof Error ? err.message : "Unknown email error",
            });
          }
        }
      }
    }

    if (sendSms) {
      const clientPhone = event.client.phone;
      if (!clientPhone) {
        results.push({
          channel: "sms",
          success: false,
          error: "Client has no phone number",
        });
      } else {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (!twilioSid || !twilioToken || !twilioPhone) {
          results.push({
            channel: "sms",
            success: false,
            error: "Twilio credentials not configured",
          });
        } else {
          try {
            const priceText = event.service?.price
              ? `${Number(event.service.price).toFixed(2)}EUR`
              : "";
            const shortDate = new Date(event.start_at).toLocaleDateString(
              "fr-FR"
            );
            let smsBody = `Bonjour ${event.client.first_name || ""},  merci pour votre visite chez ${companyName}. Recap: ${serviceName}${priceText ? ` - ${priceText}` : ""} le ${shortDate}. A bientot !`;

            if (smsBody.length > 160) {
              smsBody = smsBody.substring(0, 157) + "...";
            }

            const credentials = btoa(`${twilioSid}:${twilioToken}`);

            const res = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${credentials}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: normalizePhoneToE164(clientPhone),
                  From: twilioPhone,
                  Body: smsBody,
                }),
              }
            );

            if (res.ok) {
              results.push({ channel: "sms", success: true });
            } else {
              const errBody = await res.text();
              results.push({
                channel: "sms",
                success: false,
                error: errBody,
              });
            }
          } catch (err) {
            results.push({
              channel: "sms",
              success: false,
              error: err instanceof Error ? err.message : "Unknown SMS error",
            });
          }
        }
      }
    }

    const emailResult = results.find((r) => r.channel === "email");
    const smsResult = results.find((r) => r.channel === "sms");

    return new Response(
      JSON.stringify({
        success: results.every((r) => r.success),
        emailSent: emailResult?.success || false,
        smsSent: smsResult?.success || false,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-receipt:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send receipt",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
