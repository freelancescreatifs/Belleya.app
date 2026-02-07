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
