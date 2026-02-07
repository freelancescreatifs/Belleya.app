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
