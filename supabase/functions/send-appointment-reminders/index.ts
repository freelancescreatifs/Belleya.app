import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EventRow {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  client_id: string;
  service_id: string | null;
  user_id: string;
  company_id: string | null;
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

function buildReminderHtml(
  firstName: string,
  companyName: string,
  serviceName: string | null,
  dateStr: string,
  timeStr: string,
  location: string | null
): string {
  const locationBlock = location
    ? `<p style="margin:0 0 8px;color:#5A3A44;"><strong>Lieu :</strong> ${location}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de votre rendez-vous</title>
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:300;">Rappel de rendez-vous</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 48px;">
              <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:#2D1B22;margin:0 0 20px;">
                Rappel de votre rendez-vous demain
              </h2>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Bonjour <strong>${firstName}</strong>,
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Nous vous rappelons que vous avez un rendez-vous avec <strong>${companyName}</strong> demain.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDF0F4;border-radius:14px;margin:0 0 24px;">
                <tr>
                  <td style="font-size:14px;color:#2D1B22;padding:20px;">
                    <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#2D1B22;">${companyName}</p>
                    ${serviceName ? `<p style="margin:0 0 8px;color:#5A3A44;"><strong>Service :</strong> ${serviceName}</p>` : ""}
                    <p style="margin:0 0 8px;color:#5A3A44;"><strong>Date :</strong> ${dateStr}</p>
                    <p style="margin:0 0 8px;color:#5A3A44;"><strong>Heure :</strong> ${timeStr}</p>
                    ${locationBlock}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Si vous avez un emp&ecirc;chement, merci de pr&eacute;venir votre prestataire &agrave; l'avance.
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 20px;">
                Pr&eacute;venir &agrave; temps permet de respecter le travail du prestataire et de lib&eacute;rer ce cr&eacute;neau pour une autre cliente.
              </p>

              <p style="font-size:15px;color:#5A3A44;line-height:1.8;margin:0 0 28px;">
                Vous pouvez g&eacute;rer ou modifier votre rendez-vous directement depuis votre espace client.
              </p>

              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" bgcolor="#E91E8C" style="border-radius:50px;">
                    <a href="https://belaya.app" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;padding:18px 40px;">
                      Voir mon rendez-vous
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#C49BAA;text-align:center;">
                Merci pour votre respect et votre ponctualit&eacute;
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 48px;text-align:center;background:#FDF8FA;border-top:1px solid #F9D4E4;">
              <p style="font-size:14px;color:#2D1B22;margin:0 0 4px;">L'&eacute;quipe Belaya</p>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const tomorrowStart = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
    ));
    const tomorrowEnd = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2, 0, 0, 0
    ));

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, start_at, end_at, client_id, service_id, user_id, company_id, location")
      .not("client_id", "is", null)
      .eq("status", "confirmed")
      .gte("start_at", tomorrowStart.toISOString())
      .lt("start_at", tomorrowEnd.toISOString());

    if (eventsError) {
      throw new Error(`Failed to query events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments tomorrow", events_checked: 0, emails_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventIds = events.map((e: EventRow) => e.id);
    const { data: alreadySent } = await supabase
      .from("email_reminder_log")
      .select("event_id")
      .in("event_id", eventIds);

    const sentSet = new Set((alreadySent || []).map((r: { event_id: string }) => r.event_id));
    const eventsToProcess = events.filter((e: EventRow) => !sentSet.has(e.id));

    if (eventsToProcess.length === 0) {
      return new Response(
        JSON.stringify({
          message: "All reminders already sent",
          events_checked: events.length,
          emails_sent: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const details: { event_id: string; email: string; status: string; error?: string }[] = [];

    for (let i = 0; i < eventsToProcess.length; i++) {
      const event = eventsToProcess[i];

      const { data: client } = await supabase
        .from("clients")
        .select("first_name, last_name, email")
        .eq("id", event.client_id)
        .maybeSingle();

      if (!client || !client.email || !client.email.includes("@")) {
        continue;
      }

      let companyName = "votre professionnel(le)";
      if (event.company_id) {
        const { data: company } = await supabase
          .from("company_profiles")
          .select("company_name")
          .eq("id", event.company_id)
          .maybeSingle();
        if (company?.company_name) companyName = company.company_name;
      } else {
        const { data: company } = await supabase
          .from("company_profiles")
          .select("company_name")
          .eq("user_id", event.user_id)
          .maybeSingle();
        if (company?.company_name) companyName = company.company_name;
      }

      let serviceName: string | null = null;
      if (event.service_id) {
        const { data: service } = await supabase
          .from("services")
          .select("name")
          .eq("id", event.service_id)
          .maybeSingle();
        if (service?.name) serviceName = service.name;
      }

      const { date: dateStr, time: timeStr } = formatDateFR(event.start_at);
      const firstName = client.first_name || "cher(e) client(e)";

      const html = buildReminderHtml(
        firstName,
        companyName,
        serviceName || event.title,
        dateStr,
        timeStr,
        event.location || null
      );

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `Belaya <support@belaya.app>`,
            to: [client.email],
            subject: `Rappel : votre rendez-vous avec ${companyName}`,
            html,
          }),
        });

        if (res.ok) {
          emailsSent++;
          await supabase.from("email_reminder_log").insert({
            event_id: event.id,
            client_id: event.client_id,
            email: client.email,
            status: "sent",
          });
          details.push({ event_id: event.id, email: client.email, status: "sent" });
        } else {
          const errBody = await res.text();
          emailsFailed++;
          await supabase.from("email_reminder_log").insert({
            event_id: event.id,
            client_id: event.client_id,
            email: client.email,
            status: "failed",
            error_message: errBody.slice(0, 500),
          });
          details.push({ event_id: event.id, email: client.email, status: "failed", error: errBody });
          console.error(`Failed to send to ${client.email}:`, errBody);
        }
      } catch (sendErr) {
        emailsFailed++;
        const errMsg = sendErr instanceof Error ? sendErr.message : "Unknown send error";
        await supabase.from("email_reminder_log").insert({
          event_id: event.id,
          client_id: event.client_id,
          email: client.email,
          status: "failed",
          error_message: errMsg.slice(0, 500),
        });
        details.push({ event_id: event.id, email: client.email, status: "failed", error: errMsg });
        console.error(`Error sending to ${client.email}:`, sendErr);
      }

      if (eventsToProcess.length > 5 && i < eventsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        events_checked: events.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        details,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-appointment-reminders:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process appointment reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
