/*
  # Fix notifications_type_check constraint for affiliate applications

  1. Changes
    - Updates the `notifications_type_check` constraint on the `notifications` table
    - Adds `affiliate_application` as an allowed notification type
    - Preserves all existing allowed values

  2. Context
    - The `notify_admins_new_affiliate_application` trigger inserts notifications
      with type `affiliate_application`, but the check constraint did not include it
    - This caused a constraint violation error when submitting an affiliate application

  3. Allowed values after migration
    - booking_request, booking_confirmed, booking_rejected, booking_completed,
      booking_cancelled, info, reminder, affiliate_application
*/

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'booking_request'::text,
    'booking_confirmed'::text,
    'booking_rejected'::text,
    'booking_completed'::text,
    'booking_cancelled'::text,
    'info'::text,
    'reminder'::text,
    'affiliate_application'::text
  ]));
