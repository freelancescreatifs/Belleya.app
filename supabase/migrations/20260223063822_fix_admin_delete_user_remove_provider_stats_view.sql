/*
  # Fix admin_delete_user: Remove provider_stats VIEW delete

  1. Problem
    - The function tries to DELETE FROM provider_stats, but provider_stats is a VIEW (not a table)
    - PostgreSQL raises error 55000: "Views containing GROUP BY are not automatically updatable"
    - This causes the entire delete operation to fail with a 500 error

  2. Fix
    - Recreate the function without the provider_stats DELETE line
    - provider_stats is a computed view from company_profiles, provider_follows, and provider_reviews
    - All three underlying tables are already cleaned up individually in this function
    - No data is lost by removing this line
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  DELETE FROM public.revenues WHERE user_id = target_user_id;
  DELETE FROM public.social_feed_comments WHERE user_id = target_user_id;
  DELETE FROM public.social_feed_likes WHERE user_id = target_user_id;
  DELETE FROM public.stock_items WHERE user_id = target_user_id;
  DELETE FROM public.user_documents WHERE user_id = target_user_id;
  DELETE FROM public.user_saved_inspirations WHERE user_id = target_user_id;

  DELETE FROM public.bookings WHERE pro_id = target_user_id;
  DELETE FROM public.provider_reviews WHERE provider_id = target_user_id;
  DELETE FROM public.provider_follows WHERE provider_id = target_user_id;
  -- provider_stats is a VIEW (not a table), so it cannot be deleted from.
  -- Its data comes from company_profiles, provider_follows, and provider_reviews
  -- which are already cleaned up above and below.

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
$$;
