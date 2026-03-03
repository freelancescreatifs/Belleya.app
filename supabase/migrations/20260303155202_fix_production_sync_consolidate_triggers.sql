/*
  # Consolidate production task sync triggers

  1. Changes
    - Drop the broken `trigger_sync_checkboxes_to_tasks` trigger which uses French step names
      ('tournage', 'montage', 'planification') that don't match the English values stored
      in `tasks.production_step` ('shooting', 'editing', 'scheduling')
    - Drop the orphaned `sync_checkboxes_to_production_tasks` function
    - The working trigger `sync_checkboxes_to_tasks` (using `sync_checkbox_to_task` function
      with correct English names) remains active and handles all sync

  2. Security
    - No RLS changes
    - No new tables

  3. Important notes
    - This fixes a silent sync failure where checking Tournage/Montage/Planifie checkboxes
      would attempt to update tasks WHERE production_step = 'tournage' (French), but tasks
      actually store 'shooting' (English), resulting in zero rows updated
    - The remaining `sync_checkboxes_to_tasks` trigger fires on `step_*_completed` columns
      which are set by `handle_checkbox_cascade` from the `*_checked` columns
*/

DROP TRIGGER IF EXISTS trigger_sync_checkboxes_to_tasks ON content_calendar;

DROP FUNCTION IF EXISTS sync_checkboxes_to_production_tasks();
