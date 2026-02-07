/*
  # Fix Security and Performance Issues - Part 1: Foreign Key Indexes
  
  This migration addresses critical performance issues by adding missing indexes
  on foreign key columns. Unindexed foreign keys can cause severe query performance
  degradation, especially for joins and cascade operations.
  
  ## Changes
  
  1. **Add Missing Foreign Key Indexes**
     - alerts: user_id
     - appointments: prestation_id
     - booking_payments: client_id
     - bookings: service_id
     - client_inspirations: uploaded_by
     - client_notifications: related_booking_id, related_content_id, related_provider_id
     - client_results_photos: service_id, uploaded_by
     - events: client_id, service_id
     - marketing_campaigns: template_id
     - marketing_sends: template_id
     - marronniers: user_id
     - notifications: booking_id
     - provider_reviews: booking_id
     - revenues: client_id
     - social_feed: client_id, company_id
     - student_trainings: training_program_id
     - tasks: collaborator_id
     - user_saved_inspirations: inspiration_id
  
  2. **Remove Duplicate Indexes**
     - clients: Drop idx_clients_user_archived (duplicate of idx_clients_user_id_is_archived)
     - content_likes: Drop idx_content_likes_user (duplicate of content_likes_user_idx)
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_prestation_id ON public.appointments(prestation_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_client_id ON public.booking_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_client_inspirations_uploaded_by ON public.client_inspirations(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_client_notifications_related_booking_id ON public.client_notifications(related_booking_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_related_content_id ON public.client_notifications(related_content_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_related_provider_id ON public.client_notifications(related_provider_id);
CREATE INDEX IF NOT EXISTS idx_client_results_photos_service_id ON public.client_results_photos(service_id);
CREATE INDEX IF NOT EXISTS idx_client_results_photos_uploaded_by ON public.client_results_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_service_id ON public.events(service_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_template_id ON public.marketing_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_template_id ON public.marketing_sends(template_id);
CREATE INDEX IF NOT EXISTS idx_marronniers_user_id ON public.marronniers(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON public.notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_booking_id ON public.provider_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_revenues_client_id ON public.revenues(client_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_client_id ON public.social_feed(client_id);
CREATE INDEX IF NOT EXISTS idx_social_feed_company_id ON public.social_feed(company_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_training_program_id ON public.student_trainings(training_program_id);
CREATE INDEX IF NOT EXISTS idx_tasks_collaborator_id ON public.tasks(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_inspirations_inspiration_id ON public.user_saved_inspirations(inspiration_id);

-- Remove duplicate indexes
DROP INDEX IF EXISTS public.idx_clients_user_archived;
DROP INDEX IF EXISTS public.idx_content_likes_user;
