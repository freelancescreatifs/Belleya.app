import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getPriceMap(): Record<string, string> {
  return {
    start: Deno.env.get("STRIPE_PRICE_START") || "",
    studio: Deno.env.get("STRIPE_PRICE_STUDIO") || "",
    empire: Deno.env.get("STRIPE_PRICE_EMPIRE") || "",
  };
}

const PLAN_NAMES: Record<string, string> = {
  start: "Belleya Start",
  studio: "Belleya Studio",
  empire: "Belleya Empire",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[create-checkout-session] STRIPE_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({
          error: "Configuration paiement manquante. Contactez le support.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId } = await req.json();
    const priceMap = getPriceMap();
    const validPlans = ["start", "studio", "empire"];

    if (!planId || !validPlans.includes(planId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid plan. Must be one of: start, studio, empire",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const priceId = priceMap[planId];
    if (!priceId) {
      console.error(
        `[create-checkout-session] STRIPE_PRICE_${planId.toUpperCase()} is not set`
      );
      return new Response(
        JSON.stringify({
          error: `Prix Stripe non configure pour le plan: ${planId}. Contactez le support.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "User profile or company not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_customer_id, subscription_status")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Error fetching subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let stripeCustomerId = subscription?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          company_id: profile.company_id,
        },
      });
      stripeCustomerId = customer.id;

      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", subscription.id);
      }
    }

    const origin =
      req.headers.get("origin") || req.headers.get("referer") || "";
    const baseUrl = origin.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          company_id: profile.company_id,
          plan_type: planId,
        },
      },
      metadata: {
        company_id: profile.company_id,
        plan_type: planId,
        supabase_user_id: user.id,
      },
      success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription-cancel`,
      locale: "fr",
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[create-checkout-session] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
