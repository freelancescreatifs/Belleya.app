import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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
      const { data: existingAccount } = await supabase
        .from('provider_payment_accounts')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('provider', 'stripe')
        .single();

      let accountId = existingAccount?.account_id;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: companyData.country || 'FR',
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          business_profile: {
            name: companyData.company_name,
          },
        });

        accountId = account.id;

        await supabase
          .from('provider_payment_accounts')
          .upsert({
            company_id: companyData.id,
            provider: 'stripe',
            account_id: accountId,
            status: 'pending',
            charges_enabled: false,
            payouts_enabled: false,
            metadata: { email: user.email },
          }, { onConflict: 'company_id,provider' });
      }

      const returnUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/settings?tab=profile&stripe_return=true`;
      const refreshUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/settings?tab=profile&stripe_refresh=true`;

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      await supabase
        .from('provider_payment_accounts')
        .update({
          account_link_url: accountLink.url,
          account_link_expires_at: new Date(accountLink.expires_at * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyData.id)
        .eq('provider', 'stripe');

      return new Response(
        JSON.stringify({ url: accountLink.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      const { data: paymentAccount } = await supabase
        .from('provider_payment_accounts')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('provider', 'stripe')
        .single();

      if (!paymentAccount) {
        return new Response(
          JSON.stringify({ connected: false, status: 'not_connected' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const account = await stripe.accounts.retrieve(paymentAccount.account_id);

      const status = account.charges_enabled && account.payouts_enabled ? 'active' : 'incomplete';

      await supabase
        .from('provider_payment_accounts')
        .update({
          status: status,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          capabilities: account.capabilities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentAccount.id);

      return new Response(
        JSON.stringify({
          connected: true,
          status: status,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          account_id: account.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'dashboard') {
      const { data: paymentAccount } = await supabase
        .from('provider_payment_accounts')
        .select('account_id')
        .eq('company_id', companyData.id)
        .eq('provider', 'stripe')
        .single();

      if (!paymentAccount) {
        return new Response(
          JSON.stringify({ error: 'No Stripe account connected' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const loginLink = await stripe.accounts.createLoginLink(paymentAccount.account_id);

      return new Response(
        JSON.stringify({ url: loginLink.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[stripe-connect] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
