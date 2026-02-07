import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID') || '';

Deno.serve(async (req: Request) => {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const eventId = event.id;

    if (!eventId) {
      return new Response('No event ID', { status: 400 });
    }

    const { data: existingLog } = await supabase
      .from('payment_webhooks_log')
      .select('id')
      .eq('provider', 'paypal')
      .eq('event_id', eventId)
      .single();

    if (existingLog) {
      console.log('[paypal-webhook] Event already processed:', eventId);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await supabase
      .from('payment_webhooks_log')
      .insert({
        provider: 'paypal',
        event_id: eventId,
        event_type: event.event_type,
        payload: event,
        processed: false,
      });

    console.log('[paypal-webhook] Processing event:', event.event_type);

    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = event.resource?.id;

      if (orderId) {
        const { data: payment } = await supabase
          .from('booking_payments')
          .select('id')
          .eq('payment_intent_id', orderId)
          .single();

        if (payment) {
          await supabase
            .from('booking_payments')
            .update({
              status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          console.log('[paypal-webhook] Order approved:', orderId);
        }
      }
    }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource?.id;
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
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
                capture_id: captureId,
                payer_email: event.resource?.payer?.email_address,
              },
            })
            .eq('id', payment.id);

          console.log('[paypal-webhook] Payment captured:', captureId);
        }
      }
    }

    if (event.event_type === 'PAYMENT.CAPTURE.DENIED' || event.event_type === 'CHECKOUT.ORDER.VOIDED') {
      const orderId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        const { data: payment } = await supabase
          .from('booking_payments')
          .select('id')
          .eq('payment_intent_id', orderId)
          .single();

        if (payment) {
          await supabase
            .from('booking_payments')
            .update({
              status: 'failed',
              error_message: event.summary || 'Payment denied or voided',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          console.log('[paypal-webhook] Payment failed:', orderId);
        }
      }
    }

    if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      const refundAmount = parseFloat(event.resource?.amount?.value || '0');
      const captureId = event.resource?.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop();

      if (captureId) {
        const { data: payment } = await supabase
          .from('booking_payments')
          .select('id, amount, metadata')
          .eq('metadata->>capture_id', captureId)
          .single();

        if (payment) {
          const isFullRefund = refundAmount >= payment.amount;
          const refundStatus = isFullRefund ? 'refunded' : 'partially_refunded';

          await supabase
            .from('booking_payments')
            .update({
              status: refundStatus,
              refunded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {
                ...payment.metadata,
                refund_amount: refundAmount,
                refund_id: event.resource?.id,
              },
            })
            .eq('id', payment.id);

          console.log('[paypal-webhook] Payment refunded:', captureId);
        }
      }
    }

    if (event.event_type === 'MERCHANT.ONBOARDING.COMPLETED') {
      const merchantId = event.resource?.merchant_id;

      if (merchantId) {
        const { data: paymentAccount } = await supabase
          .from('provider_payment_accounts')
          .select('id, metadata')
          .eq('provider', 'paypal')
          .eq('metadata->>tracking_id', event.resource?.tracking_id)
          .single();

        if (paymentAccount) {
          await supabase
            .from('provider_payment_accounts')
            .update({
              account_id: merchantId,
              status: 'active',
              charges_enabled: true,
              payouts_enabled: true,
              metadata: {
                ...paymentAccount.metadata,
                merchant_id: merchantId,
                onboarding_completed_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentAccount.id);

          console.log('[paypal-webhook] Merchant onboarding completed:', merchantId);
        }
      }
    }

    await supabase
      .from('payment_webhooks_log')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[paypal-webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
