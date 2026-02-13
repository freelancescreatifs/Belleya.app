/*
  # Update Belleya Partnership Commission Rate

  1. Changes
    - Update all Belleya partnerships (is_default = true) to have commission_rate = 10
    - Update conditions text to reflect correct percentages (10% default, 15% with client support)

  2. Notes
    - Only affects default Belleya partnerships
    - Does not affect custom partnerships created by users
    - Commission logic is: 10% default, 15% if client support involved, 40% for Noemieae@gmail.com
*/

-- Update commission rate to 10% for all Belleya partnerships
UPDATE partnerships
SET
  commission_rate = 10,
  conditions = 'Programme officiel Belleya - Commission mensuelle sur chaque vente HT. 10% par défaut, 15% si impliqué dans le service client.'
WHERE is_default = true
  AND company_name = 'Belleya';
