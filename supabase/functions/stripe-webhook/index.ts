import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req: Request) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[stripe-webhook] Signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingLog } = await supabase
      .from('payment_webhooks_log')
      .select('id')
      .eq('provider', 'stripe')
      .eq('event_id', event.id)
      .single();

    if (existingLog) {
      console.log('[stripe-webhook] Event already processed:', event.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await supabase
      .from('payment_webhooks_log')
      .insert({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        payload: event as any,
        processed: false,
      });

    console.log('[stripe-webhook] Processing event:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const { data: payment, error: paymentError } = await supabase
        .from('booking_payments')
        .select('id, booking_id')
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (paymentError || !payment) {
        console.error('[stripe-webhook] Payment not found:', paymentIntent.id);
        await supabase
          .from('payment_webhooks_log')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: 'Payment not found in database',
          })
          .eq('event_id', event.id);

        return new Response(JSON.stringify({ received: true, error: 'Payment not found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await supabase
        .from('booking_payments')
        .update({
          status: 'paid',
          payment_method: paymentIntent.payment_method_types[0] || 'card',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      console.log('[stripe-webhook] Payment marked as paid:', payment.id);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const { data: payment } = await supabase
        .from('booking_payments')
        .select('id')
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (payment) {
        await supabase
          .from('booking_payments')
          .update({
            status: 'failed',
            error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        console.log('[stripe-webhook] Payment marked as failed:', payment.id);
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;

      const { data: payment } = await supabase
        .from('booking_payments')
        .select('id')
        .eq('payment_intent_id', charge.payment_intent as string)
        .single();

      if (payment) {
        const refundStatus = charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded';

        await supabase
          .from('booking_payments')
          .update({
            status: refundStatus,
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              refund_amount: charge.amount_refunded / 100,
              refund_reason: charge.refunds?.data[0]?.reason || 'unknown',
            },
          })
          .eq('id', payment.id);

        console.log('[stripe-webhook] Payment marked as refunded:', payment.id);
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription' && session.metadata?.company_id) {
        const companyId = session.metadata.company_id;
        const planType = session.metadata.plan_type || 'start';
        const stripeSubscriptionId = session.subscription as string;
        const stripeCustomerId = session.customer as string;

        await supabase
          .from('subscriptions')
          .update({
            subscription_status: 'active',
            payment_provider: 'stripe',
            payment_provider_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
            plan_type: planType,
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId);

        console.log('[stripe-webhook] Subscription activated for company:', companyId, 'plan:', planType);
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('payment_provider_subscription_id', subscriptionId)
          .maybeSingle();

        if (sub) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          const endDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

          await supabase
            .from('subscriptions')
            .update({
              subscription_status: 'active',
              ...(endDate ? { subscription_end_date: endDate } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          console.log('[stripe-webhook] Invoice paid for subscription:', subscriptionId);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('payment_provider_subscription_id', subscriptionId)
          .maybeSingle();

        if (sub) {
          await supabase
            .from('subscriptions')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          console.log('[stripe-webhook] Invoice payment failed for subscription:', subscriptionId);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('payment_provider_subscription_id', subscription.id)
        .maybeSingle();

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            subscription_status: 'cancelled',
            subscription_end_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        console.log('[stripe-webhook] Subscription cancelled:', subscription.id);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('payment_provider_subscription_id', subscription.id)
        .maybeSingle();

      if (sub) {
        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'past_due',
          trialing: 'trial',
        };
        const mappedStatus = statusMap[subscription.status] || 'active';

        await supabase
          .from('subscriptions')
          .update({
            subscription_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        console.log('[stripe-webhook] Subscription updated:', subscription.id, 'status:', mappedStatus);
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;

      const { data: paymentAccount } = await supabase
        .from('provider_payment_accounts')
        .select('id')
        .eq('account_id', account.id)
        .eq('provider', 'stripe')
        .single();

      if (paymentAccount) {
        const status = account.charges_enabled && account.payouts_enabled ? 'active' : 'incomplete';

        await supabase
          .from('provider_payment_accounts')
          .update({
            status: status,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            capabilities: account.capabilities as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentAccount.id);

        console.log('[stripe-webhook] Account updated:', account.id, 'status:', status);
      }
    }

    await supabase
      .from('payment_webhooks_log')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[stripe-webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
