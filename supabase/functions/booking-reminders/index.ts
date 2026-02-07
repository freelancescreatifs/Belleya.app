import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Booking {
  id: string;
  client_id: string;
  pro_id: string;
  appointment_date: string;
  service_id: string;
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, client_id, pro_id, appointment_date, service_id")
      .in("status", ["pending", "confirmed"])
      .gte("appointment_date", tomorrow.toISOString())
      .lt("appointment_date", dayAfterTomorrow.toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No bookings to remind", count: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let remindersCreated = 0;

    for (const booking of bookings as Booking[]) {
      const { data: existingReminder } = await supabase
        .from("client_notifications")
        .select("id")
        .eq("related_booking_id", booking.id)
        .eq("notification_type", "booking_reminder")
        .maybeSingle();

      if (existingReminder) {
        continue;
      }

      const { data: serviceData } = await supabase
        .from("services")
        .select("name")
        .eq("id", booking.service_id)
        .maybeSingle();

      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("id, company_name")
        .eq("user_id", booking.pro_id)
        .maybeSingle();

      const appointmentDate = new Date(booking.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const formattedTime = appointmentDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const { error: notificationError } = await supabase
        .from("client_notifications")
        .insert({
          user_id: booking.client_id,
          notification_type: "booking_reminder",
          title: "Rappel de rendez-vous",
          message: `N'oubliez pas votre rendez-vous ${serviceData?.name || ""}  ${formattedDate} à ${formattedTime} avec ${companyData?.company_name || "votre professionnel"}.`,
          related_booking_id: booking.id,
          related_provider_id: companyData?.id,
        });

      if (!notificationError) {
        remindersCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed successfully",
        bookings_checked: bookings.length,
        reminders_created: remindersCreated,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing reminders:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
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
