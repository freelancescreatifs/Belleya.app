import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PAYPAL_API_BASE = Deno.env.get('PAYPAL_MODE') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

async function getPayPalAccessToken() {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    if (action === 'create') {
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
          company:company_profiles!inner(id, company_name, deposit_amount, deposit_required),
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
        .eq('provider', 'paypal')
        .eq('status', 'active')
        .single();

      if (!paymentAccount || !paymentAccount.charges_enabled) {
        return new Response(
          JSON.stringify({ error: 'Provider has not configured PayPal payment processing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const merchantId = paymentAccount.metadata?.merchant_id || paymentAccount.account_id;

      const amount = (booking.company.deposit_amount || 20).toFixed(2);
      const platformFee = (parseFloat(amount) * 0.05).toFixed(2);

      const accessToken = await getPayPalAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: bookingId,
            description: `Acompte - ${booking.service?.name || 'Réservation'}`,
            custom_id: bookingId,
            soft_descriptor: booking.company.company_name.substring(0, 22),
            amount: {
              currency_code: 'EUR',
              value: amount,
              breakdown: {
                item_total: {
                  currency_code: 'EUR',
                  value: amount,
                },
              },
            },
            items: [
              {
                name: booking.service?.name || 'Réservation',
                description: `Acompte pour ${booking.service?.name || 'réservation'}`,
                unit_amount: {
                  currency_code: 'EUR',
                  value: amount,
                },
                quantity: '1',
                category: 'DIGITAL_GOODS',
              },
            ],
            payee: {
              merchant_id: merchantId,
            },
            payment_instruction: {
              disbursement_mode: 'INSTANT',
              platform_fees: [
                {
                  amount: {
                    currency_code: 'EUR',
                    value: platformFee,
                  },
                },
              ],
            },
          },
        ],
        application_context: {
          brand_name: booking.company.company_name,
          locale: 'fr-FR',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${req.headers.get('origin')}/booking-success?booking_id=${bookingId}`,
          cancel_url: `${req.headers.get('origin')}/booking-cancel?booking_id=${bookingId}`,
        },
      };

      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `${bookingId}-${Date.now()}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[paypal-payment] Error creating order:', errorData);
        throw new Error('Failed to create PayPal order');
      }

      const order = await response.json();

      await supabase
        .from('booking_payments')
        .insert({
          booking_id: bookingId,
          company_id: booking.company.id,
          client_id: booking.client_id,
          provider: 'paypal',
          payment_intent_id: order.id,
          amount: parseFloat(amount),
          currency: 'EUR',
          status: 'pending',
          metadata: {
            client_email: clientEmail,
            client_name: clientName,
            service_name: booking.service?.name,
            order_id: order.id,
          },
        });

      await supabase
        .from('bookings')
        .update({
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      const approveLink = order.links.find((link: any) => link.rel === 'approve')?.href;

      return new Response(
        JSON.stringify({
          orderId: order.id,
          approveLink: approveLink,
          amount: amount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'capture') {
      const { orderId } = await req.json();

      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'orderId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getPayPalAccessToken();

      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[paypal-payment] Error capturing order:', errorData);
        throw new Error('Failed to capture PayPal order');
      }

      const captureData = await response.json();

      const { data: payment } = await supabase
        .from('booking_payments')
        .select('id, booking_id')
        .eq('payment_intent_id', orderId)
        .single();

      if (payment) {
        await supabase
          .from('booking_payments')
          .update({
            status: 'paid',
            payment_method: 'paypal',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              capture_id: captureData.purchase_units[0]?.payments?.captures[0]?.id,
              payer_email: captureData.payer?.email_address,
            },
          })
          .eq('id', payment.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          captureId: captureData.id,
          status: captureData.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[paypal-payment] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
