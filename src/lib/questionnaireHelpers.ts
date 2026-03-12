import { supabase } from './supabase';

export async function autoSendQuestionnairesOnBooking(
  bookingId: string,
  serviceId: string,
  companyId: string,
  providerUserId: string
) {
  try {
    const { data: questionnaires } = await supabase
      .from('service_questionnaires')
      .select('id, send_once_only')
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .eq('user_id', providerUserId);

    if (!questionnaires || questionnaires.length === 0) return;

    const { data: booking } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) return;

    let clientId = booking.client_id;

    if (!clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', providerUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!client) return;
      clientId = client.id;
    }

    for (const q of questionnaires) {
      if (q.send_once_only) {
        const { data: existing } = await supabase
          .from('client_questionnaire_submissions')
          .select('id')
          .eq('questionnaire_id', q.id)
          .eq('client_id', clientId)
          .limit(1);

        if (existing && existing.length > 0) continue;
      }

      await supabase
        .from('client_questionnaire_submissions')
        .insert({
          questionnaire_id: q.id,
          client_id: clientId,
          service_id: serviceId,
          company_id: companyId,
          booking_id: bookingId,
          status: 'sent',
        });
    }

    const { data: clientRecord } = await supabase
      .from('clients')
      .select('belaya_user_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientRecord?.belaya_user_id) {
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('id', companyId)
        .maybeSingle();

      if (companyProfile) {
        await supabase.from('client_notifications').insert({
          user_id: clientRecord.belaya_user_id,
          notification_type: 'questionnaire_received',
          title: 'Questionnaire a completer',
          message: 'Un questionnaire a ete envoye pour votre prochain rendez-vous. Veuillez le completer avant votre venue.',
          related_provider_id: companyProfile.id,
          related_booking_id: bookingId,
        });
      }
    }
  } catch (error) {
    console.error('[questionnaireHelpers] Error auto-sending questionnaires:', error);
  }
}
