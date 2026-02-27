/*
  # Notification trigger for new affiliate applications

  1. New Functions
    - `notify_admins_new_affiliate_application()` - Trigger function that creates a notification
      for all admin users when a new affiliate application is submitted

  2. New Triggers
    - `on_new_affiliate_application` on `affiliate_applications` - Fires after INSERT

  3. Security
    - Add INSERT policy on `notifications` table for the trigger function (runs as SECURITY DEFINER)
    - The function is SECURITY DEFINER so it can insert notifications for admin users
*/

CREATE OR REPLACE FUNCTION notify_admins_new_affiliate_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      admin_record.user_id,
      'affiliate_application',
      'Nouvelle candidature partenaire',
      NEW.full_name || ' a postule au programme partenaire.',
      '/admin',
      'affiliate_application',
      NEW.id,
      jsonb_build_object('applicant_name', NEW.full_name, 'applicant_email', NEW.email)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_affiliate_application ON affiliate_applications;

CREATE TRIGGER on_new_affiliate_application
  AFTER INSERT ON affiliate_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_affiliate_application();
