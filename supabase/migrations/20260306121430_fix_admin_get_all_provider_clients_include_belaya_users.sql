/*
  # Fix admin_get_all_provider_clients to include Belaya-registered clients

  1. Problem
    - The RPC only returns clients from the `clients` table (contacts added by providers)
    - Belaya-registered users (user_profiles with role='client') who signed up independently
      are never included unless they happen to be linked via `belaya_user_id`
    - Result: 3 out of 4 registered client users missing from admin view

  2. Fix
    - Use a UNION to combine:
      a) Provider contacts from `clients` table (non-converted = no belaya_user_id,
         converted = has belaya_user_id)
      b) Belaya-registered users from `user_profiles` where role='client' who are NOT
         already linked in the `clients` table via belaya_user_id
    - This ensures all converted clients appear AND all provider contacts appear

  3. Result
    - "Converted" = users registered on Belaya (role='client' in user_profiles)
    - "Non converted" = provider contacts who haven't registered on Belaya
    - Admin sees the full picture of both categories
*/

CREATE OR REPLACE FUNCTION public.admin_get_all_provider_clients()
RETURNS TABLE(
  client_id uuid,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  client_created_at timestamp with time zone,
  provider_company_name text,
  provider_email text,
  is_converted boolean,
  belaya_user_id uuid,
  belaya_registered_at timestamp with time zone,
  is_archived boolean,
  is_vip boolean,
  is_fidele boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY

  -- Part 1: Provider contacts from clients table
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

  UNION ALL

  -- Part 2: Belaya-registered clients (user_profiles role='client')
  -- who are NOT already in the clients table via belaya_user_id
  SELECT
    up.user_id AS client_id,
    up.first_name AS client_first_name,
    up.last_name AS client_last_name,
    au.email AS client_email,
    NULL::text AS client_phone,
    au.created_at AS client_created_at,
    NULL::text AS provider_company_name,
    NULL::text AS provider_email,
    true AS is_converted,
    up.user_id AS belaya_user_id,
    au.created_at AS belaya_registered_at,
    false AS is_archived,
    false AS is_vip,
    false AS is_fidele
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  WHERE up.role = 'client'
    AND NOT EXISTS (
      SELECT 1 FROM clients c2
      WHERE c2.belaya_user_id = up.user_id
        AND COALESCE(c2.is_archived, false) = false
    )

  ORDER BY client_created_at DESC;
END;
$function$;
