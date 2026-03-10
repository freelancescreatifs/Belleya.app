import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvoiceSMSPayload {
  invoiceId: string;
  clientPhone: string;
  clientName: string;
  providerName: string;
  appointmentDate?: string;
  total: number;
  customMessage?: string;
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
    const payload: InvoiceSMSPayload = await req.json();

    const {
      invoiceId,
      clientPhone,
      clientName,
      providerName,
      appointmentDate,
      total,
      customMessage,
    } = payload;

    if (!invoiceId || !clientPhone || !clientName || !providerName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "invoiceId, clientPhone, clientName, and providerName are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioToken || !twilioPhone) {
      return new Response(
        JSON.stringify({
          error: "Twilio credentials not configured",
          details: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are required",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const dateText = appointmentDate ? ` le ${appointmentDate}` : "";

    let smsBody = "";
    if (customMessage) {
      smsBody = customMessage;
    } else {
      smsBody = `Bonjour ${clientName}, merci pour votre visite chez ${providerName}${dateText}. Total: ${total.toFixed(2)}EUR. A bientot!`;
    }

    if (smsBody.length > 160) {
      smsBody = smsBody.substring(0, 157) + "...";
    }

    const normalizedPhone = normalizePhoneToE164(clientPhone);
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
          To: normalizedPhone,
          From: twilioPhone,
          Body: smsBody,
        }),
      }
    );

    if (res.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS sent successfully",
          invoiceId,
          recipient: normalizedPhone,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const errBody = await res.text();
      console.error("Twilio API error:", errBody);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send SMS via Twilio",
          details: errBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending invoice SMS:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
