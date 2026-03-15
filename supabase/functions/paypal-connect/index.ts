import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';
const PAYPAL_PARTNER_ID = Deno.env.get('PAYPAL_PARTNER_ID') || '';

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error(`PayPal credentials not configured (mode: ${PAYPAL_MODE}). PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required.`);
  }

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

  if (!response.ok || !data.access_token) {
    console.error('[paypal-connect] Token response:', JSON.stringify(data));
    throw new Error(`PayPal authentication failed (${response.status}): ${data.error_description || data.message || 'unknown error'}`);
  }

  console.log(`[paypal-connect] Access token obtained (mode: ${PAYPAL_MODE})`);
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('id, company_name, country')
      .eq('user_id', user.id)
      .single();

    if (!companyData) {
      return new Response(
        JSON.stringify({ error: 'Company profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    if (action === 'create' || action === 'onboard') {
      const accessToken = await getPayPalAccessToken();

      const returnUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/settings?tab=profile&paypal_return=true`;

      const partnerReferralData = {
        tracking_id: `${companyData.id}-${Date.now()}`,
        operations: [
          {
            operation: 'API_INTEGRATION',
            api_integration_preference: {
              rest_api_integration: {
                integration_method: 'PAYPAL',
                integration_type: 'THIRD_PARTY',
                third_party_details: {
                  features: ['PAYMENT', 'REFUND', 'PARTNER_FEE'],
                },
              },
            },
          },
        ],
        products: ['EXPRESS_CHECKOUT'],
        legal_consents: [
          {
            type: 'SHARE_DATA_CONSENT',
            granted: true,
          },
        ],
        partner_config_override: {
          partner_logo_url: `${req.headers.get('origin')}/logo.png`,
          return_url: returnUrl,
          return_url_description: 'Retour vers Belaya',
          action_renewal_url: returnUrl,
        },
      };

      const response = await fetch(`${PAYPAL_API_BASE}/v2/customer/partner-referrals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerReferralData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[paypal-connect] Error creating referral:', errorData);
        throw new Error('Failed to create PayPal referral');
      }

      const referralData = await response.json();

      const signupLink = referralData.links.find((link: any) => link.rel === 'action_url')?.href;

      if (!signupLink) {
        throw new Error('No signup link returned from PayPal');
      }

      await supabase
        .from('provider_payment_accounts')
        .upsert({
          company_id: companyData.id,
          provider: 'paypal',
          account_id: referralData.tracking_id || `pending-${Date.now()}`,
          status: 'pending',
          charges_enabled: false,
          payouts_enabled: false,
          metadata: {
            partner_referral_id: referralData.partner_referral_id,
            tracking_id: referralData.tracking_id,
            email: user.email,
          },
        }, { onConflict: 'company_id,provider' });

      return new Response(
        JSON.stringify({ url: signupLink }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      const { data: paymentAccount } = await supabase
        .from('provider_payment_accounts')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('provider', 'paypal')
        .single();

      if (!paymentAccount) {
        return new Response(
          JSON.stringify({ connected: false, status: 'not_connected' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = await getPayPalAccessToken();
      const merchantId = paymentAccount.metadata?.merchant_id || paymentAccount.account_id;

      if (!merchantId || merchantId.startsWith('pending-')) {
        return new Response(
          JSON.stringify({
            connected: false,
            status: 'pending',
            message: 'Onboarding not completed',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const response = await fetch(`${PAYPAL_API_BASE}/v1/customer/partners/${PAYPAL_PARTNER_ID}/merchant-integrations/${merchantId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({
              connected: true,
              status: paymentAccount.status,
              charges_enabled: paymentAccount.charges_enabled,
              message: 'Unable to fetch merchant status',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const merchantData = await response.json();

        const isActive = merchantData.payments_receivable && merchantData.primary_email_confirmed;
        const status = isActive ? 'active' : 'incomplete';

        await supabase
          .from('provider_payment_accounts')
          .update({
            status: status,
            charges_enabled: isActive,
            payouts_enabled: isActive,
            metadata: {
              ...paymentAccount.metadata,
              merchant_id: merchantData.merchant_id,
              primary_email: merchantData.primary_email,
              primary_email_confirmed: merchantData.primary_email_confirmed,
              payments_receivable: merchantData.payments_receivable,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentAccount.id);

        return new Response(
          JSON.stringify({
            connected: true,
            status: status,
            charges_enabled: isActive,
            payouts_enabled: isActive,
            merchant_id: merchantData.merchant_id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        console.error('[paypal-connect] Error fetching merchant status:', error);
        return new Response(
          JSON.stringify({
            connected: true,
            status: paymentAccount.status,
            charges_enabled: paymentAccount.charges_enabled,
            error: error.message,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[paypal-connect] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
