/*
  # Admin RPC to get all provider-added clients with conversion status

  1. New Function
    - `admin_get_all_provider_clients()` returns all clients from the clients table
    - Includes provider info (company name, provider email)
    - Includes conversion status (whether belaya_user_id is set)
    - Includes the Belaya user's registration date if converted

  2. Security
    - Only callable by admins (uses is_admin() check)
*/

CREATE OR REPLACE FUNCTION admin_get_all_provider_clients()
RETURNS TABLE (
  client_id uuid,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  client_created_at timestamptz,
  provider_company_name text,
  provider_email text,
  is_converted boolean,
  belaya_user_id uuid,
  belaya_registered_at timestamptz,
  is_archived boolean,
  is_vip boolean,
  is_fidele boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS client_id,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.email AS client_email,
    c.phone AS client_phone,
    c.created_at AS client_created_at,
    cp.company_name AS provider_company_name,
    au_provider.email AS provider_email,
    (c.belaya_user_id IS NOT NULL) AS is_converted,
    c.belaya_user_id,
    au_client.created_at AS belaya_registered_at,
    COALESCE(c.is_archived, false) AS is_archived,
    COALESCE(c.is_vip, false) AS is_vip,
    COALESCE(c.is_fidele, false) AS is_fidele
  FROM clients c
  LEFT JOIN company_profiles cp ON cp.id = c.company_id
  LEFT JOIN auth.users au_provider ON au_provider.id = c.user_id
  LEFT JOIN auth.users au_client ON au_client.id = c.belaya_user_id
  WHERE COALESCE(c.is_archived, false) = false
  ORDER BY c.created_at DESC;
END;
$$;
