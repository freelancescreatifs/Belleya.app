import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { affiliate_id, user_id, subscription_id, mrr, period } = body;

    if (!affiliate_id || !user_id || !mrr) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: affiliate, error: affError } = await supabase
      .from("affiliates")
      .select("*")
      .eq("id", affiliate_id)
      .maybeSingle();

    if (affError || !affiliate) {
      return new Response(
        JSON.stringify({ error: "Affiliate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (affiliate.status === "disabled") {
      return new Response(
        JSON.stringify({ error: "Affiliate is disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    let commissionRate = Number(affiliate.base_commission_rate || 0.1);

    if (
      affiliate.temporary_commission_rate &&
      affiliate.temporary_rate_end_date &&
      new Date(affiliate.temporary_rate_end_date) > now
    ) {
      commissionRate = Number(affiliate.temporary_commission_rate);
    }

    const commissionAmount = Number(mrr) * commissionRate;
    const currentPeriod =
      period ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { error: commError } = await supabase
      .from("affiliate_commissions")
      .insert({
        affiliate_id,
        user_id,
        subscription_id: subscription_id || null,
        period: currentPeriod,
        mrr: Number(mrr),
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        amount: commissionAmount,
        status: "pending",
      });

    if (commError) {
      console.error("Commission insert error:", commError);
    }

    await supabase
      .from("affiliates")
      .update({
        last_signup_date: now.toISOString(),
        last_activity_date: now.toISOString(),
        days_since_last_signup: 0,
        total_earned: Number(affiliate.total_earned || 0) + commissionAmount,
        updated_at: now.toISOString(),
      })
      .eq("id", affiliate_id);

    const { error: notifError } = await supabase
      .from("admin_notifications")
      .insert({
        type: "affiliate_conversion",
        title: "Nouvelle conversion affiliee",
        message: `Affilie: ${affiliate.full_name || affiliate.email || "---"}\nMRR: ${Number(mrr).toFixed(2)} EUR\nCommission: ${commissionAmount.toFixed(2)} EUR (${(commissionRate * 100).toFixed(0)}%)`,
        link: `/admin`,
        is_read: false,
        priority: "normal",
        related_id: affiliate_id,
      });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
