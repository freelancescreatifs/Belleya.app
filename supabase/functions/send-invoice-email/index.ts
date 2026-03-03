import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvoiceEmailPayload {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
  providerName: string;
  appointmentDate?: string;
  items: Array<{
    label: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
  total: number;
  notes?: string;
  customMessage?: string;
}

function buildInvoiceHtml(payload: InvoiceEmailPayload): string {
  const {
    clientName,
    providerName,
    appointmentDate,
    items,
    total,
    notes,
    customMessage,
  } = payload;

  const dateText = appointmentDate ? ` le ${appointmentDate}` : "";

  const greeting = customMessage
    ? `<p style="margin:0 0 20px;color:#4b5563;font-size:16px;line-height:1.6;">${customMessage}</p>`
    : `<p style="margin:0 0 20px;color:#4b5563;font-size:16px;line-height:1.6;">Merci d'&ecirc;tre venue chez <strong>${providerName}</strong>${dateText}.</p>`;

  const itemRows = items
    .map((item) => {
      const qty = item.quantity > 1 ? ` x${item.quantity}` : "";
      return `<tr>
        <td style="padding:8px 0;color:#1f2937;font-size:15px;border-bottom:1px solid #f3f4f6;">${item.label}${qty}</td>
        <td style="padding:8px 0;color:#1f2937;font-size:15px;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${item.lineTotal.toFixed(2)}&euro;</td>
      </tr>`;
    })
    .join("");

  const notesBlock = notes
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
        <tr><td style="padding:16px;background-color:#f9fafb;border-radius:8px;color:#6b7280;font-size:14px;line-height:1.5;"><strong>Notes :</strong><br>${notes}</td></tr>
      </table>`
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
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">R&eacute;capitulatif de votre visite</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:600;">Bonjour ${clientName},</h2>
              ${greeting}
              <p style="margin:0 0 16px;color:#4b5563;font-size:16px;line-height:1.6;">Voici le r&eacute;capitulatif de votre visite :</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      ${itemRows}
                      <tr>
                        <td colspan="2" style="padding:12px 0 0;border-top:2px solid #bbf7d0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#1f2937;font-size:16px;font-weight:700;">Total</td>
                        <td style="padding:8px 0;color:#059669;font-size:20px;font-weight:700;text-align:right;">${total.toFixed(2)}&euro;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${notesBlock}
              <p style="margin:0 0 8px;color:#4b5563;font-size:16px;line-height:1.6;">&Agrave; tr&egrave;s bient&ocirc;t !</p>
              <p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">${providerName}</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;text-align:center;">
                Cet email vous a &eacute;t&eacute; envoy&eacute; par <strong>${providerName}</strong> via Belaya.
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

    const payload: InvoiceEmailPayload = await req.json();

    const {
      invoiceId,
      clientEmail,
      clientName,
      providerName,
      items,
    } = payload;

    if (!invoiceId || !clientEmail || !clientName || !providerName || !items || items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "invoiceId, clientEmail, clientName, providerName, and items are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailSubject = `Récap de votre visite chez ${providerName}`;
    const html = buildInvoiceHtml(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Belaya <onboarding@resend.dev>`,
        to: [clientEmail],
        subject: emailSubject,
        html,
      }),
    });

    if (res.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          invoiceId,
          recipient: clientEmail,
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
          error: "Failed to send email",
          details: errBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending invoice email:", error);

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
