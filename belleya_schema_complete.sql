/*
 * BELLEYA DATABASE SCHEMA - COMPLETE MIGRATION
 * Generated: Sun Jan 18 21:09:49 UTC 2026
 * 
 * This script contains the complete database schema for Belleya.
 * It includes all tables, triggers, functions, RLS policies, and indexes.
 * 
 * IMPORTANT: This is a SCHEMA-ONLY migration. No user data is included.
 * 
 * Execute this script on a fresh Supabase project.
 */

-- Disable triggers during migration
SET session_replication_role = replica;


-- ============================================================================
-- Migration: 20260114122011_create_nail_tech_schema.sql
-- ============================================================================

/*
  # Complete Schema for Nail Tech Organization App

  ## Overview
  This migration creates the complete database schema for a comprehensive nail technician
  organization and management application.

  ## Tables Created

  ### 1. profiles
  User profile information with business settings
  - id (uuid, references auth.users)
  - full_name (text)
  - business_name (text)
  - phone (text)
  - email (text)
  - mode (text) - 'student' or 'professional'
  - hourly_rate (numeric) - desired hourly rate
  - created_at, updated_at (timestamptz)

  ### 2. clients
  Client/customer management (CRM)
  - id (uuid)
  - user_id (uuid) - owner of the client record
  - first_name, last_name (text)
  - phone, email (text)
  - birth_date (date)
  - instagram_handle (text)
  - is_instagrammable (boolean)
  - skin_type (text) - dry/thick/sensitive
  - nail_type (text) - soft/brittle/bitten/normal
  - recommended_tip (text) - red/blue
  - notes (text) - personal notes
  - status (text) - regular/vip/at_risk
  - created_at, updated_at (timestamptz)

  ### 3. client_services_history
  History of services provided to clients
  - id (uuid)
  - user_id (uuid)
  - client_id (uuid)
  - service_name (text)
  - service_date (date)
  - duration_minutes (integer)
  - price (numeric)
  - products_used (jsonb) - array of products
  - photo_before_url, photo_after_url (text)
  - notes (text)
  - created_at (timestamptz)

  ### 4. revenues
  All revenue tracking (services, formations, digital sales, partnerships)
  - id (uuid)
  - user_id (uuid)
  - date (date)
  - amount (numeric)
  - revenue_type (text) - service/formation/digital_sale/commission/other
  - payment_method (text) - cash/transfer/other
  - client_id (uuid) - if service
  - service_name (text) - if service
  - product_name (text) - if not service
  - platform (text) - if digital/partnership
  - notes (text)
  - created_at (timestamptz)

  ### 5. expenses
  All business expenses
  - id (uuid)
  - user_id (uuid)
  - date (date)
  - amount (numeric)
  - category (text) - consumables/equipment/fixed_costs/training/investment/other
  - description (text)
  - supplier (text)
  - notes (text)
  - created_at (timestamptz)

  ### 6. stock_items
  Inventory management
  - id (uuid)
  - user_id (uuid)
  - reference (text)
  - name (text)
  - category (text)
  - quantity (numeric)
  - minimum_quantity (numeric)
  - unit_price (numeric)
  - supplier_link (text)
  - image_url (text)
  - status (text) - sufficient/low/out
  - created_at, updated_at (timestamptz)

  ### 7. future_purchases
  Planned future investments
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - type (text) - equipment/training/business_tool/other
  - estimated_cost (numeric)
  - planned_date (date)
  - priority (text) - high/medium/low
  - impact_description (text)
  - status (text) - planned/purchased/cancelled
  - created_at, updated_at (timestamptz)

  ### 8. partnerships
  Brand partnerships and collaborations
  - id (uuid)
  - user_id (uuid)
  - brand_name (text)
  - collaboration_type (text)
  - benefits (text)
  - obligations (text)
  - start_date, end_date (date)
  - status (text) - active/completed/cancelled
  - notes (text)
  - created_at, updated_at (timestamptz)

  ### 9. content_ideas
  Social media content planning
  - id (uuid)
  - user_id (uuid)
  - title (text)
  - description (text)
  - platform (text) - instagram/tiktok/other
  - status (text) - idea/filming/editing/ready/posted
  - deadline (date)
  - posted_date (date)
  - performance_notes (text)
  - created_at, updated_at (timestamptz)

  ### 10. inspiration
  Inspiration bank for nails and content
  - id (uuid)
  - user_id (uuid)
  - type (text) - nail_design/content/mixed
  - title (text)
  - description (text)
  - image_url (text)
  - source_url (text) - Instagram link or other
  - season (text) - spring/summer/fall/winter
  - colors (text)
  - difficulty (text) - easy/medium/hard
  - status (text) - saved/used
  - used_date (date)
  - created_at (timestamptz)

  ### 11. hygiene_checklists
  Hygiene and safety checklists
  - id (uuid)
  - user_id (uuid)
  - date (date)
  - organization_type (text) - with_duplicate/without_duplicate
  - client_name (text) - if per-client
  - tasks (jsonb) - array of tasks with completion status
  - notes (text)
  - completed (boolean)
  - created_at (timestamptz)

  ### 12. goals
  Professional goals tracking
  - id (uuid)
  - user_id (uuid)
  - type (text) - financial/clients/content/personal
  - title (text)
  - description (text)
  - target_value (numeric)
  - current_value (numeric)
  - period (text) - monthly/quarterly/yearly
  - deadline (date)
  - status (text) - in_progress/achieved/missed
  - created_at, updated_at (timestamptz)

  ### 13. tasks
  To-do list and task management
  - id (uuid)
  - user_id (uuid)
  - title (text)
  - description (text)
  - category (text) - admin/stock/content/hygiene/other
  - priority (text) - high/medium/low
  - due_date (date)
  - completed (boolean)
  - completed_at (timestamptz)
  - created_at, updated_at (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their own data
  - All tables have authenticated user requirements
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  business_name text,
  phone text,
  email text,
  mode text DEFAULT 'student' CHECK (mode IN ('student', 'professional')),
  hourly_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  birth_date date,
  instagram_handle text,
  is_instagrammable boolean DEFAULT false,
  skin_type text CHECK (skin_type IN ('dry', 'thick', 'sensitive', 'normal')),
  nail_type text CHECK (nail_type IN ('soft', 'brittle', 'bitten', 'normal')),
  recommended_tip text CHECK (recommended_tip IN ('red', 'blue')),
  notes text,
  status text DEFAULT 'regular' CHECK (status IN ('regular', 'vip', 'at_risk')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Client services history table
CREATE TABLE IF NOT EXISTS client_services_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  service_date date NOT NULL,
  duration_minutes integer DEFAULT 0,
  price numeric DEFAULT 0,
  products_used jsonb DEFAULT '[]'::jsonb,
  photo_before_url text,
  photo_after_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_services_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service history"
  ON client_services_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service history"
  ON client_services_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service history"
  ON client_services_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service history"
  ON client_services_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Revenues table
CREATE TABLE IF NOT EXISTS revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  revenue_type text NOT NULL CHECK (revenue_type IN ('service', 'formation', 'digital_sale', 'commission', 'other')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'other')),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_name text,
  product_name text,
  platform text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revenues"
  ON revenues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revenues"
  ON revenues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenues"
  ON revenues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenues"
  ON revenues FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL CHECK (category IN ('consumables', 'equipment', 'fixed_costs', 'training', 'investment', 'other')),
  description text NOT NULL,
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Stock items table
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reference text,
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric DEFAULT 0,
  minimum_quantity numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  supplier_link text,
  image_url text,
  status text DEFAULT 'sufficient' CHECK (status IN ('sufficient', 'low', 'out')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock items"
  ON stock_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock items"
  ON stock_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock items"
  ON stock_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock items"
  ON stock_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Future purchases table
CREATE TABLE IF NOT EXISTS future_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('equipment', 'training', 'business_tool', 'other')),
  estimated_cost numeric DEFAULT 0,
  planned_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  impact_description text,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'purchased', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE future_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own future purchases"
  ON future_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own future purchases"
  ON future_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own future purchases"
  ON future_purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own future purchases"
  ON future_purchases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Partnerships table
CREATE TABLE IF NOT EXISTS partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  brand_name text NOT NULL,
  collaboration_type text,
  benefits text,
  obligations text,
  start_date date,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partnerships"
  ON partnerships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own partnerships"
  ON partnerships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partnerships"
  ON partnerships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own partnerships"
  ON partnerships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Content ideas table
CREATE TABLE IF NOT EXISTS content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  platform text CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'youtube', 'other')),
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'filming', 'editing', 'ready', 'posted')),
  deadline date,
  posted_date date,
  performance_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content ideas"
  ON content_ideas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content ideas"
  ON content_ideas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content ideas"
  ON content_ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content ideas"
  ON content_ideas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Inspiration table
CREATE TABLE IF NOT EXISTS inspiration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('nail_design', 'content', 'mixed')),
  title text NOT NULL,
  description text,
  image_url text,
  source_url text,
  season text CHECK (season IN ('spring', 'summer', 'fall', 'winter')),
  colors text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status text DEFAULT 'saved' CHECK (status IN ('saved', 'used')),
  used_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspiration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inspiration"
  ON inspiration FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspiration"
  ON inspiration FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspiration"
  ON inspiration FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspiration"
  ON inspiration FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hygiene checklists table
CREATE TABLE IF NOT EXISTS hygiene_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  organization_type text DEFAULT 'without_duplicate' CHECK (organization_type IN ('with_duplicate', 'without_duplicate')),
  client_name text,
  tasks jsonb DEFAULT '[]'::jsonb,
  notes text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hygiene_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hygiene checklists"
  ON hygiene_checklists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hygiene checklists"
  ON hygiene_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hygiene checklists"
  ON hygiene_checklists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hygiene checklists"
  ON hygiene_checklists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('financial', 'clients', 'content', 'personal')),
  title text NOT NULL,
  description text,
  target_value numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  period text CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  deadline date,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'missed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('admin', 'stock', 'content', 'hygiene', 'other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_history_user_id ON client_services_history(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_history_client_id ON client_services_history(client_id);
CREATE INDEX IF NOT EXISTS idx_revenues_user_id ON revenues(user_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_stock_items_user_id ON stock_items(user_id);
CREATE INDEX IF NOT EXISTS idx_future_purchases_user_id ON future_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_user_id ON partnerships(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_user_id ON inspiration(user_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_checklists_user_id ON hygiene_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- ============================================================================
-- Migration: 20260114133227_add_advanced_features.sql
-- ============================================================================

/*
  # Add Advanced Features for BelleYa

  ## Overview
  This migration adds tables and enhancements to support advanced features:
  - Collaborators management
  - Advanced tasks with recurring tasks
  - Prestations (services) management
  - Loyalty system
  - Appointments tracking
  - Email marketing and reminders

  ## New Tables

  ### 1. collaborators
  Team members who can be assigned tasks
  - id (uuid)
  - user_id (uuid) - salon owner
  - name (text)
  - email (text)
  - role (text)
  - active (boolean)

  ### 2. prestations
  Services offered by the salon
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - description (text)
  - duration_minutes (integer)
  - price (numeric)
  - refill_interval_days (integer) - recommended interval for refill
  - category (text)

  ### 3. client_loyalty
  Track client loyalty and rewards
  - id (uuid)
  - user_id (uuid)
  - client_id (uuid)
  - points (integer)
  - total_visits (integer)
  - last_visit_date (date)
  - next_appointment_date (date)
  - cancelled_count (integer)

  ### 4. appointments
  Client appointments tracking
  - id (uuid)
  - user_id (uuid)
  - client_id (uuid)
  - prestation_id (uuid)
  - scheduled_date (timestamptz)
  - status (text) - scheduled/completed/cancelled/no_show
  - notes (text)
  - reminder_sent (boolean)

  ### 5. email_templates
  Marketing email templates
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - subject (text)
  - content (text)
  - template_type (text) - reminder/refill/repose/marketing
  - active (boolean)

  ### 6. hygiene_protocols
  Hygiene protocols per prestation
  - id (uuid)
  - user_id (uuid)
  - prestation_id (uuid)
  - protocol_name (text)
  - before_checklist (jsonb)
  - after_checklist (jsonb)
  - alerts (jsonb)

  ## Updates to Existing Tables

  ### tasks table
  Add new columns for advanced features
  - collaborator_id (uuid)
  - urgency (text) - very_urgent/urgent/medium/low
  - is_recurring (boolean)
  - recurrence_pattern (text) - daily/weekly/monthly
  - status (text) - todo/in_progress/on_hold/completed
  - overdue (boolean)

  ### content_ideas table
  Add new columns for advanced content management
  - content_type (text) - video/carousel/post/story
  - pillar (text) - editorial pillar
  - caption (text)
  - cover_url (text)
  - scheduled_datetime (timestamptz)

  ### inspiration table
  Add category field for better organization
  - category (text) - nails/hair/lashes/makeup/other

  ### goals table
  Add parent_goal_id for sub-goals
  - parent_goal_id (uuid)
  - progress_percentage (numeric)
  - has_deadline (boolean)

  ## Security
  - RLS enabled on all new tables
  - Policies ensure users can only access their own data
*/

-- Collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  role text DEFAULT 'collaborator',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collaborators"
  ON collaborators FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collaborators"
  ON collaborators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collaborators"
  ON collaborators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collaborators"
  ON collaborators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Prestations table
CREATE TABLE IF NOT EXISTS prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 60,
  price numeric DEFAULT 0,
  refill_interval_days integer DEFAULT 21,
  category text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prestations"
  ON prestations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prestations"
  ON prestations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prestations"
  ON prestations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prestations"
  ON prestations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Client loyalty table
CREATE TABLE IF NOT EXISTS client_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  points integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  last_visit_date date,
  next_appointment_date date,
  cancelled_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_id)
);

ALTER TABLE client_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client loyalty"
  ON client_loyalty FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client loyalty"
  ON client_loyalty FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client loyalty"
  ON client_loyalty FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client loyalty"
  ON client_loyalty FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  prestation_id uuid REFERENCES prestations(id) ON DELETE SET NULL,
  scheduled_date timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  template_type text CHECK (template_type IN ('reminder', 'refill', 'repose', 'marketing', 'custom')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hygiene protocols table
CREATE TABLE IF NOT EXISTS hygiene_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prestation_id uuid REFERENCES prestations(id) ON DELETE CASCADE,
  protocol_name text NOT NULL,
  before_checklist jsonb DEFAULT '[]'::jsonb,
  after_checklist jsonb DEFAULT '[]'::jsonb,
  alerts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hygiene_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hygiene protocols"
  ON hygiene_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hygiene protocols"
  ON hygiene_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hygiene protocols"
  ON hygiene_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hygiene protocols"
  ON hygiene_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'collaborator_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN collaborator_id uuid REFERENCES collaborators(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE tasks ADD COLUMN urgency text DEFAULT 'medium' CHECK (urgency IN ('very_urgent', 'urgent', 'medium', 'low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'on_hold', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'overdue'
  ) THEN
    ALTER TABLE tasks ADD COLUMN overdue boolean DEFAULT false;
  END IF;
END $$;

-- Add columns to content_ideas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN content_type text CHECK (content_type IN ('video', 'carousel', 'post', 'story'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'pillar'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN pillar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'caption'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN caption text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN cover_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'scheduled_datetime'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN scheduled_datetime timestamptz;
  END IF;
END $$;

-- Add columns to inspiration table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspiration' AND column_name = 'category'
  ) THEN
    ALTER TABLE inspiration ADD COLUMN category text DEFAULT 'nails' CHECK (category IN ('nails', 'hair', 'lashes', 'makeup', 'other'));
  END IF;
END $$;

-- Add columns to goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'parent_goal_id'
  ) THEN
    ALTER TABLE goals ADD COLUMN parent_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE goals ADD COLUMN progress_percentage numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'has_deadline'
  ) THEN
    ALTER TABLE goals ADD COLUMN has_deadline boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_prestations_user_id ON prestations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_user_id ON client_loyalty(user_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_client_id ON client_loyalty(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_protocols_user_id ON hygiene_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_protocols_prestation_id ON hygiene_protocols(prestation_id);

-- ============================================================================
-- Migration: 20260114135737_add_start_end_dates_to_goals.sql
-- ============================================================================

/*
  # Add start and end dates to goals table

  ## Changes
  - Add start_date column to goals table
  - Add end_date column to goals table

  ## Purpose
  Allow users to set start and end dates for their goals to better track timelines.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE goals ADD COLUMN end_date date;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260114150513_add_last_completed_date_to_tasks.sql
-- ============================================================================

/*
  # Add last_completed_date to tasks table

  1. Changes
    - Add `last_completed_date` column to `tasks` table
      - This column will track when a recurring task was last completed
      - Used to reset daily recurring tasks at midnight
  
  2. Notes
    - This field is nullable and only used for recurring tasks
    - It stores the date (not datetime) when the task was last marked as completed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'last_completed_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN last_completed_date date;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260114152958_add_company_profile.sql
-- ============================================================================

-- Module Profil d'Entreprise
--
-- 1. Nouvelle Table: company_profiles
--   - id (uuid, primary key)
--   - user_id (uuid, référence vers auth.users)
--   - company_name (text) - Nom de l'entreprise
--   - activity_type (text) - Type d'activité
--   - creation_date (date) - Date de création de l'entreprise
--   - country (text) - Pays
--   - legal_status (text) - Statut juridique
--   - tax_regime (text) - Régime fiscal
--   - has_accre (boolean) - Si bénéficie de l'ACCRE
--   - vat_enabled (boolean) - Si assujetti à la TVA
--   - liberatory_payment (boolean) - Versement libératoire
--   - activity_category (text) - BIC ou BNC
--   - created_at, updated_at (timestamptz)
--
-- 2. Nouvelle Table: tax_thresholds
--   - Stocke les seuils fiscaux par statut
--
-- 3. Nouvelle Table: educational_content
--   - Contenus pédagogiques pour chaque statut
--
-- 4. Nouvelle Table: alerts
--   - Alertes personnalisées par utilisateur
--
-- 5. Sécurité
--   - RLS activé sur toutes les tables
--   - Policies restrictives par utilisateur

-- Table: company_profiles
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  activity_type text NOT NULL,
  creation_date date NOT NULL,
  country text DEFAULT 'France' NOT NULL,
  legal_status text NOT NULL CHECK (legal_status IN ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl', 'autre')),
  tax_regime text,
  has_accre boolean DEFAULT false,
  vat_enabled boolean DEFAULT false,
  liberatory_payment boolean DEFAULT false,
  activity_category text CHECK (activity_category IN ('BIC', 'BNC', NULL)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table: tax_thresholds
CREATE TABLE IF NOT EXISTS tax_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_status text NOT NULL,
  threshold_type text NOT NULL,
  threshold_value numeric NOT NULL,
  description text NOT NULL,
  year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tax thresholds are publicly readable"
  ON tax_thresholds FOR SELECT
  TO authenticated
  USING (true);

-- Table: educational_content
CREATE TABLE IF NOT EXISTS educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  legal_statuses text[] DEFAULT '{}',
  icon text,
  link_text text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educational content is publicly readable"
  ON educational_content FOR SELECT
  TO authenticated
  USING (true);

-- Table: alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read boolean DEFAULT false,
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default tax thresholds for 2024-2025
INSERT INTO tax_thresholds (legal_status, threshold_type, threshold_value, description, year) VALUES
  ('auto_entreprise', 'vat_services', 36800, 'Seuil de franchise en base TVA pour prestations de services', 2024),
  ('auto_entreprise', 'vat_goods', 91900, 'Seuil de franchise en base TVA pour vente de marchandises', 2024),
  ('auto_entreprise', 'revenue_services', 77700, 'Plafond de chiffre d''affaires pour prestations de services', 2024),
  ('auto_entreprise', 'revenue_goods', 188700, 'Plafond de chiffre d''affaires pour vente de marchandises', 2024)
ON CONFLICT DO NOTHING;

-- Insert default educational content
INSERT INTO educational_content (title, content, category, legal_statuses, icon) VALUES
  (
    'Auto-entreprise : comment sont calculées vos charges ?',
    'En tant qu''auto-entrepreneur, vos charges sociales sont calculées directement sur votre chiffre d''affaires encaissé. Les taux varient selon votre activité : environ 21,2% pour les prestations de services, 12,3% pour la vente de marchandises.',
    'charges',
    ARRAY['auto_entreprise'],
    'Calculator'
  ),
  (
    'TVA : quand devez-vous la facturer ?',
    'Si vous êtes en franchise en base de TVA, vous ne facturez pas de TVA à vos clients. Attention : dès que vous dépassez les seuils (36 800€ pour les services, 91 900€ pour les biens), vous devez facturer la TVA.',
    'tva',
    ARRAY['auto_entreprise', 'entreprise_individuelle'],
    'Receipt'
  ),
  (
    'BIC ou BNC : quelle différence ?',
    'BIC (Bénéfices Industriels et Commerciaux) concerne les activités commerciales et artisanales. BNC (Bénéfices Non Commerciaux) concerne les activités libérales comme les prestations intellectuelles. Cela impacte votre régime fiscal.',
    'impots',
    ARRAY['auto_entreprise', 'entreprise_individuelle'],
    'FileText'
  ),
  (
    'CFE : à quoi sert-elle et quand la payer ?',
    'La Cotisation Foncière des Entreprises (CFE) est un impôt local dû par toutes les entreprises. Elle est généralement payable en décembre. Vous en êtes exonéré la première année d''activité.',
    'impots',
    ARRAY['auto_entreprise', 'entreprise_individuelle', 'sasu_eurl'],
    'Building'
  ),
  (
    'L''ACCRE : qu''est-ce que c''est ?',
    'L''ACCRE (maintenant ACRE) permet de bénéficier d''une réduction de charges sociales pendant vos premières années d''activité. Si vous en bénéficiez, vos taux de cotisations sont réduits progressivement sur 3 ans.',
    'charges',
    ARRAY['auto_entreprise'],
    'TrendingDown'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Migration: 20260114164432_add_services_table.sql
-- ============================================================================

/*
  # Create Services (Prestations) Table

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required) - Nom de la prestation
      - `description` (text, optional) - Description détaillée
      - `category` (text, required) - Catégorie (ongles, cils, soins, etc.)
      - `duration` (integer, required) - Durée en minutes
      - `price` (decimal, required) - Prix en euros
      - `status` (text, default 'active') - Statut: active ou inactive
      - `recommended_frequency` (integer, optional) - Fréquence recommandée en jours
      - `has_vat` (boolean, default false) - Application de la TVA
      - `photo_url` (text, optional) - URL de la photo/visuel
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `services` table
    - Add policy for users to read their own services
    - Add policy for users to insert their own services
    - Add policy for users to update their own services
    - Add policy for users to delete their own services

  3. Indexes
    - Index on user_id for faster queries
    - Index on category for filtering
    - Index on status for filtering active/inactive services
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  duration integer NOT NULL,
  price decimal(10, 2) NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  recommended_frequency integer,
  has_vat boolean DEFAULT false NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services"
  ON services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- ============================================================================
-- Migration: 20260114165235_add_client_services_history.sql
-- ============================================================================

/*
  # Create Client Services History Table

  1. New Tables
    - `client_services`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `client_id` (uuid, foreign key to clients)
      - `service_id` (uuid, foreign key to services, nullable)
      - `service_name` (text) - Nom de la prestation (pour historique si service supprimé)
      - `service_category` (text) - Catégorie de la prestation
      - `price` (decimal) - Prix payé
      - `duration` (integer) - Durée en minutes
      - `performed_at` (timestamptz) - Date de la prestation
      - `notes` (text, optional) - Notes sur la prestation
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `client_services` table
    - Add policy for users to read their own client services
    - Add policy for users to insert their own client services
    - Add policy for users to update their own client services
    - Add policy for users to delete their own client services

  3. Indexes
    - Index on user_id for faster queries
    - Index on client_id for filtering by client
    - Index on service_id for filtering by service
    - Index on performed_at for date-based queries
*/

CREATE TABLE IF NOT EXISTS client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  service_category text NOT NULL,
  price decimal(10, 2) NOT NULL,
  duration integer NOT NULL,
  performed_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client services"
  ON client_services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client services"
  ON client_services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client services"
  ON client_services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client services"
  ON client_services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_services_user_id ON client_services(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_performed_at ON client_services(performed_at);

-- ============================================================================
-- Migration: 20260115001446_add_legal_status_change_advice.sql
-- ============================================================================

/*
  # Ajouter conseil sur le changement de statut juridique

  1. Modifications
    - Ajoute un nouveau contenu éducatif "Changement de statut juridique"
    - Placé après le contenu CFE dans la catégorie 'impots'
    - Contient 3 sous-sections accessibles via onglets :
      * Seuils de CA annuel
      * Quand envisager un changement
      * Astuce pour consulter un expert

  2. Sécurité
    - Utilise les policies existantes pour educational_content (publiquement lisible pour les utilisateurs authentifiés)
*/

-- Insérer le nouveau contenu éducatif pour le changement de statut juridique
INSERT INTO educational_content (title, content, category, legal_statuses, icon) VALUES
  (
    'Changement de statut juridique',
    E'**Seuils**\n\nSeuils de CA annuel :\n• Prestations de services: 77 700 € (franchise TVA: 36 800 €)\n• Activités commerciales: 188 700 € (franchise TVA: 91 900 €)\n\n**Changement**\n\nSi votre CA approche ou dépasse ces seuils, vous pourriez envisager :\n• SASU/EURL: Meilleure protection sociale et possibilité de déduire plus de charges\n• SARL: Si vous souhaitez vous associer\n\n**Astuce**\n\nConsultez un expert-comptable ou conseiller juridique avant tout changement de statut pour évaluer l''impact fiscal et social.',
    'impots',
    ARRAY['auto_entreprise'],
    'Lightbulb'
  )
ON CONFLICT DO NOTHING;


-- ============================================================================
-- Migration: 20260115002539_create_agenda_module.sql
-- ============================================================================

/*
  # Module Agenda - Calendrier et Rendez-vous

  1. Nouvelles Tables
    - **events**
      - id (uuid, primary key)
      - user_id (uuid, référence auth.users)
      - type (text) - 'client' | 'personal' | 'google' | 'planity'
      - title (text) - Titre de l'événement
      - start_at (timestamptz) - Date/heure début
      - end_at (timestamptz) - Date/heure fin
      - client_id (uuid, optionnel) - Référence client
      - service_id (uuid, optionnel) - Référence service
      - location (text, optionnel) - Lieu
      - notes (text, optionnel) - Notes
      - status (text) - 'confirmed' | 'pending' | 'cancelled'
      - source_id (text, optionnel) - ID externe (Google/Planity)
      - source_data (jsonb, optionnel) - Données brutes source
      - created_at, updated_at (timestamptz)

    - **calendar_integrations**
      - id (uuid, primary key)
      - user_id (uuid, référence auth.users)
      - provider (text) - 'google' | 'planity'
      - provider_account_id (text) - ID compte externe
      - access_token_encrypted (text) - Token chiffré
      - refresh_token_encrypted (text) - Refresh token chiffré
      - token_expires_at (timestamptz) - Expiration token
      - is_active (boolean) - Actif ou non
      - sync_enabled (boolean) - Sync activée
      - last_sync_at (timestamptz) - Dernière sync
      - settings (jsonb) - Paramètres spécifiques
      - created_at, updated_at (timestamptz)

  2. Modifications Table tasks
    - Ajout de scheduled_at (timestamptz) - Date/heure planifiée
    - Ajout de duration_minutes (integer) - Durée en minutes
    - Ajout de show_in_calendar (boolean) - Afficher dans agenda

  3. Sécurité
    - RLS activé sur toutes les tables
    - Policies restrictives par utilisateur
    - Tokens chiffrés (note: chiffrement applicatif recommandé)
*/

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('client', 'personal', 'google', 'planity')),
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  location text,
  notes text,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  source_id text,
  source_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances des requêtes de calendrier
CREATE INDEX IF NOT EXISTS idx_events_user_start ON events(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(start_at, end_at);

-- Table: calendar_integrations
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'planity')),
  provider_account_id text NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, provider_account_id)
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar integrations"
  ON calendar_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar integrations"
  ON calendar_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar integrations"
  ON calendar_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar integrations"
  ON calendar_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Modifications de la table tasks (si elle n'a pas déjà ces colonnes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN scheduled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration_minutes integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'show_in_calendar'
  ) THEN
    ALTER TABLE tasks ADD COLUMN show_in_calendar boolean DEFAULT true;
  END IF;
END $$;

-- Index pour les tâches planifiées
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations;
CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Migration: 20260115093301_create_client_marketplace_system.sql
-- ============================================================================

/*
  # Système Client + Marketplace - BelleYa
  
  Ce module crée l'infrastructure complète pour:
  - Gestion des rôles (cliente/praticienne)
  - Profils publics des praticiennes
  - Système de réservation publique
  - Avis et notes
  - Favoris clientes
  - CRM automatique des clientes par praticienne

  ## 1. Nouvelles Tables
  
  ### `user_profiles`
  Extension des profils utilisateurs avec rôle et informations de base
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence vers auth.users)
  - `role` (text) - 'client' ou 'pro'
  - `first_name` (text) - Prénom
  - `last_name` (text) - Nom
  - `phone` (text) - Téléphone
  - `photo_url` (text) - Photo de profil
  - `created_at`, `updated_at` (timestamptz)

  ### `pro_profiles`
  Profils publics des praticiennes pour la marketplace
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence vers auth.users)
  - `slug` (text, unique) - URL publique (ex: belleya.app/booking/marie-nails)
  - `business_name` (text) - Nom professionnel/commercial
  - `profession` (text) - Métier (prothésiste ongulaire, lash artist, etc.)
  - `specialties` (text[]) - Spécialités
  - `bio` (text) - Présentation
  - `address` (text) - Adresse complète
  - `city` (text) - Ville
  - `postal_code` (text) - Code postal
  - `latitude` (decimal) - Coordonnées GPS
  - `longitude` (decimal) - Coordonnées GPS
  - `address_visible` (boolean) - Si l'adresse est publique (salon)
  - `is_salon` (boolean) - Si c'est un salon (vs domicile)
  - `is_visible` (boolean) - Visible sur la carte
  - `is_accepting_bookings` (boolean) - Accepte les réservations
  - `portfolio_photos` (text[]) - URLs des photos portfolio
  - `instagram_handle` (text)
  - `average_rating` (decimal) - Note moyenne (calculée)
  - `total_reviews` (integer) - Nombre total d'avis
  - `created_at`, `updated_at` (timestamptz)

  ### `bookings`
  Réservations de rendez-vous
  - `id` (uuid, primary key)
  - `client_id` (uuid, référence vers auth.users) - Cliente
  - `pro_id` (uuid, référence vers auth.users) - Praticienne
  - `service_id` (uuid, référence vers services)
  - `appointment_date` (timestamptz) - Date et heure du RDV
  - `duration` (integer) - Durée en minutes
  - `price` (decimal) - Prix
  - `status` (text) - pending/confirmed/completed/cancelled
  - `cancellation_reason` (text)
  - `notes` (text) - Notes de la cliente
  - `pro_notes` (text) - Notes internes de la pro
  - `created_at`, `updated_at` (timestamptz)

  ### `reviews`
  Avis des clientes sur les prestations
  - `id` (uuid, primary key)
  - `booking_id` (uuid, référence vers bookings, unique)
  - `client_id` (uuid, référence vers auth.users)
  - `pro_id` (uuid, référence vers auth.users)
  - `rating` (integer) - Note de 1 à 5
  - `comment` (text) - Commentaire
  - `tags` (text[]) - Tags rapides (accueil, propreté, etc.)
  - `is_public` (boolean) - Autorisation d'affichage public
  - `pro_response` (text) - Réponse de la praticienne
  - `is_reported` (boolean) - Si signalé comme abusif
  - `created_at`, `updated_at` (timestamptz)

  ### `favorites`
  Praticiennes favorites des clientes
  - `id` (uuid, primary key)
  - `client_id` (uuid, référence vers auth.users)
  - `pro_id` (uuid, référence vers auth.users)
  - `created_at` (timestamptz)
  - UNIQUE(client_id, pro_id)

  ### `crm_clients`
  Fiches clientes dans le CRM de chaque praticienne (auto-créées)
  - `id` (uuid, primary key)
  - `pro_id` (uuid, référence vers auth.users) - Praticienne propriétaire
  - `user_id` (uuid, référence vers auth.users, nullable) - Lié au compte cliente si elle en a un
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text)
  - `phone` (text)
  - `notes` (text) - Notes privées de la praticienne
  - `first_visit_date` (date) - Date première visite
  - `last_visit_date` (date) - Date dernière visite
  - `total_visits` (integer) - Nombre de visites
  - `total_spent` (decimal) - Total dépensé
  - `created_at`, `updated_at` (timestamptz)
  - UNIQUE(pro_id, email) - Éviter les doublons par email

  ## 2. Sécurité (RLS)
  
  Toutes les tables ont RLS activé avec des policies restrictives:
  - Les clientes voient uniquement leurs propres données
  - Les praticiennes voient uniquement leurs propres données
  - Les profils publics pros sont visibles par tous (si is_visible = true)
  - Les avis publics sont visibles par tous

  ## 3. Indexes
  
  Indexes pour optimiser les performances:
  - Recherche par slug (booking URL)
  - Recherche géographique (lat/lng)
  - Filtres par profession, ville
  - Recherche d'avis par praticienne
  - Anti-doublons CRM (email, phone)
*/

-- =============================================================================
-- 1. USER PROFILES (Extension avec rôles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'pro')),
  first_name text,
  last_name text,
  phone text,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- =============================================================================
-- 2. PRO PROFILES (Profils publics marketplace)
-- =============================================================================

CREATE TABLE IF NOT EXISTS pro_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text UNIQUE NOT NULL,
  business_name text NOT NULL,
  profession text NOT NULL,
  specialties text[] DEFAULT '{}',
  bio text,
  address text,
  city text,
  postal_code text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  address_visible boolean DEFAULT false NOT NULL,
  is_salon boolean DEFAULT false NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  is_accepting_bookings boolean DEFAULT true NOT NULL,
  portfolio_photos text[] DEFAULT '{}',
  instagram_handle text,
  average_rating decimal(3, 2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE pro_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro can view own profile"
  ON pro_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view visible pro profiles"
  ON pro_profiles FOR SELECT
  TO authenticated
  USING (is_visible = true);

CREATE POLICY "Pro can insert own profile"
  ON pro_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pro can update own profile"
  ON pro_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pro_profiles_user_id ON pro_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_slug ON pro_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_city ON pro_profiles(city);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_profession ON pro_profiles(profession);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_visible ON pro_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_location ON pro_profiles(latitude, longitude);

-- =============================================================================
-- 3. BOOKINGS (Réservations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  appointment_date timestamptz NOT NULL,
  duration integer NOT NULL,
  price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cancellation_reason text,
  notes text,
  pro_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Pros can view bookings for their services"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Clients can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Pros can update bookings for their services"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_id ON bookings(pro_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);

-- =============================================================================
-- 4. REVIEWS (Avis)
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true NOT NULL,
  pro_response text,
  is_reported boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(booking_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Pros can view reviews for their services"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Public can view public reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_public = true AND is_reported = false);

CREATE POLICY "Clients can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Pros can update reviews with response"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_reviews_pro_id ON reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(is_public);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =============================================================================
-- 5. FAVORITES (Favoris)
-- =============================================================================

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(client_id, pro_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pro_id ON favorites(pro_id);

-- =============================================================================
-- 6. CRM CLIENTS (Fiches clientes auto-créées)
-- =============================================================================

CREATE TABLE IF NOT EXISTS crm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  notes text,
  first_visit_date date,
  last_visit_date date,
  total_visits integer DEFAULT 0,
  total_spent decimal(10, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(pro_id, email)
);

ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can view own CRM clients"
  ON crm_clients FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE POLICY "Pros can insert own CRM clients"
  ON crm_clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can update own CRM clients"
  ON crm_clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can delete own CRM clients"
  ON crm_clients FOR DELETE
  TO authenticated
  USING (auth.uid() = pro_id);

CREATE INDEX IF NOT EXISTS idx_crm_clients_pro_id ON crm_clients(pro_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_user_id ON crm_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_email ON crm_clients(email);
CREATE INDEX IF NOT EXISTS idx_crm_clients_phone ON crm_clients(phone);

-- =============================================================================
-- 7. FUNCTIONS - Mise à jour automatique des statistiques
-- =============================================================================

-- Fonction pour mettre à jour la note moyenne d'une praticienne
CREATE OR REPLACE FUNCTION update_pro_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pro_profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE pro_id = COALESCE(NEW.pro_id, OLD.pro_id)
        AND is_public = true
        AND is_reported = false
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE pro_id = COALESCE(NEW.pro_id, OLD.pro_id)
        AND is_public = true
        AND is_reported = false
    )
  WHERE user_id = COALESCE(NEW.pro_id, OLD.pro_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la note après insert/update/delete d'un avis
DROP TRIGGER IF EXISTS trigger_update_pro_rating ON reviews;
CREATE TRIGGER trigger_update_pro_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_pro_rating();

-- Fonction pour mettre à jour les stats CRM après un booking
CREATE OR REPLACE FUNCTION update_crm_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE crm_clients
    SET 
      last_visit_date = NEW.appointment_date::date,
      total_visits = total_visits + 1,
      total_spent = total_spent + NEW.price,
      updated_at = now()
    WHERE pro_id = NEW.pro_id
      AND (user_id = NEW.client_id OR email = (SELECT email FROM auth.users WHERE id = NEW.client_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats CRM
DROP TRIGGER IF EXISTS trigger_update_crm_stats ON bookings;
CREATE TRIGGER trigger_update_crm_stats
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_crm_stats();


-- ============================================================================
-- Migration: 20260115095539_fix_missing_user_profiles.sql
-- ============================================================================

/*
  # Fix Missing User Profiles
  
  ## Description
  This migration fixes the issue where users created before the user_profiles table
  was introduced don't have entries in user_profiles, causing them to be stuck on
  the loading screen.
  
  ## Changes
  1. Create user_profiles entries for all users in profiles table who don't have one
  2. Set their role to 'pro' by default (since they were using the pro features)
  3. Migrate their name information from profiles to user_profiles
  
  ## Safety
  - Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
  - Only affects users who exist in profiles but not in user_profiles
*/

-- Insert missing user_profiles for existing users
INSERT INTO user_profiles (user_id, role, first_name, last_name)
SELECT 
  p.id,
  'pro' as role,
  SPLIT_PART(p.full_name, ' ', 1) as first_name,
  NULLIF(TRIM(SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name))), '') as last_name
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================================
-- Migration: 20260115103916_add_booking_slug_to_company_profiles.sql
-- ============================================================================

/*
  # Add booking slug to company profiles

  1. Changes
    - Add `booking_slug` column to `company_profiles` table
      - Type: text
      - Unique constraint to ensure no duplicate URLs
      - Automatically generated from company_name
    
  2. Security
    - No RLS changes needed (inherits from existing table)
    
  3. Notes
    - This enables clean, professional booking URLs like: https://belleya.app/book/studio-nails-paris
    - The slug is SEO-friendly (lowercase, no accents, hyphens instead of spaces)
*/

-- Add booking_slug column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'booking_slug'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN booking_slug text UNIQUE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_profiles_booking_slug ON company_profiles(booking_slug);

-- Create function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_booking_slug(company_name_param text, user_id_param uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert company name to slug format
  base_slug := lower(trim(company_name_param));
  base_slug := regexp_replace(base_slug, '[àáâãäå]', 'a', 'g');
  base_slug := regexp_replace(base_slug, '[èéêë]', 'e', 'g');
  base_slug := regexp_replace(base_slug, '[ìíîï]', 'i', 'g');
  base_slug := regexp_replace(base_slug, '[òóôõö]', 'o', 'g');
  base_slug := regexp_replace(base_slug, '[ùúûü]', 'u', 'g');
  base_slug := regexp_replace(base_slug, '[ç]', 'c', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty after cleaning, use default
  IF base_slug = '' THEN
    base_slug := 'salon';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (
    SELECT 1 FROM company_profiles 
    WHERE booking_slug = final_slug 
    AND (user_id_param IS NULL OR user_id != user_id_param)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Generate slugs for existing records
UPDATE company_profiles
SET booking_slug = generate_booking_slug(company_name, user_id)
WHERE booking_slug IS NULL AND company_name IS NOT NULL AND company_name != '';


-- ============================================================================
-- Migration: 20260115105336_create_booking_notifications_system.sql
-- ============================================================================

/*
  # Booking Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, recipient) - who receives the notification
      - `type` (text) - type of notification: 'booking_request', 'booking_confirmed', 'booking_rejected', etc.
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `booking_id` (uuid, nullable) - related booking if applicable
      - `is_read` (boolean) - whether notification has been read
      - `action_url` (text, nullable) - optional URL to navigate to
      - `metadata` (jsonb, nullable) - additional data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications (mark as read)

  3. Triggers
    - Create trigger on bookings table to auto-create notification for pro when booking is created
    - Create trigger on bookings table to notify client when booking status changes

  4. Functions
    - Function to create booking notification for pro
    - Function to create booking status notification for client
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_completed', 'booking_cancelled', 'info', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to notify pro of new booking request
CREATE OR REPLACE FUNCTION notify_pro_of_booking()
RETURNS TRIGGER AS $$
DECLARE
  client_name text;
  service_name text;
  booking_date text;
BEGIN
  -- Get client name
  SELECT COALESCE(up.first_name || ' ' || up.last_name, 'Client') INTO client_name
  FROM user_profiles up
  WHERE up.user_id = NEW.client_id;

  -- Get service name
  SELECT name INTO service_name
  FROM services
  WHERE id = NEW.service_id;

  -- Format booking date
  booking_date := to_char(NEW.appointment_date, 'DD/MM/YYYY à HH24:MI');

  -- Create notification for pro
  INSERT INTO notifications (user_id, type, title, message, booking_id)
  VALUES (
    NEW.pro_id,
    'booking_request',
    'Nouvelle demande de réservation',
    client_name || ' souhaite réserver ' || service_name || ' le ' || booking_date,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify client of booking status change
CREATE OR REPLACE FUNCTION notify_client_of_booking_status()
RETURNS TRIGGER AS $$
DECLARE
  pro_name text;
  service_name text;
  booking_date text;
  notification_type text;
  notification_title text;
  notification_message text;
BEGIN
  -- Only notify on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get pro business name
  SELECT company_name INTO pro_name
  FROM company_profiles
  WHERE user_id = NEW.pro_id;

  -- Get service name
  SELECT name INTO service_name
  FROM services
  WHERE id = NEW.service_id;

  -- Format booking date
  booking_date := to_char(NEW.appointment_date, 'DD/MM/YYYY à HH24:MI');

  -- Determine notification type and message based on status
  IF NEW.status = 'confirmed' THEN
    notification_type := 'booking_confirmed';
    notification_title := 'Réservation confirmée';
    notification_message := pro_name || ' a confirmé votre réservation pour ' || service_name || ' le ' || booking_date;
  ELSIF NEW.status = 'cancelled' THEN
    notification_type := 'booking_cancelled';
    notification_title := 'Réservation annulée';
    notification_message := 'Votre réservation pour ' || service_name || ' le ' || booking_date || ' a été annulée.';
    IF NEW.cancellation_reason IS NOT NULL THEN
      notification_message := notification_message || ' Raison: ' || NEW.cancellation_reason;
    END IF;
  ELSIF NEW.status = 'completed' THEN
    notification_type := 'booking_completed';
    notification_title := 'Rendez-vous terminé';
    notification_message := 'Votre rendez-vous chez ' || pro_name || ' est terminé. N''oubliez pas de laisser un avis !';
  ELSE
    RETURN NEW;
  END IF;

  -- Create notification for client
  INSERT INTO notifications (user_id, type, title, message, booking_id)
  VALUES (
    NEW.client_id,
    notification_type,
    notification_title,
    notification_message,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new bookings (notify pro)
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_pro_of_booking();

-- Create trigger for booking status changes (notify client)
DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;
CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_of_booking_status();

-- Function to auto-create CRM client entry when client books for the first time
CREATE OR REPLACE FUNCTION auto_create_crm_client()
RETURNS TRIGGER AS $$
DECLARE
  client_exists boolean;
  client_first_name text;
  client_last_name text;
  client_email text;
  client_phone text;
BEGIN
  -- Check if CRM client entry already exists
  SELECT EXISTS(
    SELECT 1 FROM crm_clients
    WHERE pro_id = NEW.pro_id AND user_id = NEW.client_id
  ) INTO client_exists;

  -- If not exists, create it
  IF NOT client_exists THEN
    -- Get client info from user_profiles
    SELECT first_name, last_name, phone INTO client_first_name, client_last_name, client_phone
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    -- Get email from auth.users
    SELECT email INTO client_email
    FROM auth.users
    WHERE id = NEW.client_id;

    -- Insert CRM client
    INSERT INTO crm_clients (
      pro_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      first_visit_date,
      last_visit_date,
      total_visits,
      total_spent
    ) VALUES (
      NEW.pro_id,
      NEW.client_id,
      COALESCE(client_first_name, ''),
      COALESCE(client_last_name, ''),
      COALESCE(client_email, ''),
      client_phone,
      CURRENT_DATE,
      CURRENT_DATE,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create CRM client
DROP TRIGGER IF EXISTS on_booking_create_crm_client ON bookings;
CREATE TRIGGER on_booking_create_crm_client
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_crm_client();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pro_id_status ON bookings(pro_id, status);

-- ============================================================================
-- Migration: 20260115111055_add_booking_to_agenda_on_accept.sql
-- ============================================================================

/*
  # Add Booking to Agenda on Accept

  1. New Function
    - `add_booking_to_agenda()` - Creates an event in the events table when a booking is confirmed

  2. Trigger
    - Automatically creates an agenda event when booking status changes to 'confirmed'

  3. Changes
    - When pro accepts a booking, it automatically appears in their agenda
    - The event includes all booking details (client, service, date, time)
*/

-- Function to create an event in agenda when booking is confirmed
CREATE OR REPLACE FUNCTION add_booking_to_agenda()
RETURNS TRIGGER AS $$
DECLARE
  client_full_name text;
  service_name text;
  appointment_end timestamptz;
BEGIN
  -- Only proceed if status changed to confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get client name
    SELECT COALESCE(first_name || ' ' || last_name, 'Client') INTO client_full_name
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    -- Get service name
    SELECT name INTO service_name
    FROM services
    WHERE id = NEW.service_id;

    -- Calculate end time
    appointment_end := NEW.appointment_date + (NEW.duration || ' minutes')::interval;

    -- Create event in agenda
    INSERT INTO events (
      user_id,
      type,
      title,
      start_at,
      end_at,
      client_id,
      service_id,
      notes,
      status
    ) VALUES (
      NEW.pro_id,
      'client',
      service_name || ' - ' || client_full_name,
      NEW.appointment_date,
      appointment_end,
      NULL,
      NEW.service_id,
      COALESCE('Réservation en ligne' || CASE WHEN NEW.notes IS NOT NULL AND NEW.notes != '' THEN E'\n\nNotes client: ' || NEW.notes ELSE '' END, 'Réservation en ligne'),
      'confirmed'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add booking to agenda
DROP TRIGGER IF EXISTS on_booking_confirmed_add_to_agenda ON bookings;
CREATE TRIGGER on_booking_confirmed_add_to_agenda
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION add_booking_to_agenda();

-- Also handle when a booking is cancelled (remove from agenda)
CREATE OR REPLACE FUNCTION remove_booking_from_agenda()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking is cancelled, we could optionally update the event status
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    
    -- Update any matching events to cancelled status
    UPDATE events
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n\n[Réservation annulée: ' || COALESCE(NEW.cancellation_reason, 'Non spécifié') || ']'
    WHERE user_id = NEW.pro_id
      AND service_id = NEW.service_id
      AND start_at = NEW.appointment_date
      AND type = 'client'
      AND status = 'confirmed';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle cancellations
DROP TRIGGER IF EXISTS on_booking_cancelled_update_agenda ON bookings;
CREATE TRIGGER on_booking_cancelled_update_agenda
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION remove_booking_from_agenda();

-- ============================================================================
-- Migration: 20260115112341_add_public_access_for_booking.sql
-- ============================================================================

/*
  # Add Public Access for Booking Pages

  1. Changes
    - Allow public (unauthenticated) users to read company profiles
    - Allow public users to read services
    - Allow public users to read events (for availability checking)
    - These are necessary for the public booking flow to work

  2. Security
    - Only SELECT operations are allowed for public users
    - All other operations still require authentication
    - RLS remains enabled on all tables
*/

-- Allow public read access to company profiles
CREATE POLICY "Public can view company profiles"
  ON company_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to services
CREATE POLICY "Public can view active services"
  ON services
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Allow public read access to events (for availability checking)
CREATE POLICY "Public can view events for availability"
  ON events
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to user profiles (for pro names)
CREATE POLICY "Public can view user profiles"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- Migration: 20260115115052_fix_booking_access_for_authenticated_users.sql
-- ============================================================================

/*
  # Fix Public Booking Access for All Users
  
  ## Problem
  Public booking pages only work for unauthenticated users (anon role).
  When users are logged in as CLIENT or PRO, they cannot access booking pages
  because RLS policies restrict services/events to owner only.
  
  ## Solution
  Add policies that allow ALL authenticated users (not just owners) to view:
  - Active services (for booking selection)
  - Events (for availability checking)
  - Company profiles (for business info)
  - User profiles (for pro names)
  
  This enables the booking flow to work regardless of authentication state.
  
  ## Security
  - Only SELECT operations are allowed
  - Services must be active (status = 'active')
  - No write operations are permitted
  - Owner-only policies remain for INSERT/UPDATE/DELETE
*/

-- Allow authenticated users to view active services from any pro
CREATE POLICY "Authenticated users can view active services"
  ON services
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Allow authenticated users to view events from any pro (for availability)
CREATE POLICY "Authenticated users can view events for booking"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view company profiles from any pro
CREATE POLICY "Authenticated users can view company profiles"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view user profiles (for pro names)
CREATE POLICY "Authenticated users can view user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Migration: 20260115171205_update_company_profile_fiscal_schema.sql
-- ============================================================================

/*
  # Mise à jour du schéma fiscal du profil d'entreprise

  1. Modifications de la table company_profiles
    - Remplace legal_status par des enums normalisés (MICRO, EI, SASU_EURL, OTHER)
    - Ajoute tax_category avec enums détaillés pour tous les régimes
    - Remplace vat_enabled par vat_mode (VAT_FRANCHISE, VAT_LIABLE)
    - Renomme has_accre en acre
    - Renomme liberatory_payment en versement_liberatoire
    - Ajoute other_legal_status_label pour les statuts "Autre"
    - Supprime activity_category (remplacé par tax_category)
    - Supprime tax_regime (remplacé par tax_category)

  2. Logique métier
    - Statut MICRO : tax_category peut être MICRO_BNC, MICRO_BIC_SERVICES, MICRO_BIC_SALES
    - Statut EI : tax_category peut être BIC_REAL_SIMPLIFIED, BIC_REAL_NORMAL, BNC_CONTROLLED
    - Statut SASU_EURL : tax_category peut être IS, IR, BIC_SERVICES, BIC_SALES
    - Statut OTHER : tax_category nullable

  3. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Ajouter les nouvelles colonnes avec les nouveaux enums
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS new_legal_status text,
  ADD COLUMN IF NOT EXISTS new_tax_category text,
  ADD COLUMN IF NOT EXISTS vat_mode text,
  ADD COLUMN IF NOT EXISTS acre boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS versement_liberatoire boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS other_legal_status_label text;

-- Migrer les données existantes vers le nouveau format
UPDATE company_profiles
SET
  new_legal_status = CASE
    WHEN legal_status = 'auto_entreprise' THEN 'MICRO'
    WHEN legal_status = 'entreprise_individuelle' THEN 'EI'
    WHEN legal_status = 'sasu_eurl' THEN 'SASU_EURL'
    WHEN legal_status = 'autre' THEN 'OTHER'
    ELSE 'MICRO'
  END,
  new_tax_category = CASE
    WHEN legal_status = 'auto_entreprise' AND activity_category = 'BNC' THEN 'MICRO_BNC'
    WHEN legal_status = 'auto_entreprise' AND activity_category = 'BIC' THEN 'MICRO_BIC_SERVICES'
    WHEN legal_status = 'auto_entreprise' THEN 'MICRO_BIC_SERVICES'
    WHEN legal_status = 'entreprise_individuelle' THEN 'BIC_REAL_SIMPLIFIED'
    WHEN legal_status = 'sasu_eurl' THEN 'IS'
    ELSE NULL
  END,
  vat_mode = CASE
    WHEN vat_enabled = true THEN 'VAT_LIABLE'
    ELSE 'VAT_FRANCHISE'
  END,
  acre = has_accre,
  versement_liberatoire = liberatory_payment
WHERE new_legal_status IS NULL;

-- Supprimer les anciennes colonnes
ALTER TABLE company_profiles
  DROP COLUMN IF EXISTS legal_status,
  DROP COLUMN IF EXISTS tax_regime,
  DROP COLUMN IF EXISTS has_accre,
  DROP COLUMN IF EXISTS vat_enabled,
  DROP COLUMN IF EXISTS liberatory_payment,
  DROP COLUMN IF EXISTS activity_category;

-- Renommer les nouvelles colonnes
ALTER TABLE company_profiles
  RENAME COLUMN new_legal_status TO legal_status;

ALTER TABLE company_profiles
  RENAME COLUMN new_tax_category TO tax_category;

-- Ajouter les contraintes
ALTER TABLE company_profiles
  ALTER COLUMN legal_status SET NOT NULL,
  ADD CONSTRAINT legal_status_check CHECK (legal_status IN ('MICRO', 'EI', 'SASU_EURL', 'OTHER')),
  ADD CONSTRAINT tax_category_check CHECK (
    tax_category IN (
      'MICRO_BNC', 'MICRO_BIC_SERVICES', 'MICRO_BIC_SALES',
      'BIC_REAL_SIMPLIFIED', 'BIC_REAL_NORMAL', 'BNC_CONTROLLED',
      'IS', 'IR', 'BIC_SERVICES', 'BIC_SALES'
    ) OR tax_category IS NULL
  ),
  ADD CONSTRAINT vat_mode_check CHECK (vat_mode IN ('VAT_FRANCHISE', 'VAT_LIABLE'));

-- Ajouter des contraintes NOT NULL pour les champs requis
ALTER TABLE company_profiles
  ALTER COLUMN vat_mode SET NOT NULL,
  ALTER COLUMN acre SET NOT NULL,
  ALTER COLUMN versement_liberatoire SET NOT NULL;


-- ============================================================================
-- Migration: 20260115171455_add_taxation_regime_for_sasu_eurl.sql
-- ============================================================================

/*
  # Ajouter champ taxation_regime pour SASU/EURL

  1. Modifications
    - Ajoute taxation_regime (IS ou IR) pour gérer le régime d'imposition des SASU/EURL
    - tax_category pour SASU/EURL contiendra BIC_SERVICES ou BIC_SALES (le type d'activité)
    - taxation_regime sera NULL pour les autres statuts (MICRO, EI, OTHER)

  2. Logique
    - SASU_EURL : taxation_regime = IS ou IR + tax_category = BIC_SERVICES ou BIC_SALES
    - MICRO : taxation_regime = NULL, tax_category = MICRO_BNC/MICRO_BIC_SERVICES/MICRO_BIC_SALES
    - EI : taxation_regime = NULL, tax_category = BIC_REAL_SIMPLIFIED/BIC_REAL_NORMAL/BNC_CONTROLLED
    - OTHER : taxation_regime = NULL, tax_category = NULL
*/

-- Ajouter le champ taxation_regime
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS taxation_regime text;

-- Ajouter la contrainte pour taxation_regime
ALTER TABLE company_profiles
  ADD CONSTRAINT taxation_regime_check CHECK (
    taxation_regime IN ('IS', 'IR') OR taxation_regime IS NULL
  );

-- Migrer les données existantes : si tax_category = IS ou IR, déplacer vers taxation_regime
UPDATE company_profiles
SET
  taxation_regime = CASE
    WHEN tax_category IN ('IS', 'IR') THEN tax_category
    ELSE NULL
  END,
  tax_category = CASE
    WHEN tax_category IN ('IS', 'IR') THEN 'BIC_SERVICES'
    ELSE tax_category
  END
WHERE legal_status = 'SASU_EURL';


-- ============================================================================
-- Migration: 20260115171812_rename_event_type_client_to_pro_fixed.sql
-- ============================================================================

/*
  # Renommer le type d'événement CLIENT en PRO (version corrigée)

  1. Modifications
    - Supprime la contrainte CHECK existante
    - Met à jour tous les événements existants de type 'client' vers 'pro'
    - Recrée la contrainte CHECK pour accepter 'pro' au lieu de 'client'
    - Conserve les types 'personal', 'google', 'planity'

  2. Logique métier
    - 'pro' = rendez-vous professionnel (avec ou sans client associé)
    - 'personal' = rendez-vous personnel
    - 'google' = événement importé de Google Calendar
    - 'planity' = événement importé de Planity

  3. Impact
    - Tous les rendez-vous existants de type 'client' deviennent 'pro'
    - Aucune perte de données
*/

-- Étape 1 : Supprimer l'ancienne contrainte CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'events' AND constraint_name = 'events_type_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_type_check;
  END IF;
END $$;

-- Étape 2 : Mettre à jour tous les événements existants de type 'client' vers 'pro'
UPDATE events
SET type = 'pro'
WHERE type = 'client';

-- Étape 3 : Ajouter la nouvelle contrainte CHECK avec 'pro' au lieu de 'client'
ALTER TABLE events
  ADD CONSTRAINT events_type_check CHECK (type IN ('pro', 'personal', 'google', 'planity'));


-- ============================================================================
-- Migration: 20260115171953_update_booking_functions_client_to_pro.sql
-- ============================================================================

/*
  # Mettre à jour les fonctions de booking pour utiliser 'pro' au lieu de 'client'

  1. Modifications
    - Met à jour la fonction `add_booking_to_agenda()` pour créer des événements de type 'pro'
    - Met à jour la fonction `remove_booking_from_agenda()` pour filtrer les événements de type 'pro'

  2. Impact
    - Les futurs bookings confirmés créeront des événements 'pro'
    - Les annulations mettront à jour les événements 'pro'
*/

-- Mettre à jour la fonction pour créer des événements de type 'pro'
CREATE OR REPLACE FUNCTION add_booking_to_agenda()
RETURNS TRIGGER AS $$
DECLARE
  client_full_name text;
  service_name text;
  appointment_end timestamptz;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    SELECT COALESCE(first_name || ' ' || last_name, 'Client') INTO client_full_name
    FROM user_profiles
    WHERE user_id = NEW.client_id;

    SELECT name INTO service_name
    FROM services
    WHERE id = NEW.service_id;

    appointment_end := NEW.appointment_date + (NEW.duration || ' minutes')::interval;

    INSERT INTO events (
      user_id,
      type,
      title,
      start_at,
      end_at,
      client_id,
      service_id,
      notes,
      status
    ) VALUES (
      NEW.pro_id,
      'pro',
      service_name || ' - ' || client_full_name,
      NEW.appointment_date,
      appointment_end,
      NULL,
      NEW.service_id,
      COALESCE('Réservation en ligne' || CASE WHEN NEW.notes IS NOT NULL AND NEW.notes != '' THEN E'\n\nNotes client: ' || NEW.notes ELSE '' END, 'Réservation en ligne'),
      'confirmed'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction pour gérer les annulations avec type 'pro'
CREATE OR REPLACE FUNCTION remove_booking_from_agenda()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    
    UPDATE events
    SET status = 'cancelled',
        notes = COALESCE(notes, '') || E'\n\n[Réservation annulée: ' || COALESCE(NEW.cancellation_reason, 'Non spécifié') || ']'
    WHERE user_id = NEW.pro_id
      AND service_id = NEW.service_id
      AND start_at = NEW.appointment_date
      AND type = 'pro'
      AND status = 'confirmed';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Migration: 20260115172815_create_service_photos_bucket.sql
-- ============================================================================

/*
  # Create Service Photos Storage Bucket

  1. New Storage Bucket
    - `service-photos` bucket for storing service images
    - Public access for reading (so clients can view service photos)
    - Authenticated users can upload their own service photos
    
  2. Security
    - RLS policies for secure file access
    - Users can only upload to their own folder
    - Users can only delete their own files
    - Public can read all files (for displaying services to clients)
*/

-- Create the storage bucket for service photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload service photos to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own service photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own service photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all service photos
CREATE POLICY "Public can view service photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-photos');


-- ============================================================================
-- Migration: 20260115181805_fix_payment_methods.sql
-- ============================================================================

/*
  # Correction des modes de paiement

  1. Modifications
    - Élargit la contrainte CHECK sur payment_method dans la table revenues
    - Ajoute les options 'card' et 'paypal' aux modes de paiement acceptés

  2. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Supprimer l'ancienne contrainte sur payment_method
ALTER TABLE revenues
  DROP CONSTRAINT IF EXISTS revenues_payment_method_check;

-- Ajouter la nouvelle contrainte avec tous les modes de paiement
ALTER TABLE revenues
  ADD CONSTRAINT revenues_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'paypal', 'transfer', 'other'));


-- ============================================================================
-- Migration: 20260115181837_update_educational_content_legal_statuses.sql
-- ============================================================================

/*
  # Mise à jour des statuts juridiques dans educational_content

  1. Modifications
    - Remplace les anciens statuts ('auto_entreprise', 'entreprise_individuelle', 'sasu_eurl')
    - Par les nouveaux statuts ('MICRO', 'EI', 'SASU_EURL')
    - Dans la colonne legal_statuses de la table educational_content

  2. Sécurité
    - Les policies RLS existantes restent inchangées
*/

-- Mettre à jour tous les contenus éducatifs avec les nouveaux statuts
UPDATE educational_content
SET legal_statuses = ARRAY(
  SELECT CASE 
    WHEN unnest = 'auto_entreprise' THEN 'MICRO'
    WHEN unnest = 'entreprise_individuelle' THEN 'EI'
    WHEN unnest = 'sasu_eurl' THEN 'SASU_EURL'
    ELSE unnest
  END
  FROM unnest(legal_statuses)
)
WHERE 'auto_entreprise' = ANY(legal_statuses) 
   OR 'entreprise_individuelle' = ANY(legal_statuses)
   OR 'sasu_eurl' = ANY(legal_statuses);


-- ============================================================================
-- Migration: 20260115183244_fix_missing_user_profiles_and_auto_creation_v3.sql
-- ============================================================================

/*
  # Fix Missing User Profiles and Auto-Creation
  
  1. Changes
    - Creates profiles for all existing auth users that don't have profiles
    - Creates a trigger to automatically create profiles when new users sign up
    - Updates the trigger function to handle profile creation properly
  
  2. Security
    - Maintains existing RLS policies
    - Ensures every auth user has a corresponding profile
*/

-- Insert missing profiles for existing auth users
INSERT INTO profiles (id, email, full_name, mode, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'professional',
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create or replace function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, mode, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'professional',
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Migration: 20260116133620_create_training_module.sql
-- ============================================================================

/*
  # Training Module Schema

  ## Overview
  This migration creates the complete training management system for educational institutions
  and trainers to manage students, training programs, and administrative documents.

  ## New Tables

  ### 1. students
  Main table storing student information
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key) - Multi-tenant isolation
  - `first_name` (text) - Student first name
  - `last_name` (text) - Student last name
  - `instagram_username` (text, nullable) - Instagram handle
  - `email` (text, nullable) - Contact email
  - `phone` (text, nullable) - Contact phone
  - `status` (text) - Student status: 'upcoming', 'in_progress', 'completed'
  - `internal_notes` (text, nullable) - Private notes for trainer
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. training_programs
  Available training programs/courses
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key) - Multi-tenant isolation
  - `name` (text) - Program name (e.g., "Advanced Nail Art")
  - `description` (text, nullable) - Program description
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. student_trainings
  Junction table linking students to training programs with dates
  - `id` (uuid, primary key)
  - `student_id` (uuid, foreign key) - References students
  - `training_program_id` (uuid, foreign key) - References training_programs
  - `training_date` (date) - Scheduled or actual training date
  - `status` (text) - Training status: 'upcoming', 'in_progress', 'completed'
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. student_documents
  Document management for each student
  - `id` (uuid, primary key)
  - `student_id` (uuid, foreign key) - References students
  - `document_type` (text) - Type of document (see enum below)
  - `document_stage` (text) - Stage: 'before', 'during', 'after'
  - `file_path` (text) - Path in Supabase Storage
  - `uploaded_at` (timestamptz) - Upload timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Document Types by Stage

  ### Before Training:
  - contract - Training contract/agreement
  - signed_quote - Signed quote/estimate
  - training_program_doc - Training program document
  - signed_rules - Signed internal rules

  ### During Training:
  - attendance_sheets - Attendance/signature sheets
  - training_materials - Training support materials
  - skills_assessment - Skills evaluation
  - satisfaction_survey - Satisfaction questionnaire

  ### After Training:
  - completion_certificate - Certificate of completion
  - invoice - Final invoice

  ## Security
  All tables have RLS enabled with policies ensuring:
  - Users can only access their company's data (company_id match)
  - Full CRUD access for authenticated users within their company
  - No public access

  ## Indexes
  - Foreign keys for optimal join performance
  - company_id indexes for multi-tenant queries
  - Status indexes for filtering

  ## Storage Bucket
  - Creates 'student-documents' bucket for file uploads
  - Restricted to authenticated users
  - Company-based folder structure
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  instagram_username text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_trainings junction table
CREATE TABLE IF NOT EXISTS student_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  training_program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  training_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_documents table
CREATE TABLE IF NOT EXISTS student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'contract', 'signed_quote', 'training_program_doc', 'signed_rules',
    'attendance_sheets', 'training_materials', 'skills_assessment', 'satisfaction_survey',
    'completion_certificate', 'invoice'
  )),
  document_stage text NOT NULL CHECK (document_stage IN ('before', 'during', 'after')),
  file_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_company_id ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_student_id ON student_trainings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_trainings_status ON student_trainings(status);
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Users can view students from their company"
  ON students FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert students for their company"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update students from their company"
  ON students FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete students from their company"
  ON students FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for training_programs table
CREATE POLICY "Users can view training programs from their company"
  ON training_programs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert training programs for their company"
  ON training_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update training programs from their company"
  ON training_programs FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training programs from their company"
  ON training_programs FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for student_trainings table
CREATE POLICY "Users can view student trainings for their students"
  ON student_trainings FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert student trainings for their students"
  ON student_trainings FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update student trainings for their students"
  ON student_trainings FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete student trainings for their students"
  ON student_trainings FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for student_documents table
CREATE POLICY "Users can view documents for their students"
  ON student_documents FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert documents for their students"
  ON student_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents for their students"
  ON student_documents FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents for their students"
  ON student_documents FOR DELETE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE company_id IN (
        SELECT id FROM company_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student-documents bucket
CREATE POLICY "Authenticated users can upload student documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can view their student documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can update their student documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'student-documents')
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can delete their student documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'student-documents');

-- ============================================================================
-- Migration: 20260116135601_add_company_id_to_user_profiles.sql
-- ============================================================================

/*
  # Add company_id to user_profiles
  
  ## Description
  This migration fixes the issue where user_profiles don't have a company_id field,
  causing modules like Training to fail when checking company_id for multi-tenant access.
  
  ## Changes
  1. Add company_id column to user_profiles table
  2. Create a function to automatically sync company_id when company_profiles is created/updated
  3. Create triggers to keep user_profiles.company_id in sync with company_profiles
  4. Backfill existing user_profiles with company_id from company_profiles
  
  ## Safety
  - Nullable company_id initially to support gradual rollout
  - Automatic sync via triggers ensures data consistency
  - Backfill script for existing data
*/

-- Add company_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- Function to sync company_id to user_profiles when company_profiles is created/updated
CREATE OR REPLACE FUNCTION sync_company_id_to_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET company_id = NEW.id
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on company_profiles to sync company_id
DROP TRIGGER IF EXISTS trigger_sync_company_id ON company_profiles;
CREATE TRIGGER trigger_sync_company_id
  AFTER INSERT OR UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_id_to_user_profile();

-- Backfill existing user_profiles with company_id from company_profiles
UPDATE user_profiles up
SET company_id = cp.id
FROM company_profiles cp
WHERE up.user_id = cp.user_id
  AND up.company_id IS NULL;

-- ============================================================================
-- Migration: 20260116141108_add_training_start_date_and_level.sql
-- ============================================================================

/*
  # Add training start date and level to students
  
  ## Description
  This migration adds critical fields to the students table to support proper
  training lifecycle management and multi-level training programs.
  
  ## Changes
  1. Add training_start_date to students table - Required for status determination
  2. Add training_level to students table - Optional field for multi-level programs
  3. Update existing students with default training_start_date based on earliest training
  
  ## New Fields
  - `training_start_date` (date, not null) - The actual start date of the training
    This is different from created_at and determines the training status
  - `training_level` (text, nullable) - Training level (e.g., "beginner", "advanced")
    Optional field for programs with multiple levels
  
  ## Safety
  - Uses conditional checks to avoid errors if fields already exist
  - Backfills existing records with reasonable defaults
*/

-- Add training_start_date to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_start_date'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_start_date date;
  END IF;
END $$;

-- Add training_level to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_level'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_level text;
  END IF;
END $$;

-- Backfill training_start_date for existing students
-- Use the earliest training_date from student_trainings or created_at if no trainings
UPDATE students s
SET training_start_date = COALESCE(
  (SELECT MIN(st.training_date)
   FROM student_trainings st
   WHERE st.student_id = s.id),
  s.created_at::date
)
WHERE training_start_date IS NULL;

-- Make training_start_date NOT NULL after backfill
ALTER TABLE students
ALTER COLUMN training_start_date SET NOT NULL;

-- Add default value for new records
ALTER TABLE students
ALTER COLUMN training_start_date SET DEFAULT CURRENT_DATE;

-- ============================================================================
-- Migration: 20260116143326_add_service_type_to_services.sql
-- ============================================================================

/*
  # Add service type to services table

  ## Description
  This migration adds a service_type column to the services table to distinguish
  between regular services (prestations) and training services (formations).
  This enables proper categorization and filtering of services for different use cases.

  ## Changes
  1. Add service_type column to services table
     - Type: text with check constraint
     - Values: 'prestation' or 'formation'
     - Default: 'prestation' (for existing records)
     - Not null after backfill

  2. Backfill existing services
     - Set all existing services to 'prestation' by default

  ## New Field
  - `service_type` (text, not null) - Type of service
    - 'prestation': Regular customer service (nails, lashes, etc.)
    - 'formation': Training service for students

  ## Impact
  - Existing services remain unchanged (marked as 'prestation')
  - New services can be created as either type
  - Enables filtering services by type for student training selection

  ## Safety
  - Uses conditional checks to avoid errors if field already exists
  - Backfills existing records before setting NOT NULL constraint
  - Adds check constraint for data integrity
*/

-- Add service_type column to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE services
    ADD COLUMN service_type text;
  END IF;
END $$;

-- Backfill existing services with 'prestation' as default
UPDATE services
SET service_type = 'prestation'
WHERE service_type IS NULL;

-- Make service_type NOT NULL after backfill
ALTER TABLE services
ALTER COLUMN service_type SET NOT NULL;

-- Add default value for new records
ALTER TABLE services
ALTER COLUMN service_type SET DEFAULT 'prestation';

-- Add check constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_service_type_check'
  ) THEN
    ALTER TABLE services
    ADD CONSTRAINT services_service_type_check
    CHECK (service_type IN ('prestation', 'formation'));
  END IF;
END $$;

-- Create index for faster filtering by service type
CREATE INDEX IF NOT EXISTS idx_services_service_type
ON services(service_type);

-- ============================================================================
-- Migration: 20260116144843_add_student_end_date_formation_photo.sql
-- ============================================================================

/*
  # Add end date, formation link, and photo to students table

  ## Description
  This migration enhances the students table with essential fields for automatic
  status calculation and improved student management:
  - Training end date for automatic status determination
  - Formation service link to connect students with their training programs
  - Photo URL for student profile pictures

  ## Changes
  1. Add training_end_date column
     - Type: date, not null
     - Required for automatic status calculation based on date range
     - Backfilled with start_date + 90 days for existing records

  2. Add formation_id column
     - Type: uuid, nullable
     - Foreign key to services table
     - Links student to their training service (service_type = 'formation')
     - Optional field (students can exist without a linked formation)

  3. Add photo_url column
     - Type: text, nullable
     - Stores student profile picture URL
     - Optional field

  ## New Fields
  - `training_end_date` (date, not null) - End date of training
  - `formation_id` (uuid, nullable) - Reference to services(id) for training service
  - `photo_url` (text, nullable) - URL to student profile photo

  ## Status Logic (Automatic)
  Based on these dates, status is calculated as:
  - today < training_start_date → 'upcoming'
  - today >= training_start_date AND today <= training_end_date → 'in_progress'
  - today > training_end_date → 'completed'

  ## Safety
  - Uses conditional checks to avoid errors if fields already exist
  - Backfills existing records with reasonable defaults
  - Adds foreign key constraint with CASCADE on delete
  - No data loss
*/

-- Add training_end_date to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'training_end_date'
  ) THEN
    ALTER TABLE students
    ADD COLUMN training_end_date date;
  END IF;
END $$;

-- Add formation_id to students table (reference to services)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'formation_id'
  ) THEN
    ALTER TABLE students
    ADD COLUMN formation_id uuid REFERENCES services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add photo_url to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE students
    ADD COLUMN photo_url text;
  END IF;
END $$;

-- Backfill training_end_date for existing students
-- Default: 90 days after start date (typical training duration)
UPDATE students
SET training_end_date = training_start_date + INTERVAL '90 days'
WHERE training_end_date IS NULL;

-- Make training_end_date NOT NULL after backfill
ALTER TABLE students
ALTER COLUMN training_end_date SET NOT NULL;

-- Add index on formation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_formation_id
ON students(formation_id);

-- Add index on training dates for status queries
CREATE INDEX IF NOT EXISTS idx_students_training_dates
ON students(training_start_date, training_end_date);

-- ============================================================================
-- Migration: 20260116152421_add_formation_documents_fixed.sql
-- ============================================================================

/*
  # Add formation documents table (fixed)

  ## Description
  This migration creates a table to store training/formation documents
  that can be attached to services of type 'formation'.
  These documents are optional and serve as reusable resources (program, materials, etc.).

  ## Changes
  1. Create formation_documents table
     - Links to services table
     - Stores file path, document type, and metadata
     - Optional documents for formations
  
  2. Security
     - Enable RLS
     - Users can only access documents from their own services

  ## New Table
  - `formation_documents`
    - id (uuid, primary key)
    - service_id (uuid, foreign key to services)
    - document_type (text) - 'program', 'materials', 'other'
    - file_path (text) - URL to the document
    - file_name (text) - Original file name
    - uploaded_at (timestamptz)
    - created_at (timestamptz)

  ## Safety
  - Uses IF NOT EXISTS to prevent errors
  - RLS enabled by default
  - Cascade deletion when service is deleted
*/

-- Create formation_documents table
CREATE TABLE IF NOT EXISTS formation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('program', 'materials', 'other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE formation_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view formation documents from their own services
CREATE POLICY "Users can view own formation documents"
  ON formation_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Users can insert formation documents for their own services
CREATE POLICY "Users can add formation documents to own services"
  ON formation_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Users can delete formation documents from their own services
CREATE POLICY "Users can delete own formation documents"
  ON formation_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = formation_documents.service_id
      AND s.user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_formation_documents_service_id
ON formation_documents(service_id);

-- ============================================================================
-- Migration: 20260116152538_add_user_documents.sql
-- ============================================================================

/*
  # Add user documents table

  ## Description
  This migration creates a table to store general reusable documents
  for users. These documents are centralized and can be used across
  different parts of the application.

  ## Changes
  1. Create user_documents table
     - Stores user's personal documents
     - Categorized for organization
     - No specific business logic - simple storage
  
  2. Security
     - Enable RLS
     - Users can only access their own documents

  ## New Table
  - `user_documents`
    - id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - category (text) - 'administrative', 'personal', 'training', 'other'
    - file_path (text) - URL to the document
    - file_name (text) - Original file name
    - uploaded_at (timestamptz)
    - created_at (timestamptz)

  ## Safety
  - Uses IF NOT EXISTS to prevent errors
  - RLS enabled by default
  - Cascade deletion when user is deleted
*/

-- Create user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('administrative', 'personal', 'training', 'other')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  notes text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own documents
CREATE POLICY "Users can view own documents"
  ON user_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert own documents
CREATE POLICY "Users can add own documents"
  ON user_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own documents
CREATE POLICY "Users can update own documents"
  ON user_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete own documents
CREATE POLICY "Users can delete own documents"
  ON user_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id
ON user_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_documents_category
ON user_documents(category);

-- ============================================================================
-- Migration: 20260116155626_add_client_photo_and_enhanced_fields.sql
-- ============================================================================

/*
  # Add client photo and enhanced fields

  ## Description
  This migration adds photo_url to the clients table to support
  client profile pictures and other enhanced client management features.

  ## Changes
  1. Add photo_url column to clients table
  2. No breaking changes - existing data remains intact

  ## New Columns
  - `photo_url` (text, nullable) - URL to client's profile photo

  ## Safety
  - Uses IF NOT EXISTS patterns where applicable
  - Non-destructive migration
  - Nullable column to allow existing records
*/

-- Add photo_url to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN photo_url text;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260116163029_add_client_archiving_system.sql
-- ============================================================================

/*
  # Add client archiving system

  ## Description
  This migration adds soft delete functionality to the clients table,
  allowing clients to be archived instead of permanently deleted.

  ## Changes
  1. Add is_archived column to clients table (default: false)
  2. Archived clients are excluded from default queries but can be filtered

  ## New Columns
  - `is_archived` (boolean, default false) - Soft delete flag for client archiving

  ## Safety
  - Uses IF NOT EXISTS pattern
  - Non-destructive migration
  - Default value ensures existing records are not archived
*/

-- Add is_archived column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better query performance on archived filter
CREATE INDEX IF NOT EXISTS idx_clients_is_archived ON clients(is_archived);
CREATE INDEX IF NOT EXISTS idx_clients_user_id_is_archived ON clients(user_id, is_archived);

-- ============================================================================
-- Migration: 20260116164637_enhance_client_profile_fields.sql
-- ============================================================================

/*
  # Enhance client profile with additional fields

  ## Description
  This migration adds new fields to the clients table to support
  enhanced client management features including birth date for
  personalized communication and loyalty tracking.

  ## Changes
  1. Add birth_date field to clients table (optional date)
  2. Add loyalty_points field for future loyalty program
  3. Add preferred_contact field for communication preferences

  ## New Columns
  - `birth_date` (date, nullable) - Client birth date for birthday reminders
  - `loyalty_points` (integer, default 0) - Points accumulated for loyalty program
  - `preferred_contact` (text, nullable) - Preferred contact method (phone/email/sms)

  ## Safety
  - Uses IF NOT EXISTS pattern
  - Non-destructive migration
  - Default values ensure existing records work correctly
*/

-- Add birth_date column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE clients ADD COLUMN birth_date date;
  END IF;
END $$;

-- Add loyalty_points column for loyalty program
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'loyalty_points'
  ) THEN
    ALTER TABLE clients ADD COLUMN loyalty_points integer DEFAULT 0;
  END IF;
END $$;

-- Add preferred_contact column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'preferred_contact'
  ) THEN
    ALTER TABLE clients ADD COLUMN preferred_contact text CHECK (preferred_contact IN ('phone', 'email', 'sms', 'instagram'));
  END IF;
END $$;

-- Create index for birthday queries (useful for birthday reminders)
CREATE INDEX IF NOT EXISTS idx_clients_birth_date ON clients(birth_date) WHERE birth_date IS NOT NULL;

-- ============================================================================
-- Migration: 20260116170026_add_activity_types_and_custom_client_fields.sql
-- ============================================================================

/*
  # Ajout des types d'activité multiples et champs clients personnalisables

  ## Modifications

  1. **company_profiles**
    - Ajout de `activity_types` (text[]) pour permettre plusieurs types d'activité
    - Migration des données existantes de activity_type vers activity_types

  2. **Nouvelle table: custom_client_fields**
    - `id` (uuid, primary key)
    - `user_id` (uuid, référence à auth.users)
    - `company_id` (uuid, référence à company_profiles)
    - `field_name` (text) - nom du champ (ex: "Type de peau")
    - `field_type` (text) - type de champ (text, select, number, date)
    - `field_options` (text[]) - options pour les selects
    - `is_required` (boolean) - champ obligatoire ou non
    - `display_order` (integer) - ordre d'affichage
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. **Nouvelle table: client_custom_data**
    - `id` (uuid, primary key)
    - `client_id` (uuid, référence à clients)
    - `field_id` (uuid, référence à custom_client_fields)
    - `field_value` (text) - valeur du champ
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  ## Sécurité
    - RLS activé sur toutes les tables
    - Les utilisateurs peuvent uniquement gérer leurs propres champs personnalisés
*/

-- Ajouter activity_types à company_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'activity_types'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN activity_types text[] DEFAULT '{}';
    
    -- Migrer les données existantes
    UPDATE company_profiles 
    SET activity_types = ARRAY[activity_type]
    WHERE activity_type IS NOT NULL AND activity_type != '';
  END IF;
END $$;

-- Table pour les champs personnalisés
CREATE TABLE IF NOT EXISTS custom_client_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  field_options text[] DEFAULT '{}',
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_client_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom fields"
  ON custom_client_fields FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom fields"
  ON custom_client_fields FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom fields"
  ON custom_client_fields FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom fields"
  ON custom_client_fields FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table pour stocker les valeurs des champs personnalisés
CREATE TABLE IF NOT EXISTS client_custom_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  field_id uuid REFERENCES custom_client_fields(id) ON DELETE CASCADE NOT NULL,
  field_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, field_id)
);

ALTER TABLE client_custom_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read client custom data for their clients"
  ON client_custom_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert client custom data for their clients"
  ON client_custom_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update client custom data for their clients"
  ON client_custom_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client custom data for their clients"
  ON client_custom_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_custom_client_fields_user_id ON custom_client_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_client_fields_company_id ON custom_client_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_client_custom_data_client_id ON client_custom_data(client_id);
CREATE INDEX IF NOT EXISTS idx_client_custom_data_field_id ON client_custom_data(field_id);


-- ============================================================================
-- Migration: 20260117140809_add_service_supplements_and_extend_types.sql
-- ============================================================================

/*
  # Add service supplements and extend service types

  1. Service Types Extension
    - Extend service_type constraint to allow more types:
      - prestation
      - formation
      - digital_sale (vente digitale)
      - commission
      - other (autre)

  2. New Tables
    - `service_supplements`: Suppléments for services
      - id (uuid, primary key)
      - service_id (uuid, foreign key)
      - name (text) - Nom du supplément
      - duration_minutes (integer) - Durée additionnelle en minutes
      - price (decimal) - Prix du supplément
      - created_at (timestamptz)

    - `revenue_supplements`: Link between revenues and supplements used
      - id (uuid, primary key)
      - revenue_id (uuid, foreign key)
      - supplement_id (uuid, foreign key)
      - quantity (integer) - Nombre de fois appliqué
      - price_at_time (decimal) - Prix au moment de la transaction
      - created_at (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to manage their own data
*/

-- Drop existing check constraint on service_type
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_service_type_check;

-- Add new check constraint with extended types
ALTER TABLE services
ADD CONSTRAINT services_service_type_check
CHECK (service_type IN ('prestation', 'formation', 'digital_sale', 'commission', 'other'));

-- Create service_supplements table
CREATE TABLE IF NOT EXISTS service_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer DEFAULT 0,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create revenue_supplements table
CREATE TABLE IF NOT EXISTS revenue_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_id uuid NOT NULL REFERENCES revenues(id) ON DELETE CASCADE,
  supplement_id uuid NOT NULL REFERENCES service_supplements(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price_at_time decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_supplements ENABLE ROW LEVEL SECURITY;

-- Policies for service_supplements
CREATE POLICY "Users can view own service supplements"
  ON service_supplements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service supplements"
  ON service_supplements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service supplements"
  ON service_supplements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service supplements"
  ON service_supplements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for revenue_supplements
CREATE POLICY "Users can view own revenue supplements"
  ON revenue_supplements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own revenue supplements"
  ON revenue_supplements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own revenue supplements"
  ON revenue_supplements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own revenue supplements"
  ON revenue_supplements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_supplements_service_id
ON service_supplements(service_id);

CREATE INDEX IF NOT EXISTS idx_service_supplements_user_id
ON service_supplements(user_id);

CREATE INDEX IF NOT EXISTS idx_revenue_supplements_revenue_id
ON revenue_supplements(revenue_id);

CREATE INDEX IF NOT EXISTS idx_revenue_supplements_supplement_id
ON revenue_supplements(supplement_id);


-- ============================================================================
-- Migration: 20260117145559_add_supplement_snapshot_fields.sql
-- ============================================================================

/*
  # Ajouter champs snapshot aux revenue_supplements

  1. Modifications
    - Ajouter `supplement_name` (text) pour stocker le nom au moment de la transaction
    - Ajouter `duration_minutes` (integer) pour stocker la durée au moment de la transaction
  
  2. Objectif
    - Conserver un snapshot complet des suppléments même si modifiés/supprimés plus tard
    - Permet d'afficher l'historique exact des transactions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenue_supplements' AND column_name = 'supplement_name'
  ) THEN
    ALTER TABLE revenue_supplements ADD COLUMN supplement_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenue_supplements' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE revenue_supplements ADD COLUMN duration_minutes integer DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260117165316_fix_revenue_supplements_constraints.sql
-- ============================================================================

/*
  # Correction des contraintes revenue_supplements
  
  1. Modifications
    - Mettre supplement_name NOT NULL (requis pour snapshot)
    - Mettre duration_minutes nullable (pour formations sans durée)
    - Supprimer DEFAULT 0 de duration_minutes
  
  2. Objectif
    - Permettre insertion de suppléments avec duration_minutes = NULL (formations)
    - Garantir que supplement_name est toujours présent
*/

-- Modifier duration_minutes pour accepter NULL et supprimer DEFAULT
DO $$
BEGIN
  -- Supprimer le DEFAULT si présent
  ALTER TABLE revenue_supplements 
  ALTER COLUMN duration_minutes DROP DEFAULT;
  
  -- S'assurer que la colonne accepte NULL
  ALTER TABLE revenue_supplements 
  ALTER COLUMN duration_minutes DROP NOT NULL;
END $$;

-- S'assurer que supplement_name est NOT NULL
DO $$
BEGIN
  -- Mettre une valeur par défaut pour les enregistrements existants sans nom
  UPDATE revenue_supplements 
  SET supplement_name = 'Supplément'
  WHERE supplement_name IS NULL;
  
  -- Ajouter la contrainte NOT NULL
  ALTER TABLE revenue_supplements 
  ALTER COLUMN supplement_name SET NOT NULL;
END $$;

-- ============================================================================
-- Migration: 20260117170542_fix_revenue_type_constraint_and_values_v3.sql
-- ============================================================================

/*
  # Fix revenue_type constraint and normalize values (v3)

  1. Problem
    - Current constraint allows: 'service', 'formation', 'digital_sale', 'commission', 'other'
    - Some existing data has incompatible values
    - Desired values: 'prestation', 'formation', 'vente_digitale', 'commission', 'autre'

  2. Strategy
    - Drop constraints first
    - Migrate all data in both revenues and services tables
    - Create new constraints with correct values

  3. New allowed values (snake_case, stable)
    - prestation
    - formation
    - vente_digitale
    - commission
    - autre
*/

-- Step 1: Drop old constraints first (to allow data migration)
ALTER TABLE revenues
DROP CONSTRAINT IF EXISTS revenues_revenue_type_check;

ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_service_type_check;

-- Step 2: Migrate revenues table data to normalized values
UPDATE revenues
SET revenue_type = 'prestation'
WHERE revenue_type = 'service';

UPDATE revenues
SET revenue_type = 'vente_digitale'
WHERE revenue_type = 'digital_sale';

UPDATE revenues
SET revenue_type = 'autre'
WHERE revenue_type = 'other';

-- Step 3: Migrate services table data to normalized values
UPDATE services
SET service_type = 'prestation'
WHERE service_type = 'service';

UPDATE services
SET service_type = 'vente_digitale'
WHERE service_type = 'digital_sale';

UPDATE services
SET service_type = 'autre'
WHERE service_type = 'other';

-- Step 4: Create new constraints with normalized values
ALTER TABLE revenues
ADD CONSTRAINT revenues_revenue_type_check
CHECK (revenue_type IN ('prestation', 'formation', 'vente_digitale', 'commission', 'autre'));

ALTER TABLE services
ADD CONSTRAINT services_service_type_check
CHECK (service_type IN ('prestation', 'formation', 'vente_digitale', 'commission', 'autre'));

-- ============================================================================
-- Migration: 20260117175243_add_clients_performance_indexes.sql
-- ============================================================================

/*
  # Add Performance Indexes for Clients Table

  1. Performance Improvements
    - Add index on `updated_at DESC` for efficient sorting of recent clients
    - Add index on `created_at DESC` for sorting by creation date
    - Add trigram index on `first_name` for fast case-insensitive search
    - Add trigram index on `last_name` for fast case-insensitive search
    - Add trigram index on `email` for fast case-insensitive search
    - Add trigram index on `phone` for fast case-insensitive search
    - Add composite index on `user_id, is_archived, updated_at` for filtered queries

  2. Why These Indexes
    - `updated_at DESC`: Fast sorting for "most recent" queries
    - `created_at DESC`: Fast sorting for "newest" queries
    - Trigram indexes: Enable fast ILIKE/LIKE searches (case-insensitive)
    - Composite index: Optimize common filter patterns (user + archived status + sort)

  3. Impact
    - Queries with ORDER BY updated_at/created_at: 10-100x faster
    - Search queries with ILIKE: 5-50x faster
    - Pagination with WHERE + ORDER BY: Much more efficient
*/

-- Enable pg_trgm extension for trigram indexes (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for sorting by updated_at (most common sort)
CREATE INDEX IF NOT EXISTS idx_clients_updated_at_desc 
  ON clients (updated_at DESC);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_clients_created_at_desc 
  ON clients (created_at DESC);

-- Trigram indexes for case-insensitive search on text fields
CREATE INDEX IF NOT EXISTS idx_clients_first_name_trgm 
  ON clients USING gin (lower(first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_last_name_trgm 
  ON clients USING gin (lower(last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_email_trgm 
  ON clients USING gin (lower(email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm 
  ON clients USING gin (lower(phone) gin_trgm_ops);

-- Composite index for common query pattern: filter by user + archived + sort
CREATE INDEX IF NOT EXISTS idx_clients_user_archived_updated 
  ON clients (user_id, is_archived, updated_at DESC);

-- Index for filtering by user + archived status
CREATE INDEX IF NOT EXISTS idx_clients_user_archived 
  ON clients (user_id, is_archived);

-- ============================================================================
-- Migration: 20260117180416_add_student_id_to_revenues.sql
-- ============================================================================

/*
  # Add student_id to revenues table for training tracking

  1. Changes
    - Add `student_id` column to `revenues` table (nullable foreign key)
    - References `students` table
    - Used when revenue type is 'formation' to link to a specific student
    - Allows tracking which student each training revenue is associated with

  2. Notes
    - Column is nullable since not all revenue types require a student
    - Only required when type = 'formation'
    - Maintains referential integrity with students table
    - No data loss on student deletion (SET NULL)
*/

-- Add student_id column to revenues table
ALTER TABLE revenues
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;

-- Add index for faster lookups when filtering by student
CREATE INDEX IF NOT EXISTS idx_revenues_student_id ON revenues(student_id);

-- Add comment for documentation
COMMENT ON COLUMN revenues.student_id IS 'Student associated with this training revenue (when type=formation)';

-- ============================================================================
-- Migration: 20260117180802_add_training_service_to_students.sql
-- ============================================================================

/*
  # Add training_service_id to students table

  1. Changes
    - Add `training_service_id` column to `students` table (nullable foreign key)
    - References `services` table
    - Used to link a student to the training/formation they are following
    - Only services with type='formation' should be selectable

  2. Notes
    - Column is nullable since it's optional
    - Maintains referential integrity with services table
    - No data loss on service deletion (SET NULL)
*/

-- Add training_service_id column to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS training_service_id uuid REFERENCES services(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_training_service_id ON students(training_service_id);

-- Add comment for documentation
COMMENT ON COLUMN students.training_service_id IS 'Formation/training service this student is following';

-- ============================================================================
-- Migration: 20260117181509_add_birth_date_to_clients.sql
-- ============================================================================

/*
  # Add birth_date to clients table

  1. Changes
    - Add `birth_date` column to `clients` table (nullable date)
    - Used to store client's date of birth
    - Optional field for client profiles

  2. Notes
    - Column is nullable since it's optional
    - Uses date type (not timestamp) for birth dates
    - No default value
*/

-- Add birth_date column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS birth_date date;

-- Add comment for documentation
COMMENT ON COLUMN clients.birth_date IS 'Client date of birth (optional)';

-- ============================================================================
-- Migration: 20260117181607_add_profession_fields_to_company_profiles.sql
-- ============================================================================

/*
  # Add profession fields to company_profiles

  1. Changes
    - Add `primary_profession` column (stores the main profession key)
    - Add `additional_professions` column (array for multi-profession mode)
    - These replace the old activity_type/activity_types pattern

  2. Notes
    - primary_profession uses snake_case keys (nail_artist, estheticienne, etc.)
    - additional_professions is only used when primary_profession = 'multi_metiers'
    - Both columns are nullable for backward compatibility
*/

-- Add primary_profession column to company_profiles table
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS primary_profession text;

-- Add additional_professions column (array of text)
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS additional_professions text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN company_profiles.primary_profession IS 'Main profession key (nail_artist, estheticienne, coiffeuse, etc.)';
COMMENT ON COLUMN company_profiles.additional_professions IS 'Additional professions when primary_profession is multi_metiers';

-- ============================================================================
-- Migration: 20260117181758_add_profession_specific_fields_to_clients.sql
-- ============================================================================

/*
  # Add profession-specific fields to clients table

  1. Changes
    - Add `hair_type` for coiffeuse
    - Add `scalp_type` for coiffeuse  
    - Add `lash_type` for lash artist
    - Add `brow_type` for brow artist
    - Add `skin_conditions` for estheticienne/facialiste

  2. Notes
    - All fields are nullable (optional)
    - These fields will be displayed dynamically based on user's profession
    - Supports multi-profession mode where multiple sections can be shown
*/

-- Add hair_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS hair_type text;

-- Add scalp_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS scalp_type text;

-- Add lash_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS lash_type text;

-- Add brow_type column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS brow_type text;

-- Add skin_conditions column (text array for multiple conditions)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS skin_conditions text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN clients.hair_type IS 'Hair type/characteristics (for coiffeuse)';
COMMENT ON COLUMN clients.scalp_type IS 'Scalp condition (for coiffeuse)';
COMMENT ON COLUMN clients.lash_type IS 'Lash characteristics (for lash artist)';
COMMENT ON COLUMN clients.brow_type IS 'Brow characteristics (for brow artist)';
COMMENT ON COLUMN clients.skin_conditions IS 'Skin conditions (for estheticienne/facialiste)';

-- ============================================================================
-- Migration: 20260117184951_add_banned_status_to_clients_v2.sql
-- ============================================================================

/*
  # Add banned status to clients

  1. Changes
    - Add `banned` boolean column to `clients` table
      - Default: false
      - Indexed for filtering
    - Add `banned_at` timestamp column to track when a client was banned
    - Add `banned_reason` text column for optional ban reason

  2. Notes
    - Banned clients remain in the database for historical records
    - The banned status is separate from archived status (is_archived)
    - A client can be both banned and archived
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'banned_reason'
  ) THEN
    ALTER TABLE clients ADD COLUMN banned_reason text;
  END IF;
END $$;

-- Create index for filtering banned clients
CREATE INDEX IF NOT EXISTS idx_clients_banned ON clients(banned) WHERE banned = true;
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(is_archived) WHERE is_archived = true;

-- ============================================================================
-- Migration: 20260117204003_add_client_loyalty_status.sql
-- ============================================================================

/*
  # Add client loyalty status fields

  1. Changes
    - Add `is_fidele` boolean to `clients` table - marks loyal clients (⭐)
    - Add `is_vip` boolean to `clients` table - marks VIP clients (💎)
    - Both default to false
    - Add indexes for faster filtering

  2. Purpose
    - Enable visual differentiation in agenda with star/diamond icons
    - Track client loyalty status for business analytics
    - VIP status has priority over fidele status in display
*/

-- Add loyalty status columns
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_fidele boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_is_fidele ON clients(is_fidele) WHERE is_fidele = true;
CREATE INDEX IF NOT EXISTS idx_clients_is_vip ON clients(is_vip) WHERE is_vip = true;

-- Add comments for documentation
COMMENT ON COLUMN clients.is_fidele IS 'Loyal client status - displays ⭐ in agenda';
COMMENT ON COLUMN clients.is_vip IS 'VIP client status - displays 💎 in agenda (priority over fidele)';


-- ============================================================================
-- Migration: 20260117204044_add_student_id_and_badge_to_events_v2.sql
-- ============================================================================

/*
  # Add student support and badge system to events

  1. Changes
    - Add `student_id` column to `events` table (nullable foreign key)
    - Add `badge_type` column to store icon type (student/fidele/vip)
    - Add index for faster student event lookups
    - Update type constraint to include 'pro' and 'formation' event types

  2. Purpose
    - Enable linking events to students for training appointments
    - Store badge type for visual differentiation in agenda
    - Support formation/training events in addition to client events
    - Fix constraint to include existing 'pro' type
*/

-- Add student_id column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;

-- Add badge_type for icon display (student/fidele/vip)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS badge_type text CHECK (badge_type IN ('student', 'fidele', 'vip'));

-- Update type constraint to include 'pro' and 'formation'
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
  
  -- Add new constraint with all types including 'pro' and 'formation'
  ALTER TABLE events ADD CONSTRAINT events_type_check 
    CHECK (type IN ('client', 'personal', 'google', 'planity', 'pro', 'formation'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index for student lookups
CREATE INDEX IF NOT EXISTS idx_events_student_id ON events(student_id);

-- Add comments
COMMENT ON COLUMN events.student_id IS 'Student associated with this event (for formation/training appointments)';
COMMENT ON COLUMN events.badge_type IS 'Badge icon type: student (🎓), fidele (⭐), vip (💎)';


-- ============================================================================
-- Migration: 20260117232806_auto_calculate_client_status.sql
-- ============================================================================

/*
  # Calcul automatique des statuts cliente (Fidèle/VIP)

  1. Fonction de calcul automatique
    - `update_client_loyalty_status()` : calcule is_fidele et is_vip basé sur le nombre de RDV confirmés
    - Seuils :
      - Cliente fidèle : 5+ rendez-vous confirmés
      - Cliente VIP : 10+ rendez-vous confirmés
    - Priorité : VIP > Fidèle

  2. Trigger automatique
    - Déclenché après INSERT/UPDATE/DELETE sur events
    - Met à jour automatiquement les statuts des clientes concernées

  3. Initialisation
    - Met à jour tous les statuts existants selon la nouvelle logique

  4. Important
    - Les champs is_fidele et is_vip restent en base mais ne sont plus modifiables manuellement
    - Les statuts sont calculés uniquement sur les événements de type 'pro' et status 'confirmed'
*/

-- Fonction pour calculer et mettre à jour le statut d'une cliente
CREATE OR REPLACE FUNCTION update_client_loyalty_status(target_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  confirmed_count integer;
BEGIN
  -- Compter le nombre de rendez-vous confirmés pour cette cliente
  SELECT COUNT(*)
  INTO confirmed_count
  FROM events
  WHERE client_id = target_client_id
    AND type = 'pro'
    AND status = 'confirmed';

  -- Mettre à jour les statuts selon les seuils
  UPDATE clients
  SET
    is_vip = (confirmed_count >= 10),
    is_fidele = (confirmed_count >= 5 AND confirmed_count < 10),
    updated_at = now()
  WHERE id = target_client_id;
END;
$$;

-- Fonction trigger pour mettre à jour automatiquement après modification d'événement
CREATE OR REPLACE FUNCTION trigger_update_client_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si un événement est créé ou modifié avec un client_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.client_id IS NOT NULL THEN
    PERFORM update_client_loyalty_status(NEW.client_id);
  END IF;

  -- Si un événement est supprimé ou modifié (ancien client_id différent)
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id))
     AND OLD.client_id IS NOT NULL THEN
    PERFORM update_client_loyalty_status(OLD.client_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Créer le trigger sur la table events
DROP TRIGGER IF EXISTS auto_update_client_status_trigger ON events;
CREATE TRIGGER auto_update_client_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_client_status();

-- Recalculer tous les statuts existants
DO $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN
    SELECT DISTINCT id FROM clients WHERE user_id IS NOT NULL
  LOOP
    PERFORM update_client_loyalty_status(client_record.id);
  END LOOP;
END $$;


-- ============================================================================
-- Migration: 20260118000549_create_content_social_media_module.sql
-- ============================================================================

/*
  # Module Contenu & Réseaux Sociaux

  1. Nouvelles Tables
    - `content_calendar`
      - Contenus planifiés avec dates obligatoires
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `content_type` (text)
      - `platform` (text)
      - `publication_date` (date) - OBLIGATOIRE
      - `status` (text) - idea, to_produce, scheduled, published
      - `image_url` (text) - URL de l'image
      - `feed_order` (integer) - ordre dans le feed Instagram
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `marronniers`
      - Calendrier des dates importantes (fêtes, événements)
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable) - null = marronnier global
      - `date` (date)
      - `title` (text)
      - `theme` (text)
      - `industry` (text[]) - beauté, formation, général
      - `suggestions` (jsonb) - suggestions de contenus
      - `is_global` (boolean) - true = visible pour tous
      - `created_at` (timestamptz)

    - `content_alerts`
      - Alertes et conseils réseaux sociaux
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `alert_type` (text) - marronnier, tip, reminder
      - `title` (text)
      - `message` (text)
      - `related_date` (date, nullable)
      - `status` (text) - active, dismissed
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives pour chaque table
    - Marronniers globaux lisibles par tous les utilisateurs authentifiés
    - Marronniers personnalisés visibles uniquement par leur créateur

  3. Fonctionnalités
    - Planification avec dates obligatoires
    - Feed Instagram interactif avec drag & drop
    - Synchronisation bidirectionnelle Feed ↔ Calendrier
    - Calendrier des marronniers
    - Alertes automatiques avant les dates importantes
*/

-- Create content_calendar table
CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  content_type text DEFAULT 'post' CHECK (content_type IN ('reel', 'carrousel', 'post', 'story', 'video', 'live')),
  platform text DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'facebook', 'youtube', 'twitter')),
  publication_date date NOT NULL,
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'to_produce', 'scheduled', 'published')),
  image_url text DEFAULT '',
  feed_order integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content calendar"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content calendar"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content calendar"
  ON content_calendar FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content calendar"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create marronniers table
CREATE TABLE IF NOT EXISTS marronniers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  theme text DEFAULT '',
  industry text[] DEFAULT '{}',
  suggestions jsonb DEFAULT '[]'::jsonb,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marronniers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view global marronniers"
  ON marronniers FOR SELECT
  TO authenticated
  USING (is_global = true);

CREATE POLICY "Users can view own marronniers"
  ON marronniers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marronniers"
  ON marronniers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can update own marronniers"
  ON marronniers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_global = false)
  WITH CHECK (auth.uid() = user_id AND is_global = false);

CREATE POLICY "Users can delete own marronniers"
  ON marronniers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_global = false);

-- Create content_alerts table
CREATE TABLE IF NOT EXISTS content_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text DEFAULT 'tip' CHECK (alert_type IN ('marronnier', 'tip', 'reminder')),
  title text NOT NULL,
  message text NOT NULL,
  related_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content alerts"
  ON content_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content alerts"
  ON content_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content alerts"
  ON content_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content alerts"
  ON content_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert global marronniers (dates importantes françaises)
INSERT INTO marronniers (date, title, theme, industry, is_global, suggestions) VALUES
  ('2026-01-01', 'Nouvel An', 'Nouvelle annee, nouveaux objectifs', ARRAY['general'], true, '[{"title": "Bilan & Projets 2026", "type": "carrousel"}, {"title": "Mes objectifs beaute 2026", "type": "reel"}]'::jsonb),
  ('2026-02-14', 'Saint-Valentin', 'Amour, soin de soi, cadeaux', ARRAY['beauty', 'general'], true, '[{"title": "Nail art special Saint-Valentin", "type": "reel"}, {"title": "Offrez un soin beaute", "type": "post"}]'::jsonb),
  ('2026-03-08', 'Journee de la Femme', 'Empowerment, reussite feminine', ARRAY['general'], true, '[{"title": "Portrait inspirant", "type": "post"}, {"title": "Mon parcours entrepreneurial", "type": "carrousel"}]'::jsonb),
  ('2026-03-20', 'Printemps', 'Renouveau, couleurs pastels', ARRAY['beauty', 'general'], true, '[{"title": "Tendances printemps", "type": "carrousel"}, {"title": "Couleurs de saison", "type": "reel"}]'::jsonb),
  ('2026-05-01', 'Fete du Travail', 'Metier, passion, savoir-faire', ARRAY['general'], true, '[{"title": "Mon metier, ma passion", "type": "reel"}, {"title": "Coulisses du quotidien", "type": "story"}]'::jsonb),
  ('2026-05-10', 'Fete des Meres', 'Cadeaux, soins, moments', ARRAY['beauty', 'general'], true, '[{"title": "Idee cadeau Fete des Meres", "type": "post"}, {"title": "Offre speciale", "type": "carrousel"}]'::jsonb),
  ('2026-06-21', 'Ete', 'Soleil, vacances, fraicheur', ARRAY['beauty', 'general'], true, '[{"title": "Mes essentiels ete", "type": "reel"}, {"title": "Preparer sa peau pour l ete", "type": "carrousel"}]'::jsonb),
  ('2026-07-14', 'Fete Nationale', 'France, patriotisme, bleu-blanc-rouge', ARRAY['general'], true, '[{"title": "Nail art tricolore", "type": "reel"}, {"title": "Mon coin de France", "type": "post"}]'::jsonb),
  ('2026-09-01', 'Rentree', 'Organisation, nouveaux departs', ARRAY['formation', 'general'], true, '[{"title": "Rentree : mes conseils organisation", "type": "carrousel"}, {"title": "Nouveaux projets de rentree", "type": "post"}]'::jsonb),
  ('2026-09-23', 'Automne', 'Couleurs chaudes, cocooning', ARRAY['beauty', 'general'], true, '[{"title": "Tendances automne", "type": "carrousel"}, {"title": "Ambiance cosy", "type": "reel"}]'::jsonb),
  ('2026-10-31', 'Halloween', 'Creativite, nail art, deguisements', ARRAY['beauty', 'general'], true, '[{"title": "Nail art Halloween", "type": "reel"}, {"title": "Transformation spooky", "type": "video"}]'::jsonb),
  ('2026-11-27', 'Black Friday', 'Promotions, offres speciales', ARRAY['general'], true, '[{"title": "Offres Black Friday", "type": "post"}, {"title": "Mes coups de coeur promos", "type": "carrousel"}]'::jsonb),
  ('2026-12-21', 'Hiver', 'Fetes, lumieres, cocooning', ARRAY['beauty', 'general'], true, '[{"title": "Ambiance festive", "type": "reel"}, {"title": "Preparer les fetes", "type": "carrousel"}]'::jsonb),
  ('2026-12-25', 'Noel', 'Fetes, cadeaux, famille', ARRAY['beauty', 'general'], true, '[{"title": "Nail art de Noel", "type": "reel"}, {"title": "Idees cadeaux", "type": "carrousel"}]'::jsonb),
  ('2026-12-31', 'Reveillon', 'Bilan, fete, nouvelle annee', ARRAY['general'], true, '[{"title": "Bilan 2026", "type": "carrousel"}, {"title": "Mes meilleurs moments", "type": "reel"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_date ON content_calendar(user_id, publication_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_feed_order ON content_calendar(user_id, feed_order);
CREATE INDEX IF NOT EXISTS idx_marronniers_date ON marronniers(date);
CREATE INDEX IF NOT EXISTS idx_content_alerts_user_status ON content_alerts(user_id, status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'content_calendar_updated_at'
  ) THEN
    CREATE TRIGGER content_calendar_updated_at
      BEFORE UPDATE ON content_calendar
      FOR EACH ROW
      EXECUTE FUNCTION update_content_calendar_updated_at();
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118004215_add_ai_content_fields.sql
-- ============================================================================

/*
  # Ajout des champs pour la génération IA de contenu

  1. Nouveaux champs
    - `publication_time` : heure de publication (format HH:MM)
    - `caption` : texte final prêt à poster (caption Instagram, texte LinkedIn, etc.)
    - `hashtags` : hashtags générés ou modifiés par l'utilisateur
    - `content_structure` : structure détaillée du contenu (slides pour carrousel, sections pour reel, etc.)

  2. Modifications
    - `description` renommé conceptuellement pour devenir le texte de travail/structure interne
    - `notes` reste pour les notes internes (angle, CTA, etc.)

  3. Notes importantes
    - Tous les champs sont optionnels sauf ceux déjà requis
    - `publication_time` par défaut à '12:00' pour faciliter la planification
    - Les champs existants ne sont pas modifiés pour préserver les données
*/

-- Ajout du champ heure de publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'publication_time'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN publication_time text DEFAULT '12:00';
  END IF;
END $$;

-- Ajout du champ caption (texte final prêt à poster)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'caption'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN caption text;
  END IF;
END $$;

-- Ajout du champ hashtags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN hashtags text;
  END IF;
END $$;

-- Ajout du champ structure de contenu (pour carrousels, reels, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'content_structure'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN content_structure text;
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118005324_create_content_media_storage.sql
-- ============================================================================

/*
  # Création du système de stockage de médias pour le contenu

  1. Storage Bucket
    - `content-media` : stockage des images et vidéos
    - Accès public pour les fichiers
    - Taille max 50MB par fichier

  2. Nouveaux champs
    - `media_urls` : tableau JSON contenant les URLs des médias (images ou vidéo)
    - `media_type` : type de média (image, video, carousel)

  3. Sécurité
    - RLS sur le bucket pour que les utilisateurs ne puissent uploader/supprimer que leurs propres fichiers
    - Lecture publique pour permettre l'affichage

  4. Notes importantes
    - Les médias sont stockés dans le bucket Supabase
    - Les URLs sont sauvegardées dans la table content_calendar
*/

-- Créer le bucket pour les médias de contenu
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-media',
  'content-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés d'uploader leurs fichiers
CREATE POLICY "Users can upload their own content media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own content media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre à tout le monde de voir les médias (lecture publique)
CREATE POLICY "Anyone can view content media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

-- Ajouter le champ media_urls pour stocker les URLs des médias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter le champ media_type pour identifier le type de contenu média
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN media_type text;
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118011721_add_instagram_profile_to_company.sql
-- ============================================================================

/*
  # Ajout du profil Instagram aux company_profiles

  1. Modifications
    - Ajout de champs au profil de l'entreprise :
      - `instagram_profile_photo` (text) : URL de la photo de profil Instagram
      - `instagram_username` (text) : Nom d'utilisateur Instagram
      - `instagram_bio` (text) : Biographie Instagram
      - `instagram_website` (text) : Site web affiché sur le profil

  2. Notes
    - Ces champs permettront d'afficher un header de profil réaliste dans le feed Instagram
    - Les uploads de photos utiliseront le storage Supabase existant
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_profile_photo'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_profile_photo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_username'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_bio'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_website'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_website text;
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118013314_add_instagram_stats_to_company_profiles.sql
-- ============================================================================

/*
  # Add Instagram Statistics to Company Profiles

  1. Changes
    - Add `instagram_followers_count` column to track follower count (manually entered)
    - Add `instagram_following_count` column to track following count (manually entered)
  
  2. Notes
    - Both fields are optional and default to 0
    - These are manually maintained statistics for Instagram profile display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_followers_count'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_followers_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'instagram_following_count'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN instagram_following_count integer DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260118021706_add_editorial_pillars_and_enriched_content.sql
-- ============================================================================

/*
  # Piliers éditoriaux et contenus enrichis

  1. Nouvelle Table
    - `editorial_pillars`
      - Piliers éditoriaux personnalisés par métier/utilisateur
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `profession_type` (text) - nail_artist, esthetician, hairdresser, makeup_artist, etc.
      - `pillar_name` (text) - Nom du pilier (ex: "Techniques & tenue", "Erreurs clientes")
      - `color` (text) - Couleur hex pour l'affichage
      - `is_active` (boolean) - Pilier actif ou non
      - `created_at` (timestamptz)

  2. Modifications de content_calendar
    - Ajout de `editorial_pillar` (text) - Pilier éditorial sélectionné
    - Ajout de `angle` (text) - Angle précis du contenu
    - Ajout de `enriched_title` (text) - Titre enrichi pour vue mois
    - Ajout de `objective` (text) - attirer, éduquer, convertir, fidéliser

  3. Sécurité
    - Enable RLS sur editorial_pillars
    - Policies restrictives par utilisateur

  4. Notes importantes
    - Les piliers sont personnalisables par profession
    - Chaque utilisateur peut ajouter ses propres piliers
    - Les piliers par défaut sont créés automatiquement selon la profession
*/

-- Create editorial_pillars table
CREATE TABLE IF NOT EXISTS editorial_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profession_type text NOT NULL,
  pillar_name text NOT NULL,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE editorial_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own editorial pillars"
  ON editorial_pillars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own editorial pillars"
  ON editorial_pillars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own editorial pillars"
  ON editorial_pillars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own editorial pillars"
  ON editorial_pillars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add new columns to content_calendar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'editorial_pillar'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN editorial_pillar text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'angle'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN angle text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'enriched_title'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN enriched_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'objective'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN objective text DEFAULT 'attirer' CHECK (objective IN ('attirer', 'éduquer', 'convertir', 'fidéliser'));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_editorial_pillars_user ON editorial_pillars(user_id, profession_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_pillar ON content_calendar(user_id, editorial_pillar);

-- Function to create default pillars based on profession
CREATE OR REPLACE FUNCTION create_default_editorial_pillars(
  p_user_id uuid,
  p_profession_type text
)
RETURNS void AS $$
BEGIN
  -- Nail Artist pillars
  IF p_profession_type = 'nail_artist' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Techniques & tenue', '#EC4899'),
      (p_user_id, p_profession_type, 'Erreurs clientes', '#F59E0B'),
      (p_user_id, p_profession_type, 'Hygiène ongles', '#10B981'),
      (p_user_id, p_profession_type, 'Tendances ongles', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Relation cliente', '#3B82F6'),
      (p_user_id, p_profession_type, 'Prix & respect', '#EF4444')
    ON CONFLICT DO NOTHING;
  
  -- Esthéticienne / Skincare pillars
  ELSIF p_profession_type = 'esthetician' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Types de peau', '#EC4899'),
      (p_user_id, p_profession_type, 'Erreurs skincare', '#F59E0B'),
      (p_user_id, p_profession_type, 'Routine & constance', '#10B981'),
      (p_user_id, p_profession_type, 'Mythes beauté', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Résultats long terme', '#3B82F6')
    ON CONFLICT DO NOTHING;
  
  -- Coiffeuse pillars
  ELSIF p_profession_type = 'hairdresser' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Diagnostic cheveux', '#EC4899'),
      (p_user_id, p_profession_type, 'Avant / Après', '#F59E0B'),
      (p_user_id, p_profession_type, 'Entretien à domicile', '#10B981'),
      (p_user_id, p_profession_type, 'Tendances coupe/couleur', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Erreurs fréquentes', '#3B82F6')
    ON CONFLICT DO NOTHING;
  
  -- Maquilleuse pillars
  ELSIF p_profession_type = 'makeup_artist' THEN
    INSERT INTO editorial_pillars (user_id, profession_type, pillar_name, color) VALUES
      (p_user_id, p_profession_type, 'Techniques makeup', '#EC4899'),
      (p_user_id, p_profession_type, 'Tendances makeup', '#F59E0B'),
      (p_user_id, p_profession_type, 'Erreurs fréquentes', '#10B981'),
      (p_user_id, p_profession_type, 'Produits essentiels', '#8B5CF6'),
      (p_user_id, p_profession_type, 'Looks & occasions', '#3B82F6')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Migration: 20260118023453_add_production_statuses_to_content.sql
-- ============================================================================

/*
  # Ajout des statuts de production au contenu

  1. Modifications
    - Étendre les valeurs possibles du statut pour inclure les statuts de production
    - Nouveaux statuts : 'to_shoot' (à tourner), 'to_edit' (à monter)
    - Conservation des statuts existants : 'idea', 'to_produce', 'scheduled', 'published'
    
  2. Notes
    - Permet un suivi détaillé du cycle de production du contenu
    - Statuts ordonnés selon le workflow : idea → to_shoot → to_edit → to_produce → scheduled → published
*/

-- Mettre à jour le type enum pour inclure les nouveaux statuts
DO $$ 
BEGIN
  -- Vérifier si la contrainte existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_calendar_status_check'
  ) THEN
    -- Supprimer l'ancienne contrainte
    ALTER TABLE content_calendar 
    DROP CONSTRAINT content_calendar_status_check;
  END IF;
  
  -- Ajouter la nouvelle contrainte avec tous les statuts
  ALTER TABLE content_calendar
  ADD CONSTRAINT content_calendar_status_check 
  CHECK (status IN ('idea', 'to_shoot', 'to_edit', 'to_produce', 'scheduled', 'published'));
END $$;

-- ============================================================================
-- Migration: 20260118122733_add_time_fields_to_tasks.sql
-- ============================================================================

/*
  # Add time fields to tasks for timeline view

  1. Changes
    - Add `start_time` column (time without timezone) to tasks table
    - Add `end_time` column (time without timezone) to tasks table
    - These fields enable time-specific scheduling for the day timeline view

  2. Notes
    - Both fields are optional (NULL allowed)
    - Used for tasks with specific time slots
    - Tasks without times will appear in "Sans horaire" section
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_time time DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN end_time time DEFAULT NULL;
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118124130_update_tasks_date_fields.sql
-- ============================================================================

/*
  # Update tasks date fields for period support

  1. Changes
    - Rename `due_date` to `end_date` for clarity
    - Add `start_date` column for task commencement date
    - Update existing data to preserve dates (due_date becomes end_date)

  2. Notes
    - Tasks can now have a period (start_date to end_date)
    - Both fields are optional
    - start_time and end_time work with these dates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_date date DEFAULT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks RENAME COLUMN due_date TO end_date;
  END IF;
END $$;


-- ============================================================================
-- Migration: 20260118135315_add_projects_table.sql
-- ============================================================================

/*
  # Create Projects Table and Link with Tasks

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_id` (uuid, foreign key to company_profiles)
      - `name` (text, required) - Project name
      - `description` (text, optional) - Project description
      - `photo_url` (text, optional) - Project photo
      - `status` (text) - Project status: todo, in_progress, on_hold, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `project_id` column to `tasks` table (optional foreign key)

  3. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to manage their own projects

  4. Indexes
    - Add index on user_id and company_id for fast project lookups
    - Add index on project_id in tasks table
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('todo', 'in_progress', 'on_hold', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add project_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update project updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_updated_at();

-- ============================================================================
-- Migration: 20260118142442_fix_task_priority_constraint.sql
-- ============================================================================

/*
  # Fix Task Priority Constraint

  1. Problem
    - Current CHECK constraint only accepts: 'high', 'medium', 'low'
    - Frontend sends 'very_high' for urgent tasks, causing silent failures
    - Tasks with "🔥 Urgente" priority cannot be created

  2. Solution
    - Drop existing constraint
    - Add new constraint that accepts: 'very_high', 'high', 'medium', 'low'

  3. Changes
    - Modify tasks table priority constraint to support very_high priority level
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_priority_check'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_priority_check;
  END IF;
END $$;

-- Add new constraint with very_high support
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('very_high', 'high', 'medium', 'low'));

-- ============================================================================
-- Migration: 20260118143857_create_project_images_bucket.sql
-- ============================================================================

/*
  # Create Storage Bucket for Project Images

  1. New Bucket
    - `project-images` bucket for storing project photos
    - Public access for reading
    - Authenticated users can upload

  2. Security
    - RLS policies for upload, update, delete
    - Public read access
    - Users can only manage their own project images
*/

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload project images'
  ) THEN
    CREATE POLICY "Authenticated users can upload project images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to update their own project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own project images'
  ) THEN
    CREATE POLICY "Users can update own project images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow users to delete their own project images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own project images'
  ) THEN
    CREATE POLICY "Users can delete own project images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'project-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view project images'
  ) THEN
    CREATE POLICY "Public can view project images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'project-images');
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260118145123_update_goals_for_tabs_and_checkboxes.sql
-- ============================================================================

/*
  # Update Goals for Tabs and Sub-goal Checkboxes

  1. Changes to goals table
    - Update status constraint to support 4 tabs: not_started, in_progress, on_hold, achieved
    - Add 'checked' field for sub-goals (checkbox state)
    - Ensure proper structure for simplified sub-goals (title + target_date)

  2. Security
    - Maintains existing RLS policies
*/

-- Update status constraint to include 'on_hold'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'goals' AND constraint_name LIKE '%status%check'
  ) THEN
    ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
  END IF;

  -- Add new constraint with 4 statuses
  ALTER TABLE goals ADD CONSTRAINT goals_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'achieved', 'missed'));
END $$;

-- Add checked field for sub-goals (to track checkbox state)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'checked'
  ) THEN
    ALTER TABLE goals ADD COLUMN checked boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better performance on checked field
CREATE INDEX IF NOT EXISTS idx_goals_checked ON goals(checked);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id) WHERE parent_goal_id IS NOT NULL;

-- ============================================================================
-- Migration: 20260118152239_fix_goals_type_constraint.sql
-- ============================================================================

/*
  # Fix Goals Type Constraint

  1. Changes
    - Drop existing restrictive `goals_type_check` constraint
    - Add new constraint allowing all goal types used in the frontend:
      - `content` (Contenu)
      - `business` (Business)
      - `loyalty` (Fidélisation)
      - `financial` (Financier)
      - `clients` (Clientèle)
      - `personal` (Personnel)
  
  2. Security
    - Maintains data integrity with expanded type options
    - Allows frontend to create all planned goal categories
*/

-- Drop the old restrictive constraint
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_type_check;

-- Add new constraint with all supported types
ALTER TABLE goals ADD CONSTRAINT goals_type_check 
  CHECK (type = ANY (ARRAY['content', 'business', 'loyalty', 'financial', 'clients', 'personal']));


-- ============================================================================
-- Migration: 20260118154934_add_status_source_to_projects.sql
-- ============================================================================

/*
  # Add status_source field to projects table
  
  ## Purpose
  Track whether project status was set manually or automatically by task completion.
  
  ## Changes
  1. Add `status_source` column to projects table
    - `manual`: User explicitly set the status
    - `auto`: Status was set automatically based on task completion
  
  2. Default to 'manual' for existing projects to preserve user control
  
  ## Security
  No security changes - existing RLS policies still apply
*/

-- Add status_source column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'status_source'
  ) THEN
    ALTER TABLE projects ADD COLUMN status_source text NOT NULL DEFAULT 'manual' CHECK (status_source IN ('manual', 'auto'));
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status_source ON projects(status_source);

-- ============================================================================
-- Migration: 20260118184047_add_link_field_to_content_calendar.sql
-- ============================================================================

/*
  # Add link field to content_calendar table

  1. Changes
    - Add `link` column to `content_calendar` table to store external links (Canva, Drive, etc.)
    
  2. Details
    - Type: text (nullable)
    - Used for storing reference links to design tools, documents, briefs, etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'link'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN link text;
  END IF;
END $$;

-- ============================================================================
-- Migration: 20260118205113_fix_user_profile_auto_creation.sql
-- ============================================================================

/*
  # Fix User Profile Auto-Creation
  
  ## Problem
  Users receive "Database error saving new user" when signing up because
  the RLS policy prevents profile creation during the signup process.
  
  ## Solution
  Create a trigger that automatically creates user_profiles when a new
  auth user is created, similar to the existing profiles trigger.
  
  ## Changes
  1. Create function to automatically create user_profiles entry
  2. Add trigger on auth.users INSERT
  3. Set default role to 'pro' for new signups
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Maintains existing RLS policies for normal operations
  - Only creates profile on new user creation
*/

-- Create or replace function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_profiles entry for new auth user
  INSERT INTO user_profiles (user_id, role, first_name, last_name)
  VALUES (
    NEW.id,
    'pro',
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create trigger for automatic user_profiles creation on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();


-- ============================================================================
-- Migration: 20260118205432_improve_user_profile_auto_creation_with_role.sql
-- ============================================================================

/*
  # Improve User Profile Auto-Creation with Role
  
  ## Problem
  The current trigger creates profiles with a hardcoded 'pro' role,
  then relies on a separate UPDATE to set the correct role, which
  can fail due to timing or RLS issues.
  
  ## Solution
  Update the trigger to read the role from user metadata, so the
  correct role is set immediately when the profile is created.
  
  ## Changes
  1. Update trigger function to read role from raw_user_meta_data
  2. Default to 'pro' if no role is specified
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Maintains existing RLS policies
*/

-- Update function to handle new user profile creation with role from metadata
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pro'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Migration: 20260118210247_create_company_profile_auto_trigger.sql
-- ============================================================================

/*
  # Auto-create Company Profile on User Signup
  
  ## Problem
  - Users receive 500 error during signup because company_profiles is not auto-created
  - company_profiles has NOT NULL columns without defaults that block manual creation
  - GET request to company_profiles returns 400 because the row doesn't exist
  
  ## Solution
  Create a trigger that automatically creates a company_profiles entry when a new
  professional user is created, with sensible default values.
  
  ## Changes
  1. Create function to auto-create company_profiles for professional users
  2. Add trigger on auth.users INSERT
  3. Use SECURITY DEFINER to bypass RLS restrictions
  4. Handle all errors gracefully to never block user signup
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS during auto-creation
  - Only creates company_profile for users with role='pro' in metadata
  - Uses exception handling to prevent signup failures
*/

-- Create function to handle company profile auto-creation
CREATE OR REPLACE FUNCTION handle_new_company_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from user metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  
  -- Only create company_profile for professional users
  IF v_role = 'pro' THEN
    BEGIN
      -- Create company profile with default values
      INSERT INTO company_profiles (
        user_id,
        company_name,
        activity_type,
        creation_date,
        country,
        legal_status,
        vat_mode,
        acre,
        versement_liberatoire
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Mon Entreprise'),
        'onglerie',
        CURRENT_DATE,
        'France',
        'micro_entreprise',
        'franchise_base_tva',
        false,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE WARNING 'Failed to create company_profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_company_profile ON auth.users;

-- Create trigger for automatic company_profiles creation
CREATE TRIGGER on_auth_user_created_company_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_company_profile();


-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Migration completed successfully
