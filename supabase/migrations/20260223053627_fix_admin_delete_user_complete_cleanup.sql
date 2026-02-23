/*
  # Fix admin_delete_user: Complete Cleanup of All Related Tables

  1. Problem
    - The previous version of admin_delete_user only cleaned ~25 tables
    - Many tables with user_id references were not cleaned up
    - bookings table has a RESTRICT FK on services.id, causing deletion failures
    - monthly_competitions has NO ACTION FK on affiliates.id

  2. Changes
    - Added cleanup for all missing user_id-based tables
    - Added cleanup for bookings (before services, due to RESTRICT FK)
    - Added cleanup for monthly_competitions (before affiliates)
    - Added cleanup for invoice_sends (before invoices)
    - Added cleanup for provider_reviews, provider_follows, provider_stats
    - Proper ordering: child tables deleted before parent tables

  3. Tables Added (user_id based)
    - alerts, appointments, calendar_integrations, client_loyalty, client_services,
      client_services_history, collaborators, content_alerts, content_comments,
      content_ideas, content_likes, content_view_preferences, crm_clients,
      editorial_pillars, email_templates, expenses, future_purchases, goals,
      hygiene_checklists, hygiene_protocols, inspiration, invoice_sends, invoices,
      marketing_campaigns, marketing_sends, marketing_templates, marronniers,
      menu_preferences, partner_signups, partners, partnership_sales, partnerships,
      prestations, production_defaults, public_provider_profiles, revenues,
      service_supplements, social_feed_comments, social_feed_likes, stock_items,
      user_documents, user_saved_inspirations

  4. Tables Added (provider_id / pro_id based)
    - bookings, monthly_competitions, affiliates, affiliate_applications,
      affiliate_codes, affiliate_commissions, affiliate_signups,
      provider_follows, provider_reviews, provider_stats

  5. Security
    - No changes to security model (still requires admin role)
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.user_profiles
  WHERE user_id = target_user_id;

  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.pro_profiles WHERE user_id = target_user_id;

  DELETE FROM public.alerts WHERE user_id = target_user_id;
  DELETE FROM public.appointments WHERE user_id = target_user_id;
  DELETE FROM public.calendar_integrations WHERE user_id = target_user_id;
  DELETE FROM public.client_loyalty WHERE user_id = target_user_id;
  DELETE FROM public.client_services WHERE user_id = target_user_id;
  DELETE FROM public.client_services_history WHERE user_id = target_user_id;
  DELETE FROM public.collaborators WHERE user_id = target_user_id;
  DELETE FROM public.content_alerts WHERE user_id = target_user_id;
  DELETE FROM public.content_comments WHERE user_id = target_user_id;
  DELETE FROM public.content_ideas WHERE user_id = target_user_id;
  DELETE FROM public.content_likes WHERE user_id = target_user_id;
  DELETE FROM public.content_view_preferences WHERE user_id = target_user_id;
  DELETE FROM public.crm_clients WHERE user_id = target_user_id;
  DELETE FROM public.editorial_pillars WHERE user_id = target_user_id;
  DELETE FROM public.email_templates WHERE user_id = target_user_id;
  DELETE FROM public.expenses WHERE user_id = target_user_id;
  DELETE FROM public.future_purchases WHERE user_id = target_user_id;
  DELETE FROM public.goals WHERE user_id = target_user_id;
  DELETE FROM public.hygiene_checklists WHERE user_id = target_user_id;
  DELETE FROM public.hygiene_protocols WHERE user_id = target_user_id;
  DELETE FROM public.inspiration WHERE user_id = target_user_id;
  DELETE FROM public.invoice_sends WHERE provider_id = target_user_id;
  DELETE FROM public.invoices WHERE provider_id = target_user_id;
  DELETE FROM public.marketing_campaigns WHERE user_id = target_user_id;
  DELETE FROM public.marketing_sends WHERE user_id = target_user_id;
  DELETE FROM public.marketing_templates WHERE user_id = target_user_id;
  DELETE FROM public.marronniers WHERE user_id = target_user_id;
  DELETE FROM public.menu_preferences WHERE user_id = target_user_id;
  DELETE FROM public.partner_signups WHERE user_id = target_user_id;
  DELETE FROM public.partners WHERE user_id = target_user_id;
  DELETE FROM public.partnership_sales WHERE user_id = target_user_id;
  DELETE FROM public.partnerships WHERE user_id = target_user_id;
  DELETE FROM public.prestations WHERE user_id = target_user_id;
  DELETE FROM public.production_defaults WHERE user_id = target_user_id;
  DELETE FROM public.public_provider_profiles WHERE user_id = target_user_id;
  DELETE FROM public.revenues WHERE user_id = target_user_id;
  DELETE FROM public.social_feed_comments WHERE user_id = target_user_id;
  DELETE FROM public.social_feed_likes WHERE user_id = target_user_id;
  DELETE FROM public.stock_items WHERE user_id = target_user_id;
  DELETE FROM public.user_documents WHERE user_id = target_user_id;
  DELETE FROM public.user_saved_inspirations WHERE user_id = target_user_id;

  -- bookings must be deleted BEFORE services (RESTRICT FK on service_id)
  DELETE FROM public.bookings WHERE pro_id = target_user_id;
  DELETE FROM public.provider_reviews WHERE provider_id = target_user_id;
  DELETE FROM public.provider_follows WHERE provider_id = target_user_id;
  DELETE FROM public.provider_stats WHERE provider_id = target_user_id;

  -- monthly_competitions must be deleted BEFORE affiliates (NO ACTION FK)
  DELETE FROM public.monthly_competitions WHERE affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = target_user_id
  );
  DELETE FROM public.affiliate_commissions WHERE user_id = target_user_id;
  DELETE FROM public.affiliate_signups WHERE user_id = target_user_id;
  DELETE FROM public.affiliate_codes WHERE user_id = target_user_id;
  DELETE FROM public.affiliate_applications WHERE user_id = target_user_id;
  DELETE FROM public.affiliates WHERE user_id = target_user_id;

  DELETE FROM public.service_supplements WHERE user_id = target_user_id;
  DELETE FROM public.services WHERE user_id = target_user_id;

  IF v_company_id IS NOT NULL THEN
    DELETE FROM public.belleya_rewards_submissions WHERE provider_id = v_company_id;
    DELETE FROM public.booking_payments WHERE company_id = v_company_id;
    DELETE FROM public.client_inspirations WHERE company_id = v_company_id;
    DELETE FROM public.client_notifications WHERE related_provider_id = v_company_id;
    DELETE FROM public.client_results_photos WHERE company_id = v_company_id;
    DELETE FROM public.clients WHERE company_id = v_company_id;
    DELETE FROM public.company_inspirations WHERE company_id = v_company_id;
    DELETE FROM public.content_calendar WHERE company_id = v_company_id;
    DELETE FROM public.content_settings WHERE company_id = v_company_id;
    DELETE FROM public.custom_client_fields WHERE company_id = v_company_id;
    DELETE FROM public.events WHERE company_id = v_company_id;
    DELETE FROM public.inspiration_groups WHERE company_id = v_company_id;
    DELETE FROM public.landing_reviews WHERE provider_id = v_company_id;
    DELETE FROM public.notifications WHERE company_id = v_company_id;
    DELETE FROM public.projects WHERE company_id = v_company_id;
    DELETE FROM public.provider_payment_accounts WHERE company_id = v_company_id;
    DELETE FROM public.social_feed WHERE company_id = v_company_id;
    DELETE FROM public.students WHERE company_id = v_company_id;
    DELETE FROM public.subprojects WHERE company_id = v_company_id;
    DELETE FROM public.subscriptions WHERE company_id = v_company_id;
    DELETE FROM public.tasks WHERE company_id = v_company_id;
    DELETE FROM public.training_programs WHERE company_id = v_company_id;
    DELETE FROM public.partner_signups WHERE company_id = v_company_id;
    DELETE FROM public.partners WHERE company_id = v_company_id;
  END IF;

  DELETE FROM public.user_profiles WHERE user_id = target_user_id;

  IF v_company_id IS NOT NULL THEN
    DELETE FROM public.company_profiles WHERE id = v_company_id;
  END IF;

  RETURN true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
