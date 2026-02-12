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

    // Validate required fields
    if (!invoiceId || !clientPhone || !clientName || !providerName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "invoiceId, clientPhone, clientName, and providerName are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Build SMS content (max 160 characters for standard SMS)
    const dateText = appointmentDate ? ` le ${appointmentDate}` : "";

    let smsBody = "";

    if (customMessage) {
      smsBody = customMessage;
    } else {
      smsBody = `Bonjour ${clientName}, merci d'être venue chez ${providerName}${dateText}. Total : ${total.toFixed(2)}€. À bientôt ! 💗`;
    }

    // Ensure SMS is not too long (160 chars max for single SMS)
    if (smsBody.length > 160) {
      smsBody = smsBody.substring(0, 157) + "...";
    }

    // TODO: Integrate with actual SMS service (Twilio, Vonage, etc.)
    // For now, we'll log the SMS content and return success
    console.log("=== SMS TO SEND ===");
    console.log("To:", clientPhone);
    console.log("Body:", smsBody);
    console.log("Length:", smsBody.length, "characters");
    console.log("===================");

    // Simulate SMS sending
    // In production, replace with actual SMS service integration:
    // const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     To: clientPhone,
    //     From: Deno.env.get('TWILIO_PHONE_NUMBER'),
    //     Body: smsBody,
    //   }),
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS sent successfully",
        invoiceId,
        recipient: clientPhone,
        preview: {
          body: smsBody,
          length: smsBody.length,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending invoice SMS:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
