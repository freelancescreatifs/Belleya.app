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

function formatDateFR(isoDate: string): string {
  const d = new Date(isoDate);
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = [
    "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin",
    "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre",
  ];
  const dayName = days[d.getUTCDay()];
  const dayNum = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${dayName} ${dayNum} ${month} \u00e0 ${hours}h${minutes}`;
}

function buildReminderHtml(
  firstName: string,
  companyName: string,
  serviceName: string | null,
  dateFormatted: string,
  location: string | null
): string {
  const serviceBlock = serviceName
    ? `<p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;"><strong>Prestation :</strong> ${serviceName}</p>`
    : "";
  const locationBlock = location
    ? `<p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;"><strong>Lieu :</strong> ${location}</p>`
    : "";

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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Rappel de rendez-vous</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${firstName},</h2>
              <p style="margin:0 0 20px;color:#4b5563;font-size:16px;line-height:1.6;">
                Nous vous rappelons que vous avez un rendez-vous pr&eacute;vu <strong>demain</strong> :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fdf2f8;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 8px;color:#1f2937;font-size:18px;font-weight:600;">${companyName}</p>
                    <p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;"><strong>Date :</strong> ${dateFormatted}</p>
                    ${serviceBlock}
                    ${locationBlock}
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="https://belaya.app/" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#e84c8a,#d63a78);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      Voir mes rendez-vous
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; automatiquement par Belaya au nom de <strong>${companyName}</strong>. Si vous pensez avoir re&ccedil;u ce message par erreur, vous pouvez l'ignorer.
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

      const dateFormatted = formatDateFR(event.start_at);
      const firstName = client.first_name || "cher(e) client(e)";

      const html = buildReminderHtml(
        firstName,
        companyName,
        serviceName || event.title,
        dateFormatted,
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
