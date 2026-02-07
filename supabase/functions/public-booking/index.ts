import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Supplement {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
}

interface BookingRequest {
  proSlug: string;
  serviceId: string;
  appointmentDate: string;
  duration: number;
  price: number;
  notes?: string;
  supplements?: Supplement[];
  clientInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const bookingData: BookingRequest = await req.json();
    const { proSlug, serviceId, appointmentDate, duration, price, notes, supplements, clientInfo } = bookingData;

    if (!proSlug || !serviceId || !appointmentDate || !clientInfo?.email || !clientInfo?.firstName || !clientInfo?.lastName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: companyProfile, error: companyError } = await supabase
      .from("company_profiles")
      .select("user_id")
      .eq("booking_slug", proSlug)
      .maybeSingle();

    if (companyError || !companyProfile) {
      return new Response(
        JSON.stringify({ error: "Professional not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const proId = companyProfile.user_id;

    let crmClientId: string;

    const { data: existingClient, error: clientSearchError } = await supabase
      .from("crm_clients")
      .select("id")
      .eq("pro_id", proId)
      .eq("email", clientInfo.email.toLowerCase())
      .maybeSingle();

    if (existingClient) {
      crmClientId = existingClient.id;

      await supabase
        .from("crm_clients")
        .update({
          first_name: clientInfo.firstName,
          last_name: clientInfo.lastName,
          phone: clientInfo.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", crmClientId);
    } else {
      const { data: newClient, error: clientCreateError } = await supabase
        .from("crm_clients")
        .insert({
          pro_id: proId,
          user_id: null,
          first_name: clientInfo.firstName,
          last_name: clientInfo.lastName,
          email: clientInfo.email.toLowerCase(),
          phone: clientInfo.phone || null,
          total_spent: 0,
          total_visits: 0,
        })
        .select("id")
        .single();

      if (clientCreateError || !newClient) {
        console.error("Error creating CRM client:", clientCreateError);
        return new Response(
          JSON.stringify({
            error: "Failed to create client record",
            details: clientCreateError?.message || "Unknown error"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      crmClientId = newClient.id;
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        client_id: null,
        pro_id: proId,
        service_id: serviceId,
        appointment_date: appointmentDate,
        duration,
        price,
        status: "pending",
        notes: notes || null,
        supplements: supplements || [],
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Error creating booking:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const appointmentDateObj = new Date(appointmentDate);
    const appointmentDateStr = appointmentDateObj.toISOString().split('T')[0];

    const { data: currentClient } = await supabase
      .from("crm_clients")
      .select("total_spent, total_visits, first_visit_date")
      .eq("id", crmClientId)
      .single();

    if (currentClient) {
      const updateData: any = {
        last_visit_date: appointmentDateStr,
        total_spent: (parseFloat(currentClient.total_spent || '0') + price).toString(),
        total_visits: (currentClient.total_visits || 0) + 1,
        updated_at: new Date().toISOString(),
      };

      if (!currentClient.first_visit_date) {
        updateData.first_visit_date = appointmentDateStr;
      }

      await supabase
        .from("crm_clients")
        .update(updateData)
        .eq("id", crmClientId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        clientId: crmClientId,
        message: "Booking created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in public-booking function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
