/*
  # Create Admin Roles System

  1. New Tables
    - `user_roles`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `role` (text) - 'admin' or 'user'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_roles` table
    - Only admins can read user_roles table
    - Create helper function to check if user is admin
    - Protect admin-only queries

  3. Initial Setup
    - Create function to check admin status
    - Set up policies for admin access only
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = $1
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Only admins can read user_roles
CREATE POLICY "Admins can read all user_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Policy: Only admins can insert user_roles
CREATE POLICY "Admins can insert user_roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can update user_roles
CREATE POLICY "Admins can update user_roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can delete user_roles
CREATE POLICY "Admins can delete user_roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create admin stats views (only accessible by admins)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT CASE WHEN up.created_at >= NOW() - INTERVAL '30 days' THEN up.id END) as new_users_30d,
  COUNT(DISTINCT up.id) as active_users_30d
FROM user_profiles up
WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin');

-- Create partnership stats view
CREATE OR REPLACE VIEW admin_partnership_stats AS
SELECT
  COALESCE(SUM(ps.commission_earned), 0) as monthly_revenue,
  COALESCE(AVG(p.commission_rate), 0) as avg_commission,
  (
    SELECT p2.company_name
    FROM partnerships p2
    LEFT JOIN partnership_sales ps2 ON ps2.partnership_id = p2.id
    WHERE ps2.sale_date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY p2.id, p2.company_name
    ORDER BY SUM(ps2.commission_earned) DESC
    LIMIT 1
  ) as top_partnership,
  COALESCE(SUM(CASE WHEN ps.payment_status = 'pending' THEN ps.commission_earned ELSE 0 END), 0) as pending_revenue
FROM partnerships p
LEFT JOIN partnership_sales ps ON ps.partnership_id = p.id
WHERE ps.sale_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin');

-- Grant access to views
GRANT SELECT ON admin_user_stats TO authenticated;
GRANT SELECT ON admin_partnership_stats TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Insert default role for all existing users (as 'user')
INSERT INTO user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

/*
  To make yourself admin, run this SQL query with your user_id:
  
  INSERT INTO user_roles (user_id, role)
  VALUES ('YOUR_USER_ID_HERE', 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';
  
  To find your user_id, you can run:
  SELECT id, email FROM auth.users WHERE email = 'your.email@example.com';
*/
