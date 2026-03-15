import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReviewRequestPayload {
  clientEmail: string;
  clientFirstName: string;
  providerName: string;
  providerLogoUrl?: string;
  serviceName: string;
  appointmentDate: string;
  bookingSlug: string;
  eventId: string;
}

function formatDateFR(isoDate: string): { date: string; time: string } {
  const d = new Date(isoDate);
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = [
    "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin",
    "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre",
  ];
  const dayName = days[d.getDay()];
  const dayNum = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return {
    date: `${dayName} ${dayNum} ${month} ${year}`,
    time: `${hours}h${minutes}`,
  };
}

function buildReviewRequestHtml(payload: ReviewRequestPayload): string {
  const { clientFirstName, providerName, providerLogoUrl, serviceName, appointmentDate, bookingSlug } = payload;
  const { date, time } = formatDateFR(appointmentDate);
  const reviewUrl = `https://belaya.app/book/${bookingSlug}?tab=reviews`;

  const logoSection = providerLogoUrl
    ? `<img src="${providerLogoUrl}" alt="${providerName}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #F9D4E4;display:block;margin:0 auto 16px;" />`
    : `<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#E91E8C,#F06292);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:#fff;font-family:'Playfair Display',serif;line-height:64px;text-align:center;">${providerName.charAt(0).toUpperCase()}</div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donnez votre avis - ${providerName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#FDF0F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(220,100,130,0.12);">

          <tr>
            <td style="background:linear-gradient(135deg,#FDF0F4 0%,#FFDDE8 100%);padding:40px 48px 32px;text-align:center;border-bottom:1px solid #F9D4E4;">
              ${logoSection}
              <h1 style="font-family:'Playfair Display',serif;font-size:26px;color:#2D1B22;margin:0 0 8px;">Votre avis nous tient \u00e0 c\u0153ur</h1>
              <p style="font-size:15px;color:#9E5070;margin:0;">chez <strong style="color:#2D1B22;">${providerName}</strong></p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 48px;">

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Bonjour <strong>${clientFirstName}</strong>,
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 24px;">
                Merci d\u2019avoir fait confiance \u00e0 <strong>${providerName}</strong>. Nous esp\u00e9rons que votre prestation s\u2019est parfaitement d\u00e9roul\u00e9e !
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF0F4;border-radius:14px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-size:13px;color:#9E5070;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;">Votre prestation</p>
                    <p style="font-size:16px;font-weight:600;color:#2D1B22;margin:0 0 12px;">${serviceName}</p>
                    <p style="font-size:13px;color:#9E5070;margin:0 0 4px;">${date} \u00e0 ${time}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 8px;">
                Votre retour aide <strong>${providerName}</strong> \u00e0 s\u2019am\u00e9liorer et permet \u00e0 d\u2019autres clientes de faire le bon choix.
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 32px;">
                Cela ne prend que 30 secondes !
              </p>

              <table cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;">
                <tr>
                  <td align="center">
                    <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#E91E8C,#F06292);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:18px 48px;border-radius:50px;letter-spacing:0.02em;font-family:'DM Sans',Arial,sans-serif;">
                      \u2b50 Laisser mon avis
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#C49BAA;text-align:center;">
                Merci de faire confiance \u00e0 votre prestataire et \u00e0 Belaya
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 48px;text-align:center;background:#FDF8FA;border-top:1px solid #F9D4E4;">
              <p style="font-size:14px;color:#2D1B22;margin:0 0 4px;font-family:'Playfair Display',serif;">L\u2019\u00e9quipe Belaya</p>
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

    const payload: ReviewRequestPayload = await req.json();
    const { clientEmail, clientFirstName, providerName, serviceName, appointmentDate, bookingSlug, eventId } = payload;

    if (!clientEmail || !clientFirstName || !providerName || !serviceName || !appointmentDate || !bookingSlug || !eventId) {
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

    const html = buildReviewRequestHtml(payload);
    const subject = `Votre avis compte pour ${providerName}`;

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
      console.error(`Failed to send review request email: HTTP ${res.status} - ${errBody}`);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in send-review-request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
