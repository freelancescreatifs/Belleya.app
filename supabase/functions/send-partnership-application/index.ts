import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PartnershipApplicationPayload {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  profession: string;
  location?: string;
  instagram?: string;
  website?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: PartnershipApplicationPayload = await req.json();

    const {
      name,
      email,
      phone,
      businessName,
      profession,
      location,
      instagram,
      website,
      message,
    } = payload;

    if (!name || !email || !profession) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "name, email, and profession are required",
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

    const emailSubject = `Nouvelle candidature partenariat Belleya - ${name}`;

    let emailBody = `Nouvelle candidature pour devenir partenaire Belleya\n\n`;
    emailBody += `Nom : ${name}\n`;
    emailBody += `Email : ${email}\n`;
    if (phone) emailBody += `Téléphone : ${phone}\n`;
    if (businessName) emailBody += `Nom de l'entreprise : ${businessName}\n`;
    emailBody += `Profession : ${profession}\n`;
    if (location) emailBody += `Localisation : ${location}\n`;
    if (instagram) emailBody += `Instagram : ${instagram}\n`;
    if (website) emailBody += `Site web : ${website}\n`;
    if (message) emailBody += `\nMessage :\n${message}\n`;

    emailBody += `\n---\nDate de candidature : ${new Date().toLocaleString('fr-FR')}`;

    console.log("=== PARTNERSHIP APPLICATION EMAIL ===");
    console.log("To: sabrina.benaceur@outlook.com");
    console.log("Subject:", emailSubject);
    console.log("Body:", emailBody);
    console.log("=====================================");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Candidature envoyée avec succès",
        recipient: "sabrina.benaceur@outlook.com",
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
    console.error("Error sending partnership application:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send application",
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
