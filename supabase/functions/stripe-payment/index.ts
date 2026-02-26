import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PLATFORM_COMMISSION_RATE = 0.015;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, clientEmail, clientName } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'bookingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        company:company_profiles!inner(id, company_name, deposit_amount, deposit_required, deposit_fee_payer),
        service:services(name, price)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!booking.company.deposit_required) {
      return new Response(
        JSON.stringify({ error: 'Deposit not required for this booking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: paymentAccount } = await supabase
      .from('provider_payment_accounts')
      .select('*')
      .eq('company_id', booking.company.id)
      .eq('provider', 'stripe')
      .eq('status', 'active')
      .single();

    if (!paymentAccount || !paymentAccount.charges_enabled) {
      return new Response(
        JSON.stringify({ error: 'Provider has not configured payment processing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const depositAmount = booking.company.deposit_amount || 20;
    const feePayerIsClient = booking.company.deposit_fee_payer === 'client';
    const commissionOnDeposit = depositAmount * PLATFORM_COMMISSION_RATE;

    const chargedAmount = feePayerIsClient
      ? Math.round((depositAmount + commissionOnDeposit) * 100)
      : Math.round(depositAmount * 100);

    const applicationFeeAmount = Math.round(commissionOnDeposit * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargedAmount,
      currency: 'eur',
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: paymentAccount.account_id,
      },
      metadata: {
        booking_id: bookingId,
        company_id: booking.company.id,
        service_name: booking.service?.name || 'Service',
        fee_payer: feePayerIsClient ? 'client' : 'provider',
      },
      description: `Acompte pour ${booking.service?.name || 'réservation'} - ${booking.company.company_name}`,
      receipt_email: clientEmail,
    });

    await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        company_id: booking.company.id,
        client_id: booking.client_id,
        provider: 'stripe',
        payment_intent_id: paymentIntent.id,
        amount: depositAmount,
        currency: 'EUR',
        status: 'pending',
        platform_commission: commissionOnDeposit,
        commission_rate: PLATFORM_COMMISSION_RATE,
        metadata: {
          client_email: clientEmail,
          client_name: clientName,
          service_name: booking.service?.name,
          fee_payer: feePayerIsClient ? 'client' : 'provider',
          charged_amount: chargedAmount / 100,
        },
      });

    await supabase
      .from('bookings')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: chargedAmount / 100,
        depositAmount,
        commission: feePayerIsClient ? commissionOnDeposit : 0,
        feePayerIsClient,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[stripe-payment] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
