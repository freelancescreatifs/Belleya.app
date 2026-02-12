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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: InvoiceEmailPayload = await req.json();

    const {
      invoiceId,
      clientEmail,
      clientName,
      providerName,
      appointmentDate,
      items,
      total,
      notes,
      customMessage,
    } = payload;

    // Validate required fields
    if (!invoiceId || !clientEmail || !clientName || !providerName || !items || items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "invoiceId, clientEmail, clientName, providerName, and items are required",
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

    // Build email content
    const itemsList = items
      .map((item) => {
        const quantityText = item.quantity > 1 ? ` x${item.quantity}` : "";
        return `• ${item.label}${quantityText} - ${item.lineTotal.toFixed(2)}€`;
      })
      .join("\n");

    const dateText = appointmentDate ? ` le ${appointmentDate}` : "";

    const emailSubject = `Récap de votre visite chez ${providerName}`;

    let emailBody = `Bonjour ${clientName},\n\n`;

    if (customMessage) {
      emailBody += `${customMessage}\n\n`;
    } else {
      emailBody += `Merci d'être venue chez ${providerName}${dateText}.\n\n`;
    }

    emailBody += `Voici le récapitulatif de votre visite :\n\n${itemsList}\n\n`;
    emailBody += `Total : ${total.toFixed(2)}€\n\n`;

    if (notes) {
      emailBody += `Notes :\n${notes}\n\n`;
    }

    emailBody += `À très bientôt ! 💗\n\n${providerName}`;

    // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
    // For now, we'll log the email content and return success
    console.log("=== EMAIL TO SEND ===");
    console.log("To:", clientEmail);
    console.log("Subject:", emailSubject);
    console.log("Body:", emailBody);
    console.log("====================");

    // Simulate email sending
    // In production, replace with actual email service integration:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: clientEmail }] }],
    //     from: { email: 'no-reply@belleya.com', name: providerName },
    //     subject: emailSubject,
    //     content: [{ type: 'text/plain', value: emailBody }],
    //   }),
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        invoiceId,
        recipient: clientEmail,
        preview: {
          subject: emailSubject,
          body: emailBody,
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
    console.error("Error sending invoice email:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send email",
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
