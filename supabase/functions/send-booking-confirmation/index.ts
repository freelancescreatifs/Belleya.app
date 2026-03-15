import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingConfirmationPayload {
  clientEmail: string;
  clientFirstName: string;
  providerName: string;
  serviceName: string;
  appointmentDate: string;
  bookingId?: string;
  type: "booking_received" | "booking_confirmed";
}

function formatDateFR(isoDate: string): { date: string; time: string } {
  const d = new Date(isoDate);
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = [
    "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin",
    "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre",
  ];
  const dayName = days[d.getUTCDay()];
  const dayNum = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return {
    date: `${dayName} ${dayNum} ${month} ${year}`,
    time: `${hours}h${minutes}`,
  };
}

function buildConfirmationHtml(payload: BookingConfirmationPayload): string {
  const { clientFirstName, providerName, serviceName, appointmentDate, type } = payload;
  const { date, time } = formatDateFR(appointmentDate);

  const isReceived = type === "booking_received";

  const title = isReceived
    ? "Votre demande de r\u00e9servation a \u00e9t\u00e9 envoy\u00e9e"
    : "Votre rendez-vous est confirm\u00e9 !";

  const subtitle = isReceived
    ? "Demande de r\u00e9servation re\u00e7ue"
    : "Rendez-vous confirm\u00e9";

  const bodyText = isReceived
    ? `Votre demande de rendez-vous avec <strong>${providerName}</strong> a bien \u00e9t\u00e9 re\u00e7ue. Vous recevrez une confirmation d\u00e8s que le prestataire aura valid\u00e9 votre cr\u00e9neau.`
    : `Votre rendez-vous avec <strong>${providerName}</strong> est confirm\u00e9. \u00c0 tr\u00e8s bient\u00f4t !`;

  const statusBg = isReceived ? "#FDF0F4" : "#F0FDF4";
  const statusBorder = isReceived ? "#F9A8C9" : "#86EFAC";
  const statusColor = isReceived ? "#BE185D" : "#166534";
  const statusText = isReceived ? "En attente de confirmation" : "Confirm\u00e9";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#FDF0F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(220,100,130,0.12);">

          <tr>
            <td style="background:linear-gradient(135deg,#e84c8a,#d63a78);padding:40px 48px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-family:'Playfair Display',serif;font-size:32px;font-weight:600;letter-spacing:-0.5px;">Belaya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:300;">${subtitle}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 48px;">
              <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:#2D1B22;margin:0 0 20px;">${title}</h2>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Bonjour <strong>${clientFirstName}</strong>,
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 24px;">
                ${bodyText}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF0F4;border-radius:14px;padding:20px;margin:0 0 24px;">
                <tr>
                  <td style="font-size:14px;color:#2D1B22;padding:20px;">
                    <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#2D1B22;">${providerName}</p>
                    <p style="margin:0 0 8px;color:#5A3A44;"><strong>Service :</strong> ${serviceName}</p>
                    <p style="margin:0 0 8px;color:#5A3A44;"><strong>Date :</strong> ${date}</p>
                    <p style="margin:0;color:#5A3A44;"><strong>Heure :</strong> ${time}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${statusBg};border:1px solid ${statusBorder};border-radius:10px;margin:0 0 28px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:14px;font-weight:500;color:${statusColor};">${statusText}</p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" bgcolor="#E91E8C" style="border-radius:50px;">
                    <a href="https://belaya.app" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;padding:18px 40px;">
                      Voir mon rendez-vous
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #F9D4E4;margin:0 0 24px;">

              <p style="margin:0;font-size:13px;color:#C49BAA;text-align:center;line-height:1.6;">
                Si vous avez des questions, vous pouvez contacter directement votre prestataire ou g\u00e9rer vos rendez-vous depuis votre espace client Belaya.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 48px;text-align:center;background:#FDF8FA;border-top:1px solid #F9D4E4;">
              <p style="font-size:14px;color:#2D1B22;margin:0 0 4px;">L'\u00e9quipe Belaya</p>
              <p style="font-size:12px;color:#9E5070;margin:0 0 16px;">Beauty is my priority</p>
              <p style="font-size:12px;color:#C49BAA;margin:0;">
                <a href="https://www.instagram.com/belaya.app" style="color:#E91E8C;text-decoration:none;">Instagram</a>
                &nbsp;&middot;&nbsp;
                <a href="https://www.tiktok.com/belaya.app" style="color:#E91E8C;text-decoration:none;">TikTok</a>
              </p>
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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: BookingConfirmationPayload = await req.json();
    const { clientEmail, clientFirstName, providerName, serviceName, appointmentDate, type } = payload;

    if (!clientEmail || !clientFirstName || !providerName || !serviceName || !appointmentDate || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isReceived = type === "booking_received";
    const subject = isReceived
      ? `Demande de r\u00e9servation re\u00e7ue - ${providerName}`
      : `Rendez-vous confirm\u00e9 avec ${providerName}`;

    const html = buildConfirmationHtml(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Belaya <support@belaya.app>",
        to: [clientEmail],
        subject,
        html,
      }),
    });

    if (res.ok) {
      const resBody = await res.json();
      return new Response(
        JSON.stringify({ success: true, id: resBody?.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errBody = await res.text();
      console.error(`Failed to send confirmation email: HTTP ${res.status} - ${errBody}`);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
