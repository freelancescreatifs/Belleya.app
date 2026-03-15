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
  providerAddress?: string;
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
  const { clientFirstName, providerName, serviceName, appointmentDate, providerAddress, type } = payload;
  const { date, time } = formatDateFR(appointmentDate);

  const isConfirmed = type === "booking_confirmed";

  const title = isConfirmed
    ? "Votre rendez-vous est confirm\u00e9 \u2728"
    : "Votre demande de r\u00e9servation a \u00e9t\u00e9 envoy\u00e9e";

  const bodyText = isConfirmed
    ? `Votre rendez-vous avec <strong>${providerName}</strong> a bien \u00e9t\u00e9 confirm\u00e9.`
    : `Votre demande de rendez-vous avec <strong>${providerName}</strong> a bien \u00e9t\u00e9 re\u00e7ue. Vous recevrez une confirmation d\u00e8s que le prestataire aura valid\u00e9 votre cr\u00e9neau.`;

  const addressRow = providerAddress
    ? `<br><br><strong>Lieu :</strong> ${providerAddress}`
    : "";

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
            <td style="padding:40px 48px;">
              <h1 style="font-family:'Playfair Display',serif;font-size:28px;color:#2D1B22;margin:0 0 20px;">${title}</h1>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Bonjour ${clientFirstName},
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                ${bodyText}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF0F4;border-radius:14px;padding:20px;margin:20px 0;">
                <tr>
                  <td style="font-size:14px;color:#2D1B22;padding:20px;">
                    <strong>Service :</strong> ${serviceName}<br><br>
                    <strong>Date :</strong> ${date}<br><br>
                    <strong>Heure :</strong> ${time}${addressRow}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Vous pouvez retrouver ce rendez-vous \u00e0 tout moment dans votre espace client Belaya.
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 30px;">
                Depuis votre profil, vous pouvez :<br><br>
                &bull; consulter vos prochains rendez-vous<br>
                &bull; g\u00e9rer vos r\u00e9servations<br>
                &bull; voir vos prestations et documents
              </p>

              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#E91E8C" style="border-radius:50px;">
                    <a href="https://belaya.app" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;padding:18px 40px;">
                      Acc\u00e9der \u00e0 mon espace client
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:30px 0 0;font-size:13px;color:#C49BAA;text-align:center;">
                Merci de faire confiance \u00e0 votre prestataire et \u00e0 Belaya
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 48px;text-align:center;background:#FDF8FA;border-top:1px solid #F9D4E4;">
              <p style="font-size:14px;color:#2D1B22;margin:0 0 4px;">L'\u00e9quipe Belaya</p>
              <p style="font-size:12px;color:#9E5070;margin:4px 0 16px;">Beauty is my priority</p>
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

    const isConfirmed = type === "booking_confirmed";
    const subject = isConfirmed
      ? `Rendez-vous confirm\u00e9 avec ${providerName}`
      : `Demande de r\u00e9servation re\u00e7ue - ${providerName}`;

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
