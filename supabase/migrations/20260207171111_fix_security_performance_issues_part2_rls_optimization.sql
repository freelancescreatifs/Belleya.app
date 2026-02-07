/*
  # Fix Security and Performance Issues - Part 2: RLS Policy Optimization
  
  This migration optimizes Row Level Security policies by wrapping auth.uid() 
  calls in SELECT statements. Without this, auth.uid() is re-evaluated for each 
  row, causing severe performance degradation at scale.
  
  ## Changes
  
  1. **Optimize RLS Policies** - Replace auth.uid() with (SELECT auth.uid())
     - profiles table policies
     - client_services_history table policies
     - revenues table policies
     - expenses table policies
     - stock_items table policies
     - future_purchases table policies
     - content_ideas table policies
     - inspiration table policies
     - hygiene_checklists table policies
     - email_templates table policies
     - hygiene_protocols table policies
     - menu_preferences table policies
     - tasks table policies
     - goals table policies
     - collaborators table policies
     - prestations table policies
     - client_loyalty table policies
     - appointments table policies
     - alerts table policies
     - services table policies
     - client_services table policies
     - calendar_integrations table policies
     - user_profiles table policies
     - pro_profiles table policies
     - favorites table policies
     - reviews table policies
     - crm_clients table policies
     - notifications table policies
     
  This is a large migration - implementing the most critical tables first.
*/

-- profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

-- client_services_history table
DROP POLICY IF EXISTS "Users can delete own service history" ON public.client_services_history;
DROP POLICY IF EXISTS "Users can insert own service history" ON public.client_services_history;
DROP POLICY IF EXISTS "Users can update own service history" ON public.client_services_history;
DROP POLICY IF EXISTS "Users can view own service history" ON public.client_services_history;

CREATE POLICY "Users can delete own service history" ON public.client_services_history
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own service history" ON public.client_services_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own service history" ON public.client_services_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own service history" ON public.client_services_history
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- revenues table
DROP POLICY IF EXISTS "Users can delete own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can insert own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can update own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can view own revenues" ON public.revenues;

CREATE POLICY "Users can delete own revenues" ON public.revenues
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own revenues" ON public.revenues
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own revenues" ON public.revenues
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own revenues" ON public.revenues
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- expenses table
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- stock_items table
DROP POLICY IF EXISTS "Users can delete own stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can insert own stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can update own stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can view own stock items" ON public.stock_items;

CREATE POLICY "Users can delete own stock items" ON public.stock_items
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own stock items" ON public.stock_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own stock items" ON public.stock_items
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own stock items" ON public.stock_items
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- future_purchases table
DROP POLICY IF EXISTS "Users can delete own future purchases" ON public.future_purchases;
DROP POLICY IF EXISTS "Users can insert own future purchases" ON public.future_purchases;
DROP POLICY IF EXISTS "Users can update own future purchases" ON public.future_purchases;
DROP POLICY IF EXISTS "Users can view own future purchases" ON public.future_purchases;

CREATE POLICY "Users can delete own future purchases" ON public.future_purchases
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own future purchases" ON public.future_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own future purchases" ON public.future_purchases
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own future purchases" ON public.future_purchases
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- content_ideas table
DROP POLICY IF EXISTS "Users can delete own content ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can insert own content ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can update own content ideas" ON public.content_ideas;
DROP POLICY IF EXISTS "Users can view own content ideas" ON public.content_ideas;

CREATE POLICY "Users can delete own content ideas" ON public.content_ideas
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own content ideas" ON public.content_ideas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own content ideas" ON public.content_ideas
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own content ideas" ON public.content_ideas
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- inspiration table
DROP POLICY IF EXISTS "Users can delete own inspiration" ON public.inspiration;
DROP POLICY IF EXISTS "Users can insert own inspiration" ON public.inspiration;
DROP POLICY IF EXISTS "Users can update own inspiration" ON public.inspiration;
DROP POLICY IF EXISTS "Users can view own inspiration" ON public.inspiration;

CREATE POLICY "Users can delete own inspiration" ON public.inspiration
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own inspiration" ON public.inspiration
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own inspiration" ON public.inspiration
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own inspiration" ON public.inspiration
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
