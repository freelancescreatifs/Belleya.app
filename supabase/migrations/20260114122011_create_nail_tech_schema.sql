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