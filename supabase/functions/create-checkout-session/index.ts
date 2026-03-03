import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_CONFIG: Record<string, { name: string; amount: number; lookupKey: string }> = {
  start: { name: "Belaya Start", amount: 2900, lookupKey: "belaya_start_monthly" },
  studio: { name: "Belaya Studio", amount: 3900, lookupKey: "belaya_studio_monthly" },
  empire: { name: "Belaya Empire", amount: 5900, lookupKey: "belaya_empire_monthly" },
};

const VALID_PLANS = Object.keys(PLAN_CONFIG);

async function getOrCreatePrice(stripe: Stripe, planId: string): Promise<string> {
  const config = PLAN_CONFIG[planId];

  const existing = await stripe.prices.list({
    lookup_keys: [config.lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  let product = products.data.find(
    (p) => p.metadata?.belaya_plan === planId
  );

  if (!product) {
    product = await stripe.products.create({
      name: config.name,
      metadata: { belaya_plan: planId },
    });
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: config.amount,
    currency: "eur",
    recurring: { interval: "month" },
    lookup_key: config.lookupKey,
    metadata: { belaya_plan: planId },
  });

  return price.id;
}

async function getCompanyId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxRetries = 8
): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const { data } = await supabase
      .from("user_profiles")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.company_id) return data.company_id;

    const { data: cp } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cp?.id) {
      await supabase
        .from("user_profiles")
        .update({ company_id: cp.id })
        .eq("user_id", userId);
      return cp.id;
    }

    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  if (authUser?.user) {
    const meta = authUser.user.user_metadata || {};
    const companyName =
      [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
      authUser.user.email?.split("@")[0] ||
      "Mon Entreprise";

    const { data: newCp } = await supabase
      .from("company_profiles")
      .insert({
        user_id: userId,
        company_name: companyName,
        activity_type: "onglerie",
        creation_date: new Date().toISOString().split("T")[0],
        country: "France",
        legal_status: "MICRO",
        vat_mode: "VAT_FRANCHISE",
        acre: false,
        versement_liberatoire: false,
      })
      .select("id")
      .maybeSingle();

    if (newCp?.id) {
      await supabase
        .from("user_profiles")
        .update({ company_id: newCp.id })
        .eq("user_id", userId);
      return newCp.id;
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
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

    if (!planId || !VALID_PLANS.includes(planId)) {
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

    const companyId = await getCompanyId(supabase, user.id);

    if (!companyId) {
      return new Response(
        JSON.stringify({
          error:
            "Votre profil entreprise est en cours de creation. Veuillez reessayer dans quelques secondes.",
          retry: true,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const priceId = await getOrCreatePrice(stripe, planId);

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_customer_id, subscription_status")
      .eq("company_id", companyId)
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
          company_id: companyId,
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
          company_id: companyId,
          plan_type: planId,
        },
      },
      metadata: {
        company_id: companyId,
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
